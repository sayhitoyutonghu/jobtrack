# 🚀 JobTrack 快速开始指南

## 为什么我的邮件没有被标记？

你需要完成以下步骤才能让JobTrack自动标记邮件：

---

## ✅ 步骤 1: 登录 Google 账户

### 在 Dashboard 中登录

1. **打开 Dashboard**
   ```
   http://localhost:5173
   ```

2. **点击 "Sign in with Google" 按钮**
   - 在页面顶部的黄色横幅中
   - 或者使用测试模式：点击 "🧪 Test Mode Login"

3. **选择你的 Gmail 账户**
   - 选择 sayihtoydonghu@gmail.com

4. **授权权限**
   - ✅ 查看和管理你的 Gmail
   - ✅ 管理邮件标签

5. **确认登录成功**
   - 顶部显示绿色横幅: "Connected to Gmail"
   - 或 "🧪 Test Mode Active"（如果使用测试模式）

---

## ✅ 步骤 2: 创建 Gmail 标签

登录成功后：

1. **在 Dashboard 找到 "Gmail Label Management" 区域**

2. **点击 "Create / Update Labels" 按钮**

3. **等待创建完成**
   - 系统会在你的Gmail中创建5个标签：
     - JobTrack/Application
     - JobTrack/Interview
     - JobTrack/Offer
     - JobTrack/Rejected
     - JobTrack/Ghost

4. **验证标签创建**
   - 在Gmail左侧标签栏查看
   - 应该能看到新的 "JobTrack" 标签组

---

## ✅ 步骤 3: 扫描并分类邮件

标签创建后：

1. **在 Dashboard 找到 "Manual Email Scan" 区域**

2. **配置扫描参数**:
   ```
   Gmail search query: is:unread
   Max messages: 25
   ```
   
   或者扫描更多邮件：
   ```
   Gmail search query: newer_than:7d
   Max messages: 50
   ```

3. **点击 "Scan Now" 按钮**

4. **查看分类结果**
   - 显示每封邮件的分类
   - 标签和置信度
   - 处理统计

5. **在 Gmail 中验证**
   - 刷新Gmail页面
   - 查看邮件是否被打上了JobTrack标签

---

## ✅ 步骤 4: 启用自动扫描（可选）

如果想要自动持续分类新邮件：

1. **在 Dashboard 找到 "Automatic Scan" 区域**

2. **点击 "Start Auto Scan" 按钮**

3. **系统会每60秒自动扫描**
   - 自动检测新邮件
   - 自动分类并打标签
   - 持续运行直到你停止

4. **查看状态**
   - Status: Running
   - Current query: 你的搜索条件
   - Scan interval: 60s

---

## 🎯 完整流程示例

### 第一次使用：

```
1. 打开 http://localhost:5173
   ↓
2. 点击 "Sign in with Google"
   ↓
3. 授权 Gmail 访问
   ↓
4. 点击 "Create / Update Labels"
   ↓
5. 等待标签创建完成
   ↓
6. 点击 "Scan Now"
   ↓
7. 查看分类结果
   ↓
8. 在 Gmail 中查看标签
```

---

## 🔍 查看邮件标签的位置

在 Gmail 中：

### 方法 1: 左侧标签栏
向下滚动，找到 **"JobTrack"** 标签组：
```
Labels
├── 1: to respond
├── 2: FYI
├── ...
└── JobTrack/              ← 这里！
    ├── Application
    ├── Interview
    ├── Offer
    ├── Rejected
    └── Ghost
```

### 方法 2: 查看单封邮件
1. 打开任意job相关邮件
2. 查看标签区域（Subject下方）
3. 应该能看到 JobTrack 标签

### 方法 3: 使用搜索
在Gmail搜索框输入：
```
label:jobtrack/interview
label:jobtrack/application
label:jobtrack/offer
```

---

## 📊 邮件分类规则

JobTrack 会将邮件分类为：

| 标签 | 识别关键词 | 示例 |
|------|-----------|------|
| **Application** | applied, job alert, opportunity | "Your application was received" |
| **Interview** | interview, schedule, meeting | "Interview invitation for..." |
| **Offer** | offer, congratulations, welcome | "Job offer from XYZ Corp" |
| **Rejected** | unfortunately, regret, not selected | "Update on your application" |
| **Ghost** | （长时间无回应） | 申请后14天无回复 |

---

## ⚠️ 常见问题

### Q1: 标签没有出现在Gmail中？
**解决方法**:
1. 刷新Gmail页面 (F5)
2. 检查是否登录成功（Dashboard显示绿色横幅）
3. 重新点击 "Create / Update Labels"

### Q2: 扫描后邮件没有标签？
**解决方法**:
1. 检查邮件是否是job相关（系统会自动跳过非job邮件）
2. 在Gmail中搜索: `label:jobtrack`
3. 查看Dashboard的扫描结果，确认处理状态

### Q3: 只想标记未读邮件？
**配置**:
```
Gmail search query: is:unread
Max messages: 25
```

### Q4: 想标记最近7天的所有邮件？
**配置**:
```
Gmail search query: newer_than:7d
Max messages: 100
```

### Q5: 想标记特定发件人的邮件？
**配置**:
```
Gmail search query: from:linkedin.com newer_than:30d
Max messages: 50
```

---

## 🧪 使用测试模式（不需要真实Gmail）

如果只是想测试功能：

1. **点击 "🧪 Test Mode Login"**
2. **点击 "Create / Update Labels"**
   - 会显示模拟的标签创建
3. **点击 "Scan Now"**
   - 会显示8封示例邮件
   - 展示不同的分类结果

**注意**: 测试模式不会访问真实的Gmail

---

## 🔄 重新开始

如果遇到问题想重新开始：

1. **退出登录**
   ```
   Dashboard → 点击 "Logout" 按钮
   ```

2. **清除session数据**
   ```powershell
   Remove-Item backend/data/sessions.json -ErrorAction SilentlyContinue
   ```

3. **重启服务**
   ```powershell
   .\start-all-services.bat
   ```

4. **重新登录并设置**

---

## 📱 移动设备访问

Gmail标签在所有设备同步：
- iPhone/Android Gmail App
- Gmail网页版
- 其他邮件客户端（支持Gmail标签）

---

## 🎓 下一步

完成设置后，你可以：

1. **查看统计**
   - 在Gmail中按标签查看邮件数量
   - 跟踪你的求职进度

2. **自定义搜索**
   - 组合使用标签和其他Gmail搜索条件
   - 例如: `label:jobtrack/interview is:unread`

3. **启用自动扫描**
   - 让系统持续监控新邮件
   - 自动分类无需手动操作

---

## 🆘 需要帮助？

### 检查系统状态
```powershell
.\test_connections.ps1
```

### 检查OAuth配置
```powershell
.\check_oauth_config.ps1
```

### 查看文档
- `TEST_MODE_GUIDE.md` - 测试模式指南
- `GOOGLE_OAUTH_SETUP.md` - OAuth配置指南
- `TESTING_GUIDE.md` - 完整测试指南

---

**🎯 现在开始使用 JobTrack 吧！**

访问 http://localhost:5173 并完成以上步骤！

