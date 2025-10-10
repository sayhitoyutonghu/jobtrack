#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gmail API 快速修复指南
专门解决 invalid_request 和 credentials 问题
"""

import webbrowser
import time

def open_google_cloud_pages():
    """打开Google Cloud相关页面"""
    print("🔧 正在打开Google Cloud Console...")
    
    pages = [
        {
            "name": "Google Cloud Console 主页",
            "url": "https://console.cloud.google.com/",
            "description": "用于创建项目和管理API"
        },
        {
            "name": "Gmail API 启用页面", 
            "url": "https://console.cloud.google.com/apis/library/gmail.googleapis.com",
            "description": "启用Gmail API"
        },
        {
            "name": "凭据管理页面",
            "url": "https://console.cloud.google.com/apis/credentials",
            "description": "创建和管理OAuth凭据"
        },
        {
            "name": "OAuth同意屏幕",
            "url": "https://console.cloud.google.com/apis/credentials/consent",
            "description": "配置OAuth同意屏幕"
        }
    ]
    
    for page in pages:
        print(f"📂 打开: {page['name']}")
        print(f"   用途: {page['description']}")
        webbrowser.open(page['url'])
        time.sleep(1)
    
    print(f"\n✅ 所有页面已在浏览器中打开!")

def show_critical_steps():
    """显示关键修复步骤"""
    print("\n🚨 CRITICAL: 解决 invalid_request 错误的关键步骤")
    print("=" * 60)
    
    print("📋 问题分析:")
    print("  • 你的凭据文件缺少 'client_secret' 字段")
    print("  • 这通常意味着应用类型选择错误或文件不完整")
    print("  • invalid_request 错误常见于OAuth配置问题")
    
    print(f"\n🔥 立即修复步骤:")
    
    steps = [
        {
            "title": "🏗️  第1步: 创建/选择项目",
            "details": [
                "在Google Cloud Console中",
                "点击顶部的项目下拉菜单",
                "选择现有项目或点击 'NEW PROJECT'",
                "项目名称: JobTrack-Email-Importer",
                "等待项目创建完成"
            ]
        },
        {
            "title": "🔐 第2步: 配置OAuth同意屏幕 (CRITICAL)",
            "details": [
                "转到: APIs & Services > OAuth consent screen",
                "User Type: 选择 'External' (重要!)",
                "App name: JobTrack Email Importer", 
                "User support email: 选择你的Gmail地址",
                "Developer contact: 输入你的Gmail地址",
                "点击 'SAVE AND CONTINUE'",
                "Scopes页面: 点击 'ADD OR REMOVE SCOPES'",
                "搜索 'gmail' 并选择 '../auth/gmail.readonly'",
                "点击 'UPDATE' 然后 'SAVE AND CONTINUE'",
                "Test users: 点击 'ADD USERS' 添加你的Gmail地址",
                "完成后点击 'BACK TO DASHBOARD'"
            ]
        },
        {
            "title": "🔑 第3步: 创建Desktop Application凭据",
            "details": [
                "转到: APIs & Services > Credentials",
                "点击 '+ CREATE CREDENTIALS'",
                "选择 'OAuth client ID'",
                "Application type: 选择 'Desktop application' ⭐",
                "Name: JobTrack Desktop Client",
                "点击 'CREATE'",
                "在弹出对话框中点击 'DOWNLOAD JSON'",
                "将下载的文件重命名为 'credentials.json'",
                "确保文件放在正确位置"
            ]
        },
        {
            "title": "✅ 第4步: 验证文件内容",
            "details": [
                "打开 credentials.json 文件",
                "确认包含以下结构:",
                "{",
                '  "installed": {',
                '    "client_id": "...",',
                '    "client_secret": "...",  # 这个必须存在!',
                '    "auth_uri": "...",',
                '    "token_uri": "...",',
                '    "redirect_uris": [...]',
                "  }",
                "}"
            ]
        }
    ]
    
    for step in steps:
        print(f"\n{step['title']}")
        for detail in step['details']:
            if detail.startswith("{") or detail.startswith('"') or detail.startswith("  ") or detail.startswith("}"):
                print(f"    {detail}")  # 缩进JSON代码
            else:
                print(f"  • {detail}")

def show_desktop_vs_web_explanation():
    """解释为什么必须选择Desktop Application"""
    print(f"\n💡 为什么必须选择 'Desktop application'?")
    print("=" * 50)
    
    print("❌ Web Application 问题:")
    print("  • 需要配置授权重定向URI")
    print("  • 需要运行Web服务器")
    print("  • 会产生 'redirect_uri_mismatch' 错误")
    print("  • 不适合命令行Python脚本")
    
    print(f"\n✅ Desktop Application 优势:")
    print("  • 自动处理本地重定向 (http://localhost)")
    print("  • 不需要Web服务器")
    print("  • 完美适配Python脚本")
    print("  • 包含完整的client_secret")
    print("  • OAuth流程更简单")
    
    print(f"\n🔍 凭据文件对比:")
    print("Desktop Application JSON结构:")
    print('  { "installed": { "client_id": "...", "client_secret": "..." } }')
    print()
    print("Web Application JSON结构:")  
    print('  { "web": { "client_id": "...", "client_secret": "..." } }')
    print()
    print("🎯 我们需要 'installed' 结构，所以必须选择Desktop!")

def verify_setup():
    """验证设置是否正确"""
    print(f"\n🔍 设置验证清单")
    print("=" * 30)
    
    checklist = [
        "✅ 项目已创建并选择",
        "✅ Gmail API已启用",
        "✅ OAuth同意屏幕已配置 (External)",
        "✅ 测试用户已添加 (你的Gmail地址)",
        "✅ 凭据类型选择了 'Desktop application'", 
        "✅ credentials.json已下载并重命名",
        "✅ 文件包含 'installed' 和 'client_secret' 字段",
        "✅ 文件位于正确目录"
    ]
    
    for item in checklist:
        print(f"  {item}")
    
    print(f"\n🧪 完成后运行验证:")
    print(f"  python gmail_diagnostic.py")

def main():
    """主程序"""
    print("🚨 Gmail API 快速修复向导")
    print("=" * 60)
    print("专门解决 'invalid_request' 错误")
    
    choice = input("\n是否打开Google Cloud Console页面? (y/N): ").lower()
    if choice in ['y', 'yes']:
        open_google_cloud_pages()
        print(f"\n⏳ 请等待页面加载完成...")
        time.sleep(3)
    
    show_critical_steps()
    show_desktop_vs_web_explanation()
    verify_setup()
    
    print(f"\n🎯 重点提醒:")
    print(f"1. 必须选择 'Desktop application' 类型")
    print(f"2. 必须配置OAuth同意屏幕") 
    print(f"3. 必须添加你的Gmail为测试用户")
    print(f"4. credentials.json必须包含 'client_secret'")
    
    print(f"\n🔄 完成设置后运行:")
    print(f"  python gmail_diagnostic.py  # 验证配置")
    print(f"  python gmail_importer.py   # 开始导入")

if __name__ == '__main__':
    main()