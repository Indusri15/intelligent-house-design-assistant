# PowerShell Launch Script for Intelligent House Design and Construction Assistant
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Intelligent House Design Assistant Services    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in separate window
Write-Host "[1/3] Starting Express Backend (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; npm run dev"

# 2. Start AI Service in separate window
Write-Host "[2/3] Starting Python AI Service (Port 8000)..." -ForegroundColor Green
$PythonExe = if (Test-Path "$ScriptDir\.python\python.exe") { "$ScriptDir\.python\python.exe" } else { "python" }
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\ai-service'; & '$PythonExe' app/main.py"

# 3. Start Frontend in separate window
Write-Host "[3/3] Starting React Vite Frontend (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\frontend'; npm run dev"

Write-Host "`nAll 3 services have been launched in separate terminal windows!" -ForegroundColor Yellow
Write-Host "Open your browser at: http://localhost:5173" -ForegroundColor White
