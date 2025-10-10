import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter

def analyze_training_data():
    """分析当前training数据的分布情况"""
    print("📊 分析 emails.csv 中的训练数据...")
    
    # 加载数据
    df = pd.read_csv('emails.csv')
    
    print(f"\n总数据量: {len(df)} 条邮件")
    print(f"数据列: {list(df.columns)}")
    
    # 分析标签分布
    label_counts = df['label'].value_counts()
    print(f"\n📋 标签分布:")
    for label, count in label_counts.items():
        percentage = (count / len(df)) * 100
        print(f"  {label}: {count} 条 ({percentage:.1f}%)")
    
    # 检查数据质量
    print(f"\n🔍 数据质量检查:")
    print(f"  缺失主题: {df['subject'].isnull().sum()}")
    print(f"  缺失正文: {df['body'].isnull().sum()}")
    print(f"  缺失标签: {df['label'].isnull().sum()}")
    
    # 统计文本长度
    df['text_length'] = (df['subject'].fillna('') + ' ' + df['body'].fillna('')).str.len()
    print(f"\n📝 文本长度统计:")
    print(f"  平均长度: {df['text_length'].mean():.0f} 字符")
    print(f"  最短: {df['text_length'].min()} 字符")
    print(f"  最长: {df['text_length'].max()} 字符")
    
    # 建议
    print(f"\n💡 数据扩充建议:")
    min_samples_per_class = 50  # 建议每个类别至少50个样本
    
    for label, count in label_counts.items():
        if count < min_samples_per_class:
            needed = min_samples_per_class - count
            print(f"  {label}: 需要增加 {needed} 条数据 (当前 {count} 条)")
    
    total_needed = max(0, min_samples_per_class * len(label_counts) - len(df))
    print(f"\n建议总数据量: {min_samples_per_class * len(label_counts)} 条")
    print(f"还需要增加: {total_needed} 条数据")
    
    return df, label_counts

if __name__ == '__main__':
    df, label_counts = analyze_training_data()