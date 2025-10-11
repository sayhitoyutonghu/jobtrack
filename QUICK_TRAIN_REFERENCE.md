# 🚀 快速训练参考

使用真实Gmail数据训练模型的快速命令参考。

## 📝 前提条件

- ✅ 后端服务运行中: `cd backend && npm run dev`
- ✅ 已登录Gmail并获取Session ID
- ✅ 邮件已被标记（至少有一些）

---

## 🎯 一键训练（推荐）

### Windows (PowerShell)
```powershell
.\train_with_gmail.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x train_with_gmail.sh
./train_with_gmail.sh
```

脚本会提示你输入Session ID，然后自动完成所有步骤。

---

## 📋 分步执行

### 1️⃣ 获取Session ID

在浏览器Console中运行：
```javascript
localStorage.getItem('sessionId')
```

### 2️⃣ 设置环境变量

**Windows:**
```powershell
$env:JOBTRACK_SESSION_ID='你的session_id'
```

**Linux/Mac:**
```bash
export JOBTRACK_SESSION_ID='你的session_id'
```

### 3️⃣ 导出Gmail数据

```bash
# 基本用法（导出500封收件箱邮件）
node scripts/export-gmail-training-data.js --query "in:inbox" --maxResults 500

# 只导出已标记的邮件
node scripts/export-gmail-training-data.js --query "label:Application OR label:Interview" --maxResults 300

# 导出最近30天的邮件
node scripts/export-gmail-training-data.js --query "newer_than:30d" --maxResults 200
```

### 4️⃣ 准备训练数据

```bash
python prepare_training_data.py
```

这会生成 `emails_real.csv` 文件。

### 5️⃣ 训练模型

```bash
# 使用真实数据
python train_model.py --data emails_real.csv

# 使用mock数据（对比用）
python train_model.py --data emails.csv
```

---

## 🔄 常用场景

### 场景 1: 首次训练
```bash
# 1. 导出大量邮件
node scripts/export-gmail-training-data.js --query "in:inbox" --maxResults 1000

# 2. 准备数据
python prepare_training_data.py

# 3. 训练
python train_model.py --data emails_real.csv
```

### 场景 2: 增量更新
```bash
# 1. 只导出新邮件
node scripts/export-gmail-training-data.js --query "newer_than:7d" --maxResults 100

# 2. 重新准备（会合并所有导出）
python prepare_training_data.py

# 3. 重新训练
python train_model.py --data emails_real.csv
```

### 场景 3: 只重新训练（数据已准备好）
```bash
# Windows
.\train_with_gmail.ps1 -SkipExport

# Linux/Mac
SKIP_EXPORT=true ./train_with_gmail.sh
```

### 场景 4: 对比模型性能
```bash
# 训练mock模型
python train_model.py --data emails.csv
mv model.pkl model_mock.pkl
mv vectorizer.pkl vectorizer_mock.pkl

# 训练真实数据模型
python train_model.py --data emails_real.csv
mv model.pkl model_real.pkl
mv vectorizer.pkl vectorizer_real.pkl

# 对比输出的Accuracy和F1-Score
```

---

## 📊 查看训练数据统计

### 查看导出文件
```bash
# Windows
Get-ChildItem backend\export\*.csv | Select-Object Name, Length, LastWriteTime

# Linux/Mac
ls -lh backend/export/*.csv
```

### 查看数据分布
```bash
python -c "import pandas as pd; df=pd.read_csv('emails_real.csv'); print(df['label'].value_counts())"
```

---

## 🛠️ 故障排除

### 问题: "Session ID已过期"
**解决:**
1. 重新登录 `http://localhost:5173`
2. 获取新的Session ID
3. 更新环境变量

### 问题: "没有可用的训练数据"
**解决:**
1. 检查 `backend/export/` 目录是否有CSV文件
2. 确保邮件已被标记
3. 查看导出的CSV文件内容

### 问题: "模型准确率很低"
**解决:**
1. 增加训练数据量（至少每类20-30个样本）
2. 检查标签是否正确
3. 平衡各类别的样本数量

### 问题: "import错误"
**解决:**
```bash
pip install -r requirements.txt
```

---

## 📈 性能优化建议

### 数据质量
- ✅ 每个标签至少30-50个样本
- ✅ 标签分布相对均衡
- ✅ 定期检查和修正错误标签

### 训练频率
- 📅 首次训练: 收集500+邮件
- 📅 每周更新: 增加新标记的邮件
- 📅 每月重训: 使用所有历史数据

### 数据来源
```bash
# 推荐查询组合
in:inbox newer_than:90d    # 最近3个月
label:INBOX -label:SPAM    # 收件箱非垃圾邮件
subject:(job OR interview OR application)  # 相关主题
```

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `emails.csv` | Mock训练数据（示例） |
| `emails_real.csv` | 真实Gmail数据（准备后） |
| `model.pkl` | 训练好的分类模型 |
| `vectorizer.pkl` | 文本向量化器 |
| `backend/export/*.csv` | 从Gmail导出的原始数据 |
| `model_backups/` | 模型历史版本备份 |

---

## 🔗 相关文档

- [完整指南](./TRAIN_WITH_REAL_GMAIL_DATA.md) - 详细的步骤和说明
- [测试指南](./TESTING_GUIDE.md) - 如何测试模型
- [扫描指南](./SCAN_NEW_EMAILS_GUIDE.md) - 如何扫描新邮件

---

## 💡 小贴士

1. **备份重要**: 每次训练后自动备份到 `model_backups/`
2. **版本控制**: 可以用日期命名保存多个版本
3. **A/B测试**: 保留mock和real两个模型对比
4. **持续改进**: 定期重新标记和训练

---

**需要帮助？** 查看完整文档: [TRAIN_WITH_REAL_GMAIL_DATA.md](./TRAIN_WITH_REAL_GMAIL_DATA.md)


