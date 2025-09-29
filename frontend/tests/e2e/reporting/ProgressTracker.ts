/**
 * ProgressTracker - Tracks issue resolution over time
 * 
 * This class compares current audit reports with historical data to track
 * progress, identify trends, and provide insights into the improvement
 * of UI/UX quality over time.
 */

import { 
  UIAuditReport, 
  ProgressMetrics, 
  ProgressReport, 
  TrendAnalysis, 
  ProgressRecommendation,
  Issue 
} from './types';

export class ProgressTracker {
  private readonly STORAGE_KEY = 'ui-audit-history';
  private readonly MAX_HISTORY_ENTRIES = 50;

  /**
   * Track progress by comparing current report with previous report
   */
  async trackProgress(currentReport: UIAuditReport, previousReport?: UIAuditReport): Promise<ProgressReport> {
    // If no previous report provided, try to load from storage
    if (!previousReport) {
      previousReport = await this.getLastReport();
    }

    const metrics = this.calculateProgressMetrics(currentReport, previousReport);
    const trends = this.analyzeTrends(currentReport, previousReport, await this.getHistoricalReports());
    const recommendations = this.generateProgressRecommendations(metrics, trends);

    // Store current report in history
    await this.storeReport(currentReport);

    return {
      currentReport,
      previousReport,
      metrics,
      trends,
      recommendations
    };
  }

  /**
   * Calculate detailed progress metrics between two reports
   */
  private calculateProgressMetrics(currentReport: UIAuditReport, previousReport?: UIAuditReport): ProgressMetrics {
    if (!previousReport) {
      return this.getBaselineMetrics(currentReport);
    }

    const current = currentReport.summary;
    const previous = previousReport.summary;

    // Calculate issue resolution
    const issuesResolved = this.calculateResolvedIssues(currentReport, previousReport);
    const issuesIntroduced = this.calculateIntroducedIssues(currentReport, previousReport);
    const netImprovement = issuesResolved - issuesIntroduced;

    // Calculate score improvements
    const scoreImprovement = current.overallScore - previous.overallScore;

    // Calculate category improvements
    const categoryImprovements = {
      accessibility: current.accessibilityScore - previous.accessibilityScore,
      visual: this.calculateVisualImprovement(current, previous),
      contrast: this.calculateContrastImprovement(current, previous),
      responsive: this.calculateResponsiveImprovement(current, previous),
      theme: this.calculateThemeImprovement(current, previous)
    };

    // Calculate time to resolution metrics
    const timeToResolution = this.calculateTimeToResolution(currentReport, previousReport);

    return {
      issuesResolved,
      issuesIntroduced,
      netImprovement,
      scoreImprovement,
      categoryImprovements,
      timeToResolution
    };
  }

  /**
   * Calculate baseline metrics for first report
   */
  private getBaselineMetrics(currentReport: UIAuditReport): ProgressMetrics {
    return {
      issuesResolved: 0,
      issuesIntroduced: currentReport.summary.totalIssues,
      netImprovement: -currentReport.summary.totalIssues,
      scoreImprovement: 0,
      categoryImprovements: {
        accessibility: 0,
        visual: 0,
        contrast: 0,
        responsive: 0,
        theme: 0
      },
      timeToResolution: {
        average: 0,
        median: 0,
        byCategory: {}
      }
    };
  }

  /**
   * Calculate number of issues resolved since previous report
   */
  private calculateResolvedIssues(currentReport: UIAuditReport, previousReport: UIAuditReport): number {
    const previousIssueIds = new Set(this.getAllIssueIds(previousReport));
    const currentIssueIds = new Set(this.getAllIssueIds(currentReport));

    let resolvedCount = 0;
    for (const issueId of previousIssueIds) {
      if (!currentIssueIds.has(issueId)) {
        resolvedCount++;
      }
    }

    return resolvedCount;
  }

  /**
   * Calculate number of new issues introduced since previous report
   */
  private calculateIntroducedIssues(currentReport: UIAuditReport, previousReport: UIAuditReport): number {
    const previousIssueIds = new Set(this.getAllIssueIds(previousReport));
    const currentIssueIds = new Set(this.getAllIssueIds(currentReport));

    let introducedCount = 0;
    for (const issueId of currentIssueIds) {
      if (!previousIssueIds.has(issueId)) {
        introducedCount++;
      }
    }

    return introducedCount;
  }

  /**
   * Get all issue IDs from a report
   */
  private getAllIssueIds(report: UIAuditReport): string[] {
    const allIssues = [
      ...report.issuesByCategory.critical,
      ...report.issuesByCategory.major,
      ...report.issuesByCategory.minor
    ];
    return allIssues.map(issue => this.generateIssueFingerprint(issue));
  }

  /**
   * Generate a consistent fingerprint for an issue to track it across reports
   */
  private generateIssueFingerprint(issue: Issue): string {
    // Create a fingerprint based on issue characteristics that should remain stable
    const components = [
      issue.type,
      issue.page,
      issue.element || '',
      issue.description.substring(0, 50) // First 50 chars of description
    ];
    return Buffer.from(components.join('|')).toString('base64');
  }

  /**
   * Calculate visual improvement score
   */
  private calculateVisualImprovement(current: any, previous: any): number {
    const currentVisualScore = Math.max(0, 100 - (current.visualRegressionCount * 5));
    const previousVisualScore = Math.max(0, 100 - (previous.visualRegressionCount * 5));
    return currentVisualScore - previousVisualScore;
  }

  /**
   * Calculate contrast improvement score
   */
  private calculateContrastImprovement(current: any, previous: any): number {
    const currentContrastScore = Math.max(0, 100 - (current.contrastFailures * 10));
    const previousContrastScore = Math.max(0, 100 - (previous.contrastFailures * 10));
    return currentContrastScore - previousContrastScore;
  }

  /**
   * Calculate responsive improvement score
   */
  private calculateResponsiveImprovement(current: any, previous: any): number {
    const currentResponsiveScore = Math.max(0, 100 - (current.responsiveIssues * 8));
    const previousResponsiveScore = Math.max(0, 100 - (previous.responsiveIssues * 8));
    return currentResponsiveScore - previousResponsiveScore;
  }

  /**
   * Calculate theme improvement score
   */
  private calculateThemeImprovement(current: any, previous: any): number {
    const currentThemeScore = Math.max(0, 100 - (current.themeIssues * 6));
    const previousThemeScore = Math.max(0, 100 - (previous.themeIssues * 6));
    return currentThemeScore - previousThemeScore;
  }

  /**
   * Calculate time to resolution metrics
   */
  private calculateTimeToResolution(currentReport: UIAuditReport, previousReport: UIAuditReport): {
    average: number;
    median: number;
    byCategory: { [category: string]: number };
  } {
    // This would typically analyze issue timestamps and resolution times
    // For now, providing estimated values based on issue complexity
    const timeDiff = currentReport.timestamp.getTime() - previousReport.timestamp.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    return {
      average: daysDiff,
      median: daysDiff,
      byCategory: {
        accessibility: daysDiff * 1.2, // Accessibility issues typically take longer
        visual: daysDiff * 0.8,
        contrast: daysDiff * 0.5, // Contrast issues are usually quick fixes
        responsive: daysDiff * 1.0,
        theme: daysDiff * 0.7
      }
    };
  }

  /**
   * Analyze trends across multiple historical reports
   */
  private analyzeTrends(
    currentReport: UIAuditReport, 
    previousReport: UIAuditReport | undefined, 
    historicalReports: UIAuditReport[]
  ): TrendAnalysis {
    const allReports = [...historicalReports, currentReport].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (allReports.length < 2) {
      return {
        issueVelocity: 0,
        qualityTrend: 'stable',
        riskAreas: [],
        successAreas: []
      };
    }

    // Calculate issue velocity (issues resolved per day)
    const issueVelocity = this.calculateIssueVelocity(allReports);

    // Determine quality trend
    const qualityTrend = this.determineQualityTrend(allReports);

    // Identify risk and success areas
    const riskAreas = this.identifyRiskAreas(allReports);
    const successAreas = this.identifySuccessAreas(allReports);

    // Predict completion date if trend continues
    const predictedCompletion = this.predictCompletion(currentReport, issueVelocity);

    return {
      issueVelocity,
      qualityTrend,
      riskAreas,
      successAreas,
      predictedCompletion
    };
  }

  /**
   * Calculate the velocity of issue resolution
   */
  private calculateIssueVelocity(reports: UIAuditReport[]): number {
    if (reports.length < 2) return 0;

    const first = reports[0];
    const last = reports[reports.length - 1];
    
    const timeDiff = last.timestamp.getTime() - first.timestamp.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    const issuesDiff = first.summary.totalIssues - last.summary.totalIssues;
    
    return daysDiff > 0 ? issuesDiff / daysDiff : 0;
  }

  /**
   * Determine overall quality trend
   */
  private determineQualityTrend(reports: UIAuditReport[]): 'improving' | 'stable' | 'declining' {
    if (reports.length < 3) return 'stable';

    const recentScores = reports.slice(-3).map(r => r.summary.overallScore);
    const trend = recentScores[2] - recentScores[0];

    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  }

  /**
   * Identify areas with increasing issues (risk areas)
   */
  private identifyRiskAreas(reports: UIAuditReport[]): string[] {
    if (reports.length < 2) return [];

    const current = reports[reports.length - 1].summary;
    const previous = reports[reports.length - 2].summary;

    const riskAreas: string[] = [];

    if (current.accessibilityScore < previous.accessibilityScore - 5) {
      riskAreas.push('Accessibility compliance declining');
    }
    if (current.visualRegressionCount > previous.visualRegressionCount + 2) {
      riskAreas.push('Visual regressions increasing');
    }
    if (current.contrastFailures > previous.contrastFailures + 1) {
      riskAreas.push('Color contrast issues growing');
    }
    if (current.criticalIssues > previous.criticalIssues) {
      riskAreas.push('Critical issues not being resolved');
    }

    return riskAreas;
  }

  /**
   * Identify areas with improving metrics (success areas)
   */
  private identifySuccessAreas(reports: UIAuditReport[]): string[] {
    if (reports.length < 2) return [];

    const current = reports[reports.length - 1].summary;
    const previous = reports[reports.length - 2].summary;

    const successAreas: string[] = [];

    if (current.accessibilityScore > previous.accessibilityScore + 5) {
      successAreas.push('Accessibility compliance improving');
    }
    if (current.visualRegressionCount < previous.visualRegressionCount - 1) {
      successAreas.push('Visual regressions decreasing');
    }
    if (current.contrastFailures < previous.contrastFailures - 1) {
      successAreas.push('Color contrast improving');
    }
    if (current.criticalIssues < previous.criticalIssues) {
      successAreas.push('Critical issues being resolved');
    }

    return successAreas;
  }

  /**
   * Predict when all issues might be resolved based on current velocity
   */
  private predictCompletion(currentReport: UIAuditReport, velocity: number): Date | undefined {
    if (velocity <= 0) return undefined;

    const remainingIssues = currentReport.summary.totalIssues;
    const daysToCompletion = remainingIssues / velocity;

    const completionDate = new Date(currentReport.timestamp);
    completionDate.setDate(completionDate.getDate() + daysToCompletion);

    return completionDate;
  }

  /**
   * Generate progress-based recommendations
   */
  private generateProgressRecommendations(metrics: ProgressMetrics, trends: TrendAnalysis): ProgressRecommendation[] {
    const recommendations: ProgressRecommendation[] = [];

    // Velocity-based recommendations
    if (trends.issueVelocity < 1) {
      recommendations.push({
        type: 'process',
        title: 'Increase Issue Resolution Velocity',
        description: 'Current issue resolution rate is low. Consider allocating more resources to UI/UX fixes.',
        expectedImpact: 'Faster improvement in overall quality scores'
      });
    }

    // Trend-based recommendations
    if (trends.qualityTrend === 'declining') {
      recommendations.push({
        type: 'process',
        title: 'Address Quality Decline',
        description: 'Quality metrics are declining. Implement stricter review processes and increase testing frequency.',
        expectedImpact: 'Prevent further quality degradation'
      });
    }

    // Risk area recommendations
    for (const riskArea of trends.riskAreas) {
      recommendations.push({
        type: 'technical',
        title: `Address Risk: ${riskArea}`,
        description: `Focus immediate attention on ${riskArea.toLowerCase()} to prevent further degradation.`,
        expectedImpact: 'Prevent escalation of issues in this area'
      });
    }

    // Resource allocation recommendations
    if (metrics.categoryImprovements.accessibility < 0) {
      recommendations.push({
        type: 'resource',
        title: 'Increase Accessibility Focus',
        description: 'Accessibility scores are declining. Consider accessibility training or dedicated accessibility resources.',
        expectedImpact: 'Improved compliance and user experience for users with disabilities'
      });
    }

    return recommendations;
  }

  /**
   * Store report in history (would typically use persistent storage)
   */
  private async storeReport(report: UIAuditReport): Promise<void> {
    try {
      const history = await this.getHistoricalReports();
      history.push(report);

      // Keep only the most recent reports
      const trimmedHistory = history
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_HISTORY_ENTRIES);

      // In a real implementation, this would save to persistent storage
      // For now, we'll use localStorage as a placeholder
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.warn('Failed to store report in history:', error);
    }
  }

  /**
   * Get historical reports from storage
   */
  private async getHistoricalReports(): Promise<UIAuditReport[]> {
    try {
      if (typeof localStorage === 'undefined') return [];

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((report: any) => ({
        ...report,
        timestamp: new Date(report.timestamp)
      }));
    } catch (error) {
      console.warn('Failed to load historical reports:', error);
      return [];
    }
  }

  /**
   * Get the most recent report from history
   */
  private async getLastReport(): Promise<UIAuditReport | undefined> {
    const history = await this.getHistoricalReports();
    return history.length > 0 ? history[0] : undefined;
  }

  /**
   * Clear all historical data (useful for testing)
   */
  async clearHistory(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Get progress summary for dashboard display
   */
  getProgressSummary(progressReport: ProgressReport): {
    overallTrend: string;
    keyMetrics: { [key: string]: number | string };
    topRecommendations: string[];
  } {
    const { metrics, trends } = progressReport;

    return {
      overallTrend: trends.qualityTrend,
      keyMetrics: {
        'Issues Resolved': metrics.issuesResolved,
        'Net Improvement': metrics.netImprovement,
        'Score Change': `${metrics.scoreImprovement > 0 ? '+' : ''}${metrics.scoreImprovement.toFixed(1)}`,
        'Resolution Velocity': `${trends.issueVelocity.toFixed(1)} issues/day`
      },
      topRecommendations: progressReport.recommendations.slice(0, 3).map(r => r.title)
    };
  }
}