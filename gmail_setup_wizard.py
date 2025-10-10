#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gmail API 设置向导
自动打开必要的网页并提供详细设置指南
"""

import webbrowser
import os
import sys
import time

def open_setup_pages():
    """打开Gmail API设置所需的网页"""
    print("🔧 Gmail API 设置向导")
    print("=" * 50)
    print("正在为您打开Google Cloud Console...")
    
    # 打开Google Cloud Console
    console_url = "https://console.developers.google.com/"
    print(f"\n📂 正在打开: {console_url}")
    webbrowser.open(console_url)
    
    time.sleep(2)
    
    # 打开Gmail API页面
    gmail_api_url = "https://console.developers.google.com/apis/library/gmail.googleapis.com"
    print(f"📧 正在打开Gmail API页面: {gmail_api_url}")
    webbrowser.open(gmail_api_url)
    
    print("\n✅ 网页已在浏览器中打开！")

def show_detailed_steps():
    """显示详细设置步骤"""
    print("\n📋 详细设置步骤:")
    print("=" * 50)
    
    steps = [
        {
            "title": "1. 创建Google Cloud项目",
            "details": [
                "• 在Google Cloud Console页面点击项目下拉菜单",
                "• 点击 'New Project' 创建新项目",
                "• 项目名称输入: 'JobTrack-Gmail-Import'",
                "• 点击 'CREATE' 创建项目"
            ]
        },
        {
            "title": "2. 启用Gmail API",
            "details": [
                "• 确保选择了刚创建的项目",
                "• 在Gmail API页面点击 'ENABLE' 按钮",
                "• 等待API启用完成"
            ]
        },
        {
            "title": "3. 创建OAuth凭据",
            "details": [
                "• 转到 APIs & Services > Credentials",
                "• 点击 'CREATE CREDENTIALS' > 'OAuth client ID'",
                "• 如果出现同意屏幕配置提示，先配置同意屏幕:",
                "  - User Type: External",
                "  - App name: JobTrack Email Importer",
                "  - User support email: 你的邮箱",
                "  - Developer contact: 你的邮箱",
                "  - 其他可以留空，保存并继续",
                "• 返回创建OAuth client ID:",
                "  - Application type: Desktop application",
                "  - Name: JobTrack Desktop Client",
                "• 点击 'CREATE'"
            ]
        },
        {
            "title": "4. 下载凭据文件",
            "details": [
                "• 在弹出的对话框中点击 'DOWNLOAD JSON'",
                "• 将下载的文件重命名为 'credentials.json'",
                f"• 将文件放在此目录: {os.getcwd()}",
                "• 确保文件路径为: ./credentials.json"
            ]
        }
    ]
    
    for step in steps:
        print(f"\n🔸 {step['title']}")
        for detail in step['details']:
            print(f"  {detail}")
    
    print(f"\n⚠️  重要提示:")
    print(f"• 确保使用你有权限访问的Gmail账户")
    print(f"• OAuth同意屏幕可能需要Google验证，这是正常的")
    print(f"• 测试用户可以添加你自己的邮箱地址")

def check_credentials():
    """检查凭据文件是否存在"""
    creds_file = "credentials.json"
    
    if os.path.exists(creds_file):
        print(f"\n✅ 发现凭据文件: {creds_file}")
        
        # 检查文件内容
        try:
            import json
            with open(creds_file, 'r') as f:
                creds_data = json.load(f)
            
            if 'installed' in creds_data:
                client_id = creds_data['installed'].get('client_id', '')
                print(f"📋 客户端ID: {client_id[:20]}...")
                print(f"✅ 凭据文件格式正确！")
                return True
            else:
                print(f"❌ 凭据文件格式不正确")
                print(f"请确保下载的是 'Desktop application' 类型的凭据")
                return False
        except Exception as e:
            print(f"❌ 读取凭据文件失败: {e}")
            return False
    else:
        print(f"\n❌ 未找到凭据文件: {creds_file}")
        print(f"请完成上述步骤下载凭据文件")
        return False

def test_api_connection():
    """测试Gmail API连接"""
    print(f"\n🔄 测试Gmail API连接...")
    
    try:
        # 运行Gmail导入工具进行测试
        import subprocess
        result = subprocess.run(
            [sys.executable, 'gmail_importer.py'],
            input='3\n',  # 选择测试API连接
            text=True,
            capture_output=True,
            timeout=30
        )
        
        if 'Gmail API 认证成功' in result.stdout:
            print(f"✅ Gmail API连接成功！")
            return True
        else:
            print(f"❌ Gmail API连接失败")
            print(f"输出: {result.stdout}")
            if result.stderr:
                print(f"错误: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ 测试连接时出错: {e}")
        return False

def main():
    """主程序"""
    print("🚀 Gmail API 自动设置向导")
    print("=" * 60)
    
    # 步骤1: 打开设置页面
    choice = input("是否打开Google Cloud Console设置页面? (y/N): ").lower()
    if choice in ['y', 'yes']:
        open_setup_pages()
    
    # 步骤2: 显示详细步骤
    print("\n" + "="*60)
    show_detailed_steps()
    
    # 等待用户完成设置
    print("\n" + "="*60)
    input("⏳ 请完成上述步骤后按回车继续...")
    
    # 步骤3: 检查凭据文件
    print("\n🔍 检查凭据文件...")
    if not check_credentials():
        print("\n❌ 请先完成凭据文件下载")
        return
    
    # 步骤4: 测试API连接
    if test_api_connection():
        print(f"\n🎉 Gmail API设置完成！")
        print(f"现在可以运行: python gmail_importer.py")
    else:
        print(f"\n⚠️  API连接测试失败，请检查设置")

if __name__ == '__main__':
    main()