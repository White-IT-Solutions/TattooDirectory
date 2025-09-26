#!/usr/bin/env node

/**
 * Comprehensive Pipeline Integration Test Runner
 * 
 * Executes all pipeline integration tests and generates detailed reports
 * for validating the enhanced frontend-sync-processor integration with
 * the unified data pipeline.
 * 
 * Requirements: 14.6, 14.7, 14.8, 14.9
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class IntegrationTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Pipeline Integration Tests',
        file: 'pipeline-integration.test.js',
        description: 'Tests integration between unified-data-manager, pipeline-engine, state-manager, and health-monitor'
      },
      {
        name: 'Enhanced Frontend Sync Integration Tests',
        file: 'frontend-sync-integration.test.js',
        description: 'Tests enhanced frontend-sync-processor integration with business data generation'
      },
      {
        name: 'Cross-Service Integration Tests',
        file: 'cross-service-integration.test.js',
        description: 'Tests data synchronization and workflow integration across all services'
      }
    ];
    
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      suiteResults: [],
      errors: [],
      coverage: null
    };
  }

  /**
   * Run all integration test suites
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Pipeline Integration Tests');
    console.log('====================================================\n');

    try {
      // Ensure test environment is ready
      await this.prepareTestEnvironment();

      // Run each test suite
      for (const suite of this.testSuites) {
        console.log(`📋 Running: ${suite.name}`);
        console.log(`   ${suite.description}\n`);

        const suiteResult = await this.runTestSuite(suite);
        this.results.suiteResults.push(suiteResult);

        // Update totals
        this.results.totalTests += suiteResult.totalTests;
        this.results.passedTests += suiteResult.passedTests;
        this.results.failedTests += suiteResult.failedTests;
        this.results.skippedTests += suiteResult.skippedTests;

        if (suiteResult.errors.length > 0) {
          this.results.errors.push(...suiteResult.errors);
        }

        console.log(`   ✅ ${suiteResult.passedTests} passed, ❌ ${suiteResult.failedTests} failed, ⏭️  ${suiteResult.skippedTests} skipped\n`);
      }

      // Generate coverage report if requested
      if (process.argv.includes('--coverage')) {
        await this.generateCoverageReport();
      }

      // Generate final report
      this.results.endTime = new Date();
      await this.generateFinalReport();

      // Exit with appropriate code
      process.exit(this.results.failedTests > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Integration test runner failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Prepare test environment
   */
  async prepareTestEnvironment() {
    console.log('🔧 Preparing test environment...');

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Clean up any existing test artifacts
    const testStateDir = path.join(__dirname, '../test-state');
    if (fs.existsSync(testStateDir)) {
      fs.rmSync(testStateDir, { recursive: true, force: true });
    }

    console.log('   ✅ Test environment prepared\n');
  }

  /**
   * Run a single test suite
   */
  async runTestSuite(suite) {
    return new Promise((resolve) => {
      const testFile = path.join(__dirname, suite.file);
      const jestConfig = path.join(__dirname, '../../jest.config.js');

      const args = [
        '--config', jestConfig,
        '--testPathPattern', testFile,
        '--verbose',
        '--detectOpenHandles',
        '--forceExit'
      ];

      if (process.argv.includes('--coverage')) {
        args.push('--coverage');
      }

      const jest = spawn('npx', ['jest', ...args], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '../..')
      });

      let stdout = '';
      let stderr = '';

      jest.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      jest.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      jest.on('close', (code) => {
        const result = this.parseJestOutput(stdout, stderr, suite);
        result.exitCode = code;
        resolve(result);
      });

      jest.on('error', (error) => {
        resolve({
          suiteName: suite.name,
          totalTests: 0,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          duration: 0,
          errors: [`Failed to run test suite: ${error.message}`],
          exitCode: 1
        });
      });
    });
  }

  /**
   * Parse Jest output to extract test results
   */
  parseJestOutput(stdout, stderr, suite) {
    const result = {
      suiteName: suite.name,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      errors: [],
      output: stdout
    };

    try {
      // Parse test summary from Jest output
      const summaryMatch = stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (summaryMatch) {
        result.failedTests = parseInt(summaryMatch[1]);
        result.passedTests = parseInt(summaryMatch[2]);
        result.totalTests = parseInt(summaryMatch[3]);
      } else {
        // Try alternative format
        const altMatch = stdout.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        if (altMatch) {
          result.passedTests = parseInt(altMatch[1]);
          result.totalTests = parseInt(altMatch[2]);
          result.failedTests = 0;
        }
      }

      // Parse skipped tests
      const skippedMatch = stdout.match(/(\d+)\s+skipped/);
      if (skippedMatch) {
        result.skippedTests = parseInt(skippedMatch[1]);
      }

      // Parse duration
      const durationMatch = stdout.match(/Time:\s+([\d.]+)\s*s/);
      if (durationMatch) {
        result.duration = parseFloat(durationMatch[1]);
      }

      // Extract error messages
      if (stderr) {
        result.errors.push(stderr);
      }

      // Extract failed test details
      const failureMatches = stdout.match(/FAIL\s+.*\.test\.js[\s\S]*?(?=PASS|FAIL|Test Suites:|$)/g);
      if (failureMatches) {
        failureMatches.forEach(failure => {
          result.errors.push(failure);
        });
      }

    } catch (error) {
      result.errors.push(`Failed to parse Jest output: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport() {
    console.log('📊 Generating coverage report...');

    try {
      const coverageDir = path.join(__dirname, '../../coverage');
      if (fs.existsSync(coverageDir)) {
        const coverageFile = path.join(coverageDir, 'coverage-final.json');
        if (fs.existsSync(coverageFile)) {
          const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
          this.results.coverage = this.summarizeCoverage(coverage);
          console.log('   ✅ Coverage report generated\n');
        }
      }
    } catch (error) {
      console.warn('   ⚠️  Could not generate coverage report:', error.message);
    }
  }

  /**
   * Summarize coverage data
   */
  summarizeCoverage(coverage) {
    const summary = {
      totalFiles: 0,
      coveredFiles: 0,
      statements: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      lines: { total: 0, covered: 0, percentage: 0 }
    };

    Object.values(coverage).forEach(file => {
      summary.totalFiles++;
      
      if (file.s) {
        const statements = Object.values(file.s);
        summary.statements.total += statements.length;
        summary.statements.covered += statements.filter(s => s > 0).length;
      }

      if (file.b) {
        const branches = Object.values(file.b).flat();
        summary.branches.total += branches.length;
        summary.branches.covered += branches.filter(b => b > 0).length;
      }

      if (file.f) {
        const functions = Object.values(file.f);
        summary.functions.total += functions.length;
        summary.functions.covered += functions.filter(f => f > 0).length;
      }
    });

    // Calculate percentages
    summary.statements.percentage = summary.statements.total > 0 
      ? (summary.statements.covered / summary.statements.total * 100).toFixed(2)
      : 0;
    
    summary.branches.percentage = summary.branches.total > 0
      ? (summary.branches.covered / summary.branches.total * 100).toFixed(2)
      : 0;
    
    summary.functions.percentage = summary.functions.total > 0
      ? (summary.functions.covered / summary.functions.total * 100).toFixed(2)
      : 0;

    return summary;
  }

  /**
   * Generate final test report
   */
  async generateFinalReport() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    
    console.log('📋 Integration Test Results Summary');
    console.log('==================================');
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passedTests}`);
    console.log(`❌ Failed: ${this.results.failedTests}`);
    console.log(`⏭️  Skipped: ${this.results.skippedTests}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
    
    if (this.results.coverage) {
      console.log('\n📊 Coverage Summary:');
      console.log(`Statements: ${this.results.coverage.statements.percentage}%`);
      console.log(`Branches: ${this.results.coverage.branches.percentage}%`);
      console.log(`Functions: ${this.results.coverage.functions.percentage}%`);
    }

    console.log('\n📋 Test Suite Results:');
    this.results.suiteResults.forEach(suite => {
      const status = suite.failedTests === 0 ? '✅' : '❌';
      console.log(`${status} ${suite.suiteName}: ${suite.passedTests}/${suite.totalTests} passed (${suite.duration.toFixed(2)}s)`);
    });

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors and Failures:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.substring(0, 200)}...`);
      });
    }

    // Save detailed report to file
    const reportFile = path.join(__dirname, '../../output', `integration-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    try {
      fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportFile}`);
    } catch (error) {
      console.warn(`⚠️  Could not save report file: ${error.message}`);
    }

    console.log('\n' + (this.results.failedTests === 0 ? '🎉 All integration tests passed!' : '💥 Some integration tests failed!'));
  }

  /**
   * Display help information
   */
  static showHelp() {
    console.log('Comprehensive Pipeline Integration Test Runner');
    console.log('============================================\n');
    console.log('Usage: node run-integration-tests.js [options]\n');
    console.log('Options:');
    console.log('  --coverage    Generate code coverage report');
    console.log('  --help        Show this help message\n');
    console.log('Test Suites:');
    console.log('  1. Pipeline Integration Tests');
    console.log('     - Tests unified-data-manager integration with pipeline-engine');
    console.log('     - Tests state-manager tracking of pipeline operations');
    console.log('     - Tests health-monitor integration and status reporting');
    console.log('');
    console.log('  2. Enhanced Frontend Sync Integration Tests');
    console.log('     - Tests enhanced frontend-sync-processor capabilities');
    console.log('     - Tests business data generation and validation');
    console.log('     - Tests performance and scalability features');
    console.log('');
    console.log('  3. Cross-Service Integration Tests');
    console.log('     - Tests data synchronization between all services');
    console.log('     - Tests workflow integration and error handling');
    console.log('     - Tests cross-service data consistency validation');
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    IntegrationTestRunner.showHelp();
    process.exit(0);
  }

  const runner = new IntegrationTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { IntegrationTestRunner };