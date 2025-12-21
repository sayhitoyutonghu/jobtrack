const express = require('express');
const router = express.Router();
const GmailService = require('../services/gmail.service');
const ClassifierService = require('../services/classifier.service');
const AILabelAnalyzerService = require('../services/ai-label-analyzer.service');
const CustomLabelClassifier = require('../services/custom-label-classifier.service');
const { JOB_LABELS } = require('../config/labels');
const AutoScanService = require('../services/autoscan.service');
const Job = require('../models/Job');

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

    if (process.env.ENABLE_AI === 'false' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-key-here') {
      return res.status(503).json({
        success: false,
        error: 'AI analysis is disabled or not configured. Set ENABLE_AI!=false and OPENAI_API_KEY to enable.',
      });
    }

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
/**
 * GET /api/gmail/deep-stream-scan
 * Scans up to 1 year of emails with pagination, skips cache, and streams results.
 */
router.get('/deep-stream-scan', async (req, res) => {
  // SSE Setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });

  try {
    const maxResults = parseInt(req.query.maxResults) || 2000; // Limit total for deep scan
    const query = req.query.query || 'newer_than:1y'; // Default to 1 year

    // Auth Check
    if (!req.user || !req.user.auth) {
      sendEvent('error', { message: 'Authentication required' });
      return res.end();
    }

    const gmailService = new GmailService(req.user.auth);
    const customClassifier = new CustomLabelClassifier();
    const PersistentCache = require('../services/persistent-cache.service');
    const path = require('path');
    const seenCache = new PersistentCache({
      filePath: path.join(__dirname, '../data/cache-seen.json'),
      defaultTtlMs: 365 * 24 * 60 * 60 * 1000 // 1 year TTL for deep scan cache
    });
    const ClassifierService = require('../services/classifier.service');
    const Job = require('../models/Job');

    sendEvent('log', { message: `🚀 Starting Deep Scan (1 Year)... Query: "${query}"` });

    let stats = { totalFetched: 0, processed: 0, skipped: 0, errors: 0 };
    let totalProcessed = 0;

    // Use generator to fetch pages
    for await (const batch of gmailService.scanMessagesGenerator(query, maxResults)) {
      stats.totalFetched += batch.length;
      sendEvent('log', { message: `📦 Fetched batch of ${batch.length} emails (Total: ${stats.totalFetched})...` });

      for (const message of batch) {
        // Stop if client disconnected
        if (res.writableEnded) break;

        const progress = Math.min(Math.round((stats.totalFetched / maxResults) * 100), 99);

        try {
          // 1. Check Cache (Critical for Deep Scan)
          const seen = await seenCache.get(message.id);
          if (seen) {
            stats.skipped++;
            // Don't log every skip in deep scan to avoid spam, just update stats occasionally or use a special type
            if (stats.skipped % 50 === 0) {
              sendEvent('log', { message: `⏭️ Skipped ${stats.skipped} cached emails so far...` });
            }
            continue;
          }

          // 2. Fetch Email
          const email = await gmailService.getEmail(message.id);
          if (!email.body || email.body.length === 0) {
            stats.skipped++;
            await seenCache.set(message.id, { skipped: 'empty', at: Date.now() });
            continue;
          }

          // --- NEW: DB Duplicate Check ---
          const existingJob = await Job.findOne({ emailId: message.id });
          if (existingJob) {
            stats.skipped++;
            // Update cache to reflect it's done
            await seenCache.set(message.id, { labeled: existingJob.status || 'Applied', method: 'db-existing', at: Date.now() });

            if (stats.skipped % 20 === 0) {
              sendEvent('log', { message: `⏭️ Skipped ${stats.skipped} (DB/Cache)...` });
            }
            continue;
          }
          // -------------------------------

          // 3. Custom Rules
          const customResult = await customClassifier.classify(email);
          if (customResult && customResult.success) {
            await gmailService.applyLabelToThread(email.threadId, customResult.label, false);
            stats.processed++;
            sendEvent('progress', {
              percent: progress,
              type: 'match',
              job: { id: email.id, company: 'Custom Rule', role: customResult.label, status: 'Applied' },
              log: `✅ [Custom] ${email.subject} -> ${customResult.label}`
            });
            await seenCache.set(message.id, { labeled: customResult.label, method: 'custom', at: Date.now() });
            continue;
          }

          // 4. Quick Filter
          const clfNoAI = new ClassifierService({ enableAI: false });
          if (!clfNoAI.isJobRelated(email)) {
            stats.skipped++;
            await seenCache.set(message.id, { skipped: 'filter', at: Date.now() });
            continue;
          }

          // 5. AI Classification
          sendEvent('log', { message: `🧠 Analyzing: "${email.subject}"...` });

          const classifier = new ClassifierService({
            enableAI: true,
            openaiApiKey: process.env.OPENAI_API_KEY,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY
          });

          const classification = await classifier.classify(email);
          if (!classification) {
            stats.skipped++;
            await seenCache.set(message.id, { skipped: 'no-match', at: Date.now() });
            continue;
          }

          // 6. Action
          if (!classification.isSkip) {
            await gmailService.applyLabelToThread(email.threadId, classification.label, classification.config?.moveToFolder);
          }

          // DB Save
          const STATUS_MAP = { 'Application': 'Applied', 'Interview': 'Interviewing', 'Offer': 'Offer', 'Rejected': 'Rejected' };

          let status = STATUS_MAP[classification.label] || 'Applied';
          if (classification.isSkip || classification.label === 'Other') {
            status = 'skipped';
          }

          // Validate before saving (Ghost Job Check) - ONLY for valid jobs
          if (status !== 'skipped') {
            if (!classification.company || classification.company === 'Unknown' || !classification.role || classification.role === 'Unknown') {
              console.log(`👻 [deep-scan] Skipping ghost job (missing metadata): ${email.subject}`);
              stats.skipped++;
              await seenCache.set(message.id, { skipped: 'missing-metadata', at: Date.now() });
              continue;
            }
          }

          const resolvedCompany = (status === 'skipped' && (!classification.company || classification.company === 'Unknown')) ? 'Junk Filter' : classification.company;
          const resolvedRole = (status === 'skipped' && (!classification.role || classification.role === 'Unknown')) ? 'Skipped Email' : (classification.role || 'Unknown');

          if (resolvedCompany && resolvedCompany !== 'Unknown') {
            const savedJob = await Job.findOneAndUpdate(
              { emailId: email.id },
              {
                userId: await gmailService.getUserEmail(),
                company: resolvedCompany,
                role: resolvedRole,
                status: status,
                date: email.internalDate ? new Date(parseInt(email.internalDate)) : new Date(),
                description: email.subject,
                emailId: email.id,
                category: classification.category || 'other'
              },
              { upsert: true, new: true }
            );
            if (status === 'skipped') {
              console.log(`✅ [deep-scan] Saved as SKIPPED (ID: ${email.id})`);
            }
          }

          stats.processed++;
          sendEvent('progress', {
            percent: progress,
            type: 'match',
            job: { company: resolvedCompany, role: resolvedRole, status: status, date: savedJob.date },
            log: `✅ Classified: ${resolvedCompany} - ${resolvedRole} (${status})`
          });

          await seenCache.set(message.id, { labeled: classification.label, method: 'ai', at: Date.now() });

          // Sleep to be nice to API
          await new Promise(r => setTimeout(r, 200));

        } catch (e) {
          console.error(`Error processing ${message.id}:`, e);
          stats.errors++;
        }
      }

      // Sleep between batches
      await new Promise(r => setTimeout(r, 1000));
    }

    sendEvent('log', { message: `🎉 Deep Scan Complete! Processed: ${stats.processed}, Skipped: ${stats.skipped}` });
    sendEvent('complete', { stats });
    res.end();

  } catch (error) {
    console.error('Deep scan error:', error);
    sendEvent('error', { message: error.message });
    res.end();
  } finally {
    clearInterval(heartbeat);
  }
});

/**
 * GET /api/gmail/stream-scan
 * Scans emails and streams results via Server-Sent Events (SSE)
 */
router.get('/stream-scan', async (req, res) => {
  // SSE Setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000); // Send comment every 15s

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
  });

  try {
    const maxResults = parseInt(req.query.maxResults) || 50;
    const query = req.query.query || 'is:unread';
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    // Resolve session manually if needed since this is a GET request which might bypass middleware if not carefully configured
    // But since we use app.use('/api/gmail', requireAuth...), req.user should be populated

    if (!req.user || !req.user.auth) {
      sendEvent('error', { message: 'Authentication required' });
      return res.end();
    }

    const gmailService = new GmailService(req.user.auth);
    const customClassifier = new CustomLabelClassifier();
    const PersistentCache = require('../services/persistent-cache.service');
    const path = require('path');
    const seenCache = new PersistentCache({
      filePath: path.join(__dirname, '../data/cache-seen.json'),
      defaultTtlMs: 30 * 24 * 60 * 60 * 1000
    });
    const ClassifierService = require('../services/classifier.service');
    const Job = require('../models/Job');
    const IgnoredEmail = require('../models/IgnoredEmail');

    sendEvent('log', { message: `🔍 Starting scan for "${query}" (limit: ${maxResults})...` });

    // Step 1: Fetch IDs
    const messages = await gmailService.scanNewEmails(query, maxResults);
    sendEvent('log', { message: `📨 Found ${messages.length} potentially relevant emails.` });

    if (messages.length === 0) {
      sendEvent('complete', { stats: { total: 0, processed: 0, skipped: 0 } });
      return res.end();
    }

    let stats = { total: messages.length, processed: 0, skipped: 0 };
    const processedResults = [];

    // Step 2: Process each email
    for (const [index, message] of messages.entries()) {
      const progress = Math.round(((index + 1) / messages.length) * 100);

      try {
        // Check cache first
        const seen = await seenCache.get(message.id);
        if (seen) {
          stats.skipped++;
          sendEvent('progress', {
            percent: progress,
            type: 'skipped',
            reason: 'Already Seen',
            id: message.id
          });
          continue;
        }

        const email = await gmailService.getEmail(message.id);
        if (!email.body || email.body.length === 0) {
          stats.skipped++;
          sendEvent('progress', { percent: progress, type: 'skipped', reason: 'Empty Body', subject: email.subject });
          continue;
        }

        // --- NEW: DB Duplicate Check ---
        const existingJob = await Job.findOne({ emailId: message.id });
        if (existingJob) {
          stats.skipped++;
          // Keep in cache so we don't even hit DB next time if possible, but DB is the source of truth
          await seenCache.set(message.id, { labeled: existingJob.status || 'Applied', method: 'db-existing', at: Date.now() });

          sendEvent('progress', {
            percent: progress,
            type: 'skipped',
            reason: 'Already in DB',
            subject: email.subject
          });
          continue;
        }
        // -------------------------------

        sendEvent('log', { message: `🧠 Analyzing: "${email.subject}"...` });

        // 1. Custom Classifier
        const customResult = await customClassifier.classify(email);
        if (customResult && customResult.success) {
          await gmailService.applyLabelToThread(email.threadId, customResult.label, false);
          stats.processed++;
          const resultData = {
            id: email.id,
            subject: email.subject,
            label: customResult.label,
            company: "Custom Rule",
            role: "N/A",
            status: 'Applied'
          };
          processedResults.push(resultData);
          sendEvent('progress', { percent: progress, type: 'match', job: resultData });
          await seenCache.set(message.id, { labeled: customResult.label, at: Date.now() });
          continue;
        }

        // 2. Simple Job Check
        const clfNoAI = new ClassifierService({ enableAI: false });
        if (!clfNoAI.isJobRelated(email)) {
          const reason = clfNoAI.isFinanceReceipt && clfNoAI.isFinanceReceipt(email) ? 'Receipt' : 'Not Job Related';
          stats.skipped++;
          sendEvent('progress', { percent: progress, type: 'skipped', reason: reason, subject: email.subject });
          await seenCache.set(message.id, { skipped: reason, at: Date.now() });
          continue;
        }

        // 3. AI Classifier
        const classifier = new ClassifierService({
          enableAI: true,
          openaiApiKey: process.env.OPENAI_API_KEY,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY
        });

        const classification = await classifier.classify(email);

        if (!classification) {
          stats.skipped++;
          sendEvent('progress', { percent: progress, type: 'skipped', reason: 'AI No Match', subject: email.subject });
          await seenCache.set(message.id, { skipped: 'no-match', at: Date.now() });
        } else {
          // Success!
          if (!classification.isSkip) {
            await gmailService.applyLabelToThread(email.threadId, classification.label, classification.config?.moveToFolder);
          }

          // Save DB
          const STATUS_MAP = {
            'Application': 'Applied', 'Interview': 'Interviewing',
            'Offer': 'Offer', 'Rejected': 'Rejected', 'Ghost': 'Rejected'
          };

          let status = STATUS_MAP[classification.label] || 'Applied';
          if (classification.isSkip || classification.label === 'Other') {
            status = 'skipped';
          }

          // ... DB Saving Logic ...
          const userEmail = await gmailService.getUserEmail();

          // Prevent "Ghost" Jobs: Check for missing metadata
          // ONLY ENFORCE THIS IF IT IS A REAL JOB (not skipped)
          if (status !== 'skipped') {
            if (!classification.company || classification.company === 'Unknown' || !classification.role || classification.role === 'Unknown') {
              console.log(`👻 [scan] Skipping ghost job (missing metadata): ${email.subject}`);
              stats.skipped++;
              sendEvent('progress', { percent: progress, type: 'skipped', reason: 'Missing Metadata', subject: email.subject });
              await seenCache.set(message.id, { skipped: 'missing-metadata', at: Date.now() });
              continue;
            }
          }

          const resolvedCompany = (status === 'skipped' && (!classification.company || classification.company === 'Unknown')) ? 'Junk Filter' : (classification.company || 'Unknown');
          const resolvedRole = (status === 'skipped' && (!classification.role || classification.role === 'Unknown')) ? 'Skipped Email' : (classification.role || 'Unknown');

          const savedJob = await Job.findOneAndUpdate(
            { emailId: email.id },
            {
              userId: userEmail,
              company: resolvedCompany,
              role: resolvedRole,
              status: status,
              salary: classification.salary || 'Unknown',
              emailSnippet: classification.emailSnippet,
              date: email.emailDate || new Date(), // Use the parsed date from service
              emailId: email.id,
              description: email.subject,
              category: classification.category || 'other'
            },
            { upsert: true, new: true }
          );

          console.log(`[DEBUG] Saved Job Date. ID: ${email.id}, EmailDate: ${email.emailDate}, Saved: ${savedJob.date}`);

          if (status === 'skipped') {
            console.log(`✅ [stream-scan] Saved as SKIPPED (ID: ${email.id})`);
          }

          stats.processed++;
          const jobData = {
            id: savedJob.id,
            emailId: savedJob.emailId,
            company: savedJob.company,
            role: savedJob.role,
            status: savedJob.status,
            salary: savedJob.salary,
            date: savedJob.date
          };
          processedResults.push(jobData);

          sendEvent('progress', {
            percent: progress,
            type: 'match',
            job: jobData,
            log: `✅ Classified as ${classification.label}: ${classification.company} - ${classification.role}`
          });

          await seenCache.set(message.id, { labeled: classification.label, at: Date.now() });
        }

        // Rate limit slightly
        await new Promise(r => setTimeout(r, 100));

      } catch (err) {
        console.error(`Error processing ${message.id}:`, err);
        sendEvent('log', { message: `❌ Error: ${err.message}` });
      }
    }

    // 🔥 Filter out skipped/junk items from the final results list for cleaner UI
    const cleanResults = processedResults.filter(item => item.status !== 'skipped');

    sendEvent('complete', { stats, results: cleanResults });
    res.end();

  } catch (error) {
    console.error('Stream scan error:', error);
    sendEvent('error', { message: error.message || 'Unknown scan error' });
    res.end();
  } finally {
    clearInterval(heartbeat);
  }
});

router.post('/scan', async (req, res) => {
  try {
    const { maxResults = 50, query = 'is:unread' } = req.body;

    const gmailService = new GmailService(req.user.auth);
    const customClassifier = new CustomLabelClassifier();
    const PersistentCache = require('../services/persistent-cache.service');
    const path = require('path');
    const seenCache = new PersistentCache({
      filePath: path.join(__dirname, '../data/cache-seen.json'),
      defaultTtlMs: 30 * 24 * 60 * 60 * 1000
    });
    const Job = require('../models/Job');
    const IgnoredEmail = require('../models/IgnoredEmail');

    console.log('📧 [scan] scanning for new emails...', {
      query,
      maxResults,
      sessionId: req.headers['x-session-id']
    });

    // Get new emails using custom query (default unread)
    const messages = await gmailService.scanNewEmails(query, maxResults);
    console.log(`📨 [scan] found ${messages.length} emails for query ${query}`);

    const results = [];

    // Initialize Report Card
    let skippedCount = 0;
    let aiCount = 0;
    let newJobsCount = 0;
    let junkCount = 0;

    console.log(`🔍 [Start] Scanning ${messages.length} emails from Gmail...`);

    for (const message of messages) {
      try {
        const email = await gmailService.getEmail(message.id);

        // Skip if we've processed this message recently
        const seen = await seenCache.get(message.id);
        if (seen) {
          skippedCount++;
          results.push({ id: message.id, subject: email?.subject, from: email?.from, date: email?.date, skipped: 'cached-seen' });
          console.log(`↪️  [scan] skipped ${message.id} (cached-seen)`);
          continue;
        }

        if (!email.body || email.body.length === 0) {
          skippedCount++;
          results.push({ id: email.id, subject: email.subject, from: email.from, date: email.date, skipped: 'empty-body' });
          console.log(`↪️  [scan] skipped ${email.id} (empty-body)`);
          continue;
        }

        // --- NEW: DB Duplicate Check ---
        const existingJob = await Job.findOne({ emailId: message.id });
        if (existingJob) {
          skippedCount++;
          results.push({ id: message.id, skipped: 'db-duplicate-job', subject: email.subject });
          console.log(`↪️  [scan] skipped ${message.id} (already in Job DB)`);
          await seenCache.set(message.id, { labeled: existingJob.status || 'Applied', method: 'db-existing', at: Date.now() });
          continue;
        }
        const existingIgnored = await IgnoredEmail.findOne({ emailId: message.id });
        if (existingIgnored) {
          skippedCount++;
          results.push({ id: message.id, skipped: 'db-duplicate-ignored', subject: email.subject });
          console.log(`↪️  [scan] skipped ${message.id} (already in Ignored DB)`);
          await seenCache.set(message.id, { labeled: 'Ignored', method: 'db-ignored', at: Date.now() });
          continue;
        }
        // -------------------------------

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

          newJobsCount++; // Custom rule hits count as new jobs
          results.push({
            id: email.id,
            subject: email.subject,
            from: email.from,
            date: email.date,
            label: customResult.label,
            confidence: customResult.confidence,
            method: customResult.method,
            reason: customResult.reason
          });
          console.log(`✅ [scan] custom labeled ${email.id} -> ${customResult.label} (${customResult.reason})`);
          await seenCache.set(message.id, { labeled: customResult.label, at: Date.now() });
          continue;
        }

        // Then try job-related classification (quick heuristic, no AI)
        const clfNoAI = new ClassifierService({ enableAI: false });
        if (!clfNoAI.isJobRelated(email)) {
          // Give more context: finance/receipt ignored
          const reason = clfNoAI.isFinanceReceipt && clfNoAI.isFinanceReceipt(email)
            ? 'ignored-finance-receipt'
            : 'not-job-related';

          // Log to file for debugging
          try {
            const fs = require('fs');
            const logMsg = `[${new Date().toISOString()}] SKIPPED_FILTER: "${email.subject}" From: "${email.from}" Reason: ${reason}\n`;
            fs.appendFileSync('/tmp/scan.log', logMsg);
          } catch (e) { }

          // Save valid skip to ignored
          await IgnoredEmail.create({
            emailId: message.id,
            subject: email.subject,
            sender: email.from,
            reason: reason,
            date: new Date()
          });
          junkCount++;
          results.push({ id: email.id, subject: email.subject, from: email.from, date: email.date, skipped: reason });
          console.log(`↪️  [scan] skipped ${email.id} (${reason}) - Saved to Ignored`);
          await seenCache.set(message.id, { skipped: reason, at: Date.now() });
          continue;
        }

        // AI Policy: Use AI for all complex emails to ensure maximum accuracy
        aiCount++;
        const allowAIForThisEmail = true; // Enabled 100% for better accuracy

        const classifier = new ClassifierService({
          enableAI: allowAIForThisEmail,
          openaiApiKey: process.env.OPENAI_API_KEY,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY
        });

        const classification = await classifier.classify(email);

        // Only trigger "no match" skip if it genuinely returned nothing (e.g., empty string body)
        // If it returns an object with isSkip: true, we PROCEED to save it.
        if (!classification) {
          skippedCount++;
          // Log seen skip
          try {
            const fs = require('fs');
            fs.appendFileSync('/tmp/scan.log', `[${new Date().toISOString()}] SKIPPED_SEEN: ${message.id}\n`);
          } catch (e) { }

          results.push({ id: email.id, subject: email.subject, from: email.from, date: email.date, skipped: 'no-match' });
          console.log(`↪️  [scan] skipped ${email.id} (no-match)`);
          await seenCache.set(message.id, { skipped: 'no-match', at: Date.now() }, 6 * 60 * 60 * 1000);
          continue;
        }

        // Apply label to thread (ONLY if not skipped/junk)
        if (!classification.isSkip) {
          try {
            await gmailService.applyLabelToThread(
              email.threadId,
              classification.label,
              classification.config?.moveToFolder
            );
          } catch (e) {
            console.error(`[scan] apply label failed for ${email.id}:`, e.message);
          }
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

        // Save to MongoDB (Persistence)
        try {
          if (classification.isSkip || classification.label === 'Other') {
            // 🗑️ Ignored
            await IgnoredEmail.create({
              emailId: email.id,
              subject: classification.emailSnippet || email.subject,
              sender: email.from,
              reason: classification.category || 'other',
              date: new Date()
            });
            junkCount++;
            console.log(`🗑️ [scan] Saved to Ignored List (ID: ${email.id})`);
          } else {
            // 💎 Valid
            const userEmail = await gmailService.getUserEmail();
            const STATUS_MAP = {
              'Application': 'Applied',
              'Interview': 'Interviewing',
              'Offer': 'Offer',
              'Rejected': 'Rejected',
              'Ghost': 'Rejected'
            };

            const status = STATUS_MAP[classification.label] || 'Applied';

            // Prevent "Ghost" Jobs: Check for missing metadata
            // ONLY ENFORCE THIS IF IT IS A REAL JOB (not skipped)
            if (!classification.company || classification.company === 'Unknown' || !classification.role || classification.role === 'Unknown') {
              console.log(`👻 [scan] Skipping ghost job (missing metadata): ${email.subject}`);
              junkCount++; // Count as junk if missing metadata
              await IgnoredEmail.create({
                emailId: email.id,
                subject: email.subject,
                sender: email.from,
                reason: 'missing-metadata',
                date: new Date()
              });
              results.push({ id: email.id, skipped: 'missing-metadata' });
              continue;
            }

            await Job.findOneAndUpdate(
              { emailId: email.id },
              {
                userId: userEmail,
                company: classification.company || 'Unknown Company',
                role: classification.role || 'Unknown Role',
                status: status,
                salary: classification.salary || 'Unknown',
                location: classification.location || 'Unknown',
                date: email.internalDate ? new Date(parseInt(email.internalDate)) : new Date(),
                emailSnippet: classification.emailSnippet || email.snippet,
                description: email.subject,
                emailId: email.id,
                category: classification.category || 'other'
              },
              { upsert: true, new: true }
            );
            newJobsCount++;
            console.log(`✅ [scan] Saved Valid Job (ID: ${email.id})`);
          }
        } catch (dbError) {
          if (dbError.code !== 11000) console.error(`❌ [scan] save to DB failed for ${email.id}:`, dbError.message);
        }

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
          removedLabels,
          // Start of Frontend Sync Support
          jobData: {
            company: classification.company,
            role: classification.role,
            salary: classification.salary,
            emailSnippet: classification.emailSnippet
          }
        });

        await seenCache.set(message.id, { labeled: classification.label, method: classification.method, at: Date.now() });

        // Rate limiting
        console.log(`✅ [scan] labeled ${email.id} as ${classification.label} via ${classification.method}`);
        await gmailService.sleep(100);
      } catch (err) {
        console.error(`❌ [scan] failed processing message ${message.id}:`, err.message);
        results.push({ id: message.id, skipped: 'error', error: err.message });
        try { await seenCache.set(message.id, { skipped: 'error', error: err.message, at: Date.now() }, 2 * 60 * 60 * 1000); } catch { }
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

/**
 * POST /api/gmail/clear-cache
 * Clear classification cache (useful after deploying new classifier logic)
 */
router.post('/clear-cache', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const cacheFile = path.join(__dirname, '../data/cache-classify.json');
    const seenFile = path.join(__dirname, '../data/cache-seen.json');

    try {
      // Delete both caches
      await Promise.all([
        fs.unlink(cacheFile).catch(() => { }),
        fs.unlink(seenFile).catch(() => { })
      ]);

      // Also clear in-memory cache if possible (restart is better)
      console.log('✅ All caches cleared (classify + seen)');

      res.json({
        success: true,
        message: 'All caches cleared successfully'
      });
    } catch (e) {
      if (e.code === 'ENOENT') {
        // File doesn't exist, that's fine
        res.json({
          success: true,
          message: 'Cache file does not exist (already clear)'
        });
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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