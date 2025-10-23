@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting backend...
cd backend
start "Backend Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul
echo Backend server restarted!
pause
