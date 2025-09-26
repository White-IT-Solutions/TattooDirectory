# CloudWatch Logs Integration for LocalStack

This directory contains comprehensive CloudWatch Logs integration utilities for the Tattoo Directory MVP project. The integration provides production-like logging capabilities in the local development environment using LocalStack.

## 🎯 Overview

The CloudWatch Logs integration includes:

- **Automated Log Group Creation**: Pre-configured log groups for all Lambda functions and API Gateway
- **Retention Policies**: 7-day retention for local development to manage storage
- **Real-time Log Streaming**: Live log viewing with filtering and multi-service support
- **Automated Cleanup**: Storage management and old log removal
- **Cross-platform Support**: Windows (PowerShell/Batch) and Linux (Bash) scripts

## 📁 File Structure

```
devtools/scripts/
├── 07-create-cloudwatch-logs.sh      # LocalStack initialization (Linux)
├── create-cloudwatch-logs.bat        # LocalStack initialization (Windows)
├── stream-logs.sh                    # Log streaming utility (Linux)
├── stream-logs.ps1                   # Log streaming utility (PowerShell)
├── cleanup-logs.sh                   # Log cleanup utility (Linux)
├── cleanup-logs.ps1                  # Log cleanup utility (PowerShell)
├── log-manager.sh                    # Unified log management (Linux)
├── setup-log-scripts.bat             # Setup script (Windows)
└── README-CLOUDWATCH-LOGS.md         # This documentation
```

## 🚀 Quick Start

### Windows Setup

1. **Run the setup script** (from project root):
   ```cmd
   .\devtools\scripts\setup-log-scripts.bat
   ```

2. **Start LocalStack** (if not already running):
   ```cmd
   docker-compose -f devtools\docker\docker-compose.local.yml up -d localstack
   ```

3. **Initialize CloudWatch Logs**:
   ```cmd
   .\devtools\scripts\create-cloudwatch-logs.bat
   ```

### Linux/Docker Setup

1. **Make scripts executable**:
   ```bash
   chmod +x localstack-init/07-create-cloudwatch-logs.sh
   chmod +x devtools/scripts/*.sh
   ```

2. **Start LocalStack** (if not already running):
   ```bash
   docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack
   ```

3. **CloudWatch Logs are automatically initialized** when LocalStack starts

## 📊 Pre-configured Log Groups

The integration automatically creates the following log groups:

### Lambda Functions
- `/aws/lambda/api-handler` - Main API Gateway handler
- `/aws/lambda/dynamodb-sync` - DynamoDB to OpenSearch sync
- `/aws/lambda/discover-studios` - Studio discovery handler
- `/aws/lambda/find-artists` - Artist search handler
- `/aws/lambda/queue-scraping` - Scraping queue management
- `/aws/lambda/secret-rotation` - Secrets rotation handler
- `/aws/lambda/rotate-nat-gateway-eip` - NAT Gateway rotation

### API Gateway
- `/aws/apigateway/tattoo-directory-api` - Main API logs
- `/aws/apigateway/tattoo-directory-api/access` - Access logs
- `/aws/apigateway/tattoo-directory-api/execution` - Execution logs

### Application & System
- `/tattoo-directory/application` - Application-level logs
- `/tattoo-directory/data-sync` - Data synchronization monitoring
- `/tattoo-directory/notifications` - SNS notification logs
- `/aws/lambda/system-health` - System health monitoring
- `/aws/lambda/log-cleanup` - Log maintenance

### Phase 2 (Future)
- `/aws/lambda/workflow-coordinator` - Step Functions alternative
- `/aws/lambda/scraping-processor` - ECS/Fargate alternative
- `/aws/lambda/queue-monitor` - SQS monitoring
- `/aws/lambda/event-processor` - EventBridge processing

## 🔍 Log Streaming

### Windows PowerShell

**List all log groups:**
```powershell
.\devtools\scripts\stream-logs.ps1 -List
```

**Stream specific log group:**
```powershell
.\devtools\scripts\stream-logs.ps1 -LogGroup "/aws/lambda/api-handler"
```

**Stream with filtering:**
```powershell
.\devtools\scripts\stream-logs.ps1 -LogGroup "/aws/lambda/api-handler" -Grep "ERROR"
```

**Stream all Lambda logs:**
```powershell
.\devtools\scripts\stream-logs.ps1 -All
```

**Show recent logs:**
```powershell
.\devtools\scripts\stream-logs.ps1 -LogGroup "/aws/lambda/dynamodb-sync" -Since "1h"
```

### Linux/Bash

**Unified log manager:**
```bash
./devtools/scripts/log-manager.sh list
./devtools/scripts/log-manager.sh stream /aws/lambda/api-handler
./devtools/scripts/log-manager.sh stream -a -g ERROR
./devtools/scripts/log-manager.sh monitor
```

**Direct streaming:**
```bash
./devtools/scripts/stream-logs.sh /aws/lambda/api-handler
./devtools/scripts/stream-logs.sh -a -g ERROR
./devtools/scripts/stream-logs.sh -s 30m /aws/lambda/dynamodb-sync
```

## 🧹 Log Cleanup

### Windows PowerShell

**Show storage report:**
```powershell
.\devtools\scripts\cleanup-logs.ps1 -Report
```

**Clean logs older than 3 days:**
```powershell
.\devtools\scripts\cleanup-logs.ps1 -Days 3
```

**Clean if storage exceeds 50MB:**
```powershell
.\devtools\scripts\cleanup-logs.ps1 -SizeMB 50
```

**Force cleanup without confirmation:**
```powershell
.\devtools\scripts\cleanup-logs.ps1 -Days 1 -Force
```

**Clean specific log group:**
```powershell
.\devtools\scripts\cleanup-logs.ps1 -Group "/aws/lambda/api-handler"
```

### Linux/Bash

**Using log manager:**
```bash
./devtools/scripts/log-manager.sh cleanup
```

**Direct cleanup:**
```bash
./devtools/scripts/cleanup-logs.sh -r                    # Report only
./devtools/scripts/cleanup-logs.sh -d 3                  # Clean older than 3 days
./devtools/scripts/cleanup-logs.sh -s 50                 # Clean if > 50MB
./devtools/scripts/cleanup-logs.sh -f -a                 # Force clean all
```

## 📈 Monitoring Dashboard

### Linux Only (Enhanced Features)

**Real-time monitoring dashboard:**
```bash
./devtools/scripts/log-manager.sh monitor
```

**Export logs for analysis:**
```bash
./devtools/scripts/log-manager.sh export /aws/lambda/api-handler -o api-logs.json
./devtools/scripts/log-manager.sh export /aws/lambda/dynamodb-sync --format csv
```

**Health check:**
```bash
./devtools/scripts/log-manager.sh health
```

## ⚙️ Configuration

### Environment Variables

Set these in `devtools/.env.local`:

```bash
# CloudWatch Logs Configuration
CLOUDWATCH_LOGS_RETENTION_DAYS=7        # Log retention period
LOCALSTACK_SERVICES=...,logs,...        # Include 'logs' service
```

### Docker Compose

The CloudWatch Logs service is automatically included in both Phase 1 and Phase 2 configurations:

```yaml
environment:
  - SERVICES=dynamodb,opensearch,s3,apigateway,lambda,iam,secretsmanager,logs,sns
  - CLOUDWATCH_LOGS_RETENTION_DAYS=7
  - LOGS_DELAY_TIME=500
```

## 🔧 Troubleshooting

### Common Issues

**1. "LocalStack is not running"**
```bash
# Check LocalStack status
docker-compose -f devtools/docker/docker-compose.local.yml ps

# Start LocalStack
docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack
```

**2. "CloudWatch Logs service not available"**
- Ensure `logs` is included in `LOCALSTACK_SERVICES`
- Check LocalStack health: `curl http://localhost:4566/_localstack/health`

**3. "No log groups found"**
- Run the initialization script: `./localstack-init/07-create-cloudwatch-logs.sh`
- Or manually: `.\devtools\scripts\create-cloudwatch-logs.bat`

**4. "Permission denied" (Linux)**
```bash
chmod +x devtools/scripts/*.sh
chmod +x localstack-init/*.sh
```

**5. "awslocal command not found"**
```bash
# Install awscli-local
pip install awscli-local

# Or use docker
docker exec -it tattoo-directory-localstack awslocal logs describe-log-groups
```

### Debug Mode

Enable debug logging by setting:
```bash
export LOCALSTACK_DEBUG=1
export LOGS_DELAY_TIME=0
```

## 📝 Integration with Lambda Functions

### Automatic Log Group Association

Lambda functions automatically write to their respective log groups:

```javascript
// In Lambda function code
console.log('This will appear in /aws/lambda/function-name');
console.error('Error logs are also captured');
```

### Structured Logging

Use the common logger utility for structured logs:

```javascript
import { createLogger } from '../../common/logger.js';

export const handler = async (event, context) => {
    const logger = createLogger(context, event);
    
    logger.info('Processing request', { 
        requestId: context.awsRequestId,
        eventType: event.eventName 
    });
    
    try {
        // Your logic here
        logger.success('Request completed successfully');
    } catch (error) {
        logger.error('Request failed', { 
            error: error.message,
            stack: error.stack 
        });
        throw error;
    }
};
```

## 🔄 Automated Cleanup

### Scheduled Cleanup (Optional)

You can set up automated cleanup using cron (Linux) or Task Scheduler (Windows):

**Linux cron example:**
```bash
# Clean logs daily at 2 AM
0 2 * * * /path/to/project/devtools/scripts/cleanup-logs.sh -d 7 -f
```

**Windows Task Scheduler:**
- Create a daily task
- Action: `powershell.exe`
- Arguments: `-File "C:\path\to\project\devtools\scripts\cleanup-logs.ps1" -Days 7 -Force`

## 🎯 Best Practices

### Development Workflow

1. **Start with monitoring**: Use `log-manager.sh monitor` to get an overview
2. **Stream specific services**: Focus on the service you're developing
3. **Use filtering**: Apply grep patterns to find specific issues
4. **Regular cleanup**: Run cleanup weekly or when storage is high
5. **Export for analysis**: Save logs for deeper investigation

### Performance Tips

1. **Limit log retention**: 7 days is usually sufficient for local development
2. **Use specific log groups**: Avoid streaming all logs unless necessary
3. **Apply filters early**: Use grep patterns to reduce noise
4. **Monitor storage**: Keep total log storage under 100MB

### Security Considerations

1. **No sensitive data**: Ensure logs don't contain secrets or PII
2. **Local only**: These logs are for development, not production
3. **Regular cleanup**: Don't let logs accumulate indefinitely
4. **Access control**: Logs contain application internals

## 📚 Additional Resources

- [LocalStack CloudWatch Logs Documentation](https://docs.localstack.cloud/user-guide/aws/logs/)
- [AWS CloudWatch Logs API Reference](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/)
- [Project Architecture Documentation](../../docs/)

## 🤝 Contributing

When adding new Lambda functions or services:

1. Add the log group to `07-create-cloudwatch-logs.sh`
2. Update this README with the new log group
3. Test log streaming and cleanup with the new service
4. Ensure proper structured logging in the function code

---

**Note**: This integration is designed for local development with LocalStack. Production CloudWatch Logs configuration is handled separately through Terraform in the `infrastructure/` directory.