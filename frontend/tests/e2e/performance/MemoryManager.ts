export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
  cleanup: number; // MB
}

export interface MemoryStats {
  current: MemoryUsage;
  peak: MemoryUsage;
  average: MemoryUsage;
  samples: number;
  gcCount: number;
  cleanupCount: number;
  warningCount: number;
  criticalCount: number;
}

export class MemoryManager {
  private thresholds: MemoryThresholds;
  private stats: MemoryStats;
  private monitoringInterval?: NodeJS.Timeout;
  private memoryHistory: MemoryUsage[] = [];
  private maxHistorySize = 100;
  private isMonitoring = false;

  constructor(thresholdMB: number = 512) {
    this.thresholds = {
      warning: thresholdMB * 0.7,
      critical: thresholdMB * 0.9,
      cleanup: thresholdMB
    };

    this.stats = {
      current: this.getCurrentMemoryUsage(),
      peak: this.getCurrentMemoryUsage(),
      average: this.getCurrentMemoryUsage(),
      samples: 0,
      gcCount: 0,
      cleanupCount: 0,
      warningCount: 0,
      criticalCount: 0
    };
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) return;

    console.log('📊 Starting memory monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.updateMemoryStats();
      this.checkMemoryThresholds();
    }, intervalMs);

    console.log(`✅ Memory monitoring started (threshold: ${this.thresholds.cleanup}MB)`);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('📊 Stopping memory monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    console.log('✅ Memory monitoring stopped');
  }

  private updateMemoryStats(): void {
    const current = this.getCurrentMemoryUsage();
    
    // Update current stats
    this.stats.current = current;
    this.stats.samples++;

    // Update peak usage
    if (current.heapUsed > this.stats.peak.heapUsed) {
      this.stats.peak = { ...current };
    }

    // Add to history
    this.memoryHistory.push(current);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Calculate average
    this.calculateAverageUsage();
  }

  private calculateAverageUsage(): void {
    if (this.memoryHistory.length === 0) return;

    const totals = this.memoryHistory.reduce(
      (acc, usage) => ({
        heapUsed: acc.heapUsed + usage.heapUsed,
        heapTotal: acc.heapTotal + usage.heapTotal,
        external: acc.external + usage.external,
        rss: acc.rss + usage.rss,
        arrayBuffers: acc.arrayBuffers + usage.arrayBuffers
      }),
      { heapUsed: 0, heapTotal: 0, external: 0, rss: 0, arrayBuffers: 0 }
    );

    const count = this.memoryHistory.length;
    this.stats.average = {
      heapUsed: totals.heapUsed / count,
      heapTotal: totals.heapTotal / count,
      external: totals.external / count,
      rss: totals.rss / count,
      arrayBuffers: totals.arrayBuffers / count
    };
  }

  private checkMemoryThresholds(): void {
    const heapUsedMB = this.stats.current.heapUsed / (1024 * 1024);

    if (heapUsedMB >= this.thresholds.critical) {
      this.stats.criticalCount++;
      console.warn(`🚨 CRITICAL: Memory usage at ${heapUsedMB.toFixed(1)}MB (threshold: ${this.thresholds.critical}MB)`);
      this.performEmergencyCleanup();
    } else if (heapUsedMB >= this.thresholds.warning) {
      this.stats.warningCount++;
      console.warn(`⚠️ WARNING: Memory usage at ${heapUsedMB.toFixed(1)}MB (threshold: ${this.thresholds.warning}MB)`);
      this.performGentleCleanup();
    }
  }

  async checkMemoryUsage(): Promise<MemoryUsage> {
    const usage = this.getCurrentMemoryUsage();
    const heapUsedMB = usage.heapUsed / (1024 * 1024);

    if (heapUsedMB >= this.thresholds.cleanup) {
      console.log(`🧹 Memory usage at ${heapUsedMB.toFixed(1)}MB, performing cleanup...`);
      await this.performCleanup();
    }

    return usage;
  }

  private getCurrentMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      arrayBuffers: usage.arrayBuffers || 0
    };
  }

  private performGentleCleanup(): void {
    console.log('🧹 Performing gentle memory cleanup...');
    
    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
      this.stats.gcCount++;
    }

    // Clear some internal caches
    this.trimMemoryHistory();
    
    this.stats.cleanupCount++;
  }

  private performEmergencyCleanup(): void {
    console.log('🚨 Performing emergency memory cleanup...');
    
    // Force garbage collection multiple times
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
      this.stats.gcCount += 3;
    }

    // Clear memory history
    this.memoryHistory = this.memoryHistory.slice(-10); // Keep only last 10 entries
    
    // Force cleanup of any large objects
    this.forceObjectCleanup();
    
    this.stats.cleanupCount++;
  }

  async performCleanup(): Promise<void> {
    console.log('🧹 Performing memory cleanup...');
    
    const beforeUsage = this.getCurrentMemoryUsage();
    
    // Trigger garbage collection
    if (global.gc) {
      global.gc();
      this.stats.gcCount++;
    }

    // Wait a bit for GC to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterUsage = this.getCurrentMemoryUsage();
    const freedMB = (beforeUsage.heapUsed - afterUsage.heapUsed) / (1024 * 1024);
    
    console.log(`✅ Memory cleanup freed ${freedMB.toFixed(1)}MB`);
    this.stats.cleanupCount++;
  }

  private trimMemoryHistory(): void {
    if (this.memoryHistory.length > this.maxHistorySize / 2) {
      this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize / 2);
    }
  }

  private forceObjectCleanup(): void {
    // Clear any global references that might be holding memory
    if (typeof global !== 'undefined') {
      // Clear any test-specific globals
      const testGlobals = ['__TEST_CACHE__', '__SCREENSHOT_BUFFER__', '__TEMP_DATA__'];
      testGlobals.forEach(key => {
        if ((global as any)[key]) {
          delete (global as any)[key];
        }
      });
    }
  }

  getMemoryStats(): MemoryStats {
    return { ...this.stats };
  }

  getCurrentUsage(): MemoryUsage {
    return this.getCurrentMemoryUsage();
  }

  getUsageInMB(): Record<string, number> {
    const usage = this.getCurrentMemoryUsage();
    return {
      heapUsed: usage.heapUsed / (1024 * 1024),
      heapTotal: usage.heapTotal / (1024 * 1024),
      external: usage.external / (1024 * 1024),
      rss: usage.rss / (1024 * 1024),
      arrayBuffers: usage.arrayBuffers / (1024 * 1024)
    };
  }

  isMemoryHealthy(): boolean {
    const heapUsedMB = this.stats.current.heapUsed / (1024 * 1024);
    return heapUsedMB < this.thresholds.warning;
  }

  getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const heapUsedMB = this.stats.current.heapUsed / (1024 * 1024);
    
    if (heapUsedMB >= this.thresholds.critical) return 'critical';
    if (heapUsedMB >= this.thresholds.cleanup) return 'high';
    if (heapUsedMB >= this.thresholds.warning) return 'medium';
    return 'low';
  }

  async waitForMemoryRelief(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (this.isMemoryHealthy()) {
        return true;
      }
      
      // Perform cleanup and wait
      await this.performCleanup();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }

  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log('📊 Updated memory thresholds:', this.thresholds);
  }

  resetStats(): void {
    this.stats = {
      current: this.getCurrentMemoryUsage(),
      peak: this.getCurrentMemoryUsage(),
      average: this.getCurrentMemoryUsage(),
      samples: 0,
      gcCount: 0,
      cleanupCount: 0,
      warningCount: 0,
      criticalCount: 0
    };
    
    this.memoryHistory = [];
    console.log('📊 Memory stats reset');
  }

  generateMemoryReport(): string {
    const usage = this.getUsageInMB();
    const pressure = this.getMemoryPressure();
    
    return `
Memory Report:
=============
Current Usage:
  - Heap Used: ${usage.heapUsed.toFixed(1)}MB
  - Heap Total: ${usage.heapTotal.toFixed(1)}MB
  - RSS: ${usage.rss.toFixed(1)}MB
  - External: ${usage.external.toFixed(1)}MB

Peak Usage: ${(this.stats.peak.heapUsed / (1024 * 1024)).toFixed(1)}MB
Average Usage: ${(this.stats.average.heapUsed / (1024 * 1024)).toFixed(1)}MB
Memory Pressure: ${pressure.toUpperCase()}

Statistics:
  - Samples: ${this.stats.samples}
  - GC Count: ${this.stats.gcCount}
  - Cleanup Count: ${this.stats.cleanupCount}
  - Warnings: ${this.stats.warningCount}
  - Critical Events: ${this.stats.criticalCount}

Thresholds:
  - Warning: ${this.thresholds.warning}MB
  - Critical: ${this.thresholds.critical}MB
  - Cleanup: ${this.thresholds.cleanup}MB
    `.trim();
  }
}