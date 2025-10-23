#!/usr/bin/env node

/**
 * 系统服务安装脚本
 * 将JobTrack安装为系统服务，实现开机自启动
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ServiceInstaller {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.serviceName = 'jobtrack';
    this.serviceDescription = 'JobTrack Gmail Automation Service';
  }

  /**
   * 检测操作系统
   */
  detectOS() {
    const platform = process.platform;
    switch (platform) {
      case 'win32':
        return 'windows';
      case 'darwin':
        return 'macos';
      case 'linux':
        return 'linux';
      default:
        throw new Error(`不支持的操作系统: ${platform}`);
    }
  }

  /**
   * 安装Windows服务
   */
  installWindowsService() {
    console.log('🪟 安装Windows服务...');
    
    try {
      // 检查是否安装了node-windows
      try {
        require('node-windows');
      } catch (error) {
        console.log('📦 安装node-windows...');
        execSync('npm install -g node-windows', { stdio: 'inherit' });
      }

      const serviceScript = `
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: '${this.serviceName}',
  description: '${this.serviceDescription}',
  script: path.join(__dirname, '..', 'backend', 'server.js'),
  nodeOptions: ['--max-old-space-size=4096']
});

svc.on('install', function() {
  console.log('✅ JobTrack服务安装成功');
  svc.start();
});

svc.on('start', function() {
  console.log('🚀 JobTrack服务已启动');
});

svc.install();
      `;

      const scriptPath = path.join(this.projectRoot, 'scripts', 'windows-service.js');
      fs.writeFileSync(scriptPath, serviceScript);
      
      console.log('📝 运行Windows服务安装脚本...');
      execSync(`node "${scriptPath}"`, { stdio: 'inherit', cwd: this.projectRoot });
      
      console.log('✅ Windows服务安装完成');
    } catch (error) {
      console.error('❌ Windows服务安装失败:', error.message);
      throw error;
    }
  }

  /**
   * 安装Linux服务
   */
  installLinuxService() {
    console.log('🐧 安装Linux服务...');
    
    try {
      const serviceFile = `[Unit]
Description=${this.serviceDescription}
After=network.target

[Service]
Type=simple
User=${process.env.USER || 'root'}
WorkingDirectory=${this.projectRoot}
ExecStart=/usr/bin/node ${path.join(this.projectRoot, 'backend', 'server.js')}
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;

      const servicePath = `/etc/systemd/system/${this.serviceName}.service`;
      
      console.log('📝 创建systemd服务文件...');
      execSync(`sudo tee ${servicePath}`, { input: serviceFile, stdio: 'inherit' });
      
      console.log('🔄 重新加载systemd...');
      execSync('sudo systemctl daemon-reload', { stdio: 'inherit' });
      
      console.log('✅ 启用服务...');
      execSync(`sudo systemctl enable ${this.serviceName}`, { stdio: 'inherit' });
      
      console.log('🚀 启动服务...');
      execSync(`sudo systemctl start ${this.serviceName}`, { stdio: 'inherit' });
      
      console.log('✅ Linux服务安装完成');
    } catch (error) {
      console.error('❌ Linux服务安装失败:', error.message);
      throw error;
    }
  }

  /**
   * 安装macOS服务
   */
  installMacOSService() {
    console.log('🍎 安装macOS服务...');
    
    try {
      const plistFile = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.jobtrack.service</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>${path.join(this.projectRoot, 'backend', 'server.js')}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${this.projectRoot}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(this.projectRoot, 'logs', 'service.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(this.projectRoot, 'logs', 'service.error.log')}</string>
</dict>
</plist>`;

      const plistPath = `${process.env.HOME}/Library/LaunchAgents/com.jobtrack.service.plist`;
      
      console.log('📝 创建LaunchAgent文件...');
      fs.writeFileSync(plistPath, plistFile);
      
      console.log('🔄 加载服务...');
      execSync(`launchctl load ${plistPath}`, { stdio: 'inherit' });
      
      console.log('🚀 启动服务...');
      execSync(`launchctl start com.jobtrack.service`, { stdio: 'inherit' });
      
      console.log('✅ macOS服务安装完成');
    } catch (error) {
      console.error('❌ macOS服务安装失败:', error.message);
      throw error;
    }
  }

  /**
   * 卸载服务
   */
  uninstallService() {
    const os = this.detectOS();
    
    try {
      switch (os) {
        case 'windows':
          this.uninstallWindowsService();
          break;
        case 'linux':
          this.uninstallLinuxService();
          break;
        case 'macos':
          this.uninstallMacOSService();
          break;
      }
      console.log('✅ 服务卸载完成');
    } catch (error) {
      console.error('❌ 服务卸载失败:', error.message);
      throw error;
    }
  }

  uninstallWindowsService() {
    console.log('🪟 卸载Windows服务...');
    execSync(`sc delete ${this.serviceName}`, { stdio: 'inherit' });
  }

  uninstallLinuxService() {
    console.log('🐧 卸载Linux服务...');
    execSync(`sudo systemctl stop ${this.serviceName}`, { stdio: 'inherit' });
    execSync(`sudo systemctl disable ${this.serviceName}`, { stdio: 'inherit' });
    execSync(`sudo rm /etc/systemd/system/${this.serviceName}.service`, { stdio: 'inherit' });
    execSync('sudo systemctl daemon-reload', { stdio: 'inherit' });
  }

  uninstallMacOSService() {
    console.log('🍎 卸载macOS服务...');
    execSync('launchctl unload ~/Library/LaunchAgents/com.jobtrack.service.plist', { stdio: 'inherit' });
    execSync('rm ~/Library/LaunchAgents/com.jobtrack.service.plist', { stdio: 'inherit' });
  }

  /**
   * 检查服务状态
   */
  checkServiceStatus() {
    const os = this.detectOS();
    
    try {
      switch (os) {
        case 'windows':
          const result = execSync(`sc query ${this.serviceName}`, { encoding: 'utf8' });
          return result.includes('RUNNING');
        case 'linux':
          const status = execSync(`systemctl is-active ${this.serviceName}`, { encoding: 'utf8' }).trim();
          return status === 'active';
        case 'macos':
          const launchctl = execSync('launchctl list | grep com.jobtrack.service', { encoding: 'utf8' });
          return launchctl.length > 0;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 安装服务
   */
  async install() {
    console.log('🚀 开始安装JobTrack系统服务...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const os = this.detectOS();
    console.log(`🖥️  检测到操作系统: ${os}`);
    
    try {
      switch (os) {
        case 'windows':
          this.installWindowsService();
          break;
        case 'linux':
          this.installLinuxService();
          break;
        case 'macos':
          this.installMacOSService();
          break;
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ JobTrack系统服务安装完成！');
      console.log('🔄 服务将在系统启动时自动运行');
      console.log('📝 用户只需连接Gmail一次，之后完全自动化');
      
    } catch (error) {
      console.error('❌ 服务安装失败:', error.message);
      process.exit(1);
    }
  }
}

// 命令行接口
if (require.main === module) {
  const installer = new ServiceInstaller();
  const command = process.argv[2];
  
  switch (command) {
    case 'install':
      installer.install();
      break;
    case 'uninstall':
      installer.uninstallService();
      break;
    case 'status':
      const status = installer.checkServiceStatus();
      console.log(`服务状态: ${status ? '运行中' : '未运行'}`);
      break;
    default:
      console.log('用法:');
      console.log('  node install-service.js install    - 安装服务');
      console.log('  node install-service.js uninstall  - 卸载服务');
      console.log('  node install-service.js status     - 检查状态');
  }
}

module.exports = ServiceInstaller;
