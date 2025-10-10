#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件训练数据扩充工具
用于向 emails.csv 添加新的训练数据
"""

import pandas as pd
import sys
from datetime import datetime

# 定义可用的标签类别
AVAILABLE_LABELS = [
    "Applied",              # 申请确认
    "Response Needed",      # 需要回复
    "Interview Scheduled",  # 面试安排  
    "Rejected",            # 被拒绝
    "Offer",               # 录用通知
    "Job Alert",           # 职位提醒
    "Status Update",       # 状态更新
    "Recruiter Outreach"   # 猎头联系
]

def show_labels():
    """显示可用的标签类别"""
    print("\n📋 可用的邮件类别:")
    for i, label in enumerate(AVAILABLE_LABELS, 1):
        print(f"  {i}. {label}")
    print()

def add_single_email():
    """交互式添加单条邮件数据"""
    print("\n✏️  添加新的邮件训练数据")
    print("=" * 50)
    
    # 获取邮件主题
    subject = input("📧 请输入邮件主题: ").strip()
    if not subject:
        print("❌ 邮件主题不能为空!")
        return False
    
    # 获取邮件正文
    print("\n📝 请输入邮件正文 (按回车结束):")
    body = input().strip()
    if not body:
        print("❌ 邮件正文不能为空!")
        return False
    
    # 选择标签
    show_labels()
    while True:
        try:
            choice = input("🏷️  请选择邮件类别 (输入数字): ").strip()
            choice_num = int(choice)
            if 1 <= choice_num <= len(AVAILABLE_LABELS):
                label = AVAILABLE_LABELS[choice_num - 1]
                break
            else:
                print(f"❌ 请输入 1-{len(AVAILABLE_LABELS)} 之间的数字!")
        except ValueError:
            print("❌ 请输入有效的数字!")
    
    # 确认信息
    print(f"\n📋 确认添加以下数据:")
    print(f"  主题: {subject}")
    print(f"  正文: {body}")
    print(f"  标签: {label}")
    
    confirm = input("\n✅ 确认添加? (y/N): ").lower()
    if confirm in ['y', 'yes']:
        return add_email_to_csv(subject, body, label)
    else:
        print("❌ 已取消添加")
        return False

def add_email_to_csv(subject, body, label):
    """将邮件数据添加到CSV文件"""
    try:
        # 读取现有数据
        df = pd.read_csv('emails.csv')
        
        # 创建新行
        new_row = {
            'subject': subject,
            'body': body,
            'label': label
        }
        
        # 添加新行
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        
        # 保存到文件
        df.to_csv('emails.csv', index=False)
        
        print(f"✅ 成功添加邮件数据! 当前总数据量: {len(df)}")
        
        # 显示当前标签分布
        print(f"\n📊 当前 '{label}' 类别数据量: {(df['label'] == label).sum()}")
        
        return True
        
    except Exception as e:
        print(f"❌ 添加数据时出错: {e}")
        return False

def bulk_add_emails():
    """批量添加邮件数据"""
    print("\n📦 批量添加邮件数据")
    print("=" * 50)
    print("请按以下格式输入数据 (一行一个邮件):")
    print("主题|||正文|||标签编号")
    print("\n示例:")
    print("Thank you for applying|||We received your application and will review it.|||1")
    print("\n输入完成后，输入空行结束:")
    
    show_labels()
    
    emails_to_add = []
    line_num = 1
    
    while True:
        line = input(f"邮件 {line_num}: ").strip()
        if not line:
            break
            
        try:
            parts = line.split('|||')
            if len(parts) != 3:
                print("❌ 格式错误! 请使用: 主题|||正文|||标签编号")
                continue
                
            subject, body, label_num = parts
            label_idx = int(label_num) - 1
            
            if 0 <= label_idx < len(AVAILABLE_LABELS):
                label = AVAILABLE_LABELS[label_idx]
                emails_to_add.append({
                    'subject': subject.strip(),
                    'body': body.strip(), 
                    'label': label
                })
                print(f"✅ 已记录邮件 {line_num}: {label}")
                line_num += 1
            else:
                print(f"❌ 标签编号无效! 请输入 1-{len(AVAILABLE_LABELS)}")
                
        except ValueError:
            print("❌ 标签编号必须是数字!")
        except Exception as e:
            print(f"❌ 解析错误: {e}")
    
    if emails_to_add:
        print(f"\n📝 准备添加 {len(emails_to_add)} 条邮件数据")
        confirm = input("✅ 确认批量添加? (y/N): ").lower()
        
        if confirm in ['y', 'yes']:
            try:
                df = pd.read_csv('emails.csv')
                new_df = pd.DataFrame(emails_to_add)
                df = pd.concat([df, new_df], ignore_index=True)
                df.to_csv('emails.csv', index=False)
                
                print(f"✅ 成功批量添加 {len(emails_to_add)} 条数据!")
                print(f"📊 当前总数据量: {len(df)}")
                
            except Exception as e:
                print(f"❌ 批量添加失败: {e}")
        else:
            print("❌ 已取消批量添加")
    else:
        print("❌ 没有有效的邮件数据")

def show_stats():
    """显示当前数据统计"""
    try:
        df = pd.read_csv('emails.csv')
        print(f"\n📊 当前训练数据统计:")
        print(f"总数据量: {len(df)} 条")
        
        label_counts = df['label'].value_counts()
        print(f"\n各类别数据量:")
        for label, count in label_counts.items():
            percentage = (count / len(df)) * 100
            print(f"  {label}: {count} 条 ({percentage:.1f}%)")
            
    except Exception as e:
        print(f"❌ 读取数据失败: {e}")

def main():
    """主程序"""
    print("🚀 邮件训练数据扩充工具")
    print("=" * 50)
    
    while True:
        print("\n📋 请选择操作:")
        print("  1. 添加单条邮件数据")
        print("  2. 批量添加邮件数据") 
        print("  3. 查看当前数据统计")
        print("  4. 查看可用标签")
        print("  5. 退出")
        
        choice = input("\n请输入选项 (1-5): ").strip()
        
        if choice == '1':
            add_single_email()
        elif choice == '2':
            bulk_add_emails()
        elif choice == '3':
            show_stats()
        elif choice == '4':
            show_labels()
        elif choice == '5':
            print("👋 再见!")
            break
        else:
            print("❌ 无效选项，请重新输入!")

if __name__ == '__main__':
    main()