# 🐳 Docker文件说明

## ✅ 已创建的Docker文件

### 核心配置文件

| 文件 | 说明 | 用途 |
|------|------|------|
| `docker-compose.yml` | Docker Compose配置 | 定义所有服务的编排 |
| `Dockerfile.backend` | Backend镜像定义 | 构建Node.js后端服务 |
| `Dockerfile.frontend` | Frontend镜像定义 | 构建React前端（Nginx） |
| `Dockerfile.python` | Python ML镜像定义 | 构建机器学习服务 |
| `.dockerignore` | 构建忽略文件 | 优化镜像构建速度 |

### Nginx配置

| 文件 | 说明 |
|------|------|
| `docker/nginx.conf` | Nginx服务器配置 |

### 启动脚本

| 文件 | 平台 | 说明 |
|------|------|------|
| `docker-start.bat` | Windows | 一键启动脚本 |
| `docker-start.sh` | Linux/Mac | 一键启动脚本 |

### 文档

| 文件 | 说明 |
|------|------|
| `DOCKER_GUIDE.md` | 完整Docker部署指南（英文） |
| `Docker部署快速指南.md` | 快速开始指南（中文） |
| `Docker文件说明.md` | 本文档 |

---

## 📦 服务架构

### 3个Docker容器

```
┌────────────────────────────────────────┐
│  jobtrack-frontend (Nginx + React)    │
│  Port: 80                              │
│  用途: 提供Web界面                      │
└────────────┬───────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
┌────▼─────┐   ┌─────▼────┐
│ backend  │   │  python  │
│ Node.js  │   │  Flask   │
│ Port:    │   │  Port:   │
│ 3000     │   │  5000    │
└──────────┘   └──────────┘
```

---

## 🚀 使用方法

### 最简单方式（推荐）

**Windows:**
```bash
docker-start.bat
```

**Linux/Mac:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

### Docker Compose方式

```bash
# 启动所有服务
docker compose up -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止所有服务
docker compose down

# 重新构建并启动
docker compose up -d --build
```

### 单独构建镜像

```bash
# 构建backend
docker build -f Dockerfile.backend -t jobtrack-backend .

# 构建frontend
docker build -f Dockerfile.frontend -t jobtrack-frontend .

# 构建python
docker build -f Dockerfile.python -t jobtrack-python .
```

---

## 📊 镜像信息

### Backend镜像
- **基础镜像**: `node:18-alpine`
- **大小**: ~200MB
- **端口**: 3000
- **健康检查**: ✅
- **自动重启**: ✅

### Frontend镜像
- **基础镜像**: `nginx:alpine`
- **构建方式**: Multi-stage build
- **大小**: ~50MB
- **端口**: 80
- **健康检查**: ✅
- **特性**: Gzip压缩、静态资源缓存

### Python ML镜像
- **基础镜像**: `python:3.11-slim`
- **大小**: ~800MB
- **端口**: 5000
- **健康检查**: ✅
- **包含**: scikit-learn, pandas, flask

---

## 💾 数据持久化

所有重要数据都挂载到宿主机，不会丢失：

```yaml
volumes:
  - ./backend/data:/app/data              # 后端数据
  - ./backend/export:/app/export          # Gmail导出
  - ./model.pkl:/app/model.pkl            # 训练模型
  - ./vectorizer.pkl:/app/vectorizer.pkl  # 向量化器
  - ./model_backups:/app/model_backups    # 模型备份
```

---

## 🔧 配置说明

### docker-compose.yml 结构

```yaml
version: '3.8'

services:
  backend:      # Node.js后端
  python-api:   # Python机器学习
  frontend:     # React前端 + Nginx

networks:
  jobtrack-network:  # 内部网络

volumes:
  backend-data:      # 数据卷
  backend-export:    # 导出数据
  model-backups:     # 模型备份
```

### 环境变量

可以创建`.env`文件自定义配置：

```env
# Backend
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost

# Python
FLASK_ENV=production
MODEL_PATH=/app/model.pkl
VECTORIZER_PATH=/app/vectorizer.pkl

# Frontend
VITE_API_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:5000
```

### 端口映射

默认端口映射：
- Frontend: `80:80`
- Backend: `3000:3000`
- Python: `5000:5000`

修改方法（在docker-compose.yml中）：
```yaml
ports:
  - "8080:80"  # 改为8080
```

---

## 🎯 常用场景

### 场景1: 首次部署

```bash
# 1. 确保有训练好的模型
ls model.pkl vectorizer.pkl

# 2. 一键启动
docker-start.bat

# 3. 等待10-20秒

# 4. 访问
http://localhost
```

### 场景2: 更新代码

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker compose build

# 3. 重启服务
docker compose up -d
```

### 场景3: 查看日志

```bash
# 查看所有日志
docker compose logs

# 实时查看
docker compose logs -f

# 查看特定服务
docker compose logs -f backend

# 查看最近100行
docker compose logs --tail=100
```

### 场景4: 进入容器调试

```bash
# 进入backend
docker compose exec backend sh

# 进入frontend
docker compose exec frontend sh

# 进入python
docker compose exec python-api bash
```

### 场景5: 在Docker中训练模型

```bash
# 方式1: 进入容器
docker compose exec python-api bash
python prepare_training_data.py
python train_model.py --data emails_real.csv
exit

# 方式2: 一行命令
docker compose run --rm python-api python train_model.py --data emails_real.csv

# 重启服务加载新模型
docker compose restart python-api
```

---

## 🔍 健康检查

所有服务都配置了健康检查：

### Backend健康检查
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', ...)"
```

### Python健康检查
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health').read()"
```

### 查看健康状态
```bash
docker compose ps
# 状态列会显示 "healthy" 或 "unhealthy"
```

---

## 🛡️ 安全特性

### Nginx安全头
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 网络隔离
- 所有服务在独立的Docker网络中
- 只暴露必要的端口到宿主机
- 服务间通过内部网络通信

### 资源限制（可选）
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

---

## 📈 性能优化

### 1. Multi-stage Build
Frontend使用两阶段构建：
- 第一阶段：编译React应用
- 第二阶段：只复制构建产物到Nginx

结果：镜像大小减少80%+

### 2. Alpine Linux
所有服务都基于Alpine，镜像更小、更安全

### 3. Layer缓存
Dockerfile优化了层缓存：
```dockerfile
# 先复制package.json
COPY package*.json ./
RUN npm ci

# 再复制源代码
COPY . .
```

### 4. .dockerignore
排除不必要的文件：
- node_modules
- .git
- 文档
- 测试文件

---

## 🆘 故障排除

### 问题1: 容器启动失败

```bash
# 查看详细日志
docker compose logs backend

# 重新构建
docker compose build --no-cache
docker compose up -d
```

### 问题2: 端口冲突

```bash
# 检查端口占用
netstat -ano | findstr :80

# 修改端口（docker-compose.yml）
ports:
  - "8080:80"
```

### 问题3: 无法访问服务

```bash
# 检查容器状态
docker compose ps

# 检查网络
docker network inspect jobtrack_jobtrack-network

# 重启服务
docker compose restart
```

### 问题4: 模型文件未加载

```bash
# 确认文件存在
ls -lh model.pkl vectorizer.pkl

# 检查挂载
docker compose exec python-api ls -lh /app/model.pkl

# 重启服务
docker compose restart python-api
```

---

## 📚 参考资源

### 官方文档
- [Docker文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Nginx文档](https://nginx.org/en/docs/)

### 项目文档
- [README.md](./README.md) - 项目说明
- [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - 完整Docker指南
- [Docker部署快速指南.md](./Docker部署快速指南.md) - 快速开始

### 学习资源
- [Docker最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose最佳实践](https://docs.docker.com/compose/production/)
- [Multi-stage Build](https://docs.docker.com/build/building/multi-stage/)

---

## ✅ 检查清单

### 部署前
- [ ] Docker已安装 (`docker --version`)
- [ ] Docker Compose已安装 (`docker compose version`)
- [ ] 端口可用 (80, 3000, 5000)
- [ ] 模型文件存在 (model.pkl, vectorizer.pkl)
- [ ] 至少2GB可用内存
- [ ] 至少5GB可用磁盘

### 部署后
- [ ] 所有容器运行 (`docker compose ps`)
- [ ] 健康检查通过
- [ ] 可访问前端 (http://localhost)
- [ ] 可访问后端API (http://localhost:3000/health)
- [ ] 可访问Python API (http://localhost:5000/health)
- [ ] Gmail登录正常
- [ ] 邮件分类功能正常

---

## 🎉 总结

你现在拥有：

✅ **完整的Docker化方案**
- 3个Dockerfile
- 1个docker-compose.yml
- Nginx配置
- 健康检查
- 数据持久化

✅ **一键启动脚本**
- Windows批处理
- Linux/Mac Shell脚本
- 自动环境检查

✅ **详细文档**
- 英文完整指南
- 中文快速指南
- 故障排除手册

✅ **生产级配置**
- 安全头
- 资源限制
- 日志管理
- 自动重启

---

**立即开始Docker部署！**

只需一条命令：
```bash
docker-start.bat
```

就这么简单！🐳

