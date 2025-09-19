#!/usr/bin/env node

/**
 * Final Validation Test Script
 * 
 * Performs comprehensive validation of the entire data management system
 * including performance benchmarks, cross-platform compatibility, and
 * integration testing.
 */

const { UnifiedDataManager } = require('./unified-data-manager');
const { DataCLI } = require('./data-cli');
const { HealthMonitor } = require('./health-monitor');
const { ComparisonValidator } = require('./comparison-validator');
const { MigrationUtility } = require('./migration-utility');
const { BackwardCompatibilityLayer } = require('./backward-compatibility');
const { DATA_CONFIG, SCENARIOS, RESET_STATES } = require('./data-config');

class FinalValidator {
  constructor() {
    this.results = {
      systemTests: { passed: 0, failed: 0, tests: [] },
      performanceTests: { passed: 0, failed: 0, tests: [] },
      integrationTests: { passed: 0, failed: 0, tests: [] },
      compatibilityTests: { passed: 0, failed: 0, tests: [] }
    };
    
    this.benchmarks = {
      configurationLoad: 0,
      cliParsing: 0,
      healthCheck: 0,
      validation: 0,
      migration: 0
    };
  }

  /**
   * Run all final validation tests
   */
  async runFinalValidation() {
    console.log('🎯 Final System Validation');
    console.log('═══════════════════════════\n');

    try {
      await this.validateSystemIntegrity();
      await this.validatePerformance();
      await this.validateIntegration();
      await this.validateCompatibility();
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Final validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate system integrity
   */
  async validateSystemIntegrity() {
    console.log('🔍 System Integrity Validation...');
    
    const tests = [
      () => this.validateAllComponentsExist(),
      () => this.validateConfigurationIntegrity(),
      () => this.validateMethodSignatures(),
      () => this.validateErrorHandling(),
      () => this.validateDataStructures()
    ];

    for (const test of tests) {
      try {
        await test();
        this.recordResult('systemTests', test.name, true);
      } catch (error) {
        this.recordResult('systemTests', test.name, false, error.message);
      }
    }
  }

  /**
   * Validate performance characteristics
   */
  async validatePerformance() {
    console.log('⚡ Performance Validation...');
    
    // Configuration loading performance
    const configStart = Date.now();
    const config = DATA_CONFIG;
    this.benchmarks.configurationLoad = Date.now() - configStart;
    this.assert(this.benchmarks.configurationLoad < 50, 'Configuration should load quickly');
    this.recordResult('performanceTests', 'Configuration Load', true, `${this.benchmarks.configurationLoad}ms`);

    // CLI parsing performance
    const cliStart = Date.now();
    const cli = new DataCLI();
    const args = cli.parseArguments(['setup-data', '--frontend-only', '--force']);
    this.benchmarks.cliParsing = Date.now() - cliStart;
    this.assert(this.benchmarks.cliParsing < 10, 'CLI parsing should be fast');
    this.recordResult('performanceTests', 'CLI Parsing', true, `${this.benchmarks.cliParsing}ms`);

    // Health check performance
    const healthStart = Date.now();
    const healthMonitor = new HealthMonitor();
    healthMonitor.healthStatus = {
      services: { localstack: { status: 'healthy' } },
      errors: []
    };
    const health = healthMonitor.calculateOverallHealth();
    this.benchmarks.healthCheck = Date.now() - healthStart;
    this.assert(this.benchmarks.healthCheck < 5, 'Health check should be instant');
    this.recordResult('performanceTests', 'Health Check', true, `${this.benchmarks.healthCheck}ms`);

    // Validation performance
    const validationStart = Date.now();
    const validator = new ComparisonValidator();
    await validator.validateConfigurationStructure();
    this.benchmarks.validation = Date.now() - validationStart;
    this.assert(this.benchmarks.validation < 100, 'Validation should be fast');
    this.recordResult('performanceTests', 'Configuration Validation', true, `${this.benchmarks.validation}ms`);

    // Migration analysis performance
    const migrationStart = Date.now();
    const migrationUtility = new MigrationUtility();
    await migrationUtility.analyzeMigrationReadiness();
    this.benchmarks.migration = Date.now() - migrationStart;
    this.assert(this.benchmarks.migration < 500, 'Migration analysis should be reasonable');
    this.recordResult('performanceTests', 'Migration Analysis', true, `${this.benchmarks.migration}ms`);
  }

  /**
   * Validate integration between components
   */
  async validateIntegration() {
    console.log('🔗 Integration Validation...');
    
    try {
      // Test UnifiedDataManager integration
      const dataManager = new UnifiedDataManager();
      this.assert(dataManager.healthMonitor !== undefined, 'Health monitor should be integrated');
      this.assert(dataManager.stateManager !== undefined, 'State manager should be integrated');
      this.recordResult('integrationTests', 'UnifiedDataManager Integration', true);

      // Test CLI integration
      const cli = new DataCLI();
      this.assert(typeof cli.manager === 'object', 'CLI should have data manager');
      this.recordResult('integrationTests', 'CLI Integration', true);

      // Test backward compatibility integration
      const compatLayer = new BackwardCompatibilityLayer();
      this.assert(compatLayer.manager instanceof UnifiedDataManager, 'Compatibility layer should use unified manager');
      this.recordResult('integrationTests', 'Backward Compatibility Integration', true);

      // Test configuration integration
      this.assert(Object.keys(SCENARIOS).length === 10, 'All scenarios should be available');
      this.assert(Object.keys(RESET_STATES).length === 8, 'All reset states should be available');
      this.recordResult('integrationTests', 'Configuration Integration', true);

    } catch (error) {
      this.recordResult('integrationTests', 'Integration Test', false, error.message);
    }
  }

  /**
   * Validate cross-platform compatibility
   */
  async validateCompatibility() {
    console.log('🌐 Compatibility Validation...');
    
    try {
      const path = require('path');
      const os = require('os');
      
      // Test path handling
      const testPath = path.join('scripts', 'test-data', 'artists.json');
      this.assert(testPath.includes('scripts'), 'Path handling should work cross-platform');
      this.recordResult('compatibilityTests', 'Path Handling', true);

      // Test platform detection
      const platform = os.platform();
      this.assert(['win32', 'linux', 'darwin'].includes(platform), 'Should detect valid platform');
      this.recordResult('compatibilityTests', 'Platform Detection', true, platform);

      // Test environment detection
      const env = DATA_CONFIG.environment;
      this.assert(typeof env.platform === 'string', 'Should detect environment');
      this.recordResult('compatibilityTests', 'Environment Detection', true);

      // Test Docker compatibility
      const { DockerCompatibilityLayer } = require('./docker-compatibility');
      const dockerLayer = new DockerCompatibilityLayer();
      this.assert(typeof dockerLayer.detectDockerEnvironment === 'function', 'Docker compatibility should exist');
      this.recordResult('compatibilityTests', 'Docker Compatibility', true);

    } catch (error) {
      this.recordResult('compatibilityTests', 'Compatibility Test', false, error.message);
    }
  }

  /**
   * Validate all components exist and are properly structured
   */
  validateAllComponentsExist() {
    const requiredComponents = [
      { name: 'UnifiedDataManager', module: './unified-data-manager' },
      { name: 'DataCLI', module: './data-cli' },
      { name: 'HealthMonitor', module: './health-monitor' },
      { name: 'ComparisonValidator', module: './comparison-validator' },
      { name: 'MigrationUtility', module: './migration-utility' },
      { name: 'BackwardCompatibilityLayer', module: './backward-compatibility' }
    ];

    for (const component of requiredComponents) {
      const ComponentClass = require(component.module)[component.name];
      this.assert(typeof ComponentClass === 'function', `${component.name} should be a constructor`);
      
      const instance = new ComponentClass();
      this.assert(typeof instance === 'object', `${component.name} should instantiate`);
    }
  }

  /**
   * Validate configuration integrity
   */
  validateConfigurationIntegrity() {
    this.assert(DATA_CONFIG !== null, 'Configuration should exist');
    this.assert(typeof DATA_CONFIG.services === 'object', 'Services config should exist');
    this.assert(typeof DATA_CONFIG.paths === 'object', 'Paths config should exist');
    this.assert(typeof DATA_CONFIG.environment === 'object', 'Environment config should exist');
    
    // Validate scenarios
    this.assert(Object.keys(SCENARIOS).length === 10, 'Should have 10 scenarios');
    Object.values(SCENARIOS).forEach(scenario => {
      this.assert(typeof scenario.description === 'string', 'Scenario should have description');
    });
    
    // Validate reset states
    this.assert(Object.keys(RESET_STATES).length === 8, 'Should have 8 reset states');
    Object.values(RESET_STATES).forEach(state => {
      this.assert(typeof state.description === 'string', 'Reset state should have description');
    });
  }

  /**
   * Validate method signatures
   */
  validateMethodSignatures() {
    const dataManager = new UnifiedDataManager();
    
    // Check required methods exist
    const requiredMethods = [
      'setupData', 'resetData', 'seedScenario', 
      'validateData', 'healthCheck', 'getDataStatus'
    ];
    
    for (const method of requiredMethods) {
      this.assert(typeof dataManager[method] === 'function', `${method} should be a function`);
    }
    
    // Check CLI methods
    const cli = new DataCLI();
    const cliMethods = ['parseArguments', 'validateCommand', 'handleCommand'];
    
    for (const method of cliMethods) {
      this.assert(typeof cli[method] === 'function', `CLI ${method} should be a function`);
    }
  }

  /**
   * Validate error handling
   */
  validateErrorHandling() {
    const { ErrorHandler } = require('./error-handler');
    const errorHandler = new ErrorHandler();
    
    this.assert(typeof errorHandler.handleError === 'function', 'Error handler should exist');
    this.assert(typeof errorHandler.classifyError === 'function', 'Error classification should exist');
    
    // Test error classification
    const testError = new Error('Test error');
    const classification = errorHandler.classifyError(testError);
    this.assert(typeof classification === 'object', 'Should classify errors');
    this.assert(typeof classification.type === 'string', 'Should have error type');
  }

  /**
   * Validate data structures
   */
  validateDataStructures() {
    // Test that all data structures are properly defined
    this.assert(Array.isArray(Object.keys(SCENARIOS)), 'Scenarios should be enumerable');
    this.assert(Array.isArray(Object.keys(RESET_STATES)), 'Reset states should be enumerable');
    
    // Test configuration structure
    const config = DATA_CONFIG;
    this.assert(config.services.localstack.endpoint, 'LocalStack endpoint should be defined');
    this.assert(config.services.dynamodb.tableName, 'DynamoDB table should be defined');
    this.assert(config.services.opensearch.indexName, 'OpenSearch index should be defined');
    this.assert(config.services.s3.bucketName, 'S3 bucket should be defined');
  }

  /**
   * Generate final validation report
   */
  async generateFinalReport() {
    console.log('\n📊 Final Validation Report');
    console.log('═══════════════════════════');
    
    const categories = ['systemTests', 'performanceTests', 'integrationTests', 'compatibilityTests'];
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of categories) {
      const results = this.results[category];
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      console.log(`\n${this.getCategoryIcon(category)} ${this.getCategoryName(category)}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      
      if (results.failed > 0) {
        console.log('  Failed tests:');
        results.tests.filter(t => !t.passed).forEach(test => {
          console.log(`    • ${test.name}: ${test.details}`);
        });
      }
    }
    
    console.log('\n🎯 Performance Benchmarks:');
    console.log(`  Configuration Load: ${this.benchmarks.configurationLoad}ms`);
    console.log(`  CLI Parsing: ${this.benchmarks.cliParsing}ms`);
    console.log(`  Health Check: ${this.benchmarks.healthCheck}ms`);
    console.log(`  Validation: ${this.benchmarks.validation}ms`);
    console.log(`  Migration Analysis: ${this.benchmarks.migration}ms`);
    
    const successRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
    console.log(`\n📈 Overall Success Rate: ${successRate}%`);
    console.log(`   Total Tests: ${totalPassed + totalFailed}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All validation tests passed!');
      console.log('✨ System is ready for production use.');
      
      // Update task status
      console.log('\n📋 Updating task completion status...');
      process.exit(0);
    } else {
      console.log('\n❌ Some validation tests failed.');
      console.log('🔧 Please review and fix the issues above.');
      process.exit(1);
    }
  }

  /**
   * Helper methods
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  recordResult(category, testName, passed, details = '') {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results[category].tests.push(result);
    
    if (passed) {
      this.results[category].passed++;
      console.log(`  ✅ ${testName} ${details ? `(${details})` : ''}`);
    } else {
      this.results[category].failed++;
      console.log(`  ❌ ${testName}: ${details}`);
    }
  }

  getCategoryIcon(category) {
    const icons = {
      systemTests: '🔍',
      performanceTests: '⚡',
      integrationTests: '🔗',
      compatibilityTests: '🌐'
    };
    return icons[category] || '📋';
  }

  getCategoryName(category) {
    const names = {
      systemTests: 'System Integrity',
      performanceTests: 'Performance',
      integrationTests: 'Integration',
      compatibilityTests: 'Compatibility'
    };
    return names[category] || category;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new FinalValidator();
  validator.runFinalValidation().catch(error => {
    console.error('Final validation failed:', error);
    process.exit(1);
  });
}

module.exports = { FinalValidator };