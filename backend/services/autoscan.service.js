const GmailService = require('./gmail.service');
const ClassifierService = require('./classifier.service');
const CustomLabelClassifier = require('./custom-label-classifier.service');
const Job = require('../models/Job');

const PersistentCache = require('./persistent-cache.service');
const path = require('path');

class AutoScanService {
  constructor({ intervalMs = 300000, resolveSession }) { // 默认5分钟
    this.intervalMs = intervalMs;
    this.resolveSession = resolveSession; // function(sessionId) -> {auth}
    this.timers = new Map();
    this.scanHistory = new Map(); // 存储扫描历史
    this.errorCount = new Map(); // 错误计数
    this.maxRetries = 3; // 最大重试次数

    // Initialize cache
    this.seenCache = new PersistentCache({
      filePath: path.join(__dirname, '../data/cache-seen.json'),
      defaultTtlMs: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
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
          anthropicApiKey: process.env.ANTHROPIC_API_KEY
        });
        const customClassifier = new CustomLabelClassifier();
        const msgs = await gmail.scanNewEmails(query, maxResults);
        console.log(`[autoscan] tick session ${sessionId} -> ${msgs.length} messages`);

        for (const m of msgs) {
          // Check cache first
          const seen = await this.seenCache.get(m.id);
          if (seen) {
            console.log(`[autoscan] skipped ${m.id} (cached-seen)`);
            continue;
          }

          try {
            const email = await gmail.getEmail(m.id);

            // First try custom label classification (for any email type)
            const customResult = await customClassifier.classify(email);
            if (customResult.success) {
              await gmail.applyLabelToThread(email.threadId, customResult.label, false);
              console.log(`[autoscan] custom labeled ${email.id} -> ${customResult.label} (${customResult.reason})`);
              processedCount++;
              await this.seenCache.set(m.id, { labeled: customResult.label, method: 'custom', at: Date.now() });
              await gmail.sleep(100);
              continue;
            }

            // Then try job-related classification
            if (!classifier.isJobRelated(email)) {
              await this.seenCache.set(m.id, { skipped: 'not-job-related', at: Date.now() });
              continue;
            }

            const cls = await classifier.classify(email);
            if (!cls) {
              await this.seenCache.set(m.id, { skipped: 'no-match', at: Date.now() });
              continue;
            }

            await gmail.applyLabelToThread(email.threadId, cls.label, false);
            console.log(`[autoscan] job labeled ${email.id} -> ${cls.label}`);

            // Save to MongoDB
            try {
              const userEmail = await gmail.getUserEmail();

              const STATUS_MAP = {
                'Application': 'Applied',
                'Interview': 'Interviewing',
                'Offer': 'Offer',
                'Rejected': 'Rejected',
                'Ghost': 'Rejected'
              };

              await Job.findOneAndUpdate(
                { emailId: email.id },
                {
                  userId: userEmail,
                  company: cls.company || 'Unknown Company',
                  role: cls.role || 'Unknown Role',
                  status: STATUS_MAP[cls.label] || 'Applied',
                  salary: cls.salary || 'Unknown',
                  location: cls.location || 'Unknown',
                  date: email.internalDate ? new Date(parseInt(email.internalDate)) : new Date(),
                  emailSnippet: cls.emailSnippet || email.snippet,
                  description: email.subject, // Keep description as subject for now, or use snippet
                  emailId: email.id
                },
                { upsert: true, new: true }
              );
            } catch (dbError) {
              console.error(`[autoscan] failed to save job to DB: ${dbError.message}`);
            }

            processedCount++;
            await this.seenCache.set(m.id, { labeled: cls.label, method: cls.method, at: Date.now() });

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
        // Check cache first
        const seen = await this.seenCache.get(m.id);
        if (seen) {
          console.log(`[autoscan] runNow skipped ${m.id} (cached-seen)`);
          results.push({ id: m.id, skipped: 'cached-seen' });
          continue;
        }

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
            await this.seenCache.set(m.id, { labeled: customResult.label, method: 'custom', at: Date.now() });
            await gmail.sleep(100);
            continue;
          }

          // Then try job-related classification
          if (!classifier.isJobRelated(email)) {
            await this.seenCache.set(m.id, { skipped: 'not-job-related', at: Date.now() });
            continue;
          }

          const cls = await classifier.classify(email);
          if (!cls) {
            await this.seenCache.set(m.id, { skipped: 'no-match', at: Date.now() });
            continue;
          }

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
              { emailId: email.id },
              {
                userId: userEmail,
                company: cls.company || 'Unknown Company',
                role: cls.role || 'Unknown Role',
                status: status,
                salary: cls.salary || 'Unknown',
                location: cls.location || 'Unknown',
                date: email.internalDate ? new Date(parseInt(email.internalDate)) : new Date(),
                emailSnippet: email.snippet,
                description: email.subject,
                emailId: email.id
              },
              { upsert: true, new: true }
            );
          } catch (dbError) {
            console.error(`[autoscan] failed to save job to DB: ${dbError.message}`);
          }

          await this.seenCache.set(m.id, { labeled: cls.label, method: cls.method, at: Date.now() });
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
