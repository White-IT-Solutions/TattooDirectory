#!/bin/bash

# Deploy DynamoDB Sync Handler Script
# Deploys the DynamoDB to OpenSearch synchronization Lambda function
# Requirements: 3.3, 3.4, 3.5

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
AWS_ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
SYNC_HANDLER_DIR="$BACKEND_DIR/src/handlers/dynamodb-sync"
FUNCTION_NAME="dynamodb-opensearch-sync"

# Function to check if LocalStack is ready
wait_for_localstack() {
    print_info "Waiting for LocalStack to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "${AWS_ENDPOINT_URL}/_localstack/health" > /dev/null 2>&1; then
            print_success "LocalStack is ready"
            return 0
        fi
        
        print_info "Attempt $attempt/$max_attempts - LocalStack not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_error "LocalStack failed to become ready after $max_attempts attempts"
    return 1
}

# Function to create deployment package
create_deployment_package() {
    print_info "Creating deployment package for DynamoDB sync handler"
    
    # Create temporary directory for deployment package
    local temp_dir="/tmp/lambda-deploy-sync-handler"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # Copy handler files
    if [ ! -f "$SYNC_HANDLER_DIR/index.js" ]; then
        print_error "Sync handler file not found: $SYNC_HANDLER_DIR/index.js"
        return 1
    fi
    
    cp "$SYNC_HANDLER_DIR/index.js" "$temp_dir/"
    
    # Copy common utilities if they exist
    if [ -d "$BACKEND_DIR/src/common" ]; then
        mkdir -p "$temp_dir/common"
        cp -r "$BACKEND_DIR/src/common/"* "$temp_dir/common/"
    fi
    
    # Create package.json with dependencies
    cat > "$temp_dir/package.json" << EOF
{
  "name": "dynamodb-opensearch-sync",
  "version": "1.0.0",
  "description": "DynamoDB to OpenSearch synchronization handler",
  "main": "index.js",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-secrets-manager": "^3.0.0",
    "@aws-sdk/util-dynamodb": "^3.0.0",
    "@aws-sdk/client-cloudwatch": "^3.0.0",
    "@opensearch-project/opensearch": "^2.0.0",
    "aws-sdk": "^2.1000.0"
  }
}
EOF
    
    # Create deployment zip
    cd "$temp_dir"
    zip -q -r function.zip . -x "*.git*" "node_modules/*" "__tests__/*" "*.test.js"
    
    echo "$temp_dir/function.zip"
    return 0
}

# Function to deploy Lambda function
deploy_sync_handler() {
    print_info "Deploying DynamoDB sync handler Lambda function"
    
    # Create deployment package
    local zip_file=$(create_deployment_package)
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    # Check if function already exists
    local existing_function=$(awslocal lambda get-function --function-name "$FUNCTION_NAME" 2>/dev/null || echo "")
    
    if [ -n "$existing_function" ]; then
        print_info "Updating existing Lambda function: $FUNCTION_NAME"
        
        # Update function code
        awslocal lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file "fileb://$zip_file" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Updated Lambda function: $FUNCTION_NAME"
        else
            print_error "Failed to update Lambda function: $FUNCTION_NAME"
            return 1
        fi
        
        # Update function configuration
        awslocal lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --timeout 300 \
            --memory-size 512 \
            --environment Variables="{AWS_ENDPOINT_URL=$AWS_ENDPOINT_URL,AWS_DEFAULT_REGION=$AWS_REGION,OPENSEARCH_ENDPOINT=http://localhost:4566,DYNAMODB_TABLE_NAME=TattooArtistDirectory}" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Updated Lambda function configuration"
        else
            print_warning "Failed to update Lambda function configuration"
        fi
    else
        print_info "Creating new Lambda function: $FUNCTION_NAME"
        
        # Create new function
        local function_arn=$(awslocal lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime nodejs18.x \
            --role "arn:aws:iam::000000000000:role/lambda-execution-role" \
            --handler index.handler \
            --zip-file "fileb://$zip_file" \
            --timeout 300 \
            --memory-size 512 \
            --description "DynamoDB to OpenSearch synchronization handler with retry logic and monitoring" \
            --environment Variables="{AWS_ENDPOINT_URL=$AWS_ENDPOINT_URL,AWS_DEFAULT_REGION=$AWS_REGION,OPENSEARCH_ENDPOINT=http://localhost:4566,DYNAMODB_TABLE_NAME=TattooArtistDirectory}" \
            --query 'FunctionArn' \
            --output text 2>/dev/null)
        
        if [ $? -eq 0 ] && [ "$function_arn" != "None" ]; then
            print_success "Created Lambda function: $FUNCTION_NAME (ARN: $function_arn)"
        else
            print_error "Failed to create Lambda function: $FUNCTION_NAME"
            return 1
        fi
    fi
    
    # Cleanup
    rm -rf "$(dirname "$zip_file")"
    
    return 0
}

# Function to configure DynamoDB stream trigger
configure_stream_trigger() {
    print_info "Configuring DynamoDB stream trigger for sync handler"
    
    # Get DynamoDB table stream ARN
    local stream_arn=$(awslocal dynamodb describe-table \
        --table-name "TattooArtistDirectory" \
        --query 'Table.LatestStreamArn' \
        --output text 2>/dev/null)
    
    if [ -z "$stream_arn" ] || [ "$stream_arn" = "None" ]; then
        print_error "DynamoDB stream not found for table TattooArtistDirectory"
        print_info "Make sure the DynamoDB table is created with streams enabled"
        return 1
    fi
    
    print_info "Found DynamoDB stream: $stream_arn"
    
    # Check if event source mapping already exists
    local existing_mapping=$(awslocal lambda list-event-source-mappings \
        --function-name "$FUNCTION_NAME" \
        --query "EventSourceMappings[?EventSourceArn=='$stream_arn'].UUID" \
        --output text 2>/dev/null)
    
    if [ -n "$existing_mapping" ] && [ "$existing_mapping" != "None" ]; then
        print_success "Event source mapping already exists: $existing_mapping"
        
        # Update the mapping configuration
        awslocal lambda update-event-source-mapping \
            --uuid "$existing_mapping" \
            --batch-size 10 \
            --maximum-batching-window-in-seconds 5 \
            --starting-position LATEST \
            --maximum-retry-attempts 3 \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            print_success "Updated event source mapping configuration"
        else
            print_warning "Failed to update event source mapping configuration"
        fi
    else
        print_info "Creating new event source mapping"
        
        # Create event source mapping
        local mapping_uuid=$(awslocal lambda create-event-source-mapping \
            --function-name "$FUNCTION_NAME" \
            --event-source-arn "$stream_arn" \
            --starting-position LATEST \
            --batch-size 10 \
            --maximum-batching-window-in-seconds 5 \
            --maximum-retry-attempts 3 \
            --query 'UUID' \
            --output text 2>/dev/null)
        
        if [ $? -eq 0 ] && [ "$mapping_uuid" != "None" ]; then
            print_success "Created event source mapping: $mapping_uuid"
        else
            print_error "Failed to create event source mapping"
            return 1
        fi
    fi
    
    return 0
}

# Function to test sync handler
test_sync_handler() {
    print_info "Testing DynamoDB sync handler..."
    
    # Create a test event payload
    local test_event='{
        "Records": [
            {
                "eventID": "test-event-id",
                "eventName": "INSERT",
                "eventVersion": "1.1",
                "eventSource": "aws:dynamodb",
                "awsRegion": "us-east-1",
                "dynamodb": {
                    "ApproximateCreationDateTime": '$(date +%s)',
                    "Keys": {
                        "PK": {"S": "ARTIST#test-sync-123"},
                        "SK": {"S": "METADATA"}
                    },
                    "NewImage": {
                        "PK": {"S": "ARTIST#test-sync-123"},
                        "SK": {"S": "METADATA"},
                        "name": {"S": "Test Sync Artist"},
                        "styles": {"SS": ["traditional", "blackwork"]},
                        "location": {"S": "London, UK"},
                        "locationCity": {"S": "London"},
                        "locationCountry": {"S": "UK"},
                        "instagramHandle": {"S": "@testsyncartist"},
                        "studioName": {"S": "Test Sync Studio"},
                        "portfolioImages": {"SS": ["test1.jpg", "test2.jpg"]},
                        "geohash": {"S": "gcpvj0du6"},
                        "latitude": {"N": "51.5074"},
                        "longitude": {"N": "-0.1278"}
                    },
                    "SequenceNumber": "100000000000000000001",
                    "SizeBytes": 500,
                    "StreamViewType": "NEW_AND_OLD_IMAGES"
                },
                "eventSourceARN": "arn:aws:dynamodb:us-east-1:000000000000:table/TattooArtistDirectory/stream/test"
            }
        ]
    }'
    
    # Invoke the function
    local response=$(awslocal lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$test_event" \
        --cli-binary-format raw-in-base64-out \
        /tmp/sync-test-response.json 2>&1)
    
    if [ $? -eq 0 ]; then
        local status_code=$(echo "$response" | grep -o '"StatusCode": [0-9]*' | grep -o '[0-9]*')
        
        if [ "$status_code" = "200" ]; then
            print_success "Sync handler test completed successfully"
            
            # Show response
            if [ -f "/tmp/sync-test-response.json" ]; then
                local result=$(cat /tmp/sync-test-response.json)
                print_info "Response: $result"
                rm -f /tmp/sync-test-response.json
            fi
        else
            print_error "Sync handler test failed with status code: $status_code"
            return 1
        fi
    else
        print_error "Failed to invoke sync handler for testing"
        print_error "Response: $response"
        return 1
    fi
    
    return 0
}

# Function to check sync handler logs
check_sync_logs() {
    print_info "Checking sync handler logs..."
    
    local log_group_name="/aws/lambda/$FUNCTION_NAME"
    
    # Get recent log streams
    local log_streams=$(awslocal logs describe-log-streams \
        --log-group-name "$log_group_name" \
        --order-by LastEventTime \
        --descending \
        --max-items 3 \
        --query 'logStreams[].logStreamName' \
        --output text 2>/dev/null)
    
    if [ -n "$log_streams" ]; then
        print_info "Recent log streams found:"
        for stream in $log_streams; do
            print_info "  - $stream"
            
            # Get recent log events
            local log_events=$(awslocal logs get-log-events \
                --log-group-name "$log_group_name" \
                --log-stream-name "$stream" \
                --limit 5 \
                --query 'events[].message' \
                --output text 2>/dev/null)
            
            if [ -n "$log_events" ]; then
                echo "$log_events" | head -3 | while read -r line; do
                    print_info "    $line"
                done
            fi
        done
    else
        print_warning "No log streams found for sync handler"
    fi
}

# Main execution
main() {
    print_info "Starting DynamoDB sync handler deployment..."
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    
    # Check if sync handler directory exists
    if [ ! -d "$SYNC_HANDLER_DIR" ]; then
        print_error "Sync handler directory not found: $SYNC_HANDLER_DIR"
        exit 1
    fi
    
    # Wait for LocalStack to be ready
    if ! wait_for_localstack; then
        exit 1
    fi
    
    # Deploy the sync handler
    if ! deploy_sync_handler; then
        exit 1
    fi
    
    # Configure DynamoDB stream trigger
    if ! configure_stream_trigger; then
        print_warning "Failed to configure stream trigger - you may need to set this up manually"
    fi
    
    # Test the handler
    sleep 3  # Give Lambda function time to be ready
    if test_sync_handler; then
        print_success "Sync handler deployment and testing completed successfully!"
    else
        print_warning "Sync handler deployed but testing failed - check logs for issues"
    fi
    
    # Show recent logs
    check_sync_logs
    
    print_info ""
    print_success "DynamoDB sync handler deployment completed!"
    print_info "Function name: $FUNCTION_NAME"
    print_info "Handler: index.handler"
    print_info "Runtime: nodejs18.x"
    print_info "Timeout: 300 seconds"
    print_info "Memory: 512 MB"
    print_info ""
    print_info "The handler is now configured to:"
    print_info "  - Process DynamoDB stream events from TattooArtistDirectory table"
    print_info "  - Sync artist data to OpenSearch with retry logic"
    print_info "  - Send monitoring metrics to CloudWatch"
    print_info "  - Handle errors with exponential backoff"
}

# Execute main function
main "$@"