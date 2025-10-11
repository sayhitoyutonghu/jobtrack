#!/usr/bin/env python3
"""
准备训练数据脚本
将从Gmail API导出的真实数据转换为模型训练格式
"""

import pandas as pd
import os
import glob
from pathlib import Path

def merge_gmail_exports(export_dir='backend/export', output_file='emails_real.csv'):
    """
    合并所有从Gmail导出的CSV文件，并转换为训练格式
    
    输入格式: threadId,messageId,label,skipped,subject,from,snippet
    输出格式: subject,body,label
    """
    
    print(f"🔍 从 {export_dir} 目录查找训练数据...")
    
    # 查找所有CSV文件
    csv_files = glob.glob(os.path.join(export_dir, '*.csv'))
    
    if not csv_files:
        print(f"❌ 在 {export_dir} 目录中没有找到CSV文件")
        print(f"💡 请先运行以下命令导出Gmail数据：")
        print(f"   node scripts/export-gmail-training-data.js --query \"in:inbox\" --maxResults 500")
        return None
    
    print(f"📁 找到 {len(csv_files)} 个CSV文件:")
    for f in csv_files:
        print(f"   - {os.path.basename(f)}")
    
    # 读取并合并所有CSV文件
    all_data = []
    total_rows = 0
    
    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file)
            print(f"\n📊 读取 {os.path.basename(csv_file)}: {len(df)} 行")
            
            # 显示标签分布
            if 'label' in df.columns:
                label_counts = df['label'].value_counts()
                for label, count in label_counts.items():
                    if label:  # 忽略空标签
                        print(f"   - {label}: {count}")
            
            all_data.append(df)
            total_rows += len(df)
        except Exception as e:
            print(f"⚠️  读取 {csv_file} 失败: {e}")
    
    if not all_data:
        print("❌ 没有成功读取任何数据")
        return None
    
    # 合并所有数据
    print(f"\n🔄 合并数据...")
    combined_df = pd.concat(all_data, ignore_index=True)
    print(f"✓ 总共 {len(combined_df)} 行数据")
    
    # 过滤数据：只保留有标签的邮件
    print(f"\n🔍 过滤数据...")
    print(f"   原始数据: {len(combined_df)} 行")
    
    # 移除没有标签的行
    combined_df = combined_df[combined_df['label'].notna() & (combined_df['label'] != '')]
    print(f"   有标签的数据: {len(combined_df)} 行")
    
    # 移除被跳过的邮件
    if 'skipped' in combined_df.columns:
        before_skip = len(combined_df)
        combined_df = combined_df[combined_df['skipped'].isna() | (combined_df['skipped'] == '')]
        print(f"   移除跳过的邮件: {len(combined_df)} 行 (跳过了 {before_skip - len(combined_df)} 行)")
    
    if len(combined_df) == 0:
        print("❌ 过滤后没有可用的训练数据")
        print("💡 提示: 请确保你的Gmail邮件已经被分类标记")
        return None
    
    # 转换为训练格式
    print(f"\n🔄 转换数据格式...")
    training_df = pd.DataFrame({
        'subject': combined_df['subject'].fillna(''),
        'body': combined_df['snippet'].fillna(''),  # 使用snippet作为body
        'label': combined_df['label']
    })
    
    # 移除重复的邮件（基于subject和body）
    before_dedup = len(training_df)
    training_df = training_df.drop_duplicates(subset=['subject', 'body'], keep='first')
    print(f"   移除重复邮件: {len(training_df)} 行 (去重 {before_dedup - len(training_df)} 行)")
    
    # 显示最终标签分布
    print(f"\n📊 最终训练数据标签分布:")
    label_counts = training_df['label'].value_counts()
    for label, count in label_counts.items():
        percentage = (count / len(training_df)) * 100
        print(f"   - {label}: {count} ({percentage:.1f}%)")
    
    # 保存为CSV
    training_df.to_csv(output_file, index=False, encoding='utf-8')
    print(f"\n✅ 训练数据已保存到: {output_file}")
    print(f"📝 总共 {len(training_df)} 条有标签的邮件")
    print(f"🏷️  包含 {len(label_counts)} 个不同的标签")
    
    return training_df

def compare_with_mock_data():
    """
    比较真实数据和mock数据
    """
    print("\n" + "="*60)
    print("📊 数据对比")
    print("="*60)
    
    # 读取mock数据
    if os.path.exists('emails.csv'):
        mock_df = pd.read_csv('emails.csv')
        print(f"\n📁 Mock数据 (emails.csv):")
        print(f"   - 总数: {len(mock_df)} 条")
        print(f"   - 标签数: {len(mock_df['label'].unique())} 个")
        print(f"   - 标签: {', '.join(mock_df['label'].unique())}")
    
    # 读取真实数据
    if os.path.exists('emails_real.csv'):
        real_df = pd.read_csv('emails_real.csv')
        print(f"\n📁 真实数据 (emails_real.csv):")
        print(f"   - 总数: {len(real_df)} 条")
        print(f"   - 标签数: {len(real_df['label'].unique())} 个")
        print(f"   - 标签: {', '.join(real_df['label'].unique())}")
        
        # 检查数据质量
        print(f"\n📊 数据质量检查:")
        # 转换为字符串类型以避免类型错误
        real_df['subject'] = real_df['subject'].astype(str)
        real_df['body'] = real_df['body'].astype(str)
        
        empty_subjects = len(real_df[real_df['subject'].str.strip() == ''])
        empty_bodies = len(real_df[real_df['body'].str.strip() == ''])
        print(f"   - 空主题: {empty_subjects} 条")
        print(f"   - 空内容: {empty_bodies} 条")
        
        # 显示平均长度
        avg_subject_len = real_df['subject'].str.len().mean()
        avg_body_len = real_df['body'].str.len().mean()
        print(f"   - 平均主题长度: {avg_subject_len:.1f} 字符")
        print(f"   - 平均内容长度: {avg_body_len:.1f} 字符")

if __name__ == '__main__':
    print("="*60)
    print("🚀 准备真实Gmail训练数据")
    print("="*60)
    
    # 合并和转换数据
    result = merge_gmail_exports()
    
    if result is not None:
        # 显示对比
        compare_with_mock_data()
        
        print("\n" + "="*60)
        print("✅ 数据准备完成！")
        print("="*60)
        print("\n下一步:")
        print("1. 使用真实数据训练: python train_model.py --data emails_real.csv")
        print("2. 使用mock数据训练: python train_model.py --data emails.csv")
        print("3. 使用默认数据训练: python train_model.py")
    else:
        print("\n" + "="*60)
        print("❌ 数据准备失败")
        print("="*60)
        print("\n请按照以下步骤准备数据:")
        print("\n1. 确保后端服务正在运行:")
        print("   npm run dev")
        print("\n2. 在浏览器中登录Gmail账号:")
        print("   打开 http://localhost:5173")
        print("\n3. 导出Gmail训练数据:")
        print("   在浏览器控制台中获取SESSION_ID")
        print("   然后运行:")
        print("   $env:JOBTRACK_SESSION_ID='your_session_id'")
        print("   node scripts/export-gmail-training-data.js --query \"in:inbox\" --maxResults 500")
        print("\n4. 重新运行此脚本:")
        print("   python prepare_training_data.py")

