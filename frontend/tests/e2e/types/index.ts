/**
 * Comprehensive TypeScript interfaces and data models for UI/UX audit system
 * Supports visual regression testing, accessibility validation, and dark mode compatibility
 */

// ============================================================================
// Core Configuration Types
// ============================================================================

export interface Viewport {
  width: number;
  height: number;
  name: string;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export interface TestConfiguration {
  browsers: ('chromium' | 'firefox' | 'webkit')[];
  viewports: Viewport[];
  themes: ('light' | 'dark')[];
  pages: string[];
  baseUrl: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  headless: boolean;
}

export interface ScreenshotMetadata {
  userAgent: string;
  timestamp: Date;
  browser: string;
  devicePixelRatio: number;
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
  highContrast: boolean;
}

// ============================================================================
// Screenshot and Visual Testing Types
// ============================================================================

export interface Screenshot {
  id: string;
  page: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  timestamp: Date;
  imagePath: string;
  metadata: ScreenshotMetadata;
  hash?: string;
  fileSize?: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComparisonResult {
  screenshotId: string;
  baselineId?: string;
  hasDifferences: boolean;
  differencePercentage: number;
  pixelDifferences: number;
  diffImagePath?: string;
  affectedRegions: Region[];
  threshold: number;
  comparisonMethod: 'pixel' | 'structural' | 'perceptual';
  timestamp: Date;
}

export interface VisualReport {
  id: string;
  testRunId: string;
  page: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  screenshots: Screenshot[];
  comparisons: ComparisonResult[];
  hasRegressions: boolean;
  regressionCount: number;
  timestamp: Date;
  duration: number;
}

// ============================================================================
// Accessibility Testing Types
// ============================================================================

export interface ViolationNode {
  target: string[];
  html: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  any: Array<{
    id: string;
    data: any;
    relatedNodes: Array<{
      target: string[];
      html: string;
    }>;
  }>;
  all: any[];
  none: any[];
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: ViolationNode[];
}

export interface AccessibilityPass {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: ViolationNode[];
}

export interface AccessibilityReport {
  id: string;
  pageUrl: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  wcagLevel: 'A' | 'AA' | 'AAA';
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityViolation[];
  inapplicable: AccessibilityPass[];
  score: number;
  totalElements: number;
  timestamp: Date;
  duration: number;
  axeVersion: string;
}

// ============================================================================
// Contrast Analysis Types
// ============================================================================

export interface ContrastElement {
  selector: string;
  element: string;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'AA' | 'AAA';
  passes: boolean;
  textSize: 'normal' | 'large';
  fontSize: number;
  fontWeight: number;
  isGraphical: boolean;
  position: Region;
}

export interface ContrastReport {
  id: string;
  pageUrl: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  elements: ContrastElement[];
  overallScore: number;
  passCount: number;
  failureCount: number;
  totalElements: number;
  wcagAACompliance: number;
  wcagAAACompliance: number;
  timestamp: Date;
  duration: number;
}

// ============================================================================
// ARIA and Keyboard Navigation Types
// ============================================================================

export interface ARIAElement {
  selector: string;
  element: string;
  role: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaHidden?: boolean;
  tabIndex?: number;
  isValid: boolean;
  issues: string[];
}

export interface ARIAReport {
  id: string;
  pageUrl: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  elements: ARIAElement[];
  validElements: number;
  invalidElements: number;
  totalElements: number;
  score: number;
  timestamp: Date;
  duration: number;
}

export interface KeyboardNavigationElement {
  selector: string;
  element: string;
  isFocusable: boolean;
  tabIndex: number;
  focusOrder: number;
  hasVisibleFocus: boolean;
  isKeyboardAccessible: boolean;
  issues: string[];
}

export interface NavigationReport {
  id: string;
  pageUrl: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  elements: KeyboardNavigationElement[];
  focusableElements: number;
  accessibleElements: number;
  tabOrder: number[];
  hasLogicalTabOrder: boolean;
  score: number;
  timestamp: Date;
  duration: number;
}

// ============================================================================
// Mobile Responsiveness Types
// ============================================================================

export interface TouchTarget {
  selector: string;
  element: string;
  width: number;
  height: number;
  position: Region;
  meetsMinimumSize: boolean;
  hasAdequateSpacing: boolean;
  isAccessible: boolean;
  issues: string[];
}

export interface TouchTargetReport {
  id: string;
  pageUrl: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  touchTargets: TouchTarget[];
  validTargets: number;
  invalidTargets: number;
  totalTargets: number;
  score: number;
  timestamp: Date;
  duration: number;
}

export interface LayoutElement {
  selector: string;
  element: string;
  position: Region;
  isVisible: boolean;
  hasOverflow: boolean;
  isResponsive: boolean;
  breakpointBehavior: Record<string, boolean>;
  issues: string[];
}

export interface LayoutReport {
  id: string;
  pageUrl: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  elements: LayoutElement[];
  responsiveElements: number;
  problematicElements: number;
  totalElements: number;
  score: number;
  timestamp: Date;
  duration: number;
}

export interface ResponsiveReport {
  id: string;
  pageUrl: string;
  theme: 'light' | 'dark';
  viewports: Viewport[];
  touchTargetReport: TouchTargetReport;
  layoutReport: LayoutReport;
  overallScore: number;
  timestamp: Date;
  duration: number;
}

// ============================================================================
// Theme Testing Types
// ============================================================================

export interface ThemeElement {
  selector: string;
  element: string;
  lightModeStyles: Record<string, string>;
  darkModeStyles: Record<string, string>;
  hasProperContrast: boolean;
  transitionsSmootly: boolean;
  maintainsReadability: boolean;
  issues: string[];
}

export interface ThemeReport {
  id: string;
  pageUrl: string;
  viewport: Viewport;
  elements: ThemeElement[];
  lightModeScore: number;
  darkModeScore: number;
  transitionScore: number;
  overallScore: number;
  timestamp: Date;
  duration: number;
}

export interface TransitionReport {
  id: string;
  pageUrl: string;
  viewport: Viewport;
  transitionDuration: number;
  hasVisualArtifacts: boolean;
  maintainsLayout: boolean;
  preservesFocus: boolean;
  score: number;
  timestamp: Date;
  duration: number;
}

export interface ComponentReport {
  id: string;
  component: string;
  pageUrl: string;
  viewport: Viewport;
  lightModeCompliant: boolean;
  darkModeCompliant: boolean;
  transitionCompliant: boolean;
  contrastCompliant: boolean;
  issues: string[];
  score: number;
  timestamp: Date;
  duration: number;
}

// ============================================================================
// Issue Tracking and Classification Types
// ============================================================================

export interface Issue {
  id: string;
  type: 'visual' | 'accessibility' | 'contrast' | 'responsive' | 'theme' | 'keyboard' | 'aria';
  severity: 'critical' | 'major' | 'minor';
  category: 'functionality' | 'usability' | 'accessibility' | 'performance' | 'visual';
  page: string;
  theme: 'light' | 'dark' | 'both';
  viewport?: Viewport;
  element?: string;
  selector?: string;
  description: string;
  impact: string;
  screenshot?: string;
  diffImage?: string;
  fixSuggestion?: string;
  wcagCriteria?: string[];
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  assignee?: string;
  priority: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface FixSuggestion {
  issueId: string;
  type: 'css' | 'html' | 'javascript' | 'design' | 'content';
  title: string;
  description: string;
  codeExample?: string;
  resources: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  priority: number;
  automated: boolean;
}

export interface ClassifiedIssues {
  critical: Issue[];
  major: Issue[];
  minor: Issue[];
  byType: Record<Issue['type'], Issue[]>;
  byPage: Record<string, Issue[]>;
  byTheme: Record<'light' | 'dark' | 'both', Issue[]>;
  total: number;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

export interface ProgressMetrics {
  totalIssues: number;
  resolvedIssues: number;
  newIssues: number;
  regressionIssues: number;
  resolutionRate: number;
  averageResolutionTime: number;
  issuesByPriority: Record<Issue['severity'], number>;
  issuesByType: Record<Issue['type'], number>;
  pageProgress: Record<string, {
    total: number;
    resolved: number;
    percentage: number;
  }>;
  themeProgress: Record<'light' | 'dark', {
    total: number;
    resolved: number;
    percentage: number;
  }>;
}

export interface ProgressReport {
  id: string;
  currentRunId: string;
  previousRunId?: string;
  comparisonPeriod: {
    start: Date;
    end: Date;
  };
  metrics: ProgressMetrics;
  trends: {
    issueCreationRate: number;
    resolutionRate: number;
    qualityScore: number;
    accessibilityScore: number;
  };
  recommendations: string[];
  timestamp: Date;
}

// ============================================================================
// Page and Test Result Types
// ============================================================================

export interface PageReport {
  id: string;
  page: string;
  url: string;
  themes: ('light' | 'dark')[];
  viewports: Viewport[];
  visualReport?: VisualReport;
  accessibilityReport?: AccessibilityReport;
  contrastReport?: ContrastReport;
  ariaReport?: ARIAReport;
  navigationReport?: NavigationReport;
  responsiveReport?: ResponsiveReport;
  themeReport?: ThemeReport;
  issues: Issue[];
  overallScore: number;
  scores: {
    visual: number;
    accessibility: number;
    contrast: number;
    responsive: number;
    theme: number;
  };
  timestamp: Date;
  duration: number;
}

export interface TestResult {
  id: string;
  type: 'visual' | 'accessibility' | 'contrast' | 'responsive' | 'theme';
  page: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  success: boolean;
  score: number;
  issues: Issue[];
  data: any;
  timestamp: Date;
  duration: number;
}

// ============================================================================
// Consolidated Report Types
// ============================================================================

export interface AuditSummary {
  totalPages: number;
  totalIssues: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  resolvedIssues: number;
  accessibilityScore: number;
  visualRegressionCount: number;
  contrastFailures: number;
  responsiveIssues: number;
  themeIssues: number;
  overallScore: number;
  wcagCompliance: number;
  testCoverage: {
    pages: number;
    themes: number;
    viewports: number;
    browsers: number;
  };
}

export interface IssuesByCategory {
  visual: Issue[];
  accessibility: Issue[];
  contrast: Issue[];
  responsive: Issue[];
  theme: Issue[];
  keyboard: Issue[];
  aria: Issue[];
}

export interface Recommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  category: 'critical-fix' | 'improvement' | 'enhancement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  relatedIssues: string[];
  resources: string[];
  priority: number;
}

export interface UIAuditReport {
  id: string;
  version: string;
  timestamp: Date;
  duration: number;
  configuration: TestConfiguration;
  summary: AuditSummary;
  pageReports: PageReport[];
  issuesByCategory: IssuesByCategory;
  classifiedIssues: ClassifiedIssues;
  fixSuggestions: FixSuggestion[];
  recommendations: Recommendation[];
  progressSinceLastRun?: ProgressReport;
  metadata: {
    testRunId: string;
    environment: string;
    branch: string;
    commit: string;
    tester: string;
    baselineVersion?: string;
  };
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface TestError {
  id: string;
  type: 'screenshot' | 'accessibility' | 'comparison' | 'network' | 'timeout' | 'unknown';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  stack?: string;
  context: {
    page?: string;
    theme?: 'light' | 'dark';
    viewport?: Viewport;
    browser?: string;
    step?: string;
  };
  timestamp: Date;
  retryCount: number;
  resolved: boolean;
}

export interface ErrorReport {
  id: string;
  testRunId: string;
  errors: TestError[];
  totalErrors: number;
  criticalErrors: number;
  recoveredErrors: number;
  unrecoveredErrors: number;
  errorsByType: Record<TestError['type'], number>;
  timestamp: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

export type ThemeMode = 'light' | 'dark';
export type SeverityLevel = 'critical' | 'major' | 'minor';
export type IssueType = 'visual' | 'accessibility' | 'contrast' | 'responsive' | 'theme' | 'keyboard' | 'aria';
export type TestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'wont-fix';

// ============================================================================
// Export all types
// ============================================================================

// Re-export from other type files
export * from './test-config';
export * from './api-types';
export * from './validation-schemas';