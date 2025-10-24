/**
 * Tests for ParallelExecutor
 */

// Mock the dependencies
jest.mock('../../core/test-executor.js', () => ({
  TestExecutor: jest.fn().mockImplementation(() => ({
    executeSuite: jest.fn()
  }))
}));

jest.mock('../logger.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
      debug: jest.fn()
    })
  }))
}));

import { ParallelExecutor } from '../parallel-executor.js';

describe('ParallelExecutor', () => {
  let parallelExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    parallelExecutor = new ParallelExecutor();
  });

  describe('constructor', () => {
    it('should initialize with required dependencies', () => {
      expect(parallelExecutor.logger).toBeDefined();
      expect(parallelExecutor.testExecutor).toBeDefined();
      expect(parallelExecutor.activeExecutions).toBeInstanceOf(Map);
      expect(parallelExecutor.resourceLocks).toBeInstanceOf(Map);
      expect(parallelExecutor.dependencyGraph).toBeInstanceOf(Map);
    });

    it('should extend EventEmitter', () => {
      expect(parallelExecutor.on).toBeDefined();
      expect(parallelExecutor.emit).toBeDefined();
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build correct dependency graph', () => {
      const suites = [
        { name: 'suite1' },
        { name: 'suite2', dependencies: ['suite1'] },
        { name: 'suite3', dependencies: ['suite1', 'suite2'] }
      ];

      parallelExecutor.buildDependencyGraph(suites);

      const graph = parallelExecutor.dependencyGraph;
      expect(graph.get('suite1').dependents).toEqual(['suite2', 'suite3']);
      expect(graph.get('suite2').dependencies).toEqual(['suite1']);
      expect(graph.get('suite2').dependents).toEqual(['suite3']);
      expect(graph.get('suite3').dependencies).toEqual(['suite1', 'suite2']);
    });
  });

  describe('validateDependencies', () => {
    it('should detect circular dependencies', () => {
      const suites = [
        { name: 'suite1', dependencies: ['suite2'] },
        { name: 'suite2', dependencies: ['suite1'] }
      ];

      parallelExecutor.buildDependencyGraph(suites);

      expect(() => {
        parallelExecutor.validateDependencies(suites);
      }).toThrow('Circular dependency detected involving suite: suite1');
    });

    it('should pass validation for valid dependencies', () => {
      const suites = [
        { name: 'suite1' },
        { name: 'suite2', dependencies: ['suite1'] },
        { name: 'suite3', dependencies: ['suite2'] }
      ];

      parallelExecutor.buildDependencyGraph(suites);

      expect(() => {
        parallelExecutor.validateDependencies(suites);
      }).not.toThrow();
    });
  });

  describe('categorizeSuites', () => {
    it('should correctly categorize suites', () => {
      const suites = [
        { name: 'parallel1', canRunParallel: true },
        { name: 'sequential1', canRunParallel: false },
        { name: 'dependent1', canRunParallel: true, dependencies: ['parallel1'] },
        { name: 'parallel2', canRunParallel: true }
      ];

      const { parallelSuites, sequentialSuites, dependentSuites } = 
        parallelExecutor.categorizeSuites(suites);

      expect(parallelSuites).toHaveLength(2);
      expect(parallelSuites.map(s => s.name)).toEqual(['parallel1', 'parallel2']);
      
      expect(sequentialSuites).toHaveLength(1);
      expect(sequentialSuites[0].name).toBe('sequential1');
      
      expect(dependentSuites).toHaveLength(1);
      expect(dependentSuites[0].name).toBe('dependent1');
    });
  });

  describe('resource isolation', () => {
    it('should generate isolated ports', () => {
      const portNames = ['HTTP_PORT', 'HTTPS_PORT', 'DB_PORT'];
      const env = parallelExecutor.generateIsolatedPorts(portNames);

      expect(env).toHaveProperty('HTTP_PORT');
      expect(env).toHaveProperty('HTTPS_PORT');
      expect(env).toHaveProperty('DB_PORT');
      
      // Ports should be different
      expect(env.HTTP_PORT).not.toBe(env.HTTPS_PORT);
      expect(env.HTTPS_PORT).not.toBe(env.DB_PORT);
      
      // Ports should be numbers
      expect(parseInt(env.HTTP_PORT)).toBeGreaterThan(10000);
    });

    it('should acquire and release resource locks', async () => {
      const executionId = 'test-exec-1';
      const suite = {
        name: 'suite1',
        requiredResources: ['database', 'cache']
      };

      await parallelExecutor.acquireResourceLocks(suite, executionId);

      expect(parallelExecutor.resourceLocks.get('database')).toBe(executionId);
      expect(parallelExecutor.resourceLocks.get('cache')).toBe(executionId);

      parallelExecutor.releaseResourceLocks(suite, executionId);

      expect(parallelExecutor.resourceLocks.has('database')).toBe(false);
      expect(parallelExecutor.resourceLocks.has('cache')).toBe(false);
    });
  });

  describe('aggregateResults', () => {
    it('should correctly aggregate test results', () => {
      const results = [
        {
          suite: 'suite1',
          status: 'passed',
          duration: 1000,
          tests: { total: 10, passed: 10, failed: 0, skipped: 0 },
          coverage: { statements: 80, branches: 75, functions: 85, lines: 82 }
        },
        {
          suite: 'suite2',
          status: 'failed',
          duration: 1500,
          tests: { total: 8, passed: 6, failed: 2, skipped: 0 },
          coverage: { statements: 70, branches: 65, functions: 75, lines: 72 },
          errors: [{ type: 'test_failure', message: 'Test failed' }]
        }
      ];

      const summary = parallelExecutor.aggregateResults(results);

      expect(summary.totalSuites).toBe(2);
      expect(summary.passedSuites).toBe(1);
      expect(summary.failedSuites).toBe(1);
      expect(summary.totalTests).toBe(18);
      expect(summary.passedTests).toBe(16);
      expect(summary.failedTests).toBe(2);
      expect(summary.totalDuration).toBe(2500);
      expect(summary.averageDuration).toBe(1250);
      expect(summary.errors).toHaveLength(1);
      expect(summary.coverage).toBeDefined();
      expect(summary.coverage.statements).toBeCloseTo(75, 1); // Weighted average
    });

    it('should handle results without coverage', () => {
      const results = [
        {
          suite: 'suite1',
          status: 'passed',
          duration: 1000,
          tests: { total: 5, passed: 5, failed: 0, skipped: 0 }
        }
      ];

      const summary = parallelExecutor.aggregateResults(results);

      expect(summary.coverage).toBeNull();
    });

    it('should add errors for failed suites without explicit errors', () => {
      const results = [
        {
          suite: 'suite1',
          status: 'failed',
          duration: 1000,
          error: 'Suite execution failed'
        }
      ];

      const summary = parallelExecutor.aggregateResults(results);

      expect(summary.errors).toHaveLength(1);
      expect(summary.errors[0]).toMatchObject({
        suite: 'suite1',
        type: 'suite_failure',
        message: 'Suite execution failed'
      });
    });
  });

  describe('getExecutionStatus', () => {
    it('should return current execution status', () => {
      // Add some mock active executions
      parallelExecutor.activeExecutions.set('exec1', {
        suite: 'suite1',
        startTime: Date.now() - 1000
      });
      
      parallelExecutor.resourceLocks.set('database', 'exec1');

      const status = parallelExecutor.getExecutionStatus();

      expect(status.activeExecutions).toHaveLength(1);
      expect(status.resourceLocks).toHaveLength(1);
      expect(status.totalActive).toBe(1);
      expect(status.activeExecutions[0]).toMatchObject({
        executionId: 'exec1',
        suite: 'suite1',
        duration: expect.any(Number)
      });
    });
  });

  describe('cleanup', () => {
    it('should clear all state', () => {
      // Add some state
      parallelExecutor.activeExecutions.set('exec1', {});
      parallelExecutor.resourceLocks.set('resource1', 'exec1');
      parallelExecutor.dependencyGraph.set('suite1', {});

      parallelExecutor.cleanup();

      expect(parallelExecutor.activeExecutions.size).toBe(0);
      expect(parallelExecutor.resourceLocks.size).toBe(0);
      expect(parallelExecutor.dependencyGraph.size).toBe(0);
    });
  });

  describe('executeParallel integration', () => {
    it('should execute parallel suites with mocked executor', async () => {
      const suites = [
        { name: 'suite1', canRunParallel: true },
        { name: 'suite2', canRunParallel: true }
      ];

      parallelExecutor.testExecutor.executeSuite.mockResolvedValue({
        suite: 'test',
        status: 'passed',
        duration: 1000,
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 }
      });

      const results = await parallelExecutor.executeParallel(suites);

      expect(results).toHaveLength(2);
      expect(parallelExecutor.testExecutor.executeSuite).toHaveBeenCalledTimes(2);
    });

    it('should handle execution errors gracefully', async () => {
      const suites = [
        { name: 'suite1', canRunParallel: true },
        { name: 'suite2', canRunParallel: true }
      ];

      parallelExecutor.testExecutor.executeSuite
        .mockResolvedValueOnce({
          suite: 'suite1',
          status: 'passed',
          duration: 1000
        })
        .mockRejectedValueOnce(new Error('Suite execution failed'));

      const results = await parallelExecutor.executeParallel(suites);

      expect(results).toHaveLength(2);
      // Find the failed result (order might vary due to parallel execution)
      const failedResult = results.find(r => r.status === 'failed');
      expect(failedResult).toBeDefined();
      expect(failedResult.error).toBe('Suite execution failed');
    });
  });
});

describe('Semaphore', () => {
  // Simple Semaphore implementation for testing
  class TestSemaphore {
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

  it('should control concurrency correctly', async () => {
    const semaphore = new TestSemaphore(2);
    let activeCount = 0;
    let maxActiveCount = 0;

    const task = async () => {
      await semaphore.acquire();
      activeCount++;
      maxActiveCount = Math.max(maxActiveCount, activeCount);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      activeCount--;
      semaphore.release();
    };

    // Start 5 tasks concurrently
    await Promise.all([task(), task(), task(), task(), task()]);

    expect(maxActiveCount).toBe(2); // Should never exceed maxConcurrency
    expect(activeCount).toBe(0); // All tasks should be completed
  });

  it('should track available and pending counts', async () => {
    const semaphore = new TestSemaphore(1);

    expect(semaphore.available).toBe(1);
    expect(semaphore.pending).toBe(0);

    // Acquire the semaphore
    await semaphore.acquire();
    expect(semaphore.available).toBe(0);
    expect(semaphore.pending).toBe(0);

    // Try to acquire again (should be queued)
    const acquirePromise = semaphore.acquire();
    expect(semaphore.pending).toBe(1);

    // Release the semaphore
    semaphore.release();
    await acquirePromise;
    
    expect(semaphore.available).toBe(0);
    expect(semaphore.pending).toBe(0);

    semaphore.release();
    expect(semaphore.available).toBe(1);
  });
});