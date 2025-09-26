#!/bin/bash

# DynamoDB Table Creation Script for LocalStack
# This script creates the tattoo directory table with the same schema as production
# Enhanced with DynamoDB Streams for real-time data synchronization

echo "Creating DynamoDB table with Streams: tattoo-directory-local"

# Create the main table with primary key, GSIs, and DynamoDB Streams enabled
awslocal dynamodb create-table \
    --table-name tattoo-directory-local \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=gsi1pk,AttributeType=S \
        AttributeName=gsi1sk,AttributeType=S \
        AttributeName=gsi2pk,AttributeType=S \
        AttributeName=gsi2sk,AttributeType=S \
        AttributeName=gsi3pk,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        'IndexName=style-geohash-index,KeySchema=[{AttributeName=gsi1pk,KeyType=HASH},{AttributeName=gsi1sk,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
        'IndexName=artist-name-index,KeySchema=[{AttributeName=gsi2pk,KeyType=HASH},{AttributeName=gsi2sk,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
        'IndexName=instagram-index,KeySchema=[{AttributeName=gsi3pk,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
    --region eu-west-2

# Wait for table to be created
echo "Waiting for table to be active..."
awslocal dynamodb wait table-exists --table-name tattoo-directory-local --region eu-west-2

# Verify table creation and stream configuration
echo "Verifying table creation and stream configuration..."
TABLE_STATUS=$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.TableStatus' --output text)
STREAM_STATUS=$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.StreamSpecification.StreamEnabled' --output text)
STREAM_ARN=$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.LatestStreamArn' --output text)

echo "Table Status: $TABLE_STATUS"
echo "Stream Enabled: $STREAM_STATUS"
echo "Stream ARN: $STREAM_ARN"

if [ "$STREAM_STATUS" = "True" ] && [ "$STREAM_ARN" != "None" ]; then
    echo "✅ DynamoDB table 'tattoo-directory-local' created successfully with Streams enabled!"
    echo "📊 Stream ARN: $STREAM_ARN"
    
    # Export stream ARN for use in Lambda trigger setup
    export DYNAMODB_STREAM_ARN="$STREAM_ARN"
    echo "DYNAMODB_STREAM_ARN=$STREAM_ARN" >> /tmp/localstack-exports.env
else
    echo "❌ Failed to enable DynamoDB Streams"
    exit 1
fi