/**
 * Unit Tests for DataPipeline Class
 * 
 * Tests pipeline stage construction, execution flow, dependency management,
 * parallel execution, progress tracking, and error handling mechanisms.
 */

const { DataPipeline, PIPELINE_STAGES, OPERATION_TYPES } = require('../pipeline-engine');
const { DATA_CONFIG } = require('../data-config');

// Mock dependencies
jest.mock('../state-manager');
jest.mock('../image-processor');
jest.mock('../database-seeder');
jest.mock('../frontend-sync-processor');
jest.mock('../error-handler');

const { STATE_MANAGER } = require('../state-manager');
const { ImageProcessor } = require('../image-processor');
const { DatabaseSeeder } = require('../database-seeder');
const { FrontendSyncProcessor } = require('../frontend-sync-processor');
const { ErrorHandler } = require('../error-handler');

describe('DataPipeline', () => {
  let pipeline;
  let mockStateManager;
  let mockImageProcessor;
  let mockDatabaseSeeder;
  let mockFrontendSyncProcessor;
  let mockErrorHandler;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock StateManager
    mockStateManager = {
      detectChanges: jest.fn(),
      saveCurrentState: jest.fn()
    };
    STATE_MANAGER.detectChanges = mockStateManager.detectChanges;
    STATE_MANAGER.saveCurrentState = mockStateManager.saveCurrentState;
    
    // Mock ImageProcessor
    mockImageProcessor = {
      processImages: jest.fn()
    };
    ImageProcessor.mockImplementation(() => mockImageProcessor);
    
    // Mock DatabaseSeeder
    mockDatabaseSeeder = {
      seedAll: jest.fn()
    };
    DatabaseSeeder.mockImplementation(() => mockDatabaseSeeder);
    
    // Mock FrontendSyncProcessor
    mockFrontendSyncProcessor = {
      syncMockData: jest.fn()
    };
    FrontendSyncProcessor.mockImplementation(() => mockFrontendSyncProcessor);
    
    // Mock ErrorHandler
    mockErrorHandler = {
      determineRecoveryStrategy: jest.fn()
    };
    ErrorHandler.mockImplementation(() => mockErrorHandler);
    
    // Create pipeline instance
    pipeline = new DataPipeline(DATA_CONFIG);
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(pipeline.config).toBe(DATA_CONFIG);
      expect(pipeline.isRunning).toBe(false);
      expect(pipeline.currentExecution).toBeNull();
      expect(pipeline.executionHistory).toEqual([]);
    });

    test('should initialize all processors', () => {
      expect(ImageProcessor).toHaveBeenCalledWith(DATA_CONFIG);
      expect(DatabaseSeeder).toHaveBeenCalledWith(DATA_CONFIG);
      expect(FrontendSyncProcessor).toHaveBeenCalledWith(DATA_CONFIG);
      expect(ErrorHandler).toHaveBeenCalledWith(DATA_CONFIG);
    });

    test('should extend EventEmitter', () => {
      expect(pipeline.on).toBeDefined();
      expect(pipeline.emit).toBeDefined();
      expect(pipeline.removeListener).toBeDefined();
    });
  });

  describe('buildPipeline', () => {
    test('should build full setup pipeline', () => {
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.FULL_SETUP);
      
      expect(pipeline_result.operationType).toBe(OPERATION_TYPES.FULL_SETUP);
      expect(pipeline_result.stages).toHaveLength(7); // All stages
      expect(pipeline_result.executionPlan).toBeDefined();
      expect(pipeline_result.estimatedDuration).toBeGreaterThan(0);
    });

    test('should build images-only pipeline', () => {
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.IMAGES_ONLY);
      
      expect(pipeline_result.operationType).toBe(OPERATION_TYPES.IMAGES_ONLY);
      
      // Should include prerequisites, change detection, image processing, validation, and state update
      const stageNames = pipeline_result.stages.map(s => s.name);
      expect(stageNames).toContain('validate-prerequisites');
      expect(stageNames).toContain('detect-changes');
      expect(stageNames).toContain('process-images');
      expect(stageNames).toContain('validate-data');
      expect(stageNames).toContain('update-state');
      expect(stageNames).not.toContain('seed-database');
      expect(stageNames).not.toContain('sync-frontend');
    });

    test('should build database-only pipeline', () => {
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.DATABASE_ONLY);
      
      const stageNames = pipeline_result.stages.map(s => s.name);
      expect(stageNames).toContain('seed-database');
      expect(stageNames).not.toContain('process-images');
      expect(stageNames).not.toContain('sync-frontend');
    });

    test('should build frontend-only pipeline', () => {
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.FRONTEND_ONLY);
      
      const stageNames = pipeline_result.stages.map(s => s.name);
      expect(stageNames).toContain('sync-frontend');
      expect(stageNames).not.toContain('process-images');
      expect(stageNames).not.toContain('seed-database');
    });

    test('should build validation-only pipeline', () => {
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.VALIDATION_ONLY);
      
      const stageNames = pipeline_result.stages.map(s => s.name);
      expect(stageNames).toContain('validate-prerequisites');
      expect(stageNames).toContain('detect-changes');
      expect(stageNames).toContain('validate-data');
      expect(stageNames).toContain('update-state');
      expect(stageNames).not.toContain('process-images');
      expect(stageNames).not.toContain('seed-database');
      expect(stageNames).not.toContain('sync-frontend');
    });

    test('should throw error for unknown operation type', () => {
      expect(() => {
        pipeline.buildPipeline('unknown-operation');
      }).toThrow('Unknown operation type: unknown-operation');
    });

    test('should include options in pipeline result', () => {
      const options = { forceAll: true, scenario: 'test' };
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.FULL_SETUP, options);
      
      expect(pipeline_result.options).toEqual(options);
    });
  });

  describe('Dependency Resolution', () => {
    test('should resolve dependencies correctly', () => {
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.FULL_SETUP);
      const executionPlan = pipeline_result.executionPlan;
      
      // First group should contain validate-prerequisites (no dependencies)
      expect(executionPlan[0]).toHaveLength(1);
      expect(executionPlan[0][0].name).toBe('validate-prerequisites');
      
      // Second group should contain detect-changes (depends on prerequisites)
      expect(executionPlan[1]).toHaveLength(1);
      expect(executionPlan[1][0].name).toBe('detect-changes');
      
      // Processing stages should come after change detection
      const processingGroupIndex = executionPlan.findIndex(group => 
        group.some(stage => ['process-images', 'seed-database', 'sync-frontend'].includes(stage.name))
      );
      expect(processingGroupIndex).toBeGreaterThan(1);
    });

    test('should group parallel stages together', () => {
      const pipeline_result = pipeline.buildPipeline(OPERATION_TYPES.FULL_SETUP);
      const executionPlan = pipeline_result.executionPlan;
      
      // Find the parallel processing group
      const parallelGroup = executionPlan.find(group => group.length > 1);
      expect(parallelGroup).toBeDefined();
      
      const parallelStageNames = parallelGroup.map(s => s.name);
      expect(parallelStageNames).toContain('process-images');
      expect(parallelStageNames).toContain('seed-database');
      expect(parallelStageNames).toContain('sync-frontend');
    });

    test('should detect circular dependencies', () => {
      // Create stages with circular dependencies
      const circularStages = [
        { name: 'stage-a', dependencies: ['stage-b'], parallel: false },
        { name: 'stage-b', dependencies: ['stage-a'], parallel: false }
      ];
      
      expect(() => {
        pipeline._resolveDependencies(circularStages);
      }).toThrow('Circular dependency detected');
    });
  });

  describe('executePipeline', () => {
    let mockPipeline;
    
    beforeEach(() => {
      mockPipeline = {
        operationType: OPERATION_TYPES.FULL_SETUP,
        stages: [
          PIPELINE_STAGES.VALIDATE_PREREQUISITES,
          PIPELINE_STAGES.DETECT_CHANGES,
          PIPELINE_STAGES.UPDATE_STATE
        ],
        executionPlan: [
          [PIPELINE_STAGES.VALIDATE_PREREQUISITES],
          [PIPELINE_STAGES.DETECT_CHANGES],
          [PIPELINE_STAGES.UPDATE_STATE]
        ]
      };
      
      // Mock stage implementations
      pipeline._validatePrerequisites = jest.fn().mockResolvedValue({ allPassed: true });
      pipeline._detectChanges = jest.fn().mockResolvedValue({ hasChanges: false });
      pipeline._updateState = jest.fn().mockResolvedValue({ stateUpdated: true });
    });

    test('should execute pipeline successfully', async () => {
      const results = await pipeline.executePipeline(mockPipeline);
      
      expect(pipeline._validatePrerequisites).toHaveBeenCalled();
      expect(pipeline._detectChanges).toHaveBeenCalled();
      expect(pipeline._updateState).toHaveBeenCalled();
      
      expect(results.size).toBe(3);
      expect(results.get('validate-prerequisites')).toEqual({ allPassed: true });
      expect(results.get('detect-changes')).toEqual({ hasChanges: false });
      expect(results.get('update-state')).toEqual({ stateUpdated: true });
    });

    test('should emit pipeline events', async () => {
      let startEventData = null;
      let completeEventData = null;
      const stageStartSpy = jest.fn();
      const stageCompleteSpy = jest.fn();
      
      pipeline.on('pipeline:start', (data) => {
        startEventData = data;
      });
      pipeline.on('pipeline:complete', (data) => {
        completeEventData = data;
      });
      pipeline.on('stage:start', stageStartSpy);
      pipeline.on('stage:complete', stageCompleteSpy);
      
      await pipeline.executePipeline(mockPipeline);
      
      expect(startEventData).toMatchObject({
        status: 'running'
      });
      
      expect(completeEventData).toMatchObject({
        status: 'completed'
      });
      
      expect(stageStartSpy).toHaveBeenCalledTimes(3);
      expect(stageCompleteSpy).toHaveBeenCalledTimes(3);
    });

    test('should track progress correctly', async () => {
      const progressCallback = jest.fn();
      
      await pipeline.executePipeline(mockPipeline, progressCallback);
      
      expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
        total: 3,
        completed: expect.any(Number)
      }));
    });

    test('should prevent concurrent executions', async () => {
      const promise1 = pipeline.executePipeline(mockPipeline);
      
      await expect(pipeline.executePipeline(mockPipeline)).rejects.toThrow('Pipeline is already running');
      
      await promise1; // Clean up
    });

    test('should handle stage failures for critical stages', async () => {
      const error = new Error('Critical stage failed');
      pipeline._validatePrerequisites = jest.fn().mockRejectedValue(error);
      
      await expect(pipeline.executePipeline(mockPipeline)).rejects.toThrow('Critical stage failed');
      
      expect(pipeline.isRunning).toBe(false);
      expect(pipeline.currentExecution).toBeNull();
    });

    test('should continue execution for non-critical stage failures', async () => {
      // Mock a non-critical stage failure
      const nonCriticalPipeline = {
        ...mockPipeline,
        stages: [
          { ...PIPELINE_STAGES.VALIDATE_PREREQUISITES },
          { ...PIPELINE_STAGES.PROCESS_IMAGES, critical: false },
          { ...PIPELINE_STAGES.UPDATE_STATE }
        ],
        executionPlan: [
          [PIPELINE_STAGES.VALIDATE_PREREQUISITES],
          [{ ...PIPELINE_STAGES.PROCESS_IMAGES, critical: false }],
          [PIPELINE_STAGES.UPDATE_STATE]
        ]
      };
      
      pipeline._processImages = jest.fn().mockRejectedValue(new Error('Non-critical failure'));
      
      const results = await pipeline.executePipeline(nonCriticalPipeline);
      
      expect(pipeline._validatePrerequisites).toHaveBeenCalled();
      expect(pipeline._processImages).toHaveBeenCalled();
      expect(pipeline._updateState).toHaveBeenCalled();
      
      // Should complete despite non-critical failure
      expect(results.size).toBe(2); // Only successful stages
    });

    test('should add execution to history', async () => {
      await pipeline.executePipeline(mockPipeline);
      
      expect(pipeline.executionHistory).toHaveLength(1);
      expect(pipeline.executionHistory[0]).toMatchObject({
        pipeline: mockPipeline,
        status: 'completed'
      });
    });
  });

  describe('Stage Implementations', () => {
    test('_validatePrerequisites should check service availability', async () => {
      const result = await pipeline._validatePrerequisites();
      
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('allPassed');
      expect(result.checks).toHaveProperty('localstack');
      expect(result.checks).toHaveProperty('dynamodb');
      expect(result.checks).toHaveProperty('opensearch');
      expect(result.checks).toHaveProperty('s3');
    });

    test('_detectChanges should use state manager', async () => {
      const mockChanges = {
        hasChanges: true,
        images: ['image1.jpg'],
        data: ['data.json'],
        config: []
      };
      
      mockStateManager.detectChanges.mockResolvedValue(mockChanges);
      
      const result = await pipeline._detectChanges();
      
      expect(mockStateManager.detectChanges).toHaveBeenCalled();
      expect(result).toMatchObject({
        hasChanges: true,
        imageChanges: 1,
        dataChanges: 1,
        configChanges: 0,
        details: mockChanges
      });
    });

    test('_processImages should use image processor with progress callback', async () => {
      const mockResult = { processed: 5, uploaded: 5 };
      mockImageProcessor.processImages.mockResolvedValue(mockResult);
      
      const progressCallback = jest.fn();
      const result = await pipeline._processImages(progressCallback);
      
      expect(mockImageProcessor.processImages).toHaveBeenCalledWith({
        onProgress: expect.any(Function)
      });
      expect(result).toBe(mockResult);
    });

    test('_seedDatabase should use database seeder with progress callback', async () => {
      const mockResult = { seeded: 100 };
      mockDatabaseSeeder.seedAll.mockResolvedValue(mockResult);
      
      const progressCallback = jest.fn();
      const result = await pipeline._seedDatabase(progressCallback);
      
      expect(mockDatabaseSeeder.seedAll).toHaveBeenCalledWith({
        onProgress: expect.any(Function)
      });
      expect(result).toBe(mockResult);
    });

    test('_syncFrontend should use frontend sync processor with progress callback', async () => {
      const mockResult = { synced: true };
      mockFrontendSyncProcessor.syncMockData.mockResolvedValue(mockResult);
      
      const progressCallback = jest.fn();
      const result = await pipeline._syncFrontend(progressCallback);
      
      expect(mockFrontendSyncProcessor.syncMockData).toHaveBeenCalledWith({
        onProgress: expect.any(Function)
      });
      expect(result).toBe(mockResult);
    });

    test('_validateData should return validation results', async () => {
      const result = await pipeline._validateData();
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('dynamodb');
      expect(result.checks).toHaveProperty('opensearch');
      expect(result.checks).toHaveProperty('s3');
      expect(result.checks).toHaveProperty('frontend');
    });

    test('_updateState should save current state', async () => {
      mockStateManager.saveCurrentState.mockResolvedValue();
      
      const result = await pipeline._updateState();
      
      expect(mockStateManager.saveCurrentState).toHaveBeenCalled();
      expect(result).toMatchObject({
        stateUpdated: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Progress Tracking', () => {
    test('should track stage progress correctly', async () => {
      const mockPipeline = {
        stages: [PIPELINE_STAGES.VALIDATE_PREREQUISITES],
        executionPlan: [[PIPELINE_STAGES.VALIDATE_PREREQUISITES]]
      };
      
      pipeline._validatePrerequisites = jest.fn().mockResolvedValue({ allPassed: true });
      
      await pipeline.executePipeline(mockPipeline);
      
      const status = pipeline.getStatus();
      expect(status.progress.total).toBe(1);
      expect(status.progress.completed).toBe(1);
      expect(status.progress.percentage).toBe(100);
    });

    test('should track individual stage progress', async () => {
      const mockPipeline = {
        stages: [PIPELINE_STAGES.VALIDATE_PREREQUISITES],
        executionPlan: [[PIPELINE_STAGES.VALIDATE_PREREQUISITES]]
      };
      
      pipeline._validatePrerequisites = jest.fn().mockResolvedValue({ allPassed: true });
      
      await pipeline.executePipeline(mockPipeline);
      
      const status = pipeline.getStatus();
      expect(status.stageProgress['validate-prerequisites']).toMatchObject({
        status: 'completed',
        progress: 100
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle execution failure with recovery', async () => {
      const mockPipeline = {
        stages: [PIPELINE_STAGES.VALIDATE_PREREQUISITES],
        executionPlan: [[PIPELINE_STAGES.VALIDATE_PREREQUISITES]]
      };
      
      const error = new Error('Execution failed');
      pipeline._validatePrerequisites = jest.fn().mockRejectedValue(error);
      pipeline._handleExecutionFailure = jest.fn().mockResolvedValue();
      
      await expect(pipeline.executePipeline(mockPipeline)).rejects.toThrow('Execution failed');
      
      expect(pipeline._handleExecutionFailure).toHaveBeenCalledWith(error);
    });

    test('should emit error events', async () => {
      const mockPipeline = {
        stages: [PIPELINE_STAGES.VALIDATE_PREREQUISITES],
        executionPlan: [[PIPELINE_STAGES.VALIDATE_PREREQUISITES]]
      };
      
      const error = new Error('Test error');
      pipeline._validatePrerequisites = jest.fn().mockRejectedValue(error);
      
      const errorSpy = jest.fn();
      pipeline.on('pipeline:error', errorSpy);
      
      await expect(pipeline.executePipeline(mockPipeline)).rejects.toThrow();
      
      expect(errorSpy).toHaveBeenCalledWith({
        execution: expect.objectContaining({ status: 'failed' }),
        error
      });
    });
  });

  describe('Parallel Execution', () => {
    test('should execute parallel stages concurrently', async () => {
      const parallelPipeline = {
        stages: [
          PIPELINE_STAGES.PROCESS_IMAGES,
          PIPELINE_STAGES.SEED_DATABASE,
          PIPELINE_STAGES.SYNC_FRONTEND
        ],
        executionPlan: [[
          PIPELINE_STAGES.PROCESS_IMAGES,
          PIPELINE_STAGES.SEED_DATABASE,
          PIPELINE_STAGES.SYNC_FRONTEND
        ]]
      };
      
      const startTimes = [];
      
      pipeline._processImages = jest.fn().mockImplementation(async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
        return { processed: 5 };
      });
      
      pipeline._seedDatabase = jest.fn().mockImplementation(async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
        return { seeded: 100 };
      });
      
      pipeline._syncFrontend = jest.fn().mockImplementation(async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
        return { synced: true };
      });
      
      await pipeline.executePipeline(parallelPipeline);
      
      // All stages should start around the same time (within 5ms)
      const maxTimeDiff = Math.max(...startTimes) - Math.min(...startTimes);
      expect(maxTimeDiff).toBeLessThan(5);
      
      expect(pipeline._processImages).toHaveBeenCalled();
      expect(pipeline._seedDatabase).toHaveBeenCalled();
      expect(pipeline._syncFrontend).toHaveBeenCalled();
    });

    test('should emit parallel execution events', async () => {
      const parallelPipeline = {
        stages: [PIPELINE_STAGES.PROCESS_IMAGES, PIPELINE_STAGES.SEED_DATABASE],
        executionPlan: [[PIPELINE_STAGES.PROCESS_IMAGES, PIPELINE_STAGES.SEED_DATABASE]]
      };
      
      pipeline._processImages = jest.fn().mockResolvedValue({ processed: 5 });
      pipeline._seedDatabase = jest.fn().mockResolvedValue({ seeded: 100 });
      
      const parallelStartSpy = jest.fn();
      const parallelCompleteSpy = jest.fn();
      
      pipeline.on('stages:parallel:start', parallelStartSpy);
      pipeline.on('stages:parallel:complete', parallelCompleteSpy);
      
      await pipeline.executePipeline(parallelPipeline);
      
      expect(parallelStartSpy).toHaveBeenCalledWith({
        stages: ['process-images', 'seed-database']
      });
      
      expect(parallelCompleteSpy).toHaveBeenCalledWith({
        stages: ['process-images', 'seed-database']
      });
    });
  });

  describe('Static Methods', () => {
    test('should get available pipeline stages', () => {
      const stages = DataPipeline.getAvailableStages();
      
      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThan(0);
      
      stages.forEach(stage => {
        expect(stage).toHaveProperty('name');
        expect(stage).toHaveProperty('description');
        expect(stage).toHaveProperty('dependencies');
      });
    });

    test('should include all defined stages', () => {
      const stages = DataPipeline.getAvailableStages();
      const stageNames = stages.map(s => s.name);
      
      expect(stageNames).toContain('validate-prerequisites');
      expect(stageNames).toContain('detect-changes');
      expect(stageNames).toContain('process-images');
      expect(stageNames).toContain('seed-database');
      expect(stageNames).toContain('sync-frontend');
      expect(stageNames).toContain('validate-data');
      expect(stageNames).toContain('update-state');
    });

    test('should get available operation types', () => {
      const operationTypes = DataPipeline.getOperationTypes();
      
      expect(Array.isArray(operationTypes)).toBe(true);
      expect(operationTypes).toContain('full-setup');
      expect(operationTypes).toContain('images-only');
      expect(operationTypes).toContain('database-only');
      expect(operationTypes).toContain('frontend-only');
      expect(operationTypes).toContain('incremental');
      expect(operationTypes).toContain('validation-only');
    });
  });

  describe('getStatus', () => {
    test('should return current pipeline status', () => {
      const status = pipeline.getStatus();
      
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('currentExecution');
      expect(status).toHaveProperty('currentStage');
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('stageProgress');
      
      expect(status.progress).toHaveProperty('total');
      expect(status.progress).toHaveProperty('completed');
      expect(status.progress).toHaveProperty('percentage');
    });

    test('should show running status during execution', async () => {
      const mockPipeline = {
        stages: [PIPELINE_STAGES.VALIDATE_PREREQUISITES],
        executionPlan: [[PIPELINE_STAGES.VALIDATE_PREREQUISITES]]
      };
      
      let statusDuringExecution;
      
      pipeline._validatePrerequisites = jest.fn().mockImplementation(async () => {
        statusDuringExecution = pipeline.getStatus();
        return { allPassed: true };
      });
      
      await pipeline.executePipeline(mockPipeline);
      
      expect(statusDuringExecution.isRunning).toBe(true);
      expect(statusDuringExecution.currentStage).toBe('validate-prerequisites');
    });
  });

  describe('Duration Estimation', () => {
    test('should estimate pipeline duration', () => {
      const stages = [
        { timeout: 10000 },
        { timeout: 20000 },
        { timeout: 30000 }
      ];
      
      const duration = pipeline._estimateDuration(stages);
      expect(duration).toBe(60000);
    });

    test('should use default timeout for stages without timeout', () => {
      const stages = [
        { timeout: 10000 },
        {}, // No timeout specified
        { timeout: 20000 }
      ];
      
      const duration = pipeline._estimateDuration(stages);
      expect(duration).toBe(60000); // 10000 + 30000 (default) + 20000
    });
  });
});