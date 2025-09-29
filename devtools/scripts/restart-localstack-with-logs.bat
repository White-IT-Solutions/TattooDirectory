@echo off
setlocal enabledelayedexpansion

REM Restart LocalStack with CloudWatch Logs support
REM This script stops and restarts LocalStack with the correct services configuration

echo Restarting LocalStack with CloudWatch Logs support...

REM Check if LocalStack is running
docker ps | findstr "tattoo-directory-localstack" >nul
if %errorlevel% equ 0 (
    echo Stopping current LocalStack container...
    docker-compose -f devtools\docker\docker-compose.local.yml stop localstack
    
    echo Removing LocalStack container...
    docker-compose -f devtools\docker\docker-compose.local.yml rm -f localstack
) else (
    echo LocalStack container is not running
)

REM Verify the services configuration in .env.local
echo Checking services configuration...
findstr "LOCALSTACK_PHASE1_SERVICES" devtools\.env.local
if %errorlevel% neq 0 (
    echo ❌ LOCALSTACK_PHASE1_SERVICES not found in .env.local
    exit /b 1
)

REM Start LocalStack with Phase 1 profile (includes logs service)
echo Starting LocalStack with Phase 1 services (includes CloudWatch Logs)...
docker-compose -f devtools\docker\docker-compose.local.yml --profile phase1 up -d localstack

REM Wait for LocalStack to be ready
echo Waiting for LocalStack to start...
timeout /t 10 /nobreak >nul

REM Check if LocalStack is healthy
echo Checking LocalStack health...
:health_check
curl -s http://localhost:4566/_localstack/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting for LocalStack to be ready...
    timeout /t 5 /nobreak >nul
    goto health_check
)

echo ✅ LocalStack is running

REM Verify CloudWatch Logs service is now available
echo Verifying CloudWatch Logs service...
docker exec tattoo-directory-localstack curl -s http://localhost:4566/_localstack/health | findstr "logs" >temp_logs_status.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to check logs service status
    exit /b 1
)

set /p LOGS_STATUS=<temp_logs_status.txt
del temp_logs_status.txt >nul 2>&1

echo Logs service status: %LOGS_STATUS%

if "%LOGS_STATUS%"=="" (
    echo ❌ CloudWatch Logs service is still not available
    echo Current services:
    docker exec tattoo-directory-localstack env | findstr SERVICES
    exit /b 1
)

echo ✅ CloudWatch Logs service is now available

REM Initialize CloudWatch Logs
echo Initializing CloudWatch Logs...
call .\devtools\scripts\create-cloudwatch-logs.bat

REM Run the test to verify everything is working
echo Running CloudWatch Logs integration test...
call .\devtools\scripts\test-cloudwatch-logs.bat

echo.
echo 🎉 LocalStack restart completed!
echo CloudWatch Logs integration is now ready for use.
echo.

endlocal