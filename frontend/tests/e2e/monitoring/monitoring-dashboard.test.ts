/**
 * Comprehensive tests for the monitoring dashboard and progress tracking system
 */

import { test, expect } from '@playwright/test';
import { MonitoringDashboard } from './index';
import { QualityMetricsDashboard } from './QualityMetricsDashboard';
import { VisualRegressionTracker } from './VisualRegressionTracker';
import { IssueResolutionTracker } from './IssueResolutionTracker';
import { AlertSystem } from './AlertSystem';
import { DashboardRenderer } from './DashboardRenderer';

test.describe('Monitoring Dashboard System', () => {
  let dashboard: MonitoringDashboard;

  test.beforeEach(async () => {
    dashboard = new MonitoringDashboard({
      dataRetentionDays: 30,
      alertThresholds: {
        accessibilityScore: 85,
        visualRegressionRate: 0.05,
        testFailureRate: 0.1,
        criticalIssueCount: 5,
        responseTimeMs: 5000
      },
      metricsCollectionInterval: 1000 // 1 second for testing
    });

    await dashboard.initialize();
  });

  test('should initialize monitoring dashboard successfully', async () => {
    const status = await dashboard.getStatus();
    
    expect(status.isRunning).toBe(true);
    expect(status.systemHealth).toBe('healthy');
    expect(status.activeAlerts).toBe(0);
  });

  test('should collect and process quality metrics', async () => {
    const metrics = await dashboard.collectMetrics();
    
    expect(metrics).toHaveProperty('timestamp');
    expect(metrics).toHaveProperty('accessibilityScore');
    expect(metrics).toHaveProperty('visualRegressionCount');
    expect(metrics).toHaveProperty('testSuccessRate');
    expect(metrics.accessibilityScore).toBeGreaterThanOrEqual(0);
    expect(metrics.accessibilityScore).toBeLessThanOrEqual(100);
  });

  test('should generate comprehensive dashboard HTML', async () => {
    // Collect some metrics first
    await dashboard.collectMetrics();
    await dashboard.collectMetrics();
    
    const dashboardHtml = await dashboard.generateDashboard();
    
    expect(dashboardHtml).toContain('<!DOCTYPE html>');
    expect(dashboardHtml).toContain('UI/UX Audit Dashboard');
    expect(dashboardHtml).toContain('Quality Summary');
    expect(dashboardHtml).toContain('Accessibility Score');
    expect(dashboardHtml).toContain('dashboard-content');
  });

  test('should generate progress report', async () => {
    const report = await dashboard.generateProgressReport(7);
    
    expect(report).toHaveProperty('id');
    expect(report).toHaveProperty('title');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('achievements');
    expect(report).toHaveProperty('challenges');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('nextSteps');
    
    expect(report.title).toContain('Progress Report');
    expect(report.period).toBe('7 days');
  });

  test('should export monitoring data', async () => {
    await dashboard.collectMetrics();
    
    const jsonData = await dashboard.exportData('json');
    const parsedData = JSON.parse(jsonData);
    
    expect(parsedData).toHaveProperty('exportedAt');
    expect(parsedData).toHaveProperty('summary');
    expect(parsedData).toHaveProperty('trends');
    expect(parsedData).toHaveProperty('alerts');
    expect(parsedData).toHaveProperty('teamPerformance');
  });
});

test.describe('Quality Metrics Dashboard', () => {
  let qualityDashboard: QualityMetricsDashboard;

  test.beforeEach(async () => {
    qualityDashboard = new QualityMetricsDashboard(30);
  });

  test('should add and retrieve quality metrics', async () => {
    const metrics = {
      timestamp: new Date(),
      accessibilityScore: 85.5,
      visualRegressionCount: 3,
      contrastFailures: 2,
      testExecutionTime: 120,
      testSuccessRate: 0.95,
      issuesResolved: 5,
      issuesCreated: 8,
      criticalIssues: 1,
      majorIssues: 3,
      minorIssues: 4
    };

    await qualityDashboard.addMetrics(metrics);
    const summary = await qualityDashboard.getSummary();
    
    expect(summary.currentAccessibilityScore).toBeCloseTo(85.5, 1);
    expect(summary.totalIssues).toBe(8); // 1 + 3 + 4
  });

  test('should calculate trends correctly', async () => {
    // Add multiple metrics over time
    const baseDate = new Date();
    
    for (let i = 0; i < 5; i++) {
      await qualityDashboard.addMetrics({
        timestamp: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        accessibilityScore: 80 + i * 2, // Improving trend
        visualRegressionCount: 5 - i, // Decreasing trend
        contrastFailures: 3,
        testExecutionTime: 100,
        testSuccessRate: 0.9,
        issuesResolved: 2,
        issuesCreated: 3,
        criticalIssues: 1,
        majorIssues: 2,
        minorIssues: 3
      });
    }

    const trends = await qualityDashboard.getTrends(['daily']);
    expect(trends).toHaveLength(1);
    expect(trends[0].period).toBe('daily');
    expect(trends[0].data.length).toBeGreaterThan(0);
  });

  test('should generate accessibility trend data', async () => {
    const baseDate = new Date();
    
    // Add some historical data
    for (let i = 0; i < 3; i++) {
      await qualityDashboard.addMetrics({
        timestamp: new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000),
        accessibilityScore: 85 + i,
        visualRegressionCount: 2,
        contrastFailures: 1,
        testExecutionTime: 100,
        testSuccessRate: 0.95,
        issuesResolved: 3,
        issuesCreated: 2,
        criticalIssues: 0,
        majorIssues: 1,
        minorIssues: 2
      });
    }

    const trend = await qualityDashboard.getAccessibilityTrend(7);
    expect(trend).toHaveLength(3);
    expect(trend[0]).toHaveProperty('date');
    expect(trend[0]).toHaveProperty('score');
  });

  test('should generate quality metrics report', async () => {
    await qualityDashboard.addMetrics({
      timestamp: new Date(),
      accessibilityScore: 88,
      visualRegressionCount: 2,
      contrastFailures: 1,
      testExecutionTime: 150,
      testSuccessRate: 0.92,
      issuesResolved: 4,
      issuesCreated: 6,
      criticalIssues: 0,
      majorIssues: 2,
      minorIssues: 4
    });

    const report = await qualityDashboard.generateReport();
    
    expect(report).toContain('Quality Metrics Report');
    expect(report).toContain('Summary');
    expect(report).toContain('Accessibility Score');
    expect(report).toContain('88.0');
  });
});

test.describe('Visual Regression Tracker', () => {
  let regressionTracker: VisualRegressionTracker;

  test.beforeEach(async () => {
    regressionTracker = new VisualRegressionTracker();
  });

  test('should record and track visual regressions', async () => {
    const regressionId = await regressionTracker.recordRegression({
      timestamp: new Date(),
      page: '/home',
      theme: 'dark',
      viewport: '1920x1080',
      severity: 'major',
      differencePercentage: 15.5,
      affectedRegions: 3,
      screenshotPath: '/screenshots/current.png',
      baselinePath: '/screenshots/baseline.png',
      diffPath: '/screenshots/diff.png'
    });

    expect(regressionId).toBeDefined();
    expect(typeof regressionId).toBe('string');
  });

  test('should calculate regression frequency', async () => {
    // Record multiple regressions
    for (let i = 0; i < 5; i++) {
      await regressionTracker.recordRegression({
        timestamp: new Date(),
        page: `/page-${i}`,
        theme: i % 2 === 0 ? 'light' : 'dark',
        viewport: '1920x1080',
        severity: 'minor',
        differencePercentage: 5 + i,
        affectedRegions: 1,
        screenshotPath: `/screenshots/current-${i}.png`,
        baselinePath: `/screenshots/baseline-${i}.png`,
        diffPath: `/screenshots/diff-${i}.png`
      });
    }

    const frequency = await regressionTracker.getRegressionFrequency(24);
    
    expect(frequency.total).toBe(5);
    expect(frequency.byTheme).toHaveProperty('light');
    expect(frequency.byTheme).toHaveProperty('dark');
    expect(frequency.bySeverity).toHaveProperty('minor');
  });

  test('should detect regression patterns', async () => {
    // Record regressions with patterns
    for (let i = 0; i < 4; i++) {
      await regressionTracker.recordRegression({
        timestamp: new Date(),
        page: '/home', // Same page multiple times
        theme: 'dark',
        viewport: '1920x1080',
        severity: 'minor',
        differencePercentage: 8,
        affectedRegions: 2,
        screenshotPath: `/screenshots/current-${i}.png`,
        baselinePath: '/screenshots/baseline.png',
        diffPath: `/screenshots/diff-${i}.png`
      });
    }

    const patterns = await regressionTracker.detectPatterns();
    expect(patterns.length).toBeGreaterThan(0);
    
    const homePagePattern = patterns.find(p => p.pages.includes('/home'));
    expect(homePagePattern).toBeDefined();
    expect(homePagePattern?.frequency).toBeGreaterThanOrEqual(4);
  });

  test('should resolve regressions', async () => {
    const regressionId = await regressionTracker.recordRegression({
      timestamp: new Date(),
      page: '/test',
      theme: 'light',
      viewport: '1920x1080',
      severity: 'major',
      differencePercentage: 20,
      affectedRegions: 5,
      screenshotPath: '/screenshots/current.png',
      baselinePath: '/screenshots/baseline.png',
      diffPath: '/screenshots/diff.png'
    });

    await regressionTracker.resolveRegression(regressionId);
    
    const statistics = await regressionTracker.getStatistics(1);
    expect(statistics.resolvedRegressions).toBe(1);
  });

  test('should generate regression report', async () => {
    await regressionTracker.recordRegression({
      timestamp: new Date(),
      page: '/report-test',
      theme: 'dark',
      viewport: '1920x1080',
      severity: 'critical',
      differencePercentage: 30,
      affectedRegions: 8,
      screenshotPath: '/screenshots/current.png',
      baselinePath: '/screenshots/baseline.png',
      diffPath: '/screenshots/diff.png'
    });

    const report = await regressionTracker.generateReport();
    
    expect(report).toContain('Visual Regression Tracking Report');
    expect(report).toContain('24-Hour Summary');
    expect(report).toContain('30-Day Statistics');
    expect(report).toContain('/report-test');
  });
});

test.describe('Issue Resolution Tracker', () => {
  let issueTracker: IssueResolutionTracker;

  test.beforeEach(async () => {
    issueTracker = new IssueResolutionTracker();
  });

  test('should create and track issues', async () => {
    const issueId = await issueTracker.createIssue({
      title: 'Test Issue',
      description: 'This is a test issue',
      type: 'accessibility',
      severity: 'major',
      status: 'open',
      priority: 'high',
      reporter: 'test-user',
      tags: ['ui', 'accessibility'],
      page: '/test-page'
    });

    expect(issueId).toBeDefined();
    expect(typeof issueId).toBe('string');
  });

  test('should update issue status', async () => {
    const issueId = await issueTracker.createIssue({
      title: 'Status Test Issue',
      description: 'Testing status updates',
      type: 'visual-regression',
      severity: 'minor',
      status: 'open',
      priority: 'medium',
      reporter: 'test-user',
      tags: ['visual']
    });

    await issueTracker.updateIssueStatus(issueId, 'in-progress', 'developer-1');
    await issueTracker.updateIssueStatus(issueId, 'resolved', 'developer-1');

    const metrics = await issueTracker.getResolutionMetrics(1);
    expect(metrics.resolutionRate).toBeGreaterThan(0);
  });

  test('should calculate team performance metrics', async () => {
    // Create multiple issues assigned to different team members
    const issues = [
      { assignee: 'dev-1', status: 'resolved' as const },
      { assignee: 'dev-1', status: 'open' as const },
      { assignee: 'dev-2', status: 'resolved' as const },
      { assignee: 'dev-2', status: 'resolved' as const }
    ];

    for (const issueData of issues) {
      const issueId = await issueTracker.createIssue({
        title: `Issue for ${issueData.assignee}`,
        description: 'Team performance test',
        type: 'accessibility',
        severity: 'minor',
        status: issueData.status,
        priority: 'medium',
        assignee: issueData.assignee,
        reporter: 'test-user',
        tags: ['test']
      });

      if (issueData.status === 'resolved') {
        await issueTracker.updateIssueStatus(issueId, 'resolved', issueData.assignee);
      }
    }

    const teamMetrics = await issueTracker.getTeamPerformanceMetrics(1);
    expect(teamMetrics.length).toBeGreaterThanOrEqual(2);
    
    const dev1Metrics = teamMetrics.find(m => m.teamMember === 'dev-1');
    const dev2Metrics = teamMetrics.find(m => m.teamMember === 'dev-2');
    
    expect(dev1Metrics).toBeDefined();
    expect(dev2Metrics).toBeDefined();
    expect(dev2Metrics?.resolutionRate).toBeGreaterThan(dev1Metrics?.resolutionRate || 0);
  });

  test('should track recent activity', async () => {
    const issueId = await issueTracker.createIssue({
      title: 'Activity Test Issue',
      description: 'Testing activity tracking',
      type: 'contrast',
      severity: 'major',
      status: 'open',
      priority: 'high',
      reporter: 'activity-tester',
      tags: ['activity']
    });

    await issueTracker.updateIssueStatus(issueId, 'resolved', 'resolver');

    const activities = await issueTracker.getRecentActivity(10);
    expect(activities.length).toBeGreaterThanOrEqual(2); // Create + resolve
    
    const createActivity = activities.find(a => a.type === 'issue-created');
    const resolveActivity = activities.find(a => a.type === 'issue-resolved');
    
    expect(createActivity).toBeDefined();
    expect(resolveActivity).toBeDefined();
  });

  test('should generate comprehensive report', async () => {
    const issueId = await issueTracker.createIssue({
      title: 'Report Test Issue',
      description: 'Testing report generation',
      type: 'performance',
      severity: 'critical',
      status: 'open',
      priority: 'high',
      reporter: 'report-tester',
      tags: ['report']
    });

    await issueTracker.updateIssueStatus(issueId, 'resolved', 'report-resolver');

    const report = await issueTracker.generateReport(1);
    
    expect(report).toContain('Issue Resolution Tracking Report');
    expect(report).toContain('Summary');
    expect(report).toContain('Resolution Metrics');
    expect(report).toContain('Team Performance');
    expect(report).toContain('report-resolver');
  });
});

test.describe('Alert System', () => {
  let alertSystem: AlertSystem;

  test.beforeEach(async () => {
    alertSystem = new AlertSystem({
      accessibilityScore: 85,
      visualRegressionRate: 0.05,
      testFailureRate: 0.1,
      criticalIssueCount: 5,
      responseTimeMs: 5000
    });

    alertSystem.addNotificationChannel('test', {
      type: 'console',
      config: {},
      enabled: true
    });
  });

  test('should create and manage alert rules', async () => {
    const ruleId = await alertSystem.createAlertRule({
      name: 'Test Alert Rule',
      description: 'Testing alert rule creation',
      condition: {
        type: 'threshold',
        metric: 'testMetric',
        operator: '>',
        value: 100
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 30,
      notificationChannels: ['test']
    });

    expect(ruleId).toBeDefined();
    expect(typeof ruleId).toBe('string');
  });

  test('should evaluate metrics and trigger alerts', async () => {
    const alerts = await alertSystem.evaluateMetrics({
      accessibilityScore: 75, // Below threshold of 85
      visualRegressionRate: 0.08, // Above threshold of 0.05
      testFailureRate: 0.05, // Below threshold
      criticalIssueCount: 3, // Below threshold
      responseTimeMs: 3000 // Below threshold
    });

    expect(alerts.length).toBeGreaterThan(0);
    
    const accessibilityAlert = alerts.find(a => a.title.includes('Accessibility'));
    const regressionAlert = alerts.find(a => a.title.includes('Regression'));
    
    expect(accessibilityAlert).toBeDefined();
    expect(regressionAlert).toBeDefined();
  });

  test('should manage alert lifecycle', async () => {
    const alert = await alertSystem.createAlert({
      type: 'critical',
      category: 'accessibility',
      title: 'Test Critical Alert',
      description: 'This is a test critical alert',
      metadata: { test: true }
    });

    expect(alert.resolved).toBe(false);

    await alertSystem.acknowledgeAlert(alert.id, 'test-user');
    expect(alert.metadata.acknowledgedBy).toBe('test-user');

    await alertSystem.resolveAlert(alert.id);
    expect(alert.resolved).toBe(true);
    expect(alert.resolvedAt).toBeDefined();
  });

  test('should calculate alert metrics', async () => {
    // Create some test alerts
    await alertSystem.createAlert({
      type: 'critical',
      category: 'accessibility',
      title: 'Critical Test Alert',
      description: 'Critical alert for testing',
      metadata: {}
    });

    await alertSystem.createAlert({
      type: 'warning',
      category: 'visual-regression',
      title: 'Warning Test Alert',
      description: 'Warning alert for testing',
      metadata: {}
    });

    const metrics = await alertSystem.getAlertMetrics(1);
    
    expect(metrics.totalAlerts).toBe(2);
    expect(metrics.activeAlerts).toBe(2);
    expect(metrics.alertsBySeverity).toHaveProperty('critical');
    expect(metrics.alertsBySeverity).toHaveProperty('warning');
    expect(metrics.alertsByType).toHaveProperty('accessibility');
    expect(metrics.alertsByType).toHaveProperty('visual-regression');
  });

  test('should test notification channels', async () => {
    const testResult = await alertSystem.testNotificationChannel('test');
    expect(testResult).toBe(true);

    const invalidTestResult = await alertSystem.testNotificationChannel('nonexistent');
    expect(invalidTestResult).toBe(false);
  });

  test('should generate alert report', async () => {
    await alertSystem.createAlert({
      type: 'critical',
      category: 'test-failure',
      title: 'Report Test Alert',
      description: 'Alert for report testing',
      metadata: {}
    });

    const report = await alertSystem.generateAlertReport(1);
    
    expect(report).toContain('Alert System Report');
    expect(report).toContain('Summary');
    expect(report).toContain('Active Critical Alerts');
    expect(report).toContain('Report Test Alert');
  });
});

test.describe('Dashboard Renderer', () => {
  let dashboardRenderer: DashboardRenderer;

  test.beforeEach(async () => {
    dashboardRenderer = new DashboardRenderer({
      title: 'Test Dashboard',
      subtitle: 'Testing dashboard rendering'
    });
  });

  test('should generate complete HTML dashboard', async () => {
    const mockData = {
      summary: {
        currentAccessibilityScore: 88.5,
        accessibilityTrend: 2.3,
        totalIssues: 12,
        issuesTrend: -5.1,
        visualRegressions: 3,
        regressionTrend: -1.2,
        testSuccessRate: 94.2,
        successRateTrend: 1.8,
        averageResolutionTime: 18.5,
        resolutionTimeTrend: -3.2
      },
      trends: [],
      alerts: [],
      teamPerformance: [],
      recentActivity: [],
      upcomingTasks: []
    };

    const html = await dashboardRenderer.generateDashboard(mockData);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test Dashboard');
    expect(html).toContain('Testing dashboard rendering');
    expect(html).toContain('88.5'); // Accessibility score
    expect(html).toContain('94.2%'); // Success rate
    expect(html).toContain('dashboard-content');
    expect(html).toContain('summary-grid');
  });

  test('should generate summary cards with proper styling', async () => {
    const summary = {
      currentAccessibilityScore: 92.0,
      accessibilityTrend: 3.5,
      totalIssues: 5,
      issuesTrend: -2.1,
      visualRegressions: 1,
      regressionTrend: -0.8,
      testSuccessRate: 96.8,
      successRateTrend: 2.2,
      averageResolutionTime: 12.3,
      resolutionTimeTrend: -1.5
    };

    const summaryHtml = dashboardRenderer.generateSummaryCard(summary);
    
    expect(summaryHtml).toContain('summary-grid');
    expect(summaryHtml).toContain('metric-card');
    expect(summaryHtml).toContain('92.0'); // Accessibility score
    expect(summaryHtml).toContain('96.8%'); // Success rate
    expect(summaryHtml).toContain('trend-positive'); // Positive trends
    expect(summaryHtml).toContain('+3.5%'); // Trend formatting
  });

  test('should handle empty data gracefully', async () => {
    const emptyData = {
      summary: {
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
      },
      trends: [],
      alerts: [],
      teamPerformance: [],
      recentActivity: [],
      upcomingTasks: []
    };

    const html = await dashboardRenderer.generateDashboard(emptyData);
    
    expect(html).toContain('No active alerts');
    expect(html).toContain('No team performance data');
    expect(html).toContain('No recent activity');
    expect(html).toContain('No upcoming tasks');
  });
});

test.describe('Integration Tests', () => {
  test('should integrate all monitoring components', async () => {
    const dashboard = new MonitoringDashboard({
      dataRetentionDays: 7,
      metricsCollectionInterval: 100 // Fast for testing
    });

    await dashboard.initialize();

    // Collect metrics multiple times
    for (let i = 0; i < 3; i++) {
      await dashboard.collectMetrics();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Generate dashboard
    const dashboardHtml = await dashboard.generateDashboard();
    expect(dashboardHtml).toContain('UI/UX Audit Dashboard');

    // Generate progress report
    const report = await dashboard.generateProgressReport(7);
    expect(report.title).toContain('Progress Report');

    // Check system status
    const status = await dashboard.getStatus();
    expect(status.isRunning).toBe(true);

    // Export data
    const exportData = await dashboard.exportData('json');
    const parsedData = JSON.parse(exportData);
    expect(parsedData).toHaveProperty('exportedAt');
  });

  test('should handle error scenarios gracefully', async () => {
    const dashboard = new MonitoringDashboard();
    await dashboard.initialize();

    // Test with invalid data
    try {
      const html = await dashboard.generateDashboard();
      expect(html).toContain('dashboard'); // Should still generate something
    } catch (error) {
      // Should not throw errors
      expect(error).toBeUndefined();
    }
  });
});