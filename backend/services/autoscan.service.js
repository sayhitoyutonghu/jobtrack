const GmailService = require('./gmail.service');
const ClassifierService = require('./classifier.service');

class AutoScanService {
  constructor({ intervalMs = 60000, resolveSession }) {
    this.intervalMs = intervalMs;
    this.resolveSession = resolveSession; // function(sessionId) -> {auth}
    this.timers = new Map();
  }

  start(sessionId, query = 'in:anywhere newer_than:2d', maxResults = 20) {
    if (this.timers.has(sessionId)) {
      console.log(`[autoscan] session ${sessionId} already running`);
      return { running: true };
    }
    console.log(`[autoscan] starting interval for session ${sessionId}`, { query, maxResults, intervalMs: this.intervalMs });
    const tick = async () => {
      try {
        const session = this.resolveSession(sessionId);
        if (!session) {
          console.warn(`[autoscan] session ${sessionId} missing credentials, skipping tick`);
          return;
        }
        const gmail = new GmailService(session.auth);
        const classifier = new ClassifierService(process.env.ANTHROPIC_API_KEY);
        const msgs = await gmail.scanNewEmails(query, maxResults);
        console.log(`[autoscan] tick session ${sessionId} -> ${msgs.length} messages`);
        for (const m of msgs) {
          const email = await gmail.getEmail(m.id);
          if (!classifier.isJobRelated(email)) continue;
          const cls = await classifier.classify(email);
          if (!cls) continue;
          await gmail.applyLabelToThread(email.threadId, cls.label, false);
          console.log(`[autoscan] labeled ${email.id} -> ${cls.label}`);
          await gmail.sleep(100);
        }
      } catch (e) {
        console.warn(`[autoscan] tick error for session ${sessionId}:`, e.message);
      }
    };
    const timer = setInterval(tick, this.intervalMs);
    this.timers.set(sessionId, { timer, query, maxResults });
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
    return { running: true, query: t.query, maxResults: t.maxResults, intervalMs: this.intervalMs };
  }
}

module.exports = AutoScanService;
