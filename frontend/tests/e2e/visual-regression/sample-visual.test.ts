import { test, expect, VIEWPORTS, THEMES } from '../fixtures/base-test';

test.describe('Visual Regression Tests - Sample', () => {
  test.beforeEach(async ({ uiAuditPage }) => {
    // Navigate to the page before each test
    await uiAuditPage.goto('/');
    await uiAuditPage.waitForLoadState('networkidle');
  });

  // Test homepage in both themes across different viewports
  for (const theme of Object.values(THEMES)) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test(`Homepage - ${theme} theme - ${viewportName}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(viewport);
        
        // Switch to target theme
        await themeToggler.switchToTheme(theme);
        
        // Wait for any animations to complete
        await uiAuditPage.waitForTimeout(500);
        
        // Capture full page screenshot
        await screenshotCapture.captureFullPage({
          name: 'homepage',
          theme,
          viewport: viewportName as keyof typeof VIEWPORTS
        });
        
        // Verify page loaded correctly
        await expect(uiAuditPage.locator('body')).toBeVisible();
        
        // Check for any obvious layout issues
        const bodyHeight = await uiAuditPage.locator('body').boundingBox();
        expect(bodyHeight?.height).toBeGreaterThan(viewport.height * 0.5);
      });
    }
  }

  test('Component screenshot capture', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    // Example of capturing specific component screenshots
    await themeToggler.switchToTheme('light');
    
    // Capture header component if it exists
    const header = uiAuditPage.locator('header, [data-testid="header"]').first();
    if (await header.isVisible()) {
      await screenshotCapture.captureElement('header', {
        name: 'header-component',
        theme: 'light',
        viewport: 'desktop'
      });
    }
    
    // Capture navigation if it exists
    const nav = uiAuditPage.locator('nav, [data-testid="navigation"]').first();
    if (await nav.isVisible()) {
      await screenshotCapture.captureElement('nav', {
        name: 'navigation-component',
        theme: 'light',
        viewport: 'desktop'
      });
    }
  });
});