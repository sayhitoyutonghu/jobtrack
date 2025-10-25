# 🚀 JobTrack Railway 快速部署

## 📋 部署前检查清单

- [ ] 代码已推送到 GitHub
- [ ] Google OAuth 凭据已准备
- [ ] Railway 账户已注册
- [ ] 所有配置文件已创建

## 🎯 一键部署命令

### 1. 准备代码
```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "Add Railway deployment configuration"

# 推送到 GitHub
git push origin main
```

### 2. 创建 Railway 项目
```bash
# 登录 Railway
railway login

# 创建新项目
railway new

# 连接 GitHub 仓库
railway connect
```

### 3. 配置环境变量
```bash
# 设置 Google OAuth
railway variables set GOOGLE_CLIENT_ID=your_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_client_secret
railway variables set GOOGLE_REDIRECT_URI=https://your-app.railway.app/auth/callback

# 设置应用配置
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set FRONTEND_URL=https://your-app.railway.app

# 设置 Python 服务
railway variables set PYTHON_API_URL=http://localhost:5000
railway variables set FLASK_ENV=production

# 设置安全配置
railway variables set SESSION_ENCRYPTION_KEY=your_32_character_key
```

### 4. 部署
```bash
# 部署到 Railway
railway up

# 查看部署状态
railway status

# 查看日志
railway logs
```

## 🔧 环境变量模板

复制以下内容到 Railway 环境变量设置：

```bash
# Google OAuth (必需)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app-name.railway.app/auth/callback

# 应用配置
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app-name.railway.app

# Python 服务配置
PYTHON_API_URL=http://localhost:5000
FLASK_ENV=production

# 安全配置
SESSION_ENCRYPTION_KEY=your_32_character_random_key
```

## 🧪 测试部署

### 1. 健康检查
```bash
# 检查后端服务
curl https://your-app-name.railway.app/health

# 检查 Python 服务
curl https://your-app-name.railway.app:5000/health
```

### 2. 功能测试
1. 访问 `https://your-app-name.railway.app`
2. 点击 "Sign in with Google"
3. 完成 OAuth 流程
4. 测试邮件扫描功能

## 🔐 Google OAuth 配置

### 更新 Google Cloud Console
1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 找到你的 OAuth 2.0 客户端 ID
3. 添加重定向 URI: `https://your-app-name.railway.app/auth/callback`
4. 确保 Gmail API 已启用

## 🎉 部署完成！

部署成功后，你将获得：
- ✅ 生产环境 URL
- ✅ 自动 HTTPS 证书
- ✅ 全球 CDN 加速
- ✅ 自动扩缩容
- ✅ 监控和日志

**开始使用你的 JobTrack 应用吧！** 🚀
