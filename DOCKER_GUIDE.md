# 🐳 JobTrack Docker 部署指南

完整的Docker化部署方案，支持一键启动所有服务。

## 📋 目录

1. [系统要求](#系统要求)
2. [快速开始](#快速开始)
3. [详细说明](#详细说明)
4. [配置选项](#配置选项)
5. [常用命令](#常用命令)
6. [故障排除](#故障排除)

---

## 系统要求

### 必需软件
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 系统资源
- **内存**: 至少2GB可用RAM
- **存储**: 至少5GB可用空间
- **网络**: 端口 80, 3000, 5000 需要可用

### 检查安装

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker compose version

# 验证Docker运行
docker ps
```

---

## 快速开始

### 方式1: 使用 Docker Compose（推荐）

```bash
# 1. 克隆或进入项目目录
cd jobtrack

# 2. 构建并启动所有服务
docker compose up -d

# 3. 查看服务状态
docker compose ps

# 4. 查看日志
docker compose logs -f
```

### 方式2: 分别构建和运行

```bash
# 构建镜像
docker build -f Dockerfile.backend -t jobtrack-backend .
docker build -f Dockerfile.frontend -t jobtrack-frontend .
docker build -f Dockerfile.python -t jobtrack-python .

# 运行容器
docker run -d --name jobtrack-backend -p 3000:3000 jobtrack-backend
docker run -d --name jobtrack-python -p 5000:5000 jobtrack-python
docker run -d --name jobtrack-frontend -p 80:80 jobtrack-frontend
```

### 访问应用

服务启动后，访问：
- **前端界面**: http://localhost
- **后端API**: http://localhost:3000
- **Python ML API**: http://localhost:5000
- **健康检查**: 
  - http://localhost/health
  - http://localhost:3000/health
  - http://localhost:5000/health

---

## 详细说明

### 架构设计

```
┌─────────────────────────────────────────────────┐
│  Nginx (Frontend) - Port 80                     │
│  - Serve React App                              │
│  - Reverse Proxy to Backend                     │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼──────┐  ┌──────▼─────────┐
│ Node.js      │  │ Python Flask   │
│ Backend      │  │ ML Service     │
│ Port 3000    │  │ Port 5000      │
└──────────────┘  └────────────────┘
```

### 容器说明

#### 1. Frontend (Nginx + React)
- **基础镜像**: nginx:alpine
- **构建方式**: Multi-stage build
- **端口**: 80
- **功能**: 
  - 提供React应用
  - 反向代理API请求
  - 静态资源缓存

#### 2. Backend (Node.js)
- **基础镜像**: node:18-alpine
- **端口**: 3000
- **功能**:
  - RESTful API服务
  - Gmail集成
  - 标签管理

#### 3. Python ML Service
- **基础镜像**: python:3.11-slim
- **端口**: 5000
- **功能**:
  - 邮件分类模型
  - 训练服务
  - 预测API

### 数据持久化

使用Docker volumes保存重要数据：

```yaml
volumes:
  - ./backend/data:/app/data          # 后端数据
  - ./backend/export:/app/export      # Gmail导出数据
  - ./model.pkl:/app/model.pkl        # 训练模型
  - ./vectorizer.pkl:/app/vectorizer.pkl  # 向量化器
  - ./model_backups:/app/model_backups    # 模型备份
```

---

## 配置选项

### 环境变量

创建 `.env` 文件：

```env
# Backend
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost

# Python API
FLASK_ENV=production
MODEL_PATH=/app/model.pkl
VECTORIZER_PATH=/app/vectorizer.pkl

# Frontend
VITE_API_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:5000
```

### 自定义端口

修改 `docker-compose.yml`：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改为8080端口
  backend:
    ports:
      - "3001:3000"  # 改为3001端口
```

### 生产环境优化

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    restart: always
```

---

## 常用命令

### 启动和停止

```bash
# 启动所有服务
docker compose up -d

# 启动特定服务
docker compose up -d backend

# 停止所有服务
docker compose down

# 停止并删除数据卷
docker compose down -v

# 重启服务
docker compose restart

# 重启特定服务
docker compose restart backend
```

### 查看状态

```bash
# 查看运行中的容器
docker compose ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看资源使用
docker stats

# 查看特定容器详情
docker inspect jobtrack-backend
```

### 日志管理

```bash
# 查看所有服务日志
docker compose logs

# 实时查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs backend

# 查看最近100行日志
docker compose logs --tail=100

# 查看带时间戳的日志
docker compose logs -t
```

### 进入容器

```bash
# 进入backend容器
docker compose exec backend sh

# 进入frontend容器
docker compose exec frontend sh

# 进入python容器
docker compose exec python-api bash

# 以root用户进入
docker compose exec -u root backend sh
```

### 构建和更新

```bash
# 重新构建所有镜像
docker compose build

# 重新构建特定服务
docker compose build backend

# 不使用缓存构建
docker compose build --no-cache

# 拉取最新基础镜像
docker compose pull

# 构建并启动
docker compose up -d --build
```

### 清理

```bash
# 删除停止的容器
docker compose rm

# 删除未使用的镜像
docker image prune

# 删除未使用的容器、网络、镜像
docker system prune

# 删除所有（包括volumes）
docker system prune -a --volumes
```

---

## 在Docker中训练模型

### 方式1: 在运行中的容器内训练

```bash
# 进入Python容器
docker compose exec python-api bash

# 准备数据
python prepare_training_data.py

# 训练模型
python train_model.py --data emails_real.csv

# 退出容器
exit

# 重启Python服务加载新模型
docker compose restart python-api
```

### 方式2: 使用宿主机训练

```bash
# 在宿主机上训练
python train_model.py --data emails_real.csv

# 重启Docker容器加载新模型
docker compose restart python-api
```

### 方式3: 创建训练脚本

```bash
# 创建一次性训练容器
docker compose run --rm python-api python prepare_training_data.py
docker compose run --rm python-api python train_model.py --data emails_real.csv
```

---

## 故障排除

### 问题1: 端口已被占用

**错误信息**:
```
Error starting userland proxy: listen tcp 0.0.0.0:80: bind: address already in use
```

**解决方案**:
```bash
# 查看占用端口的进程
# Windows
netstat -ano | findstr :80

# Linux/Mac
lsof -i :80

# 修改docker-compose.yml使用其他端口
ports:
  - "8080:80"
```

### 问题2: 容器无法启动

**解决方案**:
```bash
# 查看详细日志
docker compose logs backend

# 查看容器状态
docker compose ps

# 重新构建
docker compose build --no-cache backend
docker compose up -d backend
```

### 问题3: 网络连接问题

**解决方案**:
```bash
# 查看网络
docker network ls

# 检查容器网络
docker network inspect jobtrack_jobtrack-network

# 重建网络
docker compose down
docker network prune
docker compose up -d
```

### 问题4: 数据持久化丢失

**解决方案**:
```bash
# 检查volumes
docker volume ls

# 查看volume详情
docker volume inspect jobtrack_backend-data

# 备份volume
docker run --rm -v jobtrack_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/backend-data-backup.tar.gz /data
```

### 问题5: 内存不足

**解决方案**:
```bash
# 查看资源使用
docker stats

# 限制资源（在docker-compose.yml中）
deploy:
  resources:
    limits:
      memory: 512M
```

### 问题6: 模型文件未加载

**解决方案**:
```bash
# 确认模型文件存在
ls -lh model.pkl vectorizer.pkl

# 检查volume挂载
docker compose exec python-api ls -lh /app/model.pkl

# 重新挂载
docker compose down
docker compose up -d
```

---

## 生产环境部署

### 1. 使用环境变量文件

```bash
# 创建 .env.production
cp .env .env.production

# 修改配置
nano .env.production

# 使用指定环境文件
docker compose --env-file .env.production up -d
```

### 2. HTTPS配置

使用Nginx + Let's Encrypt:

```bash
# 安装certbot
# 在docker/nginx.conf中添加SSL配置

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}
```

### 3. 监控和日志

```bash
# 使用docker-compose的日志驱动
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 4. 自动重启

```yaml
services:
  backend:
    restart: always
  frontend:
    restart: always
  python-api:
    restart: always
```

---

## 性能优化

### 1. 多阶段构建

前端已使用multi-stage build减小镜像大小。

### 2. 缓存优化

```dockerfile
# 先复制package.json，利用layer缓存
COPY package*.json ./
RUN npm ci

# 再复制源代码
COPY . .
```

### 3. 使用Alpine镜像

所有服务都基于Alpine Linux，镜像更小。

### 4. 健康检查

所有服务都配置了健康检查，确保可靠性。

---

## 备份和恢复

### 备份

```bash
# 创建backup脚本
./backup-docker.sh

# 或手动备份
docker compose down
tar czf jobtrack-backup-$(date +%Y%m%d).tar.gz \
  backend/data \
  backend/export \
  model.pkl \
  vectorizer.pkl \
  model_backups
docker compose up -d
```

### 恢复

```bash
# 解压备份
tar xzf jobtrack-backup-20240101.tar.gz

# 重启服务
docker compose down
docker compose up -d
```

---

## 常见问答

### Q: Docker镜像多大？
A: 
- Frontend: ~50MB (nginx + React build)
- Backend: ~200MB (node:18-alpine + deps)
- Python: ~800MB (python:3.11-slim + ML libs)
- Total: ~1GB

### Q: 如何更新应用？
A:
```bash
git pull
docker compose build
docker compose up -d
```

### Q: 如何扩展服务？
A:
```bash
docker compose up -d --scale backend=3
```

### Q: 如何查看所有API端点？
A:
```bash
docker compose exec backend npm run routes
```

---

## 相关资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Nginx配置](https://nginx.org/en/docs/)
- [项目README](./README.md)

---

**祝部署顺利！🐳**

