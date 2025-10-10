#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
训练数据扩充快速入门脚本
一键运行数据分析和改进建议
"""

import subprocess
import sys
import os

def run_analysis():
    """运行数据分析"""
    print("🔍 正在分析当前训练数据...")
    try:
        result = subprocess.run([sys.executable, 'analyze_data.py'], 
                              capture_output=True, text=True, cwd='.')
        print(result.stdout)
        if result.stderr:
            print(f"警告: {result.stderr}")
    except Exception as e:
        print(f"❌ 分析失败: {e}")

def show_tools_menu():
    """显示工具菜单"""
    print("\n🛠️  可用的数据扩充工具:")
    print("=" * 50)
    print("1. expand_training_data.py  - 手动添加邮件数据")
    print("2. gmail_importer.py        - 从Gmail导入邮件")
    print("3. email_annotator.py       - 重新标注邮件")
    print("4. data_quality_checker.py  - 数据质量检查")
    print("5. train_model.py           - 重新训练模型")
    
    print(f"\n📖 详细使用方法请查看: TRAINING_DATA_GUIDE.md")

def quick_add_samples():
    """快速添加示例数据"""
    print(f"\n💡 要快速添加一些示例数据吗？")
    print("这将为每个类别添加2-3个示例邮件")
    
    choice = input("添加示例数据? (y/N): ").lower()
    if choice in ['y', 'yes']:
        print("🚀 正在添加示例数据...")
        
        # 示例数据
        sample_emails = [
            # Applied 类别
            {
                'subject': 'Application Received - Software Engineer Position',
                'body': 'Thank you for your interest in the Software Engineer position at TechCorp. We have received your application and will review it within 2 weeks.',
                'label': 'Applied'
            },
            {
                'subject': 'Confirmation: Your Job Application',
                'body': 'This email confirms that we have received your application for the Data Scientist role. Our team will review your qualifications and contact you soon.',
                'label': 'Applied'
            },
            
            # Response Needed 类别
            {
                'subject': 'Action Required: Schedule Your Interview',
                'body': 'We would like to move forward with your application. Please reply with your availability for next week to schedule an interview.',
                'label': 'Response Needed'
            },
            {
                'subject': 'Please Confirm Your Interview Availability',
                'body': 'Thank you for your application. We are interested in interviewing you. Please respond with your available time slots.',
                'label': 'Response Needed'
            },
            
            # Offer 类别  
            {
                'subject': 'Job Offer - Senior Developer Position',
                'body': 'Congratulations! We are pleased to extend an offer for the Senior Developer position. Please review the attached offer letter.',
                'label': 'Offer'
            },
            {
                'subject': 'Welcome to Our Team!',
                'body': 'We are excited to offer you the Product Manager position at our company. We believe you will be a great addition to our team.',
                'label': 'Offer'
            },
            
            # Recruiter Outreach 类别
            {
                'subject': 'Exciting Opportunity - Full Stack Developer',
                'body': 'Hi, I came across your profile and think you would be perfect for a Full Stack Developer role at a growing startup. Are you open to new opportunities?',
                'label': 'Recruiter Outreach'
            },
            {
                'subject': 'Career Opportunity That Matches Your Skills',
                'body': 'I represent a client looking for someone with your background in machine learning. Would you be interested in discussing a senior ML engineer position?',
                'label': 'Recruiter Outreach'
            }
        ]
        
        try:
            import pandas as pd
            
            # 加载现有数据
            try:
                df = pd.read_csv('emails.csv')
            except FileNotFoundError:
                df = pd.DataFrame(columns=['subject', 'body', 'label'])
            
            # 添加示例数据
            new_df = pd.DataFrame(sample_emails)
            df = pd.concat([df, new_df], ignore_index=True)
            
            # 保存
            df.to_csv('emails.csv', index=False)
            
            print(f"✅ 已添加 {len(sample_emails)} 条示例数据!")
            print(f"📊 当前总数据量: {len(df)} 条")
            
            # 显示新的分布
            print(f"\n当前标签分布:")
            distribution = df['label'].value_counts()
            for label, count in distribution.items():
                print(f"  {label}: {count} 条")
                
        except Exception as e:
            print(f"❌ 添加示例数据失败: {e}")

def main():
    """主程序"""
    print("🚀 JobTrack 训练数据扩充向导")
    print("=" * 60)
    
    # 检查是否存在训练数据文件
    if not os.path.exists('emails.csv'):
        print("❌ 未找到 emails.csv 文件!")
        print("请确保在正确的项目目录中运行此脚本")
        return
    
    # 运行基础分析
    run_analysis()
    
    # 显示工具菜单
    show_tools_menu()
    
    # 提供快速添加选项
    quick_add_samples()
    
    print(f"\n🎯 下一步建议:")
    print(f"  1. 使用 'python expand_training_data.py' 手动添加更多数据")
    print(f"  2. 使用 'python data_quality_checker.py' 检查数据质量")
    print(f"  3. 数据足够后运行 'python train_model.py' 重新训练模型")
    
    print(f"\n📖 完整指南: 查看 TRAINING_DATA_GUIDE.md")

if __name__ == '__main__':
    main()