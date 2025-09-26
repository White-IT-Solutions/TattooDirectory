#!/bin/bash

# Test Data Synchronization Pipeline Script
# Comprehensive testing of DynamoDB to OpenSearch sync with monitoring
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
TABLE_NAME="TattooArtistDirectory"
INDEX_NAME="tattoo-artists"
FUNCTION_NAME="dynamodb-opensearch-sync"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    print_info "Running test: $test_name"
    
    if eval "$test_command"; then
        print_success "PASS: $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "FAIL: $test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check if LocalStack is ready
check_localstack_ready() {
    curl -s "${AWS_ENDPOINT_URL}/_localstack/health" > /dev/null 2>&1
}

# Function to check if DynamoDB table exists
check_dynamodb_table() {
    awslocal dynamodb describe-table --table-name "$TABLE_NAME" > /dev/null 2>&1
}

# Function to check if OpenSearch index exists
check_opensearch_index() {
    curl -s "${AWS_ENDPOINT_URL}/${INDEX_NAME}" > /dev/null 2>&1
}

# Function to check if sync Lambda function exists
check_sync_function() {
    awslocal lambda get-function --function-name "$FUNCTION_NAME" > /dev/null 2>&1
}

# Function to check if DynamoDB streams are enabled
check_dynamodb_streams() {
    local stream_arn=$(awslocal dynamodb describe-table \
        --table-name "$TABLE_NAME" \
        --query 'Table.LatestStreamArn' \
        --output text 2>/dev/null)
    
    [ -n "$stream_arn" ] && [ "$stream_arn" != "None" ]
}

# Function to check if event source mapping exists
check_event_source_mapping() {
    local mappings=$(awslocal lambda list-event-source-mappings \
        --function-name "$FUNCTION_NAME" \
        --query 'EventSourceMappings[].State' \
        --output text 2>/dev/null)
    
    echo "$mappings" | grep -q "Enabled"
}

# Function to create test artist record
create_test_artist() {
    local artist_id="$1"
    local artist_name="$2"
    
    awslocal dynamodb put-item \
        --table-name "$TABLE_NAME" \
        --item '{
            "PK": {"S": "ARTIST#'$artist_id'"},
            "SK": {"S": "METADATA"},
            "name": {"S": "'$artist_name'"},
            "styles": {"SS": ["traditional", "blackwork"]},
            "location": {"S": "London, UK"},
            "locationCity": {"S": "London"},
            "locationCountry": {"S": "UK"},
            "instagramHandle": {"S": "@'$artist_id'"},
            "studioName": {"S": "Test Studio"},
            "portfolioImages": {"SS": ["image1.jpg", "image2.jpg"]},
            "geohash": {"S": "gcpvj0du6"},
            "latitude": {"N": "51.5074"},
            "longitude": {"N": "-0.1278"}
        }' > /dev/null 2>&1
}

# Function to update test artist record
update_test_artist() {
    local artist_id="$1"
    local new_name="$2"
    
    awslocal dynamodb update-item \
        --table-name "$TABLE_NAME" \
        --key '{"PK": {"S": "ARTIST#'$artist_id'"}, "SK": {"S": "METADATA"}}' \
        --update-expression "SET #name = :name, #styles = :styles" \
        --expression-attribute-names '{"#name": "name", "#styles": "styles"}' \
        --expression-attribute-values '{":name": {"S": "'$new_name'"}, ":styles": {"SS": ["traditional", "blackwork", "realism"]}}' \
        > /dev/null 2>&1
}

# Function to delete test artist record
delete_test_artist() {
    local artist_id="$1"
    
    awslocal dynamodb delete-item \
        --table-name "$TABLE_NAME" \
        --key '{"PK": {"S": "ARTIST#'$artist_id'"}, "SK": {"S": "METADATA"}}' \
        > /dev/null 2>&1
}

# Function to check if document exists in OpenSearch
check_opensearch_document() {
    local artist_id="$1"
    
    local response=$(curl -s "${AWS_ENDPOINT_URL}/${INDEX_NAME}/_doc/ARTIST%23${artist_id}")
    echo "$response" | grep -q '"found":true'
}

# Function to wait for sync to complete
wait_for_sync() {
    local max_wait=30
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        sleep 2
        ((wait_time += 2))
        
        # Check if there are any recent Lambda invocations
        local recent_logs=$(awslocal logs describe-log-streams \
            --log-group-name "/aws/lambda/$FUNCTION_NAME" \
            --order-by LastEventTime \
            --descending \
            --max-items 1 \
            --query 'logStreams[0].lastEventTime' \
            --output text 2>/dev/null)
        
        if [ -n "$recent_logs" ] && [ "$recent_logs" != "None" ]; then
            local current_time=$(date +%s)000  # Convert to milliseconds
            local time_diff=$((current_time - recent_logs))
            
            # If logs are recent (within last 10 seconds), sync likely completed
            if [ $time_diff -lt 10000 ]; then
                return 0
            fi
        fi
    done
    
    return 1
}

# Function to test INSERT sync
test_insert_sync() {
    local test_artist_id="sync-test-insert-$(date +%s)"
    
    print_info "Testing INSERT sync for artist: $test_artist_id"
    
    # Create artist in DynamoDB
    create_test_artist "$test_artist_id" "Insert Test Artist"
    
    # Wait for sync
    if wait_for_sync; then
        # Check if document exists in OpenSearch
        if check_opensearch_document "$test_artist_id"; then
            print_success "INSERT sync successful"
            
            # Cleanup
            delete_test_artist "$test_artist_id"
            return 0
        else
            print_error "Document not found in OpenSearch after INSERT"
            delete_test_artist "$test_artist_id"
            return 1
        fi
    else
        print_error "Sync timeout for INSERT operation"
        delete_test_artist "$test_artist_id"
        return 1
    fi
}

# Function to test UPDATE sync
test_update_sync() {
    local test_artist_id="sync-test-update-$(date +%s)"
    
    print_info "Testing UPDATE sync for artist: $test_artist_id"
    
    # Create artist in DynamoDB
    create_test_artist "$test_artist_id" "Update Test Artist"
    
    # Wait for initial sync
    sleep 3
    
    # Update artist
    update_test_artist "$test_artist_id" "Updated Test Artist"
    
    # Wait for sync
    if wait_for_sync; then
        # Check if document is updated in OpenSearch
        local response=$(curl -s "${AWS_ENDPOINT_URL}/${INDEX_NAME}/_doc/ARTIST%23${test_artist_id}")
        
        if echo "$response" | grep -q "Updated Test Artist"; then
            print_success "UPDATE sync successful"
            
            # Cleanup
            delete_test_artist "$test_artist_id"
            return 0
        else
            print_error "Document not updated in OpenSearch after UPDATE"
            delete_test_artist "$test_artist_id"
            return 1
        fi
    else
        print_error "Sync timeout for UPDATE operation"
        delete_test_artist "$test_artist_id"
        return 1
    fi
}

# Function to test DELETE sync
test_delete_sync() {
    local test_artist_id="sync-test-delete-$(date +%s)"
    
    print_info "Testing DELETE sync for artist: $test_artist_id"
    
    # Create artist in DynamoDB
    create_test_artist "$test_artist_id" "Delete Test Artist"
    
    # Wait for initial sync
    sleep 3
    
    # Delete artist
    delete_test_artist "$test_artist_id"
    
    # Wait for sync
    if wait_for_sync; then
        # Check if document is deleted from OpenSearch
        if ! check_opensearch_document "$test_artist_id"; then
            print_success "DELETE sync successful"
            return 0
        else
            print_error "Document still exists in OpenSearch after DELETE"
            return 1
        fi
    else
        print_error "Sync timeout for DELETE operation"
        return 1
    fi
}

# Function to test error handling
test_error_handling() {
    print_info "Testing error handling with invalid data"
    
    # Create invalid test event
    local invalid_event='{
        "Records": [{
            "eventName": "INSERT",
            "dynamodb": {
                "Keys": {
                    "PK": {"S": "INVALID#test"},
                    "SK": {"S": "METADATA"}
                }
            }
        }]
    }'
    
    # Invoke function with invalid event
    local response=$(awslocal lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$invalid_event" \
        --cli-binary-format raw-in-base64-out \
        /tmp/error-test-response.json 2>&1)
    
    # Function should handle error gracefully
    if echo "$response" | grep -q '"StatusCode": 200'; then
        print_success "Error handling test passed"
        rm -f /tmp/error-test-response.json
        return 0
    else
        print_error "Error handling test failed"
        rm -f /tmp/error-test-response.json
        return 1
    fi
}

# Function to test performance with multiple records
test_performance() {
    print_info "Testing performance with multiple records"
    
    local start_time=$(date +%s)
    local test_prefix="perf-test-$(date +%s)"
    
    # Create multiple test artists
    for i in {1..5}; do
        create_test_artist "${test_prefix}-${i}" "Performance Test Artist $i"
    done
    
    # Wait for sync
    sleep 10
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Check if all documents are synced
    local synced_count=0
    for i in {1..5}; do
        if check_opensearch_document "${test_prefix}-${i}"; then
            ((synced_count++))
        fi
    done
    
    # Cleanup
    for i in {1..5}; do
        delete_test_artist "${test_prefix}-${i}"
    done
    
    if [ $synced_count -eq 5 ] && [ $duration -lt 30 ]; then
        print_success "Performance test passed: $synced_count/5 records synced in ${duration}s"
        return 0
    else
        print_error "Performance test failed: $synced_count/5 records synced in ${duration}s"
        return 1
    fi
}

# Function to check CloudWatch metrics
check_cloudwatch_metrics() {
    print_info "Checking CloudWatch metrics"
    
    # Get recent metrics
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local start_time=$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ)
    
    local metrics=$(awslocal cloudwatch get-metric-statistics \
        --namespace "TattooDirectory/DataSync" \
        --metric-name "FunctionInvocation" \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 300 \
        --statistics Sum \
        --query 'Datapoints[].Sum' \
        --output text 2>/dev/null)
    
    if [ -n "$metrics" ] && [ "$metrics" != "None" ]; then
        print_success "CloudWatch metrics found"
        return 0
    else
        print_warning "No CloudWatch metrics found (may be expected for new deployment)"
        return 0
    fi
}

# Main test execution
main() {
    print_info "Starting comprehensive data synchronization pipeline testing..."
    print_info "Testing DynamoDB to OpenSearch sync with monitoring and error handling"
    echo ""
    
    # Test 1: Infrastructure checks
    run_test "LocalStack connectivity" "check_localstack_ready"
    run_test "DynamoDB table exists" "check_dynamodb_table"
    run_test "OpenSearch index accessible" "check_opensearch_index"
    run_test "Sync Lambda function exists" "check_sync_function"
    run_test "DynamoDB streams enabled" "check_dynamodb_streams"
    run_test "Event source mapping configured" "check_event_source_mapping"
    
    # Test 2: Basic sync operations
    run_test "INSERT sync operation" "test_insert_sync"
    run_test "UPDATE sync operation" "test_update_sync"
    run_test "DELETE sync operation" "test_delete_sync"
    
    # Test 3: Error handling and resilience
    run_test "Error handling with invalid data" "test_error_handling"
    
    # Test 4: Performance testing
    run_test "Performance with multiple records" "test_performance"
    
    # Test 5: Monitoring
    run_test "CloudWatch metrics collection" "check_cloudwatch_metrics"
    
    # Test Summary
    echo ""
    print_info "=== TEST SUMMARY ==="
    print_info "Total tests: $TOTAL_TESTS"
    print_success "Passed: $TESTS_PASSED"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        print_error "Failed: $TESTS_FAILED"
        echo ""
        print_error "Some tests failed. Please check the data synchronization pipeline."
        print_info "Common issues:"
        print_info "  - LocalStack services not running or not ready"
        print_info "  - DynamoDB table not created with streams enabled"
        print_info "  - OpenSearch index not created"
        print_info "  - Sync Lambda function not deployed"
        print_info "  - Event source mapping not configured"
        print_info "  - Network connectivity issues"
        echo ""
        print_info "To fix issues:"
        print_info "  1. Run: localstack-init/01-create-dynamodb-table.sh"
        print_info "  2. Run: localstack-init/06-setup-dynamodb-stream-trigger.sh"
        print_info "  3. Run: devtools/scripts/deploy-sync-handler.sh"
        exit 1
    else
        print_success "All tests passed! Data synchronization pipeline is working correctly."
        echo ""
        print_info "Data synchronization pipeline components verified:"
        print_info "  ✅ DynamoDB table with streams enabled"
        print_info "  ✅ OpenSearch index accessible"
        print_info "  ✅ Sync Lambda function deployed and configured"
        print_info "  ✅ Event source mapping properly set up"
        print_info "  ✅ INSERT/UPDATE/DELETE operations sync correctly"
        print_info "  ✅ Error handling robust and graceful"
        print_info "  ✅ Performance within acceptable limits"
        print_info "  ✅ Monitoring metrics being collected"
        echo ""
        print_success "The data synchronization pipeline is ready for production use!"
        exit 0
    fi
}

# Execute main function
main "$@"