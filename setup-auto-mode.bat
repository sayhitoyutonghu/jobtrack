@echo off
echo 🚀 JobTrack 完全自动化设置
echo ═══════════════════════════════════════════════════════

echo.
echo 📋 此脚本将设置JobTrack为完全自动化模式：
echo    ✅ 用户只需连接Gmail一次
echo    ✅ 系统自动启动和运行
echo    ✅ 自动token刷新
echo    ✅ 后台持续扫描
echo    ✅ 开机自启动
echo.

set /p confirm="是否继续？(y/N): "
if /i not "%confirm%"=="y" (
    echo 取消设置
    pause
    exit /b 0
)

echo.
echo 📦 安装依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 🔧 设置环境变量...
if not exist .env (
    echo 请先配置.env文件中的Google OAuth设置
    echo 参考: GOOGLE_OAUTH_SETUP.md
    pause
    exit /b 1
)

echo.
echo 🚀 启动后台服务...
start "JobTrack Backend" cmd /k "npm run start:autoscan"

echo.
echo ⏳ 等待服务启动...
timeout /t 5 /nobreak > nul

echo.
echo 🧪 测试自动扫描功能...
cd ..
node test-autoscan.js
if %errorlevel% neq 0 (
    echo ⚠️  测试失败，但服务可能仍在运行
)

echo.
echo 📋 安装系统服务（可选）...
set /p install_service="是否安装为系统服务（开机自启动）？(y/N): "
if /i "%install_service%"=="y" (
    echo 正在安装系统服务...
    node scripts/install-service.js install
    if %errorlevel% neq 0 (
        echo ⚠️  系统服务安装失败，但后台服务仍在运行
    )
)

echo.
echo ✅ 设置完成！
echo.
echo 📊 服务状态：
echo    🌐 前端: http://localhost:5173
echo    📡 后端: http://localhost:3000
echo    ❤️  健康检查: http://localhost:3000/health
echo    🔍 详细状态: http://localhost:3000/health/detailed
echo.
echo 🤖 自动化功能：
echo    ✅ 用户连接Gmail后自动开始扫描
echo    ✅ Token自动刷新（无需重新登录）
echo    ✅ 后台持续运行
echo    ✅ 错误自动恢复
echo.
echo 📝 使用说明：
echo    1. 访问前端界面
echo    2. 点击"Sign in with Google"连接Gmail
echo    3. 系统将自动开始扫描，无需任何手动操作
echo.
pause
