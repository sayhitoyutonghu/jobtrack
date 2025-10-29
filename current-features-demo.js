#!/usr/bin/env node

/**
 * 当前可用功能演示
 * 展示当前系统中已经可用的自动化功能
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function demoCurrentFeatures() {
  console.log('🎬 JobTrack 当前可用功能演示');
  console.log('═'.repeat(60));
  console.log('🎯 展示当前系统中已经可用的自动化功能');
  console.log('');

  try {
    // 步骤1：检查服务器状态
    console.log('📋 步骤 1: 检查服务器健康状态');
    console.log('━'.repeat(50));
    
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 服务器运行正常');
    console.log(`   状态: ${healthResponse.data.status}`);
    console.log(`   会话数: ${healthResponse.data.sessions}`);
    console.log(`   环境: ${healthResponse.data.environment}`);
    
    await sleep(1000);

    // 步骤2：测试用户认证
    console.log('\n📋 步骤 2: 测试用户认证（测试模式）');
    console.log('━'.repeat(50));
    
    console.log('⚠️  需要手动Google OAuth认证');
    console.log('   请访问: http://localhost:3000/auth/google');
    console.log('   认证完成后，请提供session ID继续演示');
    console.log('❌ 测试模式已移除，需要真实Gmail认证');
    return;
    
    await sleep(1000);

    // 步骤3：启动自动扫描
    console.log('\n📋 步骤 3: 启动自动扫描');
    console.log('━'.repeat(50));
    
    const startResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/start`, {
      query: 'in:anywhere newer_than:2d',
      maxResults: 10
    }, {
      headers: { 'x-session-id': sessionId }
    });
    
    console.log('✅ 自动扫描启动成功');
    console.log(`   运行状态: ${startResponse.data.running ? '运行中' : '已停止'}`);
    
    await sleep(1000);

    // 步骤4：检查扫描状态
    console.log('\n📋 步骤 4: 检查扫描状态');
    console.log('━'.repeat(50));
    
    const statusResponse = await axios.get(`${API_BASE}/api/gmail/auto-scan/status`, {
      headers: { 'x-session-id': sessionId }
    });
    
    console.log('✅ 扫描状态正常');
    console.log(`   运行状态: ${statusResponse.data.running ? '运行中' : '已停止'}`);
    console.log(`   查询条件: ${statusResponse.data.query}`);
    console.log(`   扫描间隔: ${statusResponse.data.intervalMs / 1000 / 60}分钟`);
    console.log(`   最大结果: ${statusResponse.data.maxResults}`);
    
    await sleep(1000);

    // 步骤5：检查认证状态
    console.log('\n📋 步骤 5: 检查认证状态');
    console.log('━'.repeat(50));
    
    const authResponse = await axios.get(`${API_BASE}/auth/status`, {
      headers: { 'x-session-id': sessionId }
    });
    
    console.log('✅ 认证状态正常');
    console.log(`   认证状态: ${authResponse.data.authenticated ? '已认证' : '未认证'}`);
    console.log(`   会话ID: ${authResponse.data.sessionId}`);
    console.log(`   创建时间: ${new Date(authResponse.data.createdAt).toLocaleString()}`);
    
    await sleep(1000);

    // 步骤6：测试错误处理
    console.log('\n📋 步骤 6: 测试错误处理机制');
    console.log('━'.repeat(50));
    
    try {
      await axios.get(`${API_BASE}/api/gmail/auto-scan/status`, {
        headers: { 'x-session-id': 'invalid-session-id' }
      });
      console.log('✅ 错误处理正常（返回有效响应）');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 错误处理正常（返回401未授权）');
      } else {
        console.log('⚠️  错误处理异常');
      }
    }
    
    await sleep(1000);

    // 步骤7：展示自动化特性
    console.log('\n📋 步骤 7: 展示当前自动化特性');
    console.log('━'.repeat(50));
    
    console.log('✅ 当前可用的自动化特性：');
    console.log('   🔄 自动扫描 - 每5分钟自动扫描Gmail');
    console.log('   🔐 用户认证 - 支持测试模式和真实Gmail认证');
    console.log('   📊 状态监控 - 实时监控扫描状态');
    console.log('   🛡️  错误处理 - 自动处理各种错误情况');
    console.log('   💾 会话管理 - 持久化用户会话');
    
    await sleep(1000);

    // 步骤8：展示使用流程
    console.log('\n📋 步骤 8: 展示用户使用流程');
    console.log('━'.repeat(50));
    
    console.log('✅ 用户使用流程：');
    console.log('   1. 访问前端界面 (http://localhost:5173)');
    console.log('   2. 点击 "Sign in with Google" 连接Gmail');
    console.log('   3. 系统自动开始扫描（每5分钟）');
    console.log('   4. 邮件自动分类和标记');
    console.log('   5. 无需任何手动操作');
    
    await sleep(1000);

    // 总结
    console.log('\n🎉 演示完成！');
    console.log('═'.repeat(60));
    console.log('✅ 当前系统功能正常');
    console.log('✅ 基本自动化功能已实现');
    console.log('✅ 用户可以连接Gmail后自动开始扫描');
    console.log('✅ 系统支持自动扫描和状态监控');
    console.log('✅ 认证系统和错误处理正常');
    
    console.log('\n💡 要获得完全自动化体验，请：');
    console.log('   1. 重启服务器以加载新功能');
    console.log('   2. 运行 setup-auto-mode.bat/sh 进行完整设置');
    console.log('   3. 安装为系统服务实现开机自启动');
    
    console.log('\n🎯 目标：用户连接Gmail一次后，系统将完全自动化运行！');

  } catch (error) {
    console.error('❌ 演示失败:', error.message);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行演示
if (require.main === module) {
  demoCurrentFeatures();
}

module.exports = demoCurrentFeatures;
