# JobTrack - Service Connection Test
Write-Host "`n========================================"
Write-Host "JobTrack Service Connection Test"
Write-Host "========================================`n"

# Test Node.js Backend (Port 3000)
Write-Host "[1/3] Testing Node.js Backend (http://localhost:3000)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK Backend is running" -ForegroundColor Green
        Write-Host "  Response: $($response.Content)"
    }
} catch {
    Write-Host "  FAILED Backend is not running" -ForegroundColor Red
    Write-Host "  Run in another terminal: cd backend; npm start" -ForegroundColor Yellow
}

Write-Host ""

# Test Flask API (Port 5000)
Write-Host "[2/3] Testing Flask API (http://localhost:5000)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK Flask API is running" -ForegroundColor Green
        Write-Host "  Response: $($response.Content)"
    }
} catch {
    Write-Host "  FAILED Flask API is not running" -ForegroundColor Red
    Write-Host "  Run in another terminal: python app.py" -ForegroundColor Yellow
}

Write-Host ""

# Test React Frontend (Port 5173)
Write-Host "[3/3] Testing React Frontend (http://localhost:5173)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK Frontend is running" -ForegroundColor Green
        Write-Host "  Browser: http://localhost:5173"
    }
} catch {
    Write-Host "  FAILED Frontend is not running" -ForegroundColor Red
    Write-Host "  Run in another terminal: cd frontend; npm run dev" -ForegroundColor Yellow
}

Write-Host "`n========================================"
Write-Host "API Endpoint Tests"
Write-Host "========================================`n"

# Test Backend API endpoints
Write-Host "Testing Backend API endpoints..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 5
    Write-Host "  OK GET / endpoint works" -ForegroundColor Green
} catch {
    Write-Host "  FAILED Backend root endpoint" -ForegroundColor Red
}

# Test Labels API
Write-Host "Testing Labels API..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/labels" -UseBasicParsing -TimeoutSec 5
    Write-Host "  OK GET /api/labels endpoint works" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    if ($json.labels) {
        Write-Host "  Found $($json.labels.Count) label configurations"
    }
} catch {
    Write-Host "  FAILED Labels API" -ForegroundColor Red
}

Write-Host ""

# Test Flask Classification API
Write-Host "Testing Email Classification API..."
try {
    $body = @{
        subject = "Interview invitation"
        body = "We would like to schedule an interview with you"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/predict" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
    Write-Host "  OK POST /predict endpoint works" -ForegroundColor Green
    Write-Host "  Result: label=$($response.label), confidence=$($response.confidence)"
} catch {
    Write-Host "  FAILED Classification API" -ForegroundColor Red
}

Write-Host "`n========================================"
Write-Host "Test Complete!"
Write-Host "========================================`n"

Write-Host "Quick Start Commands:"
Write-Host "  Terminal 1: cd backend; npm start"
Write-Host "  Terminal 2: python app.py"
Write-Host "  Terminal 3: cd frontend; npm run dev"
Write-Host ""
Write-Host "Access URLs:"
Write-Host "  Dashboard:   http://localhost:5173"
Write-Host "  Backend API: http://localhost:3000"
Write-Host "  Flask API:   http://localhost:5000"
Write-Host ""
