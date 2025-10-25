const GmailService = require('./gmail.service');
const ClassifierService = require('./classifier.service');

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
        const classifier = new ClassifierService(process.env.ANTHROPIC_API_KEY);
        const msgs = await gmail.scanNewEmails(query, maxResults);
        console.log(`[autoscan] tick session ${sessionId} -> ${msgs.length} messages`);
        
        for (const m of msgs) {
          try {
            const email = await gmail.getEmail(m.id);
            if (!classifier.isJobRelated(email)) continue;
            
            const cls = await classifier.classify(email);
            if (!cls) continue;
            
            await gmail.applyLabelToThread(email.threadId, cls.label, false);
            console.log(`[autoscan] labeled ${email.id} -> ${cls.label}`);
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
          if (!email.body || email.body.length === 0) {
            continue;
          }
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
