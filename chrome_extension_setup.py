#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chrome扩展Gmail API配置助手
帮助设置Chrome扩展的Gmail API集成
"""

import webbrowser
import json
import os

def explain_chrome_extension_oauth():
    """解释Chrome扩展的OAuth流程"""
    print("🔐 Chrome扩展Gmail API集成方案")
    print("=" * 60)
    
    print("📋 Chrome扩展 vs Desktop应用的区别:")
    print()
    
    comparison = [
        {
            "aspect": "OAuth类型",
            "desktop": "Desktop Application", 
            "extension": "Web Application (特殊配置)"
        },
        {
            "aspect": "认证方式",
            "desktop": "本地服务器重定向",
            "extension": "chrome.identity API"
        },
        {
            "aspect": "用户体验", 
            "desktop": "命令行 + 浏览器弹窗",
            "extension": "浏览器内无缝认证"
        },
        {
            "aspect": "发布方式",
            "desktop": "个人使用/GitHub",
            "extension": "Chrome Web Store"
        },
        {
            "aspect": "权限管理",
            "desktop": "完全信任用户",
            "extension": "Chrome安全沙箱"
        }
    ]
    
    for item in comparison:
        print(f"🔹 {item['aspect']}:")
        print(f"  Desktop: {item['desktop']}")
        print(f"  Extension: {item['extension']}")
        print()

def show_extension_setup_steps():
    """显示Chrome扩展设置步骤"""
    print("🛠️ Chrome扩展Gmail API设置步骤")
    print("=" * 50)
    
    steps = [
        {
            "title": "1. Google Cloud Console配置",
            "details": [
                "创建新项目或选择现有项目",
                "启用Gmail API",
                "配置OAuth同意屏幕 (External)",
                "添加必要的Scopes: ../auth/gmail.readonly"
            ]
        },
        {
            "title": "2. 创建Web Application凭据",
            "details": [
                "转到 APIs & Services > Credentials",
                "CREATE CREDENTIALS > OAuth client ID",
                "Application type: Web application",
                "Authorized redirect URIs: https://YOUR_EXTENSION_ID.chromiumapp.org/",
                "注意: Extension ID只有发布后才能获得"
            ]
        },
        {
            "title": "3. Chrome扩展Manifest配置",
            "details": [
                "使用Manifest V3",
                "添加identity权限",
                "配置oauth2字段",
                "添加Gmail API的host_permissions"
            ]
        },
        {
            "title": "4. 实现Gmail API调用",
            "details": [
                "使用chrome.identity.getAuthToken()",
                "实现Gmail API的HTTP请求",
                "处理认证和错误",
                "实现数据导出功能"
            ]
        }
    ]
    
    for step in steps:
        print(f"\n🔸 {step['title']}")
        for detail in step['details']:
            print(f"  • {detail}")

def create_extension_manifest():
    """创建Chrome扩展的manifest.json"""
    print(f"\n📝 创建Chrome扩展Manifest")
    print("=" * 40)
    
    manifest = {
        "manifest_version": 3,
        "name": "JobTrack Email Classifier",
        "version": "1.0.0",
        "description": "Automatically classify job-related emails in Gmail",
        
        "permissions": [
            "identity",
            "storage",
            "activeTab"
        ],
        
        "oauth2": {
            "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
            "scopes": [
                "https://www.googleapis.com/auth/gmail.readonly"
            ]
        },
        
        "host_permissions": [
            "https://www.googleapis.com/*",
            "https://mail.google.com/*"
        ],
        
        "action": {
            "default_popup": "popup.html",
            "default_title": "JobTrack Email Classifier"
        },
        
        "content_scripts": [{
            "matches": ["https://mail.google.com/*"],
            "js": ["content.js"]
        }],
        
        "background": {
            "service_worker": "background.js"
        },
        
        "icons": {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png", 
            "128": "icons/icon128.png"
        }
    }
    
    # 保存到Chrome扩展目录
    extension_dir = "chrome-extension"
    if not os.path.exists(extension_dir):
        os.makedirs(extension_dir)
    
    manifest_path = os.path.join(extension_dir, "manifest.json")
    
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Manifest已创建: {manifest_path}")
    print(f"⚠️  记得替换 YOUR_CLIENT_ID 为实际的Client ID")

def create_gmail_integration_js():
    """创建Gmail API集成的JavaScript代码"""
    print(f"\n💻 创建Gmail API集成代码")
    print("=" * 40)
    
    # Background script
    background_js = '''
// background.js - Chrome扩展后台脚本
console.log('JobTrack Extension Background Script Loaded');

// Gmail API基础配置
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// 获取Gmail访问token
async function getGmailToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

// 搜索求职相关邮件
async function searchJobEmails(token, query = 'application OR interview OR recruiter') {
  const url = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=50`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

// 获取邮件详细内容
async function getEmailContent(token, messageId) {
  const url = `${GMAIL_API_BASE}/messages/${messageId}?format=full`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting email content:', error);
    throw error;
  }
}

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchEmails') {
    handleSearchEmails(sendResponse);
    return true; // 保持消息通道开放
  }
});

async function handleSearchEmails(sendResponse) {
  try {
    const token = await getGmailToken();
    const searchResult = await searchJobEmails(token);
    
    // 获取前10封邮件的详细内容
    const emails = [];
    const messageIds = searchResult.messages?.slice(0, 10) || [];
    
    for (const message of messageIds) {
      const emailContent = await getEmailContent(token, message.id);
      const parsedEmail = parseEmailData(emailContent);
      emails.push(parsedEmail);
    }
    
    sendResponse({ success: true, emails });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// 解析邮件数据
function parseEmailData(emailData) {
  const headers = emailData.payload?.headers || [];
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const from = headers.find(h => h.name === 'From')?.value || '';
  
  // 提取邮件正文 (简化版)
  let body = '';
  if (emailData.payload?.body?.data) {
    body = atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  
  return {
    id: emailData.id,
    subject: subject,
    from: from,
    body: body.substring(0, 500), // 限制长度
    snippet: emailData.snippet || ''
  };
}
'''
    
    # Popup HTML
    popup_html = '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 400px; padding: 20px; font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 20px; }
    .email-item { 
      border: 1px solid #ddd; 
      margin: 10px 0; 
      padding: 15px; 
      border-radius: 5px; 
    }
    .email-subject { font-weight: bold; margin-bottom: 5px; }
    .email-snippet { color: #666; font-size: 0.9em; }
    .classify-buttons { margin-top: 10px; }
    .classify-btn { 
      margin: 2px; 
      padding: 5px 10px; 
      border: none; 
      background: #4285f4; 
      color: white; 
      border-radius: 3px; 
      cursor: pointer; 
      font-size: 0.8em;
    }
    .classify-btn:hover { background: #3367d6; }
    #loadBtn { 
      background: #34a853; 
      color: white; 
      border: none; 
      padding: 10px 20px; 
      border-radius: 5px; 
      cursor: pointer; 
      width: 100%;
      margin-bottom: 20px;
    }
    #exportBtn { 
      background: #ea4335; 
      color: white; 
      border: none; 
      padding: 10px 20px; 
      border-radius: 5px; 
      cursor: pointer; 
      width: 100%;
      margin-top: 10px;
    }
    .loading { text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h3>📧 JobTrack Email Classifier</h3>
  </div>
  
  <button id="loadBtn">加载Gmail邮件</button>
  
  <div id="status"></div>
  <div id="emailList"></div>
  
  <button id="exportBtn" style="display: none;">导出训练数据</button>
  
  <script src="popup.js"></script>
</body>
</html>
'''
    
    # Popup JavaScript
    popup_js = '''
// popup.js - Chrome扩展弹窗脚本
let classifiedEmails = [];

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('loadBtn').addEventListener('click', loadEmails);
  document.getElementById('exportBtn').addEventListener('click', exportData);
});

async function loadEmails() {
  const status = document.getElementById('status');
  const emailList = document.getElementById('emailList');
  
  status.innerHTML = '<div class="loading">🔄 正在加载Gmail邮件...</div>';
  emailList.innerHTML = '';
  
  // 发送消息给background script
  chrome.runtime.sendMessage({action: 'searchEmails'}, function(response) {
    if (response.success) {
      displayEmails(response.emails);
      status.innerHTML = `✅ 加载了 ${response.emails.length} 封邮件`;
    } else {
      status.innerHTML = `❌ 加载失败: ${response.error}`;
    }
  });
}

function displayEmails(emails) {
  const emailList = document.getElementById('emailList');
  
  emails.forEach((email, index) => {
    const emailDiv = document.createElement('div');
    emailDiv.className = 'email-item';
    emailDiv.innerHTML = `
      <div class="email-subject">${email.subject}</div>
      <div class="email-snippet">${email.snippet}</div>
      <div class="classify-buttons">
        <button class="classify-btn" onclick="classifyEmail(${index}, 'Applied')">申请确认</button>
        <button class="classify-btn" onclick="classifyEmail(${index}, 'Interview')">面试</button>
        <button class="classify-btn" onclick="classifyEmail(${index}, 'Rejected')">拒绝</button>
        <button class="classify-btn" onclick="classifyEmail(${index}, 'Offer')">录用</button>
        <button class="classify-btn" onclick="classifyEmail(${index}, 'JobAlert')">职位提醒</button>
      </div>
    `;
    emailList.appendChild(emailDiv);
  });
  
  // 存储邮件数据
  window.emailsData = emails;
  document.getElementById('exportBtn').style.display = 'block';
}

function classifyEmail(index, classification) {
  const email = window.emailsData[index];
  email.classification = classification;
  
  // 添加到已分类列表
  classifiedEmails.push({
    subject: email.subject,
    body: email.body || email.snippet,
    label: classification,
    timestamp: new Date().toISOString()
  });
  
  // 更新UI
  const emailItem = document.querySelectorAll('.email-item')[index];
  emailItem.style.background = '#e8f5e8';
  emailItem.innerHTML += `<div style="color: green; font-weight: bold;">已分类为: ${classification}</div>`;
}

function exportData() {
  if (classifiedEmails.length === 0) {
    alert('请先分类一些邮件');
    return;
  }
  
  const exportData = {
    emails: classifiedEmails,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    source: "chrome_extension"
  };
  
  // 方法1: 下载JSON文件
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobtrack-training-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  // 方法2: 复制到剪贴板
  navigator.clipboard.writeText(JSON.stringify(exportData)).then(() => {
    alert(`✅ 已导出 ${classifiedEmails.length} 条训练数据到下载文件夹，并复制到剪贴板！`);
  });
}
'''
    
    # 保存文件
    extension_dir = "chrome-extension"
    
    files_to_create = [
        ("background.js", background_js),
        ("popup.html", popup_html), 
        ("popup.js", popup_js)
    ]
    
    for filename, content in files_to_create:
        file_path = os.path.join(extension_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已创建: {file_path}")

def show_next_steps():
    """显示下一步操作"""
    print(f"\n🚀 下一步操作指南")
    print("=" * 30)
    
    print("1. 📋 完善Google Cloud配置:")
    print("   • 确保Gmail API已启用")
    print("   • 创建Web Application类型的OAuth凭据")
    print("   • 配置authorized redirect URI (发布后)")
    
    print(f"\n2. 🔧 完善Chrome扩展:")
    print("   • 替换manifest.json中的CLIENT_ID")
    print("   • 添加扩展图标到icons/目录")
    print("   • 测试Gmail API集成")
    
    print(f"\n3. 📦 本地测试:")
    print("   • Chrome -> 扩展程序 -> 开发者模式")
    print("   • 加载已解压的扩展程序")
    print("   • 测试Gmail访问权限")
    
    print(f"\n4. 🌐 发布准备:")
    print("   • Chrome Web Store开发者账户")
    print("   • 隐私政策和应用描述")
    print("   • 测试和优化")
    
    print(f"\n5. 🔄 数据同步:")
    print("   • 用户从扩展导出JSON")
    print("   • Python工具导入JSON到训练数据")
    print("   • 重新训练模型")

def open_chrome_store_resources():
    """打开Chrome Web Store相关资源"""
    print(f"\n🌐 打开Chrome Web Store资源")
    print("=" * 40)
    
    resources = [
        {
            "name": "Chrome Web Store开发者控制台",
            "url": "https://chrome.google.com/webstore/devconsole/"
        },
        {
            "name": "Chrome扩展开发文档",
            "url": "https://developer.chrome.com/docs/extensions/"
        },
        {
            "name": "Gmail API for Chrome Extensions",
            "url": "https://developers.google.com/gmail/api/guides"
        },
        {
            "name": "Chrome Identity API文档", 
            "url": "https://developer.chrome.com/docs/extensions/reference/identity/"
        }
    ]
    
    for resource in resources:
        print(f"📂 {resource['name']}")
        webbrowser.open(resource['url'])

def main():
    """主程序"""
    print("🔄 Chrome扩展Gmail API集成助手")
    print("=" * 60)
    
    explain_chrome_extension_oauth()
    show_extension_setup_steps()
    
    create_extension = input("\\n是否创建Chrome扩展基础代码? (y/N): ").lower()
    if create_extension in ['y', 'yes']:
        create_extension_manifest()
        create_gmail_integration_js()
    
    show_next_steps()
    
    open_resources = input("\\n是否打开Chrome Web Store开发资源? (y/N): ").lower()
    if open_resources in ['y', 'yes']:
        open_chrome_store_resources()
    
    print(f"\\n💡 总结:")
    print(f"Chrome扩展可以实现无缝的Gmail集成，但需要:")
    print(f"1. 重新配置OAuth为Web Application类型")
    print(f"2. 开发Chrome扩展代码")
    print(f"3. 发布到Chrome Web Store")
    print(f"4. 实现数据导出到Python训练系统")

if __name__ == '__main__':
    main()