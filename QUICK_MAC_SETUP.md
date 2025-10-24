# 🚀 Mac快速设置指南

在Mac上快速同步运行和修改Docker中的JobTrack代码！

---

## ⚡ 3步快速开始

### 步骤1: 在Windows上同步代码

```bash
# 在Windows项目目录运行
./sync-to-mac.sh
```

### 步骤2: 在Mac上设置环境

```bash
# 克隆项目
git clone <your-repo-url> jobtrack
cd jobtrack

# 一键设置
chmod +x setup-mac-dev.sh
./setup-mac-dev.sh
```

### 步骤3: 启动开发环境

```bash
# 启动服务
./docker-start-mac.sh
```

选择 `1` 首次启动，然后访问 http://localhost

---

## 🎯 核心特性

✅ **代码热重载** - 修改代码自动重启  
✅ **实时同步** - 本地修改立即生效  
✅ **数据持久化** - 训练数据自动保存  
✅ **跨平台同步** - Windows ↔ Mac 无缝切换  

---

## 🛠️ 常用命令

```bash
# 启动开发环境
./docker-start-mac.sh

# 使用开发工具
./dev-tools.sh start      # 启动
./dev-tools.sh logs       # 查看日志
./dev-tools.sh stop       # 停止
./dev-tools.sh status     # 查看状态
./dev-tools.sh shell      # 进入容器
```

---

## 📱 访问地址

- **前端**: http://localhost
- **后端API**: http://localhost:3000
- **Python API**: http://localhost:5000
- **Vite开发**: http://localhost:5173

---

## 🔄 跨平台同步

### Windows → Mac
```bash
# Windows上
./sync-to-mac.sh

# Mac上
git pull origin main
./docker-start-mac.sh
```

### Mac → Windows
```bash
# Mac上
git add . && git commit -m "Mac开发" && git push

# Windows上
git pull origin main
docker compose up -d --build
```

---

## 🆘 快速故障排除

### 端口被占用
```bash
lsof -i :80,3000,5000,5173
# 修改 docker-compose.dev.yml 中的端口
```

### 容器启动失败
```bash
docker compose -f docker-compose.dev.yml logs
docker compose -f docker-compose.dev.yml build --no-cache
```

### 代码不同步
```bash
docker compose -f docker-compose.dev.yml restart
```

---

## 📚 详细文档

- [MAC_SYNC_COMPLETE_GUIDE.md](./MAC_SYNC_COMPLETE_GUIDE.md) - 完整同步指南
- [MAC_DEVELOPMENT_GUIDE.md](./MAC_DEVELOPMENT_GUIDE.md) - 详细开发指南
- [Docker快速命令.md](./Docker快速命令.md) - Docker命令参考

---

**开始您的Mac开发之旅！🍎**

只需3步，享受无缝的跨平台开发体验！
