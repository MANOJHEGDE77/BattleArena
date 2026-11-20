@echo off
setlocal enabledelayedexpansion
title Cyber Arena - AAA Standalone Desktop Client
cd /d "%~dp0"

echo =====================================================================
echo                CYBER ARENA - STANDALONE DESKTOP CLIENT
echo =====================================================================
echo.

:: Dedicated standalone flags: --app=http://127.0.0.1:4321/index.html --enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js was not detected in system PATH.
    echo Opening local game file directly in browser...
    start "" "%~dp0docs\index.html"
    pause
    exit /b 0
)

echo [1/2] Initializing lightweight game engine & Direct3D hardware acceleration...
echo [2/2] Launching dedicated borderless application window (--app mode)...
echo.
node "%~dp0scripts\launch_desktop_app.js"

if %errorlevel% neq 0 (
    echo.
    echo [Client] Session finished.
)
