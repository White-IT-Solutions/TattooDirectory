/**
 * PerformanceSuite - Performance and load testing suite implementation
 * 
 * Executes performance tests including load testing with concurrent users,
 * API response time validation, search query performance testing, memory usage
 * monitoring, and leak detection. Provides detailed performance metrics and
 * recommendations for optimization.
 */

import { BaseSuite } from './base-suite.js';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import { performance } from 'perf_hooks';

export class PerformanceSuite extends BaseSuite {
  constructor(config) {
    super(config);
    this.serviceEndpoints = {
      localstack: 'http://localhost:4566',
      backend: 'http://localhost:9000',
      frontend: 'http://localhost:3000'
    };
    this.testTimeout = 600000; // 10 minutes for performance tests
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.performanceCategories = [
      'load-testing',
      'response-time',
      'search-performance',
      'memory-monitoring',
      'leak-detection',
      'concurrent-users',
      'throughput',
      'latency'
    ];
    this.performanceThresholds = {
      apiResponseTime: 300, // 300ms p95
      searchResponseTime: 500, // 500ms for search queries
      memoryLeakThreshold: 50, // 50MB increase over baseline
      concurrentUsers: 50, // Default concurrent user count
      throughputMin: 100, // Minimum requests per second
      errorRateMax: 0.01 // Maximum 1% error rate
    };
    this.metrics = {
      responseTime: [],
      memoryUsage: [],
      throughput: 0,
      errorRate: 0,
      concurrentUsers: 0,
      testDuration: 0
    };
  }

  /**
   * Custom validation for performance tests
   * @returns {Promise<boolean>} True if validation passes
   */
  async customValidation() {
    try {
      // Check if performance test workspace exists
      const performancePath = path.join(process.cwd(), this.workspace);
      await fs.access(performancePath);

      // Check for package.json with required performance testing dependencies
      const packageJsonPath = path.join(performancePath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        // Check for performance testing frameworks
        const performanceDeps = [
          'mocha', 'chai', 'axios', // Basic testing
          'artillery', 'k6', 'autocannon', // Load testing tools
          'clinic', 'node-clinic', // Memory profiling
          'benchmark', 'tinybench', // Benchmarking
          'pidusage', 'systeminformation' // System monitoring
        ];

        const availableDeps = performanceDeps.filter(dep => 
          packageJson.dependencies?.[dep] || 
          packageJson.devDependencies?.[dep] ||
          packageJson.peerDependencies?.[dep]
        );

        if (availableDeps.length === 0) {
          this.logger.warn('No performance testing dependencies found, using basic HTTP testing');
        } else {
          this.logger.info(`Performance testing dependencies available: ${availableDeps.join(', ')}`);
        }

      } catch (error) {
        this.logger.error(`Failed to read performance package.json: ${error.message}`);
        return false;
      }

      // Check for performance test files
      const hasTests = await this.checkForPerformanceTests(performancePath);
      if (!hasTests) {
        this.logger.warn('No performance test files found');
      }

      // Check for performance configuration files
      await this.validatePerformanceConfiguration(performancePath);

      return true;
    } catch (error) {
      this.logger.error(`Performance suite validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for performance test files
   * @param {string} performancePath - Path to performance test workspace
   * @returns {Promise<boolean>} True if test files are found
   */
  async checkForPerformanceTests(performancePath) {
    try {
      const testDirs = ['load', 'response-time', 'memory', 'search', 'concurrent'];
      let hasTestFiles = false;
      
      for (const testDir of testDirs) {
        const testDirPath = path.join(performancePath, testDir);
        try {
          const stats = await fs.stat(testDirPath);
          if (stats.isDirectory()) {
            const hasTests = await this.findTestFilesRecursively(testDirPath);
            if (hasTests) {
              hasTestFiles = true;
              this.logger.info(`Found performance tests in: ${testDir}`);
            }
          }
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }

      // Check for test files in root of performance workspace
      const hasRootTests = await this.findTestFilesRecursively(performancePath);
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
          // Check for performance test file patterns
          const testPatterns = [
            /\.test\.(js|ts|mjs)$/,
            /\.spec\.(js|ts|mjs)$/,
            /performance.*\.(js|ts|mjs)$/,
            /load.*\.(js|ts|mjs)$/,
            /benchmark.*\.(js|ts|mjs)$/,
            /stress.*\.(js|ts|mjs)$/,
            /memory.*\.(js|ts|mjs)$/,
            /response.*time.*\.(js|ts|mjs)$/
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
   * Validate performance configuration files
   * @param {string} performancePath - Path to performance test workspace
   * @returns {Promise<void>}
   */
  async validatePerformanceConfiguration(performancePath) {
    try {
      // Check for performance test configuration
      const configFiles = [
        'performance.config.js',
        'performance.config.json',
        'artillery.yml',
        'k6.config.js',
        '.performancerc',
        'mocha.opts'
      ];

      for (const configFile of configFiles) {
        const configPath = path.join(performancePath, configFile);
        try {
          await fs.access(configPath);
          this.logger.info(`Found performance configuration: ${configFile}`);
        } catch (error) {
          // Config file doesn't exist, continue
        }
      }

      // Check for performance test data
      const testDataPath = path.join(performancePath, 'test-data');
      try {
        await fs.access(testDataPath);
        this.logger.info('Found performance test data directory');
      } catch (error) {
        this.logger.warn('No performance test data directory found');
      }

      // Check for performance baseline files
      const baselinePath = path.join(performancePath, 'baselines');
      try {
        await fs.access(baselinePath);
        this.logger.info('Found performance baseline directory');
      } catch (error) {
        this.logger.warn('No performance baseline directory found');
      }

    } catch (error) {
      this.logger.warn(`Performance configuration validation failed: ${error.message}`);
    }
  }

  /**
   * Validate all required services for performance tests
   * @returns {Promise<boolean>} True if all services are responding
   */
  async validatePerformanceServices() {
    this.logger.info('Validating services for performance testing...');
    
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
          timeout: 10000, // Longer timeout for performance tests
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
      this.logger.info('Validating AWS services for performance tests...');
      
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

      // Test DynamoDB for performance data storage
      try {
        const dynamoClient = new DynamoDBClient(awsConfig);
        await dynamoClient.send(new ListTablesCommand({}));
        this.logger.info('✅ DynamoDB is accessible for performance tests');
      } catch (error) {
        this.logger.error(`❌ DynamoDB is not accessible: ${error.message}`);
        return false;
      }

      // Test S3 for performance test artifacts
      try {
        const s3Client = new S3Client(awsConfig);
        await s3Client.send(new ListBucketsCommand({}));
        this.logger.info('✅ S3 is accessible for performance tests');
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
   * Prepare environment for performance tests
   * @returns {Promise<void>}
   */
  async prepare() {
    await super.prepare();
    
    // Set environment variables for performance testing
    process.env.NODE_ENV = 'test';
    process.env.PERFORMANCE_TEST_MODE = 'true';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.LOCALSTACK_ENDPOINT = this.serviceEndpoints.localstack;
    process.env.API_BASE_URL = this.serviceEndpoints.backend;
    process.env.FRONTEND_URL = this.serviceEndpoints.frontend;
    
    // Set performance-specific environment variables
    process.env.PERFORMANCE_CONCURRENT_USERS = this.performanceThresholds.concurrentUsers.toString();
    process.env.PERFORMANCE_API_THRESHOLD = this.performanceThresholds.apiResponseTime.toString();
    process.env.PERFORMANCE_SEARCH_THRESHOLD = this.performanceThresholds.searchResponseTime.toString();
    process.env.PERFORMANCE_MEMORY_THRESHOLD = this.performanceThresholds.memoryLeakThreshold.toString();
    process.env.PERFORMANCE_THROUGHPUT_MIN = this.performanceThresholds.throughputMin.toString();
    process.env.PERFORMANCE_ERROR_RATE_MAX = this.performanceThresholds.errorRateMax.toString();
    
    // Initialize metrics collection
    this.resetMetrics();
    
    // Validate all required services before running tests
    const servicesValid = await this.validatePerformanceServices();
    if (!servicesValid) {
      throw new Error('Service validation failed. Ensure all required services are running before executing performance tests.');
    }
    
    // Warm up services to get accurate performance measurements
    await this.warmUpServices();
    
    this.logger.info('Performance test environment prepared');
  }

  /**
   * Reset performance metrics
   * @returns {void}
   */
  resetMetrics() {
    this.metrics = {
      responseTime: [],
      memoryUsage: [],
      throughput: 0,
      errorRate: 0,
      concurrentUsers: 0,
      testDuration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      memoryLeakDetected: false,
      baselineMemory: 0,
      peakMemory: 0
    };
  }

  /**
   * Warm up services before performance testing
   * @returns {Promise<void>}
   */
  async warmUpServices() {
    this.logger.info('Warming up services for accurate performance measurements...');
    
    try {
      // Make a few warm-up requests to each service
      const warmUpRequests = [
        `${this.serviceEndpoints.backend}/health`,
        `${this.serviceEndpoints.localstack}/_localstack/health`
      ];

      for (const url of warmUpRequests) {
        try {
          await axios.get(url, { timeout: 5000 });
          this.logger.info(`Warmed up: ${url}`);
        } catch (error) {
          this.logger.warn(`Failed to warm up ${url}: ${error.message}`);
        }
      }

      // Wait a moment for services to stabilize
      await this.sleep(2000);
      
      this.logger.info('Service warm-up completed');
    } catch (error) {
      this.logger.warn(`Service warm-up failed: ${error.message}`);
    }
  }  /**
 
  * Transform command arguments for performance test execution
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

    // Add timeout for performance tests
    if (args.includes('mocha') || this.command.includes('mocha')) {
      args.push('--timeout', this.testTimeout.toString());
    }

    // Add CI mode flags
    if (options.ci) {
      args.push('--reporter', 'json');
      args.push('--exit');
    }

    // Add verbose output for performance test details
    if (options.verbose) {
      args.push('--reporter', 'spec');
    }

    // Add specific performance test category if provided
    if (options.category && this.performanceCategories.includes(options.category)) {
      args.push('--grep', options.category);
    }

    // Add specific test pattern if provided
    if (options.testPattern) {
      args.push('--grep', options.testPattern);
    }

    // Add concurrent users configuration
    if (options.concurrentUsers) {
      process.env.PERFORMANCE_CONCURRENT_USERS = options.concurrentUsers.toString();
    }

    // Add custom thresholds
    if (options.responseTimeThreshold) {
      process.env.PERFORMANCE_API_THRESHOLD = options.responseTimeThreshold.toString();
    }

    // Add test duration
    if (options.duration) {
      process.env.PERFORMANCE_TEST_DURATION = options.duration.toString();
    }

    return args;
  }

  /**
   * Parse performance test results from output
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
      performanceMetrics: this.metrics,
      thresholds: this.performanceThresholds,
      recommendations: [],
      duration: 0,
      categories: {}
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
              type: 'performance_test_failure'
            }));
          }
          
          // Parse performance-specific results
          result.performanceMetrics = this.parsePerformanceMetricsFromJson(testResults);
          result.recommendations = this.generatePerformanceRecommendations(result);
          result.categories = this.categorizePerformanceResults(testResults);
          
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

      // Parse performance-specific information from text output
      result.performanceMetrics = this.parsePerformanceMetricsFromText(stdout, stderr);
      result.recommendations = this.generatePerformanceRecommendations(result);
      result.categories = this.categorizePerformanceResultsFromText(stdout);

      // Parse error details
      if (exitCode !== 0) {
        result.errors = this.parsePerformanceErrorsFromOutput(stdout, stderr);
      }

    } catch (error) {
      this.logger.error(`Failed to parse performance test results: ${error.message}`);
      result.errors.push({
        message: 'Failed to parse performance test results',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return result;
  }

  /**
   * Parse performance metrics from JSON test results
   * @param {Object} testResults - JSON test results
   * @returns {Object} Performance metrics object
   */
  parsePerformanceMetricsFromJson(testResults) {
    const metrics = { ...this.metrics };
    
    try {
      if (testResults.tests) {
        testResults.tests.forEach(test => {
          // Extract performance data from test titles and results
          const title = test.title || '';
          
          // Parse response time metrics
          const responseTimeMatch = title.match(/response time.*?(\d+)ms/i);
          if (responseTimeMatch) {
            metrics.responseTime.push(parseInt(responseTimeMatch[1], 10));
          }

          // Parse memory usage metrics
          const memoryMatch = title.match(/memory.*?(\d+)MB/i);
          if (memoryMatch) {
            metrics.memoryUsage.push(parseInt(memoryMatch[1], 10));
          }

          // Parse throughput metrics
          const throughputMatch = title.match(/throughput.*?(\d+)\s*rps/i);
          if (throughputMatch) {
            metrics.throughput = Math.max(metrics.throughput, parseInt(throughputMatch[1], 10));
          }

          // Parse concurrent users
          const usersMatch = title.match(/(\d+)\s*concurrent users/i);
          if (usersMatch) {
            metrics.concurrentUsers = Math.max(metrics.concurrentUsers, parseInt(usersMatch[1], 10));
          }
        });
      }

      // Calculate derived metrics
      if (metrics.responseTime.length > 0) {
        metrics.averageResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length;
        metrics.p95ResponseTime = this.calculatePercentile(metrics.responseTime, 95);
        metrics.p99ResponseTime = this.calculatePercentile(metrics.responseTime, 99);
      }

      if (metrics.memoryUsage.length > 0) {
        metrics.baselineMemory = Math.min(...metrics.memoryUsage);
        metrics.peakMemory = Math.max(...metrics.memoryUsage);
        metrics.memoryLeakDetected = (metrics.peakMemory - metrics.baselineMemory) > this.performanceThresholds.memoryLeakThreshold;
      }

    } catch (error) {
      this.logger.error(`Failed to parse performance metrics from JSON: ${error.message}`);
    }
    
    return metrics;
  }

  /**
   * Parse performance metrics from text output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Object} Performance metrics object
   */
  parsePerformanceMetricsFromText(stdout, stderr) {
    const metrics = { ...this.metrics };
    
    try {
      const combinedOutput = stdout + '\n' + stderr;
      
      // Parse response time metrics
      const responseTimeMatches = combinedOutput.matchAll(/response time:?\s*(\d+(?:\.\d+)?)ms/gi);
      for (const match of responseTimeMatches) {
        metrics.responseTime.push(parseFloat(match[1]));
      }

      // Parse memory usage metrics
      const memoryMatches = combinedOutput.matchAll(/memory usage:?\s*(\d+(?:\.\d+)?)MB/gi);
      for (const match of memoryMatches) {
        metrics.memoryUsage.push(parseFloat(match[1]));
      }

      // Parse throughput metrics
      const throughputMatches = combinedOutput.matchAll(/throughput:?\s*(\d+(?:\.\d+)?)\s*(?:rps|req\/s)/gi);
      for (const match of throughputMatches) {
        metrics.throughput = Math.max(metrics.throughput, parseFloat(match[1]));
      }

      // Parse concurrent users
      const usersMatches = combinedOutput.matchAll(/(\d+)\s*concurrent users/gi);
      for (const match of usersMatches) {
        metrics.concurrentUsers = Math.max(metrics.concurrentUsers, parseInt(match[1], 10));
      }

      // Parse error rate
      const errorRateMatches = combinedOutput.matchAll(/error rate:?\s*(\d+(?:\.\d+)?)%/gi);
      for (const match of errorRateMatches) {
        metrics.errorRate = Math.max(metrics.errorRate, parseFloat(match[1]) / 100);
      }

      // Parse total requests
      const requestMatches = combinedOutput.matchAll(/total requests:?\s*(\d+)/gi);
      for (const match of requestMatches) {
        metrics.totalRequests = Math.max(metrics.totalRequests, parseInt(match[1], 10));
      }

      // Calculate derived metrics
      if (metrics.responseTime.length > 0) {
        metrics.averageResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length;
        metrics.p95ResponseTime = this.calculatePercentile(metrics.responseTime, 95);
        metrics.p99ResponseTime = this.calculatePercentile(metrics.responseTime, 99);
      }

      if (metrics.memoryUsage.length > 0) {
        metrics.baselineMemory = Math.min(...metrics.memoryUsage);
        metrics.peakMemory = Math.max(...metrics.memoryUsage);
        metrics.memoryLeakDetected = (metrics.peakMemory - metrics.baselineMemory) > this.performanceThresholds.memoryLeakThreshold;
      }

      // Calculate success/failure rates
      if (metrics.totalRequests > 0) {
        metrics.failedRequests = Math.round(metrics.totalRequests * metrics.errorRate);
        metrics.successfulRequests = metrics.totalRequests - metrics.failedRequests;
      }

    } catch (error) {
      this.logger.error(`Failed to parse performance metrics from text: ${error.message}`);
    }
    
    return metrics;
  }

  /**
   * Calculate percentile from array of values
   * @param {Array} values - Array of numeric values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Generate performance recommendations based on test results
   * @param {Object} result - Test result object
   * @returns {Array} Array of recommendation objects
   */
  generatePerformanceRecommendations(result) {
    const recommendations = [];
    const metrics = result.performanceMetrics;

    try {
      // Response time recommendations
      if (metrics.averageResponseTime > this.performanceThresholds.apiResponseTime) {
        recommendations.push({
          category: 'response-time',
          severity: 'high',
          message: `Average response time (${metrics.averageResponseTime.toFixed(2)}ms) exceeds threshold (${this.performanceThresholds.apiResponseTime}ms)`,
          suggestions: [
            'Optimize database queries and add proper indexing',
            'Implement caching for frequently accessed data',
            'Consider using connection pooling',
            'Review and optimize Lambda function cold starts'
          ]
        });
      }

      // Memory leak recommendations
      if (metrics.memoryLeakDetected) {
        recommendations.push({
          category: 'memory-monitoring',
          severity: 'critical',
          message: `Memory leak detected: ${(metrics.peakMemory - metrics.baselineMemory).toFixed(2)}MB increase`,
          suggestions: [
            'Review code for unclosed connections or event listeners',
            'Check for circular references in objects',
            'Implement proper cleanup in async operations',
            'Use memory profiling tools to identify leak sources'
          ]
        });
      }

      // Throughput recommendations
      if (metrics.throughput < this.performanceThresholds.throughputMin) {
        recommendations.push({
          category: 'throughput',
          severity: 'medium',
          message: `Throughput (${metrics.throughput} rps) is below minimum threshold (${this.performanceThresholds.throughputMin} rps)`,
          suggestions: [
            'Scale up Lambda function memory allocation',
            'Optimize concurrent execution limits',
            'Review API Gateway throttling settings',
            'Consider implementing request batching'
          ]
        });
      }

      // Error rate recommendations
      if (metrics.errorRate > this.performanceThresholds.errorRateMax) {
        recommendations.push({
          category: 'error-rate',
          severity: 'high',
          message: `Error rate (${(metrics.errorRate * 100).toFixed(2)}%) exceeds maximum threshold (${(this.performanceThresholds.errorRateMax * 100).toFixed(2)}%)`,
          suggestions: [
            'Implement proper error handling and retry logic',
            'Review service dependencies and timeouts',
            'Add circuit breaker patterns for external services',
            'Monitor and fix failing endpoints'
          ]
        });
      }

      // Search performance recommendations
      if (metrics.p95ResponseTime > this.performanceThresholds.searchResponseTime) {
        recommendations.push({
          category: 'search-performance',
          severity: 'medium',
          message: `Search response time p95 (${metrics.p95ResponseTime.toFixed(2)}ms) exceeds threshold (${this.performanceThresholds.searchResponseTime}ms)`,
          suggestions: [
            'Optimize OpenSearch queries and mappings',
            'Implement search result caching',
            'Review search index configuration',
            'Consider search query optimization'
          ]
        });
      }

      // General performance recommendations
      if (recommendations.length === 0) {
        recommendations.push({
          category: 'general',
          severity: 'info',
          message: 'All performance metrics are within acceptable thresholds',
          suggestions: [
            'Continue monitoring performance trends',
            'Consider implementing performance budgets',
            'Set up automated performance regression testing'
          ]
        });
      }

    } catch (error) {
      this.logger.error(`Failed to generate performance recommendations: ${error.message}`);
      recommendations.push({
        category: 'error',
        severity: 'low',
        message: 'Failed to generate performance recommendations',
        suggestions: ['Review test output manually for performance insights']
      });
    }

    return recommendations;
  }

  /**
   * Categorize performance results by test category
   * @param {Object} testResults - Test results object
   * @returns {Object} Categorized results
   */
  categorizePerformanceResults(testResults) {
    const categories = {};
    
    try {
      this.performanceCategories.forEach(category => {
        categories[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          metrics: {}
        };
      });

      if (testResults.tests) {
        testResults.tests.forEach(test => {
          const category = this.categorizePerformanceTest(test.title || '');
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
      this.logger.error(`Failed to categorize performance results: ${error.message}`);
    }
    
    return categories;
  }

  /**
   * Categorize performance results from text output
   * @param {string} stdout - Test stdout
   * @returns {Object} Categorized results
   */
  categorizePerformanceResultsFromText(stdout) {
    const categories = {};
    
    try {
      this.performanceCategories.forEach(category => {
        categories[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          metrics: {}
        };
      });

      // Parse test descriptions from output and categorize
      const testMatches = stdout.matchAll(/✓|×\s+(.+)/g);
      for (const match of testMatches) {
        const testDescription = match[1];
        const category = this.categorizePerformanceTest(testDescription);
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
      this.logger.error(`Failed to categorize performance results from text: ${error.message}`);
    }
    
    return categories;
  }

  /**
   * Categorize performance test based on description
   * @param {string} description - Test description
   * @returns {string} Performance test category
   */
  categorizePerformanceTest(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('load') || desc.includes('concurrent') || desc.includes('users')) {
      return 'load-testing';
    }
    if (desc.includes('response') && desc.includes('time')) {
      return 'response-time';
    }
    if (desc.includes('search') || desc.includes('query')) {
      return 'search-performance';
    }
    if (desc.includes('leak') || desc.includes('garbage')) {
      return 'leak-detection';
    }
    if (desc.includes('memory') || desc.includes('heap')) {
      return 'memory-monitoring';
    }
    if (desc.includes('throughput') || desc.includes('rps') || desc.includes('req/s')) {
      return 'throughput';
    }
    if (desc.includes('latency') || desc.includes('delay')) {
      return 'latency';
    }
    
    return 'general';
  }

  /**
   * Parse duration string to milliseconds
   * @param {string} durationStr - Duration string (e.g., "1.5s", "500ms")
   * @returns {number} Duration in milliseconds
   */
  parseDuration(durationStr) {
    try {
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
   * Parse performance-specific errors from test output
   * @param {string} stdout - Test stdout
   * @param {string} stderr - Test stderr
   * @returns {Array} Array of error objects
   */
  parsePerformanceErrorsFromOutput(stdout, stderr) {
    const errors = [];

    try {
      // Parse Mocha test failures with performance context
      const failureMatches = stdout.matchAll(/\d+\)\s+(.+?)\n\n?\s+(.+?)\n/g);
      for (const match of failureMatches) {
        errors.push({
          test: match[1].trim(),
          message: match[2].trim(),
          category: this.categorizePerformanceTest(match[1] + ' ' + match[2]),
          type: 'performance_test_failure'
        });
      }

      // Parse service validation errors
      if (stderr.includes('Service') && stderr.includes('not responding')) {
        errors.push({
          message: 'Performance test service validation failed',
          details: stderr.trim(),
          type: 'service_error'
        });
      }

      // Parse timeout errors
      if (stderr.includes('timeout') || stderr.includes('ETIMEDOUT')) {
        errors.push({
          message: 'Performance test timeout - service may be overloaded',
          details: stderr.trim(),
          type: 'timeout_error'
        });
      }

      // Parse connection errors
      if (stderr.includes('ECONNREFUSED') || stderr.includes('ENOTFOUND')) {
        errors.push({
          message: 'Connection error during performance tests',
          details: stderr.trim(),
          type: 'connection_error'
        });
      }

      // Parse memory errors
      if (stderr.includes('out of memory') || stderr.includes('heap')) {
        errors.push({
          message: 'Memory error during performance tests',
          details: stderr.trim(),
          type: 'memory_error'
        });
      }

      // Add generic error if no specific errors found but exit code indicates failure
      if (errors.length === 0 && stderr.trim()) {
        errors.push({
          message: 'Performance test execution failed',
          details: stderr.trim(),
          type: 'execution_error'
        });
      }

    } catch (error) {
      errors.push({
        message: 'Failed to parse performance error details',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return errors;
  }

  /**
   * Get performance test categories
   * @returns {Array} Array of performance test categories
   */
  getPerformanceCategories() {
    return this.performanceCategories;
  }

  /**
   * Get performance thresholds
   * @returns {Object} Performance thresholds object
   */
  getPerformanceThresholds() {
    return this.performanceThresholds;
  }

  /**
   * Get required data scenario for performance tests
   * @returns {string} Required data scenario name
   */
  getRequiredDataScenario() {
    return 'performance-test'; // Use performance-specific scenario
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
      performanceCategories: this.performanceCategories,
      performanceThresholds: this.performanceThresholds,
      serviceEndpoints: this.serviceEndpoints,
      testTimeout: this.testTimeout,
      maxRetries: this.maxRetries
    };
  }

  /**
   * Clean up after performance tests
   * @returns {Promise<void>}
   */
  async cleanup() {
    await super.cleanup();
    
    // Reset performance-specific environment variables
    delete process.env.PERFORMANCE_TEST_MODE;
    delete process.env.PERFORMANCE_CONCURRENT_USERS;
    delete process.env.PERFORMANCE_API_THRESHOLD;
    delete process.env.PERFORMANCE_SEARCH_THRESHOLD;
    delete process.env.PERFORMANCE_MEMORY_THRESHOLD;
    delete process.env.PERFORMANCE_THROUGHPUT_MIN;
    delete process.env.PERFORMANCE_ERROR_RATE_MAX;
    delete process.env.PERFORMANCE_TEST_DURATION;
    
    // Reset metrics
    this.resetMetrics();
    
    this.logger.info('Performance test cleanup completed');
  }
}