#!/bin/bash

# API Gateway Creation Script for LocalStack
# This script creates a REST API Gateway for the tattoo directory

echo "Creating API Gateway for tattoo directory..."

# Create REST API
API_ID=$(awslocal apigateway create-rest-api \
    --name "tattoo-directory-local" \
    --description "Local API Gateway for Tattoo Directory" \
    --region eu-west-2 \
    --query 'id' \
    --output text)

echo "Created API Gateway with ID: $API_ID"

# Get root resource ID
ROOT_RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id $API_ID \
    --region eu-west-2 \
    --query 'items[0].id' \
    --output text)

echo "Root resource ID: $ROOT_RESOURCE_ID"

# Create /v1 resource
V1_RESOURCE_ID=$(awslocal apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part "v1" \
    --region eu-west-2 \
    --query 'id' \
    --output text)

echo "Created /v1 resource with ID: $V1_RESOURCE_ID"

# Create /v1/artists resource
ARTISTS_RESOURCE_ID=$(awslocal apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $V1_RESOURCE_ID \
    --path-part "artists" \
    --region eu-west-2 \
    --query 'id' \
    --output text)

echo "Created /v1/artists resource with ID: $ARTISTS_RESOURCE_ID"

# Create /v1/artists/{artistId} resource
ARTIST_ID_RESOURCE_ID=$(awslocal apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ARTISTS_RESOURCE_ID \
    --path-part "{artistId}" \
    --region eu-west-2 \
    --query 'id' \
    --output text)

echo "Created /v1/artists/{artistId} resource with ID: $ARTIST_ID_RESOURCE_ID"

# Create /v1/search resource
SEARCH_RESOURCE_ID=$(awslocal apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $V1_RESOURCE_ID \
    --path-part "search" \
    --region eu-west-2 \
    --query 'id' \
    --output text)

echo "Created /v1/search resource with ID: $SEARCH_RESOURCE_ID"

# Add GET method to /v1/artists
awslocal apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $ARTISTS_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region eu-west-2

# Add GET method to /v1/artists/{artistId}
awslocal apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $ARTIST_ID_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region eu-west-2

# Add GET method to /v1/search
awslocal apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $SEARCH_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region eu-west-2

# Create deployment
DEPLOYMENT_ID=$(awslocal apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name "local" \
    --stage-description "Local development stage" \
    --description "Initial deployment for local testing" \
    --region eu-west-2 \
    --query 'id' \
    --output text)

echo "Created deployment with ID: $DEPLOYMENT_ID"

# Get API Gateway URL
API_URL="http://localhost:4566/restapis/$API_ID/local/_user_request_"
echo "API Gateway URL: $API_URL"

# Save API configuration to file for reference
cat > /tmp/api-gateway-config.json << EOF
{
    "apiId": "$API_ID",
    "rootResourceId": "$ROOT_RESOURCE_ID",
    "v1ResourceId": "$V1_RESOURCE_ID",
    "artistsResourceId": "$ARTISTS_RESOURCE_ID",
    "artistIdResourceId": "$ARTIST_ID_RESOURCE_ID",
    "searchResourceId": "$SEARCH_RESOURCE_ID",
    "deploymentId": "$DEPLOYMENT_ID",
    "apiUrl": "$API_URL"
}
EOF

echo "API Gateway configuration saved to /tmp/api-gateway-config.json"
echo "API Gateway created successfully!"