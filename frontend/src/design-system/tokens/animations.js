/**
 * Animation Tokens for Micro-interactions and Animation System
 * Comprehensive animation system for the Tattoo Artist Directory
 */

export const animations = {
  // Transition Durations
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    back: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Hover States
  hover: {
    // Scale effects
    scaleUp: 'transform: scale(1.05); transition: transform 200ms ease-out;',
    scaleDown: 'transform: scale(0.95); transition: transform 200ms ease-out;',
    scaleSubtle: 'transform: scale(1.02); transition: transform 200ms ease-out;',
    
    // Color transitions
    colorPrimary: 'transition: color 200ms ease-out;',
    backgroundPrimary: 'transition: background-color 200ms ease-out;',
    borderPrimary: 'transition: border-color 200ms ease-out;',
    
    // Shadow effects
    shadowLift: 'transition: box-shadow 200ms ease-out; box-shadow: var(--shadow-lg);',
    shadowGlow: 'transition: box-shadow 200ms ease-out; box-shadow: 0 0 20px rgba(92, 71, 92, 0.3);',
    
    // Combined effects
    cardHover: 'transform: translateY(-2px); box-shadow: var(--shadow-lg); transition: all 200ms ease-out;',
    buttonHover: 'transform: translateY(-1px); box-shadow: var(--shadow-md); transition: all 200ms ease-out;',
  },
  
  // Focus States (Accessibility)
  focus: {
    ring: {
      width: '2px',
      offset: '2px',
      color: 'var(--focus-ring)',
      style: 'solid',
      transition: 'all 150ms ease-out',
    },
    outline: 'outline: 2px solid var(--focus-ring); outline-offset: 2px; transition: outline 150ms ease-out;',
    glow: 'box-shadow: 0 0 0 3px rgba(92, 71, 92, 0.3); transition: box-shadow 150ms ease-out;',
  },
  
  // Press/Active States
  press: {
    scale: 'transform: scale(0.95); transition: transform 75ms ease-in;',
    scaleSubtle: 'transform: scale(0.98); transition: transform 75ms ease-in;',
    brightness: 'filter: brightness(0.9); transition: filter 75ms ease-in;',
  },
  
  // Loading States
  loading: {
    spin: {
      animation: 'spin 1s linear infinite',
      keyframes: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
    },
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      keyframes: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
    },
    bounce: {
      animation: 'bounce 1s infinite',
      keyframes: `
        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
      `,
    },
    skeleton: {
      animation: 'skeleton-loading 1.5s ease-in-out infinite',
      keyframes: `
        @keyframes skeleton-loading {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
      `,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      backgroundSize: '200px 100%',
    },
  },
  
  // Page Transitions
  pageTransition: {
    fadeIn: {
      animation: 'fadeIn 300ms ease-out',
      keyframes: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
    },
    slideInFromRight: {
      animation: 'slideInFromRight 300ms ease-out',
      keyframes: `
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `,
    },
    slideInFromLeft: {
      animation: 'slideInFromLeft 300ms ease-out',
      keyframes: `
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `,
    },
    slideUp: {
      animation: 'slideUp 300ms ease-out',
      keyframes: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `,
    },
  },
  
  // Micro-feedback Animations
  microFeedback: {
    success: {
      animation: 'successPulse 600ms ease-out',
      keyframes: `
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
          100% { transform: scale(1); }
        }
      `,
    },
    error: {
      animation: 'errorShake 400ms ease-in-out',
      keyframes: `
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `,
    },
    buttonPress: {
      animation: 'buttonPress 150ms ease-out',
      keyframes: `
        @keyframes buttonPress {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `,
    },
    ripple: {
      animation: 'ripple 600ms ease-out',
      keyframes: `
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
      `,
    },
  },
  
  // Tooltip Animations
  tooltip: {
    fadeInUp: {
      animation: 'tooltipFadeInUp 200ms ease-out',
      keyframes: `
        @keyframes tooltipFadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
    },
    fadeOutDown: {
      animation: 'tooltipFadeOutDown 150ms ease-in',
      keyframes: `
        @keyframes tooltipFadeOutDown {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(10px); }
        }
      `,
    },
  },
  
  // Modal/Overlay Animations
  modal: {
    backdropFadeIn: {
      animation: 'backdropFadeIn 200ms ease-out',
      keyframes: `
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
    },
    contentSlideIn: {
      animation: 'modalContentSlideIn 300ms ease-out',
      keyframes: `
        @keyframes modalContentSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `,
    },
    contentSlideOut: {
      animation: 'modalContentSlideOut 200ms ease-in',
      keyframes: `
        @keyframes modalContentSlideOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(-10px); }
        }
      `,
    },
  },
  
  // Toast Notifications
  toast: {
    slideInRight: {
      animation: 'toastSlideInRight 300ms ease-out',
      keyframes: `
        @keyframes toastSlideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `,
    },
    slideOutRight: {
      animation: 'toastSlideOutRight 200ms ease-in',
      keyframes: `
        @keyframes toastSlideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `,
    },
  },
};

// Utility classes for common animations
export const animationClasses = {
  // Hover effects
  'hover-scale': 'transition-transform duration-200 ease-out hover:scale-105',
  'hover-scale-subtle': 'transition-transform duration-200 ease-out hover:scale-102',
  'hover-lift': 'transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg',
  'hover-glow': 'transition-shadow duration-200 ease-out hover:shadow-primary',
  
  // Focus effects
  'focus-ring': 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-150',
  'focus-glow': 'focus:outline-none focus:shadow-[0_0_0_3px_rgba(92,71,92,0.3)] transition-shadow duration-150',
  
  // Press effects
  'active-scale': 'active:scale-95 transition-transform duration-75',
  'active-brightness': 'active:brightness-90 transition-all duration-75',
  
  // Loading states
  'animate-spin': 'animate-spin',
  'animate-pulse': 'animate-pulse',
  'animate-bounce': 'animate-bounce',
  
  // Page transitions
  'fade-in': 'animate-in fade-in duration-300',
  'slide-in-from-right': 'animate-in slide-in-from-right duration-300',
  'slide-in-from-left': 'animate-in slide-in-from-left duration-300',
  'slide-up': 'animate-in slide-in-from-bottom-4 duration-300',
  
  // Micro-feedback
  'success-pulse': 'animate-pulse-success',
  'error-shake': 'animate-shake',
  'button-press': 'animate-button-press',
};

// Predefined animation combinations for common UI patterns
export const animationPatterns = {
  // Interactive elements
  button: {
    base: 'transition-all duration-200 ease-out',
    hover: 'hover:-translate-y-0.5 hover:shadow-md',
    active: 'active:scale-95',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  },
  
  card: {
    base: 'transition-all duration-200 ease-out',
    hover: 'hover:-translate-y-1 hover:shadow-lg',
    focus: 'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
  },
  
  input: {
    base: 'transition-all duration-150 ease-out',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    error: 'border-error-500 focus:ring-error-500',
  },
  
  link: {
    base: 'transition-colors duration-200 ease-out',
    hover: 'hover:text-primary-600',
    underline: 'underline-offset-2 hover:underline',
  },
  
  // Layout animations
  page: {
    enter: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
    exit: 'animate-out fade-out slide-out-to-bottom-4 duration-200',
  },
  
  modal: {
    backdrop: 'animate-in fade-in duration-200',
    content: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
  },
  
  tooltip: {
    enter: 'animate-in fade-in slide-in-from-bottom-2 duration-200',
    exit: 'animate-out fade-out slide-out-to-bottom-2 duration-150',
  },
};

export default animations;