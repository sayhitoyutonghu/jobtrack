#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gmail 邮件导入工具
用于从 Gmail 导入真实邮件数据进行训练
需要先设置 Gmail API 认证
"""

import os
import base64
import json
import re
import pandas as pd
from datetime import datetime, timedelta
from email.mime.text import MIMEText

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    GMAIL_API_AVAILABLE = True
except ImportError:
    GMAIL_API_AVAILABLE = False

# Gmail API 权限范围
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# 求职相关邮件的关键词
JOB_KEYWORDS = [
    'application', 'interview', 'position', 'role', 'candidate',
    'resume', 'cv', 'hiring', 'recruiter', 'hr', 'human resources',
    'job', 'career', 'opportunity', 'employment', 'offer',
    'salary', 'compensation', 'benefits', 'onboarding',
    'rejection', 'regret', 'unfortunately', 'feedback',
    'linkedin', 'indeed', 'glassdoor', 'jobs', 'careers'
]

# 邮件类别识别规则
EMAIL_PATTERNS = {
    'Applied': [
        'application.*received', 'thank.*application', 'application.*confirmed',
        'application.*submitted', 'received.*application'
    ],
    'Response Needed': [
        'please.*respond', 'action.*required', 'schedule.*interview',
        'availability', 'please.*reply', 'response.*needed'
    ],
    'Interview Scheduled': [
        'interview.*scheduled', 'interview.*confirmed', 'meeting.*scheduled',
        'interview.*appointment', 'confirmed.*interview'
    ],
    'Rejected': [
        'unfortunately', 'regret.*inform', 'decided.*not.*proceed',
        'other.*candidate', 'not.*moving.*forward', 'position.*filled'
    ],
    'Offer': [
        'offer.*position', 'pleased.*offer', 'job.*offer',
        'congratulations', 'welcome.*team', 'offer.*employment'
    ],
    'Job Alert': [
        'job.*alert', 'new.*jobs', 'job.*notification',
        'linkedin.*jobs', 'indeed.*alert', 'career.*alert'
    ],
    'Status Update': [
        'status.*update', 'application.*status', 'update.*application',
        'progress.*application', 'application.*progress'
    ],
    'Recruiter Outreach': [
        'recruiter', 'headhunter', 'talent.*acquisition',
        'opportunity.*discuss', 'interested.*background'
    ]
}

class GmailImporter:
    def __init__(self):
        self.service = None
        self.credentials = None
    
    def authenticate(self):
        """Gmail API 认证"""
        if not GMAIL_API_AVAILABLE:
            print("❌ Gmail API 库未安装!")
            print("请运行: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
            return False
        
        print("🔐 开始 Gmail API 认证...")
        
        # 检查已保存的凭据
        if os.path.exists('token.json'):
            self.credentials = Credentials.from_authorized_user_file('token.json', SCOPES)
        
        # 如果没有有效凭据，进行 OAuth 流程
        if not self.credentials or not self.credentials.valid:
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                self.credentials.refresh(Request())
            else:
                if not os.path.exists('credentials.json'):
                    print("❌ 未找到 credentials.json 文件!")
                    print("请按照以下步骤设置 Gmail API:")
                    print("1. 访问 https://console.developers.google.com/")
                    print("2. 创建新项目或选择现有项目")
                    print("3. 启用 Gmail API")
                    print("4. 创建 OAuth 2.0 客户端 ID 凭据")
                    print("5. 下载凭据文件并重命名为 credentials.json")
                    return False
                
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                self.credentials = flow.run_local_server(port=0)
            
            # 保存凭据
            with open('token.json', 'w') as token:
                token.write(self.credentials.to_json())
        
        self.service = build('gmail', 'v1', credentials=self.credentials)
        print("✅ Gmail API 认证成功!")
        return True
    
    def search_job_emails(self, max_results=100, days_back=30):
        """搜索求职相关邮件"""
        if not self.service:
            print("❌ 请先进行 Gmail API 认证!")
            return []
        
        print(f"🔍 搜索最近 {days_back} 天的求职相关邮件...")
        
        # 构建搜索查询
        keywords_query = ' OR '.join(JOB_KEYWORDS[:10])  # 使用前10个关键词避免查询过长
        
        # 搜索邮件
        try:
            results = self.service.users().messages().list(
                userId='me',
                q=f'({keywords_query}) newer_than:{days_back}d',
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            print(f"📧 找到 {len(messages)} 封相关邮件")
            
            return messages
            
        except Exception as e:
            print(f"❌ 搜索邮件失败: {e}")
            return []
    
    def get_email_content(self, message_id):
        """获取邮件内容"""
        try:
            message = self.service.users().messages().get(
                userId='me', 
                id=message_id,
                format='full'
            ).execute()
            
            # 提取邮件头信息
            headers = message['payload'].get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), '')
            
            # 提取邮件正文
            body = self._extract_body(message['payload'])
            
            return {
                'id': message_id,
                'subject': subject,
                'sender': sender,
                'body': body
            }
            
        except Exception as e:
            print(f"❌ 获取邮件 {message_id} 失败: {e}")
            return None
    
    def _extract_body(self, payload):
        """提取邮件正文"""
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body_data = part['body']['data']
                        body = base64.urlsafe_b64decode(body_data).decode('utf-8')
                        break
        else:
            if payload['mimeType'] == 'text/plain' and 'data' in payload['body']:
                body_data = payload['body']['data']
                body = base64.urlsafe_b64decode(body_data).decode('utf-8')
        
        # 清理邮件正文
        body = re.sub(r'\r?\n', ' ', body)  # 移除换行
        body = re.sub(r'\s+', ' ', body)   # 合并多余空格
        body = body.strip()
        
        return body[:500]  # 限制长度
    
    def classify_email(self, subject, body):
        """自动分类邮件"""
        text = f"{subject} {body}".lower()
        
        for label, patterns in EMAIL_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return label
        
        return 'Unknown'  # 未知类别
    
    def import_emails_interactive(self):
        """交互式导入邮件"""
        if not self.authenticate():
            return
        
        print("\n📥 开始导入 Gmail 邮件...")
        
        # 搜索参数
        try:
            max_results = int(input("📧 最多导入多少封邮件? (默认50): ") or 50)
            days_back = int(input("🗓️  搜索最近多少天的邮件? (默认30): ") or 30)
        except ValueError:
            max_results, days_back = 50, 30
        
        # 搜索邮件
        messages = self.search_job_emails(max_results, days_back)
        if not messages:
            print("❌ 未找到相关邮件")
            return
        
        # 处理邮件
        imported_count = 0
        for i, message in enumerate(messages, 1):
            print(f"\n📧 处理邮件 {i}/{len(messages)}...")
            
            email_data = self.get_email_content(message['id'])
            if not email_data:
                continue
            
            # 显示邮件信息
            print(f"主题: {email_data['subject'][:80]}...")
            print(f"发件人: {email_data['sender'][:50]}...")
            print(f"正文: {email_data['body'][:100]}...")
            
            # 自动分类
            suggested_label = self.classify_email(email_data['subject'], email_data['body'])
            print(f"建议分类: {suggested_label}")
            
            # 用户确认
            action = input("操作 (s=跳过, a=添加, q=退出): ").lower()
            
            if action == 'q':
                break
            elif action == 's':
                continue
            elif action == 'a':
                # 让用户确认或修改分类
                print("\n可用类别:")
                for idx, label in enumerate(EMAIL_PATTERNS.keys(), 1):
                    marker = "👈" if label == suggested_label else ""
                    print(f"  {idx}. {label} {marker}")
                
                try:
                    choice = input(f"选择类别 (1-{len(EMAIL_PATTERNS)}, 回车使用建议): ")
                    if choice.strip():
                        labels = list(EMAIL_PATTERNS.keys())
                        final_label = labels[int(choice) - 1]
                    else:
                        final_label = suggested_label
                    
                    # 添加到训练数据
                    if self._add_to_training_data(email_data['subject'], email_data['body'], final_label):
                        imported_count += 1
                        print(f"✅ 已添加到训练数据 ({imported_count} 条)")
                    
                except (ValueError, IndexError):
                    print("❌ 无效选择，跳过该邮件")
        
        print(f"\n🎉 导入完成! 共添加 {imported_count} 条训练数据")
    
    def _add_to_training_data(self, subject, body, label):
        """添加到训练数据"""
        try:
            df = pd.read_csv('emails.csv')
            new_row = {
                'subject': subject,
                'body': body,
                'label': label
            }
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            df.to_csv('emails.csv', index=False)
            return True
        except Exception as e:
            print(f"❌ 添加数据失败: {e}")
            return False

def setup_gmail_api():
    """设置 Gmail API 指南"""
    print("🔧 Gmail API 设置指南")
    print("=" * 50)
    print()
    print("1. 访问 Google Cloud Console:")
    print("   https://console.developers.google.com/")
    print()
    print("2. 创建新项目或选择现有项目")
    print()
    print("3. 启用 Gmail API:")
    print("   - 在左侧菜单选择 'APIs & Services' > 'Library'")
    print("   - 搜索 'Gmail API' 并点击启用")
    print()
    print("4. 创建凭据:")
    print("   - 在 'APIs & Services' > 'Credentials'")
    print("   - 点击 'CREATE CREDENTIALS' > 'OAuth client ID'")
    print("   - 应用类型选择 'Desktop application'")
    print("   - 下载 JSON 文件")
    print()
    print("5. 重命名下载的文件为 'credentials.json' 并放在当前目录")
    print()
    print("6. 安装依赖库:")
    print("   pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    print()

def main():
    """主程序"""
    print("📧 Gmail 邮件导入工具")
    print("=" * 50)
    
    if not GMAIL_API_AVAILABLE:
        print("❌ Gmail API 库未安装!")
        setup_gmail_api()
        return
    
    importer = GmailImporter()
    
    while True:
        print("\n📋 请选择操作:")
        print("  1. 设置 Gmail API")
        print("  2. 导入 Gmail 邮件")
        print("  3. 测试 API 连接")
        print("  4. 退出")
        
        choice = input("\n请输入选项 (1-4): ").strip()
        
        if choice == '1':
            setup_gmail_api()
        elif choice == '2':
            importer.import_emails_interactive()
        elif choice == '3':
            if importer.authenticate():
                print("✅ Gmail API 连接正常!")
            else:
                print("❌ Gmail API 连接失败!")
        elif choice == '4':
            print("👋 再见!")
            break
        else:
            print("❌ 无效选项，请重新输入!")

if __name__ == '__main__':
    main()