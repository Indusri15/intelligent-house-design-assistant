@echo off
title Intelligent House Design Assistant Launcher
echo ==========================================================
echo   Starting Intelligent House Design Assistant Services
echo ==========================================================

start "Backend Server (Port 5000)" cmd /k "cd backend && npm run dev"
start "AI Service (Port 8000)" cmd /k "cd ai-service && ..\.python\python.exe app/main.py"
start "Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo All 3 services have been launched!
echo Access the application in your browser at: http://localhost:5173
pause
