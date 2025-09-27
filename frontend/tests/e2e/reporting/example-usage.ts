/**
 * Example usage of the UI/UX Audit Reporting System
 * 
 * This file demonstrates how to integrate the reporting system with actual
 * test results from visual regression, accessibility, contrast, responsive,
 * and theme testing frameworks.
 */

import { Page } from '@playwright/test';
import { 
  UIAuditReportingSystem,
  generateUIAuditReport,
  generateSummaryReport
} from './index';
import type { TestResult } from './types';

// Import existing test framework components
import { VisualTestRunner } from '../visual-regression/VisualTestRunner';
import { WCAGValidator } from '../accessibility/WCAGValidator';
import { ContrastAnalyzer } from '../accessibility/ContrastAnalyzer';
import { ViewportManager } from '../responsive/ViewportManager';
import { ThemeToggler } from '../theme-testing/ThemeToggler';

/**
 * Complete UI/UX audit workflow example
 */
export async function runCompleteUIAudit(page: Page, pages: string[] = ['/', '/search', '/auth/login']) {
  console.log('🚀 Starting comprehensive UI/UX audit...');
  
  const testResults: TestResult[] = [];
  const timestamp = new Date();

  // Initialize test components
  const visualRunner = new VisualTestRunner();
  const wcagValidator = new WCAGValidator();
  const contrastAnalyzer = new ContrastAnalyzer();
  const viewportManager = new ViewportManager();
  const themeToggler = new ThemeToggler();

  // Run tests for each page
  for (const pageUrl of pages) {
    console.log(`📄 Testing page: ${pageUrl}`);
    
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');

    // 1. Visual Regression Testing
    console.log('  📸 Running visual regression tests...');
    try {
      const visualReport = await visualRunner.runVisualTests(page, pageUrl, ['light', 'dark']);
      testResults.push({
        type: 'visual',
        pageUrl,
        data: visualReport,
        timestamp,
        success: true
      });
    } catch (error) {
      console.warn(`  ⚠️  Visual tests failed for ${pageUrl}:`, error);
      testResults.push({
        type: 'visual',
        pageUrl,
        data: null,
        timestamp,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }

    // 2. Accessibility Testing (both themes)
    for (const theme of ['light', 'dark'] as const) {
      console.log(`  ♿ Running accessibility tests (${theme} mode)...`);
      
      try {
        await themeToggler.switchTheme(page, theme);
        await page.waitForTimeout(500); // Allow theme transition
        
        const accessibilityReport = await wcagValidator.runWCAGAudit(page);
        testResults.push({
          type: 'accessibility',
          pageUrl,
          data: {
            ...accessibilityReport,
            theme,
            pageUrl
          },
          timestamp,
          success: true
        });
      } catch (error) {
        console.warn(`  ⚠️  Accessibility tests failed for ${pageUrl} (${theme}):`, error);
        testResults.push({
          type: 'accessibility',
          pageUrl,
          data: null,
          timestamp,
          success: false,
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }

      // 3. Contrast Analysis
      console.log(`  🎨 Running contrast analysis (${theme} mode)...`);
      
      try {
        const contrastReport = await contrastAnalyzer.analyzePageContrast(page);
        testResults.push({
          type: 'contrast',
          pageUrl,
          data: {
            ...contrastReport,
            theme,
            pageUrl
          },
          timestamp,
          success: true
        });
      } catch (error) {
        console.warn(`  ⚠️  Contrast analysis failed for ${pageUrl} (${theme}):`, error);
        testResults.push({
          type: 'contrast',
          pageUrl,
          data: null,
          timestamp,
          success: false,
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }
    }

    // 4. Responsive Testing
    console.log('  📱 Running responsive tests...');
    
    try {
      const responsiveReport = await viewportManager.testAllViewports(page, pageUrl);
      testResults.push({
        type: 'responsive',
        pageUrl,
        data: responsiveReport,
        timestamp,
        success: true
      });
    } catch (error) {
      console.warn(`  ⚠️  Responsive tests failed for ${pageUrl}:`, error);
      testResults.push({
        type: 'responsive',
        pageUrl,
        data: null,
        timestamp,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }

    // 5. Theme Testing
    console.log('  🌓 Running theme compatibility tests...');
    
    try {
      const themeReport = await runThemeCompatibilityTest(page, pageUrl, themeToggler);
      testResults.push({
        type: 'theme',
        pageUrl,
        data: themeReport,
        timestamp,
        success: true
      });
    } catch (error) {
      console.warn(`  ⚠️  Theme tests failed for ${pageUrl}:`, error);
      testResults.push({
        type: 'theme',
        pageUrl,
        data: null,
        timestamp,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  // Generate comprehensive report
  console.log('📊 Generating comprehensive audit report...');
  const completeReport = await generateUIAuditReport(testResults);

  // Display summary
  console.log('\n📋 AUDIT SUMMARY');
  console.log('================');
  console.log(`Overall Score: ${completeReport.auditReport.summary.overallScore}/100`);
  console.log(`Total Issues: ${completeReport.auditReport.summary.totalIssues}`);
  console.log(`  🚨 Critical: ${completeReport.auditReport.summary.criticalIssues}`);
  console.log(`  ⚠️  Major: ${completeReport.auditReport.summary.majorIssues}`);
  console.log(`  ℹ️  Minor: ${completeReport.auditReport.summary.minorIssues}`);
  console.log(`Accessibility Score: ${completeReport.auditReport.summary.accessibilityScore}/100`);

  // Display top recommendations
  console.log('\n🎯 TOP RECOMMENDATIONS');
  console.log('======================');
  completeReport.fixSuggestions
    .filter(suggestion => suggestion.priority === 'high')
    .slice(0, 5)
    .forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.title}`);
      console.log(`   ${suggestion.description}`);
      console.log(`   Category: ${suggestion.category} | Effort: ${suggestion.estimatedEffort}`);
      console.log('');
    });

  // Display progress information
  if (completeReport.progressReport.previousReport) {
    console.log('\n📈 PROGRESS TRACKING');
    console.log('====================');
    console.log(`Issues Resolved: ${completeReport.progressReport.metrics.issuesResolved}`);
    console.log(`Issues Introduced: ${completeReport.progressReport.metrics.issuesIntroduced}`);
    console.log(`Net Improvement: ${completeReport.progressReport.metrics.netImprovement}`);
    console.log(`Score Change: ${completeReport.progressReport.metrics.scoreImprovement > 0 ? '+' : ''}${completeReport.progressReport.metrics.scoreImprovement}`);
    console.log(`Quality Trend: ${completeReport.progressReport.trends.qualityTrend}`);
  }

  return completeReport;
}

/**
 * Quick audit for CI/CD pipeline
 */
export async function runQuickAudit(page: Page, criticalPages: string[] = ['/']) {
  console.log('⚡ Running quick audit for CI/CD...');
  
  const testResults: TestResult[] = [];
  const timestamp = new Date();

  // Initialize only essential components
  const wcagValidator = new WCAGValidator();
  const contrastAnalyzer = new ContrastAnalyzer();

  for (const pageUrl of criticalPages) {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');

    // Quick accessibility check
    try {
      const accessibilityReport = await wcagValidator.runWCAGAudit(page);
      testResults.push({
        type: 'accessibility',
        pageUrl,
        data: { ...accessibilityReport, theme: 'light', pageUrl },
        timestamp,
        success: true
      });
    } catch (error) {
      console.warn(`Accessibility check failed for ${pageUrl}`);
    }

    // Quick contrast check
    try {
      const contrastReport = await contrastAnalyzer.analyzePageContrast(page);
      testResults.push({
        type: 'contrast',
        pageUrl,
        data: { ...contrastReport, theme: 'light', pageUrl },
        timestamp,
        success: true
      });
    } catch (error) {
      console.warn(`Contrast check failed for ${pageUrl}`);
    }
  }

  // Generate summary report
  const summaryReport = await generateSummaryReport(testResults);
  
  console.log(`Quick Audit Results: ${summaryReport.summary.totalIssues} issues found`);
  console.log(`Critical Issues: ${summaryReport.summary.criticalIssues}`);
  console.log(`Overall Score: ${summaryReport.summary.overallScore}/100`);

  // Fail CI if critical issues found
  if (summaryReport.summary.criticalIssues > 0) {
    console.error('❌ Critical issues found - failing CI build');
    throw new Error(`${summaryReport.summary.criticalIssues} critical UI/UX issues found`);
  }

  return summaryReport;
}

/**
 * Generate reports for different stakeholders
 */
export async function generateStakeholderReports(completeReport: any) {
  const reportingSystem = new UIAuditReportingSystem();

  // Developer report (JSON with fix suggestions)
  const developerReport = await reportingSystem.exportReport(completeReport.auditReport, 'json');
  console.log('💻 Developer report generated (JSON format)');

  // Manager report (HTML summary)
  const managerReport = await reportingSystem.exportReport(completeReport.auditReport, 'html');
  console.log('👔 Manager report generated (HTML format)');

  // Data analysis report (CSV)
  const dataReport = await reportingSystem.exportReport(completeReport.auditReport, 'csv');
  console.log('📊 Data analysis report generated (CSV format)');

  return {
    developer: developerReport,
    manager: managerReport,
    data: dataReport
  };
}

/**
 * Custom theme compatibility testing
 */
async function runThemeCompatibilityTest(page: Page, pageUrl: string, themeToggler: ThemeToggler) {
  const lightModeIssues: any[] = [];
  const darkModeIssues: any[] = [];
  const transitionIssues: any[] = [];

  // Test light mode
  await themeToggler.switchTheme(page, 'light');
  await page.waitForTimeout(300);
  
  // Check for light mode specific issues
  const lightModeElements = await page.$$eval('[data-theme="light"] *', elements => 
    elements.filter(el => {
      const styles = window.getComputedStyle(el);
      return styles.color === styles.backgroundColor; // Same color issue
    }).map(el => el.tagName + (el.className ? '.' + el.className : ''))
  );

  lightModeElements.forEach(selector => {
    lightModeIssues.push({
      type: 'visibility',
      description: 'Text and background have same color in light mode',
      selector,
      severity: 'major',
      theme: 'light'
    });
  });

  // Test dark mode
  await themeToggler.switchTheme(page, 'dark');
  await page.waitForTimeout(300);

  // Check for dark mode specific issues
  const darkModeElements = await page.$$eval('[data-theme="dark"] *', elements => 
    elements.filter(el => {
      const styles = window.getComputedStyle(el);
      return styles.color === styles.backgroundColor; // Same color issue
    }).map(el => el.tagName + (el.className ? '.' + el.className : ''))
  );

  darkModeElements.forEach(selector => {
    darkModeIssues.push({
      type: 'visibility',
      description: 'Text and background have same color in dark mode',
      selector,
      severity: 'major',
      theme: 'dark'
    });
  });

  // Test theme transitions
  const elementsWithoutTransition = await page.$$eval('*', elements => 
    elements.filter(el => {
      const styles = window.getComputedStyle(el);
      return !styles.transition.includes('color') && !styles.transition.includes('background');
    }).slice(0, 5).map(el => el.tagName + (el.className ? '.' + el.className : ''))
  );

  elementsWithoutTransition.forEach(selector => {
    transitionIssues.push({
      description: 'Element lacks smooth theme transition',
      selector,
      expectedBehavior: 'Smooth color transition',
      actualBehavior: 'Instant color change'
    });
  });

  const totalIssues = lightModeIssues.length + darkModeIssues.length + transitionIssues.length;
  const overallScore = Math.max(0, 100 - (totalIssues * 10));

  return {
    pageUrl,
    lightModeIssues,
    darkModeIssues,
    transitionIssues,
    overallScore
  };
}

/**
 * Integration with existing test suites
 */
export async function integrateWithPlaywrightTest(page: Page, testInfo: any) {
  // Run audit as part of existing Playwright tests
  const quickResults = await runQuickAudit(page, [page.url()]);
  
  // Attach results to test report
  if (testInfo) {
    await testInfo.attach('ui-audit-summary', {
      body: JSON.stringify(quickResults, null, 2),
      contentType: 'application/json'
    });
  }

  // Log issues as test warnings
  if (quickResults.summary.totalIssues > 0) {
    console.warn(`⚠️  ${quickResults.summary.totalIssues} UI/UX issues found on ${page.url()}`);
    quickResults.summary.topIssues.forEach(issue => {
      console.warn(`   - ${issue}`);
    });
  }

  return quickResults;
}

// Export for use in other test files
export {
  UIAuditReportingSystem,
  generateUIAuditReport,
  generateSummaryReport
};