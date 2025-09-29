@echo off
setlocal enabledelayedexpansion

REM Setup script for CloudWatch Logs utilities (Windows)
REM This script ensures all log management scripts have proper permissions

echo Setting up CloudWatch Logs management scripts...

REM Check if we're in the correct directory
if not exist "localstack-init" (
    echo ❌ Error: Please run this script from the project root directory
    echo Current directory: %CD%
    exit /b 1
)

REM Check if Git Bash or WSL is available for chmod
where bash >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Git Bash found, setting executable permissions...
    bash -c "chmod +x localstack-init/07-create-cloudwatch-logs.sh"
    bash -c "chmod +x devtools/scripts/stream-logs.sh"
    bash -c "chmod +x devtools/scripts/cleanup-logs.sh"
    bash -c "chmod +x devtools/scripts/log-manager.sh"
    echo ✅ Executable permissions set for Linux scripts
) else (
    echo ⚠️  Git Bash not found, skipping chmod (Linux scripts will work in Docker)
)

REM Verify script files exist
echo Verifying CloudWatch Logs script files...

set SCRIPTS_OK=true

if not exist "localstack-init\07-create-cloudwatch-logs.sh" (
    echo ❌ Missing: localstack-init\07-create-cloudwatch-logs.sh
    set SCRIPTS_OK=false
)

if not exist "devtools\scripts\create-cloudwatch-logs.bat" (
    echo ❌ Missing: devtools\scripts\create-cloudwatch-logs.bat
    set SCRIPTS_OK=false
)

if not exist "devtools\scripts\stream-logs.sh" (
    echo ❌ Missing: devtools\scripts\stream-logs.sh
    set SCRIPTS_OK=false
)

if not exist "devtools\scripts\stream-logs.ps1" (
    echo ❌ Missing: devtools\scripts\stream-logs.ps1
    set SCRIPTS_OK=false
)

if not exist "devtools\scripts\cleanup-logs.sh" (
    echo ❌ Missing: devtools\scripts\cleanup-logs.sh
    set SCRIPTS_OK=false
)

if not exist "devtools\scripts\cleanup-logs.ps1" (
    echo ❌ Missing: devtools\scripts\cleanup-logs.ps1
    set SCRIPTS_OK=false
)

if not exist "devtools\scripts\log-manager.sh" (
    echo ❌ Missing: devtools\scripts\log-manager.sh
    set SCRIPTS_OK=false
)

if "!SCRIPTS_OK!"=="false" (
    echo ❌ Some CloudWatch Logs scripts are missing
    exit /b 1
)

echo ✅ All CloudWatch Logs scripts are present

REM Create shortcuts for easy access
echo Creating Windows shortcuts for log management...

REM Create a batch file for easy log streaming
echo @echo off > devtools\scripts\stream-logs.bat
echo echo Starting CloudWatch Logs streaming utility... >> devtools\scripts\stream-logs.bat
echo powershell -ExecutionPolicy Bypass -File "%%~dp0stream-logs.ps1" %%* >> devtools\scripts\stream-logs.bat

REM Create a batch file for easy log cleanup
echo @echo off > devtools\scripts\cleanup-logs.bat
echo echo Starting CloudWatch Logs cleanup utility... >> devtools\scripts\cleanup-logs.bat
echo powershell -ExecutionPolicy Bypass -File "%%~dp0cleanup-logs.ps1" %%* >> devtools\scripts\cleanup-logs.bat

echo ✅ Windows shortcuts created:
echo   - devtools\scripts\stream-logs.bat
echo   - devtools\scripts\cleanup-logs.bat

REM Test LocalStack connectivity (if running)
echo Testing LocalStack connectivity...
curl -s http://localhost:4566/_localstack/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ LocalStack is running and accessible
    
    REM Test CloudWatch Logs service
    for /f "tokens=*" %%i in ('curl -s http://localhost:4566/_localstack/health') do set HEALTH_RESPONSE=%%i
    echo !HEALTH_RESPONSE! | findstr /C:"logs" >nul
    if !errorlevel! equ 0 (
        echo ✅ CloudWatch Logs service is available
    ) else (
        echo ⚠️  CloudWatch Logs service may not be enabled
        echo   Make sure 'logs' is included in LOCALSTACK_SERVICES
    )
) else (
    echo ⚠️  LocalStack is not running
    echo   Start LocalStack to test CloudWatch Logs integration
)

echo.
echo 📝 CloudWatch Logs Integration Setup Complete!
echo.
echo Usage Examples:
echo   Windows PowerShell:
echo     .\devtools\scripts\stream-logs.ps1 -List
echo     .\devtools\scripts\stream-logs.ps1 -LogGroup "/aws/lambda/api-handler"
echo     .\devtools\scripts\cleanup-logs.ps1 -Report
echo.
echo   Windows Batch (shortcuts):
echo     .\devtools\scripts\stream-logs.bat -List
echo     .\devtools\scripts\cleanup-logs.bat -Report
echo.
echo   Linux/Docker:
echo     ./devtools/scripts/log-manager.sh list
echo     ./devtools/scripts/log-manager.sh stream /aws/lambda/api-handler
echo     ./devtools/scripts/log-manager.sh cleanup
echo.

endlocal