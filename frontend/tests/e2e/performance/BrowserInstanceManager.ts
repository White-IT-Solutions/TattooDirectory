import { Browser, chromium, firefox, webkit } from '@playwright/test';

export interface BrowserConfig {
  type: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  args?: string[];
}

export interface BrowserInstance {
  id: string;
  browser: Browser;
  type: string;
  createdAt: Date;
  lastUsed: Date;
  activeContexts: number;
  isHealthy: boolean;
}

export class BrowserInstanceManager {
  private maxBrowsers: number;
  private browsers: Map<string, BrowserInstance> = new Map();
  private browserQueue: string[] = [];
  private healthCheckInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(maxBrowsers: number = 3) {
    this.maxBrowsers = maxBrowsers;
  }

  async initialize(): Promise<void> {
    console.log('🌐 Initializing browser instance manager...');
    
    // Pre-warm browser instances
    await this.preWarmBrowsers();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start cleanup monitoring
    this.startCleanupMonitoring();
    
    console.log(`✅ Browser manager initialized with ${this.browsers.size} instances`);
  }

  private async preWarmBrowsers(): Promise<void> {
    const browserConfigs: BrowserConfig[] = [
      { type: 'chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] },
      { type: 'firefox', headless: true },
      { type: 'webkit', headless: true }
    ];

    // Create initial browser instances
    for (let i = 0; i < Math.min(this.maxBrowsers, browserConfigs.length); i++) {
      const config = browserConfigs[i];
      await this.createBrowserInstance(config);
    }
  }

  private async createBrowserInstance(config: BrowserConfig): Promise<string> {
    const id = `${config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      let browser: Browser;
      
      switch (config.type) {
        case 'chromium':
          browser = await chromium.launch({
            headless: config.headless,
            args: config.args
          });
          break;
        case 'firefox':
          browser = await firefox.launch({
            headless: config.headless
          });
          break;
        case 'webkit':
          browser = await webkit.launch({
            headless: config.headless
          });
          break;
        default:
          throw new Error(`Unsupported browser type: ${config.type}`);
      }

      const instance: BrowserInstance = {
        id,
        browser,
        type: config.type,
        createdAt: new Date(),
        lastUsed: new Date(),
        activeContexts: 0,
        isHealthy: true
      };

      this.browsers.set(id, instance);
      this.browserQueue.push(id);
      
      console.log(`🌐 Created ${config.type} browser instance: ${id}`);
      return id;
      
    } catch (error) {
      console.error(`❌ Failed to create ${config.type} browser:`, error);
      throw error;
    }
  }

  async getBrowser(): Promise<Browser> {
    // Find the least used healthy browser
    let selectedInstance = this.findOptimalBrowser();
    
    if (!selectedInstance) {
      // Create new browser if under limit
      if (this.browsers.size < this.maxBrowsers) {
        const id = await this.createBrowserInstance({
          type: 'chromium',
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        });
        selectedInstance = this.browsers.get(id)!;
      } else {
        // Wait for a browser to become available
        selectedInstance = await this.waitForAvailableBrowser();
      }
    }

    // Update usage tracking
    selectedInstance.lastUsed = new Date();
    selectedInstance.activeContexts++;
    
    return selectedInstance.browser;
  }

  private findOptimalBrowser(): BrowserInstance | null {
    let bestInstance: BrowserInstance | null = null;
    let lowestContexts = Infinity;

    for (const instance of this.browsers.values()) {
      if (!instance.isHealthy) continue;
      
      if (instance.activeContexts < lowestContexts) {
        lowestContexts = instance.activeContexts;
        bestInstance = instance;
      }
    }

    return bestInstance;
  }

  private async waitForAvailableBrowser(): Promise<BrowserInstance> {
    return new Promise((resolve) => {
      const checkAvailability = () => {
        const available = this.findOptimalBrowser();
        if (available) {
          resolve(available);
        } else {
          setTimeout(checkAvailability, 100);
        }
      };
      
      checkAvailability();
    });
  }

  async releaseBrowser(browser: Browser): Promise<void> {
    for (const instance of this.browsers.values()) {
      if (instance.browser === browser) {
        instance.activeContexts = Math.max(0, instance.activeContexts - 1);
        break;
      }
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.browsers.entries()).map(
      async ([id, instance]) => {
        try {
          // Simple health check - try to create and close a context
          const context = await instance.browser.newContext();
          await context.close();
          
          instance.isHealthy = true;
        } catch (error) {
          console.warn(`⚠️ Browser ${id} failed health check:`, error);
          instance.isHealthy = false;
          
          // Try to recover the browser
          await this.recoverBrowser(id);
        }
      }
    );

    await Promise.allSettled(healthPromises);
  }

  private async recoverBrowser(id: string): Promise<void> {
    const instance = this.browsers.get(id);
    if (!instance) return;

    try {
      // Close the unhealthy browser
      await instance.browser.close();
      
      // Remove from tracking
      this.browsers.delete(id);
      this.browserQueue = this.browserQueue.filter(browserId => browserId !== id);
      
      // Create a replacement browser
      await this.createBrowserInstance({
        type: instance.type as 'chromium' | 'firefox' | 'webkit',
        headless: true
      });
      
      console.log(`🔄 Recovered browser instance: ${id}`);
      
    } catch (error) {
      console.error(`❌ Failed to recover browser ${id}:`, error);
    }
  }

  private startCleanupMonitoring(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, 60000); // Cleanup every minute
  }

  private async performCleanup(): Promise<void> {
    const now = new Date();
    const maxIdleTime = 5 * 60 * 1000; // 5 minutes
    
    for (const [id, instance] of this.browsers.entries()) {
      const idleTime = now.getTime() - instance.lastUsed.getTime();
      
      // Clean up idle browsers (but keep at least one)
      if (idleTime > maxIdleTime && 
          instance.activeContexts === 0 && 
          this.browsers.size > 1) {
        
        try {
          await instance.browser.close();
          this.browsers.delete(id);
          this.browserQueue = this.browserQueue.filter(browserId => browserId !== id);
          
          console.log(`🧹 Cleaned up idle browser: ${id}`);
        } catch (error) {
          console.error(`❌ Failed to cleanup browser ${id}:`, error);
        }
      }
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down browser manager...');
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Close all browsers
    const closePromises = Array.from(this.browsers.values()).map(
      async (instance) => {
        try {
          await instance.browser.close();
        } catch (error) {
          console.error(`❌ Error closing browser ${instance.id}:`, error);
        }
      }
    );
    
    await Promise.allSettled(closePromises);
    
    this.browsers.clear();
    this.browserQueue = [];
    
    console.log('✅ Browser manager shut down');
  }

  getActiveBrowserCount(): number {
    return this.browsers.size;
  }

  getBrowserStats(): Record<string, any> {
    const stats = {
      totalBrowsers: this.browsers.size,
      healthyBrowsers: 0,
      totalActiveContexts: 0,
      browserTypes: {} as Record<string, number>
    };

    for (const instance of this.browsers.values()) {
      if (instance.isHealthy) {
        stats.healthyBrowsers++;
      }
      
      stats.totalActiveContexts += instance.activeContexts;
      
      stats.browserTypes[instance.type] = (stats.browserTypes[instance.type] || 0) + 1;
    }

    return stats;
  }

  async forceCleanup(): Promise<void> {
    console.log('🧹 Forcing browser cleanup...');
    await this.performCleanup();
  }

  async restartUnhealthyBrowsers(): Promise<void> {
    console.log('🔄 Restarting unhealthy browsers...');
    
    const unhealthyBrowsers = Array.from(this.browsers.entries())
      .filter(([, instance]) => !instance.isHealthy)
      .map(([id]) => id);
    
    for (const id of unhealthyBrowsers) {
      await this.recoverBrowser(id);
    }
  }
}