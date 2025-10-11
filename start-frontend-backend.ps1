# JobTrack - Start Frontend and Backend Services
# PowerShell script for Windows

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    $timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host "[$timestamp] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    $timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host "[$timestamp] OK $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    $timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host "[$timestamp] ERROR $Message" -ForegroundColor Red
}

Write-Header "JobTrack - Starting Frontend and Backend"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check backend dependencies
Write-Step "[1/4] Checking backend dependencies..."
if (-not (Test-Path "backend\node_modules")) {
    Write-Step "Installing backend dependencies..."
    Push-Location backend
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
        Write-Success "Backend dependencies installed"
    }
    catch {
        Write-ErrorMsg "Failed to install backend dependencies"
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
}
else {
    Write-Success "Backend dependencies OK"
}

# Check frontend dependencies
Write-Step "[2/4] Checking frontend dependencies..."
if (-not (Test-Path "frontend\node_modules")) {
    Write-Step "Installing frontend dependencies..."
    Push-Location frontend
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
        Write-Success "Frontend dependencies installed"
    }
    catch {
        Write-ErrorMsg "Failed to install frontend dependencies"
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
}
else {
    Write-Success "Frontend dependencies OK"
}

Write-Host ""
Write-Step "[3/4] Starting Backend Server (Port 3000)..."

# Start backend
$backendPath = Join-Path $ScriptDir "backend"
$backendArgs = "-NoExit", "-Command", "Set-Location '$backendPath'; npm run dev"
Start-Process powershell -ArgumentList $backendArgs -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Success "Backend server starting..."

Write-Step "[4/4] Starting Frontend Server (Port 5173)..."

# Start frontend
$frontendPath = Join-Path $ScriptDir "frontend"
$frontendArgs = "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"
Start-Process powershell -ArgumentList $frontendArgs -WindowStyle Normal

Start-Sleep -Seconds 2
Write-Success "Frontend server starting..."

Write-Host ""
Write-Header "Services Started Successfully!"

Write-Host "  Frontend:    " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Green

Write-Host "  Backend API: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green

Write-Host "  Health:      " -NoNewline
Write-Host "http://localhost:3000/health" -ForegroundColor Green

Write-Host ""
Write-Host "Wait 5-10 seconds for services to fully start, then:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:5173 in your browser"
Write-Host "   2. Login with Gmail"
Write-Host "   3. Start using JobTrack!"

Write-Host ""
Write-Host "To stop services: Close the Backend and Frontend PowerShell windows" -ForegroundColor Yellow

Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
