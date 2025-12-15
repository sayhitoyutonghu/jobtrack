const GmailService = require('./gmail.service');
const ClassifierService = require('./classifier.service');
const CustomLabelClassifier = require('./custom-label-classifier.service');
const Job = require('../models/Job');

class AutoScanService {
  constructor({ intervalMs = 300000, resolveSession }) { // 默认5分钟
    this.intervalMs = intervalMs;
    this.resolveSession = resolveSession; // function(sessionId) -> {auth}
    this.timers = new Map();
    this.scanHistory = new Map(); // 存储扫描历史
    this.errorCount = new Map(); // 错误计数
    this.maxRetries = 3; // 最大重试次数
  }

  start(sessionId, query = 'in:anywhere newer_than:2d', maxResults = 20) {
    if (this.timers.has(sessionId)) {
      console.log(`[autoscan] session ${sessionId} already running`);
      return { running: true };
    }
    console.log(`[autoscan] starting interval for session ${sessionId}`, { query, maxResults, intervalMs: this.intervalMs });

    const tick = async () => {
      const startTime = Date.now();
      let processedCount = 0;
      let errorCount = 0;

      try {
        const session = this.resolveSession(sessionId);
        if (!session) {
          console.warn(`[autoscan] session ${sessionId} missing credentials, skipping tick`);
          this.errorCount.set(sessionId, (this.errorCount.get(sessionId) || 0) + 1);
          return;
        }

        const gmail = new GmailService(session.auth);
        const classifier = new ClassifierService({
          openaiApiKey: process.env.OPENAI_API_KEY,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          geminiApiKey: process.env.GEMINI_API_KEY
        });
        const customClassifier = new CustomLabelClassifier();
        const msgs = await gmail.scanNewEmails(query, maxResults);
        console.log(`[autoscan] tick session ${sessionId} -> ${msgs.length} messages`);

        for (const m of msgs) {
          try {
            const email = await gmail.getEmail(m.id);

            // First try custom label classification (for any email type)
            const customResult = await customClassifier.classify(email);
            if (customResult.success) {
              await gmail.applyLabelToThread(email.threadId, customResult.label, false);
              console.log(`[autoscan] custom labeled ${email.id} -> ${customResult.label} (${customResult.reason})`);
              processedCount++;
              await gmail.sleep(100);
              continue;
            }

            // Then try job-related classification
            if (!classifier.isJobRelated(email)) continue;

            const cls = await classifier.classify(email);
            if (!cls) continue;

            await gmail.applyLabelToThread(email.threadId, cls.label, false);
            console.log(`[autoscan] job labeled ${email.id} -> ${cls.label}`);

            // Save to MongoDB
            try {
              // Extract user email from session auth if possible, or use a placeholder
              // Since we don't have easy access to user email here without an API call,
              // we'll try to get it from the email 'to' field or just use 'unknown' for now.
              // Ideally, we should pass userEmail to start().

              // For now, let's just save it. The userId field is required.
              // We can use the session ID as a temporary userId if we have to, 
              // but better to fetch profile once and store in session.

              // Let's assume we can get the user profile email.
              // Since this is async and inside a loop, let's do a quick hack:
              // We'll use the 'Delivered-To' header or just the first 'To' address.
              // Or better, we fetch the profile once at start of tick.

              const userEmail = await gmail.getUserEmail(); // We need to add this method to GmailService

              await Job.findOneAndUpdate(
                { originalEmailId: email.id },
                {
                  userId: userEmail,
                  company: cls.company || 'Unknown Company', // Classifier needs to return company
                  role: cls.role || 'Unknown Role', // Classifier needs to return role
                  status: cls.label, // Map label to status? Label is 'Application', 'Interview' etc.
                  // Status enum: ['Applied', 'Interviewing', 'Offer', 'Rejected']
                  // Label: 'Application', 'Interview', 'Offer', 'Rejected'
                  // Need to map.
                  salary: cls.salary || 'Unknown',
                  location: cls.location || 'Unknown',
                  date: new Date(email.internalDate),
                  emailSnippet: email.snippet,
                  description: email.subject,
                  originalEmailId: email.id
                },
                { upsert: true, new: true }
              );
            } catch (dbError) {
              console.error(`[autoscan] failed to save job to DB: ${dbError.message}`);
            }

            processedCount++;

            await gmail.sleep(100);
          } catch (emailError) {
            console.warn(`[autoscan] error processing email ${m.id}:`, emailError.message);
            errorCount++;
          }
        }

        // 记录扫描历史
        const scanRecord = {
          timestamp: new Date(),
          duration: Date.now() - startTime,
          messagesFound: msgs.length,
          processed: processedCount,
          errors: errorCount,
          query,
          maxResults
        };
        this.scanHistory.set(sessionId, scanRecord);

        // 重置错误计数
        this.errorCount.delete(sessionId);

        console.log(`[autoscan] completed for session ${sessionId}: ${processedCount} processed, ${errorCount} errors`);

      } catch (e) {
        const currentErrors = (this.errorCount.get(sessionId) || 0) + 1;
        this.errorCount.set(sessionId, currentErrors);

        console.warn(`[autoscan] tick error for session ${sessionId} (${currentErrors}/${this.maxRetries}):`, e.message);

        // 如果错误次数过多，停止自动扫描
        if (currentErrors >= this.maxRetries) {
          console.error(`[autoscan] too many errors for session ${sessionId}, stopping auto scan`);
          this.stop(sessionId);

          // 记录错误历史
          const errorRecord = {
            timestamp: new Date(),
            sessionId,
            error: e.message,
            errorCount: currentErrors,
            action: 'auto_scan_stopped'
          };
          this.scanHistory.set(`${sessionId}_errors`, errorRecord);
        }
      }
    };

    const timer = setInterval(tick, this.intervalMs);
    this.timers.set(sessionId, { timer, query, maxResults, startTime: new Date() });

    // kick off immediately once
    tick();
    return { running: true };
  }

  stop(sessionId) {
    const t = this.timers.get(sessionId);
    if (t) {
      clearInterval(t.timer);
      this.timers.delete(sessionId);
      console.log(`[autoscan] stopped session ${sessionId}`);
    }
    return { running: false };
  }

  status(sessionId) {
    const t = this.timers.get(sessionId);
    if (!t) return { running: false };

    const history = this.scanHistory.get(sessionId);
    const errorCount = this.errorCount.get(sessionId) || 0;

    return {
      running: true,
      query: t.query,
      maxResults: t.maxResults,
      intervalMs: this.intervalMs,
      startTime: t.startTime,
      lastScan: history,
      errorCount,
      maxRetries: this.maxRetries
    };
  }

  getHistory(sessionId) {
    return this.scanHistory.get(sessionId) || null;
  }

  getAllSessions() {
    const sessions = [];
    for (const [sessionId, timer] of this.timers) {
      sessions.push({
        sessionId,
        ...this.status(sessionId)
      });
    }
    return sessions;
  }

  // 立即执行一次扫描
  async runNow(sessionId, query = 'in:anywhere newer_than:2d', maxResults = 20) {
    try {
      const session = this.resolveSession(sessionId);
      if (!session) {
        throw new Error('Session not found or expired');
      }

      const gmail = new GmailService(session.auth);
      const classifier = new ClassifierService(process.env.ANTHROPIC_API_KEY);
      const customClassifier = new CustomLabelClassifier();
      const msgs = await gmail.scanNewEmails(query, maxResults);

      let processedCount = 0;
      const results = [];

      for (const m of msgs) {
        try {
          const email = await gmail.getEmail(m.id);
          if (!email.body || email.body.length === 0) {
            console.log(`[autoscan] skipped ${m.id} (empty-body)`);
            continue;
          }

          // First try custom label classification (for any email type)
          const customResult = await customClassifier.classify(email);
          if (customResult.success) {
            await gmail.applyLabelToThread(email.threadId, customResult.label, false);
            processedCount++;
            results.push({
              id: email.id,
              subject: email.subject,
              label: customResult.label,
              confidence: customResult.confidence,
              method: customResult.method,
              reason: customResult.reason
            });
            await gmail.sleep(100);
            continue;
          }

          // Then try job-related classification
          if (!classifier.isJobRelated(email)) continue;

          const cls = await classifier.classify(email);
          if (!cls) continue;

          await gmail.applyLabelToThread(email.threadId, cls.label, false);
          processedCount++;
          results.push({
            id: email.id,
            subject: email.subject,
            label: cls.label,
            confidence: cls.confidence
          });

          // Save to MongoDB
          try {
            const userEmail = await gmail.getUserEmail();

            // Map label to status
            let status = 'Applied';
            if (cls.label === 'Interview') status = 'Interviewing';
            else if (cls.label === 'Offer') status = 'Offer';
            else if (cls.label === 'Rejected') status = 'Rejected';

            await Job.findOneAndUpdate(
              { originalEmailId: email.id },
              {
                userId: userEmail,
                company: cls.company || 'Unknown Company',
                role: cls.role || 'Unknown Role',
                status: status,
                salary: cls.salary || 'Unknown',
                location: cls.location || 'Unknown',
                date: new Date(email.internalDate),
                emailSnippet: email.snippet,
                description: email.subject,
                originalEmailId: email.id
              },
              { upsert: true, new: true }
            );
          } catch (dbError) {
            console.error(`[autoscan] failed to save job to DB: ${dbError.message}`);
          }


          await gmail.sleep(100);
        } catch (emailError) {
          console.warn(`[autoscan] error processing email ${m.id}:`, emailError.message);
        }
      }

      return {
        success: true,
        messagesFound: msgs.length,
        processed: processedCount,
        results
      };
    } catch (error) {
      console.error(`[autoscan] runNow error for session ${sessionId}:`, error);
      throw error;
    }
  }
}

module.exports = AutoScanService;
