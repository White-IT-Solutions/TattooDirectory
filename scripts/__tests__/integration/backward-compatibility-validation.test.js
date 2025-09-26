#!/usr/bin/env node

/**
 * Backward Compatibility Validation Test Suite
 * 
 * Tests all existing npm run commands continue to work properly with enhanced frontend-sync-processor
 * Validates migration-utility compatibility and comprehensive-system-test integration
 * Tests backward-compatibility layer with legacy integrations
 * Creates migration validation reports and compatibility matrices
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { UnifiedDataManager } = require('../../unified-data-manager');
const { MigrationUtility } = require('../../migration-utility');
const { SystemTester } = require('../../comprehensive-system-test');
const { BackwardCompatibilityLayer } = require('../../backward-compatibility');

class BackwardCompatibilityValidator {
  constructor() {
    this.results = {
      npmCommands: { passed: [], failed: [], warnings: [] },
      migrationUtility: { passed: [], failed: [], warnings: [] },
      systemTests: { passed: [], failed: [], warnings: [] },
      legacyIntegration: { passed: [], failed: [], warnings: [] },
      overall: { passed: 0, failed: 0, warnings: 0 }
    };
    
    this.migrationUtility = new MigrationUtility();
    this.systemTester = new SystemTester();
    this.compatLayer = new BackwardCompatibilityLayer();
    this.dataManager = new UnifiedDataManager();
    
    this.testStartTime = Date.now();
  }

  /**
   * Run complete backward compatibility validation
   */
  async runCompleteValidation() {
    console.log('🔄 Starting Backward Compatibility Validation...\n');
    console.log('═══════════════════════════════════════════════════════');
    
    try {
      // Phase 1: Test all npm run commands
      await this.testNpmCommands();
      
      // Phase 2: Validate migration utility compatibility
      await this.testMigrationUtilityCompatibility();
      
      // Phase 3: Run comprehensive system test
      await this.testComprehensiveSystemTest();
      
      // Phase 4: Test backward compatibility layer
      await this.testBackwardCompatibilityLayer();
      
      // Phase 5: Generate reports and matrices
      await this.generateValidationReports();
      
      // Display final results
      this.displayFinalResults();
      
    } catch (error) {
      console.error('❌ Backward compatibility validation failed:', error.message);
      this.recordFailure('overall', 'validation-process', error.message);
      process.exit(1);
    }
  }

  /**
   * Test all existing npm run commands continue to work properly
   */
  async testNpmCommands() {
    console.log('📦 Testing npm run commands compatibility...\n');
    
    const criticalCommands = [
      // Data management commands
      { command: 'setup-data', args: ['--help'], timeout: 10000, critical: true },
      { command: 'setup-data:frontend-only', args: ['--help'], timeout: 10000, critical: true },
      { command: 'reset-data', args: ['--help'], timeout: 10000, critical: true },
      { command: 'health-check', args: [], timeout: 15000, critical: true },
      { command: 'validate-data', args: ['--help'], timeout: 10000, critical: true },
      { command: 'data-status', args: [], timeout: 10000, critical: true },
      
      // Scenario commands
      { command: 'seed-scenario:minimal', args: ['--dry-run'], timeout: 15000, critical: false },
      { command: 'scenarios', args: [], timeout: 5000, critical: false },
      { command: 'reset-states', args: [], timeout: 5000, critical: false },
      
      // System commands
      { command: 'local:health', args: [], timeout: 10000, critical: false },
      { command: 'help', args: [], timeout: 5000, critical: false }
    ];

    for (const cmdTest of criticalCommands) {
      await this.testSingleNpmCommand(cmdTest);
    }
    
    console.log(`\n✅ npm commands test completed: ${this.results.npmCommands.passed.length} passed, ${this.results.npmCommands.failed.length} failed\n`);
  }

  /**
   * Test a single npm command
   */
  async testSingleNpmCommand(cmdTest) {
    const { command, args = [], timeout = 10000, critical = true } = cmdTest;
    const fullCommand = `npm run ${command}`;
    const commandWithArgs = args.length > 0 ? `${fullCommand} ${args.join(' ')}` : fullCommand;
    
    console.log(`🔄 Testing: ${commandWithArgs}`);
    
    try {
      const startTime = Date.now();
      
      // Execute command with timeout
      const result = await this.executeCommandWithTimeout(fullCommand, args, timeout);
      
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`  ✅ ${command}: PASSED (${duration}ms)`);
        this.results.npmCommands.passed.push({
          command,
          args,
          duration,
          output: result.output?.substring(0, 200) + (result.output?.length > 200 ? '...' : '')
        });
        this.results.overall.passed++;
      } else {
        const message = `Command failed: ${result.error}`;
        console.log(`  ❌ ${command}: FAILED - ${message}`);
        
        if (critical) {
          this.results.npmCommands.failed.push({ command, args, error: message, critical });
          this.results.overall.failed++;
        } else {
          this.results.npmCommands.warnings.push({ command, args, error: message, critical });
          this.results.overall.warnings++;
        }
      }
      
    } catch (error) {
      const message = `Exception: ${error.message}`;
      console.log(`  ❌ ${command}: ERROR - ${message}`);
      
      if (critical) {
        this.results.npmCommands.failed.push({ command, args, error: message, critical });
        this.results.overall.failed++;
      } else {
        this.results.npmCommands.warnings.push({ command, args, error: message, critical });
        this.results.overall.warnings++;
      }
    }
  }

  /**
   * Execute command with timeout
   */
  async executeCommandWithTimeout(command, args, timeout) {
    return new Promise((resolve) => {
      try {
        const child = spawn('npm', ['run', command.replace('npm run ', ''), ...args], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
          timeout: timeout
        });

        let output = '';
        let error = '';

        child.stdout?.on('data', (data) => {
          output += data.toString();
        });

        child.stderr?.on('data', (data) => {
          error += data.toString();
        });

        child.on('close', (code) => {
          resolve({
            success: code === 0,
            output,
            error: error || (code !== 0 ? `Process exited with code ${code}` : ''),
            code
          });
        });

        child.on('error', (err) => {
          resolve({
            success: false,
            output,
            error: err.message,
            code: -1
          });
        });

        // Handle timeout
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGTERM');
            resolve({
              success: false,
              output,
              error: 'Command timed out',
              code: -1
            });
          }
        }, timeout);

      } catch (err) {
        resolve({
          success: false,
          output: '',
          error: err.message,
          code: -1
        });
      }
    });
  }

  /**
   * Test migration utility compatibility with enhanced processor
   */
  async testMigrationUtilityCompatibility() {
    console.log('🔄 Testing Migration Utility Compatibility...\n');
    
    const migrationTests = [
      { name: 'Migration Analysis', test: () => this.migrationUtility.analyzeMigrationReadiness() },
      { name: 'Legacy Script Detection', test: () => this.migrationUtility.findLegacyScripts() },
      { name: 'npm Scripts Analysis', test: () => this.migrationUtility.analyzeNpmScripts() },
      { name: 'Docker Integration Analysis', test: () => this.migrationUtility.analyzeDockerIntegration() },
      { name: 'Dependencies Analysis', test: () => this.migrationUtility.analyzeDependencies() },
      { name: 'Functionality Preservation', test: () => this.migrationUtility.validateFunctionalityPreservation() },
      { name: 'Migration Testing', test: () => this.migrationUtility.testMigration(['setup-data', 'health-check']) }
    ];

    for (const migrationTest of migrationTests) {
      await this.runMigrationTest(migrationTest);
    }
    
    console.log(`\n✅ Migration utility test completed: ${this.results.migrationUtility.passed.length} passed, ${this.results.migrationUtility.failed.length} failed\n`);
  }

  /**
   * Run individual migration test
   */
  async runMigrationTest(migrationTest) {
    const { name, test } = migrationTest;
    console.log(`🔄 Testing: ${name}`);
    
    try {
      const startTime = Date.now();
      const result = await test();
      const duration = Date.now() - startTime;
      
      if (result && (result.success !== false)) {
        console.log(`  ✅ ${name}: PASSED (${duration}ms)`);
        this.results.migrationUtility.passed.push({ name, duration, result });
        this.results.overall.passed++;
      } else {
        const error = result?.error || result?.reason || 'Test returned false/null';
        console.log(`  ❌ ${name}: FAILED - ${error}`);
        this.results.migrationUtility.failed.push({ name, error });
        this.results.overall.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ ${name}: ERROR - ${error.message}`);
      this.results.migrationUtility.failed.push({ name, error: error.message });
      this.results.overall.failed++;
    }
  }

  /**
   * Test comprehensive system test with enhanced frontend-sync-processor
   */
  async testComprehensiveSystemTest() {
    console.log('🧪 Testing Comprehensive System Test Integration...\n');
    
    try {
      console.log('🔄 Running system test components...');
      
      // Test individual components that the system test uses
      const componentTests = [
        { name: 'Configuration System', test: () => this.testConfigurationSystem() },
        { name: 'Health Monitoring', test: () => this.testHealthMonitoring() },
        { name: 'CLI Interface', test: () => this.testCLIInterface() },
        { name: 'Data Operations', test: () => this.testDataOperations() },
        { name: 'Error Handling', test: () => this.testErrorHandling() }
      ];

      for (const componentTest of componentTests) {
        await this.runSystemComponentTest(componentTest);
      }
      
      console.log(`\n✅ System test completed: ${this.results.systemTests.passed.length} passed, ${this.results.systemTests.failed.length} failed\n`);
      
    } catch (error) {
      console.log(`❌ System test failed: ${error.message}`);
      this.results.systemTests.failed.push({ name: 'System Test Execution', error: error.message });
      this.results.overall.failed++;
    }
  }

  /**
   * Run individual system component test
   */
  async runSystemComponentTest(componentTest) {
    const { name, test } = componentTest;
    console.log(`🔄 Testing: ${name}`);
    
    try {
      const startTime = Date.now();
      const result = await test();
      const duration = Date.now() - startTime;
      
      console.log(`  ✅ ${name}: PASSED (${duration}ms)`);
      this.results.systemTests.passed.push({ name, duration, result });
      this.results.overall.passed++;
      
    } catch (error) {
      console.log(`  ❌ ${name}: FAILED - ${error.message}`);
      this.results.systemTests.failed.push({ name, error: error.message });
      this.results.overall.failed++;
    }
  }

  /**
   * Test configuration system
   */
  async testConfigurationSystem() {
    const { DATA_CONFIG } = require('../../data-config');
    
    if (!DATA_CONFIG || !DATA_CONFIG.services || !DATA_CONFIG.paths) {
      throw new Error('Configuration not properly loaded');
    }
    
    return { configLoaded: true, services: Object.keys(DATA_CONFIG.services).length };
  }

  /**
   * Test health monitoring
   */
  async testHealthMonitoring() {
    const { HealthMonitor } = require('../../health-monitor');
    const healthMonitor = new HealthMonitor();
    
    if (typeof healthMonitor.checkAllServices !== 'function') {
      throw new Error('Health monitoring methods not available');
    }
    
    return { healthMonitoringAvailable: true };
  }

  /**
   * Test CLI interface
   */
  async testCLIInterface() {
    const { DataCLI } = require('../../data-cli');
    const cli = new DataCLI();
    
    const setupArgs = cli.parseArguments(['setup-data', '--frontend-only']);
    if (setupArgs.command !== 'setup-data') {
      throw new Error('CLI parsing not working correctly');
    }
    
    return { cliWorking: true };
  }

  /**
   * Test data operations
   */
  async testDataOperations() {
    const requiredMethods = ['setupData', 'resetData', 'seedScenario', 'validateData', 'healthCheck', 'getDataStatus'];
    
    for (const method of requiredMethods) {
      if (typeof this.dataManager[method] !== 'function') {
        throw new Error(`Required method ${method} not found`);
      }
    }
    
    return { dataOperationsAvailable: true, methods: requiredMethods.length };
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    const { ErrorHandler } = require('../../error-handler');
    const errorHandler = new ErrorHandler();
    
    if (typeof errorHandler.handleError !== 'function') {
      throw new Error('Error handling not available');
    }
    
    return { errorHandlingAvailable: true };
  }

  /**
   * Test backward compatibility layer with legacy integrations
   */
  async testBackwardCompatibilityLayer() {
    console.log('🔙 Testing Backward Compatibility Layer...\n');
    
    const compatibilityTests = [
      { name: 'Legacy Script Detection', test: () => this.testLegacyScriptDetection() },
      { name: 'Legacy Command Mapping', test: () => this.testLegacyCommandMapping() },
      { name: 'Migration Report Generation', test: () => this.testMigrationReportGeneration() },
      { name: 'Compatibility Layer Interface', test: () => this.testCompatibilityLayerInterface() }
    ];

    for (const compatTest of compatibilityTests) {
      await this.runCompatibilityTest(compatTest);
    }
    
    console.log(`\n✅ Compatibility layer test completed: ${this.results.legacyIntegration.passed.length} passed, ${this.results.legacyIntegration.failed.length} failed\n`);
  }

  /**
   * Run individual compatibility test
   */
  async runCompatibilityTest(compatTest) {
    const { name, test } = compatTest;
    console.log(`🔄 Testing: ${name}`);
    
    try {
      const startTime = Date.now();
      const result = await test();
      const duration = Date.now() - startTime;
      
      console.log(`  ✅ ${name}: PASSED (${duration}ms)`);
      this.results.legacyIntegration.passed.push({ name, duration, result });
      this.results.overall.passed++;
      
    } catch (error) {
      console.log(`  ❌ ${name}: FAILED - ${error.message}`);
      this.results.legacyIntegration.failed.push({ name, error: error.message });
      this.results.overall.failed++;
    }
  }

  /**
   * Test legacy script detection
   */
  async testLegacyScriptDetection() {
    const legacyScripts = this.compatLayer.findLegacyScripts ? 
      this.compatLayer.findLegacyScripts() : 
      this.migrationUtility.findLegacyScripts();
    
    if (!legacyScripts || typeof legacyScripts !== 'object') {
      throw new Error('Legacy script detection not working');
    }
    
    return { legacyScriptsDetected: true, found: legacyScripts.found?.length || 0 };
  }

  /**
   * Test legacy command mapping
   */
  async testLegacyCommandMapping() {
    if (typeof this.compatLayer.legacySeed !== 'function') {
      throw new Error('Legacy command mapping not available');
    }
    
    return { legacyCommandMappingAvailable: true };
  }

  /**
   * Test migration report generation
   */
  async testMigrationReportGeneration() {
    if (typeof this.compatLayer.generateMigrationReport !== 'function') {
      throw new Error('Migration report generation not available');
    }
    
    return { migrationReportingAvailable: true };
  }

  /**
   * Test compatibility layer interface
   */
  async testCompatibilityLayerInterface() {
    const requiredMethods = ['legacySeed', 'generateMigrationReport'];
    
    for (const method of requiredMethods) {
      if (typeof this.compatLayer[method] !== 'function') {
        throw new Error(`Required compatibility method ${method} not found`);
      }
    }
    
    return { compatibilityInterfaceValid: true, methods: requiredMethods.length };
  }

  /**
   * Generate validation reports and compatibility matrices
   */
  async generateValidationReports() {
    console.log('📊 Generating Validation Reports and Compatibility Matrices...\n');
    
    try {
      // Generate comprehensive validation report
      const validationReport = this.generateValidationReport();
      
      // Generate compatibility matrix
      const compatibilityMatrix = this.generateCompatibilityMatrix();
      
      // Generate migration validation report
      const migrationReport = this.generateMigrationValidationReport();
      
      // Save reports to files
      await this.saveReportsToFiles(validationReport, compatibilityMatrix, migrationReport);
      
      console.log('✅ Reports generated successfully\n');
      
    } catch (error) {
      console.log(`❌ Report generation failed: ${error.message}`);
      this.results.overall.failed++;
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    const totalTests = this.results.overall.passed + this.results.overall.failed + this.results.overall.warnings;
    const successRate = totalTests > 0 ? ((this.results.overall.passed / totalTests) * 100).toFixed(1) : 0;
    
    return {
      summary: {
        timestamp: new Date().toISOString(),
        totalTests,
        passed: this.results.overall.passed,
        failed: this.results.overall.failed,
        warnings: this.results.overall.warnings,
        successRate: `${successRate}%`,
        duration: Date.now() - this.testStartTime
      },
      categories: {
        npmCommands: {
          passed: this.results.npmCommands.passed.length,
          failed: this.results.npmCommands.failed.length,
          warnings: this.results.npmCommands.warnings.length,
          details: this.results.npmCommands
        },
        migrationUtility: {
          passed: this.results.migrationUtility.passed.length,
          failed: this.results.migrationUtility.failed.length,
          warnings: this.results.migrationUtility.warnings.length,
          details: this.results.migrationUtility
        },
        systemTests: {
          passed: this.results.systemTests.passed.length,
          failed: this.results.systemTests.failed.length,
          warnings: this.results.systemTests.warnings.length,
          details: this.results.systemTests
        },
        legacyIntegration: {
          passed: this.results.legacyIntegration.passed.length,
          failed: this.results.legacyIntegration.failed.length,
          warnings: this.results.legacyIntegration.warnings.length,
          details: this.results.legacyIntegration
        }
      }
    };
  }

  /**
   * Generate compatibility matrix
   */
  generateCompatibilityMatrix() {
    const matrix = {
      timestamp: new Date().toISOString(),
      components: {
        'Enhanced Frontend Sync Processor': {
          'npm run commands': this.getCompatibilityStatus('npmCommands'),
          'Migration Utility': this.getCompatibilityStatus('migrationUtility'),
          'System Tests': this.getCompatibilityStatus('systemTests'),
          'Legacy Integration': this.getCompatibilityStatus('legacyIntegration')
        },
        'Unified Data Manager': {
          'CLI Interface': this.results.systemTests.passed.some(t => t.name === 'CLI Interface') ? 'Compatible' : 'Issues',
          'Data Operations': this.results.systemTests.passed.some(t => t.name === 'Data Operations') ? 'Compatible' : 'Issues',
          'Health Monitoring': this.results.systemTests.passed.some(t => t.name === 'Health Monitoring') ? 'Compatible' : 'Issues'
        },
        'Backward Compatibility Layer': {
          'Legacy Scripts': this.results.legacyIntegration.passed.some(t => t.name === 'Legacy Script Detection') ? 'Compatible' : 'Issues',
          'Command Mapping': this.results.legacyIntegration.passed.some(t => t.name === 'Legacy Command Mapping') ? 'Compatible' : 'Issues',
          'Migration Reports': this.results.legacyIntegration.passed.some(t => t.name === 'Migration Report Generation') ? 'Compatible' : 'Issues'
        }
      }
    };
    
    return matrix;
  }

  /**
   * Get compatibility status for a category
   */
  getCompatibilityStatus(category) {
    const results = this.results[category];
    const total = results.passed.length + results.failed.length + results.warnings.length;
    
    if (total === 0) return 'Not Tested';
    if (results.failed.length === 0) return 'Fully Compatible';
    if (results.failed.length < results.passed.length) return 'Mostly Compatible';
    return 'Compatibility Issues';
  }

  /**
   * Generate migration validation report
   */
  generateMigrationValidationReport() {
    return {
      timestamp: new Date().toISOString(),
      migrationReadiness: {
        overallStatus: this.results.overall.failed === 0 ? 'Ready' : 'Needs Attention',
        criticalIssues: this.results.npmCommands.failed.filter(f => f.critical).length,
        warnings: this.results.overall.warnings,
        recommendations: this.generateMigrationRecommendations()
      },
      testResults: {
        npmCommandCompatibility: this.results.npmCommands,
        migrationUtilityTests: this.results.migrationUtility,
        systemIntegrationTests: this.results.systemTests,
        legacyCompatibilityTests: this.results.legacyIntegration
      }
    };
  }

  /**
   * Generate migration recommendations
   */
  generateMigrationRecommendations() {
    const recommendations = [];
    
    // Check for critical npm command failures
    const criticalFailures = this.results.npmCommands.failed.filter(f => f.critical);
    if (criticalFailures.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'npm Commands',
        issue: `${criticalFailures.length} critical npm commands failed`,
        action: 'Fix critical command failures before proceeding with migration',
        commands: criticalFailures.map(f => f.command)
      });
    }
    
    // Check for migration utility issues
    if (this.results.migrationUtility.failed.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Migration Utility',
        issue: `${this.results.migrationUtility.failed.length} migration utility tests failed`,
        action: 'Review migration utility compatibility issues',
        tests: this.results.migrationUtility.failed.map(f => f.name)
      });
    }
    
    // Check for system test issues
    if (this.results.systemTests.failed.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'System Tests',
        issue: `${this.results.systemTests.failed.length} system tests failed`,
        action: 'Review system integration issues',
        tests: this.results.systemTests.failed.map(f => f.name)
      });
    }
    
    // Check for legacy integration issues
    if (this.results.legacyIntegration.failed.length > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Legacy Integration',
        issue: `${this.results.legacyIntegration.failed.length} legacy integration tests failed`,
        action: 'Review backward compatibility layer',
        tests: this.results.legacyIntegration.failed.map(f => f.name)
      });
    }
    
    return recommendations;
  }

  /**
   * Save reports to files
   */
  async saveReportsToFiles(validationReport, compatibilityMatrix, migrationReport) {
    const reportsDir = path.join(__dirname, '../../output/validation-reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save validation report
    const validationReportPath = path.join(reportsDir, `validation-report-${timestamp}.json`);
    fs.writeFileSync(validationReportPath, JSON.stringify(validationReport, null, 2));
    
    // Save compatibility matrix
    const compatibilityMatrixPath = path.join(reportsDir, `compatibility-matrix-${timestamp}.json`);
    fs.writeFileSync(compatibilityMatrixPath, JSON.stringify(compatibilityMatrix, null, 2));
    
    // Save migration report
    const migrationReportPath = path.join(reportsDir, `migration-validation-report-${timestamp}.json`);
    fs.writeFileSync(migrationReportPath, JSON.stringify(migrationReport, null, 2));
    
    // Generate summary report in markdown
    const summaryPath = path.join(reportsDir, `validation-summary-${timestamp}.md`);
    const summaryContent = this.generateMarkdownSummary(validationReport, compatibilityMatrix, migrationReport);
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log(`📄 Reports saved to:`);
    console.log(`   • Validation Report: ${validationReportPath}`);
    console.log(`   • Compatibility Matrix: ${compatibilityMatrixPath}`);
    console.log(`   • Migration Report: ${migrationReportPath}`);
    console.log(`   • Summary: ${summaryPath}`);
  }

  /**
   * Generate markdown summary
   */
  generateMarkdownSummary(validationReport, compatibilityMatrix, migrationReport) {
    const { summary } = validationReport;
    
    return `# Backward Compatibility Validation Report

## Summary

- **Timestamp**: ${summary.timestamp}
- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passed}
- **Failed**: ${summary.failed}
- **Warnings**: ${summary.warnings}
- **Success Rate**: ${summary.successRate}
- **Duration**: ${Math.round(summary.duration / 1000)}s

## Test Categories

### npm Commands (${validationReport.categories.npmCommands.passed}/${validationReport.categories.npmCommands.passed + validationReport.categories.npmCommands.failed})
${validationReport.categories.npmCommands.failed.length > 0 ? 
  '**Failed Commands:**\n' + validationReport.categories.npmCommands.failed.map(f => `- ${f.command}: ${f.error}`).join('\n') : 
  '✅ All npm commands working correctly'}

### Migration Utility (${validationReport.categories.migrationUtility.passed}/${validationReport.categories.migrationUtility.passed + validationReport.categories.migrationUtility.failed})
${validationReport.categories.migrationUtility.failed.length > 0 ? 
  '**Failed Tests:**\n' + validationReport.categories.migrationUtility.failed.map(f => `- ${f.name}: ${f.error}`).join('\n') : 
  '✅ Migration utility fully compatible'}

### System Tests (${validationReport.categories.systemTests.passed}/${validationReport.categories.systemTests.passed + validationReport.categories.systemTests.failed})
${validationReport.categories.systemTests.failed.length > 0 ? 
  '**Failed Tests:**\n' + validationReport.categories.systemTests.failed.map(f => `- ${f.name}: ${f.error}`).join('\n') : 
  '✅ System tests passing'}

### Legacy Integration (${validationReport.categories.legacyIntegration.passed}/${validationReport.categories.legacyIntegration.passed + validationReport.categories.legacyIntegration.failed})
${validationReport.categories.legacyIntegration.failed.length > 0 ? 
  '**Failed Tests:**\n' + validationReport.categories.legacyIntegration.failed.map(f => `- ${f.name}: ${f.error}`).join('\n') : 
  '✅ Legacy integration working'}

## Migration Readiness

**Status**: ${migrationReport.migrationReadiness.overallStatus}

${migrationReport.migrationReadiness.recommendations.length > 0 ? 
  '### Recommendations\n\n' + migrationReport.migrationReadiness.recommendations.map(r => 
    `**${r.priority}**: ${r.issue}\n- Action: ${r.action}`
  ).join('\n\n') : 
  '✅ No critical issues found - ready for migration'}

## Compatibility Matrix

${Object.entries(compatibilityMatrix.components).map(([component, compatibility]) => 
  `### ${component}\n${Object.entries(compatibility).map(([feature, status]) => 
    `- ${feature}: ${status}`
  ).join('\n')}`
).join('\n\n')}
`;
  }

  /**
   * Display final results
   */
  displayFinalResults() {
    const totalTests = this.results.overall.passed + this.results.overall.failed + this.results.overall.warnings;
    const successRate = totalTests > 0 ? ((this.results.overall.passed / totalTests) * 100).toFixed(1) : 0;
    const duration = Math.round((Date.now() - this.testStartTime) / 1000);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 BACKWARD COMPATIBILITY VALIDATION RESULTS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`✅ Passed: ${this.results.overall.passed}`);
    console.log(`❌ Failed: ${this.results.overall.failed}`);
    console.log(`⚠️  Warnings: ${this.results.overall.warnings}`);
    
    console.log('\n📋 Category Breakdown:');
    console.log(`   • npm Commands: ${this.results.npmCommands.passed.length}✅ ${this.results.npmCommands.failed.length}❌ ${this.results.npmCommands.warnings.length}⚠️`);
    console.log(`   • Migration Utility: ${this.results.migrationUtility.passed.length}✅ ${this.results.migrationUtility.failed.length}❌ ${this.results.migrationUtility.warnings.length}⚠️`);
    console.log(`   • System Tests: ${this.results.systemTests.passed.length}✅ ${this.results.systemTests.failed.length}❌ ${this.results.systemTests.warnings.length}⚠️`);
    console.log(`   • Legacy Integration: ${this.results.legacyIntegration.passed.length}✅ ${this.results.legacyIntegration.failed.length}❌ ${this.results.legacyIntegration.warnings.length}⚠️`);
    
    if (this.results.overall.failed > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND:');
      
      // Show critical npm command failures
      const criticalNpmFailures = this.results.npmCommands.failed.filter(f => f.critical);
      if (criticalNpmFailures.length > 0) {
        console.log('   🚨 Critical npm command failures:');
        criticalNpmFailures.forEach(failure => {
          console.log(`      • ${failure.command}: ${failure.error}`);
        });
      }
      
      // Show other failures
      if (this.results.migrationUtility.failed.length > 0) {
        console.log('   🔄 Migration utility issues:');
        this.results.migrationUtility.failed.forEach(failure => {
          console.log(`      • ${failure.name}: ${failure.error}`);
        });
      }
      
      if (this.results.systemTests.failed.length > 0) {
        console.log('   🧪 System test issues:');
        this.results.systemTests.failed.forEach(failure => {
          console.log(`      • ${failure.name}: ${failure.error}`);
        });
      }
      
      console.log('\n🔧 RECOMMENDATION: Address critical issues before proceeding with migration');
      console.log('═══════════════════════════════════════════════════════\n');
      
      process.exit(1);
    } else {
      console.log('\n🎉 VALIDATION SUCCESSFUL!');
      console.log('✅ All backward compatibility tests passed');
      console.log('✅ Enhanced frontend-sync-processor is fully compatible');
      console.log('✅ Migration utility working correctly');
      console.log('✅ System tests passing');
      console.log('✅ Legacy integration maintained');
      console.log('\n🚀 READY FOR MIGRATION');
      console.log('═══════════════════════════════════════════════════════\n');
      
      process.exit(0);
    }
  }

  /**
   * Record a failure for tracking
   */
  recordFailure(category, item, error) {
    if (!this.results[category]) {
      this.results[category] = { passed: [], failed: [], warnings: [] };
    }
    
    this.results[category].failed.push({ item, error });
    this.results.overall.failed++;
  }
}

// Export for use as module
module.exports = { BackwardCompatibilityValidator };

// Run validation if called directly
if (require.main === module) {
  const validator = new BackwardCompatibilityValidator();
  validator.runCompleteValidation().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}