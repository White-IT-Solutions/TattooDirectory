/**
 * Example usage of the Monitoring Dashboard and Progress Tracking system
 */

import { MonitoringDashboard } from './index';
import { QualityMetricsDashboard } from './QualityMetricsDashboard';
import { VisualRegressionTracker } from './VisualRegressionTracker';
import { IssueResolutionTracker } from './IssueResolutionTracker';
import { AlertSystem } from './AlertSystem';
import { DashboardRenderer } from './DashboardRenderer';

/**
 * Example 1: Basic Monitoring Dashboard Setup
 */
async function basicMonitoringSetup() {
  console.log('🚀 Setting up basic monitoring dashboard...');

  const dashboard = new MonitoringDashboard({
    dataRetentionDays: 90,
    alertThresholds: {
      accessibilityScore: 85,
      visualRegressionRate: 0.05,
      testFailureRate: 0.1,
      criticalIssueCount: 5,
      responseTimeMs: 5000
    },
    dashboardRefreshInterval: 300000, // 5 minutes
    notificationChannels: [
      {
        type: 'console',
        config: {},
        enabled: true
      },
      {
        type: 'email',
        config: {
          recipients: ['team@example.com'],
          smtpServer: 'smtp.example.com'
        },
        enabled: false // Disabled for example
      }
    ]
  });

  await dashboard.initialize();
  console.log('✅ Dashboard initialized');

  // Collect some sample metrics
  const metrics = await dashboard.collectMetrics();
  console.log('📊 Collected metrics:', {
    accessibilityScore: metrics.accessibilityScore.toFixed(1),
    visualRegressions: metrics.visualRegressionCount,
    testSuccessRate: (metrics.testSuccessRate * 100).toFixed(1) + '%'
  });

  // Generate dashboard HTML
  const dashboardHtml = await dashboard.generateDashboard();
  console.log('📄 Generated dashboard HTML (length:', dashboardHtml.length, 'chars)');

  return dashboard;
}

/**
 * Example 2: Quality Metrics Tracking
 */
async function qualityMetricsExample() {
  console.log('📈 Demonstrating quality metrics tracking...');

  const qualityDashboard = new QualityMetricsDashboard(30);

  // Simulate a week of metrics data
  const baseDate = new Date();
  for (let day = 0; day < 7; day++) {
    const date = new Date(baseDate.getTime() - day * 24 * 60 * 60 * 1000);
    
    await qualityDashboard.addMetrics({
      timestamp: date,
      accessibilityScore: 85 + Math.random() * 10, // 85-95 range
      visualRegressionCount: Math.floor(Math.random() * 5),
      contrastFailures: Math.floor(Math.random() * 3),
      testExecutionTime: 100 + Math.random() * 50,
      testSuccessRate: 0.9 + Math.random() * 0.1,
      issuesResolved: Math.floor(Math.random() * 8),
      issuesCreated: Math.floor(Math.random() * 10),
      criticalIssues: Math.floor(Math.random() * 2),
      majorIssues: Math.floor(Math.random() * 5),
      minorIssues: Math.floor(Math.random() * 8)
    });
  }

  // Get summary and trends
  const summary = await qualityDashboard.getSummary();
  const trends = await qualityDashboard.getTrends(['daily', 'weekly']);
  const accessibilityTrend = await qualityDashboard.getAccessibilityTrend(7);

  console.log('📊 Quality Summary:', {
    accessibilityScore: summary.currentAccessibilityScore.toFixed(1),
    totalIssues: summary.totalIssues,
    testSuccessRate: summary.testSuccessRate.toFixed(1) + '%',
    accessibilityTrend: summary.accessibilityTrend > 0 ? '📈' : '📉'
  });

  console.log('📈 Trends detected:', trends.length);
  console.log('🎯 Accessibility trend points:', accessibilityTrend.length);

  return qualityDashboard;
}

/**
 * Example 3: Visual Regression Tracking
 */
async function visualRegressionExample() {
  console.log('🔍 Demonstrating visual regression tracking...');

  const regressionTracker = new VisualRegressionTracker({
    spikeThreshold: 3,
    criticalDifferenceThreshold: 20,
    recurringIssueThreshold: 2,
    patternFrequencyThreshold: 5
  });

  // Simulate some visual regressions
  const pages = ['/home', '/search', '/profile', '/settings'];
  const themes = ['light', 'dark'];
  const viewports = ['1920x1080', '1366x768', '375x667'];

  for (let i = 0; i < 10; i++) {
    const page = pages[Math.floor(Math.random() * pages.length)];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];

    await regressionTracker.recordRegression({
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      page,
      theme: theme as 'light' | 'dark',
      viewport,
      severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.4 ? 'major' : 'minor',
      differencePercentage: Math.random() * 30 + 5,
      affectedRegions: Math.floor(Math.random() * 5) + 1,
      screenshotPath: `/screenshots/${page}-${theme}-${viewport}-current.png`,
      baselinePath: `/screenshots/${page}-${theme}-${viewport}-baseline.png`,
      diffPath: `/screenshots/${page}-${theme}-${viewport}-diff.png`
    });
  }

  // Analyze regressions
  const frequency = await regressionTracker.getRegressionFrequency(24);
  const patterns = await regressionTracker.detectPatterns();
  const statistics = await regressionTracker.getStatistics(7);
  const activeAlerts = await regressionTracker.getActiveAlerts();

  console.log('🔍 Regression Analysis:', {
    total24h: frequency.total,
    mostAffectedPage: Object.entries(frequency.byPage)[0]?.[0] || 'None',
    patternsDetected: patterns.length,
    activeAlerts: activeAlerts.length,
    resolutionRate: statistics.resolvedRegressions + '/' + statistics.totalRegressions
  });

  // Resolve some regressions
  if (activeAlerts.length > 0) {
    await regressionTracker.resolveAlert(activeAlerts[0].id);
    console.log('✅ Resolved first active alert');
  }

  return regressionTracker;
}

/**
 * Example 4: Issue Resolution Tracking
 */
async function issueResolutionExample() {
  console.log('🎯 Demonstrating issue resolution tracking...');

  const issueTracker = new IssueResolutionTracker();

  // Create various types of issues
  const issueTypes = ['accessibility', 'visual-regression', 'contrast', 'responsive', 'performance'];
  const severities = ['critical', 'major', 'minor'];
  const priorities = ['high', 'medium', 'low'];
  const teamMembers = ['alice', 'bob', 'charlie', 'diana'];

  const issueIds: string[] = [];

  for (let i = 0; i < 15; i++) {
    const issueId = await issueTracker.createIssue({
      title: `Issue ${i + 1}: ${issueTypes[i % issueTypes.length]} problem`,
      description: `This is a ${severities[i % severities.length]} ${issueTypes[i % issueTypes.length]} issue that needs attention.`,
      type: issueTypes[i % issueTypes.length] as any,
      severity: severities[i % severities.length] as any,
      status: 'open',
      priority: priorities[i % priorities.length] as any,
      assignee: teamMembers[i % teamMembers.length],
      reporter: 'test-reporter',
      tags: ['ui-audit', issueTypes[i % issueTypes.length]],
      page: `/page-${Math.floor(i / 3) + 1}`,
      estimatedHours: Math.floor(Math.random() * 8) + 1
    });

    issueIds.push(issueId);

    // Resolve some issues
    if (Math.random() > 0.4) {
      await issueTracker.updateIssueStatus(issueId, 'in-progress', teamMembers[i % teamMembers.length]);
      
      if (Math.random() > 0.3) {
        await issueTracker.updateIssueStatus(issueId, 'resolved', teamMembers[i % teamMembers.length]);
      }
    }
  }

  // Add some comments
  await issueTracker.addComment(issueIds[0], {
    author: 'alice',
    content: 'Working on this issue, should be resolved by end of day.',
    type: 'comment'
  });

  // Get metrics and reports
  const resolutionMetrics = await issueTracker.getResolutionMetrics(30);
  const teamMetrics = await issueTracker.getTeamPerformanceMetrics(30);
  const recentActivity = await issueTracker.getRecentActivity(5);
  const upcomingTasks = await issueTracker.getUpcomingTasks();

  console.log('🎯 Issue Resolution Metrics:', {
    resolutionRate: resolutionMetrics.resolutionRate.toFixed(1) + '%',
    avgResolutionTime: resolutionMetrics.averageResolutionTime.toFixed(1) + 'h',
    teamMembers: teamMetrics.length,
    recentActivities: recentActivity.length,
    upcomingTasks: upcomingTasks.length
  });

  console.log('👥 Top Performer:', teamMetrics[0]?.teamMember, 
    'with', teamMetrics[0]?.qualityScore.toFixed(1), 'quality score');

  return issueTracker;
}

/**
 * Example 5: Alert System Configuration
 */
async function alertSystemExample() {
  console.log('🚨 Demonstrating alert system...');

  const alertSystem = new AlertSystem({
    accessibilityScore: 85,
    visualRegressionRate: 0.05,
    testFailureRate: 0.1,
    criticalIssueCount: 5,
    responseTimeMs: 5000
  });

  // Add notification channels
  alertSystem.addNotificationChannel('console', {
    type: 'console',
    config: {},
    enabled: true
  });

  alertSystem.addNotificationChannel('email', {
    type: 'email',
    config: {
      recipients: ['alerts@example.com'],
      smtpServer: 'smtp.example.com'
    },
    enabled: false // Disabled for example
  });

  // Create custom alert rules
  await alertSystem.createAlertRule({
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds 5%',
    condition: {
      type: 'threshold',
      metric: 'errorRate',
      operator: '>',
      value: 0.05
    },
    severity: 'critical',
    enabled: true,
    cooldownMinutes: 15,
    notificationChannels: ['console', 'email']
  });

  await alertSystem.createAlertRule({
    name: 'Low Performance Score',
    description: 'Alert when performance score drops below 80',
    condition: {
      type: 'threshold',
      metric: 'performanceScore',
      operator: '<',
      value: 80
    },
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 30,
    notificationChannels: ['console']
  });

  // Simulate metrics that trigger alerts
  const triggeredAlerts = await alertSystem.evaluateMetrics({
    accessibilityScore: 75, // Below threshold
    visualRegressionRate: 0.08, // Above threshold
    testFailureRate: 0.05, // Below threshold
    criticalIssueCount: 7, // Above threshold
    responseTimeMs: 6000, // Above threshold
    errorRate: 0.07, // Above custom threshold
    performanceScore: 75 // Below custom threshold
  });

  console.log('🚨 Triggered Alerts:', triggeredAlerts.length);

  // Test notification channels
  const consoleTest = await alertSystem.testNotificationChannel('console');
  console.log('📧 Console notification test:', consoleTest ? '✅' : '❌');

  // Get alert metrics
  const alertMetrics = await alertSystem.getAlertMetrics(1);
  console.log('📊 Alert Metrics:', {
    totalAlerts: alertMetrics.totalAlerts,
    activeAlerts: alertMetrics.activeAlerts,
    notificationSuccessRate: alertMetrics.notificationSuccessRate.toFixed(1) + '%'
  });

  return alertSystem;
}

/**
 * Example 6: Custom Dashboard Rendering
 */
async function customDashboardExample() {
  console.log('🎨 Demonstrating custom dashboard rendering...');

  const dashboardRenderer = new DashboardRenderer({
    title: 'Custom UI/UX Audit Dashboard',
    subtitle: 'Tailored for Development Team',
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#64748b',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      borderColor: '#e2e8f0',
      successColor: '#10b981',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    },
    refreshInterval: 180000, // 3 minutes
    showTimestamp: true,
    sections: [
      { id: 'summary', title: 'Quality Overview', type: 'summary', enabled: true, order: 1 },
      { id: 'alerts', title: 'Critical Alerts', type: 'alerts', enabled: true, order: 2 },
      { id: 'team', title: 'Team Performance', type: 'table', enabled: true, order: 3 },
      { id: 'trends', title: 'Quality Trends', type: 'chart', enabled: true, order: 4 },
      { id: 'activity', title: 'Recent Activity', type: 'list', enabled: true, order: 5 }
    ]
  });

  // Create sample dashboard data
  const dashboardData = {
    summary: {
      currentAccessibilityScore: 89.2,
      accessibilityTrend: 3.1,
      totalIssues: 18,
      issuesTrend: -12.5,
      visualRegressions: 4,
      regressionTrend: -2.8,
      testSuccessRate: 93.7,
      successRateTrend: 1.9,
      averageResolutionTime: 16.3,
      resolutionTimeTrend: -8.2
    },
    trends: [
      {
        period: 'daily' as const,
        data: [
          {
            timestamp: new Date(),
            accessibilityScore: 89.2,
            visualRegressionCount: 4,
            contrastFailures: 2,
            testExecutionTime: 145,
            testSuccessRate: 0.937,
            issuesResolved: 6,
            issuesCreated: 4,
            criticalIssues: 1,
            majorIssues: 3,
            minorIssues: 14
          }
        ],
        trend: 'improving' as const,
        changePercentage: 5.2
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        type: 'warning' as const,
        category: 'visual-regression' as const,
        title: 'Visual Regression Detected',
        description: 'Multiple visual regressions detected on search page',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        resolved: false,
        metadata: { page: '/search', count: 3 }
      }
    ],
    teamPerformance: [
      {
        teamMember: 'Alice Johnson',
        issuesAssigned: 12,
        issuesResolved: 10,
        averageResolutionTime: 14.2,
        resolutionRate: 83.3,
        qualityScore: 92.1
      },
      {
        teamMember: 'Bob Smith',
        issuesAssigned: 8,
        issuesResolved: 7,
        averageResolutionTime: 18.7,
        resolutionRate: 87.5,
        qualityScore: 88.4
      }
    ],
    recentActivity: [
      {
        id: 'activity-1',
        type: 'issue-resolved' as const,
        title: 'Accessibility Issue Resolved',
        description: 'Fixed color contrast issue on login form',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        user: 'Alice Johnson',
        metadata: { issueId: 'issue-123', severity: 'major' }
      },
      {
        id: 'activity-2',
        type: 'issue-created' as const,
        title: 'New Visual Regression Detected',
        description: 'Button styling issue detected on mobile viewport',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        user: 'System',
        metadata: { page: '/checkout', viewport: '375x667' }
      }
    ],
    upcomingTasks: [
      {
        id: 'task-1',
        title: 'Fix mobile navigation accessibility',
        priority: 'high' as const,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        assignee: 'Alice Johnson',
        category: 'accessibility',
        estimatedHours: 4
      },
      {
        id: 'task-2',
        title: 'Update visual regression baselines',
        priority: 'medium' as const,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        assignee: 'Bob Smith',
        category: 'visual-regression',
        estimatedHours: 2
      }
    ]
  };

  const customDashboardHtml = await dashboardRenderer.generateDashboard(dashboardData);
  console.log('🎨 Generated custom dashboard (length:', customDashboardHtml.length, 'chars)');

  // Generate individual components
  const summaryCard = dashboardRenderer.generateSummaryCard(dashboardData.summary);
  const alertsSection = dashboardRenderer.generateAlertsSection(dashboardData.alerts);
  const teamTable = dashboardRenderer.generateTeamPerformanceTable(dashboardData.teamPerformance);

  console.log('🔧 Generated individual components:', {
    summaryCard: summaryCard.length + ' chars',
    alertsSection: alertsSection.length + ' chars',
    teamTable: teamTable.length + ' chars'
  });

  return dashboardRenderer;
}

/**
 * Example 7: Complete Integration Example
 */
async function completeIntegrationExample() {
  console.log('🔄 Running complete integration example...');

  // Initialize all components
  const dashboard = await basicMonitoringSetup();
  const qualityDashboard = await qualityMetricsExample();
  const regressionTracker = await visualRegressionExample();
  const issueTracker = await issueResolutionExample();
  const alertSystem = await alertSystemExample();
  const dashboardRenderer = await customDashboardExample();

  // Generate comprehensive reports
  console.log('📋 Generating comprehensive reports...');

  const qualityReport = await qualityDashboard.generateReport();
  const regressionReport = await regressionTracker.generateReport();
  const issueReport = await issueTracker.generateReport(30);
  const alertReport = await alertSystem.generateAlertReport(7);
  const progressReport = await dashboard.generateProgressReport(30);

  console.log('📊 Generated Reports:', {
    qualityReport: qualityReport.length + ' chars',
    regressionReport: regressionReport.length + ' chars',
    issueReport: issueReport.length + ' chars',
    alertReport: alertReport.length + ' chars',
    progressReport: 'Generated successfully'
  });

  // Export all data
  const exportedData = await dashboard.exportData('json');
  console.log('💾 Exported data size:', exportedData.length, 'chars');

  // Final status check
  const finalStatus = await dashboard.getStatus();
  console.log('🏁 Final System Status:', {
    isRunning: finalStatus.isRunning,
    systemHealth: finalStatus.systemHealth,
    activeAlerts: finalStatus.activeAlerts
  });

  console.log('✅ Complete integration example finished successfully!');

  return {
    dashboard,
    qualityDashboard,
    regressionTracker,
    issueTracker,
    alertSystem,
    dashboardRenderer,
    reports: {
      quality: qualityReport,
      regression: regressionReport,
      issues: issueReport,
      alerts: alertReport,
      progress: progressReport
    },
    exportedData
  };
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Starting Monitoring Dashboard Examples...\n');

  try {
    await basicMonitoringSetup();
    console.log('');

    await qualityMetricsExample();
    console.log('');

    await visualRegressionExample();
    console.log('');

    await issueResolutionExample();
    console.log('');

    await alertSystemExample();
    console.log('');

    await customDashboardExample();
    console.log('');

    const integrationResult = await completeIntegrationExample();
    console.log('');

    console.log('🎉 All examples completed successfully!');
    console.log('📈 Total components demonstrated:', Object.keys(integrationResult).length - 2);
    console.log('📋 Total reports generated:', Object.keys(integrationResult.reports).length);

  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for use in other files
export {
  basicMonitoringSetup,
  qualityMetricsExample,
  visualRegressionExample,
  issueResolutionExample,
  alertSystemExample,
  customDashboardExample,
  completeIntegrationExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}