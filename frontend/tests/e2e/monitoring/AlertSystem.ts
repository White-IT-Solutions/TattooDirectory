/**
 * Alert System for critical accessibility violations and test failures
 */

import { Alert, AlertThresholds, NotificationChannel } from './types';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  cooldownMinutes: number;
  notificationChannels: string[];
  escalationRules?: EscalationRule[];
}

export interface AlertCondition {
  type: 'threshold' | 'pattern' | 'anomaly' | 'composite';
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'matches';
  value: number | string;
  timeWindow?: number; // minutes
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
}

export interface EscalationRule {
  delayMinutes: number;
  notificationChannels: string[];
  condition?: 'unresolved' | 'acknowledged' | 'custom';
}

export interface AlertNotification {
  id: string;
  alertId: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
}

export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  falsePositives: number;
  averageResolutionTime: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  notificationSuccessRate: number;
}

export class AlertSystem {
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private notifications: AlertNotification[] = [];
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();

  constructor(private thresholds: AlertThresholds) {
    this.initializeDefaultRules();
  }

  /**
   * Add notification channel
   */
  addNotificationChannel(id: string, channel: NotificationChannel): void {
    this.notificationChannels.set(id, channel);
  }

  /**
   * Create alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    const alertRule: AlertRule = {
      ...rule,
      id: this.generateId()
    };

    this.alertRules.push(alertRule);
    return alertRule.id;
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.alertRules.splice(index, 1);
    }
  }

  /**
   * Evaluate metrics against alert rules
   */
  async evaluateMetrics(metrics: Record<string, any>): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlert = this.alertCooldowns.get(rule.id);
      if (lastAlert) {
        const cooldownEnd = new Date(lastAlert.getTime() + rule.cooldownMinutes * 60 * 1000);
        if (new Date() < cooldownEnd) continue;
      }

      const shouldAlert = await this.evaluateCondition(rule.condition, metrics);
      
      if (shouldAlert) {
        const alert = await this.createAlert({
          type: rule.severity === 'critical' ? 'critical' : 
                rule.severity === 'warning' ? 'warning' : 'info',
          category: this.getCategoryFromMetric(rule.condition.metric),
          title: rule.name,
          description: this.generateAlertDescription(rule, metrics),
          metadata: {
            ruleId: rule.id,
            triggeredValue: metrics[rule.condition.metric],
            threshold: rule.condition.value,
            ...metrics
          }
        });

        triggeredAlerts.push(alert);
        this.alertCooldowns.set(rule.id, new Date());

        // Send notifications
        await this.sendNotifications(alert, rule.notificationChannels);

        // Set up escalation if configured
        if (rule.escalationRules) {
          await this.scheduleEscalations(alert, rule.escalationRules);
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Create alert manually
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved' | 'resolvedAt'>): Promise<Alert> {
    const alert: Alert = {
      ...alertData,
      id: this.generateId(),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedAt: Date = new Date()): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = resolvedAt;
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.metadata.acknowledgedBy = acknowledgedBy;
      alert.metadata.acknowledgedAt = new Date();
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get alerts by category
   */
  async getAlertsByCategory(category: string, limit?: number): Promise<Alert[]> {
    const filtered = this.alerts.filter(alert => alert.category === category);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Get alert metrics
   */
  async getAlertMetrics(days: number = 30): Promise<AlertMetrics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentAlerts = this.alerts.filter(alert => alert.timestamp >= cutoffDate);
    const activeAlerts = recentAlerts.filter(alert => !alert.resolved);
    const resolvedAlerts = recentAlerts.filter(alert => alert.resolved);
    const falsePositives = recentAlerts.filter(alert => 
      alert.metadata.falsePositive === true
    );

    // Calculate average resolution time
    const resolutionTimes = resolvedAlerts
      .filter(alert => alert.resolvedAt)
      .map(alert => alert.resolvedAt!.getTime() - alert.timestamp.getTime());
    
    const averageResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    // Group by type and severity
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    recentAlerts.forEach(alert => {
      alertsByType[alert.category] = (alertsByType[alert.category] || 0) + 1;
      alertsBySeverity[alert.type] = (alertsBySeverity[alert.type] || 0) + 1;
    });

    // Calculate notification success rate
    const recentNotifications = this.notifications.filter(
      notification => {
        const alert = this.alerts.find(a => a.id === notification.alertId);
        return alert && alert.timestamp >= cutoffDate;
      }
    );

    const successfulNotifications = recentNotifications.filter(
      notification => notification.status === 'delivered' || notification.status === 'sent'
    );

    const notificationSuccessRate = recentNotifications.length > 0 
      ? (successfulNotifications.length / recentNotifications.length) * 100
      : 100;

    return {
      totalAlerts: recentAlerts.length,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      falsePositives: falsePositives.length,
      averageResolutionTime: averageResolutionTime / (1000 * 60 * 60), // Convert to hours
      alertsByType,
      alertsBySeverity,
      notificationSuccessRate
    };
  }

  /**
   * Test notification channel
   */
  async testNotificationChannel(channelId: string): Promise<boolean> {
    const channel = this.notificationChannels.get(channelId);
    if (!channel || !channel.enabled) {
      return false;
    }

    const testAlert: Alert = {
      id: 'test',
      type: 'info',
      category: 'test',
      title: 'Test Notification',
      description: 'This is a test notification to verify channel configuration.',
      timestamp: new Date(),
      resolved: false,
      metadata: { test: true }
    };

    try {
      await this.sendNotification(testAlert, channelId);
      return true;
    } catch (error) {
      console.error(`Test notification failed for channel ${channelId}:`, error);
      return false;
    }
  }

  /**
   * Generate alert summary report
   */
  async generateAlertReport(days: number = 7): Promise<string> {
    const metrics = await this.getAlertMetrics(days);
    const activeAlerts = await this.getActiveAlerts();
    const topAlertTypes = Object.entries(metrics.alertsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return `
# Alert System Report

Generated: ${new Date().toISOString()}
Period: Last ${days} days

## Summary
- Total Alerts: ${metrics.totalAlerts}
- Active Alerts: ${metrics.activeAlerts}
- Resolved Alerts: ${metrics.resolvedAlerts}
- False Positives: ${metrics.falsePositives}
- Average Resolution Time: ${metrics.averageResolutionTime.toFixed(1)} hours
- Notification Success Rate: ${metrics.notificationSuccessRate.toFixed(1)}%

## Active Critical Alerts
${activeAlerts.filter(a => a.type === 'critical').length === 0 ? 'No critical alerts' : 
  activeAlerts.filter(a => a.type === 'critical').map(alert => `
- ${alert.title}
  ${alert.description}
  Created: ${alert.timestamp.toLocaleString()}
`).join('')}

## Alert Distribution by Type
${topAlertTypes.map(([type, count]) => `
- ${type}: ${count} alerts
`).join('')}

## Alert Distribution by Severity
${Object.entries(metrics.alertsBySeverity).map(([severity, count]) => `
- ${severity}: ${count} alerts
`).join('')}

## Alert Rules Status
${this.alertRules.map(rule => `
- ${rule.name}: ${rule.enabled ? 'Enabled' : 'Disabled'}
  Cooldown: ${rule.cooldownMinutes} minutes
  Channels: ${rule.notificationChannels.length}
`).join('')}
`;
  }

  private initializeDefaultRules(): void {
    // Accessibility score threshold
    this.alertRules.push({
      id: 'accessibility-score-low',
      name: 'Low Accessibility Score',
      description: 'Accessibility score has dropped below threshold',
      condition: {
        type: 'threshold',
        metric: 'accessibilityScore',
        operator: '<',
        value: this.thresholds.accessibilityScore
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 60,
      notificationChannels: ['default']
    });

    // Visual regression rate threshold
    this.alertRules.push({
      id: 'visual-regression-rate-high',
      name: 'High Visual Regression Rate',
      description: 'Visual regression rate has exceeded threshold',
      condition: {
        type: 'threshold',
        metric: 'visualRegressionRate',
        operator: '>',
        value: this.thresholds.visualRegressionRate
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 30,
      notificationChannels: ['default']
    });

    // Test failure rate threshold
    this.alertRules.push({
      id: 'test-failure-rate-high',
      name: 'High Test Failure Rate',
      description: 'Test failure rate has exceeded threshold',
      condition: {
        type: 'threshold',
        metric: 'testFailureRate',
        operator: '>',
        value: this.thresholds.testFailureRate
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 15,
      notificationChannels: ['default']
    });

    // Critical issues threshold
    this.alertRules.push({
      id: 'critical-issues-high',
      name: 'High Number of Critical Issues',
      description: 'Number of critical issues has exceeded threshold',
      condition: {
        type: 'threshold',
        metric: 'criticalIssueCount',
        operator: '>',
        value: this.thresholds.criticalIssueCount
      },
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 30,
      notificationChannels: ['default']
    });

    // Response time threshold
    this.alertRules.push({
      id: 'response-time-high',
      name: 'High Response Time',
      description: 'Test execution response time has exceeded threshold',
      condition: {
        type: 'threshold',
        metric: 'responseTimeMs',
        operator: '>',
        value: this.thresholds.responseTimeMs
      },
      severity: 'warning',
      enabled: true,
      cooldownMinutes: 15,
      notificationChannels: ['default']
    });
  }

  private async evaluateCondition(condition: AlertCondition, metrics: Record<string, any>): Promise<boolean> {
    const metricValue = metrics[condition.metric];
    if (metricValue === undefined) return false;

    switch (condition.operator) {
      case '>':
        return metricValue > condition.value;
      case '<':
        return metricValue < condition.value;
      case '=':
        return metricValue === condition.value;
      case '>=':
        return metricValue >= condition.value;
      case '<=':
        return metricValue <= condition.value;
      case '!=':
        return metricValue !== condition.value;
      case 'contains':
        return String(metricValue).includes(String(condition.value));
      case 'matches':
        return new RegExp(String(condition.value)).test(String(metricValue));
      default:
        return false;
    }
  }

  private getCategoryFromMetric(metric: string): Alert['category'] {
    if (metric.includes('accessibility')) return 'accessibility';
    if (metric.includes('visual') || metric.includes('regression')) return 'visual-regression';
    if (metric.includes('performance') || metric.includes('response')) return 'performance';
    if (metric.includes('test') || metric.includes('failure')) return 'test-failure';
    return 'accessibility'; // default
  }

  private generateAlertDescription(rule: AlertRule, metrics: Record<string, any>): string {
    const metricValue = metrics[rule.condition.metric];
    const threshold = rule.condition.value;
    
    return `${rule.description}. Current value: ${metricValue}, Threshold: ${threshold}`;
  }

  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    for (const channelId of channelIds) {
      try {
        await this.sendNotification(alert, channelId);
      } catch (error) {
        console.error(`Failed to send notification to channel ${channelId}:`, error);
      }
    }
  }

  private async sendNotification(alert: Alert, channelId: string): Promise<void> {
    const channel = this.notificationChannels.get(channelId);
    if (!channel || !channel.enabled) {
      throw new Error(`Channel ${channelId} not found or disabled`);
    }

    const notification: AlertNotification = {
      id: this.generateId(),
      alertId: alert.id,
      channel: channelId,
      status: 'pending',
      retryCount: 0
    };

    this.notifications.push(notification);

    try {
      notification.sentAt = new Date();
      
      switch (channel.type) {
        case 'console':
          await this.sendConsoleNotification(alert, channel);
          break;
        case 'email':
          await this.sendEmailNotification(alert, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert, channel);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }

      notification.status = 'sent';
      notification.deliveredAt = new Date();
    } catch (error) {
      notification.status = 'failed';
      notification.error = String(error);
      throw error;
    }
  }

  private async sendConsoleNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const message = `🚨 ALERT: ${alert.title}\n${alert.description}\nSeverity: ${alert.type}\nTime: ${alert.timestamp.toISOString()}`;
    console.log(message);
  }

  private async sendEmailNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log(`Email notification would be sent to: ${channel.config.recipients}`);
    console.log(`Subject: ${alert.title}`);
    console.log(`Body: ${alert.description}`);
  }

  private async sendSlackNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would integrate with Slack API
    console.log(`Slack notification would be sent to: ${channel.config.webhook}`);
    console.log(`Message: ${alert.title} - ${alert.description}`);
  }

  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would make an HTTP request to the webhook URL
    console.log(`Webhook notification would be sent to: ${channel.config.url}`);
    console.log(`Payload:`, JSON.stringify(alert, null, 2));
  }

  private async scheduleEscalations(alert: Alert, escalationRules: EscalationRule[]): Promise<void> {
    // In a real implementation, this would schedule escalation notifications
    // For now, we'll just log the escalation rules
    console.log(`Escalation rules scheduled for alert ${alert.id}:`, escalationRules);
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}