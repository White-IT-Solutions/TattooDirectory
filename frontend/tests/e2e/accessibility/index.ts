// Accessibility Testing Framework
// Export all accessibility testing classes and interfaces

import { WCAGValidator } from './WCAGValidator';
import { ARIAChecker } from './ARIAChecker';
import { KeyboardNavigationTester } from './KeyboardNavigationTester';
import { ContrastAnalyzer } from './ContrastAnalyzer';

export { WCAGValidator } from './WCAGValidator';
export type { 
  AccessibilityViolation, 
  ViolationNode, 
  AccessibilityReport, 
  AccessibilityPass 
} from './WCAGValidator';

export { ARIAChecker } from './ARIAChecker';
export type { 
  ARIAViolation, 
  ARIAReport, 
  ARIAAttribute 
} from './ARIAChecker';

export { KeyboardNavigationTester } from './KeyboardNavigationTester';
export type { 
  KeyboardNavigationViolation, 
  FocusableElement, 
  NavigationReport, 
  KeyboardTestResult 
} from './KeyboardNavigationTester';

export { ContrastAnalyzer } from './ContrastAnalyzer';
export type { 
  ContrastElement, 
  ContrastReport, 
  ColorRGB, 
  ContrastThresholds 
} from './ContrastAnalyzer';

// Consolidated accessibility testing interface
export interface AccessibilityTestSuite {
  wcagValidator: WCAGValidator;
  ariaChecker: ARIAChecker;
  keyboardTester: KeyboardNavigationTester;
  contrastAnalyzer: ContrastAnalyzer;
}

// Consolidated accessibility report
export interface ConsolidatedAccessibilityReport {
  pageUrl: string;
  theme: 'light' | 'dark';
  wcagReport: any; // AccessibilityReport from WCAGValidator
  ariaReport: any; // ARIAReport from ARIAChecker
  keyboardReport: any; // NavigationReport from KeyboardNavigationTester
  contrastReport: ContrastReport;
  overallScore: number;
  timestamp: Date;
}

/**
 * Factory function to create a complete accessibility test suite
 */
export function createAccessibilityTestSuite(page: any): AccessibilityTestSuite {
  return {
    wcagValidator: new WCAGValidator(page),
    ariaChecker: new ARIAChecker(page),
    keyboardTester: new KeyboardNavigationTester(page),
    contrastAnalyzer: new ContrastAnalyzer(page)
  };
}

/**
 * Run comprehensive accessibility testing
 */
export async function runComprehensiveAccessibilityTest(
  testSuite: AccessibilityTestSuite,
  theme: 'light' | 'dark' = 'light'
): Promise<ConsolidatedAccessibilityReport> {
  const { wcagValidator, ariaChecker, keyboardTester, contrastAnalyzer } = testSuite;
  
  // Initialize WCAG validator
  await wcagValidator.initialize();
  
  // Run all accessibility tests
  const [wcagReport, ariaReport, keyboardReport, contrastReport] = await Promise.all([
    wcagValidator.runWCAGAudit(theme),
    ariaChecker.validateARIA(theme),
    keyboardTester.testKeyboardNavigation(theme),
    contrastAnalyzer.analyzeContrast(theme)
  ]);

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (wcagReport.score * 0.25 + ariaReport.score * 0.25 + keyboardReport.score * 0.25 + contrastReport.overallScore * 0.25)
  );

  return {
    pageUrl: wcagReport.pageUrl,
    theme,
    wcagReport,
    ariaReport,
    keyboardReport,
    contrastReport,
    overallScore,
    timestamp: new Date()
  };
}

/**
 * Generate consolidated accessibility report
 */
export function generateConsolidatedReport(report: ConsolidatedAccessibilityReport): string {
  let output = `=== COMPREHENSIVE ACCESSIBILITY REPORT ===\n\n`;
  output += `Page: ${report.pageUrl}\n`;
  output += `Theme: ${report.theme}\n`;
  output += `Overall Score: ${report.overallScore}/100\n`;
  output += `Timestamp: ${report.timestamp.toISOString()}\n\n`;

  // WCAG Summary
  output += `WCAG 2.1 AA Compliance: ${report.wcagReport.score}/100\n`;
  output += `- Violations: ${report.wcagReport.violations.length}\n`;
  output += `- Critical: ${report.wcagReport.violations.filter((v: any) => v.impact === 'critical').length}\n`;
  output += `- Serious: ${report.wcagReport.violations.filter((v: any) => v.impact === 'serious').length}\n\n`;

  // ARIA Summary
  output += `ARIA Compliance: ${report.ariaReport.score}/100\n`;
  output += `- Violations: ${report.ariaReport.violations.length}\n`;
  output += `- Errors: ${report.ariaReport.violations.filter((v: any) => v.severity === 'error').length}\n`;
  output += `- Warnings: ${report.ariaReport.violations.filter((v: any) => v.severity === 'warning').length}\n\n`;

  // Keyboard Navigation Summary
  output += `Keyboard Navigation: ${report.keyboardReport.score}/100\n`;
  output += `- Violations: ${report.keyboardReport.violations.length}\n`;
  output += `- Focusable Elements: ${report.keyboardReport.focusableElements.length}\n`;
  output += `- Tab Order Length: ${report.keyboardReport.tabOrder.length}\n\n`;

  // Contrast Analysis Summary
  output += `Color Contrast: ${report.contrastReport.overallScore}/100\n`;
  output += `- Elements Analyzed: ${report.contrastReport.totalElements}\n`;
  output += `- Failures: ${report.contrastReport.failureCount}\n`;
  output += `- Critical Failures: ${report.contrastReport.criticalFailures.length}\n`;
  output += `- Warnings: ${report.contrastReport.warnings.length}\n\n`;

  // Detailed violations
  if (report.wcagReport.violations.length > 0) {
    output += `=== WCAG VIOLATIONS ===\n`;
    report.wcagReport.violations.forEach((violation: any, index: number) => {
      output += `${index + 1}. ${violation.id} (${violation.impact})\n`;
      output += `   ${violation.description}\n`;
      output += `   Fix: ${violation.help}\n\n`;
    });
  }

  if (report.ariaReport.violations.length > 0) {
    output += `=== ARIA VIOLATIONS ===\n`;
    report.ariaReport.violations.forEach((violation: any, index: number) => {
      output += `${index + 1}. ${violation.element} (${violation.severity})\n`;
      output += `   ${violation.issue}\n`;
      output += `   Fix: ${violation.recommendation}\n\n`;
    });
  }

  if (report.keyboardReport.violations.length > 0) {
    output += `=== KEYBOARD NAVIGATION VIOLATIONS ===\n`;
    report.keyboardReport.violations.forEach((violation: any, index: number) => {
      output += `${index + 1}. ${violation.element} (${violation.severity})\n`;
      output += `   ${violation.issue}\n`;
      output += `   Fix: ${violation.recommendation}\n\n`;
    });
  }

  if (report.contrastReport.criticalFailures.length > 0) {
    output += `=== CONTRAST VIOLATIONS ===\n`;
    report.contrastReport.criticalFailures.forEach((element: any, index: number) => {
      output += `${index + 1}. ${element.element} (${element.elementType})\n`;
      output += `   Contrast Ratio: ${element.contrastRatio}:1\n`;
      output += `   Required: ${element.textSize === 'large' ? '3.0' : '4.5'}:1 (WCAG AA)\n`;
      output += `   Colors: ${element.foregroundColor} on ${element.backgroundColor}\n`;
      output += `   Fix: Increase color contrast or adjust colors\n\n`;
    });
  }

  if (report.wcagReport.violations.length === 0 && 
      report.ariaReport.violations.length === 0 && 
      report.keyboardReport.violations.length === 0 &&
      report.contrastReport.failureCount === 0) {
    output += `🎉 No accessibility violations found! This page meets accessibility standards.\n`;
  }

  return output;
}