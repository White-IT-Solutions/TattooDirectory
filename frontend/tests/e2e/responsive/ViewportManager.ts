import { Page } from '@playwright/test';

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export interface OrientationConfig {
  portrait: ViewportConfig;
  landscape: ViewportConfig;
}

export class ViewportManager {
  private page: Page;
  
  // Standard viewport configurations
  public static readonly VIEWPORTS: Record<string, ViewportConfig> = {
    mobile: {
      name: 'Mobile',
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    },
    mobileLarge: {
      name: 'Mobile Large',
      width: 414,
      height: 896,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    },
    tablet: {
      name: 'Tablet',
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    },
    tabletLandscape: {
      name: 'Tablet Landscape',
      width: 1024,
      height: 768,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    },
    desktop: {
      name: 'Desktop',
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    }
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Set viewport to a predefined configuration
   */
  async setViewport(viewportName: keyof typeof ViewportManager.VIEWPORTS): Promise<void> {
    const config = ViewportManager.VIEWPORTS[viewportName];
    if (!config) {
      throw new Error(`Unknown viewport configuration: ${viewportName}`);
    }

    await this.page.setViewportSize({
      width: config.width,
      height: config.height
    });

    // Set device scale factor if specified
    if (config.deviceScaleFactor) {
      await this.page.emulateMedia({
        media: 'screen'
      });
    }
  }

  /**
   * Set custom viewport dimensions
   */
  async setCustomViewport(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Get current viewport size
   */
  async getCurrentViewport(): Promise<{ width: number; height: number }> {
    return await this.page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
  }

  /**
   * Test viewport orientation changes
   */
  async testOrientationChange(baseViewport: keyof typeof ViewportManager.VIEWPORTS): Promise<{
    portrait: ViewportConfig;
    landscape: ViewportConfig;
  }> {
    const config = ViewportManager.VIEWPORTS[baseViewport];
    
    const portrait: ViewportConfig = {
      ...config,
      name: `${config.name} Portrait`,
      width: Math.min(config.width, config.height),
      height: Math.max(config.width, config.height)
    };

    const landscape: ViewportConfig = {
      ...config,
      name: `${config.name} Landscape`,
      width: Math.max(config.width, config.height),
      height: Math.min(config.width, config.height)
    };

    return { portrait, landscape };
  }

  /**
   * Get all mobile viewports
   */
  static getMobileViewports(): ViewportConfig[] {
    return Object.values(ViewportManager.VIEWPORTS).filter(config => config.isMobile);
  }

  /**
   * Get all desktop viewports
   */
  static getDesktopViewports(): ViewportConfig[] {
    return Object.values(ViewportManager.VIEWPORTS).filter(config => !config.isMobile);
  }

  /**
   * Check if current viewport is mobile
   */
  async isMobileViewport(): Promise<boolean> {
    const viewport = await this.getCurrentViewport();
    return viewport.width <= 768; // Standard mobile breakpoint
  }

  /**
   * Check if current viewport is tablet
   */
  async isTabletViewport(): Promise<boolean> {
    const viewport = await this.getCurrentViewport();
    return viewport.width > 768 && viewport.width <= 1024;
  }

  /**
   * Check if current viewport is desktop
   */
  async isDesktopViewport(): Promise<boolean> {
    const viewport = await this.getCurrentViewport();
    return viewport.width > 1024;
  }

  /**
   * Get responsive breakpoints
   */
  static getBreakpoints(): Record<string, number> {
    return {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    };
  }

  /**
   * Test all viewports for a given callback
   */
  async testAllViewports<T>(
    callback: (viewport: ViewportConfig) => Promise<T>
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};

    for (const [name, config] of Object.entries(ViewportManager.VIEWPORTS)) {
      await this.setViewport(name as keyof typeof ViewportManager.VIEWPORTS);
      
      // Wait for layout to stabilize
      await this.page.waitForTimeout(500);
      
      results[name] = await callback(config);
    }

    return results;
  }

  /**
   * Capture viewport information for debugging
   */
  async captureViewportInfo(): Promise<{
    viewport: { width: number; height: number };
    devicePixelRatio: number;
    userAgent: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }> {
    const viewport = await this.getCurrentViewport();
    
    return {
      viewport,
      devicePixelRatio: await this.page.evaluate(() => window.devicePixelRatio),
      userAgent: await this.page.evaluate(() => navigator.userAgent),
      isMobile: await this.isMobileViewport(),
      isTablet: await this.isTabletViewport(),
      isDesktop: await this.isDesktopViewport()
    };
  }
}