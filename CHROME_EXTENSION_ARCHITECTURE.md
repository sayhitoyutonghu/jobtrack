# 🔄 JobTrack Chrome扩展 + Python训练数据架构设计

## 🎯 新的架构目标
1. **Chrome扩展**: 公开发布到Chrome Web Store
2. **Gmail API集成**: 在扩展中访问用户Gmail
3. **数据导出**: 从扩展导出数据到Python训练
4. **公众使用**: 支持任何用户安装和使用

## 🏗️ 架构设计

### 方案A: Chrome扩展 + 数据导出 (推荐)
```
Chrome扩展 (前端)
├── Gmail API集成 (chrome.identity)
├── 邮件分类界面
├── 数据导出功能
└── 用户友好的UI

Python训练系统 (后端)  
├── 导入扩展导出的数据
├── 模型训练和优化
├── API服务 (可选)
└── 数据管理工具
```

### 方案B: 混合架构 (更复杂但功能完整)
```
Chrome扩展 ←→ Web服务 ←→ Python系统
    ↓           ↓          ↓
Gmail API   数据处理    AI训练
用户界面    API转发     模型服务
```

## 🔧 技术实现

### Chrome扩展部分

#### 1. Manifest V3配置
```json
{
  "manifest_version": 3,
  "name": "JobTrack Email Classifier",
  "version": "1.0",
  "permissions": [
    "identity",
    "storage",
    "activeTab"
  ],
  "oauth2": {
    "client_id": "your-chrome-extension-client-id.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/gmail.readonly"
    ]
  },
  "host_permissions": [
    "https://www.googleapis.com/*"
  ]
}
```

#### 2. Gmail API访问 (Chrome扩展方式)
```javascript
// 使用chrome.identity API进行OAuth
chrome.identity.getAuthToken({
  'interactive': true
}, function(token) {
  if (token) {
    // 使用token访问Gmail API
    fetchGmailEmails(token);
  }
});

function fetchGmailEmails(token) {
  fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => response.json())
  .then(data => {
    // 处理邮件数据
    processEmails(data);
  });
}
```

#### 3. 数据导出功能
```javascript
// 导出训练数据
function exportTrainingData() {
  const trainingData = {
    emails: classifiedEmails,
    timestamp: new Date().toISOString(),
    version: "1.0"
  };
  
  // 方法1: 下载JSON文件
  downloadJSON(trainingData, 'jobtrack-training-data.json');
  
  // 方法2: 复制到剪贴板
  copyToClipboard(JSON.stringify(trainingData));
  
  // 方法3: 发送到Web服务
  sendToWebService(trainingData);
}
```

### Python系统部分

#### 导入扩展数据
```python
def import_extension_data(json_file):
    """导入Chrome扩展导出的数据"""
    with open(json_file, 'r') as f:
        extension_data = json.load(f)
    
    emails = extension_data.get('emails', [])
    
    # 转换格式并添加到训练数据
    for email in emails:
        add_to_training_data(
            subject=email['subject'],
            body=email['body'], 
            label=email['classification']
        )
```

## 🚀 开发路线图

### 阶段1: 基础Chrome扩展 (1-2周)
- [ ] 设置Chrome扩展项目
- [ ] 实现Gmail API OAuth认证
- [ ] 基础邮件读取功能
- [ ] 简单的UI界面

### 阶段2: 邮件分类功能 (1-2周)
- [ ] 邮件分类界面
- [ ] 本地数据存储
- [ ] 数据导出功能
- [ ] 与Python系统的数据同步

### 阶段3: 发布准备 (1周)
- [ ] Chrome Web Store发布
- [ ] 用户文档
- [ ] 隐私政策
- [ ] 测试和优化

### 阶段4: 高级功能 (后续)
- [ ] Web服务集成
- [ ] 实时AI分类
- [ ] 团队协作功能
- [ ] 数据分析面板

## 🔐 OAuth配置对比

### Desktop Application (当前Python脚本)
```json
{
  "installed": {
    "client_id": "desktop-app-id.apps.googleusercontent.com",
    "client_secret": "secret",
    "redirect_uris": ["http://localhost"]
  }
}
```

### Chrome Extension (新架构)
```json
// 在Google Cloud Console中创建
{
  "web": {
    "client_id": "chrome-extension-id.apps.googleusercontent.com", 
    "client_secret": "secret",
    "redirect_uris": [
      "https://extension-id.chromiumapp.org/"
    ]
  }
}
```

## 📋 立即行动计划

你现在有两个选择：

### 选择A: 先完成Python训练系统 (推荐)
1. 继续使用Desktop Application完成Python部分
2. 使用手动导入方式收集训练数据
3. 训练出好的模型
4. 然后开发Chrome扩展使用这个模型

### 选择B: 直接开发Chrome扩展架构
1. 重新配置为Web Application / Chrome Extension
2. 开发Chrome扩展的Gmail集成
3. 实现数据导出到Python系统
4. 并行开发训练功能

## 🤔 我的建议

**建议先完成选择A**，原因：
1. ✅ 可以快速验证AI模型效果
2. ✅ 有了好模型再做扩展更有价值
3. ✅ Desktop方式可以快速收集大量训练数据
4. ✅ 扩展开发是独立的，可以后续进行

你觉得如何？要先完成Python训练系统，还是直接开始Chrome扩展开发？