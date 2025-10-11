@echo off
REM Quick start script for Frontend and Backend only
REM No Flask API needed for basic functionality

color 0A
echo ============================================================
echo   JobTrack - Starting Frontend and Backend
echo ============================================================
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules\" (
    echo [1/4] Installing backend dependencies...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [1/4] Backend dependencies OK
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules\" (
    echo [2/4] Installing frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [2/4] Frontend dependencies OK
)

echo.
echo [3/4] Starting Backend Server (Port 3000)...
start "JobTrack Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [4/4] Starting Frontend Server (Port 5173)...
start "JobTrack Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ============================================================
echo   Services Started Successfully!
echo ============================================================
echo.
echo   Frontend:    http://localhost:5173
echo   Backend API: http://localhost:3000
echo   Health:      http://localhost:3000/health
echo.
echo Wait 5-10 seconds for services to fully start, then:
echo   1. Open http://localhost:5173 in your browser
echo   2. Login with Gmail
echo   3. Start using JobTrack!
echo.
echo To stop services: Close the Backend and Frontend windows
echo.
pause

