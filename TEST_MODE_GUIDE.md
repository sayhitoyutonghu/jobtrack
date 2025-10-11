# 🧪 JobTrack 测试模式使用指南

## ✨ 什么是测试模式？

测试模式允许你在**不需要真实 Google OAuth 凭据**的情况下测试 JobTrack 的所有功能。所有 Gmail API 调用都会被模拟，返回示例数据。

---

## 🚀 如何使用测试模式

### 1. 打开 Dashboard
访问: http://localhost:5173

### 2. 点击"🧪 Test Mode Login"按钮
- 在顶部的黄色认证横幅中
- 点击 **"🧪 Test Mode Login"** 按钮
- 系统会自动创建一个测试会话

### 3. 查看登录状态
成功后，你会看到绿色横幅显示：
```
🧪 Test Mode Active
Session ID: test-xxxxx
```

### 4. 测试所有功能

#### 创建标签
- 点击 **"Create / Update Labels"** 按钮
- 系统会模拟创建5个Gmail标签
- 结果会显示 "Test mode: Labels simulated successfully"

#### 扫描邮件
- 配置扫描参数（或使用默认值）
- 点击 **"Scan Now"** 按钮
- 系统会生成模拟的邮件数据
- 显示分类结果和置信度

#### 查看标签配置
- 在 "Label Panel" 区域查看5个预配置的标签
- 可以查看每个标签的规则和关键词

---

## 📊 测试模式功能

### ✅ 支持的功能
- ✅ 测试登录（无需 Google OAuth）
- ✅ 模拟标签创建
- ✅ 模拟邮件扫描
- ✅ 生成示例邮件数据（8种类型）
- ✅ 显示分类结果
- ✅ 查看标签配置
- ✅ UI 完整功能测试

### ❌ 不支持的功能
- ❌ 真实的 Gmail 访问
- ❌ 实际的标签创建
- ❌ 真实邮件读取
- ❌ 自动扫描（需要真实 session）

---

## 🎭 模拟邮件类型

测试模式会生成以下类型的示例邮件：

| 类型 | 示例主题 | 预测标签 | 置信度 |
|------|----------|----------|--------|
| 面试邀请 | Interview Invitation - Software Engineer | Interview Scheduled | 0.92 |
| 申请确认 | Application Received - Job #12345 | Applied | 0.88 |
| 职位提醒 | Job Alert: Senior Developer at StartupXYZ | Job Alert | 0.95 |
| 录用通知 | Offer Letter - Welcome to the Team! | Offer | 0.97 |
| 拒信 | Update on Your Application | Rejected | 0.89 |
| 需要回复 | Following up on our conversation | Response Needed | 0.76 |
| 猎头联系 | Quick question about your availability | Recruiter Outreach | 0.84 |
| 状态更新 | Application Status Update | Status Update | 0.91 |

---

## 🔄 测试登录 vs Google 登录

| 功能 | 测试模式 | Google 登录 |
|------|----------|-------------|
| 需要OAuth配置 | ❌ 不需要 | ✅ 需要 |
| Gmail访问 | ❌ 模拟数据 | ✅ 真实数据 |
| 标签创建 | ❌ 模拟 | ✅ 真实 |
| 邮件扫描 | ❌ 示例数据 | ✅ 真实邮件 |
| UI测试 | ✅ 完整支持 | ✅ 完整支持 |
| 适用场景 | 开发/演示 | 生产环境 |

---

## 🧪 测试 API 端点

### 测试模式登录
```powershell
curl.exe -X POST http://localhost:3000/auth/test-login -H "Content-Type: application/json"
```

**响应:**
```json
{
  "success": true,
  "sessionId": "test-xfp16",
  "message": "Test mode login successful",
  "testMode": true
}
```

### 使用测试 Session 调用 API
```powershell
# 获取 session ID 后
$sessionId = "test-xfp16"

# 创建标签
curl.exe -X POST http://localhost:3000/api/gmail/setup -H "x-session-id: $sessionId"

# 扫描邮件
curl.exe -X POST http://localhost:3000/api/gmail/scan -H "x-session-id: $sessionId" -H "Content-Type: application/json" -d '{\"maxResults\": 10}'
```

---

## 🎯 使用场景

### 开发和测试
- 在没有 Google OAuth 配置的情况下开发功能
- 测试 UI 交互
- 演示系统功能
- 单元测试和集成测试

### 演示
- 向他人展示系统功能
- 不需要真实的 Gmail 账户
- 快速演示分类效果

### 调试
- 测试不同的邮件分类场景
- 验证 UI 状态变化
- 检查错误处理

---

## 🔐 切换到真实 Google 登录

如果你有真实的 Google OAuth 凭据：

### 1. 配置环境变量
编辑 `backend/.env`:
```env
GOOGLE_CLIENT_ID=your_real_client_id_here
GOOGLE_CLIENT_SECRET=your_real_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 2. 获取 Google OAuth 凭据
1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建新项目或选择现有项目
3. 启用 Gmail API
4. 创建 OAuth 2.0 客户端 ID
5. 配置重定向 URI: `http://localhost:3000/auth/callback`
6. 复制 Client ID 和 Client Secret 到 `.env`

### 3. 重启 Backend
```powershell
cd backend
npm start
```

### 4. 在 Dashboard 中点击 "Sign in with Google"
- 选择你的 Gmail 账户
- 授权 JobTrack 访问
- 开始使用真实的 Gmail 功能

---

## 🐛 常见问题

### 测试登录后看不到数据？
- 确保 Backend 服务正在运行
- 检查浏览器控制台是否有错误
- 刷新页面重试

### 扫描邮件返回空结果？
- 测试模式会生成固定的示例数据
- 检查 maxResults 参数是否设置正确
- 查看 Backend 日志确认测试模式激活

### 如何退出测试模式？
- 点击 "Logout" 按钮
- 或者刷新页面并使用真实 Google 登录

---

## 📝 技术细节

### 测试模式实现

**Backend (server.js)**
```javascript
// 测试登录端点
POST /auth/test-login
- 创建测试 session
- 返回 testMode: true
- 不需要真实 OAuth
```

**Gmail Routes (gmail.routes.js)**
```javascript
// 检测测试模式
if (req.user.testMode) {
  // 使用 MockGmailService
  const mockService = new MockGmailService();
  return mockService.scanEmails(query, maxResults);
}
```

**Mock Gmail Service (mock-gmail.service.js)**
```javascript
// 生成示例数据
- generateMockEmails() - 创建示例邮件
- setupLabels() - 模拟标签创建
- scanEmails() - 返回分类结果
```

**Frontend (App.jsx)**
```javascript
// 测试登录按钮
const handleTestLogin = async () => {
  const response = await authApi.testLogin();
  localStorage.setItem('session_id', response.sessionId);
  setAuthStatus({ authenticated: true, testMode: true });
};
```

---

## ✨ 优势

1. **快速启动** - 无需配置 Google OAuth
2. **独立开发** - 不依赖外部服务
3. **可预测** - 固定的测试数据
4. **完整功能** - UI 和 API 完全可用
5. **安全演示** - 不需要真实账户

---

## 🎓 下一步

1. **测试完整流程**
   - 测试登录 → 创建标签 → 扫描邮件 → 查看结果

2. **探索功能**
   - 尝试不同的扫描参数
   - 查看各种邮件分类
   - 测试 UI 交互

3. **准备生产环境**
   - 配置真实 Google OAuth
   - 连接真实 Gmail 账户
   - 开始实际使用

---

**🧪 现在就开始测试吧！** 

访问 http://localhost:5173 并点击 "🧪 Test Mode Login" 按钮！

