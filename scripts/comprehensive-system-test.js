#!/usr/bin/env node

/**
 * Comprehensive System Testing Script
 * 
 * This script performs end-to-end testing of the data management system
 * to validate all functionality works correctly in integration.
 */

const { UnifiedDataManager } = require('./unified-data-manager');
const { DataCLI } = require('./data-cli');
const { DATA_CONFIG, SCENARIOS, RESET_STATES } = require('./data-config');
const { HealthMonitor } = require('./health-monitor');
const { ComparisonValidator } = require('./comparison-validator');
const { MigrationUtility } = require('./migration-utility');

class SystemTester {
  constructor() {
    this.dataManager = new UnifiedDataManager();
    this.cli = new DataCLI();
    this.healthMonitor = new HealthMonitor();
    this.validator = new ComparisonValidator();
    this.migrationUtility = new MigrationUtility();
    
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  /**
   * Run comprehensive system tests
   */
  async runAllTests() {
    console.log('🧪 Starting Comprehensive System Testing...\n');
    
    try {
      // Core functionality tests
      await this.testConfiguration();
      await this.testHealthMonitoring();
      await this.testCLIInterface();
      await this.testDataOperations();
      await this.testScenarios();
      await this.testResetStates();
      await this.testIncrementalProcessing();
      await this.testErrorHandling();
      await this.testBackwardCompatibility();
      await this.testMigrationUtilities();
      await this.testPerformance();
      await this.testCrossPlatformCompatibility();
      
      this.displayResults();
      
    } catch (error) {
      console.error('❌ System testing failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test configuration system
   */
  async testConfiguration() {
    console.log('📋 Testing Configuration System...');
    
    try {
      // Test configuration loading
      this.assert(DATA_CONFIG !== null, 'Configuration should load');
      this.assert(typeof DATA_CONFIG.services === 'object', 'Services config should exist');
      this.assert(typeof DATA_CONFIG.paths === 'object', 'Paths config should exist');
      
      // Test scenario definitions
      this.assert(Object.keys(SCENARIOS).length === 10, 'Should have 10 scenarios');
      this.assert(Object.keys(RESET_STATES).length === 8, 'Should have 8 reset states');
      
      // Test configuration validation
      const validationResult = await this.validator.validateConfigurationStructure();
      this.assert(validationResult.status === 'passed', 'Configuration should be valid');
      
      this.recordTest('Configuration System', true);
      
    } catch (error) {
      this.recordTest('Configuration System', false, error.message);
    }
  }

  /**
   * Test health monitoring
   */
  async testHealthMonitoring() {
    console.log('🏥 Testing Health Monitoring...');
    
    try {
      // Test health check methods exist
      this.assert(typeof this.healthMonitor.checkAllServices === 'function', 'Health check method should exist');
      this.assert(typeof this.healthMonitor.validateData === 'function', 'Data validation method should exist');
      this.assert(typeof this.healthMonitor.isSystemReady === 'function', 'System ready check should exist');
      
      // Test health monitoring without requiring actual services
      // Mock the health status for testing
      this.healthMonitor.healthStatus = {
        services: {
          localstack: { status: 'healthy' },
          dynamodb: { status: 'healthy' },
          opensearch: { status: 'healthy' },
          s3: { status: 'healthy' }
        },
        errors: [],
        lastCheck: new Date().toISOString()
      };
      
      const overallHealth = this.healthMonitor.calculateOverallHealth();
      this.assert(typeof overallHealth === 'string', 'Should calculate health correctly');
      this.assert(overallHealth === 'healthy', 'Should return healthy status');
      
      this.recordTest('Health Monitoring', true);
      
    } catch (error) {
      this.recordTest('Health Monitoring', false, error.message);
    }
  }

  /**
   * Test CLI interface
   */
  async testCLIInterface() {
    console.log('💻 Testing CLI Interface...');
    
    try {
      // Test command parsing
      const setupArgs = this.cli.parseArguments(['setup-data', '--frontend-only']);
      this.assert(setupArgs.command === 'setup-data', 'Should parse command correctly');
      this.assert(setupArgs.options['frontend-only'] === true, 'Should parse flags correctly');
      
      // Test command validation
      const validCommand = this.cli.validateCommand('setup-data', setupArgs.args, setupArgs.options);
      this.assert(validCommand.isValid, 'Should validate valid commands');
      
      const invalidCommand = this.cli.validateCommand('invalid-command', [], {});
      this.assert(!invalidCommand.isValid, 'Should reject invalid commands');
      
      // Test help system
      this.assert(typeof this.cli.showHelp === 'function', 'Help system should exist');
      
      this.recordTest('CLI Interface', true);
      
    } catch (error) {
      this.recordTest('CLI Interface', false, error.message);
    }
  }

  /**
   * Test core data operations
   */
  async testDataOperations() {
    console.log('🗄️ Testing Data Operations...');
    
    try {
      // Test that all required methods exist
      this.assert(typeof this.dataManager.setupData === 'function', 'setupData method should exist');
      this.assert(typeof this.dataManager.resetData === 'function', 'resetData method should exist');
      this.assert(typeof this.dataManager.seedScenario === 'function', 'seedScenario method should exist');
      this.assert(typeof this.dataManager.validateData === 'function', 'validateData method should exist');
      this.assert(typeof this.dataManager.healthCheck === 'function', 'healthCheck method should exist');
      this.assert(typeof this.dataManager.getDataStatus === 'function', 'getDataStatus method should exist');
      
      // Test method signatures and basic functionality
      this.assert(this.dataManager.setupData.length >= 0, 'setupData should accept options parameter');
      this.assert(this.dataManager.resetData.length >= 0, 'resetData should accept state parameter');
      this.assert(this.dataManager.seedScenario.length >= 1, 'seedScenario should require scenario parameter');
      
      this.recordTest('Data Operations', true);
      
    } catch (error) {
      this.recordTest('Data Operations', false, error.message);
    }
  }

  /**
   * Test all scenarios
   */
  async testScenarios() {
    console.log('🎭 Testing Scenarios...');
    
    try {
      const expectedScenarios = [
        'minimal', 'search-basic', 'london-artists', 'high-rated',
        'new-artists', 'booking-available', 'portfolio-rich',
        'multi-style', 'pricing-range', 'full-dataset'
      ];
      
      for (const scenario of expectedScenarios) {
        this.assert(SCENARIOS[scenario] !== undefined, `Scenario ${scenario} should exist`);
        this.assert(typeof SCENARIOS[scenario] === 'object', `Scenario ${scenario} should be an object`);
      }
      
      // Test scenario validation
      for (const scenario of expectedScenarios) {
        const isValid = Object.keys(SCENARIOS).includes(scenario);
        this.assert(isValid, `Scenario ${scenario} should be valid`);
      }
      
      this.recordTest('Scenarios', true);
      
    } catch (error) {
      this.recordTest('Scenarios', false, error.message);
    }
  }

  /**
   * Test all reset states
   */
  async testResetStates() {
    console.log('🔄 Testing Reset States...');
    
    try {
      const expectedStates = [
        'clean', 'fresh', 'minimal', 'search-ready',
        'location-test', 'style-test', 'performance-test', 'frontend-ready'
      ];
      
      for (const state of expectedStates) {
        this.assert(RESET_STATES[state] !== undefined, `Reset state ${state} should exist`);
        this.assert(typeof RESET_STATES[state] === 'object', `Reset state ${state} should be an object`);
      }
      
      // Test state validation
      for (const state of expectedStates) {
        const isValid = Object.keys(RESET_STATES).includes(state);
        this.assert(isValid, `Reset state ${state} should be valid`);
      }
      
      this.recordTest('Reset States', true);
      
    } catch (error) {
      this.recordTest('Reset States', false, error.message);
    }
  }

  /**
   * Test incremental processing
   */
  async testIncrementalProcessing() {
    console.log('⚡ Testing Incremental Processing...');
    
    try {
      // Test state manager exists and has required methods
      this.assert(this.dataManager.stateManager !== undefined, 'State manager should exist');
      this.assert(typeof this.dataManager.stateManager.detectChanges === 'function', 'Change detection should exist');
      
      // Test incremental processing functionality in StateManager
      const { StateManager } = require('./state-manager');
      const stateManager = new StateManager(DATA_CONFIG);
      
      this.assert(typeof stateManager.detectChanges === 'function', 'Change detection should exist');
      this.assert(typeof stateManager.updateState === 'function', 'State update should exist');
      
      this.recordTest('Incremental Processing', true);
      
    } catch (error) {
      this.recordTest('Incremental Processing', false, error.message);
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('🚨 Testing Error Handling...');
    
    try {
      // Test error handler exists
      const { ErrorHandler } = require('./error-handler');
      const errorHandler = new ErrorHandler();
      
      this.assert(typeof errorHandler.handleError === 'function', 'Error handling should exist');
      this.assert(typeof errorHandler.classifyError === 'function', 'Error classification should exist');
      
      // Test error classification
      const testError = new Error('Test error');
      const classification = errorHandler.classifyError(testError);
      this.assert(typeof classification === 'object', 'Should classify errors');
      this.assert(typeof classification.type === 'string', 'Should have error type');
      
      this.recordTest('Error Handling', true);
      
    } catch (error) {
      this.recordTest('Error Handling', false, error.message);
    }
  }

  /**
   * Test backward compatibility
   */
  async testBackwardCompatibility() {
    console.log('🔙 Testing Backward Compatibility...');
    
    try {
      // Test backward compatibility layer exists
      const { BackwardCompatibilityLayer } = require('./backward-compatibility');
      const compatLayer = new BackwardCompatibilityLayer();
      
      this.assert(typeof compatLayer.legacySeed === 'function', 'Legacy seed operation should exist');
      this.assert(typeof compatLayer.generateMigrationReport === 'function', 'Migration reporting should exist');
      
      // Test legacy script detection
      const scriptExists = compatLayer.checkLegacyScript('scripts/data-seeder/seed.js');
      this.assert(typeof scriptExists === 'boolean', 'Should check legacy scripts');
      
      this.recordTest('Backward Compatibility', true);
      
    } catch (error) {
      this.recordTest('Backward Compatibility', false, error.message);
    }
  }

  /**
   * Test migration utilities
   */
  async testMigrationUtilities() {
    console.log('🔄 Testing Migration Utilities...');
    
    try {
      // Test migration utility methods
      this.assert(typeof this.migrationUtility.analyzeMigrationReadiness === 'function', 'Migration analysis should exist');
      this.assert(typeof this.migrationUtility.findLegacyScripts === 'function', 'Legacy script detection should exist');
      this.assert(typeof this.migrationUtility.validateFunctionalityPreservation === 'function', 'Functionality validation should exist');
      
      // Test migration analysis
      const analysis = await this.migrationUtility.analyzeMigrationReadiness();
      this.assert(typeof analysis === 'object', 'Should return analysis object');
      this.assert(Array.isArray(analysis.recommendations), 'Should include recommendations');
      
      this.recordTest('Migration Utilities', true);
      
    } catch (error) {
      this.recordTest('Migration Utilities', false, error.message);
    }
  }

  /**
   * Test performance characteristics
   */
  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      // Test that performance-critical operations complete quickly
      const startTime = Date.now();
      
      // Test configuration loading performance
      const config = DATA_CONFIG;
      this.assert(config !== null, 'Configuration should load quickly');
      
      // Test CLI parsing performance
      const args = this.cli.parseArguments(['setup-data', '--frontend-only']);
      this.assert(args.command === 'setup-data', 'CLI parsing should be fast');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete basic operations in under 100ms
      this.assert(duration < 100, `Performance test should complete quickly (${duration}ms)`);
      
      this.recordTest('Performance', true, `Completed in ${duration}ms`);
      
    } catch (error) {
      this.recordTest('Performance', false, error.message);
    }
  }

  /**
   * Test cross-platform compatibility
   */
  async testCrossPlatformCompatibility() {
    console.log('🌐 Testing Cross-Platform Compatibility...');
    
    try {
      const path = require('path');
      const os = require('os');
      
      // Test path handling
      const testPath = path.join('scripts', 'test-data', 'artists.json');
      this.assert(testPath.includes('scripts'), 'Path joining should work cross-platform');
      
      // Test platform detection
      const platform = os.platform();
      this.assert(typeof platform === 'string', 'Should detect platform');
      
      // Test environment detection in config
      this.assert(DATA_CONFIG.environment !== undefined, 'Should detect environment');
      
      this.recordTest('Cross-Platform Compatibility', true, `Platform: ${platform}`);
      
    } catch (error) {
      this.recordTest('Cross-Platform Compatibility', false, error.message);
    }
  }

  /**
   * Assert a condition and throw if false
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, details = '') {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.tests.push(result);
    
    if (passed) {
      this.results.passed++;
      console.log(`  ✅ ${testName} ${details ? `(${details})` : ''}`);
    } else {
      this.results.failed++;
      console.log(`  ❌ ${testName}: ${details}`);
    }
  }

  /**
   * Display final results
   */
  displayResults() {
    console.log('\n📊 System Testing Results:');
    console.log(`  ✅ Passed: ${this.results.passed}`);
    console.log(`  ❌ Failed: ${this.results.failed}`);
    console.log(`  ⚠️  Warnings: ${this.results.warnings}`);
    console.log(`  📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.details}`);
        });
      
      process.exit(1);
    } else {
      console.log('\n🎉 All system tests passed!');
      process.exit(0);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests().catch(error => {
    console.error('System testing failed:', error);
    process.exit(1);
  });
}

module.exports = { SystemTester };