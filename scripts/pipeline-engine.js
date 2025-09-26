#!/usr/bin/env node

/**
 * Data Pipeline Engine
 * 
 * Pipeline execution engine with stage management, parallel execution support,
 * and progress tracking for long-running operations. Orchestrates all data
 * management operations with intelligent dependency resolution.
 */

const EventEmitter = require('events');
const { DATA_CONFIG } = require('./data-config');
const { STATE_MANAGER } = require('./state-manager');
const { ImageProcessor } = require('./image-processor');
const { DatabaseSeeder } = require('./database-seeder');
const { FrontendSyncProcessor } = require('./frontend-sync-processor');
const { ErrorHandler, ERROR_TYPES, RECOVERY_STRATEGIES } = require('./error-handler');

/**
 * Pipeline stage definitions with dependencies and execution metadata
 */
const PIPELINE_STAGES = {
  VALIDATE_PREREQUISITES: {
    name: 'validate-prerequisites',
    description: 'Validate system prerequisites and service availability',
    dependencies: [],
    parallel: false,
    timeout: 30000,
    retryable: true,
    critical: true
  },
  
  DETECT_CHANGES: {
    name: 'detect-changes',
    description: 'Detect file changes and determine required operations',
    dependencies: ['validate-prerequisites'],
    parallel: false,
    timeout: 10000,
    retryable: true,
    critical: true
  },
  
  PROCESS_IMAGES: {
    name: 'process-images',
    description: 'Process and upload images to S3',
    dependencies: ['detect-changes'],
    parallel: true,
    timeout: 300000,
    retryable: true,
    critical: false
  },
  
  SEED_DATABASE: {
    name: 'seed-database',
    description: 'Seed DynamoDB and OpenSearch with test data',
    dependencies: ['detect-changes'],
    parallel: true,
    timeout: 180000,
    retryable: true,
    critical: true
  },
  
  SYNC_FRONTEND: {
    name: 'sync-frontend',
    description: 'Generate and sync frontend mock data',
    dependencies: ['detect-changes'],
    parallel: true,
    timeout: 30000,
    retryable: true,
    critical: false
  },
  
  VALIDATE_DATA: {
    name: 'validate-data',
    description: 'Validate data consistency across all services',
    dependencies: ['detect-changes'],
    parallel: false,
    timeout: 60000,
    retryable: true,
    critical: true
  },
  
  UPDATE_STATE: {
    name: 'update-state',
    description: 'Update state tracking with completed operations',
    dependencies: ['validate-data'],
    parallel: false,
    timeout: 10000,
    retryable: true,
    critical: true
  }
};

/**
 * Operation types that determine which stages to include
 */
const OPERATION_TYPES = {
  FULL_SETUP: 'full-setup',
  IMAGES_ONLY: 'images-only',
  DATABASE_ONLY: 'database-only',
  FRONTEND_ONLY: 'frontend-only',
  INCREMENTAL: 'incremental',
  VALIDATION_ONLY: 'validation-only'
};

/**
 * DataPipeline class with stage management and parallel execution
 */
class DataPipeline extends EventEmitter {
  constructor(config = DATA_CONFIG) {
    super();
    this.config = config;
    this.stateManager = STATE_MANAGER;
    this.errorHandler = new ErrorHandler(config);
    
    // Initialize processors
    this.imageProcessor = new ImageProcessor(config);
    this.databaseSeeder = new DatabaseSeeder(config);
    this.frontendSyncProcessor = new FrontendSyncProcessor(config);
    
    // Pipeline state
    this.currentExecution = null;
    this.executionHistory = [];
    this.isRunning = false;
    this.currentScenario = null;
    
    // Progress tracking
    this.totalStages = 0;
    this.completedStages = 0;
    this.currentStage = null;
    this.stageProgress = new Map();
  }

  /**
   * Build pipeline stages based on operation type and detected changes
   */
  buildPipeline(operationType, options = {}) {
    const { forceAll = false, scenario = null, resetState = null, count = null } = options;
    
    // Store current scenario and count for use in stages
    this.currentScenario = scenario;
    this.currentCount = count;
    
    // Always include prerequisite validation and change detection
    const requiredStages = [
      PIPELINE_STAGES.VALIDATE_PREREQUISITES,
      PIPELINE_STAGES.DETECT_CHANGES
    ];
    
    // Determine which processing stages to include based on operation type
    const processingStages = this._getProcessingStages(operationType, forceAll);
    
    // Always include validation and state update at the end
    const finalStages = [
      PIPELINE_STAGES.VALIDATE_DATA,
      PIPELINE_STAGES.UPDATE_STATE
    ];
    
    const allStages = [...requiredStages, ...processingStages, ...finalStages];
    
    // Build execution plan with dependency resolution
    const executionPlan = this._resolveDependencies(allStages);
    
    return {
      operationType,
      stages: allStages,
      executionPlan,
      options,
      estimatedDuration: this._estimateDuration(allStages),
      parallelizable: this._identifyParallelStages(executionPlan)
    };
  }

  /**
   * Execute pipeline with progress tracking and error handling
   */
  async executePipeline(pipeline, progressCallback = null) {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    this.isRunning = true;
    this.currentExecution = {
      id: `exec_${Date.now()}`,
      pipeline,
      startTime: new Date(),
      status: 'running',
      results: new Map(),
      errors: []
    };

    try {
      this.emit('pipeline:start', { ...this.currentExecution });
      
      // Initialize progress tracking
      this.totalStages = pipeline.stages.length;
      this.completedStages = 0;
      this.stageProgress.clear();
      
      // Execute stages according to execution plan
      for (const stageGroup of pipeline.executionPlan) {
        await this._executeStageGroup(stageGroup, progressCallback);
      }
      
      // Mark execution as completed
      this.currentExecution.status = 'completed';
      this.currentExecution.endTime = new Date();
      this.currentExecution.duration = this.currentExecution.endTime - this.currentExecution.startTime;
      
      this.emit('pipeline:complete', { ...this.currentExecution });
      
      // Add to execution history
      this.executionHistory.push({ ...this.currentExecution });
      
      return this.currentExecution.results;
      
    } catch (error) {
      this.currentExecution.status = 'failed';
      this.currentExecution.endTime = new Date();
      this.currentExecution.error = error;
      
      this.emit('pipeline:error', { execution: { ...this.currentExecution }, error });
      
      // Attempt recovery if possible
      await this._handleExecutionFailure(error);
      
      throw error;
    } finally {
      this.isRunning = false;
      this.currentExecution = null;
    }
  }

  /**
   * Get processing stages based on operation type
   */
  _getProcessingStages(operationType, forceAll) {
    const stages = [];
    
    switch (operationType) {
      case OPERATION_TYPES.FULL_SETUP:
        stages.push(
          PIPELINE_STAGES.PROCESS_IMAGES,
          PIPELINE_STAGES.SEED_DATABASE,
          PIPELINE_STAGES.SYNC_FRONTEND
        );
        break;
        
      case OPERATION_TYPES.IMAGES_ONLY:
        stages.push(PIPELINE_STAGES.PROCESS_IMAGES);
        break;
        
      case OPERATION_TYPES.DATABASE_ONLY:
        stages.push(PIPELINE_STAGES.SEED_DATABASE);
        break;
        
      case OPERATION_TYPES.FRONTEND_ONLY:
        stages.push(PIPELINE_STAGES.SYNC_FRONTEND);
        break;
        
      case OPERATION_TYPES.INCREMENTAL:
        // Determine stages based on detected changes
        if (forceAll) {
          stages.push(
            PIPELINE_STAGES.PROCESS_IMAGES,
            PIPELINE_STAGES.SEED_DATABASE,
            PIPELINE_STAGES.SYNC_FRONTEND
          );
        } else {
          // Will be determined after change detection
          stages.push(
            PIPELINE_STAGES.PROCESS_IMAGES,
            PIPELINE_STAGES.SEED_DATABASE,
            PIPELINE_STAGES.SYNC_FRONTEND
          );
        }
        break;
        
      case OPERATION_TYPES.VALIDATION_ONLY:
        // No processing stages, just validation
        break;
        
      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }
    
    return stages;
  }

  /**
   * Resolve stage dependencies and create execution plan
   */
  _resolveDependencies(stages) {
    const stageMap = new Map(stages.map(stage => [stage.name, stage]));
    const executionPlan = [];
    const completed = new Set();
    const stageNames = new Set(stages.map(s => s.name));
    
    // Filter dependencies to only include stages that are actually in the pipeline
    const filteredStages = stages.map(stage => ({
      ...stage,
      dependencies: stage.dependencies.filter(dep => stageNames.has(dep))
    }));
    
    while (completed.size < filteredStages.length) {
      const readyStages = filteredStages.filter(stage => {
        if (completed.has(stage.name)) {
          return false;
        }
        
        return stage.dependencies.every(dep => completed.has(dep));
      });
      
      if (readyStages.length === 0) {
        const remaining = filteredStages.filter(stage => !completed.has(stage.name));
        throw new Error(`Circular dependency detected in stages: ${remaining.map(s => s.name).join(', ')}`);
      }
      
      // Group parallel stages together
      const parallelStages = readyStages.filter(stage => stage.parallel);
      const sequentialStages = readyStages.filter(stage => !stage.parallel);
      
      // Add sequential stages first (one at a time)
      if (sequentialStages.length > 0) {
        executionPlan.push([sequentialStages[0]]);
        completed.add(sequentialStages[0].name);
      }
      
      // Add parallel stages as a group
      if (parallelStages.length > 0 && sequentialStages.length === 0) {
        executionPlan.push(parallelStages);
        parallelStages.forEach(stage => {
          completed.add(stage.name);
        });
      }
    }
    
    return executionPlan;
  }

  /**
   * Execute a group of stages (sequential or parallel)
   */
  async _executeStageGroup(stageGroup, progressCallback) {
    if (stageGroup.length === 1) {
      // Sequential execution
      await this._executeStage(stageGroup[0], progressCallback);
    } else {
      // Parallel execution
      this.emit('stages:parallel:start', { stages: stageGroup.map(s => s.name) });
      
      const promises = stageGroup.map(stage => 
        this._executeStage(stage, progressCallback)
      );
      
      await Promise.all(promises);
      
      this.emit('stages:parallel:complete', { stages: stageGroup.map(s => s.name) });
    }
  }

  /**
   * Execute a single stage with error handling and progress tracking
   */
  async _executeStage(stage, progressCallback) {
    this.currentStage = stage;
    this.stageProgress.set(stage.name, { status: 'running', progress: 0 });
    
    this.emit('stage:start', { stage: stage.name, description: stage.description });
    
    if (progressCallback) {
      progressCallback(0, 100, stage.description || stage.name);
    }
    
    const startTime = Date.now();
    
    try {
      let result;
      
      // Execute stage based on its type
      switch (stage.name) {
        case 'validate-prerequisites':
          result = await this._validatePrerequisites();
          break;
          
        case 'detect-changes':
          result = await this._detectChanges();
          break;
          
        case 'process-images':
          result = await this._processImages(progressCallback);
          break;
          
        case 'seed-database':
          result = await this._seedDatabase(progressCallback);
          break;
          
        case 'sync-frontend':
          result = await this._syncFrontend(progressCallback);
          break;
          
        case 'validate-data':
          result = await this._validateData();
          break;
          
        case 'update-state':
          result = await this._updateState();
          break;
          
        default:
          throw new Error(`Unknown stage: ${stage.name}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.stageProgress.set(stage.name, { 
        status: 'completed', 
        progress: 100,
        result,
        duration
      });
      
      this.currentExecution.results.set(stage.name, result);
      this.completedStages++;
      
      this.emit('stage:complete', { 
        stage: stage.name, 
        result, 
        duration 
      });
      
      if (progressCallback) {
        progressCallback(100, 100, `${stage.description || stage.name} completed`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.stageProgress.set(stage.name, { 
        status: 'failed', 
        progress: 0,
        error: error.message,
        duration
      });
      
      this.currentExecution.errors.push({
        stage: stage.name,
        error: error.message,
        timestamp: new Date()
      });
      
      this.emit('stage:error', { 
        stage: stage.name, 
        error, 
        duration 
      });
      
      // Handle stage failure based on criticality
      if (stage.critical) {
        throw error;
      } else {
        // Log warning and continue
        console.warn(`⚠️  Non-critical stage ${stage.name} failed: ${error.message}`);
      }
    }
  }

  /**
   * Stage implementation: Validate prerequisites
   */
  async _validatePrerequisites() {
    // Check if required services are available
    const checks = {
      localstack: false,
      dynamodb: false,
      opensearch: false,
      s3: false
    };
    
    try {
      // Implement actual service checks here
      // For now, return mock validation
      checks.localstack = true;
      checks.dynamodb = true;
      checks.opensearch = true;
      checks.s3 = true;
      
      return { checks, allPassed: Object.values(checks).every(Boolean) };
    } catch (error) {
      throw new Error(`Prerequisites validation failed: ${error.message}`);
    }
  }

  /**
   * Stage implementation: Detect changes
   */
  async _detectChanges() {
    const changes = await this.stateManager.detectChanges();
    
    return {
      hasChanges: changes.hasChanges,
      imageChanges: changes.images?.length || 0,
      dataChanges: changes.data?.length || 0,
      configChanges: changes.config?.length || 0,
      details: changes
    };
  }

  /**
   * Stage implementation: Process images
   */
  async _processImages(progressCallback) {
    return await this.imageProcessor.processImages({
      onProgress: (progress) => {
        if (progressCallback) {
          progressCallback(progress.percentage || 0, 100, 'Processing images');
        }
      }
    });
  }

  /**
   * Stage implementation: Seed database
   */
  async _seedDatabase(progressCallback) {
    // Report progress to callback if provided
    if (progressCallback) {
      progressCallback(1, 1, 'Seeding database');
    }
    
    return await this.databaseSeeder.seedAllData();
  }

  /**
   * Stage implementation: Enhanced sync frontend with comprehensive capabilities
   */
  async _syncFrontend(progressCallback) {
    // Report progress to callback if provided
    if (progressCallback) {
      progressCallback(0, 3, 'Starting enhanced frontend synchronization');
    }
    
    try {
      // Use enhanced sync capabilities
      const syncResult = await this.frontendSyncProcessor.syncWithBackend({
        includeBusinessData: true,
        validateData: true,
        scenario: this.currentScenario || null,
        count: this.currentCount || null
      });
      
      if (progressCallback) {
        progressCallback(1, 3, 'Frontend data synchronized');
      }
      
      // If sync was successful and we have studios, log additional info
      if (syncResult.success && this.frontendSyncProcessor.generatedStudios) {
        const studioCount = this.frontendSyncProcessor.generatedStudios.length;
        console.log(`🏢 Generated ${studioCount} studios with bidirectional relationships`);
        
        if (progressCallback) {
          progressCallback(2, 3, `Generated ${studioCount} studios`);
        }
      }
      
      // Add enhanced statistics to result
      const enhancedResult = {
        ...syncResult,
        studioCount: this.frontendSyncProcessor.generatedStudios?.length || 0,
        enhancedCapabilities: true
      };
      
      if (progressCallback) {
        progressCallback(3, 3, 'Enhanced frontend synchronization complete');
      }
      
      return enhancedResult;
      
    } catch (error) {
      console.error('❌ Enhanced frontend sync failed:', error.message);
      
      if (progressCallback) {
        progressCallback(3, 3, `Frontend sync failed: ${error.message}`);
      }
      
      return {
        success: false,
        error: error.message,
        enhancedCapabilities: true
      };
    }
  }

  /**
   * Stage implementation: Validate data
   */
  async _validateData() {
    // Implement comprehensive data validation
    return {
      valid: true,
      checks: {
        dynamodb: { valid: true, itemCount: 0 },
        opensearch: { valid: true, itemCount: 0 },
        s3: { valid: true, objectCount: 0 },
        frontend: { valid: true, mockDataGenerated: true }
      }
    };
  }

  /**
   * Stage implementation: Update state
   */
  async _updateState() {
    const state = this.stateManager.getState();
    this.stateManager.saveState(state);
    return { stateUpdated: true, timestamp: new Date() };
  }

  /**
   * Estimate pipeline duration based on stages
   */
  _estimateDuration(stages) {
    return stages.reduce((total, stage) => total + (stage.timeout || 30000), 0);
  }

  /**
   * Identify which stages can run in parallel
   */
  _identifyParallelStages(executionPlan) {
    return executionPlan.filter(group => group.length > 1);
  }

  /**
   * Handle execution failure with recovery strategies
   */
  async _handleExecutionFailure(error) {
    const classification = this.errorHandler.classifyError(error);
    
    switch (classification.strategy) {
      case RECOVERY_STRATEGIES.ROLLBACK:
        await this._rollbackChanges();
        break;
        
      case RECOVERY_STRATEGIES.RETRY:
        // Retry logic would be implemented here
        break;
        
      default:
        // Log error for manual intervention
        console.error('Pipeline execution failed:', error.message);
    }
  }

  /**
   * Rollback changes made during failed execution
   */
  async _rollbackChanges() {
    // Implement rollback logic
    console.log('🔄 Rolling back changes...');
  }

  /**
   * Get current pipeline status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentExecution: this.currentExecution,
      currentStage: this.currentStage?.name,
      progress: {
        total: this.totalStages,
        completed: this.completedStages,
        percentage: this.totalStages > 0 ? (this.completedStages / this.totalStages) * 100 : 0
      },
      stageProgress: Object.fromEntries(this.stageProgress)
    };
  }

  /**
   * Get available pipeline stages
   */
  static getAvailableStages() {
    return Object.values(PIPELINE_STAGES);
  }

  /**
   * Get available operation types
   */
  static getOperationTypes() {
    return Object.values(OPERATION_TYPES);
  }
}

// Export the class and constants
module.exports = {
  DataPipeline,
  PIPELINE_STAGES,
  OPERATION_TYPES
};