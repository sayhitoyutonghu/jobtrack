# 📧 邮件训练数据扩充指南

本指南将帮助你扩充 JobTrack 项目中的 `emails.csv` 训练数据，提升邮件分类模型的准确性。

## 🎯 当前数据状况

根据分析，你的训练数据现状：
- **总数据量**: 62 条邮件
- **数据分布不均**: Job Alert (18条) vs Offer (5条)
- **建议目标**: 每类别50+ 条数据，总计400+ 条

## 🛠️ 可用工具

我为你创建了5个专用工具来扩充和改善训练数据：

### 1. 📊 数据分析工具 - `analyze_data.py`
```bash
python analyze_data.py
```
**功能**:
- 分析当前标签分布
- 检查数据质量
- 提供扩充建议

### 2. ✏️ 手动数据添加工具 - `expand_training_data.py`  
```bash
python expand_training_data.py
```
**功能**:
- 交互式添加单条邮件
- 批量添加多条邮件
- 查看数据统计

**使用方法**:
- 单条添加：逐个输入主题、正文、选择分类
- 批量添加：使用格式 `主题|||正文|||标签编号`

### 3. 📥 Gmail导入工具 - `gmail_importer.py`
```bash
python gmail_importer.py
```
**功能**:
- 从你的Gmail导入真实邮件
- 自动识别求职相关邮件
- 智能分类建议

**设置步骤**:
1. 访问 [Google Cloud Console](https://console.developers.google.com/)
2. 创建项目并启用Gmail API
3. 创建OAuth客户端凭据
4. 下载凭据文件并重命名为 `credentials.json`

### 4. 🏷️ 邮件标注工具 - `email_annotator.py`
```bash  
python email_annotator.py
```
**功能**:
- 批量重新标注邮件
- 检查标注质量
- 查找相似邮件

### 5. 🔍 数据质量检查器 - `data_quality_checker.py`
```bash
python data_quality_checker.py
```
**功能**:
- 全面的质量分析
- 相似度检测
- 模型性能预测
- 改进建议

## 🚀 推荐的扩充策略

### 阶段1: 快速扩充 (目标: 200条)
1. **手动添加常见邮件类型**
   ```bash
   python expand_training_data.py
   ```
   - 为每个类别添加10-15条典型邮件
   - 专注于不同的表达方式和格式

2. **Gmail导入** (如果你有求职邮件)
   ```bash
   python gmail_importer.py
   ```
   - 导入最近30天的求职相关邮件
   - 手动确认分类

### 阶段2: 质量优化 (目标: 400条)
1. **数据平衡**
   - 重点增加少数类别: Offer, Status Update, Recruiter Outreach
   - 使用 `data_quality_checker.py` 监控平衡性

2. **多样性增强**
   - 收集不同公司、不同岗位的邮件
   - 包含不同语言风格和格式

### 阶段3: 精细调优
1. **质量检查**
   ```bash
   python data_quality_checker.py
   ```
   - 检查重复邮件
   - 验证标注一致性
   - 预测模型性能

2. **标注审核**
   ```bash
   python email_annotator.py
   ```
   - 重新审核边界情况
   - 统一标注标准

## 📝 邮件分类标准

确保按以下标准进行分类：

| 类别 | 描述 | 关键词示例 |
|------|------|------------|
| **Applied** | 申请确认邮件 | "application received", "thank you for applying" |
| **Response Needed** | 需要回复的邮件 | "please respond", "schedule interview", "availability" |
| **Interview Scheduled** | 面试安排确认 | "interview scheduled", "confirmed", "meeting time" |
| **Rejected** | 拒绝通知 | "unfortunately", "other candidate", "not moving forward" |
| **Offer** | 录用通知 | "offer", "congratulations", "welcome to the team" |
| **Job Alert** | 职位提醒 | "new jobs", "job alert", "matching positions" |
| **Status Update** | 状态更新 | "application status", "update on your application" |
| **Recruiter Outreach** | 猎头联系 | "recruiter", "opportunity", "interested in your background" |

## 💡 数据收集建议

### 从现有邮件收集:
1. **搜索Gmail关键词**:
   - "application", "interview", "position", "recruiter"
   - "job alert", "linkedin", "indeed", "offer"

2. **LinkedIn邮件通知**
3. **Indeed/Glassdoor提醒**  
4. **公司HR邮件**
5. **猎头联系邮件**

### 人工创造多样性:
1. **不同公司规模**: 大厂 vs 初创公司的邮件风格
2. **不同岗位**: 技术 vs 产品 vs 设计岗位
3. **不同阶段**: 初级 vs 高级职位的邮件
4. **国际化**: 不同地区公司的邮件风格

## 🔄 训练工作流

推荐的完整工作流程：

```bash
# 1. 分析当前数据
python analyze_data.py

# 2. 根据需要添加数据  
python expand_training_data.py
# 或者
python gmail_importer.py

# 3. 检查数据质量
python data_quality_checker.py

# 4. 标注审核(如需要)
python email_annotator.py

# 5. 重新训练模型
python train_model.py

# 6. 测试模型性能
python test_api.py
```

## 📈 质量指标目标

- **数据量**: 每类别 ≥ 50 条，总计 ≥ 400 条
- **平衡性**: 最大类别/最小类别 ≤ 3:1
- **准确性**: 交叉验证准确率 ≥ 85%
- **多样性**: 每类别包含多种表达方式

## ⚠️ 注意事项

1. **隐私保护**: 删除或脱敏个人信息
2. **数据一致性**: 保持标注标准一致
3. **定期备份**: 重要数据及时备份
4. **版本控制**: 记录数据变更历史

## 🆘 常见问题

**Q: Gmail API设置太复杂，有其他方法吗？**
A: 可以手动复制粘贴邮件到 `expand_training_data.py`，或导出邮件到文本文件后批量处理。

**Q: 如何判断数据质量是否足够？**
A: 使用 `data_quality_checker.py` 的模型性能预测功能，目标准确率85%+。

**Q: 某些类别很难找到足够的邮件怎么办？**
A: 可以：
- 搜索专业论坛和Reddit的邮件模板
- 参考招聘网站的邮件示例  
- 适当修改现有邮件创建变体

开始扩充你的训练数据吧！🚀