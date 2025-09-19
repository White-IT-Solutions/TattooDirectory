#!/usr/bin/env node

/**
 * Unified Data Manager - Main Orchestration Class
 * 
 * Central orchestration class that coordinates all data management operations.
 * Provides simple, unified interface for setup, reset, seeding, validation,
 * and health checking while maintaining all existing functionality.
 */

const { DATA_CONFIG } = require('./data-config');
const { DataPipeline, OPERATION_TYPES } = require('./pipeline-engine');
const { STATE_MANAGER } = require('./state-manager');
const { HealthMonitor } = require('./health-monitor');
const { ImageProcessor } = require('./image-processor');
const { DatabaseSeeder } = require('./database-seeder');
const { FrontendSyncProcessor } = require('./frontend-sync-processor');

/**
 * UnifiedDataManager class - Main orchestration for all data operations
 */
class UnifiedDataManager {
  constructor(config = DATA_CONFIG, dependencies = {}) {
    this.config = config;
    
    // Use dependency injection for better testability
    this.pipeline = dependencies.pipeline || new DataPipeline(config);
    this.stateManager = dependencies.stateManager || STATE_MANAGER;
    this.healthMonitor = dependencies.healthMonitor || new HealthMonitor(config);
    
    // Initialize processors with dependency injection
    this.imageProcessor = dependencies.imageProcessor || new ImageProcessor(config);
    this.databaseSeeder = dependencies.databaseSeeder || new DatabaseSeeder(config);
    this.frontendSyncProcessor = dependencies.frontendSyncProcessor || new FrontendSyncProcessor(config);
    
    // Operation tracking
    this.currentOperation = null;
    this.operationHistory = [];
  }

  /**
   * Setup data with support for frontend-only and images-only modes
   */
  async setupData(options = {}) {
    const {
      frontendOnly = false,
      imagesOnly = false,
      force = false,
      scenario = null,
      progressCallback = null
    } = options;

    console.log('🚀 Starting data setup...');
    
    // Determine operation type
    let operationType;
    if (frontendOnly) {
      operationType = OPERATION_TYPES.FRONTEND_ONLY;
    } else if (imagesOnly) {
      operationType = OPERATION_TYPES.IMAGES_ONLY;
    } else {
      operationType = force ? OPERATION_TYPES.FULL_SETUP : OPERATION_TYPES.INCREMENTAL;
    }

    try {
      // Start operation tracking
      const operationId = this.stateManager.startOperation('setup', {
        frontendOnly,
        imagesOnly,
        force,
        scenario
      });

      this.currentOperation = {
        id: operationId,
        type: 'setup',
        startTime: new Date(),
        options
      };

      // Build and execute pipeline
      const pipeline = this.pipeline.buildPipeline(operationType, {
        forceAll: force,
        scenario
      });

      console.log(`📋 Executing ${operationType} pipeline with ${pipeline.stages.length} stages`);
      
      const results = await this.pipeline.executePipeline(pipeline, progressCallback);

      // Process results based on operation type
      const processedResults = await this.processSetupResults(results, options);

      // End operation tracking
      this.stateManager.endOperation(true, processedResults);
      
      this.currentOperation.endTime = new Date();
      this.currentOperation.duration = this.currentOperation.endTime - this.currentOperation.startTime;
      this.currentOperation.success = true;
      this.currentOperation.results = processedResults;

      // Add to history
      this.operationHistory.unshift({ ...this.currentOperation });
      this.currentOperation = null;

      console.log('✅ Data setup completed successfully');
      
      return {
        success: true,
        operationType,
        results: processedResults,
        duration: this.currentOperation?.duration || 0
      };

    } catch (error) {
      console.error('❌ Data setup failed:', error.message);
      
      // End operation tracking with failure
      this.stateManager.endOperation(false, { error: error.message });
      
      if (this.currentOperation) {
        this.currentOperation.endTime = new Date();
        this.currentOperation.success = false;
        this.currentOperation.error = error.message;
        this.operationHistory.unshift({ ...this.currentOperation });
        this.currentOperation = null;
      }

      return {
        success: false,
        error: error.message,
        operationType
      };
    }
  }

  /**
   * Reset data with all 8 existing reset states
   */
  async resetData(state = 'fresh') {
    console.log(`🔄 Resetting data to '${state}' state...`);

    try {
      // Validate reset state
      const resetConfig = this.config.getResetStateConfig(state);
      console.log(`📋 ${resetConfig.description}`);

      // Start operation tracking
      const operationId = this.stateManager.startOperation('reset', {
        state,
        config: resetConfig
      });

      this.currentOperation = {
        id: operationId,
        type: 'reset',
        startTime: new Date(),
        state,
        config: resetConfig
      };

      let results = {};

      // Execute reset based on configuration
      if (resetConfig.clearAll) {
        console.log('🧹 Clearing all existing data...');
        const clearResult = await this.databaseSeeder.clearAllData();
        results.cleared = clearResult.success;
      }

      // Seed data based on reset configuration
      if (resetConfig.seedFull) {
        console.log('🌱 Seeding full dataset...');
        const seedResult = await this.databaseSeeder.seedAllData();
        results.seeded = seedResult.success;
        results.seedStats = seedResult.stats;
      } else if (resetConfig.scenario) {
        console.log(`🎯 Seeding scenario: ${resetConfig.scenario}`);
        const scenarioResult = await this.databaseSeeder.seedScenario(resetConfig.scenario);
        results.seeded = scenarioResult.success;
        results.scenario = resetConfig.scenario;
        results.seedStats = scenarioResult.stats;
      }

      // Handle frontend-only reset with enhanced capabilities
      if (resetConfig.frontendOnly) {
        console.log('🎨 Updating frontend mock data with enhanced capabilities...');
        const frontendResult = await this.frontendSyncProcessor.processFrontendOnly({
          scenario: resetConfig.scenario,
          includeBusinessData: true,
          validateData: true,
          exportToFile: false
        });
        results.frontendUpdated = frontendResult.success;
        results.frontendStats = frontendResult.stats;
        
        // Log enhanced statistics if available
        if (frontendResult.stats && frontendResult.stats.performance) {
          console.log(`   Generated in ${frontendResult.stats.performance.duration}ms`);
          console.log(`   Memory usage: ${Math.round(frontendResult.stats.performance.memoryUsage / 1024 / 1024)}MB`);
        }
      }

      // End operation tracking
      this.stateManager.endOperation(true, results);
      
      this.currentOperation.endTime = new Date();
      this.currentOperation.duration = this.currentOperation.endTime - this.currentOperation.startTime;
      this.currentOperation.success = true;
      this.currentOperation.results = results;

      // Add to history
      this.operationHistory.unshift({ ...this.currentOperation });
      this.currentOperation = null;

      console.log(`✅ Data reset to '${state}' completed successfully`);

      return {
        success: true,
        state,
        results,
        duration: this.currentOperation?.duration || 0
      };

    } catch (error) {
      console.error('❌ Data reset failed:', error.message);
      
      // End operation tracking with failure
      this.stateManager.endOperation(false, { error: error.message });
      
      if (this.currentOperation) {
        this.currentOperation.endTime = new Date();
        this.currentOperation.success = false;
        this.currentOperation.error = error.message;
        this.operationHistory.unshift({ ...this.currentOperation });
        this.currentOperation = null;
      }

      return {
        success: false,
        error: error.message,
        state
      };
    }
  }

  /**
   * Seed scenario supporting all 10 existing scenarios
   */
  async seedScenario(scenarioName) {
    console.log(`🎯 Seeding scenario: ${scenarioName}`);

    try {
      // Validate scenario
      const scenarioConfig = this.config.getScenarioConfig(scenarioName);
      console.log(`📋 ${scenarioConfig.description}`);

      // Start operation tracking
      const operationId = this.stateManager.startOperation('seed-scenario', {
        scenario: scenarioName,
        config: scenarioConfig
      });

      this.currentOperation = {
        id: operationId,
        type: 'seed-scenario',
        startTime: new Date(),
        scenario: scenarioName,
        config: scenarioConfig
      };

      // Execute scenario seeding
      const seedResult = await this.databaseSeeder.seedScenario(scenarioName);
      
      if (!seedResult.success) {
        throw new Error(seedResult.error);
      }

      // Update frontend with enhanced scenario data
      console.log('🎨 Updating frontend with enhanced scenario data...');
      const frontendResult = await this.frontendSyncProcessor.syncWithBackend({
        scenario: scenarioName,
        includeBusinessData: true,
        validateData: true
      });

      const results = {
        scenario: scenarioName,
        seeded: seedResult.success,
        seedStats: seedResult.stats,
        frontendUpdated: frontendResult.success,
        frontendStats: frontendResult.stats
      };

      // End operation tracking
      this.stateManager.endOperation(true, results);
      
      this.currentOperation.endTime = new Date();
      this.currentOperation.duration = this.currentOperation.endTime - this.currentOperation.startTime;
      this.currentOperation.success = true;
      this.currentOperation.results = results;

      // Add to history
      this.operationHistory.unshift({ ...this.currentOperation });
      this.currentOperation = null;

      console.log(`✅ Scenario '${scenarioName}' seeded successfully`);

      return {
        success: true,
        scenario: scenarioName,
        results,
        duration: this.currentOperation?.duration || 0
      };

    } catch (error) {
      console.error('❌ Scenario seeding failed:', error.message);
      
      // End operation tracking with failure
      this.stateManager.endOperation(false, { error: error.message });
      
      if (this.currentOperation) {
        this.currentOperation.endTime = new Date();
        this.currentOperation.success = false;
        this.currentOperation.error = error.message;
        this.operationHistory.unshift({ ...this.currentOperation });
        this.currentOperation = null;
      }

      return {
        success: false,
        error: error.message,
        scenario: scenarioName
      };
    }
  }

  /**
   * Process setup results based on operation type
   */
  async processSetupResults(pipelineResults, options) {
    const results = {
      images: { processed: 0, uploaded: 0, failed: 0 },
      database: { artists: 0, studios: 0, styles: 0 },
      opensearch: { documents: 0, indexed: 0 },
      frontend: { updated: false, artistCount: 0, enhancedCapabilities: false }
    };

    // Process image results
    if (pipelineResults.has('process-images')) {
      const imageResult = pipelineResults.get('process-images');
      if (imageResult && imageResult.stats) {
        results.images = {
          processed: imageResult.stats.processed || 0,
          uploaded: imageResult.stats.uploaded || 0,
          failed: imageResult.stats.failed || 0
        };
      }
    }

    // Process database results
    if (pipelineResults.has('seed-database')) {
      const dbResult = pipelineResults.get('seed-database');
      if (dbResult && dbResult.stats) {
        results.database = {
          artists: dbResult.stats.artists?.loaded || 0,
          studios: dbResult.stats.studios?.loaded || 0,
          styles: dbResult.stats.styles?.loaded || 0
        };
        results.opensearch = {
          documents: dbResult.stats.opensearch?.indexed || 0,
          indexed: dbResult.stats.opensearch?.indexed || 0
        };
      }
    }

    // Process enhanced frontend results
    if (pipelineResults.has('sync-frontend')) {
      const frontendResult = pipelineResults.get('sync-frontend');
      if (frontendResult) {
        results.frontend = {
          updated: frontendResult.success || false,
          artistCount: frontendResult.artistCount || 0,
          studioCount: frontendResult.studioCount || 0,
          generationTime: frontendResult.stats?.performance?.duration || 0,
          memoryUsage: frontendResult.stats?.performance?.memoryUsage || 0,
          validationErrors: frontendResult.stats?.errors?.length || 0,
          scenarios: frontendResult.stats?.scenarios || {},
          enhancedCapabilities: frontendResult.enhancedCapabilities || false
        };
      }
    }

    return results;
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios() {
    return this.config.getAvailableScenarios();
  }

  /**
   * Get available reset states
   */
  getAvailableResetStates() {
    return this.config.getAvailableResetStates();
  }

  /**
   * Get current operation status
   */
  getCurrentOperationStatus() {
    if (!this.currentOperation) {
      return { isRunning: false };
    }

    return {
      isRunning: true,
      operation: this.currentOperation.type,
      startTime: this.currentOperation.startTime,
      duration: Date.now() - this.currentOperation.startTime.getTime(),
      options: this.currentOperation.options || {}
    };
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit = 10) {
    return this.operationHistory.slice(0, limit);
  }

  /**
   * Cancel current operation (if possible)
   */
  async cancelCurrentOperation() {
    if (!this.currentOperation) {
      return { success: false, message: 'No operation in progress' };
    }

    try {
      // Force unlock state manager
      this.stateManager.forceUnlock();
      
      if (this.currentOperation) {
        this.currentOperation.endTime = new Date();
        this.currentOperation.success = false;
        this.currentOperation.cancelled = true;
        this.operationHistory.unshift({ ...this.currentOperation });
        this.currentOperation = null;
      }

      console.log('⚠️  Current operation cancelled');
      
      return { success: true, message: 'Operation cancelled' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Validate data with comprehensive validation types
   */
  async validateData(type = 'all') {
    console.log(`🔍 Validating data (type: ${type})...`);

    try {
      const validationResult = await this.healthMonitor.validateData(type);
      
      console.log('✅ Data validation completed');
      
      return {
        success: true,
        type,
        results: validationResult.results,
        timestamp: validationResult.timestamp,
        errors: validationResult.errors
      };

    } catch (error) {
      console.error('❌ Data validation failed:', error.message);
      
      return {
        success: false,
        type,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check service connectivity and health
   */
  async healthCheck() {
    console.log('🔍 Performing health check...');

    try {
      const healthResult = await this.healthMonitor.checkAllServices();
      
      console.log('✅ Health check completed');
      
      return {
        success: true,
        timestamp: healthResult.timestamp,
        services: healthResult.services,
        overall: healthResult.overall,
        summary: healthResult.summary
      };

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current system status and data counts
   */
  async getDataStatus() {
    console.log('📊 Getting system status...');

    try {
      // Get comprehensive health check
      const healthResult = await this.healthMonitor.performHealthCheck();
      
      // Get state manager status
      const stateStatus = this.stateManager.getStatusSummary();
      
      // Get pipeline status
      const pipelineStatus = this.pipeline.getStatus();
      
      const systemStatus = {
        timestamp: new Date().toISOString(),
        overall: healthResult.overall,
        services: {
          localstack: healthResult.services.LocalStack?.status || 'unknown',
          dynamodb: healthResult.services.DynamoDB?.status || 'unknown',
          opensearch: healthResult.services.OpenSearch?.status || 'unknown',
          s3: healthResult.services.S3?.status || 'unknown'
        },
        data: {
          dynamodb: this.extractDynamoDBCounts(healthResult.services.DynamoDB),
          opensearch: this.extractOpenSearchCounts(healthResult.services.OpenSearch),
          s3: this.extractS3Counts(healthResult.services.S3),
          consistency: healthResult.data?.crossServiceConsistency || { consistent: false }
        },
        operations: {
          current: this.getCurrentOperationStatus(),
          lastOperation: stateStatus.lastOperation,
          pipeline: pipelineStatus
        },
        changes: stateStatus.changes,
        errors: healthResult.errors || []
      };

      console.log('✅ System status retrieved');
      
      return {
        success: true,
        status: systemStatus
      };

    } catch (error) {
      console.error('❌ Failed to get system status:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Extract DynamoDB item counts from health check results
   */
  extractDynamoDBCounts(dynamoDBHealth) {
    if (!dynamoDBHealth || !dynamoDBHealth.details || !dynamoDBHealth.details.tables) {
      return { totalItems: 0, tables: {} };
    }

    const tables = dynamoDBHealth.details.tables;
    let totalItems = 0;
    const tableInfo = {};

    Object.entries(tables).forEach(([tableName, tableData]) => {
      const itemCount = typeof tableData.itemCount === 'number' ? tableData.itemCount : 0;
      totalItems += itemCount;
      tableInfo[tableName] = {
        itemCount,
        status: tableData.status
      };
    });

    return {
      totalItems,
      tables: tableInfo
    };
  }

  /**
   * Extract OpenSearch document counts from health check results
   */
  extractOpenSearchCounts(openSearchHealth) {
    if (!openSearchHealth || !openSearchHealth.details || !openSearchHealth.details.indices) {
      return { totalDocuments: 0, indices: {} };
    }

    const indices = openSearchHealth.details.indices;
    let totalDocuments = 0;
    const indexInfo = {};

    Object.entries(indices).forEach(([indexName, indexData]) => {
      const docCount = indexData.docsCount || 0;
      totalDocuments += docCount;
      indexInfo[indexName] = {
        documentCount: docCount,
        health: indexData.health,
        status: indexData.status
      };
    });

    return {
      totalDocuments,
      indices: indexInfo
    };
  }

  /**
   * Extract S3 object counts from health check results
   */
  extractS3Counts(s3Health) {
    if (!s3Health || !s3Health.details || !s3Health.details.buckets) {
      return { totalObjects: 0, buckets: {} };
    }

    const buckets = s3Health.details.buckets;
    let totalObjects = 0;
    const bucketInfo = {};

    Object.entries(buckets).forEach(([bucketName, bucketData]) => {
      const objectCount = typeof bucketData.objectCount === 'number' ? bucketData.objectCount : 0;
      totalObjects += objectCount;
      bucketInfo[bucketName] = {
        objectCount,
        creationDate: bucketData.creationDate
      };
    });

    return {
      totalObjects,
      buckets: bucketInfo
    };
  }

  /**
   * Perform comprehensive system validation
   */
  async performComprehensiveValidation() {
    console.log('🔍 Performing comprehensive system validation...');

    try {
      const results = {
        timestamp: new Date().toISOString(),
        validations: {},
        overall: 'unknown',
        errors: []
      };

      // Health check
      console.log('  🏥 Running health check...');
      const healthResult = await this.healthCheck();
      results.validations.health = healthResult;

      // Data consistency validation
      console.log('  🔄 Validating data consistency...');
      const consistencyResult = await this.validateData('consistency');
      results.validations.consistency = consistencyResult;

      // Image accessibility validation
      console.log('  🖼️  Validating image accessibility...');
      const imageResult = await this.validateData('images');
      results.validations.images = imageResult;

      // Scenario integrity validation
      console.log('  🧪 Validating scenario integrity...');
      const scenarioResult = await this.validateData('scenarios');
      results.validations.scenarios = scenarioResult;

      // Determine overall validation status
      const allSuccessful = Object.values(results.validations).every(v => v.success);
      results.overall = allSuccessful ? 'passed' : 'failed';

      // Collect all errors
      Object.values(results.validations).forEach(validation => {
        if (validation.errors && validation.errors.length > 0) {
          results.errors.push(...validation.errors);
        }
      });

      console.log(`✅ Comprehensive validation completed: ${results.overall}`);

      return {
        success: true,
        results
      };

    } catch (error) {
      console.error('❌ Comprehensive validation failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if system is ready for operations
   */
  async isSystemReady() {
    try {
      const ready = await this.healthMonitor.isSystemReady();
      return {
        ready,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ready: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export the class
module.exports = {
  UnifiedDataManager
};

// CLI usage when run directly
if (require.main === module) {
  const manager = new UnifiedDataManager();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  async function main() {
    try {
      switch (command) {
        case 'setup':
          const setupOptions = {
            frontendOnly: args.includes('--frontend-only'),
            imagesOnly: args.includes('--images-only'),
            force: args.includes('--force')
          };
          
          const scenarioIndex = args.indexOf('--scenario');
          if (scenarioIndex !== -1 && args[scenarioIndex + 1]) {
            setupOptions.scenario = args[scenarioIndex + 1];
          }
          
          const setupResult = await manager.setupData(setupOptions);
          if (setupResult.success) {
            console.log('🎉 Setup completed successfully!');
          } else {
            console.error('💥 Setup failed:', setupResult.error);
            process.exit(1);
          }
          break;
          
        case 'reset':
          const state = args[1] || 'fresh';
          const resetResult = await manager.resetData(state);
          if (resetResult.success) {
            console.log(`🎉 Reset to '${state}' completed successfully!`);
          } else {
            console.error('💥 Reset failed:', resetResult.error);
            process.exit(1);
          }
          break;
          
        case 'seed-scenario':
          const scenarioName = args[1];
          if (!scenarioName) {
            console.error('❌ Scenario name is required');
            console.log('Available scenarios:');
            manager.getAvailableScenarios().forEach(s => {
              console.log(`  ${s.name}: ${s.description}`);
            });
            process.exit(1);
          }
          
          const seedResult = await manager.seedScenario(scenarioName);
          if (seedResult.success) {
            console.log(`🎉 Scenario '${scenarioName}' seeded successfully!`);
          } else {
            console.error('💥 Scenario seeding failed:', seedResult.error);
            process.exit(1);
          }
          break;
          
        case 'status':
          const status = manager.getCurrentOperationStatus();
          if (status.isRunning) {
            console.log(`🔄 Operation in progress: ${status.operation} (${Math.round(status.duration / 1000)}s)`);
          } else {
            console.log('✅ No operation in progress');
          }
          
          const history = manager.getOperationHistory(5);
          if (history.length > 0) {
            console.log('\n📋 Recent operations:');
            history.forEach(op => {
              const status = op.success ? '✅' : '❌';
              const duration = op.duration ? `(${Math.round(op.duration / 1000)}s)` : '';
              console.log(`  ${status} ${op.type} ${duration}`);
            });
          }
          break;
          
        case 'scenarios':
          console.log('🎯 Available scenarios:');
          manager.getAvailableScenarios().forEach(s => {
            console.log(`  ${s.name}: ${s.description} (${s.artistCount} artists)`);
          });
          break;
          
        case 'reset-states':
          console.log('🔄 Available reset states:');
          manager.getAvailableResetStates().forEach(s => {
            console.log(`  ${s.name}: ${s.description}`);
          });
          break;
          
        case 'validate-data':
          const validationType = args[1] || 'all';
          const validateResult = await manager.validateData(validationType);
          if (validateResult.success) {
            console.log(`🎉 Data validation (${validationType}) completed successfully!`);
          } else {
            console.error('💥 Data validation failed:', validateResult.error);
            process.exit(1);
          }
          break;
          
        case 'health-check':
          const healthResult = await manager.healthCheck();
          if (healthResult.success) {
            console.log('🎉 Health check completed successfully!');
            console.log(`📊 Overall status: ${healthResult.overall}`);
            Object.entries(healthResult.services).forEach(([service, status]) => {
              const icon = status === 'healthy' ? '✅' : '❌';
              console.log(`  ${icon} ${service}: ${status}`);
            });
          } else {
            console.error('💥 Health check failed:', healthResult.error);
            process.exit(1);
          }
          break;
          
        case 'data-status':
          const statusResult = await manager.getDataStatus();
          if (statusResult.success) {
            const status = statusResult.status;
            console.log('📊 System Status Report');
            console.log('======================');
            console.log(`Overall: ${status.overall}`);
            console.log('\n🔌 Services:');
            Object.entries(status.services).forEach(([service, serviceStatus]) => {
              const icon = serviceStatus === 'healthy' ? '✅' : '❌';
              console.log(`  ${icon} ${service}: ${serviceStatus}`);
            });
            console.log('\n📊 Data Counts:');
            console.log(`  DynamoDB: ${status.data.dynamodb.totalItems} items`);
            console.log(`  OpenSearch: ${status.data.opensearch.totalDocuments} documents`);
            console.log(`  S3: ${status.data.s3.totalObjects} objects`);
            console.log(`  Consistency: ${status.data.consistency.consistent ? 'Consistent' : 'Inconsistent'}`);
          } else {
            console.error('💥 Failed to get system status:', statusResult.error);
            process.exit(1);
          }
          break;
          
        case 'validate-comprehensive':
          const compResult = await manager.performComprehensiveValidation();
          if (compResult.success) {
            console.log(`🎉 Comprehensive validation completed: ${compResult.results.overall}`);
            if (compResult.results.errors.length > 0) {
              console.log(`⚠️  Found ${compResult.results.errors.length} issues`);
            }
          } else {
            console.error('💥 Comprehensive validation failed:', compResult.error);
            process.exit(1);
          }
          break;
          
        default:
          console.log('🎛️  Unified Data Manager Usage:');
          console.log('  node unified-data-manager.js setup [--frontend-only] [--images-only] [--force] [--scenario <name>]');
          console.log('  node unified-data-manager.js reset [state]');
          console.log('  node unified-data-manager.js seed-scenario <scenario-name>');
          console.log('  node unified-data-manager.js validate-data [type]');
          console.log('  node unified-data-manager.js health-check');
          console.log('  node unified-data-manager.js data-status');
          console.log('  node unified-data-manager.js validate-comprehensive');
          console.log('  node unified-data-manager.js status');
          console.log('  node unified-data-manager.js scenarios');
          console.log('  node unified-data-manager.js reset-states');
          console.log('\nExamples:');
          console.log('  node unified-data-manager.js setup --frontend-only');
          console.log('  node unified-data-manager.js reset fresh');
          console.log('  node unified-data-manager.js seed-scenario minimal');
          console.log('  node unified-data-manager.js validate-data consistency');
          console.log('  node unified-data-manager.js health-check');
          process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Unexpected error:', error.message);
      process.exit(1);
    }
  }
  
  main();
}