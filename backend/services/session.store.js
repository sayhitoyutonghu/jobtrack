const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const STORE_PATH = path.join(__dirname, '..', 'data', 'sessions.json');

function ensureStoreFile() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({}), 'utf8');
}

function readAll() {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function writeAll(data) {
  ensureStoreFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function saveSession(sessionId, tokens) {
  const all = readAll();
  all[sessionId] = {
    tokens,
    createdAt: new Date().toISOString(),
  };
  writeAll(all);
}

function getSession(sessionId) {
  const all = readAll();
  const entry = all[sessionId];
  if (!entry) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(entry.tokens);
  return {
    auth: oauth2Client,
    tokens: entry.tokens,
    createdAt: entry.createdAt,
  };
}

function deleteSession(sessionId) {
  const all = readAll();
  delete all[sessionId];
  writeAll(all);
}

module.exports = { saveSession, getSession, deleteSession };
