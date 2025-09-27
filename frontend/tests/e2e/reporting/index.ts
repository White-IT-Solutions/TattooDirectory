/**
 * Report Generation and Issue Classification System
 * 
 * This module provides a comprehensive reporting system for UI/UX audit results,
 * combining visual regression, accessibility, contrast analysis, responsive testing,
 * and theme testing into unified reports with issue classification, fix suggestions,
 * and progress tracking.
 */

// Export all main classes
export { ReportAggregator } from './ReportAggregator';
export { IssueClassifier } from './IssueClassifier';
export { FixSuggestionEngine } from './FixSuggestionEngine';
export { ProgressTracker } from './ProgressTracker';

// Export all types
export * from './types';

// Main reporting orchestrator class
import { ReportAggregator } from './ReportAggregator';
import { IssueClassifier } from './IssueClassifier';
import { FixSuggestionEngine } from './FixSuggestionEngine';
import { ProgressTracker } from './ProgressTracker';
import { 
  TestResult, 
  UIAuditReport, 
  ClassifiedIssues, 
  FixSuggestion, 
  ProgressReport,
  ReportConfig 
} from './types';

/**
 * Main reporting system that orchestrates all reporting components
 */
export class UIAuditReportingSystem {
  private aggregator: ReportAggregator;
  private classifier: IssueClassifier;
  private fixEngine: FixSuggestionEngine;
  private progressTracker: ProgressTracker;

  constructor(config?: Partial<ReportConfig>) {
    this.aggregator = new ReportAggregator(config);
    this.classifier = new IssueClassifier();
    this.fixEngine = new FixSuggestionEngine();
    this.progressTracker = new ProgressTracker();
  }

  /**
   * Generate a complete UI audit report with all analysis and recommendations
   */
  async generateCompleteReport(testResults: TestResult[]): Promise<{
    auditReport: UIAuditReport;
    classifiedIssues: ClassifiedIssues;
    fixSuggestions: FixSuggestion[];
    progressReport: ProgressReport;
  }> {
    // Step 1: Aggregate all test results into a unified report
    console.log('📊 Aggregating test results...');
    const auditReport = await this.aggregator.generateConsolidatedReport(testResults);

    // Step 2: Classify issues by severity and impact
    console.log('🏷️  Classifying issues by severity...');
    const allIssues = [
      ...auditReport.issuesByCategory.critical,
      ...auditReport.issuesByCategory.major,
      ...auditReport.issuesByCategory.minor
    ];
    const classifiedIssues = this.classifier.classifyIssues(allIssues);

    // Step 3: Generate fix suggestions
    console.log('🔧 Generating fix suggestions...');
    const fixSuggestions = this.fixEngine.generateFixSuggestions(allIssues);

    // Step 4: Track progress over time
    console.log('📈 Tracking progress...');
    const progressReport = await this.progressTracker.trackProgress(auditReport);

    console.log('✅ Complete UI audit report generated');
    console.log(`   📋 Total issues: ${auditReport.summary.totalIssues}`);
    console.log(`   🚨 Critical: ${auditReport.summary.criticalIssues}`);
    console.log(`   ⚠️  Major: ${auditReport.summary.majorIssues}`);
    console.log(`   ℹ️  Minor: ${auditReport.summary.minorIssues}`);
    console.log(`   📊 Overall score: ${auditReport.summary.overallScore}/100`);

    return {
      auditReport,
      classifiedIssues,
      fixSuggestions,
      progressReport
    };
  }

  /**
   * Generate a quick summary report for dashboard display
   */
  async generateSummaryReport(testResults: TestResult[]): Promise<{
    summary: {
      totalIssues: number;
      criticalIssues: number;
      overallScore: number;
      topIssues: string[];
    };
    recommendations: string[];
  }> {
    const auditReport = await this.aggregator.generateConsolidatedReport(testResults);
    
    // Get top issues by severity
    const topIssues = [
      ...auditReport.issuesByCategory.critical.slice(0, 3),
      ...auditReport.issuesByCategory.major.slice(0, 2)
    ].map(issue => issue.description);

    // Get top recommendations
    const recommendations = auditReport.recommendations
      .filter(r => r.priority === 'high')
      .slice(0, 3)
      .map(r => r.title);

    return {
      summary: {
        totalIssues: auditReport.summary.totalIssues,
        criticalIssues: auditReport.summary.criticalIssues,
        overallScore: auditReport.summary.overallScore,
        topIssues
      },
      recommendations
    };
  }

  /**
   * Export report data in various formats
   */
  async exportReport(
    auditReport: UIAuditReport, 
    format: 'json' | 'csv' | 'html' = 'json'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(auditReport, null, 2);
      
      case 'csv':
        return this.exportToCSV(auditReport);
      
      case 'html':
        return this.exportToHTML(auditReport);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export report data to CSV format
   */
  private exportToCSV(auditReport: UIAuditReport): string {
    const allIssues = [
      ...auditReport.issuesByCategory.critical,
      ...auditReport.issuesByCategory.major,
      ...auditReport.issuesByCategory.minor
    ];

    const headers = ['ID', 'Type', 'Severity', 'Page', 'Theme', 'Description', 'Element', 'Status'];
    const rows = allIssues.map(issue => [
      issue.id,
      issue.type,
      issue.severity,
      issue.page,
      issue.theme,
      `"${issue.description.replace(/"/g, '""')}"`, // Escape quotes
      issue.element || '',
      issue.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export report data to HTML format
   */
  private exportToHTML(auditReport: UIAuditReport): string {
    const { summary, issuesByCategory } = auditReport;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI/UX Audit Report - ${auditReport.timestamp.toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }
        .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 1rem; margin-bottom: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .metric { background: #f5f5f5; padding: 1rem; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2rem; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 0.9rem; }
        .issues-section { margin-bottom: 2rem; }
        .severity-critical { border-left: 4px solid #dc3545; }
        .severity-major { border-left: 4px solid #fd7e14; }
        .severity-minor { border-left: 4px solid #6c757d; }
        .issue { background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 1rem; margin-bottom: 0.5rem; }
        .issue-header { font-weight: bold; margin-bottom: 0.5rem; }
        .issue-meta { font-size: 0.9rem; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UI/UX Audit Report</h1>
        <p>Generated on ${auditReport.timestamp.toLocaleString()}</p>
        <p>Report ID: ${auditReport.id}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">${summary.overallScore}</div>
            <div class="metric-label">Overall Score</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.totalIssues}</div>
            <div class="metric-label">Total Issues</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.criticalIssues}</div>
            <div class="metric-label">Critical Issues</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.accessibilityScore}</div>
            <div class="metric-label">Accessibility Score</div>
        </div>
    </div>

    ${this.generateIssuesSectionHTML('Critical Issues', issuesByCategory.critical, 'critical')}
    ${this.generateIssuesSectionHTML('Major Issues', issuesByCategory.major, 'major')}
    ${this.generateIssuesSectionHTML('Minor Issues', issuesByCategory.minor, 'minor')}

</body>
</html>`;
  }

  /**
   * Generate HTML for an issues section
   */
  private generateIssuesSectionHTML(title: string, issues: any[], severity: string): string {
    if (issues.length === 0) return '';

    const issuesHTML = issues.map(issue => `
        <div class="issue severity-${severity}">
            <div class="issue-header">${issue.description}</div>
            <div class="issue-meta">
                Type: ${issue.type} | Page: ${issue.page} | Theme: ${issue.theme}
                ${issue.element ? ` | Element: ${issue.element}` : ''}
            </div>
        </div>
    `).join('');

    return `
        <div class="issues-section">
            <h2>${title} (${issues.length})</h2>
            ${issuesHTML}
        </div>
    `;
  }

  /**
   * Get component instances for advanced usage
   */
  getComponents() {
    return {
      aggregator: this.aggregator,
      classifier: this.classifier,
      fixEngine: this.fixEngine,
      progressTracker: this.progressTracker
    };
  }
}

// Convenience function for quick report generation
export async function generateUIAuditReport(testResults: TestResult[], config?: Partial<ReportConfig>) {
  const reportingSystem = new UIAuditReportingSystem(config);
  return await reportingSystem.generateCompleteReport(testResults);
}

// Convenience function for summary reports
export async function generateSummaryReport(testResults: TestResult[]) {
  const reportingSystem = new UIAuditReportingSystem();
  return await reportingSystem.generateSummaryReport(testResults);
}