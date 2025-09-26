/**
 * Standardized Component Prop Interfaces
 * TypeScript-style prop definitions for consistent component interfaces
 */

// ===== BASE COMPONENT PROPS =====

/**
 * Base props that all components should extend
 */
export const BaseComponentProps = {
  // Core styling
  className: String,
  id: String,
  style: Object,
  
  // Size variants
  size: ['xs', 'sm', 'md', 'lg', 'xl'],
  
  // Visual variants
  variant: ['primary', 'secondary', 'accent', 'outline', 'ghost', 'destructive'],
  
  // State props
  disabled: Boolean,
  loading: Boolean,
  active: Boolean,
  
  // Accessibility props
  'aria-label': String,
  'aria-labelledby': String,
  'aria-describedby': String,
  'aria-expanded': Boolean,
  'aria-hidden': Boolean,
  role: String,
  tabIndex: Number,
  
  // Data attributes
  'data-testid': String,
  'data-cy': String,
  
  // Event handlers
  onClick: Function,
  onFocus: Function,
  onBlur: Function,
  onKeyDown: Function,
  onMouseEnter: Function,
  onMouseLeave: Function,
  
  // Design system integration
  useDesignTokens: Boolean,
  respectReducedMotion: Boolean,
  
  // Visual effects
  shadowLevel: ['flat', 'surface', 'raised', 'floating', 'premium'],
  visualEffects: ['none', 'subtle', 'medium', 'strong', 'premium'],
  animationLevel: ['none', 'minimal', 'standard', 'enhanced']
};

// ===== ENHANCED COMPONENT PROPS =====

/**
 * Enhanced Button component props
 */
export const EnhancedButtonProps = {
  ...BaseComponentProps,
  
  // Button-specific props
  type: ['button', 'submit', 'reset'],
  form: String,
  
  // Loading state
  loading: Boolean,
  loadingText: String,
  
  // Icon support
  leftIcon: [String, Object], // Icon name or component
  rightIcon: [String, Object],
  iconOnly: Boolean,
  
  // Feedback
  withFeedback: Boolean,
  feedbackType: ['press', 'success', 'error'],
  
  // Link behavior
  href: String,
  target: String,
  rel: String,
  
  // Callbacks
  onClick: Function,
  onPress: Function
};

/**
 * Enhanced Card component props
 */
export const EnhancedCardProps = {
  ...BaseComponentProps,
  
  // Card-specific props
  elevation: ['flat', 'low', 'medium', 'high', 'floating'],
  padding: ['none', 'sm', 'md', 'lg'],
  radius: ['none', 'sm', 'md', 'lg', 'xl'],
  
  // Interactive states
  hoverable: Boolean,
  clickable: Boolean,
  selectable: Boolean,
  selected: Boolean,
  
  // Visual enhancements
  gradient: Boolean,
  glassmorphism: Boolean,
  texture: ['none', 'noise', 'paper', 'fabric'],
  
  // Callbacks
  onCardClick: Function,
  onCardHover: Function,
  onCardSelect: Function
};

/**
 * Enhanced Input component props
 */
export const EnhancedInputProps = {
  ...BaseComponentProps,
  
  // Input-specific props
  type: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
  value: [String, Number],
  defaultValue: [String, Number],
  placeholder: String,
  
  // Validation
  required: Boolean,
  pattern: String,
  min: [String, Number],
  max: [String, Number],
  minLength: Number,
  maxLength: Number,
  
  // State
  error: [Boolean, String],
  success: Boolean,
  
  // Visual enhancements
  leftIcon: [String, Object],
  rightIcon: [String, Object],
  clearable: Boolean,
  
  // Behavior
  autoComplete: String,
  autoFocus: Boolean,
  readOnly: Boolean,
  
  // Callbacks
  onChange: Function,
  onInput: Function,
  onClear: Function,
  onValidate: Function
};

/**
 * Enhanced Search component props
 */
export const EnhancedSearchProps = {
  ...EnhancedInputProps,
  
  // Search-specific props
  searchType: ['artists', 'studios', 'styles', 'global'],
  initialQuery: String,
  
  // Advanced search
  enableAdvancedSearch: Boolean,
  enableStyleFilter: Boolean,
  enableLocationFilter: Boolean,
  enableSavedSearches: Boolean,
  
  // Suggestions
  showSuggestions: Boolean,
  suggestions: Array,
  maxSuggestions: Number,
  
  // Validation and feedback
  enableRealTimeValidation: Boolean,
  enableProgressIndicators: Boolean,
  debounceMs: Number,
  
  // Results
  maxResults: Number,
  enableInfiniteScroll: Boolean,
  
  // Filters
  filters: Array,
  activeFilters: Object,
  
  // Callbacks
  onSearch: Function,
  onSuggestionSelect: Function,
  onFilterChange: Function,
  onClear: Function,
  onAdvancedToggle: Function
};

/**
 * Enhanced Navigation component props
 */
export const EnhancedNavigationProps = {
  ...BaseComponentProps,
  
  // Navigation-specific props
  currentPage: String,
  breadcrumbs: Array,
  
  // Features
  showBreadcrumbs: Boolean,
  enableContextualHelp: Boolean,
  enableKeyboardShortcuts: Boolean,
  enableGestureSupport: Boolean,
  
  // Mobile optimization
  mobileOptimized: Boolean,
  collapsible: Boolean,
  
  // Help system
  contextualHelp: Object,
  keyboardShortcuts: Array,
  
  // Tooltip configuration
  tooltipDelay: Number,
  tooltipPosition: ['top', 'bottom', 'left', 'right'],
  
  // Callbacks
  onNavigate: Function,
  onHelpToggle: Function,
  onShortcutTrigger: Function
};

/**
 * Enhanced Data Display component props
 */
export const EnhancedDataDisplayProps = {
  ...BaseComponentProps,
  
  // Data props
  data: Array,
  loading: Boolean,
  error: [Boolean, String, Object],
  
  // Display configuration
  displayMode: ['grid', 'list', 'map', 'gallery'],
  cardType: ['artist', 'studio', 'style', 'default'],
  
  // Layout
  columns: [Number, Object], // Number or responsive object
  gap: ['sm', 'md', 'lg'],
  
  // States
  loadingState: Object,
  emptyState: Object,
  errorState: Object,
  
  // Pagination
  enablePagination: Boolean,
  itemsPerPage: Number,
  currentPage: Number,
  totalItems: Number,
  
  // Performance
  enableLazyLoading: Boolean,
  enableVirtualization: Boolean,
  enableInfiniteScroll: Boolean,
  
  // Visual enhancements
  enableHoverEffects: Boolean,
  enableTransitions: Boolean,
  enableSkeleton: Boolean,
  
  // Callbacks
  onItemClick: Function,
  onLoadMore: Function,
  onPageChange: Function,
  onError: Function,
  onRetry: Function
};

/**
 * StyleGallery component props
 */
export const StyleGalleryProps = {
  ...EnhancedDataDisplayProps,
  
  // Gallery-specific props
  initialStyle: String,
  showFilters: Boolean,
  maxImages: Number,
  columns: [2, 3, 4, 5, 6],
  
  // Filtering
  enableSearch: Boolean,
  enableMotifFiltering: Boolean,
  enableCharacteristicFiltering: Boolean,
  enableStyleFiltering: Boolean,
  
  // Lightbox
  enableLightbox: Boolean,
  enableKeyboardNavigation: Boolean,
  
  // Artist/Studio filtering
  artistId: String,
  studioId: String,
  
  // Performance
  lazyLoading: Boolean,
  enableIntersectionObserver: Boolean,
  
  // Callbacks
  onImageClick: Function,
  onFilterChange: Function,
  onLightboxOpen: Function,
  onLightboxClose: Function
};

/**
 * StarRating component props
 */
export const StarRatingProps = {
  ...BaseComponentProps,
  
  // Rating data
  rating: Number,
  reviewCount: Number,
  maxRating: Number,
  ratingBreakdown: Object,
  
  // Display options
  showCount: Boolean,
  showBreakdown: Boolean,
  showTooltip: Boolean,
  
  // Interaction
  interactive: Boolean,
  allowHalfStars: Boolean,
  
  // Callbacks
  onRatingClick: Function,
  onRatingHover: Function
};

/**
 * Toast notification component props
 */
export const ToastProps = {
  ...BaseComponentProps,
  
  // Toast content
  type: ['success', 'error', 'warning', 'info'],
  title: String,
  message: String,
  
  // Behavior
  duration: Number,
  persistent: Boolean,
  dismissible: Boolean,
  
  // Actions
  action: Object, // { label: string, onClick: function }
  
  // Positioning
  position: ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'],
  
  // Callbacks
  onClose: Function,
  onActionClick: Function
};

/**
 * Empty State component props
 */
export const EmptyStateProps = {
  ...BaseComponentProps,
  
  // Empty state configuration
  variant: ['search', 'onboarding', 'favorites', 'portfolio', 'loading', 'error', 'filter', 'custom'],
  
  // Content
  title: String,
  description: String,
  illustration: String,
  
  // Actions and suggestions
  actions: [Array, Object],
  suggestions: Array,
  
  // Display options
  showIllustration: Boolean,
  showSuggestions: Boolean,
  
  // Callbacks
  onActionClick: Function,
  onSuggestionClick: Function
};

/**
 * Enhanced Feedback component props
 */
export const EnhancedFeedbackProps = {
  ...BaseComponentProps,
  
  // Feedback type
  feedbackType: ['toast', 'banner', 'inline', 'modal'],
  
  // Toast configuration
  toastPosition: ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'],
  toastDuration: Number,
  enableAutoClose: Boolean,
  enableActionButtons: Boolean,
  
  // Progress indicators
  showProgressIndicators: Boolean,
  enableStepIndicators: Boolean,
  progress: Number,
  steps: Array,
  currentStep: Number,
  
  // Validation feedback
  enableRealTimeValidation: Boolean,
  showValidationIcons: Boolean,
  validationState: ['idle', 'validating', 'valid', 'invalid'],
  
  // Error handling
  enableErrorRecovery: Boolean,
  showErrorDetails: Boolean,
  errorDetails: [String, Object],
  
  // Callbacks
  onToastClose: Function,
  onActionClick: Function,
  onRetry: Function,
  onStepChange: Function
};

/**
 * Performance Optimization component props
 */
export const PerformanceOptimizationProps = {
  ...BaseComponentProps,
  
  // Image optimization
  enableLazyImages: Boolean,
  enableWebPOptimization: Boolean,
  enableResponsiveSizing: Boolean,
  enableConnectionAwareLoading: Boolean,
  
  // Scroll optimization
  enableInfiniteScroll: Boolean,
  enableVirtualization: Boolean,
  scrollDebounceMs: Number,
  
  // Preloading
  enableSmartPreloading: Boolean,
  preloadOnHover: Boolean,
  preloadOnViewport: Boolean,
  
  // Caching
  enableComponentCaching: Boolean,
  cacheStrategy: ['memory', 'localStorage', 'sessionStorage'],
  
  // Performance monitoring
  enablePerformanceMetrics: Boolean,
  trackLoadTimes: Boolean,
  trackInteractionTimes: Boolean,
  
  // Callbacks
  onPerformanceMetric: Function,
  onLoadComplete: Function,
  onError: Function
};

/**
 * Visual Effects component props
 */
export const VisualEffectsProps = {
  ...BaseComponentProps,
  
  // Shadow system
  enableElevationShadows: Boolean,
  enableColoredShadows: Boolean,
  shadowColor: ['primary', 'accent', 'success', 'warning', 'error'],
  
  // Glassmorphism
  enableGlassmorphism: Boolean,
  glassVariant: ['navigation', 'modal', 'card', 'panel'],
  
  // Gradients and overlays
  enableGradientOverlays: Boolean,
  gradientType: ['subtle', 'medium', 'hero'],
  gradientDirection: ['diagonal', 'vertical', 'horizontal', 'radial'],
  
  // Textures
  enableTextures: Boolean,
  textureType: ['none', 'noise', 'paper', 'fabric'],
  textureIntensity: ['subtle', 'medium'],
  
  // Animations and micro-interactions
  enableMicroInteractions: Boolean,
  enableHoverAnimations: Boolean,
  enableFocusAnimations: Boolean,
  enablePressAnimations: Boolean,
  
  // Dividers and borders
  enableGradientBorders: Boolean,
  enableAnimatedBorders: Boolean,
  
  // Performance considerations
  reduceEffectsOnMobile: Boolean,
  respectReducedMotion: Boolean
};

// ===== PROP VALIDATION UTILITIES =====

/**
 * Validates component props against expected prop types
 * @param {Object} props - Component props to validate
 * @param {Object} propTypes - Expected prop types
 * @returns {Object} Validation result
 */
export function validateProps(props, propTypes) {
  const errors = [];
  const warnings = [];
  
  Object.entries(propTypes).forEach(([propName, expectedType]) => {
    const propValue = props[propName];
    
    if (propValue !== undefined && propValue !== null) {
      const isValid = validatePropType(propValue, expectedType);
      
      if (!isValid) {
        warnings.push(`Invalid prop '${propName}': expected ${formatExpectedType(expectedType)}, got ${typeof propValue}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a single prop value against expected type
 * @param {*} value - Prop value
 * @param {*} expectedType - Expected type (constructor, array of values, etc.)
 * @returns {boolean} Whether the prop is valid
 */
function validatePropType(value, expectedType) {
  // Handle array of allowed values (enum)
  if (Array.isArray(expectedType)) {
    return expectedType.includes(value);
  }
  
  // Handle constructor types
  if (typeof expectedType === 'function') {
    return value.constructor === expectedType || typeof value === expectedType.name.toLowerCase();
  }
  
  // Handle string type names
  if (typeof expectedType === 'string') {
    return typeof value === expectedType;
  }
  
  return true;
}

/**
 * Formats expected type for error messages
 * @param {*} expectedType - Expected type
 * @returns {string} Formatted type description
 */
function formatExpectedType(expectedType) {
  if (Array.isArray(expectedType)) {
    return `one of [${expectedType.join(', ')}]`;
  }
  
  if (typeof expectedType === 'function') {
    return expectedType.name.toLowerCase();
  }
  
  return String(expectedType);
}

/**
 * Creates a prop validation hook for components
 * @param {Object} propTypes - Expected prop types
 * @returns {Function} Validation hook
 */
export function createPropValidationHook(propTypes) {
  return function usePropValidation(props) {
    if (process.env.NODE_ENV === 'development') {
      const validation = validateProps(props, propTypes);
      
      if (validation.warnings.length > 0) {
        console.warn('Component prop warnings:', validation.warnings);
      }
      
      if (validation.errors.length > 0) {
        console.error('Component prop errors:', validation.errors);
      }
    }
    
    return props;
  };
}

// ===== EXPORT ALL PROP INTERFACES =====

export const componentPropInterfaces = {
  base: BaseComponentProps,
  button: EnhancedButtonProps,
  card: EnhancedCardProps,
  input: EnhancedInputProps,
  search: EnhancedSearchProps,
  navigation: EnhancedNavigationProps,
  dataDisplay: EnhancedDataDisplayProps,
  styleGallery: StyleGalleryProps,
  starRating: StarRatingProps,
  toast: ToastProps,
  emptyState: EmptyStateProps,
  feedback: EnhancedFeedbackProps,
  performance: PerformanceOptimizationProps,
  visualEffects: VisualEffectsProps
};

export default componentPropInterfaces;