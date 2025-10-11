# 🐳 Docker部署快速指南

用Docker一键部署整个JobTrack应用！

---

## ✅ 完全可行！

Docker部署有以下优势：
- ✅ **环境一致**: 开发、测试、生产环境完全一致
- ✅ **快速部署**: 一键启动所有服务
- ✅ **易于管理**: 统一的启停、更新、监控
- ✅ **资源隔离**: 各服务独立运行，互不干扰
- ✅ **易于扩展**: 可轻松横向扩展

---

## 🚀 最快开始方式

### Windows用户

```cmd
docker-start.bat
```

### Linux/Mac用户

```bash
chmod +x docker-start.sh
./docker-start.sh
```

就这么简单！脚本会自动：
1. 检查Docker环境
2. 构建所有镜像
3. 启动所有服务
4. 显示访问地址

---

## 📦 你将获得什么

运行后会启动3个容器：

| 容器 | 服务 | 端口 | 说明 |
|------|------|------|------|
| jobtrack-frontend | React前端 | 80 | 用户界面 |
| jobtrack-backend | Node.js API | 3000 | 后端服务 |
| jobtrack-python | Python ML | 5000 | 机器学习 |

### 访问地址

- **前端**: http://localhost
- **后端API**: http://localhost:3000
- **Python API**: http://localhost:5000

---

## 📋 前提条件

### 1. 安装Docker

**Windows/Mac:**
- 下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 验证安装

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker compose version

# 验证Docker运行
docker ps
```

---

## 🎯 详细步骤

### 步骤 1: 准备项目

确保你在项目根目录，并且有以下文件：
- `docker-compose.yml`
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `Dockerfile.python`

### 步骤 2: 构建和启动

```bash
# 一键启动（推荐）
docker compose up -d --build

# 查看启动状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 步骤 3: 验证服务

等待10-20秒后：

```bash
# 检查健康状态
curl http://localhost/health
curl http://localhost:3000/health
curl http://localhost:5000/health

# 或在浏览器中打开
http://localhost
```

---

## 🛠️ 常用操作

### 查看状态

```bash
# 查看运行中的容器
docker compose ps

# 查看资源使用
docker stats

# 查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
```

### 停止和重启

```bash
# 停止所有服务
docker compose down

# 停止但保留数据
docker compose stop

# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart backend
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build

# 查看更新日志
docker compose logs -f
```

### 清理

```bash
# 停止并删除容器
docker compose down

# 同时删除volumes（会丢失数据！）
docker compose down -v

# 清理未使用的镜像
docker image prune -a
```

---

## 🎓 在Docker中训练模型

### 方式1: 进入容器训练

```bash
# 进入Python容器
docker compose exec python-api bash

# 准备数据
python prepare_training_data.py

# 训练模型
python train_model.py --data emails_real.csv

# 退出
exit

# 重启服务加载新模型
docker compose restart python-api
```

### 方式2: 使用宿主机训练

```bash
# 在宿主机训练（推荐）
python train_model.py --data emails_real.csv

# 重启Docker服务
docker compose restart python-api
```

---

## 🔧 自定义配置

### 修改端口

编辑 `docker-compose.yml`：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改为8080端口
```

### 设置环境变量

创建 `.env` 文件：

```env
NODE_ENV=production
FLASK_ENV=production
FRONTEND_PORT=80
BACKEND_PORT=3000
PYTHON_PORT=5000
```

### 资源限制

在 `docker-compose.yml` 中添加：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## 🆘 常见问题

### Q: 端口被占用怎么办？

**A**: 修改 docker-compose.yml 中的端口映射

```yaml
ports:
  - "8080:80"  # 使用8080替代80
```

### Q: 容器启动失败？

**A**: 查看详细日志

```bash
# 查看所有日志
docker compose logs

# 查看特定服务
docker compose logs backend

# 实时查看
docker compose logs -f
```

### Q: 如何访问容器内部？

**A**: 使用exec命令

```bash
# 进入backend容器
docker compose exec backend sh

# 进入frontend容器
docker compose exec frontend sh

# 进入python容器
docker compose exec python-api bash
```

### Q: 数据会丢失吗？

**A**: 不会，重要数据都挂载到宿主机：

```yaml
volumes:
  - ./backend/data:/app/data
  - ./model.pkl:/app/model.pkl
  - ./vectorizer.pkl:/app/vectorizer.pkl
```

### Q: 如何更新代码？

**A**: 重新构建镜像

```bash
git pull
docker compose build
docker compose up -d
```

### Q: 如何备份数据？

**A**: 直接备份宿主机目录

```bash
# 备份
tar czf jobtrack-backup.tar.gz \
  backend/data \
  backend/export \
  model.pkl \
  vectorizer.pkl

# 恢复
tar xzf jobtrack-backup.tar.gz
docker compose restart
```

---

## 📊 架构说明

### 服务架构

```
┌─────────────────────────────────────┐
│   Nginx (Port 80)                   │
│   - 提供React前端                    │
│   - 反向代理到Backend和Python       │
└───────────┬─────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼────┐    ┌────▼────┐
│Backend │    │ Python  │
│  API   │    │   ML    │
│ :3000  │    │  :5000  │
└────────┘    └─────────┘
```

### 数据流

```
用户浏览器
    │
    ↓
Nginx (Frontend)
    │
    ├→ /api/* → Backend (Node.js)
    │              ↓
    │         Gmail API
    │
    └→ /ml/*  → Python ML Service
                   ↓
              训练模型
```

---

## 🌟 最佳实践

### 1. 开发环境

```bash
# 使用热重载开发
docker compose -f docker-compose.dev.yml up
```

### 2. 生产环境

```bash
# 使用生产配置
docker compose -f docker-compose.prod.yml up -d
```

### 3. 定期维护

```bash
# 每周检查一次
docker system df        # 查看磁盘使用
docker system prune     # 清理未使用资源
```

### 4. 监控日志

```bash
# 设置日志轮转
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 📚 更多信息

详细文档请查看：
- [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - 完整Docker部署指南
- [README.md](./README.md) - 项目说明
- [TRAIN_WITH_REAL_GMAIL_DATA.md](./TRAIN_WITH_REAL_GMAIL_DATA.md) - 训练指南

---

## ✅ 检查清单

部署前确认：

- [ ] Docker已安装并运行
- [ ] 端口 80, 3000, 5000 可用
- [ ] 至少2GB可用内存
- [ ] 至少5GB可用磁盘空间
- [ ] 已训练模型文件 (model.pkl, vectorizer.pkl)

部署后验证：

- [ ] 可以访问 http://localhost
- [ ] 后端健康检查通过
- [ ] Python API健康检查通过
- [ ] 可以登录Gmail
- [ ] 邮件分类功能正常

---

**开始Docker化你的JobTrack吧！🚀**

只需一条命令：
```bash
docker compose up -d
```

就这么简单！

