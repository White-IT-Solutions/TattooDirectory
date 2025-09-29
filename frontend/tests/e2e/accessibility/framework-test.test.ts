import { test, expect } from '@playwright/test';
import { WCAGValidator, ARIAChecker, KeyboardNavigationTester } from './index';

test.describe('Accessibility Framework Verification', () => {
  test('should create and initialize WCAG validator', async ({ page }) => {
    await page.goto('/');
    
    const validator = new WCAGValidator(page, 'AA');
    await validator.initialize();
    
    // Verify validator is created and initialized
    expect(validator).toBeDefined();
    expect(validator.getWCAGLevel()).toBe('AA');
    
    console.log('✅ WCAGValidator successfully created and initialized');
  });

  test('should create ARIA checker', async ({ page }) => {
    await page.goto('/');
    
    const checker = new ARIAChecker(page);
    
    // Verify checker is created
    expect(checker).toBeDefined();
    
    console.log('✅ ARIAChecker successfully created');
  });

  test('should create keyboard navigation tester', async ({ page }) => {
    await page.goto('/');
    
    const tester = new KeyboardNavigationTester(page);
    
    // Verify tester is created
    expect(tester).toBeDefined();
    
    console.log('✅ KeyboardNavigationTester successfully created');
  });

  test('should run basic WCAG audit', async ({ page }) => {
    await page.goto('/');
    
    const validator = new WCAGValidator(page, 'AA');
    await validator.initialize();
    
    const report = await validator.runWCAGAudit('light');
    
    // Verify report structure
    expect(report).toBeDefined();
    expect(report.pageUrl).toContain('localhost');
    expect(report.theme).toBe('light');
    expect(report.wcagLevel).toBe('AA');
    expect(Array.isArray(report.violations)).toBe(true);
    expect(typeof report.score).toBe('number');
    
    console.log(`✅ WCAG audit completed - Score: ${report.score}/100, Violations: ${report.violations.length}`);
  });

  test('should run basic ARIA validation', async ({ page }) => {
    await page.goto('/');
    
    const checker = new ARIAChecker(page);
    const report = await checker.validateARIA('light');
    
    // Verify report structure
    expect(report).toBeDefined();
    expect(report.pageUrl).toContain('localhost');
    expect(report.theme).toBe('light');
    expect(Array.isArray(report.violations)).toBe(true);
    expect(typeof report.score).toBe('number');
    expect(typeof report.totalElements).toBe('number');
    
    console.log(`✅ ARIA validation completed - Score: ${report.score}/100, Elements: ${report.totalElements}, Violations: ${report.violations.length}`);
  });

  test('should run basic keyboard navigation test', async ({ page }) => {
    await page.goto('/');
    
    const tester = new KeyboardNavigationTester(page);
    const report = await tester.testKeyboardNavigation('light');
    
    // Verify report structure
    expect(report).toBeDefined();
    expect(report.pageUrl).toContain('localhost');
    expect(report.theme).toBe('light');
    expect(Array.isArray(report.violations)).toBe(true);
    expect(Array.isArray(report.focusableElements)).toBe(true);
    expect(Array.isArray(report.tabOrder)).toBe(true);
    expect(typeof report.score).toBe('number');
    
    console.log(`✅ Keyboard navigation test completed - Score: ${report.score}/100, Focusable: ${report.focusableElements.length}, Tab Order: ${report.tabOrder.length}`);
  });
});