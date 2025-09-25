#!/usr/bin/env node

/**
 * Comprehensive Integration Test Runner
 * 
 * This script runs all comprehensive component integration tests including:
 * - Component integration tests
 * - Cross-page consistency validation
 * - Accessibility compliance testing
 * - Visual regression testing
 * 
 * Usage:
 *   npm run test:integration
 *   npm run test:integration -- --coverage
 *   npm run test:integration -- --watch
 * 
 * Requirements: 11.1, 11.2
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const testConfig = {
  // Test suites to run
  suites: [
    {
      name: 'Component Integration Tests',
      pattern: '__tests__/integration/ComponentIntegration.test.jsx',
      description: 'Tests integration of all enhanced component implementations'
    },
    {
      name: 'Cross-Page Consistency Tests',
      pattern: '__tests__/integration/CrossPageConsistency.test.jsx',
      description: 'Validates consistency across all main application pages'
    },
    {
      name: 'Accessibility Compliance Tests',
      pattern: '__tests__/accessibility/AccessibilityCompliance.test.jsx',
      description: 'Tests WCAG 2.1 AA compliance with axe-core'
    },
    {
      name: 'Visual Regression Tests',
      pattern: '__tests__/visual/VisualRegression.test.jsx',
      description: 'Validates design system consistency and visual states'
    }
  ],
  
  // Jest configuration overrides for integration tests
  jestConfig: {
    testTimeout: 30000,
    setupFilesAfterEnv: [
      '<rootDir>/jest.setup.js',
      '<rootDir>/src/__tests__/setup/testSetup.js'
    ],
    testEnvironment: 'jsdom',
    collectCoverageFrom: [
      'src/**/*.{js,jsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{js,jsx}',
      '!src/**/*.config.{js,jsx}',
      '!src/__tests__/**',
    ],
    coverageThreshold: {
      global: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@/design-system/(.*)$': '<rootDir>/src/design-system/$1',
    }
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${message}`, colors.cyan + colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, colors.blue);
  log(`${message}`, colors.blue + colors.bright);
  log(`${'-'.repeat(40)}`, colors.blue);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Check if required dependencies are installed
function checkDependencies() {
  logSection('Checking Dependencies');
  
  const requiredDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'jest-axe',
    '@axe-core/react'
  ];
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json not found');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
  
  if (missingDeps.length > 0) {
    logError(`Missing required dependencies: ${missingDeps.join(', ')}`);
    logInfo('Run: npm install --save-dev ' + missingDeps.join(' '));
    process.exit(1);
  }
  
  logSuccess('All required dependencies are installed');
}

// Validate test files exist
function validateTestFiles() {
  logSection('Validating Test Files');
  
  const missingFiles = [];
  
  testConfig.suites.forEach(suite => {
    const testPath = path.join(process.cwd(), 'src', suite.pattern);
    if (!fs.existsSync(testPath)) {
      missingFiles.push(suite.pattern);
    } else {
      logSuccess(`Found: ${suite.pattern}`);
    }
  });
  
  if (missingFiles.length > 0) {
    logError(`Missing test files: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  logSuccess('All test files are present');
}

// Run individual test suite
function runTestSuite(suite, options = {}) {
  logSection(`Running: ${suite.name}`);
  logInfo(suite.description);
  
  const jestArgs = [
    '--testPathPattern=' + suite.pattern,
    '--verbose',
    '--no-cache'
  ];
  
  if (options.coverage) {
    jestArgs.push('--coverage');
  }
  
  if (options.watch) {
    jestArgs.push('--watch');
  }
  
  if (options.updateSnapshots) {
    jestArgs.push('--updateSnapshot');
  }
  
  try {
    const command = `npx jest ${jestArgs.join(' ')}`;
    logInfo(`Executing: ${command}`);
    
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        CI: options.ci ? 'true' : 'false'
      }
    });
    
    logSuccess(`✅ ${suite.name} completed successfully`);
    return true;
  } catch (error) {
    logError(`❌ ${suite.name} failed`);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return false;
  }
}

// Run all test suites
function runAllTests(options = {}) {
  logHeader('Comprehensive Component Integration Tests');
  
  // Pre-flight checks
  checkDependencies();
  validateTestFiles();
  
  // Test execution summary
  const results = {
    total: testConfig.suites.length,
    passed: 0,
    failed: 0,
    suites: []
  };
  
  logSection('Test Execution Plan');
  testConfig.suites.forEach((suite, index) => {
    logInfo(`${index + 1}. ${suite.name}`);
    logInfo(`   ${suite.description}`);
  });
  
  // Run each test suite
  testConfig.suites.forEach(suite => {
    const success = runTestSuite(suite, options);
    
    results.suites.push({
      name: suite.name,
      success
    });
    
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  });
  
  // Display final results
  logHeader('Test Results Summary');
  
  results.suites.forEach(result => {
    if (result.success) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });
  
  log(`\nTotal Suites: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
    process.exit(1);
  } else {
    logSuccess('All integration tests passed! 🎉');
  }
}

// Generate test coverage report
function generateCoverageReport() {
  logSection('Generating Coverage Report');
  
  try {
    execSync('npx jest --coverage --coverageReporters=html --coverageReporters=text', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('Coverage report generated in coverage/ directory');
  } catch (error) {
    logError('Failed to generate coverage report');
    process.exit(1);
  }
}

// Run accessibility audit
function runAccessibilityAudit() {
  logSection('Running Accessibility Audit');
  
  try {
    execSync('npx jest --testPathPattern=AccessibilityCompliance.test.jsx --verbose', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('Accessibility audit completed');
  } catch (error) {
    logError('Accessibility audit failed');
    process.exit(1);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    continueOnError: args.includes('--continue-on-error'),
    updateSnapshots: args.includes('--updateSnapshot') || args.includes('-u'),
    ci: process.env.CI === 'true' || args.includes('--ci')
  };
  
  // Handle specific commands
  if (args.includes('--coverage-only')) {
    generateCoverageReport();
    return;
  }
  
  if (args.includes('--accessibility-only')) {
    runAccessibilityAudit();
    return;
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    log('Comprehensive Integration Test Runner', colors.bright);
    log('\nUsage:');
    log('  npm run test:integration                 # Run all tests');
    log('  npm run test:integration -- --coverage  # Run with coverage');
    log('  npm run test:integration -- --watch     # Run in watch mode');
    log('  npm run test:integration -- --coverage-only     # Generate coverage only');
    log('  npm run test:integration -- --accessibility-only # Run accessibility tests only');
    log('  npm run test:integration -- --continue-on-error  # Continue on test failures');
    log('  npm run test:integration -- --help      # Show this help');
    log('\nTest Suites:');
    testConfig.suites.forEach((suite, index) => {
      log(`  ${index + 1}. ${suite.name}`);
      log(`     ${suite.description}`);
    });
    return;
  }
  
  // Run all tests
  runAllTests(options);
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runTestSuite,
  generateCoverageReport,
  runAccessibilityAudit,
  testConfig
};