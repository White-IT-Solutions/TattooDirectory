#!/usr/bin/env node

/**
 * Docker Compatibility Layer
 * 
 * Ensures existing Docker integration continues to work with the new unified system.
 * Provides environment detection and proper service endpoint configuration.
 */

const { UnifiedDataManager } = require('./unified-data-manager');
const { DATA_CONFIG } = require('./data-config');
const fs = require('fs');
const path = require('path');

/**
 * Docker environment detection and configuration
 */
class DockerCompatibilityLayer {
  constructor() {
    this.isDockerEnvironment = this.detectDockerEnvironment();
    this.config = this.adjustConfigForDocker();
    this.manager = new UnifiedDataManager(this.config);
  }

  /**
   * Detect if running in Docker container
   */
  detectDockerEnvironment() {
    // Check for Docker environment indicators
    const indicators = [
      process.env.DOCKER_CONTAINER === 'true',
      fs.existsSync('/.dockerenv'),
      process.env.HOSTNAME && process.env.HOSTNAME.includes('docker'),
      process.env.LOCALSTACK_ENDPOINT && process.env.LOCALSTACK_ENDPOINT.includes('localstack:')
    ];

    return indicators.some(indicator => indicator);
  }

  /**
   * Adjust configuration for Docker environment
   */
  adjustConfigForDocker() {
    const config = { ...DATA_CONFIG };

    if (this.isDockerEnvironment) {
      console.log('🐳 Docker environment detected - adjusting service endpoints');
      
      // Use container-to-container networking
      config.services = {
        ...config.services,
        localstack: process.env.LOCALSTACK_ENDPOINT || 'http://localstack:4566',
        dynamodb: process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local',
        opensearch: process.env.OPENSEARCH_INDEX || 'artists-local',
        s3Bucket: process.env.S3_BUCKET_NAME || 'tattoo-directory-images'
      };

      // Adjust AWS SDK configuration for container environment
      config.aws = {
        region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
        endpoint: config.services.localstack,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
        s3ForcePathStyle: true
      };
    } else {
      console.log('🖥️  Host environment detected - using localhost endpoints');
      
      // Use host-to-container networking
      config.services = {
        ...config.services,
        localstack: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566'
      };
    }

    return config;
  }

  /**
   * Execute operation with Docker-aware configuration
   */
  async executeWithDockerSupport(operation, options = {}) {
    try {
      console.log(`🔄 Executing ${operation} with Docker compatibility...`);
      
      // Add Docker-specific options
      const dockerOptions = {
        ...options,
        dockerEnvironment: this.isDockerEnvironment,
        serviceEndpoints: this.config.services
      };

      let result;
      switch (operation) {
        case 'setup-data':
          result = await this.manager.setupData(dockerOptions);
          break;
        case 'reset-data':
          result = await this.manager.resetData(dockerOptions.state || 'fresh');
          break;
        case 'seed-scenario':
          result = await this.manager.seedScenario(dockerOptions.scenario);
          break;
        case 'validate-data':
          result = await this.manager.validateData(dockerOptions.type || 'all');
          break;
        case 'health-check':
          result = await this.manager.healthCheck();
          break;
        case 'data-status':
          result = await this.manager.getDataStatus();
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      console.log('✅ Docker-compatible operation completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Docker-compatible operation failed:', error.message);
      
      if (this.isDockerEnvironment) {
        console.log('\n🔧 Docker Troubleshooting:');
        console.log('   • Verify LocalStack container is running');
        console.log('   • Check container networking configuration');
        console.log('   • Ensure environment variables are properly set');
      }
      
      throw error;
    }
  }

  /**
   * Validate Docker environment setup
   */
  async validateDockerSetup() {
    console.log('\n🔍 Validating Docker environment setup...');
    
    if (this.isDockerEnvironment) {
      console.log('✅ Running in Docker container');
      console.log(`   • LocalStack endpoint: ${this.config.services.localstack}`);
      console.log(`   • DynamoDB table: ${this.config.services.dynamodb}`);
      console.log(`   • OpenSearch index: ${this.config.services.opensearch}`);
      console.log(`   • S3 bucket: ${this.config.services.s3Bucket}`);
    } else {
      console.log('✅ Running on host machine');
      console.log(`   • LocalStack endpoint: ${this.config.services.localstack}`);
    }

    try {
      const healthResult = await this.manager.healthCheck();
      console.log('✅ Docker environment validation successful');
      return healthResult;
    } catch (error) {
      console.error('❌ Docker environment validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate Docker environment report
   */
  generateDockerReport() {
    console.log('\n🐳 DOCKER COMPATIBILITY REPORT');
    console.log('═══════════════════════════════════');
    
    console.log(`Environment Type: ${this.isDockerEnvironment ? 'Docker Container' : 'Host Machine'}`);
    console.log(`LocalStack Endpoint: ${this.config.services.localstack}`);
    console.log(`AWS Region: ${this.config.aws?.region || 'Default'}`);
    
    if (this.isDockerEnvironment) {
      console.log('\n🔧 Container Configuration:');
      console.log(`   • DOCKER_CONTAINER: ${process.env.DOCKER_CONTAINER || 'not set'}`);
      console.log(`   • HOSTNAME: ${process.env.HOSTNAME || 'not set'}`);
      console.log(`   • LOCALSTACK_ENDPOINT: ${process.env.LOCALSTACK_ENDPOINT || 'not set'}`);
    }
    
    console.log('\n📋 Service Endpoints:');
    Object.entries(this.config.services).forEach(([service, endpoint]) => {
      console.log(`   • ${service}: ${endpoint}`);
    });
    
    console.log('═══════════════════════════════════\n');
  }
}

/**
 * CLI interface for Docker compatibility
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const dockerCompat = new DockerCompatibilityLayer();
  
  try {
    switch (command) {
      case 'setup-data':
        await dockerCompat.executeWithDockerSupport('setup-data', {
          frontendOnly: args.includes('--frontend-only'),
          imagesOnly: args.includes('--images-only'),
          force: args.includes('--force')
        });
        break;
        
      case 'reset-data':
        await dockerCompat.executeWithDockerSupport('reset-data', {
          state: args[1] || 'fresh'
        });
        break;
        
      case 'seed-scenario':
        const scenario = args[1];
        if (!scenario) {
          console.error('❌ Scenario name required');
          process.exit(1);
        }
        await dockerCompat.executeWithDockerSupport('seed-scenario', { scenario });
        break;
        
      case 'validate-data':
        await dockerCompat.executeWithDockerSupport('validate-data', {
          type: args[1] || 'all'
        });
        break;
        
      case 'health-check':
        await dockerCompat.executeWithDockerSupport('health-check');
        break;
        
      case 'data-status':
        await dockerCompat.executeWithDockerSupport('data-status');
        break;
        
      case 'validate-docker':
        await dockerCompat.validateDockerSetup();
        break;
        
      case 'docker-report':
        dockerCompat.generateDockerReport();
        break;
        
      default:
        console.log('🐳 Docker Compatibility Layer');
        console.log('Usage:');
        console.log('  node docker-compatibility.js setup-data [--frontend-only] [--images-only] [--force]');
        console.log('  node docker-compatibility.js reset-data [state]');
        console.log('  node docker-compatibility.js seed-scenario <scenario>');
        console.log('  node docker-compatibility.js validate-data [type]');
        console.log('  node docker-compatibility.js health-check');
        console.log('  node docker-compatibility.js data-status');
        console.log('  node docker-compatibility.js validate-docker');
        console.log('  node docker-compatibility.js docker-report');
        break;
    }
  } catch (error) {
    console.error('❌ Docker compatibility operation failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  DockerCompatibilityLayer
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}