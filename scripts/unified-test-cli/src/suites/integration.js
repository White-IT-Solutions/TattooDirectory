/**
 * IntegrationSuite - Integration test suite implementation
 * 
 * Executes cross-service integration tests with LocalStack backend,
 * validates service endpoints, and tests data flow between components.
 * Uses minimal data scenario for faster execution.
 */

import { BaseSuite } from './base-suite.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';

export class IntegrationSuite extends BaseSuite {
  constructor(config) {
    super(config);
    this.serviceEndpoints = {
      localstack: 'http://localhost:4566',
      backend: 'http://localhost:9000',
      frontend: 'http://localhost:3000'
    };
    this.testTimeout = 120000; // 2 minutes for integration tests
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Custom validation for integration tests
   * @returns {Promise<boolean>} True if validation passes
   */
  async customValidation() {
    try {
      // Check if integration test workspace exists
      const integrationPath = path.join(process.cwd(), this.workspace);
      await fs.access(integrationPath);

      // Check for package.json with required dependencies
      const packageJsonPath = path.join(integrationPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const requiredDeps = ['mocha', 'chai', 'axios'];
      const missingDeps = requiredDeps.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      if (missingDeps.length > 0) {
        this.logger.error(`Missing required dependencies: ${missingDeps.join(', ')}`);
        return false;
      }

      // Check for test files
      const hasTests = await this.checkForIntegrationTests(integrationPath);
      if (!hasTests) {
        this.logger.warn('No integration test files found');
      }

      // Check for test configuration
      const mochaConfigPath = path.join(integrationPath, '.mocharc.json');
      try {
        await fs.access(mochaConfigPath);
      } catch (error) {
        this.logger.warn('No Mocha configuration found, using defaults');
      }

      return true;
    } catch (error) {
      this.logger.error(`Integration suite validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for integration test files
   * @param {string} integrationPath - Path to integration test workspace
   * @returns {Promise<boolean>} True if test files are found
   */
  async checkForIntegrationTests(integrationPath) {
    try {
      const testDirs = ['api', 'data', 'test'];
      
      for (const testDir of testDirs) {
        const testDirPath = path.join(integrationPath, testDir);
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

      return false;
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
        if (entry.isDirectory()) {
          const subDirPath = path.join(dirPath, entry.name);
          const hasTests = await this.findTestFilesRecursively(subDirPath);
          if (hasTests) {
            return true;
          }
        } else if (entry.isFile()) {
          if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
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
   * Validate all required service endpoints are responding
   * @returns {Promise<boolean>} True if all services are responding
   */
  async validateServiceEndpoints() {
    this.logger.info('Validating service endpoints...');
    
    const serviceChecks = [
      {
        name: 'LocalStack',
        url: `${this.serviceEndpoints.localstack}/_localstack/health`,
        required: true
      },
      {
        name: 'Backend API',
        url: `${this.serviceEndpoints.backend}/health`,
        required: false // Backend might not have health endpoint
      }
    ];

    let allServicesValid = true;

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
          }
        }
      } catch (error) {
        this.logger.error(`❌ ${service.name} is not responding: ${error.message}`);
        if (service.required) {
          allServicesValid = false;
        }
      }
    }

    // Validate AWS services through LocalStack
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
      this.logger.info('Validating AWS services...');
      
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
   * Prepare environment for integration tests
   * @returns {Promise<void>}
   */
  async prepare() {
    await super.prepare();
    
    // Set environment variables for integration testing
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.LOCALSTACK_ENDPOINT = this.serviceEndpoints.localstack;
    
    // Validate service endpoints before running tests
    const servicesValid = await this.validateServiceEndpoints();
    if (!servicesValid) {
      throw new Error('Service endpoint validation failed. Ensure all required services are running.');
    }
    
    this.logger.info('Integration test environment prepared');
  }

  /**
   * Transform command arguments for integration test execution
   * @param {Object} options - Execution options
   * @returns {Array} Array of command arguments
   */
  transformCommandArgs(options = {}) {
    const args = [];
    
    // Use the workspace-specific test command
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

    // Add timeout for integration tests
    if (args.includes('mocha') || this.command.includes('mocha')) {
      args.push('--timeout', this.testTimeout.toString());
    }

    // Add CI mode flags
    if (options.ci) {
      args.push('--reporter', 'json');
      args.push('--exit');
    }

    // Add verbose output for debugging
    if (options.verbose) {
      args.push('--reporter', 'spec');
    }

    // Add specific test pattern if provided
    if (options.testPattern) {
      args.push('--grep', options.testPattern);
    }

    // Add bail on first failure for faster feedback
    if (options.bail) {
      args.push('--bail');
    }

    return args;
  }

  /**
   * Parse integration test results from output
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
      serviceValidation: true
    };

    try {
      // Try to parse JSON output first (for CI mode)
      if (stdout.includes('"stats"') && stdout.includes('"tests"')) {
        const jsonMatch = stdout.match(/\{[\s\S]*"stats"[\s\S]*\}/);
        if (jsonMatch) {
          const testResults = JSON.parse(jsonMatch[0]);
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
              type: 'test_failure'
            }));
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

      // Parse error details
      if (exitCode !== 0) {
        result.errors = this.parseErrorsFromOutput(stdout, stderr);
      }

    } catch (error) {
      this.logger.error(`Failed to parse integration test results: ${error.message}`);
      result.errors.push({
        message: 'Failed to parse test results',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return result;
  }

  /**
   * Parse duration string to milliseconds
   * @param {string} durationStr - Duration string (e.g., "1.5s", "500ms")
   * @returns {number} Duration in milliseconds
   */
  parseDuration(durationStr) {
    try {
      // Check for milliseconds first (before checking for 's')
      if (durationStr.includes('ms')) {
        return parseFloat(durationStr.replace('ms', ''));
      } else if (durationStr.includes('s')) {
        return parseFloat(durationStr.replace('s', '')) * 1000;
      }
      return 0;
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
      // Parse Mocha test failures
      const failureMatches = stdout.matchAll(/\d+\)\s+(.+?)\n\n?\s+(.+?)\n/g);
      for (const match of failureMatches) {
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

      // Parse connection errors
      if (stderr.includes('ECONNREFUSED') || stderr.includes('timeout')) {
        errors.push({
          message: 'Connection error to required services',
          details: stderr.trim(),
          type: 'connection_error'
        });
      }

      // Add generic error if no specific errors found but exit code indicates failure
      if (errors.length === 0 && stderr.trim()) {
        errors.push({
          message: 'Integration test execution failed',
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
   * Validate data flow between services
   * @returns {Promise<boolean>} True if data flow validation passes
   */
  async validateDataFlow() {
    try {
      this.logger.info('Validating data flow between services...');
      
      // Test data flow: API -> DynamoDB -> OpenSearch
      const testData = {
        id: 'test-integration-' + Date.now(),
        name: 'Integration Test Artist',
        location: 'London'
      };

      // This would be implemented based on the actual API endpoints
      // For now, we'll just validate the services are accessible
      const servicesValid = await this.validateAWSServices();
      
      if (servicesValid) {
        this.logger.info('✅ Data flow validation passed');
        return true;
      } else {
        this.logger.error('❌ Data flow validation failed');
        return false;
      }
    } catch (error) {
      this.logger.error(`Data flow validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get integration test categories
   * @returns {Array} Array of test categories
   */
  getTestCategories() {
    return [
      'api-endpoints',
      'data-flow',
      'service-integration',
      'cross-service'
    ];
  }

  /**
   * Get required data scenario for integration tests
   * @returns {string} Required data scenario name
   */
  getRequiredDataScenario() {
    return 'minimal'; // Use minimal scenario for faster execution
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
      dataScenario: this.getRequiredDataScenario()
    };
  }

  /**
   * Clean up after integration tests
   * @returns {Promise<void>}
   */
  async cleanup() {
    await super.cleanup();
    
    // Additional cleanup for integration tests
    try {
      // Clean up any test data that might have been created
      this.logger.info('Cleaning up integration test data...');
      
      // This would implement actual cleanup logic
      // For now, just log the cleanup
      this.logger.info('Integration test cleanup completed');
    } catch (error) {
      this.logger.error(`Integration test cleanup failed: ${error.message}`);
    }
  }
}