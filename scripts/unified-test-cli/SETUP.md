# Unified Test CLI Setup Guide

This guide walks you through setting up and configuring the Unified Test CLI for your development environment.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Docker**: Docker Desktop with WSL 2 backend (Windows) or Docker Engine (Linux/macOS)
- **Git**: For version control

### Development Environment

- **Operating System**: Windows 10/11 (with WSL 2), macOS, or Linux
- **Memory**: Minimum 8GB RAM (16GB recommended for parallel testing)
- **Storage**: At least 10GB free space for Docker containers and test artifacts

## Installation

The Unified Test CLI is already integrated into the npm workspace. No separate installation is required.

### Verify Installation

```bash
# Check if CLI is available
npm run test:cli -- --help

# List available test suites
npm run test:cli:list
```

## Initial Setup

### 1. Start Required Services

Before using the CLI, ensure all required services are running:

```bash
# Start LocalStack and other services
npm run local:start

# Verify services are running
npm run local:status
```

### 2. Validate Environment

Run the environment validation to ensure everything is configured correctly:

```bash
npm run test:cli:validate
```

Expected output:
```
✅ LocalStack is running and accessible
✅ DynamoDB service is available
✅ OpenSearch service is available
✅ S3 service is available
✅ Frontend development server is accessible
✅ Backend Lambda functions are available
```

### 3. Seed Initial Data

Set up test data scenarios:

```bash
# Set up basic test data
npm run setup-data

# Verify data seeding
npm run validate-data
```

### 4. Run First Test

Execute a simple test to verify everything works:

```bash
# Run frontend unit tests (fastest)
npm run test:cli:frontend
```

## Configuration

### Test Suite Configuration

The CLI uses configuration files in the `config/` directory. You can customize these for your specific needs.

#### `config/test-suites.json`

Defines available test suites and their properties:

```json
{
  "testSuites": [
    {
      "name": "my-custom-suite",
      "displayName": "My Custom Test Suite",
      "description": "Custom test suite for specific functionality",
      "type": "unit",
      "workspace": "my-workspace",
      "command": "npm run test:custom",
      "requiredServices": ["localstack"],
      "dataScenario": "custom-scenario",
      "timeout": 120000,
      "canRunParallel": true,
      "supportsCoverage": true,
      "tags": ["custom", "unit"]
    }
  ]
}
```

**Configuration Options:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | string | Unique identifier for the suite | ✅ |
| `displayName` | string | Human-readable name | ✅ |
| `description` | string | Brief description of the suite | ✅ |
| `type` | string | Suite type: unit, integration, e2e, security, performance, contract | ✅ |
| `workspace` | string | npm workspace path | ✅ |
| `command` | string | Command to execute the tests | ✅ |
| `requiredServices` | array | List of required services | ❌ |
| `dataScenario` | string | Data scenario to seed before tests | ❌ |
| `timeout` | number | Test timeout in milliseconds | ❌ |
| `canRunParallel` | boolean | Whether suite can run in parallel | ❌ |
| `supportsCoverage` | boolean | Whether suite supports coverage reporting | ❌ |
| `tags` | array | Tags for filtering and categorization | ❌ |

#### `config/data-scenarios.json`

Defines data seeding scenarios:

```json
{
  "scenarios": [
    {
      "name": "my-scenario",
      "description": "Custom data scenario for my tests",
      "command": "node scripts/data-cli.js seed-scenario my-scenario",
      "estimatedTime": 45000,
      "dependencies": ["localstack"],
      "cleanup": "node scripts/data-cli.js reset-data clean"
    }
  ]
}
```

**Configuration Options:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | string | Unique scenario identifier | ✅ |
| `description` | string | Scenario description | ✅ |
| `command` | string | Command to seed the scenario | ✅ |
| `estimatedTime` | number | Estimated seeding time in milliseconds | ❌ |
| `dependencies` | array | Required services for seeding | ❌ |
| `cleanup` | string | Command to clean up scenario data | ❌ |

#### `config/service-endpoints.json`

Defines service endpoints for validation:

```json
{
  "services": {
    "my-service": {
      "url": "http://localhost:8080",
      "healthEndpoint": "/health",
      "timeout": 5000,
      "retries": 3,
      "retryDelay": 1000
    }
  }
}
```

**Configuration Options:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `url` | string | Base URL for the service | ✅ |
| `healthEndpoint` | string | Health check endpoint path | ✅ |
| `timeout` | number | Request timeout in milliseconds | ❌ |
| `retries` | number | Number of retry attempts | ❌ |
| `retryDelay` | number | Delay between retries in milliseconds | ❌ |

### Environment Variables

The CLI supports environment variable overrides:

```bash
# Override LocalStack endpoint
export LOCALSTACK_ENDPOINT=http://localhost:4566

# Override test timeout
export TEST_TIMEOUT=120000

# Enable debug logging
export DEBUG=true

# Set output directory
export TEST_OUTPUT_DIR=./custom-results
```

### npm Scripts Integration

Add custom npm scripts to your workspace `package.json`:

```json
{
  "scripts": {
    "test:my-suite": "node scripts/unified-test-cli/src/cli/index.js run my-custom-suite",
    "test:quick": "node scripts/unified-test-cli/src/cli/index.js run --parallel --max-parallel 5",
    "test:ci-pipeline": "node scripts/unified-test-cli/src/cli/index.js run --ci --junit --coverage"
  }
}
```

## Advanced Configuration

### Custom Test Suite Implementation

To add a new test suite type, create a suite class:

```javascript
// src/suites/my-custom-suite.js
import { BaseSuite } from './base-suite.js';

export class MyCustomSuite extends BaseSuite {
  constructor(config) {
    super(config);
  }

  async execute(options) {
    // Custom test execution logic
    return {
      status: 'passed',
      tests: { total: 10, passed: 10, failed: 0 },
      duration: 5000
    };
  }
}
```

Register the suite in `src/core/test-discovery.js`:

```javascript
import { MyCustomSuite } from '../suites/my-custom-suite.js';

// Add to suite type mapping
const SUITE_TYPES = {
  'my-custom': MyCustomSuite,
  // ... other types
};
```

### Custom Reporter

Create custom output formatters:

```javascript
// src/reporters/my-reporter.js
import { BaseReporter } from './base-reporter.js';

export class MyReporter extends BaseReporter {
  async generateReport(results, options) {
    // Custom report generation logic
    return 'Custom report content';
  }
}
```

### Parallel Execution Configuration

Configure parallel execution limits:

```javascript
// In test suite configuration
{
  "parallelConfig": {
    "maxConcurrency": 3,
    "resourceLimits": {
      "memory": "2GB",
      "cpu": "2"
    },
    "isolation": "process"
  }
}
```

## Workspace Integration

### Frontend Workspace

Ensure your frontend workspace has the required test scripts:

```json
{
  "name": "frontend",
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

### Backend Workspace

Ensure your backend workspace has the required test scripts:

```json
{
  "name": "backend",
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

### Test Workspaces

Create dedicated test workspaces for specialized testing:

```json
{
  "name": "tests-integration",
  "scripts": {
    "test": "jest",
    "test:api": "jest --testPathPattern=api",
    "test:data": "jest --testPathPattern=data"
  }
}
```

## CI/CD Integration

### GitHub Actions

Example workflow configuration:

```yaml
name: Test Suite Execution
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start services
        run: npm run local:start
      
      - name: Run tests
        run: npm run test:cli:ci
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: ./test-results/
```

### Jenkins Pipeline

Example Jenkinsfile:

```groovy
pipeline {
  agent any
  
  stages {
    stage('Setup') {
      steps {
        sh 'npm ci'
        sh 'npm run local:start'
      }
    }
    
    stage('Test') {
      steps {
        sh 'npm run test:cli:ci'
      }
      post {
        always {
          publishTestResults testResultsPattern: 'test-results/junit-results.xml'
          archiveArtifacts artifacts: 'test-results/**/*'
        }
      }
    }
  }
}
```

## Troubleshooting Setup

### Common Setup Issues

**1. Node.js Version Mismatch**
```
Error: The engine "node" is incompatible with this module
```
**Solution:** Update Node.js to version 18.0.0 or higher

**2. Docker Not Running**
```
Error: Cannot connect to the Docker daemon
```
**Solution:** Start Docker Desktop or Docker service

**3. Port Conflicts**
```
Error: Port 4566 is already in use
```
**Solution:** Stop conflicting services or change port configuration

**4. Permission Issues (Linux/macOS)**
```
Error: EACCES: permission denied
```
**Solution:** Fix file permissions or run with appropriate user

### Validation Commands

Use these commands to validate your setup:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Docker status
docker --version
docker ps

# Validate CLI installation
npm run test:cli -- --version

# Test service connectivity
npm run test:cli:validate

# Verify test data
npm run validate-data
```

### Reset Setup

If you encounter persistent issues, reset your setup:

```bash
# Stop all services
npm run local:stop

# Clean Docker containers and volumes
npm run local:clean

# Reset test data
npm run reset-data:clean

# Restart services
npm run local:start

# Re-validate setup
npm run test:cli:validate
```

## Performance Optimization

### System Resources

Optimize your system for better test performance:

```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory: 8GB+

# Optimize npm cache
npm cache clean --force

# Use npm ci instead of npm install in CI
npm ci
```

### Parallel Testing

Configure optimal parallel execution:

```bash
# Find optimal parallel limit
npm run test:cli -- run --parallel --max-parallel 2
npm run test:cli -- run --parallel --max-parallel 4
npm run test:cli -- run --parallel --max-parallel 6

# Monitor system resources during testing
npm run performance:monitor
```

### Test Data Optimization

Optimize test data for faster execution:

```bash
# Use minimal scenarios for unit tests
npm run test:cli -- run frontend-unit --scenario minimal

# Cache data scenarios
export CACHE_DATA_SCENARIOS=true
```

## Support

### Getting Help

1. **Documentation**: Check the [README](./README.md) for usage instructions
2. **Configuration**: Review configuration templates in this guide
3. **Troubleshooting**: Follow the troubleshooting steps above
4. **Issues**: Report issues with detailed error messages and system information

### Debug Information

When reporting issues, include:

```bash
# System information
node --version
npm --version
docker --version

# CLI version and configuration
npm run test:cli -- --version
npm run test:cli:validate

# Service status
npm run local:status

# Recent logs
npm run local:logs | tail -100
```

This setup guide should help you get the Unified Test CLI running smoothly in your development environment. Follow the steps in order and use the troubleshooting section if you encounter any issues.