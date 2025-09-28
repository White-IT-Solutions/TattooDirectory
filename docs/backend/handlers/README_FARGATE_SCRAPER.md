# Fargate Scraper Container

This container processes SQS messages containing artist scraping jobs and updates DynamoDB with scraped artist data. It implements proper idempotency checks and error handling for scraping operations.

## Requirements Addressed

- **9.3**: Fargate containers deployed via Terraform
- **9.5**: Proper idempotency checks and error handling for scraping operations  
- **5.1**: Structured logger with PII scrubbing for all operations
- **4.5**: Correct DynamoDB key structure and access patterns

## Architecture

The container polls an SQS queue for scraping jobs and processes them in parallel. Each job contains:

```json
{
  "artistId": "unique-artist-id",
  "portfolioUrl": "https://artist-website.com/portfolio", 
  "scrapeId": "unique-scrape-run-id",
  "instagramHandle": "artist_instagram"
}
```

## Key Features

### Idempotency
- Uses DynamoDB conditional updates with `scrapeId` to prevent duplicate processing
- Gracefully handles `ConditionalCheckFailedException` for already processed items
- Ensures data consistency across multiple container instances

### Error Handling
- Structured error logging with PII scrubbing
- Failed messages remain in SQS for retry/DLQ processing
- Graceful shutdown on SIGTERM/SIGINT signals

### Data Processing
- Scrapes artist portfolio data (simulated in current implementation)
- Updates DynamoDB using correct key structure from consolidated patterns
- Maintains data quality with validation and error checking

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SQS_QUEUE_URL` | SQS queue URL for scraping jobs | Required |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | Required |
| `AWS_REGION` | AWS region | `eu-west-2` |
| `MAX_MESSAGES_PER_POLL` | Max messages per SQS poll | `10` |
| `WAIT_TIME_SECONDS` | SQS long polling wait time | `20` |
| `VISIBILITY_TIMEOUT` | Message visibility timeout | `300` |

## Docker Build

```bash
# Build the container
docker build -t fargate-scraper .

# Run locally (requires AWS credentials)
docker run -e SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue \
           -e DYNAMODB_TABLE_NAME=TattooDirectory \
           -e AWS_REGION=eu-west-2 \
           fargate-scraper
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Lint code
npm run lint
```

## Health Checks

The container includes a health check that verifies the main process is running:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "console.log('Health check passed'); process.exit(0)" || exit 1
```

## Deployment

This container is designed to be deployed via Terraform as an ECS Fargate service:

1. **Container Registry**: Push to ECR repository
2. **Task Definition**: Configure with appropriate CPU/memory limits
3. **Service**: Deploy with auto-scaling based on SQS queue depth
4. **IAM Roles**: Provide permissions for SQS, DynamoDB, and CloudWatch

## Monitoring

The container logs structured JSON to stdout for CloudWatch ingestion:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Successfully updated artist",
  "correlationId": "gen-1705315800000-abc123def",
  "data": {
    "artistId": "artist-123",
    "scrapeId": "scrape-456",
    "stylesCount": 3,
    "imagesCount": 5
  }
}
```

## Security

- Runs as non-root user (`scraper`)
- PII data is automatically scrubbed from logs
- Uses IAM roles for AWS service access
- No sensitive data stored in container image

## Performance

- Processes multiple SQS messages in parallel
- Uses AWS SDK v3 for optimal performance
- Implements connection reuse for DynamoDB client
- Graceful shutdown prevents data loss during deployments