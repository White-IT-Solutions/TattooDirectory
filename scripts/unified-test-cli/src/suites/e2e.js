/**
 * E2ESuite - End-to-end test suite implementation
 * 
 * Executes Playwright E2E tests with full application stack,
 * validates frontend user flows, and integrates with frontend-ready data scenario.
 * Requires all services (LocalStack, frontend, backend) to be running.
 */

import { BaseSuite } from './base-suite.js';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';

export class E2ESuite extends BaseSuite {
  constructor(config) {
    super(config);
    this.serviceEndpoints = {
      localstack: 'http://localhost:4566',
      backend: 'http://localhost:9000',
      frontend: 'http://localhost:3000'
    };
    this.testTimeout = 300000; // 5 minutes for E2E tests
    this.maxRetries = 3;
    this.retryDelay = 3000;
    this.playwrightConfig = null;
    this.browsers = ['chromium', 'firefox', 'webkit'];
    this.viewports = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 }
    };
  }

  /**
   * Custom validation for E2E tests
   * @returns {Promise<boolean>} True if validation passes
   */
  async customValidation() {
    try {
      // Check if E2E test workspace exists
      const e2ePath = path.join(process.cwd(), this.workspace);
      await fs.access(e2ePath);

      // Check for package.json with Playwright dependencies
      const packageJsonPath = path.join(e2ePath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        // Check for Playwright or Puppeteer dependencies
        const hasPlaywright = packageJson.dependencies?.['@playwright/test'] || 
                             packageJson.devDependencies?.['@playwright/test'] ||
                             packageJson.dependencies?.['playwright'] || 
                             packageJson.devDependencies?.['playwright'];
        
        const hasPuppeteer = packageJson.dependencies?.['puppeteer'] || 
                            packageJson.devDependencies?.['puppeteer'];

        if (!hasPlaywright && !hasPuppeteer) {
          this.logger.error('No E2E testing framework found (Playwright or Puppeteer required)');
          return false;
        }

        this.logger.info(`E2E framework detected: ${hasPlaywright ? 'Playwright' : 'Puppeteer'}`);
      } catch (error) {
        this.logger.error(`Failed to read E2E package.json: ${error.message}`);
        return false;
      }

      // Check for Playwright configuration in frontend workspace
      const frontendPlaywrightConfig = path.join(process.cwd(), 'frontend', 'playwright.config.ts');
      try {
        await fs.access(frontendPlaywrightConfig);
        this.playwrightConfig = frontendPlaywrightConfig;
        this.logger.info('Found Playwright configuration in frontend workspace');
      } catch (error) {
        // Check for Playwright config in E2E workspace
        const e2ePlaywrightConfig = path.join(e2ePath, 'playwright.config.js');
        try {
          await fs.access(e2ePlaywrightConfig);
          this.playwrightConfig = e2ePlaywrightConfig;
          this.logger.info('Found Playwright configuration in E2E workspace');
        } catch (error) {
          this.logger.warn('No Playwright configuration found, using defaults');
        }
      }

      // Check for test files
      const hasTests = await this.checkForE2ETests(e2ePath);
      if (!hasTests) {
        this.logger.warn('No E2E test files found');
      }

      return true;
    } catch (error) {
      this.logger.error(`E2E suite validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for E2E test files
   * @param {string} e2ePath - Path to E2E test workspace
   * @returns {Promise<boolean>} True if test files are found
   */
  async checkForE2ETests(e2ePath) {
    try {
      const testDirs = ['tests', 'test', 'e2e', 'specs'];
      
      for (const testDir of testDirs) {
        const testDirPath = path.join(e2ePath, testDir);
        try {
          const stats = await fs.stat(testDirPath);
          if (stats.isDirectory()) {
            const hasTestFiles = await this.findTestFilesRecursively(testDirPath);
            if (hasTestFiles) {
              return true;
            }
          }
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }

      // Check for test files in root of E2E workspace
      const hasRootTests = await this.findTestFilesRecursively(e2ePath);
      return hasRootTests;
    } catch (error) {
      return false;
    }
  }

  /**
   * Recursively find test files in a directory
   * @param {string} dirPath - Directory to search
   * @returns {Promise<boolean>} True if test files are found
   */
  async findTestFilesRecursively(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subDirPath = path.join(dirPath, entry.name);
          const hasTests = await this.findTestFilesRecursively(subDirPath);
          if (hasTests) {
            return true;
          }
        } else if (entry.isFile()) {
          // Check for various E2E test file patterns
          const testPatterns = [
            /\.test\.(js|ts|mjs)$/,
            /\.spec\.(js|ts|mjs)$/,
            /\.e2e\.(js|ts|mjs)$/,
            /e2e.*\.(js|ts|mjs)$/
          ];
          
          if (testPatterns.some(pattern => pattern.test(entry.name))) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate all required services for E2E tests
   * @returns {Promise<boolean>} True if all services are responding
   */
  async validateAllServices() {
    this.logger.info('Validating all required services for E2E tests...');
    
    const serviceChecks = [
      {
        name: 'LocalStack',
        url: `${this.serviceEndpoints.localstack}/_localstack/health`,
        required: true,
        startCommand: 'npm run local:start'
      },
      {
        name: 'Frontend',
        url: `${this.serviceEndpoints.frontend}`,
        required: true,
        startCommand: 'npm run dev --workspace=frontend'
      },
      {
        name: 'Backend API',
        url: `${this.serviceEndpoints.backend}/health`,
        required: false, // Backend might not have health endpoint
        startCommand: 'npm run dev --workspace=backend'
      }
    ];

    let allServicesValid = true;
    const failedServices = [];

    for (const service of serviceChecks) {
      try {
        this.logger.info(`Checking ${service.name}...`);
        const response = await this.checkServiceWithRetry(service.url);
        
        if (response.status === 200) {
          this.logger.info(`✅ ${service.name} is responding`);
        } else {
          this.logger.warn(`⚠️  ${service.name} returned status ${response.status}`);
          if (service.required) {
            allServicesValid = false;
            failedServices.push(service);
          }
        }
      } catch (error) {
        this.logger.error(`❌ ${service.name} is not responding: ${error.message}`);
        if (service.required) {
          allServicesValid = false;
          failedServices.push(service);
        }
      }
    }

    // Provide helpful error messages for failed services
    if (!allServicesValid) {
      this.logger.error('Required services are not running. Please start them:');
      failedServices.forEach(service => {
        this.logger.error(`  - ${service.name}: ${service.startCommand}`);
      });
    }

    // Validate AWS services through LocalStack if LocalStack is running
    if (allServicesValid) {
      allServicesValid = await this.validateAWSServices();
    }

    return allServicesValid;
  }

  /**
   * Check service endpoint with retry logic
   * @param {string} url - Service URL to check
   * @returns {Promise<Object>} HTTP response
   */
  async checkServiceWithRetry(url) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: 10000, // Longer timeout for E2E services
          validateStatus: () => true // Accept any status code
        });
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          this.logger.info(`Retry ${attempt}/${this.maxRetries} for ${url} in ${this.retryDelay}ms...`);
          await this.sleep(this.retryDelay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate AWS services are accessible through LocalStack
   * @returns {Promise<boolean>} True if AWS services are accessible
   */
  async validateAWSServices() {
    try {
      this.logger.info('Validating AWS services for E2E tests...');
      
      // Import AWS SDK modules dynamically
      const { DynamoDBClient, ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
      const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
      
      const awsConfig = {
        region: 'us-east-1',
        endpoint: this.serviceEndpoints.localstack,
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test'
        }
      };

      // Test DynamoDB
      try {
        const dynamoClient = new DynamoDBClient(awsConfig);
        await dynamoClient.send(new ListTablesCommand({}));
        this.logger.info('✅ DynamoDB is accessible');
      } catch (error) {
        this.logger.error(`❌ DynamoDB is not accessible: ${error.message}`);
        return false;
      }

      // Test S3
      try {
        const s3Client = new S3Client(awsConfig);
        await s3Client.send(new ListBucketsCommand({}));
        this.logger.info('✅ S3 is accessible');
      } catch (error) {
        this.logger.error(`❌ S3 is not accessible: ${error.message}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`AWS services validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Prepare environment for E2E tests
   * @returns {Promise<void>}
   */
  async prepare() {
    await super.prepare();
    
    // Set environment variables for E2E testing
    process.env.NODE_ENV = 'test';
    process.env.BASE_URL = this.serviceEndpoints.frontend;
    process.env.API_BASE_URL = this.serviceEndpoints.backend;
    process.env.LOCALSTACK_ENDPOINT = this.serviceEndpoints.localstack;
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    
    // Set Playwright-specific environment variables
    process.env.PLAYWRIGHT_BROWSERS_PATH = '0'; // Use system browsers
    process.env.PWTEST_SKIP_TEST_OUTPUT = '1'; // Reduce output noise
    
    // Validate all required services before running tests
    const servicesValid = await this.validateAllServices();
    if (!servicesValid) {
      throw new Error('Service validation failed. Ensure all required services are running before executing E2E tests.');
    }
    
    // Wait for frontend to be fully ready
    await this.waitForFrontendReady();
    
    this.logger.info('E2E test environment prepared');
  }

  /**
   * Wait for frontend to be fully ready
   * @returns {Promise<void>}
   */
  async waitForFrontendReady() {
    this.logger.info('Waiting for frontend to be fully ready...');
    
    const maxWaitTime = 60000; // 1 minute
    const checkInterval = 2000; // 2 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(this.serviceEndpoints.frontend, {
          timeout: 5000,
          headers: { 'Accept': 'text/html' }
        });
        
        if (response.status === 200 && response.data.includes('<!DOCTYPE html')) {
          this.logger.info('✅ Frontend is ready');
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await this.sleep(checkInterval);
    }
    
    throw new Error('Frontend did not become ready within the timeout period');
  }

  /**
   * Transform command arguments for E2E test execution
   * @param {Object} options - Execution options
   * @returns {Array} Array of command and arguments [cmd, ...args]
   */
  transformCommandArgs(options = {}) {
    // Parse the base command from configuration
    const commandParts = this.command.split(' ');
    
    // Handle npm commands specially
    if (commandParts[0] === 'npm') {
      const result = ['npm', ...commandParts.slice(1)];
      
      // For npm test commands, we don't add Mocha arguments directly
      // because they go through the package.json script
      
      // Set environment variables for the test process
      if (options.ci) {
        process.env.MOCHA_REPORTER = 'json';
      }
      
      if (options.testPattern) {
        process.env.MOCHA_GREP = options.testPattern;
      }
      
      return result;
    }
    
    // Handle direct mocha commands
    if (commandParts[0] === 'mocha' || commandParts[0] === 'npx') {
      const result = [...commandParts];
      
      // Add timeout for E2E tests
      result.push('--timeout', this.testTimeout.toString());
      
      // Add CI mode flags
      if (options.ci) {
        result.push('--reporter', 'json');
        result.push('--exit');
      }
      
      // Add specific test pattern
      if (options.testPattern) {
        result.push('--grep', options.testPattern);
      }
      
      return result;
    }
    
    // Handle Playwright commands
    if (this.command.includes('playwright')) {
      const result = [...commandParts];
      
      if (this.playwrightConfig) {
        result.push('--config', this.playwrightConfig);
      }
      
      if (options.browser) {
        result.push('--project', options.browser);
      }
      
      if (options.headed) {
        result.push('--headed');
      }
      
      if (options.debug) {
        result.push('--debug');
      }
      
      if (options.ci) {
        result.push('--reporter=json');
        result.push('--output-dir=test-results');
      }
      
      if (options.testPattern) {
        result.push('--grep', options.testPattern);
      }
      
      if (options.retries !== undefined) {
        result.push('--retries', options.retries.toString());
      }
      
      if (options.workers) {
        result.push('--workers', options.workers.toString());
      }
      
      return result;
    }
    
    // Default: return command parts as-is
    const result = [...commandParts];
    
    // Set environment variables
    if (options.baseUrl) {
      process.env.BASE_URL = options.baseUrl;
    }
    
    if (options.headless !== undefined) {
      process.env.HEADLESS = options.headless.toString();
    }

    return result;
  }

  /**
   * Parse E2E test results from output
   * @param {string} stdout - Command stdout
   * @param {string} stderr - Command stderr
   * @param {number} exitCode - Command exit code
   * @returns {Object} Parsed test results
   */
  parseResults(stdout, stderr, exitCode) {
    const result = {
      exitCode,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
      coverage: null,
      errors: [],
      duration: 0,
      browsers: [],
      screenshots: [],
      videos: []
    };

    try {
      // Try to parse Playwright JSON output first
      if (stdout.includes('"suites"') && stdout.includes('"tests"')) {
        const jsonMatch = stdout.match(/\{[\s\S]*"suites"[\s\S]*\}/);
        if (jsonMatch) {
          const playwrightResults = JSON.parse(jsonMatch[0]);
          result.tests.total = playwrightResults.stats?.expected || 0;
          result.tests.passed = playwrightResults.stats?.passed || 0;
          result.tests.failed = playwrightResults.stats?.failed || 0;
          result.tests.skipped = playwrightResults.stats?.skipped || 0;
          result.duration = playwrightResults.stats?.duration || 0;
          
          // Extract browser information
          if (playwrightResults.suites) {
            result.browsers = this.extractBrowsersFromSuites(playwrightResults.suites);
          }
          
          // Extract error details
          if (playwrightResults.errors && playwrightResults.errors.length > 0) {
            result.errors = playwrightResults.errors.map(error => ({
              test: error.location?.file || 'Unknown',
              message: error.message,
              stack: error.stack,
              type: 'playwright_error'
            }));
          }
          
          return result;
        }
      }

      // Try to parse Mocha JSON output
      if (stdout.includes('"stats"') && stdout.includes('"tests"')) {
        const jsonMatch = stdout.match(/\{[\s\S]*"stats"[\s\S]*\}/);
        if (jsonMatch) {
          const mochaResults = JSON.parse(jsonMatch[0]);
          result.tests.total = mochaResults.stats.tests || 0;
          result.tests.passed = mochaResults.stats.passes || 0;
          result.tests.failed = mochaResults.stats.failures || 0;
          result.tests.skipped = mochaResults.stats.pending || 0;
          result.duration = mochaResults.stats.duration || 0;
          
          if (mochaResults.failures && mochaResults.failures.length > 0) {
            result.errors = mochaResults.failures.map(failure => ({
              test: failure.fullTitle,
              message: failure.err.message,
              stack: failure.err.stack,
              type: 'test_failure'
            }));
          }
          
          return result;
        }
      }

      // Parse Playwright text output
      const playwrightSummary = this.parsePlaywrightTextOutput(stdout);
      if (playwrightSummary.found) {
        Object.assign(result, playwrightSummary);
        return result;
      }

      // Parse Mocha text output
      const mochaSummary = this.parseMochaTextOutput(stdout);
      if (mochaSummary.found) {
        Object.assign(result, mochaSummary);
      }

      // Parse error details if exit code indicates failure
      if (exitCode !== 0) {
        result.errors = this.parseErrorsFromOutput(stdout, stderr);
      }

    } catch (error) {
      this.logger.error(`Failed to parse E2E test results: ${error.message}`);
      result.errors.push({
        message: 'Failed to parse test results',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return result;
  }

  /**
   * Parse Playwright text output
   * @param {string} output - Test output
   * @returns {Object} Parsed results
   */
  parsePlaywrightTextOutput(output) {
    const result = { found: false };
    
    try {
      // Look for Playwright summary pattern
      const summaryMatch = output.match(/(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+skipped/i);
      if (summaryMatch) {
        result.found = true;
        result.tests = {
          passed: parseInt(summaryMatch[1], 10),
          failed: parseInt(summaryMatch[2], 10),
          skipped: parseInt(summaryMatch[3], 10),
          total: 0
        };
        result.tests.total = result.tests.passed + result.tests.failed + result.tests.skipped;
      }
      
      // Look for duration
      const durationMatch = output.match(/(\d+(?:\.\d+)?)\s*(?:s|seconds?|ms|milliseconds?)/i);
      if (durationMatch) {
        const duration = parseFloat(durationMatch[1]);
        result.duration = output.includes('ms') ? duration : duration * 1000;
      }
      
      // Extract browser information
      const browserMatches = output.matchAll(/\[(\w+)\]/g);
      result.browsers = [...new Set([...browserMatches].map(match => match[1]))];
      
    } catch (error) {
      // Ignore parsing errors
    }
    
    return result;
  }

  /**
   * Parse Mocha text output
   * @param {string} output - Test output
   * @returns {Object} Parsed results
   */
  parseMochaTextOutput(output) {
    const result = { found: false, tests: { passed: 0, failed: 0, skipped: 0, total: 0 }, duration: 0 };
    
    try {
      // Look for passing tests pattern: "30 passing (9m)" or "30 passing"
      const passingMatch = output.match(/(\d+)\s+passing(?:\s+\(([^)]+)\))?/i);
      if (passingMatch) {
        result.found = true;
        result.tests.passed = parseInt(passingMatch[1], 10);
        if (passingMatch[2]) {
          result.duration = this.parseDuration(passingMatch[2]);
        }
      }

      // Look for failing tests pattern: "42 failing"
      const failingMatch = output.match(/(\d+)\s+failing/i);
      if (failingMatch) {
        result.found = true;
        result.tests.failed = parseInt(failingMatch[1], 10);
      }

      // Look for pending/skipped tests pattern: "5 pending"
      const pendingMatch = output.match(/(\d+)\s+pending/i);
      if (pendingMatch) {
        result.found = true;
        result.tests.skipped = parseInt(pendingMatch[1], 10);
      }

      // Calculate total
      result.tests.total = result.tests.passed + result.tests.failed + result.tests.skipped;

      // If we found any test results, mark as found
      if (result.tests.total > 0) {
        result.found = true;
      }

      // Look for duration in different formats if not found in passing line
      if (result.duration === 0) {
        // Look for patterns like "Duration: 524177ms" or execution time patterns
        const durationPatterns = [
          /Duration:\s*(\d+(?:\.\d+)?)\s*(ms|s|m)/i,
          /completed.*?(\d+(?:\.\d+)?)\s*(ms|s|m)/i,
          /(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?|m|minutes?)/i
        ];

        for (const pattern of durationPatterns) {
          const durationMatch = output.match(pattern);
          if (durationMatch) {
            const value = parseFloat(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            
            if (unit.startsWith('m')) {
              result.duration = value * 60 * 1000; // minutes to ms
            } else if (unit.startsWith('s')) {
              result.duration = value * 1000; // seconds to ms
            } else {
              result.duration = value; // already in ms
            }
            break;
          }
        }
      }
      
    } catch (error) {
      this.logger.debug(`Error parsing Mocha text output: ${error.message}`);
    }
    
    return result;
  }

  /**
   * Extract browsers from Playwright suites
   * @param {Array} suites - Playwright test suites
   * @returns {Array} Array of browser names
   */
  extractBrowsersFromSuites(suites) {
    const browsers = new Set();
    
    const extractFromSuite = (suite) => {
      if (suite.title && this.browsers.some(browser => suite.title.includes(browser))) {
        const browser = this.browsers.find(browser => suite.title.includes(browser));
        if (browser) browsers.add(browser);
      }
      
      if (suite.suites) {
        suite.suites.forEach(extractFromSuite);
      }
    };
    
    suites.forEach(extractFromSuite);
    return Array.from(browsers);
  }

  /**
   * Parse duration string to milliseconds
   * @param {string} durationStr - Duration string (e.g., "1.5s", "500ms", "9m")
   * @returns {number} Duration in milliseconds
   */
  parseDuration(durationStr) {
    try {
      const str = durationStr.toLowerCase().trim();
      
      // Handle minutes: "9m" or "9min"
      if (str.includes('m') && !str.includes('ms')) {
        const value = parseFloat(str.replace(/[^0-9.]/g, ''));
        return value * 60 * 1000; // minutes to milliseconds
      }
      
      // Handle seconds: "1.5s" or "1500ms"
      if (str.includes('s') && !str.includes('ms')) {
        const value = parseFloat(str.replace(/[^0-9.]/g, ''));
        return value * 1000; // seconds to milliseconds
      }
      
      // Handle milliseconds: "500ms"
      if (str.includes('ms')) {
        const value = parseFloat(str.replace(/[^0-9.]/g, ''));
        return value; // already in milliseconds
      }
      
      // If no unit, assume milliseconds
      const numericValue = parseFloat(str);
      return isNaN(numericValue) ? 0 : numericValue;
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * Parse error details from test output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Array} Array of error objects
   */
  parseErrorsFromOutput(stdout, stderr) {
    const errors = [];

    try {
      // Parse Playwright test failures
      const playwrightFailures = stdout.matchAll(/(\d+)\)\s+(.+?)\s+›\s+(.+?)\n\n?\s+(.+?)\n/g);
      for (const match of playwrightFailures) {
        errors.push({
          test: `${match[2]} › ${match[3]}`,
          message: match[4].trim(),
          type: 'test_failure'
        });
      }

      // Parse Mocha test failures
      const mochaFailures = stdout.matchAll(/\d+\)\s+(.+?)\n\n?\s+(.+?)\n/g);
      for (const match of mochaFailures) {
        errors.push({
          test: match[1].trim(),
          message: match[2].trim(),
          type: 'test_failure'
        });
      }

      // Parse service validation errors
      if (stderr.includes('Service') && stderr.includes('not responding')) {
        errors.push({
          message: 'Service validation failed',
          details: stderr.trim(),
          type: 'service_error'
        });
      }

      // Parse browser launch errors
      if (stderr.includes('browser') && (stderr.includes('launch') || stderr.includes('connect'))) {
        errors.push({
          message: 'Browser launch failed',
          details: stderr.trim(),
          type: 'browser_error'
        });
      }

      // Parse timeout errors
      if (stderr.includes('timeout') || stderr.includes('Timeout')) {
        errors.push({
          message: 'Test execution timeout',
          details: stderr.trim(),
          type: 'timeout_error'
        });
      }

      // Add generic error if no specific errors found but exit code indicates failure
      if (errors.length === 0 && stderr.trim()) {
        errors.push({
          message: 'E2E test execution failed',
          details: stderr.trim(),
          type: 'execution_error'
        });
      }

    } catch (error) {
      errors.push({
        message: 'Failed to parse error details',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return errors;
  }

  /**
   * Get required data scenario for E2E tests
   * @returns {string|null} Required data scenario name or null if no seeding required
   */
  getRequiredDataScenario() {
    // Use the configured data scenario, or null if not specified
    return this.dataScenario || null;
  }

  /**
   * Get E2E test categories
   * @returns {Array} Array of test categories
   */
  getTestCategories() {
    return [
      'user-flows',
      'browser-automation',
      'visual-regression',
      'cross-browser',
      'responsive-design'
    ];
  }

  /**
   * Get supported browsers
   * @returns {Array} Array of supported browser names
   */
  getSupportedBrowsers() {
    return this.browsers;
  }

  /**
   * Get supported viewports
   * @returns {Object} Object with viewport configurations
   */
  getSupportedViewports() {
    return this.viewports;
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get suite-specific metadata
   * @returns {Object} Extended metadata
   */
  getMetadata() {
    const baseMetadata = super.getMetadata();
    return {
      ...baseMetadata,
      testCategories: this.getTestCategories(),
      serviceEndpoints: this.serviceEndpoints,
      testTimeout: this.testTimeout,
      maxRetries: this.maxRetries,
      supportedBrowsers: this.getSupportedBrowsers(),
      supportedViewports: this.getSupportedViewports(),
      playwrightConfig: this.playwrightConfig,
      dataScenario: this.getRequiredDataScenario()
    };
  }

  /**
   * Clean up after E2E tests
   * @returns {Promise<void>}
   */
  async cleanup() {
    await super.cleanup();
    
    try {
      this.logger.info('Cleaning up E2E test artifacts...');
      
      // Clean up screenshots, videos, and other test artifacts
      const artifactDirs = [
        'test-results',
        'playwright-report',
        'screenshots',
        'videos'
      ];
      
      for (const dir of artifactDirs) {
        const artifactPath = path.join(process.cwd(), this.workspace, dir);
        try {
          await fs.access(artifactPath);
          // Don't actually delete artifacts, just log cleanup
          this.logger.info(`Test artifacts available in: ${artifactPath}`);
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }
      
      this.logger.info('E2E test cleanup completed');
    } catch (error) {
      this.logger.error(`E2E test cleanup failed: ${error.message}`);
    }
  }
}