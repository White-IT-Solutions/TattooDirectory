/**
 * SecuritySuite - Security vulnerability test suite implementation
 * 
 * Executes security tests including authentication, authorization, input validation,
 * XSS prevention, rate limiting, CORS policies, and API security validation.
 * Provides detailed vulnerability reports and security recommendations.
 */

import { BaseSuite } from './base-suite.js';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';

export class SecuritySuite extends BaseSuite {
  constructor(config) {
    super(config);
    this.serviceEndpoints = {
      localstack: 'http://localhost:4566',
      backend: 'http://localhost:9000',
      frontend: 'http://localhost:3000'
    };
    this.testTimeout = 180000; // 3 minutes for security tests
    this.maxRetries = 2;
    this.retryDelay = 1000;
    this.securityCategories = [
      'authentication',
      'authorization',
      'input-validation',
      'xss-prevention',
      'rate-limiting',
      'cors-policies',
      'api-security',
      'token-security'
    ];
    this.vulnerabilityLevels = ['critical', 'high', 'medium', 'low', 'info'];
  }

  /**
   * Custom validation for security tests
   * @returns {Promise<boolean>} True if validation passes
   */
  async customValidation() {
    try {
      // Check if security test workspace exists
      const securityPath = path.join(process.cwd(), this.workspace);
      await fs.access(securityPath);

      // Check for package.json with required security testing dependencies
      const packageJsonPath = path.join(securityPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        // Check for security testing frameworks
        const securityDeps = [
          'mocha', 'chai', 'axios', // Basic testing
          'helmet', 'express-rate-limit', // Security middleware testing
          'jsonwebtoken', 'bcrypt', // Authentication testing
          'validator', 'dompurify' // Input validation testing
        ];

        const availableDeps = securityDeps.filter(dep => 
          packageJson.dependencies?.[dep] || 
          packageJson.devDependencies?.[dep] ||
          packageJson.peerDependencies?.[dep]
        );

        if (availableDeps.length === 0) {
          this.logger.warn('No security testing dependencies found, using basic HTTP testing');
        } else {
          this.logger.info(`Security testing dependencies available: ${availableDeps.join(', ')}`);
        }

      } catch (error) {
        this.logger.error(`Failed to read security package.json: ${error.message}`);
        return false;
      }

      // Check for security test files
      const hasTests = await this.checkForSecurityTests(securityPath);
      if (!hasTests) {
        this.logger.warn('No security test files found');
      }

      // Check for security configuration files
      await this.validateSecurityConfiguration(securityPath);

      return true;
    } catch (error) {
      this.logger.error(`Security suite validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for security test files
   * @param {string} securityPath - Path to security test workspace
   * @returns {Promise<boolean>} True if test files are found
   */
  async checkForSecurityTests(securityPath) {
    try {
      const testDirs = ['auth', 'validation', 'cors', 'rate-limit', 'xss', 'api'];
      let hasTestFiles = false;
      
      for (const testDir of testDirs) {
        const testDirPath = path.join(securityPath, testDir);
        try {
          const stats = await fs.stat(testDirPath);
          if (stats.isDirectory()) {
            const hasTests = await this.findTestFilesRecursively(testDirPath);
            if (hasTests) {
              hasTestFiles = true;
              this.logger.info(`Found security tests in: ${testDir}`);
            }
          }
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }

      // Check for test files in root of security workspace
      const hasRootTests = await this.findTestFilesRecursively(securityPath);
      if (hasRootTests) {
        hasTestFiles = true;
      }

      return hasTestFiles;
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
          // Check for security test file patterns
          const testPatterns = [
            /\.test\.(js|ts|mjs)$/,
            /\.spec\.(js|ts|mjs)$/,
            /security.*\.(js|ts|mjs)$/,
            /auth.*\.(js|ts|mjs)$/,
            /xss.*\.(js|ts|mjs)$/,
            /cors.*\.(js|ts|mjs)$/,
            /rate.*limit.*\.(js|ts|mjs)$/
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
   * Validate security configuration files
   * @param {string} securityPath - Path to security test workspace
   * @returns {Promise<void>}
   */
  async validateSecurityConfiguration(securityPath) {
    try {
      // Check for security test configuration
      const configFiles = [
        'security.config.js',
        'security.config.json',
        '.securityrc',
        'mocha.opts'
      ];

      for (const configFile of configFiles) {
        const configPath = path.join(securityPath, configFile);
        try {
          await fs.access(configPath);
          this.logger.info(`Found security configuration: ${configFile}`);
        } catch (error) {
          // Config file doesn't exist, continue
        }
      }

      // Check for security test data
      const testDataPath = path.join(securityPath, 'test-data');
      try {
        await fs.access(testDataPath);
        this.logger.info('Found security test data directory');
      } catch (error) {
        this.logger.warn('No security test data directory found');
      }

    } catch (error) {
      this.logger.warn(`Security configuration validation failed: ${error.message}`);
    }
  }

  /**
   * Validate all required services for security tests
   * @returns {Promise<boolean>} True if all services are responding
   */
  async validateSecurityServices() {
    this.logger.info('Validating services for security testing...');
    
    const serviceChecks = [
      {
        name: 'LocalStack',
        url: `${this.serviceEndpoints.localstack}/_localstack/health`,
        required: true,
        startCommand: 'npm run local:start'
      },
      {
        name: 'Backend API',
        url: `${this.serviceEndpoints.backend}/health`,
        required: true,
        startCommand: 'npm run dev --workspace=backend'
      },
      {
        name: 'Frontend (optional)',
        url: `${this.serviceEndpoints.frontend}`,
        required: false,
        startCommand: 'npm run dev --workspace=frontend'
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
          timeout: 8000, // Longer timeout for security tests
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
      this.logger.info('Validating AWS services for security tests...');
      
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

      // Test DynamoDB for authentication/authorization data
      try {
        const dynamoClient = new DynamoDBClient(awsConfig);
        await dynamoClient.send(new ListTablesCommand({}));
        this.logger.info('✅ DynamoDB is accessible for security tests');
      } catch (error) {
        this.logger.error(`❌ DynamoDB is not accessible: ${error.message}`);
        return false;
      }

      // Test S3 for file upload security tests
      try {
        const s3Client = new S3Client(awsConfig);
        await s3Client.send(new ListBucketsCommand({}));
        this.logger.info('✅ S3 is accessible for security tests');
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
   * Prepare environment for security tests
   * @returns {Promise<void>}
   */
  async prepare() {
    await super.prepare();
    
    // Set environment variables for security testing
    process.env.NODE_ENV = 'test';
    process.env.SECURITY_TEST_MODE = 'true';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.LOCALSTACK_ENDPOINT = this.serviceEndpoints.localstack;
    process.env.API_BASE_URL = this.serviceEndpoints.backend;
    process.env.FRONTEND_URL = this.serviceEndpoints.frontend;
    
    // Set security-specific environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-for-security-tests';
    process.env.RATE_LIMIT_WINDOW = '60000'; // 1 minute for testing
    process.env.RATE_LIMIT_MAX = '100'; // 100 requests per window for testing
    process.env.CORS_ORIGIN = this.serviceEndpoints.frontend;
    
    // Validate all required services before running tests
    const servicesValid = await this.validateSecurityServices();
    if (!servicesValid) {
      throw new Error('Service validation failed. Ensure all required services are running before executing security tests.');
    }
    
    this.logger.info('Security test environment prepared');
  }

  /**
   * Transform command arguments for security test execution
   * @param {Object} options - Execution options
   * @returns {Array} Array of command arguments
   */
  transformCommandArgs(options = {}) {
    const args = [];
    
    // Handle npm script execution
    if (this.command.includes('npm')) {
      args.push('npm', 'run');
      const commandParts = this.command.split(' ');
      const scriptName = commandParts[commandParts.length - 1];
      args.push(scriptName);
    } else {
      // Direct command execution
      const commandParts = this.command.split(' ');
      args.push(...commandParts);
    }

    // Add timeout for security tests
    if (args.includes('mocha') || this.command.includes('mocha')) {
      args.push('--timeout', this.testTimeout.toString());
    }

    // Add CI mode flags
    if (options.ci) {
      args.push('--reporter', 'json');
      args.push('--exit');
    }

    // Add verbose output for security test details
    if (options.verbose) {
      args.push('--reporter', 'spec');
    }

    // Add specific security test category if provided
    if (options.category && this.securityCategories.includes(options.category)) {
      args.push('--grep', options.category);
    }

    // Add specific test pattern if provided
    if (options.testPattern) {
      args.push('--grep', options.testPattern);
    }

    // Add bail on first critical vulnerability for faster feedback
    if (options.bail) {
      args.push('--bail');
    }

    // Add parallel execution for independent security tests
    if (options.parallel && this.canRunParallel) {
      args.push('--parallel');
    }

    return args;
  }

  /**
   * Parse security test results from output
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
      vulnerabilities: [],
      securityScore: 0,
      duration: 0,
      categories: {}
    };

    try {
      // Try to parse JSON output first (for CI mode or if it looks like JSON)
      if (stdout.trim().startsWith('{') || (stdout.includes('"stats"') && stdout.includes('"tests"'))) {
        let jsonToParse = stdout.trim();
        
        // If it looks like partial JSON, try to extract it
        if (!stdout.trim().startsWith('{')) {
          const jsonMatch = stdout.match(/\{[\s\S]*"stats"[\s\S]*\}/);
          if (jsonMatch) {
            jsonToParse = jsonMatch[0];
          }
        }
        
        const testResults = JSON.parse(jsonToParse);
        result.tests.total = testResults.stats.tests || 0;
        result.tests.passed = testResults.stats.passes || 0;
        result.tests.failed = testResults.stats.failures || 0;
        result.tests.skipped = testResults.stats.pending || 0;
        result.duration = testResults.stats.duration || 0;
        
        if (testResults.failures && testResults.failures.length > 0) {
          result.errors = testResults.failures.map(failure => ({
            test: failure.fullTitle,
            message: failure.err.message,
            stack: failure.err.stack,
            type: 'security_test_failure'
          }));
        }
        
        // Parse security-specific results
        result.vulnerabilities = this.parseVulnerabilitiesFromJson(testResults);
        result.securityScore = this.calculateSecurityScore(result);
        result.categories = this.categorizeSecurityResults(testResults);
        
        return result;
      }

      // Parse Mocha spec output
      const testSummaryMatch = stdout.match(/(\d+)\s+passing(?:\s+\(([^)]+)\))?/);
      if (testSummaryMatch) {
        result.tests.passed = parseInt(testSummaryMatch[1], 10);
        if (testSummaryMatch[2]) {
          result.duration = this.parseDuration(testSummaryMatch[2]);
        }
      }

      const failingMatch = stdout.match(/(\d+)\s+failing/);
      if (failingMatch) {
        result.tests.failed = parseInt(failingMatch[1], 10);
      }

      const pendingMatch = stdout.match(/(\d+)\s+pending/);
      if (pendingMatch) {
        result.tests.skipped = parseInt(pendingMatch[1], 10);
      }

      result.tests.total = result.tests.passed + result.tests.failed + result.tests.skipped;

      // Parse security-specific information from text output
      result.vulnerabilities = this.parseVulnerabilitiesFromText(stdout, stderr);
      result.securityScore = this.calculateSecurityScore(result);
      result.categories = this.categorizeSecurityResultsFromText(stdout);

      // Parse error details
      if (exitCode !== 0) {
        result.errors = this.parseSecurityErrorsFromOutput(stdout, stderr);
      }

    } catch (error) {
      this.logger.error(`Failed to parse security test results: ${error.message}`);
      result.errors.push({
        message: 'Failed to parse security test results',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return result;
  }

  /**
   * Parse vulnerabilities from JSON test results
   * @param {Object} testResults - JSON test results
   * @returns {Array} Array of vulnerability objects
   */
  parseVulnerabilitiesFromJson(testResults) {
    const vulnerabilities = [];
    
    try {
      if (testResults.failures) {
        testResults.failures.forEach(failure => {
          const vulnerability = this.extractVulnerabilityFromFailure(failure);
          if (vulnerability) {
            vulnerabilities.push(vulnerability);
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to parse vulnerabilities from JSON: ${error.message}`);
    }
    
    return vulnerabilities;
  }

  /**
   * Parse vulnerabilities from text output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Array} Array of vulnerability objects
   */
  parseVulnerabilitiesFromText(stdout, stderr) {
    const vulnerabilities = [];
    
    try {
      // Look for security vulnerability patterns in output
      const vulnerabilityPatterns = [
        /CRITICAL:\s*(.+)/gi,
        /HIGH:\s*(.+)/gi,
        /MEDIUM:\s*(.+)/gi,
        /LOW:\s*(.+)/gi,
        /VULNERABILITY:\s*(.+)/gi,
        /SECURITY ISSUE:\s*(.+)/gi,
        /XSS DETECTED:\s*(.+)/gi,
        /INJECTION DETECTED:\s*(.+)/gi,
        /AUTH BYPASS:\s*(.+)/gi,
        /RATE LIMIT BYPASS:\s*(.+)/gi
      ];

      const combinedOutput = stdout + '\n' + stderr;
      
      vulnerabilityPatterns.forEach(pattern => {
        const matches = combinedOutput.matchAll(pattern);
        for (const match of matches) {
          vulnerabilities.push({
            severity: this.extractSeverityFromPattern(pattern),
            description: match[1].trim(),
            category: this.categorizeVulnerability(match[1]),
            type: 'detected_vulnerability'
          });
        }
      });

    } catch (error) {
      this.logger.error(`Failed to parse vulnerabilities from text: ${error.message}`);
    }
    
    return vulnerabilities;
  }

  /**
   * Extract vulnerability information from test failure
   * @param {Object} failure - Test failure object
   * @returns {Object|null} Vulnerability object or null
   */
  extractVulnerabilityFromFailure(failure) {
    try {
      const title = failure.fullTitle || failure.title || '';
      const message = failure.err?.message || '';
      
      // Determine severity based on test title and message
      let severity = 'medium';
      if (title.toLowerCase().includes('critical') || message.toLowerCase().includes('critical')) {
        severity = 'critical';
      } else if (title.toLowerCase().includes('high') || message.toLowerCase().includes('high')) {
        severity = 'high';
      } else if (title.toLowerCase().includes('low') || message.toLowerCase().includes('low')) {
        severity = 'low';
      }

      return {
        test: title,
        severity,
        description: message,
        category: this.categorizeVulnerability(title + ' ' + message),
        type: 'test_failure_vulnerability'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract severity from regex pattern
   * @param {RegExp} pattern - Regex pattern
   * @returns {string} Severity level
   */
  extractSeverityFromPattern(pattern) {
    const patternStr = pattern.toString().toLowerCase();
    if (patternStr.includes('critical')) return 'critical';
    if (patternStr.includes('high')) return 'high';
    if (patternStr.includes('medium')) return 'medium';
    if (patternStr.includes('low')) return 'low';
    return 'info';
  }

  /**
   * Categorize vulnerability based on description
   * @param {string} description - Vulnerability description
   * @returns {string} Vulnerability category
   */
  categorizeVulnerability(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('auth') || desc.includes('login') || desc.includes('token')) {
      return 'authentication';
    }
    if (desc.includes('author') || desc.includes('permission') || desc.includes('access')) {
      return 'authorization';
    }
    if (desc.includes('xss') || desc.includes('script') || desc.includes('injection')) {
      return 'xss-prevention';
    }
    if (desc.includes('input') || desc.includes('validation') || desc.includes('sanitiz')) {
      return 'input-validation';
    }
    if (desc.includes('rate') || desc.includes('limit') || desc.includes('throttle')) {
      return 'rate-limiting';
    }
    if (desc.includes('cors') || desc.includes('origin') || desc.includes('header')) {
      return 'cors-policies';
    }
    if (desc.includes('api') || desc.includes('endpoint') || desc.includes('key')) {
      return 'api-security';
    }
    
    return 'general';
  }

  /**
   * Calculate security score based on test results
   * @param {Object} result - Test result object
   * @returns {number} Security score (0-100)
   */
  calculateSecurityScore(result) {
    try {
      if (result.tests.total === 0) {
        return 0;
      }

      const passRate = result.tests.passed / result.tests.total;
      let baseScore = passRate * 100;

      // Deduct points for vulnerabilities
      const vulnerabilities = result.vulnerabilities || [];
      const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
      const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
      const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;

      // Deduct points based on severity
      baseScore -= (criticalCount * 25); // -25 points per critical
      baseScore -= (highCount * 15);     // -15 points per high
      baseScore -= (mediumCount * 5);    // -5 points per medium

      return Math.max(0, Math.round(baseScore));
    } catch (error) {
      return 0;
    }
  }

  /**
   * Categorize security results by test category
   * @param {Object} testResults - Test results object
   * @returns {Object} Categorized results
   */
  categorizeSecurityResults(testResults) {
    const categories = {};
    
    try {
      this.securityCategories.forEach(category => {
        categories[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          vulnerabilities: []
        };
      });

      if (testResults.tests) {
        testResults.tests.forEach(test => {
          const category = this.categorizeVulnerability(test.title || '');
          if (categories[category]) {
            categories[category].total++;
            if (test.state === 'passed') {
              categories[category].passed++;
            } else if (test.state === 'failed') {
              categories[category].failed++;
            }
          }
        });
      }

    } catch (error) {
      this.logger.error(`Failed to categorize security results: ${error.message}`);
    }
    
    return categories;
  }

  /**
   * Categorize security results from text output
   * @param {string} stdout - Test stdout
   * @returns {Object} Categorized results
   */
  categorizeSecurityResultsFromText(stdout) {
    const categories = {};
    
    try {
      this.securityCategories.forEach(category => {
        categories[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          vulnerabilities: []
        };
      });

      // Parse test descriptions from output and categorize
      const testMatches = stdout.matchAll(/✓|×\s+(.+)/g);
      for (const match of testMatches) {
        const testDescription = match[1];
        const category = this.categorizeVulnerability(testDescription);
        if (categories[category]) {
          categories[category].total++;
          if (match[0].startsWith('✓')) {
            categories[category].passed++;
          } else {
            categories[category].failed++;
          }
        }
      }

    } catch (error) {
      this.logger.error(`Failed to categorize security results from text: ${error.message}`);
    }
    
    return categories;
  }

  /**
   * Parse duration string to milliseconds
   * @param {string} durationStr - Duration string (e.g., "1.5s", "500ms")
   * @returns {number} Duration in milliseconds
   */
  parseDuration(durationStr) {
    try {
      if (durationStr.includes('s')) {
        return parseFloat(durationStr.replace('s', '')) * 1000;
      } else if (durationStr.includes('ms')) {
        return parseFloat(durationStr.replace('ms', ''));
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Parse security-specific errors from test output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Array} Array of error objects
   */
  parseSecurityErrorsFromOutput(stdout, stderr) {
    const errors = [];

    try {
      // Parse Mocha test failures with security context
      const failureMatches = stdout.matchAll(/\d+\)\s+(.+?)\n\n?\s+(.+?)\n/g);
      for (const match of failureMatches) {
        errors.push({
          test: match[1].trim(),
          message: match[2].trim(),
          category: this.categorizeVulnerability(match[1] + ' ' + match[2]),
          type: 'security_test_failure'
        });
      }

      // Parse service validation errors
      if (stderr.includes('Service') && stderr.includes('not responding')) {
        errors.push({
          message: 'Security test service validation failed',
          details: stderr.trim(),
          type: 'service_error'
        });
      }

      // Parse authentication errors
      if (stderr.includes('auth') || stderr.includes('unauthorized') || stderr.includes('forbidden')) {
        errors.push({
          message: 'Authentication/Authorization test failed',
          details: stderr.trim(),
          type: 'auth_error'
        });
      }

      // Parse connection errors
      if (stderr.includes('ECONNREFUSED') || stderr.includes('timeout')) {
        errors.push({
          message: 'Connection error during security tests',
          details: stderr.trim(),
          type: 'connection_error'
        });
      }

      // Add generic error if no specific errors found but exit code indicates failure
      if (errors.length === 0 && stderr.trim()) {
        errors.push({
          message: 'Security test execution failed',
          details: stderr.trim(),
          type: 'execution_error'
        });
      }

    } catch (error) {
      errors.push({
        message: 'Failed to parse security error details',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return errors;
  }

  /**
   * Get security test categories
   * @returns {Array} Array of security test categories
   */
  getSecurityCategories() {
    return this.securityCategories;
  }

  /**
   * Get vulnerability severity levels
   * @returns {Array} Array of vulnerability severity levels
   */
  getVulnerabilitySeverityLevels() {
    return this.vulnerabilityLevels;
  }

  /**
   * Get required data scenario for security tests
   * @returns {string} Required data scenario name
   */
  getRequiredDataScenario() {
    return 'minimal'; // Use minimal scenario for security tests
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
      securityCategories: this.getSecurityCategories(),
      vulnerabilitySeverityLevels: this.getVulnerabilitySeverityLevels(),
      serviceEndpoints: this.serviceEndpoints,
      testTimeout: this.testTimeout,
      maxRetries: this.maxRetries,
      dataScenario: this.getRequiredDataScenario()
    };
  }

  /**
   * Clean up after security tests
   * @returns {Promise<void>}
   */
  async cleanup() {
    await super.cleanup();
    
    try {
      this.logger.info('Cleaning up security test artifacts...');
      
      // Clean up any security test data or temporary files
      const artifactDirs = [
        'security-reports',
        'vulnerability-reports',
        'test-results'
      ];
      
      for (const dir of artifactDirs) {
        const artifactPath = path.join(process.cwd(), this.workspace, dir);
        try {
          await fs.access(artifactPath);
          this.logger.info(`Security test artifacts available in: ${artifactPath}`);
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }
      
      // Reset security-specific environment variables
      delete process.env.SECURITY_TEST_MODE;
      delete process.env.JWT_SECRET;
      delete process.env.RATE_LIMIT_WINDOW;
      delete process.env.RATE_LIMIT_MAX;
      
      this.logger.info('Security test cleanup completed');
    } catch (error) {
      this.logger.error(`Security test cleanup failed: ${error.message}`);
    }
  }
}