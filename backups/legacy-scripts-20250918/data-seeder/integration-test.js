#!/usr/bin/env node

/**
 * Integration test for all data management utilities
 * This script validates that all utilities work together correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationTest {
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

  async runCommand(command, description) {
    this.log(`Testing: ${description}`, 'info');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 30000,
        cwd: __dirname
      });
      
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

  async testUtilityHelp() {
    this.log('Testing utility help commands...', 'info');
    
    const utilities = [
      { cmd: 'node data-manager.js', desc: 'Data Manager help' },
      { cmd: 'node selective-seeder.js', desc: 'Selective Seeder help' },
      { cmd: 'node data-validator.js', desc: 'Data Validator help' },
      { cmd: 'node data-reset.js', desc: 'Data Reset help' },
      { cmd: 'node test-utilities.js', desc: 'Test Utilities help' }
    ];

    for (const utility of utilities) {
      await this.runCommand(utility.cmd, utility.desc);
    }
  }

  async testListCommands() {
    this.log('Testing list commands...', 'info');
    
    const listCommands = [
      { cmd: 'node selective-seeder.js list', desc: 'List test scenarios' },
      { cmd: 'node data-reset.js list', desc: 'List reset states' }
    ];

    for (const command of listCommands) {
      await this.runCommand(command.cmd, command.desc);
    }
  }

  async testValidationCommands() {
    this.log('Testing validation commands...', 'info');
    
    // Test file validation if test data exists
    const testDataDir = path.join(__dirname, '..', 'test-data');
    if (fs.existsSync(testDataDir)) {
      await this.runCommand('node data-validator.js files', 'Validate test data files');
    } else {
      this.log('Test data directory not found, skipping file validation', 'warning');
      this.stats.skipped++;
    }

    // Test simple validator
    await this.runCommand('node simple-validator.js', 'Simple validator');
  }

  async testCrossUtilityIntegration() {
    this.log('Testing cross-utility integration...', 'info');
    
    // Test that utilities can find each other's modules
    const integrationTests = [
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
        cmd: 'node -e "const TestUtilities = require(\'./test-utilities\'); console.log(\'TestUtilities loaded successfully\')"',
        desc: 'Test Utilities module loading'
      }
    ];

    for (const test of integrationTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testConfigurationValidation() {
    this.log('Testing configuration validation...', 'info');
    
    // Test that all required environment variables are handled
    const configTests = [
      {
        cmd: 'node -e "const AWS = require(\'aws-sdk\'); console.log(\'AWS SDK configuration:\', AWS.config.region || \'default\')"',
        desc: 'AWS SDK configuration'
      },
      {
        cmd: 'node -e "console.log(\'Environment check:\', process.env.NODE_ENV || \'development\')"',
        desc: 'Environment variable handling'
      }
    ];

    for (const test of configTests) {
      await this.runCommand(test.cmd, test.desc);
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...', 'info');
    
    // Test utilities with invalid arguments
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
      }
    ];

    for (const test of errorTests) {
      try {
        execSync(test.cmd, { 
          encoding: 'utf8',
          timeout: 10000,
          cwd: __dirname,
          stdio: 'pipe'
        });
        
        // If we get here, the command didn't fail as expected
        if (test.expectError) {
          this.results.push({
            command: test.cmd,
            description: test.desc,
            status: 'FAIL',
            error: 'Expected command to fail but it succeeded'
          });
          this.stats.failed++;
          this.log(`✗ ${test.desc}: Expected error but command succeeded`, 'error');
        }
        
      } catch (error) {
        if (test.expectError) {
          this.results.push({
            command: test.cmd,
            description: test.desc,
            status: 'PASS',
            output: 'Command failed as expected'
          });
          this.stats.passed++;
          this.log(`✓ ${test.desc}: Error handled correctly`, 'success');
        } else {
          this.results.push({
            command: test.cmd,
            description: test.desc,
            status: 'FAIL',
            error: error.message
          });
          this.stats.failed++;
          this.log(`✗ ${test.desc}: ${error.message}`, 'error');
        }
      }
    }
  }

  async runAllTests() {
    this.log('Starting comprehensive integration test...', 'info');
    
    await this.testUtilityHelp();
    await this.testListCommands();
    await this.testValidationCommands();
    await this.testCrossUtilityIntegration();
    await this.testConfigurationValidation();
    await this.testErrorHandling();
    
    this.printSummary();
    this.saveResults();
    
    return this.stats.failed === 0;
  }

  printSummary() {
    this.log('Integration Test Summary:', 'info');
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
        .forEach(result => {
          console.log(`  • ${result.description}: ${result.error || 'Unknown error'}`);
        });
    }
  }

  saveResults() {
    const results = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      results: this.results
    };

    const filename = `integration-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    this.log(`Test results saved to: ${filename}`, 'info');
  }
}

// CLI interface
async function main() {
  const integrationTest = new IntegrationTest();
  
  try {
    const success = await integrationTest.runAllTests();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = IntegrationTest;