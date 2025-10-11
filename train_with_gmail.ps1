#!/usr/bin/env pwsh
<#
.SYNOPSIS
    自动化使用真实Gmail数据训练模型的完整流程

.DESCRIPTION
    此脚本会：
    1. 检查环境
    2. 导出Gmail训练数据
    3. 准备训练数据
    4. 训练模型
    5. 备份模型文件

.PARAMETER SessionId
    Gmail session ID（可选，如果未提供会提示输入）

.PARAMETER MaxResults
    导出的最大邮件数量（默认：500）

.PARAMETER Query
    Gmail查询条件（默认："in:inbox"）

.PARAMETER SkipExport
    跳过导出步骤，直接使用已有的导出文件

.EXAMPLE
    .\train_with_gmail.ps1
    # 交互式运行，会提示输入Session ID

.EXAMPLE
    .\train_with_gmail.ps1 -SessionId "your_session_id" -MaxResults 500
    # 导出500封邮件并训练

.EXAMPLE
    .\train_with_gmail.ps1 -SkipExport
    # 跳过导出，直接使用已有数据训练
#>

param(
    [string]$SessionId = "",
    [int]$MaxResults = 500,
    [string]$Query = "in:inbox",
    [switch]$SkipExport
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 使用真实Gmail数据训练模型" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 函数：检查命令是否存在
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# 函数：显示步骤
function Show-Step {
    param([string]$Message, [int]$Step)
    Write-Host ""
    Write-Host "[$Step/5] $Message" -ForegroundColor Yellow
    Write-Host ("─" * 60) -ForegroundColor Gray
}

# 步骤 1: 检查环境
Show-Step "检查环境" 1

Write-Host "检查Python..." -NoNewline
if (Test-Command python) {
    $pythonVersion = python --version 2>&1
    Write-Host " ✓ $pythonVersion" -ForegroundColor Green
} else {
    Write-Host " ✗ 未安装" -ForegroundColor Red
    Write-Host "❌ 错误: 需要安装Python 3.7+" -ForegroundColor Red
    exit 1
}

Write-Host "检查Node.js..." -NoNewline
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host " ✓ Node $nodeVersion" -ForegroundColor Green
} else {
    Write-Host " ✗ 未安装" -ForegroundColor Red
    Write-Host "❌ 错误: 需要安装Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "检查依赖文件..." -NoNewline
if (Test-Path "requirements.txt") {
    Write-Host " ✓" -ForegroundColor Green
} else {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "❌ 错误: 找不到requirements.txt" -ForegroundColor Red
    exit 1
}

# 步骤 2: 导出Gmail数据（可选）
if (-not $SkipExport) {
    Show-Step "导出Gmail训练数据" 2
    
    # 获取Session ID
    if ([string]::IsNullOrEmpty($SessionId)) {
        Write-Host ""
        Write-Host "📝 请按照以下步骤获取Session ID:" -ForegroundColor Cyan
        Write-Host "   1. 打开浏览器访问: http://localhost:5173"
        Write-Host "   2. 登录Gmail账号"
        Write-Host "   3. 打开开发者工具（F12）"
        Write-Host "   4. 在Console中运行: localStorage.getItem('sessionId')"
        Write-Host "   5. 复制显示的Session ID"
        Write-Host ""
        $SessionId = Read-Host "请输入Session ID"
        
        if ([string]::IsNullOrEmpty($SessionId)) {
            Write-Host "❌ 错误: Session ID不能为空" -ForegroundColor Red
            exit 1
        }
    }
    
    # 设置环境变量
    $env:JOBTRACK_SESSION_ID = $SessionId
    
    Write-Host ""
    Write-Host "📬 开始导出邮件数据..." -ForegroundColor Cyan
    Write-Host "   查询条件: $Query"
    Write-Host "   最大数量: $MaxResults"
    Write-Host ""
    
    # 确保backend目录存在
    if (-not (Test-Path "backend")) {
        Write-Host "❌ 错误: backend目录不存在" -ForegroundColor Red
        exit 1
    }
    
    # 运行导出脚本
    try {
        node scripts/export-gmail-training-data.js --query $Query --maxResults $MaxResults
        
        if ($LASTEXITCODE -ne 0) {
            throw "导出脚本返回错误代码: $LASTEXITCODE"
        }
        
        Write-Host ""
        Write-Host "✓ Gmail数据导出完成" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "❌ 导出失败: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 可能的原因:" -ForegroundColor Yellow
        Write-Host "   - Session ID已过期（请重新登录）"
        Write-Host "   - 后端服务未运行（请运行: cd backend && npm run dev）"
        Write-Host "   - 网络连接问题"
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[2/5] 跳过Gmail数据导出" -ForegroundColor Yellow
    Write-Host ("─" * 60) -ForegroundColor Gray
    Write-Host "使用已有的导出文件..." -ForegroundColor Cyan
}

# 步骤 3: 准备训练数据
Show-Step "准备训练数据" 3

Write-Host ""
Write-Host "🔄 合并和转换数据..." -ForegroundColor Cyan
Write-Host ""

try {
    python prepare_training_data.py
    
    if ($LASTEXITCODE -ne 0) {
        throw "数据准备脚本返回错误代码: $LASTEXITCODE"
    }
    
    if (-not (Test-Path "emails_real.csv")) {
        throw "未生成emails_real.csv文件"
    }
    
    Write-Host ""
    Write-Host "✓ 训练数据准备完成" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ 数据准备失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 可能的原因:" -ForegroundColor Yellow
    Write-Host "   - backend/export目录中没有CSV文件"
    Write-Host "   - 导出的邮件都没有标签"
    Write-Host "   - Python依赖未安装（请运行: pip install -r requirements.txt）"
    exit 1
}

# 步骤 4: 训练模型
Show-Step "训练模型" 4

Write-Host ""
Write-Host "🤖 开始训练..." -ForegroundColor Cyan
Write-Host ""

try {
    python train_model.py --data emails_real.csv
    
    if ($LASTEXITCODE -ne 0) {
        throw "模型训练返回错误代码: $LASTEXITCODE"
    }
    
    if (-not (Test-Path "model.pkl") -or -not (Test-Path "vectorizer.pkl")) {
        throw "模型文件未生成"
    }
    
    Write-Host ""
    Write-Host "✓ 模型训练完成" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ 模型训练失败: $_" -ForegroundColor Red
    exit 1
}

# 步骤 5: 备份模型
Show-Step "备份模型文件" 5

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = "model_backups"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

try {
    Copy-Item "model.pkl" "$backupDir/model_$timestamp.pkl"
    Copy-Item "vectorizer.pkl" "$backupDir/vectorizer_$timestamp.pkl"
    Copy-Item "emails_real.csv" "$backupDir/training_data_$timestamp.csv"
    
    Write-Host ""
    Write-Host "✓ 模型已备份到: $backupDir" -ForegroundColor Green
    Write-Host "   - model_$timestamp.pkl"
    Write-Host "   - vectorizer_$timestamp.pkl"
    Write-Host "   - training_data_$timestamp.csv"
} catch {
    Write-Host ""
    Write-Host "⚠️  备份失败，但模型训练成功" -ForegroundColor Yellow
}

# 完成
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ 训练完成！" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 模型文件:" -ForegroundColor Cyan
Write-Host "   - model.pkl"
Write-Host "   - vectorizer.pkl"
Write-Host ""
Write-Host "📁 训练数据:" -ForegroundColor Cyan
Write-Host "   - emails_real.csv"
Write-Host ""
Write-Host "💾 备份位置:" -ForegroundColor Cyan
Write-Host "   - $backupDir/"
Write-Host ""
Write-Host "🎯 下一步:" -ForegroundColor Cyan
Write-Host "   1. 测试模型: 在Chrome扩展中打开Gmail并扫描邮件"
Write-Host "   2. 查看结果: 检查自动分类的准确性"
Write-Host "   3. 持续改进: 定期重新训练以提高准确率"
Write-Host ""
Write-Host "💡 重新训练:" -ForegroundColor Cyan
Write-Host "   - 完整流程: .\train_with_gmail.ps1 -SessionId 'your_id'"
Write-Host "   - 只训练: .\train_with_gmail.ps1 -SkipExport"
Write-Host ""


