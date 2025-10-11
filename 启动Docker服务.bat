@echo off
chcp 65001 >nul
REM JobTrack Docker 启动脚本（中文版）

color 0A
echo ============================================================
echo   🚀 JobTrack - Docker 一键启动
echo ============================================================
echo.

REM 检查Docker是否运行
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未运行
    echo.
    echo 请先启动Docker Desktop，然后重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo [✓] Docker已就绪
echo.

REM 显示当前状态
echo 正在检查现有容器...
docker compose ps
echo.

REM 询问用户操作
echo 请选择操作:
echo   1. 首次启动（构建并启动所有服务）
echo   2. 快速启动（使用现有镜像）
echo   3. 重新构建并启动
echo   4. 停止所有服务
echo   5. 查看服务日志
echo   6. 查看服务状态
echo.
set /p CHOICE="请输入选项 (1-6): "

if "%CHOICE%"=="1" goto first_start
if "%CHOICE%"=="2" goto quick_start
if "%CHOICE%"=="3" goto rebuild
if "%CHOICE%"=="4" goto stop
if "%CHOICE%"=="5" goto logs
if "%CHOICE%"=="6" goto status
echo 无效选项
pause
exit /b 1

:first_start
echo.
echo 🔨 首次启动：构建Docker镜像并启动服务...
echo 注意：首次构建可能需要5-10分钟，请耐心等待
echo.
docker compose up -d --build
goto success

:quick_start
echo.
echo ⚡ 快速启动：使用现有镜像启动服务...
echo.
docker compose up -d
goto success

:rebuild
echo.
echo 🔄 重新构建：不使用缓存重新构建所有镜像...
echo.
docker compose build --no-cache
docker compose up -d
goto success

:stop
echo.
echo 🛑 停止所有服务...
echo.
docker compose down
echo.
echo 所有服务已停止
pause
exit /b 0

:logs
echo.
echo 📋 查看服务日志（按Ctrl+C退出）...
echo.
timeout /t 2 /nobreak >nul
docker compose logs -f
pause
exit /b 0

:status
echo.
echo 📊 服务状态:
echo.
docker compose ps
echo.
echo 📈 资源使用:
echo.
docker stats --no-stream
echo.
pause
exit /b 0

:success
if %errorlevel% neq 0 (
    echo.
    echo [错误] 启动失败！
    echo.
    echo 查看错误日志：
    docker compose logs
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   ✅ 服务启动成功！
echo ============================================================
echo.
echo   🌐 前端界面:      http://localhost
echo   🔧 后端API:       http://localhost:3000
echo   🤖 Python ML:     http://localhost:5000
echo.
echo   💡 健康检查:
echo      http://localhost/health
echo      http://localhost:3000/health
echo      http://localhost:5000/health
echo.
echo 等待 10-20 秒让所有服务完全启动...
echo.
echo 然后在浏览器中打开: http://localhost
echo.
set /p OPEN="是否立即在浏览器中打开？(Y/N): "
if /i "%OPEN%"=="Y" (
    start http://localhost
)

echo.
echo 常用命令:
echo   - 查看日志:    docker compose logs -f
echo   - 查看状态:    docker compose ps
echo   - 停止服务:    docker compose down
echo   - 重启服务:    docker compose restart
echo.

set /p VIEW_LOGS="是否查看实时日志？(Y/N): "
if /i "%VIEW_LOGS%"=="Y" (
    echo.
    echo 显示实时日志（按Ctrl+C退出）...
    timeout /t 2 /nobreak >nul
    docker compose logs -f
)

pause

