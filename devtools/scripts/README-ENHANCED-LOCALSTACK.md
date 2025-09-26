# Enhanced LocalStack Infrastructure

This directory contains scripts and utilities for managing the enhanced LocalStack infrastructure for the Tattoo Directory MVP project.

## Overview

The enhanced LocalStack infrastructure provides a comprehensive local development environment that mirrors AWS services with additional features for monitoring, health checking, and automated service management.

## Phase 1 Services

The current implementation includes the following AWS services:

- **DynamoDB**: Artist and studio data storage with streams enabled
- **OpenSearch**: Search and filtering capabilities
- **S3**: Static asset storage and CDN simulation
- **Lambda**: Serverless function execution
- **API Gateway**: REST API endpoints
- **CloudWatch Logs**: Centralized logging and monitoring
- **SNS**: Notification system for alerts and admin messages

## Scripts Overview

### Service Initialization

#### `init-localstack-services.ps1` (PowerShell)
Enhanced service initialization with comprehensive health checks and reporting.

```powershell
# Initialize all services
.\init-localstack-services.ps1

# Check health status
.\init-localstack-services.ps1 health

# Show detailed service status
.\init-localstack-services.ps1 status

# Show help
.\init-localstack-services.ps1 help
```

**Features:**
- Dependency-ordered service initialization
- Health check validation with timeout handling
- Comprehensive error reporting and recovery guidance
- Cross-platform compatibility (WSL/Git Bash support)

#### `init-localstack-services.sh` (Linux/macOS)
Linux equivalent with identical functionality for CI/CD environments.

```bash
# Initialize all services
./init-localstack-services.sh

# Check specific service
./init-localstack-services.sh check dynamodb

# Show detailed status
./init-localstack-services.sh status --detailed
```

### Health Monitoring

#### `health-check-localstack.ps1` (PowerShell)
Comprehensive health monitoring with continuous monitoring capabilities.

```powershell
# One-time health check
.\health-check-localstack.ps1

# Continuous monitoring (30-second intervals)
.\health-check-localstack.ps1 monitor

# Detailed status with error information
.\health-check-localstack.ps1 status -Detailed

# Custom monitoring interval
.\health-check-localstack.ps1 monitor -MonitorInterval 60
```

**Features:**
- Real-time service health monitoring
- Response time measurement
- Detailed error reporting and diagnostics
- Recovery instruction generation
- Continuous monitoring mode

#### `health-check-localstack.sh` (Linux/macOS)
Linux equivalent with environment variable configuration.

```bash
# Basic health check
./health-check-localstack.sh

# Continuous monitoring with custom interval
MONITOR_INTERVAL=60 ./health-check-localstack.sh monitor

# Detailed status information
DETAILED=true ./health-check-localstack.sh status
```

#### `health-check-localstack.bat` (Windows Batch)
Simplified Windows batch version for basic health checking.

```batch
REM Basic health check
health-check-localstack.bat

REM Continuous monitoring
health-check-localstack.bat monitor
```

### Service Management

#### `restart-localstack-with-logs.ps1`
Enhanced LocalStack restart with log streaming and health verification.

```powershell
# Restart with log streaming
.\restart-localstack-with-logs.ps1

# Restart without log streaming
.\restart-localstack-with-logs.ps1 -NoLogs

# Custom log tail lines
.\restart-localstack-with-logs.ps1 -LogLines 100
```

#### `start-localstack.sh` / `start-localstack.bat`
Platform-specific LocalStack startup scripts with proper configuration.

### Log Management

#### `stream-logs.ps1` / `stream-logs.sh`
Real-time log streaming from CloudWatch Logs.

```powershell
# Stream all logs
.\stream-logs.ps1

# Stream specific log group
.\stream-logs.ps1 -LogGroup "/aws/lambda/tattoo-directory-api"

# Stream with custom filter
.\stream-logs.ps1 -FilterPattern "ERROR"
```

#### `cleanup-logs.ps1` / `cleanup-logs.sh`
Automated log cleanup to manage local storage usage.

```powershell
# Clean logs older than 7 days
.\cleanup-logs.ps1

# Clean logs older than custom days
.\cleanup-logs.ps1 -RetentionDays 3

# Dry run (show what would be deleted)
.\cleanup-logs.ps1 -DryRun
```

## Service Initialization Order

The scripts follow a strict dependency order to ensure proper service startup:

1. **DynamoDB Table Creation** (`01-create-dynamodb-table.sh`)
   - Creates main table with streams enabled
   - Configures GSI for search patterns

2. **OpenSearch Domain** (`02-create-opensearch-domain.sh`)
   - Sets up search domain with proper configuration
   - Creates index templates and mappings

3. **S3 Buckets** (`03-create-s3-buckets.sh`)
   - Creates storage buckets for assets
   - Configures CORS and lifecycle policies

4. **Lambda Functions** (`04-create-lambda-functions.sh`)
   - Deploys all Lambda functions
   - Configures environment variables and permissions

5. **API Gateway** (`05-create-api-gateway.sh`)
   - Creates REST API structure
   - Defines resources and methods

6. **Lambda Integration** (`06-deploy-lambda.sh`)
   - Integrates Lambda functions with API Gateway
   - Configures method responses and permissions

7. **DynamoDB Streams** (`07-setup-dynamodb-stream-trigger.sh`)
   - Sets up stream event source mapping
   - Configures sync handler triggers

8. **CloudWatch Logs** (`08-create-cloudwatch-logs.sh`)
   - Creates log groups for all services
   - Sets retention policies

9. **SNS Topics** (`09-create-sns-topics.sh`)
   - Creates notification topics
   - Subscribes Lambda handlers

## Health Check Capabilities

### Service Coverage
- **LocalStack Core**: Basic connectivity and health endpoint
- **DynamoDB**: Table listing and basic operations
- **OpenSearch**: Domain listing and cluster health
- **S3**: Bucket listing and access verification
- **Lambda**: Function listing and invocation capability
- **API Gateway**: API listing and endpoint accessibility
- **SNS**: Topic listing and message publishing
- **CloudWatch Logs**: Log group listing and stream access

### Health Metrics
- **Response Time**: Service response time measurement
- **Connectivity**: Network connectivity verification
- **Resource Count**: Count of created resources per service
- **Error Detection**: Specific error message capture and analysis

### Recovery Guidance
- **Automatic Detection**: Identifies common failure patterns
- **Specific Instructions**: Provides targeted recovery steps
- **Escalation Path**: Clear escalation procedures for complex issues

## Configuration

### Environment Variables

```bash
# LocalStack Configuration
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_DEFAULT_REGION=eu-west-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Health Check Configuration
HEALTH_CHECK_TIMEOUT=10
MONITOR_INTERVAL=30
DETAILED=false

# Log Configuration
CLOUDWATCH_LOGS_RETENTION_DAYS=7
LOG_STREAM_LINES=50
```

### Docker Configuration
Services are configured via `docker-compose.local.yml` with:
- Persistent volumes for data retention
- Network configuration for service communication
- Resource limits for development environments
- Health check definitions

## Troubleshooting

### Common Issues

#### LocalStack Not Starting
```bash
# Check Docker status
docker ps

# Check LocalStack logs
docker logs localstack

# Restart LocalStack
./restart-localstack-with-logs.sh
```

#### Service Initialization Failures
```bash
# Check service health
./health-check-localstack.sh

# Re-initialize specific service
./init-localstack-services.sh init dynamodb

# Check detailed error logs
DETAILED=true ./health-check-localstack.sh status
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats localstack

# Check log retention settings
./cleanup-logs.sh -DryRun

# Restart with fresh state
./restart-localstack-with-logs.sh
```

### Recovery Procedures

1. **Complete Reset**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ./init-localstack-services.sh
   ```

2. **Service-Specific Reset**
   ```bash
   # Reset DynamoDB
   awslocal dynamodb delete-table --table-name tattoo-directory-local
   ./localstack-init/01-create-dynamodb-table.sh
   ```

3. **Log Cleanup**
   ```bash
   ./cleanup-logs.sh
   ./restart-localstack-with-logs.sh
   ```

## Development Workflow

### Daily Development
1. Start LocalStack: `./start-localstack.sh`
2. Initialize services: `./init-localstack-services.sh`
3. Verify health: `./health-check-localstack.sh`
4. Monitor logs: `./stream-logs.sh`

### Debugging Issues
1. Check service health: `./health-check-localstack.sh status`
2. Stream relevant logs: `./stream-logs.sh -LogGroup "/aws/lambda/function-name"`
3. Review error details: `DETAILED=true ./health-check-localstack.sh status`
4. Apply recovery procedures as needed

### Performance Monitoring
1. Enable continuous monitoring: `./health-check-localstack.sh monitor`
2. Monitor resource usage: `docker stats`
3. Clean up logs regularly: `./cleanup-logs.sh`

## Integration with CI/CD

The scripts are designed for cross-platform compatibility:

- **Linux/macOS**: Use `.sh` scripts directly
- **Windows**: Use `.ps1` scripts with PowerShell or `.bat` for basic functionality
- **CI/CD**: All scripts support non-interactive execution with proper exit codes

### GitHub Actions Integration
```yaml
- name: Setup LocalStack
  run: |
    ./devtools/scripts/start-localstack.sh
    ./devtools/scripts/init-localstack-services.sh
    ./devtools/scripts/health-check-localstack.sh

- name: Run Tests
  run: |
    # Your test commands here
    
- name: Cleanup
  run: |
    ./devtools/scripts/cleanup-logs.sh
    docker-compose down -v
```

## Future Enhancements (Phase 2)

Planned additions for Phase 2:
- **SQS**: Queue-based job processing
- **EventBridge**: Event-driven architecture
- **Step Functions Alternative**: Lambda-based workflow coordination
- **ECS/Fargate Alternative**: Container-based processing simulation
- **Performance Monitoring**: Advanced metrics and alerting
- **Configuration Profiles**: Environment-specific configurations

## Support

For issues and questions:
1. Check `docs/TROUBLESHOOTING.md` for common solutions
2. Review service logs using the log streaming utilities
3. Use health check scripts for diagnostic information
4. Consult the LocalStack documentation for service-specific issues