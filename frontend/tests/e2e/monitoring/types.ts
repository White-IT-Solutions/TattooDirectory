/**
 * Type definitions for monitoring dashboard and progress tracking
 */

export interface QualityMetrics {
  timestamp: Date;
  accessibilityScore: number;
  visualRegressionCount: number;
  contrastFailures: number;
  testExecutionTime: number;
  testSuccessRate: number;
  issuesResolved: number;
  issuesCreated: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
}

export interface TrendData {
  period: 'daily' | 'weekly' | 'monthly';
  data: QualityMetrics[];
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
}

export interface AlertThresholds {
  accessibilityScore: number;
  visualRegressionRate: number;
  testFailureRate: number;
  criticalIssueCount: number;
  responseTimeMs: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'accessibility' | 'visual-regression' | 'performance' | 'test-failure';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface TeamPerformanceMetrics {
  teamMember?: string;
  issuesAssigned: number;
  issuesResolved: number;
  averageResolutionTime: number;
  resolutionRate: number;
  qualityScore: number;
}

export interface DashboardData {
  summary: QualityMetricsSummary;
  trends: TrendData[];
  alerts: Alert[];
  teamPerformance: TeamPerformanceMetrics[];
  recentActivity: ActivityItem[];
  upcomingTasks: TaskItem[];
}

export interface QualityMetricsSummary {
  currentAccessibilityScore: number;
  accessibilityTrend: number;
  totalIssues: number;
  issuesTrend: number;
  visualRegressions: number;
  regressionTrend: number;
  testSuccessRate: number;
  successRateTrend: number;
  averageResolutionTime: number;
  resolutionTimeTrend: number;
}

export interface ActivityItem {
  id: string;
  type: 'issue-created' | 'issue-resolved' | 'test-run' | 'regression-detected';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  metadata: Record<string, any>;
}

export interface TaskItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  assignee?: string;
  category: string;
  estimatedHours: number;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

export interface MonitoringConfig {
  dataRetentionDays: number;
  alertThresholds: AlertThresholds;
  dashboardRefreshInterval: number;
  notificationChannels: NotificationChannel[];
  metricsCollectionInterval: number;
  trendAnalysisPeriods: ('daily' | 'weekly' | 'monthly')[];
}

export interface MetricsQuery {
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
  metrics: (keyof QualityMetrics)[];
  filters?: Record<string, any>;
}

export interface ProgressReport {
  id: string;
  title: string;
  period: string;
  generatedAt: Date;
  summary: ProgressSummary;
  achievements: Achievement[];
  challenges: Challenge[];
  recommendations: Recommendation[];
  nextSteps: NextStep[];
}

export interface ProgressSummary {
  issuesResolved: number;
  issuesCreated: number;
  netProgress: number;
  qualityImprovement: number;
  testCoverage: number;
  teamVelocity: number;
}

export interface Achievement {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metrics: Record<string, number>;
}

export interface Challenge {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestedActions: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
  expectedImpact: string;
}

export interface NextStep {
  title: string;
  description: string;
  dueDate: Date;
  assignee?: string;
  dependencies: string[];
}