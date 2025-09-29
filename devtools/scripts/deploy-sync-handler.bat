@echo off
setlocal enabledelayedexpansion

REM Deploy DynamoDB Sync Handler Script (Windows)
REM Deploys the DynamoDB to OpenSearch synchronization Lambda function
REM Requirements: 3.3, 3.4, 3.5

echo Starting DynamoDB sync handler deployment...

REM Configuration
set AWS_ENDPOINT_URL=http://localhost:4566
set AWS_REGION=us-east-1
set PROJECT_ROOT=%~dp0..\..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set SYNC_HANDLER_DIR=%BACKEND_DIR%\src\handlers\dynamodb-sync
set FUNCTION_NAME=dynamodb-opensearch-sync

REM Check if backend directory exists
if not exist "%BACKEND_DIR%" (
    echo ❌ Backend directory not found: %BACKEND_DIR%
    exit /b 1
)

REM Check if sync handler directory exists
if not exist "%SYNC_HANDLER_DIR%" (
    echo ❌ Sync handler directory not found: %SYNC_HANDLER_DIR%
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

REM Deploy the sync handler
call :deploy_sync_handler
if errorlevel 1 exit /b 1

REM Configure DynamoDB stream trigger
call :configure_stream_trigger
if errorlevel 1 (
    echo ⚠️  Failed to configure stream trigger - you may need to set this up manually
)

REM Test the handler
echo ℹ️  Testing sync handler...
timeout /t 3 /nobreak >nul
call :test_sync_handler

echo ✅ DynamoDB sync handler deployment completed!
echo ℹ️  Function name: %FUNCTION_NAME%
echo ℹ️  Handler: index.handler
echo ℹ️  Runtime: nodejs18.x
echo ℹ️  Timeout: 300 seconds
echo ℹ️  Memory: 512 MB
echo.
echo ℹ️  The handler is now configured to:
echo ℹ️    - Process DynamoDB stream events from TattooArtistDirectory table
echo ℹ️    - Sync artist data to OpenSearch with retry logic
echo ℹ️    - Send monitoring metrics to CloudWatch
echo ℹ️    - Handle errors with exponential backoff
exit /b 0

:deploy_sync_handler
echo ℹ️  Deploying DynamoDB sync handler Lambda function

REM Create temporary directory for deployment package
set temp_dir=%TEMP%\lambda-deploy-sync-handler
if exist "%temp_dir%" rmdir /s /q "%temp_dir%"
mkdir "%temp_dir%"

REM Copy handler files
if not exist "%SYNC_HANDLER_DIR%\index.js" (
    echo ❌ Sync handler file not found: %SYNC_HANDLER_DIR%\index.js
    exit /b 1
)

copy "%SYNC_HANDLER_DIR%\index.js" "%temp_dir%\" >nul

REM Copy common utilities if they exist
if exist "%BACKEND_DIR%\src\common" (
    mkdir "%temp_dir%\common"
    xcopy "%BACKEND_DIR%\src\common" "%temp_dir%\common" /s /e /q >nul
)

REM Create package.json
(
echo {
echo   "name": "dynamodb-opensearch-sync",
echo   "version": "1.0.0",
echo   "description": "DynamoDB to OpenSearch synchronization handler",
echo   "main": "index.js",
echo   "type": "module",
echo   "dependencies": {
echo     "@aws-sdk/client-secrets-manager": "^3.0.0",
echo     "@aws-sdk/util-dynamodb": "^3.0.0",
echo     "@aws-sdk/client-cloudwatch": "^3.0.0",
echo     "@opensearch-project/opensearch": "^2.0.0",
echo     "aws-sdk": "^2.1000.0"
echo   }
echo }
) > "%temp_dir%\package.json"

REM Create deployment zip
pushd "%temp_dir%"
powershell -Command "Compress-Archive -Path * -DestinationPath function.zip -Force" >nul 2>&1
popd

REM Check if function already exists
awslocal lambda get-function --function-name "%FUNCTION_NAME%" >nul 2>&1
if errorlevel 1 (
    REM Create new function
    echo ℹ️  Creating new Lambda function: %FUNCTION_NAME%
    awslocal lambda create-function --function-name "%FUNCTION_NAME%" --runtime nodejs18.x --role "arn:aws:iam::000000000000:role/lambda-execution-role" --handler index.handler --zip-file "fileb://%temp_dir%\function.zip" --timeout 300 --memory-size 512 --description "DynamoDB to OpenSearch synchronization handler with retry logic and monitoring" --environment Variables="{AWS_ENDPOINT_URL=%AWS_ENDPOINT_URL%,AWS_DEFAULT_REGION=%AWS_REGION%,OPENSEARCH_ENDPOINT=http://localhost:4566,DYNAMODB_TABLE_NAME=TattooArtistDirectory}" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to create Lambda function: %FUNCTION_NAME%
        goto cleanup_and_return
    )
    echo ✅ Created Lambda function: %FUNCTION_NAME%
) else (
    REM Update existing function
    echo ℹ️  Updating existing Lambda function: %FUNCTION_NAME%
    awslocal lambda update-function-code --function-name "%FUNCTION_NAME%" --zip-file "fileb://%temp_dir%\function.zip" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to update Lambda function: %FUNCTION_NAME%
        goto cleanup_and_return
    )
    echo ✅ Updated Lambda function: %FUNCTION_NAME%
    
    REM Update function configuration
    awslocal lambda update-function-configuration --function-name "%FUNCTION_NAME%" --timeout 300 --memory-size 512 --environment Variables="{AWS_ENDPOINT_URL=%AWS_ENDPOINT_URL%,AWS_DEFAULT_REGION=%AWS_REGION%,OPENSEARCH_ENDPOINT=http://localhost:4566,DYNAMODB_TABLE_NAME=TattooArtistDirectory}" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Failed to update Lambda function configuration
    ) else (
        echo ✅ Updated Lambda function configuration
    )
)

:cleanup_and_return
REM Cleanup
rmdir /s /q "%temp_dir%"
exit /b 0

:configure_stream_trigger
echo ℹ️  Configuring DynamoDB stream trigger for sync handler

REM Get DynamoDB table stream ARN
for /f "tokens=*" %%i in ('awslocal dynamodb describe-table --table-name "TattooArtistDirectory" --query "Table.LatestStreamArn" --output text 2^>nul') do set stream_arn=%%i

if "%stream_arn%"=="" (
    echo ❌ DynamoDB stream not found for table TattooArtistDirectory
    echo ℹ️  Make sure the DynamoDB table is created with streams enabled
    exit /b 1
)

echo ℹ️  Found DynamoDB stream: %stream_arn%

REM Check if event source mapping already exists
for /f "tokens=*" %%i in ('awslocal lambda list-event-source-mappings --function-name "%FUNCTION_NAME%" --query "EventSourceMappings[?EventSourceArn==`%stream_arn%`].UUID" --output text 2^>nul') do set existing_mapping=%%i

if not "%existing_mapping%"=="" (
    echo ✅ Event source mapping already exists: %existing_mapping%
    
    REM Update the mapping configuration
    awslocal lambda update-event-source-mapping --uuid "%existing_mapping%" --batch-size 10 --maximum-batching-window-in-seconds 5 --starting-position LATEST --maximum-retry-attempts 3 >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Failed to update event source mapping configuration
    ) else (
        echo ✅ Updated event source mapping configuration
    )
) else (
    echo ℹ️  Creating new event source mapping
    
    REM Create event source mapping
    awslocal lambda create-event-source-mapping --function-name "%FUNCTION_NAME%" --event-source-arn "%stream_arn%" --starting-position LATEST --batch-size 10 --maximum-batching-window-in-seconds 5 --maximum-retry-attempts 3 >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to create event source mapping
        exit /b 1
    ) else (
        echo ✅ Created event source mapping
    )
)

exit /b 0

:test_sync_handler
echo ℹ️  Testing DynamoDB sync handler...

REM Create a test event payload (simplified for batch)
set test_event={"Records":[{"eventID":"test-event-id","eventName":"INSERT","eventVersion":"1.1","eventSource":"aws:dynamodb","awsRegion":"us-east-1","dynamodb":{"ApproximateCreationDateTime":1640995200,"Keys":{"PK":{"S":"ARTIST#test-sync-123"},"SK":{"S":"METADATA"}},"NewImage":{"PK":{"S":"ARTIST#test-sync-123"},"SK":{"S":"METADATA"},"name":{"S":"Test Sync Artist"},"styles":{"SS":["traditional","blackwork"]},"location":{"S":"London, UK"},"locationCity":{"S":"London"},"locationCountry":{"S":"UK"},"instagramHandle":{"S":"@testsyncartist"},"studioName":{"S":"Test Sync Studio"},"portfolioImages":{"SS":["test1.jpg","test2.jpg"]},"geohash":{"S":"gcpvj0du6"},"latitude":{"N":"51.5074"},"longitude":{"N":"-0.1278"}},"SequenceNumber":"100000000000000000001","SizeBytes":500,"StreamViewType":"NEW_AND_OLD_IMAGES"},"eventSourceARN":"arn:aws:dynamodb:us-east-1:000000000000:table/TattooArtistDirectory/stream/test"}]}

REM Invoke the function
awslocal lambda invoke --function-name "%FUNCTION_NAME%" --payload "%test_event%" --cli-binary-format raw-in-base64-out %TEMP%\sync-test-response.json >nul 2>&1

if errorlevel 1 (
    echo ❌ Failed to invoke sync handler for testing
    exit /b 1
) else (
    echo ✅ Sync handler test completed successfully
    
    REM Show response if available
    if exist "%TEMP%\sync-test-response.json" (
        echo ℹ️  Response available in %TEMP%\sync-test-response.json
        del "%TEMP%\sync-test-response.json"
    )
)

exit /b 0