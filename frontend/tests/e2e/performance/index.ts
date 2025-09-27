// Performance Optimization Framework - Main Export File

// Core Performance Classes
export { WorkerPool } from './WorkerPool';
export type { WorkerTask, WorkerResult, WorkerPoolOptions } from './WorkerPool';

export { default as BrowserInstanceManager } from './BrowserInstanceManager';
export type { BrowserInstanceOptions, BrowserStats } from './BrowserInstanceManager';

export { default as ScreenshotCache } from './ScreenshotCache';
export type { CacheOptions, CacheStats } from './ScreenshotCache';

export { default as MemoryManager } from './MemoryManager';
export type { MemoryOptions, MemoryStats } from './MemoryManager';

export { default as ParallelTestExecutor } from './ParallelTestExecutor';
export type { ExecutorOptions, ExecutionResult } from './ParallelTestExecutor';

// Optimization Utilities
export { default as ImageOptimizer } from './ImageOptimizer';
export type { 
  ImageOptimizationOptions, 
  OptimizationResult 
} from './ImageOptimizer';

export { default as PerformanceTestSuite } from './PerformanceTestSuite';
export type { 
  PerformanceTestConfig, 
  PerformanceMetrics 
} from './PerformanceTestSuite';

// Utility Functions
export const createOptimizedTestSuite = (config?: Partial<PerformanceTestConfig>) => {
  return new PerformanceTestSuite(config);
};

export const createWorkerPool = (options?: Partial<WorkerPoolOptions>) => {
  return new WorkerPool(options);
};

export const createImageOptimizer = (options?: Partial<ImageOptimizationOptions>) => {
  return new ImageOptimizer(options);
};

// Performance Constants
export const PERFORMANCE_CONSTANTS = {
  DEFAULT_CONCURRENCY: 4,
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRY_ATTEMPTS: 2,
  DEFAULT_CACHE_SIZE: 100, // MB
  DEFAULT_MEMORY_THRESHOLD: 1024, // MB
  DEFAULT_SCREENSHOT_QUALITY: 80,
  
  // Performance Targets
  TARGET_VISUAL_REGRESSION_TIME: 5000, // ms
  TARGET_ACCESSIBILITY_TIME: 3000, // ms
  TARGET_PERFORMANCE_AUDIT_TIME: 10000, // ms
  TARGET_MEMORY_ANALYSIS_TIME: 30000, // ms
  
  // Quality Thresholds
  MIN_CACHE_HIT_RATE: 0.3,
  MAX_FAILURE_RATE: 0.1,
  MIN_THROUGHPUT: 0.5, // tests per second
  MAX_MEMORY_USAGE: 1536 // MB
} as const;

// Helper Functions
export const validatePerformanceMetrics = (metrics: PerformanceMetrics): boolean => {
  return (
    metrics.failureRate <= PERFORMANCE_CONSTANTS.MAX_FAILURE_RATE &&
    metrics.cacheHitRate >= PERFORMANCE_CONSTANTS.MIN_CACHE_HIT_RATE &&
    metrics.throughput >= PERFORMANCE_CONSTANTS.MIN_THROUGHPUT &&
    metrics.memoryUsage.peak <= PERFORMANCE_CONSTANTS.MAX_MEMORY_USAGE
  );
};

export const generatePerformanceReport = (metrics: PerformanceMetrics) => {
  const isValid = validatePerformanceMetrics(metrics);
  
  return {
    timestamp: new Date().toISOString(),
    metrics,
    validation: {
      passed: isValid,
      failureRate: {
        value: metrics.failureRate,
        threshold: PERFORMANCE_CONSTANTS.MAX_FAILURE_RATE,
        passed: metrics.failureRate <= PERFORMANCE_CONSTANTS.MAX_FAILURE_RATE
      },
      cacheHitRate: {
        value: metrics.cacheHitRate,
        threshold: PERFORMANCE_CONSTANTS.MIN_CACHE_HIT_RATE,
        passed: metrics.cacheHitRate >= PERFORMANCE_CONSTANTS.MIN_CACHE_HIT_RATE
      },
      throughput: {
        value: metrics.throughput,
        threshold: PERFORMANCE_CONSTANTS.MIN_THROUGHPUT,
        passed: metrics.throughput >= PERFORMANCE_CONSTANTS.MIN_THROUGHPUT
      },
      memoryUsage: {
        value: metrics.memoryUsage.peak,
        threshold: PERFORMANCE_CONSTANTS.MAX_MEMORY_USAGE,
        passed: metrics.memoryUsage.peak <= PERFORMANCE_CONSTANTS.MAX_MEMORY_USAGE
      }
    }
  };
};

// Re-export types for convenience
export type {
  PerformanceTestConfig,
  PerformanceMetrics,
  WorkerTask,
  WorkerResult,
  WorkerPoolOptions,
  ImageOptimizationOptions,
  OptimizationResult
} from './PerformanceTestSuite';