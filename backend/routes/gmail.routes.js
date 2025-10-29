const express = require('express');
const router = express.Router();
const GmailService = require('../services/gmail.service');
const ClassifierService = require('../services/classifier.service');
const AILabelAnalyzerService = require('../services/ai-label-analyzer.service');
const CustomLabelClassifier = require('../services/custom-label-classifier.service');
const { JOB_LABELS } = require('../config/labels');
const AutoScanService = require('../services/autoscan.service');

/**
 * POST /api/gmail/setup
 * Creates all colored labels in Gmail
 */
router.post('/setup', async (req, res) => {
  try {
    const gmailService = new GmailService(req.user.auth);
    const results = await gmailService.setupAllLabels();
    
    res.json({
      success: true,
      message: 'Labels created in your Gmail',
      results
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/gmail/create-label
 * Creates a single custom label
 */
router.post('/create-label', async (req, res) => {
  try {
    const { name, description, color, icon, keywords, senders } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Label name is required'
      });
    }
    
    const gmailService = new GmailService(req.user.auth);
    const label = await gmailService.createCustomLabel({
      name,
      description,
      color,
      icon
    });
    
    // Save custom label rules to config
    const fs = require('fs').promises;
    const path = require('path');
    const configFile = path.join(__dirname, '../data/label-config.json');
    
    try {
      let config = { labels: {} };
      try {
        const data = await fs.readFile(configFile, 'utf8');
        config = JSON.parse(data);
      } catch (e) {
        // File doesn't exist, start with empty config
      }
      
      const labelId = label.id || label.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      config.labels[labelId] = {
        enabled: true,
        name: name,
        description: description || `Custom label: ${name}`,
        keywords: keywords || [],
        senders: senders || [],
        type: 'custom',
        color: color || { backgroundColor: '#4a86e8', textColor: '#ffffff' },
        icon: icon || '📋'
      };
      
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      console.log(`[gmail] Saved custom label rules for "${name}":`, config.labels[labelId]);
    } catch (configError) {
      console.warn('Failed to save custom label rules:', configError.message);
    }
    
    res.json({
      success: true,
      message: `Label "${name}" created successfully`,
      label
    });
  } catch (error) {
    console.error('Create label error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/gmail/analyze-email
 * Analyze email content and suggest label configuration
 */
router.post('/analyze-email', async (req, res) => {
  try {
    const { emailContent } = req.body;
    
    if (!emailContent || !emailContent.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Email content is required'
      });
    }

    const aiAnalyzer = new AILabelAnalyzerService(process.env.OPENAI_API_KEY);
    
    // Check if it's job-related (for informational purposes)
    const jobCheck = await aiAnalyzer.isJobRelated(emailContent);
    const isJobRelated = jobCheck.success ? jobCheck.isJobRelated : false;
    
    // Extract sender information
    const senderInfo = await aiAnalyzer.extractSenderInfo(emailContent);
    
    // Always analyze for label suggestions regardless of job-related status
    const analysis = await aiAnalyzer.analyzeEmailForLabel(emailContent);
    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze email: ' + analysis.error
      });
    }

    // Enhance analysis with sender information
    const enhancedAnalysis = {
      ...analysis.analysis,
      senderInfo: senderInfo.success ? senderInfo.senderInfo : null
    };

    res.json({
      success: true,
      isJobRelated,
      analysis: enhancedAnalysis,
      message: isJobRelated ? 'Email analyzed successfully' : 'This email does not appear to be job-related, but label suggestions are provided'
    });
  } catch (error) {
    console.error('Email analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/gmail/scan
 * Scans and labels new emails
 */
router.post('/scan', async (req, res) => {
  try {
    const { maxResults = 50, query = 'is:unread' } = req.body;

    const gmailService = new GmailService(req.user.auth);
    const classifier = new ClassifierService(process.env.ANTHROPIC_API_KEY);
    const customClassifier = new CustomLabelClassifier();

    console.log('📧 [scan] scanning for new emails...', {
      query,
      maxResults,
      sessionId: req.headers['x-session-id']
    });

    // Get new emails using custom query (default unread)
    const messages = await gmailService.scanNewEmails(query, maxResults);
    console.log(`📨 [scan] found ${messages.length} emails for query ${query}`);

    const results = [];
    
    for (const message of messages) {
      try {
        const email = await gmailService.getEmail(message.id);
        
        if (!email.body || email.body.length === 0) {
          results.push({ id: email.id, subject: email.subject, skipped: 'empty-body' });
          console.log(`↪️  [scan] skipped ${email.id} (empty-body)`);
          continue;
        }

        // First try custom label classification (for any email type)
        const customResult = await customClassifier.classify(email);
        if (customResult && customResult.success) {
          try {
            await gmailService.applyLabelToThread(
              email.threadId,
              customResult.label,
              false
            );
          } catch (e) {
            console.error(`[scan] apply custom label failed for ${email.id}:`, e.message);
          }
          
          results.push({ 
            id: email.id, 
            subject: email.subject, 
            label: customResult.label,
            confidence: customResult.confidence,
            method: customResult.method,
            reason: customResult.reason
          });
          console.log(`✅ [scan] custom labeled ${email.id} -> ${customResult.label} (${customResult.reason})`);
          continue;
        }

        // Then try job-related classification
        if (!classifier.isJobRelated(email)) {
          // Give more context: finance/receipt ignored
          const reason = classifier.isFinanceReceipt && classifier.isFinanceReceipt(email)
            ? 'ignored-finance-receipt'
            : 'not-job-related';
          results.push({ id: email.id, subject: email.subject, skipped: reason });
          console.log(`↪️  [scan] skipped ${email.id} (${reason})`);
          continue;
        }

        const classification = await classifier.classify(email);
        if (!classification) {
          results.push({ id: email.id, subject: email.subject, skipped: 'no-match' });
          console.log(`↪️  [scan] skipped ${email.id} (no-match)`);
          continue;
        }

        // Apply label to the whole thread instead of just this message
        try {
          await gmailService.applyLabelToThread(
            email.threadId,
            classification.label,
            classification.config.moveToFolder
          );
        } catch (e) {
          console.error(`[scan] apply label failed for ${email.id}:`, e.message);
        }

        // Debug: fetch labels applied to this thread for visibility verification
        let threadLabels = [];
        try {
          threadLabels = await gmailService.getThreadLabelNames(email.threadId);
        } catch (e) {
          console.warn(`[scan] fetch thread labels failed for ${email.id}:`, e.message);
        }

        // No conflict removal needed since Finance/Receipt is disabled
        const removedLabels = [];

        results.push({
          id: email.id,
          threadId: email.threadId,
          subject: email.subject,
          from: email.from,
          label: classification.label,
          confidence: classification.confidence,
          method: classification.method,
          movedToFolder: classification.config.moveToFolder,
          threadLabels,
          removedLabels
        });

        // Rate limiting
        console.log(`✅ [scan] labeled ${email.id} as ${classification.label} via ${classification.method}`);
        await gmailService.sleep(100);
      } catch (err) {
        console.error(`❌ [scan] failed processing message ${message.id}:`, err.message);
        results.push({ id: message.id, skipped: 'error', error: err.message });
      }
    }

    const stats = {
      total: messages.length,
      processed: results.filter(r => !r.skipped).length,
      skipped: results.filter(r => r.skipped).length
    };

    console.log('\n📊 [scan] complete:', stats);

    res.json({
      success: true,
      stats,
      results
    });
  } catch (error) {
    console.error('❌ [scan] error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Diagnostics: verify Gmail API permission by listing labels
router.get('/diagnostics', async (req, res) => {
  try {
    const gmailService = new GmailService(req.user.auth);
    const gmail = gmailService.gmail;
    const labels = await gmail.users.labels.list({ userId: 'me' });
    res.json({ success: true, labelsCount: (labels.data.labels || []).length });
  } catch (error) {
    console.error('[diagnostics][gmail] error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

/**
 * POST /api/gmail/reinbox
 * Adds INBOX to threads that have our labels but are not currently in Inbox
 * Body: { labels?: string[], maxResults?: number }
 */
router.post('/reinbox', async (req, res) => {
  try {
    const { labels = null, maxResults = 200 } = req.body || {};
    const gmailService = new GmailService(req.user.auth);

    // Build target label names
    const targetNames = labels && labels.length ? labels : require('../config/labels').JOB_LABELS.map(l => l.name);

    // Map names -> ids
    const allLabelsResp = await gmailService.gmail.users.labels.list({ userId: 'me' });
    const byName = new Map((allLabelsResp.data.labels || []).map(l => [l.name, l]));

    let touched = 0;
    const details = [];

    for (const name of targetNames) {
      const lab = byName.get(name);
      if (!lab) continue;

      const msgs = await gmailService.listMessagesByLabelId(lab.id, maxResults);
      for (const m of msgs) {
        const email = await gmailService.getEmail(m.id);
        if (!email.labelIds.includes('INBOX')) {
          await gmailService.addInboxToThread(email.threadId);
          touched++;
          details.push({ threadId: email.threadId, added: 'INBOX', label: name });
          await gmailService.sleep(50);
        }
      }
    }

    res.json({ success: true, updated: touched, details });
  } catch (error) {
    console.error('reinbox error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------- Auto Scan Controls ----------------
const autoScan = new AutoScanService({ intervalMs: 5 * 60 * 1000, resolveSession: (sid) => reqSessionResolver(sid) });

// We need a resolver that sees the same resolveSession as server.js; inject via global
function reqSessionResolver(sessionId) {
  if (typeof global.__resolveSession === 'function') {
    return global.__resolveSession(sessionId);
  }
  return null;
}

router.post('/auto-scan/start', async (req, res) => {
  const { query = 'in:anywhere newer_than:2d', maxResults = 20 } = req.body || {};
  const sessionId = req.headers['x-session-id'];
  const out = autoScan.start(sessionId, query, maxResults);
  res.json({ success: true, ...out });
});

router.post('/auto-scan/stop', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const out = autoScan.stop(sessionId);
  res.json({ success: true, ...out });
});

router.get('/auto-scan/status', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const out = autoScan.status(sessionId);
  res.json({ success: true, ...out });
});

// 立即执行扫描
router.post('/auto-scan/run-now', async (req, res) => {
  try {
    const { query = 'in:anywhere newer_than:2d', maxResults = 20 } = req.body || {};
    const sessionId = req.headers['x-session-id'];
    const result = await autoScan.runNow(sessionId, query, maxResults);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('run-now error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取扫描历史
router.get('/auto-scan/history', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const history = autoScan.getHistory(sessionId);
    res.json({ success: true, history });
  } catch (error) {
    console.error('history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有会话状态
router.get('/auto-scan/sessions', async (req, res) => {
  try {
    const sessions = autoScan.getAllSessions();
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('sessions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gmail/consolidate-interview
 * Moves messages from old Interview sublabels to unified 'Interview' and deletes old labels
 * Body: { maxResults?: number }
 */
router.post('/consolidate-interview', async (req, res) => {
  try {
    const { maxResults = 500 } = req.body || {};
    const gmailService = new GmailService(req.user.auth);

    // Ensure target exists
    const target = await gmailService.findLabel('Interview');
    if (!target) {
      return res.status(400).json({ success: false, error: "Target label 'Interview' not found. Run /setup first." });
    }

    const OLD = ['Interview/Invitation', 'Interview/Scheduled', 'Interview/Interviewed', 'Response-Needed', 'Interview-Scheduled'];
    const results = [];
    for (const name of OLD) {
      const label = await gmailService.findLabel(name);
      if (!label) {
        results.push({ name, skipped: 'not-found' });
        continue;
      }
      const r = await gmailService.migrateLabelTo(name, 'Interview', maxResults);
      results.push({ name, ...r });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('consolidate-interview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gmail/consolidate-application
 * Merge legacy sublabels (Applied/Application-Viewed/Job-Alert) into single 'Application' label and delete old labels
 */
router.post('/consolidate-application', async (req, res) => {
  try {
    const { maxResults = 1000 } = req.body || {};
    const gmailService = new GmailService(req.user.auth);

    // Ensure target exists
    const target = await gmailService.findLabel('Application');
    if (!target) {
      return res.status(400).json({ success: false, error: "Target label 'Application' not found. Run /setup first." });
    }

    const OLD = [
      'Application/Applied', 'Application/Application-Viewed', 'Application/Job-Alert', 
      'Applied', 'Application-Viewed', 'Job-Alert', 'Status-Update',
      'JobTrack/Applied', 'JobTrack/Application-Viewed', 'JobTrack/Job-Alert'
    ];
    const results = [];
    for (const name of OLD) {
      const label = await gmailService.findLabel(name);
      if (!label) {
        results.push({ name, skipped: 'not-found' });
        continue;
      }
      const r = await gmailService.migrateLabelTo(name, 'Application', maxResults);
      results.push({ name, ...r });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('consolidate-application error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/gmail/label-counts
 * Returns total and unread counts for configured labels
 */
router.get('/label-counts', async (req, res) => {
  try {
    const gmailService = new GmailService(req.user.auth);
    const gmail = gmailService.gmail;

    const resp = await gmail.users.labels.list({ userId: 'me' });
    const labelMap = new Map((resp.data.labels || []).map(l => [l.name, l]));

    const counts = JOB_LABELS.map(cfg => {
      const label = labelMap.get(cfg.name) || null;
      return {
        name: cfg.name,
        messagesTotal: label?.messagesTotal ?? 0,
        messagesUnread: label?.messagesUnread ?? 0
      };
    });

    res.json({ success: true, counts });
  } catch (error) {
    console.error('label-counts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});