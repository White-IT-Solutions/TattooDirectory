# Unified Data Management Configuration

This document describes the unified configuration system for data management operations in the Tattoo Directory MVP project.

## Overview

The configuration system provides:
- **Unified Configuration**: Central configuration management with environment detection
- **Cross-Platform Support**: Works on Windows, Linux, and macOS
- **Service Endpoint Management**: Automatic endpoint configuration for LocalStack services
- **State Tracking**: Operation state tracking and history
- **Validation**: Comprehensive system validation and dependency checking

## Core Components

### 1. Data Configuration (`data-config.js`)
Central configuration management with:
- Environment detection (platform, Docker, CI/CD)
- Cross-platform path handling
- Service endpoint configuration
- Scenario and reset state definitions
- Configuration validation

```bash
# View current configuration
npm run config

# Or directly
node scripts/data-config.js
```

### 2. Configuration Validator (`config-validator.js`)
Validates system prerequisites:
- Docker availability and status
- Node.js and npm workspace support
- Required directories and files
- LocalStack service availability
- Environment variables

```bash
# Validate system configuration
npm run config:validate

# Or directly
node scripts/config-validator.js
```

### 3. State Tracker (`state-tracker.js`)
Tracks operation state and history:
- Current operation status
- Seeding history and results
- Service status tracking
- Operation locking for concurrency control

```bash
# View current state
npm run state

# Reset state
npm run state:reset

# Or directly
node scripts/state-tracker.js
```

### 4. Platform Utils (`platform-utils.js`)
Cross-platform utilities:
- Platform detection
- Path normalization
- Command execution
- Environment variable handling
- Script generation

```bash
# View platform information
node scripts/platform-utils.js
```

### 5. Integration Test (`test-configuration.js`)
Comprehensive system testing:
- Configuration loading and validation
- State tracking functionality
- Platform utilities
- System integration

```bash
# Test entire configuration system
npm run config:test

# Or directly
node scripts/test-configuration.js
```

## Available Scenarios

The system includes predefined data scenarios:

- **minimal**: Quick testing with minimal data (3 artists)
- **search-basic**: Basic search functionality testing (5 artists)
- **london-artists**: London-focused artist testing (5 artists)
- **high-rated**: High-rated artists for quality testing (3 artists)
- **new-artists**: Recently added artists (4 artists)
- **booking-available**: Artists with open booking slots (6 artists)
- **portfolio-rich**: Artists with extensive portfolios (4 artists)
- **multi-style**: Artists with multiple style specializations (3 artists)
- **pricing-range**: Mid-range pricing testing (5 artists)
- **full-dataset**: Complete test dataset with all styles (10 artists)

## Available Reset States

Predefined reset states for different testing needs:

- **clean**: Empty all databases but keep services running
- **fresh**: Clean databases and seed with full dataset
- **minimal**: Minimal data for quick testing
- **search-ready**: Optimized for search testing
- **location-test**: Location-based testing data
- **style-test**: Style filtering testing data
- **performance-test**: Performance testing dataset
- **frontend-ready**: Minimal data optimized for frontend development

## Configuration Structure

### Environment Detection
```javascript
{
  platform: 'win32' | 'linux' | 'darwin',
  isWindows: boolean,
  isLinux: boolean,
  isMacOS: boolean,
  isDocker: boolean,
  isCI: boolean,
  nodeVersion: string,
  workingDirectory: string
}
```

### Service Endpoints
```javascript
{
  localstack: { endpoint, host, port },
  aws: { region, accessKeyId, secretAccessKey, endpoint },
  dynamodb: { endpoint, tableName, region },
  opensearch: { endpoint, indexName, domain },
  s3: { endpoint, bucketName, region, forcePathStyle }
}
```

### Cross-Platform Paths
```javascript
{
  projectRoot: string,
  scriptsDir: string,
  testDataDir: string,
  imageSourceDir: string,
  frontendMockData: string,
  stateTrackingDir: string,
  outputDir: string,
  logsDir: string,
  backupDir: string
}
```

## Usage Examples

### Basic Configuration Access
```javascript
const { DATA_CONFIG } = require('./scripts/data-config');

// Get service endpoints
const dynamoEndpoint = DATA_CONFIG.services.dynamodb.endpoint;
const s3Bucket = DATA_CONFIG.services.s3.bucketName;

// Get scenario configuration
const scenario = DATA_CONFIG.getScenarioConfig('minimal');
console.log(`Artist count: ${scenario.artistCount}`);

// Validate configuration
const validation = DATA_CONFIG.validate();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

### State Tracking
```javascript
const { STATE_TRACKER } = require('./scripts/state-tracker');

// Start operation
STATE_TRACKER.startOperation('seeding', { scenario: 'minimal' });

// Update progress
STATE_TRACKER.updateState('seeding', { 
  artistCount: 3,
  imagesUploaded: 15 
});

// End operation
STATE_TRACKER.endOperation(true, { artistCount: 3 });

// Get status
const summary = STATE_TRACKER.getStatusSummary();
console.log('Last seeding:', summary.lastSeeding);
```

### Cross-Platform Operations
```javascript
const { CommandUtils, PathUtils } = require('./scripts/platform-utils');

// Execute platform-appropriate commands
const result = await CommandUtils.executeCommand('npm --version');

// Handle paths correctly
const configPath = PathUtils.join(DATA_CONFIG.paths.projectRoot, 'config.json');
const normalizedPath = PathUtils.normalize(configPath);
```

## Integration with Existing Scripts

The configuration system is designed to integrate seamlessly with existing scripts:

1. **Import the configuration**: `const { DATA_CONFIG } = require('./data-config')`
2. **Use service endpoints**: Access pre-configured service URLs and credentials
3. **Handle paths correctly**: Use cross-platform path utilities
4. **Track operations**: Use state tracker for operation management
5. **Validate prerequisites**: Check system requirements before operations

## Troubleshooting

### Common Issues

1. **Configuration validation fails**
   - Run `npm run config:validate` to see specific issues
   - Check Docker is running: `docker info`
   - Verify Node.js version: `node --version` (requires 18+)

2. **State tracking errors**
   - Reset state: `npm run state:reset`
   - Force unlock operations: `npm run state:unlock`

3. **Cross-platform path issues**
   - Use `PathUtils.normalize()` for all file paths
   - Use `PathUtils.join()` instead of string concatenation

4. **Service connection failures**
   - Verify LocalStack is running: `npm run local:status`
   - Check service endpoints in configuration output

### Validation Commands

```bash
# Full system validation
npm run config:validate

# Test configuration system
npm run config:test

# Check current state
npm run state

# View configuration
npm run config
```

## Requirements Satisfied

This configuration system satisfies the following requirements from the specification:

- **9.1**: Unified configuration management with environment detection ✅
- **9.2**: Cross-platform path handling and service endpoint configuration ✅
- **9.3**: Validation for all configuration values ✅
- **9.4**: Required dependencies checking ✅
- **9.5**: State tracking and operation management ✅
- **9.6**: Integration with existing scripts and workflows ✅

The system provides a solid foundation for all data management operations while maintaining compatibility across different platforms and environments.