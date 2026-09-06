@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   SmartGrid Monitor - Windows Launcher
echo ============================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH.
  echo Install Node.js 20+ from https://nodejs.org and re-run this file.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found on PATH. It normally ships with Node.js.
  pause
  exit /b 1
)

if not exist ".env" (
  echo [SETUP] No .env file found - creating one from .env.example.
  copy ".env.example" ".env" >nul
  echo.
  echo [ACTION REQUIRED] Open .env in a text editor and set at least:
  echo   - DATABASE_URL   (your PostgreSQL connection string^)
  echo   - AUTH_SECRET / NEXTAUTH_SECRET  (run: npx auth secret^)
  echo   - DEVICE_API_SECRET  (any random string, e.g. from https://randomkeygen.com^)
  echo.
  echo Save the file, then re-run this launcher.
  pause
  exit /b 0
)

if not exist "node_modules" (
  echo [SETUP] Installing dependencies with npm install ...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed. See the output above.
    pause
    exit /b 1
  )
) else (
  echo [OK] Dependencies already installed - skipping npm install.
)

echo.
echo [SETUP] Generating Prisma client ...
call npx prisma generate
if errorlevel 1 (
  echo [ERROR] prisma generate failed. Check DATABASE_URL in .env.
  pause
  exit /b 1
)

echo.
echo [SETUP] Applying database migrations ...
call npx prisma migrate dev --name init --skip-generate
if errorlevel 1 (
  echo [ERROR] Database migration failed. Confirm PostgreSQL is running and
  echo DATABASE_URL in .env points to a reachable, existing database.
  pause
  exit /b 1
)

if not exist ".seeded" (
  echo.
  echo [SETUP] Seeding demo data (first run only) ...
  call npm run db:seed
  if errorlevel 1 (
    echo [ERROR] Seeding failed. See the output above.
    pause
    exit /b 1
  )
  echo done > ".seeded"
) else (
  echo [OK] Demo data already seeded - skipping. Delete the ".seeded" file to reseed.
)

echo.
echo ============================================
echo   Starting SmartGrid Monitor on http://localhost:3000
echo   Press Ctrl+C in this window to stop the server.
echo ============================================
echo.

start "" http://localhost:3000
call npm run dev

pause
