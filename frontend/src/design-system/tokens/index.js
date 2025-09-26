// Design Tokens for Tattoo Artist Directory
// These tokens provide a single source of truth for design values

export const colors = {
  // Primary Brand Color (Eggplant)
  primary: {
    50: '#f7f6f7',   // Very light eggplant
    100: '#eeecee',
    200: '#ddd9dd',
    300: '#c4bcc4',
    400: '#a599a5',
    500: '#5c475c',  // Primary brand eggplant
    600: '#523f52',
    700: '#453645',
    800: '#382d38',
    900: '#2b222b',
  },
  
  // Neutral Colors (Davy's Gray to Silver)
  neutral: {
    50: '#f8f8f8',
    100: '#ebebeb',  // Off white (anti-flash white)
    200: '#d6d6d6',
    300: '#bfc0c0',  // Neutral light (silver)
    400: '#a8a9a9',
    500: '#919292',
    600: '#7a7b7b',
    700: '#636464',
    800: '#5b585f',  // Neutral dark (Davy's gray)
    900: '#4a474d',
  },
  
  // Accent Color (Coral)
  accent: {
    50: '#fef7f4',
    100: '#fdeee8',
    200: '#fbd5c5',
    300: '#f8bca2',
    400: '#f4a37f',
    500: '#ef8354',  // Accent coral
    600: '#e6653b',
    700: '#cc4a22',
    800: '#b33f1d',
    900: '#993518',
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fefce8',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  }
};

export const typography = {
  // Font Families
  fonts: {
    brand: ['Rock Salt', 'cursive'],      // For logo and special headings
    heading: ['Merienda', 'serif'],       // For main headings
    body: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'], // For body text
    mono: ['var(--font-geist-mono)', 'monospace'],    // For code/technical text
  },
  
  // Type Scale (1.25 ratio)
  scale: {
    xs: '0.75rem',    // 12px
    sm: '0.9375rem',  // 15px
    base: '1.125rem', // 18px
    lg: '1.5rem',     // 24px
    xl: '1.875rem',   // 30px
    '2xl': '2.3125rem', // 37px
    '3xl': '2.875rem',  // 46px
  },
  
  // Font Weights
  weights: {
    light: 300,
    regular: 400,
    semibold: 600,
    bold: 700,
  },
  
  // Line Heights
  leading: {
    tight: 1.2,    // Headings
    normal: 1.5,   // Body text
    ui: 1.4,       // UI elements
  },
  
  // Letter Spacing
  tracking: {
    tight: '-0.02em',  // Large text
    normal: '0',       // Body text
    wide: '0.05em',    // Small caps
  }
};

export const spacing = {
  // Base unit: 4px
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  7: '1.75rem',  // 28px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

// Import comprehensive animations from dedicated file
import { animations as animationTokens, animationClasses, animationPatterns } from './animations';

export const animations = animationTokens;
export { animationClasses, animationPatterns };

// Semantic token mappings for common use cases
export const semantic = {
  colors: {
    background: {
      primary: '#ffffff',
      secondary: colors.neutral[100],
      muted: colors.neutral[200],
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      muted: colors.neutral[600],
      inverse: colors.neutral[100],
    },
    border: {
      default: colors.neutral[300],
      muted: colors.neutral[200],
      strong: colors.neutral[400],
    },
    interactive: {
      primary: colors.primary[500],
      primaryHover: colors.primary[600],
      secondary: colors.neutral[200],
      secondaryHover: colors.neutral[300],
      accent: colors.accent[500],
      accentHover: colors.accent[600],
    },
    feedback: {
      success: colors.success[500],
      warning: colors.warning[500],
      error: colors.error[500],
      info: colors.primary[500],
    }
  },
  
  typography: {
    heading1: {
      fontSize: typography.scale['3xl'],
      fontWeight: typography.weights.bold,
      lineHeight: typography.leading.tight,
      letterSpacing: typography.tracking.tight,
    },
    heading2: {
      fontSize: typography.scale['2xl'],
      fontWeight: typography.weights.bold,
      lineHeight: typography.leading.tight,
      letterSpacing: typography.tracking.tight,
    },
    heading3: {
      fontSize: typography.scale.xl,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.leading.tight,
    },
    bodyLarge: {
      fontSize: typography.scale.lg,
      lineHeight: typography.leading.normal,
    },
    body: {
      fontSize: typography.scale.base,
      lineHeight: typography.leading.normal,
    },
    bodySmall: {
      fontSize: typography.scale.sm,
      lineHeight: typography.leading.ui,
    },
    caption: {
      fontSize: typography.scale.xs,
      lineHeight: typography.leading.ui,
    },
  }
};

// Export all tokens as a single object for convenience
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  semantic,
};

export default tokens;