# Data Management API Documentation

## Overview

The unified data management system provides both CLI commands and programmatic APIs for managing development data. This documentation covers the programmatic interfaces for advanced use cases and integration scenarios.

## Core Classes

### UnifiedDataManager

Main orchestration class for all data management operations.

```javascript
const { UnifiedDataManager } = require('./scripts/unified-data-manager');

const manager = new UnifiedDataManager();
```

#### Methods

##### `setupData(options)`

Sets up the complete development environment with data processing, database seeding, and frontend synchronization.

**Parameters:**
- `options` (Object, optional)
  - `frontendOnly` (Boolean): Generate only frontend mock data without AWS services
  - `imagesOnly` (Boolean): Process only images and S3 upload
  - `force` (Boolean): Force reprocessing of all data regardless of changes

**Returns:** Promise<Object> - Operation results with detailed statistics

**Example:**
```javascript
// Complete setup
const results = await manager.setupData();
console.log(`Processed ${results.images.processed} images`);
console.log(`Seeded ${results.database.artists} artists`);

// Frontend-only setup
const frontendResults = await manager.setupData({ frontendOnly: true });
console.log(`Generated ${frontendResults.mockData.artistCount} mock artists`);

// Force refresh all data
const forceResults = await manager.setupData({ force: true });
```

##### `resetData(state)`

Resets the system to a predefined state for testing.

**Parameters:**
- `state` (String, optional): Reset state name (default: 'fresh')
  - `'clean'`: Empty databases, services running
  - `'fresh'`: Full dataset, clean start
  - `'minimal'`: Minimal data for quick testing
  - `'search-ready'`: Optimized for search testing
  - `'location-test'`: Location-based testing data
  - `'style-test'`: Style filtering testing data
  - `'performance-test'`: Performance testing dataset
  - `'frontend-ready'`: Minimal data for frontend development

**Returns:** Promise<Object> - Reset operation results

**Example:**
```javascript
// Reset to clean state
await manager.resetData('clean');

// Reset to fresh state with full dataset
await manager.resetData('fresh');

// Reset for frontend development
await manager.resetData('frontend-ready');
```

##### `seedScenario(scenarioName)`

Seeds the system with a specific test scenario.

**Parameters:**
- `scenarioName` (String): Name of the scenario to seed
  - `'minimal'`: 3 artists, quick testing
  - `'search-basic'`: 5 artists, traditional + realism styles
  - `'london-artists'`: 5 London-based artists
  - `'high-rated'`: 3 artists with 4.5+ ratings
  - `'new-artists'`: 4 recently added artists
  - `'booking-available'`: 6 artists with open booking
  - `'portfolio-rich'`: 4 artists with 8+ portfolio images
  - `'multi-style'`: 3 artists with 3+ specializations
  - `'pricing-range'`: 5 artists with mid-range pricing
  - `'full-dataset'`: 10 artists, complete test data

**Returns:** Promise<Object> - Seeding operation results

**Example:**
```javascript
// Seed minimal scenario for quick testing
await manager.seedScenario('minimal');

// Seed London artists for location testing
await manager.seedScenario('london-artists');

// Seed full dataset for comprehensive testing
await manager.seedScenario('full-dataset');
```

##### `validateData(type)`

Validates data consistency and integrity across services.

**Parameters:**
- `type` (String, optional): Validation type (default: 'all')
  - `'all'`: Complete validation across all services
  - `'consistency'`: Cross-service data consistency
  - `'images'`: Image URL accessibility
  - `'scenarios'`: Scenario data integrity

**Returns:** Promise<Object> - Validation results with detailed findings

**Example:**
```javascript
// Complete validation
const validation = await manager.validateData();
console.log(`Validation status: ${validation.overall.status}`);

// Image-specific validation
const imageValidation = await manager.validateData('images');
console.log(`Image URLs accessible: ${imageValidation.images.accessible}/${imageValidation.images.total}`);
```

##### `healthCheck()`

Performs comprehensive health check of all services and connections.

**Returns:** Promise<Object> - Health check results

**Example:**
```javascript
const health = await manager.healthCheck();
console.log('Service Status:', health.services);
console.log('Overall Health:', health.overall.status);
```

##### `getDataStatus()`

Gets current system status including data counts and service information.

**Returns:** Promise<Object> - Current system status

**Example:**
```javascript
const status = await manager.getDataStatus();
console.log('DynamoDB Artists:', status.data.dynamodb.artists);
console.log('OpenSearch Documents:', status.data.opensearch.documents);
console.log('S3 Images:', status.data.s3.images);
```

### DataConfiguration

Central configuration management with environment detection and validation.

```javascript
const { DATA_CONFIG } = require('./scripts/data-config');
```

#### Properties

##### `services`

Service endpoint configuration with automatic environment detection.

```javascript
const config = DATA_CONFIG.services;
console.log('LocalStack endpoint:', config.localstack);
console.log('DynamoDB table:', config.dynamodb);
console.log('S3 bucket:', config.s3Bucket);
```

##### `paths`

Cross-platform file path configuration.

```javascript
const paths = DATA_CONFIG.paths;
console.log('Image source:', paths.imageSource);
console.log('Test data:', paths.testData);
console.log('Frontend mock:', paths.frontendMock);
```

##### `scenarios`

Available test scenario configurations.

```javascript
const scenarios = DATA_CONFIG.scenarios;
console.log('Available scenarios:', Object.keys(scenarios));
console.log('Minimal scenario:', scenarios.minimal);
```

##### `resetStates`

Available reset state configurations.

```javascript
const resetStates = DATA_CONFIG.resetStates;
console.log('Available reset states:', Object.keys(resetStates));
console.log('Fresh state config:', resetStates.fresh);
```

#### Methods

##### `validate()`

Validates the current configuration and system prerequisites.

**Returns:** Object - Validation results with errors and warnings

**Example:**
```javascript
const validation = DATA_CONFIG.validate();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

##### `getScenarioConfig(scenarioName)`

Gets configuration for a specific scenario.

**Parameters:**
- `scenarioName` (String): Name of the scenario

**Returns:** Object - Scenario configuration

**Example:**
```javascript
const scenario = DATA_CONFIG.getScenarioConfig('minimal');
console.log(`Artist count: ${scenario.artistCount}`);
console.log(`Description: ${scenario.description}`);
```

### StateManager

Tracks file changes and operation state for incremental processing.

```javascript
const { StateManager } = require('./scripts/state-manager');

const stateManager = new StateManager(DATA_CONFIG);
```

#### Methods

##### `getLastState()`

Gets the last recorded system state.

**Returns:** Promise<Object> - Last state information

**Example:**
```javascript
const lastState = await stateManager.getLastState();
console.log('Last operation:', lastState.operation);
console.log('Timestamp:', lastState.timestamp);
```

##### `updateState(operation, results)`

Updates the system state after an operation.

**Parameters:**
- `operation` (Object): Operation details
- `results` (Object): Operation results

**Returns:** Promise<void>

**Example:**
```javascript
await stateManager.updateState(
  { type: 'setup', options: { frontendOnly: false } },
  { images: { processed: 45 }, database: { artists: 10 } }
);
```

##### `detectChanges()`

Detects changes in files since last operation.

**Returns:** Promise<Object> - Change detection results

**Example:**
```javascript
const changes = await stateManager.detectChanges();
console.log('Images changed:', changes.imagesChanged);
console.log('Data changed:', changes.dataChanged);
```

### HealthMonitor

Monitors service health and validates data consistency.

```javascript
const { HealthMonitor } = require('./scripts/health-monitor');

const healthMonitor = new HealthMonitor(DATA_CONFIG);
```

#### Methods

##### `checkAllServices()`

Checks connectivity and health of all services.

**Returns:** Promise<Object> - Service health results

**Example:**
```javascript
const health = await healthMonitor.checkAllServices();
console.log('LocalStack status:', health.localstack.status);
console.log('DynamoDB status:', health.dynamodb.status);
```

##### `validateData(type)`

Validates data consistency across services.

**Parameters:**
- `type` (String): Validation type ('all', 'consistency', 'images', 'scenarios')

**Returns:** Promise<Object> - Validation results

**Example:**
```javascript
const validation = await healthMonitor.validateData('consistency');
console.log('Consistency status:', validation.consistency.status);
```

##### `getSystemStatus()`

Gets comprehensive system status information.

**Returns:** Promise<Object> - System status

**Example:**
```javascript
const status = await healthMonitor.getSystemStatus();
console.log('System ready:', status.ready);
console.log('Data counts:', status.data);
```

## Integration Examples

### Custom Test Setup

```javascript
const { UnifiedDataManager } = require('./scripts/unified-data-manager');

async function setupCustomTest() {
  const manager = new UnifiedDataManager();
  
  // Reset to clean state
  await manager.resetData('clean');
  
  // Seed specific scenario
  await manager.seedScenario('search-basic');
  
  // Validate setup
  const validation = await manager.validateData();
  
  if (validation.overall.status === 'passed') {
    console.log('Test environment ready');
    return true;
  } else {
    console.error('Setup validation failed:', validation.errors);
    return false;
  }
}
```

### CI/CD Integration

```javascript
const { UnifiedDataManager } = require('./scripts/unified-data-manager');

async function ciSetup() {
  const manager = new UnifiedDataManager();
  
  try {
    // Setup with force to ensure clean state
    const results = await manager.setupData({ force: true });
    
    // Validate everything is working
    const health = await manager.healthCheck();
    
    if (health.overall.status !== 'healthy') {
      throw new Error('Health check failed');
    }
    
    console.log('CI environment ready');
    return results;
    
  } catch (error) {
    console.error('CI setup failed:', error);
    process.exit(1);
  }
}
```

### Custom Scenario Creation

```javascript
const { UnifiedDataManager, DATA_CONFIG } = require('./scripts/unified-data-manager');

// Extend configuration with custom scenario
DATA_CONFIG.scenarios['custom-test'] = {
  artistCount: 2,
  description: 'Custom test scenario',
  styles: ['traditional'],
  location: 'Manchester'
};

async function useCustomScenario() {
  const manager = new UnifiedDataManager();
  
  // This will now work with the custom scenario
  await manager.seedScenario('custom-test');
}
```

### Monitoring Integration

```javascript
const { HealthMonitor } = require('./scripts/health-monitor');

class CustomMonitor extends HealthMonitor {
  async customHealthCheck() {
    const baseHealth = await this.checkAllServices();
    
    // Add custom checks
    const customChecks = {
      customService: await this.checkCustomService(),
      dataQuality: await this.checkDataQuality()
    };
    
    return {
      ...baseHealth,
      custom: customChecks
    };
  }
  
  async checkCustomService() {
    // Custom service health check logic
    return { status: 'healthy', details: 'Custom service OK' };
  }
  
  async checkDataQuality() {
    // Custom data quality checks
    return { status: 'passed', score: 95 };
  }
}
```

## Error Handling

All API methods return promises and should be wrapped in try-catch blocks:

```javascript
const { UnifiedDataManager } = require('./scripts/unified-data-manager');

async function safeOperation() {
  const manager = new UnifiedDataManager();
  
  try {
    const results = await manager.setupData();
    console.log('Success:', results);
  } catch (error) {
    console.error('Operation failed:', error.message);
    
    // Check if it's a recoverable error
    if (error.code === 'SERVICE_UNAVAILABLE') {
      console.log('Retrying in 30 seconds...');
      setTimeout(() => safeOperation(), 30000);
    }
  }
}
```

## Performance Considerations

### Incremental Processing

The system automatically uses incremental processing to optimize performance:

```javascript
// First run - processes everything
await manager.setupData();

// Subsequent runs - only processes changes
await manager.setupData(); // Much faster
```

### Batch Operations

For multiple operations, use batch methods when available:

```javascript
// Instead of multiple individual operations
await manager.resetData('clean');
await manager.seedScenario('minimal');
await manager.validateData();

// Use a single batch operation if available
await manager.batchOperation([
  { type: 'reset', state: 'clean' },
  { type: 'seed', scenario: 'minimal' },
  { type: 'validate', type: 'all' }
]);
```

### Resource Management

The system automatically manages resources, but you can optimize for specific use cases:

```javascript
// For memory-constrained environments
const manager = new UnifiedDataManager({
  ...DATA_CONFIG,
  processing: {
    batchSize: 5,        // Smaller batch sizes
    maxConcurrency: 2    // Limit concurrent operations
  }
});
```

## TypeScript Support

Type definitions are available for TypeScript projects:

```typescript
import { UnifiedDataManager, DataConfiguration, HealthMonitor } from './scripts/unified-data-manager';

interface SetupOptions {
  frontendOnly?: boolean;
  imagesOnly?: boolean;
  force?: boolean;
}

const manager: UnifiedDataManager = new UnifiedDataManager();
const results = await manager.setupData({ frontendOnly: true } as SetupOptions);
```

## Migration from Legacy APIs

If migrating from legacy script APIs:

```javascript
// Legacy approach
const seedResult = await require('./scripts/data-seeder/seed.js').run();

// New unified approach
const manager = new UnifiedDataManager();
const setupResult = await manager.setupData();
```

See the [Migration Guide](MIGRATION_GUIDE.md) for complete migration instructions.

## Support and Troubleshooting

For issues with the programmatic API:

1. **Enable debug logging**: Set `DEBUG=data-management` environment variable
2. **Check system health**: Use `manager.healthCheck()` to diagnose issues
3. **Validate configuration**: Use `DATA_CONFIG.validate()` to check setup
4. **Review logs**: Check operation logs for detailed error information

For more troubleshooting information, see the [Troubleshooting Guide](TROUBLESHOOTING.md).