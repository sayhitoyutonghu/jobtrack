# 🐳 Docker快速命令参考

## 🚀 启动服务

### 方式1: 使用中文启动脚本（最简单）
```bash
启动Docker服务.bat
```
会显示菜单让你选择：
1. 首次启动（构建并启动）
2. 快速启动（使用现有镜像）
3. 重新构建并启动
4. 停止所有服务
5. 查看服务日志
6. 查看服务状态

### 方式2: 使用英文启动脚本
```bash
docker-start.bat
```

### 方式3: 直接使用Docker Compose
```bash
# 首次启动
docker compose up -d --build

# 快速启动
docker compose up -d

# 后台启动并实时查看日志
docker compose up -d && docker compose logs -f
```

---

## 📊 查看状态

```bash
# 查看运行中的容器
docker compose ps

# 查看所有容器详情
docker ps -a

# 查看资源使用情况
docker stats

# 查看镜像列表
docker images
```

---

## 📋 查看日志

```bash
# 查看所有服务日志
docker compose logs

# 实时查看日志（推荐）
docker compose logs -f

# 查看特定服务日志
docker compose logs backend
docker compose logs frontend
docker compose logs python-api

# 查看最近100行日志
docker compose logs --tail=100

# 查看带时间戳的日志
docker compose logs -t
```

---

## 🔄 重启服务

```bash
# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart backend
docker compose restart frontend
docker compose restart python-api

# 优雅重启（先停止再启动）
docker compose down
docker compose up -d
```

---

## 🛑 停止服务

```bash
# 停止所有服务（保留容器）
docker compose stop

# 停止并删除容器（保留数据）
docker compose down

# 停止并删除所有内容（包括数据卷）⚠️
docker compose down -v

# 停止特定服务
docker compose stop backend
```

---

## 🔨 构建和更新

```bash
# 重新构建所有镜像
docker compose build

# 不使用缓存重新构建
docker compose build --no-cache

# 重新构建特定服务
docker compose build backend

# 拉取最新基础镜像
docker compose pull

# 重新构建并启动
docker compose up -d --build
```

---

## 🔍 进入容器调试

```bash
# 进入backend容器
docker compose exec backend sh

# 进入frontend容器
docker compose exec frontend sh

# 进入python容器
docker compose exec python-api bash

# 以root用户进入
docker compose exec -u root backend sh

# 在容器中执行命令（不进入）
docker compose exec backend ls -la
docker compose exec python-api python --version
```

---

## 🎓 在Docker中训练模型

```bash
# 方式1: 进入容器训练
docker compose exec python-api bash
python prepare_training_data.py
python train_model.py --data emails_real.csv
exit

# 方式2: 直接执行命令
docker compose exec python-api python prepare_training_data.py
docker compose exec python-api python train_model.py --data emails_real.csv

# 方式3: 使用run命令（一次性容器）
docker compose run --rm python-api python train_model.py --data emails_real.csv

# 训练后重启服务加载新模型
docker compose restart python-api
```

---

## 🧹 清理和维护

```bash
# 删除停止的容器
docker compose rm

# 删除未使用的镜像
docker image prune

# 删除未使用的镜像（包括没有标签的）
docker image prune -a

# 清理所有未使用的资源
docker system prune

# 清理所有（包括volumes）⚠️
docker system prune -a --volumes

# 查看磁盘使用
docker system df
```

---

## 🔧 网络管理

```bash
# 查看网络列表
docker network ls

# 查看网络详情
docker network inspect jobtrack_jobtrack-network

# 重建网络
docker compose down
docker network prune
docker compose up -d
```

---

## 💾 数据卷管理

```bash
# 查看数据卷
docker volume ls

# 查看数据卷详情
docker volume inspect jobtrack_backend-data

# 备份数据卷
docker run --rm -v jobtrack_backend-data:/data -v D:\backup:/backup alpine tar czf /backup/backend-data.tar.gz /data

# 恢复数据卷
docker run --rm -v jobtrack_backend-data:/data -v D:\backup:/backup alpine tar xzf /backup/backend-data.tar.gz -C /
```

---

## 🆘 故障排除

### 端口被占用
```bash
# 检查端口占用
netstat -ano | findstr :80
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# 修改docker-compose.yml端口映射
# ports:
#   - "8080:80"
```

### 容器启动失败
```bash
# 查看详细错误
docker compose logs backend

# 查看容器状态
docker inspect jobtrack-backend

# 重新构建
docker compose build --no-cache backend
docker compose up -d backend
```

### 模型文件未加载
```bash
# 检查文件
ls -lh model.pkl vectorizer.pkl

# 检查容器内文件
docker compose exec python-api ls -lh /app/model.pkl

# 重新挂载
docker compose down
docker compose up -d
```

### 内存不足
```bash
# 查看资源使用
docker stats

# 清理未使用资源
docker system prune
```

---

## 📱 健康检查

```bash
# 检查所有服务健康状态
docker compose ps

# 测试各服务端点
curl http://localhost/health
curl http://localhost:3000/health
curl http://localhost:5000/health

# 在浏览器中测试
start http://localhost/health
start http://localhost:3000/health
start http://localhost:5000/health
```

---

## 🎯 常用组合命令

### 完全重启
```bash
docker compose down && docker compose up -d --build && docker compose logs -f
```

### 快速查看状态
```bash
docker compose ps && docker stats --no-stream
```

### 清理并重启
```bash
docker compose down -v && docker system prune -f && docker compose up -d --build
```

### 查看所有日志
```bash
docker compose logs --tail=50
```

### 导出容器日志到文件
```bash
docker compose logs > logs.txt
```

---

## 🌟 一键命令速查表

| 需求 | 命令 |
|------|------|
| 首次启动 | `docker compose up -d --build` |
| 快速启动 | `docker compose up -d` |
| 停止服务 | `docker compose down` |
| 查看状态 | `docker compose ps` |
| 查看日志 | `docker compose logs -f` |
| 重启服务 | `docker compose restart` |
| 进入容器 | `docker compose exec backend sh` |
| 训练模型 | `docker compose exec python-api python train_model.py --data emails_real.csv` |
| 清理资源 | `docker system prune` |
| 查看资源 | `docker stats` |

---

## 💡 推荐工作流

### 开发时
```bash
# 1. 启动服务
docker compose up -d

# 2. 查看日志确认启动
docker compose logs -f

# 3. 修改代码后重新构建
docker compose build
docker compose up -d

# 4. 查看更新日志
docker compose logs -f
```

### 生产时
```bash
# 1. 拉取最新代码
git pull

# 2. 停止服务
docker compose down

# 3. 重新构建
docker compose build --no-cache

# 4. 启动服务
docker compose up -d

# 5. 验证健康状态
docker compose ps
```

---

**记住这个最常用的命令！**
```bash
启动Docker服务.bat
```
它会给你一个友好的中文菜单！🚀

