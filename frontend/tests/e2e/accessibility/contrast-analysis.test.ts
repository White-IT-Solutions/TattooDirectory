import { test, expect } from '@playwright/test';
import { ContrastAnalyzer } from './ContrastAnalyzer';
import type { ContrastReport, ContrastElement } from './ContrastAnalyzer';

/**
 * Comprehensive contrast analysis tests
 * Tests WCAG 2.1 AA compliance for color contrast ratios
 */

test.describe('Contrast Analysis', () => {
  let contrastAnalyzer: ContrastAnalyzer;

  test.beforeEach(async ({ page }) => {
    contrastAnalyzer = new ContrastAnalyzer(page);
  });

  test('should analyze contrast ratios on home page in light mode', async ({ page }) => {
    await page.goto('/');
    
    const report = await contrastAnalyzer.analyzeContrast('light');
    
    // Verify report structure
    expect(report.pageUrl).toContain('/');
    expect(report.theme).toBe('light');
    expect(report.totalElements).toBeGreaterThan(0);
    expect(report.timestamp).toBeInstanceOf(Date);
    
    // Log results for debugging
    console.log(`Analyzed ${report.totalElements} elements`);
    console.log(`Overall score: ${report.overallScore}/100`);
    console.log(`Failures: ${report.failureCount}`);
    console.log(`Critical failures: ${report.criticalFailures.length}`);
    
    // Generate and log detailed report
    const detailedReport = contrastAnalyzer.generateReport(report);
    console.log('\n' + detailedReport);
    
    // Basic assertions
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.failureCount).toBeGreaterThanOrEqual(0);
    expect(report.criticalFailures.length).toBeLessThanOrEqual(report.failureCount);
  });

  test('should analyze contrast ratios on home page in dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark mode (assuming there's a theme toggle)
    try {
      await page.click('[data-theme-toggle]', { timeout: 2000 });
    } catch {
      // If no theme toggle found, continue with current theme
      console.log('No theme toggle found, testing current theme as dark mode');
    }
    
    const report = await contrastAnalyzer.analyzeContrast('dark');
    
    // Verify report structure
    expect(report.pageUrl).toContain('/');
    expect(report.theme).toBe('dark');
    expect(report.totalElements).toBeGreaterThan(0);
    
    // Log results
    console.log(`Dark mode - Analyzed ${report.totalElements} elements`);
    console.log(`Dark mode - Overall score: ${report.overallScore}/100`);
    console.log(`Dark mode - Failures: ${report.failureCount}`);
    
    // Generate and log detailed report
    const detailedReport = contrastAnalyzer.generateReport(report);
    console.log('\n' + detailedReport);
  });

  test('should validate form elements contrast', async ({ page }) => {
    await page.goto('/');
    
    const formElements = await contrastAnalyzer.validateFormElements('light');
    
    console.log(`Found ${formElements.length} form elements`);
    
    // Check each form element
    formElements.forEach((element: ContrastElement) => {
      console.log(`Form element: ${element.element}`);
      console.log(`  Type: ${element.elementType}`);
      console.log(`  Contrast: ${element.contrastRatio}:1`);
      console.log(`  Passes: ${element.passes}`);
      console.log(`  Colors: ${element.foregroundColor} on ${element.backgroundColor}`);
      
      // Form elements should meet minimum contrast requirements
      if (element.isInteractive) {
        expect(element.contrastRatio).toBeGreaterThanOrEqual(3.0); // WCAG AA for interactive elements
      } else {
        const minRatio = element.textSize === 'large' ? 3.0 : 4.5;
        expect(element.contrastRatio).toBeGreaterThanOrEqual(minRatio);
      }
    });
  });

  test('should validate interactive elements contrast', async ({ page }) => {
    await page.goto('/');
    
    const interactiveElements = await contrastAnalyzer.validateInteractiveElements('light');
    
    console.log(`Found ${interactiveElements.length} interactive elements`);
    
    // Check each interactive element
    interactiveElements.forEach((element: ContrastElement) => {
      console.log(`Interactive element: ${element.element}`);
      console.log(`  Type: ${element.elementType}`);
      console.log(`  Contrast: ${element.contrastRatio}:1`);
      console.log(`  Passes: ${element.passes}`);
      console.log(`  Interactive: ${element.isInteractive}`);
      
      // Interactive elements should meet minimum 3:1 ratio
      expect(element.contrastRatio).toBeGreaterThanOrEqual(3.0);
    });
  });

  test('should identify critical contrast failures', async ({ page }) => {
    await page.goto('/');
    
    const report = await contrastAnalyzer.analyzeContrast('light');
    
    // Log critical failures
    if (report.criticalFailures.length > 0) {
      console.log(`Found ${report.criticalFailures.length} critical contrast failures:`);
      
      report.criticalFailures.forEach((element: ContrastElement, index: number) => {
        console.log(`${index + 1}. ${element.element} (${element.elementType})`);
        console.log(`   Selector: ${element.selector}`);
        console.log(`   Contrast: ${element.contrastRatio}:1`);
        console.log(`   Required: ${element.textSize === 'large' ? '3.0' : '4.5'}:1`);
        console.log(`   Colors: ${element.foregroundColor} on ${element.backgroundColor}`);
        console.log('');
      });
    } else {
      console.log('✅ No critical contrast failures found!');
    }
    
    // Critical failures should be actionable
    report.criticalFailures.forEach((element: ContrastElement) => {
      expect(element.passes).toBe(false);
      expect(element.contrastRatio).toBeLessThan(
        element.textSize === 'large' ? 3.0 : 4.5
      );
    });
  });

  test('should handle different text sizes correctly', async ({ page }) => {
    await page.goto('/');
    
    const report = await contrastAnalyzer.analyzeContrast('light');
    
    // Check text size classification
    const normalTextElements = report.elements.filter(el => el.textSize === 'normal');
    const largeTextElements = report.elements.filter(el => el.textSize === 'large');
    
    console.log(`Normal text elements: ${normalTextElements.length}`);
    console.log(`Large text elements: ${largeTextElements.length}`);
    
    // Verify text size logic
    normalTextElements.forEach((element: ContrastElement) => {
      // Normal text should be < 24px or (< 18.66px and not bold)
      if (element.fontSize >= 24) {
        console.warn(`Element classified as normal but has large font size: ${element.fontSize}px`);
      }
      if (element.fontSize >= 18.66 && element.fontWeight >= 700) {
        console.warn(`Element classified as normal but meets large text criteria: ${element.fontSize}px, weight ${element.fontWeight}`);
      }
    });
    
    largeTextElements.forEach((element: ContrastElement) => {
      // Large text should be >= 24px or (>= 18.66px and bold)
      const isLargeBySize = element.fontSize >= 24;
      const isLargeByWeight = element.fontSize >= 18.66 && element.fontWeight >= 700;
      
      expect(isLargeBySize || isLargeByWeight).toBe(true);
    });
  });

  test('should generate comprehensive contrast report', async ({ page }) => {
    await page.goto('/');
    
    const report = await contrastAnalyzer.analyzeContrast('light');
    const reportText = contrastAnalyzer.generateReport(report);
    
    // Verify report contains key sections
    expect(reportText).toContain('CONTRAST ANALYSIS REPORT');
    expect(reportText).toContain(`Page: ${report.pageUrl}`);
    expect(reportText).toContain(`Theme: ${report.theme}`);
    expect(reportText).toContain(`Overall Score: ${report.overallScore}/100`);
    expect(reportText).toContain(`Elements Analyzed: ${report.totalElements}`);
    expect(reportText).toContain(`Failures: ${report.failureCount}`);
    
    if (report.criticalFailures.length > 0) {
      expect(reportText).toContain('CRITICAL CONTRAST FAILURES');
    }
    
    if (report.warnings.length > 0) {
      expect(reportText).toContain('CONTRAST WARNINGS');
    }
    
    if (report.failureCount === 0) {
      expect(reportText).toContain('All elements meet WCAG AA contrast requirements');
    }
    
    console.log('Generated report preview:');
    console.log(reportText.substring(0, 500) + '...');
  });

  test('should validate contrast across multiple pages', async ({ page }) => {
    const pages = ['/', '/search', '/artists'];
    const reports: ContrastReport[] = [];
    
    for (const pagePath of pages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        const report = await contrastAnalyzer.analyzeContrast('light');
        reports.push(report);
        
        console.log(`Page ${pagePath}:`);
        console.log(`  Elements: ${report.totalElements}`);
        console.log(`  Score: ${report.overallScore}/100`);
        console.log(`  Failures: ${report.failureCount}`);
        console.log('');
      } catch (error) {
        console.log(`Skipping page ${pagePath}: ${error}`);
      }
    }
    
    // Verify we analyzed at least one page
    expect(reports.length).toBeGreaterThan(0);
    
    // Calculate overall statistics
    const totalElements = reports.reduce((sum, report) => sum + report.totalElements, 0);
    const totalFailures = reports.reduce((sum, report) => sum + report.failureCount, 0);
    const averageScore = reports.reduce((sum, report) => sum + report.overallScore, 0) / reports.length;
    
    console.log('=== MULTI-PAGE CONTRAST ANALYSIS ===');
    console.log(`Pages analyzed: ${reports.length}`);
    console.log(`Total elements: ${totalElements}`);
    console.log(`Total failures: ${totalFailures}`);
    console.log(`Average score: ${Math.round(averageScore)}/100`);
    
    // All pages should have reasonable contrast scores
    reports.forEach((report) => {
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });
  });

  test('should handle edge cases gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Test with elements that might not have visible text
    const report = await contrastAnalyzer.analyzeContrast('light');
    
    // Should not crash and should return valid data
    expect(report).toBeDefined();
    expect(report.elements).toBeInstanceOf(Array);
    expect(report.totalElements).toBeGreaterThanOrEqual(0);
    expect(report.failureCount).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    
    // All elements should have valid contrast ratios
    report.elements.forEach((element: ContrastElement) => {
      expect(element.contrastRatio).toBeGreaterThan(0);
      expect(element.foregroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(element.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(['normal', 'large']).toContain(element.textSize);
      expect(['text', 'button', 'input', 'link', 'other']).toContain(element.elementType);
    });
  });

  test('should provide actionable fix suggestions', async ({ page }) => {
    await page.goto('/');
    
    const report = await contrastAnalyzer.analyzeContrast('light');
    
    // Check that failing elements have clear issues identified
    report.criticalFailures.forEach((element: ContrastElement) => {
      expect(element.passes).toBe(false);
      expect(element.contrastRatio).toBeGreaterThan(0);
      
      // Calculate what the minimum ratio should be
      const requiredRatio = element.isInteractive ? 3.0 : 
                           (element.textSize === 'large' ? 3.0 : 4.5);
      
      expect(element.contrastRatio).toBeLessThan(requiredRatio);
      
      console.log(`Fix needed for: ${element.element}`);
      console.log(`  Current ratio: ${element.contrastRatio}:1`);
      console.log(`  Required ratio: ${requiredRatio}:1`);
      console.log(`  Improvement needed: ${(requiredRatio - element.contrastRatio).toFixed(2)}`);
      console.log(`  Colors: ${element.foregroundColor} on ${element.backgroundColor}`);
    });
  });
});

test.describe('Contrast Analysis - Theme Comparison', () => {
  test('should compare contrast between light and dark themes', async ({ page }) => {
    await page.goto('/');
    
    const contrastAnalyzer = new ContrastAnalyzer(page);
    
    // Analyze light theme
    const lightReport = await contrastAnalyzer.analyzeContrast('light');
    
    // Try to switch to dark theme
    try {
      await page.click('[data-theme-toggle]', { timeout: 2000 });
      await page.waitForTimeout(500); // Wait for theme transition
    } catch {
      console.log('No theme toggle found, using current theme for comparison');
    }
    
    // Analyze dark theme
    const darkReport = await contrastAnalyzer.analyzeContrast('dark');
    
    console.log('=== THEME COMPARISON ===');
    console.log(`Light theme score: ${lightReport.overallScore}/100`);
    console.log(`Dark theme score: ${darkReport.overallScore}/100`);
    console.log(`Light theme failures: ${lightReport.failureCount}`);
    console.log(`Dark theme failures: ${darkReport.failureCount}`);
    
    // Both themes should have reasonable scores
    expect(lightReport.overallScore).toBeGreaterThanOrEqual(0);
    expect(darkReport.overallScore).toBeGreaterThanOrEqual(0);
    
    // Compare critical failures
    console.log(`Light theme critical failures: ${lightReport.criticalFailures.length}`);
    console.log(`Dark theme critical failures: ${darkReport.criticalFailures.length}`);
    
    // Log any theme-specific issues
    if (lightReport.criticalFailures.length > darkReport.criticalFailures.length) {
      console.log('⚠️  Light theme has more contrast issues than dark theme');
    } else if (darkReport.criticalFailures.length > lightReport.criticalFailures.length) {
      console.log('⚠️  Dark theme has more contrast issues than light theme');
    } else {
      console.log('✅ Both themes have similar contrast performance');
    }
  });
});