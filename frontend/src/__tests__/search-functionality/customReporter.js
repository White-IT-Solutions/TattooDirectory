/**
 * Custom Jest Reporter for Search Functionality Tests
 * 
 * This reporter provides detailed, real-time feedback during test execution
 * and generates comprehensive reports for search functionality compliance.
 */

const fs = require('fs');
const path = require('path');

class SearchFunctionalityReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.outputFile = this.options.outputFile || 'test-results.json';
    
    this.testResults = {
      startTime: null,
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      suites: [],
      performance: {
        slowTests: [],
        fastTests: []
      },
      requirements: {},
      issues: []
    };
    
    this.currentSuite = null;
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };
  }

  colorize(text, color) {
    if (process.env.NO_COLOR || !process.stdout.isTTY) {
      return text;
    }
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  onRunStart(results, options) {
    this.testResults.startTime = new Date();
    
    console.log('\n' + '='.repeat(80));
    console.log(this.colorize('🔍 SEARCH FUNCTIONALITY TEST SUITE', 'bright'));
    console.log('='.repeat(80));
    console.log(this.colorize('Testing search functionality cohesiveness across all components', 'cyan'));
    console.log('');
  }

  onTestSuiteStart(test) {
    const suiteName = this.getSuiteName(test.path);
    this.currentSuite = {
      name: suiteName,
      path: test.path,
      startTime: new Date(),
      tests: [],
      status: 'running'
    };
    
    console.log(this.colorize(`📂 ${suiteName}`, 'blue'));
  }

  onTestStart(test) {
    const testName = test.title || test.name;
    process.stdout.write(`  ${this.colorize('⏳', 'yellow')} ${testName}...`);
  }

  onTestResult(test, testResult) {
    const testName = test.title || testResult.title;
    const duration = testResult.duration || 0;
    
    // Clear the current line and rewrite with result
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    
    if (testResult.status === 'passed') {
      const durationText = duration > 1000 ? 
        this.colorize(`(${duration}ms - SLOW)`, 'yellow') : 
        `(${duration}ms)`;
      
      console.log(`  ${this.colorize('✅', 'green')} ${testName} ${durationText}`);
      this.testResults.passedTests++;
      
      if (duration > 1000) {
        this.testResults.performance.slowTests.push({
          name: testName,
          suite: this.currentSuite?.name,
          duration
        });
      } else if (duration < 100) {
        this.testResults.performance.fastTests.push({
          name: testName,
          suite: this.currentSuite?.name,
          duration
        });
      }
      
    } else if (testResult.status === 'failed') {
      console.log(`  ${this.colorize('❌', 'red')} ${testName} (${duration}ms)`);
      
      if (testResult.failureMessages && testResult.failureMessages.length > 0) {
        const errorMessage = testResult.failureMessages[0].split('\n')[0];
        console.log(`    ${this.colorize('Error:', 'red')} ${errorMessage}`);
      }
      
      this.testResults.failedTests++;
      this.testResults.issues.push({
        test: testName,
        suite: this.currentSuite?.name,
        error: testResult.failureMessages?.[0] || 'Unknown error',
        duration
      });
      
    } else if (testResult.status === 'skipped') {
      console.log(`  ${this.colorize('⏭️', 'yellow')} ${testName} (skipped)`);
      this.testResults.skippedTests++;
    }
    
    this.testResults.totalTests++;
    
    if (this.currentSuite) {
      this.currentSuite.tests.push({
        name: testName,
        status: testResult.status,
        duration,
        error: testResult.failureMessages?.[0]
      });
    }
  }

  onTestSuiteResult(test, testSuiteResult) {
    if (this.currentSuite) {
      this.currentSuite.endTime = new Date();
      this.currentSuite.duration = this.currentSuite.endTime - this.currentSuite.startTime;
      this.currentSuite.status = testSuiteResult.numFailingTests > 0 ? 'failed' : 'passed';
      
      const passedCount = testSuiteResult.numPassingTests;
      const failedCount = testSuiteResult.numFailingTests;
      const totalCount = passedCount + failedCount;
      
      const statusIcon = this.currentSuite.status === 'passed' ? 
        this.colorize('✅', 'green') : 
        this.colorize('❌', 'red');
      
      console.log(`${statusIcon} Suite completed: ${passedCount}/${totalCount} tests passed`);
      
      if (failedCount > 0) {
        console.log(`  ${this.colorize(`${failedCount} test(s) failed`, 'red')}`);
      }
      
      this.testResults.suites.push({ ...this.currentSuite });
      this.currentSuite = null;
    }
    
    console.log(''); // Add spacing between suites
  }

  onRunComplete(contexts, results) {
    this.testResults.endTime = new Date();
    const totalDuration = this.testResults.endTime - this.testResults.startTime;
    
    console.log('='.repeat(80));
    console.log(this.colorize('📊 SEARCH FUNCTIONALITY TEST RESULTS', 'bright'));
    console.log('='.repeat(80));
    
    // Overall summary
    const passRate = (this.testResults.passedTests / this.testResults.totalTests) * 100;
    const statusColor = passRate === 100 ? 'green' : passRate >= 80 ? 'yellow' : 'red';
    
    console.log(`\n${this.colorize('OVERALL RESULTS:', 'bright')}`);
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`${this.colorize('Passed:', 'green')} ${this.testResults.passedTests}`);
    console.log(`${this.colorize('Failed:', 'red')} ${this.testResults.failedTests}`);
    console.log(`${this.colorize('Skipped:', 'yellow')} ${this.testResults.skippedTests}`);
    console.log(`${this.colorize('Pass Rate:', statusColor)} ${passRate.toFixed(1)}%`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    // Performance summary
    if (this.testResults.performance.slowTests.length > 0) {
      console.log(`\n${this.colorize('⚠️  PERFORMANCE WARNINGS:', 'yellow')}`);
      console.log(`${this.testResults.performance.slowTests.length} slow tests (>1s):`);
      
      this.testResults.performance.slowTests.slice(0, 5).forEach(test => {
        console.log(`  • ${test.name} (${test.duration}ms) in ${test.suite}`);
      });
      
      if (this.testResults.performance.slowTests.length > 5) {
        console.log(`  ... and ${this.testResults.performance.slowTests.length - 5} more`);
      }
    }
    
    // Requirements analysis
    this.analyzeRequirements();
    
    if (Object.keys(this.testResults.requirements).length > 0) {
      console.log(`\n${this.colorize('📋 REQUIREMENTS COVERAGE:', 'bright')}`);
      
      Object.entries(this.testResults.requirements).forEach(([reqId, req]) => {
        const coverage = req.tests.length > 0 ? (req.passed / req.tests.length) * 100 : 0;
        const statusIcon = coverage >= 80 ? '✅' : coverage >= 50 ? '⚠️' : '❌';
        const coverageColor = coverage >= 80 ? 'green' : coverage >= 50 ? 'yellow' : 'red';
        
        console.log(`${statusIcon} ${req.name}: ${this.colorize(`${coverage.toFixed(1)}%`, coverageColor)} (${req.passed}/${req.tests.length} tests)`);
      });
    }
    
    // Failed tests summary
    if (this.testResults.failedTests > 0) {
      console.log(`\n${this.colorize('❌ FAILED TESTS:', 'red')}`);
      
      this.testResults.issues.slice(0, 10).forEach(issue => {
        console.log(`  • ${issue.test} in ${issue.suite}`);
        const errorLine = issue.error.split('\n')[0];
        console.log(`    ${this.colorize('Error:', 'red')} ${errorLine}`);
      });
      
      if (this.testResults.issues.length > 10) {
        console.log(`  ... and ${this.testResults.issues.length - 10} more failures`);
      }
    }
    
    // Recommendations
    this.generateRecommendations();
    
    // Save detailed results
    this.saveResults();
    
    console.log('\n' + '='.repeat(80));
    
    // Final status
    if (this.testResults.failedTests === 0) {
      console.log(this.colorize('🎉 All search functionality tests passed!', 'green'));
      console.log(this.colorize('Search functionality implementation is compliant with requirements.', 'green'));
    } else {
      console.log(this.colorize('⚠️  Some tests failed. Review the issues above.', 'yellow'));
      console.log(this.colorize('Fix failing tests to ensure full search functionality compliance.', 'yellow'));
    }
  }

  analyzeRequirements() {
    const requirementsMap = {
      'Requirement 1': {
        name: 'Studios Page Search Experience',
        patterns: ['studios.*style.*filter', 'studios.*search']
      },
      'Requirement 2': {
        name: 'Artists Page Search Functionality',
        patterns: ['artists.*search', 'enhanced.*search.*controller']
      },
      'Requirement 3': {
        name: 'Navigation Search Experience',
        patterns: ['navigation.*search', 'contextual.*help']
      },
      'Requirement 4': {
        name: 'Styles Page Enhancement',
        patterns: ['styles.*page', 'style.*showcase']
      },
      'Requirement 5': {
        name: 'Consistent Search Design System',
        patterns: ['design.*system', 'cross.*page.*consistency']
      },
      'Requirement 6': {
        name: 'Search Result Display and Feedback',
        patterns: ['search.*results', 'search.*feedback']
      },
      'Requirement 7': {
        name: 'Advanced Search Capabilities',
        patterns: ['advanced.*search', 'complex.*queries']
      },
      'Requirement 8': {
        name: 'Standardized Tattoo Styles Data Model',
        patterns: ['standardized.*style.*model', 'style.*data.*consistency']
      },
      'Requirement 13': {
        name: 'Performance and Accessibility',
        patterns: ['performance.*tests', 'accessibility.*tests', 'wcag']
      }
    };
    
    Object.entries(requirementsMap).forEach(([reqId, requirement]) => {
      this.testResults.requirements[reqId] = {
        name: requirement.name,
        tests: [],
        passed: 0,
        failed: 0
      };
      
      this.testResults.suites.forEach(suite => {
        suite.tests.forEach(test => {
          const testName = test.name.toLowerCase();
          const matchesRequirement = requirement.patterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\./g, '\\s*'), 'i');
            return regex.test(testName);
          });
          
          if (matchesRequirement) {
            this.testResults.requirements[reqId].tests.push(test);
            
            if (test.status === 'passed') {
              this.testResults.requirements[reqId].passed++;
            } else if (test.status === 'failed') {
              this.testResults.requirements[reqId].failed++;
            }
          }
        });
      });
    });
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    if (this.testResults.performance.slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `Optimize ${this.testResults.performance.slowTests.length} slow tests for better development experience`
      });
    }
    
    // Coverage recommendations
    Object.entries(this.testResults.requirements).forEach(([reqId, req]) => {
      const coverage = req.tests.length > 0 ? (req.passed / req.tests.length) * 100 : 0;
      
      if (coverage < 80 && req.tests.length > 0) {
        recommendations.push({
          type: 'coverage',
          message: `Improve test coverage for ${req.name} (currently ${coverage.toFixed(1)}%)`
        });
      } else if (req.tests.length === 0) {
        recommendations.push({
          type: 'missing',
          message: `Add tests for ${req.name} - no tests found`
        });
      }
    });
    
    // Quality recommendations
    const failureRate = (this.testResults.failedTests / this.testResults.totalTests) * 100;
    if (failureRate > 10) {
      recommendations.push({
        type: 'quality',
        message: `High failure rate (${failureRate.toFixed(1)}%) - focus on fixing failing tests`
      });
    }
    
    if (recommendations.length > 0) {
      console.log(`\n${this.colorize('💡 RECOMMENDATIONS:', 'bright')}`);
      recommendations.forEach(rec => {
        const icon = rec.type === 'performance' ? '⚡' : 
                    rec.type === 'coverage' ? '📊' : 
                    rec.type === 'missing' ? '📝' : '🔧';
        console.log(`${icon} ${rec.message}`);
      });
    }
  }

  saveResults() {
    try {
      const outputDir = path.dirname(this.outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const reportData = {
        ...this.testResults,
        metadata: {
          generatedAt: new Date().toISOString(),
          nodeVersion: process.version,
          platform: process.platform,
          jestVersion: require('jest/package.json').version
        }
      };
      
      fs.writeFileSync(this.outputFile, JSON.stringify(reportData, null, 2));
      console.log(`\n📄 Detailed results saved to: ${this.outputFile}`);
      
    } catch (error) {
      console.error(`Failed to save test results: ${error.message}`);
    }
  }

  getSuiteName(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Extract meaningful suite names
    if (fileName.includes('SearchFunctionality')) {
      return 'Core Search Functionality';
    } else if (fileName.includes('CrossPageConsistency')) {
      return 'Cross-Page Consistency';
    } else if (fileName.includes('SearchPerformance')) {
      return 'Search Performance';
    } else if (fileName.includes('SearchAccessibility')) {
      return 'Search Accessibility';
    } else if (fileName.includes('SearchUserFlows')) {
      return 'Search User Flows';
    } else if (fileName.includes('search-controller')) {
      return 'Search Controller';
    } else if (fileName.includes('StudiosStyleFiltering')) {
      return 'Studios Style Filtering';
    } else if (fileName.includes('NavigationEnhancement')) {
      return 'Navigation Enhancement';
    } else {
      return fileName.replace(/\.test$/, '').replace(/([A-Z])/g, ' $1').trim();
    }
  }
}

module.exports = SearchFunctionalityReporter;