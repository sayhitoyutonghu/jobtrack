# 生产环境配置指南

## 🚨 重要：OAuth 重定向 URI 配置

### 问题描述
当前后端的 `GOOGLE_REDIRECT_URI` 设置为 `http://localhost:3000/auth/callback`，这会导致在生产环境中 OAuth 认证失败。

### 解决方案

#### 1. 更新后端环境变量

在 Railway 部署中，需要设置以下环境变量：

```bash
GOOGLE_REDIRECT_URI=https://jobtrack-production.up.railway.app/auth/callback
FRONTEND_URL=https://jobtrack-7xplmq5l5-sayhitoyutonghu-projects.vercel.app
```

#### 2. 更新 Google Cloud Console 配置

在 Google Cloud Console 中添加以下授权的重定向 URI：

```
https://jobtrack-production.up.railway.app/auth/callback
```

#### 3. 更新前端环境变量

在 Vercel 部署中，设置以下环境变量：

```bash
VITE_API_URL=https://jobtrack-production.up.railway.app
VITE_GOOGLE_CLIENT_ID=799523010151-uh54vq2ontm21td6o5hfud6ud6k6tkko.apps.googleusercontent.com
```

### 配置步骤

#### Railway 后端配置：

1. 登录 Railway Dashboard
2. 选择你的后端项目
3. 进入 Variables 标签
4. 添加/更新以下变量：
   - `GOOGLE_REDIRECT_URI` = `https://jobtrack-production.up.railway.app/auth/callback`
   - `FRONTEND_URL` = `https://jobtrack-7xplmq5l5-sayhitoyutonghu-projects.vercel.app`

#### Vercel 前端配置：

1. 登录 Vercel Dashboard
2. 选择你的前端项目
3. 进入 Settings > Environment Variables
4. 添加/更新以下变量：
   - `VITE_API_URL` = `https://jobtrack-production.up.railway.app`
   - `VITE_GOOGLE_CLIENT_ID` = `799523010151-uh54vq2ontm21td6o5hfud6ud6k6tkko.apps.googleusercontent.com`

#### Google Cloud Console 配置：

1. 访问 https://console.cloud.google.com/apis/credentials
2. 找到你的 OAuth 2.0 客户端 ID
3. 点击编辑（铅笔图标）
4. 在 "Authorized redirect URIs" 中添加：
   - `https://jobtrack-production.up.railway.app/auth/callback`
5. 点击 "Save"

### 验证配置

配置完成后，测试 OAuth 流程：

1. 访问前端应用：https://jobtrack-7xplmq5l5-sayhitoyutonghu-projects.vercel.app
2. 点击 "Sign in with Google"
3. 应该能正常完成认证流程

### 常见问题

#### 问题 1: redirect_uri_mismatch
**原因**: Google Cloud Console 中的重定向 URI 与后端设置的不匹配
**解决**: 确保两端配置完全一致

#### 问题 2: 前端无法连接到后端
**原因**: `VITE_API_URL` 设置错误
**解决**: 检查后端 URL 是否正确

#### 问题 3: CORS 错误
**原因**: 后端未允许前端域名的跨域请求
**解决**: 检查后端 CORS 配置
