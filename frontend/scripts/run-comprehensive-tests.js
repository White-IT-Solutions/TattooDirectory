#!/usr/bin/env node

/**
 * Comprehensive Test Execution Script
 * 
 * This script orchestrates the execution of all comprehensive UI/UX tests
 * and generates detailed reports for validation and analysis.
 * 
 * Usage:
 *   npm run test:comprehensive
 *   node scripts/run-comprehensive-tests.js
 *   node scripts/run-comprehensive-tests.js --suite=core
 *   node scripts/run-comprehensive-tests.js --theme=dark --viewport=mobile
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testSuites: {
    all: 'tests/e2e/comprehensive-test-execution.test.ts tests/e2e/comprehensive-test-runner-orchestrator.test.ts',
    core: 'tests/e2e/comprehensive-page-coverage.test.ts',
    search: 'tests/e2e/search-interface-coverage.test.ts',
    portfolio: 'tests/e2e/portfolio-gallery-coverage.test.ts',
    auth: 'tests/e2e/authentication-flow-coverage.test.ts',
    errors: 'tests/e2e/error-pages-coverage.test.ts',
    orchestrator: 'tests/e2e/comprehensive-test-runner-orchestrator.test.ts',
    execution: 'tests/e2e/comprehensive-test-execution.test.ts'
  },
  browsers: ['chromium', 'firefox', 'webkit'],
  themes: ['light', 'dark'],
  viewports: ['desktop', 'tablet', 'mobile'],
  outputDir: 'tests/e2e/reports',
  screenshotDir: 'tests/e2e/visual-regression/screenshots'
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suite: 'all',
    browser: 'chromium',
    theme: null,
    viewport: null,
    headed: false,
    debug: false,
    report: true,
    parallel: true,
    retries: 1
  };

  args.forEach(arg => {
    if (arg.startsWith('--suite=')) {
      options.suite = arg.split('=')[1];
    } else if (arg.startsWith('--browser=')) {
      options.browser = arg.split('=')[1];
    } else if (arg.startsWith('--theme=')) {
      options.theme = arg.split('=')[1];
    } else if (arg.startsWith('--viewport=')) {
      options.viewport = arg.split('=')[1];
    } else if (arg === '--headed') {
      options.headed = true;
    } else if (arg === '--debug') {
      options.debug = true;
    } else if (arg === '--no-report') {
      options.report = false;
    } else if (arg === '--no-parallel') {
      options.parallel = false;
    } else if (arg.startsWith('--retries=')) {
      options.retries = parseInt(arg.split('=')[1]);
    }
  });

  return options;
}

// Ensure directories exist
function ensureDirectories() {
  const dirs = [
    CONFIG.outputDir,
    CONFIG.screenshotDir,
    path.join(CONFIG.screenshotDir, 'baselines'),
    path.join(CONFIG.screenshotDir, 'current'),
    path.join(CONFIG.screenshotDir, 'diffs')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

// Build Playwright command
function buildPlaywrightCommand(options) {
  const cmd = ['npx', 'playwright', 'test'];
  
  // Add test files
  const testFiles = CONFIG.testSuites[options.suite];
  if (!testFiles) {
    throw new Error(`Unknown test suite: ${options.suite}`);
  }
  cmd.push(...testFiles.split(' '));

  // Add browser
  cmd.push('--project', options.browser);

  // Add execution options
  if (options.headed) {
    cmd.push('--headed');
  }

  if (options.debug) {
    cmd.push('--debug');
  }

  if (!options.parallel) {
    cmd.push('--workers', '1');
  }

  if (options.retries > 0) {
    cmd.push('--retries', options.retries.toString());
  }

  // Add reporter
  cmd.push('--reporter', 'html,json,line');

  // Add environment variables for theme and viewport filtering
  const env = { ...process.env };
  if (options.theme) {
    env.TEST_THEME_FILTER = options.theme;
  }
  if (options.viewport) {
    env.TEST_VIEWPORT_FILTER = options.viewport;
  }

  return { cmd, env };
}

// Execute tests
async function executeTests(options) {
  console.log('🚀 Starting Comprehensive Test Execution');
  console.log('=========================================');
  console.log(`📋 Suite: ${options.suite}`);
  console.log(`🌐 Browser: ${options.browser}`);
  if (options.theme) console.log(`🎨 Theme: ${options.theme}`);
  if (options.viewport) console.log(`📱 Viewport: ${options.viewport}`);
  console.log(`🔧 Mode: ${options.headed ? 'Headed' : 'Headless'}`);
  console.log(`🔄 Parallel: ${options.parallel ? 'Yes' : 'No'}`);
  console.log(`🔁 Retries: ${options.retries}`);
  console.log('');

  const { cmd, env } = buildPlaywrightCommand(options);
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const process = spawn(cmd[0], cmd.slice(1), {
      stdio: 'inherit',
      env,
      cwd: path.resolve(__dirname, '..')
    });

    process.on('close', (code) => {
      const duration = Date.now() - startTime;
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      
      console.log(`\n⏱️  Test execution completed in ${minutes}m ${seconds}s`);
      
      if (code === 0) {
        console.log('✅ All tests passed successfully!');
        resolve({ success: true, code, duration });
      } else {
        console.log(`❌ Tests failed with exit code: ${code}`);
        resolve({ success: false, code, duration });
      }
    });

    process.on('error', (error) => {
      console.error(`❌ Failed to start test process: ${error.message}`);
      reject(error);
    });
  });
}

// Generate summary report
function generateSummaryReport(results, options) {
  const reportPath = path.join(CONFIG.outputDir, 'comprehensive-test-summary.json');
  
  const summary = {
    timestamp: new Date().toISOString(),
    options,
    results,
    configuration: {
      suite: options.suite,
      browser: options.browser,
      theme: options.theme,
      viewport: options.viewport,
      testFiles: CONFIG.testSuites[options.suite]
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(`📄 Summary report saved to: ${reportPath}`);
  
  return summary;
}

// Display test results
function displayResults(results, options) {
  console.log('\n📊 TEST EXECUTION SUMMARY');
  console.log('=========================');
  
  if (results.success) {
    console.log('🎉 Status: PASSED');
  } else {
    console.log('💥 Status: FAILED');
  }
  
  console.log(`⏱️  Duration: ${Math.floor(results.duration / 60000)}m ${Math.floor((results.duration % 60000) / 1000)}s`);
  console.log(`🔢 Exit Code: ${results.code}`);
  
  // Check for generated reports
  const htmlReportPath = path.join('playwright-report', 'index.html');
  if (fs.existsSync(htmlReportPath)) {
    console.log(`📊 HTML Report: ${htmlReportPath}`);
    console.log('   Run: npx playwright show-report');
  }
  
  const jsonReportPath = path.join('test-results', 'results.json');
  if (fs.existsSync(jsonReportPath)) {
    console.log(`📋 JSON Report: ${jsonReportPath}`);
  }
  
  // Check for screenshots
  const screenshotCount = fs.existsSync(CONFIG.screenshotDir) ? 
    fs.readdirSync(CONFIG.screenshotDir).filter(f => f.endsWith('.png')).length : 0;
  
  if (screenshotCount > 0) {
    console.log(`📸 Screenshots: ${screenshotCount} captured in ${CONFIG.screenshotDir}`);
  }
  
  // Check for comprehensive test report
  const comprehensiveReportPath = path.join(CONFIG.outputDir, 'comprehensive-test-execution-report.json');
  if (fs.existsSync(comprehensiveReportPath)) {
    console.log(`📈 Comprehensive Report: ${comprehensiveReportPath}`);
  }
}

// Validate test environment
function validateEnvironment() {
  console.log('🔍 Validating test environment...');
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('✅ Playwright is installed');
  } catch (error) {
    console.error('❌ Playwright is not installed. Run: npm install @playwright/test');
    process.exit(1);
  }
  
  // Check if browsers are installed
  try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    console.log('✅ Playwright browsers are installed');
  } catch (error) {
    console.log('⚠️  Some browsers may not be installed. Run: npx playwright install');
  }
  
  // Check test files exist
  const options = parseArgs();
  const testFiles = CONFIG.testSuites[options.suite];
  if (testFiles) {
    const files = testFiles.split(' ');
    files.forEach(file => {
      const fullPath = path.resolve(__dirname, '..', file);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Test file not found: ${file}`);
        process.exit(1);
      }
    });
    console.log(`✅ Test files validated (${files.length} files)`);
  }
  
  console.log('');
}

// Main execution function
async function main() {
  try {
    // Parse command line options
    const options = parseArgs();
    
    // Show help if requested
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      console.log(`
Comprehensive Test Execution Script

Usage:
  node scripts/run-comprehensive-tests.js [options]

Options:
  --suite=<name>      Test suite to run (${Object.keys(CONFIG.testSuites).join(', ')})
  --browser=<name>    Browser to use (${CONFIG.browsers.join(', ')})
  --theme=<name>      Filter by theme (${CONFIG.themes.join(', ')})
  --viewport=<name>   Filter by viewport (${CONFIG.viewports.join(', ')})
  --headed           Run tests in headed mode
  --debug            Run tests in debug mode
  --no-report        Skip report generation
  --no-parallel      Run tests sequentially
  --retries=<num>    Number of retries (default: 1)
  --help, -h         Show this help message

Examples:
  node scripts/run-comprehensive-tests.js
  node scripts/run-comprehensive-tests.js --suite=core --browser=chromium
  node scripts/run-comprehensive-tests.js --theme=dark --viewport=mobile
  node scripts/run-comprehensive-tests.js --headed --debug
      `);
      process.exit(0);
    }
    
    // Validate environment
    validateEnvironment();
    
    // Ensure directories exist
    ensureDirectories();
    
    // Execute tests
    const results = await executeTests(options);
    
    // Generate reports
    if (options.report) {
      generateSummaryReport(results, options);
    }
    
    // Display results
    displayResults(results, options);
    
    // Exit with appropriate code
    process.exit(results.code);
    
  } catch (error) {
    console.error(`💥 Execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  process.exit(143);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  parseArgs,
  buildPlaywrightCommand,
  executeTests,
  generateSummaryReport
};