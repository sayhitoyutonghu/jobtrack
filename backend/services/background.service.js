const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 后台服务管理器
 * 负责管理后台进程和系统服务
 */
class BackgroundService {
  constructor() {
    this.processes = new Map();
    this.logFile = path.join(__dirname, '..', 'logs', 'background.log');
    this.pidFile = path.join(__dirname, '..', 'data', 'background.pid');
    this.ensureLogDir();
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 启动后台服务
   */
  async startBackground() {
    try {
      console.log('🔄 启动后台服务模式...');
      
      // 启动服务器进程
      const serverProcess = this.startServerProcess();
      this.processes.set('server', serverProcess);
      
      // 保存PID文件
      this.savePidFile(process.pid);
      
      // 设置进程退出处理
      this.setupProcessHandlers();
      
      console.log('✅ 后台服务已启动');
      console.log(`📝 PID: ${process.pid}`);
      console.log(`📄 日志: ${this.logFile}`);
      
      return true;
    } catch (error) {
      console.error('❌ 后台服务启动失败:', error.message);
      return false;
    }
  }

  /**
   * 启动服务器进程
   */
  startServerProcess() {
    const serverPath = path.join(__dirname, '..', 'server.js');
    
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: {
        ...process.env,
        BACKGROUND_MODE: 'true'
      }
    });

    // 重定向输出到日志文件
    const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    
    serverProcess.stdout.pipe(logStream);
    serverProcess.stderr.pipe(logStream);
    
    serverProcess.on('error', (error) => {
      console.error('服务器进程错误:', error);
      this.logError('服务器进程错误', error);
    });

    serverProcess.on('exit', (code) => {
      console.log(`服务器进程退出，代码: ${code}`);
      this.logInfo(`服务器进程退出，代码: ${code}`);
    });

    return serverProcess;
  }

  /**
   * 设置进程退出处理
   */
  setupProcessHandlers() {
    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('\n🛑 收到SIGINT信号，正在关闭后台服务...');
      this.stopAllProcesses();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 收到SIGTERM信号，正在关闭后台服务...');
      this.stopAllProcesses();
      process.exit(0);
    });

    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
      this.logError('未捕获的异常', error);
      this.stopAllProcesses();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
      this.logError('未处理的Promise拒绝', reason);
    });
  }

  /**
   * 停止所有进程
   */
  stopAllProcesses() {
    console.log('🛑 停止所有后台进程...');
    
    for (const [name, process] of this.processes) {
      try {
        console.log(`停止进程: ${name}`);
        process.kill('SIGTERM');
        
        // 等待进程优雅退出
        setTimeout(() => {
          if (!process.killed) {
            console.log(`强制终止进程: ${name}`);
            process.kill('SIGKILL');
          }
        }, 5000);
      } catch (error) {
        console.error(`停止进程失败 ${name}:`, error.message);
      }
    }
    
    this.processes.clear();
    this.deletePidFile();
  }

  /**
   * 保存PID文件
   */
  savePidFile(pid) {
    try {
      const dataDir = path.dirname(this.pidFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.pidFile, pid.toString());
    } catch (error) {
      console.error('保存PID文件失败:', error.message);
    }
  }

  /**
   * 删除PID文件
   */
  deletePidFile() {
    try {
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }
    } catch (error) {
      console.error('删除PID文件失败:', error.message);
    }
  }

  /**
   * 检查是否已在后台运行
   */
  isRunning() {
    try {
      if (!fs.existsSync(this.pidFile)) {
        return false;
      }
      
      const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
      
      // 检查进程是否存在
      try {
        process.kill(pid, 0);
        return true;
      } catch (error) {
        // 进程不存在，删除PID文件
        this.deletePidFile();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 停止后台服务
   */
  stopBackground() {
    try {
      if (!fs.existsSync(this.pidFile)) {
        console.log('后台服务未运行');
        return false;
      }
      
      const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
      console.log(`停止后台服务 PID: ${pid}`);
      
      process.kill(pid, 'SIGTERM');
      this.deletePidFile();
      
      console.log('✅ 后台服务已停止');
      return true;
    } catch (error) {
      console.error('停止后台服务失败:', error.message);
      return false;
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      running: this.isRunning(),
      pidFile: this.pidFile,
      logFile: this.logFile,
      processes: Array.from(this.processes.keys())
    };
  }

  /**
   * 记录信息日志
   */
  logInfo(message) {
    this.log('INFO', message);
  }

  /**
   * 记录错误日志
   */
  logError(message, error) {
    this.log('ERROR', `${message}: ${error.message || error}`);
  }

  /**
   * 记录日志
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('写入日志失败:', error.message);
    }
  }
}

module.exports = BackgroundService;
