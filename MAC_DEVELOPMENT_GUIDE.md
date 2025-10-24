# 🍎 Mac开发环境同步指南

在Mac电脑上同步运行和修改Docker中的JobTrack代码！

---

## 🚀 快速开始

### 1. 克隆项目到Mac

```bash
# 克隆项目
git clone <your-repo-url> jobtrack
cd jobtrack

# 或者如果已有项目，拉取最新代码
git pull origin main
```

### 2. 启动开发环境

```bash
# 给脚本执行权限
chmod +x docker-start-mac.sh

# 启动开发环境
./docker-start-mac.sh
```

选择 `1` 进行首次启动，系统会自动：
- 构建所有Docker镜像
- 启动开发模式服务
- 配置代码热重载
- 设置数据持久化

---

## 🔄 代码同步机制

### 开发模式特性

✅ **实时同步**: 本地代码修改立即同步到容器  
✅ **热重载**: 代码修改后服务自动重启  
✅ **数据持久化**: 训练数据和模型文件持久保存  
✅ **调试友好**: 支持断点和详细日志  

### 目录映射

```
本地目录                    → 容器目录
./backend/                  → /app (Backend容器)
./frontend/                 → /app (Frontend容器)  
./app.py                    → /app/app.py (Python容器)
./model.pkl                 → /app/model.pkl
./vectorizer.pkl           → /app/vectorizer.pkl
./backend/data/             → /app/data (持久化)
./backend/export/           → /app/export (持久化)
```

---

## 🛠️ 开发工作流

### 修改后端代码

```bash
# 1. 在Mac上编辑 backend/ 目录下的文件
vim backend/server.js

# 2. 保存后，容器会自动重启
# 3. 查看重启日志
docker compose -f docker-compose.dev.yml logs -f backend
```

### 修改前端代码

```bash
# 1. 在Mac上编辑 frontend/src/ 目录下的文件
vim frontend/src/Dashboard.jsx

# 2. Vite会自动热重载
# 3. 浏览器自动刷新
```

### 修改Python代码

```bash
# 1. 在Mac上编辑Python文件
vim app.py

# 2. Flask开发模式会自动重启
# 3. 查看重启日志
docker compose -f docker-compose.dev.yml logs -f python-api
```

### 训练新模型

```bash
# 方式1: 在Mac上训练（推荐）
python train_model.py --data emails_real.csv

# 方式2: 在容器中训练
docker compose -f docker-compose.dev.yml exec python-api python train_model.py --data emails_real.csv

# 重启Python服务加载新模型
docker compose -f docker-compose.dev.yml restart python-api
```

---

## 📊 服务管理

### 查看服务状态

```bash
# 查看所有服务
docker compose -f docker-compose.dev.yml ps

# 查看资源使用
docker stats --no-stream

# 查看服务日志
docker compose -f docker-compose.dev.yml logs -f
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.dev.yml restart

# 重启特定服务
docker compose -f docker-compose.dev.yml restart backend
docker compose -f docker-compose.dev.yml restart frontend
docker compose -f docker-compose.dev.yml restart python-api
```

### 进入容器调试

```bash
# 进入Backend容器
docker compose -f docker-compose.dev.yml exec backend sh

# 进入Frontend容器
docker compose -f docker-compose.dev.yml exec frontend sh

# 进入Python容器
docker compose -f docker-compose.dev.yml exec python-api bash
```

---

## 🔧 常用开发命令

### 启动和停止

```bash
# 启动开发环境
./docker-start-mac.sh

# 停止所有服务
docker compose -f docker-compose.dev.yml down

# 停止并清理
docker compose -f docker-compose.dev.yml down -v
```

### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
```

### 清理资源

```bash
# 清理未使用的Docker资源
docker system prune -f

# 清理所有（包括数据卷）⚠️
docker system prune -a --volumes
```

---

## 🎯 开发最佳实践

### 1. 代码同步

- ✅ 使用Git进行版本控制
- ✅ 定期提交代码变更
- ✅ 使用分支进行功能开发
- ✅ 代码修改后立即测试

### 2. 数据管理

- ✅ 重要数据定期备份
- ✅ 模型文件版本控制
- ✅ 训练数据妥善保存
- ✅ 使用数据卷持久化

### 3. 调试技巧

- ✅ 使用开发模式日志
- ✅ 利用热重载快速迭代
- ✅ 进入容器进行调试
- ✅ 监控资源使用情况

---

## 🆘 故障排除

### 端口被占用

```bash
# 检查端口占用
lsof -i :80
lsof -i :3000
lsof -i :5000
lsof -i :5173

# 修改端口映射
# 编辑 docker-compose.dev.yml
```

### 容器启动失败

```bash
# 查看详细日志
docker compose -f docker-compose.dev.yml logs

# 检查容器状态
docker compose -f docker-compose.dev.yml ps -a

# 重新构建
docker compose -f docker-compose.dev.yml build --no-cache
```

### 代码同步问题

```bash
# 检查挂载状态
docker compose -f docker-compose.dev.yml exec backend ls -la /app

# 重启服务
docker compose -f docker-compose.dev.yml restart

# 检查文件权限
ls -la backend/
```

### 内存不足

```bash
# 查看资源使用
docker stats

# 清理未使用资源
docker system prune -f

# 增加Docker内存限制
# Docker Desktop → Settings → Resources
```

---

## 📱 访问地址

开发环境启动后，可以通过以下地址访问：

- **前端界面**: http://localhost
- **后端API**: http://localhost:3000
- **Python API**: http://localhost:5000
- **Vite开发服务器**: http://localhost:5173

---

## 🔄 与Windows环境同步

### 使用Git同步

```bash
# 在Mac上
git add .
git commit -m "Mac开发: 添加新功能"
git push origin main

# 在Windows上
git pull origin main
docker compose -f docker-compose.dev.yml up -d --build
```

### 数据同步

```bash
# 备份数据
tar czf jobtrack-data-backup.tar.gz \
  backend/data \
  backend/export \
  model.pkl \
  vectorizer.pkl

# 恢复数据
tar xzf jobtrack-data-backup.tar.gz
```

---

## 🌟 高级功能

### 多环境开发

```bash
# 开发环境
docker compose -f docker-compose.dev.yml up -d

# 生产环境
docker compose -f docker-compose.yml up -d
```

### 自定义配置

创建 `.env` 文件：

```env
# 开发环境配置
NODE_ENV=development
FLASK_ENV=development
VITE_API_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:5000
```

### 性能优化

```bash
# 限制资源使用
# 在 docker-compose.dev.yml 中添加：
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
```

---

## ✅ 检查清单

### 开发前准备

- [ ] Docker Desktop已安装并运行
- [ ] 项目代码已克隆到Mac
- [ ] 端口80, 3000, 5000, 5173可用
- [ ] 至少4GB可用内存
- [ ] 至少10GB可用磁盘空间

### 开发环境验证

- [ ] 可以访问 http://localhost
- [ ] 后端API响应正常
- [ ] Python API响应正常
- [ ] 代码修改后自动重载
- [ ] 数据持久化正常

### 代码同步验证

- [ ] 本地修改同步到容器
- [ ] 容器重启后代码更新
- [ ] 数据文件正确挂载
- [ ] 日志输出正常

---

**开始您的Mac开发之旅吧！🍎**

只需一条命令：
```bash
./docker-start-mac.sh
```

享受无缝的跨平台开发体验！🚀
