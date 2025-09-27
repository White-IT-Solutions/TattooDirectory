/**
 * Dashboard Renderer for generating HTML dashboard reports
 */

import { DashboardData, QualityMetricsSummary, TrendData, Alert, TeamPerformanceMetrics, ActivityItem, TaskItem } from './types';

export interface DashboardTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
}

export interface DashboardConfig {
  title: string;
  subtitle?: string;
  theme: DashboardTheme;
  refreshInterval?: number;
  showTimestamp: boolean;
  sections: DashboardSection[];
}

export interface DashboardSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'list' | 'alerts' | 'custom';
  enabled: boolean;
  order: number;
  config?: Record<string, any>;
}

export class DashboardRenderer {
  private readonly defaultTheme: DashboardTheme = {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    borderColor: '#e2e8f0',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444'
  };

  private readonly defaultConfig: DashboardConfig = {
    title: 'UI/UX Audit Dashboard',
    subtitle: 'Quality Metrics and Progress Tracking',
    theme: this.defaultTheme,
    refreshInterval: 300000, // 5 minutes
    showTimestamp: true,
    sections: [
      { id: 'summary', title: 'Quality Summary', type: 'summary', enabled: true, order: 1 },
      { id: 'trends', title: 'Trends', type: 'chart', enabled: true, order: 2 },
      { id: 'alerts', title: 'Active Alerts', type: 'alerts', enabled: true, order: 3 },
      { id: 'team', title: 'Team Performance', type: 'table', enabled: true, order: 4 },
      { id: 'activity', title: 'Recent Activity', type: 'list', enabled: true, order: 5 },
      { id: 'tasks', title: 'Upcoming Tasks', type: 'table', enabled: true, order: 6 }
    ]
  };

  constructor(private config: Partial<DashboardConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Generate complete HTML dashboard
   */
  async generateDashboard(data: DashboardData): Promise<string> {
    const config = this.config as DashboardConfig;
    const enabledSections = config.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        ${this.generateCSS(config.theme)}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard">
        ${this.generateHeader(config, data)}
        <div class="dashboard-content">
            ${enabledSections.map(section => this.generateSection(section, data)).join('')}
        </div>
        ${this.generateFooter(config)}
    </div>
    <script>
        ${this.generateJavaScript(config, data)}
    </script>
</body>
</html>`;

    return html;
  }

  /**
   * Generate dashboard summary card
   */
  generateSummaryCard(summary: QualityMetricsSummary): string {
    return `
<div class="summary-grid">
    <div class="metric-card ${this.getScoreClass(summary.currentAccessibilityScore)}">
        <div class="metric-value">${summary.currentAccessibilityScore.toFixed(1)}</div>
        <div class="metric-label">Accessibility Score</div>
        <div class="metric-trend ${this.getTrendClass(summary.accessibilityTrend)}">
            ${this.formatTrend(summary.accessibilityTrend)}
        </div>
    </div>
    
    <div class="metric-card ${this.getIssueClass(summary.totalIssues)}">
        <div class="metric-value">${summary.totalIssues}</div>
        <div class="metric-label">Total Issues</div>
        <div class="metric-trend ${this.getTrendClass(-summary.issuesTrend)}">
            ${this.formatTrend(summary.issuesTrend)}
        </div>
    </div>
    
    <div class="metric-card ${this.getRegressionClass(summary.visualRegressions)}">
        <div class="metric-value">${summary.visualRegressions}</div>
        <div class="metric-label">Visual Regressions</div>
        <div class="metric-trend ${this.getTrendClass(-summary.regressionTrend)}">
            ${this.formatTrend(summary.regressionTrend)}
        </div>
    </div>
    
    <div class="metric-card ${this.getSuccessRateClass(summary.testSuccessRate)}">
        <div class="metric-value">${summary.testSuccessRate.toFixed(1)}%</div>
        <div class="metric-label">Test Success Rate</div>
        <div class="metric-trend ${this.getTrendClass(summary.successRateTrend)}">
            ${this.formatTrend(summary.successRateTrend)}
        </div>
    </div>
    
    <div class="metric-card">
        <div class="metric-value">${summary.averageResolutionTime.toFixed(1)}h</div>
        <div class="metric-label">Avg Resolution Time</div>
        <div class="metric-trend ${this.getTrendClass(-summary.resolutionTimeTrend)}">
            ${this.formatTrend(summary.resolutionTimeTrend)}
        </div>
    </div>
</div>`;
  }

  /**
   * Generate trends chart
   */
  generateTrendsChart(trends: TrendData[]): string {
    const chartId = `trends-chart-${Date.now()}`;
    
    return `
<div class="chart-container">
    <canvas id="${chartId}" width="400" height="200"></canvas>
</div>
<script>
    // Chart will be initialized in the main JavaScript section
    window.trendsChartId = '${chartId}';
    window.trendsData = ${JSON.stringify(trends)};
</script>`;
  }

  /**
   * Generate alerts section
   */
  generateAlertsSection(alerts: Alert[]): string {
    if (alerts.length === 0) {
      return `
<div class="no-alerts">
    <div class="no-alerts-icon">✅</div>
    <div class="no-alerts-text">No active alerts</div>
</div>`;
    }

    return `
<div class="alerts-list">
    ${alerts.map(alert => `
    <div class="alert-item alert-${alert.type}">
        <div class="alert-header">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-time">${this.formatRelativeTime(alert.timestamp)}</div>
        </div>
        <div class="alert-description">${alert.description}</div>
        <div class="alert-category">${alert.category}</div>
    </div>
    `).join('')}
</div>`;
  }

  /**
   * Generate team performance table
   */
  generateTeamPerformanceTable(teamMetrics: TeamPerformanceMetrics[]): string {
    if (teamMetrics.length === 0) {
      return '<div class="no-data">No team performance data available</div>';
    }

    return `
<div class="table-container">
    <table class="performance-table">
        <thead>
            <tr>
                <th>Team Member</th>
                <th>Assigned</th>
                <th>Resolved</th>
                <th>Resolution Rate</th>
                <th>Avg Time</th>
                <th>Quality Score</th>
            </tr>
        </thead>
        <tbody>
            ${teamMetrics.map(member => `
            <tr>
                <td class="member-name">${member.teamMember || 'Unassigned'}</td>
                <td>${member.issuesAssigned}</td>
                <td>${member.issuesResolved}</td>
                <td class="rate ${this.getRateClass(member.resolutionRate)}">
                    ${member.resolutionRate.toFixed(1)}%
                </td>
                <td>${member.averageResolutionTime.toFixed(1)}h</td>
                <td class="quality-score ${this.getQualityScoreClass(member.qualityScore)}">
                    ${member.qualityScore.toFixed(1)}
                </td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</div>`;
  }

  /**
   * Generate recent activity list
   */
  generateActivityList(activities: ActivityItem[]): string {
    if (activities.length === 0) {
      return '<div class="no-data">No recent activity</div>';
    }

    return `
<div class="activity-list">
    ${activities.map(activity => `
    <div class="activity-item activity-${activity.type}">
        <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
        <div class="activity-content">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-description">${activity.description}</div>
            <div class="activity-meta">
                <span class="activity-time">${this.formatRelativeTime(activity.timestamp)}</span>
                ${activity.user ? `<span class="activity-user">by ${activity.user}</span>` : ''}
            </div>
        </div>
    </div>
    `).join('')}
</div>`;
  }

  /**
   * Generate upcoming tasks table
   */
  generateTasksTable(tasks: TaskItem[]): string {
    if (tasks.length === 0) {
      return '<div class="no-data">No upcoming tasks</div>';
    }

    const highPriorityTasks = tasks.filter(task => task.priority === 'high').slice(0, 10);

    return `
<div class="table-container">
    <table class="tasks-table">
        <thead>
            <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignee</th>
                <th>Estimated Hours</th>
            </tr>
        </thead>
        <tbody>
            ${highPriorityTasks.map(task => `
            <tr>
                <td class="task-title">${task.title}</td>
                <td class="priority priority-${task.priority}">${task.priority}</td>
                <td class="due-date ${this.getDueDateClass(task.dueDate)}">
                    ${task.dueDate.toLocaleDateString()}
                </td>
                <td>${task.assignee || 'Unassigned'}</td>
                <td>${task.estimatedHours}h</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</div>`;
  }

  private generateHeader(config: DashboardConfig, data: DashboardData): string {
    return `
<header class="dashboard-header">
    <div class="header-content">
        <h1 class="dashboard-title">${config.title}</h1>
        ${config.subtitle ? `<p class="dashboard-subtitle">${config.subtitle}</p>` : ''}
        ${config.showTimestamp ? `<div class="last-updated">Last updated: ${new Date().toLocaleString()}</div>` : ''}
    </div>
    <div class="header-actions">
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    </div>
</header>`;
  }

  private generateSection(section: DashboardSection, data: DashboardData): string {
    let content = '';

    switch (section.type) {
      case 'summary':
        content = this.generateSummaryCard(data.summary);
        break;
      case 'chart':
        content = this.generateTrendsChart(data.trends);
        break;
      case 'alerts':
        content = this.generateAlertsSection(data.alerts);
        break;
      case 'table':
        if (section.id === 'team') {
          content = this.generateTeamPerformanceTable(data.teamPerformance);
        } else if (section.id === 'tasks') {
          content = this.generateTasksTable(data.upcomingTasks);
        }
        break;
      case 'list':
        content = this.generateActivityList(data.recentActivity);
        break;
      default:
        content = '<div class="no-data">Section not implemented</div>';
    }

    return `
<section class="dashboard-section" id="${section.id}">
    <h2 class="section-title">${section.title}</h2>
    <div class="section-content">
        ${content}
    </div>
</section>`;
  }

  private generateFooter(config: DashboardConfig): string {
    return `
<footer class="dashboard-footer">
    <div class="footer-content">
        <p>Generated by UI/UX Audit Framework</p>
        ${config.refreshInterval ? `<p>Auto-refresh: ${config.refreshInterval / 1000}s</p>` : ''}
    </div>
</footer>`;
  }

  private generateCSS(theme: DashboardTheme): string {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: ${theme.backgroundColor};
    color: ${theme.textColor};
    line-height: 1.6;
}

.dashboard {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.dashboard-header {
    background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor});
    color: white;
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dashboard-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.dashboard-subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
}

.last-updated {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-top: 0.5rem;
}

.refresh-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
}

.refresh-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.dashboard-content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.dashboard-section {
    margin-bottom: 3rem;
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: ${theme.primaryColor};
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.metric-card {
    background: white;
    border: 1px solid ${theme.borderColor};
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.metric-label {
    font-size: 0.9rem;
    color: ${theme.secondaryColor};
    margin-bottom: 0.5rem;
}

.metric-trend {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
}

.trend-positive {
    background: ${theme.successColor}20;
    color: ${theme.successColor};
}

.trend-negative {
    background: ${theme.errorColor}20;
    color: ${theme.errorColor};
}

.trend-neutral {
    background: ${theme.secondaryColor}20;
    color: ${theme.secondaryColor};
}

.score-excellent { border-left: 4px solid ${theme.successColor}; }
.score-good { border-left: 4px solid #22c55e; }
.score-fair { border-left: 4px solid ${theme.warningColor}; }
.score-poor { border-left: 4px solid ${theme.errorColor}; }

.chart-container {
    background: white;
    border: 1px solid ${theme.borderColor};
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.alerts-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.alert-item {
    background: white;
    border: 1px solid ${theme.borderColor};
    border-radius: 0.5rem;
    padding: 1rem;
    border-left-width: 4px;
}

.alert-critical { border-left-color: ${theme.errorColor}; }
.alert-warning { border-left-color: ${theme.warningColor}; }
.alert-info { border-left-color: ${theme.primaryColor}; }

.alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.alert-title {
    font-weight: 600;
    font-size: 1.1rem;
}

.alert-time {
    font-size: 0.8rem;
    color: ${theme.secondaryColor};
}

.alert-description {
    margin-bottom: 0.5rem;
    color: ${theme.textColor};
}

.alert-category {
    font-size: 0.8rem;
    color: ${theme.secondaryColor};
    text-transform: uppercase;
    font-weight: 500;
}

.no-alerts {
    text-align: center;
    padding: 3rem;
    background: white;
    border: 1px solid ${theme.borderColor};
    border-radius: 0.75rem;
}

.no-alerts-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.no-alerts-text {
    font-size: 1.1rem;
    color: ${theme.secondaryColor};
}

.table-container {
    background: white;
    border: 1px solid ${theme.borderColor};
    border-radius: 0.75rem;
    overflow: hidden;
}

.performance-table, .tasks-table {
    width: 100%;
    border-collapse: collapse;
}

.performance-table th, .tasks-table th {
    background: ${theme.primaryColor}10;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid ${theme.borderColor};
}

.performance-table td, .tasks-table td {
    padding: 1rem;
    border-bottom: 1px solid ${theme.borderColor};
}

.performance-table tr:last-child td, .tasks-table tr:last-child td {
    border-bottom: none;
}

.rate-excellent { color: ${theme.successColor}; font-weight: 600; }
.rate-good { color: #22c55e; font-weight: 600; }
.rate-fair { color: ${theme.warningColor}; font-weight: 600; }
.rate-poor { color: ${theme.errorColor}; font-weight: 600; }

.quality-score-excellent { color: ${theme.successColor}; font-weight: 600; }
.quality-score-good { color: #22c55e; font-weight: 600; }
.quality-score-fair { color: ${theme.warningColor}; font-weight: 600; }
.quality-score-poor { color: ${theme.errorColor}; font-weight: 600; }

.priority-high { 
    background: ${theme.errorColor}20; 
    color: ${theme.errorColor}; 
    padding: 0.25rem 0.5rem; 
    border-radius: 0.25rem; 
    font-weight: 600; 
    text-transform: uppercase; 
    font-size: 0.8rem; 
}

.priority-medium { 
    background: ${theme.warningColor}20; 
    color: ${theme.warningColor}; 
    padding: 0.25rem 0.5rem; 
    border-radius: 0.25rem; 
    font-weight: 600; 
    text-transform: uppercase; 
    font-size: 0.8rem; 
}

.priority-low { 
    background: ${theme.secondaryColor}20; 
    color: ${theme.secondaryColor}; 
    padding: 0.25rem 0.5rem; 
    border-radius: 0.25rem; 
    font-weight: 600; 
    text-transform: uppercase; 
    font-size: 0.8rem; 
}

.due-date-overdue { color: ${theme.errorColor}; font-weight: 600; }
.due-date-soon { color: ${theme.warningColor}; font-weight: 600; }

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.activity-item {
    background: white;
    border: 1px solid ${theme.borderColor};
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.activity-icon {
    font-size: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${theme.primaryColor}10;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.activity-description {
    color: ${theme.secondaryColor};
    margin-bottom: 0.5rem;
}

.activity-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: ${theme.secondaryColor};
}

.no-data {
    text-align: center;
    padding: 2rem;
    color: ${theme.secondaryColor};
    background: white;
    border: 1px solid ${theme.borderColor};
    border-radius: 0.75rem;
}

.dashboard-footer {
    background: ${theme.borderColor};
    padding: 1rem 2rem;
    text-align: center;
    color: ${theme.secondaryColor};
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .dashboard-header {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .dashboard-content {
        padding: 1rem;
    }
    
    .summary-grid {
        grid-template-columns: 1fr;
    }
    
    .performance-table, .tasks-table {
        font-size: 0.9rem;
    }
    
    .performance-table th, .performance-table td,
    .tasks-table th, .tasks-table td {
        padding: 0.5rem;
    }
}
`;
  }

  private generateJavaScript(config: DashboardConfig, data: DashboardData): string {
    return `
// Auto-refresh functionality
${config.refreshInterval ? `
setInterval(() => {
    location.reload();
}, ${config.refreshInterval});
` : ''}

// Initialize charts
if (window.trendsChartId && window.trendsData) {
    const ctx = document.getElementById(window.trendsChartId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: window.trendsData[0]?.data.map(d => new Date(d.timestamp).toLocaleDateString()) || [],
            datasets: [{
                label: 'Accessibility Score',
                data: window.trendsData[0]?.data.map(d => d.accessibilityScore) || [],
                borderColor: '${config.theme?.primaryColor || '#3b82f6'}',
                backgroundColor: '${config.theme?.primaryColor || '#3b82f6'}20',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Add click handlers for interactive elements
document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', function() {
        // Could navigate to detailed view
        console.log('Metric card clicked:', this.querySelector('.metric-label').textContent);
    });
});
`;
  }

  private getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-fair';
    return 'score-poor';
  }

  private getIssueClass(issues: number): string {
    if (issues === 0) return 'score-excellent';
    if (issues <= 5) return 'score-good';
    if (issues <= 15) return 'score-fair';
    return 'score-poor';
  }

  private getRegressionClass(regressions: number): string {
    if (regressions === 0) return 'score-excellent';
    if (regressions <= 2) return 'score-good';
    if (regressions <= 5) return 'score-fair';
    return 'score-poor';
  }

  private getSuccessRateClass(rate: number): string {
    if (rate >= 95) return 'score-excellent';
    if (rate >= 90) return 'score-good';
    if (rate >= 80) return 'score-fair';
    return 'score-poor';
  }

  private getTrendClass(trend: number): string {
    if (Math.abs(trend) < 2) return 'trend-neutral';
    return trend > 0 ? 'trend-positive' : 'trend-negative';
  }

  private formatTrend(trend: number): string {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  }

  private getRateClass(rate: number): string {
    if (rate >= 90) return 'rate-excellent';
    if (rate >= 80) return 'rate-good';
    if (rate >= 70) return 'rate-fair';
    return 'rate-poor';
  }

  private getQualityScoreClass(score: number): string {
    if (score >= 90) return 'quality-score-excellent';
    if (score >= 80) return 'quality-score-good';
    if (score >= 70) return 'quality-score-fair';
    return 'quality-score-poor';
  }

  private getDueDateClass(dueDate: Date): string {
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'due-date-overdue';
    if (diffDays <= 2) return 'due-date-soon';
    return '';
  }

  private getActivityIcon(type: string): string {
    const icons = {
      'issue-created': '🆕',
      'issue-resolved': '✅',
      'test-run': '🧪',
      'regression-detected': '⚠️'
    };
    return icons[type as keyof typeof icons] || '📝';
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}