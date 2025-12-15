/**
 * JobTrack Backend Server
 * 
 * A Node.js Express server that provides:
 * - Google OAuth authentication
 * - Gmail API integration
 * - Email classification using ML
 * - Automated email scanning
 * - RESTful API endpoints
 * 
 * @author JobTrack Team
 * @version 1.0.0
 * @since 2024-12-01
 */

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();
const { saveSession, getSession } = require('./services/session.store');
const AutoManagerService = require('./services/auto-manager.service');
const OpenAI = require('openai');
const mongoose = require('mongoose');

// Initialize Express application
const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS configuration for frontend communication
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'https://jobtrack-7xplmq5l5-sayhitoyutonghu-projects.vercel.app', /\.vercel\.app$/],

  credentials: true
}));

// JSON body parser for API requests
app.use(express.json());

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('⚠️ MONGO_URI not found in environment variables. Persistence disabled.');
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🍃 MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    // - [x] Install mongoose <!-- id: 7 -->
    // - [x] Create Job model <!-- id: 8 -->
    // - [/] Update server.js to connect to MongoDB <!-- id: 9 -->
    // Don't exit process, allow server to run without DB (graceful degradation)
  }
};

connectDB();

// ============================================
// SESSION MANAGEMENT
// ============================================

// In-memory session storage for fast access
// Sessions are also persisted to disk for reliability
const sessions = new Map();

// Initialize automated email scanning manager
const autoManager = new AutoManagerService();

/**
 * Resolves user session from memory or disk storage
 * 
 * @param {string} sessionId - Unique session identifier
 * @returns {Object|null} Session object with auth, tokens, and metadata
 */
function resolveSession(sessionId) {
  // First check in-memory cache for fast access
  let session = sessions.get(sessionId);
  if (session) return session;

  // If not in memory, try to load from disk storage
  const stored = getSession(sessionId);
  if (!stored) return null;

  // Rebuild session structure and cache in memory
  const rebuilt = {
    auth: stored.auth,
    tokens: stored.tokens,
    createdAt: new Date(stored.createdAt),
  };
  sessions.set(sessionId, rebuilt);
  return rebuilt;
}

// Expose session resolver globally for other modules (e.g., autoscan service)
global.__resolveSession = resolveSession;

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ============================================
// AUTH ROUTES
// ============================================

app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels'
    ],
    prompt: 'consent'
  });

  console.log('🔐 Redirecting to Google OAuth...');
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('❌ OAuth error:', error);
    return res.redirect('https://jobtrack-zeta.vercel.app?error=auth_failed');
  }

  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('https://jobtrack-zeta.vercel.app?error=no_code');
  }

  try {
    console.log('🔄 Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);

    // Build user client
    const userAuth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    userAuth.setCredentials(tokens);

    // New session id
    const sessionId = Math.random().toString(36).substring(7);

    // Store in memory
    sessions.set(sessionId, { auth: userAuth, tokens, createdAt: new Date() });
    // Persist to disk
    saveSession(sessionId, tokens);

    // 自动添加到管理器并启动扫描
    await autoManager.addSession(sessionId, tokens);

    console.log('✅ Authentication successful!');
    console.log(`📝 Session ID: ${sessionId}`);

    return res.redirect('https://jobtrack-zeta.vercel.app?session=' + sessionId);
  } catch (error) {
    console.error('❌ Token exchange failed:', error);
    return res.redirect('https://jobtrack-zeta.vercel.app?error=token_failed');
  }
});

// Backend success page (when no frontend is running)
app.get('/auth/success', (req, res) => {
  const { session, error } = req.query;
  const hasError = Boolean(error);
  const port = process.env.PORT || 3000;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Auth ${hasError ? 'Failed' : 'Success'}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial;color:#111;line-height:1.5;margin:24px}code,pre{background:#f6f8fa;padding:2px 6px;border-radius:6px}pre{padding:12px;overflow:auto}.wrap{max-width:880px}a.btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:8px 12px;border-radius:8px}</style></head><body><div class="wrap"><h1>${hasError ? '❌ Authentication Failed' : '✅ Authentication Successful'}</h1>${hasError ? `<p>Error: ${error}</p>` : ''}${session ? `<p>Session ID: <code>${session}</code></p><h3>Try the APIs</h3><p>Setup labels:</p><pre>curl -X POST http://localhost:${port}/api/gmail/setup \
  -H "x-session-id: ${session}"</pre><p>Scan emails:</p><pre>curl -X POST http://localhost:${port}/api/gmail/scan \
  -H "x-session-id: ${session}" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 10}'</pre>` : `<p>No session ID found.</p><p><a class="btn" href="/auth/google">Login with Google</a></p>`}<hr/><p>Configured FRONTEND_URL: <code>${process.env.FRONTEND_URL || ''}</code></p></div></body></html>`;
  res.set('Content-Type', 'text/html').send(html);
});

app.get('/auth/status', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const session = resolveSession(sessionId);
  if (!session) return res.json({ authenticated: false });
  res.json({ authenticated: true, sessionId, createdAt: session.createdAt });
});


// ============================================
// AUTH MIDDLEWARE
// ============================================

const requireAuth = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    return res.status(401).json({
      error: 'No session ID provided',
      message: 'Please authenticate first by visiting /auth/google'
    });
  }
  // Resolve from memory or disk
  const session = resolveSession(sessionId);
  if (!session) {
    return res.status(401).json({
      error: 'Invalid or expired session',
      message: 'Please re-authenticate by visiting /auth/google'
    });
  }
  req.user = session;
  next();
};

// ============================================
// API ROUTES
// ============================================

app.use('/api/gmail', requireAuth, require('./routes/gmail.routes'));
app.use('/api/jobs', requireAuth, require('./routes/jobs.routes'));
app.use('/api/labels', requireAuth, require('./routes/labels.routes')); // Auth required for Gmail integration

// 自动管理器API端点
app.get('/api/auto-manager/status', (req, res) => {
  try {
    const status = autoManager.getStatus();
    const sessions = autoManager.getAllSessionsStatus();
    res.json({
      success: true,
      manager: status,
      sessions
    });
  } catch (error) {
    console.error('Auto manager status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auto-manager/start', async (req, res) => {
  try {
    await autoManager.start();
    res.json({ success: true, message: 'Auto manager started' });
  } catch (error) {
    console.error('Auto manager start error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auto-manager/stop', (req, res) => {
  try {
    autoManager.stop();
    res.json({ success: true, message: 'Auto manager stopped' });
  } catch (error) {
    console.error('Auto manager stop error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auto-manager/auto-start/:enabled', (req, res) => {
  try {
    const enabled = req.params.enabled === 'true';
    autoManager.setAutoStart(enabled);
    res.json({ success: true, autoStartEnabled: enabled });
  } catch (error) {
    console.error('Auto manager set auto-start error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    sessions: sessions.size,
    environment: process.env.NODE_ENV
  });
});

// 健康检查端点，包含自动扫描状态
app.get('/health/detailed', (req, res) => {
  try {
    const autoScanService = require('./services/autoscan.service');
    const autoScan = new autoScanService({ intervalMs: 300000, resolveSession: global.__resolveSession });

    res.json({
      status: 'ok',
      timestamp: new Date(),
      services: {
        sessions: {
          count: sessions.size,
          active: Array.from(sessions.keys())
        },
        autoScan: {
          activeSessions: autoScan.getAllSessions().length,
          sessions: autoScan.getAllSessions()
        }
      },
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date()
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'JobTrack Gmail Automation API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: '/auth/google',
        status: '/auth/status'
      },
      api: {
        setup: 'POST /api/gmail/setup (requires auth)',
        scan: 'POST /api/gmail/scan (requires auth)',
        labels: 'GET /api/gmail/labels (requires auth)'
      }
    }
  });
});

// OpenAI diagnostics endpoint (no auth): verifies API key and quota quickly
app.get('/diagnostics/openai', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-key-here') {
      return res.status(400).json({ success: false, error: 'OPENAI_API_KEY not configured' });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5
    });
    res.json({ success: true, reply: completion.choices[0]?.message?.content || '' });
  } catch (error) {
    console.error('[diagnostics][openai] error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log('\n✅ JobTrack API Server');
  console.log(`Server running on port ${PORT}`);
  console.log(`Login: http://0.0.0.0:${PORT}/auth/google`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (process.env.GEMINI_API_KEY) {
    console.log('✓ GEMINI_API_KEY found in environment');
  } else {
    console.error('❌ GEMINI_API_KEY NOT found in environment');
  }
  // Ensure label-config exists with sane defaults if missing
  try {
    const fs = require('fs');
    const fsp = require('fs').promises;
    const path = require('path');
    const { JOB_LABELS } = require('./config/labels');
    const dataDir = path.join(__dirname, './data');
    const configPath = path.join(dataDir, 'label-config.json');

    if (!fs.existsSync(dataDir)) {
      await fsp.mkdir(dataDir, { recursive: true });
    }

    const ensureDefaultConfig = async () => {
      const defaultConfig = {
        labels: JOB_LABELS.reduce((acc, label) => {
          const id = label.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          acc[id] = {
            enabled: true,
            name: label.name,
            description: label.description,
            keywords: label.keywords || [],
            senders: label.senders || [],
            type: 'preset'
          };
          return acc;
        }, {})
      };
      await fsp.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(`[init] Created default label config at ${configPath}`);
    };

    try {
      await fsp.access(configPath, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      await ensureDefaultConfig();
    }
  } catch (e) {
    console.warn('[init] Failed ensuring label-config.json:', e.message);
  }

  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_client_id') {
    console.warn('⚠️  WARNING: GOOGLE_CLIENT_ID not configured in .env');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  WARNING: GOOGLE_CLIENT_SECRET not configured in .env');
  }

  // 启动自动管理器
  try {
    await autoManager.start();
    console.log('🤖 自动管理器已启动 - 用户连接Gmail后将自动开始扫描');
  } catch (error) {
    console.error('❌ 自动管理器启动失败:', error.message);
  }
});