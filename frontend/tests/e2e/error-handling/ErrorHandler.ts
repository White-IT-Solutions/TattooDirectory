import { Page } from '@playwright/test';

export interface ErrorContext {
  operation: string;
  page?: string;
  theme?: 'light' | 'dark';
  viewport?: { width: number; height: number };
  timestamp: Date;
  attempt: number;
  maxRetries: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ErrorReport {
  id: string;
  context: ErrorContext;
  error: Error;
  recoveryAttempted: boolean;
  recoverySuccessful: boolean;
  fallbackUsed?: string;
  resolution: 'retry' | 'fallback' | 'skip' | 'fail';
  timestamp: Date;
}

export class ErrorHandler {
  private errorReports: ErrorReport[] = [];
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      'TimeoutError',
      'NetworkError',
      'ProtocolError',
      'Target closed',
      'Page crashed',
      'Navigation timeout'
    ]
  };

  /**
   * Execute operation with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'attempt' | 'timestamp'>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      const errorContext: ErrorContext = {
        ...context,
        attempt,
        maxRetries: retryConfig.maxRetries,
        timestamp: new Date()
      };

      try {
        const result = await operation();
        
        // Log successful recovery if this wasn't the first attempt
        if (attempt > 1) {
          this.logRecovery(errorContext, lastError!, true);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError, retryConfig.retryableErrors)) {
          this.logError(errorContext, lastError, false, 'fail');
          throw lastError;
        }

        // Log retry attempt
        console.warn(`Attempt ${attempt}/${retryConfig.maxRetries} failed for ${context.operation}:`, lastError.message);

        // Don't wait after the last attempt
        if (attempt < retryConfig.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, retryConfig);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    this.logError(context, lastError!, true, 'fail');
    throw new Error(`Operation ${context.operation} failed after ${retryConfig.maxRetries} attempts: ${lastError!.message}`);
  }

  /**
   * Handle screenshot capture errors with fallback mechanisms
   */
  async handleScreenshotError(
    operation: () => Promise<Buffer>,
    context: ErrorContext,
    fallbacks: Array<() => Promise<Buffer>> = []
  ): Promise<Buffer> {
    try {
      return await this.executeWithRetry(operation, context);
    } catch (primaryError) {
      console.warn(`Primary screenshot method failed: ${primaryError.message}`);

      // Try fallback methods
      for (let i = 0; i < fallbacks.length; i++) {
        try {
          console.log(`Attempting fallback method ${i + 1}/${fallbacks.length}`);
          const result = await fallbacks[i]();
          
          this.logError(context, primaryError as Error, true, 'fallback');
          return result;
        } catch (fallbackError) {
          console.warn(`Fallback method ${i + 1} failed:`, fallbackError.message);
        }
      }

      // All methods failed
      this.logError(context, primaryError as Error, true, 'fail');
      throw new Error(`Screenshot capture failed: ${primaryError.message}`);
    }
  }

  /**
   * Handle accessibility tool failures with graceful degradation
   */
  async handleAccessibilityError<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallbackResult?: T
  ): Promise<T> {
    try {
      return await this.executeWithRetry(operation, context, {
        maxRetries: 2, // Fewer retries for accessibility tools
        retryableErrors: ['TimeoutError', 'ProtocolError', 'Target closed']
      });
    } catch (error) {
      console.warn(`Accessibility tool failed: ${error.message}`);
      
      if (fallbackResult !== undefined) {
        this.logError(context, error as Error, true, 'fallback');
        return fallbackResult;
      }

      this.logError(context, error as Error, false, 'fail');
      throw error;
    }
  }

  /**
   * Handle image comparison failures with alternative algorithms
   */
  async handleComparisonError<T>(
    primaryComparison: () => Promise<T>,
    fallbackComparison: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    try {
      return await this.executeWithRetry(primaryComparison, context);
    } catch (primaryError) {
      console.warn(`Primary comparison method failed: ${primaryError.message}`);
      
      try {
        const result = await fallbackComparison();
        this.logError(context, primaryError as Error, true, 'fallback');
        return result;
      } catch (fallbackError) {
        this.logError(context, primaryError as Error, true, 'fail');
        throw new Error(`Both comparison methods failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Handle page load and navigation errors
   */
  async handlePageError(
    page: Page,
    operation: () => Promise<void>,
    context: ErrorContext
  ): Promise<void> {
    const pageErrorHandler = (error: Error) => {
      console.warn(`Page error detected: ${error.message}`);
    };

    const consoleHandler = (msg: any) => {
      if (msg.type() === 'error') {
        console.warn(`Console error: ${msg.text()}`);
      }
    };

    try {
      // Set up error listeners
      page.on('pageerror', pageErrorHandler);
      page.on('console', consoleHandler);

      await this.executeWithRetry(operation, context, {
        retryableErrors: [
          ...this.defaultRetryConfig.retryableErrors,
          'net::ERR_INTERNET_DISCONNECTED',
          'net::ERR_NAME_NOT_RESOLVED',
          'net::ERR_CONNECTION_REFUSED'
        ]
      });
    } finally {
      // Clean up listeners
      page.off('pageerror', pageErrorHandler);
      page.off('console', consoleHandler);
    }
  }

  /**
   * Generate comprehensive error report
   */
  generateErrorReport(): {
    summary: ErrorSummary;
    reports: ErrorReport[];
    recommendations: string[];
  } {
    const summary = this.calculateErrorSummary();
    const recommendations = this.generateRecommendations();

    return {
      summary,
      reports: [...this.errorReports],
      recommendations
    };
  }

  /**
   * Clear error reports (useful for test cleanup)
   */
  clearErrorReports(): void {
    this.errorReports = [];
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): ErrorStatistics {
    const total = this.errorReports.length;
    const byOperation = this.groupBy(this.errorReports, 'context.operation');
    const byResolution = this.groupBy(this.errorReports, 'resolution');
    const recoveryRate = total > 0 ? 
      this.errorReports.filter(r => r.recoverySuccessful).length / total : 0;

    return {
      totalErrors: total,
      errorsByOperation: Object.fromEntries(
        Object.entries(byOperation).map(([key, value]) => [key, value.length])
      ),
      errorsByResolution: Object.fromEntries(
        Object.entries(byResolution).map(([key, value]) => [key, value.length])
      ),
      recoverySuccessRate: recoveryRate,
      mostCommonErrors: this.getMostCommonErrors()
    };
  }

  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || 
      error.name.includes(retryableError) ||
      error.constructor.name.includes(retryableError)
    );
  }

  private calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logError(
    context: ErrorContext,
    error: Error,
    recoveryAttempted: boolean,
    resolution: 'retry' | 'fallback' | 'skip' | 'fail'
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      context,
      error,
      recoveryAttempted,
      recoverySuccessful: resolution === 'fallback',
      resolution,
      timestamp: new Date()
    };

    this.errorReports.push(errorReport);
  }

  private logRecovery(context: ErrorContext, error: Error, successful: boolean): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      context,
      error,
      recoveryAttempted: true,
      recoverySuccessful: successful,
      resolution: successful ? 'retry' : 'fail',
      timestamp: new Date()
    };

    this.errorReports.push(errorReport);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateErrorSummary(): ErrorSummary {
    const total = this.errorReports.length;
    const recovered = this.errorReports.filter(r => r.recoverySuccessful).length;
    const failed = this.errorReports.filter(r => r.resolution === 'fail').length;

    return {
      totalErrors: total,
      recoveredErrors: recovered,
      failedErrors: failed,
      recoveryRate: total > 0 ? recovered / total : 0,
      mostCommonOperation: this.getMostCommonOperation(),
      errorTrends: this.getErrorTrends()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getErrorStatistics();

    if (stats.recoverySuccessRate < 0.5) {
      recommendations.push('Consider increasing retry attempts or improving error handling logic');
    }

    if (stats.errorsByOperation['screenshot'] > 5) {
      recommendations.push('High screenshot failure rate detected - check browser stability and page load times');
    }

    if (stats.errorsByOperation['accessibility'] > 3) {
      recommendations.push('Accessibility tool failures detected - verify axe-core integration and page readiness');
    }

    if (stats.errorsByResolution['fail'] > stats.totalErrors * 0.3) {
      recommendations.push('High failure rate - consider implementing additional fallback mechanisms');
    }

    return recommendations;
  }

  private groupBy<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = this.getNestedProperty(item, key);
      const group = groups[value] || [];
      group.push(item);
      groups[value] = group;
      return groups;
    }, {} as Record<string, T[]>);
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getMostCommonErrors(): Array<{ error: string; count: number }> {
    const errorCounts = new Map<string, number>();
    
    this.errorReports.forEach(report => {
      const errorKey = `${report.error.name}: ${report.error.message}`;
      errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
    });

    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getMostCommonOperation(): string {
    const operationCounts = new Map<string, number>();
    
    this.errorReports.forEach(report => {
      const operation = report.context.operation;
      operationCounts.set(operation, (operationCounts.get(operation) || 0) + 1);
    });

    let mostCommon = '';
    let maxCount = 0;
    
    operationCounts.forEach((count, operation) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = operation;
      }
    });

    return mostCommon;
  }

  private getErrorTrends(): Array<{ hour: number; count: number }> {
    const hourCounts = new Array(24).fill(0);
    
    this.errorReports.forEach(report => {
      const hour = report.timestamp.getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({ hour, count }));
  }
}

export interface ErrorSummary {
  totalErrors: number;
  recoveredErrors: number;
  failedErrors: number;
  recoveryRate: number;
  mostCommonOperation: string;
  errorTrends: Array<{ hour: number; count: number }>;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByOperation: Record<string, number>;
  errorsByResolution: Record<string, number>;
  recoverySuccessRate: number;
  mostCommonErrors: Array<{ error: string; count: number }>;
}