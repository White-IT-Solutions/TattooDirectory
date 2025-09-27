/**
 * ReportAggregator - Combines all test results into unified reports
 * 
 * This class aggregates results from visual regression, accessibility, contrast analysis,
 * responsive testing, and theme testing into comprehensive UI audit reports.
 */

import { 
  UIAuditReport, 
  AuditSummary, 
  PageReport, 
  TestResult, 
  Issue, 
  IssuesByCategory,
  Recommendation,
  ReportMetadata,
  VisualReport,
  AccessibilityReport,
  ContrastReport,
  ResponsiveReport,
  ThemeReport,
  ReportConfig
} from './types';

export class ReportAggregator {
  private config: ReportConfig;

  constructor(config: Partial<ReportConfig> = {}) {
    this.config = {
      outputFormat: 'json',
      includeScreenshots: true,
      includeFixSuggestions: true,
      severityThresholds: {
        critical: 0.8,
        major: 0.6
      },
      categories: ['visual', 'accessibility', 'contrast', 'responsive', 'theme'],
      ...config
    };
  }

  /**
   * Generate a consolidated UI audit report from all test results
   */
  async generateConsolidatedReport(testResults: TestResult[]): Promise<UIAuditReport> {
    const timestamp = new Date();
    const reportId = this.generateReportId(timestamp);

    // Group test results by page
    const resultsByPage = this.groupResultsByPage(testResults);
    
    // Generate page reports
    const pageReports = await this.generatePageReports(resultsByPage);
    
    // Extract all issues from page reports
    const allIssues = this.extractAllIssues(pageReports);
    
    // Categorize issues
    const issuesByCategory = this.categorizeIssues(allIssues);
    
    // Generate summary
    const summary = this.generateSummary(pageReports, issuesByCategory);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(issuesByCategory, pageReports);
    
    // Generate metadata
    const metadata = this.generateMetadata(testResults, timestamp);

    return {
      id: reportId,
      timestamp,
      summary,
      pageReports,
      issuesByCategory,
      recommendations,
      metadata
    };
  }

  /**
   * Group test results by page URL for organized processing
   */
  private groupResultsByPage(testResults: TestResult[]): Map<string, TestResult[]> {
    const resultsByPage = new Map<string, TestResult[]>();

    for (const result of testResults) {
      const pageUrl = result.pageUrl;
      if (!resultsByPage.has(pageUrl)) {
        resultsByPage.set(pageUrl, []);
      }
      resultsByPage.get(pageUrl)!.push(result);
    }

    return resultsByPage;
  }

  /**
   * Generate individual page reports from grouped test results
   */
  private async generatePageReports(resultsByPage: Map<string, TestResult[]>): Promise<PageReport[]> {
    const pageReports: PageReport[] = [];

    for (const [pageUrl, results] of resultsByPage) {
      const pageReport = await this.generatePageReport(pageUrl, results);
      pageReports.push(pageReport);
    }

    return pageReports.sort((a, b) => a.pageName.localeCompare(b.pageName));
  }

  /**
   * Generate a single page report from its test results
   */
  private async generatePageReport(pageUrl: string, results: TestResult[]): Promise<PageReport> {
    const pageName = this.extractPageName(pageUrl);
    const issues: Issue[] = [];

    // Process each type of test result
    let visualReport: VisualReport | undefined;
    let accessibilityReport: AccessibilityReport | undefined;
    let contrastReport: ContrastReport | undefined;
    let responsiveReport: ResponsiveReport | undefined;
    let themeReport: ThemeReport | undefined;

    for (const result of results) {
      switch (result.type) {
        case 'visual':
          visualReport = result.data as VisualReport;
          issues.push(...this.extractVisualIssues(result));
          break;
        case 'accessibility':
          accessibilityReport = result.data as AccessibilityReport;
          issues.push(...this.extractAccessibilityIssues(result));
          break;
        case 'contrast':
          contrastReport = result.data as ContrastReport;
          issues.push(...this.extractContrastIssues(result));
          break;
        case 'responsive':
          responsiveReport = result.data as ResponsiveReport;
          issues.push(...this.extractResponsiveIssues(result));
          break;
        case 'theme':
          themeReport = result.data as ThemeReport;
          issues.push(...this.extractThemeIssues(result));
          break;
      }
    }

    // Calculate page score
    const score = this.calculatePageScore(issues, {
      visualReport,
      accessibilityReport,
      contrastReport,
      responsiveReport,
      themeReport
    });

    return {
      pageUrl,
      pageName,
      visualReport,
      accessibilityReport,
      contrastReport,
      responsiveReport,
      themeReport,
      issues,
      score
    };
  }

  /**
   * Extract issues from visual test results
   */
  private extractVisualIssues(result: TestResult): Issue[] {
    const issues: Issue[] = [];
    const visualReport = result.data as VisualReport;

    // Handle null or malformed data gracefully
    if (!visualReport || !visualReport.comparisons) {
      return issues;
    }

    for (const comparison of visualReport.comparisons) {
      if (comparison.hasDifferences) {
        issues.push({
          id: `visual-${comparison.screenshotId}`,
          type: 'visual',
          severity: this.classifyVisualSeverity(comparison.differencePercentage),
          page: result.pageUrl,
          theme: 'both', // Will be refined based on screenshot data
          description: `Visual regression detected with ${comparison.differencePercentage.toFixed(2)}% difference`,
          screenshot: comparison.diffImagePath,
          status: 'open',
          createdAt: result.timestamp,
          updatedAt: result.timestamp
        });
      }
    }

    return issues;
  }

  /**
   * Extract issues from accessibility test results
   */
  private extractAccessibilityIssues(result: TestResult): Issue[] {
    const issues: Issue[] = [];
    const accessibilityReport = result.data as AccessibilityReport;

    // Handle null or malformed data gracefully
    if (!accessibilityReport || !accessibilityReport.violations) {
      return issues;
    }

    for (const violation of accessibilityReport.violations) {
      issues.push({
        id: `accessibility-${violation.id}-${Date.now()}`,
        type: 'accessibility',
        severity: this.mapAccessibilitySeverity(violation.impact),
        page: result.pageUrl,
        theme: accessibilityReport.theme,
        description: violation.description,
        element: violation.nodes[0]?.target.join(' > '),
        fixSuggestion: violation.help,
        status: 'open',
        createdAt: result.timestamp,
        updatedAt: result.timestamp
      });
    }

    return issues;
  }

  /**
   * Extract issues from contrast analysis results
   */
  private extractContrastIssues(result: TestResult): Issue[] {
    const issues: Issue[] = [];
    const contrastReport = result.data as ContrastReport;

    // Handle null or malformed data gracefully
    if (!contrastReport || !contrastReport.elements) {
      return issues;
    }

    for (const element of contrastReport.elements) {
      if (!element.passes) {
        issues.push({
          id: `contrast-${element.selector}-${Date.now()}`,
          type: 'contrast',
          severity: element.contrastRatio < 3.0 ? 'critical' : 'major',
          page: result.pageUrl,
          theme: contrastReport.theme,
          description: `Insufficient color contrast ratio: ${element.contrastRatio.toFixed(2)}:1 (minimum required: ${element.textSize === 'large' ? '3.0' : '4.5'}:1)`,
          element: element.selector,
          status: 'open',
          createdAt: result.timestamp,
          updatedAt: result.timestamp
        });
      }
    }

    return issues;
  }

  /**
   * Extract issues from responsive testing results
   */
  private extractResponsiveIssues(result: TestResult): Issue[] {
    const issues: Issue[] = [];
    const responsiveReport = result.data as ResponsiveReport;

    // Handle null or malformed data gracefully
    if (!responsiveReport) {
      return issues;
    }

    // Touch target issues
    if (responsiveReport.touchTargets) {
      for (const touchTarget of responsiveReport.touchTargets) {
      if (!touchTarget.passes) {
        issues.push({
          id: `responsive-touch-${touchTarget.selector}-${Date.now()}`,
          type: 'responsive',
          severity: 'major',
          page: result.pageUrl,
          theme: 'both',
          description: `Touch target too small: ${touchTarget.size.width}x${touchTarget.size.height}px (minimum: 44x44px)`,
          element: touchTarget.selector,
          status: 'open',
          createdAt: result.timestamp,
          updatedAt: result.timestamp
        });
      }
      }
    }

    // Layout issues
    if (responsiveReport.layoutIssues) {
      for (const layoutIssue of responsiveReport.layoutIssues) {
      issues.push({
        id: `responsive-layout-${layoutIssue.selector}-${Date.now()}`,
        type: 'responsive',
        severity: layoutIssue.severity,
        page: result.pageUrl,
        theme: 'both',
        description: layoutIssue.description,
        element: layoutIssue.selector,
        status: 'open',
          createdAt: result.timestamp,
          updatedAt: result.timestamp
        });
      }
    }

    return issues;
  }

  /**
   * Extract issues from theme testing results
   */
  private extractThemeIssues(result: TestResult): Issue[] {
    const issues: Issue[] = [];
    const themeReport = result.data as ThemeReport;

    // Handle null or malformed data gracefully
    if (!themeReport) {
      return issues;
    }

    // Light mode issues
    if (themeReport.lightModeIssues) {
      for (const issue of themeReport.lightModeIssues) {
      issues.push({
        id: `theme-light-${issue.selector}-${Date.now()}`,
        type: 'theme',
        severity: issue.severity,
        page: result.pageUrl,
        theme: 'light',
        description: `Light mode issue: ${issue.description}`,
        element: issue.selector,
        status: 'open',
        createdAt: result.timestamp,
        updatedAt: result.timestamp
        });
      }
    }

    // Dark mode issues
    if (themeReport.darkModeIssues) {
      for (const issue of themeReport.darkModeIssues) {
      issues.push({
        id: `theme-dark-${issue.selector}-${Date.now()}`,
        type: 'theme',
        severity: issue.severity,
        page: result.pageUrl,
        theme: 'dark',
        description: `Dark mode issue: ${issue.description}`,
        element: issue.selector,
        status: 'open',
        createdAt: result.timestamp,
        updatedAt: result.timestamp
        });
      }
    }

    // Transition issues
    if (themeReport.transitionIssues) {
      for (const transitionIssue of themeReport.transitionIssues) {
        issues.push({
          id: `theme-transition-${transitionIssue.selector}-${Date.now()}`,
          type: 'theme',
          severity: 'minor',
          page: result.pageUrl,
          theme: 'both',
          description: `Theme transition issue: ${transitionIssue.description}`,
          element: transitionIssue.selector,
          status: 'open',
          createdAt: result.timestamp,
          updatedAt: result.timestamp
        });
      }
    }

    return issues;
  }

  /**
   * Extract all issues from page reports
   */
  private extractAllIssues(pageReports: PageReport[]): Issue[] {
    return pageReports.flatMap(report => report.issues);
  }

  /**
   * Categorize issues by severity and type
   */
  private categorizeIssues(issues: Issue[]): IssuesByCategory {
    const critical = issues.filter(issue => issue.severity === 'critical');
    const major = issues.filter(issue => issue.severity === 'major');
    const minor = issues.filter(issue => issue.severity === 'minor');

    const byType = {
      visual: issues.filter(issue => issue.type === 'visual'),
      accessibility: issues.filter(issue => issue.type === 'accessibility'),
      contrast: issues.filter(issue => issue.type === 'contrast'),
      responsive: issues.filter(issue => issue.type === 'responsive'),
      theme: issues.filter(issue => issue.type === 'theme')
    };

    const byPage: { [pageUrl: string]: Issue[] } = {};
    for (const issue of issues) {
      if (!byPage[issue.page]) {
        byPage[issue.page] = [];
      }
      byPage[issue.page].push(issue);
    }

    return {
      critical,
      major,
      minor,
      byType,
      byPage
    };
  }

  /**
   * Generate audit summary from page reports and categorized issues
   */
  private generateSummary(pageReports: PageReport[], issuesByCategory: IssuesByCategory): AuditSummary {
    const totalIssues = issuesByCategory.critical.length + issuesByCategory.major.length + issuesByCategory.minor.length;
    
    // Calculate scores
    const accessibilityScore = this.calculateAverageAccessibilityScore(pageReports);
    const visualRegressionCount = issuesByCategory.byType.visual.length;
    const contrastFailures = issuesByCategory.byType.contrast.length;
    const responsiveIssues = issuesByCategory.byType.responsive.length;
    const themeIssues = issuesByCategory.byType.theme.length;
    
    // Calculate overall score (0-100)
    const overallScore = this.calculateOverallScore(pageReports);

    return {
      totalPages: pageReports.length,
      totalIssues,
      criticalIssues: issuesByCategory.critical.length,
      majorIssues: issuesByCategory.major.length,
      minorIssues: issuesByCategory.minor.length,
      accessibilityScore,
      visualRegressionCount,
      contrastFailures,
      responsiveIssues,
      themeIssues,
      overallScore
    };
  }

  /**
   * Generate recommendations based on issues and patterns
   */
  private generateRecommendations(issuesByCategory: IssuesByCategory, pageReports: PageReport[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High-priority recommendations based on critical issues
    if (issuesByCategory.critical.length > 0) {
      recommendations.push({
        id: 'critical-issues',
        title: 'Address Critical Issues Immediately',
        description: `${issuesByCategory.critical.length} critical issues found that block core functionality`,
        priority: 'high',
        category: 'urgent',
        affectedPages: [...new Set(issuesByCategory.critical.map(issue => issue.page))],
        estimatedImpact: 'High - affects user ability to complete core tasks',
        implementationGuide: 'Focus on accessibility violations and visual regressions that prevent interaction'
      });
    }

    // Accessibility recommendations
    if (issuesByCategory.byType.accessibility.length > 0) {
      recommendations.push({
        id: 'accessibility-compliance',
        title: 'Improve WCAG Compliance',
        description: `${issuesByCategory.byType.accessibility.length} accessibility issues found`,
        priority: 'high',
        category: 'accessibility',
        affectedPages: [...new Set(issuesByCategory.byType.accessibility.map(issue => issue.page))],
        estimatedImpact: 'High - affects users with disabilities',
        implementationGuide: 'Add proper ARIA labels, improve keyboard navigation, fix color contrast'
      });
    }

    // Theme consistency recommendations
    if (issuesByCategory.byType.theme.length > 0) {
      recommendations.push({
        id: 'theme-consistency',
        title: 'Improve Dark Mode Compatibility',
        description: `${issuesByCategory.byType.theme.length} theme-related issues found`,
        priority: 'medium',
        category: 'theme',
        affectedPages: [...new Set(issuesByCategory.byType.theme.map(issue => issue.page))],
        estimatedImpact: 'Medium - affects user experience in dark mode',
        implementationGuide: 'Ensure consistent theming across all components and smooth transitions'
      });
    }

    return recommendations;
  }

  /**
   * Generate report metadata
   */
  private generateMetadata(testResults: TestResult[], timestamp: Date): ReportMetadata {
    const testDuration = testResults.length > 0 ? 
      Math.max(...testResults.map(r => r.timestamp.getTime())) - Math.min(...testResults.map(r => r.timestamp.getTime())) : 0;

    return {
      version: '1.0.0',
      testEnvironment: process.env.NODE_ENV || 'development',
      browserVersions: ['Chromium', 'Firefox', 'WebKit'], // Would be dynamic in real implementation
      testDuration,
      totalScreenshots: testResults.filter(r => r.type === 'visual').length,
      configurationHash: this.generateConfigHash()
    };
  }

  // Helper methods
  private generateReportId(timestamp: Date): string {
    return `audit-${timestamp.getFullYear()}${(timestamp.getMonth() + 1).toString().padStart(2, '0')}${timestamp.getDate().toString().padStart(2, '0')}-${timestamp.getTime()}`;
  }

  private extractPageName(pageUrl: string): string {
    try {
      const url = new URL(pageUrl);
      const pathname = url.pathname;
      if (pathname === '/' || pathname === '') return 'Home';
      return pathname.split('/').filter(Boolean).map(segment => 
        segment.charAt(0).toUpperCase() + segment.slice(1)
      ).join(' > ');
    } catch {
      return pageUrl;
    }
  }

  private classifyVisualSeverity(differencePercentage: number): 'critical' | 'major' | 'minor' {
    if (differencePercentage > 20) return 'critical';
    if (differencePercentage > 5) return 'major';
    return 'minor';
  }

  private mapAccessibilitySeverity(impact: string): 'critical' | 'major' | 'minor' {
    switch (impact) {
      case 'critical': return 'critical';
      case 'serious': return 'major';
      case 'moderate': return 'major';
      case 'minor': return 'minor';
      default: return 'minor';
    }
  }

  private calculatePageScore(issues: Issue[], reports: any): number {
    const criticalWeight = 10;
    const majorWeight = 5;
    const minorWeight = 1;

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const majorCount = issues.filter(i => i.severity === 'major').length;
    const minorCount = issues.filter(i => i.severity === 'minor').length;

    const totalPenalty = (criticalCount * criticalWeight) + (majorCount * majorWeight) + (minorCount * minorWeight);
    const maxScore = 100;

    return Math.max(0, maxScore - totalPenalty);
  }

  private calculateAverageAccessibilityScore(pageReports: PageReport[]): number {
    const accessibilityReports = pageReports
      .map(report => report.accessibilityReport)
      .filter(report => report !== undefined);

    if (accessibilityReports.length === 0) return 0;

    const totalScore = accessibilityReports.reduce((sum, report) => sum + report!.score, 0);
    return Math.round(totalScore / accessibilityReports.length);
  }

  private calculateOverallScore(pageReports: PageReport[]): number {
    if (pageReports.length === 0) return 0;

    const totalScore = pageReports.reduce((sum, report) => sum + report.score, 0);
    return Math.round(totalScore / pageReports.length);
  }

  private generateConfigHash(): string {
    return Buffer.from(JSON.stringify(this.config)).toString('base64').slice(0, 8);
  }
}