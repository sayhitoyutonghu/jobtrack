# 使用真实Gmail数据训练模型指南

本指南将教你如何使用真实的Gmail API邮件数据来训练和提高模型的准确率。

## 📋 目录

1. [准备工作](#准备工作)
2. [导出Gmail训练数据](#导出gmail训练数据)
3. [准备训练数据](#准备训练数据)
4. [训练模型](#训练模型)
5. [对比模型性能](#对比模型性能)
6. [持续改进](#持续改进)

---

## 准备工作

### 1. 确保已完成基本设置

- ✅ Google OAuth已配置
- ✅ 后端服务可以正常运行
- ✅ 前端可以成功登录Gmail账号

### 2. 安装依赖

确保Python依赖已安装：
```bash
pip install -r requirements.txt
```

确保Node.js依赖已安装：
```bash
cd backend
npm install
```

---

## 导出Gmail训练数据

### 步骤 1: 启动后端服务

```bash
# 在项目根目录
cd backend
npm run dev
```

后端服务应该运行在 `http://localhost:3000`

### 步骤 2: 登录并获取Session ID

1. 在浏览器中打开前端：`http://localhost:5173`
2. 点击"Login with Gmail"完成登录
3. 打开浏览器开发者工具（F12）
4. 在Console中运行：
   ```javascript
   localStorage.getItem('sessionId')
   ```
5. 复制显示的Session ID

### 步骤 3: 设置环境变量

在PowerShell中：
```powershell
$env:JOBTRACK_SESSION_ID='你的_session_id'
```

在Bash/Linux中：
```bash
export JOBTRACK_SESSION_ID='你的_session_id'
```

### 步骤 4: 导出Gmail数据

根据你的需求选择导出策略：

#### 选项 A: 导出所有收件箱邮件（推荐）
```bash
node scripts/export-gmail-training-data.js --query "in:inbox" --maxResults 500
```

#### 选项 B: 导出已分类的邮件
```bash
# 导出所有已打标签的邮件
node scripts/export-gmail-training-data.js --query "label:Application OR label:Interview OR label:Offer" --maxResults 500
```

#### 选项 C: 导出特定时间范围的邮件
```bash
# 导出最近30天的邮件
node scripts/export-gmail-training-data.js --query "newer_than:30d" --maxResults 500
```

#### 选项 D: 导出未读邮件
```bash
node scripts/export-gmail-training-data.js --query "is:unread" --maxResults 100
```

### 导出文件位置

导出的CSV文件会保存在 `backend/export/` 目录中，文件名格式为：
- `training-{timestamp}.csv`

---

## 准备训练数据

运行数据准备脚本，它会：
1. 扫描 `backend/export/` 目录中的所有CSV文件
2. 合并所有数据
3. 过滤掉没有标签的邮件
4. 去除重复数据
5. 转换为训练格式
6. 生成 `emails_real.csv` 文件

```bash
python prepare_training_data.py
```

### 示例输出

```
============================================================
🚀 准备真实Gmail训练数据
============================================================

🔍 从 backend/export 目录查找训练数据...
📁 找到 3 个CSV文件:
   - training-before-feb.csv
   - training-before-mar.csv
   - training-before-apr.csv

📊 读取 training-before-feb.csv: 150 行
   - Application: 45
   - Interview: 30
   - Offer: 10
   - Rejected: 15
   - Job Alert: 50

...

✅ 训练数据已保存到: emails_real.csv
📝 总共 300 条有标签的邮件
🏷️  包含 8 个不同的标签
```

### 数据质量检查

脚本会自动显示：
- 每个标签的数量和百分比
- 空主题/内容的数量
- 平均主题和内容长度
- 与mock数据的对比

---

## 训练模型

### 使用真实数据训练

```bash
python train_model.py --data emails_real.csv
```

### 使用mock数据训练（对比用）

```bash
python train_model.py --data emails.csv
```

### 训练输出示例

```
============================================================
🚀 开始训练邮件分类模型
============================================================
📁 数据文件: emails_real.csv

Loading data from emails_real.csv...
Loaded 300 emails
Label distribution:
Application         80
Job Alert          75
Interview          50
Recruiter Outreach 35
Response Needed    20
Rejected           18
Offer              12
Status Update      10

Vectorizing text with TfidfVectorizer (max 1000 features)...
Training LogisticRegression model...

Model Accuracy: 0.9333

Classification Report:
                    precision    recall  f1-score   support

     Application       0.95      0.94      0.95        16
        Job Alert       0.98      0.97      0.98        15
       Interview       0.92      0.90      0.91        10
Recruiter Outreach       0.88      0.86      0.87         7
Response Needed       0.85      0.90      0.88         4
        Rejected       0.75      0.75      0.75         4
           Offer       1.00      1.00      1.00         2
   Status Update       0.67      0.50      0.57         2

✅ 训练成功！
```

---

## 对比模型性能

创建一个简单的对比脚本来测试两个模型：

```bash
# 使用mock数据训练基准模型
python train_model.py --data emails.csv
mv model.pkl model_mock.pkl
mv vectorizer.pkl vectorizer_mock.pkl

# 使用真实数据训练新模型
python train_model.py --data emails_real.csv
mv model.pkl model_real.pkl
mv vectorizer.pkl vectorizer_real.pkl
```

### 查看准确率对比

观察训练输出中的：
- **Accuracy**: 总体准确率
- **Precision**: 精确率（预测为某类的邮件中，真正属于该类的比例）
- **Recall**: 召回率（实际属于某类的邮件中，被正确预测的比例）
- **F1-Score**: 精确率和召回率的调和平均

---

## 持续改进

### 1. 增加训练数据

随着时间推移，继续导出和标记更多Gmail邮件：

```bash
# 导出新邮件
node scripts/export-gmail-training-data.js --query "newer_than:7d" --maxResults 100

# 重新准备数据（会合并所有导出文件）
python prepare_training_data.py

# 重新训练模型
python train_model.py --data emails_real.csv
```

### 2. 改进标签质量

确保Gmail中的标签分类准确：
1. 在Gmail中检查自动标记的邮件
2. 手动修正错误的标签
3. 重新导出数据
4. 重新训练模型

### 3. 平衡数据集

如果某些标签的样本太少，可以：
- 手动标记更多该类型的历史邮件
- 使用 `--query` 参数专门导出该类型邮件
- 考虑合并相似的标签

### 4. 调整模型参数

在 `train_model.py` 中尝试不同的参数：

```python
# TfidfVectorizer参数
vectorizer = TfidfVectorizer(
    max_features=2000,      # 增加特征数量
    ngram_range=(1, 3),     # 使用1-3gram
    min_df=2,               # 最小文档频率
    max_df=0.8              # 最大文档频率
)

# LogisticRegression参数
model = LogisticRegression(
    max_iter=2000,          # 增加迭代次数
    C=1.0,                  # 正则化强度
    solver='lbfgs'          # 优化算法
)
```

---

## 常见问题

### Q: 导出的数据没有标签怎么办？

**A**: 确保：
1. 你已经在Gmail中设置了JobTrack标签（运行 `/setup` 在Chrome扩展中）
2. 你已经手动标记了一些邮件
3. 或者使用Chrome扩展自动标记了一些邮件

### Q: 准备数据时显示"没有可用的训练数据"？

**A**: 这意味着导出的邮件都没有标签。你需要：
1. 先标记一些Gmail邮件
2. 或者使用已有的mock数据训练初始模型
3. 使用初始模型自动标记邮件
4. 检查和修正自动标记
5. 再导出和训练

### Q: 模型准确率很低怎么办？

**A**: 可能的原因和解决方案：
- **数据太少**: 至少需要每个标签20-30个样本
- **数据质量差**: 检查标签是否正确
- **类别不平衡**: 确保各标签样本数量相对均衡
- **特征不足**: 尝试增加 `max_features` 参数

### Q: 如何自动化训练流程？

**A**: 创建一个自动化脚本：

```bash
#!/bin/bash
# auto_train.sh

# 1. 导出最新数据
node scripts/export-gmail-training-data.js --query "newer_than:7d" --maxResults 200

# 2. 准备训练数据
python prepare_training_data.py

# 3. 训练模型
python train_model.py --data emails_real.csv

# 4. 备份模型
timestamp=$(date +%Y%m%d_%H%M%S)
cp model.pkl "models/model_${timestamp}.pkl"
cp vectorizer.pkl "models/vectorizer_${timestamp}.pkl"

echo "✅ Training completed and model backed up!"
```

---

## 下一步

1. ✅ 完成真实数据训练
2. 📊 测试模型在实际邮件上的表现
3. 🔄 建立定期重训练流程
4. 📈 跟踪模型性能指标
5. 🎯 根据反馈持续优化

---

## 相关文档

- [SCAN_NEW_EMAILS_GUIDE.md](./SCAN_NEW_EMAILS_GUIDE.md) - 扫描新邮件指南
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 测试指南
- [chrome-extension/README.md](./chrome-extension/README.md) - Chrome扩展使用指南


