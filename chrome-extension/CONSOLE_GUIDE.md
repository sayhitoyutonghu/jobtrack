# Gmail 控制台使用指南

## 📖 如何打开 Gmail 控制台

### 方法 1: 键盘快捷键
在 Gmail 页面按 **F12**

### 方法 2: 右键菜单
1. 在 Gmail 页面任意位置**右键点击**
2. 选择 **"检查"** 或 **"Inspect"**

### 方法 3: Chrome 菜单
1. 点击 Chrome 右上角的 **三个点** ⋮
2. 选择 **更多工具** → **开发者工具**

---

## 🎯 控制台界面说明

打开后会看到开发者工具面板，包含多个标签：
- **Console（控制台）** ← 我们要用这个
- Elements（元素）
- Sources（源代码）
- Network（网络）
- 等等...

**确保切换到 "Console" 标签！**

---

## 💻 如何运行命令

### 1️⃣ 在控制台底部找到输入框

看起来像这样：
```
>  [光标在这里闪烁]
```

### 2️⃣ 复制并粘贴命令

**测试 API 连接：**
```javascript
chrome.runtime.sendMessage({
  action: 'classifyEmail',
  subject: 'Interview Invitation',
  body: 'We would like to invite you for an interview'
}, response => console.log('Test result:', response));
```

### 3️⃣ 按 Enter 运行

粘贴后按 **Enter** 键，命令就会执行。

### 4️⃣ 查看结果

结果会显示在控制台中，例如：
```javascript
Test result: {
  success: true,
  label: "Response Needed",
  confidence: 0.92,
  probabilities: {...}
}
```

---

## 🧪 常用调试命令

### 检查扩展是否加载
```javascript
console.log('JobTrack loaded?', document.querySelector('.jobtrack-label'));
```

### 查看当前邮件主题
```javascript
const subject = document.querySelector('h2.hP')?.textContent;
console.log('Subject:', subject);
```

### 查看当前邮件正文
```javascript
const body = document.querySelector('.a3s.aiL')?.textContent;
console.log('Body:', body?.substring(0, 200));
```

### 手动触发分类
```javascript
chrome.runtime.sendMessage({
  action: 'classifyEmail',
  subject: document.querySelector('h2.hP')?.textContent || 'Test',
  body: document.querySelector('.a3s.aiL')?.textContent || 'Test body'
}, response => console.log('Classification:', response));
```

### 检查存储的分类数据
```javascript
chrome.storage.local.get(null, data => {
  console.log('Stored classifications:', data);
});
```

### 清除所有数据
```javascript
chrome.storage.local.clear(() => {
  console.log('All data cleared');
});
```

### 检查 API 健康状态
```javascript
chrome.runtime.sendMessage({
  action: 'checkHealth'
}, response => console.log('API Health:', response));
```

### 获取所有分类
```javascript
chrome.runtime.sendMessage({
  action: 'getCategories'
}, response => console.log('Categories:', response));
```

---

## 🔍 查看扩展日志

扩展运行时会输出日志，在控制台中查找：

**正常日志：**
```
JobTrack Content Script loaded
Found subject with selector: h2.hP
Found body with selector: .a3s.aiL Count: 1
Classifying email: {subject: "..."}
Classification result: {success: true, ...}
Label inserted successfully
```

**错误日志：**
```
❌ Could not find email subject
❌ Could not find email body
❌ API Error: ...
❌ CORS error
```

---

## 📊 实时监控

### 持续监控分类事件
```javascript
// 监听所有 console.log
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes?.('JobTrack') || args[0]?.includes?.('Classification')) {
    originalLog.apply(console, ['🏷️', ...args]);
  } else {
    originalLog.apply(console, args);
  }
};
```

---

## 🎨 控制台技巧

### 清空控制台
点击左上角的 **🚫** 图标，或按 **Ctrl + L**

### 过滤日志
在控制台顶部的搜索框输入关键词，例如：
- `JobTrack` - 只显示扩展相关日志
- `error` - 只显示错误
- `Classification` - 只显示分类结果

### 查看对象详情
点击对象前的 **▶** 箭头展开查看详细内容

### 复制结果
右键点击结果 → **Copy object**

---

## 🐛 常见问题

### Q: 粘贴命令后没反应？
**A:** 确保：
1. 在 Console 标签（不是 Elements 或其他）
2. 点击了控制台输入框
3. 按了 Enter 键

### Q: 显示 "Uncaught TypeError"？
**A:** 可能是：
1. 扩展未加载 - 刷新页面
2. 命令有语法错误 - 重新复制完整命令
3. Chrome 版本问题 - 更新 Chrome

### Q: 显示 "chrome.runtime is undefined"？
**A:** 扩展未正确加载，需要：
1. 去 `chrome://extensions/` 检查扩展状态
2. 重新加载扩展
3. 刷新 Gmail 页面

---

## 📝 示例：完整调试流程

```javascript
// 1. 检查页面元素
console.log('Subject element:', document.querySelector('h2.hP'));
console.log('Body element:', document.querySelector('.a3s.aiL'));

// 2. 获取内容
const subject = document.querySelector('h2.hP')?.textContent;
const body = document.querySelector('.a3s.aiL')?.textContent;
console.log('Subject:', subject);
console.log('Body preview:', body?.substring(0, 100));

// 3. 测试 API
chrome.runtime.sendMessage({
  action: 'checkHealth'
}, health => {
  console.log('API Status:', health);
  
  if (health.healthy) {
    // 4. 如果 API 正常，测试分类
    chrome.runtime.sendMessage({
      action: 'classifyEmail',
      subject: subject,
      body: body
    }, result => {
      console.log('Classification:', result);
    });
  }
});
```

---

## 💡 提示

- 可以按 **↑** 和 **↓** 箭头键浏览历史命令
- 输入 `clear()` 清空控制台
- 按 **Esc** 键可以快速打开/关闭控制台（需要先按 F12 打开过）
- 控制台支持自动补全，输入 `chrome.` 会显示可用方法

---

现在您可以在 Gmail 控制台中运行命令来调试扩展了！🎉
