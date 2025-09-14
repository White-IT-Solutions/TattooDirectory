# Local Development Troubleshooting Guide

## Overview

This guide provides comprehensive debugging procedures for the Tattoo Artist Directory MVP local development environment, covering frontend, backend, and infrastructure debugging techniques.

## Common Issues

### Backend Issues

#### Lambda Function Not Starting

```bash
# Check container logs
docker logs tattoo-directory-backend

# Verify environment variables
docker exec tattoo-directory-backend env

# Check if RIE is running
docker exec tattoo-directory-backend ps aux
```

#### Database Connection Issues

```bash
# Check LocalStack health
npm run monitor:health

# Verify DynamoDB table exists
aws --endpoint-url=http://localhost:4566 dynamodb describe-table --table-name tattoo-directory-local

# Check network connectivity
docker exec tattoo-directory-backend ping localstack
```

### Frontend Issues

#### Hot Reloading Not Working

```bash
# Check if files are being watched
docker logs tattoo-directory-frontend

# Verify volume mounts
docker inspect tattoo-directory-frontend

# Restart with fresh build
docker-compose -f docker-compose.local.yml up --build frontend
```

#### API Connection Issues

```bash
# Check backend connectivity from frontend
docker exec tattoo-directory-frontend curl http://backend:8080/2015-03-31/functions/function/invocations

# Verify environment variables
docker exec tattoo-directory-frontend env | grep NEXT_PUBLIC
```

### LocalStack Issues

#### Services Not Starting

```bash
# Check LocalStack logs
docker logs tattoo-directory-localstack

# Verify Docker socket mount
docker inspect tattoo-directory-localstack

# Check available memory
docker stats tattoo-directory-localstack
```

#### Data Persistence Issues

```bash
# Check volume mounts
docker volume ls | grep localstack

# Verify data directory
docker exec tattoo-directory-localstack ls -la /var/lib/localstack
```

## Quick Debugging Checklist

When encountering issues, follow this quick checklist:

1. **Check service status**: `docker ps` and `npm run local:health`
2. **Review logs**: `docker-compose -f docker-compose.local.yml logs`
3. **Verify environment variables**: Check `.env.local` files
4. **Test connectivity**: Use curl to test API endpoints
5. **Check resource usage**: `docker stats` for container resources
6. **Restart services**: `npm run local:restart` if needed



## Quick Start

### Enable Debug Mode

```bash
# Start with backend debugging enabled
npm run debug:backend

# Start with frontend debugging enabled  
npm run debug:frontend

# Start with both backend and frontend debugging
npm run debug:start
```

### Access Debug Interfaces

- **Backend Debugger**: `http://localhost:9229` (Node.js Inspector)
- **Frontend Debugger**: `http://localhost:9230` (Next.js Inspector)
- **Frontend App**: `http://localhost:3000`
- **API Documentation**: `http://localhost:8080`
- **LocalStack**: `http://localhost:4566`

## VS Code Debugging

### Available Debug Configurations

1. **Debug Backend (Docker)** - Attach to backend Lambda container
2. **Debug Frontend (Next.js)** - Attach to frontend development server
3. **Debug Integration Tests** - Debug integration test suite
4. **Debug E2E Tests** - Debug end-to-end tests

### Setting Breakpoints

1. Open the file you want to debug
2. Click in the gutter next to line numbers to set breakpoints
3. Start the appropriate debug configuration
4. Trigger the code path (make API call, navigate to page, etc.)

### Debug Console Commands

```javascript
// In the debug console, you can execute:
process.env.NODE_ENV
AWS.config
console.log('Debug message')
```

### VS Code Tasks

Use Ctrl+Shift+P and search for "Tasks: Run Task" to access:

- **Start Local Environment** - Start all services
- **Stop Local Environment** - Stop all services  
- **Start with Debug (Backend)** - Start with backend debugging
- **Start with Debug (Frontend)** - Start with frontend debugging
- **Start Log Aggregator** - Begin log collection
- **Start Log Viewer** - Interactive log viewer
- **Monitor LocalStack** - Watch LocalStack services
- **Health Check All Services** - Verify service status
- **Run Integration Tests** - Execute integration test suite
- **Run E2E Tests** - Execute end-to-end tests

### Quick Diagnostic Commands

Before diving into specific issues, run these commands to gather system information:

```bash
# Check Docker status
docker --version
docker info
docker-compose --version

# Check Node.js and npm
node --version
npm --version

# Check running containers
docker ps

# Check container logs
docker-compose -f dev-tools/docker/docker-compose.local.yml logs

# Check service health
npm run local:health
```

## Frontend Debugging

### Enable Frontend Debug Mode

```bash
# Method 1: Environment variable
ENABLE_FRONTEND_DEBUG=true npm run local:start

# Method 2: NPM script
npm run debug:frontend
```

### Debugging Next.js Components

1. **Set breakpoints** in your React components
2. **Start debug mode** for frontend
3. **Attach VS Code debugger** using "Debug Frontend (Next.js)" configuration
4. **Navigate to pages** to trigger breakpoints

### Browser DevTools Integration

The frontend runs with enhanced source maps for better debugging:

1. Open browser DevTools (F12)
2. Go to Sources tab
3. Find your source files under `webpack://`
4. Set breakpoints directly in browser

### React DevTools

Install React DevTools browser extension for component debugging:

- **Chrome**: React Developer Tools
- **Firefox**: React Developer Tools

## Log Analysis

### Start Log Aggregation

```bash
# Start log aggregator (collects all container logs)
npm run logs:start

# View logs with filtering
npm run logs:view

# View only backend logs
npm run logs:backend

# View only frontend logs  
npm run logs:frontend

# View only errors
npm run logs:errors
```

### Browser Developer Tools

#### Console Debugging

```javascript
// Add debug logging to React components
console.log('Component props:', props);
console.log('Component state:', state);

// Debug API calls
console.log('API request:', { url, method, data });
console.log('API response:', response);

// Debug React hooks
useEffect(() => {
  console.log('Effect triggered:', dependencies);
}, [dependencies]);
```

#### Network Tab Analysis

1. **Open Developer Tools** (F12)
2. **Navigate to Network tab**
3. **Filter by XHR/Fetch** to see API calls
4. **Check request/response details**:
   - Request URL and method
   - Request headers and payload
   - Response status and body
   - Response time

#### React Developer Tools

Install React Developer Tools browser extension:

```bash
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

**Usage:**
1. Open Developer Tools
2. Navigate to "Components" or "Profiler" tab
3. Inspect component props and state
4. Track component re-renders

### VS Code Debugging

#### Frontend Debug Configuration

Create or update `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend (Chrome)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "ready - started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Attach to Frontend Container",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}/frontend/src",
      "remoteRoot": "/app/src",
      "protocol": "inspector"
    }
  ]
}
```

#### Debugging Steps

1. **Set breakpoints** in your code
2. **Start debug session** (F5 or Debug menu)
3. **Navigate to frontend** in browser
4. **Execution will pause** at breakpoints
5. **Inspect variables** in Debug Console

### Common Frontend Issues

#### Issue: API Connection Errors

**Debugging steps:**

1. **Check environment variables**:
```bash
# Verify frontend environment
cat frontend/.env.local

# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:9000/2015-03-31/functions/function/invocations
```

2. **Test API directly**:
```bash
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"httpMethod": "GET", "path": "/v1/health"}'
```

3. **Check browser console** for CORS errors
4. **Verify backend container** is running:
```bash
docker-compose -f docker-compose.local.yml ps backend
```

#### Issue: Hot Reload Not Working

**Debugging steps:**

1. **Check file watcher limits** (Linux):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. **Enable polling** if needed:
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
}
```

3. **Check volume mounts** in docker-compose.local.yml:
```yaml
frontend:
  volumes:
    - ./frontend/src:/app/src:ro
    - ./frontend/public:/app/public:ro
```

## Backend Debugging

### Enable Backend Debug Mode

```bash
# Method 1: Environment variable
ENABLE_BACKEND_DEBUG=true npm run local:start

# Method 2: NPM script
npm run debug:backend

# Method 3: Docker Compose override
docker-compose -f docker-compose.local.yml up -d backend
```

### Debugging Lambda Functions

1. **Set breakpoints** in your Lambda handler code
2. **Start debug mode** using one of the methods above
3. **Attach VS Code debugger** using "Debug Backend (Docker)" configuration
4. **Make API calls** to trigger your breakpoints

### Lambda Handler Debugging Example

```javascript
// In backend/src/handlers/api-handler/index.js
exports.handler = async (event, context) => {
    debugger; // This will pause execution when debugger is attached
    
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    
    // Your handler logic here
    const response = await processRequest(event);
    
    return response;
};
```

### Environment Variables for Debugging

```bash
# Enable debug mode
ENABLE_DEBUG=true

# Set log level
LOG_LEVEL=debug

# Enable AWS SDK debugging
AWS_SDK_LOAD_CONFIG=1
AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1
```

### Lambda Function Debugging

#### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "name": "Debug Backend Lambda",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/backend/src",
  "remoteRoot": "/var/task/src",
  "protocol": "inspector",
  "restart": true,
  "timeout": 30000
}
```

#### Enable Debug Mode

Modify `backend/docker-entrypoint.sh`:

```bash
#!/bin/sh

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
    # Running locally with RIE and debugging
    if [ "$DEBUG" = "true" ]; then
        exec /usr/bin/aws-lambda-rie node --inspect=0.0.0.0:9229 /usr/local/bin/npx aws-lambda-ric $1
    else
        exec /usr/bin/aws-lambda-rie /usr/local/bin/npx aws-lambda-ric $1
    fi
else
    # Running in AWS Lambda
    exec /usr/local/bin/npx aws-lambda-ric $1
fi
```

Update `docker-compose.local.yml`:

```yaml
backend:
  environment:
    - DEBUG=true
  ports:
    - "9000:8080"
    - "9229:9229"  # Debug port
```

#### Debugging Steps

1. **Start containers** with debug enabled
2. **Attach VS Code debugger** to port 9229
3. **Set breakpoints** in Lambda handler code
4. **Make API request** to trigger breakpoint
5. **Step through code** and inspect variables

### CloudWatch-Style Logging

Implement structured logging in Lambda functions:

```javascript
// backend/src/common/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
```

Usage in Lambda handlers:

```javascript
const logger = require('../common/logger');

exports.handler = async (event, context) => {
  logger.info('Lambda invocation started', {
    requestId: context.awsRequestId,
    event: event
  });

  try {
    // Your Lambda logic here
    const result = await processRequest(event);
    
    logger.info('Lambda invocation completed', {
      requestId: context.awsRequestId,
      result: result
    });
    
    return result;
  } catch (error) {
    logger.error('Lambda invocation failed', {
      requestId: context.awsRequestId,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};
```

### Database Debugging

#### DynamoDB Debugging

```bash
# Check if table exists
docker-compose -f docker-compose.local.yml exec localstack \
  awslocal dynamodb list-tables

# Describe table structure
docker-compose -f docker-compose.local.yml exec localstack \
  awslocal dynamodb describe-table --table-name tattoo-directory-local

# Scan table contents (limit results)
docker-compose -f docker-compose.local.yml exec localstack \
  awslocal dynamodb scan --table-name tattoo-directory-local --limit 5

# Query specific item
docker-compose -f docker-compose.local.yml exec localstack \
  awslocal dynamodb get-item \
  --table-name tattoo-directory-local \
  --key '{"PK": {"S": "ARTIST#artist-001"}, "SK": {"S": "PROFILE"}}'
```

#### OpenSearch Debugging

```bash
# Check OpenSearch health
curl http://localhost:4566/_cluster/health

# List indices
curl http://localhost:4566/_cat/indices

# Search for documents
curl -X GET "http://localhost:4566/artists/_search" \
  -H "Content-Type: application/json" \
  -d '{"query": {"match_all": {}}}'

# Check index mapping
curl http://localhost:4566/artists/_mapping
```

### Common Backend Issues

#### Issue: AWS SDK Connection Errors

**Debugging steps:**

1. **Check environment variables**:
```bash
docker-compose -f docker-compose.local.yml exec backend env | grep AWS
```

2. **Test LocalStack connectivity**:
```bash
docker-compose -f docker-compose.local.yml exec backend \
  curl http://localstack:4566/_localstack/health
```

3. **Verify AWS configuration**:
```javascript
// backend/src/common/aws-config.js
console.log('AWS Config:', {
  region: AWS.config.region,
  endpoint: AWS.config.endpoint,
  accessKeyId: AWS.config.credentials?.accessKeyId
});
```

#### Issue: Lambda Handler Errors

**Debugging steps:**

1. **Check Lambda logs**:
```bash
docker-compose -f docker-compose.local.yml logs backend
```

2. **Test handler directly**:
```bash
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "path": "/v1/health",
    "headers": {},
    "queryStringParameters": null,
    "body": null
  }'
```

3. **Add debug logging** to handler:
```javascript
exports.handler = async (event, context) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
  // Your handler logic
};
```

## Infrastructure Debugging

### Docker Container Debugging

#### Container Inspection

```bash
# List all containers
docker ps -a

# Inspect container configuration
docker inspect <container_name>

# Check container logs
docker logs <container_name>

# Execute shell in running container
docker exec -it <container_name> /bin/sh

# Check container processes
docker exec <container_name> ps aux

# Check container filesystem
docker exec <container_name> ls -la /var/task
```

#### Resource Monitoring

```bash
# Monitor container resources
docker stats

# Check container resource limits
docker inspect <container_name> | grep -A 10 "Resources"

# Monitor system resources
htop  # Linux/macOS
# or
top
```

### LocalStack Debugging

#### Service Health Checks

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Check specific service status
curl http://localhost:4566/_localstack/health | jq '.services.dynamodb'

# List LocalStack services
curl http://localhost:4566/_localstack/info
```

#### LocalStack Logs

```bash
# View LocalStack logs
docker-compose -f docker-compose.local.yml logs localstack

# Follow LocalStack logs in real-time
docker-compose -f docker-compose.local.yml logs -f localstack

# Filter logs by service
docker-compose -f docker-compose.local.yml logs localstack | grep dynamodb
```

### Network Debugging

#### Container Networking

```bash
# List Docker networks
docker network ls

# Inspect network configuration
docker network inspect tattoo-artist-directory_default

# Test connectivity between containers
docker-compose -f docker-compose.local.yml exec backend ping localstack
docker-compose -f docker-compose.local.yml exec frontend ping backend
```

#### Port Debugging

```bash
# Check port bindings
docker port <container_name>

# Test port connectivity from host
telnet localhost 3000
telnet localhost 4566
telnet localhost 8080
telnet localhost 9000

# Check what's using ports
# Linux/macOS:
lsof -i :3000
# Windows:
netstat -ano | findstr :3000
```

## Performance Debugging

### Container Resource Usage

```bash
# Monitor resource usage
docker stats

# Check container resource limits
docker inspect tattoo-directory-backend | grep -A 10 Resources

# Monitor system resources
npm run local:monitor:live
```

### Application Performance

#### Backend Performance

```bash
# Enable performance logging
LOG_LEVEL=debug npm run debug:backend

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:9000/2015-03-31/functions/function/invocations
```

#### Frontend Performance

1. Open browser DevTools
2. Go to Performance tab
3. Record performance while navigating
4. Analyze Core Web Vitals in Lighthouse tab

### Database Performance

```bash
# Monitor DynamoDB operations
aws --endpoint-url=http://localhost:4566 logs describe-log-groups

# Check OpenSearch performance
curl http://localhost:4566/_nodes/stats
```

### Issue: Slow Container Startup

**Symptoms:**
- Services take more than 2 minutes to start
- Health checks timeout
- Containers restart repeatedly

**Solutions:**

1. **Increase Docker resources:**
   - Allocate more RAM and CPU to Docker Desktop
   - Ensure SSD storage for Docker data

2. **Optimize Docker images:**
```bash
# Rebuild images with no cache
docker-compose -f dev-tools/docker/docker-compose.local.yml build --no-cache

# Use multi-stage builds to reduce image size
# (Already implemented in Dockerfiles)
```

3. **Check system resources:**
```bash
# Monitor system resources during startup
top        # Linux/macOS
taskmgr    # Windows

# Check Docker stats
docker stats
```

### Issue: High Memory Usage

**Symptoms:**
- System becomes unresponsive
- Docker Desktop shows high memory usage
- Containers are killed by OOM killer

**Solutions:**

1. **Set container memory limits:**
Edit `dev-tools/docker/docker-compose.local.yml`:
```yaml
services:
  localstack:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

2. **Monitor memory usage:**
```bash
# Check container memory usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Check system memory
free -h  # Linux
vm_stat  # macOS
```

3. **Optimize LocalStack:**
```bash
# Reduce LocalStack services if not needed
# Edit dev-tools/docker/docker-compose.local.yml SERVICES environment variable
SERVICES=dynamodb,opensearch,s3,apigateway
```

### Application Performance

#### Frontend Performance

```javascript
// Measure component render time
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component render:', {
    id,
    phase,
    actualDuration
  });
}

<Profiler id="ArtistCard" onRender={onRenderCallback}>
  <ArtistCard {...props} />
</Profiler>
```

#### Backend Performance

```javascript
// Measure Lambda execution time
const startTime = Date.now();

// Your Lambda logic here

const executionTime = Date.now() - startTime;
console.log('Lambda execution time:', executionTime, 'ms');
```

### Database Performance

#### DynamoDB Performance

```javascript
// Measure DynamoDB query time
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const startTime = Date.now();
const result = await dynamodb.query(params).promise();
const queryTime = Date.now() - startTime;

console.log('DynamoDB query time:', queryTime, 'ms');
console.log('Items returned:', result.Items.length);
console.log('Consumed capacity:', result.ConsumedCapacity);
```

#### OpenSearch Performance

```bash
# Monitor OpenSearch performance
curl "http://localhost:4566/_nodes/stats"

# Check query performance
curl -X GET "http://localhost:4566/artists/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {"match_all": {}},
    "profile": true
  }'
```

## Debugging Tools and Utilities

### LocalStack Monitoring

#### Monitor LocalStack Services

```bash
# Check service health
npm run monitor:health

# Generate comprehensive report
npm run monitor:report

# Watch services in real-time
npm run monitor:localstack

# Reset all LocalStack data
npm run monitor:reset
```

#### LocalStack Monitor Features

The LocalStack monitor provides:

- **Service health checks** for all AWS services
- **DynamoDB table listing** with item counts
- **S3 bucket monitoring**
- **OpenSearch cluster status**
- **API Gateway endpoint listing**
- **Real-time service watching**

#### Manual LocalStack Debugging

```bash
# Check LocalStack health directly
curl http://localhost:4566/_localstack/health

# List DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Check OpenSearch cluster
curl http://localhost:4566/_cluster/health

# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls
```

### Container Debugging

```bash
# Execute shell in running container
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend /bin/sh
docker-compose -f dev-tools/docker/docker-compose.local.yml exec frontend /bin/sh

# View container filesystem
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend ls -la /var/task

# Check container processes
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend ps aux
```

### Log Analysis

```bash
# Follow logs for specific service
docker-compose -f dev-tools/docker/docker-compose.local.yml logs -f backend

# View logs with timestamps
docker-compose -f dev-tools/docker/docker-compose.local.yml logs -t

# Filter logs by time
docker-compose -f dev-tools/docker/docker-compose.local.yml logs --since="2024-01-01T00:00:00"
```

### Log Viewer Features

The enhanced log viewer provides:

- **Real-time filtering** by service, log level, and keywords
- **Color-coded output** for different services and log levels
- **Search highlighting** for specific terms
- **Time-based filtering** (show logs from last N minutes)
- **Save filtered logs** to file for analysis

### Log Viewer Commands

```bash
# Interactive log viewer
node scripts/log-viewer.js --follow

# Filter by service
node scripts/log-viewer.js backend frontend

# Filter by log level
node scripts/log-viewer.js --level ERROR

# Search for specific terms
node scripts/log-viewer.js --grep "search"

# Show last 100 lines and follow
node scripts/log-viewer.js --tail 100 --follow
```

### Log Aggregator Features

```bash
# Start with specific log level
LOG_LEVEL=debug node scripts/log-aggregator.js

# Aggregate specific services only
node scripts/log-aggregator.js backend frontend

# Save to custom log file
LOG_FILE=./custom.log node scripts/log-aggregator.js
```

### Network Debugging

```bash
# Test HTTP endpoints
curl -v http://localhost:3000
curl -v http://localhost:4566/_localstack/health

# Test from inside containers
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend curl -v http://localstack:4566/_localstack/health
```

### Log Aggregation

Create a log aggregation script:

```bash
#!/bin/bash
# scripts/debug-logs.sh

echo "=== Docker Container Status ==="
docker ps

echo -e "\n=== Service Health Checks ==="
curl -s http://localhost:4566/_localstack/health | jq '.'
curl -s http://localhost:3000 > /dev/null && echo "Frontend: OK" || echo "Frontend: FAIL"
curl -s http://localhost:8080 > /dev/null && echo "Swagger UI: OK" || echo "Swagger UI: FAIL"

echo -e "\n=== Recent Logs ==="
docker-compose -f docker-compose.local.yml logs --tail=20

echo -e "\n=== Container Resource Usage ==="
docker stats --no-stream
```

### Environment Validation

Create an environment validation script:

```javascript
// scripts/validate-environment.js
const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  const checks = [
    {
      name: 'Root .env.local exists',
      check: () => fs.existsSync('.env.local')
    },
    {
      name: 'Frontend .env.local exists',
      check: () => fs.existsSync('frontend/.env.local')
    },
    {
      name: 'Docker Compose file exists',
      check: () => fs.existsSync('docker-compose.local.yml')
    },
    {
      name: 'Node modules installed',
      check: () => fs.existsSync('node_modules') && fs.existsSync('frontend/node_modules')
    }
  ];

  console.log('Environment Validation:');
  checks.forEach(({ name, check }) => {
    const result = check() ? '✅' : '❌';
    console.log(`${result} ${name}`);
  });
}

validateEnvironment();
```

### Debug Mode Configuration

Add debug mode to package.json:

```json
{
  "scripts": {
    "local:start:debug": "DEBUG=true docker-compose -f docker-compose.local.yml up -d",
    "local:logs:debug": "docker-compose -f docker-compose.local.yml logs -f",
    "local:validate": "node scripts/validate-environment.js",
    "local:debug-info": "./scripts/debug-logs.sh"
  }
}
```

## Debugging Workflows

### Issue Investigation Workflow

1. **Identify the problem area**:
   - Frontend (UI/UX issues)
   - Backend (API errors)
   - Database (data issues)
   - Infrastructure (container/network issues)

2. **Gather information**:
   - Check service status
   - Review logs
   - Test connectivity
   - Validate configuration

3. **Isolate the issue**:
   - Test individual components
   - Use debugging tools
   - Add logging/breakpoints

4. **Fix and verify**:
   - Implement solution
   - Test thoroughly
   - Monitor for regression

### Performance Investigation Workflow

1. **Identify performance bottleneck**:
   - Frontend rendering
   - API response times
   - Database queries
   - Network latency

2. **Measure baseline performance**:
   - Use browser dev tools
   - Add timing logs
   - Monitor resource usage

3. **Optimize and test**:
   - Implement optimizations
   - Measure improvements
   - Validate under load

### API Debugging Workflow

1. **Set breakpoints** in Lambda handler
2. **Start backend debug mode**: `npm run debug:backend`
3. **Attach VS Code debugger**: F5 → "Debug Backend (Docker)"
4. **Make API call** via Swagger UI or curl
5. **Step through code** in VS Code debugger

### Frontend Debugging Workflow

1. **Set breakpoints** in React components
2. **Start frontend debug mode**: `npm run debug:frontend`
3. **Open browser DevTools** and/or attach VS Code debugger
4. **Navigate to page** to trigger breakpoints
5. **Inspect component state** and props

### Integration Testing Workflow

1. **Start local environment**: `npm run local:start`
2. **Set breakpoints** in test files
3. **Run debug configuration**: F5 → "Debug Integration Tests"
4. **Step through test execution**
5. **Verify service interactions**

## Platform-Specific Issues

### Windows-Specific Issues

**Issue: File Path Problems**
```bash
# Use forward slashes in Docker commands
docker run -v //c/Users/username/project:/app image

# Or use PowerShell with proper escaping
docker run -v "C:\Users\username\project:/app" image
```

**Issue: WSL2 Integration**
```bash
# Enable WSL2 integration in Docker Desktop
# Settings → Resources → WSL Integration

# Verify WSL2 is default
wsl --set-default-version 2
```

### macOS-Specific Issues

**Issue: File Permissions**
```bash
# Fix file permissions for Docker volumes
sudo chown -R $(whoami) ./project-directory

# Or use Docker Desktop file sharing settings
```

**Issue: M1/M2 Chip Compatibility**
```bash
# Use platform-specific images
docker pull --platform linux/amd64 localstack/localstack:3.0
```

### Linux-Specific Issues

**Issue: Docker Permission Denied**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or use newgrp
newgrp docker

# Verify group membership
groups $USER
```

**Issue: Systemd Service Management**
```bash
# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Check service status
sudo systemctl status docker
```

## LocalStack Issues

### Issue: LocalStack Services Not Starting

**Symptoms:**
- LocalStack health check fails
- AWS SDK connection errors
- Services show as "unhealthy" in Docker

**Solutions:**

1. **Check LocalStack logs:**
```bash
docker-compose -f dev-tools/docker/docker-compose.local.yml logs localstack
```

2. **Verify LocalStack configuration:**
```bash
# Check environment variables
docker-compose -f dev-tools/docker/docker-compose.local.yml exec localstack env | grep LOCALSTACK

# Test LocalStack health endpoint
curl http://localhost:4566/_localstack/health
```

3. **Restart LocalStack:**
```bash
docker-compose -f dev-tools/docker/docker-compose.local.yml restart localstack

# Or rebuild if configuration changed
docker-compose -f dev-tools/docker/docker-compose.local.yml up --build localstack
```

4. **Clear LocalStack data:**
```bash
# Stop services
docker-compose -f dev-tools/docker/docker-compose.local.yml down

# Remove LocalStack volume
docker volume rm tattoo-artist-directory_localstack-data

# Restart services
docker-compose -f dev-tools/docker/docker-compose.local.yml up -d
```

### Issue: AWS SDK Connection Errors

**Symptoms:**
- Backend logs show AWS connection timeouts
- DynamoDB or OpenSearch operations fail
- Error: "Could not connect to the endpoint URL"

**Solutions:**

1. **Verify environment variables:**
```bash
# Check backend container environment
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend env | grep AWS

# Required variables:
# AWS_ENDPOINT_URL=http://localstack:4566
# AWS_ACCESS_KEY_ID=test
# AWS_SECRET_ACCESS_KEY=test
# AWS_DEFAULT_REGION=eu-west-2
```

2. **Test LocalStack connectivity:**
```bash
# From host machine
curl http://localhost:4566/_localstack/health

# From backend container
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend curl http://localstack:4566/_localstack/health
```

3. **Check network connectivity:**
```bash
# Verify containers are on same network
docker network ls
docker network inspect tattoo-artist-directory_default
```

## Docker-Related Issues

### Issue: Docker Desktop Not Running

**Symptoms:**
- Error: "Cannot connect to the Docker daemon"
- Commands fail with "docker: command not found"

**Solutions:**

**Windows:**
```bash
# Start Docker Desktop from Start Menu
# Or via PowerShell (as Administrator)
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Verify Docker is running
docker info
```

**macOS:**
```bash
# Start Docker Desktop from Applications
open -a Docker

# Or via command line
sudo launchctl load /Library/LaunchDaemons/com.docker.vmnetd.plist

# Verify Docker is running
docker info
```

**Linux:**
```bash
# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (requires logout/login)
sudo usermod -aG docker $USER

# Verify Docker is running
docker info
```

### Issue: Insufficient Docker Resources

**Symptoms:**
- Containers crash with "Out of memory" errors
- Slow performance or timeouts
- Services fail to start properly

**Solutions:**

1. **Increase Docker Desktop Resources:**
   - Windows/macOS: Docker Desktop → Settings → Resources
   - Recommended: 8GB RAM, 4 CPUs minimum

2. **Clean up Docker resources:**
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

3. **Monitor resource usage:**
```bash
# Real-time container stats
docker stats

# Check container resource limits
docker-compose -f dev-tools/docker/docker-compose.local.yml config
```

### Issue: Port Conflicts

**Symptoms:**
- Error: "Port already in use"
- Services fail to bind to ports
- Cannot access services on expected ports

**Solutions:**

1. **Identify conflicting processes:**

**Windows:**
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :4566
netstat -ano | findstr :8080
netstat -ano | findstr :9000
```

**macOS/Linux:**
```bash
lsof -i :3000
lsof -i :4566
lsof -i :8080
lsof -i :9000
```

2. **Stop conflicting services:**
```bash
# Kill process by PID (replace XXXX with actual PID)
kill -9 XXXX

# Or stop specific services
sudo service apache2 stop  # If Apache is using port 8080
sudo service nginx stop   # If Nginx is using port 3000
```

3. **Change ports in configuration:**
Edit `dev-tools/docker/docker-compose.local.yml` to use different ports:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change external port
  swagger-ui:
    ports:
      - "8081:8080"  # Change external port
```

## Network Issues

### Issue: Container-to-Container Communication Fails

**Symptoms:**
- Backend cannot reach LocalStack
- Services timeout when connecting to each other
- DNS resolution fails between containers

**Solutions:**

1. **Check Docker network:**
```bash
# List networks
docker network ls

# Inspect network configuration
docker network inspect tattoo-artist-directory_default

# Verify containers are on same network
docker-compose -f dev-tools/docker/docker-compose.local.yml ps
```

2. **Test connectivity between containers:**
```bash
# Test from backend to localstack
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend ping localstack

# Test DNS resolution
docker-compose -f dev-tools/docker/docker-compose.local.yml exec backend nslookup localstack
```

3. **Recreate network:**
```bash
# Stop services
docker-compose -f dev-tools/docker/docker-compose.local.yml down

# Remove network
docker network prune

# Restart services
docker-compose -f dev-tools/docker/docker-compose.local.yml up -d
```

## Application-Specific Issues

### Issue: Frontend Cannot Connect to Backend

**Symptoms:**
- Frontend shows API connection errors
- Network tab shows failed requests to backend
- CORS errors in browser console

**Solutions:**

1. **Verify backend is running:**
```bash
# Check backend container status
docker-compose -f dev-tools/docker/docker-compose.local.yml ps backend

# Test backend directly
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"httpMethod": "GET", "path": "/v1/health"}'
```

2. **Check frontend configuration:**
```bash
# Verify frontend environment variables
cat frontend/.env.local

# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:9000/2015-03-31/functions/function/invocations
```

3. **Restart frontend with correct config:**
```bash
docker-compose -f dev-tools/docker/docker-compose.local.yml restart frontend
```

### Issue: No Test Data Visible

**Symptoms:**
- Empty search results
- Artist profiles return 404 errors
- Database appears empty

**Solutions:**

1. **Check data seeder logs:**
```bash
docker-compose -f dev-tools/docker/docker-compose.local.yml logs data-seeder
```

2. **Manually run data seeder:**
```bash
docker-compose -f dev-tools/docker/docker-compose.local.yml run --rm data-seeder
```

3. **Verify DynamoDB table creation:**
```bash
# Check if table exists
docker-compose -f dev-tools/docker/docker-compose.local.yml exec localstack \
  awslocal dynamodb list-tables

# Check table contents
docker-compose -f dev-tools/docker/docker-compose.local.yml exec localstack \
  awslocal dynamodb scan --table-name tattoo-directory-local --limit 5
```

4. **Reset and reseed data:**
```bash
# Stop services
docker-compose -f dev-tools/docker/docker-compose.local.yml down

# Remove volumes to clear data
docker volume prune

# Restart and reseed
docker-compose -f dev-tools/docker/docker-compose.local.yml up -d
```

### Issue: Swagger UI Not Loading API Spec

**Symptoms:**
- Swagger UI shows "Failed to load API definition"
- API endpoints not visible in documentation
- Cannot test endpoints through UI

**Solutions:**

1. **Check OpenAPI spec file:**
```bash
# Verify file exists and is valid
cat backend/docs/openapi.yaml

# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('backend/docs/openapi.yaml'))"
```

2. **Check Swagger UI configuration:**
```bash
# Verify volume mount
docker-compose -f dev-tools/docker/docker-compose.local.yml exec swagger-ui ls -la /openapi/

# Check environment variables
docker-compose -f dev-tools/docker/docker-compose.local.yml exec swagger-ui env | grep SWAGGER
```

3. **Restart Swagger UI:**
```bash
docker-compose -f dev-tools/docker/docker-compose.local.yml restart swagger-ui
```

## Best Practices

### Debugging Best Practices

1. **Use structured logging** with consistent format
2. **Add correlation IDs** to trace requests across services
3. **Include context** in error messages
4. **Use appropriate log levels** (debug, info, warn, error)
5. **Clean up debug code** before committing

### Development Best Practices

1. **Test locally** before deploying
2. **Use version control** for configuration changes
3. **Document debugging procedures** for team members
4. **Monitor resource usage** during development
5. **Keep dependencies updated** for security and performance

### Debugging Tips

- **Use descriptive console.log messages** with context
- **Set conditional breakpoints** for specific scenarios
- **Use debugger statement** for quick debugging
- **Check network requests** in browser DevTools
- **Monitor container logs** in real-time during debugging

### Performance Tips

- **Limit log verbosity** in production-like testing
- **Use specific service filtering** in log viewer
- **Monitor resource usage** during debugging sessions
- **Clean up containers** regularly to free resources

### Security Tips

- **Never commit debug configurations** with sensitive data
- **Use environment variables** for configuration
- **Disable debug mode** in production environments
- **Rotate LocalStack credentials** if needed

This debugging guide should help you efficiently troubleshoot and develop features in the local environment. For additional help, check the logs and monitoring tools provided.

## Additional Resources

- [Docker Debugging Guide](https://docs.docker.com/config/containers/logging/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [LocalStack Documentation](https://docs.localstack.cloud/)

## Support

If issues persist after trying these solutions:

1. **Collect diagnostic information:**
```bash
# System info
docker version
docker-compose version
docker info

# Container status
docker-compose -f dev-tools/docker/docker-compose.local.yml ps

# Recent logs
docker-compose -f dev-tools/docker/docker-compose.local.yml logs --tail=50
```

2. **Check documentation:**
   - [Platform Setup Guide](PLATFORM_SETUP.md)
   - [Cross-Platform Summary](CROSS_PLATFORM_SUMMARY.md)
   - [Debugging Guide](DEBUGGING_GUIDE.md)

3. **Common solutions:**
   - Restart Docker Desktop
   - Clear Docker cache: `docker system prune -a`
   - Reset to clean state: `docker-compose down && docker volume prune`
   - Check system resources and free up space/memory

4. **Report issues:**
   - Include diagnostic information
   - Specify operating system and versions
   - Provide steps to reproduce the issue
   - Include relevant log output

For debugging assistance:

1. Follow the systematic debugging workflows
2. Use the provided debugging tools and scripts
3. Check logs and monitor resource usage
4. Refer to platform-specific troubleshooting guides
5. Document and share solutions with the team