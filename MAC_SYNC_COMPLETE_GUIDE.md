# 🍎 Mac同步完整指南

在Mac电脑上同步运行和修改Docker中的JobTrack代码的完整解决方案！

---

## 🎯 解决方案概述

### 问题
- 代码部署在Docker中
- 需要在Mac上同步运行和修改代码
- 保持开发环境一致性

### 解决方案
- ✅ **开发模式Docker配置** - 支持代码热重载
- ✅ **实时同步机制** - 本地修改立即生效
- ✅ **数据持久化** - 训练数据和模型文件持久保存
- ✅ **跨平台同步** - Windows和Mac无缝切换

---

## 🚀 快速开始（3步搞定）

### 步骤1: 在Windows上准备同步

```bash
# 在Windows项目目录运行
./sync-to-mac.sh
```

这会：
- 提交所有代码更改
- 推送到Git仓库
- 创建数据备份
- 生成同步说明

### 步骤2: 在Mac上设置环境

```bash
# 1. 克隆项目
git clone <your-repo-url> jobtrack
cd jobtrack

# 2. 一键设置Mac开发环境
chmod +x setup-mac-dev.sh
./setup-mac-dev.sh
```

### 步骤3: 启动开发环境

```bash
# 启动Mac开发环境
./docker-start-mac.sh
```

选择 `1` 进行首次启动，享受：
- 🔥 代码热重载
- 🔄 实时同步
- 💾 数据持久化
- 🐛 调试友好

---

## 📁 文件结构说明

### 新增的Mac专用文件

```
jobtrack/
├── docker-compose.dev.yml      # Mac开发环境配置
├── Dockerfile.frontend.dev     # 前端开发Dockerfile
├── docker-start-mac.sh         # Mac启动脚本
├── setup-mac-dev.sh            # Mac环境设置脚本
├── dev-tools.sh                # 开发工具集
├── sync-to-mac.sh              # Windows同步脚本
├── mac-data-sync.yml           # 数据同步配置
├── MAC_DEVELOPMENT_GUIDE.md    # Mac开发指南
└── MAC_SYNC_COMPLETE_GUIDE.md  # 本文件
```

### 目录映射关系

```
本地Mac目录              → 容器内目录
./backend/               → /app (Backend容器)
./frontend/              → /app (Frontend容器)
./app.py                 → /app/app.py (Python容器)
./model.pkl              → /app/model.pkl
./vectorizer.pkl         → /app/vectorizer.pkl
./backend/data/          → /app/data (持久化)
./backend/export/        → /app/export (持久化)
```

---

## 🔄 开发工作流

### 日常开发流程

```bash
# 1. 启动开发环境
./docker-start-mac.sh

# 2. 修改代码（任何编辑器）
vim backend/server.js
vim frontend/src/Dashboard.jsx
vim app.py

# 3. 代码自动同步和重载
# - Backend: 自动重启
# - Frontend: Vite热重载
# - Python: Flask开发模式重启

# 4. 查看日志
./dev-tools.sh logs

# 5. 停止服务
./dev-tools.sh stop
```

### 跨平台同步流程

```bash
# 在Windows上
./sync-to-mac.sh

# 在Mac上
git pull origin main
./docker-start-mac.sh
```

---

## 🛠️ 开发工具使用

### 主要工具

```bash
# 启动开发环境
./docker-start-mac.sh

# 使用开发工具集
./dev-tools.sh start      # 启动服务
./dev-tools.sh logs       # 查看日志
./dev-tools.sh status     # 查看状态
./dev-tools.sh stop       # 停止服务
./dev-tools.sh restart    # 重启服务
./dev-tools.sh shell      # 进入容器
./dev-tools.sh train      # 训练模型
./dev-tools.sh backup     # 备份数据
./dev-tools.sh clean      # 清理资源
```

### 服务管理

```bash
# 查看服务状态
docker compose -f docker-compose.dev.yml ps

# 查看资源使用
docker stats --no-stream

# 查看日志
docker compose -f docker-compose.dev.yml logs -f

# 重启特定服务
docker compose -f docker-compose.dev.yml restart backend
docker compose -f docker-compose.dev.yml restart frontend
docker compose -f docker-compose.dev.yml restart python-api
```

---

## 🔧 高级配置

### 自定义端口

编辑 `docker-compose.dev.yml`：

```yaml
services:
  frontend:
    ports:
      - "8080:80"      # 改为8080端口
      - "5173:5173"    # Vite开发服务器
  backend:
    ports:
      - "3001:3000"    # 改为3001端口
  python-api:
    ports:
      - "5001:5000"    # 改为5001端口
```

### 环境变量配置

创建 `.env.mac`：

```env
# Mac开发环境配置
NODE_ENV=development
FLASK_ENV=development
VITE_API_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:5000

# 自定义配置
FRONTEND_PORT=80
BACKEND_PORT=3000
PYTHON_PORT=5000
VITE_PORT=5173
```

### 资源限制

在 `docker-compose.dev.yml` 中添加：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 📊 监控和调试

### 实时监控

```bash
# 查看服务状态
./dev-tools.sh status

# 实时查看日志
./dev-tools.sh logs

# 进入容器调试
./dev-tools.sh shell
```

### 性能监控

```bash
# 查看资源使用
docker stats

# 查看磁盘使用
docker system df

# 清理未使用资源
docker system prune -f
```

### 调试技巧

```bash
# 进入Backend容器
docker compose -f docker-compose.dev.yml exec backend sh

# 进入Frontend容器
docker compose -f docker-compose.dev.yml exec frontend sh

# 进入Python容器
docker compose -f docker-compose.dev.yml exec python-api bash

# 查看容器日志
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
docker compose -f docker-compose.dev.yml logs python-api
```

---

## 🆘 故障排除

### 常见问题

#### 1. 端口被占用

```bash
# 检查端口占用
lsof -i :80,3000,5000,5173

# 修改端口配置
# 编辑 docker-compose.dev.yml
```

#### 2. 容器启动失败

```bash
# 查看详细日志
docker compose -f docker-compose.dev.yml logs

# 重新构建
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

#### 3. 代码同步问题

```bash
# 检查挂载状态
docker compose -f docker-compose.dev.yml exec backend ls -la /app

# 重启服务
docker compose -f docker-compose.dev.yml restart
```

#### 4. 内存不足

```bash
# 查看资源使用
docker stats

# 清理资源
docker system prune -f

# 增加Docker内存限制
# Docker Desktop → Settings → Resources
```

### 数据恢复

```bash
# 从备份恢复
tar xzf backup-YYYYMMDD-HHMMSS.tar.gz

# 重启服务
docker compose -f docker-compose.dev.yml restart
```

---

## 🔄 跨平台同步最佳实践

### Git工作流

```bash
# 在Windows上开发
git add .
git commit -m "Windows开发: 新功能"
git push origin main

# 在Mac上同步
git pull origin main
./docker-start-mac.sh
```

### 数据同步

```bash
# 定期备份重要数据
./dev-tools.sh backup

# 使用Git LFS管理大文件
git lfs track "*.pkl"
git lfs track "backend/data/*"
git lfs track "backend/export/*"
```

### 环境一致性

```bash
# 使用相同的Docker配置
# docker-compose.dev.yml 确保环境一致

# 使用环境变量
# .env.mac 和 .env.windows 保持同步
```

---

## 📱 访问地址

开发环境启动后：

- **前端界面**: http://localhost
- **后端API**: http://localhost:3000
- **Python API**: http://localhost:5000
- **Vite开发服务器**: http://localhost:5173

### 健康检查

```bash
# 检查服务健康状态
curl http://localhost/health
curl http://localhost:3000/health
curl http://localhost:5000/health
```

---

## ✅ 检查清单

### 设置前检查

- [ ] Docker Desktop已安装并运行
- [ ] 项目代码已克隆到Mac
- [ ] 端口80, 3000, 5000, 5173可用
- [ ] 至少4GB可用内存
- [ ] 至少10GB可用磁盘空间

### 设置后验证

- [ ] 可以访问 http://localhost
- [ ] 后端API响应正常
- [ ] Python API响应正常
- [ ] 代码修改后自动重载
- [ ] 数据持久化正常
- [ ] 日志输出正常

### 同步验证

- [ ] 本地修改同步到容器
- [ ] 容器重启后代码更新
- [ ] 数据文件正确挂载
- [ ] 跨平台代码同步正常

---

## 🌟 高级功能

### 多环境开发

```bash
# 开发环境
docker compose -f docker-compose.dev.yml up -d

# 生产环境
docker compose -f docker-compose.yml up -d
```

### 自动化部署

```bash
# 创建部署脚本
cat > deploy.sh << 'EOF'
#!/bin/bash
git pull origin main
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
EOF

chmod +x deploy.sh
```

### 监控脚本

```bash
# 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "=== $(date) ==="
    docker compose -f docker-compose.dev.yml ps
    docker stats --no-stream
    sleep 60
done
EOF

chmod +x monitor.sh
```

---

## 📚 相关文档

- [MAC_DEVELOPMENT_GUIDE.md](./MAC_DEVELOPMENT_GUIDE.md) - Mac开发详细指南
- [Docker快速命令.md](./Docker快速命令.md) - Docker命令参考
- [Docker部署快速指南.md](./Docker部署快速指南.md) - Docker部署指南
- [README.md](./README.md) - 项目说明

---

## 🎉 开始使用

现在您已经拥有了完整的Mac开发环境！

**一键启动：**
```bash
./docker-start-mac.sh
```

**开始开发：**
- 修改代码 → 自动同步 → 热重载
- 跨平台同步 → Git推送 → Mac拉取
- 数据持久化 → 训练模型 → 自动保存

享受无缝的跨平台开发体验！🚀🍎
