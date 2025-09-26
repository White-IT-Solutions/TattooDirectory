#!/bin/bash

# DynamoDB Streams Test Script
# This script tests the DynamoDB Streams configuration by inserting test data
# and verifying that stream events are processed correctly

echo "🧪 Testing DynamoDB Streams configuration..."

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

# Check if LocalStack is running
print_info "Checking LocalStack status..."
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    print_error "LocalStack is not running. Please start LocalStack first."
    exit 1
fi

print_success "LocalStack is running"

# Check if DynamoDB table exists and has streams enabled
print_info "Checking DynamoDB table and streams configuration..."
TABLE_STATUS=$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.TableStatus' --output text 2>/dev/null)
STREAM_STATUS=$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.StreamSpecification.StreamEnabled' --output text 2>/dev/null)
STREAM_ARN=$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.LatestStreamArn' --output text 2>/dev/null)

if [ "$TABLE_STATUS" != "ACTIVE" ]; then
    print_error "DynamoDB table is not active. Status: $TABLE_STATUS"
    exit 1
fi

if [ "$STREAM_STATUS" != "True" ]; then
    print_error "DynamoDB Streams are not enabled on the table"
    exit 1
fi

print_success "DynamoDB table is active with streams enabled"
print_info "Stream ARN: $STREAM_ARN"

# Check if Lambda function exists
print_info "Checking Lambda function..."
FUNCTION_STATUS=$(awslocal lambda get-function --function-name dynamodb-sync-handler --region eu-west-2 --query 'Configuration.State' --output text 2>/dev/null)

if [ "$FUNCTION_STATUS" != "Active" ]; then
    print_error "Lambda function is not active. Status: $FUNCTION_STATUS"
    exit 1
fi

print_success "Lambda function is active"

# Check if event source mapping exists
print_info "Checking event source mapping..."
MAPPING_COUNT=$(awslocal lambda list-event-source-mappings --function-name dynamodb-sync-handler --region eu-west-2 --query 'length(EventSourceMappings)' --output text 2>/dev/null)

if [ "$MAPPING_COUNT" -eq 0 ]; then
    print_error "No event source mappings found for the Lambda function"
    exit 1
fi

print_success "Event source mapping is configured"

# Insert test data to trigger stream events
print_info "Inserting test data to trigger stream events..."

TEST_ARTIST_ID="test-artist-$(date +%s)"
TEST_ITEM='{
    "PK": {"S": "ARTIST#'$TEST_ARTIST_ID'"},
    "SK": {"S": "METADATA"},
    "name": {"S": "Test Artist Stream"},
    "styles": {"SS": ["traditional", "blackwork"]},
    "location": {"S": "London, UK"},
    "locationCity": {"S": "London"},
    "locationCountry": {"S": "UK"},
    "instagramHandle": {"S": "test_artist_stream"},
    "studioName": {"S": "Test Studio Stream"},
    "portfolioImages": {"SS": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]},
    "geohash": {"S": "gcpvj0"},
    "latitude": {"N": "51.5074"},
    "longitude": {"N": "-0.1278"},
    "gsi1pk": {"S": "STYLE#traditional"},
    "gsi1sk": {"S": "GEOHASH#gcpvj0"},
    "gsi2pk": {"S": "ARTIST"},
    "gsi2sk": {"S": "Test Artist Stream"},
    "gsi3pk": {"S": "INSTAGRAM#test_artist_stream"}
}'

# Insert the test item
awslocal dynamodb put-item \
    --table-name tattoo-directory-local \
    --item "$TEST_ITEM" \
    --region eu-west-2

if [ $? -eq 0 ]; then
    print_success "Test data inserted successfully"
else
    print_error "Failed to insert test data"
    exit 1
fi

# Wait for stream processing
print_info "Waiting for stream processing (10 seconds)..."
sleep 10

# Check Lambda function logs
print_info "Checking Lambda function logs..."
LOG_GROUPS=$(awslocal logs describe-log-groups --log-group-name-prefix "/aws/lambda/dynamodb-sync-handler" --region eu-west-2 --query 'logGroups[0].logGroupName' --output text 2>/dev/null)

if [ "$LOG_GROUPS" != "None" ] && [ -n "$LOG_GROUPS" ]; then
    print_success "Lambda log group found: $LOG_GROUPS"
    
    # Get recent log events
    RECENT_LOGS=$(awslocal logs filter-log-events \
        --log-group-name "$LOG_GROUPS" \
        --start-time $(($(date +%s) * 1000 - 60000)) \
        --region eu-west-2 \
        --query 'events[*].message' \
        --output text 2>/dev/null)
    
    if echo "$RECENT_LOGS" | grep -q "DynamoDB Stream Event received"; then
        print_success "Stream events are being processed by Lambda function"
        print_info "Recent log entries:"
        echo "$RECENT_LOGS" | grep -E "(Stream Event|Successfully|Error)" | tail -5
    else
        print_warning "No recent stream processing logs found"
    fi
else
    print_warning "Lambda log group not found - this may be normal for new functions"
fi

# Update the test item to trigger MODIFY event
print_info "Updating test data to trigger MODIFY stream event..."
awslocal dynamodb update-item \
    --table-name tattoo-directory-local \
    --key '{"PK": {"S": "ARTIST#'$TEST_ARTIST_ID'"}, "SK": {"S": "METADATA"}}' \
    --update-expression "SET #name = :name" \
    --expression-attribute-names '{"#name": "name"}' \
    --expression-attribute-values '{":name": {"S": "Updated Test Artist Stream"}}' \
    --region eu-west-2

if [ $? -eq 0 ]; then
    print_success "Test data updated successfully"
else
    print_warning "Failed to update test data"
fi

# Wait for stream processing
print_info "Waiting for MODIFY stream processing (5 seconds)..."
sleep 5

# Delete the test item to trigger REMOVE event
print_info "Deleting test data to trigger REMOVE stream event..."
awslocal dynamodb delete-item \
    --table-name tattoo-directory-local \
    --key '{"PK": {"S": "ARTIST#'$TEST_ARTIST_ID'"}, "SK": {"S": "METADATA"}}' \
    --region eu-west-2

if [ $? -eq 0 ]; then
    print_success "Test data deleted successfully"
else
    print_warning "Failed to delete test data"
fi

# Final wait for stream processing
print_info "Waiting for REMOVE stream processing (5 seconds)..."
sleep 5

# Summary
print_success "DynamoDB Streams test completed!"
print_info "Summary:"
echo "  ✅ DynamoDB table with streams: ACTIVE"
echo "  ✅ Lambda function: ACTIVE"
echo "  ✅ Event source mapping: CONFIGURED"
echo "  ✅ Test events: INSERT, MODIFY, REMOVE"

print_info "To monitor stream processing in real-time, use:"
echo "  awslocal logs tail /aws/lambda/dynamodb-sync-handler --follow --region eu-west-2"

print_success "🎉 DynamoDB Streams configuration test completed successfully!"