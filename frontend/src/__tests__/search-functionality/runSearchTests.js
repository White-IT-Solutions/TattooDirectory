#!/usr/bin/env node

/**
 * Search Functionality Test Runner
 * 
 * This script runs all search functionality tests and generates comprehensive reports.
 * It integrates with existing test infrastructure and provides detailed coverage analysis.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  testTimeout: 30000,
  maxWorkers: 4,
  coverage: true,
  verbose: true,
  bail: false, // Continue running tests even if some fail
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Search Functionality Core Tests',
    pattern: 'src/__tests__/search-functionality/SearchFunctionality.test.jsx',
    description: 'Core search functionality, standardized style model, and search controller tests'
  },
  {
    name: 'Cross-Page Consistency Tests',
    pattern: 'src/__tests__/search-functionality/CrossPageConsistency.test.jsx',
    description: 'Integration tests verifying consistent behavior across all pages'
  },
  {
    name: 'Search Performance Tests',
    pattern: 'src/__tests__/search-functionality/SearchPerformance.test.js',
    description: 'Performance validation for search response times and component rendering'
  },
  {
    name: 'Search Accessibility Tests',
    pattern: 'src/__tests__/search-functionality/SearchAccessibility.test.jsx',
    description: 'WCAG 2.1 AA compliance and accessibility feature validation'
  },
  {
    name: 'Search User Flow Tests',
    pattern: 'src/__tests__/search-functionality/SearchUserFlows.test.jsx',
    description: 'Complete user journey validation across all search interfaces'
  }
];

// Existing test integration
const EXISTING_TESTS = [
  {
    name: 'Search Controller Unit Tests',
    pattern: 'src/lib/__tests__/search-controller.test.js',
    description: 'Existing search controller unit tests'
  },
  {
    name: 'Studios Style Filtering Tests',
    pattern: 'src/app/studios/__tests__/StudiosStyleFiltering.test.jsx',
    description: 'Existing studios page style filtering tests'
  },
  {
    name: 'Navigation Enhancement Tests',
    pattern: 'src/design-system/components/navigation/__tests__/NavigationEnhancement.test.jsx',
    description: 'Existing navigation enhancement tests'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(colorize(title, 'bright'));
  console.log('='.repeat(80));
}

function printSection(title) {
  console.log('\n' + colorize(title, 'cyan'));
  console.log('-'.repeat(title.length));
}

function printSuccess(message) {
  console.log(colorize(`✅ ${message}`, 'green'));
}

function printError(message) {
  console.log(colorize(`❌ ${message}`, 'red'));
}

function printWarning(message) {
  console.log(colorize(`⚠️  ${message}`, 'yellow'));
}

function printInfo(message) {
  console.log(colorize(`ℹ️  ${message}`, 'blue'));
}

function checkTestFiles() {
  printSection('Checking Test Files');
  
  const allTests = [...TEST_SUITES, ...EXISTING_TESTS];
  const missingFiles = [];
  const existingFiles = [];
  
  allTests.forEach(test => {
    const filePath = path.join(process.cwd(), test.pattern);
    if (fs.existsSync(filePath)) {
      existingFiles.push(test);
      printSuccess(`Found: ${test.name}`);
    } else {
      missingFiles.push(test);
      printError(`Missing: ${test.name} (${test.pattern})`);
    }
  });
  
  if (missingFiles.length > 0) {
    printWarning(`${missingFiles.length} test files are missing. Some tests will be skipped.`);
  }
  
  return { existingFiles, missingFiles };
}

function runTestSuite(testSuite, options = {}) {
  printSection(`Running: ${testSuite.name}`);
  printInfo(testSuite.description);
  
  const jestArgs = [
    '--testPathPattern=' + testSuite.pattern.replace(/\//g, '\\/'),
    '--verbose',
    '--no-cache'
  ];
  
  if (options.coverage) {
    jestArgs.push('--coverage');
    jestArgs.push('--coverageDirectory=coverage/search-functionality');
  }
  
  if (options.maxWorkers) {
    jestArgs.push(`--maxWorkers=${options.maxWorkers}`);
  }
  
  if (options.testTimeout) {
    jestArgs.push(`--testTimeout=${options.testTimeout}`);
  }
  
  try {
    const command = `npx jest ${jestArgs.join(' ')}`;
    printInfo(`Command: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    printSuccess(`✅ ${testSuite.name} - PASSED`);
    
    // Extract key metrics from Jest output
    const lines = output.split('\n');
    const testResults = lines.find(line => line.includes('Tests:'));
    const coverageResults = lines.find(line => line.includes('Coverage:'));
    
    if (testResults) {
      printInfo(`Results: ${testResults.trim()}`);
    }
    
    if (coverageResults) {
      printInfo(`Coverage: ${coverageResults.trim()}`);
    }
    
    return { success: true, output, testSuite };
    
  } catch (error) {
    printError(`❌ ${testSuite.name} - FAILED`);
    
    if (error.stdout) {
      console.log('\nTest Output:');
      console.log(error.stdout);
    }
    
    if (error.stderr) {
      console.log('\nError Output:');
      console.log(error.stderr);
    }
    
    return { success: false, error: error.message, testSuite };
  }
}

function generateTestReport(results) {
  printSection('Test Results Summary');
  
  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\nTotal Test Suites: ${results.length}`);
  printSuccess(`Passed: ${passed.length}`);
  
  if (failed.length > 0) {
    printError(`Failed: ${failed.length}`);
    
    console.log('\nFailed Test Suites:');
    failed.forEach(result => {
      console.log(`  - ${result.testSuite.name}: ${result.error}`);
    });
  }
  
  // Calculate overall success rate
  const successRate = (passed.length / results.length) * 100;
  
  if (successRate === 100) {
    printSuccess(`\n🎉 All tests passed! Success rate: ${successRate.toFixed(1)}%`);
  } else if (successRate >= 80) {
    printWarning(`\n⚠️  Most tests passed. Success rate: ${successRate.toFixed(1)}%`);
  } else {
    printError(`\n❌ Many tests failed. Success rate: ${successRate.toFixed(1)}%`);
  }
  
  return { passed: passed.length, failed: failed.length, successRate };
}

function generateCoverageReport() {
  printSection('Coverage Analysis');
  
  const coverageDir = path.join(process.cwd(), 'coverage', 'search-functionality');
  
  if (fs.existsSync(coverageDir)) {
    printSuccess('Coverage report generated');
    printInfo(`Coverage files available in: ${coverageDir}`);
    
    // Try to read coverage summary
    const summaryPath = path.join(coverageDir, 'coverage-summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const total = summary.total;
        
        console.log('\nCoverage Summary:');
        console.log(`  Lines: ${total.lines.pct}%`);
        console.log(`  Functions: ${total.functions.pct}%`);
        console.log(`  Branches: ${total.branches.pct}%`);
        console.log(`  Statements: ${total.statements.pct}%`);
        
        // Check if coverage meets thresholds
        const threshold = 80;
        const metrics = ['lines', 'functions', 'branches', 'statements'];
        const belowThreshold = metrics.filter(metric => total[metric].pct < threshold);
        
        if (belowThreshold.length === 0) {
          printSuccess('All coverage metrics meet the 80% threshold');
        } else {
          printWarning(`Coverage below 80% threshold: ${belowThreshold.join(', ')}`);
        }
        
      } catch (error) {
        printWarning('Could not parse coverage summary');
      }
    }
  } else {
    printWarning('No coverage report found');
  }
}

function checkRequirements() {
  printSection('Checking Requirements Coverage');
  
  // Map test suites to requirements from the spec
  const requirementsCoverage = {
    'Requirement 1: Unify Studios Page Search Experience': [
      'Cross-Page Consistency Tests',
      'Search User Flow Tests'
    ],
    'Requirement 2: Enhance Artists Page Search Functionality': [
      'Search Functionality Core Tests',
      'Search User Flow Tests'
    ],
    'Requirement 3: Enhance Navigation Search Experience': [
      'Navigation Enhancement Tests',
      'Search Accessibility Tests'
    ],
    'Requirement 4: Align Styles Page with Enhanced Demo Functionality': [
      'Cross-Page Consistency Tests',
      'Search User Flow Tests'
    ],
    'Requirement 5: Implement Consistent Search Design System': [
      'Cross-Page Consistency Tests',
      'Search Functionality Core Tests'
    ],
    'Requirement 6: Enhance Search Result Display and Feedback': [
      'Search Functionality Core Tests',
      'Search User Flow Tests'
    ],
    'Requirement 7: Implement Advanced Search Capabilities': [
      'Search Functionality Core Tests',
      'Search User Flow Tests'
    ],
    'Requirement 8: Standardize Tattoo Styles Data Model': [
      'Search Functionality Core Tests',
      'Cross-Page Consistency Tests'
    ],
    'Requirement 9: Implement Comprehensive Navigation and UX Components': [
      'Navigation Enhancement Tests',
      'Search Accessibility Tests'
    ],
    'Requirement 10: Implement Comprehensive Feedback and Notification Systems': [
      'Search Functionality Core Tests',
      'Search User Flow Tests'
    ],
    'Requirement 11: Enhance Data Display and Visualization Components': [
      'Search Functionality Core Tests',
      'Cross-Page Consistency Tests'
    ],
    'Requirement 12: Implement Comprehensive Loading and Skeleton States': [
      'Search Performance Tests',
      'Search User Flow Tests'
    ],
    'Requirement 13: Optimize Search Performance and Accessibility': [
      'Search Performance Tests',
      'Search Accessibility Tests'
    ]
  };
  
  console.log('\nRequirements Coverage Analysis:');
  
  Object.entries(requirementsCoverage).forEach(([requirement, testSuites]) => {
    console.log(`\n${requirement}:`);
    testSuites.forEach(testSuite => {
      const hasTest = TEST_SUITES.some(t => t.name.includes(testSuite)) || 
                     EXISTING_TESTS.some(t => t.name.includes(testSuite));
      
      if (hasTest) {
        printSuccess(`  ✅ ${testSuite}`);
      } else {
        printWarning(`  ⚠️  ${testSuite} (may be missing)`);
      }
    });
  });
}

function main() {
  printHeader('Search Functionality Comprehensive Test Suite');
  
  console.log('This test suite validates the search functionality cohesiveness');
  console.log('implementation against all requirements in the specification.\n');
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    printError('Please run this script from the frontend directory');
    process.exit(1);
  }
  
  // Check test files
  const { existingFiles, missingFiles } = checkTestFiles();
  
  if (existingFiles.length === 0) {
    printError('No test files found. Please ensure test files are created.');
    process.exit(1);
  }
  
  // Check requirements coverage
  checkRequirements();
  
  // Run test suites
  printSection('Running Test Suites');
  const results = [];
  
  existingFiles.forEach(testSuite => {
    const result = runTestSuite(testSuite, TEST_CONFIG);
    results.push(result);
    
    // Add delay between test suites to avoid resource conflicts
    if (results.length < existingFiles.length) {
      console.log('Waiting 2 seconds before next test suite...');
      execSync('sleep 2', { stdio: 'ignore' });
    }
  });
  
  // Generate reports
  const summary = generateTestReport(results);
  
  if (TEST_CONFIG.coverage) {
    generateCoverageReport();
  }
  
  // Final recommendations
  printSection('Recommendations');
  
  if (summary.successRate === 100) {
    printSuccess('🎉 Excellent! All search functionality tests are passing.');
    printInfo('The search functionality implementation meets all requirements.');
  } else if (summary.successRate >= 80) {
    printWarning('Good progress, but some tests need attention.');
    printInfo('Focus on fixing the failing tests to achieve full compliance.');
  } else {
    printError('Significant issues found in search functionality implementation.');
    printInfo('Review failing tests and address core functionality issues first.');
  }
  
  if (missingFiles.length > 0) {
    printWarning(`${missingFiles.length} test files are missing. Consider creating them for complete coverage.`);
  }
  
  console.log('\nNext Steps:');
  console.log('1. Review any failing tests and fix the underlying issues');
  console.log('2. Ensure all search components use the standardized style model');
  console.log('3. Verify cross-page consistency in search behavior');
  console.log('4. Test accessibility compliance with screen readers');
  console.log('5. Validate performance targets are met');
  
  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Search Functionality Test Runner');
  console.log('');
  console.log('Usage: node runSearchTests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --no-coverage  Skip coverage analysis');
  console.log('  --fast         Run with reduced timeout and workers');
  console.log('  --bail         Stop on first test failure');
  console.log('');
  console.log('Examples:');
  console.log('  node runSearchTests.js');
  console.log('  node runSearchTests.js --fast');
  console.log('  node runSearchTests.js --no-coverage --bail');
  process.exit(0);
}

if (args.includes('--no-coverage')) {
  TEST_CONFIG.coverage = false;
}

if (args.includes('--fast')) {
  TEST_CONFIG.testTimeout = 15000;
  TEST_CONFIG.maxWorkers = 2;
}

if (args.includes('--bail')) {
  TEST_CONFIG.bail = true;
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  generateTestReport,
  checkTestFiles,
  TEST_SUITES,
  EXISTING_TESTS
};