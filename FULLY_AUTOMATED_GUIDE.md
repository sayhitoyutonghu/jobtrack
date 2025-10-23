# JobTrack 完全自动化使用指南

## 🎯 目标：一次连接，永久自动化

JobTrack现在支持完全自动化模式，用户只需连接Gmail一次，系统将自动处理所有后续操作，无需任何手动干预。

## 🚀 快速开始

### 方法一：一键设置（推荐）

**Windows用户：**
```bash
setup-auto-mode.bat
```

**Linux/Mac用户：**
```bash
./setup-auto-mode.sh
```

### 方法二：手动设置

1. **启动后端服务**
```bash
cd backend
npm run start:autoscan
```

2. **启动前端界面**
```bash
cd frontend
npm run dev
```

3. **连接Gmail**
   - 访问 http://localhost:5173
   - 点击 "Sign in with Google"
   - 完成OAuth授权

4. **系统自动开始工作**
   - 自动启动扫描
   - 自动token刷新
   - 后台持续运行

## 🤖 自动化功能

### ✅ 已实现的自动化功能

1. **持久化认证存储**
   - 用户认证信息永久保存
   - 支持多个用户同时使用
   - 自动会话管理

2. **自动Token刷新**
   - 提前5分钟自动刷新token
   - 无需用户重新登录
   - 自动处理认证失效

3. **自动启动扫描**
   - 用户连接Gmail后立即开始扫描
   - 系统重启后自动恢复扫描
   - 支持多用户并发扫描

4. **后台服务模式**
   - 系统后台持续运行
   - 自动错误恢复
   - 进程监控和重启

5. **系统服务安装**
   - 开机自启动
   - 系统服务管理
   - 跨平台支持

### 🔄 自动化流程

```
用户操作 → 系统响应
─────────  ──────────
连接Gmail → 自动开始扫描
系统重启 → 自动恢复所有会话
Token过期 → 自动刷新token
扫描错误 → 自动重试和恢复
```

## 📊 系统架构

### 核心组件

1. **AutoManagerService** - 自动管理器
   - 管理所有用户会话
   - 自动启动和停止扫描
   - Token自动刷新

2. **AutoScanService** - 自动扫描服务
   - 定时扫描Gmail
   - 智能分类邮件
   - 错误处理和恢复

3. **BackgroundService** - 后台服务
   - 进程管理
   - 日志记录
   - 系统集成

4. **SessionStore** - 会话存储
   - 持久化认证信息
   - 多用户支持
   - 数据安全

### 数据流

```
用户Gmail → OAuth认证 → 会话存储 → 自动扫描 → 邮件分类 → Gmail标签
    ↑                                                      ↓
    └─────────── 自动刷新 ←─── 错误恢复 ←─── 状态监控 ←─────┘
```

## 🛠️ 配置选项

### 环境变量

```bash
# 必需配置
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# 可选配置
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173
AUTO_SCAN_ENABLED=true
```

### 扫描配置

```javascript
// 默认配置
{
  intervalMs: 300000,        // 5分钟扫描间隔
  maxResults: 20,           // 每次扫描20封邮件
  query: 'in:anywhere newer_than:2d',  // 扫描最近2天的邮件
  maxRetries: 3,            // 最大重试3次
  refreshInterval: 1800000   // 30分钟检查token
}
```

## 🔧 系统服务安装

### Windows服务

```bash
# 安装为Windows服务
node scripts/install-service.js install

# 卸载服务
node scripts/install-service.js uninstall

# 检查状态
node scripts/install-service.js status
```

### Linux服务

```bash
# 安装为systemd服务
node scripts/install-service.js install

# 管理服务
sudo systemctl start jobtrack
sudo systemctl stop jobtrack
sudo systemctl status jobtrack
```

### macOS服务

```bash
# 安装为LaunchAgent
node scripts/install-service.js install

# 管理服务
launchctl start com.jobtrack.service
launchctl stop com.jobtrack.service
```

## 📈 监控和维护

### 健康检查

```bash
# 基本健康检查
curl http://localhost:3000/health

# 详细状态检查
curl http://localhost:3000/health/detailed

# 自动管理器状态
curl http://localhost:3000/api/auto-manager/status
```

### 日志监控

```bash
# 查看服务日志
tail -f backend/logs/background.log

# 查看扫描日志
grep "autoscan" backend/logs/background.log

# 查看错误日志
grep "ERROR" backend/logs/background.log
```

### 性能监控

- **扫描频率**: 每5分钟自动扫描
- **处理时间**: 平均每次扫描2-5秒
- **错误率**: 自动重试和恢复
- **资源使用**: 低内存占用，高效处理

## 🚨 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查端口占用
   netstat -an | grep 3000
   
   # 检查环境配置
   cat backend/.env
   ```

2. **认证失败**
   ```bash
   # 检查OAuth配置
   curl http://localhost:3000/auth/status
   
   # 重新配置Google OAuth
   # 参考: GOOGLE_OAUTH_SETUP.md
   ```

3. **扫描不工作**
   ```bash
   # 检查自动管理器状态
   curl http://localhost:3000/api/auto-manager/status
   
   # 手动启动扫描
   curl -X POST http://localhost:3000/api/gmail/auto-scan/start \
     -H "x-session-id: your-session-id"
   ```

### 恢复步骤

1. **重启服务**
   ```bash
   # 停止服务
   node scripts/install-service.js uninstall
   
   # 重新安装
   node scripts/install-service.js install
   ```

2. **清理数据**
   ```bash
   # 清理会话数据（谨慎操作）
   rm backend/data/sessions.json
   
   # 重新连接Gmail
   ```

3. **完全重置**
   ```bash
   # 停止所有服务
   pkill -f "node.*server.js"
   
   # 清理数据
   rm -rf backend/data/*
   rm -rf backend/logs/*
   
   # 重新设置
   ./setup-auto-mode.sh
   ```

## 📋 最佳实践

### 部署建议

1. **生产环境**
   - 使用PM2或Docker管理进程
   - 配置反向代理（Nginx）
   - 设置SSL证书
   - 定期备份数据

2. **开发环境**
   - 使用测试模式
   - 启用详细日志
   - 监控资源使用

3. **安全考虑**
   - 定期更新依赖
   - 监控异常访问
   - 备份重要数据
   - 使用HTTPS

### 性能优化

1. **扫描优化**
   - 合理设置扫描间隔
   - 控制每次扫描数量
   - 使用精确的查询条件

2. **资源优化**
   - 监控内存使用
   - 定期清理日志
   - 优化数据库查询

3. **网络优化**
   - 使用CDN加速
   - 配置缓存策略
   - 监控API调用频率

## 🎉 使用体验

### 用户操作流程

1. **首次使用**
   - 运行设置脚本
   - 访问前端界面
   - 连接Gmail（仅需一次）
   - 系统自动开始工作

2. **日常使用**
   - 无需任何操作
   - 邮件自动分类
   - 系统自动维护
   - 完全透明运行

3. **系统维护**
   - 自动错误恢复
   - 自动token刷新
   - 自动重启服务
   - 零人工干预

### 预期效果

- ✅ **一次设置，永久使用**
- ✅ **零人工干预**
- ✅ **自动错误恢复**
- ✅ **持续稳定运行**
- ✅ **多用户支持**
- ✅ **跨平台兼容**

---

**🎯 目标达成：用户连接Gmail一次后，系统将完全自动化运行，无需任何手动操作！**
