import { Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number; // Only used for JPEG
  type?: 'png' | 'jpeg';
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  animations?: 'disabled' | 'allow';
  caret?: 'hide' | 'initial';
  scale?: 'css' | 'device';
  mask?: string[];
  threshold?: number;
}

export interface Screenshot {
  id: string;
  page: string;
  theme: 'light' | 'dark';
  viewport: {
    width: number;
    height: number;
  };
  timestamp: Date;
  imagePath: string;
  metadata: ScreenshotMetadata;
}

export interface ScreenshotMetadata {
  url: string;
  userAgent: string;
  devicePixelRatio: number;
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
  browserName: string;
  browserVersion: string;
}

export class ScreenshotCapture {
  private baseDir: string;
  private defaultOptions: ScreenshotOptions;

  constructor(baseDir: string = 'test-results/screenshots') {
    this.baseDir = baseDir;
    this.defaultOptions = {
      fullPage: true,
      type: 'png',
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      threshold: 0.2
    };
  }

  /**
   * Capture a high-resolution screenshot of the current page
   */
  async capturePageScreenshot(
    page: Page,
    pageName: string,
    theme: 'light' | 'dark',
    options: Partial<ScreenshotOptions> = {}
  ): Promise<Screenshot> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Ensure page is ready for screenshot
    await this.preparePageForScreenshot(page, theme);
    
    // Generate unique screenshot ID
    const timestamp = new Date();
    const screenshotId = this.generateScreenshotId(pageName, theme, timestamp);
    
    // Create directory structure
    const screenshotDir = await this.ensureScreenshotDirectory(pageName, theme);
    const imagePath = path.join(screenshotDir, `${screenshotId}.${mergedOptions.type}`);
    
    // Prepare screenshot options (remove quality for PNG)
    const screenshotOptions = { ...mergedOptions };
    if (screenshotOptions.type === 'png') {
      delete screenshotOptions.quality;
    }
    
    // Capture screenshot with retry logic
    const buffer = await this.captureWithRetry(page, screenshotOptions);
    await fs.writeFile(imagePath, buffer);
    
    // Get viewport info
    const viewport = page.viewportSize() || { width: 1920, height: 1080 };
    
    // Collect metadata
    const metadata = await this.collectMetadata(page, theme);
    
    return {
      id: screenshotId,
      page: pageName,
      theme,
      viewport,
      timestamp,
      imagePath,
      metadata
    };
  }

  /**
   * Capture screenshots for multiple viewports
   */
  async captureMultiViewport(
    page: Page,
    pageName: string,
    theme: 'light' | 'dark',
    viewports: Array<{ width: number; height: number; name: string }>,
    options: Partial<ScreenshotOptions> = {}
  ): Promise<Screenshot[]> {
    const screenshots: Screenshot[] = [];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for layout to stabilize
      await page.waitForTimeout(500);
      
      const screenshot = await this.capturePageScreenshot(
        page,
        `${pageName}-${viewport.name}`,
        theme,
        options
      );
      
      screenshots.push(screenshot);
    }
    
    return screenshots;
  }

  /**
   * Capture element-specific screenshot
   */
  async captureElementScreenshot(
    page: Page,
    selector: string,
    pageName: string,
    theme: 'light' | 'dark',
    options: Partial<ScreenshotOptions> = {}
  ): Promise<Screenshot> {
    const element = await page.locator(selector);
    await element.waitFor({ state: 'visible' });
    
    // Get element bounding box
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      throw new Error(`Element ${selector} not found or not visible`);
    }
    
    const mergedOptions = {
      ...this.defaultOptions,
      ...options,
      clip: boundingBox,
      fullPage: false
    };
    
    return this.capturePageScreenshot(page, `${pageName}-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`, theme, mergedOptions);
  }

  /**
   * Prepare page for consistent screenshot capture
   */
  private async preparePageForScreenshot(page: Page, theme: 'light' | 'dark'): Promise<void> {
    // Set color scheme
    await page.emulateMedia({ colorScheme: theme });
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
    
    // Hide scrollbars
    await page.addStyleTag({
      content: `
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          scrollbar-width: none;
        }
      `
    });
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Additional wait for any remaining async operations
    await page.waitForTimeout(1000);
  }

  /**
   * Capture screenshot with retry logic
   */
  private async captureWithRetry(
    page: Page,
    options: ScreenshotOptions,
    maxRetries: number = 3
  ): Promise<Buffer> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await page.screenshot(options);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Screenshot attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = 1000;
          const backoffMultiplier = 2;
          const jitter = Math.random() * 0.1; // Add 10% jitter
          const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1) * (1 + jitter);
          await page.waitForTimeout(Math.min(delay, 30000)); // Cap at 30 seconds
        }
      }
    }
    
    throw new Error(`Failed to capture screenshot after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Collect page metadata for screenshot context
   */
  private async collectMetadata(page: Page, theme: 'light' | 'dark'): Promise<ScreenshotMetadata> {
    const [url, userAgent, devicePixelRatio, reducedMotion, browserInfo] = await Promise.all([
      page.url(),
      page.evaluate(() => navigator.userAgent),
      page.evaluate(() => window.devicePixelRatio),
      page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
      page.context().browser()?.version()
    ]);
    
    const browserName = page.context().browser()?.browserType().name() || 'unknown';
    
    return {
      url,
      userAgent,
      devicePixelRatio,
      colorScheme: theme,
      reducedMotion,
      browserName,
      browserVersion: browserInfo || 'unknown'
    };
  }

  /**
   * Generate unique screenshot identifier
   */
  private generateScreenshotId(pageName: string, theme: string, timestamp: Date): string {
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    return `${pageName}-${theme}-${dateStr}`;
  }

  /**
   * Ensure screenshot directory exists
   */
  private async ensureScreenshotDirectory(pageName: string, theme: string): Promise<string> {
    const dir = path.join(this.baseDir, pageName, theme);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  /**
   * Clean up old screenshots (keep last N versions)
   */
  async cleanupOldScreenshots(pageName: string, theme: string, keepCount: number = 10): Promise<void> {
    const dir = path.join(this.baseDir, pageName, theme);
    
    try {
      const files = await fs.readdir(dir);
      const screenshots = files
        .filter(file => file.endsWith('.png') || file.endsWith('.jpeg'))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          stat: fs.stat(path.join(dir, file))
        }));
      
      const sortedScreenshots = await Promise.all(
        screenshots.map(async (screenshot) => ({
          ...screenshot,
          stat: await screenshot.stat
        }))
      );
      
      sortedScreenshots.sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
      
      // Remove old screenshots beyond keepCount
      const toDelete = sortedScreenshots.slice(keepCount);
      await Promise.all(toDelete.map(screenshot => fs.unlink(screenshot.path)));
      
    } catch (error) {
      console.warn(`Failed to cleanup old screenshots for ${pageName}/${theme}:`, error);
    }
  }
}