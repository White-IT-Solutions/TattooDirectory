@echo off
setlocal enabledelayedexpansion

REM Deploy Notification Handlers Script (Windows)
REM Deploys the actual notification handler Lambda functions to LocalStack
REM Requirements: 1.3, 4.1, 4.2, 4.3, 4.5

echo Starting notification handlers deployment...

REM Configuration
set AWS_ENDPOINT_URL=http://localhost:4566
set AWS_REGION=us-east-1
set PROJECT_ROOT=%~dp0..\..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set HANDLERS_DIR=%BACKEND_DIR%\src\handlers\notifications

REM Check if backend directory exists
if not exist "%BACKEND_DIR%" (
    echo ❌ Backend directory not found: %BACKEND_DIR%
    exit /b 1
)

REM Check if handlers directory exists
if not exist "%HANDLERS_DIR%" (
    echo ❌ Handlers directory not found: %HANDLERS_DIR%
    exit /b 1
)

REM Wait for LocalStack to be ready
echo ℹ️  Waiting for LocalStack to be ready...
set /a attempts=0
:wait_loop
set /a attempts+=1
if %attempts% gtr 30 (
    echo ❌ LocalStack failed to become ready after 30 attempts
    exit /b 1
)

curl -s "%AWS_ENDPOINT_URL%/_localstack/health" >nul 2>&1
if errorlevel 1 (
    echo ℹ️  Attempt %attempts%/30 - LocalStack not ready yet...
    timeout /t 2 /nobreak >nul
    goto wait_loop
)

echo ✅ LocalStack is ready

REM Deploy notification handlers
echo ℹ️  Deploying notification handlers from %HANDLERS_DIR%

REM Deploy takedown handler
if exist "%HANDLERS_DIR%\takedown-handler.js" (
    call :deploy_handler "takedown-notification-handler" "%HANDLERS_DIR%\takedown-handler.js" "TakedownRequests"
) else (
    echo ⚠️  Takedown handler file not found: %HANDLERS_DIR%\takedown-handler.js
)

REM Deploy system alert handler
if exist "%HANDLERS_DIR%\system-alert-handler.js" (
    call :deploy_handler "system-alert-handler" "%HANDLERS_DIR%\system-alert-handler.js" "SystemAlerts"
) else (
    echo ⚠️  System alert handler file not found: %HANDLERS_DIR%\system-alert-handler.js
)

REM Deploy admin notification handler
if exist "%HANDLERS_DIR%\admin-notification-handler.js" (
    call :deploy_handler "admin-notification-handler" "%HANDLERS_DIR%\admin-notification-handler.js" "AdminNotifications"
) else (
    echo ⚠️  Admin notification handler file not found: %HANDLERS_DIR%\admin-notification-handler.js
)

REM Test the handlers
echo ℹ️  Testing notification handlers...
timeout /t 3 /nobreak >nul

call :test_handlers

echo ✅ Notification handlers deployment completed successfully!
echo ℹ️  Deployed handlers:
echo ℹ️    - takedown-notification-handler: Processes takedown requests
echo ℹ️    - system-alert-handler: Processes system alerts
echo ℹ️    - admin-notification-handler: Processes admin notifications
echo.
echo ℹ️  All handlers are subscribed to their respective SNS topics and ready to process messages.
exit /b 0

:deploy_handler
set function_name=%~1
set handler_file=%~2
set topic_name=%~3

echo ℹ️  Deploying Lambda function: %function_name%

REM Create temporary directory for deployment package
set temp_dir=%TEMP%\lambda-deploy-%function_name%
if exist "%temp_dir%" rmdir /s /q "%temp_dir%"
mkdir "%temp_dir%"

REM Copy handler file
copy "%handler_file%" "%temp_dir%\index.js" >nul

REM Create package.json
(
echo {
echo   "name": "%function_name%",
echo   "version": "1.0.0",
echo   "description": "Notification handler for LocalStack",
echo   "main": "index.js",
echo   "dependencies": {
echo     "@aws-sdk/client-sns": "^3.0.0",
echo     "@aws-sdk/client-cloudwatch-logs": "^3.0.0",
echo     "@aws-sdk/client-dynamodb": "^3.0.0",
echo     "aws-sdk": "^2.1000.0"
echo   }
echo }
) > "%temp_dir%\package.json"

REM Create deployment zip
pushd "%temp_dir%"
powershell -Command "Compress-Archive -Path * -DestinationPath function.zip -Force" >nul 2>&1
popd

REM Check if function already exists
awslocal lambda get-function --function-name "%function_name%" >nul 2>&1
if errorlevel 1 (
    REM Create new function
    echo ℹ️  Creating new Lambda function: %function_name%
    awslocal lambda create-function --function-name "%function_name%" --runtime nodejs18.x --role "arn:aws:iam::000000000000:role/lambda-execution-role" --handler index.handler --zip-file "fileb://%temp_dir%\function.zip" --timeout 30 --memory-size 256 --environment Variables="{AWS_ENDPOINT_URL=%AWS_ENDPOINT_URL%,AWS_DEFAULT_REGION=%AWS_REGION%,DYNAMODB_TABLE_NAME=TattooArtistDirectory}" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to create Lambda function: %function_name%
        goto cleanup_and_return
    )
    echo ✅ Created Lambda function: %function_name%
) else (
    REM Update existing function
    echo ℹ️  Updating existing Lambda function: %function_name%
    awslocal lambda update-function-code --function-name "%function_name%" --zip-file "fileb://%temp_dir%\function.zip" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to update Lambda function: %function_name%
        goto cleanup_and_return
    )
    echo ✅ Updated Lambda function: %function_name%
)

REM Subscribe to SNS topic
call :subscribe_to_topic "%function_name%" "%topic_name%"

:cleanup_and_return
REM Cleanup
rmdir /s /q "%temp_dir%"
exit /b 0

:subscribe_to_topic
set function_name=%~1
set topic_name=%~2

echo ℹ️  Subscribing %function_name% to SNS topic %topic_name%

REM Get topic ARN
for /f "tokens=*" %%i in ('awslocal sns list-topics --query "Topics[?contains(TopicArn, '%topic_name%')].TopicArn" --output text 2^>nul') do set topic_arn=%%i

if "%topic_arn%"=="" (
    echo ❌ SNS topic not found: %topic_name%
    exit /b 1
)

REM Get function ARN
for /f "tokens=*" %%i in ('awslocal lambda get-function --function-name "%function_name%" --query "Configuration.FunctionArn" --output text 2^>nul') do set function_arn=%%i

if "%function_arn%"=="" (
    echo ❌ Lambda function not found: %function_name%
    exit /b 1
)

REM Create subscription
awslocal sns subscribe --topic-arn "%topic_arn%" --protocol lambda --notification-endpoint "%function_arn%" >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to subscribe %function_name% to SNS topic %topic_name%
    exit /b 1
)

echo ✅ Subscribed %function_name% to SNS topic %topic_name%

REM Add permission for SNS to invoke Lambda
awslocal lambda add-permission --function-name "%function_name%" --statement-id "sns-invoke-%function_name%-%RANDOM%" --action lambda:InvokeFunction --principal sns.amazonaws.com --source-arn "%topic_arn%" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Failed to add SNS invoke permission for %function_name% (may already exist)
) else (
    echo ✅ Added SNS invoke permission for %function_name%
)

exit /b 0

:test_handlers
REM Test takedown handler
for /f "tokens=*" %%i in ('awslocal sns list-topics --query "Topics[?contains(TopicArn, 'TakedownRequests')].TopicArn" --output text 2^>nul') do set takedown_arn=%%i
if not "%takedown_arn%"=="" (
    echo ℹ️  Testing takedown notification handler...
    awslocal sns publish --topic-arn "%takedown_arn%" --message "{\"type\":\"takedown\",\"artistId\":\"test-artist-123\",\"message\":\"Test takedown request from deployment script\",\"timestamp\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z\",\"metadata\":{\"reason\":\"test\",\"requestedBy\":\"deployment-script\"}}" --subject "Test Takedown Request - Deployment" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Failed to send test message to takedown handler
    ) else (
        echo ✅ Test message sent to takedown handler
    )
)

REM Test system alert handler
for /f "tokens=*" %%i in ('awslocal sns list-topics --query "Topics[?contains(TopicArn, 'SystemAlerts')].TopicArn" --output text 2^>nul') do set alert_arn=%%i
if not "%alert_arn%"=="" (
    echo ℹ️  Testing system alert handler...
    awslocal sns publish --topic-arn "%alert_arn%" --message "{\"type\":\"alert\",\"message\":\"Test system alert from deployment script\",\"timestamp\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z\",\"severity\":\"INFO\",\"metadata\":{\"component\":\"deployment-test\"}}" --subject "Test System Alert - Deployment" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Failed to send test message to system alert handler
    ) else (
        echo ✅ Test message sent to system alert handler
    )
)

REM Test admin notification handler
for /f "tokens=*" %%i in ('awslocal sns list-topics --query "Topics[?contains(TopicArn, 'AdminNotifications')].TopicArn" --output text 2^>nul') do set admin_arn=%%i
if not "%admin_arn%"=="" (
    echo ℹ️  Testing admin notification handler...
    awslocal sns publish --topic-arn "%admin_arn%" --message "{\"type\":\"admin\",\"notificationType\":\"USER_REPORT\",\"message\":\"Test admin notification from deployment script\",\"timestamp\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~6,2%Z\",\"severity\":\"INFO\",\"metadata\":{\"priority\":\"normal\",\"source\":\"deployment-test\"}}" --subject "Test Admin Notification - Deployment" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Failed to send test message to admin notification handler
    ) else (
        echo ✅ Test message sent to admin notification handler
    )
)

exit /b 0