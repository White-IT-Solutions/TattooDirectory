#!/bin/bash

# Lambda Deployment Script for LocalStack
# This script packages and deploys the Lambda function to LocalStack

echo "Deploying Lambda function to LocalStack..."

# Set variables
FUNCTION_NAME="tattoo-directory-api"
LAMBDA_ZIP="/tmp/lambda-function.zip"
LAMBDA_SOURCE_DIR="/etc/localstack/init/ready.d/../../backend/src"

# Create deployment package
echo "Creating Lambda deployment package..."
cd "$LAMBDA_SOURCE_DIR"

# Install dependencies if needed (for LocalStack)
if [ ! -d "node_modules" ]; then
    echo "Installing Lambda dependencies..."
    npm install --production
fi

# Create zip file
zip -r "$LAMBDA_ZIP" . -x "*.git*" "*.test.js" "__tests__/*" "coverage/*" "*.md"

echo "Lambda package created: $LAMBDA_ZIP"

# Create Lambda function
echo "Creating Lambda function: $FUNCTION_NAME"
awslocal lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs18.x \
    --role arn:aws:iam::000000000000:role/lambda-execution-role \
    --handler handlers/api-handler/index.handler \
    --zip-file fileb://"$LAMBDA_ZIP" \
    --environment Variables="{
        AWS_ENDPOINT_URL=http://localstack:4566,
        OPENSEARCH_ENDPOINT=http://localstack:4566,
        DYNAMODB_TABLE_NAME=tattoo-directory-local,
        NODE_ENV=development
    }" \
    --region eu-west-2

echo "Lambda function created successfully"

# Get the Lambda function ARN
LAMBDA_ARN=$(awslocal lambda get-function \
    --function-name "$FUNCTION_NAME" \
    --region eu-west-2 \
    --query 'Configuration.FunctionArn' \
    --output text)

echo "Lambda ARN: $LAMBDA_ARN"

# Now integrate with API Gateway
echo "Integrating Lambda with API Gateway..."

# Get the API Gateway ID (assuming it was created by previous script)
API_ID=$(awslocal apigateway get-rest-apis \
    --region eu-west-2 \
    --query 'items[?name==`tattoo-directory-local`].id' \
    --output text)

if [ -z "$API_ID" ]; then
    echo "Error: API Gateway not found. Please run 04-create-api-gateway.sh first"
    exit 1
fi

echo "Found API Gateway ID: $API_ID"

# Get resource IDs
ARTISTS_RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region eu-west-2 \
    --query 'items[?path==`/v1/artists`].id' \
    --output text)

ARTIST_ID_RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region eu-west-2 \
    --query 'items[?path==`/v1/artists/{artistId}`].id' \
    --output text)

SEARCH_RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region eu-west-2 \
    --query 'items[?path==`/v1/search`].id' \
    --output text)

echo "Resource IDs - Artists: $ARTISTS_RESOURCE_ID, ArtistId: $ARTIST_ID_RESOURCE_ID, Search: $SEARCH_RESOURCE_ID"

# Create Lambda integrations for each endpoint
echo "Creating Lambda integrations..."

# Integration for /v1/artists GET
awslocal apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$ARTISTS_RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region eu-west-2

# Integration for /v1/artists/{artistId} GET
awslocal apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$ARTIST_ID_RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region eu-west-2

# Integration for /v1/search GET (reuse same Lambda)
awslocal apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$SEARCH_RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region eu-west-2

# Add integration responses
echo "Adding integration responses..."

# Integration response for /v1/artists GET
awslocal apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$ARTISTS_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --region eu-west-2

# Integration response for /v1/artists/{artistId} GET
awslocal apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$ARTIST_ID_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --region eu-west-2

# Integration response for /v1/search GET
awslocal apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$SEARCH_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --region eu-west-2

# Add method responses
echo "Adding method responses..."

# Method response for /v1/artists GET
awslocal apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$ARTISTS_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --region eu-west-2

# Method response for /v1/artists/{artistId} GET
awslocal apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$ARTIST_ID_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --region eu-west-2

# Method response for /v1/search GET
awslocal apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$SEARCH_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --region eu-west-2

# Grant API Gateway permission to invoke Lambda
echo "Granting API Gateway permission to invoke Lambda..."
awslocal lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigateway-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:eu-west-2:000000000000:$API_ID/*/*" \
    --region eu-west-2

# Create new deployment to activate the integrations
echo "Creating new deployment..."
DEPLOYMENT_ID=$(awslocal apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "local" \
    --stage-description "Local development stage with Lambda integration" \
    --description "Deployment with Lambda integrations" \
    --region eu-west-2 \
    --query 'id' \
    --output text)

echo "Created deployment with ID: $DEPLOYMENT_ID"

# Get API Gateway URL
API_URL="http://localhost:4566/restapis/$API_ID/local/_user_request_"
echo "API Gateway URL: $API_URL"

# Save configuration
cat > /tmp/lambda-api-config.json << EOF
{
    "functionName": "$FUNCTION_NAME",
    "functionArn": "$LAMBDA_ARN",
    "apiId": "$API_ID",
    "deploymentId": "$DEPLOYMENT_ID",
    "apiUrl": "$API_URL"
}
EOF

echo "Lambda deployment configuration saved to /tmp/lambda-api-config.json"
echo "Lambda function deployed and integrated with API Gateway successfully!"

# Test the deployment
echo "Testing Lambda deployment..."
awslocal lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{"rawPath":"/v1/artists","requestContext":{"http":{"method":"GET"},"requestId":"test-123"},"queryStringParameters":null}' \
    --region eu-west-2 \
    /tmp/lambda-test-response.json

echo "Lambda test response:"
cat /tmp/lambda-test-response.json