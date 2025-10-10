#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单邮件导入工具
最简单的方式导入真实邮件数据
"""

import pandas as pd

def quick_import():
    """快速导入邮件数据"""
    print("📧 简单邮件导入工具")
    print("=" * 50)
    print("请逐个输入你的真实邮件数据:")
    print()
    
    # 显示标签选项
    labels = [
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
        print("可用分类:")
        for i, label in enumerate(labels, 1):
            print(f"  {i}. {label}")
        print()
    
    # 加载现有数据
    try:
        df = pd.read_csv('emails.csv')
        print(f"当前训练数据: {len(df)} 条")
    except FileNotFoundError:
        df = pd.DataFrame(columns=['subject', 'body', 'label'])
        print("将创建新的训练数据文件")
    
    added_count = 0
    
    while True:
        print(f"\n--- 添加邮件 #{added_count + 1} ---")
        
        # 输入邮件主题
        subject = input("📧 邮件主题 (输入 'quit' 退出): ").strip()
        if subject.lower() == 'quit':
            break
        if not subject:
            print("主题不能为空!")
            continue
            
        # 输入邮件正文
        body = input("📝 邮件正文: ").strip()
        if not body:
            print("正文不能为空!")
            continue
        
        # 选择分类
        show_labels()
        while True:
            try:
                choice = input("🏷️  选择分类 (1-8): ").strip()
                choice_num = int(choice)
                if 1 <= choice_num <= 8:
                    label = labels[choice_num - 1]
                    break
                else:
                    print("请输入 1-8 之间的数字!")
            except ValueError:
                print("请输入有效数字!")
        
        # 确认添加
        print(f"\n📋 确认信息:")
        print(f"主题: {subject}")
        print(f"正文: {body[:50]}{'...' if len(body) > 50 else ''}")
        print(f"分类: {label}")
        
        confirm = input("\n✅ 确认添加? (y/N): ").lower()
        if confirm in ['y', 'yes']:
            # 添加到DataFrame
            new_row = {'subject': subject, 'body': body, 'label': label}
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            added_count += 1
            print(f"✅ 已添加! (第 {added_count} 条)")
        else:
            print("❌ 已跳过")
        
        # 询问是否继续
        if added_count > 0 and added_count % 5 == 0:
            continue_add = input(f"\n已添加 {added_count} 条邮件，继续添加? (y/N): ").lower()
            if continue_add not in ['y', 'yes']:
                break
    
    # 保存数据
    if added_count > 0:
        try:
            df.to_csv('emails.csv', index=False)
            print(f"\n🎉 成功保存 {added_count} 条新邮件!")
            print(f"📊 当前总数据量: {len(df)} 条")
            
            # 显示分布
            print(f"\n当前数据分布:")
            distribution = df['label'].value_counts()
            for label, count in distribution.items():
                print(f"  {label}: {count} 条")
                
        except Exception as e:
            print(f"❌ 保存失败: {e}")
    else:
        print(f"\n没有添加新邮件")

def batch_paste():
    """批量粘贴导入"""
    print("\n📋 批量粘贴导入")
    print("=" * 40)
    print("请将你的邮件内容粘贴到下面:")
    print("(可以是多封邮件，每个邮件用空行分隔)")
    print("输入完成后，输入一行 'END' 结束:")
    print()
    
    lines = []
    while True:
        line = input()
        if line.strip().upper() == 'END':
            break
        lines.append(line)
    
    if not lines:
        print("❌ 没有输入内容")
        return
    
    # 解析邮件
    content = '\n'.join(lines)
    emails = []
    
    # 简单按双换行分割
    email_blocks = content.split('\n\n')
    
    for block in email_blocks:
        block = block.strip()
        if len(block) > 20:  # 过滤太短的内容
            lines_in_block = block.split('\n')
            subject = lines_in_block[0] if lines_in_block else "邮件主题"
            body = ' '.join(lines_in_block[1:]) if len(lines_in_block) > 1 else block
            
            # 限制长度
            subject = subject[:100]
            body = body[:500]
            
            emails.append({'subject': subject, 'body': body})
    
    print(f"\n📧 解析出 {len(emails)} 封邮件")
    
    if not emails:
        print("❌ 未能解析出有效邮件")
        return
    
    # 显示标签
    labels = ["Applied", "Response Needed", "Interview Scheduled", "Rejected", 
              "Offer", "Job Alert", "Status Update", "Recruiter Outreach"]
    
    # 逐个分类
    classified_emails = []
    for i, email in enumerate(emails, 1):
        print(f"\n--- 邮件 {i}/{len(emails)} ---")
        print(f"主题: {email['subject']}")
        print(f"正文: {email['body'][:100]}...")
        
        print(f"\n可用分类:")
        for j, label in enumerate(labels, 1):
            print(f"  {j}. {label}")
        
        while True:
            choice = input(f"选择分类 (1-8) 或 s=跳过: ").strip()
            if choice.lower() == 's':
                break
            try:
                choice_num = int(choice)
                if 1 <= choice_num <= 8:
                    email['label'] = labels[choice_num - 1]
                    classified_emails.append(email)
                    print(f"✅ 已分类为: {email['label']}")
                    break
                else:
                    print("请输入 1-8 或 s!")
            except ValueError:
                print("请输入有效选项!")
    
    # 保存
    if classified_emails:
        try:
            df = pd.read_csv('emails.csv')
        except FileNotFoundError:
            df = pd.DataFrame(columns=['subject', 'body', 'label'])
        
        new_df = pd.DataFrame(classified_emails)
        df = pd.concat([df, new_df], ignore_index=True)
        df.to_csv('emails.csv', index=False)
        
        print(f"\n✅ 成功导入 {len(classified_emails)} 条邮件!")
        print(f"📊 当前总数据量: {len(df)} 条")

def main():
    """主程序"""
    while True:
        print("\n📧 简单邮件导入工具")
        print("=" * 50)
        print("选择导入方式:")
        print("1. 逐个手动输入邮件")
        print("2. 批量粘贴邮件内容")
        print("3. 查看当前数据统计")
        print("4. 退出")
        
        choice = input("\n请选择 (1-4): ").strip()
        
        if choice == '1':
            quick_import()
        elif choice == '2':
            batch_paste()
        elif choice == '3':
            try:
                df = pd.read_csv('emails.csv')
                print(f"\n📊 当前数据统计:")
                print(f"总数据量: {len(df)} 条")
                distribution = df['label'].value_counts()
                for label, count in distribution.items():
                    print(f"  {label}: {count} 条")
            except FileNotFoundError:
                print("❌ 未找到训练数据文件")
        elif choice == '4':
            print("👋 再见!")
            break
        else:
            print("❌ 无效选项!")

if __name__ == '__main__':
    main()