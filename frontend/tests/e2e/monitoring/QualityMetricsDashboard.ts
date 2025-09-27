/**
 * Quality Metrics Dashboard for tracking accessibility score trends and quality metrics
 */

import { QualityMetrics, TrendData, QualityMetricsSummary, MetricsQuery } from './types';

export class QualityMetricsDashboard {
  private metrics: QualityMetrics[] = [];
  private readonly dataRetentionDays: number;

  constructor(dataRetentionDays: number = 90) {
    this.dataRetentionDays = dataRetentionDays;
  }

  /**
   * Add new quality metrics data point
   */
  async addMetrics(metrics: QualityMetrics): Promise<void> {
    this.metrics.push(metrics);
    await this.cleanupOldData();
    await this.persistMetrics();
  }

  /**
   * Get quality metrics summary for current period
   */
  async getSummary(): Promise<QualityMetricsSummary> {
    const recent = this.getRecentMetrics(7); // Last 7 days
    const previous = this.getRecentMetrics(14, 7); // Previous 7 days

    if (recent.length === 0) {
      return this.getEmptySummary();
    }

    const currentAccessibilityScore = this.calculateAverage(recent, 'accessibilityScore');
    const previousAccessibilityScore = this.calculateAverage(previous, 'accessibilityScore');
    
    const totalIssues = this.calculateSum(recent, 'criticalIssues', 'majorIssues', 'minorIssues');
    const previousTotalIssues = this.calculateSum(previous, 'criticalIssues', 'majorIssues', 'minorIssues');

    const visualRegressions = this.calculateSum(recent, 'visualRegressionCount');
    const previousVisualRegressions = this.calculateSum(previous, 'visualRegressionCount');

    const testSuccessRate = this.calculateAverage(recent, 'testSuccessRate');
    const previousTestSuccessRate = this.calculateAverage(previous, 'testSuccessRate');

    const averageResolutionTime = this.calculateAverageResolutionTime(recent);
    const previousAverageResolutionTime = this.calculateAverageResolutionTime(previous);

    return {
      currentAccessibilityScore,
      accessibilityTrend: this.calculateTrend(currentAccessibilityScore, previousAccessibilityScore),
      totalIssues,
      issuesTrend: this.calculateTrend(totalIssues, previousTotalIssues, true), // Reverse trend for issues
      visualRegressions,
      regressionTrend: this.calculateTrend(visualRegressions, previousVisualRegressions, true),
      testSuccessRate,
      successRateTrend: this.calculateTrend(testSuccessRate, previousTestSuccessRate),
      averageResolutionTime,
      resolutionTimeTrend: this.calculateTrend(averageResolutionTime, previousAverageResolutionTime, true)
    };
  }

  /**
   * Get trend data for specified periods
   */
  async getTrends(periods: ('daily' | 'weekly' | 'monthly')[]): Promise<TrendData[]> {
    const trends: TrendData[] = [];

    for (const period of periods) {
      const data = await this.aggregateDataByPeriod(period);
      const trend = this.analyzeTrend(data);
      
      trends.push({
        period,
        data,
        trend: trend.direction,
        changePercentage: trend.changePercentage
      });
    }

    return trends;
  }

  /**
   * Query metrics with filters and date range
   */
  async queryMetrics(query: MetricsQuery): Promise<QualityMetrics[]> {
    let filteredMetrics = this.metrics.filter(metric => 
      metric.timestamp >= query.startDate && metric.timestamp <= query.endDate
    );

    // Apply additional filters if provided
    if (query.filters) {
      filteredMetrics = filteredMetrics.filter(metric => {
        return Object.entries(query.filters!).every(([key, value]) => {
          return (metric as any)[key] === value;
        });
      });
    }

    // Aggregate by granularity
    return this.aggregateByGranularity(filteredMetrics, query.granularity);
  }

  /**
   * Get accessibility score trend over time
   */
  async getAccessibilityTrend(days: number = 30): Promise<{ date: Date; score: number }[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.metrics
      .filter(metric => metric.timestamp >= cutoffDate)
      .map(metric => ({
        date: metric.timestamp,
        score: metric.accessibilityScore
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get issue resolution velocity
   */
  async getResolutionVelocity(days: number = 30): Promise<{ date: Date; resolved: number; created: number }[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.metrics
      .filter(metric => metric.timestamp >= cutoffDate)
      .map(metric => ({
        date: metric.timestamp,
        resolved: metric.issuesResolved,
        created: metric.issuesCreated
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate quality metrics report
   */
  async generateReport(): Promise<string> {
    const summary = await this.getSummary();
    const trends = await this.getTrends(['daily', 'weekly', 'monthly']);
    const accessibilityTrend = await this.getAccessibilityTrend();
    const resolutionVelocity = await this.getResolutionVelocity();

    return this.formatReport({
      summary,
      trends,
      accessibilityTrend,
      resolutionVelocity,
      generatedAt: new Date()
    });
  }

  private getRecentMetrics(days: number, offset: number = 0): QualityMetrics[] {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    return this.metrics.filter(metric => 
      metric.timestamp >= startDate && metric.timestamp <= endDate
    );
  }

  private calculateAverage(metrics: QualityMetrics[], field: keyof QualityMetrics): number {
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + (metric[field] as number), 0);
    return sum / metrics.length;
  }

  private calculateSum(metrics: QualityMetrics[], ...fields: (keyof QualityMetrics)[]): number {
    return metrics.reduce((total, metric) => {
      return total + fields.reduce((fieldSum, field) => fieldSum + (metric[field] as number), 0);
    }, 0);
  }

  private calculateAverageResolutionTime(metrics: QualityMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const totalResolutionTime = metrics.reduce((acc, metric) => {
      // Calculate resolution time based on issues resolved and test execution time
      return acc + (metric.issuesResolved > 0 ? metric.testExecutionTime / metric.issuesResolved : 0);
    }, 0);
    
    const totalIssuesResolved = metrics.reduce((acc, metric) => acc + metric.issuesResolved, 0);
    
    return totalIssuesResolved > 0 ? totalResolutionTime / totalIssuesResolved : 0;
  }

  private calculateTrend(current: number, previous: number, reverse: boolean = false): number {
    if (previous === 0) return 0;
    
    const trend = ((current - previous) / previous) * 100;
    return reverse ? -trend : trend;
  }

  private async aggregateDataByPeriod(period: 'daily' | 'weekly' | 'monthly'): Promise<QualityMetrics[]> {
    const groupedData = new Map<string, QualityMetrics[]>();
    
    for (const metric of this.metrics) {
      const key = this.getPeriodKey(metric.timestamp, period);
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(metric);
    }

    const aggregatedData: QualityMetrics[] = [];
    
    for (const [key, metrics] of groupedData) {
      const aggregated = this.aggregateMetrics(metrics, key);
      aggregatedData.push(aggregated);
    }

    return aggregatedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private aggregateMetrics(metrics: QualityMetrics[], periodKey: string): QualityMetrics {
    const count = metrics.length;
    
    return {
      timestamp: new Date(periodKey),
      accessibilityScore: this.calculateAverage(metrics, 'accessibilityScore'),
      visualRegressionCount: this.calculateSum(metrics, 'visualRegressionCount'),
      contrastFailures: this.calculateSum(metrics, 'contrastFailures'),
      testExecutionTime: this.calculateAverage(metrics, 'testExecutionTime'),
      testSuccessRate: this.calculateAverage(metrics, 'testSuccessRate'),
      issuesResolved: this.calculateSum(metrics, 'issuesResolved'),
      issuesCreated: this.calculateSum(metrics, 'issuesCreated'),
      criticalIssues: this.calculateSum(metrics, 'criticalIssues'),
      majorIssues: this.calculateSum(metrics, 'majorIssues'),
      minorIssues: this.calculateSum(metrics, 'minorIssues')
    };
  }

  private analyzeTrend(data: QualityMetrics[]): { direction: 'improving' | 'declining' | 'stable'; changePercentage: number } {
    if (data.length < 2) {
      return { direction: 'stable', changePercentage: 0 };
    }

    const first = data[0];
    const last = data[data.length - 1];
    
    // Calculate overall quality score (weighted combination of metrics)
    const firstScore = this.calculateQualityScore(first);
    const lastScore = this.calculateQualityScore(last);
    
    const changePercentage = ((lastScore - firstScore) / firstScore) * 100;
    
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(changePercentage) < 5) {
      direction = 'stable';
    } else if (changePercentage > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    return { direction, changePercentage: Math.abs(changePercentage) };
  }

  private calculateQualityScore(metrics: QualityMetrics): number {
    // Weighted quality score calculation
    const accessibilityWeight = 0.4;
    const regressionWeight = 0.3;
    const successRateWeight = 0.3;
    
    const accessibilityScore = metrics.accessibilityScore;
    const regressionScore = Math.max(0, 100 - metrics.visualRegressionCount * 10); // Penalty for regressions
    const successScore = metrics.testSuccessRate * 100;
    
    return (accessibilityScore * accessibilityWeight) + 
           (regressionScore * regressionWeight) + 
           (successScore * successRateWeight);
  }

  private aggregateByGranularity(metrics: QualityMetrics[], granularity: 'hour' | 'day' | 'week' | 'month'): QualityMetrics[] {
    // Implementation for aggregating metrics by different time granularities
    const groupedData = new Map<string, QualityMetrics[]>();
    
    for (const metric of metrics) {
      const key = this.getGranularityKey(metric.timestamp, granularity);
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(metric);
    }

    const result: QualityMetrics[] = [];
    for (const [key, groupMetrics] of groupedData) {
      result.push(this.aggregateMetrics(groupMetrics, key));
    }

    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getGranularityKey(date: Date, granularity: 'hour' | 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'hour':
        return date.toISOString().substring(0, 13);
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private getEmptySummary(): QualityMetricsSummary {
    return {
      currentAccessibilityScore: 0,
      accessibilityTrend: 0,
      totalIssues: 0,
      issuesTrend: 0,
      visualRegressions: 0,
      regressionTrend: 0,
      testSuccessRate: 0,
      successRateTrend: 0,
      averageResolutionTime: 0,
      resolutionTimeTrend: 0
    };
  }

  private async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.dataRetentionDays);
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoffDate);
  }

  private async persistMetrics(): Promise<void> {
    // In a real implementation, this would save to a database or file system
    // For now, we'll just keep data in memory
  }

  private formatReport(data: any): string {
    return `
# Quality Metrics Report

Generated: ${data.generatedAt.toISOString()}

## Summary
- Current Accessibility Score: ${data.summary.currentAccessibilityScore.toFixed(1)} (${data.summary.accessibilityTrend > 0 ? '+' : ''}${data.summary.accessibilityTrend.toFixed(1)}%)
- Total Issues: ${data.summary.totalIssues} (${data.summary.issuesTrend > 0 ? '+' : ''}${data.summary.issuesTrend.toFixed(1)}%)
- Visual Regressions: ${data.summary.visualRegressions} (${data.summary.regressionTrend > 0 ? '+' : ''}${data.summary.regressionTrend.toFixed(1)}%)
- Test Success Rate: ${data.summary.testSuccessRate.toFixed(1)}% (${data.summary.successRateTrend > 0 ? '+' : ''}${data.summary.successRateTrend.toFixed(1)}%)

## Trends
${data.trends.map((trend: TrendData) => `
### ${trend.period.charAt(0).toUpperCase() + trend.period.slice(1)} Trend
- Direction: ${trend.trend}
- Change: ${trend.changePercentage.toFixed(1)}%
- Data Points: ${trend.data.length}
`).join('')}

## Accessibility Trend
Recent accessibility scores: ${data.accessibilityTrend.slice(-5).map((point: any) => point.score.toFixed(1)).join(', ')}

## Resolution Velocity
Recent resolution activity: ${data.resolutionVelocity.slice(-5).map((point: any) => `${point.resolved} resolved, ${point.created} created`).join('; ')}
`;
  }
}