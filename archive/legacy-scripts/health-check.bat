@echo off
setlocal enabledelayedexpansion

REM Unified Data Management - Health Check (Windows)
REM This script checks service connectivity and health

echo 🏥 Checking service health...
echo ===========================

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    exit /b 1
)

REM Change to scripts directory
cd /d "%~dp0"

REM Execute the unified data CLI
node data-cli.js health-check %*

REM Check exit code
if %errorlevel% neq 0 (
    echo ❌ Health check failed with error code %errorlevel%
    exit /b %errorlevel%
)

echo ✅ Health check completed successfully!