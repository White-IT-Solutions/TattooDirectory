/**
 * Visual Regression Tracker for monitoring visual regression frequency and alerting
 */

import { Alert, QualityMetrics } from './types';

export interface VisualRegressionEvent {
  id: string;
  timestamp: Date;
  page: string;
  theme: 'light' | 'dark';
  viewport: string;
  severity: 'critical' | 'major' | 'minor';
  differencePercentage: number;
  affectedRegions: number;
  screenshotPath: string;
  baselinePath: string;
  diffPath: string;
  resolved: boolean;
  resolvedAt?: Date;
  falsePositive: boolean;
}

export interface RegressionPattern {
  pattern: string;
  frequency: number;
  pages: string[];
  themes: string[];
  viewports: string[];
  averageSeverity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface RegressionAlert {
  id: string;
  type: 'spike' | 'pattern' | 'critical-regression' | 'recurring-issue';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
  affectedPages: string[];
  regressionCount: number;
  threshold: number;
  resolved: boolean;
}

export class VisualRegressionTracker {
  private regressions: VisualRegressionEvent[] = [];
  private alerts: RegressionAlert[] = [];
  private readonly alertThresholds: {
    spikeThreshold: number;
    criticalDifferenceThreshold: number;
    recurringIssueThreshold: number;
    patternFrequencyThreshold: number;
  };

  constructor(alertThresholds = {
    spikeThreshold: 5, // Alert if more than 5 regressions in 1 hour
    criticalDifferenceThreshold: 25, // Alert if difference > 25%
    recurringIssueThreshold: 3, // Alert if same issue occurs 3+ times
    patternFrequencyThreshold: 10 // Alert if pattern occurs 10+ times
  }) {
    this.alertThresholds = alertThresholds;
  }

  /**
   * Record a new visual regression event
   */
  async recordRegression(regression: Omit<VisualRegressionEvent, 'id' | 'resolved' | 'falsePositive'>): Promise<string> {
    const regressionEvent: VisualRegressionEvent = {
      ...regression,
      id: this.generateId(),
      resolved: false,
      falsePositive: false
    };

    this.regressions.push(regressionEvent);
    
    // Check for alerts
    await this.checkForAlerts(regressionEvent);
    
    return regressionEvent.id;
  }

  /**
   * Mark a regression as resolved
   */
  async resolveRegression(regressionId: string, resolvedAt: Date = new Date()): Promise<void> {
    const regression = this.regressions.find(r => r.id === regressionId);
    if (regression) {
      regression.resolved = true;
      regression.resolvedAt = resolvedAt;
    }
  }

  /**
   * Mark a regression as false positive
   */
  async markAsFalsePositive(regressionId: string): Promise<void> {
    const regression = this.regressions.find(r => r.id === regressionId);
    if (regression) {
      regression.falsePositive = true;
      regression.resolved = true;
      regression.resolvedAt = new Date();
    }
  }

  /**
   * Get regression frequency for a time period
   */
  async getRegressionFrequency(hours: number = 24): Promise<{
    total: number;
    byPage: Record<string, number>;
    byTheme: Record<string, number>;
    byViewport: Record<string, number>;
    bySeverity: Record<string, number>;
    hourlyDistribution: { hour: number; count: number }[];
  }> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const recentRegressions = this.regressions.filter(
      r => r.timestamp >= cutoffTime && !r.falsePositive
    );

    const byPage: Record<string, number> = {};
    const byTheme: Record<string, number> = {};
    const byViewport: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const hourlyDistribution: { hour: number; count: number }[] = [];

    // Initialize hourly distribution
    for (let i = 0; i < hours; i++) {
      hourlyDistribution.push({ hour: i, count: 0 });
    }

    recentRegressions.forEach(regression => {
      // Count by page
      byPage[regression.page] = (byPage[regression.page] || 0) + 1;
      
      // Count by theme
      byTheme[regression.theme] = (byTheme[regression.theme] || 0) + 1;
      
      // Count by viewport
      byViewport[regression.viewport] = (byViewport[regression.viewport] || 0) + 1;
      
      // Count by severity
      bySeverity[regression.severity] = (bySeverity[regression.severity] || 0) + 1;
      
      // Count by hour
      const hoursAgo = Math.floor((Date.now() - regression.timestamp.getTime()) / (1000 * 60 * 60));
      if (hoursAgo < hours) {
        hourlyDistribution[hoursAgo].count++;
      }
    });

    return {
      total: recentRegressions.length,
      byPage,
      byTheme,
      byViewport,
      bySeverity,
      hourlyDistribution: hourlyDistribution.reverse() // Most recent first
    };
  }

  /**
   * Detect regression patterns
   */
  async detectPatterns(): Promise<RegressionPattern[]> {
    const patterns: RegressionPattern[] = [];
    
    // Group regressions by similar characteristics
    const pagePatterns = this.groupByPattern('page');
    const themePatterns = this.groupByPattern('theme');
    const viewportPatterns = this.groupByPattern('viewport');
    
    // Analyze each pattern
    for (const [pattern, regressions] of Object.entries(pagePatterns)) {
      if (regressions.length >= 3) { // Minimum occurrences for a pattern
        patterns.push(this.analyzePattern(pattern, regressions, 'page'));
      }
    }

    for (const [pattern, regressions] of Object.entries(themePatterns)) {
      if (regressions.length >= 3) {
        patterns.push(this.analyzePattern(pattern, regressions, 'theme'));
      }
    }

    for (const [pattern, regressions] of Object.entries(viewportPatterns)) {
      if (regressions.length >= 3) {
        patterns.push(this.analyzePattern(pattern, regressions, 'viewport'));
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<RegressionAlert[]> {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Get regression statistics
   */
  async getStatistics(days: number = 30): Promise<{
    totalRegressions: number;
    resolvedRegressions: number;
    falsePositives: number;
    averageResolutionTime: number;
    criticalRegressions: number;
    mostAffectedPages: { page: string; count: number }[];
    regressionTrend: 'increasing' | 'decreasing' | 'stable';
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentRegressions = this.regressions.filter(r => r.timestamp >= cutoffDate);
    const resolvedRegressions = recentRegressions.filter(r => r.resolved && !r.falsePositive);
    const falsePositives = recentRegressions.filter(r => r.falsePositive);
    const criticalRegressions = recentRegressions.filter(r => r.severity === 'critical');

    // Calculate average resolution time
    const resolutionTimes = resolvedRegressions
      .filter(r => r.resolvedAt)
      .map(r => r.resolvedAt!.getTime() - r.timestamp.getTime());
    
    const averageResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    // Count most affected pages
    const pageCount: Record<string, number> = {};
    recentRegressions.forEach(r => {
      pageCount[r.page] = (pageCount[r.page] || 0) + 1;
    });

    const mostAffectedPages = Object.entries(pageCount)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trend
    const firstHalf = recentRegressions.filter(r => {
      const midpoint = new Date(cutoffDate.getTime() + (Date.now() - cutoffDate.getTime()) / 2);
      return r.timestamp < midpoint;
    });
    const secondHalf = recentRegressions.filter(r => {
      const midpoint = new Date(cutoffDate.getTime() + (Date.now() - cutoffDate.getTime()) / 2);
      return r.timestamp >= midpoint;
    });

    let regressionTrend: 'increasing' | 'decreasing' | 'stable';
    const changeRatio = secondHalf.length / Math.max(firstHalf.length, 1);
    
    if (changeRatio > 1.2) {
      regressionTrend = 'increasing';
    } else if (changeRatio < 0.8) {
      regressionTrend = 'decreasing';
    } else {
      regressionTrend = 'stable';
    }

    return {
      totalRegressions: recentRegressions.length,
      resolvedRegressions: resolvedRegressions.length,
      falsePositives: falsePositives.length,
      averageResolutionTime: averageResolutionTime / (1000 * 60 * 60), // Convert to hours
      criticalRegressions: criticalRegressions.length,
      mostAffectedPages,
      regressionTrend
    };
  }

  /**
   * Generate regression report
   */
  async generateReport(): Promise<string> {
    const frequency = await this.getRegressionFrequency(24);
    const patterns = await this.detectPatterns();
    const statistics = await this.getStatistics();
    const activeAlerts = await this.getActiveAlerts();

    return `
# Visual Regression Tracking Report

Generated: ${new Date().toISOString()}

## 24-Hour Summary
- Total Regressions: ${frequency.total}
- Most Affected Page: ${Object.entries(frequency.byPage)[0]?.[0] || 'None'} (${Object.entries(frequency.byPage)[0]?.[1] || 0} regressions)
- Theme Distribution: Light: ${frequency.byTheme.light || 0}, Dark: ${frequency.byTheme.dark || 0}
- Critical Issues: ${frequency.bySeverity.critical || 0}

## 30-Day Statistics
- Total Regressions: ${statistics.totalRegressions}
- Resolution Rate: ${((statistics.resolvedRegressions / statistics.totalRegressions) * 100).toFixed(1)}%
- False Positive Rate: ${((statistics.falsePositives / statistics.totalRegressions) * 100).toFixed(1)}%
- Average Resolution Time: ${statistics.averageResolutionTime.toFixed(1)} hours
- Trend: ${statistics.regressionTrend}

## Active Alerts
${activeAlerts.length === 0 ? 'No active alerts' : activeAlerts.map(alert => `
- ${alert.title} (${alert.severity})
  ${alert.description}
  Affected Pages: ${alert.affectedPages.join(', ')}
`).join('')}

## Detected Patterns
${patterns.length === 0 ? 'No significant patterns detected' : patterns.slice(0, 5).map(pattern => `
- ${pattern.pattern}: ${pattern.frequency} occurrences (${pattern.trend})
  Pages: ${pattern.pages.slice(0, 3).join(', ')}${pattern.pages.length > 3 ? '...' : ''}
`).join('')}

## Most Affected Pages
${statistics.mostAffectedPages.map(page => `
- ${page.page}: ${page.count} regressions
`).join('')}
`;
  }

  private async checkForAlerts(regression: VisualRegressionEvent): Promise<void> {
    // Check for spike alert
    await this.checkSpikeAlert();
    
    // Check for critical regression alert
    if (regression.differencePercentage > this.alertThresholds.criticalDifferenceThreshold) {
      await this.createCriticalRegressionAlert(regression);
    }
    
    // Check for recurring issue alert
    await this.checkRecurringIssueAlert(regression);
    
    // Check for pattern alerts
    await this.checkPatternAlerts();
  }

  private async checkSpikeAlert(): Promise<void> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentRegressions = this.regressions.filter(
      r => r.timestamp >= oneHourAgo && !r.falsePositive
    );

    if (recentRegressions.length >= this.alertThresholds.spikeThreshold) {
      const existingAlert = this.alerts.find(
        a => a.type === 'spike' && !a.resolved && 
        a.timestamp >= oneHourAgo
      );

      if (!existingAlert) {
        this.alerts.push({
          id: this.generateId(),
          type: 'spike',
          title: 'Visual Regression Spike Detected',
          description: `${recentRegressions.length} visual regressions detected in the last hour, exceeding threshold of ${this.alertThresholds.spikeThreshold}`,
          severity: 'high',
          timestamp: new Date(),
          affectedPages: [...new Set(recentRegressions.map(r => r.page))],
          regressionCount: recentRegressions.length,
          threshold: this.alertThresholds.spikeThreshold,
          resolved: false
        });
      }
    }
  }

  private async createCriticalRegressionAlert(regression: VisualRegressionEvent): Promise<void> {
    this.alerts.push({
      id: this.generateId(),
      type: 'critical-regression',
      title: 'Critical Visual Regression Detected',
      description: `Critical visual regression detected on ${regression.page} with ${regression.differencePercentage.toFixed(1)}% difference`,
      severity: 'high',
      timestamp: new Date(),
      affectedPages: [regression.page],
      regressionCount: 1,
      threshold: this.alertThresholds.criticalDifferenceThreshold,
      resolved: false
    });
  }

  private async checkRecurringIssueAlert(regression: VisualRegressionEvent): Promise<void> {
    const similarRegressions = this.regressions.filter(r => 
      r.page === regression.page && 
      r.theme === regression.theme && 
      r.viewport === regression.viewport &&
      !r.falsePositive
    );

    if (similarRegressions.length >= this.alertThresholds.recurringIssueThreshold) {
      const existingAlert = this.alerts.find(
        a => a.type === 'recurring-issue' && 
        a.affectedPages.includes(regression.page) && 
        !a.resolved
      );

      if (!existingAlert) {
        this.alerts.push({
          id: this.generateId(),
          type: 'recurring-issue',
          title: 'Recurring Visual Regression Issue',
          description: `Recurring visual regression on ${regression.page} (${regression.theme} theme, ${regression.viewport} viewport) - ${similarRegressions.length} occurrences`,
          severity: 'medium',
          timestamp: new Date(),
          affectedPages: [regression.page],
          regressionCount: similarRegressions.length,
          threshold: this.alertThresholds.recurringIssueThreshold,
          resolved: false
        });
      }
    }
  }

  private async checkPatternAlerts(): Promise<void> {
    const patterns = await this.detectPatterns();
    
    for (const pattern of patterns) {
      if (pattern.frequency >= this.alertThresholds.patternFrequencyThreshold) {
        const existingAlert = this.alerts.find(
          a => a.type === 'pattern' && 
          a.title.includes(pattern.pattern) && 
          !a.resolved
        );

        if (!existingAlert) {
          this.alerts.push({
            id: this.generateId(),
            type: 'pattern',
            title: `Visual Regression Pattern Detected: ${pattern.pattern}`,
            description: `Pattern "${pattern.pattern}" detected with ${pattern.frequency} occurrences (trend: ${pattern.trend})`,
            severity: pattern.frequency > 20 ? 'high' : 'medium',
            timestamp: new Date(),
            affectedPages: pattern.pages,
            regressionCount: pattern.frequency,
            threshold: this.alertThresholds.patternFrequencyThreshold,
            resolved: false
          });
        }
      }
    }
  }

  private groupByPattern(field: keyof VisualRegressionEvent): Record<string, VisualRegressionEvent[]> {
    const groups: Record<string, VisualRegressionEvent[]> = {};
    
    this.regressions.forEach(regression => {
      if (!regression.falsePositive) {
        const key = String(regression[field]);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(regression);
      }
    });

    return groups;
  }

  private analyzePattern(pattern: string, regressions: VisualRegressionEvent[], type: string): RegressionPattern {
    const pages = [...new Set(regressions.map(r => r.page))];
    const themes = [...new Set(regressions.map(r => r.theme))];
    const viewports = [...new Set(regressions.map(r => r.viewport))];
    
    const severityScores = { critical: 3, major: 2, minor: 1 };
    const averageSeverity = regressions.reduce((sum, r) => sum + severityScores[r.severity], 0) / regressions.length;
    
    // Calculate trend (simplified)
    const recentCount = regressions.filter(r => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return r.timestamp >= weekAgo;
    }).length;
    
    const olderCount = regressions.length - recentCount;
    let trend: 'increasing' | 'decreasing' | 'stable';
    
    if (recentCount > olderCount * 1.5) {
      trend = 'increasing';
    } else if (recentCount < olderCount * 0.5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      pattern,
      frequency: regressions.length,
      pages,
      themes,
      viewports,
      averageSeverity,
      trend
    };
  }

  private generateId(): string {
    return `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}