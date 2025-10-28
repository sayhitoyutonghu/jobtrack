# JobTrack 前端 Vercel 部署指南

## 项目概述

这是一个基于 React + Vite 的 Gmail 工作邮件分类管理前端应用，使用 Tailwind CSS 进行样式设计。

## 部署前准备

### 1. 确保项目结构正确

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js          # API客户端配置
│   ├── App.jsx               # 主应用组件
│   ├── Dashboard.jsx         # 仪表板组件
│   ├── main.jsx              # 应用入口
│   └── ...
├── package.json              # 项目依赖
├── vite.config.js            # Vite配置
├── vercel.json              # Vercel配置
├── env.example              # 环境变量示例
└── index.html               # HTML模板
```

### 2. 环境变量配置

在 Vercel 部署前，你需要设置以下环境变量：

#### 必需的环境变量：
- `VITE_API_URL`: 后端API的完整URL（例如：`https://your-backend.herokuapp.com`）
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth 客户端ID

## 部署步骤

### 方法一：通过 Vercel CLI（推荐）

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **进入前端目录**
   ```bash
   cd frontend
   ```

4. **部署项目**
   ```bash
   vercel
   ```

5. **设置环境变量**
   ```bash
   vercel env add VITE_API_URL
   vercel env add VITE_GOOGLE_CLIENT_ID
   ```

6. **重新部署以应用环境变量**
   ```bash
   vercel --prod
   ```

### 方法二：通过 Vercel 网站

1. **访问 [vercel.com](https://vercel.com) 并登录**

2. **导入项目**
   - 点击 "New Project"
   - 选择你的 Git 仓库
   - 选择 `frontend` 文件夹作为根目录

3. **配置构建设置**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **设置环境变量**
   - 在项目设置中添加：
     - `VITE_API_URL`: 你的后端API地址
     - `VITE_GOOGLE_CLIENT_ID`: 你的Google OAuth客户端ID

5. **部署**
   - 点击 "Deploy" 按钮

## 配置说明

### vercel.json 配置

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 环境变量说明

- `VITE_API_URL`: 后端API的基础URL，用于前端与后端通信
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth 2.0 客户端ID，用于用户认证

## 部署后配置

### 1. 更新 Google OAuth 设置

在 Google Cloud Console 中：
1. 进入你的 OAuth 2.0 客户端配置
2. 添加 Vercel 域名到 "已授权的 JavaScript 来源"
3. 添加 Vercel 域名到 "已授权的重定向 URI"

### 2. 后端 CORS 配置

确保你的后端服务器允许来自 Vercel 域名的跨域请求：

```javascript
// 后端 CORS 配置示例
const corsOptions = {
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3000' // 开发环境
  ],
  credentials: true
};
```

## 常见问题

### 1. 构建失败

**问题**: 构建过程中出现错误
**解决方案**:
- 检查 `package.json` 中的依赖版本
- 确保所有必需的依赖都已安装
- 检查 Vite 配置是否正确

### 2. API 请求失败

**问题**: 前端无法连接到后端API
**解决方案**:
- 检查 `VITE_API_URL` 环境变量是否正确设置
- 确认后端服务器正在运行
- 检查 CORS 配置

### 3. Google OAuth 不工作

**问题**: 无法通过 Google 登录
**解决方案**:
- 检查 `VITE_GOOGLE_CLIENT_ID` 是否正确
- 确认 Google OAuth 配置中的域名设置
- 检查重定向 URI 配置

### 4. 页面刷新后出现 404

**问题**: 直接访问路由或刷新页面时出现 404
**解决方案**:
- 确认 `vercel.json` 中的 `rewrites` 配置正确
- 这是单页应用的标准配置，所有路由都应该重定向到 `index.html`

## 性能优化

### 1. 静态资源缓存

Vercel 会自动为静态资源设置长期缓存，通过 `vercel.json` 中的 headers 配置。

### 2. 代码分割

Vite 会自动进行代码分割，减少初始加载时间。

### 3. 图片优化

考虑使用 Vercel 的图片优化功能或 CDN 来优化图片加载。

## 监控和维护

### 1. 部署监控

- 使用 Vercel 的 Analytics 功能监控应用性能
- 设置错误监控（如 Sentry）

### 2. 定期更新

- 定期更新依赖包
- 监控安全漏洞
- 更新环境变量配置

## 备份和恢复

### 1. 代码备份

- 确保代码已推送到 Git 仓库
- 定期创建发布标签

### 2. 环境变量备份

- 记录所有环境变量的值
- 使用 Vercel CLI 导出环境变量配置

## 联系支持

如果遇到部署问题，可以：
1. 查看 Vercel 的官方文档
2. 检查 Vercel 的状态页面
3. 联系 Vercel 支持团队

---

**注意**: 部署前请确保后端服务已经部署并正常运行，因为前端应用依赖于后端API。
