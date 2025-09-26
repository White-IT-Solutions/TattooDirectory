# DynamoDB Streams Implementation

## Overview

This document describes the implementation of DynamoDB Streams for real-time data synchronization between DynamoDB and OpenSearch in the Tattoo Directory MVP project.

## Architecture

### Components

1. **DynamoDB Table with Streams**
   - Table: `tattoo-directory-local`
   - Stream View Type: `NEW_AND_OLD_IMAGES`
   - Stream enabled for all table operations

2. **Lambda Stream Handler**
   - Function: `dynamodb-sync-handler`
   - Runtime: Node.js 18.x
   - Handler: `backend/src/handlers/dynamodb-sync/index.js`

3. **Event Source Mapping**
   - Connects DynamoDB Stream to Lambda function
   - Batch size: 10 records
   - Maximum batching window: 5 seconds
   - Starting position: LATEST

## Stream Configuration

### DynamoDB Table Configuration

The table is configured with streams enabled using the `NEW_AND_OLD_IMAGES` view type:

```bash
awslocal dynamodb create-table \
    --table-name tattoo-directory-local \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
    # ... other table configuration
```

### Stream View Type Benefits

- **NEW_AND_OLD_IMAGES**: Provides both the new and old images of the item
- Enables detailed change tracking for MODIFY operations
- Supports comprehensive audit logging
- Allows for rollback scenarios if needed

## Lambda Handler Implementation

### Key Features

1. **Event Processing**
   - Handles INSERT, MODIFY, and REMOVE events
   - Processes only ARTIST records with METADATA sort key
   - Transforms DynamoDB items to OpenSearch documents

2. **Error Handling**
   - Comprehensive error logging with correlation IDs
   - Graceful handling of missing documents in OpenSearch
   - Proper error propagation for dead letter queue processing

3. **Change Detection**
   - For MODIFY events, logs which fields changed
   - Utilizes both NewImage and OldImage for comparison
   - Optimized document updates in OpenSearch

### Event Processing Flow

```javascript
// Stream Event Structure
{
  "Records": [
    {
      "eventName": "INSERT|MODIFY|REMOVE",
      "dynamodb": {
        "Keys": { "PK": {"S": "ARTIST#123"}, "SK": {"S": "METADATA"} },
        "NewImage": { /* New item data */ },
        "OldImage": { /* Previous item data */ },
        "StreamViewType": "NEW_AND_OLD_IMAGES"
      }
    }
  ]
}
```

## Setup Scripts

### LocalStack Initialization

1. **01-create-dynamodb-table.sh**
   - Creates DynamoDB table with streams enabled
   - Verifies stream configuration
   - Exports stream ARN for trigger setup

2. **06-setup-dynamodb-stream-trigger.sh**
   - Creates Lambda function for stream processing
   - Sets up event source mapping
   - Configures trigger parameters

### Windows Support

- **setup-dynamodb-stream-trigger.bat**: Windows batch script
- **test-dynamodb-streams.bat**: Windows test script
- Both scripts execute commands inside LocalStack container

## Testing

### Test Scripts

1. **test-dynamodb-streams.sh** (Linux)
2. **test-dynamodb-streams.bat** (Windows)

### Test Scenarios

The test scripts verify:

1. **Table Configuration**
   - Table is ACTIVE
   - Streams are enabled
   - Stream ARN is available

2. **Lambda Function**
   - Function is deployed and ACTIVE
   - Event source mapping is configured
   - Function has proper permissions

3. **Stream Processing**
   - INSERT event: Creates new artist record
   - MODIFY event: Updates existing artist record
   - REMOVE event: Deletes artist record

### Running Tests

```bash
# Linux/WSL
./devtools/scripts/test-dynamodb-streams.sh

# Windows
devtools\scripts\test-dynamodb-streams.bat
```

## Monitoring and Debugging

### CloudWatch Logs

Stream processing logs are available in:
- Log Group: `/aws/lambda/dynamodb-sync-handler`
- Region: `eu-west-2`

### Monitoring Commands

```bash
# Tail Lambda logs in real-time
awslocal logs tail /aws/lambda/dynamodb-sync-handler --follow --region eu-west-2

# Check event source mappings
awslocal lambda list-event-source-mappings --function-name dynamodb-sync-handler --region eu-west-2

# Verify stream configuration
awslocal dynamodb describe-table --table-name tattoo-directory-local --region eu-west-2 --query 'Table.StreamSpecification'
```

## Performance Considerations

### Batch Processing

- **Batch Size**: 10 records per invocation
- **Batching Window**: 5 seconds maximum
- **Parallelization**: Single shard processing

### Error Handling

- Failed records trigger Lambda retry mechanism
- Dead letter queue processing for persistent failures
- Graceful degradation for OpenSearch connectivity issues

### Resource Limits

- **Memory**: 256 MB
- **Timeout**: 60 seconds
- **Concurrent Executions**: Limited by stream shard count

## Security

### IAM Permissions

The Lambda function requires:
- DynamoDB Streams read permissions
- OpenSearch write permissions
- CloudWatch Logs write permissions
- Secrets Manager read permissions (production)

### Local Development

- Uses LocalStack test credentials
- No real AWS permissions required
- Isolated container environment

## Troubleshooting

### Common Issues

1. **Stream Not Processing**
   - Check event source mapping state
   - Verify Lambda function is ACTIVE
   - Check CloudWatch logs for errors

2. **OpenSearch Sync Failures**
   - Verify OpenSearch endpoint configuration
   - Check network connectivity
   - Review document transformation logic

3. **Permission Errors**
   - Ensure proper IAM roles in production
   - Verify LocalStack service availability

### Debug Commands

```bash
# Check stream status
awslocal dynamodb describe-table --table-name tattoo-directory-local --query 'Table.StreamSpecification'

# List event source mappings
awslocal lambda list-event-source-mappings --function-name dynamodb-sync-handler

# Check function configuration
awslocal lambda get-function --function-name dynamodb-sync-handler

# Monitor logs
awslocal logs filter-log-events --log-group-name /aws/lambda/dynamodb-sync-handler --start-time $(date -d '1 hour ago' +%s)000
```

## Production Deployment

### Terraform Configuration

The streams configuration should be included in the Terraform modules:

```hcl
resource "aws_dynamodb_table" "tattoo_directory" {
  # ... table configuration
  
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn  = aws_dynamodb_table.tattoo_directory.stream_arn
  function_name     = aws_lambda_function.dynamodb_sync.arn
  starting_position = "LATEST"
  batch_size        = 10
  maximum_batching_window_in_seconds = 5
}
```

### Environment Variables

Production Lambda function requires:
- `OPENSEARCH_ENDPOINT`: OpenSearch cluster endpoint
- `APP_SECRETS_ARN`: Secrets Manager ARN for OpenSearch credentials
- `DYNAMODB_TABLE_NAME`: Production table name
- `AWS_REGION`: Deployment region

## Benefits

### Real-time Synchronization

- Immediate OpenSearch updates on DynamoDB changes
- No polling or batch processing delays
- Consistent data across services

### Scalability

- Automatic scaling with DynamoDB write volume
- Parallel processing across multiple shards
- No impact on application performance

### Reliability

- Built-in retry mechanisms
- Dead letter queue for failed processing
- Comprehensive error logging and monitoring

## Future Enhancements

### Potential Improvements

1. **Selective Processing**
   - Filter stream events by record type
   - Skip non-essential updates

2. **Batch Optimization**
   - Dynamic batch sizing based on load
   - Intelligent batching windows

3. **Multi-target Sync**
   - Support for multiple OpenSearch indices
   - Additional downstream systems

4. **Advanced Monitoring**
   - Custom CloudWatch metrics
   - Stream processing dashboards
   - Alerting on processing failures