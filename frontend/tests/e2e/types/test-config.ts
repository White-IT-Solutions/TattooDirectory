/**
 * Test configuration and setup types
 */

export interface BaselineConfig {
  directory: string;
  updateOnApproval: boolean;
  versionControl: boolean;
  retentionDays: number;
  compressionEnabled: boolean;
}

export interface ComparisonConfig {
  threshold: number;
  ignoreAntialiasing: boolean;
  ignoreColors: boolean;
  pixelRatio: number;
  method: 'pixel' | 'structural' | 'perceptual';
  maskSelectors: string[];
  ignoreRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface AccessibilityConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  includedRules: string[];
  excludedRules: string[];
  tags: string[];
  disableColorContrast: boolean;
  axeOptions: Record<string, any>;
}

export interface ContrastConfig {
  normalTextRatio: number;
  largeTextRatio: number;
  graphicalObjectRatio: number;
  wcagLevel: 'AA' | 'AAA';
  includeHidden: boolean;
  colorBlindnessSimulation: boolean;
}

export interface ResponsiveConfig {
  breakpoints: number[];
  orientations: ('portrait' | 'landscape')[];
  touchTargetMinSize: number;
  viewportMargin: number;
  deviceEmulation: boolean;
}

export interface ThemeConfig {
  transitionTimeout: number;
  validateTransitions: boolean;
  checkSystemPreference: boolean;
  customThemes: Array<{
    name: string;
    selector: string;
    properties: Record<string, string>;
  }>;
}

export interface ReportConfig {
  outputDirectory: string;
  format: ('html' | 'json' | 'xml' | 'pdf')[];
  includeScreenshots: boolean;
  compressImages: boolean;
  generateTrends: boolean;
  retentionDays: number;
  emailNotifications: boolean;
  webhookUrl?: string;
}

export interface CIConfig {
  failOnCritical: boolean;
  failOnMajor: boolean;
  maxRegressions: number;
  commentOnPR: boolean;
  uploadArtifacts: boolean;
  baselineBranch: string;
  parallelJobs: number;
}

export interface PerformanceConfig {
  maxConcurrency: number;
  timeout: number;
  retries: number;
  screenshotQuality: number;
  cacheEnabled: boolean;
  memoryLimit: string;
  cpuLimit: number;
}

export interface TestEnvironmentConfig {
  baseUrl: string;
  authToken?: string;
  cookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
  }>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  userAgent?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  locale?: string;
}

export interface ComprehensiveTestConfig extends TestConfiguration {
  baseline: BaselineConfig;
  comparison: ComparisonConfig;
  accessibility: AccessibilityConfig;
  contrast: ContrastConfig;
  responsive: ResponsiveConfig;
  theme: ThemeConfig;
  reporting: ReportConfig;
  ci: CIConfig;
  performance: PerformanceConfig;
  environment: TestEnvironmentConfig;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  config: ComprehensiveTestConfig;
  pages: string[];
  enabled: boolean;
  schedule?: {
    cron: string;
    timezone: string;
  };
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    onRegression: boolean;
    recipients: string[];
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestExecution {
  id: string;
  suiteId: string;
  status: TestStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  triggeredBy: 'manual' | 'schedule' | 'webhook' | 'ci';
  branch?: string;
  commit?: string;
  environment: string;
  results?: UIAuditReport;
  errors?: TestError[];
  metadata: Record<string, any>;
}

export { TestConfiguration, Viewport, TestStatus, TestError, UIAuditReport } from './index';