#!/usr/bin/env node

/**
 * 启动带有自动扫描功能的后端服务
 * 这个脚本会启动服务器并初始化自动扫描功能
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting JobTrack Backend with Auto-Scan...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 启动服务器
const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    AUTO_SCAN_ENABLED: 'true'
  }
});

// 处理进程退出
serverProcess.on('exit', (code) => {
  console.log(`\n📡 Server process exited with code ${code}`);
  process.exit(code);
});

// 处理错误
serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
});

console.log('✅ Backend server started with auto-scan enabled');
console.log('📡 Server: http://localhost:3000');
console.log('❤️  Health: http://localhost:3000/health');
console.log('🔍 Detailed: http://localhost:3000/health/detailed');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

