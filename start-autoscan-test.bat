@echo off
echo 🚀 Starting JobTrack Backend with Auto-Scan Test
echo ═══════════════════════════════════════════════════════

echo.
echo 📦 Installing dependencies...
cd backend
call npm install

echo.
echo 🔧 Starting backend server...
start "JobTrack Backend" cmd /k "npm run start:autoscan"

echo.
echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo 🧪 Running auto-scan tests...
cd ..
node test-autoscan.js

echo.
echo ✅ Test completed! Check the backend console for logs.
echo.
echo 🌐 Frontend: http://localhost:5173
echo 📡 Backend: http://localhost:3000
echo ❤️  Health: http://localhost:3000/health
echo 🔍 Detailed: http://localhost:3000/health/detailed
echo.
pause

