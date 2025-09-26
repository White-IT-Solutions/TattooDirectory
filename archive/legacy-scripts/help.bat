@echo off
setlocal enabledelayedexpansion

REM Unified Data Management - Help (Windows)
REM This script displays help information for data management commands

echo 📚 Data Management Help...
echo ========================

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    exit /b 1
)

REM Change to scripts directory
cd /d "%~dp0"

REM Execute the unified data CLI help
node data-cli.js help %*

REM Check exit code
if %errorlevel% neq 0 (
    echo ❌ Help command failed with error code %errorlevel%
    exit /b %errorlevel%
)

echo ✅ Help displayed successfully!