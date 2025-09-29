import { promises as fs } from 'fs';
import path from 'path';
import { ErrorReport, ErrorContext, ErrorStatistics } from './ErrorHandler';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: 'screenshot' | 'accessibility' | 'comparison' | 'system' | 'recovery';
  message: string;
  context?: ErrorContext;
  error?: Error;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

export interface LogFilter {
  level?: 'error' | 'warn' | 'info' | 'debug';
  category?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  operation?: string;
  page?: string;
  theme?: 'light' | 'dark';
}

export interface ErrorAnalysis {
  summary: ErrorAnalysisSummary;
  patterns: ErrorPattern[];
  recommendations: string[];
  trends: ErrorTrend[];
}

export interface ErrorAnalysisSummary {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByLevel: Record<string, number>;
  mostCommonErrors: Array<{ message: string; count: number }>;
  recoveryRate: number;
  timeRange: { start: Date; end: Date };
}

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  category: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface ErrorTrend {
  period: string;
  errorCount: number;
  recoveryCount: number;
  categories: Record<string, number>;
}

export class ErrorLogger {
  private logEntries: LogEntry[] = [];
  private logDirectory: string;
  private maxLogEntries: number;
  private logLevel: 'error' | 'warn' | 'info' | 'debug';

  constructor(
    logDirectory: string = 'test-results/error-logs',
    maxLogEntries: number = 10000,
    logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info'
  ) {
    this.logDirectory = logDirectory;
    this.maxLogEntries = maxLogEntries;
    this.logLevel = logLevel;
  }

  /**
   * Log an error with full context
   */
  async logError(
    message: string,
    error: Error,
    context?: ErrorContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: 'error',
      category: this.categorizeError(error, context),
      message,
      context,
      error,
      metadata,
      stackTrace: error.stack
    };

    await this.addLogEntry(logEntry);
  }

  /**
   * Log a warning
   */
  async logWarning(
    message: string,
    context?: ErrorContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.shouldLog('warn')) return;

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: 'warn',
      category: context?.operation ? this.categorizeByOperation(context.operation) : 'system',
      message,
      context,
      metadata
    };

    await this.addLogEntry(logEntry);
  }

  /**
   * Log an info message
   */
  async logInfo(
    message: string,
    category: string = 'system',
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.shouldLog('info')) return;

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: 'info',
      category,
      message,
      metadata
    };

    await this.addLogEntry(logEntry);
  }

  /**
   * Log debug information
   */
  async logDebug(
    message: string,
    category: string = 'system',
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.shouldLog('debug')) return;

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: 'debug',
      category,
      message,
      metadata
    };

    await this.addLogEntry(logEntry);
  }

  /**
   * Log recovery attempt
   */
  async logRecovery(
    operation: string,
    success: boolean,
    attempt: number,
    context?: ErrorContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    const message = success 
      ? `Recovery successful for ${operation} on attempt ${attempt}`
      : `Recovery failed for ${operation} on attempt ${attempt}`;

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: success ? 'info' : 'warn',
      category: 'recovery',
      message,
      context,
      metadata: {
        ...metadata,
        recoveryAttempt: attempt,
        recoverySuccess: success
      }
    };

    await this.addLogEntry(logEntry);
  }

  /**
   * Get filtered log entries
   */
  getLogEntries(filter?: LogFilter): LogEntry[] {
    let filteredEntries = [...this.logEntries];

    if (filter) {
      if (filter.level) {
        const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
        const minPriority = levelPriority[filter.level];
        filteredEntries = filteredEntries.filter(entry => 
          levelPriority[entry.level] >= minPriority
        );
      }

      if (filter.category) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.category === filter.category
        );
      }

      if (filter.timeRange) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.timestamp >= filter.timeRange!.start && 
          entry.timestamp <= filter.timeRange!.end
        );
      }

      if (filter.operation) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.context?.operation === filter.operation
        );
      }

      if (filter.page) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.context?.page === filter.page
        );
      }

      if (filter.theme) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.context?.theme === filter.theme
        );
      }
    }

    return filteredEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Analyze error patterns and generate insights
   */
  analyzeErrors(timeRange?: { start: Date; end: Date }): ErrorAnalysis {
    const entries = this.getLogEntries(timeRange ? { timeRange } : undefined);
    const errorEntries = entries.filter(entry => entry.level === 'error');

    const summary = this.generateErrorSummary(errorEntries, timeRange);
    const patterns = this.identifyErrorPatterns(errorEntries);
    const recommendations = this.generateRecommendations(patterns, summary);
    const trends = this.analyzeTrends(entries);

    return {
      summary,
      patterns,
      recommendations,
      trends
    };
  }

  /**
   * Export logs to file
   */
  async exportLogs(
    filename?: string,
    filter?: LogFilter,
    format: 'json' | 'csv' | 'txt' = 'json'
  ): Promise<string> {
    await this.ensureLogDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `error-log-${timestamp}.${format}`;
    const filepath = path.join(this.logDirectory, filename || defaultFilename);

    const entries = this.getLogEntries(filter);

    switch (format) {
      case 'json':
        await fs.writeFile(filepath, JSON.stringify(entries, null, 2));
        break;
      case 'csv':
        await this.exportToCSV(filepath, entries);
        break;
      case 'txt':
        await this.exportToText(filepath, entries);
        break;
    }

    return filepath;
  }

  /**
   * Clear old log entries
   */
  clearOldEntries(olderThanDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    this.logEntries = this.logEntries.filter(entry => 
      entry.timestamp > cutoffDate
    );
  }

  /**
   * Get error statistics
   */
  getStatistics(): ErrorStatistics {
    const errorEntries = this.logEntries.filter(entry => entry.level === 'error');
    const recoveryEntries = this.logEntries.filter(entry => 
      entry.category === 'recovery' && entry.metadata?.recoverySuccess
    );

    const errorsByOperation: Record<string, number> = {};
    const errorsByResolution: Record<string, number> = {};

    errorEntries.forEach(entry => {
      const operation = entry.context?.operation || 'unknown';
      errorsByOperation[operation] = (errorsByOperation[operation] || 0) + 1;
    });

    // Mock resolution data since we don't track it directly in logs
    errorsByResolution['retry'] = recoveryEntries.length;
    errorsByResolution['fail'] = errorEntries.length - recoveryEntries.length;

    const mostCommonErrors = this.getMostCommonErrors(errorEntries);

    return {
      totalErrors: errorEntries.length,
      errorsByOperation,
      errorsByResolution,
      recoverySuccessRate: errorEntries.length > 0 ? recoveryEntries.length / errorEntries.length : 0,
      mostCommonErrors
    };
  }

  private async addLogEntry(entry: LogEntry): Promise<void> {
    this.logEntries.push(entry);

    // Maintain max entries limit
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.maxLogEntries);
    }

    // Write to console for immediate feedback
    this.writeToConsole(entry);

    // Persist critical errors immediately
    if (entry.level === 'error') {
      await this.persistLogEntry(entry);
    }
  }

  private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
    return levelPriority[level] >= levelPriority[this.logLevel];
  }

  private categorizeError(error: Error, context?: ErrorContext): string {
    if (context?.operation) {
      return this.categorizeByOperation(context.operation);
    }

    if (error.message.includes('screenshot')) return 'screenshot';
    if (error.message.includes('accessibility') || error.message.includes('axe')) return 'accessibility';
    if (error.message.includes('comparison') || error.message.includes('image')) return 'comparison';
    
    return 'system';
  }

  private categorizeByOperation(operation: string): string {
    if (operation.includes('screenshot')) return 'screenshot';
    if (operation.includes('accessibility')) return 'accessibility';
    if (operation.includes('comparison')) return 'comparison';
    return 'system';
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    switch (entry.level) {
      case 'error':
        console.error(`${prefix} ${entry.message}`, entry.error);
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}`);
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${entry.message}`);
        break;
    }
  }

  private async persistLogEntry(entry: LogEntry): Promise<void> {
    try {
      await this.ensureLogDirectory();
      const filename = `error-${entry.timestamp.toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.logDirectory, filename);
      
      // Append to daily log file
      let existingLogs: LogEntry[] = [];
      try {
        const content = await fs.readFile(filepath, 'utf-8');
        existingLogs = JSON.parse(content);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
      }

      existingLogs.push(entry);
      await fs.writeFile(filepath, JSON.stringify(existingLogs, null, 2));
    } catch (error) {
      console.error('Failed to persist log entry:', error);
    }
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private generateErrorSummary(
    errorEntries: LogEntry[],
    timeRange?: { start: Date; end: Date }
  ): ErrorAnalysisSummary {
    const errorsByCategory: Record<string, number> = {};
    const errorsByLevel: Record<string, number> = {};
    const errorMessages = new Map<string, number>();

    errorEntries.forEach(entry => {
      errorsByCategory[entry.category] = (errorsByCategory[entry.category] || 0) + 1;
      errorsByLevel[entry.level] = (errorsByLevel[entry.level] || 0) + 1;
      
      const message = entry.message;
      errorMessages.set(message, (errorMessages.get(message) || 0) + 1);
    });

    const mostCommonErrors = Array.from(errorMessages.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recoveryEntries = this.logEntries.filter(entry => 
      entry.category === 'recovery' && entry.metadata?.recoverySuccess
    );
    const recoveryRate = errorEntries.length > 0 ? recoveryEntries.length / errorEntries.length : 0;

    const start = timeRange?.start || (errorEntries.length > 0 ? 
      new Date(Math.min(...errorEntries.map(e => e.timestamp.getTime()))) : new Date());
    const end = timeRange?.end || (errorEntries.length > 0 ? 
      new Date(Math.max(...errorEntries.map(e => e.timestamp.getTime()))) : new Date());

    return {
      totalErrors: errorEntries.length,
      errorsByCategory,
      errorsByLevel,
      mostCommonErrors,
      recoveryRate,
      timeRange: { start, end }
    };
  }

  private identifyErrorPatterns(errorEntries: LogEntry[]): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    
    // Pattern 1: Repeated screenshot failures
    const screenshotErrors = errorEntries.filter(e => e.category === 'screenshot');
    if (screenshotErrors.length > 5) {
      patterns.push({
        pattern: 'High screenshot failure rate',
        frequency: screenshotErrors.length,
        category: 'screenshot',
        impact: 'high',
        suggestion: 'Check browser stability and page load times. Consider increasing timeouts.'
      });
    }

    // Pattern 2: Accessibility tool failures
    const accessibilityErrors = errorEntries.filter(e => e.category === 'accessibility');
    if (accessibilityErrors.length > 3) {
      patterns.push({
        pattern: 'Accessibility tool failures',
        frequency: accessibilityErrors.length,
        category: 'accessibility',
        impact: 'medium',
        suggestion: 'Verify axe-core integration and page readiness before accessibility audits.'
      });
    }

    // Pattern 3: Timeout errors
    const timeoutErrors = errorEntries.filter(e => 
      e.error?.message.includes('timeout') || e.error?.message.includes('Timeout')
    );
    if (timeoutErrors.length > 5) {
      patterns.push({
        pattern: 'Frequent timeout errors',
        frequency: timeoutErrors.length,
        category: 'system',
        impact: 'high',
        suggestion: 'Increase timeout values and optimize page load performance.'
      });
    }

    return patterns;
  }

  private generateRecommendations(patterns: ErrorPattern[], summary: ErrorAnalysisSummary): string[] {
    const recommendations: string[] = [];

    patterns.forEach(pattern => {
      recommendations.push(pattern.suggestion);
    });

    if (summary.recoveryRate < 0.5) {
      recommendations.push('Low recovery rate detected. Consider implementing additional fallback mechanisms.');
    }

    if (summary.errorsByCategory['screenshot'] > summary.totalErrors * 0.4) {
      recommendations.push('Screenshot errors are dominant. Focus on browser stability improvements.');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private analyzeTrends(entries: LogEntry[]): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const hourlyData = new Map<string, { errors: number; recoveries: number; categories: Record<string, number> }>();

    entries.forEach(entry => {
      const hour = entry.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { errors: 0, recoveries: 0, categories: {} });
      }

      const data = hourlyData.get(hour)!;
      
      if (entry.level === 'error') {
        data.errors++;
      }
      
      if (entry.category === 'recovery' && entry.metadata?.recoverySuccess) {
        data.recoveries++;
      }

      data.categories[entry.category] = (data.categories[entry.category] || 0) + 1;
    });

    hourlyData.forEach((data, period) => {
      trends.push({
        period,
        errorCount: data.errors,
        recoveryCount: data.recoveries,
        categories: data.categories
      });
    });

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  private getMostCommonErrors(errorEntries: LogEntry[]): Array<{ error: string; count: number }> {
    const errorCounts = new Map<string, number>();
    
    errorEntries.forEach(entry => {
      const errorKey = entry.error ? `${entry.error.name}: ${entry.error.message}` : entry.message;
      errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
    });

    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private async exportToCSV(filepath: string, entries: LogEntry[]): Promise<void> {
    const headers = ['ID', 'Timestamp', 'Level', 'Category', 'Message', 'Operation', 'Page', 'Theme', 'Error'];
    const rows = entries.map(entry => [
      entry.id,
      entry.timestamp.toISOString(),
      entry.level,
      entry.category,
      entry.message,
      entry.context?.operation || '',
      entry.context?.page || '',
      entry.context?.theme || '',
      entry.error?.message || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    await fs.writeFile(filepath, csvContent);
  }

  private async exportToText(filepath: string, entries: LogEntry[]): Promise<void> {
    const textContent = entries
      .map(entry => {
        const timestamp = entry.timestamp.toISOString();
        const context = entry.context ? 
          ` [${entry.context.operation}${entry.context.page ? `:${entry.context.page}` : ''}${entry.context.theme ? `:${entry.context.theme}` : ''}]` : '';
        const error = entry.error ? `\n  Error: ${entry.error.message}` : '';
        return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]${context} ${entry.message}${error}`;
      })
      .join('\n\n');

    await fs.writeFile(filepath, textContent);
  }
}