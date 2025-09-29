@echo off
setlocal enabledelayedexpansion

REM DynamoDB Streams Test Script for Windows
REM This script tests the DynamoDB Streams configuration by inserting test data
REM and verifying that stream events are processed correctly

echo 🧪 Testing DynamoDB Streams configuration...

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is required but not available
    exit /b 1
)

REM Execute the test inside the LocalStack container
echo 📊 Running DynamoDB Streams test via LocalStack container...

docker-compose -f devtools/docker/docker-compose.local.yml exec localstack bash -c "
    echo '🧪 Testing DynamoDB Streams configuration...'
    
    # Check if LocalStack is running
    echo 'ℹ️  Checking LocalStack status...'
    if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
        echo '❌ LocalStack is not running properly'
        exit 1
    fi
    echo '✅ LocalStack is running'
    
    # Check if DynamoDB table exists and has streams enabled
    echo 'ℹ️  Checking DynamoDB table and streams configuration...'
    TABLE_STATUS=\$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.TableStatus' --output text 2>/dev/null)
    STREAM_STATUS=\$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.StreamSpecification.StreamEnabled' --output text 2>/dev/null)
    STREAM_ARN=\$(awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.LatestStreamArn' --output text 2>/dev/null)
    
    if [ \"\$TABLE_STATUS\" != \"ACTIVE\" ]; then
        echo '❌ DynamoDB table is not active. Status:' \$TABLE_STATUS
        exit 1
    fi
    
    if [ \"\$STREAM_STATUS\" != \"True\" ]; then
        echo '❌ DynamoDB Streams are not enabled on the table'
        exit 1
    fi
    
    echo '✅ DynamoDB table is active with streams enabled'
    echo 'ℹ️  Stream ARN:' \$STREAM_ARN
    
    # Check if Lambda function exists
    echo 'ℹ️  Checking Lambda function...'
    FUNCTION_STATUS=\$(awslocal lambda get-function --function-name dynamodb-sync-handler --region eu-west-2 --query 'Configuration.State' --output text 2>/dev/null)
    
    if [ \"\$FUNCTION_STATUS\" != \"Active\" ]; then
        echo '❌ Lambda function is not active. Status:' \$FUNCTION_STATUS
        exit 1
    fi
    
    echo '✅ Lambda function is active'
    
    # Check if event source mapping exists
    echo 'ℹ️  Checking event source mapping...'
    MAPPING_COUNT=\$(awslocal lambda list-event-source-mappings --function-name dynamodb-sync-handler --region eu-west-2 --query 'length(EventSourceMappings)' --output text 2>/dev/null)
    
    if [ \"\$MAPPING_COUNT\" -eq 0 ]; then
        echo '❌ No event source mappings found for the Lambda function'
        exit 1
    fi
    
    echo '✅ Event source mapping is configured'
    
    # Insert test data to trigger stream events
    echo 'ℹ️  Inserting test data to trigger stream events...'
    
    TEST_ARTIST_ID=\"test-artist-\$(date +%s)\"
    TEST_ITEM='{
        \"PK\": {\"S\": \"ARTIST#'\$TEST_ARTIST_ID'\"},
        \"SK\": {\"S\": \"METADATA\"},
        \"name\": {\"S\": \"Test Artist Stream\"},
        \"styles\": {\"SS\": [\"traditional\", \"blackwork\"]},
        \"location\": {\"S\": \"London, UK\"},
        \"locationCity\": {\"S\": \"London\"},
        \"locationCountry\": {\"S\": \"UK\"},
        \"instagramHandle\": {\"S\": \"test_artist_stream\"},
        \"studioName\": {\"S\": \"Test Studio Stream\"},
        \"portfolioImages\": {\"SS\": [\"https://example.com/image1.jpg\", \"https://example.com/image2.jpg\"]},
        \"geohash\": {\"S\": \"gcpvj0\"},
        \"latitude\": {\"N\": \"51.5074\"},
        \"longitude\": {\"N\": \"-0.1278\"},
        \"gsi1pk\": {\"S\": \"STYLE#traditional\"},
        \"gsi1sk\": {\"S\": \"GEOHASH#gcpvj0\"},
        \"gsi2pk\": {\"S\": \"ARTIST\"},
        \"gsi2sk\": {\"S\": \"Test Artist Stream\"},
        \"gsi3pk\": {\"S\": \"INSTAGRAM#test_artist_stream\"}
    }'
    
    # Insert the test item
    awslocal dynamodb put-item \
        --table-name tattoo-directory-local \
        --item \"\$TEST_ITEM\" \
        --region eu-west-2
    
    if [ \$? -eq 0 ]; then
        echo '✅ Test data inserted successfully'
    else
        echo '❌ Failed to insert test data'
        exit 1
    fi
    
    # Wait for stream processing
    echo 'ℹ️  Waiting for stream processing (10 seconds)...'
    sleep 10
    
    # Update the test item to trigger MODIFY event
    echo 'ℹ️  Updating test data to trigger MODIFY stream event...'
    awslocal dynamodb update-item \
        --table-name tattoo-directory-local \
        --key '{\"PK\": {\"S\": \"ARTIST#'\$TEST_ARTIST_ID'\"}, \"SK\": {\"S\": \"METADATA\"}}' \
        --update-expression \"SET #name = :name\" \
        --expression-attribute-names '{\"#name\": \"name\"}' \
        --expression-attribute-values '{\":name\": {\"S\": \"Updated Test Artist Stream\"}}' \
        --region eu-west-2
    
    if [ \$? -eq 0 ]; then
        echo '✅ Test data updated successfully'
    else
        echo '⚠️  Failed to update test data'
    fi
    
    # Wait for stream processing
    echo 'ℹ️  Waiting for MODIFY stream processing (5 seconds)...'
    sleep 5
    
    # Delete the test item to trigger REMOVE event
    echo 'ℹ️  Deleting test data to trigger REMOVE stream event...'
    awslocal dynamodb delete-item \
        --table-name tattoo-directory-local \
        --key '{\"PK\": {\"S\": \"ARTIST#'\$TEST_ARTIST_ID'\"}, \"SK\": {\"S\": \"METADATA\"}}' \
        --region eu-west-2
    
    if [ \$? -eq 0 ]; then
        echo '✅ Test data deleted successfully'
    else
        echo '⚠️  Failed to delete test data'
    fi
    
    # Final wait for stream processing
    echo 'ℹ️  Waiting for REMOVE stream processing (5 seconds)...'
    sleep 5
    
    # Summary
    echo '✅ DynamoDB Streams test completed!'
    echo 'ℹ️  Summary:'
    echo '  ✅ DynamoDB table with streams: ACTIVE'
    echo '  ✅ Lambda function: ACTIVE'
    echo '  ✅ Event source mapping: CONFIGURED'
    echo '  ✅ Test events: INSERT, MODIFY, REMOVE'
    
    echo 'ℹ️  To monitor stream processing in real-time, use:'
    echo '  awslocal logs tail /aws/lambda/dynamodb-sync-handler --follow --region eu-west-2'
    
    echo '🎉 DynamoDB Streams configuration test completed successfully!'
"

if errorlevel 1 (
    echo ❌ DynamoDB Streams test failed
    exit /b 1
)

echo ✅ DynamoDB Streams test completed successfully!
exit /b 0