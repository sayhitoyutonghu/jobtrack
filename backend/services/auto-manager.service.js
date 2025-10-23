const AutoScanService = require('./autoscan.service');
const { getSession, saveSession, deleteSession } = require('./session.store');
const { google } = require('googleapis');

/**
 * 自动管理器服务
 * 负责管理用户的持久化认证和自动启动扫描
 */
class AutoManagerService {
  constructor() {
    this.autoScanService = new AutoScanService({
      intervalMs: 5 * 60 * 1000, // 5分钟
      resolveSession: this.resolveSession.bind(this)
    });
    this.activeSessions = new Map();
    this.autoStartEnabled = true;
    this.refreshInterval = 30 * 60 * 1000; // 30分钟检查一次token
    this.refreshTimer = null;
  }

  /**
   * 解析会话，支持token自动刷新
   */
  async resolveSession(sessionId) {
    try {
      const session = getSession(sessionId);
      if (!session) return null;

      // 检查token是否即将过期（提前5分钟刷新）
      const now = Date.now();
      const expiryTime = session.tokens.expiry_date;
      
      if (expiryTime && (expiryTime - now) < 5 * 60 * 1000) {
        console.log(`[auto-manager] Token即将过期，自动刷新 session: ${sessionId}`);
        const refreshedSession = await this.refreshTokens(sessionId, session.tokens);
        if (refreshedSession) {
          return refreshedSession;
        }
      }

      return session;
    } catch (error) {
      console.error(`[auto-manager] 解析会话失败 ${sessionId}:`, error.message);
      return null;
    }
  }

  /**
   * 自动刷新tokens
   */
  async refreshTokens(sessionId, tokens) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials(tokens);
      
      // 尝试刷新token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // 保存新的tokens
      saveSession(sessionId, credentials);
      
      console.log(`[auto-manager] Token刷新成功 session: ${sessionId}`);
      
      return {
        auth: oauth2Client,
        tokens: credentials,
        createdAt: new Date()
      };
    } catch (error) {
      console.error(`[auto-manager] Token刷新失败 ${sessionId}:`, error.message);
      
      // 如果刷新失败，删除无效的session
      if (error.message.includes('invalid_grant') || error.message.includes('invalid_token')) {
        console.log(`[auto-manager] 删除无效session: ${sessionId}`);
        deleteSession(sessionId);
        this.autoScanService.stop(sessionId);
      }
      
      return null;
    }
  }

  /**
   * 启动自动管理器
   */
  async start() {
    console.log('🚀 [auto-manager] 启动自动管理器...');
    
    // 启动token刷新定时器
    this.startTokenRefreshTimer();
    
    // 自动启动所有有效会话的扫描
    await this.autoStartAllSessions();
    
    console.log('✅ [auto-manager] 自动管理器启动完成');
  }

  /**
   * 启动token刷新定时器
   */
  startTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(async () => {
      await this.checkAndRefreshAllTokens();
    }, this.refreshInterval);
    
    console.log(`[auto-manager] Token刷新定时器启动，间隔: ${this.refreshInterval / 1000 / 60}分钟`);
  }

  /**
   * 检查并刷新所有tokens
   */
  async checkAndRefreshAllTokens() {
    try {
      const allSessions = this.getAllStoredSessions();
      
      for (const sessionId of allSessions) {
        const session = getSession(sessionId);
        if (!session) continue;
        
        const now = Date.now();
        const expiryTime = session.tokens.expiry_date;
        
        // 如果token在30分钟内过期，提前刷新
        if (expiryTime && (expiryTime - now) < 30 * 60 * 1000) {
          console.log(`[auto-manager] 预刷新token session: ${sessionId}`);
          await this.refreshTokens(sessionId, session.tokens);
        }
      }
    } catch (error) {
      console.error('[auto-manager] Token检查失败:', error.message);
    }
  }

  /**
   * 自动启动所有有效会话的扫描
   */
  async autoStartAllSessions() {
    if (!this.autoStartEnabled) {
      console.log('[auto-manager] 自动启动已禁用');
      return;
    }

    try {
      const allSessions = this.getAllStoredSessions();
      console.log(`[auto-manager] 发现 ${allSessions.length} 个存储的会话`);
      
      for (const sessionId of allSessions) {
        const session = await this.resolveSession(sessionId);
        if (session) {
          console.log(`[auto-manager] 自动启动扫描 session: ${sessionId}`);
          this.autoScanService.start(sessionId, 'in:anywhere newer_than:2d', 20);
          this.activeSessions.set(sessionId, {
            startTime: new Date(),
            autoStarted: true
          });
        }
      }
      
      console.log(`[auto-manager] 自动启动了 ${this.activeSessions.size} 个会话的扫描`);
    } catch (error) {
      console.error('[auto-manager] 自动启动失败:', error.message);
    }
  }

  /**
   * 获取所有存储的会话ID
   */
  getAllStoredSessions() {
    try {
      const fs = require('fs');
      const path = require('path');
      const storePath = path.join(__dirname, '..', 'data', 'sessions.json');
      
      if (!fs.existsSync(storePath)) return [];
      
      const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      return Object.keys(data).filter(sessionId => {
        const session = data[sessionId];
        return session && session.tokens && !sessionId.startsWith('test-');
      });
    } catch (error) {
      console.error('[auto-manager] 获取存储会话失败:', error.message);
      return [];
    }
  }

  /**
   * 添加新会话并自动启动扫描
   */
  async addSession(sessionId, tokens) {
    try {
      // 保存会话
      saveSession(sessionId, tokens);
      
      // 自动启动扫描
      if (this.autoStartEnabled) {
        console.log(`[auto-manager] 新会话自动启动扫描: ${sessionId}`);
        this.autoScanService.start(sessionId, 'in:anywhere newer_than:2d', 20);
        this.activeSessions.set(sessionId, {
          startTime: new Date(),
          autoStarted: true
        });
      }
      
      return true;
    } catch (error) {
      console.error(`[auto-manager] 添加会话失败 ${sessionId}:`, error.message);
      return false;
    }
  }

  /**
   * 停止会话
   */
  stopSession(sessionId) {
    this.autoScanService.stop(sessionId);
    this.activeSessions.delete(sessionId);
    console.log(`[auto-manager] 停止会话: ${sessionId}`);
  }

  /**
   * 获取所有活动会话状态
   */
  getAllSessionsStatus() {
    const sessions = [];
    
    for (const [sessionId, info] of this.activeSessions) {
      const scanStatus = this.autoScanService.status(sessionId);
      sessions.push({
        sessionId,
        ...scanStatus,
        autoStarted: info.autoStarted,
        startTime: info.startTime
      });
    }
    
    return sessions;
  }

  /**
   * 设置自动启动状态
   */
  setAutoStart(enabled) {
    this.autoStartEnabled = enabled;
    console.log(`[auto-manager] 自动启动设置为: ${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 停止自动管理器
   */
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // 停止所有扫描
    for (const sessionId of this.activeSessions.keys()) {
      this.autoScanService.stop(sessionId);
    }
    
    this.activeSessions.clear();
    console.log('[auto-manager] 自动管理器已停止');
  }

  /**
   * 获取管理器状态
   */
  getStatus() {
    return {
      autoStartEnabled: this.autoStartEnabled,
      activeSessions: this.activeSessions.size,
      refreshInterval: this.refreshInterval,
      running: this.refreshTimer !== null
    };
  }
}

module.exports = AutoManagerService;
