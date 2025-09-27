import { test, expect } from '@playwright/test';
import { 
  createAccessibilityTestSuite, 
  runComprehensiveAccessibilityTest,
  generateConsolidatedReport,
  type ConsolidatedAccessibilityReport 
} from './index';

test.describe('Comprehensive Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto('/');
  });

  test('should pass WCAG 2.1 AA compliance in light mode', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    
    // Run comprehensive accessibility test in light mode
    const report = await runComprehensiveAccessibilityTest(testSuite, 'light');
    
    // Log detailed report
    console.log(generateConsolidatedReport(report));
    
    // Assert overall accessibility score
    expect(report.overallScore).toBeGreaterThanOrEqual(80);
    
    // Assert no critical WCAG violations
    const criticalViolations = report.wcagReport.violations.filter(v => v.impact === 'critical');
    expect(criticalViolations).toHaveLength(0);
    
    // Assert no ARIA errors
    const ariaErrors = report.ariaReport.violations.filter(v => v.severity === 'error');
    expect(ariaErrors).toHaveLength(0);
    
    // Assert no keyboard navigation errors
    const keyboardErrors = report.keyboardReport.violations.filter(v => v.severity === 'error');
    expect(keyboardErrors).toHaveLength(0);
  });

  test('should pass WCAG 2.1 AA compliance in dark mode', async ({ page }) => {
    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    const testSuite = createAccessibilityTestSuite(page);
    
    // Run comprehensive accessibility test in dark mode
    const report = await runComprehensiveAccessibilityTest(testSuite, 'dark');
    
    // Log detailed report
    console.log(generateConsolidatedReport(report));
    
    // Assert overall accessibility score
    expect(report.overallScore).toBeGreaterThanOrEqual(80);
    
    // Assert no critical WCAG violations
    const criticalViolations = report.wcagReport.violations.filter(v => v.impact === 'critical');
    expect(criticalViolations).toHaveLength(0);
    
    // Assert no ARIA errors
    const ariaErrors = report.ariaReport.violations.filter(v => v.severity === 'error');
    expect(ariaErrors).toHaveLength(0);
    
    // Assert no keyboard navigation errors
    const keyboardErrors = report.keyboardReport.violations.filter(v => v.severity === 'error');
    expect(keyboardErrors).toHaveLength(0);
  });

  test('should have proper color contrast ratios', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    await testSuite.wcagValidator.initialize();
    
    // Test color contrast specifically
    const contrastViolations = await testSuite.wcagValidator.checkColorContrast();
    
    // Log contrast violations
    if (contrastViolations.length > 0) {
      console.log('Color Contrast Violations:');
      contrastViolations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        violation.nodes.forEach(node => {
          console.log(`   - ${node.target.join(', ')}`);
        });
      });
    }
    
    // Assert no color contrast violations
    expect(contrastViolations).toHaveLength(0);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    
    // Run ARIA validation
    const ariaReport = await testSuite.ariaChecker.validateARIA('light');
    
    // Log ARIA report
    console.log(testSuite.ariaChecker.generateARIAReport(ariaReport));
    
    // Assert ARIA compliance
    expect(ariaReport.score).toBeGreaterThanOrEqual(90);
    
    // Assert no ARIA errors
    const errors = ariaReport.violations.filter(v => v.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    
    // Run keyboard navigation test
    const keyboardReport = await testSuite.keyboardTester.testKeyboardNavigation('light');
    
    // Log keyboard navigation report
    console.log(testSuite.keyboardTester.generateNavigationReport(keyboardReport));
    
    // Assert keyboard navigation compliance
    expect(keyboardReport.score).toBeGreaterThanOrEqual(85);
    
    // Assert all focusable elements have focus indicators
    const elementsWithoutFocus = keyboardReport.focusableElements.filter(el => 
      el.isVisible && !el.hasVisibleFocus
    );
    expect(elementsWithoutFocus).toHaveLength(0);
    
    // Assert tab order exists
    expect(keyboardReport.tabOrder.length).toBeGreaterThan(0);
  });

  test('should test specific page sections for accessibility', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    await testSuite.wcagValidator.initialize();
    
    // Test header section
    const headerReport = await testSuite.wcagValidator.auditElements('header, [role="banner"]', 'light');
    expect(headerReport.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    
    // Test navigation section
    const navReport = await testSuite.wcagValidator.auditElements('nav, [role="navigation"]', 'light');
    expect(navReport.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    
    // Test main content section
    const mainReport = await testSuite.wcagValidator.auditElements('main, [role="main"]', 'light');
    expect(mainReport.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
    
    // Test footer section
    const footerReport = await testSuite.wcagValidator.auditElements('footer, [role="contentinfo"]', 'light');
    expect(footerReport.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('should test form accessibility', async ({ page }) => {
    // Navigate to a page with forms (adjust URL as needed)
    await page.goto('/search'); // or any page with forms
    
    const testSuite = createAccessibilityTestSuite(page);
    await testSuite.wcagValidator.initialize();
    
    // Test form elements specifically
    const formReport = await testSuite.wcagValidator.auditElements('form, input, textarea, select, button', 'light');
    
    // Log form accessibility issues
    if (formReport.violations.length > 0) {
      console.log('Form Accessibility Violations:');
      console.log(testSuite.wcagValidator.generateViolationReport(formReport.violations));
    }
    
    // Assert no critical form accessibility issues
    const criticalFormIssues = formReport.violations.filter(v => v.impact === 'critical');
    expect(criticalFormIssues).toHaveLength(0);
    
    // Test ARIA labels on form elements
    const ariaReport = await testSuite.ariaChecker.validateARIA('light');
    const formAriaErrors = ariaReport.violations.filter(v => 
      v.issue.toLowerCase().includes('form') || 
      v.issue.toLowerCase().includes('input') ||
      v.issue.toLowerCase().includes('label')
    );
    expect(formAriaErrors.filter(v => v.severity === 'error')).toHaveLength(0);
  });

  test('should test interactive elements accessibility', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    
    // Test keyboard navigation of interactive elements
    const keyboardReport = await testSuite.keyboardTester.testKeyboardNavigation('light');
    
    // Assert all buttons are keyboard accessible
    const buttonViolations = keyboardReport.violations.filter(v => 
      v.issue.toLowerCase().includes('button')
    );
    expect(buttonViolations.filter(v => v.severity === 'error')).toHaveLength(0);
    
    // Assert all links are keyboard accessible
    const linkViolations = keyboardReport.violations.filter(v => 
      v.issue.toLowerCase().includes('link')
    );
    expect(linkViolations.filter(v => v.severity === 'error')).toHaveLength(0);
  });

  test('should compare accessibility between light and dark modes', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    
    // Test light mode
    const lightReport = await runComprehensiveAccessibilityTest(testSuite, 'light');
    
    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    // Test dark mode
    const darkReport = await runComprehensiveAccessibilityTest(testSuite, 'dark');
    
    // Log comparison
    console.log('=== ACCESSIBILITY COMPARISON ===');
    console.log(`Light Mode Score: ${lightReport.overallScore}/100`);
    console.log(`Dark Mode Score: ${darkReport.overallScore}/100`);
    console.log(`Light Mode Violations: ${lightReport.wcagReport.violations.length + lightReport.ariaReport.violations.length + lightReport.keyboardReport.violations.length}`);
    console.log(`Dark Mode Violations: ${darkReport.wcagReport.violations.length + darkReport.ariaReport.violations.length + darkReport.keyboardReport.violations.length}`);
    
    // Both modes should meet minimum accessibility standards
    expect(lightReport.overallScore).toBeGreaterThanOrEqual(80);
    expect(darkReport.overallScore).toBeGreaterThanOrEqual(80);
    
    // Dark mode should not have significantly more violations than light mode
    const lightViolationCount = lightReport.wcagReport.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;
    const darkViolationCount = darkReport.wcagReport.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;
    
    expect(darkViolationCount).toBeLessThanOrEqual(lightViolationCount + 2); // Allow small variance
  });

  test('should generate accessibility reports for CI/CD', async ({ page }) => {
    const testSuite = createAccessibilityTestSuite(page);
    
    // Run comprehensive test
    const report = await runComprehensiveAccessibilityTest(testSuite, 'light');
    
    // Generate detailed report for CI/CD
    const detailedReport = generateConsolidatedReport(report);
    
    // Save report to file (in real implementation, you'd save to test-results directory)
    console.log('=== ACCESSIBILITY REPORT FOR CI/CD ===');
    console.log(detailedReport);
    
    // Create summary for CI/CD
    const summary = {
      pageUrl: report.pageUrl,
      overallScore: report.overallScore,
      wcagScore: report.wcagReport.score,
      ariaScore: report.ariaReport.score,
      keyboardScore: report.keyboardReport.score,
      totalViolations: report.wcagReport.violations.length + report.ariaReport.violations.length + report.keyboardReport.violations.length,
      criticalIssues: report.wcagReport.violations.filter(v => v.impact === 'critical').length + 
                     report.ariaReport.violations.filter(v => v.severity === 'error').length +
                     report.keyboardReport.violations.filter(v => v.severity === 'error').length,
      timestamp: report.timestamp.toISOString()
    };
    
    console.log('=== ACCESSIBILITY SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    
    // Assert CI/CD requirements
    expect(summary.overallScore).toBeGreaterThanOrEqual(80);
    expect(summary.criticalIssues).toBe(0);
  });
});

// Test suite for specific accessibility features
test.describe('Specific Accessibility Features', () => {
  test('should test skip links functionality', async ({ page }) => {
    await page.goto('/');
    
    const testSuite = createAccessibilityTestSuite(page);
    const keyboardReport = await testSuite.keyboardTester.testKeyboardNavigation('light');
    
    // Check for skip link violations
    const skipLinkViolations = keyboardReport.violations.filter(v => 
      v.issue.toLowerCase().includes('skip')
    );
    
    // Log skip link issues
    if (skipLinkViolations.length > 0) {
      console.log('Skip Link Issues:');
      skipLinkViolations.forEach(violation => {
        console.log(`- ${violation.element}: ${violation.issue}`);
      });
    }
    
    // Skip links should be present and functional
    expect(skipLinkViolations.filter(v => v.severity === 'error')).toHaveLength(0);
  });

  test('should test focus management in modals', async ({ page }) => {
    await page.goto('/');
    
    // Look for modal triggers (adjust selectors as needed)
    const modalTriggers = await page.locator('[data-modal], [aria-haspopup="dialog"]').all();
    
    if (modalTriggers.length > 0) {
      const testSuite = createAccessibilityTestSuite(page);
      
      // Click first modal trigger
      await modalTriggers[0].click();
      
      // Wait for modal to appear
      await page.waitForTimeout(500);
      
      // Test keyboard navigation in modal
      const keyboardReport = await testSuite.keyboardTester.testKeyboardNavigation('light');
      
      // Check for focus trap violations
      const focusTrapViolations = keyboardReport.violations.filter(v => 
        v.issue.toLowerCase().includes('modal') || 
        v.issue.toLowerCase().includes('trap') ||
        v.issue.toLowerCase().includes('dialog')
      );
      
      expect(focusTrapViolations.filter(v => v.severity === 'error')).toHaveLength(0);
    }
  });

  test('should test heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const testSuite = createAccessibilityTestSuite(page);
    await testSuite.wcagValidator.initialize();
    
    // Test heading structure
    const headingReport = await testSuite.wcagValidator.auditElements('h1, h2, h3, h4, h5, h6, [role="heading"]', 'light');
    
    // Check for heading violations
    const headingViolations = headingReport.violations.filter(v => 
      v.id.includes('heading') || 
      v.description.toLowerCase().includes('heading')
    );
    
    expect(headingViolations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toHaveLength(0);
  });

  test('should test landmark regions', async ({ page }) => {
    await page.goto('/');
    
    const testSuite = createAccessibilityTestSuite(page);
    await testSuite.wcagValidator.initialize();
    
    // Test landmark structure
    const landmarkReport = await testSuite.wcagValidator.auditElements(
      'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]', 
      'light'
    );
    
    // Check for landmark violations
    const landmarkViolations = landmarkReport.violations.filter(v => 
      v.id.includes('landmark') || 
      v.id.includes('region') ||
      v.description.toLowerCase().includes('landmark')
    );
    
    expect(landmarkViolations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toHaveLength(0);
  });
});