@echo off
REM Docker Quick Start Script for Windows

color 0A
echo ============================================================
echo   JobTrack - Docker Quick Start
echo ============================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running
    echo.
    echo Please start Docker Desktop and try again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is ready
echo.

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo [ERROR] docker-compose.yml not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo Starting JobTrack services with Docker Compose...
echo.

REM Build and start services
docker compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start services
    echo.
    echo Check the logs with: docker compose logs
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Services Started Successfully!
echo ============================================================
echo.
echo   Frontend:    http://localhost
echo   Backend API: http://localhost:3000
echo   Python ML:   http://localhost:5000
echo.
echo Wait 10-20 seconds for services to fully start, then:
echo   1. Open http://localhost in your browser
echo   2. Login with Gmail
echo   3. Start using JobTrack!
echo.
echo Useful commands:
echo   View logs:    docker compose logs -f
echo   Stop:         docker compose down
echo   Restart:      docker compose restart
echo.

REM Ask if user wants to view logs
set /p SHOW_LOGS="View service logs now? (y/n): "
if /i "%SHOW_LOGS%"=="y" (
    echo.
    echo Press Ctrl+C to exit log view
    timeout /t 2 /nobreak >nul
    docker compose logs -f
)

pause

