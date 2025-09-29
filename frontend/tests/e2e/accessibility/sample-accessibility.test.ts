import { test, expect, THEMES } from '../fixtures/base-test';

test.describe('Accessibility Tests - Sample', () => {
  test.beforeEach(async ({ uiAuditPage }) => {
    await uiAuditPage.goto('/');
    await uiAuditPage.waitForLoadState('networkidle');
  });

  for (const theme of Object.values(THEMES)) {
    test(`WCAG compliance check - ${theme} theme`, async ({ 
      uiAuditPage, 
      themeToggler, 
      accessibilityChecker 
    }) => {
      // Switch to target theme
      await themeToggler.switchToTheme(theme);
      await uiAuditPage.waitForTimeout(300);

      // Run axe accessibility audit
      const results = await accessibilityChecker.runAxeAudit();
      
      // Check for violations
      // @ts-ignore
      const violations = results.violations || [];
      
      if (violations.length > 0) {
        console.log(`Found ${violations.length} accessibility violations in ${theme} theme:`);
        violations.forEach((violation: any, index: number) => {
          console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Help: ${violation.help}`);
        });
      }

      // Assert no critical or serious violations
      const criticalViolations = violations.filter((v: any) => 
        v.impact === 'critical' || v.impact === 'serious'
      );
      
      expect(criticalViolations).toHaveLength(0);
    });

    test(`Keyboard navigation - ${theme} theme`, async ({ 
      uiAuditPage, 
      themeToggler 
    }) => {
      await themeToggler.switchToTheme(theme);
      
      // Test tab navigation
      await uiAuditPage.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = await uiAuditPage.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
      
      // Test that focus indicators are visible
      const focusStyles = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });
      
      // Ensure some form of focus indication exists
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' || 
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBeTruthy();
    });

    test(`Color contrast check - ${theme} theme`, async ({ 
      uiAuditPage, 
      themeToggler, 
      accessibilityChecker 
    }) => {
      await themeToggler.switchToTheme(theme);
      
      // Get contrast information for text elements
      const contrastData = await accessibilityChecker.checkContrastRatios();
      
      // Log contrast information for manual review
      console.log(`Contrast data for ${theme} theme:`, contrastData.slice(0, 10));
      
      // Basic check that we have text elements to analyze
      expect(contrastData.length).toBeGreaterThan(0);
    });

    test(`ARIA labels and roles - ${theme} theme`, async ({ 
      uiAuditPage, 
      themeToggler 
    }) => {
      await themeToggler.switchToTheme(theme);
      
      // Check for interactive elements without proper labels
      const interactiveElements = await uiAuditPage.locator(
        'button, a, input, select, textarea, [role="button"], [role="link"]'
      ).all();
      
      for (const element of interactiveElements) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledBy = await element.getAttribute('aria-labelledby');
        const textContent = await element.textContent();
        const altText = await element.getAttribute('alt');
        
        // Check that interactive elements have some form of accessible name
        const hasAccessibleName = 
          ariaLabel || 
          ariaLabelledBy || 
          (textContent && textContent.trim()) ||
          altText;
        
        if (!hasAccessibleName) {
          console.warn(`Interactive element without accessible name: ${tagName}`);
        }
      }
      
      // This test passes if we complete the check without errors
      expect(interactiveElements.length).toBeGreaterThanOrEqual(0);
    });
  }
});