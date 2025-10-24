# API Proxy Guide

This document explains the two API proxy systems used in the Tattoo Directory development environment and how to handle Lambda Runtime Interface Emulator (RIE) crashes.

## Overview

The development environment uses proxy servers to bridge the gap between the frontend (Next.js) and the backend (AWS Lambda RIE). This setup provides production parity while handling CORS and development-specific requirements.

## Architecture Flow

```
Frontend (3000) → API Proxy → Backend Lambda RIE (9000) → LocalStack (4566) → AWS Services
```

## Two Proxy Systems

### 1. Main API Proxy (Production Development)

**File**: `scripts/api-proxy.js`  
**Port**: `9001`  
**Purpose**: Full-featured proxy that forwards requests to Lambda RIE with intelligent fallback

#### Key Features

- **Lambda Integration**: Forwards REST API calls to Lambda RIE (port 9000)
- **Event Translation**: Converts HTTP requests to AWS Lambda event format
- **Intelligent Fallback**: Automatically serves mock data if Lambda RIE crashes
- **Complete API Coverage**: Implements all endpoints with proper validation
- **Production Parity**: Uses the same Lambda code as production
- **Advanced Error Handling**: Returns RFC 9457 problem details
- **Request Validation**: Validates query parameters and request format
- **CORS Support**: Full CORS preflight handling with proper headers
- **Timeout Management**: 5-second timeout with graceful degradation

#### Request Flow
```
Frontend → Main Proxy (9001) → Lambda RIE (9000) → LocalStack → Response
                ↓ (if Lambda crashes)
            Mock Response (automatic fallback)
```

#### Endpoints Supported
- `GET /health` - Health check
- `GET /v1/artists` - Search artists with query parameters
- `GET /v1/artists/{id}` - Get specific artist by ID
- `GET /v1/styles` - Get available tattoo styles

#### Configuration
```bash
# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:9001

# Start/stop commands
npm run local:proxy:start
npm run local:proxy:stop
npm run local:proxy:restart
npm run local:proxy:status
```

### 2. Simple Proxy (Emergency Fallback)

**File**: `scripts/simple-proxy.js`  
**Port**: `9003`  
**Purpose**: Minimal proxy that always returns mock data (no Lambda dependency)

#### Key Features

- **No Lambda Dependency**: Never connects to Lambda RIE
- **Always Available**: Returns hardcoded mock data regardless of backend state
- **Minimal Implementation**: ~30 lines of code vs 300+ for main proxy
- **Basic CORS**: Simple CORS handling for development
- **No Validation**: Accepts any request, returns same mock response
- **Lightweight**: Minimal resource usage and startup time

#### Request Flow
```
Frontend → Simple Proxy (9003) → Mock Response (always)
```

#### When to Use
- Lambda RIE keeps crashing with segmentation faults
- Quick frontend testing without backend complexity
- Network/CORS debugging in isolation
- Emergency development when Lambda is completely broken

#### Configuration
```bash
# Start simple proxy
node scripts/simple-proxy.js &

# Update frontend to use simple proxy
# In frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:9003
```

## Comparison Table

| Feature | Main Proxy (9001) | Simple Proxy (9003) |
|---------|-------------------|---------------------|
| **Lambda Integration** | ✅ Yes | ❌ No |
| **Mock Fallback** | ✅ Automatic | ✅ Always |
| **Error Handling** | ✅ Complete | ❌ Basic |
| **Request Validation** | ✅ Yes | ❌ No |
| **All Endpoints** | ✅ Yes | ❌ Single response |
| **Production Parity** | ✅ High | ❌ Low |
| **Reliability** | ⚠️ Depends on Lambda | ✅ Always works |
| **Development Value** | ✅ High | ⚠️ Limited |
| **Resource Usage** | ⚠️ Medium | ✅ Minimal |
| **Startup Time** | ⚠️ Depends on Lambda | ✅ Instant |

## Lambda RIE Crash Issues

### The Problem

The AWS Lambda Runtime Interface Emulator (RIE) can crash with segmentation faults during development:

```
panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x1 addr=0x30 pc=0x6ab69f]
```

### Root Causes

- **Concurrent Requests**: Multiple simultaneous API calls
- **Memory Pressure**: Container memory management issues
- **Race Conditions**: Internal RIE request handling conflicts
- **Development Load**: Heavy development with frequent requests

### Automated Recovery

**Quick Fix Script**: `npm run fix:lambda-rie`

This script automatically:
1. Checks backend container status
2. Restarts the backend container cleanly
3. Waits for Lambda RIE to be healthy
4. Restarts the API proxy
5. Tests the API endpoint
6. Provides next steps

**Diagnostic Information**: `npm run fix:lambda-rie:diagnose`

Shows Docker status, container health, and resource usage.

### Manual Recovery Steps

1. **Restart Backend Container**:
   ```bash
   # Windows (full command with overrides)
   docker-compose -f devtools/docker/docker-compose.local.yml -f devtools/docker/docker-compose.windows.yml --profile phase1 --env-file .env restart backend
   
   # Or use platform launcher
   npm run local:restart
   ```

2. **Restart API Proxy**:
   ```bash
   npm run local:proxy:stop
   npm run local:proxy:start
   ```

3. **Test Recovery**:
   ```bash
   curl http://localhost:9001/health
   curl "http://localhost:9001/v1/artists?query=test"
   ```

### Prevention Strategies

- **Use Main Proxy**: Always connect via port 9001, never directly to port 9000
- **Avoid Concurrent Requests**: Don't make rapid simultaneous API calls
- **Monitor Resources**: Check Docker memory usage with `docker stats`
- **Periodic Restarts**: Restart backend container during heavy development
- **Use Recovery Script**: Run `npm run fix:lambda-rie` at first sign of issues

### Emergency Fallback Strategy

If Lambda RIE continues to crash:

1. **Switch to Simple Proxy**:
   ```bash
   npm run local:proxy:stop
   node scripts/simple-proxy.js &
   ```

2. **Update Frontend Configuration**:
   ```bash
   # In frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:9003
   ```

3. **Continue Development**: Use mock data for frontend development

4. **Switch Back When Stable**:
   ```bash
   # Kill simple proxy (Ctrl+C)
   # Update frontend back to:
   NEXT_PUBLIC_API_URL=http://localhost:9001
   npm run local:proxy:start
   ```

## Docker Compose Command Structure

The fix script and manual commands use the same structure as the platform launcher:

### Command Pattern
```bash
docker-compose \
  -f devtools/docker/docker-compose.local.yml \
  -f devtools/docker/docker-compose.windows.yml \
  --profile phase1 \
  --env-file .env \
  [command] [service]
```

### Components Explained

- **Base File**: `docker-compose.local.yml` - Core service definitions
- **Platform Override**: `docker-compose.windows.yml` - Windows-specific settings
- **Profile**: `--profile phase1` - Includes LocalStack and core services
- **Environment**: `--env-file .env` - Loads environment variables

### Platform Detection

The system automatically detects your platform and includes the appropriate override file:

- **Windows**: `docker-compose.windows.yml`
- **macOS**: `docker-compose.macos.yml`
- **Linux**: `docker-compose.linux.yml`

## Troubleshooting Commands

### Health Checks
```bash
# Overall system health
npm run health-check

# Service-specific health
npm run local:health

# Data status
npm run data-status

# Proxy status
npm run local:proxy:status
```

### Logs and Monitoring
```bash
# View backend logs
npm run local:logs:backend

# View all logs
npm run local:logs

# Monitor resources
docker stats

# Live log monitoring
npm run local:logs:viewer
```

### Recovery Commands
```bash
# Quick Lambda RIE fix
npm run fix:lambda-rie

# Full environment reset
npm run local:reset

# Data-only reset (faster)
npm run reset-data:clean

# Emergency stop
npm run local:emergency-stop
```

## Best Practices

### Development Workflow

1. **Start with Main Proxy**: Always use the production-like setup first
2. **Monitor for Crashes**: Watch for Lambda RIE segmentation faults
3. **Use Recovery Script**: Run `npm run fix:lambda-rie` immediately when issues occur
4. **Fallback When Needed**: Switch to simple proxy only when Lambda is unusable
5. **Return to Main**: Switch back to main proxy once Lambda is stable

### Performance Optimization

- **Avoid Rapid Requests**: Space out API calls during development
- **Monitor Memory**: Keep an eye on Docker container memory usage
- **Restart Periodically**: Restart backend container during heavy development sessions
- **Use Appropriate Proxy**: Main proxy for integration testing, simple proxy for frontend-only work

### Error Handling

- **Check Proxy First**: Verify which proxy you're using when debugging
- **Use Diagnostic Tools**: Run diagnostic commands to understand system state
- **Follow Recovery Steps**: Use the automated recovery script before manual intervention
- **Document Issues**: Note patterns in Lambda RIE crashes for future prevention

## Production Considerations

### Development vs Production

- **Development**: Uses proxy servers to handle CORS and Lambda RIE integration
- **Production**: Direct AWS API Gateway to Lambda integration (no proxies needed)
- **Parity**: Main proxy provides high production parity for testing

### Deployment Impact

- **No Proxy in Production**: Proxy servers are development-only tools
- **Same Lambda Code**: The Lambda functions run identically in both environments
- **Configuration Differences**: Only the request routing differs between environments

This proxy system ensures smooth development while maintaining production parity and providing fallback options when the Lambda RIE encounters issues.