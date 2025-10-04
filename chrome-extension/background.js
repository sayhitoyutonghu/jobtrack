// Background Service Worker for JobTrack Chrome Extension

const API_BASE_URL = 'http://localhost:5000';

// API 调用函数
async function classifyEmail(subject, body) {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: subject || '',
        body: body || ''
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      label: result.label,
      confidence: result.confidence,
      probabilities: result.probabilities
    };
  } catch (error) {
    console.error('Email classification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 检查 API 健康状态
async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return {
      healthy: data.status === 'healthy',
      modelLoaded: data.model_loaded,
      vectorizerLoaded: data.vectorizer_loaded
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}

// 获取所有分类
async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const data = await response.json();
    return {
      success: true,
      categories: data.categories
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'classifyEmail') {
    classifyEmail(request.subject, request.body)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放以进行异步响应
  }

  if (request.action === 'checkHealth') {
    checkAPIHealth()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ healthy: false, error: error.message }));
    return true;
  }

  if (request.action === 'getCategories') {
    getCategories()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('JobTrack Extension installed');
  
  // 设置默认配置
  chrome.storage.sync.set({
    enabled: true,
    autoClassify: true,
    apiUrl: API_BASE_URL
  });
});

console.log('JobTrack Background Service Worker loaded');
