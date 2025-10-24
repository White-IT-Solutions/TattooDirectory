import chalk from 'chalk';
import { performance } from 'perf_hooks';

/**
 * ConsoleReporter provides formatted terminal output for test results
 * Supports colored output, progress indicators, and detailed error reporting
 */
class ConsoleReporter {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      colors: options.colors !== false, // Default to true unless explicitly disabled
      showProgress: options.showProgress !== false,
      maxErrorLines: options.maxErrorLines || 10,
      ...options
    };
    
    this.startTime = null;
    this.suiteResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
  }

  /**
   * Start reporting session
   */
  start(suites = []) {
    this.startTime = performance.now();
    this.suiteResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;

    if (this.options.showProgress) {
      this._log(chalk.blue('🚀 Starting test execution...'));
      if (suites.length > 0) {
        this._log(chalk.gray(`Running ${suites.length} test suite(s): ${suites.join(', ')}`));
      }
      this._log('');
    }
  }

  /**
   * Report suite start
   */
  suiteStart(suiteName) {
    if (this.options.showProgress) {
      this._log(chalk.blue(`▶️  Starting ${suiteName}...`));
    }
  }

  /**
   * Report suite completion
   */
  suiteComplete(result) {
    this.suiteResults.push(result);
    this._updateTotals(result);

    const { suite, status, duration, tests, errors } = result;
    const durationMs = Math.round(duration);
    
    if (status === 'passed') {
      this._log(chalk.green(`✅ ${suite} - ${tests.passed}/${tests.total} tests passed (${durationMs}ms)`));
    } else if (status === 'failed') {
      this._log(chalk.red(`❌ ${suite} - ${tests.failed}/${tests.total} tests failed (${durationMs}ms)`));
      
      if (this.options.verbose && errors && errors.length > 0) {
        this._logErrors(errors);
      }
    } else if (status === 'skipped') {
      this._log(chalk.yellow(`⏭️  ${suite} - skipped`));
    }

    if (this.options.verbose && result.coverage) {
      this._logCoverage(result.coverage);
    }
  }

  /**
   * Report parallel execution progress
   */
  parallelProgress(completed, total) {
    if (this.options.showProgress) {
      const percentage = Math.round((completed / total) * 100);
      this._log(chalk.blue(`📊 Progress: ${completed}/${total} suites completed (${percentage}%)`));
    }
  }

  /**
   * Report service validation status
   */
  serviceValidation(service, status, message) {
    if (status === 'success') {
      this._log(chalk.green(`✅ ${service} - ready`));
    } else if (status === 'error') {
      this._log(chalk.red(`❌ ${service} - ${message}`));
    } else if (status === 'warning') {
      this._log(chalk.yellow(`⚠️  ${service} - ${message}`));
    }
  }

  /**
   * Report data seeding status
   */
  dataSeeding(scenario, status, message) {
    if (status === 'start') {
      this._log(chalk.blue(`🌱 Seeding data scenario: ${scenario}`));
    } else if (status === 'success') {
      this._log(chalk.green(`✅ Data scenario '${scenario}' seeded successfully`));
    } else if (status === 'error') {
      this._log(chalk.red(`❌ Failed to seed data scenario '${scenario}': ${message}`));
    }
  }

  /**
   * Generate final summary report
   */
  summary() {
    const endTime = performance.now();
    const totalDuration = Math.round(endTime - this.startTime);
    
    this._log('');
    this._log(chalk.bold('📋 Test Summary'));
    this._log('═'.repeat(50));
    
    // Overall statistics
    this._log(`Total Suites: ${this.suiteResults.length}`);
    this._log(`Total Tests: ${this.totalTests}`);
    this._log(`Passed: ${chalk.green(this.passedTests)}`);
    this._log(`Failed: ${chalk.red(this.failedTests)}`);
    this._log(`Skipped: ${chalk.yellow(this.skippedTests)}`);
    this._log(`Duration: ${totalDuration}ms`);
    
    // Success rate
    const successRate = this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0;
    this._log(`Success Rate: ${this._colorizeSuccessRate(successRate)}%`);
    
    this._log('');
    
    // Suite breakdown
    if (this.suiteResults.length > 0) {
      this._log(chalk.bold('Suite Results:'));
      this.suiteResults.forEach(result => {
        const status = this._getStatusIcon(result.status);
        const duration = Math.round(result.duration);
        this._log(`  ${status} ${result.suite} (${duration}ms)`);
      });
      this._log('');
    }
    
    // Failed tests details
    const failedSuites = this.suiteResults.filter(r => r.status === 'failed');
    if (failedSuites.length > 0) {
      this._log(chalk.bold.red('Failed Tests:'));
      failedSuites.forEach(result => {
        if (result.errors && result.errors.length > 0) {
          this._log(chalk.red(`  ${result.suite}:`));
          this._logErrors(result.errors, '    ');
        }
      });
      this._log('');
    }
    
    // Overall result
    const overallSuccess = this.failedTests === 0 && this.suiteResults.every(r => r.status !== 'failed');
    if (overallSuccess) {
      this._log(chalk.green.bold('🎉 All tests passed!'));
    } else {
      this._log(chalk.red.bold('💥 Some tests failed!'));
    }
    
    return {
      success: overallSuccess,
      totalSuites: this.suiteResults.length,
      totalTests: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      skipped: this.skippedTests,
      duration: totalDuration,
      successRate
    };
  }

  /**
   * Log error message
   */
  error(message, error) {
    this._log(chalk.red(`❌ Error: ${message}`));
    if (error && this.options.verbose) {
      this._log(chalk.red(error.stack || error.message));
    }
  }

  /**
   * Log warning message
   */
  warn(message) {
    this._log(chalk.yellow(`⚠️  Warning: ${message}`));
  }

  /**
   * Log info message
   */
  info(message) {
    this._log(chalk.blue(`ℹ️  ${message}`));
  }

  // Private methods

  _log(message) {
    if (this.options.colors) {
      console.log(message);
    } else {
      // Strip ANSI color codes for non-color output
      const stripped = message.replace(/\x1b\[[0-9;]*m/g, '');
      console.log(stripped);
    }
  }

  _updateTotals(result) {
    if (result.tests) {
      this.totalTests += result.tests.total || 0;
      this.passedTests += result.tests.passed || 0;
      this.failedTests += result.tests.failed || 0;
      this.skippedTests += result.tests.skipped || 0;
    }
  }

  _logErrors(errors, indent = '  ') {
    errors.slice(0, this.options.maxErrorLines).forEach(error => {
      this._log(chalk.red(`${indent}• ${error.test || 'Unknown test'}: ${error.message}`));
      if (this.options.verbose && error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 3);
        stackLines.forEach(line => {
          this._log(chalk.gray(`${indent}  ${line.trim()}`));
        });
      }
    });
    
    if (errors.length > this.options.maxErrorLines) {
      const remaining = errors.length - this.options.maxErrorLines;
      this._log(chalk.gray(`${indent}... and ${remaining} more errors`));
    }
  }

  _logCoverage(coverage) {
    this._log(chalk.blue('  Coverage:'));
    this._log(`    Lines: ${this._colorizeCoverage(coverage.lines)}%`);
    this._log(`    Functions: ${this._colorizeCoverage(coverage.functions)}%`);
    this._log(`    Branches: ${this._colorizeCoverage(coverage.branches)}%`);
    this._log(`    Statements: ${this._colorizeCoverage(coverage.statements)}%`);
  }

  _getStatusIcon(status) {
    switch (status) {
      case 'passed': return chalk.green('✅');
      case 'failed': return chalk.red('❌');
      case 'skipped': return chalk.yellow('⏭️');
      default: return chalk.gray('❓');
    }
  }

  _colorizeSuccessRate(rate) {
    if (rate >= 90) return chalk.green(rate);
    if (rate >= 70) return chalk.yellow(rate);
    return chalk.red(rate);
  }

  _colorizeCoverage(percentage) {
    if (percentage >= 80) return chalk.green(percentage);
    if (percentage >= 60) return chalk.yellow(percentage);
    return chalk.red(percentage);
  }
}

export default ConsoleReporter;