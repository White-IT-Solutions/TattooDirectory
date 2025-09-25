/**
 * Design Tokens Utility
 * Provides programmatic access to CSS custom properties and design tokens
 */

/**
 * Get a CSS custom property value from the document root
 * @param {string} property - The CSS custom property name (with or without --)
 * @returns {string} The computed value of the CSS custom property
 */
export function getCSSCustomProperty(property) {
  const propertyName = property.startsWith('--') ? property : `--${property}`;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(propertyName)
    .trim();
}

/**
 * Set a CSS custom property on the document root
 * @param {string} property - The CSS custom property name (with or without --)
 * @param {string} value - The value to set
 */
export function setCSSCustomProperty(property, value) {
  const propertyName = property.startsWith('--') ? property : `--${property}`;
  document.documentElement.style.setProperty(propertyName, value);
}

/**
 * Design token getters for common use cases
 */
export const designTokens = {
  // Color tokens
  colors: {
    primary: (shade = 500) => getCSSCustomProperty(`color-primary-${shade}`),
    neutral: (shade = 500) => getCSSCustomProperty(`color-neutral-${shade}`),
    accent: (shade = 500) => getCSSCustomProperty(`color-accent-${shade}`),
    success: (shade = 500) => getCSSCustomProperty(`color-success-${shade}`),
    warning: (shade = 500) => getCSSCustomProperty(`color-warning-${shade}`),
    error: (shade = 500) => getCSSCustomProperty(`color-error-${shade}`),
  },

  // Semantic colors
  semantic: {
    background: {
      primary: () => getCSSCustomProperty('background-primary'),
      secondary: () => getCSSCustomProperty('background-secondary'),
      muted: () => getCSSCustomProperty('background-muted'),
      subtle: () => getCSSCustomProperty('background-subtle'),
    },
    text: {
      primary: () => getCSSCustomProperty('text-primary'),
      secondary: () => getCSSCustomProperty('text-secondary'),
      muted: () => getCSSCustomProperty('text-muted'),
      subtle: () => getCSSCustomProperty('text-subtle'),
      inverse: () => getCSSCustomProperty('text-inverse'),
    },
    border: {
      primary: () => getCSSCustomProperty('border-primary'),
      secondary: () => getCSSCustomProperty('border-secondary'),
      muted: () => getCSSCustomProperty('border-muted'),
      subtle: () => getCSSCustomProperty('border-subtle'),
    },
    interactive: {
      primary: () => getCSSCustomProperty('interactive-primary'),
      primaryHover: () => getCSSCustomProperty('interactive-primary-hover'),
      secondary: () => getCSSCustomProperty('interactive-secondary'),
      secondaryHover: () => getCSSCustomProperty('interactive-secondary-hover'),
      accent: () => getCSSCustomProperty('interactive-accent'),
      accentHover: () => getCSSCustomProperty('interactive-accent-hover'),
    },
    feedback: {
      success: () => getCSSCustomProperty('feedback-success'),
      warning: () => getCSSCustomProperty('feedback-warning'),
      error: () => getCSSCustomProperty('feedback-error'),
      info: () => getCSSCustomProperty('feedback-info'),
    },
  },

  // Typography tokens
  typography: {
    fontSize: {
      xs: () => getCSSCustomProperty('font-size-xs'),
      sm: () => getCSSCustomProperty('font-size-sm'),
      base: () => getCSSCustomProperty('font-size-base'),
      lg: () => getCSSCustomProperty('font-size-lg'),
      xl: () => getCSSCustomProperty('font-size-xl'),
      '2xl': () => getCSSCustomProperty('font-size-2xl'),
      '3xl': () => getCSSCustomProperty('font-size-3xl'),
    },
    fontFamily: {
      brand: () => getCSSCustomProperty('font-family-brand'),
      heading: () => getCSSCustomProperty('font-family-heading'),
      body: () => getCSSCustomProperty('font-family-body'),
      mono: () => getCSSCustomProperty('font-family-mono'),
    },
    fontWeight: {
      light: () => getCSSCustomProperty('font-weight-light'),
      regular: () => getCSSCustomProperty('font-weight-regular'),
      semibold: () => getCSSCustomProperty('font-weight-semibold'),
      bold: () => getCSSCustomProperty('font-weight-bold'),
    },
    lineHeight: {
      tight: () => getCSSCustomProperty('line-height-tight'),
      normal: () => getCSSCustomProperty('line-height-normal'),
      ui: () => getCSSCustomProperty('line-height-ui'),
    },
    letterSpacing: {
      tight: () => getCSSCustomProperty('letter-spacing-tight'),
      normal: () => getCSSCustomProperty('letter-spacing-normal'),
      wide: () => getCSSCustomProperty('letter-spacing-wide'),
    },
  },

  // Spacing tokens
  spacing: (size) => getCSSCustomProperty(`spacing-${size}`),

  // Border radius tokens
  borderRadius: {
    none: () => getCSSCustomProperty('radius-none'),
    sm: () => getCSSCustomProperty('radius-sm'),
    base: () => getCSSCustomProperty('radius'),
    md: () => getCSSCustomProperty('radius-md'),
    lg: () => getCSSCustomProperty('radius-lg'),
    xl: () => getCSSCustomProperty('radius-xl'),
    '2xl': () => getCSSCustomProperty('radius-2xl'),
    '3xl': () => getCSSCustomProperty('radius-3xl'),
    full: () => getCSSCustomProperty('radius-full'),
  },

  // Shadow tokens
  shadows: {
    xs: () => getCSSCustomProperty('shadow-xs'),
    sm: () => getCSSCustomProperty('shadow-sm'),
    base: () => getCSSCustomProperty('shadow'),
    md: () => getCSSCustomProperty('shadow-md'),
    lg: () => getCSSCustomProperty('shadow-lg'),
    xl: () => getCSSCustomProperty('shadow-xl'),
    '2xl': () => getCSSCustomProperty('shadow-2xl'),
    inner: () => getCSSCustomProperty('shadow-inner'),
    none: () => getCSSCustomProperty('shadow-none'),
    // Colored shadows
    primary: () => getCSSCustomProperty('shadow-primary'),
    accent: () => getCSSCustomProperty('shadow-accent'),
    success: () => getCSSCustomProperty('shadow-success'),
    warning: () => getCSSCustomProperty('shadow-warning'),
    error: () => getCSSCustomProperty('shadow-error'),
  },

  // Animation tokens
  animation: {
    duration: {
      75: () => getCSSCustomProperty('duration-75'),
      100: () => getCSSCustomProperty('duration-100'),
      150: () => getCSSCustomProperty('duration-150'),
      200: () => getCSSCustomProperty('duration-200'),
      300: () => getCSSCustomProperty('duration-300'),
      500: () => getCSSCustomProperty('duration-500'),
      700: () => getCSSCustomProperty('duration-700'),
      1000: () => getCSSCustomProperty('duration-1000'),
    },
    easing: {
      linear: () => getCSSCustomProperty('ease-linear'),
      in: () => getCSSCustomProperty('ease-in'),
      out: () => getCSSCustomProperty('ease-out'),
      inOut: () => getCSSCustomProperty('ease-in-out'),
      back: () => getCSSCustomProperty('ease-back'),
      bounce: () => getCSSCustomProperty('ease-bounce'),
    },
  },

  // Z-index tokens
  zIndex: {
    hide: () => getCSSCustomProperty('z-index-hide'),
    auto: () => getCSSCustomProperty('z-index-auto'),
    base: () => getCSSCustomProperty('z-index-base'),
    docked: () => getCSSCustomProperty('z-index-docked'),
    dropdown: () => getCSSCustomProperty('z-index-dropdown'),
    sticky: () => getCSSCustomProperty('z-index-sticky'),
    banner: () => getCSSCustomProperty('z-index-banner'),
    overlay: () => getCSSCustomProperty('z-index-overlay'),
    modal: () => getCSSCustomProperty('z-index-modal'),
    popover: () => getCSSCustomProperty('z-index-popover'),
    skipLink: () => getCSSCustomProperty('z-index-skipLink'),
    toast: () => getCSSCustomProperty('z-index-toast'),
    tooltip: () => getCSSCustomProperty('z-index-tooltip'),
  },

  // Component tokens
  components: {
    button: {
      height: {
        sm: () => getCSSCustomProperty('button-height-sm'),
        md: () => getCSSCustomProperty('button-height-md'),
        lg: () => getCSSCustomProperty('button-height-lg'),
      },
      paddingX: {
        sm: () => getCSSCustomProperty('button-padding-x-sm'),
        md: () => getCSSCustomProperty('button-padding-x-md'),
        lg: () => getCSSCustomProperty('button-padding-x-lg'),
      },
      radius: () => getCSSCustomProperty('button-radius'),
    },
    input: {
      height: {
        sm: () => getCSSCustomProperty('input-height-sm'),
        md: () => getCSSCustomProperty('input-height-md'),
        lg: () => getCSSCustomProperty('input-height-lg'),
      },
      paddingX: () => getCSSCustomProperty('input-padding-x'),
      radius: () => getCSSCustomProperty('input-radius'),
      borderWidth: () => getCSSCustomProperty('input-border-width'),
    },
    card: {
      padding: {
        sm: () => getCSSCustomProperty('card-padding-sm'),
        md: () => getCSSCustomProperty('card-padding-md'),
        lg: () => getCSSCustomProperty('card-padding-lg'),
      },
      radius: () => getCSSCustomProperty('card-radius'),
      borderWidth: () => getCSSCustomProperty('card-border-width'),
    },
    modal: {
      backdrop: () => getCSSCustomProperty('modal-backdrop'),
      radius: () => getCSSCustomProperty('modal-radius'),
      padding: () => getCSSCustomProperty('modal-padding'),
      maxWidth: () => getCSSCustomProperty('modal-max-width'),
    },
    toast: {
      radius: () => getCSSCustomProperty('toast-radius'),
      padding: () => getCSSCustomProperty('toast-padding'),
      maxWidth: () => getCSSCustomProperty('toast-max-width'),
    },
  },
};

/**
 * Theme utilities
 */
export const themeUtils = {
  /**
   * Check if dark mode is currently active
   * @returns {boolean} True if dark mode is active
   */
  isDarkMode() {
    return (
      document.documentElement.classList.contains('dark') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  },

  /**
   * Toggle dark mode by adding/removing the 'dark' class
   */
  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  },

  /**
   * Set dark mode explicitly
   * @param {boolean} isDark - Whether to enable dark mode
   */
  setDarkMode(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  /**
   * Get the current theme preference
   * @returns {'light' | 'dark' | 'system'} The current theme preference
   */
  getThemePreference() {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return 'system';
  },

  /**
   * Set the theme preference
   * @param {'light' | 'dark' | 'system'} theme - The theme to set
   */
  setThemePreference(theme) {
    if (theme === 'system') {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    } else {
      localStorage.setItem('theme', theme);
      this.setDarkMode(theme === 'dark');
    }
  },
};

/**
 * Responsive utilities
 */
export const responsiveUtils = {
  /**
   * Get current breakpoint based on window width
   * @returns {'sm' | 'md' | 'lg' | 'xl' | '2xl'} Current breakpoint
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width >= 1536) return '2xl';
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 640) return 'sm';
    return 'xs';
  },

  /**
   * Check if current viewport matches a breakpoint
   * @param {'sm' | 'md' | 'lg' | 'xl' | '2xl'} breakpoint - Breakpoint to check
   * @returns {boolean} True if viewport matches or exceeds breakpoint
   */
  matchesBreakpoint(breakpoint) {
    const breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    };
    return window.innerWidth >= breakpoints[breakpoint];
  },

  /**
   * Create a media query listener for a breakpoint
   * @param {'sm' | 'md' | 'lg' | 'xl' | '2xl'} breakpoint - Breakpoint to listen for
   * @param {function} callback - Callback function to execute when breakpoint changes
   * @returns {MediaQueryList} The media query list object
   */
  createBreakpointListener(breakpoint, callback) {
    const breakpoints = {
      sm: '(min-width: 640px)',
      md: '(min-width: 768px)',
      lg: '(min-width: 1024px)',
      xl: '(min-width: 1280px)',
      '2xl': '(min-width: 1536px)',
    };
    
    const mediaQuery = window.matchMedia(breakpoints[breakpoint]);
    mediaQuery.addListener(callback);
    return mediaQuery;
  },
};

/**
 * Animation utilities
 */
export const animationUtils = {
  /**
   * Create a CSS transition string
   * @param {string|string[]} properties - CSS properties to transition
   * @param {string} duration - Duration token (e.g., '200', '300')
   * @param {string} easing - Easing token (e.g., 'out', 'in-out')
   * @returns {string} CSS transition string
   */
  createTransition(properties, duration = '200', easing = 'out') {
    const props = Array.isArray(properties) ? properties : [properties];
    const durationValue = getCSSCustomProperty(`duration-${duration}`);
    const easingValue = getCSSCustomProperty(`ease-${easing}`);
    
    return props
      .map(prop => `${prop} ${durationValue} ${easingValue}`)
      .join(', ');
  },

  /**
   * Apply a CSS animation to an element
   * @param {HTMLElement} element - Element to animate
   * @param {string} animationName - CSS animation name
   * @param {string} duration - Duration token
   * @param {string} easing - Easing token
   * @param {function} onComplete - Callback when animation completes
   */
  animate(element, animationName, duration = '300', easing = 'out', onComplete) {
    const durationValue = getCSSCustomProperty(`duration-${duration}`);
    const easingValue = getCSSCustomProperty(`ease-${easing}`);
    
    element.style.animation = `${animationName} ${durationValue} ${easingValue}`;
    
    if (onComplete) {
      element.addEventListener('animationend', onComplete, { once: true });
    }
  },
};

export default designTokens;