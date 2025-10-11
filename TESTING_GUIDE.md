# JobTrack - 测试指南

## 🚀 快速启动所有服务

### 方法1：一键启动（推荐）
```bash
.\start-all-services.bat
```
这将在3个独立窗口中启动：
- Backend (Node.js) - 端口 3000
- Flask API (Python) - 端口 5000  
- Frontend (React) - 端口 5173

### 方法2：手动启动
打开3个独立的终端窗口：

**终端1 - Backend:**
```powershell
cd backend
npm start
```

**终端2 - Flask API:**
```powershell
python app.py
```

**终端3 - Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 🧪 测试连接

等待所有服务启动（约10-15秒），然后运行测试脚本：

```powershell
.\test_connections.ps1
```

### 预期输出

#### ✅ 成功状态
```
========================================
JobTrack Service Connection Test
========================================

[1/3] Testing Node.js Backend (http://localhost:3000)...
  OK Backend is running
  Response: {"status":"ok","timestamp":"...","sessions":0,"environment":"development"}

[2/3] Testing Flask API (http://localhost:5000)...
  OK Flask API is running
  Response: {"status":"healthy","model_loaded":true,"vectorizer_loaded":true}

[3/3] Testing React Frontend (http://localhost:5173)...
  OK Frontend is running
  Browser: http://localhost:5173

========================================
API Endpoint Tests
========================================

Testing Backend API endpoints...
  OK GET / endpoint works
Testing Labels API...
  OK GET /api/labels endpoint works
  Found 5 label configurations
Testing Email Classification API...
  OK POST /predict endpoint works
  Result: label=Interview, confidence=0.89
```

---

## 🔧 手动测试命令

### Node.js Backend (端口 3000)

**健康检查:**
```powershell
curl.exe http://localhost:3000/health
```

**API信息:**
```powershell
curl.exe http://localhost:3000/
```

**获取标签配置:**
```powershell
curl.exe http://localhost:3000/api/labels
```

**认证状态:**
```powershell
curl.exe http://localhost:3000/auth/status
```

### Flask API (端口 5000)

**健康检查:**
```powershell
curl.exe http://localhost:5000/health
```

**获取分类类别:**
```powershell
curl.exe http://localhost:5000/categories
```

**测试邮件分类:**
```powershell
curl.exe -X POST http://localhost:5000/predict -H "Content-Type: application/json" -d '{\"subject\":\"Interview invitation\",\"body\":\"We would like to schedule an interview with you\"}'
```

**预期响应:**
```json
{
  "label": "Interview",
  "confidence": 0.89,
  "probabilities": {
    "Application": 0.05,
    "Interview": 0.89,
    "Offer": 0.02,
    "Rejected": 0.01,
    "Ghost": 0.03
  }
}
```

### React Frontend (端口 5173)

**检查前端:**
```powershell
curl.exe http://localhost:5173
```

**在浏览器打开:**
```powershell
start http://localhost:5173
```

---

## 🐛 常见问题

### 端口被占用

**检查端口占用:**
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

**终止进程:**
```powershell
# 找到PID后
taskkill /PID <进程ID> /F
```

### Backend启动失败

```powershell
cd backend
npm install
npm start
```

### Flask API启动失败

**检查Python版本:**
```powershell
python --version  # 需要 3.11+
```

**重新安装依赖:**
```powershell
pip install --upgrade -r requirements.txt
```

**numpy错误:**
```powershell
pip install --upgrade numpy scikit-learn
```

**模型文件缺失:**
```powershell
python train_model.py
```

### Frontend启动失败

```powershell
cd frontend
npm install
npm run dev
```

---

## 📡 API端点完整列表

### Backend API (http://localhost:3000)

#### 认证
- `GET /auth/google` - 启动Google OAuth登录
- `GET /auth/callback` - OAuth回调
- `GET /auth/status` - 检查认证状态

#### Gmail操作（需要认证）
- `POST /api/gmail/setup` - 创建Gmail标签
- `POST /api/gmail/scan` - 扫描邮件并分类
- `GET /api/gmail/labels` - 获取Gmail标签
- `GET /api/gmail/auto-scan/status` - 自动扫描状态
- `POST /api/gmail/auto-scan/start` - 启动自动扫描
- `POST /api/gmail/auto-scan/stop` - 停止自动扫描

#### 标签管理
- `GET /api/labels` - 获取所有标签配置

#### 系统
- `GET /health` - 健康检查
- `GET /` - API信息

### Flask API (http://localhost:5000)

#### 分类
- `POST /predict` - 预测单个邮件分类
- `POST /batch_predict` - 批量预测邮件分类

#### 系统
- `GET /health` - 健康检查
- `GET /categories` - 获取所有分类类别

---

## 🌐 前端Dashboard功能

访问 **http://localhost:5173** 后可以：

1. **Google登录** - 连接Gmail账户
2. **创建标签** - 在Gmail中创建JobTrack标签
3. **手动扫描** - 扫描并分类邮件
4. **自动扫描** - 启动定时自动扫描
5. **查看结果** - 实时查看分类结果

---

## 💡 测试流程建议

1. **启动所有服务**
   ```powershell
   .\start-all-services.bat
   ```

2. **等待10-15秒让服务初始化**

3. **运行测试脚本**
   ```powershell
   .\test_connections.ps1
   ```

4. **打开Dashboard**
   ```powershell
   start http://localhost:5173
   ```

5. **测试Flask API分类**
   ```powershell
   curl.exe -X POST http://localhost:5000/predict -H "Content-Type: application/json" -d '{\"subject\":\"Job offer from ABC Corp\",\"body\":\"We are pleased to extend an offer\"}'
   ```

6. **测试Backend标签API**
   ```powershell
   curl.exe http://localhost:3000/api/labels
   ```

---

## 📊 验证检查清单

- [ ] Backend健康检查返回 `{"status":"ok"}`
- [ ] Flask健康检查返回 `{"status":"healthy","model_loaded":true}`
- [ ] Frontend在浏览器中加载
- [ ] 标签API返回5个标签配置
- [ ] 分类API能正确预测邮件类别
- [ ] Dashboard界面正常显示
- [ ] 所有按钮和功能可用

---

**需要帮助？** 查看 `README.md` 或检查各服务的日志输出。

