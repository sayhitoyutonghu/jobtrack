# 📧 如何扫描今天的新邮件

## ✅ 当前状态

**好消息**: 你的JobTrack标签已经设置好了！

Gmail左侧可以看到：
- **Application** (154) - 已有154封邮件
- **Interview**
- **Offer** 
- **Rejected**
- **Ghost**

**问题**: 今天早上的新邮件还没有被分类

---

## 🔍 如何扫描今天的新邮件

### 方法 1: 扫描今天的所有邮件

1. **打开 Dashboard**
   ```
   http://localhost:5173
   ```

2. **找到 "Manual Email Scan" 区域**

3. **配置扫描参数**:
   ```
   Gmail search query: newer_than:1d
   Max messages: 50
   ```
   
   这会扫描最近24小时内的所有邮件

4. **点击 "Scan Now"**

5. **等待扫描完成**
   - 会显示处理的邮件数量
   - 显示每封邮件的分类结果

6. **刷新 Gmail** (F5)
   - 查看新邮件上的标签

---

### 方法 2: 只扫描未读邮件

如果你想只处理未读的邮件：

```
Gmail search query: is:unread
Max messages: 50
```

---

### 方法 3: 扫描特定时间的邮件

**今天的邮件**:
```
newer_than:1d
```

**最近3天**:
```
newer_than:3d
```

**最近一周**:
```
newer_than:7d
```

**今天的未读邮件**:
```
is:unread newer_than:1d
```

---

## 🤖 启用自动扫描 (推荐！)

如果你不想每次都手动扫描，可以启用自动扫描：

### 在 Dashboard 中：

1. **找到 "Automatic Scan" 区域**

2. **点击 "Start Auto Scan" 按钮**

3. **配置（可选）**:
   ```
   Query: is:unread
   Max messages: 25
   Interval: 60 seconds (默认)
   ```

4. **系统会每60秒自动**:
   - 检查新邮件
   - 自动分类
   - 打上相应的标签

5. **停止自动扫描**:
   - 点击 "Stop Auto Scan" 按钮

---

## 📊 查看扫描结果

### Dashboard 中会显示：

**统计信息**:
```
Total: 50 emails
Processed: 45 (成功分类)
Skipped: 5 (非job相关)
```

**每封邮件的详情**:
- Subject (主题)
- From (发件人)
- Label (分类标签)
- Confidence (置信度)

### Gmail 中查看：

1. **按标签浏览**:
   - 点击 "Interview" 查看面试邀请
   - 点击 "Application" 查看申请确认
   - 点击 "Offer" 查看录用通知

2. **搜索特定标签**:
   ```
   label:interview
   label:application
   label:offer
   label:rejected
   label:ghost
   ```

3. **组合搜索**:
   ```
   label:interview is:unread
   label:application newer_than:7d
   ```

---

## 🎯 今天早上的邮件分类示例

假设今天早上有这些邮件：

| 邮件 | 应该分类为 |
|------|-----------|
| "Graphic Designer": Gap - Graphic Designer, Sleep and more | Application 或 Job Alert |
| Alert: Designer, Assistant Design Construction, Kitchen Designer | Application |
| Yutong, your application was sent to What's The Angle? | Application |
| You missed your resume review, Yutong | Interview 或 Response Needed |
| "Digital Designer": Day One Agency - Junior Designer | Application |

扫描后，这些邮件都会被打上相应的JobTrack标签。

---

## ⚡ 快速操作

### 立即扫描今天的邮件

1. 打开 Dashboard: http://localhost:5173
2. Manual Email Scan 区域
3. 输入: `newer_than:1d`
4. Max: `50`
5. 点击 "Scan Now"
6. 刷新 Gmail

**预计时间**: 30秒 - 2分钟（取决于邮件数量）

---

## 🔄 为什么新邮件没有自动分类？

**原因**: JobTrack 需要手动触发扫描，或者启用自动扫描

**两种模式**:

### 1. 手动模式（当前）
- ✅ 完全控制何时扫描
- ✅ 避免频繁API调用
- ❌ 需要记得手动扫描

### 2. 自动模式（推荐）
- ✅ 无需手动操作
- ✅ 实时分类新邮件
- ✅ 每60秒自动检查
- ⚠️ 需要保持Dashboard打开

---

## 💡 最佳实践

### 日常使用建议：

**早上起床后**:
```
扫描: newer_than:1d
目的: 处理昨晚到今早的邮件
```

**中午休息时**:
```
扫描: is:unread
目的: 处理上午新收到的邮件
```

**晚上睡前**:
```
扫描: is:unread newer_than:1d
目的: 确保今天的邮件都被处理
```

**或者**:
```
启用自动扫描，无需手动操作！
```

---

## 🔍 验证扫描是否成功

### 方法 1: 在 Dashboard 查看

扫描完成后会显示：
```
Scan Results:
Total 25 · Classified 22 · Skipped 3

Results:
✓ Interview - "Interview invitation for..." (0.92)
✓ Application - "Your application was received" (0.88)
✓ Offer - "Job offer from XYZ Corp" (0.97)
...
```

### 方法 2: 在 Gmail 查看

1. 刷新Gmail (F5)
2. 打开今天的job邮件
3. 查看邮件上方的标签
4. 应该能看到 JobTrack 标签

### 方法 3: 使用 Gmail 搜索

```
label:application newer_than:1d
```

应该能看到今天新分类的申请邮件

---

## 🐛 常见问题

### Q: 为什么有些邮件没有被分类？

**A**: 可能的原因：
1. 邮件不是job相关（系统会自动跳过）
2. 是finance/receipt相关（自动忽略）
3. 置信度太低（无法确定分类）

查看 Dashboard 的 Skipped 列表了解原因。

---

### Q: 可以重新扫描已经分类的邮件吗？

**A**: 可以！
- 系统会检查邮件当前的标签
- 如果分类改变，会更新标签
- 旧标签会被移除

---

### Q: 扫描会修改邮件内容吗？

**A**: 不会！
- 只添加/修改标签
- 不改变邮件内容
- 不移动邮件位置（除非配置了移动到文件夹）

---

## 🎓 下一步

1. **现在**：扫描今天的邮件
   ```
   Query: newer_than:1d
   Max: 50
   ```

2. **5分钟后**：启用自动扫描
   - 点击 "Start Auto Scan"
   - 以后就不需要手动操作了

3. **每天**：检查Gmail中的JobTrack标签
   - 按标签管理你的求职邮件
   - 跟踪申请进度

---

**🚀 现在就开始扫描今天的新邮件吧！**

访问: http://localhost:5173

