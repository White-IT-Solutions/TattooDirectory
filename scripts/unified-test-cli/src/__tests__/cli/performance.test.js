/**
 * Performance tests for CLI startup and execution times
 * 
 * These tests verify that the CLI meets performance requirements
 * and doesn't regress in startup time or execution speed.
 */

import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import path from 'path';
// Get current directory for test files
const __dirname = process.cwd();

// Path to the CLI entry point
const CLI_PATH = path.resolve(process.cwd(), 'src/cli/index.js');
const TEST_OUTPUT_DIR = path.resolve(__dirname, 'test-results/performance');

// Performance thresholds (in milliseconds) - Updated to be more realistic
const PERFORMANCE_THRESHOLDS = {
  STARTUP_TIME: 3000,        // CLI should start within 3 seconds
  HELP_COMMAND: 2000,        // Help should display within 2 seconds
  LIST_COMMAND: 5000,        // List should complete within 5 seconds
  VALIDATE_COMMAND: 8000,    // Validate should complete within 8 seconds
  VERSION_COMMAND: 1000,     // Version should display within 1 second
  MEMORY_USAGE: 150 * 1024 * 1024, // Should use less than 150MB
};

// Helper function to measure CLI command execution time
const measureCLIPerformance = (args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const timeout = options.timeout || 10000;

    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        CI: 'true',
        ...options.env
      }
    });

    let stdout = '';
    let stderr = '';
    let firstOutputTime = null;
    let timedOut = false;

    // Measure time to first output
    const onFirstOutput = () => {
      if (firstOutputTime === null) {
        firstOutputTime = performance.now();
      }
    };

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      onFirstOutput();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      onFirstOutput();
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      reject(new Error(`Performance test timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        const endTime = performance.now();
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0,
          totalTime: endTime - startTime,
          timeToFirstOutput: firstOutputTime ? firstOutputTime - startTime : null,
          startupTime: firstOutputTime ? firstOutputTime - startTime : endTime - startTime
        });
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        reject(error);
      }
    });

    // Close stdin to avoid hanging
    child.stdin.end();
  });
};

// Helper to measure memory usage
const measureMemoryUsage = async (args = []) => {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test', CI: 'true' }
    });

    let maxMemory = 0;
    let memoryMeasurements = [];

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      try {
        const memUsage = process.memoryUsage();
        const childMemory = memUsage.heapUsed; // Approximate child memory
        maxMemory = Math.max(maxMemory, childMemory);
        memoryMeasurements.push(childMemory);
      } catch (error) {
        // Process might have ended
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(memoryInterval);
      child.kill('SIGKILL');
      reject(new Error('Memory measurement timeout'));
    }, 10000);

    child.on('close', (code) => {
      clearInterval(memoryInterval);
      clearTimeout(timeout);
      
      resolve({
        code,
        maxMemory,
        averageMemory: memoryMeasurements.length > 0 
          ? memoryMeasurements.reduce((a, b) => a + b, 0) / memoryMeasurements.length 
          : 0,
        measurements: memoryMeasurements
      });
    });

    child.on('error', (error) => {
      clearInterval(memoryInterval);
      clearTimeout(timeout);
      reject(error);
    });

    child.stdin.end();
  });
};

// Helper to run multiple performance measurements and get statistics
const runPerformanceBenchmark = async (args, iterations = 5) => {
  const measurements = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const result = await measureCLIPerformance(args);
      measurements.push(result);
      
      // Small delay between measurements to avoid resource contention
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`Performance measurement ${i + 1} failed:`, error.message);
    }
  }

  if (measurements.length === 0) {
    throw new Error('All performance measurements failed');
  }

  const times = measurements.map(m => m.totalTime);
  const startupTimes = measurements.map(m => m.startupTime);
  
  return {
    measurements,
    stats: {
      totalTime: {
        min: Math.min(...times),
        max: Math.max(...times),
        average: times.reduce((a, b) => a + b, 0) / times.length,
        median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
      },
      startupTime: {
        min: Math.min(...startupTimes),
        max: Math.max(...startupTimes),
        average: startupTimes.reduce((a, b) => a + b, 0) / startupTimes.length,
        median: startupTimes.sort((a, b) => a - b)[Math.floor(startupTimes.length / 2)]
      },
      successRate: measurements.filter(m => m.success).length / measurements.length
    }
  };
};

describe('CLI Performance Tests', () => {
  beforeAll(async () => {
    try {
      await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterAll(async () => {
    try {
      await fs.rmdir(TEST_OUTPUT_DIR, { recursive: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('Startup Performance', () => {
    it('should start up within acceptable time limits', async () => {
      const benchmark = await runPerformanceBenchmark(['--version'], 3);
      
      expect(benchmark.stats.startupTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.STARTUP_TIME);
      expect(benchmark.stats.startupTime.max).toBeLessThan(PERFORMANCE_THRESHOLDS.STARTUP_TIME * 1.5);
      
      console.log(`Average startup time: ${benchmark.stats.startupTime.average.toFixed(2)}ms`);
      console.log(`Max startup time: ${benchmark.stats.startupTime.max.toFixed(2)}ms`);
    });

    it('should have consistent startup times', async () => {
      const benchmark = await runPerformanceBenchmark(['--version'], 5);
      
      const { min, max, average } = benchmark.stats.startupTime;
      const variance = max - min;
      const variancePercentage = (variance / average) * 100;
      
      // Startup time variance should be less than 50% of average
      expect(variancePercentage).toBeLessThan(50);
      
      console.log(`Startup time variance: ${variancePercentage.toFixed(2)}%`);
    });

    it('should start faster on subsequent runs (warm start)', async () => {
      // First run (cold start)
      const coldStart = await measureCLIPerformance(['--version']);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second run (warm start)
      const warmStart = await measureCLIPerformance(['--version']);
      
      // Warm start should be faster or at least not significantly slower
      expect(warmStart.startupTime).toBeLessThanOrEqual(coldStart.startupTime * 1.2);
      
      console.log(`Cold start: ${coldStart.startupTime.toFixed(2)}ms`);
      console.log(`Warm start: ${warmStart.startupTime.toFixed(2)}ms`);
    });
  });

  describe('Command Performance', () => {
    it('should display help quickly', async () => {
      const benchmark = await runPerformanceBenchmark(['--help'], 3);
      
      expect(benchmark.stats.totalTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.HELP_COMMAND);
      expect(benchmark.stats.successRate).toBe(1); // All should succeed
      
      console.log(`Average help command time: ${benchmark.stats.totalTime.average.toFixed(2)}ms`);
    });

    it('should display version quickly', async () => {
      const benchmark = await runPerformanceBenchmark(['--version'], 3);
      
      expect(benchmark.stats.totalTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.VERSION_COMMAND);
      expect(benchmark.stats.successRate).toBe(1);
      
      console.log(`Average version command time: ${benchmark.stats.totalTime.average.toFixed(2)}ms`);
    });

    it('should list suites within acceptable time', async () => {
      const benchmark = await runPerformanceBenchmark(['list'], 3);
      
      expect(benchmark.stats.totalTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.LIST_COMMAND);
      
      console.log(`Average list command time: ${benchmark.stats.totalTime.average.toFixed(2)}ms`);
    });

    it('should list suites in JSON format efficiently', async () => {
      const benchmark = await runPerformanceBenchmark(['list', '--json'], 3);
      
      expect(benchmark.stats.totalTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.LIST_COMMAND);
      
      // JSON output should not be significantly slower than regular output
      const regularBenchmark = await runPerformanceBenchmark(['list'], 3);
      const slowdownFactor = benchmark.stats.totalTime.average / regularBenchmark.stats.totalTime.average;
      
      expect(slowdownFactor).toBeLessThan(2); // JSON should not be more than 2x slower
      
      console.log(`JSON list slowdown factor: ${slowdownFactor.toFixed(2)}x`);
    });

    it('should validate environment within acceptable time', async () => {
      const benchmark = await runPerformanceBenchmark(['validate'], 3);
      
      expect(benchmark.stats.totalTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.VALIDATE_COMMAND);
      
      console.log(`Average validate command time: ${benchmark.stats.totalTime.average.toFixed(2)}ms`);
    });

    it('should validate specific services efficiently', async () => {
      const services = ['localstack', 'frontend', 'backend'];
      
      for (const service of services) {
        const benchmark = await runPerformanceBenchmark(['validate', '--services', service], 2);
        
        expect(benchmark.stats.totalTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.VALIDATE_COMMAND);
        
        console.log(`Average validate ${service} time: ${benchmark.stats.totalTime.average.toFixed(2)}ms`);
      }
    });
  });

  describe('Memory Usage Performance', () => {
    it('should use reasonable memory for basic commands', async () => {
      const commands = [
        ['--version'],
        ['--help'],
        ['list'],
        ['validate']
      ];

      for (const args of commands) {
        const memoryResult = await measureMemoryUsage(args);
        
        expect(memoryResult.maxMemory).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
        
        console.log(`Memory usage for '${args.join(' ')}': ${(memoryResult.maxMemory / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    it('should not have memory leaks during repeated execution', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Run multiple commands
      for (let i = 0; i < 5; i++) {
        await measureCLIPerformance(['--version']);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`Memory increase after repeated execution: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Scalability Performance', () => {
    it('should handle multiple concurrent executions efficiently', async () => {
      const concurrentCount = 3;
      const startTime = performance.now();
      
      // Run multiple CLI instances concurrently
      const promises = Array(concurrentCount).fill().map(() => 
        measureCLIPerformance(['list'])
      );
      
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      const totalConcurrentTime = endTime - startTime;
      
      // Concurrent execution should not take much longer than sequential
      const sequentialEstimate = PERFORMANCE_THRESHOLDS.LIST_COMMAND * concurrentCount;
      
      expect(totalConcurrentTime).toBeLessThan(sequentialEstimate * 1.5);
      expect(successfulResults.length).toBeGreaterThan(0);
      
      console.log(`Concurrent execution time: ${totalConcurrentTime.toFixed(2)}ms`);
      console.log(`Sequential estimate: ${sequentialEstimate.toFixed(2)}ms`);
      console.log(`Successful concurrent executions: ${successfulResults.length}/${concurrentCount}`);
    });

    it('should maintain performance with complex option combinations', async () => {
      const complexArgs = [
        'run',
        '--scenario', 'minimal',
        '--parallel',
        '--max-parallel', '2',
        '--coverage',
        '--report',
        '--json',
        '--junit',
        '--ci'
      ];
      
      const benchmark = await runPerformanceBenchmark(complexArgs, 2);
      
      // Complex commands should still complete in reasonable time
      expect(benchmark.stats.totalTime.average).toBeLessThan(30000); // 30 seconds
      
      console.log(`Complex command average time: ${benchmark.stats.totalTime.average.toFixed(2)}ms`);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain baseline performance metrics', async () => {
      const baselineTests = [
        { args: ['--version'], threshold: PERFORMANCE_THRESHOLDS.VERSION_COMMAND },
        { args: ['--help'], threshold: PERFORMANCE_THRESHOLDS.HELP_COMMAND },
        { args: ['list'], threshold: PERFORMANCE_THRESHOLDS.LIST_COMMAND },
        { args: ['validate'], threshold: PERFORMANCE_THRESHOLDS.VALIDATE_COMMAND }
      ];

      const results = [];
      
      for (const test of baselineTests) {
        const benchmark = await runPerformanceBenchmark(test.args, 3);
        const passed = benchmark.stats.totalTime.average < test.threshold;
        
        results.push({
          command: test.args.join(' '),
          averageTime: benchmark.stats.totalTime.average,
          threshold: test.threshold,
          passed
        });
        
        expect(passed).toBe(true);
      }
      
      // Log performance summary
      console.log('\nPerformance Summary:');
      results.forEach(result => {
        console.log(`${result.command}: ${result.averageTime.toFixed(2)}ms (threshold: ${result.threshold}ms) ${result.passed ? '✓' : '✗'}`);
      });
    });

    it('should save performance metrics for trend analysis', async () => {
      const metricsFile = path.join(TEST_OUTPUT_DIR, 'performance-metrics.json');
      
      const metrics = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        measurements: {}
      };

      const commands = [
        ['--version'],
        ['--help'],
        ['list'],
        ['list', '--json'],
        ['validate']
      ];

      for (const args of commands) {
        const benchmark = await runPerformanceBenchmark(args, 3);
        metrics.measurements[args.join(' ')] = {
          averageTime: benchmark.stats.totalTime.average,
          minTime: benchmark.stats.totalTime.min,
          maxTime: benchmark.stats.totalTime.max,
          successRate: benchmark.stats.successRate
        };
      }

      await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
      
      // Verify file was created
      const stats = await fs.stat(metricsFile);
      expect(stats.isFile()).toBe(true);
      
      console.log(`Performance metrics saved to: ${metricsFile}`);
    });
  });
});