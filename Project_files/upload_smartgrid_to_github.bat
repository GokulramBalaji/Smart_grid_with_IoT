@echo off
setlocal enabledelayedexpansion
title Upload Smart Grid Project to GitHub

echo ====================================================================
echo        SMART GRID WITH IOT - GITHUB UPLOADER
echo ====================================================================
echo.

:: 1. Verify Git Installation
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in your system PATH!
    echo Please download and install Git from: https://git-scm.com/downloads
    echo Then run this script again.
    echo ====================================================================
    pause
    exit /b 1
)

:: 2. Resolve Paths
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

if exist "%SCRIPT_DIR%\Project_files\Sem-7-smart-grid-project-main" (
    set "PROJECT_DIR=%SCRIPT_DIR%\Project_files"
    set "PARENT_DIR=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%\Sem-7-smart-grid-project-main" (
    set "PROJECT_DIR=%SCRIPT_DIR%"
    for %%I in ("%SCRIPT_DIR%\..") do set "PARENT_DIR=%%~fI"
) else if exist ".\Project_files\Sem-7-smart-grid-project-main" (
    set "PROJECT_DIR=%CD%\Project_files"
    set "PARENT_DIR=%CD%"
) else (
    echo [ERROR] Could not locate the Project_files directory!
    echo Please make sure this .bat file is in the folder containing 'Project_files' or inside 'Project_files'.
    echo ====================================================================
    pause
    exit /b 1
)

set "REPO_URL=https://github.com/GokulramBalaji/Smart_grid_with_IoT.git"

:: 3. Check / Configure Git User Identity if missing
git config user.name >nul 2>&1
if errorlevel 1 (
    echo [INFO] Git user name is not configured on this computer.
    set /p "GIT_USER_NAME=Enter your Name for Git commits (Default: Gokulram Balaji): "
    if "!GIT_USER_NAME!"=="" set "GIT_USER_NAME=Gokulram Balaji"
    git config --global user.name "!GIT_USER_NAME!"
    echo Saved git user.name: !GIT_USER_NAME!
    echo.
)

git config user.email >nul 2>&1
if errorlevel 1 (
    echo [INFO] Git user email is not configured on this computer.
    set /p "GIT_USER_EMAIL=Enter your Email for Git commits (Default: gokulrambalaji@users.noreply.github.com): "
    if "!GIT_USER_EMAIL!"=="" set "GIT_USER_EMAIL=gokulrambalaji@users.noreply.github.com"
    git config --global user.email "!GIT_USER_EMAIL!"
    echo Saved git user.email: !GIT_USER_EMAIL!
    echo.
)

:: 4. Prompt for Upload Structure
echo Target Repository : %REPO_URL%
echo Source Folder     : %PROJECT_DIR%
echo.
echo Choose repository upload structure:
echo.
echo  [1] Upload as 'Project_files/' subfolder in repository (RECOMMENDED)
echo      Keeps the repository clean and structured: Smart_grid_with_IoT/Project_files/...
echo.
echo  [2] Upload Project_files contents directly to repository root
echo      Places all folders directly at: Smart_grid_with_IoT/...
echo.
set /p "CHOICE=Enter choice [1 or 2] (Default is 1, press Enter): "
if "%CHOICE%"=="" set "CHOICE=1"

if "%CHOICE%"=="1" goto :option1
if "%CHOICE%"=="2" goto :option2

echo [ERROR] Invalid choice selected.
goto :error

:: ======================================================================
:: OPTION 1: Upload as Project_files/ folder inside the repository
:: ======================================================================
:option1
set "TARGET_REPO_DIR=%PARENT_DIR%\Smart_grid_with_IoT"
echo.
echo [*] Selected Option 1: Upload as 'Project_files/' subfolder.

if not exist "!TARGET_REPO_DIR!\.git" (
    echo [*] Cloning remote repository into: "!TARGET_REPO_DIR!"...
    git clone "%REPO_URL%" "!TARGET_REPO_DIR!"
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to clone %REPO_URL%
        goto :git_error
    )
) else (
    echo [*] Local repository found. Pulling latest updates from GitHub...
    cd /d "!TARGET_REPO_DIR!"
    git pull origin main
)

echo [*] Synchronizing Project_files - excluding node_modules, .next, .embedded-pg, and caches...
if not exist "!TARGET_REPO_DIR!\Project_files" mkdir "!TARGET_REPO_DIR!\Project_files"

robocopy "%PROJECT_DIR%" "!TARGET_REPO_DIR!\Project_files" /E /XD node_modules .next .embedded-pg .git .vscode /XF *.sqlite *.sqlite-wal *.sqlite-shm *.log *.tsbuildinfo >nul
if !ERRORLEVEL! GEQ 8 (
    echo [ERROR] Robocopy encountered an issue while copying files.
    goto :error
)

cd /d "!TARGET_REPO_DIR!"
git branch -M main
git add .

echo.
echo [*] Changes detected:
git status -s
echo.

set /p "COMMIT_MSG=Enter commit message [Press Enter for default]: "
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=Add Smart Grid with IoT project files and telemetry platform"

git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [INFO] No changes detected (repository is already up to date).
) else (
    echo.
    echo [*] Pushing commits to GitHub on branch 'main'...
    git push -u origin main
    if errorlevel 1 goto :git_error
)

goto :success

:: ======================================================================
:: OPTION 2: Upload contents directly to repository root
:: ======================================================================
:option2
set "TARGET_REPO_DIR=%PARENT_DIR%\Smart_grid_with_IoT"
echo.
echo [*] Selected Option 2: Upload Project_files directly to repository root.

if not exist "!TARGET_REPO_DIR!\.git" (
    echo [*] Cloning remote repository into: "!TARGET_REPO_DIR!"...
    git clone "%REPO_URL%" "!TARGET_REPO_DIR!"
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to clone %REPO_URL%
        goto :git_error
    )
) else (
    echo [*] Local repository found. Pulling latest updates from GitHub...
    cd /d "!TARGET_REPO_DIR!"
    git pull origin main
)

echo [*] Synchronizing files to repository root - excluding node_modules, .next, .embedded-pg...
robocopy "%PROJECT_DIR%" "!TARGET_REPO_DIR!" /E /XD node_modules .next .embedded-pg .git .vscode /XF *.sqlite *.sqlite-wal *.sqlite-shm *.log *.tsbuildinfo >nul
if !ERRORLEVEL! GEQ 8 (
    echo [ERROR] Robocopy encountered an issue while copying files.
    goto :error
)

cd /d "!TARGET_REPO_DIR!"
git branch -M main
git add .

echo.
echo [*] Changes detected:
git status -s
echo.

set /p "COMMIT_MSG=Enter commit message [Press Enter for default]: "
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=Update Smart Grid with IoT project files"

git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [INFO] No changes detected (repository is already up to date).
) else (
    echo.
    echo [*] Pushing commits to GitHub on branch 'main'...
    git push -u origin main
    if errorlevel 1 goto :git_error
)

goto :success

:: ======================================================================
:: Exit handlers
:: ======================================================================
:success
echo.
echo ====================================================================
echo [SUCCESS] Project files successfully uploaded to GitHub!
echo Repository URL: %REPO_URL%
echo ====================================================================
echo.
pause
exit /b 0

:git_error
echo.
echo ====================================================================
echo [ERROR] Git command failed!
echo.
echo Troubleshooting checklist:
echo 1. Verify you have write/push access to:
echo    %REPO_URL%
echo 2. If prompted by Git Credential Manager, complete the GitHub login.
echo 3. If using a Personal Access Token (PAT), ensure it has 'repo' scope.
echo 4. Check your internet connection.
echo ====================================================================
echo.
pause
exit /b 1

:error
echo.
echo ====================================================================
echo [ERROR] Operation was aborted due to an error.
echo ====================================================================
echo.
pause
exit /b 1
