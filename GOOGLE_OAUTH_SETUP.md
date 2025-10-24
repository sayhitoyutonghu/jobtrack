# 🔐 Google OAuth 配置指南

## ✅ 当前配置状态

### OAuth 凭据（已配置）
```
Client ID: your_client_id_here
Client Secret: your_client_secret_here
Redirect URI: http://localhost:3000/auth/callback
```

---

## 🔍 Google Cloud Console 配置检查清单

### 1. 访问 Google Cloud Console
🔗 https://console.cloud.google.com/apis/credentials

### 2. 检查 OAuth 2.0 客户端 ID

#### ✅ 必须配置的项目：

**应用类型**: Web application

**授权的重定向 URI**:
```
http://localhost:3000/auth/callback
```

⚠️ **注意**：URI 必须完全匹配，包括：
- 协议: `http://`（不是 `https://`）
- 端口: `:3000`
- 路径: `/auth/callback`

#### 📋 如何检查：
1. 在 Google Cloud Console 中找到你的 OAuth 客户端 ID
2. 点击编辑（铅笔图标）
3. 向下滚动到 "Authorized redirect URIs"
4. 确认包含: `http://localhost:3000/auth/callback`
5. 如果没有，添加后点击"Save"

---

### 3. 启用 Gmail API

#### ✅ 必须启用的 API：
- **Gmail API**

#### 📋 如何检查：
1. 访问: https://console.cloud.google.com/apis/library
2. 搜索 "Gmail API"
3. 如果显示"MANAGE"按钮，说明已启用 ✅
4. 如果显示"ENABLE"按钮，点击启用

---

### 4. 配置 OAuth 同意屏幕

#### ✅ 必须配置的项目：

**User Type**: 
- External（外部）- 用于测试
- Internal（内部）- 仅限组织内部

**OAuth Scopes**（必须包含）:
```
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.labels
```

**Test users**（如果是 External）:
- 添加你要测试的 Gmail 账户

#### 📋 如何检查：
1. 访问: https://console.cloud.google.com/apis/credentials/consent
2. 检查应用状态
3. 确认 Scopes 包含 Gmail 权限
4. 如果是 External，确认添加了测试用户

---

## 🧪 测试 OAuth 登录

### 方法 1: 在 Dashboard 中测试

1. **打开 Dashboard**
   ```
   http://localhost:5173
   ```

2. **点击 "Sign in with Google" 按钮**

3. **选择 Gmail 账户**

4. **授权权限**
   - 查看和管理你的 Gmail
   - 管理你的邮件标签

5. **成功重定向**
   - 应该自动返回到 Dashboard
   - 顶部显示绿色横幅: "Connected to Gmail"

### 方法 2: 直接访问 OAuth 端点

1. **在浏览器中访问**
   ```
   http://localhost:3000/auth/google
   ```

2. **应该自动重定向到 Google 登录页面**

3. **完成授权后**
   - 重定向到: `http://localhost:5173?session=xxxxx`
   - Dashboard 显示登录成功

---

## ❌ 常见错误及解决方法

### 错误 1: 400 Bad Request (OAuth Error)

**错误信息**: 
```
Error 400: redirect_uri_mismatch
```

**原因**: 重定向 URI 不匹配

**解决方法**:
1. 在 Google Cloud Console 中检查授权的重定向 URI
2. 确保包含: `http://localhost:3000/auth/callback`
3. 注意大小写和完整路径
4. 保存后等待几分钟生效

---

### 错误 2: 403 Access Denied

**错误信息**:
```
Error 403: access_denied
```

**原因**: 
- Gmail API 未启用
- 或者 OAuth 同意屏幕未配置
- 或者测试用户未添加（External 模式）

**解决方法**:
1. 启用 Gmail API
2. 配置 OAuth 同意屏幕
3. 添加测试用户（如果是 External）

---

### 错误 3: Invalid Client

**错误信息**:
```
Error 401: invalid_client
```

**原因**: Client ID 或 Client Secret 不正确

**解决方法**:
1. 检查 `backend/.env` 文件中的凭据
2. 确认与 Google Cloud Console 中的一致
3. 重启 Backend 服务:
   ```powershell
   cd backend
   npm start
   ```

---

### 错误 4: Scopes Not Granted

**错误信息**:
```
insufficient_scope
```

**原因**: 用户未授予所需的权限

**解决方法**:
1. 退出登录
2. 重新登录
3. 确保勾选所有权限请求
4. 或在 OAuth 同意屏幕中添加所需 Scopes

---

## 🔄 重新配置 OAuth（如果需要）

### 1. 删除旧凭据
```powershell
# 删除 session 数据
Remove-Item backend/data/sessions.json -ErrorAction SilentlyContinue
```

### 2. 更新 .env 文件
```powershell
# 编辑 backend/.env
notepad backend/.env
```

### 3. 重启服务
```powershell
# 停止所有服务
Stop-Process -Name "node" -Force

# 启动 Backend
cd backend
npm start

# 启动 Frontend（新终端）
cd frontend
npm run dev
```

---

## 🎯 验证配置正确的标志

### ✅ Backend 日志应该显示:
```
🚀 JobTrack API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server: http://localhost:3000
🔐 Login:  http://localhost:3000/auth/google
❤️  Health: http://localhost:3000/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 不应该显示警告:
# ⚠️  WARNING: GOOGLE_CLIENT_ID not configured
```

### ✅ 登录成功后应该看到:
```
🔐 Redirecting to Google OAuth...
🔄 Exchanging code for tokens...
✅ Authentication successful!
📝 Session ID: xxxxxxx
```

### ✅ Dashboard 应该显示:
- 绿色横幅: "Connected to Gmail"
- Session ID
- 所有功能按钮可用

---

## 🧪 快速测试命令

### 检查 OAuth 配置
```powershell
.\check_oauth_config.ps1
```

### 测试 Backend OAuth 端点
```powershell
# 应该返回 302 重定向
curl.exe -I http://localhost:3000/auth/google
```

### 检查环境变量
```powershell
cat backend\.env
```

---

## 📞 需要帮助？

如果遇到问题：

1. **运行诊断**:
   ```powershell
   .\check_oauth_config.ps1
   ```

2. **查看 Backend 日志**:
   - 检查运行 Backend 的终端窗口
   - 查找错误信息

3. **检查浏览器控制台**:
   - F12 打开开发者工具
   - 查看 Console 标签页

4. **常见问题自查**:
   - [ ] Client ID 正确?
   - [ ] Client Secret 正确?
   - [ ] Redirect URI 配置正确?
   - [ ] Gmail API 已启用?
   - [ ] OAuth 同意屏幕已配置?
   - [ ] Backend 服务运行中?
   - [ ] Frontend 服务运行中?

---

## 🎓 下一步

登录成功后，你可以：

1. **创建 Gmail 标签**
   - 点击 "Create / Update Labels"
   - 在 Gmail 中查看新标签

2. **扫描邮件**
   - 配置查询条件
   - 点击 "Scan Now"
   - 查看分类结果

3. **启用自动扫描**
   - 点击 "Start Auto Scan"
   - 系统定期自动分类邮件

---

**🔐 OAuth 配置完成！现在可以开始使用 Google 登录了！** 🎉
