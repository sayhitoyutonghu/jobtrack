#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模板邮件导入工具
解析 email_templates.txt 文件并导入到训练数据
"""

import pandas as pd
import re

# 标签对应表
LABEL_MAP = {
    '1': 'Applied',
    '2': 'Response Needed', 
    '3': 'Interview Scheduled',
    '4': 'Rejected',
    '5': 'Offer',
    '6': 'Job Alert',
    '7': 'Status Update',
    '8': 'Recruiter Outreach'
}

def parse_template_file(file_path='email_templates.txt'):
    """解析模板文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        emails = []
        
        # 按 === 分割邮件
        email_blocks = content.split('===')
        
        for block in email_blocks:
            block = block.strip()
            if not block or block.startswith('#'):
                continue
            
            # 解析格式: 主题 | 正文 | 分类编号
            parts = block.split('|')
            if len(parts) >= 3:
                subject = parts[0].strip()
                body = parts[1].strip()
                label_num = parts[2].strip()
                
                if label_num in LABEL_MAP:
                    emails.append({
                        'subject': subject,
                        'body': body,
                        'label': LABEL_MAP[label_num]
                    })
                    print(f"✅ 解析邮件: [{LABEL_MAP[label_num]}] {subject[:40]}...")
                else:
                    print(f"⚠️  未知分类编号: {label_num}")
        
        return emails
        
    except FileNotFoundError:
        print(f"❌ 未找到文件: {file_path}")
        print("请确保 email_templates.txt 文件存在")
        return []
    except Exception as e:
        print(f"❌ 解析失败: {e}")
        return []

def import_template_emails():
    """导入模板邮件到训练数据"""
    print("📧 导入模板邮件...")
    
    # 解析模板
    emails = parse_template_file()
    
    if not emails:
        print("❌ 没有找到有效的邮件数据")
        return
    
    print(f"📊 找到 {len(emails)} 封邮件")
    
    # 显示统计
    label_counts = {}
    for email in emails:
        label = email['label']
        label_counts[label] = label_counts.get(label, 0) + 1
    
    print("\n📋 邮件分布:")
    for label, count in label_counts.items():
        print(f"  {label}: {count} 条")
    
    # 确认导入
    confirm = input(f"\n确认导入这 {len(emails)} 封邮件到训练数据? (y/N): ").lower()
    
    if confirm in ['y', 'yes']:
        try:
            # 加载现有数据
            try:
                df = pd.read_csv('emails.csv')
                print(f"当前训练数据: {len(df)} 条")
            except FileNotFoundError:
                df = pd.DataFrame(columns=['subject', 'body', 'label'])
                print("创建新的训练数据文件")
            
            # 添加新邮件
            new_df = pd.DataFrame(emails)
            df = pd.concat([df, new_df], ignore_index=True)
            
            # 保存
            df.to_csv('emails.csv', index=False)
            
            print(f"✅ 成功导入! 当前总数据量: {len(df)} 条")
            
            # 显示新的分布
            print(f"\n📊 更新后的数据分布:")
            final_counts = df['label'].value_counts()
            for label, count in final_counts.items():
                print(f"  {label}: {count} 条")
            
        except Exception as e:
            print(f"❌ 导入失败: {e}")
    else:
        print("❌ 已取消导入")

def create_custom_template():
    """创建自定义模板文件"""
    print("\n📝 创建自定义邮件模板")
    print("=" * 50)
    print("请按以下格式添加邮件:")
    print("主题 | 正文 | 分类编号")
    print()
    print("分类编号对照:")
    for num, label in LABEL_MAP.items():
        print(f"  {num} = {label}")
    print()
    print("输入邮件 (一行一个，空行结束):")
    
    custom_emails = []
    while True:
        line = input().strip()
        if not line:
            break
        custom_emails.append(line)
    
    if custom_emails:
        # 保存到文件
        with open('custom_emails.txt', 'w', encoding='utf-8') as f:
            f.write("# 自定义邮件模板\n")
            f.write("# 格式: 主题 | 正文 | 分类编号\n\n")
            for email in custom_emails:
                f.write(f"===\n{email}\n\n")
        
        print(f"✅ 已保存 {len(custom_emails)} 条邮件到 custom_emails.txt")
        
        # 询问是否立即导入
        import_now = input("立即导入这些邮件? (y/N): ").lower()
        if import_now in ['y', 'yes']:
            emails = parse_template_file('custom_emails.txt')
            if emails:
                # 直接导入逻辑
                try:
                    df = pd.read_csv('emails.csv')
                except FileNotFoundError:
                    df = pd.DataFrame(columns=['subject', 'body', 'label'])
                
                new_df = pd.DataFrame(emails)
                df = pd.concat([df, new_df], ignore_index=True)
                df.to_csv('emails.csv', index=False)
                print(f"✅ 已导入 {len(emails)} 条邮件")

def main():
    """主程序"""
    print("📧 模板邮件导入工具")
    print("=" * 50)
    
    while True:
        print("\n请选择操作:")
        print("1. 导入预设模板邮件 (email_templates.txt)")
        print("2. 创建自定义模板")
        print("3. 查看模板格式说明")
        print("4. 退出")
        
        choice = input("请输入选项 (1-4): ").strip()
        
        if choice == '1':
            import_template_emails()
        
        elif choice == '2':
            create_custom_template()
        
        elif choice == '3':
            print("\n📖 模板格式说明:")
            print("=" * 30)
            print("文件格式:")
            print("===")
            print("邮件主题 | 邮件正文 | 分类编号")
            print()
            print("===")
            print("另一个邮件主题 | 另一个邮件正文 | 分类编号")
            print()
            print("分类编号对照表:")
            for num, label in LABEL_MAP.items():
                print(f"  {num} = {label}")
            print()
            print("示例:")
            print("===")
            print("Thank you for applying | We received your application and will review it. | 1")
            
        elif choice == '4':
            print("👋 再见!")
            break
        
        else:
            print("❌ 无效选项!")

if __name__ == '__main__':
    main()