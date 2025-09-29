import { Page } from '@playwright/test';
import { ErrorHandler, ErrorContext } from './ErrorHandler';

export interface FallbackScreenshotOptions {
  quality?: number;
  type?: 'png' | 'jpeg';
  fullPage?: boolean;
  timeout?: number;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class ScreenshotFallbacks {
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Capture screenshot with multiple fallback strategies
   */
  async captureWithFallbacks(
    page: Page,
    pageName: string,
    theme: 'light' | 'dark',
    options: FallbackScreenshotOptions = {}
  ): Promise<Buffer> {
    const context: ErrorContext = {
      operation: 'screenshot_capture',
      page: pageName,
      theme,
      viewport: page.viewportSize() || undefined,
      timestamp: new Date(),
      attempt: 1,
      maxRetries: 3
    };

    // Primary screenshot method
    const primaryMethod = async (): Promise<Buffer> => {
      return await this.captureHighQualityScreenshot(page, options);
    };

    // Fallback methods in order of preference
    const fallbackMethods = [
      () => this.captureReducedQualityScreenshot(page, options),
      () => this.captureBasicScreenshot(page, options),
      () => this.captureViewportOnlyScreenshot(page, options),
      () => this.captureEmergencyScreenshot(page)
    ];

    return await this.errorHandler.handleScreenshotError(
      primaryMethod,
      context,
      fallbackMethods
    );
  }

  /**
   * Primary high-quality screenshot method
   */
  private async captureHighQualityScreenshot(
    page: Page,
    options: FallbackScreenshotOptions
  ): Promise<Buffer> {
    // Ensure page is ready
    await this.preparePageForScreenshot(page);

    const screenshotOptions = {
      fullPage: options.fullPage ?? true,
      type: options.type ?? 'png' as const,
      quality: options.type === 'jpeg' ? (options.quality ?? 90) : undefined,
      clip: options.clip,
      animations: 'disabled' as const,
      caret: 'hide' as const,
      scale: 'css' as const,
      timeout: options.timeout ?? 30000
    };

    return await page.screenshot(screenshotOptions);
  }

  /**
   * Fallback 1: Reduced quality screenshot
   */
  private async captureReducedQualityScreenshot(
    page: Page,
    options: FallbackScreenshotOptions
  ): Promise<Buffer> {
    console.log('Using reduced quality screenshot fallback');
    
    const screenshotOptions = {
      fullPage: options.fullPage ?? true,
      type: 'jpeg' as const,
      quality: 70, // Reduced quality
      animations: 'disabled' as const,
      caret: 'hide' as const,
      timeout: (options.timeout ?? 30000) / 2 // Reduced timeout
    };

    return await page.screenshot(screenshotOptions);
  }

  /**
   * Fallback 2: Basic screenshot without advanced options
   */
  private async captureBasicScreenshot(
    page: Page,
    options: FallbackScreenshotOptions
  ): Promise<Buffer> {
    console.log('Using basic screenshot fallback');
    
    const screenshotOptions = {
      fullPage: options.fullPage ?? false, // Viewport only for speed
      type: 'png' as const,
      timeout: 15000 // Further reduced timeout
    };

    return await page.screenshot(screenshotOptions);
  }

  /**
   * Fallback 3: Viewport-only screenshot
   */
  private async captureViewportOnlyScreenshot(
    page: Page,
    options: FallbackScreenshotOptions
  ): Promise<Buffer> {
    console.log('Using viewport-only screenshot fallback');
    
    const screenshotOptions = {
      fullPage: false, // Force viewport only
      type: 'png' as const,
      timeout: 10000
    };

    return await page.screenshot(screenshotOptions);
  }

  /**
   * Fallback 4: Emergency screenshot with minimal options
   */
  private async captureEmergencyScreenshot(page: Page): Promise<Buffer> {
    console.log('Using emergency screenshot fallback');
    
    try {
      // Try with absolute minimal options
      return await page.screenshot({
        timeout: 5000
      });
    } catch (error) {
      // Last resort: create a placeholder image
      console.warn('All screenshot methods failed, creating placeholder');
      return await this.createPlaceholderImage();
    }
  }

  /**
   * Prepare page for consistent screenshot capture
   */
  private async preparePageForScreenshot(page: Page): Promise<void> {
    try {
      // Wait for network to be idle
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready);
      
      // Disable animations
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
          ::-webkit-scrollbar { display: none; }
          * { scrollbar-width: none; }
        `
      });

      // Additional stabilization wait
      await page.waitForTimeout(1000);
    } catch (error) {
      console.warn('Page preparation failed, proceeding with screenshot:', error.message);
    }
  }

  /**
   * Create a placeholder image when all screenshot methods fail
   */
  private async createPlaceholderImage(): Promise<Buffer> {
    // Create a simple placeholder image buffer
    // This is a minimal PNG representing a failed screenshot
    const placeholderPNG = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x01, 0x00, // Width: 256
      0x00, 0x00, 0x01, 0x00, // Height: 256
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2 (RGB), Compression: 0, Filter: 0, Interlace: 0
      0x4C, 0x5C, 0x6D, 0x7A, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);

    return placeholderPNG;
  }

  /**
   * Capture element screenshot with fallbacks
   */
  async captureElementWithFallbacks(
    page: Page,
    selector: string,
    pageName: string,
    theme: 'light' | 'dark'
  ): Promise<Buffer> {
    const context: ErrorContext = {
      operation: 'element_screenshot',
      page: `${pageName}[${selector}]`,
      theme,
      viewport: page.viewportSize() || undefined,
      timestamp: new Date(),
      attempt: 1,
      maxRetries: 3
    };

    const primaryMethod = async (): Promise<Buffer> => {
      const element = await page.locator(selector);
      await element.waitFor({ state: 'visible', timeout: 10000 });
      return await element.screenshot({ type: 'png' });
    };

    const fallbackMethods = [
      // Fallback 1: Try with longer timeout
      async () => {
        const element = await page.locator(selector);
        await element.waitFor({ state: 'visible', timeout: 20000 });
        return await element.screenshot({ type: 'jpeg', quality: 80 });
      },
      // Fallback 2: Try with bounding box
      async () => {
        const element = await page.locator(selector);
        const boundingBox = await element.boundingBox();
        if (!boundingBox) {
          throw new Error('Element not found or not visible');
        }
        return await page.screenshot({
          clip: boundingBox,
          type: 'png'
        });
      },
      // Fallback 3: Full page screenshot as last resort
      async () => {
        console.warn(`Element ${selector} not capturable, falling back to full page`);
        return await page.screenshot({ fullPage: true, type: 'png' });
      }
    ];

    return await this.errorHandler.handleScreenshotError(
      primaryMethod,
      context,
      fallbackMethods
    );
  }

  /**
   * Batch screenshot capture with individual fallback handling
   */
  async captureBatchWithFallbacks(
    page: Page,
    screenshots: Array<{
      name: string;
      selector?: string;
      options?: FallbackScreenshotOptions;
    }>,
    theme: 'light' | 'dark'
  ): Promise<Array<{ name: string; buffer: Buffer; success: boolean; error?: string }>> {
    const results: Array<{ name: string; buffer: Buffer; success: boolean; error?: string }> = [];

    for (const screenshot of screenshots) {
      try {
        let buffer: Buffer;
        
        if (screenshot.selector) {
          buffer = await this.captureElementWithFallbacks(
            page,
            screenshot.selector,
            screenshot.name,
            theme
          );
        } else {
          buffer = await this.captureWithFallbacks(
            page,
            screenshot.name,
            theme,
            screenshot.options
          );
        }

        results.push({
          name: screenshot.name,
          buffer,
          success: true
        });
      } catch (error) {
        console.error(`Failed to capture screenshot for ${screenshot.name}:`, error);
        
        // Create placeholder for failed screenshot
        const placeholderBuffer = await this.createPlaceholderImage();
        results.push({
          name: screenshot.name,
          buffer: placeholderBuffer,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Validate screenshot buffer
   */
  validateScreenshot(buffer: Buffer): boolean {
    try {
      // Check if buffer is valid PNG or JPEG
      const isPNG = buffer.length > 8 && 
        buffer[0] === 0x89 && buffer[1] === 0x50 && 
        buffer[2] === 0x4E && buffer[3] === 0x47;
      
      const isJPEG = buffer.length > 2 && 
        buffer[0] === 0xFF && buffer[1] === 0xD8;

      return isPNG || isJPEG;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get screenshot metadata for debugging
   */
  async getScreenshotMetadata(page: Page): Promise<ScreenshotMetadata> {
    try {
      const [url, userAgent, viewport, devicePixelRatio] = await Promise.all([
        page.url(),
        page.evaluate(() => navigator.userAgent),
        page.viewportSize(),
        page.evaluate(() => window.devicePixelRatio)
      ]);

      return {
        url,
        userAgent,
        viewport: viewport || { width: 0, height: 0 },
        devicePixelRatio,
        timestamp: new Date(),
        browserName: page.context().browser()?.browserType().name() || 'unknown'
      };
    } catch (error) {
      return {
        url: 'unknown',
        userAgent: 'unknown',
        viewport: { width: 0, height: 0 },
        devicePixelRatio: 1,
        timestamp: new Date(),
        browserName: 'unknown',
        error: error.message
      };
    }
  }
}

export interface ScreenshotMetadata {
  url: string;
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  timestamp: Date;
  browserName: string;
  error?: string;
}