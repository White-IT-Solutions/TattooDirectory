// Mobile Responsiveness Testing Framework
// Comprehensive testing suite for mobile responsiveness and interactions

export { ViewportManager } from './ViewportManager';
export type { ViewportConfig, OrientationConfig } from './ViewportManager';

export { TouchTargetValidator } from './TouchTargetValidator';
export type { 
  TouchTargetResult, 
  TouchTargetReport 
} from './TouchTargetValidator';

export { ResponsiveLayoutChecker } from './ResponsiveLayoutChecker';
export type { 
  LayoutElement,
  LayoutBreakpoint,
  LayoutIssue,
  ResponsiveLayoutReport 
} from './ResponsiveLayoutChecker';

export { MobileInteractionTester } from './MobileInteractionTester';
export type { 
  TouchGesture,
  InteractionResult,
  OrientationTestResult,
  MobileInteractionReport 
} from './MobileInteractionTester';

// Utility functions for responsive testing
export const ResponsiveTestUtils = {
  /**
   * Get standard mobile viewports
   */
  getMobileViewports: () => ViewportManager.getMobileViewports(),

  /**
   * Get standard desktop viewports
   */
  getDesktopViewports: () => ViewportManager.getDesktopViewports(),

  /**
   * Get responsive breakpoints
   */
  getBreakpoints: () => ViewportManager.getBreakpoints(),

  /**
   * Check if viewport is mobile
   */
  isMobileViewport: (width: number) => width <= 768,

  /**
   * Check if viewport is tablet
   */
  isTabletViewport: (width: number) => width > 768 && width <= 1024,

  /**
   * Check if viewport is desktop
   */
  isDesktopViewport: (width: number) => width > 1024
};

// Constants for responsive testing
export const RESPONSIVE_CONSTANTS = {
  MIN_TOUCH_TARGET_SIZE: 44,
  RECOMMENDED_TOUCH_TARGET_SIZE: 48,
  MIN_TOUCH_SPACING: 8,
  RESPONSE_TIME_THRESHOLD: 300,
  LONG_PRESS_DURATION: 500,
  
  VIEWPORTS: {
    MOBILE: { width: 375, height: 667 },
    MOBILE_LARGE: { width: 414, height: 896 },
    TABLET: { width: 768, height: 1024 },
    TABLET_LANDSCAPE: { width: 1024, height: 768 },
    DESKTOP: { width: 1920, height: 1080 }
  },
  
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
  }
} as const;