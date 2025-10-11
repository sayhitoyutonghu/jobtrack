# Check Login Status Script

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "JobTrack Login Status Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get session ID from URL or localStorage simulation
$sessionId = "l4i0be"

# Check backend auth status
Write-Host "Checking authentication with Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/status" -Headers @{"x-session-id"=$sessionId} -TimeoutSec 3
    
    if ($response.authenticated) {
        Write-Host "  ✅ Backend: Authenticated" -ForegroundColor Green
        Write-Host "     Session ID: $($response.sessionId)" -ForegroundColor Gray
        Write-Host "     Created: $($response.createdAt)" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Backend: Not authenticated" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Backend: Error checking status" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Refresh Browser" -ForegroundColor Yellow
Write-Host "   Press F5 in your browser" -ForegroundColor White
Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray

Write-Host "`n2. Verify Login Status" -ForegroundColor Yellow
Write-Host "   Should see green banner:" -ForegroundColor White
Write-Host "   'Connected to Gmail'" -ForegroundColor Green
Write-Host "   'Session ID: l4i0be'" -ForegroundColor Gray

Write-Host "`n3. Create Gmail Labels" -ForegroundColor Yellow
Write-Host "   Click 'Create / Update Labels' button" -ForegroundColor White
Write-Host "   Wait for success message" -ForegroundColor Gray

Write-Host "`n4. Scan Emails" -ForegroundColor Yellow
Write-Host "   Configure scan settings:" -ForegroundColor White
Write-Host "   - Query: is:unread (or newer_than:7d)" -ForegroundColor Gray
Write-Host "   - Max: 25-50 messages" -ForegroundColor Gray
Write-Host "   Click 'Scan Now'" -ForegroundColor White

Write-Host "`n5. Check Gmail" -ForegroundColor Yellow
Write-Host "   Refresh Gmail inbox" -ForegroundColor White
Write-Host "   Look for 'JobTrack' labels in sidebar" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan

