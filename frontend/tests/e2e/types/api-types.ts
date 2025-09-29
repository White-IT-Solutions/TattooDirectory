/**
 * API and service interface types for test framework integration
 */

// ============================================================================
// Service Interface Types
// ============================================================================

export interface ScreenshotService {
  capture(page: string, options: ScreenshotOptions): Promise<Screenshot>;
  captureElement(page: string, selector: string, options: ScreenshotOptions): Promise<Screenshot>;
  captureFullPage(page: string, options: ScreenshotOptions): Promise<Screenshot>;
  compareScreenshots(current: Screenshot, baseline: Screenshot): Promise<ComparisonResult>;
  updateBaseline(screenshot: Screenshot): Promise<void>;
  getBaseline(page: string, theme: ThemeMode, viewport: Viewport): Promise<Screenshot | null>;
}

export interface AccessibilityService {
  runAudit(page: string, options: AccessibilityOptions): Promise<AccessibilityReport>;
  checkContrast(page: string, options: ContrastOptions): Promise<ContrastReport>;
  validateARIA(page: string): Promise<ARIAReport>;
  testKeyboardNavigation(page: string): Promise<NavigationReport>;
  generateAccessibilityReport(results: AccessibilityReport[]): Promise<string>;
}

export interface ThemeService {
  switchTheme(page: string, theme: ThemeMode): Promise<void>;
  validateThemeApplication(page: string, theme: ThemeMode): Promise<ThemeReport>;
  testThemeTransition(page: string, fromTheme: ThemeMode, toTheme: ThemeMode): Promise<TransitionReport>;
  checkComponentTheme(page: string, component: string, theme: ThemeMode): Promise<ComponentReport>;
}

export interface ResponsiveService {
  testViewport(page: string, viewport: Viewport): Promise<ResponsiveReport>;
  validateTouchTargets(page: string, viewport: Viewport): Promise<TouchTargetReport>;
  checkLayoutAdaptation(page: string, viewports: Viewport[]): Promise<LayoutReport>;
  testMobileInteractions(page: string, viewport: Viewport): Promise<InteractionReport>;
}

export interface ReportingService {
  generateReport(results: TestResult[]): Promise<UIAuditReport>;
  classifyIssues(issues: Issue[]): Promise<ClassifiedIssues>;
  generateFixSuggestions(issues: Issue[]): Promise<FixSuggestion[]>;
  trackProgress(current: UIAuditReport, previous?: UIAuditReport): Promise<ProgressReport>;
  exportReport(report: UIAuditReport, format: 'html' | 'json' | 'pdf'): Promise<string>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ScreenshotOptions {
  theme: ThemeMode;
  viewport: Viewport;
  fullPage?: boolean;
  clip?: Region;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  omitBackground?: boolean;
  animations?: 'disabled' | 'allow';
  caret?: 'hide' | 'initial';
  scale?: 'css' | 'device';
  mask?: string[];
  timeout?: number;
}

export interface AccessibilityOptions {
  wcagLevel: 'A' | 'AA' | 'AAA';
  includedRules?: string[];
  excludedRules?: string[];
  tags?: string[];
  timeout?: number;
  context?: {
    include?: string[][];
    exclude?: string[][];
  };
}

export interface ContrastOptions {
  wcagLevel: 'AA' | 'AAA';
  includeHidden?: boolean;
  largeTextThreshold?: number;
  ignoreSelectors?: string[];
  timeout?: number;
}

export interface InteractionReport {
  id: string;
  pageUrl: string;
  theme: ThemeMode;
  viewport: Viewport;
  interactions: Array<{
    type: 'tap' | 'swipe' | 'pinch' | 'scroll';
    element: string;
    success: boolean;
    duration: number;
    issues: string[];
  }>;
  score: number;
  timestamp: Date;
  duration: number;
}

// ============================================================================
// Test Runner API Types
// ============================================================================

export interface TestRunnerAPI {
  // Test execution
  runTest(config: TestConfiguration): Promise<TestExecution>;
  runTestSuite(suiteId: string): Promise<TestExecution>;
  cancelTest(executionId: string): Promise<void>;
  
  // Results and reports
  getTestResults(executionId: string): Promise<UIAuditReport>;
  getTestHistory(suiteId: string, limit?: number): Promise<TestExecution[]>;
  compareResults(executionId1: string, executionId2: string): Promise<ProgressReport>;
  
  // Configuration management
  createTestSuite(suite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestSuite>;
  updateTestSuite(suiteId: string, updates: Partial<TestSuite>): Promise<TestSuite>;
  deleteTestSuite(suiteId: string): Promise<void>;
  getTestSuite(suiteId: string): Promise<TestSuite>;
  listTestSuites(): Promise<TestSuite[]>;
  
  // Baseline management
  updateBaselines(executionId: string, approvedScreenshots: string[]): Promise<void>;
  rollbackBaselines(suiteId: string, version: string): Promise<void>;
  getBaselineHistory(suiteId: string): Promise<Array<{
    version: string;
    timestamp: Date;
    changes: number;
  }>>;
  
  // Issue management
  getIssues(filters?: IssueFilters): Promise<Issue[]>;
  updateIssue(issueId: string, updates: Partial<Issue>): Promise<Issue>;
  resolveIssue(issueId: string, resolution: string): Promise<Issue>;
  bulkUpdateIssues(issueIds: string[], updates: Partial<Issue>): Promise<Issue[]>;
}

export interface IssueFilters {
  type?: IssueType[];
  severity?: SeverityLevel[];
  status?: IssueStatus[];
  page?: string[];
  theme?: ThemeMode[];
  assignee?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Webhook and Integration Types
// ============================================================================

export interface WebhookPayload {
  event: 'test.started' | 'test.completed' | 'test.failed' | 'regression.detected' | 'issue.created';
  timestamp: Date;
  executionId: string;
  suiteId: string;
  data: {
    summary?: AuditSummary;
    issues?: Issue[];
    regressions?: ComparisonResult[];
    errors?: TestError[];
  };
}

export interface CIIntegration {
  provider: 'github' | 'gitlab' | 'jenkins' | 'azure-devops';
  config: {
    token: string;
    repository?: string;
    project?: string;
    baseUrl?: string;
  };
  events: {
    commentOnPR: boolean;
    setStatus: boolean;
    uploadArtifacts: boolean;
    failBuild: boolean;
  };
}

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    mentions: string[];
  };
  teams?: {
    enabled: boolean;
    webhookUrl: string;
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers: Record<string, string>;
  };
}

// ============================================================================
// Storage and Persistence Types
// ============================================================================

export interface StorageProvider {
  // Screenshot storage
  saveScreenshot(screenshot: Screenshot, data: Buffer): Promise<string>;
  getScreenshot(path: string): Promise<Buffer>;
  deleteScreenshot(path: string): Promise<void>;
  listScreenshots(prefix: string): Promise<string[]>;
  
  // Report storage
  saveReport(report: UIAuditReport): Promise<string>;
  getReport(reportId: string): Promise<UIAuditReport>;
  listReports(filters?: ReportFilters): Promise<UIAuditReport[]>;
  deleteReport(reportId: string): Promise<void>;
  
  // Configuration storage
  saveConfig(config: TestSuite): Promise<string>;
  getConfig(configId: string): Promise<TestSuite>;
  listConfigs(): Promise<TestSuite[]>;
  deleteConfig(configId: string): Promise<void>;
}

export interface ReportFilters {
  suiteId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: TestStatus[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// Import types from main index
// ============================================================================

export {
  Screenshot,
  ComparisonResult,
  VisualReport,
  AccessibilityReport,
  ContrastReport,
  ARIAReport,
  NavigationReport,
  ResponsiveReport,
  ThemeReport,
  TransitionReport,
  ComponentReport,
  TouchTargetReport,
  LayoutReport,
  Issue,
  FixSuggestion,
  ClassifiedIssues,
  ProgressReport,
  PageReport,
  TestResult,
  UIAuditReport,
  AuditSummary,
  IssuesByCategory,
  Recommendation,
  TestError,
  ErrorReport,
  ThemeMode,
  SeverityLevel,
  IssueType,
  TestStatus,
  IssueStatus,
  Viewport,
  Region,
  TestConfiguration
} from './index';