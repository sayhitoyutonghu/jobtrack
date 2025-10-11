// Periodically scan Gmail for new job-related emails and auto-label them
const cron = require('node-cron');
const axios = require('axios');
const { getAllSessions } = require('./services/session.store');

// Scan interval: every 10 minutes
const SCHEDULE = '*/10 * * * *';

function startAutoScan() {
  cron.schedule(SCHEDULE, async () => {
    const sessions = getAllSessions();
    for (const session of sessions) {
      if (!session || !session.id) continue;
      try {
        await axios.post(
          'http://localhost:3000/api/gmail/scan',
          {},
          {
            headers: {
              'x-session-id': session.id,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`[autoscan] Scanned for session: ${session.id}`);
      } catch (e) {
        console.warn(`[autoscan] Scan failed for session: ${session.id}`, e.message);
      }
    }
  });
  console.log('[autoscan] Gmail autoscan scheduled every 10 minutes.');
}

module.exports = { startAutoScan };