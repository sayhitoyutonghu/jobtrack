# 🚨 Railway 部署故障排除指南

## 问题：503 Service Unavailable 错误

### 原因分析
- Railway 注册表服务暂时不可用
- Docker 构建过程中网络问题
- 构建配置过于复杂

### 解决方案

#### 方案 1: 使用 Nixpacks (推荐)
```bash
# 当前配置已切换到 Nixpacks
# 检查 railway.json 中的 builder 设置为 "NIXPACKS"
```

#### 方案 2: 简化 Docker 构建
如果 Nixpacks 仍有问题，可以尝试：

1. **删除 Dockerfile.railway**
2. **使用简化的 railway.json**:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "cd backend && node server.js"
     }
   }
   ```

#### 方案 3: 手动部署
1. 在 Railway 控制台中：
   - 进入项目设置
   - 选择 "Deploy" 标签
   - 点击 "Redeploy" 按钮

#### 方案 4: 检查服务状态
- 访问 https://status.railway.app
- 查看是否有服务中断

### 环境变量检查
确保以下环境变量已正确设置：

```bash
# 必需的环境变量
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-app.railway.app/auth/callback

# 应用配置
NODE_ENV=production
PORT=3000

# Python 服务
PYTHON_API_URL=http://localhost:5000
FLASK_ENV=production

# 安全配置
SESSION_ENCRYPTION_KEY=your_32_character_key
```

### 监控部署
1. 查看构建日志
2. 检查健康检查状态
3. 监控资源使用情况

### 如果问题持续
1. 尝试不同的部署区域
2. 联系 Railway 支持
3. 考虑使用其他平台（如 Render 或 Vercel）

## 快速修复命令

```bash
# 重新部署
git add .
git commit -m "Fix Railway deployment"
git push origin main

# 或者使用 Railway CLI
railway up
```

## 备用部署平台

如果 Railway 持续有问题，可以考虑：

1. **Render.com** - 类似 Railway 的平台
2. **Vercel** - 适合前端 + API
3. **Heroku** - 传统 PaaS 平台
4. **DigitalOcean App Platform** - 云原生平台
