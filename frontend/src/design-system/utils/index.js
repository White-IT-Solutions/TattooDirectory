/**
 * Design System Utilities - Main Export
 * Centralized exports for all design system and component integration utilities
 */

// Core design system utilities
export { default as designSystemUtils } from './design-system-utils';
export { cn } from './cn';

// Component integration utilities
export {
  componentIntegrationUtils,
  EnhancedPageConfigManager,
  createEnhancedPageConfig,
  createIntegratedComponent,
  ComponentComposer,
  createPageComposer,
  validateComponentIntegration,
  generateIntegrationReport
} from './component-integration';

// Component testing utilities
export {
  componentTestingUtils,
  ComponentIntegrationTester,
  CrossPageConsistencyTester,
  ComponentPerformanceTester,
  AccessibilityTester,
  createComponentTestSuite
} from './component-testing';

// Re-export configuration and types
export { componentConfigurations } from '../config/component-config';
export { componentPropInterfaces } from '../types/component-props';

// Design tokens
export { designTokens } from './design-tokens';

// Convenience exports for common use cases
export {
  // Token utilities
  getDesignToken,
  setDesignToken,
  getSemanticColor,
  getInteractiveColor,
  getFeedbackColor,
  
  // Component utilities
  generateComponentClasses,
  applyVisualEffects,
  applyPerformanceOptimizations,
  createStandardizedComponent,
  mergeComponentConfigs,
  
  // Responsive utilities
  generateResponsiveClasses,
  getCurrentBreakpoint,
  matchesBreakpoint,
  
  // Accessibility utilities
  generateA11yAttributes,
  prefersReducedMotion,
  prefersHighContrast,
  
  // Theme utilities
  getCurrentTheme,
  setTheme,
  getSystemTheme,
  
  // Animation utilities
  processAnimationConfig,
  getAnimationDuration,
  
  // Validation utilities
  validateDesignSystemConfig
} from './design-system-utils';

// Import all utilities for default export
import designSystemUtilsDefault from './design-system-utils';
import { cn } from './cn';
import {
  componentIntegrationUtils,
  EnhancedPageConfigManager,
  createEnhancedPageConfig,
  createIntegratedComponent,
  ComponentComposer,
  createPageComposer,
  validateComponentIntegration,
  generateIntegrationReport
} from './component-integration';

// Import configurations
import { componentConfigurations } from '../config/component-config';
import { componentPropInterfaces } from '../types/component-props';

// Default export with all utilities
const designSystemIntegration = {
  // Core utilities
  designSystemUtils: designSystemUtilsDefault,
  cn,
  
  // Configuration management
  EnhancedPageConfigManager,
  createEnhancedPageConfig,
  
  // Component composition
  createIntegratedComponent,
  ComponentComposer,
  createPageComposer,
  
  // Validation
  validateComponentIntegration,
  generateIntegrationReport,
  
  // Configuration and types
  componentConfigurations,
  componentPropInterfaces
};

export default designSystemIntegration;