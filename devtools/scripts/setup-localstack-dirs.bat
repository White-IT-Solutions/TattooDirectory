@echo off
setlocal enabledelayedexpansion

echo Setting up LocalStack directory structure...

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "DEVTOOLS_DIR=%SCRIPT_DIR%.."
set "PROJECT_ROOT=%DEVTOOLS_DIR%\.."

REM Create LocalStack data directories
set "LOCALSTACK_DATA_DIR=%DEVTOOLS_DIR%\localstack-data"
set "LOCALSTACK_LOGS_DIR=%DEVTOOLS_DIR%\localstack-logs"

REM Create directories if they don't exist
if not exist "%LOCALSTACK_DATA_DIR%" (
    mkdir "%LOCALSTACK_DATA_DIR%"
    echo ✅ Created LocalStack data directory: %LOCALSTACK_DATA_DIR%
) else (
    echo ℹ️  LocalStack data directory already exists: %LOCALSTACK_DATA_DIR%
)

if not exist "%LOCALSTACK_LOGS_DIR%" (
    mkdir "%LOCALSTACK_LOGS_DIR%"
    echo ✅ Created LocalStack logs directory: %LOCALSTACK_LOGS_DIR%
) else (
    echo ℹ️  LocalStack logs directory already exists: %LOCALSTACK_LOGS_DIR%
)

echo ✅ LocalStack directory structure setup complete!

echo.
echo Directory structure:
echo   📁 %LOCALSTACK_DATA_DIR% (LocalStack persistent data)
echo   📁 %LOCALSTACK_LOGS_DIR% (LocalStack logs)

echo.
echo ℹ️  You can now start LocalStack with: docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack

pause