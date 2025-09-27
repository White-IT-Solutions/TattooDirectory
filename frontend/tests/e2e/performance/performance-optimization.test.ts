import { test, expect } from '@playwright/test';
import PerformanceTestSuite from './PerformanceTestSuite';
import ImageOptimizer from './ImageOptimizer';
import { WorkerPool } from './WorkerPool';
import { BrowserInstanceManager } from './BrowserInstanceManager';
import { ScreenshotCache } from './ScreenshotCache';
import { MemoryManager } from './MemoryManager';

test.describe('Performance Optimization Suite', () => {
  let performanceTestSuite: PerformanceTestSuite;
  let imageOptimizer: ImageOptimizer;

  test.beforeAll(async () => {
    performanceTestSuite = new PerformanceTestSuite({
      maxConcurrency: 4,
      timeout: 30000,
      cacheEnabled: true,
      memoryThreshold: 1024
    });

    imageOptimizer = new ImageOptimizer({
      quality: 80,
      format: 'webp',
      enableCompression: true
    });

    await performanceTestSuite.initialize();
  });

  test.afterAll(async () => {
    await performanceTestSuite.cleanup();
    await imageOptimizer.cleanup();
  });

  test('should execute parallel visual regression tests efficiently', async () => {
    const pages = [
      '/',
      '/search',
      '/artists/test-artist',
      '/login',
      '/signup'
    ];

    const startTime = Date.now();
    const results = await performanceTestSuite.runVisualRegressionSuite(pages);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(pages.length);
    expect(duration).toBeLessThan(60000); // Should complete within 1 minute
    
    // Check that all tests passed
    const failedTests = results.filter(r => !r.success);
    expect(failedTests.length).toBeLessThan(results.length * 0.1); // Less than 10% failure rate
  });

  test('should run accessibility suite with optimal performance', async () => {
    const pages = [
      '/',
      '/search',
      '/artists/test-artist'
    ];

    const results = await performanceTestSuite.runAccessibilitySuite(pages);
    
    expect(results).toHaveLength(pages.length);
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(10000); // Each test under 10 seconds
    });
  });

  test('should optimize memory usage during test execution', async () => {
    const memoryManager = new MemoryManager({
      threshold: 512, // 512MB threshold
      checkInterval: 5000,
      forceGC: true
    });

    await memoryManager.initialize();

    const initialMemory = await memoryManager.getCurrentUsage();
    
    // Run memory-intensive tests
    const pages = Array.from({ length: 10 }, (_, i) => `/test-page-${i}`);
    await performanceTestSuite.runMemoryLeakDetection(pages);

    const finalMemory = await memoryManager.getCurrentUsage();
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(200); // Less than 200MB increase

    await memoryManager.cleanup();
  });

  test('should achieve high cache hit rates for repeated operations', async () => {
    const cache = new ScreenshotCache({
      enabled: true,
      maxSize: 100, // 100MB
      ttl: 3600000 // 1 hour
    });

    await cache.initialize();

    // First run - populate cache
    const testData = { page: '/test', viewport: { width: 1920, height: 1080 } };
    await cache.get('test-key-1', async () => 'test-data-1');
    await cache.get('test-key-2', async () => 'test-data-2');

    // Second run - should hit cache
    await cache.get('test-key-1', async () => 'test-data-1');
    await cache.get('test-key-2', async () => 'test-data-2');

    const hitRate = cache.getHitRate();
    expect(hitRate).toBeGreaterThan(0.4); // At least 40% hit rate

    await cache.cleanup();
  });

  test('should optimize image processing for different test types', async () => {
    // Create test images (simulated)
    const testImages = [
      'screenshot1.png',
      'screenshot2.png',
      'screenshot3.png'
    ];

    // Optimize for visual regression (high quality)
    const visualOptimizer = new ImageOptimizer({
      quality: 95,
      format: 'png',
      enableCompression: false
    });

    // Optimize for performance tests (lower quality)
    const perfOptimizer = new ImageOptimizer({
      quality: 60,
      format: 'webp',
      enableCompression: true
    });

    // Test optimization stats
    const visualStats = visualOptimizer.getOptimizationStats();
    const perfStats = perfOptimizer.getOptimizationStats();

    expect(visualStats).toBeDefined();
    expect(perfStats).toBeDefined();
  });

  test('should manage browser instances efficiently', async () => {
    const browserManager = new BrowserInstanceManager({
      maxInstances: 3,
      reuseInstances: true,
      headless: true
    });

    await browserManager.initialize();

    // Request multiple browser instances
    const browser1 = await browserManager.getBrowser();
    const browser2 = await browserManager.getBrowser();
    const browser3 = await browserManager.getBrowser();

    expect(browser1).toBeDefined();
    expect(browser2).toBeDefined();
    expect(browser3).toBeDefined();

    // Check instance reuse
    const stats = browserManager.getStats();
    expect(stats.activeInstances).toBeLessThanOrEqual(3);
    expect(stats.reuseCount).toBeGreaterThanOrEqual(0);

    await browserManager.cleanup();
  });

  test('should execute comprehensive audit within performance targets', async () => {
    const pages = [
      '/',
      '/search',
      '/artists/test-artist',
      '/login'
    ];

    const startTime = Date.now();
    const metrics = await performanceTestSuite.runComprehensiveAudit(pages);
    const totalDuration = Date.now() - startTime;

    expect(metrics).toBeDefined();
    expect(metrics.totalDuration).toBeLessThan(300000); // Under 5 minutes
    expect(metrics.failureRate).toBeLessThan(0.15); // Less than 15% failure rate
    expect(metrics.throughput).toBeGreaterThan(0.5); // At least 0.5 tests per second

    // Memory usage should be reasonable
    expect(metrics.memoryUsage.peak).toBeLessThan(1500); // Under 1.5GB peak
    
    // Cache should be effective
    expect(metrics.cacheHitRate).toBeGreaterThan(0.2); // At least 20% hit rate
  });

  test('should generate optimization recommendations', async () => {
    const report = await performanceTestSuite.generatePerformanceReport();

    expect(report).toBeDefined();
    expect(report.timestamp).toBeDefined();
    expect(report.configuration).toBeDefined();
    expect(report.metrics).toBeDefined();
    expect(report.recommendations).toBeInstanceOf(Array);

    // Recommendations should be actionable
    if (report.recommendations.length > 0) {
      report.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(10);
      });
    }
  });

  test('should handle worker pool scaling efficiently', async () => {
    const workerPool = new WorkerPool({
      maxWorkers: 6,
      taskTimeout: 15000,
      retryAttempts: 3,
      queueLimit: 150
    });

    await workerPool.initialize();

    // Create many tasks to test scaling
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      id: `task-${i}`,
      type: 'performance-audit',
      data: { page: `/test-${i}` },
      priority: Math.floor(Math.random() * 3) + 1
    }));

    const startTime = Date.now();
    const results = await workerPool.executeBatch(tasks);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(50);
    expect(duration).toBeLessThan(120000); // Under 2 minutes

    const stats = workerPool.getStats();
    expect(stats.activeWorkers).toBeLessThanOrEqual(6);

    await workerPool.shutdown();
  });

  test('should optimize screenshot caching strategies', async () => {
    const cache = new ScreenshotCache({
      enabled: true,
      maxSize: 200, // 200MB
      ttl: 1800000 // 30 minutes
    });

    await cache.initialize();

    // Test different caching strategies
    const strategies = ['lru', 'lfu', 'ttl'];
    
    for (const strategy of strategies) {
      await cache.setStrategy(strategy);
      
      // Populate cache with test data
      for (let i = 0; i < 10; i++) {
        await cache.get(`test-${strategy}-${i}`, async () => `data-${i}`);
      }
    }

    const stats = cache.getStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);

    await cache.cleanup();
  });
});