# 🚀 JobTrack 后端 Render 部署指南

## 📋 项目概述

JobTrack 是一个 Gmail 工作邮件自动分类管理系统，包含：
- **后端**: Node.js + Express API 服务
- **前端**: React + Vite (已部署到 Vercel)
- **功能**: Gmail OAuth 认证、邮件分类、自动标签管理

## ✅ 部署可行性分析

### 可以部署到 Render 的原因：
1. ✅ **纯 Node.js 应用** - 使用 Express 框架
2. ✅ **无数据库依赖** - 使用文件系统存储会话
3. ✅ **支持 Docker** - 已创建 Dockerfile
4. ✅ **环境变量配置** - 支持 OAuth 和 CORS 配置
5. ✅ **健康检查端点** - `/health` 端点用于监控

### 需要注意的限制：
- ⚠️ **文件系统存储** - Render 的免费计划文件系统是临时的
- ⚠️ **会话持久性** - 重启后会话会丢失
- ⚠️ **冷启动** - 免费计划有冷启动延迟

## 🛠️ 部署步骤

### 方法一：通过 Render Dashboard（推荐）

#### 1. 准备代码仓库
```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

#### 2. 在 Render 创建 Web Service
1. 访问 [render.com](https://render.com) 并登录
2. 点击 "New +" → "Web Service"
3. 连接你的 GitHub 仓库
4. 选择 `jobtrack` 仓库

#### 3. 配置服务设置
```
Name: jobtrack-backend
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: (留空)
Build Command: docker build -t jobtrack-backend .
Start Command: docker run -p $PORT:3000 jobtrack-backend
```

#### 4. 设置环境变量
在 Render Dashboard 的 Environment 标签页添加：

**必需的环境变量：**
```
NODE_ENV=production
PORT=3000
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
GOOGLE_REDIRECT_URI=https://jobtrack-backend.onrender.com/auth/callback
FRONTEND_URL=https://jobtrack-7xplmq5l5-sayhitoyutonghu-projects.vercel.app
```

**可选的环境变量：**
```
OPENAI_API_KEY=你的OpenAI API密钥（如果使用AI功能）
ANTHROPIC_API_KEY=你的Anthropic API密钥（如果使用Claude功能）
```

#### 5. 部署
- 点击 "Create Web Service"
- 等待构建和部署完成（约 5-10 分钟）

### 方法二：使用 render.yaml（自动化部署）

#### 1. 使用提供的 render.yaml 文件
项目根目录已包含 `render.yaml` 配置文件，包含：
- 服务类型和配置
- 环境变量模板
- 健康检查配置
- 自动部署设置

#### 2. 部署命令
```bash
# 安装 Render CLI
npm install -g @render/cli

# 登录 Render
render login

# 部署服务
render deploy
```

## 🔧 配置说明

### Dockerfile 配置
```dockerfile
# 基于 Node.js 20 Alpine
FROM node:20-alpine

# 安全配置
RUN addgroup -g 1001 -S nodejs
RUN adduser -S jobtrack -u 1001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### 环境变量说明

| 变量名 | 必需 | 说明 | 示例值 |
|--------|------|------|--------|
| `NODE_ENV` | ✅ | 运行环境 | `production` |
| `PORT` | ✅ | 服务端口 | `3000` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth 客户端ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth 客户端密钥 | `GOCSPX-xxx` |
| `GOOGLE_REDIRECT_URI` | ✅ | OAuth 回调地址 | `https://your-app.onrender.com/auth/callback` |
| `FRONTEND_URL` | ✅ | 前端地址（CORS） | `https://your-frontend.vercel.app` |
| `OPENAI_API_KEY` | ❌ | OpenAI API 密钥 | `sk-xxx` |
| `ANTHROPIC_API_KEY` | ❌ | Anthropic API 密钥 | `sk-ant-xxx` |

## 🔐 Google OAuth 配置更新

部署到 Render 后，需要更新 Google OAuth 配置：

### 1. 更新重定向 URI
在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 中：
1. 找到你的 OAuth 2.0 客户端 ID
2. 编辑客户端
3. 在 "Authorized redirect URIs" 中添加：
   ```
   https://your-app-name.onrender.com/auth/callback
   ```

### 2. 更新前端配置
在前端环境变量中更新：
```env
VITE_API_URL=https://your-app-name.onrender.com
```

## 🧪 测试部署

### 1. 健康检查
```bash
curl https://your-app-name.onrender.com/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sessions": 0,
  "environment": "production"
}
```

### 2. API 端点测试
```bash
# 获取 API 信息
curl https://your-app-name.onrender.com/

# 测试 OAuth 登录（会重定向到 Google）
curl -I https://your-app-name.onrender.com/auth/google
```

### 3. 前端集成测试
1. 访问前端应用
2. 点击 "Sign in with Google"
3. 完成 OAuth 流程
4. 验证功能正常

## ⚠️ 注意事项和限制

### Render 免费计划限制
- **冷启动**: 应用不活跃时会休眠，首次请求有延迟
- **文件系统**: 临时文件系统，重启后数据丢失
- **会话存储**: 建议使用外部存储（Redis、数据库）
- **构建时间**: 每月 750 小时构建时间

### 生产环境建议
1. **升级到付费计划** - 避免冷启动
2. **使用外部存储** - 如 Redis 或数据库存储会话
3. **设置监控** - 使用 Render 的监控功能
4. **配置日志** - 设置日志聚合服务

## 🔄 更新和重新部署

### 自动部署
- 推送到 `main` 分支会自动触发部署
- 在 Render Dashboard 可以查看部署状态

### 手动部署
```bash
# 推送代码
git push origin main

# 或在 Render Dashboard 点击 "Manual Deploy"
```

## 🐛 故障排除

### 常见问题

#### 1. 构建失败
**错误**: Docker 构建失败
**解决**: 
- 检查 Dockerfile 语法
- 确认所有文件都在仓库中
- 查看构建日志

#### 2. 环境变量未生效
**错误**: 应用启动时提示环境变量缺失
**解决**:
- 检查 Render Dashboard 中的环境变量设置
- 确认变量名拼写正确
- 重启服务

#### 3. OAuth 重定向失败
**错误**: Google OAuth 重定向 URI 不匹配
**解决**:
- 更新 Google Cloud Console 中的重定向 URI
- 确保使用 HTTPS 协议
- 检查域名拼写

#### 4. CORS 错误
**错误**: 前端无法访问后端 API
**解决**:
- 检查 `FRONTEND_URL` 环境变量
- 确认 CORS 配置正确
- 检查前端 API URL 配置

### 查看日志
```bash
# 在 Render Dashboard 中查看实时日志
# 或使用 Render CLI
render logs --service your-service-name
```

## 📊 监控和维护

### 1. 健康监控
- 使用 `/health` 端点监控服务状态
- 设置 Render 的健康检查
- 配置告警通知

### 2. 性能监控
- 监控响应时间
- 查看错误率
- 分析冷启动频率

### 3. 日志管理
- 查看应用日志
- 设置日志级别
- 配置日志聚合

## 🎯 下一步

部署成功后，你可以：

1. **测试完整流程** - 从登录到邮件分类
2. **配置监控** - 设置告警和监控
3. **优化性能** - 根据使用情况调整配置
4. **扩展功能** - 添加更多自动化功能

## 📞 支持

如果遇到问题：
1. 查看 Render 官方文档
2. 检查 Render 状态页面
3. 查看应用日志
4. 联系技术支持

---

**🎉 恭喜！你的 JobTrack 后端已成功部署到 Render！**
