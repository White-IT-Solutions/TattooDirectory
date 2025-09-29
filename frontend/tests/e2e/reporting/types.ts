/**
 * TypeScript interfaces for the UI/UX audit reporting system
 * Defines data structures for consolidated reports, issue classification, and progress tracking
 */

// Core data structures from design document
export interface Screenshot {
  id: string;
  page: string;
  theme: 'light' | 'dark';
  viewport: Viewport;
  timestamp: Date;
  imagePath: string;
  metadata: ScreenshotMetadata;
}

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  isLandscape: boolean;
}

export interface ScreenshotMetadata {
  browser: string;
  userAgent: string;
  url: string;
  title: string;
  loadTime: number;
}

export interface ComparisonResult {
  screenshotId: string;
  hasDifferences: boolean;
  differencePercentage: number;
  diffImagePath?: string;
  affectedRegions: Region[];
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  description?: string;
}

// Accessibility testing structures
export interface AccessibilityReport {
  pageUrl: string;
  theme: 'light' | 'dark';
  wcagLevel: 'AA' | 'AAA';
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  score: number;
  timestamp: Date;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: ViolationNode[];
}

export interface AccessibilityPass {
  id: string;
  description: string;
  nodes: ViolationNode[];
}

export interface ViolationNode {
  target: string[];
  html: string;
  failureSummary?: string;
}

// Contrast analysis structures
export interface ContrastReport {
  pageUrl: string;
  theme: 'light' | 'dark';
  elements: ContrastElement[];
  overallScore: number;
  failureCount: number;
}

export interface ContrastElement {
  selector: string;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'AA' | 'AAA';
  passes: boolean;
  textSize: 'normal' | 'large';
}

// Responsive testing structures
export interface ResponsiveReport {
  pageUrl: string;
  viewports: ViewportResult[];
  touchTargets: TouchTargetResult[];
  layoutIssues: LayoutIssue[];
  overallScore: number;
}

export interface ViewportResult {
  viewport: Viewport;
  hasIssues: boolean;
  issues: string[];
  screenshot?: string;
}

export interface TouchTargetResult {
  selector: string;
  size: { width: number; height: number };
  passes: boolean;
  recommendedSize: { width: number; height: number };
}

export interface LayoutIssue {
  type: 'overflow' | 'overlap' | 'spacing' | 'alignment';
  description: string;
  selector: string;
  severity: 'critical' | 'major' | 'minor';
}

// Theme testing structures
export interface ThemeReport {
  pageUrl: string;
  lightModeIssues: ThemeIssue[];
  darkModeIssues: ThemeIssue[];
  transitionIssues: TransitionIssue[];
  overallScore: number;
}

export interface ThemeIssue {
  type: 'contrast' | 'visibility' | 'styling' | 'interaction';
  description: string;
  selector: string;
  severity: 'critical' | 'major' | 'minor';
  theme: 'light' | 'dark';
}

export interface TransitionIssue {
  description: string;
  selector: string;
  expectedBehavior: string;
  actualBehavior: string;
}

// Issue tracking and classification
export interface Issue {
  id: string;
  type: 'visual' | 'accessibility' | 'contrast' | 'responsive' | 'theme';
  severity: 'critical' | 'major' | 'minor';
  page: string;
  theme: 'light' | 'dark' | 'both';
  description: string;
  element?: string;
  screenshot?: string;
  fixSuggestion?: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  category?: IssueCategory;
  impact?: ImpactAssessment;
}

export interface IssueCategory {
  primary: 'functionality' | 'usability' | 'accessibility' | 'visual' | 'performance';
  secondary?: string;
  tags: string[];
}

export interface ImpactAssessment {
  userExperience: 'high' | 'medium' | 'low';
  businessImpact: 'high' | 'medium' | 'low';
  technicalComplexity: 'high' | 'medium' | 'low';
  estimatedEffort: 'hours' | 'days' | 'weeks';
}

// Fix suggestions
export interface FixSuggestion {
  issueId: string;
  title: string;
  description: string;
  codeExample?: string;
  resources: Resource[];
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
  category: 'css' | 'html' | 'javascript' | 'design' | 'content';
}

export interface Resource {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'tool' | 'example';
}

// Consolidated reports
export interface UIAuditReport {
  id: string;
  timestamp: Date;
  summary: AuditSummary;
  pageReports: PageReport[];
  issuesByCategory: IssuesByCategory;
  recommendations: Recommendation[];
  progressSinceLastRun?: ProgressMetrics;
  metadata: ReportMetadata;
}

export interface AuditSummary {
  totalPages: number;
  totalIssues: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  accessibilityScore: number;
  visualRegressionCount: number;
  contrastFailures: number;
  responsiveIssues: number;
  themeIssues: number;
  overallScore: number;
}

export interface PageReport {
  pageUrl: string;
  pageName: string;
  visualReport?: VisualReport;
  accessibilityReport?: AccessibilityReport;
  contrastReport?: ContrastReport;
  responsiveReport?: ResponsiveReport;
  themeReport?: ThemeReport;
  issues: Issue[];
  score: number;
}

export interface VisualReport {
  screenshots: Screenshot[];
  comparisons: ComparisonResult[];
  regressionCount: number;
  score: number;
}

export interface IssuesByCategory {
  critical: Issue[];
  major: Issue[];
  minor: Issue[];
  byType: {
    visual: Issue[];
    accessibility: Issue[];
    contrast: Issue[];
    responsive: Issue[];
    theme: Issue[];
  };
  byPage: { [pageUrl: string]: Issue[] };
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  affectedPages: string[];
  estimatedImpact: string;
  implementationGuide: string;
}

export interface ReportMetadata {
  version: string;
  testEnvironment: string;
  browserVersions: string[];
  testDuration: number;
  totalScreenshots: number;
  configurationHash: string;
}

// Progress tracking
export interface ProgressMetrics {
  issuesResolved: number;
  issuesIntroduced: number;
  netImprovement: number;
  scoreImprovement: number;
  categoryImprovements: {
    accessibility: number;
    visual: number;
    contrast: number;
    responsive: number;
    theme: number;
  };
  timeToResolution: {
    average: number;
    median: number;
    byCategory: { [category: string]: number };
  };
}

export interface ProgressReport {
  currentReport: UIAuditReport;
  previousReport?: UIAuditReport;
  metrics: ProgressMetrics;
  trends: TrendAnalysis;
  recommendations: ProgressRecommendation[];
}

export interface TrendAnalysis {
  issueVelocity: number; // issues resolved per day
  qualityTrend: 'improving' | 'stable' | 'declining';
  riskAreas: string[];
  successAreas: string[];
  predictedCompletion?: Date;
}

export interface ProgressRecommendation {
  type: 'process' | 'technical' | 'resource';
  title: string;
  description: string;
  expectedImpact: string;
}

// Test result input types
export interface TestResult {
  type: 'visual' | 'accessibility' | 'contrast' | 'responsive' | 'theme';
  pageUrl: string;
  data: any; // Specific to test type
  timestamp: Date;
  success: boolean;
  errors?: string[];
}

export interface ClassifiedIssues {
  critical: Issue[];
  major: Issue[];
  minor: Issue[];
  total: number;
  distribution: {
    critical: number;
    major: number;
    minor: number;
  };
}

// Configuration types
export interface ReportConfig {
  outputFormat: 'json' | 'html' | 'pdf';
  includeScreenshots: boolean;
  includeFixSuggestions: boolean;
  severityThresholds: {
    critical: number;
    major: number;
  };
  categories: string[];
}

export interface ClassificationRules {
  accessibility: {
    critical: string[];
    major: string[];
  };
  visual: {
    thresholds: {
      critical: number;
      major: number;
    };
  };
  contrast: {
    minimumRatios: {
      normal: number;
      large: number;
    };
  };
  responsive: {
    minimumTouchTarget: number;
    breakpoints: number[];
  };
}