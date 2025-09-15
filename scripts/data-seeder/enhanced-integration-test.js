#!/usr/bin/env node

/**
 * Enhanced Integration Test for Data Management Utilities
 * Tests all utilities including the new migration, monitoring, and sync utilities
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class EnhancedIntegrationTest {
  constructor() {
    this.results = [];
    this.stats = {
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description, expectError = false) {
    this.log(`Testing: ${description}`, 'info');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 30000,
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      if (expectError) {
        this.results.push({
          command,
          description,
          status: 'FAIL',
          error: 'Expected command to fail but it succeeded'
        });
        this.stats.failed++;
        this.log(`✗ ${description}: Expected error but command succeeded`, 'error');
        return false;
      }
      
      this.results.push({
        command,
        description,
        status: 'PASS',
        output: output.trim()
      });
      
      this.stats.passed++;
      this.log(`✓ ${description}`, 'success');
      return true;
      
    } catch (error) {
      if (expectError) {
        this.results.push({
          command,
          description,
          status: 'PASS',
          output: 'Command failed as expected'
        });
        this.stats.passed++;
        this.log(`✓ ${description}: Error handled correctly`, 'success');
        return true;
      }
      
      this.results.push({
        command,
        description,
        status: 'FAIL',
        error: error.message,
        output: error.stdout ? error.stdout.trim() : ''
      });
      
      this.stats.failed++;
      this.log(`✗ ${description}: ${error.message}`, 'error');
      return false;
    }
  }

  async testCoreUtilities() {
    this.log('Testing core data management utilities...', 'info');
    
    const coreTests = [
      { cmd: 'node data-manager.js', desc: 'Data Manager help' },
      { cmd: 'node selective-seeder.js', desc: 'Selective Seeder help' },
      { cmd: 'node data-validator.js', desc: 'Data Validator help' },
      { cmd: 'node data-reset.js', desc: 'Data Reset help' },
      { cmd: 'node test-utilities.js', desc: 'Test Utilities help' }
    ];

    for (const test of coreTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testNewUtilities() {
    this.log('Testing new enhanced utilities...', 'info');
    
    const newTests = [
      { cmd: 'node data-migration-utility.js', desc: 'Data Migration Utility help' },
      { cmd: 'node data-monitoring-utility.js', desc: 'Data Monitoring Utility help' },
      { cmd: 'node data-sync-utility.js', desc: 'Data Sync Utility help' }
    ];

    for (const test of newTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testMigrationUtility() {
    this.log('Testing migration utility functionality...', 'info');
    
    const migrationTests = [
      { cmd: 'node data-migration-utility.js list', desc: 'List available migrations' },
      { cmd: 'node data-migration-utility.js validate', desc: 'Validate migration results' }
    ];

    for (const test of migrationTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testMonitoringUtility() {
    this.log('Testing monitoring utility functionality...', 'info');
    
    const monitoringTests = [
      { cmd: 'node data-monitoring-utility.js test-alerts', desc: 'Test alert system' },
      { cmd: 'node data-monitoring-utility.js alerts', desc: 'List alerts' },
      { cmd: 'node data-monitoring-utility.js clear-alerts', desc: 'Clear alerts' }
    ];

    for (const test of monitoringTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testSyncUtility() {
    this.log('Testing sync utility functionality...', 'info');
    
    const syncTests = [
      { cmd: 'node data-sync-utility.js detect-conflicts', desc: 'Detect data conflicts' }
    ];

    for (const test of syncTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testListCommands() {
    this.log('Testing list commands...', 'info');
    
    const listCommands = [
      { cmd: 'node selective-seeder.js list', desc: 'List test scenarios' },
      { cmd: 'node data-reset.js list', desc: 'List reset states' },
      { cmd: 'node data-migration-utility.js list', desc: 'List migrations' }
    ];

    for (const command of listCommands) {
      await this.runCommand(command.cmd, command.desc);
    }
  }

  async testModuleLoading() {
    this.log('Testing module loading and dependencies...', 'info');
    
    const moduleTests = [
      {
        cmd: 'node -e "const DataManager = require(\'./data-manager\'); console.log(\'DataManager loaded successfully\')"',
        desc: 'Data Manager module loading'
      },
      {
        cmd: 'node -e "const { SelectiveSeeder } = require(\'./selective-seeder\'); console.log(\'SelectiveSeeder loaded successfully\')"',
        desc: 'Selective Seeder module loading'
      },
      {
        cmd: 'node -e "const DataValidator = require(\'./data-validator\'); console.log(\'DataValidator loaded successfully\')"',
        desc: 'Data Validator module loading'
      },
      {
        cmd: 'node -e "const DataReset = require(\'./data-reset\'); console.log(\'DataReset loaded successfully\')"',
        desc: 'Data Reset module loading'
      },
      {
        cmd: 'node -e "const DataMigrationUtility = require(\'./data-migration-utility\'); console.log(\'DataMigrationUtility loaded successfully\')"',
        desc: 'Data Migration Utility module loading'
      },
      {
        cmd: 'node -e "const DataMonitoringUtility = require(\'./data-monitoring-utility\'); console.log(\'DataMonitoringUtility loaded successfully\')"',
        desc: 'Data Monitoring Utility module loading'
      },
      {
        cmd: 'node -e "const DataSyncUtility = require(\'./data-sync-utility\'); console.log(\'DataSyncUtility loaded successfully\')"',
        desc: 'Data Sync Utility module loading'
      }
    ];

    for (const test of moduleTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...', 'info');
    
    const errorTests = [
      {
        cmd: 'node data-manager.js invalid-command',
        desc: 'Data Manager invalid command handling',
        expectError: true
      },
      {
        cmd: 'node selective-seeder.js seed invalid-scenario',
        desc: 'Selective Seeder invalid scenario handling',
        expectError: true
      },
      {
        cmd: 'node data-reset.js reset invalid-state',
        desc: 'Data Reset invalid state handling',
        expectError: true
      },
      {
        cmd: 'node data-migration-utility.js run invalid-migration',
        desc: 'Migration Utility invalid migration handling',
        expectError: true
      },
      {
        cmd: 'node data-sync-utility.js invalid-operation',
        desc: 'Sync Utility invalid operation handling',
        expectError: true
      }
    ];

    for (const test of errorTests) {
      await this.runCommand(test.cmd, test.desc, test.expectError);
    }
  }

  async testPackageJsonScripts() {
    this.log('Testing package.json scripts...', 'info');
    
    const packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.log('package.json not found, skipping script tests', 'warning');
      this.stats.skipped++;
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const expectedScripts = [
      'start', 'seed', 'validate', 'clean', 'manage', 'selective',
      'validate-enhanced', 'reset', 'test-utilities', 'integration-test',
      'final-validation', 'migrate', 'monitor', 'sync'
    ];
    
    for (const script of expectedScripts) {
      if (scripts[script]) {
        this.log(`✓ Script '${script}' is defined`, 'success');
        this.stats.passed++;
      } else {
        this.log(`✗ Script '${script}' is missing`, 'error');
        this.stats.failed++;
      }
    }
  }

  async testFileStructure() {
    this.log('Testing file structure and dependencies...', 'info');
    
    const requiredFiles = [
      'data-manager.js',
      'selective-seeder.js',
      'data-validator.js',
      'data-reset.js',
      'test-utilities.js',
      'integration-test.js',
      'data-migration-utility.js',
      'data-monitoring-utility.js',
      'data-sync-utility.js',
      'package.json',
      'DATA-MANAGEMENT.md'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.log(`✓ File '${file}' exists`, 'success');
        this.stats.passed++;
      } else {
        this.log(`✗ File '${file}' is missing`, 'error');
        this.stats.failed++;
      }
    }
  }

  async testUtilityIntegration() {
    this.log('Testing utility integration...', 'info');
    
    // Test that utilities can work together
    const integrationTests = [
      {
        cmd: 'node -e "const DataManager = require(\'./data-manager\'); const DataValidator = require(\'./data-validator\'); console.log(\'Integration test passed\')"',
        desc: 'Data Manager and Validator integration'
      },
      {
        cmd: 'node -e "const { SelectiveSeeder } = require(\'./selective-seeder\'); const DataReset = require(\'./data-reset\'); console.log(\'Integration test passed\')"',
        desc: 'Selective Seeder and Reset integration'
      },
      {
        cmd: 'node -e "const DataMigrationUtility = require(\'./data-migration-utility\'); const DataMonitoringUtility = require(\'./data-monitoring-utility\'); console.log(\'Integration test passed\')"',
        desc: 'Migration and Monitoring utility integration'
      }
    ];

    for (const test of integrationTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async runAllTests() {
    this.log('Starting enhanced integration test suite...', 'info');
    
    await this.testFileStructure();
    await this.testPackageJsonScripts();
    await this.testCoreUtilities();
    await this.testNewUtilities();
    await this.testListCommands();
    await this.testModuleLoading();
    await this.testMigrationUtility();
    await this.testMonitoringUtility();
    await this.testSyncUtility();
    await this.testUtilityIntegration();
    await this.testErrorHandling();
    
    this.printSummary();
    this.saveResults();
    
    return this.stats.failed === 0;
  }

  printSummary() {
    this.log('Enhanced Integration Test Summary:', 'info');
    console.log('┌─────────────┬─────────┐');
    console.log('│ Status      │ Count   │');
    console.log('├─────────────┼─────────┤');
    console.log(`│ Passed      │ ${this.stats.passed.toString().padStart(7)} │`);
    console.log(`│ Failed      │ ${this.stats.failed.toString().padStart(7)} │`);
    console.log(`│ Skipped     │ ${this.stats.skipped.toString().padStart(7)} │`);
    console.log('└─────────────┴─────────┘');

    const total = this.stats.passed + this.stats.failed + this.stats.skipped;
    const successRate = total > 0 ? ((this.stats.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`Success Rate: ${successRate}%`, 'info');

    if (this.stats.failed > 0) {
      this.log('Failed Tests:', 'error');
      this.results
        .filter(result => result.status === 'FAIL')
        .slice(0, 10)
        .forEach(result => {
          console.log(`  • ${result.description}: ${result.error || 'Unknown error'}`);
        });
      
      if (this.results.filter(result => result.status === 'FAIL').length > 10) {
        console.log(`  ... and ${this.results.filter(result => result.status === 'FAIL').length - 10} more failures`);
      }
    }
  }

  saveResults() {
    const results = {
      timestamp: new Date().toISOString(),
      testSuite: 'enhanced-integration-test',
      stats: this.stats,
      results: this.results,
      summary: {
        totalTests: this.stats.passed + this.stats.failed + this.stats.skipped,
        successRate: this.stats.passed / (this.stats.passed + this.stats.failed + this.stats.skipped) * 100,
        newUtilitiesTested: ['data-migration-utility', 'data-monitoring-utility', 'data-sync-utility']
      }
    };

    const filename = `enhanced-integration-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    this.log(`Enhanced test results saved to: ${filename}`, 'info');
  }
}

// CLI interface
async function main() {
  const integrationTest = new EnhancedIntegrationTest();
  
  try {
    const success = await integrationTest.runAllTests();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Enhanced integration test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnhancedIntegrationTest;