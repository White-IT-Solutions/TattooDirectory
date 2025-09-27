/**
 * Example usage of the Visual Testing Engine
 * 
 * This file demonstrates how to use the visual testing components
 * for comprehensive UI/UX testing across different themes and viewports.
 */

import { Browser } from '@playwright/test';
import { 
  ScreenshotCapture, 
  VisualTestRunner, 
  ImageComparison, 
  BaselineManager,
  VisualTestConfig 
} from './index';

/**
 * Example: Basic visual regression testing setup
 */
export async function basicVisualTesting(browser: Browser) {
  // Initialize components
  const screenshotCapture = new ScreenshotCapture('test-results/visual-screenshots');
  const imageComparison = new ImageComparison();
  const baselineManager = new BaselineManager('test-results/visual-baselines');
  const visualTestRunner = new VisualTestRunner(screenshotCapture, imageComparison, baselineManager);

  // Define test configuration
  const config: VisualTestConfig = {
    pages: [
      {
        name: 'home',
        url: 'http://localhost:3000',
        waitForSelector: 'main',
        actions: [
          { type: 'wait', timeout: 2000 } // Wait for page to fully load
        ]
      },
      {
        name: 'search',
        url: 'http://localhost:3000/search',
        waitForSelector: '[data-testid="search-form"]',
        actions: [
          { type: 'click', selector: '[data-testid="search-input"]' },
          { type: 'wait', timeout: 1000 }
        ]
      }
    ],
    viewports: [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ],
    themes: ['light', 'dark'],
    browsers: ['chromium'],
    updateBaselines: false, // Set to true for first run
    parallel: false,
    comparisonThreshold: 0.1
  };

  // Execute tests
  const execution = await visualTestRunner.executeTests(browser, config);
  
  console.log(`Visual testing completed:`);
  console.log(`- Total tests: ${execution.summary.totalTests}`);
  console.log(`- Passed: ${execution.summary.passed}`);
  console.log(`- Failed: ${execution.summary.failed}`);
  console.log(`- Errors: ${execution.summary.errors}`);

  return execution;
}

/**
 * Example: Component-specific visual testing
 */
export async function componentVisualTesting(browser: Browser) {
  const screenshotCapture = new ScreenshotCapture('test-results/component-screenshots');
  const imageComparison = new ImageComparison();
  const baselineManager = new BaselineManager('test-results/component-baselines');

  // Test specific components
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');

    // Test navigation component in both themes
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      
      // Capture navigation component
      const navScreenshot = await screenshotCapture.captureElementScreenshot(
        page,
        'nav[role="navigation"]',
        'navigation',
        theme
      );

      // Capture search form component
      const searchScreenshot = await screenshotCapture.captureElementScreenshot(
        page,
        '[data-testid="search-form"]',
        'search-form',
        theme
      );

      console.log(`📸 Captured ${theme} theme components`);
    }

  } finally {
    await context.close();
  }
}

/**
 * Example: Advanced visual testing with custom actions
 */
export async function advancedVisualTesting(browser: Browser) {
  const screenshotCapture = new ScreenshotCapture('test-results/advanced-screenshots');
  const imageComparison = new ImageComparison();
  const baselineManager = new BaselineManager('test-results/advanced-baselines');
  const visualTestRunner = new VisualTestRunner(screenshotCapture, imageComparison, baselineManager);

  const config: VisualTestConfig = {
    pages: [
      {
        name: 'artist-profile',
        url: 'http://localhost:3000/artists/test-artist',
        waitForSelector: '[data-testid="artist-profile"]',
        actions: [
          { type: 'wait', timeout: 2000 },
          { type: 'scroll', position: { x: 0, y: 500 } },
          { type: 'hover', selector: '[data-testid="portfolio-image"]:first-child' },
          { type: 'wait', timeout: 500 }
        ],
        excludeSelectors: [
          '[data-testid="dynamic-timestamp"]', // Exclude dynamic content
          '.loading-spinner'
        ]
      },
      {
        name: 'search-results',
        url: 'http://localhost:3000/search?q=traditional&location=london',
        waitForSelector: '[data-testid="search-results"]',
        actions: [
          { type: 'wait', timeout: 3000 }, // Wait for search results to load
          { type: 'click', selector: '[data-testid="filter-style"]' },
          { type: 'wait', timeout: 1000 }
        ]
      }
    ],
    viewports: [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'mobile', width: 375, height: 667 }
    ],
    themes: ['light', 'dark'],
    browsers: ['chromium'],
    updateBaselines: false,
    parallel: true, // Enable parallel execution
    comparisonThreshold: 0.05, // Stricter threshold
    screenshotOptions: {
      fullPage: true,
      animations: 'disabled',
      mask: ['[data-testid="dynamic-content"]'] // Mask dynamic content
    }
  };

  const execution = await visualTestRunner.executeTests(browser, config);
  return execution;
}

/**
 * Example: Baseline management operations
 */
export async function baselineManagement() {
  const baselineManager = new BaselineManager('test-results/managed-baselines');

  // Get all baselines
  const allBaselines = await baselineManager.getAllBaselines();
  console.log(`Found ${allBaselines.length} baselines`);

  // Get specific baseline history
  const history = await baselineManager.getBaselineHistory('home', 'light', '1920x1080');
  if (history) {
    console.log(`Baseline history for home/light/desktop:`);
    console.log(`- Current version: ${history.current.version}`);
    console.log(`- Previous versions: ${history.versions.length}`);
  }

  // Approve a baseline
  await baselineManager.approveBaseline('home', 'light', '1920x1080', 'developer@example.com');

  // Clean up old versions (keep last 5)
  await baselineManager.cleanupOldVersions();
}

/**
 * Example: Custom image comparison with specific options
 */
export async function customImageComparison() {
  const imageComparison = new ImageComparison();

  // Batch compare multiple images
  const comparisons = [
    {
      current: 'test-results/current/home-light-desktop.png',
      baseline: 'test-results/baselines/home-light-desktop.png',
      threshold: 0.1
    },
    {
      current: 'test-results/current/home-dark-desktop.png',
      baseline: 'test-results/baselines/home-dark-desktop.png',
      threshold: 0.05,
      options: {
        includeAA: false, // Ignore anti-aliasing differences
        createDiffImage: true,
        ignoreRegions: [
          { x: 0, y: 0, width: 100, height: 50, pixelCount: 5000 } // Ignore header area
        ]
      }
    }
  ];

  const results = await imageComparison.batchCompare(comparisons);
  
  // Generate comprehensive report
  const report = imageComparison.generateComparisonReport(results);
  
  console.log('Comparison Report:');
  console.log(`- Total comparisons: ${report.summary.totalComparisons}`);
  console.log(`- Passed: ${report.summary.passedComparisons}`);
  console.log(`- Failed: ${report.summary.failedComparisons}`);
  console.log(`- Average difference: ${report.summary.averageDifference.toFixed(2)}%`);
  console.log(`- Max difference: ${report.summary.maxDifference.toFixed(2)}%`);

  return report;
}

/**
 * Example: Error handling and recovery
 */
export async function errorHandlingExample(browser: Browser) {
  const screenshotCapture = new ScreenshotCapture('test-results/error-test');
  const visualTestRunner = new VisualTestRunner(screenshotCapture);

  const config: VisualTestConfig = {
    pages: [
      {
        name: 'valid-page',
        url: 'http://localhost:3000',
        waitForSelector: 'main'
      },
      {
        name: 'invalid-page',
        url: 'http://invalid-url-that-does-not-exist.com',
        waitForSelector: 'body'
      }
    ],
    viewports: [{ name: 'desktop', width: 1920, height: 1080 }],
    themes: ['light'],
    browsers: ['chromium'],
    updateBaselines: false,
    parallel: false,
    maxRetries: 2
  };

  const execution = await visualTestRunner.executeTests(browser, config);

  // Handle errors gracefully
  const errorResults = execution.results.filter(r => r.status === 'error');
  const passedResults = execution.results.filter(r => r.status === 'pass');

  console.log(`Error handling results:`);
  console.log(`- Successful tests: ${passedResults.length}`);
  console.log(`- Failed tests: ${errorResults.length}`);

  errorResults.forEach(result => {
    console.log(`- Error in ${result.page}/${result.theme}/${result.viewport}: ${result.error}`);
  });

  return execution;
}

// Export all examples for easy usage
export const examples = {
  basicVisualTesting,
  componentVisualTesting,
  advancedVisualTesting,
  baselineManagement,
  customImageComparison,
  errorHandlingExample
};