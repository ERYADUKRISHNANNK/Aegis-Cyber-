@echo off
title Aegis Cyber Platform Launcher
color 0B
echo.
echo  =====================================================
echo    AEGIS CYBER DEFENSE PLATFORM - QUICK LAUNCHER
echo  =====================================================
echo.

:: Kill any previous instances
echo  [*] Clearing old sessions...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Backend
echo  [1/2] Starting Backend Server (port 5000)...
start "Aegis Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 5 /nobreak >nul

:: Start Frontend
echo  [2/2] Starting Frontend (port 3000)...
start "Aegis Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo.
echo  =====================================================
echo   APP IS RUNNING!
echo  =====================================================
echo.
echo   On this PC:    http://localhost:3000
echo   On your phone: http://%IP%:3000
echo.
echo   (Make sure your phone is on the same WiFi!)
echo   Login: admin / admin
echo  =====================================================
echo.
start http://localhost:3000
pause
