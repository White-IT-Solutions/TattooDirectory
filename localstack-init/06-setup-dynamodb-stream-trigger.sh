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

# Create Lambda function for DynamoDB sync if it doesn't exist
FUNCTION_NAME="dynamodb-sync-handler"
echo "Creating Lambda function: $FUNCTION_NAME"

# Create a simple deployment package for the sync handler
mkdir -p /tmp/lambda-deployment
cat > /tmp/lambda-deployment/index.js << 'EOF'
// DynamoDB Stream Handler for LocalStack
// This is a placeholder - the actual handler code is mounted from the backend volume

exports.handler = async (event, context) => {
    console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));
    
    // Import the actual handler from the mounted volume
    try {
        const { handler: actualHandler } = await import('/opt/code/localstack/lambda-code/handlers/dynamodb-sync/index.js');
        return await actualHandler(event, context);
    } catch (error) {
        console.error('Error importing handler:', error);
        throw error;
    }
};
EOF

# Create deployment package
cd /tmp/lambda-deployment
zip -r function.zip .

# Create or update Lambda function
awslocal lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --timeout 60 \
    --memory-size 256 \
    --environment Variables='{
        "OPENSEARCH_ENDPOINT":"http://localstack:4566",
        "APP_SECRETS_ARN":"arn:aws:secretsmanager:eu-west-2:000000000000:secret:tattoo-directory-secrets",
        "DYNAMODB_TABLE_NAME":"tattoo-directory-local",
        "AWS_ENDPOINT_URL":"http://localstack:4566",
        "NODE_ENV":"development"
    }' \
    --region eu-west-2 2>/dev/null || {
    
    echo "Function exists, updating code..."
    awslocal lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://function.zip \
        --region eu-west-2
}

# Wait for function to be ready
echo "Waiting for Lambda function to be ready..."
sleep 2

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

# Cleanup
rm -rf /tmp/lambda-deployment

echo "🎉 DynamoDB Stream processing is now active!"
echo "💡 Stream events will be processed by the dynamodb-sync-handler Lambda function"