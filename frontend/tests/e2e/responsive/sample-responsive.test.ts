import { test, expect } from '@playwright/test';
import { 
  ViewportManager, 
  TouchTargetValidator, 
  ResponsiveLayoutChecker, 
  MobileInteractionTester 
} from './index';

test.describe('Sample Mobile Responsiveness Tests', () => {
  test('basic viewport management', async ({ page }) => {
    const viewportManager = new ViewportManager(page);
    
    await page.goto('/');
    
    // Test mobile viewport
    await viewportManager.setViewport('mobile');
    const mobileViewport = await viewportManager.getCurrentViewport();
    expect(mobileViewport.width).toBe(375);
    expect(mobileViewport.height).toBe(667);
    
    // Verify page is responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await viewportManager.setViewport('desktop');
    const desktopViewport = await viewportManager.getCurrentViewport();
    expect(desktopViewport.width).toBe(1920);
    expect(desktopViewport.height).toBe(1080);
  });

  test('basic touch target validation', async ({ page }) => {
    const touchTargetValidator = new TouchTargetValidator(page);
    
    await page.goto('/');
    
    // Set mobile viewport for touch target testing
    const viewportManager = new ViewportManager(page);
    await viewportManager.setViewport('mobile');
    
    // Validate touch targets
    const report = await touchTargetValidator.validateTouchTargets();
    
    console.log(`Touch Target Results:
      Total Elements: ${report.totalElements}
      Pass Rate: ${report.passRate}%
      Failed Elements: ${report.failedElements}
    `);
    
    // Basic assertions
    expect(report.totalElements).toBeGreaterThan(0);
    expect(report.passRate).toBeGreaterThanOrEqual(70); // Allow some flexibility for sample
    
    // No critical failures should exist
    expect(report.summary.criticalFailures.length).toBe(0);
  });

  test('basic layout adaptation check', async ({ page }) => {
    const layoutChecker = new ResponsiveLayoutChecker(page);
    
    await page.goto('/');
    
    // Check layout adaptation across viewports
    const report = await layoutChecker.checkLayoutAdaptation();
    
    console.log(`Layout Adaptation Results:
      Overall Score: ${report.overallScore}
      Total Issues: ${report.totalIssues}
      Critical Issues: ${report.criticalIssues}
    `);
    
    // Basic assertions
    expect(report.overallScore).toBeGreaterThanOrEqual(60); // Allow flexibility for sample
    expect(report.criticalIssues).toBe(0); // No critical issues allowed
    
    // Should test multiple breakpoints
    expect(report.breakpoints.length).toBeGreaterThan(1);
  });

  test('basic mobile interaction testing', async ({ page }) => {
    const interactionTester = new MobileInteractionTester(page);
    
    await page.goto('/');
    
    // Set mobile viewport
    const viewportManager = new ViewportManager(page);
    await viewportManager.setViewport('mobile');
    
    // Test mobile interactions
    const report = await interactionTester.testMobileInteractions();
    
    console.log(`Mobile Interaction Results:
      Overall Score: ${report.overallScore}
      Touch Gestures Tested: ${report.touchGestureResults.length}
      Average Response Time: ${report.performanceMetrics.averageResponseTime}ms
    `);
    
    // Basic assertions
    expect(report.overallScore).toBeGreaterThanOrEqual(70); // Allow flexibility for sample
    expect(report.performanceMetrics.averageResponseTime).toBeLessThanOrEqual(500);
    
    // Should have tested some interactions
    expect(report.touchGestureResults.length).toBeGreaterThan(0);
  });

  test('cross-viewport consistency', async ({ page }) => {
    const viewportManager = new ViewportManager(page);
    
    await page.goto('/');
    
    const viewports = ['mobile', 'tablet', 'desktop'];
    const results: Record<string, boolean> = {};
    
    for (const viewport of viewports) {
      await viewportManager.setViewport(viewport as keyof typeof ViewportManager.VIEWPORTS);
      
      // Check if main content is visible
      const isMainVisible = await page.locator('main, .main-content, #main').first().isVisible();
      results[viewport] = isMainVisible;
      
      expect(isMainVisible).toBe(true);
    }
    
    console.log('Cross-viewport visibility results:', results);
  });

  test('orientation change handling', async ({ page }) => {
    const viewportManager = new ViewportManager(page);
    
    await page.goto('/');
    
    // Test orientation changes for mobile
    const orientations = await viewportManager.testOrientationChange('mobile');
    
    // Test portrait
    await viewportManager.setCustomViewport(
      orientations.portrait.width,
      orientations.portrait.height
    );
    
    await expect(page.locator('body')).toBeVisible();
    
    // Test landscape
    await viewportManager.setCustomViewport(
      orientations.landscape.width,
      orientations.landscape.height
    );
    
    await expect(page.locator('body')).toBeVisible();
    
    console.log('Orientation change test completed successfully');
  });
});