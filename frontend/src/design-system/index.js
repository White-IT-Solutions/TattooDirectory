// Design System Main Export

// ===== CORE DESIGN SYSTEM =====

// Tokens
export * from './tokens';

// Utilities
export { cn, cva } from './utils/cn';
export * from './utils/design-system-utils';

// Configuration System
export * from './config/component-config';
export * from './types/component-props';

// ===== UI COMPONENTS =====

// Base UI Components
export * from './components/ui';

// Theme Components
export * from './components/ui/ThemeProvider';

// Visual Effects Components
export * from './components/ui/VisualEffects';

// ===== ENHANCED COMPONENTS =====

// Navigation Components
export * from './components/navigation';

// Feedback Components
export * from './components/feedback/MicroFeedback';
export * from './components/feedback/EmptyState';
export * from './components/feedback/ErrorBoundary';
export * from './components/feedback/Toast';

// Layout Components
export * from './components/layout/PageTransition';

// ===== ACCESSIBILITY COMPONENTS =====

// Accessibility Components (excluding AccessibilityControls to avoid conflict with ThemeProvider)
export {
  AccessibilityProvider,
  useAccessibility,
  TouchTarget,
  TouchButton,
  TouchIconButton,
  TouchLink,
  TouchArea,
  useTouchTarget,
  touchTargetVariants,
  AriaLabelsProvider,
  useAriaLabels,
  AriaLabel,
  ScreenReaderOnly,
  VisuallyHidden,
  LiveRegion,
  Landmark,
  FocusManager,
  AccessibleButton,
  defaultAriaLabels,
  Container,
  Grid,
  Stack,
  Flex,
  ResponsiveImage,
  ShowAt,
  HideAt,
  AspectRatio,
  Spacer,
  useMediaQuery,
  useBreakpoint,
  breakpoints,
  containerVariants,
  gridVariants,
  stackVariants,
  AccessibilityStatus,
  AccessibilityAnnouncer,
  KeyboardNavigationProvider,
  useKeyboardNavigation,
  useFocusTrap,
  Focusable,
  SkipLinks,
  KeyboardShortcutsHelp,
  FocusIndicator,
  GestureSupport,
  useGestureSupport,
  TouchFriendlyButton
} from './components/accessibility';

// ===== STANDARDIZED COMPONENT SYSTEM =====

/**
 * Design System Constants
 */
export {
  COMPONENT_SIZES,
  COMPONENT_VARIANTS,
  VISUAL_EFFECTS_LEVELS,
  SHADOW_LEVELS,
  ANIMATION_LEVELS
} from './config/component-config';

/**
 * Component Configuration Utilities
 */
export {
  mergeComponentConfig,
  validateComponentConfig,
  createComponentConfigHook,
  componentConfigurations
} from './config/component-config';

/**
 * Prop Interface Utilities
 */
export {
  validateProps,
  createPropValidationHook,
  componentPropInterfaces
} from './types/component-props';

/**
 * Design System Integration Utilities
 */
export {
  designSystemUtils,
  createStandardizedComponent,
  generateComponentClasses,
  applyVisualEffects,
  applyPerformanceOptimizations,
  generateA11yAttributes,
  getCurrentTheme,
  setTheme,
  prefersReducedMotion
} from './utils/design-system-utils';

// ===== COMPONENT INTEGRATION UTILITIES =====

/**
 * Component Integration and Testing Utilities
 * Provides comprehensive tools for integrating enhanced components consistently across pages
 */
export {
  componentIntegrationUtils,
  EnhancedPageConfigManager,
  createEnhancedPageConfig,
  createIntegratedComponent,
  ComponentComposer,
  createPageComposer,
  validateComponentIntegration,
  generateIntegrationReport
} from './utils/component-integration';

/**
 * Component Testing Utilities
 * Provides testing tools for integration validation, accessibility compliance, and performance testing
 */
// Component testing utilities are only available in test environment
// Import them directly from './utils/component-testing' in test files

/**
 * All Integration Utilities (Default Export)
 * Convenience export for all component integration utilities
 */
export { default as designSystemIntegration } from './utils/index';