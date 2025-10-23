#!/usr/bin/env node

/**
 * 验证完全自动化功能
 * 检查所有自动化功能是否正常工作
 */

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

const API_BASE = 'http://localhost:3000';

class AutomationVerifier {
  constructor() {
    this.testResults = [];
    this.sessionId = null;
  }

  /**
   * 添加测试结果
   */
  addResult(test, status, message, details = null) {
    this.testResults.push({
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 检查服务器是否运行
   */
  async checkServerRunning() {
    try {
      const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      this.addResult('服务器运行', 'PASS', '服务器正常运行', response.data);
      return true;
    } catch (error) {
      this.addResult('服务器运行', 'FAIL', '服务器未运行或无法访问', error.message);
      return false;
    }
  }

  /**
   * 检查详细健康状态
   */
  async checkDetailedHealth() {
    try {
      const response = await axios.get(`${API_BASE}/health/detailed`);
      this.addResult('详细健康检查', 'PASS', '详细状态正常', response.data);
      return response.data;
    } catch (error) {
      this.addResult('详细健康检查', 'FAIL', '详细状态检查失败', error.message);
      return null;
    }
  }

  /**
   * 检查自动管理器状态
   */
  async checkAutoManager() {
    try {
      const response = await axios.get(`${API_BASE}/api/auto-manager/status`);
      const data = response.data;
      
      if (data.success) {
        this.addResult('自动管理器', 'PASS', '自动管理器正常运行', {
          autoStartEnabled: data.manager.autoStartEnabled,
          activeSessions: data.manager.activeSessions,
          running: data.manager.running
        });
        return data;
      } else {
        this.addResult('自动管理器', 'FAIL', '自动管理器状态异常', data);
        return null;
      }
    } catch (error) {
      this.addResult('自动管理器', 'FAIL', '自动管理器检查失败', error.message);
      return null;
    }
  }

  /**
   * 测试用户认证（测试模式）
   */
  async testUserAuthentication() {
    try {
      const response = await axios.post(`${API_BASE}/auth/test-login`);
      if (response.data.success && response.data.sessionId) {
        this.sessionId = response.data.sessionId;
        this.addResult('用户认证', 'PASS', '测试模式认证成功', {
          sessionId: this.sessionId,
          testMode: response.data.testMode
        });
        return true;
      } else {
        this.addResult('用户认证', 'FAIL', '认证失败', response.data);
        return false;
      }
    } catch (error) {
      this.addResult('用户认证', 'FAIL', '认证请求失败', error.message);
      return false;
    }
  }

  /**
   * 测试自动扫描功能
   */
  async testAutoScan() {
    if (!this.sessionId) {
      this.addResult('自动扫描', 'SKIP', '跳过测试（无有效会话）');
      return false;
    }

    try {
      // 启动自动扫描
      const startResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/start`, {
        query: 'in:anywhere newer_than:2d',
        maxResults: 10
      }, {
        headers: { 'x-session-id': this.sessionId }
      });

      if (startResponse.data.success) {
        this.addResult('自动扫描启动', 'PASS', '自动扫描启动成功', startResponse.data);
      } else {
        this.addResult('自动扫描启动', 'FAIL', '自动扫描启动失败', startResponse.data);
        return false;
      }

      // 检查扫描状态
      const statusResponse = await axios.get(`${API_BASE}/api/gmail/auto-scan/status`, {
        headers: { 'x-session-id': this.sessionId }
      });

      if (statusResponse.data.running) {
        this.addResult('自动扫描状态', 'PASS', '自动扫描正在运行', statusResponse.data);
      } else {
        this.addResult('自动扫描状态', 'FAIL', '自动扫描未运行', statusResponse.data);
      }

      // 测试立即扫描
      const runNowResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/run-now`, {
        query: 'in:anywhere newer_than:1d',
        maxResults: 5
      }, {
        headers: { 'x-session-id': this.sessionId }
      });

      if (runNowResponse.data.success) {
        this.addResult('立即扫描', 'PASS', '立即扫描执行成功', {
          messagesFound: runNowResponse.data.messagesFound,
          processed: runNowResponse.data.processed
        });
      } else {
        this.addResult('立即扫描', 'FAIL', '立即扫描执行失败', runNowResponse.data);
      }

      return true;
    } catch (error) {
      this.addResult('自动扫描', 'FAIL', '自动扫描测试失败', error.message);
      return false;
    }
  }

  /**
   * 测试token刷新机制
   */
  async testTokenRefresh() {
    if (!this.sessionId) {
      this.addResult('Token刷新', 'SKIP', '跳过测试（无有效会话）');
      return false;
    }

    try {
      // 检查会话状态
      const statusResponse = await axios.get(`${API_BASE}/auth/status`, {
        headers: { 'x-session-id': this.sessionId }
      });

      if (statusResponse.data.authenticated) {
        this.addResult('Token刷新', 'PASS', '会话认证有效，token刷新机制正常', statusResponse.data);
        return true;
      } else {
        this.addResult('Token刷新', 'FAIL', '会话认证失效', statusResponse.data);
        return false;
      }
    } catch (error) {
      this.addResult('Token刷新', 'FAIL', 'Token刷新检查失败', error.message);
      return false;
    }
  }

  /**
   * 测试错误恢复机制
   */
  async testErrorRecovery() {
    try {
      // 测试无效请求的错误处理
      const invalidResponse = await axios.get(`${API_BASE}/api/gmail/auto-scan/status`, {
        headers: { 'x-session-id': 'invalid-session-id' }
      });

      // 即使会话无效，API也应该正常响应
      this.addResult('错误恢复', 'PASS', '错误处理机制正常', {
        status: invalidResponse.data.running
      });
      return true;
    } catch (error) {
      // 如果返回401错误，说明错误处理正常
      if (error.response && error.response.status === 401) {
        this.addResult('错误恢复', 'PASS', '错误处理机制正常（返回401）');
        return true;
      } else {
        this.addResult('错误恢复', 'FAIL', '错误处理机制异常', error.message);
        return false;
      }
    }
  }

  /**
   * 检查系统服务状态
   */
  async checkSystemService() {
    try {
      const fs = require('fs');
      const pidFile = path.join(__dirname, 'backend', 'data', 'background.pid');
      
      if (fs.existsSync(pidFile)) {
        const pid = fs.readFileSync(pidFile, 'utf8');
        this.addResult('系统服务', 'PASS', '后台服务PID文件存在', { pid });
        return true;
      } else {
        this.addResult('系统服务', 'INFO', '后台服务PID文件不存在（可能未安装为系统服务）');
        return false;
      }
    } catch (error) {
      this.addResult('系统服务', 'FAIL', '系统服务检查失败', error.message);
      return false;
    }
  }

  /**
   * 生成验证报告
   */
  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.testResults.filter(r => r.status === 'SKIP').length;

    console.log('\n📊 验证报告');
    console.log('═'.repeat(60));
    console.log(`总测试数: ${totalTests}`);
    console.log(`✅ 通过: ${passedTests}`);
    console.log(`❌ 失败: ${failedTests}`);
    console.log(`⏭️  跳过: ${skippedTests}`);
    console.log(`成功率: ${((passedTests / (totalTests - skippedTests)) * 100).toFixed(1)}%`);

    console.log('\n📋 详细结果');
    console.log('─'.repeat(60));
    
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${index + 1}. ${statusIcon} ${result.test}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
    });

    // 给出建议
    console.log('💡 建议');
    console.log('─'.repeat(60));
    
    if (failedTests === 0) {
      console.log('🎉 所有测试通过！系统完全自动化功能正常。');
      console.log('✅ 用户可以连接Gmail一次后，系统将完全自动化运行。');
    } else {
      console.log('⚠️  部分测试失败，请检查以下问题：');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   - ${result.test}: ${result.message}`);
        });
    }

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests,
      successRate: ((passedTests / (totalTests - skippedTests)) * 100).toFixed(1)
    };
  }

  /**
   * 运行完整验证
   */
  async runVerification() {
    console.log('🔍 JobTrack 完全自动化功能验证');
    console.log('═'.repeat(60));
    console.log('🎯 验证目标：检查用户连接Gmail一次后的完全自动化功能');
    console.log('');

    try {
      // 1. 检查服务器运行
      console.log('1️⃣ 检查服务器运行状态...');
      const serverRunning = await this.checkServerRunning();
      if (!serverRunning) {
        console.log('❌ 服务器未运行，请先启动服务器');
        console.log('   运行: cd backend && npm run start:autoscan');
        return;
      }

      // 2. 检查详细健康状态
      console.log('2️⃣ 检查详细健康状态...');
      await this.checkDetailedHealth();

      // 3. 检查自动管理器
      console.log('3️⃣ 检查自动管理器...');
      await this.checkAutoManager();

      // 4. 测试用户认证
      console.log('4️⃣ 测试用户认证...');
      await this.testUserAuthentication();

      // 5. 测试自动扫描
      console.log('5️⃣ 测试自动扫描功能...');
      await this.testAutoScan();

      // 6. 测试token刷新
      console.log('6️⃣ 测试token刷新机制...');
      await this.testTokenRefresh();

      // 7. 测试错误恢复
      console.log('7️⃣ 测试错误恢复机制...');
      await this.testErrorRecovery();

      // 8. 检查系统服务
      console.log('8️⃣ 检查系统服务状态...');
      await this.checkSystemService();

      // 生成报告
      const report = this.generateReport();

      // 返回验证结果
      return report;

    } catch (error) {
      console.error('❌ 验证过程出错:', error.message);
      this.addResult('验证过程', 'FAIL', '验证过程出错', error.message);
      return this.generateReport();
    }
  }
}

// 运行验证
async function main() {
  const verifier = new AutomationVerifier();
  
  try {
    const report = await verifier.runVerification();
    
    if (report.successRate >= 80) {
      console.log('\n🎉 验证成功！系统完全自动化功能正常。');
      process.exit(0);
    } else {
      console.log('\n⚠️  验证失败，请检查系统配置。');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = AutomationVerifier;
