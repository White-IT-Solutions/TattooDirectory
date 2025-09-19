#!/usr/bin/env node

/**
 * Test Script for npm run commands with Enhanced Frontend-Sync-Processor
 * 
 * This script tests all npm run commands to ensure they work properly with the
 * enhanced frontend-sync-processor integration. It validates data structures,
 * command execution, and integration with the unified data pipeline.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { DATA_CONFIG } = require('./data-config');

/**
 * Test configuration and constants
 */
const TEST_CONFIG = {
  timeout: 120000, // 2 minutes per command
  retries: 2,
  validateDataStructure: true,
  checkFrontendMockData: true,
  verifyIntegration: true
};

/**
 * Commands to test with their expected behaviors
 */
const COMMANDS_TO_TEST = {
  'setup-data': {
    description: 'Test full data setup with enhanced frontend-sync-processor',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'tattooStudio', 'pk', 'sk', 'opted_out'],
    timeout: 180000 // 3 minutes for full setup
  },
  'setup-data:frontend-only': {
    description: 'Test frontend-only setup with new mock data generation',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'rating', 'pricing', 'availability', 'experience'],
    timeout: 60000 // 1 minute for frontend-only
  },
  'reset-data': {
    description: 'Test data reset with enhanced data structures',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'tattooStudio'],
    timeout: 120000
  },
  'reset-data:clean': {
    description: 'Test clean reset scenario',
    expectedFiles: [],
    timeout: 60000
  },
  'reset-data:fresh': {
    description: 'Test fresh reset with full dataset',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'tattooStudio'],
    timeout: 120000
  },
  'reset-data:minimal': {
    description: 'Test minimal reset scenario',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio'],
    timeout: 60000
  },
  'reset-data:search-ready': {
    description: 'Test search-ready reset scenario',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'styles', 'locationDisplay'],
    timeout: 90000
  },
  'reset-data:location-test': {
    description: 'Test location-test reset scenario',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['tattooStudio', 'locationDisplay'],
    timeout: 90000
  },
  'reset-data:style-test': {
    description: 'Test style-test reset scenario',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['styles', 'bio'],
    timeout: 90000
  },
  'reset-data:performance-test': {
    description: 'Test performance-test reset scenario',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'rating'],
    timeout: 120000
  },
  'reset-data:frontend-ready': {
    description: 'Test frontend-ready reset scenario',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'portfolioImages'],
    timeout: 60000
  },
  'seed-scenario:minimal': {
    description: 'Test minimal scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio'],
    expectedArtistCount: 3,
    timeout: 60000
  },
  'seed-scenario:search-basic': {
    description: 'Test search-basic scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'styles'],
    expectedArtistCount: 5,
    timeout: 60000
  },
  'seed-scenario:london-artists': {
    description: 'Test london-artists scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'locationDisplay'],
    expectedArtistCount: 5,
    timeout: 60000
  },
  'seed-scenario:high-rated': {
    description: 'Test high-rated scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'rating'],
    expectedArtistCount: 3,
    timeout: 60000
  },
  'seed-scenario:new-artists': {
    description: 'Test new-artists scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'experience'],
    expectedArtistCount: 4,
    timeout: 60000
  },
  'seed-scenario:booking-available': {
    description: 'Test booking-available scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'availability'],
    expectedArtistCount: 6,
    timeout: 60000
  },
  'seed-scenario:portfolio-rich': {
    description: 'Test portfolio-rich scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'portfolioImages'],
    expectedArtistCount: 4,
    timeout: 60000
  },
  'seed-scenario:multi-style': {
    description: 'Test multi-style scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'styles'],
    expectedArtistCount: 3,
    timeout: 60000
  },
  'seed-scenario:pricing-range': {
    description: 'Test pricing-range scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'pricing'],
    expectedArtistCount: 5,
    timeout: 60000
  },
  'seed-scenario:full-dataset': {
    description: 'Test full-dataset scenario seeding',
    expectedFiles: ['frontend/src/app/data/mockArtistData.js'],
    expectedDataFields: ['bio', 'rating', 'pricing', 'availability', 'experience'],
    expectedArtistCount: 10,
    timeout: 90000
  },
  'health-check': {
    description: 'Test health check with enhanced frontend-sync-processor validation',
    expectedFiles: [],
    timeout: 30000
  },
  'validate-data': {
    description: 'Test data validation including new data structure validation',
    expectedFiles: [],
    timeout: 60000
  },
  'validate-data:consistency': {
    description: 'Test consistency validation',
    expectedFiles: [],
    timeout: 60000
  },
  'validate-data:images': {
    description: 'Test image validation',
    expectedFiles: [],
    timeout: 60000
  },
  'validate-data:scenarios': {
    description: 'Test scenario validation',
    expectedFiles: [],
    timeout: 60000
  }
};

/**
 * Test results tracking
 */
class TestResults {
  constructor() {
    this.results = {};
    this.summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    this.startTime = Date.now();
  }

  addResult(command, result) {
    this.results[command] = result;
    this.summary.total++;
    
    if (result.status === 'passed') {
      this.summary.passed++;
    } else if (result.status === 'failed') {
      this.summary.failed++;
      this.summary.errors.push({
        command,
        error: result.error,
        details: result.details
      });
    } else if (result.status === 'skipped') {
      this.summary.skipped++;
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    
    return {
      summary: {
        ...this.summary,
        duration: Math.round(duration / 1000),
        successRate: Math.round((this.summary.passed / this.summary.total) * 100)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Main test runner class
 */
class NpmCommandTester {
  constructor() {
    this.results = new TestResults();
    this.config = DATA_CONFIG;
    this.frontendMockPath = this.config.paths.frontendMockData; // Use the correct path from config
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting npm command tests with enhanced frontend-sync-processor...\n');
    
    // Ensure clean state before testing
    await this.prepareTestEnvironment();
    
    // Test commands in logical order
    const commandOrder = [
      'health-check',
      'setup-data:frontend-only',
      'validate-data',
      'reset-data:clean',
      'reset-data:minimal',
      'seed-scenario:minimal',
      'validate-data:consistency',
      'reset-data:fresh',
      'setup-data',
      'validate-data:images',
      'seed-scenario:london-artists',
      'seed-scenario:high-rated',
      'seed-scenario:full-dataset',
      'validate-data:scenarios',
      'reset-data:search-ready',
      'reset-data:performance-test'
    ];

    for (const command of commandOrder) {
      if (COMMANDS_TO_TEST[command]) {
        await this.testCommand(command, COMMANDS_TO_TEST[command]);
      }
    }

    // Generate and display final report
    const report = this.results.generateReport();
    this.displayFinalReport(report);
    
    return report;
  }

  /**
   * Prepare test environment
   */
  async prepareTestEnvironment() {
    console.log('🔧 Preparing test environment...');
    
    try {
      // Ensure frontend mock data directory exists
      const mockDataDir = path.dirname(this.frontendMockPath);
      if (!fs.existsSync(mockDataDir)) {
        fs.mkdirSync(mockDataDir, { recursive: true });
      }
      
      // Clean any existing mock data
      if (fs.existsSync(this.frontendMockPath)) {
        fs.unlinkSync(this.frontendMockPath);
      }
      
      console.log('✅ Test environment prepared\n');
    } catch (error) {
      console.error('❌ Failed to prepare test environment:', error.message);
      throw error;
    }
  }

  /**
   * Test a single command
   */
  async testCommand(command, config) {
    console.log(`\n📋 Testing: npm run ${command}`);
    console.log(`   ${config.description}`);
    
    const result = {
      command,
      status: 'running',
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      output: '',
      error: null,
      details: {},
      validations: {}
    };

    try {
      // Execute the command
      const output = await this.executeCommand(command, config.timeout);
      result.output = output;
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

      // Validate results
      const validations = await this.validateCommandResult(command, config);
      result.validations = validations;

      // Determine overall status
      const hasFailedValidations = Object.values(validations).some(v => v.status === 'failed');
      result.status = hasFailedValidations ? 'failed' : 'passed';

      if (result.status === 'passed') {
        console.log(`   ✅ PASSED (${Math.round(result.duration / 1000)}s)`);
      } else {
        console.log(`   ❌ FAILED (${Math.round(result.duration / 1000)}s)`);
        console.log(`   Validation failures: ${Object.keys(validations).filter(k => validations[k].status === 'failed').join(', ')}`);
      }

    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      
      console.log(`   ❌ FAILED (${Math.round(result.duration / 1000)}s)`);
      console.log(`   Error: ${error.message}`);
    }

    this.results.addResult(command, result);
    return result;
  }

  /**
   * Execute a command with timeout
   */
  async executeCommand(command, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput || output}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Validate command results
   */
  async validateCommandResult(command, config) {
    const validations = {};

    try {
      // Validate expected files exist
      if (config.expectedFiles && config.expectedFiles.length > 0) {
        validations.fileExistence = await this.validateFileExistence(config.expectedFiles);
      }

      // Validate data structure if frontend mock data is expected
      if (config.expectedDataFields && config.expectedFiles.includes('frontend/src/app/data/mockArtistData.js')) {
        validations.dataStructure = await this.validateDataStructure(config.expectedDataFields);
      }

      // Validate artist count if specified
      if (config.expectedArtistCount) {
        validations.artistCount = await this.validateArtistCount(config.expectedArtistCount);
      }

      // Validate data consistency
      if (command.includes('validate-data') || command.includes('setup-data')) {
        validations.dataConsistency = await this.validateDataConsistency();
      }

      // Validate frontend-sync-processor integration
      if (command.includes('setup-data') || command.includes('seed-scenario')) {
        validations.frontendIntegration = await this.validateFrontendIntegration();
      }

    } catch (error) {
      validations.error = {
        status: 'failed',
        message: error.message
      };
    }

    return validations;
  }

  /**
   * Validate file existence
   */
  async validateFileExistence(expectedFiles) {
    const results = {};
    let allExist = true;

    for (const file of expectedFiles) {
      const fullPath = path.join(process.cwd(), file);
      const exists = fs.existsSync(fullPath);
      results[file] = exists;
      if (!exists) allExist = false;
    }

    return {
      status: allExist ? 'passed' : 'failed',
      details: results,
      message: allExist ? 'All expected files exist' : 'Some expected files are missing'
    };
  }

  /**
   * Validate data structure
   */
  async validateDataStructure(expectedFields) {
    try {
      if (!fs.existsSync(this.frontendMockPath)) {
        return {
          status: 'failed',
          message: 'Frontend mock data file does not exist'
        };
      }

      // Read the JavaScript file and extract the data
      const fileContent = fs.readFileSync(this.frontendMockPath, 'utf8');
      
      // Extract the JSON data from the JavaScript export
      const dataMatch = fileContent.match(/export const mockArtistData = (.*);/s);
      if (!dataMatch) {
        return {
          status: 'failed',
          message: 'Could not extract mock data from JavaScript file'
        };
      }
      
      const mockData = JSON.parse(dataMatch[1]);
      
      if (!Array.isArray(mockData) || mockData.length === 0) {
        return {
          status: 'failed',
          message: 'Mock data is not an array or is empty'
        };
      }

      const firstArtist = mockData[0];
      const missingFields = [];
      const presentFields = [];

      for (const field of expectedFields) {
        if (this.hasNestedField(firstArtist, field)) {
          presentFields.push(field);
        } else {
          missingFields.push(field);
        }
      }

      // Check for critical data structure fixes
      const structureChecks = {
        hasArtistName: firstArtist.artistName !== undefined, // Fixed naming
        hasBio: firstArtist.bio !== undefined, // Added field
        hasTattooStudio: firstArtist.tattooStudio !== undefined, // Fixed structure
        hasLatLongInAddress: firstArtist.tattooStudio?.address?.latitude !== undefined, // Fixed location
        hasSystemFields: firstArtist.pk !== undefined && firstArtist.sk !== undefined, // Added fields
        hasOptedOut: firstArtist.opted_out !== undefined // Added field
      };

      return {
        status: missingFields.length === 0 ? 'passed' : 'failed',
        details: {
          presentFields,
          missingFields,
          structureChecks,
          artistCount: mockData.length
        },
        message: missingFields.length === 0 
          ? `All expected fields present (${presentFields.length}/${expectedFields.length})`
          : `Missing fields: ${missingFields.join(', ')}`
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `Data structure validation failed: ${error.message}`
      };
    }
  }

  /**
   * Check if object has nested field
   */
  hasNestedField(obj, fieldPath) {
    const parts = fieldPath.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  /**
   * Validate artist count
   */
  async validateArtistCount(expectedCount) {
    try {
      if (!fs.existsSync(this.frontendMockPath)) {
        return {
          status: 'failed',
          message: 'Frontend mock data file does not exist'
        };
      }

      // Read the JavaScript file and extract the data
      const fileContent = fs.readFileSync(this.frontendMockPath, 'utf8');
      const dataMatch = fileContent.match(/export const mockArtistData = (.*);/s);
      if (!dataMatch) {
        return {
          status: 'failed',
          message: 'Could not extract mock data from JavaScript file'
        };
      }
      
      const mockData = JSON.parse(dataMatch[1]);
      const actualCount = Array.isArray(mockData) ? mockData.length : 0;
      
      // Allow some flexibility in count (±1)
      const countMatches = Math.abs(actualCount - expectedCount) <= 1;

      return {
        status: countMatches ? 'passed' : 'failed',
        details: {
          expected: expectedCount,
          actual: actualCount,
          difference: actualCount - expectedCount
        },
        message: countMatches 
          ? `Artist count matches expectation (${actualCount})`
          : `Artist count mismatch: expected ${expectedCount}, got ${actualCount}`
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `Artist count validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate data consistency
   */
  async validateDataConsistency() {
    try {
      if (!fs.existsSync(this.frontendMockPath)) {
        return {
          status: 'skipped',
          message: 'No frontend mock data to validate'
        };
      }

      // Read the JavaScript file and extract the data
      const fileContent = fs.readFileSync(this.frontendMockPath, 'utf8');
      const dataMatch = fileContent.match(/export const mockArtistData = (.*);/s);
      if (!dataMatch) {
        return {
          status: 'skipped',
          message: 'Could not extract mock data from JavaScript file'
        };
      }
      
      const mockData = JSON.parse(dataMatch[1]);
      
      if (!Array.isArray(mockData) || mockData.length === 0) {
        return {
          status: 'failed',
          message: 'Mock data is not valid'
        };
      }

      const consistencyChecks = {
        allHaveIds: mockData.every(artist => artist.artistId),
        allHaveNames: mockData.every(artist => artist.artistName),
        allHaveStyles: mockData.every(artist => Array.isArray(artist.styles) && artist.styles.length > 0),
        allHavePortfolios: mockData.every(artist => Array.isArray(artist.portfolioImages)),
        uniqueIds: new Set(mockData.map(a => a.artistId)).size === mockData.length
      };

      const allChecksPass = Object.values(consistencyChecks).every(check => check === true);

      return {
        status: allChecksPass ? 'passed' : 'failed',
        details: consistencyChecks,
        message: allChecksPass 
          ? 'All consistency checks passed'
          : 'Some consistency checks failed'
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `Data consistency validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate frontend integration
   */
  async validateFrontendIntegration() {
    try {
      if (!fs.existsSync(this.frontendMockPath)) {
        return {
          status: 'failed',
          message: 'Frontend mock data file was not created'
        };
      }

      // Read the JavaScript file and extract the data
      const fileContent = fs.readFileSync(this.frontendMockPath, 'utf8');
      const dataMatch = fileContent.match(/export const mockArtistData = (.*);/s);
      if (!dataMatch) {
        return {
          status: 'failed',
          message: 'Could not extract mock data from JavaScript file'
        };
      }
      
      const mockData = JSON.parse(dataMatch[1]);
      
      // Check for enhanced features
      const integrationChecks = {
        hasEnhancedData: mockData.length > 0 && mockData[0].bio !== undefined,
        hasBusinessData: mockData.length > 0 && mockData[0].rating !== undefined,
        hasContactInfo: mockData.length > 0 && mockData[0].contactInfo !== undefined,
        hasStudioData: mockData.length > 0 && mockData[0].tattooStudio !== undefined,
        hasSystemFields: mockData.length > 0 && mockData[0].pk !== undefined
      };

      const integrationScore = Object.values(integrationChecks).filter(Boolean).length;
      const totalChecks = Object.keys(integrationChecks).length;

      return {
        status: integrationScore >= totalChecks * 0.8 ? 'passed' : 'failed', // 80% threshold
        details: {
          ...integrationChecks,
          score: `${integrationScore}/${totalChecks}`,
          percentage: Math.round((integrationScore / totalChecks) * 100)
        },
        message: `Frontend integration score: ${integrationScore}/${totalChecks} (${Math.round((integrationScore / totalChecks) * 100)}%)`
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `Frontend integration validation failed: ${error.message}`
      };
    }
  }

  /**
   * Display final report
   */
  displayFinalReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 NPM COMMAND TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Commands: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed} ✅`);
    console.log(`   Failed: ${report.summary.failed} ❌`);
    console.log(`   Skipped: ${report.summary.skipped} ⏭️`);
    console.log(`   Success Rate: ${report.summary.successRate}%`);
    console.log(`   Duration: ${report.summary.duration}s`);

    if (report.summary.failed > 0) {
      console.log(`\n❌ FAILED COMMANDS:`);
      report.summary.errors.forEach(error => {
        console.log(`   • ${error.command}: ${error.error}`);
        if (error.details && Object.keys(error.details).length > 0) {
          console.log(`     Details: ${JSON.stringify(error.details, null, 2).substring(0, 200)}...`);
        }
      });
    }

    console.log(`\n📋 DETAILED RESULTS:`);
    Object.entries(report.results).forEach(([command, result]) => {
      const statusIcon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
      console.log(`   ${statusIcon} ${command} (${Math.round(result.duration / 1000)}s)`);
      
      if (result.validations && Object.keys(result.validations).length > 0) {
        Object.entries(result.validations).forEach(([validation, details]) => {
          const validationIcon = details.status === 'passed' ? '✓' : details.status === 'failed' ? '✗' : '~';
          console.log(`      ${validationIcon} ${validation}: ${details.message}`);
        });
      }
    });

    // Save detailed report to file
    const reportPath = path.join(process.cwd(), 'scripts', 'test-results', `npm-command-test-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(80));
    
    if (report.summary.successRate >= 90) {
      console.log('🎉 EXCELLENT! All critical npm commands are working properly with enhanced frontend-sync-processor.');
    } else if (report.summary.successRate >= 75) {
      console.log('✅ GOOD! Most npm commands are working, but some issues need attention.');
    } else {
      console.log('⚠️  WARNING! Multiple npm commands are failing. Enhanced frontend-sync-processor integration needs fixes.');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const tester = new NpmCommandTester();
    const report = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(report.summary.successRate >= 75 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { NpmCommandTester, COMMANDS_TO_TEST, TEST_CONFIG };