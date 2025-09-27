import { test, expect } from '@playwright/test';
import { ScreenshotCapture, VisualTestRunner, ImageComparison, BaselineManager } from './index';
import path from 'path';
import { promises as fs } from 'fs';

test.describe('Visual Testing Engine Integration', () => {
  let testResultsDir: string;

  test.beforeAll(async () => {
    testResultsDir = path.join(process.cwd(), 'test-results', 'integration-test');
    await fs.mkdir(testResultsDir, { recursive: true });
  });

  test.afterAll(async () => {
    try {
      await fs.rm(testResultsDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test results:', error);
    }
  });

  test('should create and compare screenshots end-to-end', async ({ browser }) => {
    // Initialize components
    const screenshotCapture = new ScreenshotCapture(path.join(testResultsDir, 'screenshots'));
    const imageComparison = new ImageComparison();
    const baselineManager = new BaselineManager(path.join(testResultsDir, 'baselines'));
    const visualTestRunner = new VisualTestRunner(screenshotCapture, imageComparison, baselineManager);

    // Define a simple test configuration
    const testConfig = {
      pages: [
        {
          name: 'simple-page',
          url: 'data:text/html,<html><body><h1>Test Page</h1><p>This is a test page for visual regression testing.</p></body></html>',
          waitForSelector: 'h1'
        }
      ],
      viewports: [
        { name: 'desktop', width: 1920, height: 1080 }
      ],
      themes: ['light'] as const,
      browsers: ['chromium'] as const,
      updateBaselines: true, // Create baselines first
      parallel: false,
      comparisonThreshold: 0.1
    };

    // First run - create baselines
    console.log('🚀 Running first test execution to create baselines...');
    const firstExecution = await visualTestRunner.executeTests(browser, testConfig);

    expect(firstExecution.summary.totalTests).toBe(1);
    expect(firstExecution.summary.passed).toBe(1);
    expect(firstExecution.summary.failed).toBe(0);
    expect(firstExecution.summary.errors).toBe(0);

    // Second run - compare against baselines
    console.log('🔍 Running second test execution to compare against baselines...');
    const secondExecution = await visualTestRunner.executeTests(browser, {
      ...testConfig,
      updateBaselines: false
    });

    expect(secondExecution.summary.totalTests).toBe(1);
    expect(secondExecution.summary.passed).toBe(1);
    expect(secondExecution.summary.failed).toBe(0);
    expect(secondExecution.summary.errors).toBe(0);

    // Verify comparison result
    const result = secondExecution.results[0];
    expect(result.comparison).toBeTruthy();
    expect(result.comparison?.hasDifferences).toBe(false);
    expect(result.comparison?.differencePercentage).toBe(0);

    console.log('✅ Integration test completed successfully!');
  });

  test('should detect visual regressions', async ({ browser }) => {
    const screenshotCapture = new ScreenshotCapture(path.join(testResultsDir, 'regression-test'));
    const imageComparison = new ImageComparison();
    const baselineManager = new BaselineManager(path.join(testResultsDir, 'regression-baselines'));
    const visualTestRunner = new VisualTestRunner(screenshotCapture, imageComparison, baselineManager);

    // Create baseline with original content
    const baselineConfig = {
      pages: [
        {
          name: 'regression-page',
          url: 'data:text/html,<html><body><h1>Original Content</h1><p>This is the original page content.</p></body></html>',
          waitForSelector: 'h1'
        }
      ],
      viewports: [{ name: 'desktop', width: 1920, height: 1080 }],
      themes: ['light'] as const,
      browsers: ['chromium'] as const,
      updateBaselines: true,
      parallel: false
    };

    console.log('📸 Creating baseline...');
    await visualTestRunner.executeTests(browser, baselineConfig);

    // Test with modified content
    const regressionConfig = {
      ...baselineConfig,
      pages: [
        {
          name: 'regression-page',
          url: 'data:text/html,<html><body><h1>Modified Content</h1><p>This content has been changed and should trigger a visual regression.</p></body></html>',
          waitForSelector: 'h1'
        }
      ],
      updateBaselines: false,
      comparisonThreshold: 0.1
    };

    console.log('🔍 Testing for visual regression...');
    const regressionExecution = await visualTestRunner.executeTests(browser, regressionConfig);

    expect(regressionExecution.summary.totalTests).toBe(1);
    expect(regressionExecution.summary.failed).toBe(1);
    expect(regressionExecution.summary.passed).toBe(0);

    const result = regressionExecution.results[0];
    expect(result.comparison?.hasDifferences).toBe(true);
    expect(result.comparison?.differencePercentage).toBeGreaterThan(0);

    console.log(`🔍 Visual regression detected: ${result.comparison?.differencePercentage.toFixed(2)}% difference`);
  });

  test('should handle multiple viewports and themes', async ({ browser }) => {
    const screenshotCapture = new ScreenshotCapture(path.join(testResultsDir, 'multi-test'));
    const imageComparison = new ImageComparison();
    const baselineManager = new BaselineManager(path.join(testResultsDir, 'multi-baselines'));
    const visualTestRunner = new VisualTestRunner(screenshotCapture, imageComparison, baselineManager);

    const multiConfig = {
      pages: [
        {
          name: 'multi-page',
          url: 'data:text/html,<html><body><h1>Multi-viewport Test</h1><p>Testing multiple viewports and themes.</p></body></html>',
          waitForSelector: 'h1'
        }
      ],
      viewports: [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 667 }
      ],
      themes: ['light', 'dark'] as const,
      browsers: ['chromium'] as const,
      updateBaselines: true,
      parallel: false
    };

    console.log('🚀 Testing multiple viewports and themes...');
    const execution = await visualTestRunner.executeTests(browser, multiConfig);

    // Should have 1 page × 3 viewports × 2 themes = 6 tests
    expect(execution.summary.totalTests).toBe(6);
    expect(execution.summary.passed).toBe(6);
    expect(execution.summary.failed).toBe(0);
    expect(execution.summary.errors).toBe(0);

    // Verify all combinations were tested
    const combinations = execution.results.map(r => `${r.page}/${r.theme}/${r.viewport}`);
    expect(combinations).toContain('multi-page/light/desktop');
    expect(combinations).toContain('multi-page/light/tablet');
    expect(combinations).toContain('multi-page/light/mobile');
    expect(combinations).toContain('multi-page/dark/desktop');
    expect(combinations).toContain('multi-page/dark/tablet');
    expect(combinations).toContain('multi-page/dark/mobile');

    console.log('✅ Multi-viewport and theme testing completed successfully!');
  });
});