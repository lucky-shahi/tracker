@echo off
echo Starting Monthly To-Do Tracker...
echo.
echo Starting backend server...
start "Backend Server" cmd /k "npm run dev:server"
timeout /t 3 /nobreak >nul
echo.
echo Starting frontend...
start "Frontend" cmd /k "npm run dev"
echo.
echo Both servers are starting in separate windows.
echo The app will be available at http://localhost:5173 once Vite finishes loading.
echo.
pause
