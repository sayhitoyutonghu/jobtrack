#!/usr/bin/env node

/**
 * 完全自动化功能演示脚本
 * 展示用户连接Gmail一次后的完全自动化体验
 */

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

const API_BASE = 'http://localhost:3000';

class FullyAutomatedDemo {
  constructor() {
    this.sessionId = null;
    this.demoSteps = [];
  }

  /**
   * 添加演示步骤
   */
  addStep(description, action) {
    this.demoSteps.push({ description, action });
  }

  /**
   * 执行演示步骤
   */
  async executeStep(step, index) {
    console.log(`\n📋 步骤 ${index + 1}: ${step.description}`);
    console.log('━'.repeat(50));
    
    try {
      await step.action();
      console.log('✅ 完成');
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 运行完整演示
   */
  async runDemo() {
    console.log('🎬 JobTrack 完全自动化功能演示');
    console.log('═'.repeat(60));
    console.log('🎯 目标：展示用户连接Gmail一次后的完全自动化体验');
    console.log('');

    // 设置演示步骤
    this.setupDemoSteps();

    try {
      // 执行所有步骤
      for (let i = 0; i < this.demoSteps.length; i++) {
        await this.executeStep(this.demoSteps[i], i);
        await this.sleep(2000); // 等待2秒
      }

      console.log('\n🎉 演示完成！');
      console.log('═'.repeat(60));
      console.log('✅ 用户只需连接Gmail一次，系统将完全自动化运行');
      console.log('✅ 自动token刷新，无需重新登录');
      console.log('✅ 自动启动扫描，无需手动操作');
      console.log('✅ 后台持续运行，系统重启后自动恢复');
      console.log('✅ 完全零人工干预的自动化体验');

    } catch (error) {
      console.error('\n❌ 演示失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 设置演示步骤
   */
  setupDemoSteps() {
    // 步骤1：检查服务器状态
    this.addStep('检查服务器健康状态', async () => {
      const response = await axios.get(`${API_BASE}/health/detailed`);
      console.log(`   服务器状态: ${response.data.status}`);
      console.log(`   活跃会话: ${response.data.services.sessions.count}`);
      console.log(`   自动扫描会话: ${response.data.services.autoScan.activeSessions}`);
    });

    // 步骤2：需要手动Google OAuth认证
    this.addStep('需要手动Google OAuth认证', async () => {
      console.log('   ⚠️  请访问: http://localhost:3000/auth/google');
      console.log('   认证完成后，请提供session ID继续演示');
      console.log('   ❌ 测试模式已移除，需要真实Gmail认证');
      throw new Error('需要手动Google OAuth认证');
    });

    // 步骤3：检查自动管理器状态
    this.addStep('检查自动管理器状态', async () => {
      const response = await axios.get(`${API_BASE}/api/auto-manager/status`);
      console.log(`   自动启动: ${response.data.manager.autoStartEnabled}`);
      console.log(`   活跃会话: ${response.data.manager.activeSessions}`);
      console.log(`   运行状态: ${response.data.manager.running}`);
    });

    // 步骤4：启动自动扫描
    this.addStep('启动自动扫描（模拟用户连接后的自动行为）', async () => {
      const response = await axios.post(`${API_BASE}/api/gmail/auto-scan/start`, {
        query: 'in:anywhere newer_than:2d',
        maxResults: 10
      }, {
        headers: { 'x-session-id': this.sessionId }
      });
      console.log(`   扫描状态: ${response.data.running ? '运行中' : '已停止'}`);
      console.log(`   查询条件: ${response.data.query}`);
      console.log(`   扫描间隔: ${response.data.intervalMs / 1000 / 60}分钟`);
    });

    // 步骤5：执行立即扫描
    this.addStep('执行立即扫描（展示自动分类功能）', async () => {
      const response = await axios.post(`${API_BASE}/api/gmail/auto-scan/run-now`, {
        query: 'in:anywhere newer_than:1d',
        maxResults: 5
      }, {
        headers: { 'x-session-id': this.sessionId }
      });
      console.log(`   找到邮件: ${response.data.messagesFound}`);
      console.log(`   处理邮件: ${response.data.processed}`);
      if (response.data.results && response.data.results.length > 0) {
        console.log(`   分类结果: ${response.data.results.map(r => r.label).join(', ')}`);
      }
    });

    // 步骤6：检查扫描历史
    this.addStep('检查扫描历史记录', async () => {
      const response = await axios.get(`${API_BASE}/api/gmail/auto-scan/history`, {
        headers: { 'x-session-id': this.sessionId }
      });
      if (response.data.history) {
        console.log(`   最后扫描: ${new Date(response.data.history.timestamp).toLocaleString()}`);
        console.log(`   处理时间: ${response.data.history.duration}ms`);
        console.log(`   处理邮件: ${response.data.history.processed}`);
        console.log(`   错误数量: ${response.data.history.errors}`);
      } else {
        console.log('   暂无扫描历史');
      }
    });

    // 步骤7：展示自动token刷新
    this.addStep('展示自动token刷新机制', async () => {
      console.log('   Token自动刷新功能已启用');
      console.log('   - 提前5分钟自动刷新token');
      console.log('   - 无需用户重新登录');
      console.log('   - 自动处理认证失效');
      console.log('   - 后台持续监控token状态');
    });

    // 步骤8：展示系统重启恢复
    this.addStep('展示系统重启后自动恢复', async () => {
      console.log('   系统重启后自动恢复功能：');
      console.log('   - 自动加载所有用户会话');
      console.log('   - 自动启动所有扫描任务');
      console.log('   - 自动恢复token状态');
      console.log('   - 零人工干预');
    });

    // 步骤9：展示错误自动恢复
    this.addStep('展示错误自动恢复机制', async () => {
      console.log('   错误自动恢复机制：');
      console.log('   - 网络错误自动重试');
      console.log('   - API限流自动等待');
      console.log('   - 认证失效自动停止');
      console.log('   - 错误次数超限自动停止');
      console.log('   - 自动清理无效会话');
    });

    // 步骤10：展示完全自动化体验
    this.addStep('展示完全自动化体验总结', async () => {
      console.log('   🎯 完全自动化体验：');
      console.log('   ✅ 用户连接Gmail一次');
      console.log('   ✅ 系统自动开始扫描');
      console.log('   ✅ 自动token刷新');
      console.log('   ✅ 后台持续运行');
      console.log('   ✅ 系统重启自动恢复');
      console.log('   ✅ 错误自动恢复');
      console.log('   ✅ 零人工干预');
    });
  }

  /**
   * 等待指定时间
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 启动后端服务（如果未运行）
   */
  async ensureServerRunning() {
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ 服务器已在运行');
    } catch (error) {
      console.log('🚀 启动后端服务器...');
      const serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'pipe',
        detached: false
      });

      // 等待服务器启动
      await this.sleep(5000);
      
      try {
        await axios.get(`${API_BASE}/health`);
        console.log('✅ 服务器启动成功');
      } catch (error) {
        throw new Error('服务器启动失败');
      }
    }
  }
}

// 运行演示
async function main() {
  const demo = new FullyAutomatedDemo();
  
  try {
    // 确保服务器运行
    await demo.ensureServerRunning();
    
    // 运行演示
    await demo.runDemo();
    
  } catch (error) {
    console.error('❌ 演示失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = FullyAutomatedDemo;
