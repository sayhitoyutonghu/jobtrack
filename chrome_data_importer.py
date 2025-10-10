#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chrome扩展数据导入工具
用于导入Chrome扩展导出的Gmail训练数据
"""

import pandas as pd
import json
import os
from datetime import datetime

class ChromeExtensionDataImporter:
    def __init__(self):
        self.supported_versions = ["1.0.0"]
        self.label_mapping = {
            # Chrome扩展的标签 -> Python训练数据的标签
            "Applied": "Applied",
            "Interview": "Interview Scheduled", 
            "Rejected": "Rejected",
            "Offer": "Offer",
            "JobAlert": "Job Alert",
            "Recruiter": "Recruiter Outreach",
            "StatusUpdate": "Status Update"
        }
    
    def import_from_json(self, json_file_path):
        """从Chrome扩展导出的JSON文件导入数据"""
        try:
            print(f"📥 导入Chrome扩展数据: {json_file_path}")
            
            # 读取JSON文件
            with open(json_file_path, 'r', encoding='utf-8') as f:
                extension_data = json.load(f)
            
            # 验证数据格式
            if not self.validate_extension_data(extension_data):
                return False
            
            # 解析邮件数据
            emails = extension_data.get('emails', [])
            print(f"📧 找到 {len(emails)} 封已分类邮件")
            
            if not emails:
                print("❌ 没有找到邮件数据")
                return False
            
            # 显示数据概览
            self.show_data_overview(emails)
            
            # 确认导入
            confirm = input(f"\n确认导入这些数据到训练集? (y/N): ").lower()
            if confirm not in ['y', 'yes']:
                print("❌ 已取消导入")
                return False
            
            # 执行导入
            success_count = self.add_to_training_data(emails)
            
            print(f"\n✅ 成功导入 {success_count} 条数据到训练集！")
            
            # 显示更新后的统计
            self.show_training_data_stats()
            
            return True
            
        except FileNotFoundError:
            print(f"❌ 文件不存在: {json_file_path}")
            return False
        except json.JSONDecodeError as e:
            print(f"❌ JSON格式错误: {e}")
            return False
        except Exception as e:
            print(f"❌ 导入失败: {e}")
            return False
    
    def validate_extension_data(self, data):
        """验证Chrome扩展数据格式"""
        required_fields = ['emails', 'timestamp', 'version', 'source']
        
        for field in required_fields:
            if field not in data:
                print(f"❌ 缺少必要字段: {field}")
                return False
        
        # 检查版本兼容性
        version = data.get('version')
        if version not in self.supported_versions:
            print(f"⚠️  版本 {version} 可能不兼容，支持的版本: {self.supported_versions}")
        
        # 检查数据来源
        source = data.get('source')
        if source != 'chrome_extension':
            print(f"⚠️  数据来源: {source}")
        
        print(f"✅ 数据格式验证通过")
        print(f"   版本: {version}")
        print(f"   来源: {source}")
        print(f"   时间: {data.get('timestamp')}")
        
        return True
    
    def show_data_overview(self, emails):
        """显示数据概览"""
        print(f"\n📊 数据概览:")
        
        # 统计各分类数量
        label_counts = {}
        for email in emails:
            label = email.get('label', 'Unknown')
            label_counts[label] = label_counts.get(label, 0) + 1
        
        print(f"分类分布:")
        for label, count in label_counts.items():
            mapped_label = self.label_mapping.get(label, label)
            print(f"  {label} -> {mapped_label}: {count} 条")
        
        # 显示几个示例
        print(f"\n📝 数据示例:")
        for i, email in enumerate(emails[:3], 1):
            subject = email.get('subject', 'No Subject')[:40]
            label = email.get('label', 'Unknown')
            print(f"  {i}. [{label}] {subject}...")
    
    def add_to_training_data(self, emails):
        """添加到训练数据"""
        try:
            # 加载现有训练数据
            try:
                df = pd.read_csv('emails.csv')
                print(f"📊 当前训练数据: {len(df)} 条")
            except FileNotFoundError:
                df = pd.DataFrame(columns=['subject', 'body', 'label'])
                print(f"📊 创建新的训练数据文件")
            
            # 准备新数据
            new_rows = []
            for email in emails:
                # 映射标签
                original_label = email.get('label', 'Unknown')
                mapped_label = self.label_mapping.get(original_label, original_label)
                
                new_row = {
                    'subject': email.get('subject', ''),
                    'body': email.get('body', ''),
                    'label': mapped_label
                }
                new_rows.append(new_row)
            
            # 添加新数据
            if new_rows:
                new_df = pd.DataFrame(new_rows)
                df = pd.concat([df, new_df], ignore_index=True)
                
                # 保存
                df.to_csv('emails.csv', index=False)
                
                return len(new_rows)
            
            return 0
            
        except Exception as e:
            print(f"❌ 添加数据失败: {e}")
            return 0
    
    def show_training_data_stats(self):
        """显示训练数据统计"""
        try:
            df = pd.read_csv('emails.csv')
            
            print(f"\n📈 更新后的训练数据统计:")
            print(f"总数据量: {len(df)} 条")
            
            # 显示分布
            label_counts = df['label'].value_counts()
            print(f"\n分类分布:")
            for label, count in label_counts.items():
                percentage = (count / len(df)) * 100
                print(f"  {label}: {count} 条 ({percentage:.1f}%)")
                
        except Exception as e:
            print(f"❌ 获取统计信息失败: {e}")
    
    def import_from_clipboard(self):
        """从剪贴板导入JSON数据"""
        try:
            import pyperclip
            
            print(f"📋 从剪贴板导入数据...")
            clipboard_content = pyperclip.paste()
            
            if not clipboard_content.strip():
                print("❌ 剪贴板为空")
                return False
            
            # 解析JSON
            extension_data = json.loads(clipboard_content)
            
            # 临时保存到文件
            temp_file = f"temp_extension_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(extension_data, f, indent=2, ensure_ascii=False)
            
            print(f"📁 临时保存到: {temp_file}")
            
            # 导入数据
            result = self.import_from_json(temp_file)
            
            # 清理临时文件
            if os.path.exists(temp_file):
                os.remove(temp_file)
                print(f"🗑️  已清理临时文件")
            
            return result
            
        except ImportError:
            print("❌ 需要安装pyperclip: pip install pyperclip")
            return False
        except json.JSONDecodeError:
            print("❌ 剪贴板内容不是有效的JSON格式")
            return False
        except Exception as e:
            print(f"❌ 从剪贴板导入失败: {e}")
            return False
    
    def batch_import_directory(self, directory_path):
        """批量导入目录中的所有JSON文件"""
        try:
            if not os.path.exists(directory_path):
                print(f"❌ 目录不存在: {directory_path}")
                return False
            
            # 查找JSON文件
            json_files = []
            for file in os.listdir(directory_path):
                if file.endswith('.json') and 'jobtrack' in file.lower():
                    json_files.append(os.path.join(directory_path, file))
            
            if not json_files:
                print(f"❌ 在目录 {directory_path} 中未找到JobTrack JSON文件")
                return False
            
            print(f"📁 找到 {len(json_files)} 个JSON文件:")
            for file in json_files:
                print(f"  • {os.path.basename(file)}")
            
            # 批量导入
            total_imported = 0
            for json_file in json_files:
                print(f"\n处理文件: {os.path.basename(json_file)}")
                if self.import_from_json(json_file):
                    total_imported += 1
            
            print(f"\n🎉 批量导入完成! 成功处理 {total_imported}/{len(json_files)} 个文件")
            
            return total_imported > 0
            
        except Exception as e:
            print(f"❌ 批量导入失败: {e}")
            return False

def main():
    """主程序"""
    importer = ChromeExtensionDataImporter()
    
    while True:
        print(f"\n📥 Chrome扩展数据导入工具")
        print("=" * 50)
        print("请选择导入方式:")
        print("1. 从JSON文件导入")
        print("2. 从剪贴板导入") 
        print("3. 批量导入目录")
        print("4. 查看当前训练数据统计")
        print("5. 退出")
        
        choice = input(f"\n请选择 (1-5): ").strip()
        
        if choice == '1':
            file_path = input("请输入JSON文件路径: ").strip()
            importer.import_from_json(file_path)
            
        elif choice == '2':
            importer.import_from_clipboard()
            
        elif choice == '3':
            directory = input("请输入目录路径 (默认: ~/Downloads): ").strip()
            if not directory:
                directory = os.path.expanduser("~/Downloads")
            importer.batch_import_directory(directory)
            
        elif choice == '4':
            importer.show_training_data_stats()
            
        elif choice == '5':
            print("👋 再见!")
            break
            
        else:
            print("❌ 无效选项!")

if __name__ == '__main__':
    main()