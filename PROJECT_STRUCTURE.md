# 📁 JobTrack 项目结构说明

## 🎯 项目概述

JobTrack 是一个全栈邮件分类应用，使用AI技术自动分类求职相关邮件。

## 🏗️ 架构组件

```
JobTrack/
├── 🎨 Frontend (React + Vite)
├── ⚙️  Backend (Node.js + Express)  
├── 🤖 ML Service (Python + Flask)
├── 🔌 Chrome Extension
└── 🐳 Docker Deployment
```

## 📂 详细目录结构

### 🎨 Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/          # React组件
│   │   ├── Dashboard.jsx    # 主仪表板
│   │   ├── App.jsx         # 应用入口
│   │   └── ...
│   ├── api/                # API客户端
│   ├── styles/             # 样式文件
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── package.json           # 前端依赖
└── vite.config.js         # Vite配置
```

### ⚙️ Backend (Node.js + Express)
```
backend/
├── routes/                 # API路由
│   ├── gmail.routes.js    # Gmail集成
│   └── labels.routes.js   # 标签管理
├── services/              # 业务逻辑
│   ├── auto-manager.service.js
│   ├── autoscan.service.js
│   └── session.store.js
├── data/                  # 数据存储
│   ├── sessions.json      # 用户会话
│   └── label-config.json # 标签配置
├── export/               # 导出数据
├── config/              # 配置文件
├── server.js           # 服务器入口
└── package.json        # 后端依赖
```

### 🤖 ML Service (Python + Flask)
```
├── app.py              # Flask API服务器
├── train_model.py      # 模型训练
├── prepare_training_data.py # 数据预处理
├── model.pkl          # 训练好的模型
├── vectorizer.pkl     # 文本向量化器
└── requirements.txt   # Python依赖
```

### 🔌 Chrome Extension
```
chrome-extension/
├── manifest.json      # 扩展配置
├── background.js     # 后台服务
├── content.js        # Gmail集成
├── popup.html        # 弹出界面
├── popup.js         # 弹出逻辑
├── icons/           # 图标资源
└── README.md        # 扩展说明
```

### 🐳 Docker Deployment
```
├── docker-compose.yml      # 生产环境
├── docker-compose.dev.yml  # 开发环境
├── Dockerfile.backend      # 后端镜像
├── Dockerfile.frontend     # 前端镜像
├── Dockerfile.python       # Python镜像
└── docker/                 # Docker配置
    └── nginx.conf          # Nginx配置
```

## 🔄 数据流

```
用户操作 → Frontend → Backend API → Gmail API
                ↓
            ML Service ← 训练数据
                ↓
            分类结果 → Chrome Extension → Gmail标签
```

## 🚀 启动方式

### 开发环境
```bash
# 方式1: Docker开发模式
./docker-start-mac.sh  # Mac
./docker-start.bat     # Windows

# 方式2: 本地开发
cd backend && npm run dev
cd frontend && npm run dev
python app.py
```

### 生产环境
```bash
docker-compose up -d --build
```

## 📡 API端点

### 认证
- `GET /auth/google` - Google OAuth登录
- `GET /auth/callback` - OAuth回调
- `GET /auth/status` - 认证状态

### Gmail集成
- `POST /api/gmail/setup` - 设置Gmail标签
- `POST /api/gmail/scan` - 扫描邮件
- `GET /api/gmail/labels` - 获取标签

### 自动管理
- `GET /api/auto-manager/status` - 自动扫描状态
- `POST /api/auto-manager/start` - 启动自动扫描
- `POST /api/auto-manager/stop` - 停止自动扫描

## 🔧 环境变量

### 必需配置
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# 应用配置
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## 📊 数据存储

### 会话数据
- 位置: `backend/data/sessions.json`
- 内容: 用户OAuth令牌和会话信息

### 标签配置
- 位置: `backend/data/label-config.json`
- 内容: 邮件分类标签设置

### 训练数据
- 位置: `backend/export/`
- 内容: Gmail邮件导出数据

### ML模型
- 位置: `model.pkl`, `vectorizer.pkl`
- 内容: 训练好的分类模型

## 🎯 核心功能

1. **智能邮件分类** - 使用ML模型自动分类邮件
2. **实时标签管理** - 动态创建和管理Gmail标签
3. **自动化扫描** - 定期扫描新邮件并分类
4. **Chrome扩展** - 直接在Gmail中操作
5. **数据导出** - 导出训练数据和分类结果

## 🔍 调试和监控

### 健康检查
- Backend: `http://localhost:3000/health`
- ML Service: `http://localhost:5000/health`

### 日志查看
```bash
# Docker日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f backend
docker-compose logs -f python-api
```

## 📝 开发指南

### 添加新功能
1. 在对应目录创建文件
2. 更新API路由
3. 添加前端组件
4. 更新文档

### 测试
```bash
# API测试
curl http://localhost:3000/health

# 前端测试
cd frontend && npm run dev
```

---

**最后更新**: 2024年12月
**维护者**: JobTrack团队
