# JobTrack 自动扫描功能指南

## 概述

JobTrack 现在支持强大的自动扫描功能，可以定期扫描 Gmail 邮件并自动进行分类标记。

## 功能特性

### 🔄 自动扫描
- **定时扫描**: 每5分钟自动扫描新邮件
- **智能分类**: 使用AI和规则引擎自动分类邮件
- **错误恢复**: 自动处理API错误和网络问题
- **状态监控**: 实时监控扫描状态和历史

### ⚡ 立即扫描
- **手动触发**: 随时手动执行扫描
- **实时结果**: 立即查看扫描结果
- **灵活配置**: 自定义查询条件和扫描数量

### 📊 状态监控
- **运行状态**: 实时显示自动扫描状态
- **扫描历史**: 查看最近的扫描记录
- **错误统计**: 监控错误次数和恢复情况
- **性能指标**: 扫描耗时和处理数量

## 快速开始

### 1. 启动后端服务

```bash
# 使用自动扫描功能启动
cd backend
npm run start:autoscan

# 或者开发模式
npm run dev:autoscan
```

### 2. 启动前端界面

```bash
cd frontend
npm run dev
```

### 3. 测试自动扫描功能

```bash
# 运行测试脚本
node test-autoscan.js
```

## API 端点

### 自动扫描控制

#### 启动自动扫描
```http
POST /api/gmail/auto-scan/start
Content-Type: application/json
x-session-id: your-session-id

{
  "query": "in:anywhere newer_than:2d",
  "maxResults": 20
}
```

#### 停止自动扫描
```http
POST /api/gmail/auto-scan/stop
x-session-id: your-session-id
```

#### 获取状态
```http
GET /api/gmail/auto-scan/status
x-session-id: your-session-id
```

#### 立即扫描
```http
POST /api/gmail/auto-scan/run-now
Content-Type: application/json
x-session-id: your-session-id

{
  "query": "in:anywhere newer_than:1d",
  "maxResults": 10
}
```

#### 获取扫描历史
```http
GET /api/gmail/auto-scan/history
x-session-id: your-session-id
```

### 健康检查

#### 基本健康检查
```http
GET /health
```

#### 详细健康检查
```http
GET /health/detailed
```

## 配置选项

### 自动扫描配置

```javascript
const autoScan = new AutoScanService({
  intervalMs: 300000,        // 扫描间隔 (5分钟)
  resolveSession: resolveSession,
  maxRetries: 3,            // 最大重试次数
});
```

### 扫描参数

- **query**: Gmail搜索查询 (默认: `in:anywhere newer_than:2d`)
- **maxResults**: 每次扫描的最大邮件数量 (默认: 20)
- **intervalMs**: 扫描间隔毫秒数 (默认: 300000 = 5分钟)

## 错误处理

### 自动错误恢复
- 网络错误自动重试
- API限流自动等待
- 认证失效自动停止
- 错误次数超限自动停止

### 错误监控
- 实时错误计数
- 错误历史记录
- 自动停止机制
- 详细错误日志

## 前端界面

### 自动扫描Dashboard
- 启动/停止自动扫描
- 立即执行扫描
- 实时状态显示
- 扫描历史查看

### 状态指示器
- 🟢 运行中
- 🔴 已停止
- ⚠️ 错误状态
- 📊 性能指标

## 部署指南

### 本地开发
```bash
# 启动完整测试环境
./start-autoscan-test.sh  # Linux/Mac
start-autoscan-test.bat    # Windows
```

### 生产环境
```bash
# 使用PM2管理进程
pm2 start backend/server.js --name jobtrack-backend
pm2 start backend/autoscan.js --name jobtrack-autoscan
```

### Docker部署
```bash
# 使用Docker Compose
docker-compose up -d
```

## 监控和维护

### 日志监控
```bash
# 查看后端日志
tail -f backend/logs/autoscan.log

# 查看错误日志
grep "ERROR" backend/logs/autoscan.log
```

### 性能监控
- 扫描频率监控
- 处理时间统计
- 错误率分析
- 资源使用情况

### 故障排除

#### 常见问题
1. **自动扫描不启动**
   - 检查认证状态
   - 验证Gmail API权限
   - 查看错误日志

2. **扫描结果不准确**
   - 调整分类规则
   - 更新AI模型
   - 检查邮件内容

3. **性能问题**
   - 调整扫描间隔
   - 减少扫描数量
   - 优化查询条件

## 最佳实践

### 扫描配置
- 合理设置扫描间隔 (建议5-10分钟)
- 控制每次扫描数量 (建议10-50封)
- 使用精确的查询条件
- 定期检查扫描效果

### 错误处理
- 监控错误日志
- 设置告警机制
- 定期重启服务
- 备份重要数据

### 性能优化
- 使用缓存机制
- 优化数据库查询
- 合理分配资源
- 监控系统负载

## 技术支持

如有问题，请查看：
- 📖 [完整文档](README.md)
- 🐛 [问题报告](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

---

**注意**: 自动扫描功能需要有效的Gmail API认证和适当的权限设置。

