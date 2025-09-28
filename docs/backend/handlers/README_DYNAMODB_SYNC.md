# DynamoDB to OpenSearch Sync Handler

This Lambda function processes DynamoDB stream events and maintains synchronization with the OpenSearch cluster for real-time search functionality.

## Overview

The DynamoDB sync handler is triggered by DynamoDB Streams whenever artist records are created, updated, or deleted. It transforms the DynamoDB data format into OpenSearch documents optimized for search queries.

## Key Features

- **Real-time Synchronization**: Processes DynamoDB stream events in near real-time
- **PII-Scrubbing Logging**: Uses consolidated logger with automatic PII redaction
- **Error Handling**: Comprehensive error handling with dead letter queue support
- **Circuit Breaker**: Graceful degradation when OpenSearch is unavailable
- **Field Mapping**: Transforms DynamoDB attributes to OpenSearch-optimized fields

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENSEARCH_ENDPOINT` | OpenSearch cluster endpoint | Yes |
| `APP_SECRETS_ARN` | ARN of the secrets containing OpenSearch credentials | Yes |
| `OPENSEARCH_INDEX` | Target OpenSearch index name | No (defaults to 'artists') |

## Event Processing

### Supported Events

- **INSERT**: Creates new document in OpenSearch
- **MODIFY**: Updates existing document in OpenSearch
- **REMOVE**: Deletes document from OpenSearch

### Record Filtering

Only processes records that match:
- `PK` starts with `ARTIST#`
- `SK` equals `METADATA`

Other records (portfolio images, studio data, etc.) are skipped.

## Document Transformation

### Input (DynamoDB Item)
```json
{
  "PK": "ARTIST#123",
  "SK": "METADATA",
  "name": "John Doe",
  "styles": ["traditional", "realism"],
  "location": "London, UK",
  "locationCity": "London",
  "locationCountry": "UK",
  "instagramHandle": "@johndoe_tattoo",
  "studioName": "Ink Studio",
  "geohash": "gcpvj0",
  "latitude": "51.5074",
  "longitude": "-0.1278"
}
```

### Output (OpenSearch Document)
```json
{
  "id": "123",
  "artistId": "123",
  "name": "John Doe",
  "styles": ["traditional", "realism"],
  "location": "London, UK",
  "locationCity": "London",
  "locationCountry": "UK",
  "instagramHandle": "@johndoe_tattoo",
  "studioName": "Ink Studio",
  "portfolioImages": [],
  "geohash": "gcpvj0",
  "geoLocation": {
    "lat": 51.5074,
    "lon": -0.1278
  },
  "searchKeywords": "john doe ink studio traditional realism london",
  "lastUpdated": "2025-09-08T16:00:00.000Z",
  "pk": "ARTIST#123",
  "sk": "METADATA"
}
```

## Error Handling

### Retry Logic
- Failed records trigger Lambda retry mechanism
- After max retries, records are sent to dead letter queue
- Individual record failures don't stop batch processing

### Error Types
- **OpenSearch Connection Errors**: Logged and re-thrown for retry
- **Document Not Found (404)**: Logged as warning for DELETE operations
- **Validation Errors**: Logged with record details for debugging

## Monitoring

### CloudWatch Metrics
- Function duration and error rate
- DynamoDB stream processing lag
- OpenSearch indexing success/failure rates

### Structured Logging
All logs include:
- Correlation ID for distributed tracing
- Record identifiers (PK/SK)
- Operation type (INSERT/MODIFY/REMOVE)
- Error details with stack traces

### Log Examples

**Successful Processing:**
```json
{
  "timestamp": "2025-09-08T16:00:00.000Z",
  "level": "INFO",
  "message": "Successfully indexed document in OpenSearch",
  "correlationId": "abc-123",
  "data": {
    "documentId": "ARTIST#123",
    "artistId": "123"
  }
}
```

**Error Processing:**
```json
{
  "timestamp": "2025-09-08T16:00:00.000Z",
  "level": "ERROR",
  "message": "Error processing DynamoDB stream record",
  "correlationId": "abc-123",
  "data": {
    "error": "Connection timeout",
    "eventName": "INSERT",
    "pk": "ARTIST#123",
    "sk": "METADATA"
  }
}
```

## Testing

### Unit Tests
- Document transformation logic
- Error handling scenarios
- Environment variable validation
- OpenSearch client initialization

### Integration Tests
- End-to-end DynamoDB to OpenSearch sync
- Error recovery and retry behavior
- Dead letter queue processing

### Running Tests
```bash
npm test -- --testPathPattern=dynamodb-sync
```

## Deployment

This handler is deployed as part of the consolidated backend infrastructure via Terraform. It requires:

1. **DynamoDB Stream**: Configured on the main artists table
2. **Lambda Function**: With appropriate IAM permissions
3. **Dead Letter Queue**: For failed record processing
4. **OpenSearch Cluster**: Target for document indexing

## Performance Considerations

- **Batch Processing**: Processes multiple stream records in single invocation
- **Connection Reuse**: OpenSearch client cached across invocations
- **Memory Usage**: Optimized for typical artist record sizes
- **Timeout**: Configured for worst-case batch processing time

## Security

- **IAM Permissions**: Minimal required permissions for DynamoDB, OpenSearch, and Secrets Manager
- **Secrets Management**: OpenSearch credentials retrieved from AWS Secrets Manager
- **PII Protection**: Automatic scrubbing of sensitive data in logs
- **Network Security**: Deployed in VPC with appropriate security groups

## Requirements Compliance

This implementation satisfies the following requirements:

- **6.1**: OpenSearch integration with Terraform-deployed cluster
- **6.4**: Proper OpenSearch document indexing with correct field mapping
- **5.1**: Structured logger with PII scrubbing functionality
- **5.3**: Error handling for sync failures with dead letter queue support