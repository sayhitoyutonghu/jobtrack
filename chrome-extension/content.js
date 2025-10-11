// Content Script for Gmail Integration

console.log('JobTrack Content Script loaded');

// 分类标签颜色映射
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

// 提取邮件主题 - 支持多种 Gmail 界面
function getEmailSubject() {
  // 尝试多个可能的选择器
  const selectors = [
    'h2.hP',           // 旧版 Gmail
    '[data-legacy-thread-id] h2',  // 新版
    '.ha h2',          // 另一种布局
    'h2[data-thread-perm-id]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      console.log('Found subject with selector:', selector);
      return element.textContent.trim();
    }
  }
  
  console.warn('Could not find email subject');
  return '';
}

// 提取邮件正文 - 支持多种 Gmail 界面
function getEmailBody() {
  // 尝试多个可能的选择器
  const selectors = [
    '.a3s.aiL',        // 标准邮件正文
    '.ii.gt',          // 另一种布局
    '[data-message-id] .a3s',
    '.gs .ii'
  ];
  
  let bodyText = '';
  
  for (const selector of selectors) {
    const bodyElements = document.querySelectorAll(selector);
    if (bodyElements.length > 0) {
      console.log('Found body with selector:', selector, 'Count:', bodyElements.length);
      bodyElements.forEach(element => {
        bodyText += element.textContent.trim() + ' ';
      });
      break;
    }
  }
  
  if (!bodyText) {
    console.warn('Could not find email body');
  }
  
  return bodyText.trim();
}

// 创建分类标签
function createCategoryLabel(category, confidence) {
  const existingLabel = document.querySelector('.jobtrack-label');
  if (existingLabel) {
    existingLabel.remove();
  }

  const label = document.createElement('div');
  label.className = 'jobtrack-label';
  label.style.cssText = `
    display: inline-flex !important;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    margin: 12px 0;
    background-color: ${CATEGORY_COLORS[category] || '#999'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    position: relative;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;

  label.innerHTML = `
    <span>🏷️ ${category}</span>
    <span style="opacity: 0.9; font-size: 12px; font-weight: 500;">${(confidence * 100).toFixed(0)}%</span>
  `;

  return label;
}

// 查找插入标签的位置
function findInsertionPoint() {
  const selectors = [
    'h2.hP',
    '[data-legacy-thread-id] h2',
    '.ha h2',
    'h2[data-thread-perm-id]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  
  return null;
}

// 显示加载状态
function showLoadingIndicator() {
  const existingIndicator = document.querySelector('.jobtrack-loading');
  if (existingIndicator) return;

  const loading = document.createElement('div');
  loading.className = 'jobtrack-loading';
  loading.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    margin: 8px 0;
    background-color: #f0f0f0;
    color: #666;
    border-radius: 6px;
    font-size: 13px;
    position: relative;
    z-index: 1000;
  `;
  loading.innerHTML = `
    <span>🔄</span>
    <span>Classifying email...</span>
  `;

  const insertPoint = findInsertionPoint();
  if (insertPoint && insertPoint.parentElement) {
    insertPoint.parentElement.insertBefore(loading, insertPoint.nextSibling);
  } else {
    // 备用方案：添加到页面顶部
    const container = document.querySelector('.nH.if');
    if (container) {
      container.insertBefore(loading, container.firstChild);
    }
  }
}

// 移除加载状态
function removeLoadingIndicator() {
  const loading = document.querySelector('.jobtrack-loading');
  if (loading) {
    loading.remove();
  }
}

// 分类当前邮件
async function classifyCurrentEmail() {
  const subject = getEmailSubject();
  const body = getEmailBody();

  if (!subject && !body) {
    console.log('No email content found');
    return;
  }

  console.log('Classifying email:', { subject: subject.substring(0, 50) });
  showLoadingIndicator();

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'classifyEmail',
      subject: subject,
      body: body
    });

    removeLoadingIndicator();

    if (response.success) {
      console.log('Classification result:', response);
      
      const label = createCategoryLabel(response.label, response.confidence);
      
      // 尝试多个插入位置
      let inserted = false;
      
      // 方案1: 邮件主题附近
      const insertPoint = findInsertionPoint();
      if (insertPoint) {
        // 尝试在主题的父容器中插入
        const container = insertPoint.closest('.gs') || insertPoint.closest('.adn') || insertPoint.parentElement;
        if (container) {
          container.insertBefore(label, insertPoint);
          console.log('✅ Label inserted near subject');
          inserted = true;
        }
      }
      
      // 方案2: 邮件头部区域
      if (!inserted) {
        const headerArea = document.querySelector('.ha') || document.querySelector('.gE.iv.gt');
        if (headerArea) {
          headerArea.appendChild(label);
          console.log('✅ Label inserted in header area');
          inserted = true;
        }
      }
      
      // 方案3: 创建固定位置标签
      if (!inserted) {
        label.style.position = 'fixed';
        label.style.top = '80px';
        label.style.right = '20px';
        label.style.zIndex = '10000';
        document.body.appendChild(label);
        console.log('✅ Label inserted as fixed position');
        inserted = true;
      }

      // 保存分类结果到存储
      chrome.storage.local.set({
        [`email_${subject}`]: {
          label: response.label,
          confidence: response.confidence,
          timestamp: Date.now()
        }
      });
    } else {
      console.error('Classification failed:', response.error);
      showErrorMessage(response.error);
    }
  } catch (error) {
    removeLoadingIndicator();
    console.error('Error classifying email:', error);
    showErrorMessage(error.message);
  }
}

// 显示错误消息
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'jobtrack-error';
  errorDiv.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    margin: 8px 0;
    background-color: #ff4444;
    color: white;
    border-radius: 6px;
    font-size: 13px;
  `;
  errorDiv.innerHTML = `
    <span>⚠️</span>
    <span>API Error: ${message}</span>
  `;

  const subjectElement = document.querySelector('h2.hP');
  if (subjectElement && subjectElement.parentElement) {
    subjectElement.parentElement.insertBefore(errorDiv, subjectElement.nextSibling);
  }

  setTimeout(() => errorDiv.remove(), 5000);
}

// 添加分类按钮到 Gmail 工具栏
function addClassifyButton() {
  const existingButton = document.querySelector('.jobtrack-classify-btn');
  if (existingButton) return;

  // 尝试多个可能的工具栏位置
  const toolbarSelectors = [
    '.iH',           // 标准工具栏
    '[gh="tm"]',     // 另一种布局
    '.G-atb'         // 备用
  ];
  
  let toolbar = null;
  for (const selector of toolbarSelectors) {
    toolbar = document.querySelector(selector);
    if (toolbar) {
      console.log('Found toolbar with selector:', selector);
      break;
    }
  }
  
  if (!toolbar) {
    console.warn('Could not find Gmail toolbar');
    // 创建浮动按钮作为备用
    createFloatingButton();
    return;
  }

  const button = document.createElement('button');
  button.className = 'jobtrack-classify-btn';
  button.style.cssText = `
    padding: 8px 16px;
    margin: 0 8px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    z-index: 1000;
  `;
  button.innerHTML = `
    <span>🏷️</span>
    <span>Classify Email</span>
  `;

  button.addEventListener('click', () => {
    console.log('Classify button clicked');
    classifyCurrentEmail();
  });
  
  toolbar.appendChild(button);
  console.log('Classify button added to toolbar');
}

// 创建浮动按钮（备用方案）
function createFloatingButton() {
  const existingButton = document.querySelector('.jobtrack-floating-btn');
  if (existingButton) return;
  
  const button = document.createElement('button');
  button.className = 'jobtrack-floating-btn';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  `;
  button.innerHTML = `
    <span>🏷️</span>
    <span>Classify Email</span>
  `;
  
  button.addEventListener('click', () => {
    console.log('Floating classify button clicked');
    classifyCurrentEmail();
  });
  
  document.body.appendChild(button);
  console.log('Floating classify button created');
}

// 监听 URL 变化（Gmail 是单页应用）
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    
    // 如果打开了邮件详情页
    if (url.includes('/mail/u/')) {
      setTimeout(() => {
        addClassifyButton();
        
        // 检查是否启用自动分类
        chrome.storage.sync.get(['autoClassify'], (result) => {
          if (result.autoClassify !== false) {
            classifyCurrentEmail();
          }
        });
      }, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });

// 初始化
setTimeout(() => {
  if (location.href.includes('/mail/u/')) {
    addClassifyButton();
    
    chrome.storage.sync.get(['autoClassify'], (result) => {
      if (result.autoClassify !== false) {
        classifyCurrentEmail();
      }
    });
  }
}, 2000);
