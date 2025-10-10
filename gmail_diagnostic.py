#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gmail API 错误诊断和修复工具
"""

import os
import json
import sys

def diagnose_oauth_error():
    """诊断OAuth配置错误"""
    print("🔍 Gmail API 错误诊断工具")
    print("=" * 50)
    
    # 检查凭据文件
    creds_file = "credentials.json"
    
    if not os.path.exists(creds_file):
        print(f"❌ 错误1: 未找到 {creds_file} 文件")
        print(f"解决方案:")
        print(f"  1. 确保从Google Cloud Console下载了凭据文件")
        print(f"  2. 将文件重命名为 'credentials.json'")
        print(f"  3. 将文件放在当前目录: {os.getcwd()}")
        return False
    
    try:
        with open(creds_file, 'r', encoding='utf-8') as f:
            creds_data = json.load(f)
        
        print(f"✅ 凭据文件存在且格式有效")
        
        # 检查文件结构
        if 'installed' not in creds_data:
            print(f"❌ 错误2: 凭据文件结构不正确")
            print(f"当前结构: {list(creds_data.keys())}")
            print(f"解决方案:")
            print(f"  1. 确保选择了 'Desktop application' 类型")
            print(f"  2. 重新下载凭据文件")
            print(f"  3. 不要选择 'Web application' 或其他类型")
            return False
        
        installed = creds_data['installed']
        required_fields = ['client_id', 'client_secret', 'auth_uri', 'token_uri']
        
        missing_fields = [field for field in required_fields if field not in installed]
        if missing_fields:
            print(f"❌ 错误3: 缺少必要字段: {missing_fields}")
            print(f"解决方案: 重新下载完整的凭据文件")
            return False
        
        # 检查重定向URI
        redirect_uris = installed.get('redirect_uris', [])
        if not redirect_uris or 'http://localhost' not in str(redirect_uris):
            print(f"⚠️  警告: 重定向URI可能有问题")
            print(f"当前重定向URI: {redirect_uris}")
            print(f"建议: Desktop应用通常使用 http://localhost")
        
        print(f"\n📋 凭据信息:")
        print(f"  客户端ID: {installed['client_id'][:20]}...")
        print(f"  认证URI: {installed['auth_uri']}")
        print(f"  令牌URI: {installed['token_uri']}")
        print(f"  重定向URI: {redirect_uris}")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ 错误4: JSON格式错误: {e}")
        print(f"解决方案: 重新下载凭据文件，确保文件完整")
        return False
    except Exception as e:
        print(f"❌ 错误5: 读取文件失败: {e}")
        return False

def check_oauth_consent_screen():
    """检查OAuth同意屏幕配置"""
    print(f"\n🔒 OAuth同意屏幕检查")
    print("=" * 30)
    
    print("请确认以下配置是否正确:")
    print()
    
    config_items = [
        ("User Type", "External", "允许任何Google账户使用"),
        ("App name", "JobTrack Email Importer", "应用显示名称"),
        ("User support email", "你的Gmail地址", "用于用户支持"),
        ("Developer contact", "你的Gmail地址", "开发者联系方式"),
        ("Authorized domains", "留空", "Desktop应用不需要"),
        ("Scopes", "../auth/gmail.readonly", "只读Gmail权限"),
        ("Test users", "你的Gmail地址", "测试期间可以使用的用户")
    ]
    
    for item, value, description in config_items:
        print(f"📝 {item}: {value}")
        print(f"   说明: {description}")
        print()

def provide_step_by_step_fix():
    """提供分步修复指南"""
    print(f"\n🔧 分步修复指南")
    print("=" * 30)
    
    steps = [
        {
            "step": "1. 重新检查项目设置",
            "actions": [
                "访问 https://console.developers.google.com/",
                "确认选择了正确的项目",
                "确认Gmail API已启用（显示绿色勾号）"
            ]
        },
        {
            "step": "2. 重新配置OAuth同意屏幕",
            "actions": [
                "转到 APIs & Services > OAuth consent screen",
                "User Type: 选择 'External'",
                "填写必要的应用信息（见上面的配置清单）",
                "在Scopes部分添加 '../auth/gmail.readonly'",
                "在Test users部分添加你的Gmail地址",
                "保存并继续"
            ]
        },
        {
            "step": "3. 重新创建凭据",
            "actions": [
                "转到 APIs & Services > Credentials", 
                "删除旧的OAuth client ID（如果存在）",
                "点击 'CREATE CREDENTIALS' > 'OAuth client ID'",
                "Application type: 选择 'Desktop application'",
                "Name: 输入 'JobTrack Desktop Client'",
                "点击 'CREATE'",
                "下载JSON文件并重命名为 'credentials.json'"
            ]
        },
        {
            "step": "4. 验证文件位置",
            "actions": [
                f"确保 credentials.json 在目录: {os.getcwd()}",
                "文件内容应包含 'installed' 字段",
                "运行诊断工具验证配置"
            ]
        }
    ]
    
    for step_info in steps:
        print(f"\n🔹 {step_info['step']}")
        for action in step_info['actions']:
            print(f"  • {action}")

def test_minimal_auth():
    """测试最小化认证流程"""
    print(f"\n🧪 测试最小化认证")
    print("=" * 30)
    
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        
        SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
        
        # 尝试创建流程
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
        
        print(f"✅ 成功创建认证流程")
        print(f"认证URI: {flow.client_config['auth_uri']}")
        
        # 不实际运行认证，只验证配置
        print(f"🔄 配置验证通过，可以尝试完整认证流程")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ credentials.json 文件不存在")
        return False
    except Exception as e:
        print(f"❌ 认证配置错误: {e}")
        return False

def main():
    """主程序"""
    print("🩺 Gmail API 诊断工具")
    print("=" * 60)
    
    # 步骤1: 诊断凭据文件
    if not diagnose_oauth_error():
        provide_step_by_step_fix()
        return
    
    # 步骤2: 检查OAuth配置
    check_oauth_consent_screen()
    
    # 步骤3: 测试认证流程
    if test_minimal_auth():
        print(f"\n🎉 诊断完成！配置看起来正确")
        print(f"现在可以尝试运行: python gmail_importer.py")
    else:
        print(f"\n⚠️  仍有配置问题，请按照修复指南操作")
        provide_step_by_step_fix()

if __name__ == '__main__':
    main()