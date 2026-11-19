@echo off
setlocal
title SmartGrid Monitor - Server Launcher
color 0A

:: Set working directory to this script's folder
cd /d "%~dp0"

echo ============================================================
echo         SmartGrid Monitor - 3-Phase Energy and AI System
echo ============================================================
echo.
echo   [+] Database : PostgreSQL (Port 5432)
echo   [+] Frontend : Next.js Dashboard (http://localhost:3000)
echo   [+] AI Engine: Predictive Early Warning and Grid Classifier
echo   [+] IoT Hub  : ESP32 and 3x PZEM-004T Background Poller
echo.
echo ============================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if errorlevel 1 goto ERR_NODE

:: 2. Verify npm
where npm >nul 2>nul
if errorlevel 1 goto ERR_NPM

:: 3. Check for .env file
if not exist ".env" (
    echo [SETUP] No .env file found. Creating from .env.example...
    copy ".env.example" ".env" >nul
    echo [OK] Created .env file.
)

:: 4. Check dependencies
if not exist "node_modules" (
    echo [SETUP] First-time setup: Installing required dependencies...
    call npm install
    if errorlevel 1 goto ERR_INSTALL
)

echo [INFO] Starting SmartGrid services and opening web dashboard...
echo [INFO] Press Ctrl+C in this window to gracefully stop the server.
echo.

:: 5. Launch the unified service manager
node scripts\start-services.js
goto END

:ERR_NODE
color 0C
echo.
echo ============================================================
echo [ERROR] Node.js was not found in your system PATH!
echo ============================================================
echo Please install Node.js (version 20 or higher) from:
echo   https://nodejs.org/
echo After installing, restart this script.
echo.
pause
exit /b 1

:ERR_NPM
color 0C
echo.
echo ============================================================
echo [ERROR] npm was not found in your system PATH!
echo ============================================================
echo npm usually comes bundled with Node.js.
echo Please reinstall Node.js from https://nodejs.org/
echo.
pause
exit /b 1

:ERR_INSTALL
color 0C
echo.
echo ============================================================
echo [ERROR] npm install encountered an error!
echo ============================================================
echo Please check your internet connection and try running:
echo   npm install
echo manually in this directory.
echo.
pause
exit /b 1

:END
echo.
echo ============================================================
echo   SmartGrid Monitor services have stopped.
echo ============================================================
echo.
pause
