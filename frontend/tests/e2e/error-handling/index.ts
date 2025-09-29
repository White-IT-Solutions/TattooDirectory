// Error Handling and Recovery System
// Provides robust error handling, retry logic, and fallback mechanisms for UI/UX testing

export { ErrorHandler, ErrorContext, RetryConfig, ErrorReport, ErrorSummary, ErrorStatistics } from './ErrorHandler';
export { ScreenshotFallbacks, FallbackScreenshotOptions, ScreenshotMetadata } from './ScreenshotFallbacks';
export { 
  AccessibilityErrorHandler, 
  AccessibilityFallbackResult, 
  AccessibilityViolation, 
  ViolationNode, 
  AccessibilityPass,
  ToolValidationResult,
  AccessibilityStatistics 
} from './AccessibilityErrorHandler';
export { 
  ErrorLogger, 
  LogEntry, 
  LogFilter, 
  ErrorAnalysis, 
  ErrorAnalysisSummary, 
  ErrorPattern, 
  ErrorTrend 
} from './ErrorLogger';
export { 
  RobustTestRunner, 
  TestOperation, 
  RobustTestConfig, 
  TestResult, 
  BatchTestResult 
} from './RobustTestRunner';

// Re-export commonly used types for convenience
export type ErrorLevel = 'error' | 'warn' | 'info' | 'debug';
export type ErrorCategory = 'screenshot' | 'accessibility' | 'comparison' | 'system' | 'recovery';
export type RecoveryMethod = 'retry' | 'fallback' | 'skip' | 'fail';
export type TestTheme = 'light' | 'dark';

/**
 * Create a configured RobustTestRunner instance
 */
export function createRobustTestRunner(config?: Partial<import('./RobustTestRunner').RobustTestConfig>) {
  return new (require('./RobustTestRunner').RobustTestRunner)(config);
}

/**
 * Create a standalone ErrorHandler instance
 */
export function createErrorHandler() {
  return new (require('./ErrorHandler').ErrorHandler)();
}

/**
 * Create a configured ErrorLogger instance
 */
export function createErrorLogger(
  logDirectory?: string,
  maxLogEntries?: number,
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
) {
  return new (require('./ErrorLogger').ErrorLogger)(logDirectory, maxLogEntries, logLevel);
}

/**
 * Utility function to create a test operation with error handling
 */
export function createTestOperation(
  name: string,
  operation: () => Promise<any>,
  options?: {
    fallbacks?: Array<() => Promise<any>>;
    maxRetries?: number;
    baseDelayMs?: number;
    backoffMultiplier?: number;
    context?: Partial<ErrorContext>;
  }
): import('./RobustTestRunner').TestOperation {
  return {
    name,
    operation,
    fallbacks: options?.fallbacks,
    retryConfig: {
      maxRetries: options?.maxRetries,
      baseDelayMs: options?.baseDelayMs,
      backoffMultiplier: options?.backoffMultiplier
    },
    context: options?.context
  };
}

/**
 * Default error handling configuration
 */
export const DEFAULT_ERROR_CONFIG: import('./RobustTestRunner').RobustTestConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  backoffMultiplier: 2,
  enableFallbacks: true,
  enableLogging: true,
  logLevel: 'info',
  gracefulDegradation: true
};

/**
 * Common retry configurations for different operation types
 */
export const RETRY_CONFIGS = {
  screenshot: {
    maxRetries: 3,
    baseDelayMs: 1000,
    backoffMultiplier: 2
  },
  accessibility: {
    maxRetries: 2,
    baseDelayMs: 2000,
    backoffMultiplier: 1.5
  },
  navigation: {
    maxRetries: 3,
    baseDelayMs: 2000,
    backoffMultiplier: 2
  },
  comparison: {
    maxRetries: 2,
    baseDelayMs: 500,
    backoffMultiplier: 1.5
  }
};

/**
 * Common error patterns and their suggested solutions
 */
export const ERROR_SOLUTIONS = {
  'TimeoutError': 'Increase timeout values or optimize page load performance',
  'ProtocolError': 'Check browser stability and restart if necessary',
  'Target closed': 'Ensure page/browser context remains open during operations',
  'Page crashed': 'Investigate memory usage and browser stability',
  'NetworkError': 'Check network connectivity and retry with exponential backoff',
  'screenshot': 'Verify page readiness and consider fallback capture methods',
  'accessibility': 'Ensure axe-core is properly loaded and page is ready',
  'comparison': 'Check image formats and consider alternative comparison algorithms'
};

/**
 * Utility function to determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    'TimeoutError',
    'NetworkError',
    'ProtocolError',
    'Target closed',
    'Page crashed',
    'Navigation timeout',
    'net::ERR_INTERNET_DISCONNECTED',
    'net::ERR_NAME_NOT_RESOLVED',
    'net::ERR_CONNECTION_REFUSED'
  ];

  return retryablePatterns.some(pattern => 
    error.message.includes(pattern) || 
    error.name.includes(pattern) ||
    error.constructor.name.includes(pattern)
  );
}

/**
 * Utility function to categorize errors
 */
export function categorizeError(error: Error, operation?: string): ErrorCategory {
  if (operation) {
    if (operation.includes('screenshot')) return 'screenshot';
    if (operation.includes('accessibility')) return 'accessibility';
    if (operation.includes('comparison')) return 'comparison';
    if (operation.includes('recovery')) return 'recovery';
  }

  if (error.message.includes('screenshot')) return 'screenshot';
  if (error.message.includes('accessibility') || error.message.includes('axe')) return 'accessibility';
  if (error.message.includes('comparison') || error.message.includes('image')) return 'comparison';
  
  return 'system';
}

/**
 * Utility function to calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = 1000,
  backoffMultiplier: number = 2,
  maxDelayMs: number = 30000
): number {
  const delay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Utility function to create error context
 */
export function createErrorContext(
  operation: string,
  options?: {
    page?: string;
    theme?: TestTheme;
    viewport?: { width: number; height: number };
    maxRetries?: number;
  }
): ErrorContext {
  return {
    operation,
    page: options?.page,
    theme: options?.theme,
    viewport: options?.viewport,
    timestamp: new Date(),
    attempt: 1,
    maxRetries: options?.maxRetries || 3
  };
}