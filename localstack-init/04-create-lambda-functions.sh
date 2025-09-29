#!/bin/bash

# Lambda Functions Creation Script for LocalStack
# This script creates and deploys all Lambda functions for the tattoo directory

echo "Creating Lambda functions for tattoo directory..."

# Set variables
LAMBDA_SOURCE_DIR="/etc/localstack/init/ready.d/../../backend/src"
TEMP_DIR="/tmp/lambda-deployments"

# Create temp directory for Lambda packages
mkdir -p "$TEMP_DIR"

# Function to create Lambda deployment package
create_lambda_package() {
    local function_name=$1
    local handler_path=$2
    local zip_file="$TEMP_DIR/${function_name}.zip"
    
    echo "Creating deployment package for $function_name..."
    
    # Create a temporary directory for this function
    local temp_function_dir="$TEMP_DIR/$function_name"
    mkdir -p "$temp_function_dir"
    
    # Copy source files
    cp -r "$LAMBDA_SOURCE_DIR"/* "$temp_function_dir/"
    
    # Install dependencies if package.json exists
    if [ -f "$temp_function_dir/package.json" ]; then
        echo "Installing dependencies for $function_name..."
        cd "$temp_function_dir"
        npm install --production --silent
        cd - > /dev/null
    fi
    
    # Create zip file
    cd "$temp_function_dir"
    zip -r "$zip_file" . -x "*.git*" "*.test.js" "__tests__/*" "coverage/*" "*.md" > /dev/null
    cd - > /dev/null
    
    echo "Package created: $zip_file"
    echo "$zip_file"
}

# Function to create Lambda function
create_lambda_function() {
    local function_name=$1
    local handler=$2
    local zip_file=$3
    local description=$4
    
    echo "Creating Lambda function: $function_name"
    
    awslocal lambda create-function \
        --function-name "$function_name" \
        --runtime nodejs18.x \
        --role arn:aws:iam::000000000000:role/lambda-execution-role \
        --handler "$handler" \
        --zip-file fileb://"$zip_file" \
        --description "$description" \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables="{
            AWS_ENDPOINT_URL=http://localstack:4566,
            OPENSEARCH_ENDPOINT=http://localstack:4566,
            DYNAMODB_TABLE_NAME=tattoo-directory-local,
            NODE_ENV=development,
            AWS_REGION=eu-west-2
        }" \
        --region eu-west-2 > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Created Lambda function: $function_name"
    else
        echo "❌ Failed to create Lambda function: $function_name"
        return 1
    fi
}

# Create IAM role for Lambda execution (if not exists)
echo "Creating Lambda execution role..."
awslocal iam create-role \
    --role-name lambda-execution-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' \
    --region eu-west-2 > /dev/null 2>&1

# Attach basic execution policy
awslocal iam attach-role-policy \
    --role-name lambda-execution-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region eu-west-2 > /dev/null 2>&1

# Create and attach DynamoDB policy
awslocal iam put-role-policy \
    --role-name lambda-execution-role \
    --policy-name DynamoDBAccess \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": "*"
            }
        ]
    }' \
    --region eu-west-2 > /dev/null 2>&1

echo "Lambda execution role configured"

# Create Lambda functions
echo "Creating Lambda deployment packages..."

# 1. Main API Handler
api_zip=$(create_lambda_package "tattoo-directory-api" "handlers/api-handler")
create_lambda_function "tattoo-directory-api" "handlers/api-handler/index.handler" "$api_zip" "Main API handler for tattoo directory"

# 2. DynamoDB Sync Handler
sync_zip=$(create_lambda_package "dynamodb-sync-handler" "handlers/dynamodb-sync")
create_lambda_function "dynamodb-sync-handler" "handlers/dynamodb-sync/index.handler" "$sync_zip" "DynamoDB to OpenSearch sync handler"

# 3. Admin Notification Handler
admin_zip=$(create_lambda_package "admin-notification-handler" "handlers/notifications")
create_lambda_function "admin-notification-handler" "handlers/notifications/admin-notification-handler.handler" "$admin_zip" "Admin notification handler"

# 4. System Alert Handler
alert_zip=$(create_lambda_package "system-alert-handler" "handlers/notifications")
create_lambda_function "system-alert-handler" "handlers/notifications/system-alert-handler.handler" "$alert_zip" "System alert handler"

# 5. Takedown Handler
takedown_zip=$(create_lambda_package "takedown-handler" "handlers/notifications")
create_lambda_function "takedown-handler" "handlers/notifications/takedown-handler.handler" "$takedown_zip" "Takedown request handler"

# Save Lambda configuration
cat > /tmp/lambda-functions-config.json << EOF
{
    "functions": {
        "api": {
            "name": "tattoo-directory-api",
            "handler": "handlers/api-handler/index.handler",
            "description": "Main API handler for tattoo directory"
        },
        "sync": {
            "name": "dynamodb-sync-handler", 
            "handler": "handlers/dynamodb-sync/index.handler",
            "description": "DynamoDB to OpenSearch sync handler"
        },
        "adminNotification": {
            "name": "admin-notification-handler",
            "handler": "handlers/notifications/admin-notification-handler.handler",
            "description": "Admin notification handler"
        },
        "systemAlert": {
            "name": "system-alert-handler",
            "handler": "handlers/notifications/system-alert-handler.handler", 
            "description": "System alert handler"
        },
        "takedown": {
            "name": "takedown-handler",
            "handler": "handlers/notifications/takedown-handler.handler",
            "description": "Takedown request handler"
        }
    },
    "role": "arn:aws:iam::000000000000:role/lambda-execution-role"
}
EOF

echo "Lambda functions configuration saved to /tmp/lambda-functions-config.json"

# Clean up temporary files
rm -rf "$TEMP_DIR"

echo "✅ All Lambda functions created successfully!"

# List created functions
echo "Created Lambda functions:"
awslocal lambda list-functions \
    --region eu-west-2 \
    --query 'Functions[].FunctionName' \
    --output table