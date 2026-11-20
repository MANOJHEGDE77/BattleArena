@echo off
setlocal
title Cyber Arena - AAA Desktop App Launcher
cls
echo =====================================================================
echo                CYBER ARENA - STANDALONE DESKTOP CLIENT
echo =====================================================================
echo.
echo [1/3] Initializing lightweight local game server...

:: Start the lightweight Node server if port 3000 is not in use
netstat -ano | findstr ":3000 " >nul
if %errorlevel% neq 0 (
    start "" /b node "%~dp0scripts\serve.js"
    timeout /t 1 /nobreak >nul
) else (
    echo [Server] Local game engine already active on port 3000.
)

echo [2/3] Configuring Direct3D GPU hardware acceleration...
set "APP_URL=http://localhost:3000/index.html"
set "APP_FLAGS=--app=%APP_URL% --window-size=1440,900 --enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --disable-frame-rate-limit"

echo [3/3] Launching dedicated native application window...

:: Try Microsoft Edge (Default on Windows 10/11)
where msedge >nul 2>&1
if %errorlevel% equ 0 (
    start "" msedge %APP_FLAGS%
    goto :done
)

:: Try Google Chrome
where chrome >nul 2>&1
if %errorlevel% equ 0 (
    start "" chrome %APP_FLAGS%
    goto :done
)

:: Try Brave Browser
where brave >nul 2>&1
if %errorlevel% equ 0 (
    start "" brave %APP_FLAGS%
    goto :done
)

:: Fallback standard start
start "" "%APP_URL%"

:done
echo.
echo =====================================================================
echo   Cyber Arena is now running in dedicated standalone App Mode!
echo   Close this terminal window or press any key to exit.
echo =====================================================================
timeout /t 3 >nul
exit /b 0
