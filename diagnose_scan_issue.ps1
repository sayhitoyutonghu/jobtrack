# Diagnose Email Scanning Issue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "JobTrack Scan Issue Diagnosis" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check session
Write-Host "[1/5] Checking authentication..." -ForegroundColor Yellow
$sessionId = "l4i0be"
try {
    $authStatus = Invoke-RestMethod -Uri "http://localhost:3000/auth/status" -Headers @{"x-session-id"=$sessionId} -TimeoutSec 3
    if ($authStatus.authenticated) {
        Write-Host "  ✅ Session valid" -ForegroundColor Green
        Write-Host "     Session ID: $($authStatus.sessionId)" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Not authenticated - need to re-login" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "  ❌ Cannot check auth status" -ForegroundColor Red
    exit
}

# Check labels exist
Write-Host "`n[2/5] Checking labels configuration..." -ForegroundColor Yellow
try {
    $labels = Invoke-RestMethod -Uri "http://localhost:3000/api/labels" -TimeoutSec 3
    if ($labels.success -and $labels.labels) {
        Write-Host "  ✅ Found $($labels.labels.Count) label configurations" -ForegroundColor Green
        foreach ($label in $labels.labels) {
            Write-Host "     - $($label.fullName)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  No labels configured" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Cannot fetch labels" -ForegroundColor Red
}

# Check Backend service
Write-Host "`n[3/5] Checking Backend service..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 3
    Write-Host "  ✅ Backend is running" -ForegroundColor Green
    Write-Host "     Sessions: $($health.sessions)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Backend not responding" -ForegroundColor Red
}

# Check Flask API
Write-Host "`n[4/5] Checking Flask API..." -ForegroundColor Yellow
try {
    $flaskHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 3
    if ($flaskHealth.model_loaded) {
        Write-Host "  ✅ Flask API is running" -ForegroundColor Green
        Write-Host "     Model loaded: $($flaskHealth.model_loaded)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Flask API not responding" -ForegroundColor Red
}

# Test a scan request
Write-Host "`n[5/5] Testing scan endpoint..." -ForegroundColor Yellow
try {
    $scanBody = @{
        query = "newer_than:1d"
        maxResults = 5
    } | ConvertTo-Json
    
    Write-Host "  Sending test scan request..." -ForegroundColor Gray
    $scanResult = Invoke-RestMethod -Uri "http://localhost:3000/api/gmail/scan" `
        -Method Post `
        -Headers @{
            "x-session-id"=$sessionId
            "Content-Type"="application/json"
        } `
        -Body $scanBody `
        -TimeoutSec 30
    
    if ($scanResult.success) {
        Write-Host "  ✅ Scan endpoint works" -ForegroundColor Green
        Write-Host "     Total: $($scanResult.stats.total)" -ForegroundColor Gray
        Write-Host "     Processed: $($scanResult.stats.processed)" -ForegroundColor Gray
        Write-Host "     Skipped: $($scanResult.stats.skipped)" -ForegroundColor Gray
        
        if ($scanResult.results -and $scanResult.results.Count -gt 0) {
            Write-Host "`n  Sample results:" -ForegroundColor Cyan
            $scanResult.results | Select-Object -First 3 | ForEach-Object {
                if ($_.skipped) {
                    Write-Host "     ⊘ $($_.subject)" -ForegroundColor Yellow
                    Write-Host "       Reason: $($_.skipped)" -ForegroundColor Gray
                } else {
                    Write-Host "     ✓ $($_.subject)" -ForegroundColor Green
                    Write-Host "       Label: $($_.label) (confidence: $($_.confidence))" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "  ❌ Scan failed: $($scanResult.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Cannot perform scan" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Diagnosis Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Common Issues and Solutions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "If emails are being classified but not labeled in Gmail:" -ForegroundColor White
Write-Host "  1. Check Browser Console (F12) for errors" -ForegroundColor Gray
Write-Host "  2. Re-authenticate: Logout and Sign in again" -ForegroundColor Gray
Write-Host "  3. Check Google Cloud Console for API limits" -ForegroundColor Gray
Write-Host "  4. Verify Gmail API is enabled" -ForegroundColor Gray
Write-Host ""
Write-Host "If scan shows 'skipped' for all emails:" -ForegroundColor White
Write-Host "  1. Emails might not be job-related" -ForegroundColor Gray
Write-Host "  2. Check the 'reason' field in scan results" -ForegroundColor Gray
Write-Host ""
Write-Host "If scan fails completely:" -ForegroundColor White
Write-Host "  1. Check if session expired" -ForegroundColor Gray
Write-Host "  2. Restart Backend service" -ForegroundColor Gray
Write-Host "  3. Check Backend terminal for error logs" -ForegroundColor Gray
Write-Host ""

