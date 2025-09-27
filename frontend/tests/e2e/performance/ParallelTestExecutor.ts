import { Browser, BrowserContext, Page } from '@playwright/test';
import { WorkerPool } from './WorkerPool';
import { BrowserInstanceManager } from './BrowserInstanceManager';
import { ScreenshotCache } from './ScreenshotCache';
import { MemoryManager } from './MemoryManager';

export interface TestTask {
  id: string;
  page: string;
  theme: 'light' | 'dark';
  viewport: { width: number; height: number };
  testType: 'visual' | 'accessibility' | 'contrast' | 'responsive';
  priority: 'high' | 'medium' | 'low';
}

export interface ExecutionConfig {
  maxConcurrentBrowsers: number;
  maxConcurrentPages: number;
  memoryThreshold: number; // MB
  cacheEnabled: boolean;
  retryAttempts: number;
  timeoutMs: number;
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  duration: number;
  memoryUsed: number;
  cacheHit: boolean;
  error?: Error;
  result?: any;
}

export class ParallelTestExecutor {
  private browserManager: BrowserInstanceManager;
  private workerPool: WorkerPool;
  private screenshotCache: ScreenshotCache;
  private memoryManager: MemoryManager;
  private config: ExecutionConfig;
  private activeContexts: Map<string, BrowserContext> = new Map();
  private executionMetrics: Map<string, number> = new Map();

  constructor(config: ExecutionConfig) {
    this.config = config;
    this.browserManager = new BrowserInstanceManager(config.maxConcurrentBrowsers);
    this.workerPool = new WorkerPool(config.maxConcurrentPages);
    this.screenshotCache = new ScreenshotCache(config.cacheEnabled);
    this.memoryManager = new MemoryManager(config.memoryThreshold);
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing parallel test executor...');
    
    await this.browserManager.initialize();
    await this.workerPool.initialize();
    await this.screenshotCache.initialize();
    
    // Set up memory monitoring
    this.memoryManager.startMonitoring();
    
    console.log(`✅ Initialized with ${this.config.maxConcurrentBrowsers} browsers and ${this.config.maxConcurrentPages} workers`);
  }

  async executeTasks(tasks: TestTask[]): Promise<ExecutionResult[]> {
    const startTime = Date.now();
    console.log(`🔄 Executing ${tasks.length} tasks in parallel...`);

    // Sort tasks by priority
    const sortedTasks = this.prioritizeTasks(tasks);
    
    // Split tasks into batches to manage memory
    const batches = this.createBatches(sortedTasks);
    const results: ExecutionResult[] = [];

    for (const batch of batches) {
      console.log(`📦 Processing batch of ${batch.length} tasks...`);
      
      // Check memory before batch execution
      await this.memoryManager.checkMemoryUsage();
      
      const batchResults = await this.executeBatch(batch);
      results.push(...batchResults);
      
      // Clean up after batch
      await this.cleanupBatch();
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ Completed ${tasks.length} tasks in ${totalDuration}ms`);
    
    return results;
  }

  private prioritizeTasks(tasks: TestTask[]): TestTask[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return tasks.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by cache likelihood (same page/theme combinations)
      const aCacheKey = `${a.page}-${a.theme}-${a.viewport.width}x${a.viewport.height}`;
      const bCacheKey = `${b.page}-${b.theme}-${b.viewport.width}x${b.viewport.height}`;
      
      return aCacheKey.localeCompare(bCacheKey);
    });
  }

  private createBatches(tasks: TestTask[]): TestTask[][] {
    const batches: TestTask[][] = [];
    const batchSize = this.config.maxConcurrentPages;
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      batches.push(tasks.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private async executeBatch(tasks: TestTask[]): Promise<ExecutionResult[]> {
    const promises = tasks.map(task => this.executeTask(task));
    
    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('❌ Batch execution failed:', error);
      
      // Execute tasks sequentially as fallback
      console.log('🔄 Falling back to sequential execution...');
      const results: ExecutionResult[] = [];
      
      for (const task of tasks) {
        try {
          const result = await this.executeTask(task);
          results.push(result);
        } catch (taskError) {
          results.push({
            taskId: task.id,
            success: false,
            duration: 0,
            memoryUsed: 0,
            cacheHit: false,
            error: taskError as Error
          });
        }
      }
      
      return results;
    }
  }

  private async executeTask(task: TestTask): Promise<ExecutionResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(task);
      const cachedResult = await this.screenshotCache.get(cacheKey);
      
      if (cachedResult) {
        return {
          taskId: task.id,
          success: true,
          duration: Date.now() - startTime,
          memoryUsed: 0,
          cacheHit: true,
          result: cachedResult
        };
      }

      // Get browser context
      const context = await this.getBrowserContext(task);
      const page = await context.newPage();
      
      try {
        // Set viewport
        await page.setViewportSize(task.viewport);
        
        // Execute the actual test
        const result = await this.executeTestType(page, task);
        
        // Cache the result
        await this.screenshotCache.set(cacheKey, result);
        
        const endMemory = process.memoryUsage().heapUsed;
        
        return {
          taskId: task.id,
          success: true,
          duration: Date.now() - startTime,
          memoryUsed: endMemory - startMemory,
          cacheHit: false,
          result
        };
        
      } finally {
        await page.close();
      }
      
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        duration: Date.now() - startTime,
        memoryUsed: 0,
        cacheHit: false,
        error: error as Error
      };
    }
  }

  private async getBrowserContext(task: TestTask): Promise<BrowserContext> {
    const contextKey = `${task.theme}-${task.viewport.width}x${task.viewport.height}`;
    
    let context = this.activeContexts.get(contextKey);
    
    if (!context) {
      const browser = await this.browserManager.getBrowser();
      context = await browser.newContext({
        viewport: task.viewport,
        colorScheme: task.theme === 'dark' ? 'dark' : 'light'
      });
      
      this.activeContexts.set(contextKey, context);
    }
    
    return context;
  }

  private async executeTestType(page: Page, task: TestTask): Promise<any> {
    // Navigate to page
    await page.goto(`http://localhost:3000${task.page}`);
    await page.waitForLoadState('networkidle');
    
    switch (task.testType) {
      case 'visual':
        return await page.screenshot({ fullPage: true });
      
      case 'accessibility':
        const { injectAxe, checkA11y } = await import('axe-playwright');
        await injectAxe(page);
        return await checkA11y(page);
      
      case 'contrast':
        return await page.evaluate(() => {
          // Contrast analysis logic
          return { contrastRatios: [] };
        });
      
      case 'responsive':
        return await page.evaluate(() => {
          // Responsive layout checks
          return { layoutMetrics: {} };
        });
      
      default:
        throw new Error(`Unknown test type: ${task.testType}`);
    }
  }

  private generateCacheKey(task: TestTask): string {
    return `${task.page}-${task.theme}-${task.viewport.width}x${task.viewport.height}-${task.testType}`;
  }

  private async cleanupBatch(): Promise<void> {
    // Close unused contexts
    const contextsToClose: string[] = [];
    
    for (const [key, context] of this.activeContexts) {
      const pages = context.pages();
      if (pages.length === 0) {
        contextsToClose.push(key);
        await context.close();
      }
    }
    
    contextsToClose.forEach(key => this.activeContexts.delete(key));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Check memory usage
    await this.memoryManager.checkMemoryUsage();
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down parallel test executor...');
    
    // Close all contexts
    for (const context of this.activeContexts.values()) {
      await context.close();
    }
    this.activeContexts.clear();
    
    // Shutdown components
    await this.browserManager.shutdown();
    await this.workerPool.shutdown();
    await this.screenshotCache.shutdown();
    this.memoryManager.stopMonitoring();
    
    console.log('✅ Parallel test executor shut down');
  }

  getExecutionMetrics(): Record<string, any> {
    return {
      activeBrowsers: this.browserManager.getActiveBrowserCount(),
      activeContexts: this.activeContexts.size,
      cacheHitRate: this.screenshotCache.getHitRate(),
      memoryUsage: this.memoryManager.getCurrentUsage(),
      executionTimes: Object.fromEntries(this.executionMetrics)
    };
  }
}