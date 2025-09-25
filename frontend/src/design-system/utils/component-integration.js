/**
 * Component Integration Utilities
 * Provides utilities for consistent integration of enhanced components across pages
 */

import { componentConfigurations, mergeComponentConfig } from '../config/component-config';
import { componentPropInterfaces, validateProps } from '../types/component-props';
import { designSystemUtils } from './design-system-utils';
import { cn } from './cn';

// ===== ENHANCED PAGE CONFIGURATION MANAGEMENT =====

/**
 * Enhanced page configuration interface
 */
export const createEnhancedPageConfig = (pageType, customConfig = {}) => {
  const basePageConfig = {
    // Search configuration
    searchConfig: {
      enableAdvancedSearch: true,
      enableStyleFilter: true,
      enableLocationFilter: true,
      enableSavedSearches: false,
      enableRealTimeValidation: true,
      enableProgressIndicators: true,
      placeholder: 'Search...',
      suggestions: [],
      maxResults: 50,
      debounceMs: 300
    },
    
    // Navigation configuration
    navigationConfig: {
      breadcrumbs: [],
      contextualHelp: {
        enabled: true,
        position: 'sidebar'
      },
      keyboardShortcuts: [],
      gestureSupport: {
        enabled: true,
        swipeNavigation: true,
        pullToRefresh: false
      },
      tooltipConfig: {
        delay: 300,
        position: 'bottom'
      }
    },
    
    // Data display configuration
    dataDisplayConfig: {
      displayMode: 'grid',
      cardType: 'default',
      loadingState: {
        showSkeleton: true,
        showProgress: true
      },
      emptyState: {
        variant: 'search',
        showSuggestions: true
      },
      errorState: {
        showRecovery: true,
        showDetails: false
      },
      pagination: {
        enabled: true,
        itemsPerPage: 20
      }
    },
    
    // Feedback configuration
    feedbackConfig: {
      toastPosition: 'top-right',
      enableProgressIndicators: true,
      enableRealTimeValidation: true,
      emptyStateVariant: 'search',
      errorHandlingLevel: 'comprehensive'
    },
    
    // Visual effects configuration
    visualEffectsConfig: {
      shadowLevel: 'raised',
      enableGlassmorphism: false,
      gradientOverlay: 'subtle',
      textureLevel: 'none',
      animationLevel: 'standard'
    },
    
    // Performance configuration
    performanceConfig: {
      enableLazyLoading: true,
      enableInfiniteScroll: false,
      enableImageOptimization: true,
      enableSmartPreloading: true,
      connectionAware: true
    }
  };
  
  // Page-specific configurations
  const pageConfigs = {
    artists: {
      searchConfig: {
        ...basePageConfig.searchConfig,
        placeholder: 'Search artists by name, style, or location...',
        enableLocationFilter: true,
        enableStyleFilter: true
      },
      dataDisplayConfig: {
        ...basePageConfig.dataDisplayConfig,
        cardType: 'artist',
        displayMode: 'grid'
      }
    },
    
    studios: {
      searchConfig: {
        ...basePageConfig.searchConfig,
        placeholder: 'Search studios by name, specialty, or location...',
        enableLocationFilter: true,
        enableStyleFilter: true
      },
      dataDisplayConfig: {
        ...basePageConfig.dataDisplayConfig,
        cardType: 'studio',
        displayMode: 'grid'
      }
    },
    
    styles: {
      searchConfig: {
        ...basePageConfig.searchConfig,
        placeholder: 'Search styles by name or characteristics...',
        enableLocationFilter: false,
        enableStyleFilter: true
      },
      dataDisplayConfig: {
        ...basePageConfig.dataDisplayConfig,
        cardType: 'style',
        displayMode: 'gallery'
      }
    }
  };
  
  // Merge configurations
  const pageSpecificConfig = pageConfigs[pageType] || {};
  return mergeComponentConfig(basePageConfig, pageSpecificConfig, customConfig);
};

/**
 * Configuration manager for enhanced page props
 */
export class EnhancedPageConfigManager {
  constructor(pageType, initialConfig = {}) {
    this.pageType = pageType;
    this.config = createEnhancedPageConfig(pageType, initialConfig);
    this.listeners = new Set();
  }
  
  /**
   * Updates configuration
   */
  updateConfig(updates) {
    this.config = mergeComponentConfig(this.config, updates);
    this.notifyListeners();
  }
  
  /**
   * Gets current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Gets specific configuration section
   */
  getConfigSection(section) {
    return { ...this.config[section] };
  }
  
  /**
   * Subscribes to configuration changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notifies listeners of configuration changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.config));
  }
  
  /**
   * Validates current configuration
   */
  validateConfig() {
    const errors = [];
    const warnings = [];
    
    // Validate search configuration
    if (this.config.searchConfig.debounceMs < 100) {
      warnings.push('Search debounce time is very low, may impact performance');
    }
    
    // Validate performance configuration
    if (this.config.performanceConfig.enableInfiniteScroll && 
        this.config.dataDisplayConfig.pagination.enabled) {
      warnings.push('Both infinite scroll and pagination are enabled');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
}

// ===== COMPONENT COMPOSITION UTILITIES =====

/**
 * Creates a standardized component wrapper with consistent integration
 */
export function createIntegratedComponent(BaseComponent, componentType, defaultProps = {}) {
  const IntegratedComponent = (props) => {
    // Get standardized configuration
    const standardizedProps = designSystemUtils.createStandardizedComponent(
      componentType,
      defaultProps
    )(props);
    
    // Apply integration-specific enhancements
    const enhancedProps = applyIntegrationEnhancements(standardizedProps, componentType);
    
    return <BaseComponent {...enhancedProps} />;
  };
  
  IntegratedComponent.displayName = `Integrated${BaseComponent.displayName || BaseComponent.name}`;
  
  return IntegratedComponent;
}

/**
 * Applies integration-specific enhancements to component props
 */
function applyIntegrationEnhancements(props, componentType) {
  const enhanced = { ...props };
  
  // Apply consistent error handling
  if (componentType === 'search' || componentType === 'dataDisplay') {
    enhanced.onError = enhanced.onError || handleIntegrationError;
  }
  
  // Apply consistent loading states
  if (componentType === 'dataDisplay') {
    enhanced.loadingComponent = enhanced.loadingComponent || createStandardLoadingState();
  }
  
  // Apply consistent empty states
  if (componentType === 'dataDisplay') {
    enhanced.emptyComponent = enhanced.emptyComponent || createStandardEmptyState(componentType);
  }
  
  // Apply performance optimizations
  if (enhanced.performanceConfig?.enableLazyLoading) {
    enhanced.loading = 'lazy';
  }
  
  return enhanced;
}

/**
 * Creates a standardized loading state component
 */
function createStandardLoadingState() {
  const LoadingState = () => (
    <div className="loading-state design-system-component">
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card animate-pulse">
            <div className="skeleton-image bg-gray-200 rounded-lg h-48"></div>
            <div className="skeleton-content p-4 space-y-2">
              <div className="skeleton-title bg-gray-200 rounded h-4 w-3/4"></div>
              <div className="skeleton-subtitle bg-gray-200 rounded h-3 w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  LoadingState.displayName = 'StandardLoadingState';
  return LoadingState;
}

/**
 * Creates a standardized empty state component
 */
function createStandardEmptyState(componentType) {
  const emptyStateConfig = {
    search: {
      title: 'No results found',
      description: 'Try adjusting your search criteria or browse all items',
      suggestions: ['Check your spelling', 'Try different keywords', 'Broaden your search area']
    },
    dataDisplay: {
      title: 'No data available',
      description: 'There are no items to display at the moment',
      suggestions: ['Refresh the page', 'Try again later']
    }
  };
  
  const config = emptyStateConfig[componentType] || emptyStateConfig.dataDisplay;
  
  const EmptyState = () => (
    <div className="empty-state design-system-component text-center py-12">
      <div className="empty-state-icon mb-4">
        <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-600 mb-4">{config.description}</p>
      {config.suggestions && (
        <div className="suggestions">
          <p className="text-sm text-gray-500 mb-2">Try:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {config.suggestions.map((suggestion, i) => (
              <li key={i}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
  
  EmptyState.displayName = 'StandardEmptyState';
  return EmptyState;
}

/**
 * Handles integration errors consistently
 */
function handleIntegrationError(error, context = {}) {
  console.error('Component integration error:', error, context);
  
  // Could integrate with error reporting service here
  if (typeof window !== 'undefined' && window.reportError) {
    window.reportError(error, { context: 'component-integration', ...context });
  }
}

/**
 * Component composition utility for building complex layouts
 */
export class ComponentComposer {
  constructor() {
    this.components = new Map();
    this.layout = [];
  }
  
  /**
   * Registers a component for composition
   */
  register(name, component, config = {}) {
    this.components.set(name, { component, config });
    return this;
  }
  
  /**
   * Defines the layout structure
   */
  setLayout(layout) {
    this.layout = layout;
    return this;
  }
  
  /**
   * Composes the final component
   */
  compose(props = {}) {
    return this.renderLayout(this.layout, props);
  }
  
  /**
   * Renders the layout recursively
   */
  renderLayout(layout, props) {
    return layout.map((item, index) => {
      if (typeof item === 'string') {
        // Simple component reference
        const componentData = this.components.get(item);
        if (!componentData) {
          console.warn(`Component '${item}' not found in composer`);
          return null;
        }
        
        const { component: Component, config } = componentData;
        return <Component key={index} {...config} {...props} />;
      }
      
      if (typeof item === 'object' && item.component) {
        // Component with specific props
        const componentData = this.components.get(item.component);
        if (!componentData) {
          console.warn(`Component '${item.component}' not found in composer`);
          return null;
        }
        
        const { component: Component, config } = componentData;
        return (
          <Component 
            key={index} 
            {...config} 
            {...item.props} 
            {...props}
          />
        );
      }
      
      if (typeof item === 'object' && item.layout) {
        // Nested layout
        return (
          <div key={index} className={item.className || ''}>
            {this.renderLayout(item.layout, props)}
          </div>
        );
      }
      
      return null;
    });
  }
}

/**
 * Creates a page layout composer with standard sections
 */
export function createPageComposer(pageType) {
  const composer = new ComponentComposer();
  
  // Register standard page components
  composer
    .register('header', 'div', { className: 'page-header' })
    .register('navigation', 'nav', { className: 'page-navigation' })
    .register('search', 'div', { className: 'page-search' })
    .register('filters', 'div', { className: 'page-filters' })
    .register('content', 'main', { className: 'page-content' })
    .register('sidebar', 'aside', { className: 'page-sidebar' })
    .register('footer', 'footer', { className: 'page-footer' });
  
  // Set default layout based on page type
  const layouts = {
    artists: [
      'header',
      'navigation',
      { layout: ['search', 'filters'], className: 'search-section' },
      { layout: ['content', 'sidebar'], className: 'main-section flex' },
      'footer'
    ],
    studios: [
      'header',
      'navigation',
      { layout: ['search', 'filters'], className: 'search-section' },
      { layout: ['content', 'sidebar'], className: 'main-section flex' },
      'footer'
    ],
    styles: [
      'header',
      'navigation',
      'search',
      'content',
      'footer'
    ]
  };
  
  composer.setLayout(layouts[pageType] || layouts.artists);
  
  return composer;
}

// ===== INTEGRATION VALIDATION UTILITIES =====

/**
 * Validates component integration consistency
 */
export function validateComponentIntegration(components, pageConfig) {
  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  // Check for consistent prop interfaces
  components.forEach(component => {
    if (!component.props || !component.type) {
      results.errors.push(`Component missing required props or type: ${component.name || 'unknown'}`);
      results.isValid = false;
      return;
    }
    
    // Validate against expected prop interface
    const propInterface = componentPropInterfaces[component.type];
    if (propInterface) {
      const validation = validateProps(component.props, propInterface);
      if (!validation.isValid) {
        results.warnings.push(...validation.warnings);
      }
    }
  });
  
  // Check for design system consistency
  const designSystemComponents = components.filter(c => c.props?.useDesignTokens);
  if (designSystemComponents.length !== components.length) {
    results.warnings.push('Not all components are using design system tokens');
  }
  
  // Check for accessibility consistency
  const accessibleComponents = components.filter(c => 
    c.props?.['aria-label'] || c.props?.role || c.props?.tabIndex !== undefined
  );
  if (accessibleComponents.length < components.length * 0.8) {
    results.warnings.push('Less than 80% of components have accessibility attributes');
  }
  
  // Check for performance optimization consistency
  const optimizedComponents = components.filter(c => c.props?.enableLazyLoading);
  if (pageConfig.performanceConfig?.enableLazyLoading && optimizedComponents.length === 0) {
    results.suggestions.push('Consider enabling lazy loading for better performance');
  }
  
  return results;
}

/**
 * Generates integration report for a page
 */
export function generateIntegrationReport(pageType, components, config) {
  const report = {
    pageType,
    timestamp: new Date().toISOString(),
    componentCount: components.length,
    configurationSections: Object.keys(config),
    validation: validateComponentIntegration(components, config),
    metrics: {
      designSystemUsage: calculateDesignSystemUsage(components),
      accessibilityScore: calculateAccessibilityScore(components),
      performanceScore: calculatePerformanceScore(components, config)
    }
  };
  
  return report;
}

/**
 * Calculates design system usage percentage
 */
function calculateDesignSystemUsage(components) {
  const designSystemComponents = components.filter(c => c.props?.useDesignTokens);
  return Math.round((designSystemComponents.length / components.length) * 100);
}

/**
 * Calculates accessibility score
 */
function calculateAccessibilityScore(components) {
  let score = 0;
  const maxScore = components.length * 4; // 4 points per component
  
  components.forEach(component => {
    if (component.props?.['aria-label']) score += 1;
    if (component.props?.role) score += 1;
    if (component.props?.tabIndex !== undefined) score += 1;
    if (component.props?.['aria-describedby']) score += 1;
  });
  
  return Math.round((score / maxScore) * 100);
}

/**
 * Calculates performance score
 */
function calculatePerformanceScore(components, config) {
  let score = 0;
  let maxScore = 0;
  
  // Lazy loading
  if (config.performanceConfig?.enableLazyLoading) {
    maxScore += 20;
    const lazyComponents = components.filter(c => c.props?.enableLazyLoading);
    score += (lazyComponents.length / components.length) * 20;
  }
  
  // Image optimization
  if (config.performanceConfig?.enableImageOptimization) {
    maxScore += 20;
    score += 20; // Assume enabled if configured
  }
  
  // Smart preloading
  if (config.performanceConfig?.enableSmartPreloading) {
    maxScore += 20;
    score += 20; // Assume enabled if configured
  }
  
  // Connection awareness
  if (config.performanceConfig?.connectionAware) {
    maxScore += 20;
    score += 20; // Assume enabled if configured
  }
  
  // Reduced motion respect
  maxScore += 20;
  const motionAwareComponents = components.filter(c => c.props?.respectReducedMotion);
  score += (motionAwareComponents.length / components.length) * 20;
  
  return maxScore > 0 ? Math.round(score / maxScore * 100) : 100;
}

// ===== EXPORT UTILITIES =====

export const componentIntegrationUtils = {
  // Configuration management
  createEnhancedPageConfig,
  EnhancedPageConfigManager,
  
  // Component composition
  createIntegratedComponent,
  ComponentComposer,
  createPageComposer,
  
  // Validation and reporting
  validateComponentIntegration,
  generateIntegrationReport,
  
  // Helper functions
  applyIntegrationEnhancements,
  handleIntegrationError
};

export default componentIntegrationUtils;