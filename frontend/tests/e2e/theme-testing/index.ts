/**
 * Theme Testing Framework
 * 
 * Comprehensive theme testing utilities for UI/UX audit and dark mode compatibility
 */

export { ThemeToggler } from './ThemeToggler';
export type { ThemeState, ThemeToggleOptions } from './ThemeToggler';

export { ThemeValidator } from './ThemeValidator';
export type { 
  ComponentThemeValidation, 
  ThemeValidationReport, 
  ThemeValidationOptions 
} from './ThemeValidator';

export { TransitionTester } from './TransitionTester';
export type { 
  TransitionMetrics, 
  TransitionValidation, 
  ComponentTransitionTest, 
  TransitionTestReport, 
  TransitionTestOptions 
} from './TransitionTester';

export { ComponentThemeChecker } from './ComponentThemeChecker';
export type { 
  ComponentThemeCompliance, 
  ComponentThemeIssue, 
  ComponentThemeReport, 
  ComponentCheckOptions, 
  ComponentThemeRule 
} from './ComponentThemeChecker';

/**
 * Utility function to create a comprehensive theme test suite
 */
export function createThemeTestSuite(page: any) {
  return {
    themeToggler: new ThemeToggler(page),
    themeValidator: new ThemeValidator(page),
    transitionTester: new TransitionTester(page),
    componentChecker: new ComponentThemeChecker(page)
  };
}

/**
 * Default theme testing configuration
 */
export const DEFAULT_THEME_CONFIG = {
  themes: ['light', 'dark'] as const,
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  transitionOptions: {
    maxDuration: 1000,
    minFps: 30,
    checkVisualArtifacts: true
  },
  validationOptions: {
    contrastThreshold: 4.5,
    checkAccessibility: true,
    checkConsistency: true
  }
};