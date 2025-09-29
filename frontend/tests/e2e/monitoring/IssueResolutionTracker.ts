/**
 * Issue Resolution Tracker for monitoring issue resolution times and team performance metrics
 */

import { TeamPerformanceMetrics, ActivityItem, TaskItem } from './types';

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'accessibility' | 'visual-regression' | 'contrast' | 'responsive' | 'performance';
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  page?: string;
  component?: string;
  theme?: 'light' | 'dark' | 'both';
  viewport?: string;
  reproductionSteps?: string[];
  acceptanceCriteria?: string[];
  relatedIssues: string[];
  comments: IssueComment[];
}

export interface IssueComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'status-change' | 'assignment' | 'resolution';
}

export interface ResolutionMetrics {
  averageResolutionTime: number;
  medianResolutionTime: number;
  resolutionTimeByType: Record<string, number>;
  resolutionTimeByPriority: Record<string, number>;
  resolutionRate: number;
  reopenRate: number;
  firstResponseTime: number;
  escalationRate: number;
}

export interface TeamVelocityMetrics {
  issuesPerSprint: number;
  storyPointsCompleted: number;
  velocityTrend: 'increasing' | 'decreasing' | 'stable';
  burndownRate: number;
  cycleTime: number;
  leadTime: number;
  throughput: number;
}

export interface QualityMetrics {
  defectDensity: number;
  defectRemovalEfficiency: number;
  testCoverage: number;
  codeQualityScore: number;
  technicalDebtRatio: number;
  customerSatisfactionScore: number;
}

export class IssueResolutionTracker {
  private issues: Issue[] = [];
  private teamMembers: Set<string> = new Set();

  /**
   * Create a new issue
   */
  async createIssue(issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): Promise<string> {
    const issue: Issue = {
      ...issueData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: []
    };

    this.issues.push(issue);
    this.teamMembers.add(issue.reporter);
    if (issue.assignee) {
      this.teamMembers.add(issue.assignee);
    }

    await this.addComment(issue.id, {
      author: 'system',
      content: `Issue created by ${issue.reporter}`,
      type: 'comment'
    });

    return issue.id;
  }

  /**
   * Update issue status
   */
  async updateIssueStatus(issueId: string, status: Issue['status'], assignee?: string): Promise<void> {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) return;

    const oldStatus = issue.status;
    issue.status = status;
    issue.updatedAt = new Date();

    if (assignee && assignee !== issue.assignee) {
      issue.assignee = assignee;
      this.teamMembers.add(assignee);
    }

    if (status === 'resolved' && !issue.resolvedAt) {
      issue.resolvedAt = new Date();
    }

    if (status === 'closed' && !issue.closedAt) {
      issue.closedAt = new Date();
    }

    await this.addComment(issueId, {
      author: assignee || 'system',
      content: `Status changed from ${oldStatus} to ${status}`,
      type: 'status-change'
    });
  }

  /**
   * Add comment to issue
   */
  async addComment(issueId: string, commentData: Omit<IssueComment, 'id' | 'timestamp'>): Promise<void> {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) return;

    const comment: IssueComment = {
      ...commentData,
      id: this.generateId(),
      timestamp: new Date()
    };

    issue.comments.push(comment);
    issue.updatedAt = new Date();
  }

  /**
   * Get resolution metrics for a time period
   */
  async getResolutionMetrics(days: number = 30): Promise<ResolutionMetrics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const resolvedIssues = this.issues.filter(issue => 
      issue.resolvedAt && 
      issue.resolvedAt >= cutoffDate &&
      issue.createdAt >= cutoffDate
    );

    const resolutionTimes = resolvedIssues.map(issue => 
      issue.resolvedAt!.getTime() - issue.createdAt.getTime()
    );

    const averageResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    const medianResolutionTime = this.calculateMedian(resolutionTimes);

    // Resolution time by type
    const resolutionTimeByType: Record<string, number> = {};
    const typeGroups = this.groupBy(resolvedIssues, 'type');
    for (const [type, issues] of Object.entries(typeGroups)) {
      const times = issues.map(issue => issue.resolvedAt!.getTime() - issue.createdAt.getTime());
      resolutionTimeByType[type] = times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    // Resolution time by priority
    const resolutionTimeByPriority: Record<string, number> = {};
    const priorityGroups = this.groupBy(resolvedIssues, 'priority');
    for (const [priority, issues] of Object.entries(priorityGroups)) {
      const times = issues.map(issue => issue.resolvedAt!.getTime() - issue.createdAt.getTime());
      resolutionTimeByPriority[priority] = times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    const totalIssues = this.issues.filter(issue => issue.createdAt >= cutoffDate).length;
    const resolutionRate = totalIssues > 0 ? (resolvedIssues.length / totalIssues) * 100 : 0;

    // Calculate reopen rate
    const reopenedIssues = this.issues.filter(issue => 
      issue.comments.some(comment => 
        comment.type === 'status-change' && 
        comment.content.includes('resolved') && 
        comment.timestamp >= cutoffDate
      ) &&
      issue.status === 'open'
    );
    const reopenRate = resolvedIssues.length > 0 ? (reopenedIssues.length / resolvedIssues.length) * 100 : 0;

    // Calculate first response time
    const firstResponseTimes = this.issues
      .filter(issue => issue.createdAt >= cutoffDate && issue.comments.length > 1)
      .map(issue => {
        const firstResponse = issue.comments.find(comment => comment.author !== 'system');
        return firstResponse ? firstResponse.timestamp.getTime() - issue.createdAt.getTime() : 0;
      })
      .filter(time => time > 0);

    const firstResponseTime = firstResponseTimes.length > 0 
      ? firstResponseTimes.reduce((sum, time) => sum + time, 0) / firstResponseTimes.length
      : 0;

    // Calculate escalation rate (issues that took longer than expected)
    const escalatedIssues = resolvedIssues.filter(issue => {
      const resolutionTime = issue.resolvedAt!.getTime() - issue.createdAt.getTime();
      const expectedTime = this.getExpectedResolutionTime(issue.priority, issue.type);
      return resolutionTime > expectedTime;
    });
    const escalationRate = resolvedIssues.length > 0 ? (escalatedIssues.length / resolvedIssues.length) * 100 : 0;

    return {
      averageResolutionTime: averageResolutionTime / (1000 * 60 * 60), // Convert to hours
      medianResolutionTime: medianResolutionTime / (1000 * 60 * 60),
      resolutionTimeByType: Object.fromEntries(
        Object.entries(resolutionTimeByType).map(([key, value]) => [key, value / (1000 * 60 * 60)])
      ),
      resolutionTimeByPriority: Object.fromEntries(
        Object.entries(resolutionTimeByPriority).map(([key, value]) => [key, value / (1000 * 60 * 60)])
      ),
      resolutionRate,
      reopenRate,
      firstResponseTime: firstResponseTime / (1000 * 60 * 60),
      escalationRate
    };
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformanceMetrics(days: number = 30): Promise<TeamPerformanceMetrics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const teamMetrics: TeamPerformanceMetrics[] = [];

    for (const member of this.teamMembers) {
      const assignedIssues = this.issues.filter(issue => 
        issue.assignee === member && 
        issue.createdAt >= cutoffDate
      );

      const resolvedIssues = assignedIssues.filter(issue => 
        issue.status === 'resolved' || issue.status === 'closed'
      );

      const resolutionTimes = resolvedIssues
        .filter(issue => issue.resolvedAt)
        .map(issue => issue.resolvedAt!.getTime() - issue.createdAt.getTime());

      const averageResolutionTime = resolutionTimes.length > 0 
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
        : 0;

      const resolutionRate = assignedIssues.length > 0 
        ? (resolvedIssues.length / assignedIssues.length) * 100 
        : 0;

      // Calculate quality score based on various factors
      const qualityScore = this.calculateQualityScore(member, assignedIssues, resolvedIssues);

      teamMetrics.push({
        teamMember: member,
        issuesAssigned: assignedIssues.length,
        issuesResolved: resolvedIssues.length,
        averageResolutionTime: averageResolutionTime / (1000 * 60 * 60), // Convert to hours
        resolutionRate,
        qualityScore
      });
    }

    return teamMetrics.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 20): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];

    // Add issue creation activities
    this.issues
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .forEach(issue => {
        activities.push({
          id: `create_${issue.id}`,
          type: 'issue-created',
          title: `Issue Created: ${issue.title}`,
          description: `${issue.type} issue created by ${issue.reporter}`,
          timestamp: issue.createdAt,
          user: issue.reporter,
          metadata: {
            issueId: issue.id,
            severity: issue.severity,
            type: issue.type
          }
        });
      });

    // Add resolution activities
    this.issues
      .filter(issue => issue.resolvedAt)
      .sort((a, b) => b.resolvedAt!.getTime() - a.resolvedAt!.getTime())
      .slice(0, limit)
      .forEach(issue => {
        activities.push({
          id: `resolve_${issue.id}`,
          type: 'issue-resolved',
          title: `Issue Resolved: ${issue.title}`,
          description: `${issue.type} issue resolved by ${issue.assignee || 'unknown'}`,
          timestamp: issue.resolvedAt!,
          user: issue.assignee,
          metadata: {
            issueId: issue.id,
            severity: issue.severity,
            type: issue.type,
            resolutionTime: issue.resolvedAt!.getTime() - issue.createdAt.getTime()
          }
        });
      });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get upcoming tasks based on open issues
   */
  async getUpcomingTasks(): Promise<TaskItem[]> {
    const openIssues = this.issues.filter(issue => 
      issue.status === 'open' || issue.status === 'in-progress'
    );

    return openIssues
      .map(issue => ({
        id: issue.id,
        title: issue.title,
        priority: issue.priority,
        dueDate: this.calculateDueDate(issue),
        assignee: issue.assignee,
        category: issue.type,
        estimatedHours: issue.estimatedHours || this.estimateHours(issue)
      }))
      .sort((a, b) => {
        // Sort by priority first, then by due date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
  }

  /**
   * Generate comprehensive issue resolution report
   */
  async generateReport(days: number = 30): Promise<string> {
    const resolutionMetrics = await this.getResolutionMetrics(days);
    const teamMetrics = await this.getTeamPerformanceMetrics(days);
    const recentActivity = await this.getRecentActivity(10);
    const upcomingTasks = await this.getUpcomingTasks();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const totalIssues = this.issues.filter(issue => issue.createdAt >= cutoffDate).length;
    const openIssues = this.issues.filter(issue => 
      issue.status === 'open' && issue.createdAt >= cutoffDate
    ).length;
    const inProgressIssues = this.issues.filter(issue => 
      issue.status === 'in-progress' && issue.createdAt >= cutoffDate
    ).length;

    return `
# Issue Resolution Tracking Report

Generated: ${new Date().toISOString()}
Period: Last ${days} days

## Summary
- Total Issues: ${totalIssues}
- Open Issues: ${openIssues}
- In Progress: ${inProgressIssues}
- Resolution Rate: ${resolutionMetrics.resolutionRate.toFixed(1)}%
- Average Resolution Time: ${resolutionMetrics.averageResolutionTime.toFixed(1)} hours

## Resolution Metrics
- Median Resolution Time: ${resolutionMetrics.medianResolutionTime.toFixed(1)} hours
- First Response Time: ${resolutionMetrics.firstResponseTime.toFixed(1)} hours
- Reopen Rate: ${resolutionMetrics.reopenRate.toFixed(1)}%
- Escalation Rate: ${resolutionMetrics.escalationRate.toFixed(1)}%

### Resolution Time by Type
${Object.entries(resolutionMetrics.resolutionTimeByType).map(([type, time]) => 
  `- ${type}: ${time.toFixed(1)} hours`
).join('\n')}

### Resolution Time by Priority
${Object.entries(resolutionMetrics.resolutionTimeByPriority).map(([priority, time]) => 
  `- ${priority}: ${time.toFixed(1)} hours`
).join('\n')}

## Team Performance
${teamMetrics.map(member => `
### ${member.teamMember || 'Unassigned'}
- Issues Assigned: ${member.issuesAssigned}
- Issues Resolved: ${member.issuesResolved}
- Resolution Rate: ${member.resolutionRate.toFixed(1)}%
- Average Resolution Time: ${member.averageResolutionTime.toFixed(1)} hours
- Quality Score: ${member.qualityScore.toFixed(1)}/100
`).join('')}

## Recent Activity
${recentActivity.slice(0, 5).map(activity => `
- ${activity.title} (${activity.timestamp.toLocaleDateString()})
  ${activity.description}
`).join('')}

## Upcoming High Priority Tasks
${upcomingTasks.filter(task => task.priority === 'high').slice(0, 5).map(task => `
- ${task.title} (Due: ${task.dueDate.toLocaleDateString()})
  Assignee: ${task.assignee || 'Unassigned'}
  Estimated: ${task.estimatedHours} hours
`).join('')}
`;
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private getExpectedResolutionTime(priority: string, type: string): number {
    // Expected resolution times in milliseconds
    const baseTimes = {
      'critical': 4 * 60 * 60 * 1000, // 4 hours
      'major': 24 * 60 * 60 * 1000,   // 24 hours
      'minor': 72 * 60 * 60 * 1000    // 72 hours
    };

    const typeMultipliers = {
      'accessibility': 1.2,
      'visual-regression': 1.0,
      'contrast': 0.8,
      'responsive': 1.1,
      'performance': 1.5
    };

    const baseTime = baseTimes[priority as keyof typeof baseTimes] || baseTimes.minor;
    const multiplier = typeMultipliers[type as keyof typeof typeMultipliers] || 1.0;

    return baseTime * multiplier;
  }

  private calculateQualityScore(member: string, assignedIssues: Issue[], resolvedIssues: Issue[]): number {
    let score = 0;

    // Resolution rate (40% of score)
    const resolutionRate = assignedIssues.length > 0 ? (resolvedIssues.length / assignedIssues.length) : 0;
    score += resolutionRate * 40;

    // Speed factor (30% of score) - bonus for resolving issues quickly
    const avgResolutionTime = resolvedIssues.length > 0 
      ? resolvedIssues.reduce((sum, issue) => {
          const time = issue.resolvedAt!.getTime() - issue.createdAt.getTime();
          const expected = this.getExpectedResolutionTime(issue.priority, issue.type);
          return sum + Math.min(1, expected / time); // Score higher for faster resolution
        }, 0) / resolvedIssues.length
      : 0;
    score += avgResolutionTime * 30;

    // Quality factor (20% of score) - penalty for reopened issues
    const reopenedCount = resolvedIssues.filter(issue => 
      issue.comments.some(comment => 
        comment.type === 'status-change' && 
        comment.content.includes('open') &&
        comment.timestamp > (issue.resolvedAt || new Date(0))
      )
    ).length;
    const qualityFactor = resolvedIssues.length > 0 ? 1 - (reopenedCount / resolvedIssues.length) : 1;
    score += qualityFactor * 20;

    // Activity factor (10% of score) - bonus for being active
    const activityFactor = Math.min(1, assignedIssues.length / 10); // Normalize to max 10 issues
    score += activityFactor * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateDueDate(issue: Issue): Date {
    const dueDate = new Date(issue.createdAt);
    
    // Add days based on priority
    const daysToAdd = {
      'high': 1,
      'medium': 3,
      'low': 7
    };

    dueDate.setDate(dueDate.getDate() + daysToAdd[issue.priority]);
    return dueDate;
  }

  private estimateHours(issue: Issue): number {
    // Estimate hours based on type and severity
    const baseHours = {
      'critical': 8,
      'major': 4,
      'minor': 2
    };

    const typeMultipliers = {
      'accessibility': 1.2,
      'visual-regression': 1.0,
      'contrast': 0.8,
      'responsive': 1.1,
      'performance': 1.5
    };

    const base = baseHours[issue.severity];
    const multiplier = typeMultipliers[issue.type] || 1.0;

    return Math.ceil(base * multiplier);
  }

  private generateId(): string {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}