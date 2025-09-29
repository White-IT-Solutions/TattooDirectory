import { test, expect, Page } from '@playwright/test';
import { 
  RobustTestRunner, 
  createRobustTestRunner, 
  createTestOperation,
  DEFAULT_ERROR_CONFIG,
  RETRY_CONFIGS 
} from './index';

test.describe('Error Handling and Recovery System', () => {
  let robustRunner: RobustTestRunner;
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    robustRunner = createRobustTestRunner({
      ...DEFAULT_ERROR_CONFIG,
      logLevel: 'debug'
    });
  });

  test.afterEach(async () => {
    // Generate error report after each test
    const errorReport = await robustRunner.generateErrorReport();
    console.log('Error Report:', JSON.stringify(errorReport, null, 2));
  });

  test('should handle screenshot capture with fallbacks', async () => {
    await page.goto('/');

    // Test screenshot capture with intentional failure scenarios
    const screenshotBuffer = await robustRunner.captureRobustScreenshot(
      page,
      'homepage',
      'light'
    );

    expect(screenshotBuffer).toBeDefined();
    expect(screenshotBuffer.length).toBeGreaterThan(0);
  });

  test('should handle accessibility audit with fallbacks', async () => {
    await page.goto('/');

    const accessibilityResult = await robustRunner.runRobustAccessibilityAudit(
      page,
      'homepage',
      'light',
      'AA'
    );

    expect(accessibilityResult).toBeDefined();
    expect(accessibilityResult.violations).toBeDefined();
    expect(accessibilityResult.passes).toBeDefined();
    expect(accessibilityResult.score).toBeGreaterThanOrEqual(0);
    expect(accessibilityResult.source).toMatch(/primary|fallback|manual|placeholder/);
  });

  test('should handle page navigation with retry logic', async () => {
    // Test navigation with potential failures
    await robustRunner.navigateRobustly(page, '/', {
      waitUntil: 'networkidle'
    });

    expect(page.url()).toContain('/');
  });

  test('should handle element waiting with fallbacks', async () => {
    await page.goto('/');

    // Test waiting for elements with fallback strategies
    await robustRunner.waitForElementRobustly(page, 'body');
    
    const bodyElement = await page.$('body');
    expect(bodyElement).toBeTruthy();
  });

  test('should execute batch operations with error handling', async () => {
    await page.goto('/');

    const operations = [
      createTestOperation(
        'capture_homepage_light',
        async () => {
          return await robustRunner.captureRobustScreenshot(page, 'homepage', 'light');
        },
        { ...RETRY_CONFIGS.screenshot }
      ),
      createTestOperation(
        'run_accessibility_audit',
        async () => {
          return await robustRunner.runRobustAccessibilityAudit(page, 'homepage', 'light');
        },
        { ...RETRY_CONFIGS.accessibility }
      ),
      createTestOperation(
        'check_page_title',
        async () => {
          const title = await page.title();
          if (!title) throw new Error('Page title not found');
          return title;
        }
      )
    ];

    const batchResult = await robustRunner.executeBatchTests(
      operations,
      page,
      'light',
      true // Continue on failure
    );

    expect(batchResult.totalTests).toBe(3);
    expect(batchResult.successfulTests).toBeGreaterThan(0);
    expect(batchResult.results).toHaveLength(3);

    // Check that each operation has a result
    batchResult.results.forEach(result => {
      expect(result.name).toBeDefined();
      expect(result.result).toBeDefined();
      expect(typeof result.result.success).toBe('boolean');
    });
  });

  test('should handle theme switching with error recovery', async () => {
    await page.goto('/');

    // Test theme switching with error handling
    const lightScreenshot = await robustRunner.captureRobustScreenshot(
      page, 
      'homepage', 
      'light'
    );

    // Switch to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(1000); // Allow theme transition

    const darkScreenshot = await robustRunner.captureRobustScreenshot(
      page, 
      'homepage', 
      'dark'
    );

    expect(lightScreenshot).toBeDefined();
    expect(darkScreenshot).toBeDefined();
    expect(lightScreenshot.length).toBeGreaterThan(0);
    expect(darkScreenshot.length).toBeGreaterThan(0);
  });

  test('should generate comprehensive error statistics', async () => {
    await page.goto('/');

    // Execute some operations to generate error data
    await robustRunner.captureRobustScreenshot(page, 'test-page', 'light');
    await robustRunner.runRobustAccessibilityAudit(page, 'test-page', 'light');

    const statistics = robustRunner.getErrorStatistics();

    expect(statistics).toBeDefined();
    expect(statistics.handler).toBeDefined();
    expect(statistics.logger).toBeDefined();
    expect(statistics.combined).toBeDefined();
    expect(typeof statistics.combined.totalErrors).toBe('number');
    expect(typeof statistics.combined.recoveryRate).toBe('number');
  });

  test('should handle multiple viewport testing with error recovery', async () => {
    await page.goto('/');

    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    const screenshotResults = [];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to stabilize

      const screenshot = await robustRunner.captureRobustScreenshot(
        page,
        `homepage-${viewport.name}`,
        'light'
      );

      screenshotResults.push({
        viewport: viewport.name,
        screenshot,
        success: screenshot.length > 0
      });
    }

    expect(screenshotResults).toHaveLength(3);
    screenshotResults.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.screenshot.length).toBeGreaterThan(0);
    });
  });

  test('should handle accessibility audit failures gracefully', async () => {
    await page.goto('/');

    // Force an accessibility audit on a potentially problematic page
    const auditResult = await robustRunner.runRobustAccessibilityAudit(
      page,
      'test-page',
      'light',
      'AAA' // More strict level
    );

    expect(auditResult).toBeDefined();
    expect(auditResult.source).toMatch(/primary|fallback|manual|placeholder/);
    
    // Even if the audit fails, we should get some result
    if (auditResult.source === 'placeholder') {
      expect(auditResult.error).toBeDefined();
      expect(auditResult.violations.length).toBeGreaterThan(0);
      expect(auditResult.violations[0].id).toBe('audit-failure');
    } else {
      expect(Array.isArray(auditResult.violations)).toBe(true);
      expect(Array.isArray(auditResult.passes)).toBe(true);
      expect(typeof auditResult.score).toBe('number');
    }
  });

  test('should export error data for analysis', async () => {
    await page.goto('/');

    // Generate some test operations with potential errors
    await robustRunner.captureRobustScreenshot(page, 'export-test', 'light');
    await robustRunner.runRobustAccessibilityAudit(page, 'export-test', 'light');

    // Export error data
    const exportPaths = await robustRunner.exportErrorData('test-results/error-exports');

    expect(exportPaths.handlerReport).toBeDefined();
    expect(exportPaths.logExport).toBeDefined();
    expect(exportPaths.combinedReport).toBeDefined();

    // Verify files contain data (basic check)
    expect(typeof exportPaths.handlerReport).toBe('string');
    expect(typeof exportPaths.logExport).toBe('string');
    expect(typeof exportPaths.combinedReport).toBe('string');
  });

  test('should handle network errors with retry logic', async () => {
    // Test navigation to a potentially unreliable URL
    const operation = createTestOperation(
      'test_network_resilience',
      async () => {
        await page.goto('/', { timeout: 5000 });
        return await page.title();
      },
      {
        fallbacks: [
          async () => {
            await page.goto('/', { timeout: 10000 });
            return await page.title();
          },
          async () => {
            // Last resort: just return current title if page is already loaded
            return await page.title() || 'Fallback Title';
          }
        ],
        ...RETRY_CONFIGS.navigation
      }
    );

    const result = await robustRunner.executeRobustTest(operation, page, 'light');

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(typeof result.executionTime).toBe('number');
  });

  test('should clear error data when requested', async () => {
    await page.goto('/');

    // Generate some error data
    await robustRunner.captureRobustScreenshot(page, 'clear-test', 'light');

    let statisticsBefore = robustRunner.getErrorStatistics();
    
    // Clear error data
    robustRunner.clearErrorData();

    let statisticsAfter = robustRunner.getErrorStatistics();

    // After clearing, we should have fewer or no errors
    expect(statisticsAfter.combined.totalErrors).toBeLessThanOrEqual(statisticsBefore.combined.totalErrors);
  });
});

test.describe('Error Handler Edge Cases', () => {
  let robustRunner: RobustTestRunner;

  test.beforeEach(() => {
    robustRunner = createRobustTestRunner({
      maxRetries: 2,
      baseDelayMs: 100, // Faster for testing
      enableLogging: true,
      gracefulDegradation: true
    });
  });

  test('should handle operations that always fail', async ({ page }) => {
    const alwaysFailOperation = createTestOperation(
      'always_fail_test',
      async () => {
        throw new Error('This operation always fails');
      },
      {
        fallbacks: [
          async () => {
            throw new Error('Fallback also fails');
          }
        ]
      }
    );

    const result = await robustRunner.executeRobustTest(alwaysFailOperation, page);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('This operation always fails');
    expect(result.fallbackUsed).toBe(true);
  });

  test('should handle mixed success/failure in batch operations', async ({ page }) => {
    await page.goto('/');

    const mixedOperations = [
      createTestOperation('success_operation', async () => 'success'),
      createTestOperation('fail_operation', async () => {
        throw new Error('Intentional failure');
      }),
      createTestOperation('success_with_fallback', async () => {
        throw new Error('Primary fails');
      }, {
        fallbacks: [async () => 'fallback_success']
      })
    ];

    const batchResult = await robustRunner.executeBatchTests(
      mixedOperations,
      page,
      'light',
      true
    );

    expect(batchResult.totalTests).toBe(3);
    expect(batchResult.successfulTests).toBe(2); // First and third should succeed
    expect(batchResult.failedTests).toBe(1); // Second should fail
    expect(batchResult.fallbacksUsed).toBe(1); // Third uses fallback
  });
});