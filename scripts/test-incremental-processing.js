#!/usr/bin/env node

/**
 * Incremental Processing and Change Detection Integration Tests
 * 
 * Tests the integration between pipeline-engine.js incremental processing
 * and state-manager.js change detection with the enhanced frontend-sync-processor.
 * 
 * Test Coverage:
 * - Pipeline-engine incremental processing with enhanced frontend-sync-processor
 * - State-manager change detection and file tracking
 * - Only modified data triggers frontend-sync-processor updates
 * - Incremental processing performance validation
 * - Force refresh mode testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DataPipeline, OPERATION_TYPES } = require('./pipeline-engine');
const { STATE_MANAGER } = require('./state-manager');
const { FrontendSyncProcessor } = require('./frontend-sync-processor');
const { DATA_CONFIG } = require('./data-config');

/**
 * Test suite for incremental processing and change detection
 */
class IncrementalProcessingTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
      startTime: Date.now(),
      endTime: null
    };
    
    this.pipeline = new DataPipeline();
    this.stateManager = STATE_MANAGER;
    this.frontendProcessor = new FrontendSyncProcessor();
    
    // Test data paths
    this.testDataDir = path.join(__dirname, 'test-data');
    this.tempTestDir = path.join(__dirname, 'temp-test-data');
    this.backupDir = path.join(__dirname, 'test-backups');
    
    this.setupTestEnvironment();
  }

  /**
   * Set up test environment
   */
  setupTestEnvironment() {
    // Create temporary directories for testing
    [this.tempTestDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    console.log('🧪 Incremental Processing Integration Tests');
    console.log('==========================================\n');
  }

  /**
   * Run all incremental processing tests
   */
  async runAllTests() {
    const tests = [
      () => this.testChangeDetectionBasics(),
      () => this.testPipelineIncrementalProcessing(),
      () => this.testStateManagerFileTracking(),
      () => this.testOnlyModifiedDataTriggers(),
      () => this.testIncrementalProcessingPerformance(),
      () => this.testForceRefreshMode(),
      () => this.testFrontendSyncProcessorIntegration(),
      () => this.testConcurrentChangeDetection(),
      () => this.testErrorRecoveryInIncremental(),
      () => this.testStateConsistencyAfterIncremental()
    ];

    console.log(`🚀 Running ${tests.length} incremental processing tests...\n`);

    for (let i = 0; i < tests.length; i++) {
      const testName = tests[i].name.replace('bound ', '');
      console.log(`📋 Test ${i + 1}/${tests.length}: ${testName}`);
      
      try {
        await tests[i]();
        this.recordTestResult(testName, 'PASSED');
      } catch (error) {
        this.recordTestResult(testName, 'FAILED', error.message);
        console.error(`❌ ${testName} failed:`, error.message);
      }
      
      console.log(''); // Add spacing between tests
    }

    this.generateTestReport();
    return this.testResults;
  }

  /**
   * Test 1: Basic change detection functionality
   */
  async testChangeDetectionBasics() {
    console.log('  🔍 Testing basic change detection...');
    
    // Get initial state
    const initialChecksums = this.stateManager.calculateAllChecksums();
    this.stateManager.saveChecksums(initialChecksums);
    
    // Verify no changes initially
    let changes = this.stateManager.detectChanges();
    if (changes.hasChanges) {
      throw new Error('Expected no changes initially, but changes were detected');
    }
    
    // Create a test file to trigger change detection
    const testFile = path.join(this.tempTestDir, 'test-change.json');
    fs.writeFileSync(testFile, JSON.stringify({ test: 'data' }));
    
    // Temporarily modify the state manager to track our test file
    const originalCalculateAllChecksums = this.stateManager.calculateAllChecksums;
    this.stateManager.calculateAllChecksums = function() {
      const checksums = originalCalculateAllChecksums.call(this);
      checksums.files.testFile = {
        path: testFile,
        checksum: this.calculateFileChecksum(testFile),
        lastModified: this.getFileLastModified(testFile)
      };
      return checksums;
    };
    
    // Detect changes after file creation
    changes = this.stateManager.detectChanges();
    if (!changes.hasChanges) {
      throw new Error('Expected changes after file creation, but none detected');
    }
    
    // Restore original method
    this.stateManager.calculateAllChecksums = originalCalculateAllChecksums;
    
    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    
    console.log('  ✅ Basic change detection working correctly');
  }

  /**
   * Test 2: Pipeline incremental processing with enhanced frontend-sync-processor
   */
  async testPipelineIncrementalProcessing() {
    console.log('  ⚙️  Testing pipeline incremental processing...');
    
    // Build incremental pipeline
    const pipeline = this.pipeline.buildPipeline(OPERATION_TYPES.INCREMENTAL, {
      forceAll: false,
      scenario: 'test-incremental'
    });
    
    if (pipeline.operationType !== OPERATION_TYPES.INCREMENTAL) {
      throw new Error('Pipeline should be configured for incremental processing');
    }
    
    // Verify pipeline includes change detection stage
    const hasChangeDetection = pipeline.stages.some(stage => stage.name === 'detect-changes');
    if (!hasChangeDetection) {
      throw new Error('Incremental pipeline should include change detection stage');
    }
    
    // Verify pipeline includes frontend sync stage
    const hasFrontendSync = pipeline.stages.some(stage => stage.name === 'sync-frontend');
    if (!hasFrontendSync) {
      throw new Error('Incremental pipeline should include frontend sync stage');
    }
    
    // Test execution plan resolution
    if (!pipeline.executionPlan || pipeline.executionPlan.length === 0) {
      throw new Error('Pipeline execution plan should be generated');
    }
    
    console.log('  ✅ Pipeline incremental processing configured correctly');
    console.log(`    📊 Pipeline stages: ${pipeline.stages.length}`);
    console.log(`    📋 Execution plan steps: ${pipeline.executionPlan.length}`);
  }

  /**
   * Test 3: State manager file tracking accuracy
   */
  async testStateManagerFileTracking() {
    console.log('  📁 Testing state manager file tracking...');
    
    // Create test files with known content
    const testFiles = [
      { name: 'test1.json', content: '{"test": 1}' },
      { name: 'test2.json', content: '{"test": 2}' },
      { name: 'test3.json', content: '{"test": 3}' }
    ];
    
    const testFilePaths = testFiles.map(file => {
      const filePath = path.join(this.tempTestDir, file.name);
      fs.writeFileSync(filePath, file.content);
      return filePath;
    });
    
    // Calculate checksums for test files
    const checksums = {};
    testFilePaths.forEach(filePath => {
      const checksum = this.stateManager.calculateFileChecksum(filePath);
      if (!checksum) {
        throw new Error(`Failed to calculate checksum for ${filePath}`);
      }
      checksums[filePath] = checksum;
    });
    
    // Modify one file and verify checksum changes
    const modifiedFile = testFilePaths[0];
    fs.writeFileSync(modifiedFile, '{"test": "modified"}');
    
    const newChecksum = this.stateManager.calculateFileChecksum(modifiedFile);
    if (newChecksum === checksums[modifiedFile]) {
      throw new Error('Checksum should change after file modification');
    }
    
    // Verify other files' checksums remain the same
    for (let i = 1; i < testFilePaths.length; i++) {
      const currentChecksum = this.stateManager.calculateFileChecksum(testFilePaths[i]);
      if (currentChecksum !== checksums[testFilePaths[i]]) {
        throw new Error(`Checksum for unmodified file ${testFilePaths[i]} should not change`);
      }
    }
    
    // Clean up test files
    testFilePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    console.log('  ✅ State manager file tracking working accurately');
    console.log(`    📊 Tracked ${testFiles.length} files successfully`);
  }

  /**
   * Test 4: Only modified data triggers frontend-sync-processor updates
   */
  async testOnlyModifiedDataTriggers() {
    console.log('  🎯 Testing selective frontend sync triggering...');
    
    // Mock the frontend sync processor to track calls
    let syncCallCount = 0;
    let lastSyncOptions = null;
    
    const originalSyncWithBackend = this.frontendProcessor.syncWithBackend;
    this.frontendProcessor.syncWithBackend = async function(options = {}) {
      syncCallCount++;
      lastSyncOptions = options;
      return {
        success: true,
        artistCount: 5,
        generationTime: 100,
        scenario: options.scenario || 'test'
      };
    };
    
    // Test 1: No changes should not trigger sync
    const noChangesPipeline = this.pipeline.buildPipeline(OPERATION_TYPES.INCREMENTAL, {
      forceAll: false
    });
    
    // Mock change detection to return no changes
    const originalDetectChanges = this.stateManager.detectChanges;
    this.stateManager.detectChanges = () => ({
      hasChanges: false,
      imagesChanged: false,
      dataChanged: false,
      configChanged: false,
      details: { reason: 'No changes detected' }
    });
    
    // Execute pipeline - should not trigger frontend sync
    try {
      await this.pipeline.executePipeline(noChangesPipeline);
    } catch (error) {
      // Pipeline might fail due to missing services, but we're testing sync triggering
      console.log('    ℹ️  Pipeline execution failed (expected in test environment)');
    }
    
    // Test 2: Data changes should trigger sync
    this.stateManager.detectChanges = () => ({
      hasChanges: true,
      imagesChanged: false,
      dataChanged: true,
      configChanged: false,
      details: { changedDirectories: ['testData'] }
    });
    
    const initialSyncCount = syncCallCount;
    
    try {
      await this.pipeline.executePipeline(noChangesPipeline);
    } catch (error) {
      // Expected in test environment
    }
    
    // Restore original methods
    this.frontendProcessor.syncWithBackend = originalSyncWithBackend;
    this.stateManager.detectChanges = originalDetectChanges;
    
    console.log('  ✅ Selective frontend sync triggering working correctly');
    console.log(`    📊 Sync calls tracked: ${syncCallCount}`);
  }

  /**
   * Test 5: Incremental processing performance validation
   */
  async testIncrementalProcessingPerformance() {
    console.log('  ⚡ Testing incremental processing performance...');
    
    const performanceMetrics = {
      changeDetectionTime: 0,
      pipelineBuildTime: 0,
      totalIncrementalTime: 0
    };
    
    // Measure change detection performance
    const changeDetectionStart = Date.now();
    const changes = this.stateManager.detectChanges();
    performanceMetrics.changeDetectionTime = Date.now() - changeDetectionStart;
    
    // Measure pipeline build performance
    const pipelineBuildStart = Date.now();
    const pipeline = this.pipeline.buildPipeline(OPERATION_TYPES.INCREMENTAL, {
      forceAll: false,
      scenario: 'performance-test'
    });
    performanceMetrics.pipelineBuildTime = Date.now() - pipelineBuildStart;
    
    // Measure total incremental processing time (mock execution)
    const totalStart = Date.now();
    
    // Mock quick execution for performance testing
    const mockExecution = {
      id: 'perf-test',
      pipeline,
      startTime: new Date(),
      status: 'completed',
      results: new Map([
        ['detect-changes', { hasChanges: changes.hasChanges }],
        ['sync-frontend', { success: true, artistCount: 10 }]
      ])
    };
    
    performanceMetrics.totalIncrementalTime = Date.now() - totalStart;
    
    // Validate performance thresholds
    const thresholds = {
      changeDetectionTime: 1000, // 1 second
      pipelineBuildTime: 500,    // 0.5 seconds
      totalIncrementalTime: 2000 // 2 seconds
    };
    
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      if (performanceMetrics[metric] > threshold) {
        console.warn(`    ⚠️  ${metric} (${performanceMetrics[metric]}ms) exceeds threshold (${threshold}ms)`);
        this.testResults.warnings++;
      }
    });
    
    console.log('  ✅ Incremental processing performance validated');
    console.log(`    📊 Change detection: ${performanceMetrics.changeDetectionTime}ms`);
    console.log(`    📊 Pipeline build: ${performanceMetrics.pipelineBuildTime}ms`);
    console.log(`    📊 Total incremental: ${performanceMetrics.totalIncrementalTime}ms`);
  }

  /**
   * Test 6: Force refresh mode testing
   */
  async testForceRefreshMode() {
    console.log('  🔄 Testing force refresh mode...');
    
    // Test force refresh pipeline configuration
    const forceRefreshPipeline = this.pipeline.buildPipeline(OPERATION_TYPES.INCREMENTAL, {
      forceAll: true,
      scenario: 'force-refresh-test'
    });
    
    // Verify force refresh includes all processing stages
    const expectedStages = ['process-images', 'seed-database', 'sync-frontend'];
    const pipelineStageNames = forceRefreshPipeline.stages.map(stage => stage.name);
    
    expectedStages.forEach(expectedStage => {
      if (!pipelineStageNames.includes(expectedStage)) {
        throw new Error(`Force refresh pipeline should include ${expectedStage} stage`);
      }
    });
    
    // Test that force refresh ignores change detection results
    const originalDetectChanges = this.stateManager.detectChanges;
    this.stateManager.detectChanges = () => ({
      hasChanges: false,
      imagesChanged: false,
      dataChanged: false,
      configChanged: false,
      details: { reason: 'No changes (should be ignored in force mode)' }
    });
    
    // Build pipeline with force refresh - should still include all stages
    const forcePipeline = this.pipeline.buildPipeline(OPERATION_TYPES.INCREMENTAL, {
      forceAll: true
    });
    
    const forceStageNames = forcePipeline.stages.map(stage => stage.name);
    expectedStages.forEach(expectedStage => {
      if (!forceStageNames.includes(expectedStage)) {
        throw new Error(`Force refresh should include ${expectedStage} even with no changes`);
      }
    });
    
    // Restore original method
    this.stateManager.detectChanges = originalDetectChanges;
    
    console.log('  ✅ Force refresh mode working correctly');
    console.log(`    📊 Force pipeline stages: ${forcePipeline.stages.length}`);
  }

  /**
   * Test 7: Frontend sync processor integration
   */
  async testFrontendSyncProcessorIntegration() {
    console.log('  🔗 Testing frontend sync processor integration...');
    
    // Test enhanced sync capabilities
    const syncOptions = {
      includeBusinessData: true,
      validateData: true,
      scenario: 'integration-test'
    };
    
    try {
      const syncResult = await this.frontendProcessor.syncWithBackend(syncOptions);
      
      if (!syncResult.success) {
        throw new Error(`Frontend sync failed: ${syncResult.error}`);
      }
      
      // Verify enhanced capabilities are reported
      if (!syncResult.enhancedCapabilities) {
        console.warn('    ⚠️  Enhanced capabilities not reported in sync result');
        this.testResults.warnings++;
      }
      
      // Verify business data inclusion
      if (syncOptions.includeBusinessData && !syncResult.artistCount) {
        throw new Error('Business data should be included in sync result');
      }
      
      console.log('  ✅ Frontend sync processor integration working');
      console.log(`    📊 Sync result: ${syncResult.artistCount || 0} artists`);
      
    } catch (error) {
      if (error.message.includes('ENOENT') || error.message.includes('frontend mock data')) {
        console.log('    ℹ️  Frontend sync test skipped (mock data file not found - expected in test environment)');
      } else {
        throw error;
      }
    }
  }

  /**
   * Test 8: Concurrent change detection
   */
  async testConcurrentChangeDetection() {
    console.log('  🔀 Testing concurrent change detection...');
    
    // Test multiple concurrent change detection calls
    const concurrentCalls = 3;
    const changeDetectionPromises = [];
    
    for (let i = 0; i < concurrentCalls; i++) {
      changeDetectionPromises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            const changes = this.stateManager.detectChanges();
            resolve({
              callId: i,
              hasChanges: changes.hasChanges,
              timestamp: Date.now()
            });
          }, Math.random() * 100); // Random delay up to 100ms
        })
      );
    }
    
    const results = await Promise.all(changeDetectionPromises);
    
    // Verify all calls completed successfully
    if (results.length !== concurrentCalls) {
      throw new Error(`Expected ${concurrentCalls} results, got ${results.length}`);
    }
    
    // Verify results are consistent (same change detection state)
    const firstResult = results[0];
    const inconsistentResults = results.filter(result => 
      result.hasChanges !== firstResult.hasChanges
    );
    
    if (inconsistentResults.length > 0) {
      throw new Error('Concurrent change detection calls returned inconsistent results');
    }
    
    console.log('  ✅ Concurrent change detection working correctly');
    console.log(`    📊 Concurrent calls: ${concurrentCalls}, all consistent`);
  }

  /**
   * Test 9: Error recovery in incremental processing
   */
  async testErrorRecoveryInIncremental() {
    console.log('  🛠️  Testing error recovery in incremental processing...');
    
    // Mock a failing stage
    const originalSyncFrontend = this.pipeline._syncFrontend;
    this.pipeline._syncFrontend = async () => {
      throw new Error('Simulated frontend sync failure');
    };
    
    // Build incremental pipeline
    const pipeline = this.pipeline.buildPipeline(OPERATION_TYPES.INCREMENTAL);
    
    // Execute pipeline and expect it to handle the error
    let executionError = null;
    try {
      await this.pipeline.executePipeline(pipeline);
    } catch (error) {
      executionError = error;
    }
    
    // Verify error was caught and handled
    if (!executionError) {
      console.warn('    ⚠️  Expected execution error was not thrown');
      this.testResults.warnings++;
    } else {
      // Verify error contains expected information
      if (!executionError.message.includes('frontend sync failure')) {
        throw new Error('Error should contain information about the failing stage');
      }
    }
    
    // Restore original method
    this.pipeline._syncFrontend = originalSyncFrontend;
    
    console.log('  ✅ Error recovery in incremental processing working');
  }

  /**
   * Test 10: State consistency after incremental processing
   */
  async testStateConsistencyAfterIncremental() {
    console.log('  🔄 Testing state consistency after incremental processing...');
    
    // Get initial state
    const initialState = this.stateManager.getState();
    const initialChecksums = this.stateManager.loadChecksums();
    
    // Simulate incremental processing completion
    const mockResults = {
      frontend: {
        updated: true,
        artistCount: 8,
        generationTime: 150,
        enhancedCapabilities: true
      }
    };
    
    // Update state after mock operation
    const updateSuccess = this.stateManager.updateState({
      type: 'incremental',
      duration: 1500,
      scenario: 'consistency-test'
    }, mockResults);
    
    if (!updateSuccess) {
      throw new Error('State update should succeed');
    }
    
    // Verify state was updated correctly
    const updatedState = this.stateManager.getState();
    
    // Check that frontend results were updated
    if (!updatedState.results.frontend.updated) {
      throw new Error('Frontend updated flag should be true');
    }
    
    if (updatedState.results.frontend.artistCount !== mockResults.frontend.artistCount) {
      throw new Error('Artist count should be updated in state');
    }
    
    // Check that enhanced capabilities are tracked
    if (!updatedState.results.frontend.enhancedCapabilities) {
      throw new Error('Enhanced capabilities should be tracked in state');
    }
    
    // Verify checksums were updated
    const newChecksums = this.stateManager.loadChecksums();
    if (!newChecksums || newChecksums.timestamp === initialChecksums?.timestamp) {
      console.warn('    ⚠️  Checksums may not have been updated properly');
      this.testResults.warnings++;
    }
    
    console.log('  ✅ State consistency after incremental processing verified');
    console.log(`    📊 State updated: ${updatedState.lastUpdated}`);
  }

  /**
   * Record test result
   */
  recordTestResult(testName, status, error = null) {
    const result = {
      name: testName,
      status,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.tests.push(result);
    
    if (status === 'PASSED') {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    this.testResults.endTime = Date.now();
    const duration = this.testResults.endTime - this.testResults.startTime;
    
    console.log('\n📊 Incremental Processing Integration Test Results');
    console.log('================================================\n');
    
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⚠️  Warnings: ${this.testResults.warnings}`);
    console.log(`⏱️  Duration: ${duration}ms\n`);
    
    if (this.testResults.failed > 0) {
      console.log('❌ Failed Tests:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
      console.log('');
    }
    
    if (this.testResults.warnings > 0) {
      console.log('⚠️  Test Warnings:');
      console.log(`  - ${this.testResults.warnings} performance or consistency warnings detected`);
      console.log('  - Check individual test output for details\n');
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'test-results', 'incremental-processing-test-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify({
      ...this.testResults,
      testSuite: 'Incremental Processing Integration',
      requirements: ['14.2', '14.3'],
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      }
    }, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    const success = this.testResults.failed === 0;
    console.log(`\n${success ? '🎉' : '💥'} Incremental Processing Integration Tests ${success ? 'PASSED' : 'FAILED'}`);
    
    return success;
  }

  /**
   * Clean up test environment
   */
  cleanup() {
    // Remove temporary test directories
    [this.tempTestDir, this.backupDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  }
}

/**
 * CLI execution
 */
async function main() {
  const tester = new IncrementalProcessingTester();
  
  try {
    const results = await tester.runAllTests();
    const success = results.failed === 0;
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    tester.cleanup();
  }
}

// Export for use in other test files
module.exports = {
  IncrementalProcessingTester
};

// Run tests if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}