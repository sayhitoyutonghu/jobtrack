# JobTrack 完整安装指南

## 📋 系统概览

JobTrack 是一个 AI 驱动的邮件分类系统，包含三个部分：
1. **ML 模型** - Sklearn 训练的文本分类器
2. **Flask API** - 本地 API 服务器 (端口 5000)
3. **Chrome Extension** - Gmail 集成插件

---

## 🚀 安装步骤

### 第 1 步: 安装 Python 依赖

```bash
cd d:\downloads\jobtrack
pip install -r requirements.txt
```

或者单独安装：
```bash
pip install flask flask-cors scikit-learn pandas numpy
```

### 第 2 步: 训练模型

```bash
python train_model.py
```

**预期输出:**
```
Loading data from emails.csv...
Loaded 50 emails
Vectorizing text with TfidfVectorizer...
Training LogisticRegression model...
Model Accuracy: 0.9xxx
✓ Training complete!
```

这将生成:
- `model.pkl` - 训练好的模型
- `vectorizer.pkl` - 文本向量化器

### 第 3 步: 启动 Flask API

```bash
python app.py
```

**预期输出:**
```
🚀 Email Classification API Server
Server running on: http://localhost:5000
```

**保持此终端窗口运行！**

### 第 4 步: 测试 API (可选)

在新的终端窗口中:
```bash
python test_api.py
```

或快速测试:
```bash
python quick_test.py
```

### 第 5 步: 安装 Chrome Extension

1. **打开 Chrome 扩展管理页面**
   - 在 Chrome 地址栏输入: `chrome://extensions/`
   - 或者: 菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 点击右上角的 "开发者模式" 开关

3. **加载扩展**
   - 点击 "加载已解压的扩展程序"
   - 选择文件夹: `d:\downloads\jobtrack\chrome-extension`
   - 点击 "选择文件夹"

4. **验证安装**
   - 扩展列表中应该出现 "JobTrack - Email Classifier"
   - 确保扩展已启用（开关为蓝色）

### 第 6 步: 测试 Chrome Extension

1. **打开 Gmail**
   - 访问: https://mail.google.com

2. **打开任意邮件**
   - 点击收件箱中的任意邮件

3. **查看分类结果**
   - 邮件主题下方应该出现彩色分类标签
   - 例如: 🏷️ Response Needed 92%

4. **检查扩展状态**
   - 点击 Chrome 工具栏中的 JobTrack 图标
   - 查看 API 状态（应显示 "API Connected"）
   - 查看支持的分类列表

---

## 🎨 添加扩展图标 (可选)

创建或下载以下尺寸的图标:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

放置到: `d:\downloads\jobtrack\chrome-extension\icons\`

然后重新加载扩展。

---

## 📊 支持的邮件分类

| 分类 | 描述 | 颜色 |
|------|------|------|
| Applied | 申请确认邮件 | 🔴 红色 |
| Response Needed | 需要回复的邮件 | 🔵 青色 |
| Interview Scheduled | 面试已安排 | 🟡 黄色 |
| Offer | 录用通知 | 🟢 绿色 |
| Rejected | 拒信 | ⚫ 灰色 |
| Status Update | 状态更新 | 🟣 紫色 |
| Recruiter Outreach | 猎头联系 | 🌸 粉色 |
| Job Alert | 职位推送 | 🔵 蓝色 |

---

## 🔧 故障排除

### 问题 1: "API Disconnected"

**解决方案:**
1. 确保 Flask API 正在运行: `python app.py`
2. 检查端口 5000 是否被占用
3. 在扩展 popup 中点击 "Test API Connection"

### 问题 2: 标签不显示

**解决方案:**
1. 刷新 Gmail 页面 (F5)
2. 检查扩展是否启用
3. 打开浏览器控制台 (F12) 查看错误

### 问题 3: CORS 错误

**解决方案:**
1. 确认 `flask-cors` 已安装: `pip install flask-cors`
2. 重启 Flask API
3. 重新加载 Chrome 扩展

### 问题 4: 模型准确率低

**解决方案:**
1. 添加更多训练数据到 `emails.csv`
2. 重新训练模型: `python train_model.py`
3. 重启 Flask API

---

## 📝 使用自定义数据

### 准备数据文件

创建或修改 `emails.csv`:
```csv
subject,body,label
邮件主题1,邮件正文1,Applied
邮件主题2,邮件正文2,Response Needed
...
```

### 重新训练

```bash
python train_model.py
```

### 重启 API

```bash
# 停止当前 API (Ctrl+C)
python app.py
```

---

## 🎯 扩展功能

### 自动分类
- 默认启用
- 在扩展 popup 中可以关闭

### 手动分类
- 点击 Gmail 工具栏中的 "🏷️ Classify Email" 按钮

### 查看统计
- 点击扩展图标
- 查看 "Statistics" 部分

### 清除数据
- 点击扩展图标
- 点击 "Clear Data" 按钮

---

## 📁 项目结构

```
jobtrack/
├── train_model.py              # 模型训练脚本
├── app.py                      # Flask API 服务器
├── emails.csv                  # 训练数据
├── model.pkl                   # 训练好的模型
├── vectorizer.pkl              # 文本向量化器
├── requirements.txt            # Python 依赖
├── test_api.py                 # API 测试脚本
├── quick_test.py               # 快速测试
├── INSTALLATION_GUIDE.md       # 本文件
└── chrome-extension/           # Chrome 扩展
    ├── manifest.json           # 扩展配置
    ├── background.js           # 后台服务
    ├── content.js              # Gmail 集成
    ├── content.css             # 样式
    ├── popup.html              # 弹出窗口
    ├── popup.css               # 弹出窗口样式
    ├── popup.js                # 弹出窗口逻辑
    ├── icons/                  # 图标文件夹
    └── README.md               # 扩展说明
```

---

## 🔒 隐私说明

- ✅ 所有数据保存在本地
- ✅ API 运行在 localhost
- ✅ 不发送数据到外部服务器
- ✅ 分类历史存储在 Chrome 本地存储
- ✅ 可随时清除数据

---

## 🆘 获取帮助

如果遇到问题:
1. 检查 Flask API 是否运行
2. 查看浏览器控制台错误 (F12)
3. 检查扩展是否启用
4. 重新加载扩展
5. 重启 Flask API

---

## ✅ 安装完成检查清单

- [ ] Python 依赖已安装
- [ ] 模型已训练 (model.pkl 和 vectorizer.pkl 存在)
- [ ] Flask API 正在运行 (http://localhost:5000)
- [ ] API 测试通过
- [ ] Chrome 扩展已加载
- [ ] Gmail 中可以看到分类标签
- [ ] 扩展 popup 显示 "API Connected"

**全部完成？恭喜！🎉 您的 JobTrack 系统已就绪！**
