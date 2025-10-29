/**
 * JobTrack Application Configuration
 * 
 * Centralized configuration for all application components
 * 
 * @author JobTrack Team
 * @version 1.0.0
 * @since 2024-12-01
 */

const path = require('path');

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Base configuration
const config = {
  // Application metadata
  app: {
    name: 'JobTrack',
    version: '1.0.0',
    description: 'AI-powered email categorization for job search',
    author: 'JobTrack Team'
  },

  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  },

  // Database configuration
  database: {
    type: 'sqlite',
    path: path.join(__dirname, '../backend/data/jobtrack.db'),
    options: {
      verbose: isDevelopment ? console.log : null
    }
  },

  // Google OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels'
    ]
  },

  // Gmail API configuration
  gmail: {
    batchSize: 10,
    maxResults: 100,
    defaultQuery: 'in:inbox',
    labelPrefix: 'JobTrack/',
    autoScanInterval: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Machine Learning configuration
  ml: {
    modelPath: path.join(__dirname, '../model.pkl'),
    vectorizerPath: path.join(__dirname, '../vectorizer.pkl'),
    pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:5000',
    confidenceThreshold: 0.7,
    categories: [
      { name: 'Application', color: '#3B82F6', description: 'Job applications and alerts' },
      { name: 'Interview', color: '#10B981', description: 'Interview invitations and scheduling' },
      { name: 'Offer', color: '#F59E0B', description: 'Job offers and compensation' },
      { name: 'Rejected', color: '#EF4444', description: 'Rejection notifications' },
      { name: 'Ghost', color: '#6B7280', description: 'Companies that stopped responding' }
    ]
  },

  // Session configuration
  session: {
    storagePath: path.join(__dirname, '../backend/data/sessions.json'),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    encryption: {
      enabled: false, // Set to true for production
      algorithm: 'aes-256-gcm',
      key: process.env.SESSION_ENCRYPTION_KEY
    }
  },

  // Logging configuration
  logging: {
    level: isDevelopment ? 'debug' : 'info',
    format: isDevelopment ? 'dev' : 'combined',
    file: {
      enabled: isProduction,
      path: path.join(__dirname, '../logs/app.log'),
      maxSize: '10MB',
      maxFiles: 5
    }
  },

  // Security configuration
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://www.googleapis.com"]
        }
      }
    }
  },

  // Frontend configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
    buildPath: path.join(__dirname, '../frontend/dist'),
    staticPath: path.join(__dirname, '../frontend/public')
  },

  // Docker configuration
  docker: {
    composeFile: 'docker-compose.yml',
    devComposeFile: 'docker-compose.dev.yml',
    networks: {
      main: 'jobtrack-network'
    },
    volumes: {
      data: './backend/data',
      export: './backend/export',
      models: './model_backups'
    }
  },

  // Development tools
  dev: {
    hotReload: true,
    debugMode: true,
    mockData: false,
    testMode: process.env.TEST_MODE === 'true'
  }
};

// Environment-specific overrides
if (isDevelopment) {
  config.logging.level = 'debug';
  config.dev.debugMode = true;
  config.gmail.autoScanInterval = 30 * 1000; // 30 seconds for development
}

if (isProduction) {
  config.logging.level = 'warn';
  config.dev.debugMode = false;
  config.session.encryption.enabled = true;
  config.security.rateLimit.max = 50; // Stricter rate limiting in production
}

if (isTest) {
  config.database.path = ':memory:';
  config.gmail.autoScanInterval = 1000; // 1 second for tests
  config.dev.testMode = true;
}

// Validation
function validateConfig() {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
    console.warn('   Some features may not work properly.');
  }

  return missing.length === 0;
}

// Export configuration
module.exports = {
  ...config,
  validate: validateConfig,
  isDevelopment,
  isProduction,
  isTest
};
