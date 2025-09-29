@echo off
setlocal enabledelayedexpansion

echo Starting LocalStack configuration validation...
echo.

REM Check prerequisites
aws --version >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS CLI is required but not installed
    exit /b 1
)

curl --version >nul 2>&1
if errorlevel 1 (
    echo ❌ curl is required but not installed
    exit /b 1
)

set "failed_checks=0"

REM Check environment configuration
echo ℹ️  Checking environment configuration...
if exist "devtools\.env.local" (
    echo ✅ Environment file exists: devtools\.env.local
) else (
    echo ❌ Missing environment file: devtools\.env.local
    set /a failed_checks+=1
)

if exist "devtools\localstack-config\localstack.conf" (
    echo ✅ LocalStack config exists: devtools\localstack-config\localstack.conf
) else (
    echo ❌ Missing LocalStack config: devtools\localstack-config\localstack.conf
    set /a failed_checks+=1
)

if exist "devtools\localstack-config\services.json" (
    echo ✅ Services config exists: devtools\localstack-config\services.json
) else (
    echo ❌ Missing services config: devtools\localstack-config\services.json
    set /a failed_checks+=1
)

echo.

REM Check data persistence directories
echo ℹ️  Checking data persistence configuration...
if exist "devtools\localstack-data" (
    echo ✅ Directory exists: devtools\localstack-data
) else (
    echo ❌ Missing directory: devtools\localstack-data
    set /a failed_checks+=1
)

if exist "devtools\localstack-logs" (
    echo ✅ Directory exists: devtools\localstack-logs
) else (
    echo ❌ Missing directory: devtools\localstack-logs
    set /a failed_checks+=1
)

if exist "devtools\localstack-tmp" (
    echo ✅ Directory exists: devtools\localstack-tmp
) else (
    echo ❌ Missing directory: devtools\localstack-tmp
    set /a failed_checks+=1
)

echo.

REM Check LocalStack health
echo ℹ️  Checking LocalStack health...
set "max_attempts=30"
set "attempt=1"

:health_check_loop
curl -s -f "http://localhost:4566/_localstack/health" >nul 2>&1
if not errorlevel 1 (
    echo ✅ LocalStack is healthy
    goto :health_check_done
)

echo ℹ️  Attempt !attempt!/!max_attempts! - waiting for LocalStack...
timeout /t 2 >nul
set /a attempt+=1
if !attempt! leq !max_attempts! goto :health_check_loop

echo ❌ LocalStack health check failed after !max_attempts! attempts
set /a failed_checks+=1
goto :skip_service_checks

:health_check_done
echo.

REM Check Phase 1 services
echo ℹ️  Validating Phase 1 services...

echo ℹ️  Checking DynamoDB...
aws --endpoint-url=http://localhost:4566 dynamodb list-tables --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ DynamoDB is accessible
) else (
    echo ❌ DynamoDB check failed
    set /a failed_checks+=1
)

echo ℹ️  Checking S3...
aws --endpoint-url=http://localhost:4566 s3 ls --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ S3 is accessible
) else (
    echo ❌ S3 check failed
    set /a failed_checks+=1
)

echo ℹ️  Checking API Gateway...
aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ API Gateway is accessible
) else (
    echo ❌ API Gateway check failed
    set /a failed_checks+=1
)

echo ℹ️  Checking Lambda...
aws --endpoint-url=http://localhost:4566 lambda list-functions --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ Lambda is accessible
) else (
    echo ❌ Lambda check failed
    set /a failed_checks+=1
)

echo ℹ️  Checking CloudWatch Logs...
aws --endpoint-url=http://localhost:4566 logs describe-log-groups --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ CloudWatch Logs is accessible
) else (
    echo ❌ CloudWatch Logs check failed
    set /a failed_checks+=1
)

echo ℹ️  Checking SNS...
aws --endpoint-url=http://localhost:4566 sns list-topics --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ SNS is accessible
) else (
    echo ❌ SNS check failed
    set /a failed_checks+=1
)

echo.

REM Check Phase 2 services (optional)
echo ℹ️  Validating Phase 2 services (optional)...

echo ℹ️  Checking SQS...
aws --endpoint-url=http://localhost:4566 sqs list-queues --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ SQS is accessible
) else (
    echo ⚠️  SQS check failed ^(may not be running^)
)

echo ℹ️  Checking EventBridge...
aws --endpoint-url=http://localhost:4566 events list-rules --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ EventBridge is accessible
) else (
    echo ⚠️  EventBridge check failed ^(may not be running^)
)

echo ℹ️  Checking CloudWatch Metrics...
aws --endpoint-url=http://localhost:4566 cloudwatch list-metrics --region eu-west-2 >nul 2>&1
if not errorlevel 1 (
    echo ✅ CloudWatch Metrics is accessible
) else (
    echo ⚠️  CloudWatch Metrics check failed ^(may not be running^)
)

:skip_service_checks
echo.

REM Summary
if !failed_checks! equ 0 (
    echo ✨ All validation checks passed!
    echo ℹ️  Enhanced LocalStack configuration is working correctly
    exit /b 0
) else (
    echo ❌ !failed_checks! validation check^(s^) failed
    echo ℹ️  Please review the errors above and fix the configuration
    exit /b 1
)