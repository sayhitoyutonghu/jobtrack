@echo off
echo Starting JobTrack Development Environment...
echo.

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Starting backend server...
cd ..\backend
start "Backend Server" cmd /k "npm start"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting frontend development server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Development environment started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul

