Write-Host "Starting Monthly To-Do Tracker..." -ForegroundColor Cyan
Write-Host ""

# Start backend server in new window
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev:server"

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host ""
Write-Host "Both servers are starting in separate windows." -ForegroundColor Green
Write-Host "The app will be available at http://localhost:5173 once Vite finishes loading." -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
