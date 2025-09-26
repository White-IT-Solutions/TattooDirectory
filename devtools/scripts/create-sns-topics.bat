@echo off
setlocal enabledelayedexpansion

REM SNS Topics Creation Script for Enhanced LocalStack Infrastructure (Windows)
REM Creates SNS topics for takedown requests, system alerts, and admin notifications
REM Requirements: 1.3, 4.1, 4.2, 4.3, 4.5

echo Starting SNS topics creation for Enhanced LocalStack Infrastructure...

REM Configuration
set AWS_ENDPOINT_URL=http://localhost:4566
set AWS_REGION=us-east-1

REM SNS Topic Names
set TAKEDOWN_TOPIC_NAME=TakedownRequests
set SYSTEM_ALERTS_TOPIC_NAME=SystemAlerts
set ADMIN_NOTIFICATIONS_TOPIC_NAME=AdminNotifications

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is required but not available
    echo 💡 Please start Docker Desktop
    exit /b 1
)

REM Check if LocalStack is running
echo ℹ️  Checking LocalStack availability...
curl -s %AWS_ENDPOINT_URL%/_localstack/health >nul 2>&1
if errorlevel 1 (
    echo ❌ LocalStack is not running
    echo 💡 Please start LocalStack first: npm run local:start
    exit /b 1
)

echo ✅ LocalStack is ready

REM Create CloudWatch Log Groups
echo ℹ️  Creating CloudWatch Log Groups...
awslocal logs create-log-group --log-group-name "/aws/lambda/takedown-notification-handler" --retention-in-days 7 >nul 2>&1
awslocal logs create-log-group --log-group-name "/aws/lambda/system-alert-handler" --retention-in-days 7 >nul 2>&1
awslocal logs create-log-group --log-group-name "/aws/lambda/admin-notification-handler" --retention-in-days 7 >nul 2>&1
echo ✅ CloudWatch Log Groups created

REM Create SNS Topics
echo ℹ️  Creating SNS topics...

REM Create takedown requests topic
echo ℹ️  Creating SNS topic: %TAKEDOWN_TOPIC_NAME%
for /f "tokens=*" %%i in ('awslocal sns create-topic --name %TAKEDOWN_TOPIC_NAME% --attributes DisplayName="Artist takedown requests and content removal notifications" --query TopicArn --output text 2^>nul') do set TAKEDOWN_ARN=%%i
if defined TAKEDOWN_ARN (
    echo ✅ Created SNS topic: %TAKEDOWN_TOPIC_NAME% ^(ARN: !TAKEDOWN_ARN!^)
) else (
    echo ❌ Failed to create SNS topic: %TAKEDOWN_TOPIC_NAME%
    exit /b 1
)

REM Create system alerts topic
echo ℹ️  Creating SNS topic: %SYSTEM_ALERTS_TOPIC_NAME%
for /f "tokens=*" %%i in ('awslocal sns create-topic --name %SYSTEM_ALERTS_TOPIC_NAME% --attributes DisplayName="System alerts and monitoring notifications" --query TopicArn --output text 2^>nul') do set ALERT_ARN=%%i
if defined ALERT_ARN (
    echo ✅ Created SNS topic: %SYSTEM_ALERTS_TOPIC_NAME% ^(ARN: !ALERT_ARN!^)
) else (
    echo ❌ Failed to create SNS topic: %SYSTEM_ALERTS_TOPIC_NAME%
    exit /b 1
)

REM Create admin notifications topic
echo ℹ️  Creating SNS topic: %ADMIN_NOTIFICATIONS_TOPIC_NAME%
for /f "tokens=*" %%i in ('awslocal sns create-topic --name %ADMIN_NOTIFICATIONS_TOPIC_NAME% --attributes DisplayName="Administrative notifications and system updates" --query TopicArn --output text 2^>nul') do set ADMIN_ARN=%%i
if defined ADMIN_ARN (
    echo ✅ Created SNS topic: %ADMIN_NOTIFICATIONS_TOPIC_NAME% ^(ARN: !ADMIN_ARN!^)
) else (
    echo ❌ Failed to create SNS topic: %ADMIN_NOTIFICATIONS_TOPIC_NAME%
    exit /b 1
)

REM Create Lambda functions and subscriptions
echo ℹ️  Creating Lambda notification handlers...

REM Call the Linux script for Lambda creation (it handles the complex Lambda deployment)
echo ℹ️  Delegating Lambda creation to Linux script...
docker-compose exec localstack bash -c "cd /etc/localstack/init/ready.d && ./08-create-sns-topics.sh"

if errorlevel 1 (
    echo ❌ Failed to create Lambda handlers
    exit /b 1
)

REM Test SNS topics
echo ℹ️  Testing SNS topics...

REM Test takedown request
awslocal sns publish --topic-arn "%TAKEDOWN_ARN%" --message "{\"type\":\"takedown\",\"artistId\":\"test-artist-123\",\"message\":\"Test takedown request\",\"timestamp\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z\",\"metadata\":{\"reason\":\"test\",\"requestedBy\":\"system\"}}" --subject "Test Takedown Request" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Test message sent to takedown topic
) else (
    echo ⚠️  Failed to send test message to takedown topic
)

REM Test system alert
awslocal sns publish --topic-arn "%ALERT_ARN%" --message "{\"type\":\"alert\",\"message\":\"Test system alert\",\"timestamp\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z\",\"severity\":\"INFO\",\"metadata\":{\"component\":\"sns-test\"}}" --subject "Test System Alert" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Test message sent to system alerts topic
) else (
    echo ⚠️  Failed to send test message to system alerts topic
)

REM Test admin notification
awslocal sns publish --topic-arn "%ADMIN_ARN%" --message "{\"type\":\"admin\",\"message\":\"Test admin notification\",\"timestamp\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z\",\"metadata\":{\"priority\":\"normal\"}}" --subject "Test Admin Notification" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Test message sent to admin notifications topic
) else (
    echo ⚠️  Failed to send test message to admin notifications topic
)

echo ✅ SNS notification system setup completed successfully!
echo ℹ️  Created topics:
echo   - %TAKEDOWN_TOPIC_NAME%: Artist takedown requests
echo   - %SYSTEM_ALERTS_TOPIC_NAME%: System alerts and monitoring
echo   - %ADMIN_NOTIFICATIONS_TOPIC_NAME%: Administrative notifications
echo.
echo ℹ️  Created Lambda handlers:
echo   - takedown-notification-handler: Processes takedown requests
echo   - system-alert-handler: Processes system alerts
echo   - admin-notification-handler: Processes admin notifications

endlocal
exit /b 0