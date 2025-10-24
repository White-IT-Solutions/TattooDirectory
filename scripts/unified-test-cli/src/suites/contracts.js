/**
 * ContractSuite - API contract validation test suite implementation
 * 
 * Executes contract tests including OpenAPI schema compliance testing,
 * request/response validation, and breaking change detection.
 * Provides detailed contract validation reports and API compatibility analysis.
 */

import { BaseSuite } from './base-suite.js';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';

export class ContractSuite extends BaseSuite {
  constructor(config) {
    super(config);
    this.serviceEndpoints = {
      localstack: 'http://localhost:4566',
      backend: 'http://localhost:9000',
      frontend: 'http://localhost:3000'
    };
    this.testTimeout = 90000; // 1.5 minutes for contract tests
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.contractCategories = [
      'schema-compliance',
      'request-validation',
      'response-validation',
      'breaking-changes',
      'api-versioning',
      'data-types',
      'error-responses'
    ];
    this.severityLevels = ['critical', 'major', 'minor', 'patch'];
    this.openApiSpecPath = path.join(process.cwd(), 'backend', 'docs', 'openapi.yaml');
  }

  /**
   * Custom validation for contract tests
   * @returns {Promise<boolean>} True if validation passes
   */
  async customValidation() {
    try {
      // Check if contract test workspace exists
      const contractPath = path.join(process.cwd(), this.workspace);
      await fs.access(contractPath);

      // Check for package.json with required contract testing dependencies
      const packageJsonPath = path.join(contractPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        // Check for contract testing frameworks
        const contractDeps = [
          'mocha', 'chai', 'axios', // Basic testing
          'ajv', 'js-yaml', // Schema validation
          'openapi-schema-validator', // OpenAPI validation
          'swagger-parser', 'json-schema-diff' // API analysis
        ];

        const availableDeps = contractDeps.filter(dep => 
          packageJson.dependencies?.[dep] || 
          packageJson.devDependencies?.[dep] ||
          packageJson.peerDependencies?.[dep]
        );

        if (availableDeps.length === 0) {
          this.logger.warn('No contract testing dependencies found, using basic HTTP testing');
        } else {
          this.logger.info(`Contract testing dependencies available: ${availableDeps.join(', ')}`);
        }

      } catch (error) {
        this.logger.error(`Failed to read contract package.json: ${error.message}`);
        return false;
      }

      // Check for OpenAPI specification file
      await this.validateOpenApiSpec();

      // Check for contract test files
      const hasTests = await this.checkForContractTests(contractPath);
      if (!hasTests) {
        this.logger.warn('No contract test files found');
      }

      // Check for contract configuration files
      await this.validateContractConfiguration(contractPath);

      return true;
    } catch (error) {
      this.logger.error(`Contract suite validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate OpenAPI specification file exists and is valid
   * @returns {Promise<void>}
   */
  async validateOpenApiSpec() {
    try {
      await fs.access(this.openApiSpecPath);
      this.logger.info(`Found OpenAPI specification: ${this.openApiSpecPath}`);
      
      // Try to parse the YAML file
      const specContent = await fs.readFile(this.openApiSpecPath, 'utf8');
      
      // Basic validation - check for required OpenAPI fields
      if (!specContent.includes('openapi:') && !specContent.includes('swagger:')) {
        throw new Error('Invalid OpenAPI specification format');
      }
      
      if (!specContent.includes('paths:')) {
        throw new Error('OpenAPI specification missing paths section');
      }
      
      this.logger.info('OpenAPI specification appears valid');
    } catch (error) {
      this.logger.error(`OpenAPI specification validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for contract test files
   * @param {string} contractPath - Path to contract test workspace
   * @returns {Promise<boolean>} True if test files are found
   */
  async checkForContractTests(contractPath) {
    try {
      const testDirs = ['schema', 'validation', 'breaking-changes', 'api', 'contracts'];
      let hasTestFiles = false;
      
      for (const testDir of testDirs) {
        const testDirPath = path.join(contractPath, testDir);
        try {
          const stats = await fs.stat(testDirPath);
          if (stats.isDirectory()) {
            const hasTests = await this.findTestFilesRecursively(testDirPath);
            if (hasTests) {
              hasTestFiles = true;
              this.logger.info(`Found contract tests in: ${testDir}`);
            }
          }
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }

      // Check for test files in root of contract workspace
      const hasRootTests = await this.findTestFilesRecursively(contractPath);
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
          // Check for contract test file patterns
          const testPatterns = [
            /\.test\.(js|ts|mjs)$/,
            /\.spec\.(js|ts|mjs)$/,
            /contract.*\.(js|ts|mjs)$/,
            /schema.*\.(js|ts|mjs)$/,
            /api.*\.(js|ts|mjs)$/,
            /validation.*\.(js|ts|mjs)$/,
            /breaking.*change.*\.(js|ts|mjs)$/
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
   * Validate contract configuration files
   * @param {string} contractPath - Path to contract test workspace
   * @returns {Promise<void>}
   */
  async validateContractConfiguration(contractPath) {
    try {
      // Check for contract test configuration
      const configFiles = [
        'contract.config.js',
        'contract.config.json',
        '.contractrc',
        'mocha.opts',
        'openapi.config.js'
      ];

      for (const configFile of configFiles) {
        const configPath = path.join(contractPath, configFile);
        try {
          await fs.access(configPath);
          this.logger.info(`Found contract configuration: ${configFile}`);
        } catch (error) {
          // Config file doesn't exist, continue
        }
      }

      // Check for contract test data
      const testDataPath = path.join(contractPath, 'test-data');
      try {
        await fs.access(testDataPath);
        this.logger.info('Found contract test data directory');
      } catch (error) {
        this.logger.warn('No contract test data directory found');
      }

      // Check for schema files
      const schemaPath = path.join(contractPath, 'schemas');
      try {
        await fs.access(schemaPath);
        this.logger.info('Found contract schemas directory');
      } catch (error) {
        this.logger.warn('No contract schemas directory found');
      }

    } catch (error) {
      this.logger.warn(`Contract configuration validation failed: ${error.message}`);
    }
  }

  /**
   * Validate all required services for contract tests
   * @returns {Promise<boolean>} True if all services are responding
   */
  async validateContractServices() {
    this.logger.info('Validating services for contract testing...');
    
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
          timeout: 5000,
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
      this.logger.info('Validating AWS services for contract tests...');
      
      // Import AWS SDK modules dynamically
      const { DynamoDBClient, ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
      
      const awsConfig = {
        region: 'us-east-1',
        endpoint: this.serviceEndpoints.localstack,
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test'
        }
      };

      // Test DynamoDB for data contract validation
      try {
        const dynamoClient = new DynamoDBClient(awsConfig);
        await dynamoClient.send(new ListTablesCommand({}));
        this.logger.info('✅ DynamoDB is accessible for contract tests');
      } catch (error) {
        this.logger.error(`❌ DynamoDB is not accessible: ${error.message}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`AWS services validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Prepare environment for contract tests
   * @returns {Promise<void>}
   */
  async prepare() {
    await super.prepare();
    
    // Set environment variables for contract testing
    process.env.NODE_ENV = 'test';
    process.env.CONTRACT_TEST_MODE = 'true';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.LOCALSTACK_ENDPOINT = this.serviceEndpoints.localstack;
    process.env.API_BASE_URL = this.serviceEndpoints.backend;
    process.env.OPENAPI_SPEC_PATH = this.openApiSpecPath;
    
    // Set contract-specific environment variables
    process.env.CONTRACT_VALIDATION_STRICT = 'true';
    process.env.BREAKING_CHANGE_DETECTION = 'true';
    process.env.SCHEMA_VALIDATION_ENABLED = 'true';
    
    // Validate all required services before running tests
    const servicesValid = await this.validateContractServices();
    if (!servicesValid) {
      throw new Error('Service validation failed. Ensure all required services are running before executing contract tests.');
    }
    
    this.logger.info('Contract test environment prepared');
  }

  /**
   * Transform command arguments for contract test execution
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

    // Add timeout for contract tests
    if (args.includes('mocha') || this.command.includes('mocha')) {
      args.push('--timeout', this.testTimeout.toString());
    }

    // Add CI mode flags
    if (options.ci) {
      args.push('--reporter', 'json');
      args.push('--exit');
    }

    // Add verbose output for contract test details
    if (options.verbose) {
      args.push('--reporter', 'spec');
    }

    // Add specific contract test category if provided
    if (options.category && this.contractCategories.includes(options.category)) {
      args.push('--grep', options.category);
    }

    // Add specific test pattern if provided
    if (options.testPattern) {
      args.push('--grep', options.testPattern);
    }

    // Add bail on first critical contract violation for faster feedback
    if (options.bail) {
      args.push('--bail');
    }

    // Add parallel execution for independent contract tests
    if (options.parallel && this.canRunParallel) {
      args.push('--parallel');
    }

    return args;
  }

  /**
   * Parse contract test results from output
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
      contractViolations: [],
      breakingChanges: [],
      schemaValidationResults: {},
      compatibilityScore: 0,
      duration: 0,
      categories: {}
    };

    try {
      // Try to parse JSON output first (for CI mode or if it looks like JSON)
      const looksLikeJson = stdout.trim().startsWith('{') || stdout.trim().startsWith('[') || stdout.includes('{');
      const hasJsonStructure = stdout.includes('"stats"') && stdout.includes('"tests"');
      
      if (hasJsonStructure || looksLikeJson) {
        let jsonToParse = stdout;
        
        if (hasJsonStructure) {
          const jsonMatch = stdout.match(/\{[\s\S]*"stats"[\s\S]*\}/);
          if (jsonMatch) {
            jsonToParse = jsonMatch[0];
          }
        }
        
        const testResults = JSON.parse(jsonToParse);
        
        // Only process if we have valid test results structure
        if (testResults && typeof testResults === 'object') {
          result.tests.total = testResults.stats?.tests || 0;
          result.tests.passed = testResults.stats?.passes || 0;
          result.tests.failed = testResults.stats?.failures || 0;
          result.tests.skipped = testResults.stats?.pending || 0;
          result.duration = testResults.stats?.duration || 0;
          
          if (testResults.failures && testResults.failures.length > 0) {
            result.errors = testResults.failures.map(failure => ({
              test: failure.fullTitle,
              message: failure.err.message,
              stack: failure.err.stack,
              type: 'contract_test_failure'
            }));
          }
          
          // Parse contract-specific results only if we have proper structure
          if (hasJsonStructure) {
            result.contractViolations = this.parseContractViolationsFromJson(testResults);
            result.breakingChanges = this.parseBreakingChangesFromJson(testResults);
            result.schemaValidationResults = this.parseSchemaValidationFromJson(testResults);
            result.compatibilityScore = this.calculateCompatibilityScore(result);
            result.categories = this.categorizeContractResults(testResults);
          }
          
          return result;
        }
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

      // Parse contract-specific information from text output
      result.contractViolations = this.parseContractViolationsFromText(stdout, stderr);
      result.breakingChanges = this.parseBreakingChangesFromText(stdout, stderr);
      result.schemaValidationResults = this.parseSchemaValidationFromText(stdout);
      result.compatibilityScore = this.calculateCompatibilityScore(result);
      result.categories = this.categorizeContractResultsFromText(stdout);

      // Parse error details
      if (exitCode !== 0) {
        result.errors = this.parseContractErrorsFromOutput(stdout, stderr);
      }

    } catch (error) {
      this.logger.error(`Failed to parse contract test results: ${error.message}`);
      result.errors.push({
        message: 'Failed to parse contract test results',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return result;
  }

  /**
   * Parse contract violations from JSON test results
   * @param {Object} testResults - JSON test results
   * @returns {Array} Array of contract violation objects
   */
  parseContractViolationsFromJson(testResults) {
    const violations = [];
    
    try {
      if (testResults.failures) {
        testResults.failures.forEach(failure => {
          const violation = this.extractContractViolationFromFailure(failure);
          if (violation) {
            violations.push(violation);
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to parse contract violations from JSON: ${error.message}`);
    }
    
    return violations;
  }

  /**
   * Parse contract violations from text output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Array} Array of contract violation objects
   */
  parseContractViolationsFromText(stdout, stderr) {
    const violations = [];
    
    try {
      // Look for contract violation patterns in output
      const violationPatterns = [
        /SCHEMA VIOLATION:\s*(.+)/gi,
        /CONTRACT VIOLATION:\s*(.+)/gi,
        /API MISMATCH:\s*(.+)/gi,
        /VALIDATION ERROR:\s*(.+)/gi,
        /BREAKING CHANGE:\s*(.+)/gi,
        /INCOMPATIBLE:\s*(.+)/gi
      ];

      const combinedOutput = stdout + '\n' + stderr;
      
      violationPatterns.forEach(pattern => {
        const matches = combinedOutput.matchAll(pattern);
        for (const match of matches) {
          violations.push({
            severity: this.extractSeverityFromViolation(match[1]),
            description: match[1].trim(),
            category: this.categorizeContractViolation(match[1]),
            type: 'contract_violation'
          });
        }
      });

    } catch (error) {
      this.logger.error(`Failed to parse contract violations from text: ${error.message}`);
    }
    
    return violations;
  }

  /**
   * Parse breaking changes from JSON test results
   * @param {Object} testResults - JSON test results
   * @returns {Array} Array of breaking change objects
   */
  parseBreakingChangesFromJson(testResults) {
    const breakingChanges = [];
    
    try {
      if (testResults.failures) {
        testResults.failures.forEach(failure => {
          if (this.isBreakingChange(failure)) {
            breakingChanges.push({
              test: failure.fullTitle,
              change: failure.err.message,
              severity: this.getBreakingChangeSeverity(failure),
              category: this.categorizeBreakingChange(failure)
            });
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to parse breaking changes from JSON: ${error.message}`);
    }
    
    return breakingChanges;
  }

  /**
   * Parse breaking changes from text output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Array} Array of breaking change objects
   */
  parseBreakingChangesFromText(stdout, stderr) {
    const breakingChanges = [];
    
    try {
      const breakingChangePatterns = [
        /BREAKING CHANGE:\s*(.+)/gi,
        /MAJOR VERSION CHANGE:\s*(.+)/gi,
        /INCOMPATIBLE CHANGE:\s*(.+)/gi,
        /API REMOVED:\s*(.+)/gi,
        /FIELD REMOVED:\s*(.+)/gi
      ];

      const combinedOutput = stdout + '\n' + stderr;
      
      breakingChangePatterns.forEach(pattern => {
        const matches = combinedOutput.matchAll(pattern);
        for (const match of matches) {
          breakingChanges.push({
            change: match[1].trim(),
            severity: 'major',
            category: this.categorizeBreakingChange({ err: { message: match[1] } }),
            type: 'breaking_change'
          });
        }
      });

    } catch (error) {
      this.logger.error(`Failed to parse breaking changes from text: ${error.message}`);
    }
    
    return breakingChanges;
  }

  /**
   * Parse schema validation results from JSON
   * @param {Object} testResults - JSON test results
   * @returns {Object} Schema validation results
   */
  parseSchemaValidationFromJson(testResults) {
    const schemaResults = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    try {
      if (testResults.failures) {
        testResults.failures.forEach(failure => {
          if (failure.fullTitle && failure.fullTitle.toLowerCase().includes('schema')) {
            schemaResults.valid = false;
            schemaResults.errors.push({
              path: this.extractSchemaPath(failure),
              message: failure.err.message,
              severity: 'error'
            });
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to parse schema validation from JSON: ${error.message}`);
    }
    
    return schemaResults;
  }

  /**
   * Parse schema validation results from text output
   * @param {string} stdout - Test stdout
   * @returns {Object} Schema validation results
   */
  parseSchemaValidationFromText(stdout) {
    const schemaResults = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    try {
      const schemaErrorPatterns = [
        /SCHEMA ERROR:\s*(.+)/gi,
        /VALIDATION FAILED:\s*(.+)/gi,
        /INVALID SCHEMA:\s*(.+)/gi
      ];

      schemaErrorPatterns.forEach(pattern => {
        const matches = stdout.matchAll(pattern);
        for (const match of matches) {
          schemaResults.valid = false;
          schemaResults.errors.push({
            message: match[1].trim(),
            severity: 'error'
          });
        }
      });

    } catch (error) {
      this.logger.error(`Failed to parse schema validation from text: ${error.message}`);
    }
    
    return schemaResults;
  }

  /**
   * Extract contract violation from test failure
   * @param {Object} failure - Test failure object
   * @returns {Object|null} Contract violation object or null
   */
  extractContractViolationFromFailure(failure) {
    try {
      const title = failure.fullTitle || failure.title || '';
      const message = failure.err?.message || '';
      
      // Determine severity based on test title and message
      let severity = 'minor';
      if (title.toLowerCase().includes('critical') || message.toLowerCase().includes('critical')) {
        severity = 'critical';
      } else if (title.toLowerCase().includes('major') || message.toLowerCase().includes('major')) {
        severity = 'major';
      } else if (title.toLowerCase().includes('patch') || message.toLowerCase().includes('patch')) {
        severity = 'patch';
      }

      return {
        test: title,
        severity,
        description: message,
        category: this.categorizeContractViolation(title + ' ' + message),
        type: 'test_failure_violation'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract severity from contract violation description
   * @param {string} description - Violation description
   * @returns {string} Severity level
   */
  extractSeverityFromViolation(description) {
    const desc = description.toLowerCase();
    if (desc.includes('critical') || desc.includes('breaking')) return 'critical';
    if (desc.includes('major') || desc.includes('incompatible')) return 'major';
    if (desc.includes('minor') || desc.includes('warning')) return 'minor';
    return 'patch';
  }

  /**
   * Categorize contract violation based on description
   * @param {string} description - Violation description
   * @returns {string} Violation category
   */
  categorizeContractViolation(description) {
    const desc = description.toLowerCase();
    
    // Check for response-related issues first (more specific)
    if (desc.includes('response') || desc.includes('output')) {
      return 'response-validation';
    }
    // Check for request-related issues
    if (desc.includes('request') || desc.includes('input')) {
      return 'request-validation';
    }
    // Check for data types (prioritize over general validation)
    if (desc.includes('type') || desc.includes('format')) {
      return 'data-types';
    }
    // Check for breaking changes
    if (desc.includes('breaking') || desc.includes('incompatible')) {
      return 'breaking-changes';
    }
    // Check for API versioning
    if (desc.includes('version') || desc.includes('api')) {
      return 'api-versioning';
    }
    // Check for error responses
    if (desc.includes('error') || desc.includes('status')) {
      return 'error-responses';
    }
    // Check for schema-related issues (more general)
    if (desc.includes('schema') || desc.includes('validation')) {
      return 'schema-compliance';
    }
    
    return 'general';
  }

  /**
   * Check if test failure represents a breaking change
   * @param {Object} failure - Test failure object
   * @returns {boolean} True if breaking change
   */
  isBreakingChange(failure) {
    const title = (failure.fullTitle || '').toLowerCase();
    const message = (failure.err?.message || '').toLowerCase();
    
    const breakingKeywords = [
      'breaking', 'removed', 'deleted', 'incompatible',
      'major', 'deprecated', 'changed type', 'required field'
    ];
    
    return breakingKeywords.some(keyword => 
      title.includes(keyword) || message.includes(keyword)
    );
  }

  /**
   * Get breaking change severity
   * @param {Object} failure - Test failure object
   * @returns {string} Severity level
   */
  getBreakingChangeSeverity(failure) {
    const message = (failure.err?.message || '').toLowerCase();
    
    if (message.includes('removed') || message.includes('deleted')) {
      return 'critical';
    }
    if (message.includes('changed type') || message.includes('incompatible')) {
      return 'major';
    }
    if (message.includes('deprecated')) {
      return 'minor';
    }
    
    return 'major'; // Default for breaking changes
  }

  /**
   * Categorize breaking change
   * @param {Object} failure - Test failure object
   * @returns {string} Breaking change category
   */
  categorizeBreakingChange(failure) {
    const message = (failure.err?.message || '').toLowerCase();
    
    if (message.includes('endpoint') || message.includes('path')) {
      return 'api-endpoint';
    }
    if (message.includes('field') || message.includes('property')) {
      return 'data-field';
    }
    if (message.includes('type') || message.includes('format')) {
      return 'data-type';
    }
    if (message.includes('parameter') || message.includes('query')) {
      return 'parameter';
    }
    if (message.includes('response') || message.includes('status')) {
      return 'response-format';
    }
    
    return 'general';
  }

  /**
   * Extract schema path from test failure
   * @param {Object} failure - Test failure object
   * @returns {string} Schema path
   */
  extractSchemaPath(failure) {
    try {
      const message = failure.err?.message || '';
      const pathMatch = message.match(/path:\s*([^\s,]+)/i);
      return pathMatch ? pathMatch[1] : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Calculate API compatibility score based on test results
   * @param {Object} result - Test result object
   * @returns {number} Compatibility score (0-100)
   */
  calculateCompatibilityScore(result) {
    try {
      if (result.tests.total === 0) {
        return 0;
      }

      const passRate = result.tests.passed / result.tests.total;
      let baseScore = passRate * 100;

      // Deduct points for contract violations
      const violations = result.contractViolations || [];
      const criticalCount = violations.filter(v => v.severity === 'critical').length;
      const majorCount = violations.filter(v => v.severity === 'major').length;
      const minorCount = violations.filter(v => v.severity === 'minor').length;

      // Deduct points for breaking changes
      const breakingChanges = result.breakingChanges || [];
      const breakingCount = breakingChanges.length;

      // Deduct points based on severity
      baseScore -= (criticalCount * 30); // -30 points per critical violation
      baseScore -= (majorCount * 20);    // -20 points per major violation
      baseScore -= (minorCount * 5);     // -5 points per minor violation
      baseScore -= (breakingCount * 25); // -25 points per breaking change

      return Math.max(0, Math.round(baseScore));
    } catch (error) {
      return 0;
    }
  }

  /**
   * Categorize contract results by test category
   * @param {Object} testResults - Test results object
   * @returns {Object} Categorized results
   */
  categorizeContractResults(testResults) {
    const categories = {};
    
    try {
      this.contractCategories.forEach(category => {
        categories[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          violations: []
        };
      });

      if (testResults.tests) {
        testResults.tests.forEach(test => {
          const category = this.categorizeContractViolation(test.title || '');
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
      this.logger.error(`Failed to categorize contract results: ${error.message}`);
    }
    
    return categories;
  }

  /**
   * Categorize contract results from text output
   * @param {string} stdout - Test stdout
   * @returns {Object} Categorized results
   */
  categorizeContractResultsFromText(stdout) {
    const categories = {};
    
    try {
      this.contractCategories.forEach(category => {
        categories[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          violations: []
        };
      });

      // Parse test descriptions from output and categorize
      const testMatches = stdout.matchAll(/✓|×\s+(.+)/g);
      for (const match of testMatches) {
        const testDescription = match[1];
        const category = this.categorizeContractViolation(testDescription);
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
      this.logger.error(`Failed to categorize contract results from text: ${error.message}`);
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
   * Parse contract-specific errors from test output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Array} Array of error objects
   */
  parseContractErrorsFromOutput(stdout, stderr) {
    const errors = [];

    try {
      // Parse Mocha test failures with contract context
      const failureMatches = stdout.matchAll(/\d+\)\s+(.+?)\n\n?\s+(.+?)\n/g);
      for (const match of failureMatches) {
        errors.push({
          test: match[1].trim(),
          message: match[2].trim(),
          category: this.categorizeContractViolation(match[1] + ' ' + match[2]),
          type: 'contract_test_failure'
        });
      }

      // Parse service validation errors
      if (stderr.includes('Service') && stderr.includes('not responding')) {
        errors.push({
          message: 'Contract test service validation failed',
          details: stderr.trim(),
          type: 'service_error'
        });
      }

      // Parse OpenAPI specification errors
      if (stderr.includes('OpenAPI') || stderr.includes('schema')) {
        errors.push({
          message: 'OpenAPI specification validation failed',
          details: stderr.trim(),
          type: 'schema_error'
        });
      }

      // Parse connection errors
      if (stderr.includes('ECONNREFUSED') || stderr.includes('timeout')) {
        errors.push({
          message: 'Connection error during contract tests',
          details: stderr.trim(),
          type: 'connection_error'
        });
      }

      // Add generic error if no specific errors found but exit code indicates failure
      if (errors.length === 0 && stderr.trim()) {
        errors.push({
          message: 'Contract test execution failed',
          details: stderr.trim(),
          type: 'execution_error'
        });
      }

    } catch (error) {
      errors.push({
        message: 'Failed to parse contract error details',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return errors;
  }

  /**
   * Get contract test categories
   * @returns {Array} Array of contract test categories
   */
  getContractCategories() {
    return this.contractCategories;
  }

  /**
   * Get severity levels for contract violations
   * @returns {Array} Array of severity levels
   */
  getSeverityLevels() {
    return this.severityLevels;
  }

  /**
   * Get required data scenario for contract tests
   * @returns {string} Required data scenario name
   */
  getRequiredDataScenario() {
    return 'minimal'; // Use minimal scenario for contract tests
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
      contractCategories: this.contractCategories,
      severityLevels: this.severityLevels,
      openApiSpecPath: this.openApiSpecPath,
      serviceEndpoints: this.serviceEndpoints
    };
  }
}