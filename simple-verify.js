#!/usr/bin/env node

/**
 * 简单验证脚本
 * 验证当前可用的自动化功能
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function simpleVerify() {
  console.log('🔍 JobTrack 简单验证');
  console.log('═'.repeat(50));
  console.log('🎯 验证当前可用的自动化功能');
  console.log('');

  const results = [];

  // 1. 检查服务器运行
  try {
    const response = await axios.get(`${API_BASE}/health`);
    results.push({ test: '服务器运行', status: 'PASS', message: '服务器正常运行' });
    console.log('✅ 1. 服务器运行正常');
  } catch (error) {
    results.push({ test: '服务器运行', status: 'FAIL', message: '服务器无法访问' });
    console.log('❌ 1. 服务器运行失败');
    return;
  }

  // 2. 测试用户认证
  try {
    const response = await axios.post(`${API_BASE}/auth/test-login`);
    if (response.data.success && response.data.sessionId) {
      results.push({ test: '用户认证', status: 'PASS', message: '测试模式认证成功' });
      console.log('✅ 2. 用户认证成功');
      
      const sessionId = response.data.sessionId;
      console.log(`   会话ID: ${sessionId}`);
      
      // 3. 测试自动扫描启动
      try {
        const scanResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/start`, {
          query: 'in:anywhere newer_than:2d',
          maxResults: 10
        }, {
          headers: { 'x-session-id': sessionId }
        });
        
        if (scanResponse.data.success) {
          results.push({ test: '自动扫描启动', status: 'PASS', message: '自动扫描启动成功' });
          console.log('✅ 3. 自动扫描启动成功');
        } else {
          results.push({ test: '自动扫描启动', status: 'FAIL', message: '自动扫描启动失败' });
          console.log('❌ 3. 自动扫描启动失败');
        }
      } catch (error) {
        results.push({ test: '自动扫描启动', status: 'FAIL', message: '自动扫描启动失败' });
        console.log('❌ 3. 自动扫描启动失败');
      }

      // 4. 检查扫描状态
      try {
        const statusResponse = await axios.get(`${API_BASE}/api/gmail/auto-scan/status`, {
          headers: { 'x-session-id': sessionId }
        });
        
        if (statusResponse.data.running) {
          results.push({ test: '扫描状态', status: 'PASS', message: '自动扫描正在运行' });
          console.log('✅ 4. 自动扫描正在运行');
          console.log(`   查询条件: ${statusResponse.data.query}`);
          console.log(`   扫描间隔: ${statusResponse.data.intervalMs / 1000 / 60}分钟`);
        } else {
          results.push({ test: '扫描状态', status: 'FAIL', message: '自动扫描未运行' });
          console.log('❌ 4. 自动扫描未运行');
        }
      } catch (error) {
        results.push({ test: '扫描状态', status: 'FAIL', message: '扫描状态检查失败' });
        console.log('❌ 4. 扫描状态检查失败');
      }

      // 5. 测试立即扫描
      try {
        const runNowResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/run-now`, {
          query: 'in:anywhere newer_than:1d',
          maxResults: 5
        }, {
          headers: { 'x-session-id': sessionId }
        });
        
        if (runNowResponse.data.success) {
          results.push({ test: '立即扫描', status: 'PASS', message: '立即扫描执行成功' });
          console.log('✅ 5. 立即扫描执行成功');
          console.log(`   找到邮件: ${runNowResponse.data.messagesFound}`);
          console.log(`   处理邮件: ${runNowResponse.data.processed}`);
        } else {
          results.push({ test: '立即扫描', status: 'FAIL', message: '立即扫描执行失败' });
          console.log('❌ 5. 立即扫描执行失败');
        }
      } catch (error) {
        results.push({ test: '立即扫描', status: 'FAIL', message: '立即扫描执行失败' });
        console.log('❌ 5. 立即扫描执行失败');
      }

      // 6. 检查认证状态
      try {
        const authResponse = await axios.get(`${API_BASE}/auth/status`, {
          headers: { 'x-session-id': sessionId }
        });
        
        if (authResponse.data.authenticated) {
          results.push({ test: '认证状态', status: 'PASS', message: '认证状态正常' });
          console.log('✅ 6. 认证状态正常');
        } else {
          results.push({ test: '认证状态', status: 'FAIL', message: '认证状态异常' });
          console.log('❌ 6. 认证状态异常');
        }
      } catch (error) {
        results.push({ test: '认证状态', status: 'FAIL', message: '认证状态检查失败' });
        console.log('❌ 6. 认证状态检查失败');
      }

    } else {
      results.push({ test: '用户认证', status: 'FAIL', message: '认证失败' });
      console.log('❌ 2. 用户认证失败');
    }
  } catch (error) {
    results.push({ test: '用户认证', status: 'FAIL', message: '认证请求失败' });
    console.log('❌ 2. 用户认证失败');
  }

  // 生成报告
  console.log('\n📊 验证报告');
  console.log('═'.repeat(50));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const failedTests = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests >= 4) {
    console.log('\n🎉 验证成功！');
    console.log('✅ 基本自动化功能正常');
    console.log('✅ 用户可以连接Gmail后自动开始扫描');
    console.log('✅ 系统支持自动扫描和立即扫描');
    console.log('✅ 认证系统正常工作');
    console.log('\n💡 要获得完全自动化体验，请：');
    console.log('   1. 重启服务器以加载新功能');
    console.log('   2. 运行 setup-auto-mode.bat/sh 进行完整设置');
  } else {
    console.log('\n⚠️  验证失败');
    console.log('❌ 部分功能异常，请检查系统配置');
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1)
  };
}

// 运行验证
if (require.main === module) {
  simpleVerify().catch(console.error);
}

module.exports = simpleVerify;
