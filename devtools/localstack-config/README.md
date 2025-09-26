# Enhanced LocalStack Configuration

This directory contains configuration files for the enhanced LocalStack infrastructure setup.

## Configuration Files

### `localstack.conf`
Main LocalStack configuration file with service-specific settings:
- DynamoDB: Streams enabled, optimized performance settings
- OpenSearch: Domain endpoint strategy, single cluster mode
- Lambda: Docker executor with stay-open mode for better performance
- CloudWatch Logs: 7-day retention, optimized delay times
- SNS: Fast message processing, signature validation disabled for local dev
- SQS: No delay for recently deleted queues (Phase 2)
- EventBridge: Lambda integration with optimized delay times (Phase 2)
- CloudWatch Metrics: Fast metrics processing (Phase 2)

### `services.json`
Service configuration and endpoint mapping for both phases:
- **Phase 1**: Core platform services (DynamoDB, OpenSearch, S3, API Gateway, Lambda, CloudWatch Logs, SNS)
- **Phase 2**: Async data aggregation services (adds SQS, EventBridge, CloudWatch Metrics)

## Data Persistence

The following directories are created for persistent data storage:

- `../localstack-data/`: Main LocalStack data persistence (DynamoDB tables, OpenSearch indices, S3 objects)
- `../localstack-logs/`: LocalStack service logs for debugging and monitoring
- `../localstack-tmp/`: Temporary files (Lambda execution artifacts, etc.)

## Phase Configuration

### Phase 1: Core Platform Services
- **Services**: DynamoDB, OpenSearch, S3, API Gateway, Lambda, IAM, Secrets Manager, CloudWatch Logs, SNS
- **Memory**: 1536M
- **CPU**: 1.0 cores
- **Use Case**: Basic platform functionality, artist profiles, search

### Phase 2: Async Data Aggregation Services  
- **Services**: All Phase 1 services + SQS, EventBridge, CloudWatch Metrics
- **Memory**: 2G
- **CPU**: 1.5 cores
- **Use Case**: Data scraping pipelines, event-driven processing, monitoring

## Environment Variables

Key environment variables for service configuration:

```bash
# Phase selection
LOCALSTACK_PHASE=phase1  # or phase2

# Service lists
LOCALSTACK_PHASE1_SERVICES=dynamodb,opensearch,s3,apigateway,lambda,iam,secretsmanager,logs,sns
LOCALSTACK_PHASE2_SERVICES=dynamodb,opensearch,s3,apigateway,lambda,iam,secretsmanager,logs,sns,sqs,events,cloudwatch

# Resource limits
LOCALSTACK_MEMORY_LIMIT=1536M
LOCALSTACK_PHASE2_MEMORY_LIMIT=2G

# Service endpoints (internal container communication)
LOCALSTACK_INTERNAL_ENDPOINT=http://localstack:4566
DYNAMODB_INTERNAL_ENDPOINT=http://localstack:4566
# ... (see .env.local for complete list)

# Service endpoints (external host communication)  
LOCALSTACK_EXTERNAL_ENDPOINT=http://localhost:4566
DYNAMODB_EXTERNAL_ENDPOINT=http://localhost:4566
# ... (see .env.local for complete list)
```

## Usage

1. **Start Phase 1 (default)**:
   ```bash
   docker-compose up localstack
   ```

2. **Start Phase 2**:
   ```bash
   docker-compose --profile phase2 up localstack-phase2
   ```

3. **Check service health**:
   ```bash
   curl http://localhost:4566/_localstack/health
   ```

4. **View service logs**:
   ```bash
   docker-compose logs localstack
   ```

## Service Endpoints

All services are accessible via `http://localhost:4566` with service-specific paths:

- **DynamoDB**: `http://localhost:4566` (use AWS SDK with endpoint override)
- **OpenSearch**: `http://localhost:4566/_aws/opensearch/`
- **S3**: `http://localhost:4566` (use AWS SDK with endpoint override)
- **API Gateway**: `http://localhost:4566/restapis/`
- **Lambda**: `http://localhost:4566/2015-03-31/functions/`
- **CloudWatch Logs**: `http://localhost:4566` (use AWS SDK with endpoint override)
- **SNS**: `http://localhost:4566` (use AWS SDK with endpoint override)
- **SQS**: `http://localhost:4566` (use AWS SDK with endpoint override) - Phase 2
- **EventBridge**: `http://localhost:4566` (use AWS SDK with endpoint override) - Phase 2
- **CloudWatch Metrics**: `http://localhost:4566` (use AWS SDK with endpoint override) - Phase 2

## Troubleshooting

1. **Container won't start**: Check Docker resources and port conflicts
2. **Services not responding**: Verify health check endpoint and wait for full startup
3. **Data not persisting**: Ensure volume directories exist and have proper permissions
4. **Lambda functions failing**: Check Docker socket mount and network configuration