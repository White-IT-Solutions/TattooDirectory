import { Browser, BrowserContext, Page } from '@playwright/test';
import { ScreenshotCapture, Screenshot, ScreenshotOptions } from './ScreenshotCapture';
import { ImageComparison, ComparisonResult } from './ImageComparison';
import { BaselineManager } from './BaselineManager';

export interface TestPage {
  name: string;
  url: string;
  waitForSelector?: string;
  actions?: Array<{
    type: 'click' | 'hover' | 'scroll' | 'wait';
    selector?: string;
    timeout?: number;
    position?: { x: number; y: number };
  }>;
  excludeSelectors?: string[];
}

export interface TestViewport {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
}

export interface VisualTestConfig {
  pages: TestPage[];
  viewports: TestViewport[];
  themes: Array<'light' | 'dark'>;
  browsers: Array<'chromium' | 'firefox' | 'webkit'>;
  screenshotOptions?: Partial<ScreenshotOptions>;
  comparisonThreshold?: number;
  updateBaselines?: boolean;
  parallel?: boolean;
  maxRetries?: number;
}

export interface TestExecution {
  id: string;
  timestamp: Date;
  config: VisualTestConfig;
  results: TestResult[];
  summary: TestSummary;
}

export interface TestResult {
  page: string;
  theme: 'light' | 'dark';
  viewport: string;
  browser: string;
  screenshot: Screenshot;
  comparison?: ComparisonResult;
  status: 'pass' | 'fail' | 'error';
  error?: string;
  duration: number;
}

export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  newBaselines: number;
  duration: number;
}

export class VisualTestRunner {
  private screenshotCapture: ScreenshotCapture;
  private imageComparison: ImageComparison;
  private baselineManager: BaselineManager;

  constructor(
    screenshotCapture?: ScreenshotCapture,
    imageComparison?: ImageComparison,
    baselineManager?: BaselineManager
  ) {
    this.screenshotCapture = screenshotCapture || new ScreenshotCapture();
    this.imageComparison = imageComparison || new ImageComparison();
    this.baselineManager = baselineManager || new BaselineManager();
  }

  /**
   * Execute visual regression tests based on configuration
   */
  async executeTests(
    browser: Browser,
    config: VisualTestConfig
  ): Promise<TestExecution> {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();
    const results: TestResult[] = [];

    console.log(`🚀 Starting visual test execution: ${executionId}`);
    console.log(`📊 Test matrix: ${config.pages.length} pages × ${config.themes.length} themes × ${config.viewports.length} viewports × ${config.browsers.length} browsers = ${config.pages.length * config.themes.length * config.viewports.length * config.browsers.length} tests`);

    try {
      if (config.parallel) {
        // Execute tests in parallel
        const testPromises = this.generateTestMatrix(config).map(testCase =>
          this.executeTestCase(browser, testCase, config)
        );
        
        const testResults = await Promise.allSettled(testPromises);
        results.push(...testResults.map(result => 
          result.status === 'fulfilled' ? result.value : this.createErrorResult(result.reason)
        ));
      } else {
        // Execute tests sequentially
        for (const testCase of this.generateTestMatrix(config)) {
          try {
            const result = await this.executeTestCase(browser, testCase, config);
            results.push(result);
          } catch (error) {
            results.push(this.createErrorResult(error, testCase));
          }
        }
      }

      const summary = this.generateSummary(results, Date.now() - startTime);
      
      console.log(`✅ Test execution completed: ${summary.passed}/${summary.totalTests} passed`);
      if (summary.failed > 0) {
        console.log(`❌ ${summary.failed} tests failed`);
      }
      if (summary.errors > 0) {
        console.log(`⚠️  ${summary.errors} tests had errors`);
      }

      return {
        id: executionId,
        timestamp: new Date(),
        config,
        results,
        summary
      };

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute a single test case
   */
  private async executeTestCase(
    browser: Browser,
    testCase: TestCase,
    config: VisualTestConfig
  ): Promise<TestResult> {
    const startTime = Date.now();
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Create browser context with viewport
      context = await browser.newContext({
        viewport: {
          width: testCase.viewport.width,
          height: testCase.viewport.height
        },
        deviceScaleFactor: testCase.viewport.deviceScaleFactor || 1,
        colorScheme: testCase.theme,
        reducedMotion: 'reduce'
      });

      page = await context.newPage();

      // Navigate to page
      await page.goto(testCase.page.url, { waitUntil: 'networkidle' });

      // Wait for specific selector if provided
      if (testCase.page.waitForSelector) {
        await page.waitForSelector(testCase.page.waitForSelector, { timeout: 10000 });
      }

      // Execute page actions
      if (testCase.page.actions) {
        await this.executePageActions(page, testCase.page.actions);
      }

      // Mask elements that should be excluded
      if (testCase.page.excludeSelectors) {
        await this.maskElements(page, testCase.page.excludeSelectors);
      }

      // Capture screenshot
      const screenshot = await this.screenshotCapture.capturePageScreenshot(
        page,
        testCase.page.name,
        testCase.theme,
        config.screenshotOptions
      );

      // Compare with baseline if not updating baselines
      let comparison: ComparisonResult | undefined;
      let status: 'pass' | 'fail' | 'error' = 'pass';

      if (config.updateBaselines) {
        // Update baseline
        await this.baselineManager.updateBaseline(screenshot);
        console.log(`📸 Updated baseline for ${testCase.page.name}/${testCase.theme}/${testCase.viewport.name}`);
      } else {
        // Compare with existing baseline
        const viewportKey = `${testCase.viewport.width}x${testCase.viewport.height}`;
        const baseline = await this.baselineManager.getBaseline(
          testCase.page.name,
          testCase.theme,
          viewportKey
        );

        if (baseline) {
          comparison = await this.imageComparison.compare(
            screenshot.imagePath,
            baseline.imagePath,
            config.comparisonThreshold || 0.1
          );
          
          status = comparison.hasDifferences ? 'fail' : 'pass';
          
          if (comparison.hasDifferences) {
            console.log(`❌ Visual regression detected: ${testCase.page.name}/${testCase.theme}/${testCase.viewport.name} (${comparison.differencePercentage.toFixed(2)}% different)`);
          } else {
            console.log(`✅ Visual test passed: ${testCase.page.name}/${testCase.theme}/${testCase.viewport.name}`);
          }
        } else {
          // No baseline exists, create one
          await this.baselineManager.updateBaseline(screenshot);
          console.log(`📸 Created new baseline for ${testCase.page.name}/${testCase.theme}/${testCase.viewport.name}`);
        }
      }

      return {
        page: testCase.page.name,
        theme: testCase.theme,
        viewport: testCase.viewport.name,
        browser: browser.browserType().name(),
        screenshot,
        comparison,
        status,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ Test case failed: ${testCase.page.name}/${testCase.theme}/${testCase.viewport.name}`, error);
      
      return {
        page: testCase.page.name,
        theme: testCase.theme,
        viewport: testCase.viewport.name,
        browser: browser.browserType().name(),
        screenshot: {} as Screenshot, // Empty screenshot object
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    } finally {
      // Cleanup
      if (page) await page.close();
      if (context) await context.close();
    }
  }

  /**
   * Execute page actions before screenshot
   */
  private async executePageActions(page: Page, actions: TestPage['actions']): Promise<void> {
    if (!actions) return;

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'click':
            if (action.selector) {
              await page.click(action.selector, { timeout: action.timeout || 5000 });
            }
            break;
          case 'hover':
            if (action.selector) {
              await page.hover(action.selector, { timeout: action.timeout || 5000 });
            }
            break;
          case 'scroll':
            if (action.position) {
              await page.evaluate(
                ({ x, y }) => window.scrollTo(x, y),
                action.position
              );
            }
            break;
          case 'wait':
            await page.waitForTimeout(action.timeout || 1000);
            break;
        }
        
        // Small delay between actions
        await page.waitForTimeout(100);
      } catch (error) {
        console.warn(`Action ${action.type} failed:`, error);
      }
    }
  }

  /**
   * Mask elements that should be excluded from comparison
   */
  private async maskElements(page: Page, selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      try {
        await page.addStyleTag({
          content: `${selector} { visibility: hidden !important; }`
        });
      } catch (error) {
        console.warn(`Failed to mask element ${selector}:`, error);
      }
    }
  }

  /**
   * Generate test matrix from configuration
   */
  private generateTestMatrix(config: VisualTestConfig): TestCase[] {
    const testCases: TestCase[] = [];

    for (const page of config.pages) {
      for (const theme of config.themes) {
        for (const viewport of config.viewports) {
          testCases.push({
            page,
            theme,
            viewport
          });
        }
      }
    }

    return testCases;
  }

  /**
   * Generate test summary
   */
  private generateSummary(results: TestResult[], duration: number): TestSummary {
    const summary: TestSummary = {
      totalTests: results.length,
      passed: 0,
      failed: 0,
      errors: 0,
      newBaselines: 0,
      duration
    };

    for (const result of results) {
      switch (result.status) {
        case 'pass':
          summary.passed++;
          break;
        case 'fail':
          summary.failed++;
          break;
        case 'error':
          summary.errors++;
          break;
      }

      if (!result.comparison) {
        summary.newBaselines++;
      }
    }

    return summary;
  }

  /**
   * Create error result for failed test cases
   */
  private createErrorResult(error: any, testCase?: TestCase): TestResult {
    return {
      page: testCase?.page.name || 'unknown',
      theme: testCase?.theme || 'light',
      viewport: testCase?.viewport.name || 'unknown',
      browser: 'unknown',
      screenshot: {} as Screenshot,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      duration: 0
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `visual-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface TestCase {
  page: TestPage;
  theme: 'light' | 'dark';
  viewport: TestViewport;
}