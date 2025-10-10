#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
训练数据质量检查和改进工具
用于分析和提升邮件分类训练数据的质量
"""

import pandas as pd
import numpy as np
import re
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt
import seaborn as sns

class DataQualityChecker:
    def __init__(self):
        self.df = None
        self.load_data()
    
    def load_data(self):
        """加载训练数据"""
        try:
            self.df = pd.read_csv('emails.csv')
            print(f"✅ 已加载 {len(self.df)} 条训练数据")
        except FileNotFoundError:
            print("❌ 未找到 emails.csv 文件!")
            exit(1)
    
    def basic_statistics(self):
        """基础统计分析"""
        print("\n📊 基础统计分析")
        print("=" * 60)
        
        # 数据概览
        print(f"总数据量: {len(self.df)} 条")
        print(f"数据列: {list(self.df.columns)}")
        
        # 缺失值检查
        missing_data = self.df.isnull().sum()
        if missing_data.sum() > 0:
            print(f"\n⚠️  缺失值:")
            for col, count in missing_data.items():
                if count > 0:
                    print(f"  {col}: {count} 条 ({count/len(self.df)*100:.1f}%)")
        else:
            print(f"\n✅ 无缺失值")
        
        # 重复数据检查
        duplicates = self.df.duplicated(['subject', 'body']).sum()
        if duplicates > 0:
            print(f"\n⚠️  重复邮件: {duplicates} 条")
            # 显示重复邮件
            duplicate_emails = self.df[self.df.duplicated(['subject', 'body'], keep=False)]
            for _, row in duplicate_emails.iterrows():
                print(f"  - {row['subject'][:50]}... [{row['label']}]")
        else:
            print(f"\n✅ 无重复邮件")
        
        # 文本长度分析
        self.df['text_length'] = (
            self.df['subject'].fillna('').astype(str) + ' ' + 
            self.df['body'].fillna('').astype(str)
        ).str.len()
        
        print(f"\n📝 文本长度统计:")
        print(f"  平均长度: {self.df['text_length'].mean():.0f} 字符")
        print(f"  中位数长度: {self.df['text_length'].median():.0f} 字符")
        print(f"  最短: {self.df['text_length'].min()} 字符")
        print(f"  最长: {self.df['text_length'].max()} 字符")
        
        # 找出异常短的邮件
        short_emails = self.df[self.df['text_length'] < 30]
        if len(short_emails) > 0:
            print(f"\n⚠️  异常短邮件 (<30字符): {len(short_emails)} 条")
            for _, row in short_emails.iterrows():
                print(f"  - {row['subject']} | {row['body'][:30]}... [{row['label']}]")
    
    def label_distribution_analysis(self):
        """标签分布分析"""
        print("\n🏷️  标签分布分析")
        print("=" * 60)
        
        # 计算分布
        label_counts = self.df['label'].value_counts()
        total = len(self.df)
        
        print("当前标签分布:")
        for label, count in label_counts.items():
            percentage = (count / total) * 100
            bar = "█" * int(percentage / 2)  # 简单的条形图
            print(f"  {label:20} {count:3d} ({percentage:5.1f}%) {bar}")
        
        # 数据平衡性分析
        print(f"\n📈 数据平衡性分析:")
        max_count = label_counts.max()
        min_count = label_counts.min()
        balance_ratio = min_count / max_count
        
        print(f"  最多类别: {label_counts.idxmax()} ({max_count} 条)")
        print(f"  最少类别: {label_counts.idxmin()} ({min_count} 条)")
        print(f"  平衡比例: {balance_ratio:.2f} (1.0为完全平衡)")
        
        if balance_ratio < 0.5:
            print(f"  ⚠️  数据不平衡严重，建议增加少数类别的样本")
        elif balance_ratio < 0.8:
            print(f"  ⚠️  数据略有不平衡，可以考虑调整")
        else:
            print(f"  ✅ 数据分布相对平衡")
        
        # 推荐样本数
        recommended_per_class = max(50, max_count)
        print(f"\n💡 建议每个类别至少有 {recommended_per_class} 个样本:")
        for label, count in label_counts.items():
            needed = max(0, recommended_per_class - count)
            if needed > 0:
                print(f"  {label}: 需要增加 {needed} 条")
    
    def text_quality_analysis(self):
        """文本质量分析"""
        print("\n📝 文本质量分析")
        print("=" * 60)
        
        # 合并主题和正文
        self.df['full_text'] = (
            self.df['subject'].fillna('').astype(str) + ' ' + 
            self.df['body'].fillna('').astype(str)
        ).str.strip()
        
        # 词汇丰富度分析
        all_text = ' '.join(self.df['full_text']).lower()
        words = re.findall(r'\b\w+\b', all_text)
        unique_words = set(words)
        
        print(f"词汇统计:")
        print(f"  总词数: {len(words):,}")
        print(f"  唯一词数: {len(unique_words):,}")
        print(f"  词汇丰富度: {len(unique_words)/len(words):.3f}")
        
        # 最常见词汇
        word_freq = Counter(words)
        print(f"\n🔝 最常见词汇 (前10个):")
        for word, freq in word_freq.most_common(10):
            if len(word) > 2:  # 过滤短词
                print(f"  {word}: {freq} 次")
        
        # 每个类别的特征词
        print(f"\n🏷️  各类别特征词分析:")
        for label in self.df['label'].unique():
            label_texts = self.df[self.df['label'] == label]['full_text']
            label_text = ' '.join(label_texts).lower()
            label_words = re.findall(r'\b\w+\b', label_text)
            label_freq = Counter(label_words)
            
            print(f"\n{label}:")
            # 找出该类别中频次高但在其他类别中少见的词
            top_words = []
            for word, freq in label_freq.most_common(20):
                if len(word) > 3 and freq >= 2:
                    top_words.append(word)
            
            print(f"  特征词: {', '.join(top_words[:8])}")
    
    def similarity_analysis(self):
        """文本相似度分析"""
        print("\n🔍 文本相似度分析")
        print("=" * 60)
        
        # 使用TF-IDF计算文本相似度
        try:
            vectorizer = TfidfVectorizer(max_features=500, stop_words='english', ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(self.df['full_text'])
            
            # 计算相似度矩阵
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # 找出高相似度的邮件对
            high_similarity_pairs = []
            threshold = 0.7  # 相似度阈值
            
            for i in range(len(self.df)):
                for j in range(i + 1, len(self.df)):
                    if similarity_matrix[i][j] > threshold:
                        high_similarity_pairs.append({
                            'index1': i,
                            'index2': j,
                            'similarity': similarity_matrix[i][j],
                            'label1': self.df.iloc[i]['label'],
                            'label2': self.df.iloc[j]['label'],
                            'subject1': self.df.iloc[i]['subject'][:30],
                            'subject2': self.df.iloc[j]['subject'][:30]
                        })
            
            if high_similarity_pairs:
                print(f"🔎 发现 {len(high_similarity_pairs)} 对高相似度邮件 (相似度 > {threshold}):")
                for pair in high_similarity_pairs[:10]:  # 只显示前10对
                    print(f"  相似度: {pair['similarity']:.3f}")
                    print(f"    [{pair['label1']}] {pair['subject1']}...")
                    print(f"    [{pair['label2']}] {pair['subject2']}...")
                    if pair['label1'] != pair['label2']:
                        print(f"    ⚠️  标签不一致!")
                    print()
            else:
                print(f"✅ 未发现高相似度邮件对")
            
            # 类内相似度统计
            print(f"📊 各类别内部相似度:")
            for label in self.df['label'].unique():
                label_indices = self.df[self.df['label'] == label].index
                if len(label_indices) > 1:
                    label_similarities = []
                    for i in range(len(label_indices)):
                        for j in range(i + 1, len(label_indices)):
                            idx1, idx2 = label_indices[i], label_indices[j]
                            label_similarities.append(similarity_matrix[idx1][idx2])
                    
                    if label_similarities:
                        avg_similarity = np.mean(label_similarities)
                        print(f"  {label}: {avg_similarity:.3f}")
            
        except Exception as e:
            print(f"❌ 相似度分析失败: {e}")
    
    def cross_validation_preview(self):
        """交叉验证预览"""
        print("\n🎯 模型性能预测")
        print("=" * 60)
        
        try:
            from sklearn.model_selection import cross_val_score, StratifiedKFold
            from sklearn.linear_model import LogisticRegression
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.pipeline import Pipeline
            
            # 准备数据
            X = self.df['full_text']
            y = self.df['label']
            
            # 检查是否有足够的数据进行交叉验证
            min_class_count = y.value_counts().min()
            if min_class_count < 2:
                print(f"⚠️  某些类别样本数过少 (最少: {min_class_count}), 无法进行可靠的交叉验证")
                print("建议每个类别至少有5个样本")
                return
            
            # 创建pipeline
            pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(max_features=1000, stop_words='english', ngram_range=(1, 2))),
                ('classifier', LogisticRegression(max_iter=1000, random_state=42))
            ])
            
            # 交叉验证
            cv_folds = min(5, min_class_count)  # 确保fold数不超过最小类别样本数
            cv_scores = cross_val_score(
                pipeline, X, y, 
                cv=StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42),
                scoring='accuracy'
            )
            
            print(f"📊 {cv_folds}折交叉验证结果:")
            print(f"  平均准确率: {cv_scores.mean():.3f} (±{cv_scores.std()*2:.3f})")
            print(f"  各折得分: {[f'{score:.3f}' for score in cv_scores]}")
            
            # 性能评估
            if cv_scores.mean() > 0.85:
                print(f"  ✅ 模型性能优秀")
            elif cv_scores.mean() > 0.75:
                print(f"  ✅ 模型性能良好")
            elif cv_scores.mean() > 0.65:
                print(f"  ⚠️  模型性能一般，建议增加更多训练数据")
            else:
                print(f"  ❌ 模型性能较差，需要大量改进训练数据")
            
        except ImportError:
            print("❌ 缺少scikit-learn库，无法进行模型评估")
        except Exception as e:
            print(f"❌ 模型评估失败: {e}")
    
    def generate_improvement_suggestions(self):
        """生成改进建议"""
        print("\n💡 数据改进建议")
        print("=" * 60)
        
        suggestions = []
        
        # 检查数据量
        total_samples = len(self.df)
        if total_samples < 200:
            suggestions.append(f"📈 增加总体数据量 (当前: {total_samples}, 建议: 200+)")
        
        # 检查类别平衡
        label_counts = self.df['label'].value_counts()
        min_samples = label_counts.min()
        max_samples = label_counts.max()
        
        if min_samples < 30:
            suggestions.append(f"⚖️  增加少数类别样本 (最少类别仅有 {min_samples} 个样本)")
        
        if max_samples / min_samples > 3:
            suggestions.append(f"⚖️  平衡各类别数据分布 (比例差异: {max_samples/min_samples:.1f}:1)")
        
        # 检查文本质量
        short_texts = (self.df['text_length'] < 20).sum()
        if short_texts > 0:
            suggestions.append(f"📝 改进短文本质量 ({short_texts} 条邮件过短)")
        
        # 检查重复数据
        duplicates = self.df.duplicated(['subject', 'body']).sum()
        if duplicates > 0:
            suggestions.append(f"🗑️  删除重复邮件 ({duplicates} 条)")
        
        # 输出建议
        if suggestions:
            print("优先改进项:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"  {i}. {suggestion}")
        else:
            print("✅ 数据质量良好，无明显改进需求")
        
        # 具体行动建议
        print(f"\n🎯 具体行动建议:")
        print(f"  1. 使用 expand_training_data.py 手动添加更多样本")
        print(f"  2. 使用 gmail_importer.py 从真实邮件导入")
        print(f"  3. 使用 email_annotator.py 重新检查和修正标签")
        print(f"  4. 收集更多真实的求职邮件进行标注")
    
    def export_quality_report(self):
        """导出质量报告"""
        print("\n📄 导出数据质量报告")
        print("=" * 60)
        
        try:
            report = {
                'timestamp': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S'),
                'total_samples': len(self.df),
                'unique_labels': self.df['label'].nunique(),
                'label_distribution': self.df['label'].value_counts().to_dict(),
                'duplicates': self.df.duplicated(['subject', 'body']).sum(),
                'missing_values': self.df.isnull().sum().to_dict(),
                'text_length_stats': {
                    'mean': float(self.df['text_length'].mean()),
                    'median': float(self.df['text_length'].median()),
                    'min': int(self.df['text_length'].min()),
                    'max': int(self.df['text_length'].max())
                }
            }
            
            import json
            with open('data_quality_report.json', 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            print(f"✅ 质量报告已保存到: data_quality_report.json")
            
        except Exception as e:
            print(f"❌ 导出报告失败: {e}")
    
    def main_menu(self):
        """主菜单"""
        while True:
            print(f"\n🔍 训练数据质量检查工具")
            print("=" * 60)
            print(f"当前数据: {len(self.df)} 条邮件")
            
            print(f"\n请选择分析类型:")
            print("  1. 基础统计分析")
            print("  2. 标签分布分析")
            print("  3. 文本质量分析")
            print("  4. 相似度分析")
            print("  5. 模型性能预测")
            print("  6. 生成改进建议")
            print("  7. 导出质量报告")
            print("  8. 完整分析报告")
            print("  9. 重新加载数据")
            print("  0. 退出")
            
            choice = input(f"\n请输入选项 (0-9): ").strip()
            
            if choice == '1':
                self.basic_statistics()
            elif choice == '2':
                self.label_distribution_analysis()
            elif choice == '3':
                self.text_quality_analysis()
            elif choice == '4':
                self.similarity_analysis()
            elif choice == '5':
                self.cross_validation_preview()
            elif choice == '6':
                self.generate_improvement_suggestions()
            elif choice == '7':
                self.export_quality_report()
            elif choice == '8':
                # 完整分析
                print(f"\n🔍 执行完整数据质量分析...")
                self.basic_statistics()
                self.label_distribution_analysis()
                self.text_quality_analysis()
                self.similarity_analysis()
                self.cross_validation_preview()
                self.generate_improvement_suggestions()
            elif choice == '9':
                self.load_data()
            elif choice == '0':
                print("👋 再见!")
                break
            else:
                print("❌ 无效选项!")

def main():
    """主程序"""
    checker = DataQualityChecker()
    checker.main_menu()

if __name__ == '__main__':
    main()