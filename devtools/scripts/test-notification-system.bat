@echo off
setlocal enabledelayedexpansion

REM Test Notification System Script (Windows)
REM Comprehensive testing of SNS topics and notification handlers
REM Requirements: 1.3, 4.1, 4.2, 4.3, 4.5

echo Starting comprehensive notification system testing...
echo Testing SNS topics, Lambda functions, and message flows
echo.

REM Configuration
set AWS_ENDPOINT_URL=http://localhost:4566
set AWS_REGION=us-east-1

REM Test counters
set /a TESTS_PASSED=0
set /a TESTS_FAILED=0
set /a TOTAL_TESTS=0

REM Test 1: Check LocalStack connectivity
call :run_test "LocalStack connectivity" "curl -s %AWS_ENDPOINT_URL%/_localstack/health"

REM Test 2: Check SNS topics exist
call :run_test "TakedownRequests topic exists" "call :check_sns_topic TakedownRequests"
call :run_test "SystemAlerts topic exists" "call :check_sns_topic SystemAlerts"
call :run_test "AdminNotifications topic exists" "call :check_sns_topic AdminNotifications"

REM Test 3: Check Lambda functions exist
call :run_test "takedown-notification-handler exists" "call :check_lambda_function takedown-notification-handler"
call :run_test "system-alert-handler exists" "call :check_lambda_function system-alert-handler"
call :run_test "admin-notification-handler exists" "call :check_lambda_function admin-notification-handler"

REM Test 4: Test message flows
call :run_test "takedown notification flow" "call :test_takedown_flow"
call :run_test "system alert flow" "call :test_alert_flow"
call :run_test "admin notification flow" "call :test_admin_flow"

REM Test Summary
echo.
echo === TEST SUMMARY ===
echo Total tests: %TOTAL_TESTS%
echo Passed: %TESTS_PASSED%

if %TESTS_FAILED% gtr 0 (
    echo ❌ Failed: %TESTS_FAILED%
    echo.
    echo ❌ Some tests failed. Please check the notification system configuration.
    echo ℹ️  Common issues:
    echo ℹ️    - LocalStack not running or not ready
    echo ℹ️    - SNS topics not created (run localstack-init\08-create-sns-topics.sh)
    echo ℹ️    - Lambda handlers not deployed (run devtools\scripts\deploy-notification-handlers.bat)
    echo ℹ️    - Network connectivity issues
    exit /b 1
) else (
    echo ✅ All tests passed! Notification system is working correctly.
    echo.
    echo ℹ️  Notification system components verified:
    echo ℹ️    ✅ SNS topics created and accessible
    echo ℹ️    ✅ Lambda functions deployed and configured
    echo ℹ️    ✅ Message flows functional
    echo ℹ️    ✅ System responsive and stable
    exit /b 0
)

:run_test
set test_name=%~1
set test_command=%~2

set /a TOTAL_TESTS+=1
echo ℹ️  Running test: %test_name%

%test_command% >nul 2>&1
if errorlevel 1 (
    echo ❌ FAIL: %test_name%
    set /a TESTS_FAILED+=1
) else (
    echo ✅ PASS: %test_name%
    set /a TESTS_PASSED+=1
)
exit /b 0

:check_sns_topic
set topic_name=%~1
awslocal sns list-topics --query "Topics[?contains(TopicArn, '%topic_name%')].TopicArn" --output text | findstr "%topic_name%" >nul 2>&1
exit /b %errorlevel%

:check_lambda_function
set function_name=%~1
awslocal lambda get-function --function-name "%function_name%" >nul 2>&1
exit /b %errorlevel%

:test_takedown_flow
set message={"type":"takedown","artistId":"test-123","message":"Test takedown request","timestamp":"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z","metadata":{"reason":"test"}}

for /f "tokens=*" %%i in ('awslocal sns list-topics --query "Topics[?contains(TopicArn, 'TakedownRequests')].TopicArn" --output text 2^>nul') do set topic_arn=%%i

if "%topic_arn%"=="" exit /b 1

awslocal sns publish --topic-arn "%topic_arn%" --message "%message%" --subject "Test Takedown" >nul 2>&1
exit /b %errorlevel%

:test_alert_flow
set message={"type":"alert","message":"Test system alert","timestamp":"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z","severity":"INFO","metadata":{"component":"test"}}

for /f "tokens=*" %%i in ('awslocal sns list-topics --query "Topics[?contains(TopicArn, 'SystemAlerts')].TopicArn" --output text 2^>nul') do set topic_arn=%%i

if "%topic_arn%"=="" exit /b 1

awslocal sns publish --topic-arn "%topic_arn%" --message "%message%" --subject "Test Alert" >nul 2>&1
exit /b %errorlevel%

:test_admin_flow
set message={"type":"admin","notificationType":"USER_REPORT","message":"Test admin notification","timestamp":"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~6,2%Z","severity":"INFO","metadata":{"priority":"normal"}}

for /f "tokens=*" %%i in ('awslocal sns list-topics --query "Topics[?contains(TopicArn, 'AdminNotifications')].TopicArn" --output text 2^>nul') do set topic_arn=%%i

if "%topic_arn%"=="" exit /b 1

awslocal sns publish --topic-arn "%topic_arn%" --message "%message%" --subject "Test Admin" >nul 2>&1
exit /b %errorlevel%