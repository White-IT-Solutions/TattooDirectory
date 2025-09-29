#!/bin/bash

# DynamoDB Stream Lambda Trigger Setup Script for LocalStack
# This script creates the Lambda function and sets up the DynamoDB Stream trigger

echo "Setting up DynamoDB Stream Lambda trigger..."

# Source the stream ARN from table creation
if [ -f /tmp/localstack-exports.env ]; then
    source /tmp/localstack-exports.env
fi

# Check if stream ARN is available
if [ -z "$DYNAMODB_STREAM_ARN" ]; then
    echo "Getting DynamoDB Stream ARN..."
    DYNAMODB_STREAM_ARN=$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.LatestStreamArn' --output text)
fi

if [ -z "$DYNAMODB_STREAM_ARN" ] || [ "$DYNAMODB_STREAM_ARN" = "None" ]; then
    echo "❌ DynamoDB Stream ARN not found. Ensure table is created with streams enabled."
    exit 1
fi

echo "📊 Using Stream ARN: $DYNAMODB_STREAM_ARN"

# Get the sync handler function (should already exist from step 4)
FUNCTION_NAME="dynamodb-sync-handler"
echo "Checking for Lambda function: $FUNCTION_NAME"

# Verify function exists
awslocal lambda get-function --function-name "$FUNCTION_NAME" --region eu-west-2 > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Lambda function $FUNCTION_NAME not found. Please run 04-create-lambda-functions.sh first"
    exit 1
fi

echo "✅ Found Lambda function: $FUNCTION_NAME"

# Create event source mapping for DynamoDB Stream
echo "Creating DynamoDB Stream event source mapping..."
awslocal lambda create-event-source-mapping \
    --event-source-arn "$DYNAMODB_STREAM_ARN" \
    --function-name "$FUNCTION_NAME" \
    --starting-position LATEST \
    --batch-size 10 \
    --maximum-batching-window-in-seconds 5 \
    --parallelization-factor 1 \
    --region eu-west-2 2>/dev/null || {
    
    echo "Event source mapping may already exist, checking..."
    MAPPING_UUID=$(awslocal lambda list-event-source-mappings \
        --function-name "$FUNCTION_NAME" \
        --region eu-west-2 \
        --query 'EventSourceMappings[0].UUID' \
        --output text)
    
    if [ "$MAPPING_UUID" != "None" ] && [ -n "$MAPPING_UUID" ]; then
        echo "✅ Event source mapping already exists: $MAPPING_UUID"
    else
        echo "❌ Failed to create event source mapping"
        exit 1
    fi
}

# Verify the setup
echo "Verifying Lambda trigger setup..."
MAPPINGS=$(awslocal lambda list-event-source-mappings --function-name "$FUNCTION_NAME" --region eu-west-2)
MAPPING_COUNT=$(echo "$MAPPINGS" | jq '.EventSourceMappings | length')

if [ "$MAPPING_COUNT" -gt 0 ]; then
    echo "✅ DynamoDB Stream Lambda trigger setup completed successfully!"
    echo "📋 Event Source Mappings:"
    echo "$MAPPINGS" | jq '.EventSourceMappings[] | {UUID: .UUID, State: .State, EventSourceArn: .EventSourceArn}'
else
    echo "❌ No event source mappings found"
    exit 1
fi

echo "🎉 DynamoDB Stream processing is now active!"
echo "💡 Stream events will be processed by the dynamodb-sync-handler Lambda function"