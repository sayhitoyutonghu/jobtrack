@echo off
echo ========================================
echo JobTrack - Starting All Services
echo ========================================
echo.

echo Starting Backend (Port 3000)...
start "JobTrack Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo Starting Flask API (Port 5000)...
start "JobTrack Flask API" cmd /k "python app.py"
timeout /t 3 /nobreak >nul

echo Starting Frontend (Port 5173)...
start "JobTrack Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo All services are starting...
echo ========================================
echo.
echo Wait 10 seconds then test connections:
echo   powershell .\test_connections.ps1
echo.
echo Access URLs:
echo   Dashboard:   http://localhost:5173
echo   Backend API: http://localhost:3000
echo   Flask API:   http://localhost:5000
echo.
pause

