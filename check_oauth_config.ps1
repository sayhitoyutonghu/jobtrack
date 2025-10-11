# Google OAuth Configuration Checker

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Google OAuth Configuration Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check .env file
Write-Host "[1/4] Checking .env configuration..." -ForegroundColor Yellow
$envContent = Get-Content backend\.env -Raw

if ($envContent -match "GOOGLE_CLIENT_ID=([^\r\n]+)") {
    $clientId = $matches[1]
    if ($clientId -eq "your_client_id") {
        Write-Host "  ❌ Client ID not configured (still using placeholder)" -ForegroundColor Red
    } else {
        Write-Host "  ✅ Client ID configured: $clientId" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ GOOGLE_CLIENT_ID not found in .env" -ForegroundColor Red
}

if ($envContent -match "GOOGLE_CLIENT_SECRET=([^\r\n]+)") {
    $secret = $matches[1]
    if ($secret -eq "your_client_secret") {
        Write-Host "  ❌ Client Secret not configured (still using placeholder)" -ForegroundColor Red
    } else {
        $maskedSecret = $secret.Substring(0, [Math]::Min(15, $secret.Length)) + "..."
        Write-Host "  ✅ Client Secret configured: $maskedSecret" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ GOOGLE_CLIENT_SECRET not found in .env" -ForegroundColor Red
}

if ($envContent -match "GOOGLE_REDIRECT_URI=([^\r\n]+)") {
    $redirectUri = $matches[1]
    Write-Host "  ✅ Redirect URI: $redirectUri" -ForegroundColor Green
} else {
    Write-Host "  ❌ GOOGLE_REDIRECT_URI not found in .env" -ForegroundColor Red
}

# Check Backend is running
Write-Host "`n[2/4] Checking Backend service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  ✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Backend is not running or not responding" -ForegroundColor Red
    Write-Host "     Run: cd backend; npm start" -ForegroundColor Yellow
}

# Check Frontend is running
Write-Host "`n[3/4] Checking Frontend service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3
    Write-Host "  ✅ Frontend is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Frontend is not running or not responding" -ForegroundColor Red
    Write-Host "     Run: cd frontend; npm run dev" -ForegroundColor Yellow
}

# Google OAuth endpoint test
Write-Host "`n[4/4] Testing OAuth endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/auth/google" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 302 -or $response.Headers.Location) {
        Write-Host "  ✅ OAuth endpoint redirects correctly" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 302) {
        $location = $_.Exception.Response.Headers.Location
        if ($location -match "accounts.google.com") {
            Write-Host "  ✅ OAuth endpoint redirects to Google" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  OAuth endpoint redirects to: $location" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ OAuth endpoint error" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Google Cloud Console Requirements" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Make sure in Google Cloud Console:" -ForegroundColor Yellow
Write-Host "  1. OAuth 2.0 Client ID is created" -ForegroundColor White
Write-Host "  2. Authorized redirect URIs includes:" -ForegroundColor White
Write-Host "     http://localhost:3000/auth/callback" -ForegroundColor Cyan
Write-Host "  3. Gmail API is enabled" -ForegroundColor White
Write-Host "  4. OAuth consent screen is configured" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Login" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "To test Google login:" -ForegroundColor Yellow
Write-Host "  1. Open: http://localhost:5173" -ForegroundColor White
Write-Host "  2. Click: 'Sign in with Google'" -ForegroundColor White
Write-Host "  3. Or visit: http://localhost:3000/auth/google" -ForegroundColor White
Write-Host ""

