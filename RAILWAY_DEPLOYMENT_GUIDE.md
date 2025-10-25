# 🚀 JobTrack Railway 部署指南

## 📋 部署概述

JobTrack 是一个多服务应用，包含：
- **Node.js Backend** (Express API + Gmail集成)
- **Python ML Service** (Flask API + 机器学习模型)
- **React Frontend** (静态文件)

Railway 支持多服务部署，我们将为每个服务创建独立的部署。

---

## 🎯 部署策略

### 方案 1: 单服务部署 (推荐)
将整个应用作为一个服务部署，使用 `railway-start.js` 同时启动所有服务。

### 方案 2: 多服务部署
为每个服务创建独立的 Railway 项目。

---

## 🚀 方案 1: 单服务部署 (推荐)

### 步骤 1: 准备 GitHub 仓库

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push origin main
   ```

### 步骤 2: 创建 Railway 项目

1. **访问 Railway**
   - 打开 [Railway.app](https://railway.app)
   - 使用 GitHub 账户登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 JobTrack 仓库

### 步骤 3: 配置环境变量

在 Railway 项目设置中添加以下环境变量：

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

### 步骤 4: 配置构建设置

1. **设置根目录**
   - 在 Railway 项目设置中，确保根目录设置为项目根目录

2. **设置启动命令**
   - Railway 会自动检测到 `railway.json` 配置
   - 或者手动设置启动命令：`npm run start:production`

### 步骤 5: 部署

1. **触发部署**
   - Railway 会自动检测到代码推送并开始部署
   - 或者手动点击 "Deploy" 按钮

2. **监控部署日志**
   - 查看部署日志确保所有服务正常启动
   - 检查健康检查状态

---

## 🔧 方案 2: 多服务部署

### 服务 1: Backend API

1. **创建 Backend 项目**
   - 新建 Railway 项目
   - 选择 "Deploy from GitHub repo"
   - 设置根目录为 `backend/`

2. **配置环境变量**
   ```bash
   NODE_ENV=production
   PORT=3000
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=https://your-backend.railway.app/auth/callback
   PYTHON_API_URL=https://your-python.railway.app
   ```

### 服务 2: Python ML Service

1. **创建 Python 项目**
   - 新建 Railway 项目
   - 设置根目录为项目根目录
   - Railway 会自动检测 Python 项目

2. **配置环境变量**
   ```bash
   FLASK_ENV=production
   PORT=5000
   MODEL_PATH=./model.pkl
   VECTORIZER_PATH=./vectorizer.pkl
   ```

3. **设置启动命令**
   ```bash
   python app.py
   ```

### 服务 3: Frontend

1. **构建前端**
   ```bash
   cd frontend
   npm run build
   ```

2. **创建 Frontend 项目**
   - 新建 Railway 项目
   - 选择 "Deploy from GitHub repo"
   - 设置根目录为 `frontend/`

3. **配置环境变量**
   ```bash
   VITE_API_URL=https://your-backend.railway.app
   VITE_PYTHON_API_URL=https://your-python.railway.app
   ```

---

## 🔐 Google OAuth 配置

### 1. 更新 Google Cloud Console

1. **访问 Google Cloud Console**
   - 打开 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

2. **更新重定向 URI**
   - 找到你的 OAuth 2.0 客户端 ID
   - 添加 Railway 域名：
     ```
     https://your-app-name.railway.app/auth/callback
     ```

3. **确保 Gmail API 已启用**
   - 访问 [API Library](https://console.cloud.google.com/apis/library)
   - 搜索并启用 "Gmail API"

### 2. 更新 OAuth 同意屏幕

1. **配置应用信息**
   - 访问 [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
   - 添加生产域名到授权域名列表

---

## 🧪 测试部署

### 1. 健康检查

访问以下端点确保服务正常：

```bash
# Backend 健康检查
curl https://your-app-name.railway.app/health

# Python ML 服务健康检查
curl https://your-app-name.railway.app:5000/health
```

### 2. 功能测试

1. **访问前端**
   - 打开 `https://your-app-name.railway.app`
   - 应该看到 JobTrack 界面

2. **测试 Google 登录**
   - 点击 "Sign in with Google"
   - 完成 OAuth 流程
   - 确认重定向到成功页面

3. **测试 API 功能**
   - 创建 Gmail 标签
   - 扫描邮件
   - 测试自动分类

---

## 🔧 故障排除

### 常见问题

1. **构建失败**
   - 检查 `railway.json` 配置
   - 确保所有依赖都在 `package.json` 中
   - 查看构建日志中的错误信息

2. **服务启动失败**
   - 检查环境变量配置
   - 确保端口配置正确
   - 查看运行时日志

3. **OAuth 错误**
   - 确认重定向 URI 配置正确
   - 检查 Google Cloud Console 设置
   - 验证环境变量

4. **Python 服务问题**
   - 确保模型文件存在
   - 检查 Python 依赖
   - 验证 Flask 配置

### 调试命令

```bash
# 查看 Railway 日志
railway logs

# 连接到 Railway 服务
railway connect

# 查看环境变量
railway variables
```

---

## 📊 监控和维护

### 1. 性能监控

- 使用 Railway 内置监控
- 设置健康检查端点
- 监控内存和 CPU 使用率

### 2. 日志管理

- 查看 Railway 日志面板
- 设置日志级别
- 配置错误告警

### 3. 备份策略

- 定期备份模型文件
- 备份用户数据
- 设置自动备份

---

## 🎯 生产环境优化

### 1. 性能优化

- 启用 Gzip 压缩
- 配置 CDN
- 优化数据库查询

### 2. 安全配置

- 启用 HTTPS
- 配置 CORS
- 设置安全头

### 3. 扩展性

- 配置负载均衡
- 设置自动扩缩容
- 监控资源使用

---

## 📞 支持

如果遇到问题：

1. **查看 Railway 文档**
   - [Railway Docs](https://docs.railway.app/)

2. **检查项目日志**
   - Railway Dashboard → Logs

3. **联系支持**
   - Railway Discord
   - GitHub Issues

---

## 🎉 部署完成！

部署成功后，你将拥有：

- ✅ 生产环境的 JobTrack 应用
- ✅ 自动 HTTPS 证书
- ✅ 全球 CDN 加速
- ✅ 自动扩缩容
- ✅ 监控和日志

**🚀 开始使用你的 JobTrack 应用吧！**
