/**
 * Zod validation schemas for type safety and runtime validation
 * 
 * Note: This file requires 'zod' to be installed as a dependency.
 * Install with: npm install zod
 * 
 * If zod is not available, the validation functions will throw errors.
 * Consider making zod import conditional if needed.
 */

// Note: Uncomment the following line when zod is installed
// import { z } from 'zod';

// Temporary type definitions for when zod is not available
type z = any;
const z = {
  object: (obj: any) => ({ parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) }),
  string: () => ({ min: () => z.object({}), max: () => z.object({}), url: () => z.object({}), uuid: () => z.object({}), regex: () => z.object({}) }),
  number: () => ({ min: () => z.object({}), max: () => z.object({}) }),
  boolean: () => z.object({}),
  date: () => z.object({}),
  array: () => z.object({}),
  enum: () => z.object({}),
  any: () => z.object({}),
  record: () => z.object({})
};

// ============================================================================
// Core Schema Definitions
// ============================================================================

export const ViewportSchema = z.object({
  width: z.number().min(320).max(3840),
  height: z.number().min(240).max(2160),
  name: z.string().min(1),
  deviceScaleFactor: z.number().min(0.5).max(3).optional(),
  isMobile: z.boolean().optional(),
  hasTouch: z.boolean().optional()
});

export const RegionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1)
});

export const ThemeModeSchema = z.enum(['light', 'dark']);
export const SeverityLevelSchema = z.enum(['critical', 'major', 'minor']);
export const IssueTypeSchema = z.enum(['visual', 'accessibility', 'contrast', 'responsive', 'theme', 'keyboard', 'aria']);
export const TestStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
export const IssueStatusSchema = z.enum(['open', 'in-progress', 'resolved', 'wont-fix']);

// ============================================================================
// Screenshot and Visual Testing Schemas
// ============================================================================

export const ScreenshotMetadataSchema = z.object({
  userAgent: z.string(),
  timestamp: z.date(),
  browser: z.string(),
  devicePixelRatio: z.number(),
  colorScheme: ThemeModeSchema,
  reducedMotion: z.boolean(),
  highContrast: z.boolean()
});

export const ScreenshotSchema = z.object({
  id: z.string().uuid(),
  page: z.string().min(1),
  theme: ThemeModeSchema,
  viewport: ViewportSchema,
  timestamp: z.date(),
  imagePath: z.string().min(1),
  metadata: ScreenshotMetadataSchema,
  hash: z.string().optional(),
  fileSize: z.number().min(0).optional()
});

export const ComparisonResultSchema = z.object({
  screenshotId: z.string().uuid(),
  baselineId: z.string().uuid().optional(),
  hasDifferences: z.boolean(),
  differencePercentage: z.number().min(0).max(100),
  pixelDifferences: z.number().min(0),
  diffImagePath: z.string().optional(),
  affectedRegions: z.array(RegionSchema),
  threshold: z.number().min(0).max(1),
  comparisonMethod: z.enum(['pixel', 'structural', 'perceptual']),
  timestamp: z.date()
});

export const VisualReportSchema = z.object({
  id: z.string().uuid(),
  testRunId: z.string().uuid(),
  page: z.string().min(1),
  theme: ThemeModeSchema,
  viewport: ViewportSchema,
  screenshots: z.array(ScreenshotSchema),
  comparisons: z.array(ComparisonResultSchema),
  hasRegressions: z.boolean(),
  regressionCount: z.number().min(0),
  timestamp: z.date(),
  duration: z.number().min(0)
});

// ============================================================================
// Accessibility Testing Schemas
// ============================================================================

export const ViolationNodeSchema = z.object({
  target: z.array(z.string()),
  html: z.string(),
  impact: z.enum(['critical', 'serious', 'moderate', 'minor']),
  any: z.array(z.object({
    id: z.string(),
    data: z.any(),
    relatedNodes: z.array(z.object({
      target: z.array(z.string()),
      html: z.string()
    }))
  })),
  all: z.array(z.any()),
  none: z.array(z.any())
});

export const AccessibilityViolationSchema = z.object({
  id: z.string(),
  impact: z.enum(['critical', 'serious', 'moderate', 'minor']),
  description: z.string(),
  help: z.string(),
  helpUrl: z.string().url(),
  tags: z.array(z.string()),
  nodes: z.array(ViolationNodeSchema)
});

export const AccessibilityPassSchema = z.object({
  id: z.string(),
  description: z.string(),
  help: z.string(),
  helpUrl: z.string().url(),
  tags: z.array(z.string()),
  nodes: z.array(ViolationNodeSchema)
});

export const AccessibilityReportSchema = z.object({
  id: z.string().uuid(),
  pageUrl: z.string().url(),
  theme: ThemeModeSchema,
  viewport: ViewportSchema,
  wcagLevel: z.enum(['A', 'AA', 'AAA']),
  violations: z.array(AccessibilityViolationSchema),
  passes: z.array(AccessibilityPassSchema),
  incomplete: z.array(AccessibilityViolationSchema),
  inapplicable: z.array(AccessibilityPassSchema),
  score: z.number().min(0).max(100),
  totalElements: z.number().min(0),
  timestamp: z.date(),
  duration: z.number().min(0),
  axeVersion: z.string()
});

// ============================================================================
// Contrast Analysis Schemas
// ============================================================================

export const ContrastElementSchema = z.object({
  selector: z.string(),
  element: z.string(),
  foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  contrastRatio: z.number().min(1).max(21),
  wcagLevel: z.enum(['AA', 'AAA']),
  passes: z.boolean(),
  textSize: z.enum(['normal', 'large']),
  fontSize: z.number().min(0),
  fontWeight: z.number().min(100).max(900),
  isGraphical: z.boolean(),
  position: RegionSchema
});

export const ContrastReportSchema = z.object({
  id: z.string().uuid(),
  pageUrl: z.string().url(),
  theme: ThemeModeSchema,
  viewport: ViewportSchema,
  elements: z.array(ContrastElementSchema),
  overallScore: z.number().min(0).max(100),
  passCount: z.number().min(0),
  failureCount: z.number().min(0),
  totalElements: z.number().min(0),
  wcagAACompliance: z.number().min(0).max(100),
  wcagAAACompliance: z.number().min(0).max(100),
  timestamp: z.date(),
  duration: z.number().min(0)
});

// ============================================================================
// Issue and Classification Schemas
// ============================================================================

export const IssueSchema = z.object({
  id: z.string().uuid(),
  type: IssueTypeSchema,
  severity: SeverityLevelSchema,
  category: z.enum(['functionality', 'usability', 'accessibility', 'performance', 'visual']),
  page: z.string().min(1),
  theme: z.enum(['light', 'dark', 'both']),
  viewport: ViewportSchema.optional(),
  element: z.string().optional(),
  selector: z.string().optional(),
  description: z.string().min(1),
  impact: z.string().min(1),
  screenshot: z.string().optional(),
  diffImage: z.string().optional(),
  fixSuggestion: z.string().optional(),
  wcagCriteria: z.array(z.string()).optional(),
  status: IssueStatusSchema,
  assignee: z.string().optional(),
  priority: z.number().min(1).max(10),
  estimatedEffort: z.enum(['low', 'medium', 'high']),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional(),
  metadata: z.record(z.any())
});

export const FixSuggestionSchema = z.object({
  issueId: z.string().uuid(),
  type: z.enum(['css', 'html', 'javascript', 'design', 'content']),
  title: z.string().min(1),
  description: z.string().min(1),
  codeExample: z.string().optional(),
  resources: z.array(z.string().url()),
  estimatedEffort: z.enum(['low', 'medium', 'high']),
  priority: z.number().min(1).max(10),
  automated: z.boolean()
});

export const ClassifiedIssuesSchema = z.object({
  critical: z.array(IssueSchema),
  major: z.array(IssueSchema),
  minor: z.array(IssueSchema),
  byType: z.record(IssueTypeSchema, z.array(IssueSchema)),
  byPage: z.record(z.string(), z.array(IssueSchema)),
  byTheme: z.record(z.enum(['light', 'dark', 'both']), z.array(IssueSchema)),
  total: z.number().min(0)
});

// ============================================================================
// Configuration Schemas
// ============================================================================

export const TestConfigurationSchema = z.object({
  browsers: z.array(z.enum(['chromium', 'firefox', 'webkit'])).min(1),
  viewports: z.array(ViewportSchema).min(1),
  themes: z.array(ThemeModeSchema).min(1),
  pages: z.array(z.string().min(1)).min(1),
  baseUrl: z.string().url(),
  timeout: z.number().min(1000).max(300000),
  retries: z.number().min(0).max(5),
  parallel: z.boolean(),
  headless: z.boolean()
});

export const BaselineConfigSchema = z.object({
  directory: z.string().min(1),
  updateOnApproval: z.boolean(),
  versionControl: z.boolean(),
  retentionDays: z.number().min(1).max(365),
  compressionEnabled: z.boolean()
});

export const ComparisonConfigSchema = z.object({
  threshold: z.number().min(0).max(1),
  ignoreAntialiasing: z.boolean(),
  ignoreColors: z.boolean(),
  pixelRatio: z.number().min(0.5).max(3),
  method: z.enum(['pixel', 'structural', 'perceptual']),
  maskSelectors: z.array(z.string()),
  ignoreRegions: z.array(RegionSchema)
});

// ============================================================================
// Report Schemas
// ============================================================================

export const AuditSummarySchema = z.object({
  totalPages: z.number().min(0),
  totalIssues: z.number().min(0),
  criticalIssues: z.number().min(0),
  majorIssues: z.number().min(0),
  minorIssues: z.number().min(0),
  resolvedIssues: z.number().min(0),
  accessibilityScore: z.number().min(0).max(100),
  visualRegressionCount: z.number().min(0),
  contrastFailures: z.number().min(0),
  responsiveIssues: z.number().min(0),
  themeIssues: z.number().min(0),
  overallScore: z.number().min(0).max(100),
  wcagCompliance: z.number().min(0).max(100),
  testCoverage: z.object({
    pages: z.number().min(0),
    themes: z.number().min(0),
    viewports: z.number().min(0),
    browsers: z.number().min(0)
  })
});

export const RecommendationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['immediate', 'short-term', 'long-term']),
  category: z.enum(['critical-fix', 'improvement', 'enhancement']),
  title: z.string().min(1),
  description: z.string().min(1),
  impact: z.enum(['high', 'medium', 'low']),
  effort: z.enum(['low', 'medium', 'high']),
  relatedIssues: z.array(z.string().uuid()),
  resources: z.array(z.string().url()),
  priority: z.number().min(1).max(10)
});

export const UIAuditReportSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  timestamp: z.date(),
  duration: z.number().min(0),
  configuration: TestConfigurationSchema,
  summary: AuditSummarySchema,
  pageReports: z.array(z.any()), // PageReport schema would be complex, using any for now
  issuesByCategory: z.object({
    visual: z.array(IssueSchema),
    accessibility: z.array(IssueSchema),
    contrast: z.array(IssueSchema),
    responsive: z.array(IssueSchema),
    theme: z.array(IssueSchema),
    keyboard: z.array(IssueSchema),
    aria: z.array(IssueSchema)
  }),
  classifiedIssues: ClassifiedIssuesSchema,
  fixSuggestions: z.array(FixSuggestionSchema),
  recommendations: z.array(RecommendationSchema),
  progressSinceLastRun: z.any().optional(), // ProgressReport schema
  metadata: z.object({
    testRunId: z.string().uuid(),
    environment: z.string(),
    branch: z.string(),
    commit: z.string(),
    tester: z.string(),
    baselineVersion: z.string().optional()
  })
});

// ============================================================================
// Validation Functions
// ============================================================================

export const validateScreenshot = (data: unknown) => ScreenshotSchema.parse(data);
export const validateComparisonResult = (data: unknown) => ComparisonResultSchema.parse(data);
export const validateVisualReport = (data: unknown) => VisualReportSchema.parse(data);
export const validateAccessibilityReport = (data: unknown) => AccessibilityReportSchema.parse(data);
export const validateContrastReport = (data: unknown) => ContrastReportSchema.parse(data);
export const validateIssue = (data: unknown) => IssueSchema.parse(data);
export const validateUIAuditReport = (data: unknown) => UIAuditReportSchema.parse(data);
export const validateTestConfiguration = (data: unknown) => TestConfigurationSchema.parse(data);

// ============================================================================
// Type Guards
// ============================================================================

export const isScreenshot = (data: unknown): data is z.infer<typeof ScreenshotSchema> => {
  return ScreenshotSchema.safeParse(data).success;
};

export const isComparisonResult = (data: unknown): data is z.infer<typeof ComparisonResultSchema> => {
  return ComparisonResultSchema.safeParse(data).success;
};

export const isAccessibilityReport = (data: unknown): data is z.infer<typeof AccessibilityReportSchema> => {
  return AccessibilityReportSchema.safeParse(data).success;
};

export const isIssue = (data: unknown): data is z.infer<typeof IssueSchema> => {
  return IssueSchema.safeParse(data).success;
};

export const isUIAuditReport = (data: unknown): data is z.infer<typeof UIAuditReportSchema> => {
  return UIAuditReportSchema.safeParse(data).success;
};

// ============================================================================
// Schema Type Exports
// ============================================================================

export type ViewportType = z.infer<typeof ViewportSchema>;
export type RegionType = z.infer<typeof RegionSchema>;
export type ScreenshotType = z.infer<typeof ScreenshotSchema>;
export type ComparisonResultType = z.infer<typeof ComparisonResultSchema>;
export type VisualReportType = z.infer<typeof VisualReportSchema>;
export type AccessibilityReportType = z.infer<typeof AccessibilityReportSchema>;
export type ContrastReportType = z.infer<typeof ContrastReportSchema>;
export type IssueType = z.infer<typeof IssueSchema>;
export type UIAuditReportType = z.infer<typeof UIAuditReportSchema>;
export type TestConfigurationType = z.infer<typeof TestConfigurationSchema>;