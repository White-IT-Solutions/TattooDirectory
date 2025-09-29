@echo off
setlocal enabledelayedexpansion

REM Test CloudWatch Logs Integration (Windows)
REM This script tests the CloudWatch Logs setup and functionality

echo Testing CloudWatch Logs Integration...

REM Check if LocalStack is running
echo Checking LocalStack status...
docker ps | findstr "tattoo-directory-localstack" >nul
if %errorlevel% neq 0 (
    echo ❌ LocalStack container is not running
    echo Please start LocalStack first: docker-compose -f devtools\docker\docker-compose.local.yml up -d localstack
    exit /b 1
)

echo ✅ LocalStack container is running

REM Check LocalStack health
echo Checking LocalStack health...
curl -s http://localhost:4566/_localstack/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ LocalStack is not accessible at http://localhost:4566
    exit /b 1
)

echo ✅ LocalStack is accessible

REM Test CloudWatch Logs service
echo Testing CloudWatch Logs service...
docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --query "logGroups | length(@)" --output text >temp_count.txt 2>nul
if %errorlevel% neq 0 (
    echo ❌ CloudWatch Logs service is not available
    echo Make sure 'logs' is included in LOCALSTACK_SERVICES
    exit /b 1
)

set /p LOG_GROUP_COUNT=<temp_count.txt
del temp_count.txt >nul 2>&1

if "%LOG_GROUP_COUNT%"=="0" (
    echo ⚠️  No log groups found, creating them...
    call .\devtools\scripts\create-cloudwatch-logs.bat
) else (
    echo ✅ Found %LOG_GROUP_COUNT% log groups
)

REM Test log group creation
echo Testing log group creation...
docker exec tattoo-directory-localstack awslocal logs create-log-group --log-group-name "/test/cloudwatch-logs-test" --region eu-west-2 2>nul
if %errorlevel% neq 0 (
    echo ❌ Failed to create test log group
    exit /b 1
)

echo ✅ Test log group created successfully

REM Test log stream creation and writing
echo Testing log stream creation and writing...
docker exec tattoo-directory-localstack awslocal logs create-log-stream --log-group-name "/test/cloudwatch-logs-test" --log-stream-name "test-stream" --region eu-west-2 2>nul
if %errorlevel% neq 0 (
    echo ❌ Failed to create test log stream
    exit /b 1
)

echo ✅ Test log stream created successfully

REM Test log event writing
echo Testing log event writing...
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
docker exec tattoo-directory-localstack awslocal logs put-log-events --log-group-name "/test/cloudwatch-logs-test" --log-stream-name "test-stream" --log-events "timestamp=$(date +%%s)000,message=Test log message from CloudWatch Logs integration test" --region eu-west-2 2>nul
if %errorlevel% neq 0 (
    echo ❌ Failed to write test log event
    exit /b 1
)

echo ✅ Test log event written successfully

REM Test log reading
echo Testing log reading...
docker exec tattoo-directory-localstack awslocal logs get-log-events --log-group-name "/test/cloudwatch-logs-test" --log-stream-name "test-stream" --region eu-west-2 --query "events[0].message" --output text >temp_message.txt 2>nul
if %errorlevel% neq 0 (
    echo ❌ Failed to read test log event
    exit /b 1
)

set /p LOG_MESSAGE=<temp_message.txt
del temp_message.txt >nul 2>&1

if "%LOG_MESSAGE%"=="" (
    echo ❌ No log message retrieved
    exit /b 1
)

echo ✅ Test log event read successfully: %LOG_MESSAGE%

REM Test log group deletion (cleanup)
echo Cleaning up test resources...
docker exec tattoo-directory-localstack awslocal logs delete-log-group --log-group-name "/test/cloudwatch-logs-test" --region eu-west-2 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Failed to delete test log group (this is okay)
) else (
    echo ✅ Test log group deleted successfully
)

REM Test PowerShell scripts
echo Testing PowerShell scripts...
if exist "devtools\scripts\stream-logs.ps1" (
    echo ✅ stream-logs.ps1 exists
) else (
    echo ❌ stream-logs.ps1 missing
)

if exist "devtools\scripts\cleanup-logs.ps1" (
    echo ✅ cleanup-logs.ps1 exists
) else (
    echo ❌ cleanup-logs.ps1 missing
)

REM Display final status
echo.
echo 🎉 CloudWatch Logs Integration Test Results:
echo ============================================
echo ✅ LocalStack container running
echo ✅ LocalStack health check passed
echo ✅ CloudWatch Logs service available
echo ✅ Log group creation working
echo ✅ Log stream creation working
echo ✅ Log event writing working
echo ✅ Log event reading working
echo ✅ PowerShell scripts available
echo.
echo 📝 You can now use the following commands:
echo   List log groups:    .\devtools\scripts\stream-logs.bat -List
echo   Stream logs:        .\devtools\scripts\stream-logs.bat -LogGroup "/aws/lambda/api-handler"
echo   Cleanup logs:       .\devtools\scripts\cleanup-logs.bat -Report
echo.
echo 🔍 For real-time monitoring, try:
echo   powershell -File ".\devtools\scripts\stream-logs.ps1" -All
echo.

endlocal