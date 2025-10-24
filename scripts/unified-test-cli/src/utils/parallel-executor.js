/**
 * ParallelExecutor - Handles parallel test suite execution
 * 
 * Manages concurrent execution of independent test suites with proper
 * resource isolation and result aggregation.
 */

import { Logger } from './logger.js';
import { TestExecutor } from '../core/test-executor.js';
import { EventEmitter } from 'events';

export class ParallelExecutor extends EventEmitter {
  constructor() {
    super();
    this.logger = new Logger();
    this.testExecutor = new TestExecutor();
    this.activeExecutions = new Map();
    this.resourceLocks = new Map();
    this.dependencyGraph = new Map();
  }

  /**
   * Execute multiple test suites in parallel
   * @param {Array} suites - Array of test suite definitions
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Array of test execution results
   */
  async executeParallel(suites, options = {}) {
    const { maxConcurrency = 3, ...executionOptions } = options;
    
    this.logger.info(`Starting parallel execution of ${suites.length} test suites`, {
      maxConcurrency,
      suites: suites.map(s => s.name)
    });

    // Build dependency graph and validate
    this.buildDependencyGraph(suites);
    this.validateDependencies(suites);

    // Separate suites by execution strategy
    const { parallelSuites, sequentialSuites, dependentSuites } = this.categorizeSuites(suites);

    if (sequentialSuites.length > 0) {
      this.logger.warn(`${sequentialSuites.length} suites must run sequentially`, {
        sequentialSuites: sequentialSuites.map(s => s.name)
      });
    }

    if (dependentSuites.length > 0) {
      this.logger.warn(`${dependentSuites.length} suites must run sequentially`, {
        sequentialSuites: dependentSuites.map(s => s.name)
      });
    }

    const results = [];
    const startTime = Date.now();

    try {
      // Execute parallel suites with concurrency limit
      if (parallelSuites.length > 0) {
        const parallelResults = await this.executeConcurrent(parallelSuites, maxConcurrency, executionOptions);
        results.push(...parallelResults);
      }

      // Execute dependent suites in dependency order
      if (dependentSuites.length > 0) {
        const dependentResults = await this.executeDependentSuites(dependentSuites, executionOptions);
        results.push(...dependentResults);
      }

      // Execute sequential suites one by one
      for (const suite of sequentialSuites) {
        this.logger.info(`Executing sequential suite: ${suite.name}`);
        const result = await this.testExecutor.executeSuite(suite, executionOptions);
        results.push(result);
      }

      // Aggregate and report results
      const summary = this.aggregateResults(results);
      summary.totalExecutionTime = Date.now() - startTime;
      this.logExecutionSummary(summary);

      this.emit('execution-complete', { results, summary });
      return results;
    } catch (error) {
      this.logger.error('Parallel execution failed', { error: error.message });
      this.emit('execution-error', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Build dependency graph for test suites
   * @param {Array} suites - Array of test suite definitions
   */
  buildDependencyGraph(suites) {
    this.dependencyGraph.clear();
    
    for (const suite of suites) {
      this.dependencyGraph.set(suite.name, {
        suite,
        dependencies: suite.dependencies || [],
        dependents: []
      });
    }

    // Build reverse dependencies
    for (const [suiteName, node] of this.dependencyGraph) {
      for (const depName of node.dependencies) {
        const depNode = this.dependencyGraph.get(depName);
        if (depNode) {
          depNode.dependents.push(suiteName);
        }
      }
    }
  }

  /**
   * Validate dependencies to detect circular references
   * @param {Array} suites - Array of test suite definitions
   */
  validateDependencies(suites) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (suiteName) => {
      if (recursionStack.has(suiteName)) {
        return true;
      }
      if (visited.has(suiteName)) {
        return false;
      }

      visited.add(suiteName);
      recursionStack.add(suiteName);

      const node = this.dependencyGraph.get(suiteName);
      if (node) {
        for (const depName of node.dependencies) {
          if (hasCycle(depName)) {
            return true;
          }
        }
      }

      recursionStack.delete(suiteName);
      return false;
    };

    for (const suite of suites) {
      if (hasCycle(suite.name)) {
        throw new Error(`Circular dependency detected involving suite: ${suite.name}`);
      }
    }
  }

  /**
   * Categorize suites by execution strategy
   * @param {Array} suites - Array of test suite definitions
   * @returns {Object} Categorized suites
   */
  categorizeSuites(suites) {
    const parallelSuites = [];
    const sequentialSuites = [];
    const dependentSuites = [];

    for (const suite of suites) {
      if (suite.canRunParallel === false) {
        sequentialSuites.push(suite);
      } else if (suite.dependencies && suite.dependencies.length > 0) {
        dependentSuites.push(suite);
      } else {
        parallelSuites.push(suite);
      }
    }

    return { parallelSuites, sequentialSuites, dependentSuites };
  }

  /**
   * Execute suites with dependencies in correct order
   * @param {Array} suites - Dependent suites to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Array of execution results
   */
  async executeDependentSuites(suites, options) {
    const results = [];
    const completed = new Set();
    const inProgress = new Set();

    const canExecute = (suite) => {
      return suite.dependencies.every(dep => completed.has(dep));
    };

    const executeWhenReady = async (suite) => {
      // Wait for dependencies to complete
      while (!canExecute(suite)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (inProgress.has(suite.name)) {
        return; // Already being executed
      }

      inProgress.add(suite.name);
      
      try {
        this.logger.info(`Executing dependent suite: ${suite.name}`, {
          dependencies: suite.dependencies
        });
        
        const result = await this.executeSuiteWithIsolation(suite, options);
        results.push(result);
        completed.add(suite.name);
        
        this.emit('suite-complete', { suite: suite.name, result });
      } catch (error) {
        this.logger.error(`Dependent suite failed: ${suite.name}`, { error: error.message });
        const errorResult = {
          suite: suite.name,
          status: 'failed',
          error: error.message,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 0
        };
        results.push(errorResult);
        completed.add(suite.name); // Mark as completed even if failed
        
        this.emit('suite-error', { suite: suite.name, error });
      } finally {
        inProgress.delete(suite.name);
      }
    };

    // Start all dependent suites (they'll wait for their dependencies)
    const executionPromises = suites.map(suite => executeWhenReady(suite));
    await Promise.all(executionPromises);

    return results;
  }

  /**
   * Execute suites with concurrency control
   * @param {Array} suites - Suites to execute concurrently
   * @param {number} maxConcurrency - Maximum concurrent executions
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Array of execution results
   */
  async executeConcurrent(suites, maxConcurrency, options) {
    const results = [];
    const semaphore = new Semaphore(maxConcurrency);

    const executeWithSemaphore = async (suite) => {
      await semaphore.acquire();
      
      try {
        const result = await this.executeSuiteWithIsolation(suite, options);
        results.push(result);
        this.emit('suite-complete', { suite: suite.name, result });
        return result;
      } catch (error) {
        this.logger.error(`Suite execution failed: ${suite.name}`, { error: error.message });
        const errorResult = {
          suite: suite.name,
          status: 'failed',
          error: error.message,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 0
        };
        results.push(errorResult);
        this.emit('suite-error', { suite: suite.name, error });
        return errorResult;
      } finally {
        semaphore.release();
      }
    };

    // Execute all suites concurrently with semaphore control
    const executionPromises = suites.map(suite => executeWithSemaphore(suite));
    await Promise.all(executionPromises);

    return results;
  }

  /**
   * Execute a single suite with resource isolation
   * @param {Object} suite - Test suite definition
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeSuiteWithIsolation(suite, options) {
    const executionId = `${suite.name}-${Date.now()}`;
    const suiteLogger = this.logger.child(suite.name);
    
    try {
      // Acquire resource locks
      await this.acquireResourceLocks(suite, executionId);
      
      // Track active execution
      this.activeExecutions.set(executionId, {
        suite: suite.name,
        startTime: Date.now(),
        pid: null
      });

      // Create isolated execution environment
      const isolatedOptions = {
        ...options,
        silent: true, // Prevent output conflicts
        logger: suiteLogger,
        executionId,
        env: {
          ...process.env,
          TEST_EXECUTION_ID: executionId,
          TEST_SUITE_NAME: suite.name,
          // Isolate temporary directories
          TMPDIR: `/tmp/test-${executionId}`,
          TEMP: `/tmp/test-${executionId}`,
          // Isolate ports for services that need them
          ...(suite.isolatedPorts && this.generateIsolatedPorts(suite.isolatedPorts))
        }
      };

      this.emit('suite-start', { suite: suite.name, executionId });

      // Execute with resource isolation
      const result = await this.testExecutor.executeSuite(suite, isolatedOptions);
      
      // Update execution tracking
      const execution = this.activeExecutions.get(executionId);
      if (execution) {
        execution.endTime = Date.now();
        execution.result = result;
      }

      suiteLogger.success(`Suite completed: ${result.status}`, {
        duration: result.duration,
        tests: result.tests,
        executionId
      });

      return result;
    } catch (error) {
      suiteLogger.error(`Suite execution failed: ${error.message}`, { executionId });
      throw error;
    } finally {
      // Release resource locks
      this.releaseResourceLocks(suite, executionId);
      
      // Clean up execution tracking
      this.activeExecutions.delete(executionId);
      
      // Clean up isolated resources
      await this.cleanupIsolatedResources(executionId);
    }
  }

  /**
   * Acquire resource locks for a test suite
   * @param {Object} suite - Test suite definition
   * @param {string} executionId - Unique execution identifier
   */
  async acquireResourceLocks(suite, executionId) {
    const requiredResources = suite.requiredResources || [];
    
    for (const resource of requiredResources) {
      if (this.resourceLocks.has(resource)) {
        // Wait for resource to be available
        await this.waitForResource(resource);
      }
      
      this.resourceLocks.set(resource, executionId);
      this.logger.debug(`Acquired resource lock: ${resource}`, { executionId });
    }
  }

  /**
   * Release resource locks for a test suite
   * @param {Object} suite - Test suite definition
   * @param {string} executionId - Unique execution identifier
   */
  releaseResourceLocks(suite, executionId) {
    const requiredResources = suite.requiredResources || [];
    
    for (const resource of requiredResources) {
      if (this.resourceLocks.get(resource) === executionId) {
        this.resourceLocks.delete(resource);
        this.logger.debug(`Released resource lock: ${resource}`, { executionId });
      }
    }
  }

  /**
   * Wait for a resource to become available
   * @param {string} resource - Resource name
   */
  async waitForResource(resource) {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 100; // 100ms
    let waitTime = 0;

    while (this.resourceLocks.has(resource) && waitTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }

    if (waitTime >= maxWaitTime) {
      throw new Error(`Timeout waiting for resource: ${resource}`);
    }
  }

  /**
   * Generate isolated ports for a test suite
   * @param {Array} portNames - Names of ports to isolate
   * @returns {Object} Environment variables for isolated ports
   */
  generateIsolatedPorts(portNames) {
    const env = {};
    const basePort = 10000 + Math.floor(Math.random() * 10000);
    
    portNames.forEach((portName, index) => {
      env[portName] = (basePort + index).toString();
    });
    
    return env;
  }

  /**
   * Clean up isolated resources
   * @param {string} executionId - Unique execution identifier
   */
  async cleanupIsolatedResources(executionId) {
    try {
      // Clean up temporary directories
      const tmpDir = `/tmp/test-${executionId}`;
      await import('fs').then(fs => fs.promises.rmdir(tmpDir, { recursive: true })).catch(() => {});
      
      this.logger.debug(`Cleaned up isolated resources`, { executionId });
    } catch (error) {
      this.logger.warn(`Failed to cleanup isolated resources`, { executionId, error: error.message });
    }
  }

  /**
   * Clean up all resources and state
   */
  cleanup() {
    this.activeExecutions.clear();
    this.resourceLocks.clear();
    this.dependencyGraph.clear();
  }

  /**
   * Aggregate results from multiple test suite executions
   * @param {Array} results - Array of test execution results
   * @returns {Object} Aggregated summary
   */
  aggregateResults(results) {
    const summary = {
      totalSuites: results.length,
      passedSuites: 0,
      failedSuites: 0,
      skippedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      averageDuration: 0,
      coverage: this.aggregateCoverage(results),
      errors: [],
      suiteResults: results.map(r => ({
        name: r.suite,
        status: r.status,
        duration: r.duration,
        tests: r.tests
      }))
    };

    let totalCoverageSuites = 0;
    const coverageMetrics = { statements: 0, branches: 0, functions: 0, lines: 0 };

    for (const result of results) {
      // Suite-level statistics
      switch (result.status) {
        case 'passed':
          summary.passedSuites++;
          break;
        case 'failed':
          summary.failedSuites++;
          break;
        case 'skipped':
          summary.skippedSuites++;
          break;
      }

      // Test-level statistics
      if (result.tests) {
        summary.totalTests += result.tests.total || 0;
        summary.passedTests += result.tests.passed || 0;
        summary.failedTests += result.tests.failed || 0;
        summary.skippedTests += result.tests.skipped || 0;
      }

      // Duration
      summary.totalDuration += result.duration || 0;

      // Coverage aggregation
      if (result.coverage) {
        totalCoverageSuites++;
        Object.keys(coverageMetrics).forEach(metric => {
          if (result.coverage[metric] !== undefined) {
            coverageMetrics[metric] += result.coverage[metric];
          }
        });
      }

      // Collect errors with more context
      if (result.errors && result.errors.length > 0) {
        summary.errors.push(...result.errors.map(error => ({
          suite: result.suite,
          timestamp: new Date().toISOString(),
          ...error
        })));
      }

      // Add error for failed suites without explicit errors
      if (result.status === 'failed' && (!result.errors || result.errors.length === 0)) {
        summary.errors.push({
          suite: result.suite,
          type: 'suite_failure',
          message: result.error || 'Suite failed without specific error details',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Calculate averages
    if (results.length > 0) {
      summary.averageDuration = summary.totalDuration / results.length;
    }

    // Calculate average coverage
    if (totalCoverageSuites > 0) {
      Object.keys(coverageMetrics).forEach(metric => {
        coverageMetrics[metric] = coverageMetrics[metric] / totalCoverageSuites;
      });
      summary.coverage = coverageMetrics;
    }

    return summary;
  }

  /**
   * Aggregate coverage from multiple test results
   * @param {Array} results - Array of test execution results
   * @returns {Object|null} Aggregated coverage metrics
   */
  aggregateCoverage(results) {
    const coverageResults = results.filter(r => r.coverage);
    
    if (coverageResults.length === 0) {
      return null;
    }

    const metrics = { statements: 0, branches: 0, functions: 0, lines: 0 };
    let totalWeight = 0;

    for (const result of coverageResults) {
      const weight = result.tests?.total || 1; // Weight by number of tests
      totalWeight += weight;

      Object.keys(metrics).forEach(metric => {
        if (result.coverage[metric] !== undefined) {
          metrics[metric] += result.coverage[metric] * weight;
        }
      });
    }

    // Calculate weighted averages
    if (totalWeight > 0) {
      Object.keys(metrics).forEach(metric => {
        metrics[metric] = metrics[metric] / totalWeight;
      });
    }

    return metrics;
  }

  /**
   * Log execution summary
   * @param {Object} summary - Aggregated execution summary
   */
  logExecutionSummary(summary) {
    this.logger.info('\n📊 Parallel Execution Summary:');
    this.logger.info(`Suites: ${summary.passedSuites} passed, ${summary.failedSuites} failed, ${summary.skippedSuites} skipped, ${summary.totalSuites} total`);
    this.logger.info(`Tests: ${summary.passedTests} passed, ${summary.failedTests} failed, ${summary.skippedTests} skipped, ${summary.totalTests} total`);
    this.logger.info(`Duration: ${(summary.totalDuration / 1000).toFixed(2)}s (avg: ${(summary.averageDuration / 1000).toFixed(2)}s per suite)`);
    
    if (summary.totalExecutionTime) {
      const efficiency = ((summary.totalDuration / summary.totalExecutionTime) * 100).toFixed(1);
      this.logger.info(`Parallel Efficiency: ${efficiency}% (${(summary.totalExecutionTime / 1000).toFixed(2)}s wall time)`);
    }

    if (summary.coverage) {
      this.logger.info('\nCoverage (weighted average):');
      Object.entries(summary.coverage).forEach(([metric, value]) => {
        this.logger.info(`  ${metric}: ${value.toFixed(2)}%`);
      });
    }

    if (summary.errors.length > 0) {
      this.logger.error(`\n❌ ${summary.errors.length} errors occurred during execution:`);
      summary.errors.forEach((error, index) => {
        this.logger.error(`${index + 1}. [${error.suite}] ${error.type || 'error'}: ${error.message}`);
      });
    }

    // Show per-suite breakdown
    if (summary.suiteResults.length > 0) {
      this.logger.info('\nPer-Suite Results:');
      summary.suiteResults.forEach(suite => {
        const status = suite.status === 'passed' ? '✅' : suite.status === 'failed' ? '❌' : '⏭️';
        const duration = suite.duration ? `${(suite.duration / 1000).toFixed(2)}s` : 'N/A';
        const tests = suite.tests ? `${suite.tests.passed}/${suite.tests.total}` : 'N/A';
        this.logger.info(`  ${status} ${suite.name}: ${tests} tests, ${duration}`);
      });
    }

    if (summary.failedSuites === 0) {
      this.logger.success('\n✅ All test suites passed!');
    } else {
      this.logger.error(`\n❌ ${summary.failedSuites} test suite(s) failed`);
    }
  }

  /**
   * Get current execution status
   * @returns {Object} Current execution status
   */
  getExecutionStatus() {
    return {
      activeExecutions: Array.from(this.activeExecutions.entries()).map(([id, exec]) => ({
        executionId: id,
        suite: exec.suite,
        startTime: exec.startTime,
        duration: Date.now() - exec.startTime
      })),
      resourceLocks: Array.from(this.resourceLocks.entries()).map(([resource, executionId]) => ({
        resource,
        executionId
      })),
      totalActive: this.activeExecutions.size
    };
  }
}

/**
 * Semaphore class for controlling concurrency
 */
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.currentCount = 0;
    this.waitQueue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentCount < this.maxConcurrency) {
        this.currentCount++;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release() {
    this.currentCount--;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      this.currentCount++;
      resolve();
    }
  }

  get available() {
    return this.maxConcurrency - this.currentCount;
  }

  get pending() {
    return this.waitQueue.length;
  }
}