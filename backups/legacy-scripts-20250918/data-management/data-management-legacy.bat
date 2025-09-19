@echo off

REM Legacy Data Management Script Wrapper (Windows)
REM Maintains compatibility with existing workflows

echo ⚠️  DEPRECATION NOTICE: This script is deprecated
echo Please use the new npm commands (npm run setup-data, npm run reset-data, etc.)
echo Running via compatibility layer...
echo.

REM Get script directory and change to parent scripts directory
cd /d "%~dp0\.."

REM Execute via backward compatibility layer
node backward-compatibility.js data-management %*

REM Check exit code
if errorlevel 1 (
    echo ❌ Legacy data management operation failed
    exit /b 1
)

echo ✅ Legacy data management operation completed successfully