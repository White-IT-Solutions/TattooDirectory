# Advanced Development Features

This document describes the advanced development features implemented for the Tattoo Directory local environment, providing enhanced debugging, testing, and development capabilities.

## Overview

The advanced development features include:

1. **Hot Module Replacement Proxy** - Automatic backend reloading with enhanced debugging
2. **Mock Data Generator** - Realistic test data generation utilities
3. **Debug Logger** - Comprehensive request/response logging and debugging
4. **Error Scenario Tester** - Utilities for testing various error conditions

## Features

### 1. Hot Module Replacement Proxy

The Hot Reload Proxy provides seamless development experience with automatic backend reloading and enhanced debugging capabilities.

#### Features:
- Automatic Lambda function reloading on code changes
- Request/response logging and debugging
- Mock response injection
- Error scenario simulation
- API Gateway simulation
- Development control endpoints

#### Usage:

```bash
# Start the hot reload proxy
npm run dev:hot-reload

# Or with custom configuration
PROXY_PORT=9001 BACKEND_URL=http://localhost:9000 npm run dev:hot-reload
```

#### Development Endpoints:

- `GET /_dev/status` - Proxy status and configuration
- `POST /_dev/reload` - Manual backend reload
- `POST /_dev/mock/:endpoint` - Set mock response for endpoint
- `DELETE /_dev/mock/:endpoint` - Remove mock response
- `POST /_dev/error/:endpoint` - Set error scenario for endpoint
- `DELETE /_dev/error/:endpoint` - Remove error scenario

#### Example: Setting Mock Response

```bash
curl -X POST http://localhost:9001/_dev/mock/v1/artists \
  -H "Content-Type: application/json" \
  -d '{
    "artists": [
      {
        "artistId": "mock-001",
        "artistName": "Mock Artist",
        "styles": ["traditional"]
      }
    ]
  }'
```

### 2. Mock Data Generator

Generates realistic mock data for development and testing purposes.

#### Features:
- Realistic artist profiles with complete data
- Search result scenarios (normal, empty, filtered)
- Error responses in RFC 9457 format
- Performance testing datasets
- Configurable data generation

#### Usage:

```bash
# Generate complete test dataset
npm run dev:mock-dataset

# Generate specific number of artists
npm run dev:mock-artists -- --count 50

# Generate search results with filters
npm run dev:mock-search -- --style traditional --location London

# Generate error responses
npm run dev:mock-errors -- --type validation
```

#### Available Commands:

```bash
# Generate artists
node dev-tools/mock-data-generator.js artists --count 20

# Generate search scenarios
node dev-tools/mock-data-generator.js search --style traditional --limit 10

# Generate error responses
node dev-tools/mock-data-generator.js error --type not_found

# Generate complete dataset
node dev-tools/mock-data-generator.js dataset --artistCount 100
```

#### Generated Data Structure:

```json
{
  "artistId": "artist-001",
  "artistName": "Sarah Mitchell",
  "instagramHandle": "sarahmitchelltattoo",
  "geohash": "gcpvj0",
  "locationDisplay": "London, UK",
  "studioName": "Ink & Steel",
  "styles": ["traditional", "neo-traditional"],
  "portfolioImages": [...],
  "contactInfo": {...},
  "rating": 4.8,
  "reviewCount": 127
}
```

### 3. Debug Logger

Comprehensive logging system with structured request/response logging, performance monitoring, and error tracking.

#### Features:
- Structured JSON logging
- Multiple log levels (trace, debug, info, warn, error, fatal)
- Request/response logging with sanitization
- Performance metrics tracking
- Error history and analysis
- Log rotation and file management
- Export capabilities

#### Usage:

```bash
# Test logging functionality
npm run dev:debug-test

# Export logs
npm run dev:debug-export

# Or with custom options
node dev-tools/debug-logger.js export logs/debug-export.json
```

#### Express Middleware Integration:

```javascript
const DebugLogger = require('./dev-tools/debug-logger');

const logger = new DebugLogger({
  logLevel: 'debug',
  enableConsole: true,
  enableFile: true,
  enableMetrics: true
});

// Use as Express middleware
app.use(logger.createMiddleware());

// Manual logging
await logger.info('User action', { userId: '123', action: 'search' });
await logger.error('Database error', { error: error.message, query: 'SELECT ...' });
```

#### Log Entry Format:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "Incoming request: GET /v1/artists",
  "data": {
    "requestId": "req_1705312245123_abc123",
    "method": "GET",
    "path": "/v1/artists",
    "query": { "limit": "10" },
    "headers": { "user-agent": "..." },
    "ip": "127.0.0.1"
  },
  "pid": 12345,
  "memory": { "rss": 45678912, "heapUsed": 23456789 },
  "uptime": 123.456
}
```

### 4. Error Scenario Tester

Utilities for testing various error scenarios and edge cases in the development environment.

#### Features:
- Pre-defined error scenarios (network, service, validation, auth, data, performance)
- Custom error scenario creation
- Automated testing of error handling
- Comprehensive test reporting
- Integration with Hot Reload Proxy

#### Available Scenarios:

- **Network Errors**: timeout, connection_refused
- **Service Errors**: service_unavailable, internal_server_error
- **Rate Limiting**: rate_limit_exceeded
- **Validation Errors**: validation_error, missing_parameters
- **Authentication**: unauthorized, forbidden
- **Data Errors**: not_found, data_corruption
- **Performance**: slow_response, memory_exhaustion

#### Usage:

```bash
# List all available scenarios
npm run dev:list-scenarios

# Activate an error scenario
npm run dev:activate-error rate_limit_exceeded /v1/artists

# Test a specific scenario
node dev-tools/error-scenario-tester.js test validation_error /v1/artists/search

# Run comprehensive test suite
npm run dev:test-errors

# Deactivate all scenarios
npm run dev:deactivate-errors
```

#### Example Test Results:

```json
{
  "testId": "test_1705312245123_abc123",
  "scenarioId": "rate_limit_exceeded",
  "scenario": "Rate Limit Exceeded",
  "endpoint": "/v1/artists",
  "success": true,
  "duration": 156,
  "response": {
    "status": 429,
    "data": {
      "type": "https://tattoo-directory.com/errors/rate-limit",
      "title": "Rate Limit Exceeded",
      "status": 429,
      "detail": "Too many requests. Please try again later.",
      "retry-after": 60
    }
  }
}
```

## Integration with Existing Tools

### Docker Compose Integration

The advanced features integrate seamlessly with the existing Docker Compose setup:

```yaml
# Add to docker-compose.local.yml
services:
  hot-reload-proxy:
    build:
      context: ./dev-tools
      dockerfile: Dockerfile.proxy
    ports:
      - "9001:9001"
    environment:
      - BACKEND_URL=http://backend:8080
      - WATCH_PATH=/app/backend/src
    volumes:
      - ./backend/src:/app/backend/src:ro
    depends_on:
      - backend
```

### Frontend Integration

Update frontend configuration to use the hot reload proxy:

```javascript
// frontend/src/lib/config.js
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:9001'  // Hot reload proxy
  : 'http://localhost:9000'; // Direct backend
```

### VS Code Integration

Add debugging configuration for the advanced features:

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Hot Reload Proxy",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dev-tools/hot-reload-proxy.js",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# Hot Reload Proxy
PROXY_PORT=9001
BACKEND_URL=http://localhost:9000
WATCH_PATH=./backend/src
LOG_REQUESTS=true
ENABLE_MOCKING=true

# Debug Logger
LOG_LEVEL=debug
LOG_FILE=./logs/debug.log
MAX_LOG_SIZE=10485760  # 10MB
MAX_LOG_FILES=5

# Error Scenario Tester
PROXY_URL=http://localhost:9001
BACKEND_URL=http://localhost:9000
```

### Configuration Files

Create `dev-tools/.env` for local configuration:

```bash
# Development configuration
PROXY_PORT=9001
BACKEND_URL=http://localhost:9000
WATCH_PATH=./backend/src
LOG_LEVEL=debug
ENABLE_MOCKING=true
ENABLE_ERROR_TESTING=true
```

## Best Practices

### 1. Development Workflow

1. Start the hot reload proxy: `npm run dev:hot-reload`
2. Configure frontend to use proxy URL
3. Use mock data for consistent testing
4. Test error scenarios regularly
5. Monitor logs for debugging

### 2. Testing Strategy

1. Use mock data generator for consistent test data
2. Test all error scenarios before deployment
3. Monitor performance metrics during development
4. Export logs for analysis and debugging

### 3. Debugging Tips

1. Enable debug logging for detailed information
2. Use request/response logging to trace issues
3. Test error scenarios to ensure proper handling
4. Monitor performance metrics for optimization

## Troubleshooting

### Common Issues

#### Hot Reload Not Working

```bash
# Check if file watcher is working
node -e "console.log(require('chokidar').watch('./backend/src').getWatched())"

# Restart with debug logging
LOG_LEVEL=debug npm run dev:hot-reload
```

#### Mock Data Not Loading

```bash
# Verify mock data generation
node dev-tools/mock-data-generator.js artists --count 1

# Check proxy status
curl http://localhost:9001/_dev/status
```

#### Error Scenarios Not Activating

```bash
# Check proxy connection
curl http://localhost:9001/_dev/status

# List active scenarios
node dev-tools/error-scenario-tester.js list
```

### Performance Issues

1. **High Memory Usage**: Reduce log retention and mock data size
2. **Slow Response Times**: Check file watcher performance and disable unnecessary features
3. **File Watcher Issues**: Use polling mode on network drives or containers

## Advanced Usage

### Custom Error Scenarios

```javascript
const ErrorScenarioTester = require('./dev-tools/error-scenario-tester');

const tester = new ErrorScenarioTester();

// Add custom scenario
tester.addScenario('custom_timeout', {
  name: 'Custom Timeout',
  description: 'Custom timeout scenario for specific endpoint',
  type: 'network',
  config: {
    delay: 10000,
    statusCode: 408,
    message: 'Custom timeout error'
  }
});

// Test custom scenario
await tester.testScenario('custom_timeout', '/v1/artists/search');
```

### Custom Mock Data

```javascript
const MockDataGenerator = require('./dev-tools/mock-data-generator');

const generator = new MockDataGenerator();

// Generate custom artist
const customArtist = generator.generateArtist({
  name: 'Custom Artist',
  styles: ['custom-style'],
  location: { city: 'Custom City', postcode: 'CC1 1CC', geohash: 'custom' }
});

console.log(JSON.stringify(customArtist, null, 2));
```

### Advanced Logging

```javascript
const DebugLogger = require('./dev-tools/debug-logger');

const logger = new DebugLogger({
  logLevel: 'trace',
  enableMetrics: true
});

// Custom log formatting
logger.on('log', (logEntry) => {
  if (logEntry.level === 'ERROR') {
    // Send to external monitoring service
    sendToMonitoring(logEntry);
  }
});

// Performance monitoring
await logger.logPerformance('database_query', 150, {
  query: 'SELECT * FROM artists',
  resultCount: 25
});
```

## Contributing

When adding new advanced features:

1. Follow the existing code structure and patterns
2. Add comprehensive error handling and logging
3. Include CLI interfaces for all utilities
4. Add integration tests
5. Update documentation

## Support

For issues with advanced development features:

1. Check the troubleshooting section
2. Review logs in `./logs/` directory
3. Test with minimal configuration
4. Report issues with detailed logs and configuration