@echo off
echo ========================================
echo   NEPLANCER - Quick Start
echo ========================================
echo.

REM Check Prerequisites
echo Checking prerequisites...
call npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

call node --version
echo.
echo ✅ Node.js and npm are installed
echo.

REM Install Dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Start Development Server
echo ========================================
echo   Starting Development Server
echo ========================================
echo.
echo 📍 App will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
