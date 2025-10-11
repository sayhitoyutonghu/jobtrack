import requests
import json

print("\n" + "="*60)
print("📧 JobTrack API 快速测试")
print("="*60 + "\n")

# 测试 1: 面试邀请
print("【测试 1】面试邀请邮件")
print("-" * 60)
email1 = {
    "subject": "Interview Invitation",
    "body": "We would like to invite you for an interview next week"
}
print(f"主题: {email1['subject']}")
print(f"正文: {email1['body']}")

r1 = requests.post('http://localhost:5000/predict', json=email1)
result1 = r1.json()
print(f"\n✅ 预测: {result1['label']}")
print(f"📊 置信度: {result1['confidence']:.2%}\n")

# 测试 2: 录用通知
print("【测试 2】录用通知邮件")
print("-" * 60)
email2 = {
    "subject": "Job Offer - Software Engineer",
    "body": "We are pleased to offer you the position. Salary: $100,000"
}
print(f"主题: {email2['subject']}")
print(f"正文: {email2['body']}")

r2 = requests.post('http://localhost:5000/predict', json=email2)
result2 = r2.json()
print(f"\n✅ 预测: {result2['label']}")
print(f"📊 置信度: {result2['confidence']:.2%}\n")

# 测试 3: 拒信
print("【测试 3】拒信邮件")
print("-" * 60)
email3 = {
    "subject": "Application Status",
    "body": "Unfortunately we have decided to move forward with other candidates"
}
print(f"主题: {email3['subject']}")
print(f"正文: {email3['body']}")

r3 = requests.post('http://localhost:5000/predict', json=email3)
result3 = r3.json()
print(f"\n✅ 预测: {result3['label']}")
print(f"📊 置信度: {result3['confidence']:.2%}\n")

# 获取所有分类
print("【所有支持的分类】")
print("-" * 60)
r_cat = requests.get('http://localhost:5000/categories')
categories = r_cat.json()['categories']
for i, cat in enumerate(categories, 1):
    print(f"{i}. {cat}")

print("\n" + "="*60)
print("✅ 测试完成！API 运行正常")
print("="*60 + "\n")
