import { Page } from '@playwright/test';
import { ErrorHandler, ErrorContext } from './ErrorHandler';
import { ScreenshotFallbacks } from './ScreenshotFallbacks';
import { AccessibilityErrorHandler } from './AccessibilityErrorHandler';
import { ErrorLogger } from './ErrorLogger';

export interface TestOperation {
  name: string;
  operation: () => Promise<any>;
  fallbacks?: Array<() => Promise<any>>;
  retryConfig?: {
    maxRetries?: number;
    baseDelayMs?: number;
    backoffMultiplier?: number;
  };
  context?: Partial<ErrorContext>;
}

export interface RobustTestConfig {
  maxRetries: number;
  baseDelayMs: number;
  backoffMultiplier: number;
  enableFallbacks: boolean;
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  gracefulDegradation: boolean;
}

export interface TestResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  fallbackUsed: boolean;
  executionTime: number;
  recoveryMethod?: string;
}

export interface BatchTestResult {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  fallbacksUsed: number;
  totalExecutionTime: number;
  results: Array<{ name: string; result: TestResult }>;
  errorSummary: {
    criticalErrors: number;
    recoverableErrors: number;
    totalErrors: number;
  };
}

export class RobustTestRunner {
  private errorHandler: ErrorHandler;
  private screenshotFallbacks: ScreenshotFallbacks;
  private accessibilityErrorHandler: AccessibilityErrorHandler;
  private errorLogger: ErrorLogger;
  private config: RobustTestConfig;

  constructor(config: Partial<RobustTestConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelayMs: 1000,
      backoffMultiplier: 2,
      enableFallbacks: true,
      enableLogging: true,
      logLevel: 'info',
      gracefulDegradation: true,
      ...config
    };

    this.errorHandler = new ErrorHandler();
    this.screenshotFallbacks = new ScreenshotFallbacks(this.errorHandler);
    this.accessibilityErrorHandler = new AccessibilityErrorHandler(this.errorHandler);
    this.errorLogger = new ErrorLogger(
      'test-results/error-logs',
      10000,
      this.config.logLevel
    );
  }

  /**
   * Execute a single test operation with full error handling
   */
  async executeRobustTest<T>(
    operation: TestOperation,
    page?: Page,
    theme?: 'light' | 'dark'
  ): Promise<TestResult<T>> {
    const startTime = Date.now();
    const context: ErrorContext = {
      operation: operation.name,
      page: operation.context?.page,
      theme: theme || operation.context?.theme,
      viewport: page?.viewportSize() || operation.context?.viewport,
      timestamp: new Date(),
      attempt: 1,
      maxRetries: operation.retryConfig?.maxRetries || this.config.maxRetries
    };

    if (this.config.enableLogging) {
      await this.errorLogger.logInfo(`Starting test operation: ${operation.name}`, 'system', {
        context,
        config: operation.retryConfig
      });
    }

    try {
      // Execute primary operation with retry logic
      const result = await this.errorHandler.executeWithRetry(
        operation.operation,
        context,
        {
          maxRetries: operation.retryConfig?.maxRetries || this.config.maxRetries,
          baseDelayMs: operation.retryConfig?.baseDelayMs || this.config.baseDelayMs,
          backoffMultiplier: operation.retryConfig?.backoffMultiplier || this.config.backoffMultiplier
        }
      );

      const executionTime = Date.now() - startTime;

      if (this.config.enableLogging) {
        await this.errorLogger.logInfo(`Test operation completed successfully: ${operation.name}`, 'system', {
          executionTime,
          attempts: context.attempt
        });
      }

      return {
        success: true,
        result,
        attempts: context.attempt,
        fallbackUsed: false,
        executionTime
      };

    } catch (primaryError) {
      if (this.config.enableLogging) {
        await this.errorLogger.logError(
          `Primary operation failed: ${operation.name}`,
          primaryError as Error,
          context
        );
      }

      // Try fallback operations if enabled and available
      if (this.config.enableFallbacks && operation.fallbacks && operation.fallbacks.length > 0) {
        for (let i = 0; i < operation.fallbacks.length; i++) {
          try {
            if (this.config.enableLogging) {
              await this.errorLogger.logInfo(`Attempting fallback ${i + 1} for: ${operation.name}`, 'recovery');
            }

            const fallbackResult = await operation.fallbacks[i]();
            const executionTime = Date.now() - startTime;

            if (this.config.enableLogging) {
              await this.errorLogger.logRecovery(
                operation.name,
                true,
                i + 1,
                context,
                { fallbackMethod: `fallback_${i + 1}` }
              );
            }

            return {
              success: true,
              result: fallbackResult,
              attempts: context.attempt,
              fallbackUsed: true,
              executionTime,
              recoveryMethod: `fallback_${i + 1}`
            };

          } catch (fallbackError) {
            if (this.config.enableLogging) {
              await this.errorLogger.logWarning(
                `Fallback ${i + 1} failed for: ${operation.name}`,
                context,
                { fallbackError: fallbackError.message }
              );
            }
          }
        }
      }

      // All operations failed
      const executionTime = Date.now() - startTime;

      if (this.config.enableLogging) {
        await this.errorLogger.logError(
          `All operations failed for: ${operation.name}`,
          primaryError as Error,
          context,
          { totalFallbacksAttempted: operation.fallbacks?.length || 0 }
        );
      }

      if (this.config.gracefulDegradation) {
        return {
          success: false,
          error: primaryError as Error,
          attempts: context.attempt,
          fallbackUsed: operation.fallbacks ? operation.fallbacks.length > 0 : false,
          executionTime
        };
      } else {
        throw primaryError;
      }
    }
  }

  /**
   * Execute multiple test operations in batch with error handling
   */
  async executeBatchTests(
    operations: TestOperation[],
    page?: Page,
    theme?: 'light' | 'dark',
    continueOnFailure: boolean = true
  ): Promise<BatchTestResult> {
    const startTime = Date.now();
    const results: Array<{ name: string; result: TestResult }> = [];
    let successfulTests = 0;
    let failedTests = 0;
    let fallbacksUsed = 0;
    let criticalErrors = 0;
    let recoverableErrors = 0;

    if (this.config.enableLogging) {
      await this.errorLogger.logInfo(`Starting batch test execution`, 'system', {
        totalOperations: operations.length,
        continueOnFailure,
        theme
      });
    }

    for (const operation of operations) {
      try {
        const result = await this.executeRobustTest(operation, page, theme);
        results.push({ name: operation.name, result });

        if (result.success) {
          successfulTests++;
          if (result.fallbackUsed) {
            fallbacksUsed++;
            recoverableErrors++;
          }
        } else {
          failedTests++;
          criticalErrors++;
          
          if (!continueOnFailure) {
            if (this.config.enableLogging) {
              await this.errorLogger.logError(
                `Batch execution stopped due to critical failure in: ${operation.name}`,
                result.error!,
                { operation: operation.name, theme }
              );
            }
            break;
          }
        }

      } catch (error) {
        const failedResult: TestResult = {
          success: false,
          error: error as Error,
          attempts: 1,
          fallbackUsed: false,
          executionTime: 0
        };

        results.push({ name: operation.name, result: failedResult });
        failedTests++;
        criticalErrors++;

        if (this.config.enableLogging) {
          await this.errorLogger.logError(
            `Unexpected error in batch operation: ${operation.name}`,
            error as Error,
            { operation: operation.name, theme }
          );
        }

        if (!continueOnFailure) {
          break;
        }
      }
    }

    const totalExecutionTime = Date.now() - startTime;

    if (this.config.enableLogging) {
      await this.errorLogger.logInfo(`Batch test execution completed`, 'system', {
        totalTests: operations.length,
        successfulTests,
        failedTests,
        fallbacksUsed,
        totalExecutionTime,
        successRate: successfulTests / operations.length
      });
    }

    return {
      totalTests: operations.length,
      successfulTests,
      failedTests,
      fallbacksUsed,
      totalExecutionTime,
      results,
      errorSummary: {
        criticalErrors,
        recoverableErrors,
        totalErrors: criticalErrors + recoverableErrors
      }
    };
  }

  /**
   * Capture screenshot with full error handling and fallbacks
   */
  async captureRobustScreenshot(
    page: Page,
    pageName: string,
    theme: 'light' | 'dark',
    options: any = {}
  ): Promise<Buffer> {
    return await this.screenshotFallbacks.captureWithFallbacks(page, pageName, theme, options);
  }

  /**
   * Run accessibility audit with full error handling
   */
  async runRobustAccessibilityAudit(
    page: Page,
    pageName: string,
    theme: 'light' | 'dark',
    wcagLevel: 'AA' | 'AAA' = 'AA'
  ): Promise<any> {
    return await this.accessibilityErrorHandler.runAuditWithFallbacks(page, pageName, theme, wcagLevel);
  }

  /**
   * Handle page navigation with error recovery
   */
  async navigateRobustly(
    page: Page,
    url: string,
    options: any = {}
  ): Promise<void> {
    const operation: TestOperation = {
      name: 'page_navigation',
      operation: async () => {
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 30000,
          ...options
        });
      },
      fallbacks: [
        // Fallback 1: Reduce wait conditions
        async () => {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
          });
        },
        // Fallback 2: Basic navigation
        async () => {
          await page.goto(url, { timeout: 10000 });
        }
      ],
      context: { page: url }
    };

    const result = await this.executeRobustTest(operation, page);
    if (!result.success && result.error) {
      throw result.error;
    }
  }

  /**
   * Wait for element with error handling
   */
  async waitForElementRobustly(
    page: Page,
    selector: string,
    options: any = {}
  ): Promise<void> {
    const operation: TestOperation = {
      name: 'wait_for_element',
      operation: async () => {
        await page.waitForSelector(selector, {
          state: 'visible',
          timeout: 10000,
          ...options
        });
      },
      fallbacks: [
        // Fallback 1: Wait for attached state
        async () => {
          await page.waitForSelector(selector, {
            state: 'attached',
            timeout: 5000
          });
        },
        // Fallback 2: Check if element exists
        async () => {
          const element = await page.$(selector);
          if (!element) {
            throw new Error(`Element ${selector} not found`);
          }
        }
      ],
      context: { page: selector }
    };

    const result = await this.executeRobustTest(operation, page);
    if (!result.success && result.error) {
      throw result.error;
    }
  }

  /**
   * Generate comprehensive error report
   */
  async generateErrorReport(): Promise<{
    handlerReport: any;
    loggerAnalysis: any;
    recommendations: string[];
  }> {
    const handlerReport = this.errorHandler.generateErrorReport();
    const loggerAnalysis = this.errorLogger.analyzeErrors();
    
    const recommendations = [
      ...handlerReport.recommendations,
      ...loggerAnalysis.recommendations
    ];

    return {
      handlerReport,
      loggerAnalysis,
      recommendations: [...new Set(recommendations)]
    };
  }

  /**
   * Export all error data
   */
  async exportErrorData(directory: string = 'test-results/error-exports'): Promise<{
    handlerReport: string;
    logExport: string;
    combinedReport: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });
    
    // Export handler report
    const handlerReport = await this.errorHandler.generateErrorReport();
    const handlerPath = path.join(directory, `handler-report-${timestamp}.json`);
    await fs.writeFile(handlerPath, JSON.stringify(handlerReport, null, 2));

    // Export logs
    const logPath = await this.errorLogger.exportLogs(`error-logs-${timestamp}.json`);

    // Create combined report
    const combinedReport = {
      timestamp: new Date(),
      handlerReport,
      loggerAnalysis: this.errorLogger.analyzeErrors(),
      statistics: {
        handler: this.errorHandler.getErrorStatistics(),
        logger: this.errorLogger.getStatistics()
      }
    };

    const combinedPath = path.join(directory, `combined-error-report-${timestamp}.json`);
    await fs.mkdir(path.dirname(combinedPath), { recursive: true });
    await fs.writeFile(combinedPath, JSON.stringify(combinedReport, null, 2));

    return {
      handlerReport: handlerPath,
      logExport: logPath,
      combinedReport: combinedPath
    };
  }

  /**
   * Clear all error data
   */
  clearErrorData(): void {
    this.errorHandler.clearErrorReports();
    this.errorLogger.clearOldEntries(0); // Clear all entries
  }

  /**
   * Get current error statistics
   */
  getErrorStatistics(): {
    handler: any;
    logger: any;
    combined: {
      totalErrors: number;
      recoveryRate: number;
      mostProblematicOperation: string;
    };
  } {
    const handlerStats = this.errorHandler.getErrorStatistics();
    const loggerStats = this.errorLogger.getStatistics();

    return {
      handler: handlerStats,
      logger: loggerStats,
      combined: {
        totalErrors: handlerStats.totalErrors + loggerStats.totalErrors,
        recoveryRate: (handlerStats.recoverySuccessRate + loggerStats.recoverySuccessRate) / 2,
        mostProblematicOperation: this.getMostProblematicOperation(handlerStats, loggerStats)
      }
    };
  }

  private getMostProblematicOperation(handlerStats: any, loggerStats: any): string {
    const handlerMax = Object.entries(handlerStats.errorsByOperation)
      .reduce((max, [op, count]) => count > max.count ? { op, count } : max, { op: '', count: 0 });
    
    const loggerMax = Object.entries(loggerStats.errorsByOperation)
      .reduce((max, [op, count]) => count > max.count ? { op, count } : max, { op: '', count: 0 });

    return handlerMax.count > loggerMax.count ? handlerMax.op : loggerMax.op;
  }
}

// Import required modules at the top
import { promises as fs } from 'fs';
import path from 'path';