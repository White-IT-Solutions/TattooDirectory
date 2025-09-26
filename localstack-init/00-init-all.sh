#!/bin/bash

# Master initialization script for LocalStack
# This script runs all initialization scripts in the correct order

echo "=========================================="
echo "Initializing LocalStack for Tattoo Directory"
echo "=========================================="

# Wait for LocalStack to be fully ready
echo "Waiting for LocalStack to be ready..."
until curl -s http://localhost:4566/_localstack/health | grep -q '"dynamodb": "available"'; do
    echo "Waiting for LocalStack services..."
    sleep 2
done

echo "LocalStack is ready! Starting initialization..."

# Run initialization scripts in order
echo "Step 1: Creating DynamoDB table..."
/etc/localstack/init/ready.d/01-create-dynamodb-table.sh

echo "Step 2: Creating OpenSearch domain..."
/etc/localstack/init/ready.d/02-create-opensearch-domain.sh

echo "Step 3: Creating S3 buckets..."
/etc/localstack/init/ready.d/03-create-s3-buckets.sh

echo "Step 4: Creating API Gateway..."
/etc/localstack/init/ready.d/04-create-api-gateway.sh

echo "Step 5: Deploying Lambda function..."
/etc/localstack/init/ready.d/05-deploy-lambda.sh

echo "=========================================="
echo "LocalStack initialization completed!"
echo "=========================================="

# Display service endpoints
echo "Service endpoints:"
echo "- DynamoDB: http://localhost:4566"
echo "- OpenSearch: http://localhost:4566/tattoo-directory-local"
echo "- S3: http://localhost:4566"
echo "- API Gateway: Check /tmp/api-gateway-config.json for details"

echo "You can now start the backend and frontend services."