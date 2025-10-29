# 📡 JobTrack API 参考文档

## 🔐 认证 API

### Google OAuth 登录
```http
GET /auth/google
```
**描述**: 启动Google OAuth认证流程  
**响应**: 重定向到Google授权页面

### OAuth 回调
```http
GET /auth/callback?code={code}&error={error}
```
**描述**: 处理Google OAuth回调  
**参数**:
- `code`: 授权码（成功时）
- `error`: 错误信息（失败时）

**成功响应**: 重定向到前端成功页面  
**失败响应**: 重定向到错误页面

### 认证状态检查
```http
GET /auth/status
Headers: x-session-id: {sessionId}
```
**描述**: 检查用户认证状态  
**响应**:
```json
{
  "authenticated": true,
  "sessionId": "abc123",
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### 测试模式登录
```http
POST /auth/test-login
```
**描述**: 创建测试会话（无需真实Google认证）  
**响应**:
```json
{
  "success": true,
  "sessionId": "test-abc123",
  "message": "Test mode login successful",
  "testMode": true
}
```

## 📧 Gmail 集成 API

### 设置Gmail标签
```http
POST /api/gmail/setup
Headers: x-session-id: {sessionId}
```
**描述**: 在Gmail中创建分类标签  
**响应**:
```json
{
  "success": true,
  "message": "Labels created successfully",
  "labels": [
    {"name": "JobTrack/Application", "id": "label_1"},
    {"name": "JobTrack/Interview", "id": "label_2"}
  ]
}
```

### 扫描邮件
```http
POST /api/gmail/scan
Headers: 
  x-session-id: {sessionId}
  Content-Type: application/json
Body:
{
  "maxResults": 10,
  "query": "in:inbox"
}
```
**描述**: 扫描并分类邮件  
**参数**:
- `maxResults`: 最大邮件数量（默认10）
- `query`: Gmail搜索查询（可选）

**响应**:
```json
{
  "success": true,
  "processed": 5,
  "classified": 3,
  "results": [
    {
      "id": "msg_123",
      "subject": "Interview Invitation",
      "category": "Interview",
      "confidence": 0.95
    }
  ]
}
```

### 获取Gmail标签
```http
GET /api/gmail/labels
Headers: x-session-id: {sessionId}
```
**描述**: 获取用户的Gmail标签列表  
**响应**:
```json
{
  "success": true,
  "labels": [
    {
      "id": "label_1",
      "name": "JobTrack/Application",
      "type": "user"
    }
  ]
}
```

## 🤖 自动管理 API

### 获取自动扫描状态
```http
GET /api/auto-manager/status
```
**描述**: 获取自动扫描管理器状态  
**响应**:
```json
{
  "success": true,
  "manager": {
    "isRunning": true,
    "autoStartEnabled": true,
    "lastScan": "2024-12-01T10:00:00Z"
  },
  "sessions": [
    {
      "sessionId": "abc123",
      "isActive": true,
      "lastActivity": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### 启动自动扫描
```http
POST /api/auto-manager/start
```
**描述**: 启动自动扫描管理器  
**响应**:
```json
{
  "success": true,
  "message": "Auto manager started"
}
```

### 停止自动扫描
```http
POST /api/auto-manager/stop
```
**描述**: 停止自动扫描管理器  
**响应**:
```json
{
  "success": true,
  "message": "Auto manager stopped"
}
```

### 设置自动启动
```http
POST /api/auto-manager/auto-start/{enabled}
```
**描述**: 设置是否自动启动扫描  
**参数**:
- `enabled`: "true" 或 "false"

**响应**:
```json
{
  "success": true,
  "autoStartEnabled": true
}
```

## 🏷️ 标签管理 API

### 获取所有标签
```http
GET /api/labels
```
**描述**: 获取所有分类标签配置  
**响应**:
```json
{
  "success": true,
  "labels": [
    {
      "id": 1,
      "name": "Application",
      "enabled": true,
      "color": "#3B82F6",
      "description": "Job applications and alerts"
    }
  ]
}
```

### 更新标签
```http
PUT /api/labels/{id}
Content-Type: application/json
Body:
{
  "name": "New Name",
  "enabled": true,
  "color": "#10B981"
}
```
**描述**: 更新标签配置  
**响应**:
```json
{
  "success": true,
  "label": {
    "id": 1,
    "name": "New Name",
    "enabled": true,
    "color": "#10B981"
  }
}
```

### 切换标签状态
```http
PUT /api/labels/{id}/toggle
Content-Type: application/json
Body:
{
  "enabled": false
}
```
**描述**: 切换标签启用状态  
**响应**:
```json
{
  "success": true,
  "label": {
    "id": 1,
    "enabled": false
  }
}
```

## 🏥 健康检查 API

### 基础健康检查
```http
GET /health
```
**描述**: 检查服务基本状态  
**响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T10:00:00Z",
  "sessions": 2,
  "environment": "development"
}
```

### 详细健康检查
```http
GET /health/detailed
```
**描述**: 获取详细的服务状态信息  
**响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T10:00:00Z",
  "services": {
    "sessions": {
      "count": 2,
      "active": ["abc123", "def456"]
    },
    "autoScan": {
      "activeSessions": 1,
      "sessions": ["abc123"]
    }
  },
  "environment": "development"
}
```

## 🚨 错误响应格式

所有API在出错时返回统一格式：

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### 常见错误码

| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未认证或会话过期 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 🔧 请求头

### 必需请求头
```
x-session-id: {sessionId}  # 用于需要认证的API
Content-Type: application/json  # 用于POST/PUT请求
```

### 可选请求头
```
User-Agent: JobTrack-Client/1.0
Accept: application/json
```

## 📝 使用示例

### 完整的认证和扫描流程

```bash
# 1. 启动认证
curl -X GET "http://localhost:3000/auth/google"

# 2. 检查认证状态
curl -X GET "http://localhost:3000/auth/status" \
  -H "x-session-id: abc123"

# 3. 设置Gmail标签
curl -X POST "http://localhost:3000/api/gmail/setup" \
  -H "x-session-id: abc123"

# 4. 扫描邮件
curl -X POST "http://localhost:3000/api/gmail/scan" \
  -H "x-session-id: abc123" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 10}'

# 5. 检查自动扫描状态
curl -X GET "http://localhost:3000/api/auto-manager/status"
```

---

**API版本**: v1.0  
**最后更新**: 2024年12月  
**基础URL**: `http://localhost:3000`
