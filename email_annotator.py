#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮件标注工具
用于标注未分类的邮件或重新标注现有邮件
"""

import pandas as pd
import os
import random
from datetime import datetime

# 可用标签
LABELS = [
    "Applied",              # 申请确认
    "Response Needed",      # 需要回复
    "Interview Scheduled",  # 面试安排
    "Rejected",            # 被拒绝
    "Offer",               # 录用通知
    "Job Alert",           # 职位提醒
    "Status Update",       # 状态更新
    "Recruiter Outreach"   # 猎头联系
]

class EmailAnnotator:
    def __init__(self):
        self.df = None
        self.load_data()
    
    def load_data(self):
        """加载邮件数据"""
        try:
            self.df = pd.read_csv('emails.csv')
            print(f"✅ 已加载 {len(self.df)} 条邮件数据")
        except FileNotFoundError:
            print("❌ 未找到 emails.csv 文件!")
            exit(1)
        except Exception as e:
            print(f"❌ 加载数据失败: {e}")
            exit(1)
    
    def show_labels(self):
        """显示可用标签"""
        print("\n📋 可用标签:")
        for i, label in enumerate(LABELS, 1):
            print(f"  {i}. {label}")
        print("  0. 删除该邮件")
        print()
    
    def display_email(self, index):
        """显示邮件内容"""
        row = self.df.iloc[index]
        print(f"\n📧 邮件 #{index + 1}")
        print("=" * 60)
        print(f"主题: {row['subject']}")
        print(f"正文: {row['body']}")
        print(f"当前标签: {row.get('label', 'Unknown')}")
        print("=" * 60)
    
    def annotate_single(self, index):
        """标注单个邮件"""
        self.display_email(index)
        self.show_labels()
        
        while True:
            try:
                choice = input("🏷️  选择新标签 (输入数字): ").strip()
                
                if choice == '':
                    return False  # 跳过
                
                choice_num = int(choice)
                
                if choice_num == 0:
                    # 删除邮件
                    confirm = input("❌ 确认删除此邮件? (y/N): ").lower()
                    if confirm in ['y', 'yes']:
                        self.df = self.df.drop(index).reset_index(drop=True)
                        print("✅ 已删除邮件")
                        return True
                    else:
                        return False
                
                elif 1 <= choice_num <= len(LABELS):
                    new_label = LABELS[choice_num - 1]
                    old_label = self.df.iloc[index]['label']
                    
                    self.df.iloc[index, self.df.columns.get_loc('label')] = new_label
                    print(f"✅ 标签已更新: {old_label} → {new_label}")
                    return True
                
                else:
                    print(f"❌ 请输入 0-{len(LABELS)} 之间的数字!")
                    
            except ValueError:
                print("❌ 请输入有效数字!")
    
    def batch_annotate(self):
        """批量标注邮件"""
        print(f"\n📦 批量标注模式")
        print("=" * 50)
        
        # 选择标注范围
        print("选择标注范围:")
        print("  1. 标注所有邮件")
        print("  2. 标注特定标签的邮件")
        print("  3. 随机标注N个邮件")
        print("  4. 标注指定范围的邮件")
        
        choice = input("请选择 (1-4): ").strip()
        
        if choice == '1':
            indices = list(range(len(self.df)))
        elif choice == '2':
            self.show_current_distribution()
            filter_label = input("输入要重新标注的标签: ").strip()
            indices = self.df[self.df['label'] == filter_label].index.tolist()
            if not indices:
                print(f"❌ 没有找到标签为 '{filter_label}' 的邮件")
                return
        elif choice == '3':
            try:
                n = int(input("随机标注多少个邮件: "))
                indices = random.sample(range(len(self.df)), min(n, len(self.df)))
            except ValueError:
                print("❌ 请输入有效数字!")
                return
        elif choice == '4':
            try:
                start = int(input("起始位置 (从1开始): ")) - 1
                end = int(input("结束位置: "))
                indices = list(range(max(0, start), min(end, len(self.df))))
            except ValueError:
                print("❌ 请输入有效数字!")
                return
        else:
            print("❌ 无效选择!")
            return
        
        if not indices:
            print("❌ 没有找到要标注的邮件")
            return
        
        print(f"\n准备标注 {len(indices)} 个邮件")
        confirm = input("继续? (y/N): ").lower()
        if confirm not in ['y', 'yes']:
            return
        
        # 开始批量标注
        annotated = 0
        for i, index in enumerate(indices):
            print(f"\n进度: {i + 1}/{len(indices)}")
            
            if self.annotate_single(index):
                annotated += 1
            
            # 每10个邮件询问是否继续
            if (i + 1) % 10 == 0:
                continue_choice = input(f"\n已处理 {i + 1} 个邮件，继续? (y/N/s=保存并退出): ").lower()
                if continue_choice == 's':
                    self.save_data()
                    break
                elif continue_choice not in ['y', 'yes']:
                    break
        
        print(f"\n🎉 批量标注完成! 共处理 {annotated} 个邮件")
    
    def review_annotations(self):
        """检查标注质量"""
        print(f"\n🔍 标注质量检查")
        print("=" * 50)
        
        # 显示当前分布
        self.show_current_distribution()
        
        # 查找可能的问题
        issues = []
        
        # 检查空值
        null_subjects = self.df['subject'].isnull().sum()
        null_bodies = self.df['body'].isnull().sum()
        if null_subjects > 0 or null_bodies > 0:
            issues.append(f"发现 {null_subjects} 个空主题, {null_bodies} 个空正文")
        
        # 检查重复
        duplicates = self.df.duplicated(['subject', 'body']).sum()
        if duplicates > 0:
            issues.append(f"发现 {duplicates} 个重复邮件")
        
        # 检查文本长度
        short_texts = ((self.df['subject'].str.len() + self.df['body'].str.len()) < 20).sum()
        if short_texts > 0:
            issues.append(f"发现 {short_texts} 个过短文本 (<20字符)")
        
        if issues:
            print(f"\n⚠️  发现的问题:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print(f"\n✅ 未发现明显问题")
        
        # 显示每个类别的样例
        print(f"\n📋 各类别样例:")
        for label in self.df['label'].unique():
            samples = self.df[self.df['label'] == label].sample(min(2, len(self.df[self.df['label'] == label])))
            print(f"\n{label}:")
            for _, row in samples.iterrows():
                print(f"  - {row['subject'][:50]}...")
    
    def show_current_distribution(self):
        """显示当前标签分布"""
        distribution = self.df['label'].value_counts()
        total = len(self.df)
        
        print(f"\n📊 当前标签分布 (总计: {total}):")
        for label, count in distribution.items():
            percentage = (count / total) * 100
            print(f"  {label}: {count} 条 ({percentage:.1f}%)")
    
    def find_similar_emails(self):
        """查找相似邮件"""
        print(f"\n🔍 查找相似邮件")
        print("=" * 50)
        
        # 简单的相似度检测（基于关键词）
        similar_groups = {}
        
        for i, row in self.df.iterrows():
            text = f"{row['subject']} {row['body']}".lower()
            words = set(text.split())
            
            # 查找与现有组的相似度
            best_group = None
            best_similarity = 0
            
            for group_key, group_indices in similar_groups.items():
                group_text = f"{self.df.iloc[group_indices[0]]['subject']} {self.df.iloc[group_indices[0]]['body']}".lower()
                group_words = set(group_text.split())
                
                if len(words) > 0 and len(group_words) > 0:
                    similarity = len(words & group_words) / len(words | group_words)
                    if similarity > best_similarity and similarity > 0.3:  # 30% 相似度阈值
                        best_similarity = similarity
                        best_group = group_key
            
            if best_group:
                similar_groups[best_group].append(i)
            else:
                similar_groups[len(similar_groups)] = [i]
        
        # 显示相似邮件组
        for group_key, indices in similar_groups.items():
            if len(indices) > 1:
                print(f"\n📎 相似组 {group_key + 1} ({len(indices)} 个邮件):")
                for idx in indices:
                    row = self.df.iloc[idx]
                    print(f"  [{row['label']}] {row['subject'][:40]}...")
    
    def save_data(self):
        """保存数据"""
        try:
            # 备份原文件
            if os.path.exists('emails.csv'):
                backup_name = f"emails_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                os.rename('emails.csv', backup_name)
                print(f"📂 原文件已备份为: {backup_name}")
            
            # 保存新数据
            self.df.to_csv('emails.csv', index=False)
            print(f"✅ 数据已保存到 emails.csv ({len(self.df)} 条记录)")
            
        except Exception as e:
            print(f"❌ 保存失败: {e}")
    
    def main_menu(self):
        """主菜单"""
        while True:
            print(f"\n🏷️  邮件标注工具")
            print("=" * 50)
            print(f"当前数据: {len(self.df)} 条邮件")
            
            print(f"\n请选择操作:")
            print("  1. 批量标注邮件")
            print("  2. 查看标签分布")
            print("  3. 检查标注质量")
            print("  4. 查找相似邮件")
            print("  5. 保存数据")
            print("  6. 重新加载数据")
            print("  7. 退出")
            
            choice = input(f"\n请输入选项 (1-7): ").strip()
            
            if choice == '1':
                self.batch_annotate()
            elif choice == '2':
                self.show_current_distribution()
            elif choice == '3':
                self.review_annotations()
            elif choice == '4':
                self.find_similar_emails()
            elif choice == '5':
                self.save_data()
            elif choice == '6':
                self.load_data()
            elif choice == '7':
                # 询问是否保存
                save = input("退出前保存数据? (y/N): ").lower()
                if save in ['y', 'yes']:
                    self.save_data()
                print("👋 再见!")
                break
            else:
                print("❌ 无效选项!")

def main():
    """主程序"""
    annotator = EmailAnnotator()
    annotator.main_menu()

if __name__ == '__main__':
    main()