#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量邮件导入工具
从文本文件或剪贴板批量导入邮件数据
"""

import pandas as pd
import re
from pathlib import Path

class BatchEmailImporter:
    def __init__(self):
        self.labels = [
            "Applied", "Response Needed", "Interview Scheduled", 
            "Rejected", "Offer", "Job Alert", 
            "Status Update", "Recruiter Outreach"
        ]
    
    def import_from_text_file(self, file_path):
        """从文本文件导入邮件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 按邮件分割 (假设邮件之间有分隔符)
            emails = self.parse_emails_from_text(content)
            
            print(f"📧 从文件中解析出 {len(emails)} 封邮件")
            
            # 逐个确认和分类
            for i, email in enumerate(emails, 1):
                print(f"\n📧 邮件 {i}/{len(emails)}:")
                print(f"主题: {email['subject'][:60]}...")
                print(f"正文: {email['body'][:100]}...")
                
                # 自动建议分类
                suggested = self.suggest_category(email['subject'], email['body'])
                print(f"建议分类: {suggested}")
                
                # 用户确认
                self.show_labels()
                choice = input(f"选择分类 (1-{len(self.labels)}, 回车使用建议, s=跳过): ").strip()
                
                if choice.lower() == 's':
                    continue
                elif choice == '':
                    label = suggested
                else:
                    try:
                        label = self.labels[int(choice) - 1]
                    except (ValueError, IndexError):
                        print("无效选择，跳过该邮件")
                        continue
                
                # 添加到训练数据
                self.add_to_training_data(email['subject'], email['body'], label)
                print(f"✅ 已添加: [{label}] {email['subject'][:30]}...")
        
        except Exception as e:
            print(f"❌ 导入失败: {e}")
    
    def parse_emails_from_text(self, content):
        """从文本中解析邮件"""
        emails = []
        
        # 方法1: 按"Subject:"和"From:"分割
        email_pattern = r'Subject:\s*(.*?)(?=\n|\r\n)(.*?)(?=Subject:|$)'
        matches = re.findall(email_pattern, content, re.DOTALL | re.IGNORECASE)
        
        for match in matches:
            subject = match[0].strip()
            body = match[1].strip()
            
            # 清理正文
            body = re.sub(r'From:.*?\n', '', body, flags=re.IGNORECASE)
            body = re.sub(r'To:.*?\n', '', body, flags=re.IGNORECASE)
            body = re.sub(r'Date:.*?\n', '', body, flags=re.IGNORECASE)
            body = re.sub(r'\n+', ' ', body)
            body = body[:500]  # 限制长度
            
            if len(subject) > 5 and len(body) > 10:
                emails.append({
                    'subject': subject,
                    'body': body
                })
        
        # 如果上面的方法没找到邮件，尝试其他分割方式
        if not emails:
            # 方法2: 按双换行分割
            parts = re.split(r'\n\s*\n', content)
            for part in parts:
                lines = part.strip().split('\n')
                if len(lines) >= 2:
                    subject = lines[0].strip()
                    body = ' '.join(lines[1:]).strip()[:500]
                    
                    if len(subject) > 5 and len(body) > 10:
                        emails.append({
                            'subject': subject,
                            'body': body
                        })
        
        return emails
    
    def suggest_category(self, subject, body):
        """自动建议邮件分类"""
        text = f"{subject} {body}".lower()
        
        # 分类规则
        if any(word in text for word in ['application received', 'thank you for applying', 'application confirmed']):
            return 'Applied'
        elif any(word in text for word in ['interview scheduled', 'interview confirmed', 'meeting scheduled']):
            return 'Interview Scheduled'
        elif any(word in text for word in ['please respond', 'schedule interview', 'availability']):
            return 'Response Needed'
        elif any(word in text for word in ['unfortunately', 'regret', 'other candidate', 'not moving forward']):
            return 'Rejected'
        elif any(word in text for word in ['offer', 'congratulations', 'welcome to the team']):
            return 'Offer'
        elif any(word in text for word in ['job alert', 'new jobs', 'linkedin jobs', 'indeed']):
            return 'Job Alert'
        elif any(word in text for word in ['recruiter', 'opportunity', 'interested in your background']):
            return 'Recruiter Outreach'
        elif any(word in text for word in ['status update', 'application status']):
            return 'Status Update'
        else:
            return 'Applied'  # 默认分类
    
    def show_labels(self):
        """显示可用标签"""
        print("\n可用分类:")
        for i, label in enumerate(self.labels, 1):
            print(f"  {i}. {label}")
        print()
    
    def add_to_training_data(self, subject, body, label):
        """添加到训练数据"""
        try:
            df = pd.read_csv('emails.csv')
            new_row = {'subject': subject, 'body': body, 'label': label}
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            df.to_csv('emails.csv', index=False)
        except Exception as e:
            print(f"保存失败: {e}")
    
    def import_from_clipboard(self):
        """从剪贴板导入"""
        try:
            import pyperclip
            content = pyperclip.paste()
            
            if not content.strip():
                print("❌ 剪贴板为空")
                return
            
            print(f"📋 从剪贴板读取到 {len(content)} 个字符")
            
            # 解析邮件
            emails = self.parse_emails_from_text(content)
            if not emails:
                # 如果解析失败，当作单个邮件处理
                lines = content.split('\n')
                subject = lines[0] if lines else "邮件主题"
                body = ' '.join(lines[1:]) if len(lines) > 1 else content
                
                emails = [{'subject': subject[:100], 'body': body[:500]}]
            
            print(f"📧 解析出 {len(emails)} 封邮件")
            
            # 处理邮件
            for email in emails:
                print(f"\n主题: {email['subject']}")
                print(f"正文: {email['body'][:100]}...")
                
                suggested = self.suggest_category(email['subject'], email['body'])
                print(f"建议分类: {suggested}")
                
                self.show_labels()
                choice = input("选择分类或按回车使用建议: ").strip()
                
                if choice == '':
                    label = suggested
                else:
                    try:
                        label = self.labels[int(choice) - 1]
                    except:
                        continue
                
                self.add_to_training_data(email['subject'], email['body'], label)
                print(f"✅ 已添加")
        
        except ImportError:
            print("❌ 需要安装 pyperclip: pip install pyperclip")
        except Exception as e:
            print(f"❌ 导入失败: {e}")

def main():
    """主程序"""
    importer = BatchEmailImporter()
    
    print("📧 批量邮件导入工具")
    print("=" * 50)
    
    while True:
        print("\n选择导入方式:")
        print("1. 从文本文件导入")
        print("2. 从剪贴板导入")
        print("3. 查看导入格式示例")
        print("4. 退出")
        
        choice = input("请选择 (1-4): ").strip()
        
        if choice == '1':
            file_path = input("输入文件路径: ").strip()
            if Path(file_path).exists():
                importer.import_from_text_file(file_path)
            else:
                print("❌ 文件不存在")
        
        elif choice == '2':
            importer.import_from_clipboard()
        
        elif choice == '3':
            print("\n📝 支持的文件格式:")
            print("方法1 - 标准邮件格式:")
            print("Subject: Thank you for your application")
            print("We have received your application...")
            print()
            print("Subject: Interview Invitation")
            print("We would like to invite you...")
            print()
            print("方法2 - 简单格式 (每个空行分隔):")
            print("Application Received")
            print("Thank you for applying to our company...")
            print()
            print("Interview Scheduled")
            print("Your interview has been confirmed...")
        
        elif choice == '4':
            break

if __name__ == '__main__':
    main()