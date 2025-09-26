/**
 * Unified Component Configuration System
 * Standardizes prop interfaces and configuration across all enhanced components
 */

// ===== CORE CONFIGURATION TYPES =====

/**
 * Standard size variants used across all components
 */
const COMPONENT_SIZES = {
  xs: 'xs',
  sm: 'sm', 
  md: 'md',
  lg: 'lg',
  xl: 'xl'
};

/**
 * Standard variant types used across all components
 */
const COMPONENT_VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  outline: 'outline',
  ghost: 'ghost',
  destructive: 'destructive'
};

/**
 * Visual effects configuration levels
 */
const VISUAL_EFFECTS_LEVELS = {
  none: 'none',
  subtle: 'subtle',
  medium: 'medium',
  strong: 'strong',
  premium: 'premium'
};

/**
 * Shadow elevation levels
 */
const SHADOW_LEVELS = {
  flat: 'flat',
  surface: 'surface',
  raised: 'raised',
  floating: 'floating',
  premium: 'premium'
};

/**
 * Animation intensity levels
 */
const ANIMATION_LEVELS = {
  none: 'none',
  minimal: 'minimal',
  standard: 'standard',
  enhanced: 'enhanced'
};

// ===== STANDARDIZED PROP INTERFACES =====

/**
 * Base props that all enhanced components should support
 */
const baseComponentProps = {
  // Core styling
  className: '',
  size: COMPONENT_SIZES.md,
  variant: COMPONENT_VARIANTS.primary,
  
  // Visual effects
  shadowLevel: SHADOW_LEVELS.surface,
  visualEffects: VISUAL_EFFECTS_LEVELS.subtle,
  animationLevel: ANIMATION_LEVELS.standard,
  
  // Accessibility
  'aria-label': undefined,
  'aria-describedby': undefined,
  'data-testid': undefined,
  
  // Interaction states
  disabled: false,
  loading: false,
  
  // Design system integration
  useDesignTokens: true,
  respectReducedMotion: true,
  
  // Performance
  lazy: false,
  optimizeImages: true
};

/**
 * Enhanced search component configuration
 */
const searchComponentConfig = {
  ...baseComponentProps,
  
  // Search-specific props
  placeholder: 'Search...',
  enableAdvancedSearch: true,
  enableStyleFilter: true,
  enableLocationFilter: true,
  enableSavedSearches: false,
  enableRealTimeValidation: true,
  enableProgressIndicators: true,
  
  // Suggestions and feedback
  showSuggestions: true,
  maxSuggestions: 5,
  debounceMs: 300,
  
  // Results configuration
  maxResults: 50,
  enableInfiniteScroll: false,
  
  // Callbacks
  onSearch: undefined,
  onSuggestionSelect: undefined,
  onFilterChange: undefined,
  onClear: undefined
};

/**
 * Enhanced navigation component configuration
 */
const navigationComponentConfig = {
  ...baseComponentProps,
  
  // Navigation-specific props
  showBreadcrumbs: true,
  enableContextualHelp: true,
  enableKeyboardShortcuts: true,
  enableGestureSupport: true,
  
  // Mobile optimization
  mobileOptimized: true,
  collapsible: true,
  
  // Tooltip configuration
  tooltipDelay: 300,
  tooltipPosition: 'bottom',
  
  // Callbacks
  onNavigate: undefined,
  onHelpToggle: undefined
};

/**
 * Enhanced data display component configuration
 */
const dataDisplayConfig = {
  ...baseComponentProps,
  
  // Display modes
  displayMode: 'grid', // 'grid' | 'list' | 'map' | 'gallery'
  cardType: 'default', // 'artist' | 'studio' | 'style' | 'default'
  
  // Loading and empty states
  showLoadingStates: true,
  showEmptyStates: true,
  showErrorStates: true,
  
  // Pagination
  enablePagination: true,
  itemsPerPage: 20,
  
  // Visual enhancements
  enableHoverEffects: true,
  enableTransitions: true,
  
  // Performance
  enableLazyLoading: true,
  enableVirtualization: false,
  
  // Callbacks
  onItemClick: undefined,
  onLoadMore: undefined,
  onError: undefined
};

/**
 * Enhanced feedback component configuration
 */
const feedbackComponentConfig = {
  ...baseComponentProps,
  
  // Toast configuration
  toastPosition: 'top-right', // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  toastDuration: 5000,
  enableAutoClose: true,
  enableActionButtons: true,
  
  // Progress indicators
  showProgressIndicators: true,
  enableStepIndicators: true,
  
  // Validation feedback
  enableRealTimeValidation: true,
  showValidationIcons: true,
  
  // Error handling
  enableErrorRecovery: true,
  showErrorDetails: false,
  
  // Callbacks
  onToastClose: undefined,
  onActionClick: undefined,
  onRetry: undefined
};

/**
 * Enhanced visual effects component configuration
 */
const visualEffectsConfig = {
  ...baseComponentProps,
  
  // Shadow system
  enableElevationShadows: true,
  enableColoredShadows: false,
  
  // Glassmorphism
  enableGlassmorphism: false,
  glassVariant: 'card', // 'navigation' | 'modal' | 'card' | 'panel'
  
  // Gradients and overlays
  enableGradientOverlays: false,
  gradientType: 'subtle', // 'subtle' | 'medium' | 'hero'
  
  // Textures
  enableTextures: false,
  textureType: 'none', // 'none' | 'noise' | 'paper' | 'fabric'
  
  // Animations and micro-interactions
  enableMicroInteractions: true,
  enableHoverAnimations: true,
  enableFocusAnimations: true,
  
  // Performance considerations
  reduceEffectsOnMobile: true,
  respectReducedMotion: true
};

/**
 * Performance optimization configuration
 */
const performanceConfig = {
  ...baseComponentProps,
  
  // Image optimization
  enableLazyImages: true,
  enableWebPOptimization: true,
  enableResponsiveSizing: true,
  enableConnectionAwareLoading: true,
  
  // Scroll optimization
  enableInfiniteScroll: false,
  enableVirtualization: false,
  scrollDebounceMs: 100,
  
  // Preloading
  enableSmartPreloading: true,
  preloadOnHover: true,
  preloadOnViewport: false,
  
  // Caching
  enableComponentCaching: true,
  cacheStrategy: 'memory', // 'memory' | 'localStorage' | 'sessionStorage'
  
  // Performance monitoring
  enablePerformanceMetrics: false,
  trackLoadTimes: false,
  trackInteractionTimes: false
};

// ===== COMPONENT-SPECIFIC CONFIGURATIONS =====

/**
 * StyleGallery component configuration
 */
const styleGalleryConfig = {
  ...dataDisplayConfig,
  
  // Gallery-specific props
  initialStyle: '',
  showFilters: true,
  maxImages: 50,
  columns: 4, // 2 | 3 | 4 | 5 | 6
  
  // Filtering options
  enableSearch: true,
  enableMotifFiltering: true,
  enableCharacteristicFiltering: true,
  enableStyleFiltering: true,
  
  // Lightbox functionality
  enableLightbox: true,
  enableKeyboardNavigation: true,
  
  // Artist/Studio filtering
  artistId: null,
  studioId: null,
  
  // Performance
  lazyLoading: true,
  enableIntersectionObserver: true,
  
  // Callbacks
  onImageClick: undefined,
  onFilterChange: undefined,
  onLightboxOpen: undefined,
  onLightboxClose: undefined
};

/**
 * StarRating component configuration
 */
const starRatingConfig = {
  ...baseComponentProps,
  
  // Rating display
  rating: 0,
  reviewCount: 0,
  maxRating: 5,
  
  // Visual options
  showCount: true,
  showBreakdown: false,
  showTooltip: true,
  
  // Interaction
  interactive: false,
  allowHalfStars: true,
  
  // Breakdown data
  ratingBreakdown: null,
  
  // Callbacks
  onRatingClick: undefined,
  onRatingHover: undefined
};

/**
 * Toast notification configuration
 */
const toastConfig = {
  ...feedbackComponentConfig,
  
  // Toast types
  type: 'info', // 'success' | 'error' | 'warning' | 'info'
  
  // Content
  title: '',
  message: '',
  
  // Behavior
  duration: 5000,
  persistent: false,
  
  // Actions
  action: null, // { label: string, onClick: function }
  dismissible: true,
  
  // Positioning
  position: 'top-right',
  
  // Callbacks
  onClose: undefined,
  onActionClick: undefined
};

/**
 * Empty state component configuration
 */
const emptyStateConfig = {
  ...baseComponentProps,
  
  // Empty state variants
  variant: 'search', // 'search' | 'onboarding' | 'favorites' | 'portfolio' | 'loading' | 'error' | 'filter' | 'custom'
  
  // Content
  title: '',
  description: '',
  illustration: '',
  
  // Actions
  actions: null,
  suggestions: [],
  
  // Visual options
  showIllustration: true,
  showSuggestions: true,
  
  // Callbacks
  onActionClick: undefined,
  onSuggestionClick: undefined
};

// ===== CONFIGURATION UTILITIES =====

/**
 * Merges component configuration with user props
 * @param {Object} defaultConfig - Default component configuration
 * @param {Object} userProps - User-provided props
 * @returns {Object} Merged configuration
 */
function mergeComponentConfig(defaultConfig, userProps = {}) {
  return {
    ...defaultConfig,
    ...userProps,
    // Ensure nested objects are properly merged
    ...(defaultConfig.style && userProps.style && {
      style: { ...defaultConfig.style, ...userProps.style }
    }),
    ...(defaultConfig.className && userProps.className && {
      className: `${defaultConfig.className} ${userProps.className}`.trim()
    })
  };
}

/**
 * Validates component configuration against expected schema
 * @param {Object} config - Component configuration to validate
 * @param {Object} schema - Expected configuration schema
 * @returns {Object} Validation result with errors if any
 */
function validateComponentConfig(config, schema) {
  const errors = [];
  const warnings = [];
  
  // Check required props
  if (schema.required) {
    schema.required.forEach(prop => {
      if (config[prop] === undefined || config[prop] === null) {
        errors.push(`Required prop '${prop}' is missing`);
      }
    });
  }
  
  // Check prop types
  if (schema.props) {
    Object.entries(schema.props).forEach(([prop, expectedType]) => {
      if (config[prop] !== undefined) {
        const actualType = typeof config[prop];
        if (actualType !== expectedType && expectedType !== 'any') {
          warnings.push(`Prop '${prop}' expected ${expectedType} but got ${actualType}`);
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Creates a standardized component configuration hook
 * @param {Object} defaultConfig - Default component configuration
 * @returns {Function} Hook function for component configuration
 */
function createComponentConfigHook(defaultConfig) {
  return function useComponentConfig(userProps = {}) {
    const config = mergeComponentConfig(defaultConfig, userProps);
    
    // Apply design system tokens if enabled
    if (config.useDesignTokens) {
      config.className = `${config.className || ''} design-system-component`.trim();
    }
    
    // Apply reduced motion preferences
    if (config.respectReducedMotion) {
      const prefersReducedMotion = typeof window !== 'undefined' && 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        config.animationLevel = ANIMATION_LEVELS.none;
        config.enableTransitions = false;
        config.enableHoverAnimations = false;
      }
    }
    
    // Apply mobile optimizations
    if (config.reduceEffectsOnMobile && typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        config.visualEffects = VISUAL_EFFECTS_LEVELS.subtle;
        config.enableGlassmorphism = false;
        config.enableTextures = false;
      }
    }
    
    return config;
  };
}

// ===== COMPONENT CONFIGURATION SCHEMAS =====

/**
 * Schema definitions for component validation
 */
// Base props that are shared across components
const baseProps = {
  className: 'string',
  size: 'string',
  variant: 'string',
  disabled: 'boolean',
  loading: 'boolean'
};

const componentSchemas = {
  base: {
    required: [],
    props: baseProps
  },
  
  search: {
    required: ['onSearch'],
    props: {
      ...baseProps,
      placeholder: 'string',
      enableAdvancedSearch: 'boolean',
      onSearch: 'function'
    }
  },
  
  dataDisplay: {
    required: ['data'],
    props: {
      ...baseProps,
      data: 'object',
      displayMode: 'string',
      onItemClick: 'function'
    }
  },
  
  feedback: {
    required: ['message'],
    props: {
      ...baseProps,
      message: 'string',
      type: 'string',
      onClose: 'function'
    }
  }
};

// ===== EXPORT ALL CONFIGURATIONS =====

const componentConfigurations = {
  base: baseComponentProps,
  search: searchComponentConfig,
  navigation: navigationComponentConfig,
  dataDisplay: dataDisplayConfig,
  feedback: feedbackComponentConfig,
  visualEffects: visualEffectsConfig,
  performance: performanceConfig,
  styleGallery: styleGalleryConfig,
  starRating: starRatingConfig,
  toast: toastConfig,
  emptyState: emptyStateConfig
};

// Export all constants and functions
module.exports = {
  COMPONENT_SIZES,
  COMPONENT_VARIANTS,
  VISUAL_EFFECTS_LEVELS,
  SHADOW_LEVELS,
  ANIMATION_LEVELS,
  baseComponentProps,
  searchComponentConfig,
  navigationComponentConfig,
  dataDisplayConfig,
  feedbackComponentConfig,
  visualEffectsConfig,
  performanceConfig,
  styleGalleryConfig,
  starRatingConfig,
  toastConfig,
  emptyStateConfig,
  mergeComponentConfig,
  validateComponentConfig,
  createComponentConfigHook,
  componentSchemas,
  componentConfigurations
};

module.exports.default = componentConfigurations;