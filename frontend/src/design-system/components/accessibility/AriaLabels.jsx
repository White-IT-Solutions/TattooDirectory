"use client";

import React, { createContext, useContext } from 'react';

// ARIA Labels Context for managing consistent labeling
const AriaLabelsContext = createContext({
  labels: {},
  updateLabel: () => {},
  getLabel: () => ''
});

// Default ARIA labels for common UI elements
const defaultAriaLabels = {
  // Navigation
  'nav.main': 'Main navigation',
  'nav.breadcrumb': 'Breadcrumb navigation',
  'nav.pagination': 'Pagination navigation',
  'nav.skip-to-content': 'Skip to main content',
  'nav.skip-to-navigation': 'Skip to navigation',
  'nav.menu-toggle': 'Toggle navigation menu',
  'nav.close-menu': 'Close navigation menu',
  
  // Search
  'search.input': 'Search artists, studios, and styles',
  'search.button': 'Search',
  'search.clear': 'Clear search',
  'search.results': 'Search results',
  'search.no-results': 'No search results found',
  
  // Buttons
  'button.close': 'Close',
  'button.back': 'Go back',
  'button.next': 'Next',
  'button.previous': 'Previous',
  'button.submit': 'Submit',
  'button.cancel': 'Cancel',
  'button.save': 'Save',
  'button.edit': 'Edit',
  'button.delete': 'Delete',
  'button.view-more': 'View more',
  'button.show-less': 'Show less',
  
  // Forms
  'form.required': 'Required field',
  'form.optional': 'Optional field',
  'form.error': 'Error in field',
  'form.success': 'Field completed successfully',
  'form.loading': 'Loading',
  
  // Artist/Studio specific
  'artist.profile': 'Artist profile',
  'artist.portfolio': 'Artist portfolio',
  'artist.contact': 'Contact artist',
  'artist.rating': 'Artist rating',
  'artist.styles': 'Artist specialties',
  'studio.profile': 'Studio profile',
  'studio.location': 'Studio location',
  'studio.contact': 'Contact studio',
  'studio.artists': 'Studio artists',
  
  // Media
  'image.portfolio': 'Portfolio image',
  'image.avatar': 'Profile picture',
  'image.loading': 'Image loading',
  'image.error': 'Image failed to load',
  
  // Status
  'status.loading': 'Loading content',
  'status.error': 'Error occurred',
  'status.success': 'Action completed successfully',
  'status.offline': 'Currently offline',
  'status.online': 'Back online',
  
  // Filters
  'filter.location': 'Filter by location',
  'filter.style': 'Filter by tattoo style',
  'filter.rating': 'Filter by rating',
  'filter.price': 'Filter by price range',
  'filter.clear': 'Clear all filters',
  'filter.apply': 'Apply filters',
  
  // Modals and overlays
  'modal.close': 'Close modal',
  'overlay.backdrop': 'Modal backdrop',
  'tooltip.info': 'Additional information',
  'dropdown.toggle': 'Toggle dropdown menu',
  'dropdown.close': 'Close dropdown menu'
};

/**
 * AriaLabelsProvider Component
 * Provides consistent ARIA labels throughout the application
 */
const AriaLabelsProvider = ({ children, customLabels = {} }) => {
  const labels = { ...defaultAriaLabels, ...customLabels };
  
  const updateLabel = (key, value) => {
    labels[key] = value;
  };
  
  const getLabel = (key, fallback = '') => {
    return labels[key] || fallback;
  };
  
  const contextValue = {
    labels,
    updateLabel,
    getLabel
  };
  
  return (
    <AriaLabelsContext.Provider value={contextValue}>
      {children}
    </AriaLabelsContext.Provider>
  );
};

/**
 * useAriaLabels Hook
 * Provides access to ARIA labels
 */
const useAriaLabels = () => {
  const context = useContext(AriaLabelsContext);
  if (!context) {
    throw new Error('useAriaLabels must be used within AriaLabelsProvider');
  }
  return context;
};

/**
 * AriaLabel Component
 * Renders appropriate ARIA attributes for elements
 */
const AriaLabel = ({ 
  labelKey,
  fallback = '',
  children,
  as: Component = 'div',
  describedBy,
  labelledBy,
  ...props 
}) => {
  const { getLabel } = useAriaLabels();
  const label = getLabel(labelKey, fallback);
  
  const ariaProps = {
    ...(label && { 'aria-label': label }),
    ...(describedBy && { 'aria-describedby': describedBy }),
    ...(labelledBy && { 'aria-labelledby': labelledBy })
  };
  
  return (
    <Component {...ariaProps} {...props}>
      {children}
    </Component>
  );
};

/**
 * ScreenReaderOnly Component
 * Content visible only to screen readers
 */
const ScreenReaderOnly = ({ children, as: Component = 'span' }) => {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
};

/**
 * VisuallyHidden Component
 * Visually hidden but accessible to screen readers
 */
const VisuallyHidden = ({ children, focusable = false }) => {
  const className = focusable 
    ? 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-[var(--background-primary)] focus:border focus:border-[var(--border-primary)] focus:rounded'
    : 'sr-only';
    
  return (
    <span className={className}>
      {children}
    </span>
  );
};

/**
 * LiveRegion Component
 * ARIA live region for dynamic content announcements
 */
const LiveRegion = ({ 
  children, 
  politeness = 'polite', 
  atomic = false,
  relevant = 'additions text',
  className = ''
}) => {
  return (
    <div
      className={`sr-only ${className}`}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {children}
    </div>
  );
};

/**
 * Landmark Component
 * Semantic landmark with proper ARIA roles
 */
const Landmark = ({ 
  children,
  role,
  label,
  labelKey,
  className = '',
  ...props 
}) => {
  const { getLabel } = useAriaLabels();
  const ariaLabel = labelKey ? getLabel(labelKey) : label;
  
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * FocusManager Component
 * Manages focus for complex interactions
 */
const FocusManager = ({ 
  children,
  autoFocus = false,
  restoreFocus = true,
  trapFocus = false
}) => {
  const containerRef = React.useRef(null);
  const previousActiveElement = React.useRef(null);
  
  React.useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
    
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement;
    }
    
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [autoFocus, restoreFocus]);
  
  React.useEffect(() => {
    if (!trapFocus || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [trapFocus]);
  
  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};

/**
 * AccessibleButton Component
 * Button with comprehensive accessibility features
 */
const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  className = '',
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };
  
  const handleKeyDown = (e) => {
    if (disabled || loading) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };
  
  return (
    <button
      className={`min-h-[44px] min-w-[44px] ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <ScreenReaderOnly>Loading...</ScreenReaderOnly>
      )}
      {children}
    </button>
  );
};

export default AriaLabelsProvider;
export {
  AriaLabelsProvider,
  useAriaLabels,
  AriaLabel,
  ScreenReaderOnly,
  VisuallyHidden,
  LiveRegion,
  Landmark,
  FocusManager,
  AccessibleButton,
  defaultAriaLabels
};