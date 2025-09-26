#!/bin/bash

# DynamoDB Table Creation Script for LocalStack
# This script creates the tattoo directory table with the same schema as production

echo "Creating DynamoDB table: tattoo-directory-local"

# Create the main table with primary key and GSIs
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
    --region eu-west-2

# Wait for table to be created
echo "Waiting for table to be active..."
awslocal dynamodb wait table-exists --table-name tattoo-directory-local --region eu-west-2

# Verify table creation
echo "Verifying table creation..."
awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.TableStatus'

echo "DynamoDB table 'tattoo-directory-local' created successfully!"