/**
 * Design System Utilities
 * Centralized utilities for consistent design system integration
 */

import { cn } from './cn';
import { componentConfigurations } from '../config/component-config';
import { componentPropInterfaces, validateProps } from '../types/component-props';

// ===== DESIGN TOKEN UTILITIES =====

/**
 * Gets design token value from CSS custom properties
 * @param {string} tokenName - Design token name (e.g., 'color-primary-500')
 * @param {string} fallback - Fallback value if token not found
 * @returns {string} Token value
 */
export function getDesignToken(tokenName, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${tokenName}`)
    .trim();
    
  return value || fallback;
}

/**
 * Sets design token value
 * @param {string} tokenName - Design token name
 * @param {string} value - Token value
 */
export function setDesignToken(tokenName, value) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(`--${tokenName}`, value);
  }
}

/**
 * Gets semantic color token
 * @param {string} colorName - Semantic color name (e.g., 'primary', 'accent')
 * @param {string|number} shade - Color shade (50-900)
 * @returns {string} Color value
 */
export function getSemanticColor(colorName, shade = 500) {
  return getDesignToken(`color-${colorName}-${shade}`);
}

/**
 * Gets interactive color token
 * @param {string} state - Interactive state ('primary', 'primary-hover', etc.)
 * @returns {string} Color value
 */
export function getInteractiveColor(state) {
  return getDesignToken(`interactive-${state}`);
}

/**
 * Gets feedback color token
 * @param {string} type - Feedback type ('success', 'error', 'warning', 'info')
 * @returns {string} Color value
 */
export function getFeedbackColor(type) {
  return getDesignToken(`feedback-${type}`);
}

// ===== COMPONENT STYLING UTILITIES =====

/**
 * Generates component class names based on design system patterns
 * @param {Object} config - Component configuration
 * @returns {string} Generated class names
 */
export function generateComponentClasses(config) {
  const classes = [];
  
  // Base component class
  classes.push('design-system-component');
  
  // Size classes
  if (config.size) {
    classes.push(`size-${config.size}`);
  }
  
  // Variant classes
  if (config.variant) {
    classes.push(`variant-${config.variant}`);
  }
  
  // Shadow level classes
  if (config.shadowLevel && config.shadowLevel !== 'flat') {
    classes.push(`shadow-elevation-${config.shadowLevel}`);
  }
  
  // Visual effects classes
  if (config.visualEffects && config.visualEffects !== 'none') {
    classes.push(`visual-effects-${config.visualEffects}`);
  }
  
  // Animation level classes
  if (config.animationLevel && config.animationLevel !== 'none') {
    classes.push(`animation-${config.animationLevel}`);
  }
  
  // State classes
  if (config.disabled) classes.push('disabled');
  if (config.loading) classes.push('loading');
  if (config.active) classes.push('active');
  
  // Accessibility classes
  if (config.respectReducedMotion) {
    classes.push('respect-reduced-motion');
  }
  
  return classes.join(' ');
}

/**
 * Applies visual effects based on configuration
 * @param {Object} config - Visual effects configuration
 * @returns {string} Visual effects class names
 */
export function applyVisualEffects(config) {
  const classes = [];
  
  // Glassmorphism
  if (config.enableGlassmorphism && config.glassVariant) {
    classes.push(`glass-${config.glassVariant}`);
  }
  
  // Gradient overlays
  if (config.enableGradientOverlays && config.gradientType) {
    classes.push(`gradient-${config.gradientType}`);
  }
  
  // Textures
  if (config.enableTextures && config.textureType && config.textureType !== 'none') {
    classes.push(`texture-${config.textureType}`);
  }
  
  // Colored shadows
  if (config.enableColoredShadows && config.shadowColor) {
    classes.push(`shadow-${config.shadowColor}-glow`);
  }
  
  // Micro-interactions
  if (config.enableMicroInteractions) {
    classes.push('micro-interactions');
  }
  
  // Hover animations
  if (config.enableHoverAnimations) {
    classes.push('hover-animations');
  }
  
  // Focus animations
  if (config.enableFocusAnimations) {
    classes.push('focus-animations');
  }
  
  return classes.join(' ');
}

/**
 * Applies performance optimizations based on configuration
 * @param {Object} config - Performance configuration
 * @returns {Object} Performance-related props and classes
 */
export function applyPerformanceOptimizations(config) {
  const result = {
    classes: [],
    props: {}
  };
  
  // Lazy loading
  if (config.enableLazyImages) {
    result.props.loading = 'lazy';
    result.classes.push('lazy-load');
  }
  
  // Intersection observer
  if (config.enableIntersectionObserver) {
    result.classes.push('intersection-observer');
  }
  
  // Connection-aware loading
  if (config.enableConnectionAwareLoading) {
    result.classes.push('connection-aware');
  }
  
  // Virtualization
  if (config.enableVirtualization) {
    result.classes.push('virtualized');
  }
  
  return result;
}

// ===== RESPONSIVE UTILITIES =====

/**
 * Generates responsive class names
 * @param {string} baseClass - Base class name
 * @param {Object} responsiveValues - Responsive values object
 * @returns {string} Responsive class names
 */
export function generateResponsiveClasses(baseClass, responsiveValues) {
  if (typeof responsiveValues === 'string' || typeof responsiveValues === 'number') {
    return `${baseClass}-${responsiveValues}`;
  }
  
  if (typeof responsiveValues === 'object') {
    const classes = [];
    
    Object.entries(responsiveValues).forEach(([breakpoint, value]) => {
      if (breakpoint === 'default' || breakpoint === 'base') {
        classes.push(`${baseClass}-${value}`);
      } else {
        classes.push(`${breakpoint}:${baseClass}-${value}`);
      }
    });
    
    return classes.join(' ');
  }
  
  return '';
}

/**
 * Gets current breakpoint
 * @returns {string} Current breakpoint name
 */
export function getCurrentBreakpoint() {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
}

/**
 * Checks if current viewport matches breakpoint
 * @param {string} breakpoint - Breakpoint to check
 * @returns {boolean} Whether viewport matches breakpoint
 */
export function matchesBreakpoint(breakpoint) {
  if (typeof window === 'undefined') return false;
  
  const breakpoints = {
    sm: '(max-width: 639px)',
    md: '(min-width: 640px) and (max-width: 767px)',
    lg: '(min-width: 768px) and (max-width: 1023px)',
    xl: '(min-width: 1024px) and (max-width: 1279px)',
    '2xl': '(min-width: 1280px)'
  };
  
  return window.matchMedia(breakpoints[breakpoint] || breakpoint).matches;
}

// ===== ACCESSIBILITY UTILITIES =====

/**
 * Generates accessibility attributes
 * @param {Object} config - Component configuration
 * @returns {Object} Accessibility attributes
 */
export function generateA11yAttributes(config) {
  const attributes = {};
  
  // ARIA attributes
  if (config['aria-label']) attributes['aria-label'] = config['aria-label'];
  if (config['aria-labelledby']) attributes['aria-labelledby'] = config['aria-labelledby'];
  if (config['aria-describedby']) attributes['aria-describedby'] = config['aria-describedby'];
  if (config['aria-expanded'] !== undefined) attributes['aria-expanded'] = config['aria-expanded'];
  if (config['aria-hidden'] !== undefined) attributes['aria-hidden'] = config['aria-hidden'];
  
  // Role
  if (config.role) attributes.role = config.role;
  
  // Tab index
  if (config.tabIndex !== undefined) attributes.tabIndex = config.tabIndex;
  
  // Disabled state
  if (config.disabled) {
    attributes['aria-disabled'] = true;
    attributes.tabIndex = -1;
  }
  
  // Loading state
  if (config.loading) {
    attributes['aria-busy'] = true;
  }
  
  return attributes;
}

/**
 * Checks if reduced motion is preferred
 * @returns {boolean} Whether reduced motion is preferred
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if high contrast is preferred
 * @returns {boolean} Whether high contrast is preferred
 */
export function prefersHighContrast() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// ===== COMPONENT INTEGRATION UTILITIES =====

/**
 * Creates a standardized component hook
 * @param {string} componentType - Component type key
 * @param {Object} defaultConfig - Default component configuration
 * @returns {Function} Component hook
 */
export function createStandardizedComponent(componentType, defaultConfig = {}) {
  return function useStandardizedComponent(userProps = {}) {
    // Get base configuration
    const baseConfig = componentConfigurations[componentType] || componentConfigurations.base;
    
    // Merge configurations
    const config = {
      ...baseConfig,
      ...defaultConfig,
      ...userProps
    };
    
    // Validate props in development
    if (process.env.NODE_ENV === 'development') {
      const propTypes = componentPropInterfaces[componentType];
      if (propTypes) {
        validateProps(config, propTypes);
      }
    }
    
    // Apply design system integration
    const designSystemClasses = generateComponentClasses(config);
    const visualEffectsClasses = applyVisualEffects(config);
    const performanceOptimizations = applyPerformanceOptimizations(config);
    const a11yAttributes = generateA11yAttributes(config);
    
    // Combine all classes
    const allClasses = cn(
      designSystemClasses,
      visualEffectsClasses,
      performanceOptimizations.classes.join(' '),
      config.className
    );
    
    // Apply reduced motion preferences
    if (config.respectReducedMotion && prefersReducedMotion()) {
      config.animationLevel = 'none';
      config.enableTransitions = false;
      config.enableHoverAnimations = false;
    }
    
    // Apply mobile optimizations
    if (config.reduceEffectsOnMobile && matchesBreakpoint('sm')) {
      config.visualEffects = 'subtle';
      config.enableGlassmorphism = false;
      config.enableTextures = false;
    }
    
    return {
      ...config,
      className: allClasses,
      ...a11yAttributes,
      ...performanceOptimizations.props
    };
  };
}

/**
 * List of design system props that should not be passed to DOM elements
 */
const DESIGN_SYSTEM_PROPS = [
  'shadowLevel',
  'visualEffects', 
  'animationLevel',
  'useDesignTokens',
  'respectReducedMotion',
  'optimizeImages',
  'withFeedback',
  'feedbackType',
  'enableGlassmorphism',
  'glassVariant',
  'enableGradientOverlays',
  'gradientType',
  'enableTextures',
  'textureType',
  'enableColoredShadows',
  'shadowColor',
  'enableMicroInteractions',
  'enableHoverAnimations',
  'enableFocusAnimations',
  'enableLazyImages',
  'enableIntersectionObserver',
  'enableConnectionAwareLoading',
  'enableVirtualization',
  'reduceEffectsOnMobile',
  'variant',
  'size',
  'loading',
  'lazy'
];

/**
 * Filters out design system props that shouldn't be passed to DOM elements
 * @param {Object} props - Props object to filter
 * @returns {Object} Filtered props safe for DOM elements
 */
export function filterDOMProps(props) {
  const filtered = {};
  
  Object.entries(props).forEach(([key, value]) => {
    if (!DESIGN_SYSTEM_PROPS.includes(key)) {
      filtered[key] = value;
    }
  });
  
  return filtered;
}

/**
 * Merges component configurations with proper precedence
 * @param {...Object} configs - Configuration objects to merge
 * @returns {Object} Merged configuration
 */
export function mergeComponentConfigs(...configs) {
  const merged = {};
  
  configs.forEach(config => {
    if (!config) return;
    
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'className') {
        merged[key] = cn(merged[key], value);
      } else if (key === 'style' && typeof value === 'object') {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    });
  });
  
  return merged;
}

// ===== THEME UTILITIES =====

/**
 * Gets current theme mode
 * @returns {string} Current theme ('light' | 'dark' | 'system')
 */
export function getCurrentTheme() {
  if (typeof document === 'undefined') return 'light';
  
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (document.documentElement.classList.contains('light')) return 'light';
  return 'system';
}

/**
 * Sets theme mode
 * @param {string} theme - Theme mode ('light' | 'dark' | 'system')
 */
export function setTheme(theme) {
  if (typeof document === 'undefined') return;
  
  document.documentElement.classList.remove('light', 'dark');
  
  if (theme !== 'system') {
    document.documentElement.classList.add(theme);
  }
  
  // Store preference
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', theme);
  }
}

/**
 * Gets system theme preference
 * @returns {string} System theme preference ('light' | 'dark')
 */
export function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ===== ANIMATION UTILITIES =====

/**
 * Creates animation configuration based on user preferences
 * @param {Object} config - Animation configuration
 * @returns {Object} Processed animation configuration
 */
export function processAnimationConfig(config) {
  const processed = { ...config };
  
  // Respect reduced motion
  if (prefersReducedMotion()) {
    processed.animationLevel = 'none';
    processed.enableTransitions = false;
    processed.enableHoverAnimations = false;
    processed.enableFocusAnimations = false;
    processed.enableMicroInteractions = false;
  }
  
  // Reduce animations on mobile for performance
  if (matchesBreakpoint('sm')) {
    if (processed.animationLevel === 'enhanced') {
      processed.animationLevel = 'standard';
    }
    processed.enableComplexAnimations = false;
  }
  
  return processed;
}

/**
 * Gets animation duration based on level
 * @param {string} level - Animation level
 * @returns {number} Duration in milliseconds
 */
export function getAnimationDuration(level) {
  const durations = {
    none: 0,
    minimal: 150,
    standard: 200,
    enhanced: 300
  };
  
  return durations[level] || durations.standard;
}

// ===== VALIDATION UTILITIES =====

/**
 * Validates design system configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export function validateDesignSystemConfig(config) {
  const errors = [];
  const warnings = [];
  
  // Check required design system integration
  if (!config.useDesignTokens) {
    warnings.push('Component not using design tokens - consider enabling useDesignTokens');
  }
  
  // Check accessibility
  if (!config.respectReducedMotion) {
    warnings.push('Component not respecting reduced motion preferences');
  }
  
  // Check performance
  if (config.enableComplexAnimations && !config.reduceEffectsOnMobile) {
    warnings.push('Complex animations enabled without mobile optimization');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ===== EXPORT UTILITIES =====

export const designSystemUtils = {
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
};

export default designSystemUtils;