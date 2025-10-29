# 🚀 Railway 部署选项

## 问题：CD 命令错误
错误信息：`The executable 'cd' could not be found`

## 解决方案

### 方案 1: 使用 Nixpacks (当前配置)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node backend/server.js"
  }
}
```

### 方案 2: 使用 Docker (如果 Nixpacks 失败)
1. 在 Railway 项目设置中：
   - 选择 "Settings" → "Deploy"
   - 将 `railway.json` 重命名为 `railway.json.backup`
   - 将 `railway-docker.json` 重命名为 `railway.json`

2. 或者手动设置：
   - Builder: Dockerfile
   - Dockerfile Path: Dockerfile.simple
   - Start Command: node server.js

### 方案 3: 使用简化的 Nixpacks 配置
如果仍有问题，可以尝试：

1. 删除 `nixpacks.toml`
2. 让 Railway 自动检测 Node.js 项目
3. 手动设置 Start Command: `node backend/server.js`

## 环境变量检查
确保以下环境变量已设置：

```bash
# 必需
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

## 故障排除

### 如果仍然失败：
1. 检查 Railway 服务状态：https://status.railway.app
2. 尝试不同的部署区域
3. 联系 Railway 支持
4. 考虑使用其他平台（Render、Vercel、Heroku）

### 快速修复命令：
```bash
# 重新部署
git add .
git commit -m "Fix Railway deployment"
git push origin main

# 或使用 Railway CLI
railway up
```

## 备用平台

如果 Railway 持续有问题：

1. **Render.com** - 类似 Railway
2. **Vercel** - 适合前端 + API
3. **Heroku** - 传统 PaaS
4. **DigitalOcean App Platform** - 云原生
