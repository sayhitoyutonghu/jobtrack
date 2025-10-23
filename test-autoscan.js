#!/usr/bin/env node

/**
 * 测试自动扫描功能
 * 这个脚本会测试自动扫描的各个功能
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testAutoScan() {
  console.log('🧪 Testing Auto-Scan Functionality');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. 检查服务器健康状态
    console.log('1. Checking server health...');
    const healthResponse = await axios.get(`${API_BASE}/health/detailed`);
    console.log('✅ Server is healthy');
    console.log(`   Sessions: ${healthResponse.data.services.sessions.count}`);
    console.log(`   Auto-scan sessions: ${healthResponse.data.services.autoScan.activeSessions}`);

    // 2. 测试登录（测试模式）
    console.log('\n2. Testing test mode login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/test-login`);
    const sessionId = loginResponse.data.sessionId;
    console.log(`✅ Test login successful: ${sessionId}`);

    // 3. 测试自动扫描状态
    console.log('\n3. Checking auto-scan status...');
    const statusResponse = await axios.get(`${API_BASE}/api/gmail/auto-scan/status`, {
      headers: { 'x-session-id': sessionId }
    });
    console.log(`✅ Auto-scan status: ${statusResponse.data.running ? 'Running' : 'Stopped'}`);

    // 4. 测试启动自动扫描
    console.log('\n4. Starting auto-scan...');
    const startResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/start`, {
      query: 'in:anywhere newer_than:1d',
      maxResults: 10
    }, {
      headers: { 'x-session-id': sessionId }
    });
    console.log(`✅ Auto-scan started: ${startResponse.data.running}`);

    // 5. 等待几秒钟
    console.log('\n5. Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. 检查状态
    console.log('\n6. Checking status after start...');
    const statusResponse2 = await axios.get(`${API_BASE}/api/gmail/auto-scan/status`, {
      headers: { 'x-session-id': sessionId }
    });
    console.log(`✅ Status: ${JSON.stringify(statusResponse2.data, null, 2)}`);

    // 7. 测试立即扫描
    console.log('\n7. Testing immediate scan...');
    const runNowResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/run-now`, {
      query: 'in:anywhere newer_than:1d',
      maxResults: 5
    }, {
      headers: { 'x-session-id': sessionId }
    });
    console.log(`✅ Immediate scan completed: ${runNowResponse.data.processed} processed`);

    // 8. 测试获取历史
    console.log('\n8. Getting scan history...');
    const historyResponse = await axios.get(`${API_BASE}/api/gmail/auto-scan/history`, {
      headers: { 'x-session-id': sessionId }
    });
    console.log(`✅ History: ${JSON.stringify(historyResponse.data.history, null, 2)}`);

    // 9. 停止自动扫描
    console.log('\n9. Stopping auto-scan...');
    const stopResponse = await axios.post(`${API_BASE}/api/gmail/auto-scan/stop`, {}, {
      headers: { 'x-session-id': sessionId }
    });
    console.log(`✅ Auto-scan stopped: ${!stopResponse.data.running}`);

    console.log('\n🎉 All tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testAutoScan();
}

module.exports = testAutoScan;

