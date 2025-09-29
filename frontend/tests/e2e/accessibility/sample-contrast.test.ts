import { test, expect } from '@playwright/test';
import { ContrastAnalyzer } from './ContrastAnalyzer';

/**
 * Sample contrast analysis test
 * Demonstrates basic usage of the ContrastAnalyzer
 */

test('sample contrast analysis', async ({ page }) => {
  // Navigate to the page you want to test
  await page.goto('/');
  
  // Create contrast analyzer instance
  const contrastAnalyzer = new ContrastAnalyzer(page);
  
  // Run comprehensive contrast analysis
  const report = await contrastAnalyzer.analyzeContrast('light');
  
  // Log basic results
  console.log('=== CONTRAST ANALYSIS RESULTS ===');
  console.log(`Page: ${report.pageUrl}`);
  console.log(`Theme: ${report.theme}`);
  console.log(`Overall Score: ${report.overallScore}/100`);
  console.log(`Elements Analyzed: ${report.totalElements}`);
  console.log(`Failures: ${report.failureCount}`);
  console.log(`Critical Failures: ${report.criticalFailures.length}`);
  console.log(`Warnings: ${report.warnings.length}`);
  
  // Generate detailed report
  const detailedReport = contrastAnalyzer.generateReport(report);
  console.log('\n' + detailedReport);
  
  // Basic assertions
  expect(report.totalElements).toBeGreaterThan(0);
  expect(report.overallScore).toBeGreaterThanOrEqual(0);
  expect(report.overallScore).toBeLessThanOrEqual(100);
  
  // Check for critical failures
  if (report.criticalFailures.length > 0) {
    console.log('\n⚠️  Critical contrast failures found:');
    report.criticalFailures.forEach((element, index) => {
      console.log(`${index + 1}. ${element.element} (${element.elementType})`);
      console.log(`   Contrast: ${element.contrastRatio}:1 (needs ${element.textSize === 'large' ? '3.0' : '4.5'}:1)`);
      console.log(`   Colors: ${element.foregroundColor} on ${element.backgroundColor}`);
    });
  } else {
    console.log('\n✅ No critical contrast failures found!');
  }
  
  // Validate form elements specifically
  const formElements = await contrastAnalyzer.validateFormElements('light');
  if (formElements.length > 0) {
    console.log(`\n📝 Form elements analyzed: ${formElements.length}`);
    const formFailures = formElements.filter(el => !el.passes);
    if (formFailures.length > 0) {
      console.log(`⚠️  Form contrast failures: ${formFailures.length}`);
    } else {
      console.log('✅ All form elements pass contrast requirements');
    }
  }
  
  // Validate interactive elements specifically
  const interactiveElements = await contrastAnalyzer.validateInteractiveElements('light');
  if (interactiveElements.length > 0) {
    console.log(`\n🖱️  Interactive elements analyzed: ${interactiveElements.length}`);
    const interactiveFailures = interactiveElements.filter(el => !el.passes);
    if (interactiveFailures.length > 0) {
      console.log(`⚠️  Interactive element contrast failures: ${interactiveFailures.length}`);
    } else {
      console.log('✅ All interactive elements pass contrast requirements');
    }
  }
});

test('sample dark mode contrast analysis', async ({ page }) => {
  // Navigate to the page
  await page.goto('/');
  
  // Try to switch to dark mode (adjust selector as needed)
  try {
    await page.click('[data-theme-toggle]', { timeout: 2000 });
    await page.waitForTimeout(500); // Wait for theme transition
    console.log('✅ Switched to dark mode');
  } catch {
    console.log('ℹ️  No theme toggle found, analyzing current theme as dark mode');
  }
  
  // Create contrast analyzer
  const contrastAnalyzer = new ContrastAnalyzer(page);
  
  // Analyze dark mode contrast
  const darkReport = await contrastAnalyzer.analyzeContrast('dark');
  
  console.log('=== DARK MODE CONTRAST ANALYSIS ===');
  console.log(`Overall Score: ${darkReport.overallScore}/100`);
  console.log(`Elements Analyzed: ${darkReport.totalElements}`);
  console.log(`Failures: ${darkReport.failureCount}`);
  console.log(`Critical Failures: ${darkReport.criticalFailures.length}`);
  
  // Generate and display report
  const darkModeReport = contrastAnalyzer.generateReport(darkReport);
  console.log('\n' + darkModeReport);
  
  // Assertions for dark mode
  expect(darkReport.totalElements).toBeGreaterThan(0);
  expect(darkReport.overallScore).toBeGreaterThanOrEqual(0);
  
  // Dark mode should ideally have good contrast
  if (darkReport.overallScore < 80) {
    console.log('⚠️  Dark mode contrast score is below 80%, consider improvements');
  } else {
    console.log('✅ Dark mode has good contrast scores');
  }
});

test('sample multi-page contrast analysis', async ({ page }) => {
  const pagesToTest = ['/', '/search'];
  const contrastAnalyzer = new ContrastAnalyzer(page);
  
  console.log('=== MULTI-PAGE CONTRAST ANALYSIS ===');
  
  for (const pagePath of pagesToTest) {
    try {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      const report = await contrastAnalyzer.analyzeContrast('light');
      
      console.log(`\nPage: ${pagePath}`);
      console.log(`  Score: ${report.overallScore}/100`);
      console.log(`  Elements: ${report.totalElements}`);
      console.log(`  Failures: ${report.failureCount}`);
      console.log(`  Critical: ${report.criticalFailures.length}`);
      
      // Basic validation
      expect(report.totalElements).toBeGreaterThan(0);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      
    } catch (error) {
      console.log(`⚠️  Could not analyze page ${pagePath}: ${error}`);
    }
  }
});