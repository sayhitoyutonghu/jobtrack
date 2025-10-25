# 🛠️ JobTrack 开发指南

## 🎯 开发环境设置

### 前置要求
- Node.js 18+ 
- Python 3.8+
- Docker & Docker Compose
- Git

### 快速开始

#### 1. 克隆项目
```bash
git clone <your-repo-url> jobtrack
cd jobtrack
```

#### 2. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

#### 3. 启动开发环境
```bash
# 方式1: Docker开发模式（推荐）
./docker-start-mac.sh  # Mac
./docker-start.bat     # Windows

# 方式2: 本地开发
npm run dev:all
```

## 📁 项目结构详解

### 🎨 Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/          # React组件
│   │   ├── Dashboard.jsx   # 主仪表板
│   │   ├── App.jsx        # 应用入口
│   │   ├── LabelCard.jsx  # 标签卡片
│   │   └── StatusPanel.jsx # 状态面板
│   ├── api/               # API客户端
│   │   └── client.js      # Axios配置
│   ├── styles/           # 样式文件
│   │   ├── globals.css   # 全局样式
│   │   └── components.css # 组件样式
│   └── utils/            # 工具函数
│       └── helpers.js    # 辅助函数
├── public/              # 静态资源
├── package.json        # 前端依赖
└── vite.config.js      # Vite配置
```

### ⚙️ Backend (Node.js + Express)
```
backend/
├── routes/                    # API路由
│   ├── gmail.routes.js       # Gmail集成路由
│   └── labels.routes.js      # 标签管理路由
├── services/                 # 业务逻辑服务
│   ├── auto-manager.service.js    # 自动管理器
│   ├── autoscan.service.js        # 自动扫描服务
│   ├── session.store.js          # 会话存储
│   ├── gmail.service.js          # Gmail服务
│   └── ml.service.js            # 机器学习服务
├── data/                     # 数据存储
│   ├── sessions.json         # 用户会话
│   ├── label-config.json     # 标签配置
│   └── test-config.json      # 测试配置
├── export/                   # 导出数据
├── config/                   # 配置文件
│   └── labels.js            # 标签配置
├── server.js                # 服务器入口
├── start-with-autoscan.js   # 自动扫描启动
└── package.json             # 后端依赖
```

### 🤖 ML Service (Python + Flask)
```
├── app.py                    # Flask API服务器
├── train_model.py           # 模型训练脚本
├── prepare_training_data.py # 数据预处理
├── model.pkl               # 训练好的模型
├── vectorizer.pkl          # 文本向量化器
├── requirements.txt        # Python依赖
└── scripts/               # 训练脚本
    └── export-gmail-training-data.js
```

## 🔧 开发工作流

### 添加新功能

#### 1. 后端API开发
```bash
# 创建新的路由文件
touch backend/routes/new-feature.routes.js

# 在server.js中注册路由
app.use('/api/new-feature', require('./routes/new-feature.routes'));
```

#### 2. 前端组件开发
```bash
# 创建新组件
touch frontend/src/components/NewFeature.jsx

# 在App.jsx中导入使用
import NewFeature from './components/NewFeature';
```

#### 3. 数据库操作
```javascript
// 在services中创建数据服务
// backend/services/database.service.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/jobtrack.db');

// 查询示例
function getUsers() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM users", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
```

### 调试技巧

#### 1. 后端调试
```bash
# 启动调试模式
cd backend
npm run dev

# 查看日志
docker-compose logs -f backend

# 使用调试器
node --inspect server.js
```

#### 2. 前端调试
```bash
# 启动开发服务器
cd frontend
npm run dev

# 浏览器开发者工具
# F12 -> Console/Network/Application
```

#### 3. Python调试
```bash
# 启动Flask调试模式
export FLASK_DEBUG=1
python app.py

# 使用pdb调试
import pdb; pdb.set_trace()
```

## 🧪 测试

### API测试
```bash
# 健康检查
curl http://localhost:3000/health

# 认证测试
curl -X POST http://localhost:3000/auth/test-login

# Gmail集成测试
curl -X POST http://localhost:3000/api/gmail/setup \
  -H "x-session-id: test-session"
```

### 前端测试
```bash
cd frontend
npm run test
```

### 集成测试
```bash
# 使用测试脚本
node test-autoscan.js
python test_api.py
```

## 📦 部署

### 开发环境部署
```bash
# Docker开发模式
docker-compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 生产环境部署
```bash
# 构建生产镜像
docker-compose up -d --build

# 健康检查
curl http://localhost/health
curl http://localhost:3000/health
```

## 🔍 性能优化

### 后端优化
```javascript
// 1. 使用连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'user',
  password: 'password',
  database: 'jobtrack'
});

// 2. 缓存常用数据
const cache = new Map();
function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  // 获取数据并缓存
}

// 3. 异步处理
const { Worker } = require('worker_threads');
function processEmailsAsync(emails) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./email-processor.js', {
      workerData: { emails }
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

### 前端优化
```javascript
// 1. 组件懒加载
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 2. 使用useMemo缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 3. 防抖处理
const debouncedSearch = useCallback(
  debounce((query) => {
    searchAPI(query);
  }, 300),
  []
);
```

## 🐛 常见问题

### 1. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 修改端口
export PORT=3001
```

### 2. 数据库连接问题
```bash
# 检查数据库文件
ls -la backend/data/

# 重新初始化
rm backend/data/jobtrack.db
npm run init-db
```

### 3. Docker问题
```bash
# 清理Docker缓存
docker system prune -a

# 重新构建
docker-compose down
docker-compose up -d --build
```

### 4. 权限问题
```bash
# 给脚本执行权限
chmod +x *.sh

# 修复文件权限
sudo chown -R $USER:$USER .
```

## 📝 代码规范

### JavaScript/Node.js
```javascript
// 使用ES6+语法
const express = require('express');
const { Router } = require('express');

// 使用async/await
async function processEmails() {
  try {
    const emails = await fetchEmails();
    const results = await classifyEmails(emails);
    return results;
  } catch (error) {
    console.error('Error processing emails:', error);
    throw error;
  }
}

// 使用JSDoc注释
/**
 * 处理Gmail邮件分类
 * @param {Array} emails - 邮件列表
 * @param {Object} options - 处理选项
 * @returns {Promise<Array>} 分类结果
 */
async function classifyEmails(emails, options = {}) {
  // 实现逻辑
}
```

### Python
```python
# 使用类型提示
from typing import List, Dict, Optional
import pandas as pd

def process_emails(emails: List[Dict], 
                  model_path: str = "model.pkl") -> List[Dict]:
    """
    处理邮件分类
    
    Args:
        emails: 邮件列表
        model_path: 模型文件路径
        
    Returns:
        分类结果列表
    """
    # 实现逻辑
    pass
```

### React
```jsx
// 使用函数组件和Hooks
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * 标签管理组件
 * @param {Object} props - 组件属性
 * @param {Array} props.labels - 标签列表
 * @param {Function} props.onUpdate - 更新回调
 */
function LabelManager({ labels, onUpdate }) {
  const [loading, setLoading] = useState(false);
  
  const handleUpdate = useCallback(async (labelId, data) => {
    setLoading(true);
    try {
      await updateLabel(labelId, data);
      onUpdate();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  }, [onUpdate]);
  
  return (
    <div className="label-manager">
      {/* 组件内容 */}
    </div>
  );
}

LabelManager.propTypes = {
  labels: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default LabelManager;
```

## 🚀 发布流程

### 1. 代码审查
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/new-feature
```

### 2. 测试验证
```bash
# 运行测试
npm test
python -m pytest

# 构建检查
npm run build
docker-compose build
```

### 3. 部署发布
```bash
# 合并到主分支
git checkout main
git merge feature/new-feature

# 创建标签
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0

# 部署到生产环境
docker-compose -f docker-compose.yml up -d --build
```

---

**开发团队**: JobTrack Team  
**最后更新**: 2024年12月  
**文档版本**: v1.0
