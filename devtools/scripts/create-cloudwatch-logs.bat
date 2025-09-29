@echo off
setlocal enabledelayedexpansion

REM CloudWatch Logs Configuration Script for LocalStack (Windows)
REM This script creates log groups for all Lambda functions and API Gateway
REM with proper retention policies for local development

echo Creating CloudWatch Logs configuration...

REM Define log retention period (7 days for local development)
if not defined CLOUDWATCH_LOGS_RETENTION_DAYS set CLOUDWATCH_LOGS_RETENTION_DAYS=7

REM Function to create log group with retention policy using Docker
:create_log_group
set log_group_name=%1
set description=%2

echo Creating log group: %log_group_name%

REM Create log group using Docker exec
docker exec tattoo-directory-localstack awslocal logs create-log-group --log-group-name %log_group_name% --region eu-west-2 2>nul || echo Log group %log_group_name% already exists

REM Set retention policy
docker exec tattoo-directory-localstack awslocal logs put-retention-policy --log-group-name %log_group_name% --retention-in-days %CLOUDWATCH_LOGS_RETENTION_DAYS% --region eu-west-2

REM Add tags for identification
docker exec tattoo-directory-localstack awslocal logs tag-log-group --log-group-name %log_group_name% --tags "Environment=local,Project=tattoo-directory,Description=%description%" --region eu-west-2 2>nul

echo ✅ Log group %log_group_name% created with %CLOUDWATCH_LOGS_RETENTION_DAYS% day retention
goto :eof

REM Lambda Function Log Groups
echo Creating Lambda function log groups...

call :create_log_group "/aws/lambda/api-handler" "Main API Gateway handler for artist directory endpoints"
call :create_log_group "/aws/lambda/dynamodb-sync" "DynamoDB to OpenSearch synchronization handler"
call :create_log_group "/aws/lambda/discover-studios" "Studio discovery and data aggregation handler"
call :create_log_group "/aws/lambda/find-artists" "Artist search and filtering handler"
call :create_log_group "/aws/lambda/queue-scraping" "Scraping job queue management handler"
call :create_log_group "/aws/lambda/secret-rotation" "AWS Secrets Manager rotation handler"
call :create_log_group "/aws/lambda/rotate-nat-gateway-eip" "NAT Gateway EIP rotation handler"

REM API Gateway Log Groups
echo Creating API Gateway log groups...
call :create_log_group "/aws/apigateway/tattoo-directory-api" "API Gateway access and execution logs"
call :create_log_group "/aws/apigateway/tattoo-directory-api/access" "API Gateway access logs"
call :create_log_group "/aws/apigateway/tattoo-directory-api/execution" "API Gateway execution logs"

REM System and Infrastructure Log Groups
echo Creating system log groups...
call :create_log_group "/aws/lambda/system-health" "System health monitoring and alerts"
call :create_log_group "/aws/lambda/log-cleanup" "Automated log cleanup and maintenance"
call :create_log_group "/tattoo-directory/application" "Application-level logs and events"
call :create_log_group "/tattoo-directory/data-sync" "Data synchronization monitoring"
call :create_log_group "/tattoo-directory/notifications" "SNS notification processing logs"

REM Phase 2 Lambda functions (for future use)
echo Creating Phase 2 log groups...
call :create_log_group "/aws/lambda/workflow-coordinator" "Step Functions alternative workflow coordination"
call :create_log_group "/aws/lambda/scraping-processor" "ECS/Fargate alternative scraping processor"
call :create_log_group "/aws/lambda/queue-monitor" "SQS queue monitoring and management"
call :create_log_group "/aws/lambda/event-processor" "EventBridge event processing handler"

REM Verify log groups creation
echo Verifying log groups creation...
docker exec tattoo-directory-localstack awslocal logs describe-log-groups --region eu-west-2 --query "logGroups[].logGroupName" --output text > temp_log_groups.txt

if exist temp_log_groups.txt (
    echo ✅ Successfully created CloudWatch Log Groups:
    for /f "tokens=*" %%i in (temp_log_groups.txt) do echo   - %%i
    
    REM Count total log groups
    for /f %%i in ('type temp_log_groups.txt ^| find /c /v ""') do set LOG_GROUP_COUNT=%%i
    echo.
    echo 📊 Total log groups created: !LOG_GROUP_COUNT!
    echo 🕒 Log retention period: %CLOUDWATCH_LOGS_RETENTION_DAYS% days
    
    REM Export log configuration for other scripts
    echo CLOUDWATCH_LOGS_CONFIGURED=true >> temp_localstack_exports.env
    echo CLOUDWATCH_LOGS_RETENTION_DAYS=%CLOUDWATCH_LOGS_RETENTION_DAYS% >> temp_localstack_exports.env
    
    REM Create log group list for cleanup scripts
    copy temp_log_groups.txt cloudwatch_log_groups.txt >nul
    del temp_log_groups.txt
    
) else (
    echo ❌ Failed to create CloudWatch Log Groups
    exit /b 1
)

echo 🔍 CloudWatch Logs are now configured for real-time debugging and monitoring
echo 📝 Use 'awslocal logs tail ^<log-group-name^> --follow' to stream logs in real-time
echo.

endlocal