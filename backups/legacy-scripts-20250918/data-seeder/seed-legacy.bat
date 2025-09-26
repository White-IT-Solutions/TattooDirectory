@echo off

REM Legacy Seed Script Wrapper (Windows)
REM Maintains compatibility with existing workflows

echo ⚠️  DEPRECATION NOTICE: This script is deprecated
echo Please use: npm run setup-data
echo Running via compatibility layer...
echo.

REM Get script directory and change to parent scripts directory
cd /d "%~dp0\.."

REM Execute via backward compatibility layer
node backward-compatibility.js seed %*

REM Check exit code
if errorlevel 1 (
    echo ❌ Legacy seed operation failed
    exit /b 1
)

echo ✅ Legacy seed operation completed successfully