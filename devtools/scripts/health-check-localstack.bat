@echo off
setlocal enabledelayedexpansion

REM LocalStack Service Health Monitoring Script (Windows Batch)
REM Basic health checks for LocalStack services

set "LOCALSTACK_ENDPOINT=http://localhost:4566"
set "COMMAND=%~1"
if "%COMMAND%"=="" set "COMMAND=check"

echo.
echo 🔍 LocalStack Service Health Monitor
echo ====================================

REM Check if awslocal is available
awslocal --version >nul 2>&1
if errorlevel 1 (
    echo ❌ awslocal command not found. Please install AWS CLI Local.
    exit /b 1
)

REM Function to check LocalStack core health
echo ℹ️  Checking LocalStack Core...
curl -s --max-time 10 "%LOCALSTACK_ENDPOINT%/health" >nul 2>&1
if errorlevel 1 (
    echo ❌ LocalStack Core: Unhealthy
    echo.
    echo 🔧 Recovery Instructions:
    echo   1. Check if LocalStack container is running: docker ps
    echo   2. Restart LocalStack: devtools\scripts\restart-localstack-with-logs.bat
    echo   3. Check LocalStack logs: docker logs localstack
    exit /b 1
) else (
    echo ✅ LocalStack Core: Healthy
)

REM Check individual services
echo ℹ️  Checking individual services...

REM DynamoDB
echo   Checking DynamoDB...
awslocal dynamodb list-tables --region eu-west-2 --output text >nul 2>&1
if errorlevel 1 (
    echo   ❌ DynamoDB: Unhealthy
    set /a "unhealthy_count+=1"
) else (
    echo   ✅ DynamoDB: Healthy
)

REM S3
echo   Checking S3...
awslocal s3 ls --region eu-west-2 >nul 2>&1
if errorlevel 1 (
    echo   ❌ S3: Unhealthy
    set /a "unhealthy_count+=1"
) else (
    echo   ✅ S3: Healthy
)

REM Lambda
echo   Checking Lambda...
awslocal lambda list-functions --region eu-west-2 --output text >nul 2>&1
if errorlevel 1 (
    echo   ❌ Lambda: Unhealthy
    set /a "unhealthy_count+=1"
) else (
    echo   ✅ Lambda: Healthy
)

REM API Gateway
echo   Checking API Gateway...
awslocal apigateway get-rest-apis --region eu-west-2 --output text >nul 2>&1
if errorlevel 1 (
    echo   ❌ API Gateway: Unhealthy
    set /a "unhealthy_count+=1"
) else (
    echo   ✅ API Gateway: Healthy
)

REM SNS
echo   Checking SNS...
awslocal sns list-topics --region eu-west-2 --output text >nul 2>&1
if errorlevel 1 (
    echo   ❌ SNS: Unhealthy
    set /a "unhealthy_count+=1"
) else (
    echo   ✅ SNS: Healthy
)

REM CloudWatch Logs
echo   Checking CloudWatch Logs...
awslocal logs describe-log-groups --region eu-west-2 --output text >nul 2>&1
if errorlevel 1 (
    echo   ❌ CloudWatch Logs: Unhealthy
    set /a "unhealthy_count+=1"
) else (
    echo   ✅ CloudWatch Logs: Healthy
)

echo.
echo 📊 Health Summary
echo =================

if "%unhealthy_count%"=="" set "unhealthy_count=0"
set /a "healthy_count=6-unhealthy_count"

echo Total Services: 6
echo Healthy: %healthy_count%
echo Unhealthy: %unhealthy_count%

if %unhealthy_count% equ 0 (
    echo ✅ All services are healthy!
    echo Health Score: 100%%
) else (
    echo ⚠️  Some services are unhealthy
    set /a "health_percentage=(healthy_count*100)/6"
    echo Health Score: !health_percentage!%%
    echo.
    echo 🔧 Recovery Instructions:
    echo   1. Restart LocalStack services: devtools\scripts\restart-localstack-with-logs.bat
    echo   2. Re-initialize services: devtools\scripts\init-localstack-services.ps1
    echo   3. Check service-specific logs in CloudWatch
    echo.
    echo For detailed troubleshooting, see: docs\TROUBLESHOOTING.md
)

echo.
if "%COMMAND%"=="monitor" (
    echo 🔄 Starting continuous monitoring...
    echo Press Ctrl+C to stop monitoring
    :monitor_loop
    timeout /t 30 /nobreak >nul
    echo.
    echo [%date% %time%] Checking health...
    call "%~f0" check
    goto monitor_loop
)

exit /b %unhealthy_count%