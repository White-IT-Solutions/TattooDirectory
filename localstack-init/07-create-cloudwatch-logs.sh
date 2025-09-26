#!/bin/bash

# CloudWatch Logs Configuration Script for LocalStack
# This script creates log groups for all Lambda functions and API Gateway
# with proper retention policies for local development

echo "Creating CloudWatch Logs configuration..."

# Define log retention period (7 days for local development)
LOG_RETENTION_DAYS=${CLOUDWATCH_LOGS_RETENTION_DAYS:-7}

# Function to create log group with retention policy
create_log_group() {
    local log_group_name=$1
    local description=$2
    
    echo "Creating log group: $log_group_name"
    
    # Create log group
    awslocal logs create-log-group \
        --log-group-name "$log_group_name" \
        --region eu-west-2 2>/dev/null || echo "Log group $log_group_name already exists"
    
    # Set retention policy
    awslocal logs put-retention-policy \
        --log-group-name "$log_group_name" \
        --retention-in-days "$LOG_RETENTION_DAYS" \
        --region eu-west-2
    
    # Add tags for identification
    awslocal logs tag-log-group \
        --log-group-name "$log_group_name" \
        --tags "Environment=local,Project=tattoo-directory,Description=$description" \
        --region eu-west-2 2>/dev/null || true
    
    echo "✅ Log group $log_group_name created with $LOG_RETENTION_DAYS day retention"
}

# Lambda Function Log Groups
echo "Creating Lambda function log groups..."

# Core Lambda functions
create_log_group "/aws/lambda/api-handler" "Main API Gateway handler for artist directory endpoints"
create_log_group "/aws/lambda/dynamodb-sync" "DynamoDB to OpenSearch synchronization handler"
create_log_group "/aws/lambda/discover-studios" "Studio discovery and data aggregation handler"
create_log_group "/aws/lambda/find-artists" "Artist search and filtering handler"
create_log_group "/aws/lambda/queue-scraping" "Scraping job queue management handler"
create_log_group "/aws/lambda/secret-rotation" "AWS Secrets Manager rotation handler"
create_log_group "/aws/lambda/rotate-nat-gateway-eip" "NAT Gateway EIP rotation handler"

# API Gateway Log Groups
echo "Creating API Gateway log groups..."
create_log_group "/aws/apigateway/tattoo-directory-api" "API Gateway access and execution logs"
create_log_group "/aws/apigateway/tattoo-directory-api/access" "API Gateway access logs"
create_log_group "/aws/apigateway/tattoo-directory-api/execution" "API Gateway execution logs"

# System and Infrastructure Log Groups
echo "Creating system log groups..."
create_log_group "/aws/lambda/system-health" "System health monitoring and alerts"
create_log_group "/aws/lambda/log-cleanup" "Automated log cleanup and maintenance"
create_log_group "/tattoo-directory/application" "Application-level logs and events"
create_log_group "/tattoo-directory/data-sync" "Data synchronization monitoring"
create_log_group "/tattoo-directory/notifications" "SNS notification processing logs"

# Phase 2 Lambda functions (for future use)
echo "Creating Phase 2 log groups..."
create_log_group "/aws/lambda/workflow-coordinator" "Step Functions alternative workflow coordination"
create_log_group "/aws/lambda/scraping-processor" "ECS/Fargate alternative scraping processor"
create_log_group "/aws/lambda/queue-monitor" "SQS queue monitoring and management"
create_log_group "/aws/lambda/event-processor" "EventBridge event processing handler"

# Verify log groups creation
echo "Verifying log groups creation..."
LOG_GROUPS=$(awslocal logs describe-log-groups --region eu-west-2 --query 'logGroups[].logGroupName' --output text)

if [ -n "$LOG_GROUPS" ]; then
    echo "✅ Successfully created CloudWatch Log Groups:"
    echo "$LOG_GROUPS" | tr '\t' '\n' | sort | sed 's/^/  - /'
    
    # Count total log groups
    LOG_GROUP_COUNT=$(echo "$LOG_GROUPS" | wc -w)
    echo ""
    echo "📊 Total log groups created: $LOG_GROUP_COUNT"
    echo "🕒 Log retention period: $LOG_RETENTION_DAYS days"
    
    # Export log configuration for other scripts
    echo "CLOUDWATCH_LOGS_CONFIGURED=true" >> /tmp/localstack-exports.env
    echo "CLOUDWATCH_LOGS_RETENTION_DAYS=$LOG_RETENTION_DAYS" >> /tmp/localstack-exports.env
    
    # Create log group list for cleanup scripts
    echo "$LOG_GROUPS" | tr '\t' '\n' > /tmp/cloudwatch-log-groups.txt
    
else
    echo "❌ Failed to create CloudWatch Log Groups"
    exit 1
fi

echo "🔍 CloudWatch Logs are now configured for real-time debugging and monitoring"
echo "📝 Use 'awslocal logs tail <log-group-name> --follow' to stream logs in real-time"
echo ""