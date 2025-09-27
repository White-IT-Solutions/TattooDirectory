// Visual Testing Engine Exports
export { ScreenshotCapture } from './ScreenshotCapture';
export { VisualTestRunner } from './VisualTestRunner';
export { ImageComparison } from './ImageComparison';
export { BaselineManager } from './BaselineManager';

// Baseline Management and Version Control
export { BaselineStorage } from './BaselineStorage';
export { BaselineVersionControl } from './BaselineVersionControl';
export { GitIntegration } from './GitIntegration';

// Type exports
export type {
  Screenshot,
  ScreenshotOptions,
  ScreenshotMetadata
} from './ScreenshotCapture';

export type {
  TestPage,
  TestViewport,
  VisualTestConfig,
  TestExecution,
  TestResult,
  TestSummary
} from './VisualTestRunner';

export type {
  ComparisonResult,
  Region,
  ComparisonOptions,
  ComparisonReport
} from './ImageComparison';

export type {
  BaselineMetadata,
  BaselineVersion,
  BaselineHistory,
  BaselineManagerConfig
} from './BaselineManager';

// Storage and Version Control Types
export type { 
  StorageConfig, 
  StorageStats, 
  BaselineIndex 
} from './BaselineStorage';

export type { 
  VersionControlConfig, 
  BaselineChangeSet, 
  BaselineChange, 
  RollbackPoint 
} from './BaselineVersionControl';

export type { 
  GitCommitInfo, 
  GitFileStatus 
} from './GitIntegration';