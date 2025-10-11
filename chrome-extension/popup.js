// Popup Script for JobTrack Extension

const CATEGORY_COLORS = {
  'Applied': '#FF6B6B',
  'Response Needed': '#4ECDC4',
  'Interview Scheduled': '#FFD93D',
  'Offer': '#6BCF7F',
  'Rejected': '#95A5A6',
  'Status Update': '#A29BFE',
  'Recruiter Outreach': '#FD79A8',
  'Job Alert': '#74B9FF'
};

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const enabledToggle = document.getElementById('enabledToggle');
const autoClassifyToggle = document.getElementById('autoClassifyToggle');
const categoriesList = document.getElementById('categoriesList');
const totalClassified = document.getElementById('totalClassified');
const avgConfidence = document.getElementById('avgConfidence');
const refreshStatusBtn = document.getElementById('refreshStatus');
const testConnectionBtn = document.getElementById('testConnection');
const clearDataBtn = document.getElementById('clearData');

// 检查 API 状态
async function checkAPIStatus() {
  statusText.textContent = 'Checking...';
  statusDot.className = 'status-dot';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkHealth' });
    
    if (response.healthy) {
      statusDot.className = 'status-dot healthy';
      statusText.textContent = 'API Connected';
    } else {
      statusDot.className = 'status-dot error';
      statusText.textContent = 'API Disconnected';
    }
  } catch (error) {
    statusDot.className = 'status-dot error';
    statusText.textContent = 'Connection Error';
  }
}

// 加载分类列表
async function loadCategories() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCategories' });
    
    if (response.success && response.categories) {
      categoriesList.innerHTML = '';
      
      response.categories.forEach(category => {
        const badge = document.createElement('span');
        badge.className = 'category-badge';
        badge.textContent = category;
        badge.style.backgroundColor = CATEGORY_COLORS[category] || '#999';
        categoriesList.appendChild(badge);
      });
    } else {
      categoriesList.innerHTML = '<div class="loading">Failed to load categories</div>';
    }
  } catch (error) {
    categoriesList.innerHTML = '<div class="loading">Error loading categories</div>';
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const data = await chrome.storage.local.get(null);
    const emails = Object.keys(data).filter(key => key.startsWith('email_'));
    
    totalClassified.textContent = emails.length;
    
    if (emails.length > 0) {
      const confidences = emails.map(key => data[key].confidence);
      const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      avgConfidence.textContent = `${(avgConf * 100).toFixed(0)}%`;
    } else {
      avgConfidence.textContent = '0%';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// 加载设置
async function loadSettings() {
  const settings = await chrome.storage.sync.get(['enabled', 'autoClassify']);
  
  enabledToggle.checked = settings.enabled !== false;
  autoClassifyToggle.checked = settings.autoClassify !== false;
}

// 保存设置
function saveSettings() {
  chrome.storage.sync.set({
    enabled: enabledToggle.checked,
    autoClassify: autoClassifyToggle.checked
  });
}

// 测试连接
async function testConnection() {
  testConnectionBtn.textContent = 'Testing...';
  testConnectionBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'classifyEmail',
      subject: 'Test Email',
      body: 'This is a test email to verify the API connection.'
    });

    if (response.success) {
      alert(`✅ Connection successful!\n\nTest classification: ${response.label}\nConfidence: ${(response.confidence * 100).toFixed(1)}%`);
    } else {
      alert(`❌ Connection failed!\n\nError: ${response.error}`);
    }
  } catch (error) {
    alert(`❌ Connection failed!\n\nError: ${error.message}`);
  } finally {
    testConnectionBtn.textContent = 'Test API Connection';
    testConnectionBtn.disabled = false;
  }
}

// 清除数据
async function clearData() {
  if (confirm('Are you sure you want to clear all classification data?')) {
    await chrome.storage.local.clear();
    loadStats();
    alert('✅ Data cleared successfully!');
  }
}

// 事件监听器
refreshStatusBtn.addEventListener('click', checkAPIStatus);
testConnectionBtn.addEventListener('click', testConnection);
clearDataBtn.addEventListener('click', clearData);
enabledToggle.addEventListener('change', saveSettings);
autoClassifyToggle.addEventListener('change', saveSettings);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAPIStatus();
  loadCategories();
  loadStats();
  loadSettings();
});
