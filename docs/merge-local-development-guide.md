# Local Development Guide

## Overview

This guide covers the complete local development setup for the Tattoo Directory MVP, including the API proxy for contract testing.

## Quick Start

### 1. Start the Full Environment
```bash
# Start all services (LocalStack, backend, frontend, etc.)
npm run local:start

# Start the API proxy (for contract tests)
npm run local:proxy:start

# Or start everything together
npm run local:start-with-proxy
```

### 2. Run Contract Tests
```bash
# Run contract tests (uses default API_BASE_URL=http://localhost:9001)
npm run test:cli:contracts

# Or run with explicit environment variable
API_BASE_URL=http://localhost:9001 npm run test:cli -- run contracts
```

### 3. Stop Everything
```bash
# Stop all services including proxy
npm run local:stop-all

# Or stop individually
npm run local:proxy:stop
npm run local:stop
```

## Services Overview

### Core Services (Docker Compose)
- **LocalStack**: AWS services emulation (port 4566)
- **Backend**: Lambda Runtime Interface Emulator (port 9000)
- **Frontend**: Next.js development server (port 3000)
- **OpenSearch**: Search engine (port 4571)
- **Swagger UI**: API documentation (port 8080)

### API Proxy Service
- **API Proxy**: HTTP-to-Lambda translator (port 9001)
- Translates REST API calls to Lambda Runtime Interface Emulator format
- Required for contract tests and external API testing

## Available Commands

### Environment Management
```bash
# Start/stop core services
npm run local:start          # Start all Docker services
npm run local:stop           # Stop all Docker services
npm run local:restart        # Restart all services
npm run local:clean          # Stop and remove volumes
npm run local:reset          # Clean and restart

# Status and monitoring
npm run local:status         # Check service status
npm run local:health         # Run health checks
npm run local:logs           # View all logs
npm run local:logs:backend   # View backend logs only
npm run local:logs:frontend  # View frontend logs only
```

### API Proxy Management
```bash
# Proxy lifecycle
npm run local:proxy:start    # Start API proxy
npm run local:proxy:stop     # Stop API proxy
npm run local:proxy:restart  # Restart API proxy
npm run local:proxy:status   # Check proxy status

# Combined operations
npm run local:start-with-proxy  # Start services + proxy
npm run local:stop-all          # Stop services + proxy
```

### Testing
```bash
# Contract tests (with default API_BASE_URL)
npm run test:cli:contracts      # Run all contract tests
npm run test:cli:contracts:direct  # Run without default URL

# Other test suites
npm run test:cli:frontend       # Frontend unit tests
npm run test:cli:backend        # Backend unit tests
npm run test:cli:integration    # Integration tests
npm run test:cli:e2e           # End-to-end tests
```

## API Endpoints

### Direct Lambda Access (Port 9000)
```bash
# Health check via Lambda RIE
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"httpMethod":"GET","path":"/health","requestContext":{"requestId":"test"}}'
```

### API Proxy Access (Port 9001) - Recommended
```bash
# Health check via proxy
curl http://localhost:9001/health

# Search artists
curl "http://localhost:9001/v1/artists?query=test"

# Get artist by ID
curl http://localhost:9001/v1/artists/artist-123

# Get styles
curl http://localhost:9001/v1/styles
```

## Environment Variables

### Default Configuration
The following environment variables are automatically set for contract tests:
- `API_BASE_URL=http://localhost:9001` (uses API proxy)

### Manual Override
You can override the default API URL:
```bash
# Use direct Lambda access
API_BASE_URL=http://localhost:9000/2015-03-31/functions/function/invocations npm run test:cli -- run contracts

# Use different proxy port
API_BASE_URL=http://localhost:9002 npm run test:cli -- run contracts
```

### Environment Files
- `devtools/.env.local` - Main environment configuration
- Service-specific environment variables are loaded automatically

## Development Workflow

### 1. Daily Development
```bash
# Start development environment
npm run local:start-with-proxy

# Make code changes...

# Run tests
npm run test:cli:contracts

# View logs if needed
npm run local:logs:backend

# Stop when done
npm run local:stop-all
```

### 2. Contract Test Development
```bash
# Ensure services are running
npm run local:status
npm run local:proxy:status

# Run specific test categories
npm run test:cli:contracts

# Debug failing tests
npm run local:logs:backend
```

### 3. Troubleshooting
```bash
# Check service health
npm run local:health

# Restart everything
npm run local:restart
npm run local:proxy:restart

# Clean restart (removes volumes)
npm run local:clean
npm run local:start-with-proxy
```

## Port Configuration

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | Next.js development server |
| Backend (Lambda RIE) | 9000 | http://localhost:9000 | Direct Lambda access |
| **API Proxy** | **9001** | **http://localhost:9001** | **REST API access (recommended)** |
| LocalStack | 4566 | http://localhost:4566 | AWS services emulation |
| OpenSearch | 4571 | http://localhost:4571 | Search engine |
| Swagger UI | 8080 | http://localhost:8080 | API documentation |

## API Proxy Benefits

### Why Use the API Proxy?
1. **REST API Interface**: Standard HTTP REST calls instead of Lambda invocation format
2. **Contract Testing**: Required for OpenAPI schema validation and contract tests
3. **Development Convenience**: Easier to test with curl, Postman, etc.
4. **Fallback Support**: Automatically falls back to mock responses if backend is unavailable

### Proxy vs Direct Lambda Access

#### API Proxy (Recommended)
```bash
# Simple REST calls
curl "http://localhost:9001/v1/artists?query=test"
```

#### Direct Lambda Access
```bash
# Complex Lambda invocation format
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"httpMethod":"GET","path":"/v1/artists","queryStringParameters":{"query":"test"},"requestContext":{"requestId":"test"}}'
```

## Monitoring and Debugging

### Health Checks
```bash
# Overall system health
npm run local:health

# Individual service status
npm run local:status
npm run local:proxy:status

# Service-specific health
curl http://localhost:9001/health
curl http://localhost:4566/_localstack/health
```

### Log Monitoring
```bash
# All services
npm run local:logs

# Specific services
npm run local:logs:backend
npm run local:logs:frontend
npm run local:logs:localstack

# Follow logs in real-time
npm run local:logs -- -f
```

### Performance Monitoring
```bash
# Resource usage
npm run local:monitor
npm run local:resources

# Performance benchmarks
npm run performance:benchmark
```

## Common Issues and Solutions

### 1. Port Conflicts
```bash
# Check what's using ports
netstat -an | findstr :9001  # Windows
lsof -i :9001               # macOS/Linux

# Kill conflicting processes
npm run local:proxy:stop
```

### 2. Backend Not Responding
```bash
# Check backend logs
npm run local:logs:backend

# Restart backend
docker restart tattoo-directory-backend

# Full restart
npm run local:restart
```

### 3. Contract Tests Failing
```bash
# Ensure proxy is running
npm run local:proxy:status

# Check API connectivity
curl http://localhost:9001/health

# Run with verbose output
DEBUG=true npm run test:cli:contracts
```

### 4. Environment Variables Not Set
```bash
# Check current environment
echo $API_BASE_URL  # Unix
echo %API_BASE_URL% # Windows

# Use explicit environment
API_BASE_URL=http://localhost:9001 npm run test:cli -- run contracts
```

## Advanced Configuration

### Custom Proxy Port
Edit `scripts/api-proxy.js`:
```javascript
const PROXY_PORT = 9002; // Change from 9001
```

### Custom Backend Endpoint
Edit `scripts/api-proxy.js`:
```javascript
const LAMBDA_ENDPOINT = 'http://localhost:9000/2015-03-31/functions/function/invocations';
```

### Environment-Specific Configuration
Create environment-specific files:
- `devtools/.env.development`
- `devtools/.env.testing`
- `devtools/.env.local` (current)

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Start local environment
  run: npm run local:start-with-proxy

- name: Run contract tests
  run: npm run test:cli:contracts

- name: Stop environment
  run: npm run local:stop-all
```

### Docker Compose Profiles
```bash
# Start with specific profile
docker-compose --profile testing up -d

# Include proxy in compose (future enhancement)
docker-compose -f docker-compose.yml -f docker-compose.proxy.yml up -d
```

## Next Steps

1. **Parameter Validation**: Implement backend validation logic (see `docs/contracts-test-fixes.md`)
2. **OpenAPI Schema**: Fix PortfolioImage reference issue
3. **Docker Integration**: Add API proxy to Docker Compose setup
4. **Monitoring**: Add health checks and metrics for proxy service
5. **Documentation**: Auto-generate API documentation from OpenAPI spec