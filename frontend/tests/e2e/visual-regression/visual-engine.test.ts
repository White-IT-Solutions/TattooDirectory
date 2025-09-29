import { test, expect, Browser } from '@playwright/test';
import { ScreenshotCapture, VisualTestRunner, ImageComparison, BaselineManager } from './index';
import path from 'path';
import { promises as fs } from 'fs';

test.describe('Visual Testing Engine', () => {
  let screenshotCapture: ScreenshotCapture;
  let visualTestRunner: VisualTestRunner;
  let imageComparison: ImageComparison;
  let baselineManager: BaselineManager;
  let testResultsDir: string;

  test.beforeAll(async () => {
    // Setup test directories
    testResultsDir = path.join(process.cwd(), 'test-results', 'visual-engine-test');
    await fs.mkdir(testResultsDir, { recursive: true });

    // Initialize components
    screenshotCapture = new ScreenshotCapture(path.join(testResultsDir, 'screenshots'));
    imageComparison = new ImageComparison();
    baselineManager = new BaselineManager(path.join(testResultsDir, 'baselines'));
    visualTestRunner = new VisualTestRunner(screenshotCapture, imageComparison, baselineManager);
  });

  test.afterAll(async () => {
    // Cleanup test results
    try {
      await fs.rm(testResultsDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test results:', error);
    }
  });

  test('ScreenshotCapture should capture high-resolution screenshots', async ({ page, browser }) => {
    // Navigate to a test page
    await page.goto('data:text/html,<html><body><h1>Test Page</h1><p>Light mode content</p></body></html>');
    
    // Test light mode screenshot
    const lightScreenshot = await screenshotCapture.capturePageScreenshot(
      page,
      'test-page',
      'light',
      { type: 'png' }
    );

    expect(lightScreenshot.id).toBeTruthy();
    expect(lightScreenshot.page).toBe('test-page');
    expect(lightScreenshot.theme).toBe('light');
    expect(lightScreenshot.imagePath).toContain('.png');
    expect(lightScreenshot.metadata.browserName).toBeTruthy();

    // Verify screenshot file exists
    const imageExists = await fs.access(lightScreenshot.imagePath).then(() => true).catch(() => false);
    expect(imageExists).toBe(true);

    // Test dark mode screenshot
    const darkScreenshot = await screenshotCapture.capturePageScreenshot(
      page,
      'test-page',
      'dark',
      { type: 'png' }
    );

    expect(darkScreenshot.theme).toBe('dark');
    expect(darkScreenshot.imagePath).not.toBe(lightScreenshot.imagePath);
  });

  test('ScreenshotCapture should handle multiple viewports', async ({ page }) => {
    await page.goto('data:text/html,<html><body><h1>Responsive Test</h1></body></html>');

    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    const screenshots = await screenshotCapture.captureMultiViewport(
      page,
      'responsive-test',
      'light',
      viewports
    );

    expect(screenshots).toHaveLength(3);
    expect(screenshots[0].page).toBe('responsive-test-desktop');
    expect(screenshots[1].page).toBe('responsive-test-tablet');
    expect(screenshots[2].page).toBe('responsive-test-mobile');

    // Verify all screenshots have different viewport sizes
    expect(screenshots[0].viewport.width).toBe(1920);
    expect(screenshots[1].viewport.width).toBe(768);
    expect(screenshots[2].viewport.width).toBe(375);
  });

  test('BaselineManager should manage baseline storage and versioning', async ({ page }) => {
    await page.goto('data:text/html,<html><body><h1>Baseline Test</h1></body></html>');

    // Capture initial screenshot
    const screenshot = await screenshotCapture.capturePageScreenshot(
      page,
      'baseline-test',
      'light'
    );

    // Create baseline
    const baseline = await baselineManager.updateBaseline(screenshot, true, 'test-user');
    
    expect(baseline.page).toBe('baseline-test');
    expect(baseline.theme).toBe('light');
    expect(baseline.version).toBe(1);
    expect(baseline.approved).toBe(true);
    expect(baseline.approvedBy).toBe('test-user');

    // Retrieve baseline using the actual viewport string from the screenshot
    const viewportKey = `${screenshot.viewport.width}x${screenshot.viewport.height}`;
    const retrievedBaseline = await baselineManager.getBaseline('baseline-test', 'light', viewportKey);
    expect(retrievedBaseline).toBeTruthy();
    expect(retrievedBaseline?.id).toBe(baseline.id);

    // Update baseline (should increment version)
    const updatedBaseline = await baselineManager.updateBaseline(screenshot, false);
    expect(updatedBaseline.version).toBe(2);
    expect(updatedBaseline.approved).toBe(false);

    // Get baseline history
    const history = await baselineManager.getBaselineHistory('baseline-test', 'light', viewportKey);
    expect(history).toBeTruthy();
    expect(history?.current.version).toBe(2);
    expect(history?.versions).toHaveLength(1); // Previous version should be archived
  });

  test('ImageComparison should detect visual differences', async ({ page }) => {
    // Create two visually different pages
    await page.goto('data:text/html,<html><body style="background: white;"><h1 style="color: black;">Original Page</h1><p>This is the original content</p></body></html>');
    const originalScreenshot = await screenshotCapture.capturePageScreenshot(page, 'comparison-test', 'light');

    await page.goto('data:text/html,<html><body style="background: red;"><h1 style="color: white;">Modified Page</h1><p>This is completely different content with different colors</p></body></html>');
    const modifiedScreenshot = await screenshotCapture.capturePageScreenshot(page, 'comparison-test-modified', 'light');

    // Compare images
    const comparisonResult = await imageComparison.compare(
      modifiedScreenshot.imagePath,
      originalScreenshot.imagePath,
      0.1
    );

    expect(comparisonResult.hasDifferences).toBe(true);
    expect(comparisonResult.differencePercentage).toBeGreaterThan(0);
    expect(comparisonResult.pixelDifferences).toBeGreaterThan(0);
    expect(comparisonResult.affectedRegions.length).toBeGreaterThan(0);

    // Test identical images
    const identicalResult = await imageComparison.compare(
      originalScreenshot.imagePath,
      originalScreenshot.imagePath,
      0.1
    );

    expect(identicalResult.hasDifferences).toBe(false);
    expect(identicalResult.differencePercentage).toBe(0);
    expect(identicalResult.pixelDifferences).toBe(0);
  });

  test('VisualTestRunner should orchestrate complete test execution', async ({ browser }) => {
    const testConfig = {
      pages: [
        {
          name: 'home',
          url: 'data:text/html,<html><body><h1>Home Page</h1><p>Welcome to our site</p></body></html>',
          waitForSelector: 'h1'
        },
        {
          name: 'about',
          url: 'data:text/html,<html><body><h1>About Page</h1><p>About our company</p></body></html>',
          waitForSelector: 'h1'
        }
      ],
      viewports: [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'mobile', width: 375, height: 667 }
      ],
      themes: ['light', 'dark'] as const,
      browsers: ['chromium'] as const,
      updateBaselines: true, // Create baselines on first run
      parallel: false,
      comparisonThreshold: 0.1
    };

    // Execute tests
    const execution = await visualTestRunner.executeTests(browser, testConfig);

    expect(execution.id).toBeTruthy();
    expect(execution.config).toEqual(testConfig);
    expect(execution.results).toHaveLength(8); // 2 pages × 2 themes × 2 viewports × 1 browser
    expect(execution.summary.totalTests).toBe(8);

    // All tests should pass on first run (creating baselines)
    expect(execution.summary.passed).toBe(8);
    expect(execution.summary.failed).toBe(0);
    expect(execution.summary.errors).toBe(0);

    // Run tests again (should compare against baselines)
    const secondExecution = await visualTestRunner.executeTests(browser, {
      ...testConfig,
      updateBaselines: false
    });

    expect(secondExecution.summary.totalTests).toBe(8);
    // Should pass since content is identical
    expect(secondExecution.summary.passed).toBe(8);
    expect(secondExecution.summary.failed).toBe(0);
  });

  test('Visual testing engine should handle errors gracefully', async ({ browser }) => {
    const testConfig = {
      pages: [
        {
          name: 'invalid-page',
          url: 'http://invalid-url-that-does-not-exist.com',
          waitForSelector: 'h1'
        }
      ],
      viewports: [{ name: 'desktop', width: 1920, height: 1080 }],
      themes: ['light'] as const,
      browsers: ['chromium'] as const,
      updateBaselines: false,
      parallel: false
    };

    const execution = await visualTestRunner.executeTests(browser, testConfig);

    expect(execution.results).toHaveLength(1);
    expect(execution.results[0].status).toBe('error');
    expect(execution.results[0].error).toBeTruthy();
    expect(execution.summary.errors).toBe(1);
    expect(execution.summary.passed).toBe(0);
  });

  test('ImageComparison should generate comprehensive reports', async ({ page }) => {
    // Create test images for batch comparison
    await page.goto('data:text/html,<html><body><h1>Test 1</h1></body></html>');
    const test1 = await screenshotCapture.capturePageScreenshot(page, 'batch-test-1', 'light');

    await page.goto('data:text/html,<html><body><h1>Test 2</h1></body></html>');
    const test2 = await screenshotCapture.capturePageScreenshot(page, 'batch-test-2', 'light');

    await page.goto('data:text/html,<html><body><h1>Test 3</h1></body></html>');
    const test3 = await screenshotCapture.capturePageScreenshot(page, 'batch-test-3', 'light');

    // Perform batch comparison
    const comparisons = [
      { current: test1.imagePath, baseline: test1.imagePath }, // Identical
      { current: test2.imagePath, baseline: test1.imagePath }, // Different
      { current: test3.imagePath, baseline: test1.imagePath }  // Different
    ];

    const results = await imageComparison.batchCompare(comparisons);
    expect(results).toHaveLength(3);

    // Generate report
    const report = imageComparison.generateComparisonReport(results);
    
    expect(report.summary.totalComparisons).toBe(3);
    expect(report.summary.passedComparisons).toBe(1); // Only identical comparison should pass
    expect(report.summary.failedComparisons).toBe(2);
    expect(report.categories.noDifferences).toBe(1);
    expect(report.categories.minorDifferences + report.categories.significantDifferences).toBe(2);
  });
});

test.describe('Visual Testing Engine Integration', () => {
  test('should work with real application pages', async ({ page, browser }) => {
    // Skip if not running against actual application
    test.skip(!process.env.TEST_REAL_APP, 'Skipping real app test - set TEST_REAL_APP=true to enable');

    const screenshotCapture = new ScreenshotCapture();
    const imageComparison = new ImageComparison();
    const baselineManager = new BaselineManager();
    const visualTestRunner = new VisualTestRunner(screenshotCapture, imageComparison, baselineManager);

    const testConfig = {
      pages: [
        {
          name: 'home',
          url: 'http://localhost:3000',
          waitForSelector: 'main'
        }
      ],
      viewports: [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'mobile', width: 375, height: 667 }
      ],
      themes: ['light', 'dark'] as const,
      browsers: ['chromium'] as const,
      updateBaselines: true,
      parallel: false
    };

    const execution = await visualTestRunner.executeTests(browser, testConfig);
    
    expect(execution.summary.totalTests).toBe(4); // 1 page × 2 themes × 2 viewports
    expect(execution.summary.errors).toBe(0);
  });
});