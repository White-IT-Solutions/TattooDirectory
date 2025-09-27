import { test, expect, THEMES, VIEWPORTS } from '../fixtures/base-test';

test.describe('Theme Testing - Sample', () => {
  test.beforeEach(async ({ uiAuditPage }) => {
    await uiAuditPage.goto('/');
    await uiAuditPage.waitForLoadState('networkidle');
  });

  test('Theme switching functionality', async ({ uiAuditPage, themeToggler }) => {
    // Test switching from light to dark using enhanced ThemeToggler
    await themeToggler.switchToTheme('light', { validateApplication: true });
    let currentState = await themeToggler.getThemeState();
    expect(currentState.current).toBe('light');

    await themeToggler.switchToTheme('dark', { validateApplication: true });
    currentState = await themeToggler.getThemeState();
    expect(currentState.current).toBe('dark');

    // Test switching back to light
    await themeToggler.switchToTheme('light', { validateApplication: true });
    currentState = await themeToggler.getThemeState();
    expect(currentState.current).toBe('light');
  });

  test('Theme persistence across page reloads', async ({ uiAuditPage, themeToggler }) => {
    // Test theme persistence using enhanced method
    const persisted = await themeToggler.testThemePersistence('dark');
    expect(persisted).toBe(true);
    
    // Verify current state
    const currentState = await themeToggler.getThemeState();
    expect(currentState.current).toBe('dark');
    expect(currentState.storageValue).toBe('dark');
  });

  test('Theme transition smoothness', async ({ uiAuditPage, transitionTester }) => {
    // Use enhanced TransitionTester for comprehensive transition testing
    const transitionReport = await transitionTester.testThemeTransition('light', 'dark', {
      maxDuration: 1000,
      minFps: 30,
      checkVisualArtifacts: true
    });
    
    // Verify transition performance
    expect(transitionReport.overallSmooth).toBe(true);
    expect(transitionReport.totalDuration).toBeLessThan(1000);
    expect(transitionReport.globalMetrics.fps).toBeGreaterThan(30);
    expect(transitionReport.issuesFound).toBe(0);
  });

  for (const theme of Object.values(THEMES)) {
    test(`Component theme compliance - ${theme}`, async ({ 
      uiAuditPage, 
      themeToggler 
    }) => {
      await themeToggler.switchToTheme(theme);
      
      // Check that all major components have appropriate theme classes
      const components = [
        'header',
        'nav',
        'main',
        'footer',
        '[data-testid*="card"]',
        '[data-testid*="button"]'
      ];
      
      for (const selector of components) {
        const elements = await uiAuditPage.locator(selector).all();
        
        for (const element of elements) {
          if (await element.isVisible()) {
            // Check computed styles for theme-appropriate colors
            const styles = await element.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                backgroundColor: computed.backgroundColor,
                color: computed.color,
                borderColor: computed.borderColor
              };
            });
            
            // Basic validation that colors are not default/transparent
            expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
            expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
          }
        }
      }
    });

    test(`Form elements theme compliance - ${theme}`, async ({ 
      uiAuditPage, 
      themeToggler 
    }) => {
      await themeToggler.switchToTheme(theme);
      
      // Find form elements
      const formElements = await uiAuditPage.locator(
        'input, select, textarea, button[type="submit"]'
      ).all();
      
      for (const element of formElements) {
        if (await element.isVisible()) {
          // Check that form elements have proper theme styling
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              borderColor: computed.borderColor,
              borderWidth: computed.borderWidth
            };
          });
          
          // Form elements should have visible borders and appropriate colors
          expect(styles.borderWidth).not.toBe('0px');
          expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        }
      }
    });
  }

  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test(`Theme consistency across viewports - ${viewportName}`, async ({ 
      uiAuditPage, 
      themeToggler 
    }) => {
      await uiAuditPage.setViewportSize(viewport);
      
      // Test both themes at this viewport
      for (const theme of Object.values(THEMES)) {
        await themeToggler.switchToTheme(theme);
        
        // Verify theme is applied correctly at this viewport
        const currentTheme = await themeToggler.getCurrentTheme();
        expect(currentTheme).toBe(theme);
        
        // Check that responsive elements maintain theme consistency
        const responsiveElements = await uiAuditPage.locator(
          '[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]'
        ).all();
        
        // Ensure responsive elements are visible and styled
        for (const element of responsiveElements.slice(0, 5)) { // Check first 5 to avoid timeout
          if (await element.isVisible()) {
            const hasThemeClasses = await element.evaluate((el) => {
              const classes = el.className;
              return classes.includes('dark:') || classes.includes('light:');
            });
            
            // Not all elements need theme classes, but they should be styled
            const styles = await element.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return computed.color !== 'rgba(0, 0, 0, 0)';
            });
            
            expect(styles).toBeTruthy();
          }
        }
      }
    });
  }
});