# Chrome Extension 调试指南

## 🔍 问题：邮件没有被自动分类

### 步骤 1: 重新加载扩展

1. 打开 `chrome://extensions/`
2. 找到 "JobTrack - Email Classifier"
3. 点击 **刷新图标** ↻
4. 刷新 Gmail 页面 (F5)

### 步骤 2: 检查浏览器控制台

1. 在 Gmail 页面按 **F12** 打开开发者工具
2. 切换到 **Console** 标签
3. 查找以下消息：

**正常情况应该看到：**
```
JobTrack Content Script loaded
Found subject with selector: h2.hP
Found body with selector: .a3s.aiL Count: 1
Classifying email: {subject: "..."}
Classification result: {success: true, label: "...", confidence: 0.xx}
Label inserted successfully
```

**如果看到错误：**
- `Could not find email subject` - 选择器不匹配
- `Could not find email body` - 选择器不匹配
- `API Error` - Flask API 未运行或连接失败
- `CORS error` - 跨域问题

### 步骤 3: 检查 Flask API

1. 确保 Flask API 正在运行：
   ```bash
   python app.py
   ```

2. 测试 API 连接：
   ```bash
   python quick_test.py
   ```

3. 或在浏览器访问：
   ```
   http://localhost:5000/health
   ```
   应该返回：`{"status": "healthy", "model_loaded": true, ...}`

### 步骤 4: 使用手动分类按钮

1. 在 Gmail 中打开一封邮件
2. 查找页面上的 **"🏷️ Classify Email"** 按钮
3. 点击按钮手动触发分类
4. 查看控制台输出

**如果没有看到按钮：**
- 应该会在右下角看到一个浮动按钮
- 点击浮动按钮进行分类

### 步骤 5: 检查扩展权限

1. 打开 `chrome://extensions/`
2. 找到 JobTrack 扩展
3. 点击 **详细信息**
4. 确保以下权限已启用：
   - 网站访问权限：`mail.google.com`
   - 网站访问权限：`localhost:5000`

### 步骤 6: 检查 Gmail 页面元素

在 Gmail 页面的控制台中运行：

```javascript
// 检查主题元素
console.log('Subject:', document.querySelector('h2.hP'));

// 检查正文元素
console.log('Body:', document.querySelectorAll('.a3s.aiL'));

// 手动触发分类
chrome.runtime.sendMessage({
  action: 'classifyEmail',
  subject: 'Test Subject',
  body: 'Test body'
}, response => console.log('Response:', response));
```

### 步骤 7: 查看扩展后台日志

1. 打开 `chrome://extensions/`
2. 找到 JobTrack 扩展
3. 点击 **Service Worker** 链接（在"检查视图"下）
4. 查看后台脚本的控制台输出

## 🛠️ 常见问题解决

### 问题 1: "API Disconnected"

**解决方案：**
```bash
# 确保 API 正在运行
cd d:\downloads\jobtrack
python app.py
```

### 问题 2: CORS 错误

**解决方案：**
```bash
# 确保安装了 flask-cors
pip install flask-cors

# 重启 API
python app.py
```

### 问题 3: 找不到邮件内容

**可能原因：**
- Gmail 界面更新了 CSS 类名
- 需要等待页面完全加载

**解决方案：**
- 在控制台运行上面的检查命令
- 如果元素不存在，需要更新选择器

### 问题 4: 标签不显示

**解决方案：**
1. 检查控制台是否有 "Label inserted successfully" 消息
2. 使用浏览器的元素检查器查找 `.jobtrack-label` 元素
3. 可能被其他样式覆盖，尝试调整 z-index

### 问题 5: 自动分类不工作

**检查设置：**
1. 点击扩展图标
2. 确保 "Auto-Classify" 开关是开启的
3. 确保 "Enable Extension" 开关是开启的

## 📊 调试技巧

### 启用详细日志

在 `content.js` 的开头添加：
```javascript
const DEBUG = true;
```

### 手动测试分类

在 Gmail 控制台运行：
```javascript
// 获取当前邮件内容
const subject = document.querySelector('h2.hP')?.textContent;
const body = document.querySelector('.a3s.aiL')?.textContent;
console.log('Subject:', subject);
console.log('Body:', body?.substring(0, 100));

// 手动调用分类
chrome.runtime.sendMessage({
  action: 'classifyEmail',
  subject: subject,
  body: body
}, response => {
  console.log('Classification:', response);
});
```

### 检查存储数据

在控制台运行：
```javascript
chrome.storage.local.get(null, data => {
  console.log('Stored data:', data);
});
```

## 🔄 完整重置步骤

如果以上都不行，尝试完全重置：

1. **卸载扩展**
   - `chrome://extensions/` → 移除 JobTrack

2. **清除数据**
   ```javascript
   chrome.storage.local.clear();
   chrome.storage.sync.clear();
   ```

3. **重启 Flask API**
   ```bash
   # Ctrl+C 停止
   python app.py
   ```

4. **重新加载扩展**
   - Load unpacked → 选择 `chrome-extension` 文件夹

5. **刷新 Gmail**
   - F5 刷新页面

6. **测试**
   - 打开一封邮件
   - 查看控制台
   - 点击分类按钮

## 📞 获取帮助

如果问题仍然存在，请提供：
1. 浏览器控制台的完整输出
2. 扩展后台 Service Worker 的日志
3. Flask API 的输出
4. Gmail 页面的截图
