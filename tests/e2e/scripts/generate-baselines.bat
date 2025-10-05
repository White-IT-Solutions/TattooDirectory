@echo off
setlocal enabledelayedexpansion

echo 🎯 Generating visual regression baselines...

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not available
    exit /b 1
)

REM Navigate to e2e test directory
cd /d "%~dp0\.."

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        exit /b 1
    )
)

REM Run baseline generation script
echo 📸 Running baseline generation...
node scripts/generate-baselines.js

if errorlevel 1 (
    echo ❌ Baseline generation failed
    exit /b 1
)

echo ✅ Baseline generation completed successfully
exit /b 0