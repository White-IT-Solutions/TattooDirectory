#!/usr/bin/env node

/**
 * Unified Data Management Configuration
 * 
 * Central configuration management for all data management operations.
 * Provides environment detection, cross-platform path handling, and
 * service endpoint configuration with validation.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Detect the current platform and environment
 */
function detectEnvironment() {
  const platform = os.platform();
  const isWindows = platform === 'win32';
  const isLinux = platform === 'linux';
  const isMacOS = platform === 'darwin';
  
  // Detect if running in Docker container
  const isDocker = fs.existsSync('/.dockerenv') || 
                   process.env.DOCKER_CONTAINER === 'true' ||
                   (process.env.HOSTNAME && process.env.HOSTNAME.includes('docker')) ||
                   false;
  
  // Detect if running in CI/CD environment
  const isCI = process.env.CI === 'true' || 
               process.env.GITHUB_ACTIONS === 'true' ||
               !!process.env.JENKINS_URL ||
               !!process.env.BUILDKITE;

  return {
    platform,
    isWindows,
    isLinux,
    isMacOS,
    isDocker,
    isCI,
    nodeVersion: process.version,
    workingDirectory: process.cwd()
  };
}

/**
 * Get cross-platform paths with proper path separators
 */
function getPlatformPaths(environment) {
  const projectRoot = process.cwd();
  
  return {
    // Core directories
    projectRoot,
    scriptsDir: path.join(projectRoot, 'scripts'),
    testsDir: path.join(projectRoot, 'tests'),
    frontendDir: path.join(projectRoot, 'frontend'),
    backendDir: path.join(projectRoot, 'backend'),
    
    // Data directories
    testDataDir: path.join(projectRoot, 'scripts', 'test-data'),
    imageSourceDir: path.join(projectRoot, 'tests', 'Test_Data', 'ImageSet'),
    
    // Frontend mock data
    frontendMockData: path.join(projectRoot, 'frontend', 'src', 'app', 'data', 'mockArtistData.js'),
    
    // State tracking directory
    stateTrackingDir: path.join(projectRoot, '.kiro', 'data-management-state'),
    
    // Configuration files
    envFile: path.join(projectRoot, 'devtools', '.env.local'),
    dockerComposeFile: path.join(projectRoot, 'devtools', 'docker', 'docker-compose.local.yml'),
    
    // Output directories
    outputDir: path.join(projectRoot, 'scripts', 'output'),
    logsDir: path.join(projectRoot, 'scripts', 'logs'),
    backupDir: path.join(projectRoot, 'scripts', 'backups')
  };
}

/**
 * Get service endpoints based on environment
 */
function getServiceEndpoints(environment) {
  const isDocker = environment.isDocker;
  
  // Base LocalStack endpoint
  const localstackHost = isDocker ? 'localstack' : 'localhost';
  const localstackPort = process.env.LOCALSTACK_PORT || '4566';
  const localstackEndpoint = `http://${localstackHost}:${localstackPort}`;
  
  return {
    // LocalStack services
    localstack: {
      endpoint: localstackEndpoint,
      host: localstackHost,
      port: localstackPort
    },
    
    // AWS service configurations
    aws: {
      region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      endpoint: process.env.AWS_ENDPOINT_URL || localstackEndpoint
    },
    
    // DynamoDB configuration
    dynamodb: {
      endpoint: localstackEndpoint,
      tableName: process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local',
      region: process.env.AWS_DEFAULT_REGION || 'eu-west-2'
    },
    
    // OpenSearch configuration
    opensearch: {
      endpoint: localstackEndpoint,
      indexName: process.env.OPENSEARCH_INDEX || 'artists-local',
      domain: process.env.OPENSEARCH_DOMAIN || 'tattoo-directory'
    },
    
    // S3 configuration
    s3: {
      endpoint: localstackEndpoint,
      bucketName: process.env.S3_BUCKET_NAME || 'tattoo-directory-images',
      region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
      forcePathStyle: true
    }
  };
}

/**
 * Scenario definitions preserving all existing scenarios
 */
const SCENARIOS = {
  minimal: {
    artistCount: 3,
    description: 'Quick testing with minimal data',
    styles: ['traditional', 'realism'],
    locations: ['London']
  },
  'search-basic': {
    artistCount: 5,
    description: 'Basic search functionality testing',
    styles: ['traditional', 'realism'],
    locations: ['London', 'Manchester']
  },
  'london-artists': {
    artistCount: 5,
    description: 'London-focused artist testing',
    location: 'London',
    styles: ['traditional', 'realism', 'blackwork']
  },
  'high-rated': {
    artistCount: 3,
    description: 'High-rated artists for quality testing',
    minRating: 4.5,
    styles: ['realism', 'traditional']
  },
  'new-artists': {
    artistCount: 4,
    description: 'Recently added artists',
    recentlyAdded: true,
    styles: ['fineline', 'minimalism']
  },
  'booking-available': {
    artistCount: 6,
    description: 'Artists with open booking slots',
    bookingOpen: true,
    styles: ['traditional', 'realism', 'blackwork']
  },
  'portfolio-rich': {
    artistCount: 4,
    description: 'Artists with extensive portfolios',
    minPortfolioImages: 8,
    styles: ['realism', 'traditional', 'neo_traditional']
  },
  'multi-style': {
    artistCount: 3,
    description: 'Artists with multiple style specializations',
    minStyles: 3,
    styles: ['traditional', 'realism', 'blackwork', 'neo_traditional']
  },
  'pricing-range': {
    artistCount: 5,
    description: 'Mid-range pricing testing',
    priceRange: 'mid',
    styles: ['traditional', 'realism']
  },
  'full-dataset': {
    artistCount: 10,
    description: 'Complete test dataset with all styles',
    styles: ['traditional', 'realism', 'blackwork', 'neo_traditional', 'fineline', 'minimalism', 'geometric', 'watercolour']
  }
};

/**
 * Reset state definitions preserving all existing states
 */
const RESET_STATES = {
  clean: {
    description: 'Empty all databases but keep services running',
    clearAll: true,
    preserveServices: true
  },
  fresh: {
    description: 'Clean databases and seed with full dataset',
    clearAll: true,
    seedFull: true,
    scenario: 'full-dataset'
  },
  minimal: {
    description: 'Minimal data for quick testing',
    clearAll: true,
    scenario: 'minimal'
  },
  'search-ready': {
    description: 'Optimized for search testing',
    clearAll: true,
    scenario: 'search-basic'
  },
  'location-test': {
    description: 'Location-based testing data',
    clearAll: true,
    scenario: 'london-artists'
  },
  'style-test': {
    description: 'Style filtering testing data',
    clearAll: true,
    scenario: 'multi-style'
  },
  'performance-test': {
    description: 'Performance testing dataset',
    clearAll: true,
    scenario: 'full-dataset'
  },
  'frontend-ready': {
    description: 'Minimal data optimized for frontend development',
    clearAll: true,
    frontendOnly: true,
    scenario: 'minimal'
  }
};

/**
 * Validation configuration
 */
const VALIDATION_CONFIG = {
  timeouts: {
    serviceConnection: 10000,    // 10 seconds
    imageUpload: 30000,         // 30 seconds
    databaseOperation: 15000,   // 15 seconds
    healthCheck: 5000           // 5 seconds
  },
  retries: {
    serviceConnection: 3,
    imageUpload: 2,
    databaseOperation: 2,
    healthCheck: 1
  },
  thresholds: {
    maxImageSize: 5 * 1024 * 1024,  // 5MB
    maxArtistCount: 50,
    maxPortfolioImages: 20,
    minPortfolioImages: 5
  }
};

/**
 * Main configuration class
 */
class DataConfiguration {
  constructor() {
    this.environment = detectEnvironment();
    this.paths = getPlatformPaths(this.environment);
    this.services = getServiceEndpoints(this.environment);
    this.scenarios = SCENARIOS;
    this.resetStates = RESET_STATES;
    this.validation = VALIDATION_CONFIG;
    
    // Ensure required directories exist
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const requiredDirs = [
      this.paths.stateTrackingDir,
      this.paths.outputDir,
      this.paths.logsDir,
      this.paths.backupDir
    ];

    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Check required directories
    const requiredPaths = [
      { path: this.paths.testDataDir, name: 'Test data directory' },
      { path: this.paths.imageSourceDir, name: 'Image source directory' }
    ];

    requiredPaths.forEach(({ path: dirPath, name }) => {
      if (!fs.existsSync(dirPath)) {
        errors.push(`${name} not found: ${dirPath}`);
      }
    });

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      warnings.push(`Node.js version ${nodeVersion} is below recommended 18.x`);
    }

    // Check environment variables for production-like environments
    if (!this.environment.isDocker && !this.environment.isCI) {
      const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
      requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar] || process.env[envVar] === 'test') {
          warnings.push(`Environment variable ${envVar} is using default test value`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration for a specific scenario
   */
  getScenarioConfig(scenarioName) {
    const scenario = this.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}. Available scenarios: ${Object.keys(this.scenarios).join(', ')}`);
    }
    return scenario;
  }

  /**
   * Get configuration for a specific reset state
   */
  getResetStateConfig(stateName) {
    const state = this.resetStates[stateName];
    if (!state) {
      throw new Error(`Unknown reset state: ${stateName}. Available states: ${Object.keys(this.resetStates).join(', ')}`);
    }
    return state;
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios() {
    return Object.keys(this.scenarios).map(name => ({
      name,
      description: this.scenarios[name].description,
      artistCount: this.scenarios[name].artistCount
    }));
  }

  /**
   * Get available reset states
   */
  getAvailableResetStates() {
    return Object.keys(this.resetStates).map(name => ({
      name,
      description: this.resetStates[name].description
    }));
  }

  /**
   * Export configuration as JSON
   */
  toJSON() {
    return {
      environment: this.environment,
      paths: this.paths,
      services: this.services,
      scenarios: this.scenarios,
      resetStates: this.resetStates,
      validation: this.validation
    };
  }
}

// Create and export the default configuration instance
const DATA_CONFIG = new DataConfiguration();

module.exports = {
  DATA_CONFIG,
  DataConfiguration,
  SCENARIOS,
  RESET_STATES,
  VALIDATION_CONFIG
};

// CLI usage when run directly
if (require.main === module) {
  const config = new DataConfiguration();
  const validation = config.validate();
  
  console.log('🔧 Data Management Configuration');
  console.log('================================\n');
  
  console.log('📋 Environment Information:');
  console.log(`  Platform: ${config.environment.platform}`);
  console.log(`  Node.js: ${config.environment.nodeVersion}`);
  console.log(`  Docker: ${config.environment.isDocker ? 'Yes' : 'No'}`);
  console.log(`  CI/CD: ${config.environment.isCI ? 'Yes' : 'No'}`);
  
  console.log('\n🌐 Service Endpoints:');
  console.log(`  LocalStack: ${config.services.localstack.endpoint}`);
  console.log(`  DynamoDB: ${config.services.dynamodb.tableName}`);
  console.log(`  OpenSearch: ${config.services.opensearch.indexName}`);
  console.log(`  S3 Bucket: ${config.services.s3.bucketName}`);
  
  console.log('\n📁 Key Paths:');
  console.log(`  Project Root: ${config.paths.projectRoot}`);
  console.log(`  Test Data: ${config.paths.testDataDir}`);
  console.log(`  Image Source: ${config.paths.imageSourceDir}`);
  console.log(`  State Tracking: ${config.paths.stateTrackingDir}`);
  
  console.log('\n🎯 Available Scenarios:');
  config.getAvailableScenarios().forEach(scenario => {
    console.log(`  ${scenario.name}: ${scenario.description} (${scenario.artistCount} artists)`);
  });
  
  console.log('\n🔄 Available Reset States:');
  config.getAvailableResetStates().forEach(state => {
    console.log(`  ${state.name}: ${state.description}`);
  });
  
  console.log('\n✅ Configuration Validation:');
  if (validation.isValid) {
    console.log('  Status: Valid ✅');
  } else {
    console.log('  Status: Invalid ❌');
    validation.errors.forEach(error => {
      console.log(`  Error: ${error}`);
    });
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`  ${warning}`);
    });
  }
}