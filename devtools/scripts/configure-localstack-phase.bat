@echo off
setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "DEVTOOLS_DIR=%SCRIPT_DIR%.."
set "ENV_FILE=%DEVTOOLS_DIR%\.env.local"

REM Function to display usage
if "%1"=="" goto :show_status
if "%1"=="help" goto :usage
if "%1"=="-h" goto :usage
if "%1"=="--help" goto :usage

if "%1"=="phase1" goto :configure_phase1
if "%1"=="phase2" goto :configure_phase2
if "%1"=="status" goto :show_status

echo ❌ Invalid command: %1
echo.
goto :usage

:usage
echo Usage: %~nx0 [phase1^|phase2^|status]
echo.
echo Commands:
echo   phase1  - Configure LocalStack for Phase 1 services (DynamoDB, OpenSearch, S3, API Gateway, Lambda, CloudWatch Logs, SNS)
echo   phase2  - Configure LocalStack for Phase 2 services (Phase 1 + SQS, EventBridge, CloudWatch Metrics)
echo   status  - Show current phase configuration
echo.
echo Examples:
echo   %~nx0 phase1    # Switch to Phase 1 configuration
echo   %~nx0 phase2    # Switch to Phase 2 configuration
echo   %~nx0 status    # Show current configuration
goto :end

:get_current_phase
set "CURRENT_PHASE=phase1"
if exist "%ENV_FILE%" (
    for /f "tokens=2 delims==" %%a in ('findstr "^LOCALSTACK_PHASE=" "%ENV_FILE%" 2^>nul') do set "CURRENT_PHASE=%%a"
)
goto :eof

:show_status
call :get_current_phase

echo ℹ️  Current LocalStack Configuration:
echo   Phase: !CURRENT_PHASE!

if "!CURRENT_PHASE!"=="phase1" (
    echo   Services: DynamoDB, OpenSearch, S3, API Gateway, Lambda, CloudWatch Logs, SNS
    echo   Profile: Default (no profile needed)
    echo   Memory: ~1.5GB
) else if "!CURRENT_PHASE!"=="phase2" (
    echo   Services: Phase 1 + SQS, EventBridge, CloudWatch Metrics
    echo   Profile: phase2
    echo   Memory: ~2GB
)

echo.
echo ℹ️  To start LocalStack:
if "!CURRENT_PHASE!"=="phase1" (
    echo   docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack
) else (
    echo   docker-compose -f devtools/docker/docker-compose.local.yml --profile phase2 up -d localstack-phase2
)
goto :end

:configure_phase1
call :configure_phase phase1
goto :end

:configure_phase2
call :configure_phase phase2
goto :end

:configure_phase
set "PHASE=%1"

if not exist "%ENV_FILE%" (
    echo ❌ Environment file not found: %ENV_FILE%
    exit /b 1
)

REM Update the phase in the environment file
powershell -Command "(Get-Content '%ENV_FILE%') -replace '^LOCALSTACK_PHASE=.*', 'LOCALSTACK_PHASE=%PHASE%' | Set-Content '%ENV_FILE%'"

REM If LOCALSTACK_PHASE doesn't exist, add it
findstr "^LOCALSTACK_PHASE=" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 (
    echo LOCALSTACK_PHASE=%PHASE% >> "%ENV_FILE%"
)

echo ✅ LocalStack configured for %PHASE%

REM Show updated status
call :show_status

REM Provide next steps
echo.
echo ℹ️  Next steps:
echo 1. Stop any running LocalStack containers:
echo    docker-compose -f devtools/docker/docker-compose.local.yml down
echo.
echo 2. Start LocalStack with new configuration:
if "%PHASE%"=="phase1" (
    echo    docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack
) else (
    echo    docker-compose -f devtools/docker/docker-compose.local.yml --profile phase2 up -d localstack-phase2
)
goto :eof

:end
pause