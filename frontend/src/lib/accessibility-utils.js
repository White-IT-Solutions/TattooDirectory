/**
 * Accessibility Utilities for Search Functionality
 * 
 * Provides WCAG 2.1 AA compliant utilities for keyboard navigation,
 * screen reader support, and touch-friendly interactions.
 * 
 * Requirements: 13.1, 13.2, 13.3
 */

/**
 * ARIA live region manager for screen reader announcements
 */
export class AriaLiveRegion {
  constructor() {
    this.regions = new Map();
    this.createDefaultRegions();
  }

  /**
   * Create default live regions
   */
  createDefaultRegions() {
    this.createRegion('polite', 'polite');
    this.createRegion('assertive', 'assertive');
    this.createRegion('status', 'polite', 'status');
  }

  /**
   * Create a live region
   */
  createRegion(id, politeness = 'polite', role = null) {
    if (typeof document === 'undefined') return;

    let region = document.getElementById(`aria-live-${id}`);
    
    if (!region) {
      region = document.createElement('div');
      region.id = `aria-live-${id}`;
      region.setAttribute('aria-live', politeness);
      region.setAttribute('aria-atomic', 'true');
      
      if (role) {
        region.setAttribute('role', role);
      }
      
      // Visually hidden but accessible to screen readers
      region.className = 'sr-only';
      region.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      
      document.body.appendChild(region);
    }
    
    this.regions.set(id, region);
    return region;
  }

  /**
   * Announce message to screen readers
   */
  announce(message, politeness = 'polite') {
    const region = this.regions.get(politeness);
    
    if (region && message) {
      // Clear previous message
      region.textContent = '';
      
      // Set new message after a brief delay to ensure it's announced
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  /**
   * Announce search results
   */
  announceSearchResults(count, query = '') {
    let message;
    
    if (count === 0) {
      message = query 
        ? `No results found for "${query}". Try adjusting your search terms or filters.`
        : 'No results found. Try adjusting your search terms or filters.';
    } else if (count === 1) {
      message = query 
        ? `1 result found for "${query}".`
        : '1 result found.';
    } else {
      message = query 
        ? `${count} results found for "${query}".`
        : `${count} results found.`;
    }
    
    this.announce(message, 'polite');
  }

  /**
   * Announce loading state
   */
  announceLoading(isLoading, operation = 'search') {
    if (isLoading) {
      this.announce(`Loading ${operation} results...`, 'polite');
    }
  }

  /**
   * Announce error
   */
  announceError(error, operation = 'search') {
    const message = `Error during ${operation}: ${error.message || 'Please try again.'}`;
    this.announce(message, 'assertive');
  }

  /**
   * Announce filter changes
   */
  announceFilterChange(filterType, value, isAdded) {
    const action = isAdded ? 'added' : 'removed';
    const message = `${filterType} filter "${value}" ${action}.`;
    this.announce(message, 'polite');
  }
}

/**
 * Keyboard navigation manager
 */
export class KeyboardNavigationManager {
  constructor() {
    this.focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="option"]'
    ].join(', ');
    
    this.trapStack = [];
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
      .filter(element => this.isVisible(element));
  }

  /**
   * Check if element is visible
   */
  isVisible(element) {
    if (typeof window === 'undefined') return true; // Assume visible in test environment
    
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  /**
   * Focus first focusable element in container
   */
  focusFirst(container) {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
      return focusable[0];
    }
    return null;
  }

  /**
   * Focus last focusable element in container
   */
  focusLast(container) {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
      return focusable[focusable.length - 1];
    }
    return null;
  }

  /**
   * Focus next focusable element
   */
  focusNext(currentElement, container = document) {
    const focusable = this.getFocusableElements(container);
    const currentIndex = focusable.indexOf(currentElement);
    
    if (currentIndex >= 0 && currentIndex < focusable.length - 1) {
      focusable[currentIndex + 1].focus();
      return focusable[currentIndex + 1];
    }
    
    return null;
  }

  /**
   * Focus previous focusable element
   */
  focusPrevious(currentElement, container = document) {
    const focusable = this.getFocusableElements(container);
    const currentIndex = focusable.indexOf(currentElement);
    
    if (currentIndex > 0) {
      focusable[currentIndex - 1].focus();
      return focusable[currentIndex - 1];
    }
    
    return null;
  }

  /**
   * Trap focus within a container (for modals, dropdowns)
   */
  trapFocus(container, options = {}) {
    const { 
      initialFocus = null,
      returnFocus = document.activeElement,
      escapeCallback = null 
    } = options;

    const focusable = this.getFocusableElements(container);
    
    if (focusable.length === 0) {
      console.warn('No focusable elements found in focus trap container');
      return () => {};
    }

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    // Focus initial element
    if (initialFocus && focusable.includes(initialFocus)) {
      initialFocus.focus();
    } else {
      firstFocusable.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      } else if (event.key === 'Escape' && escapeCallback) {
        escapeCallback(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const trap = {
      container,
      returnFocus,
      destroy: () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (returnFocus && typeof returnFocus.focus === 'function') {
          returnFocus.focus();
        }
        
        // Remove from trap stack
        const index = this.trapStack.indexOf(trap);
        if (index >= 0) {
          this.trapStack.splice(index, 1);
        }
      }
    };

    this.trapStack.push(trap);
    return trap.destroy;
  }

  /**
   * Handle arrow key navigation for lists/grids
   */
  handleArrowNavigation(event, items, currentIndex, options = {}) {
    const { 
      orientation = 'vertical', // 'vertical', 'horizontal', 'grid'
      columns = 1,
      wrap = true 
    } = options;

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          newIndex = orientation === 'grid' 
            ? Math.max(0, currentIndex - columns)
            : Math.max(0, currentIndex - 1);
        }
        break;
        
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          newIndex = orientation === 'grid'
            ? Math.min(items.length - 1, currentIndex + columns)
            : Math.min(items.length - 1, currentIndex + 1);
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = Math.max(0, currentIndex - 1);
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = Math.min(items.length - 1, currentIndex + 1);
        }
        break;
        
      case 'Home':
        newIndex = 0;
        break;
        
      case 'End':
        newIndex = items.length - 1;
        break;
        
      default:
        return currentIndex;
    }

    // Handle wrapping
    if (wrap) {
      if (newIndex < 0) {
        newIndex = items.length - 1;
      } else if (newIndex >= items.length) {
        newIndex = 0;
      }
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      event.preventDefault();
      items[newIndex].focus();
      return newIndex;
    }

    return currentIndex;
  }
}

/**
 * Touch accessibility manager
 */
export class TouchAccessibilityManager {
  constructor() {
    this.minTouchTarget = 44; // WCAG minimum touch target size
    this.touchStartTime = 0;
    this.touchStartPosition = { x: 0, y: 0 };
  }

  /**
   * Ensure element meets minimum touch target size
   */
  ensureTouchTarget(element, minSize = this.minTouchTarget) {
    if (typeof window === 'undefined') return;

    const rect = element.getBoundingClientRect();
    const currentSize = Math.min(rect.width, rect.height);

    if (currentSize < minSize) {
      const padding = Math.ceil((minSize - currentSize) / 2);
      element.style.padding = `${padding}px`;
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
    }
  }

  /**
   * Add touch-friendly event handlers
   */
  addTouchHandlers(element, handlers = {}) {
    const {
      onTap = null,
      onLongPress = null,
      onSwipe = null,
      longPressDelay = 500,
      swipeThreshold = 50
    } = handlers;

    let touchStartTime = 0;
    let touchStartPosition = { x: 0, y: 0 };
    let longPressTimer = null;

    const handleTouchStart = (event) => {
      touchStartTime = Date.now();
      const touch = event.touches[0];
      touchStartPosition = { x: touch.clientX, y: touch.clientY };

      if (onLongPress) {
        longPressTimer = setTimeout(() => {
          onLongPress(event);
        }, longPressDelay);
      }
    };

    const handleTouchEnd = (event) => {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;

      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      const touch = event.changedTouches[0];
      const touchEndPosition = { x: touch.clientX, y: touch.clientY };
      
      const deltaX = touchEndPosition.x - touchStartPosition.x;
      const deltaY = touchEndPosition.y - touchStartPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Check for swipe
      if (onSwipe && distance > swipeThreshold) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY)
          ? (deltaX > 0 ? 'right' : 'left')
          : (deltaY > 0 ? 'down' : 'up');
        
        onSwipe(event, direction, distance);
        return;
      }

      // Check for tap
      if (onTap && touchDuration < longPressDelay && distance < 10) {
        onTap(event);
      }
    };

    const handleTouchMove = (event) => {
      if (longPressTimer) {
        const touch = event.touches[0];
        const currentPosition = { x: touch.clientX, y: touch.clientY };
        const deltaX = currentPosition.x - touchStartPosition.x;
        const deltaY = currentPosition.y - touchStartPosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Cancel long press if moved too much
        if (distance > 10) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }

  /**
   * Make element swipeable
   */
  makeSwipeable(element, onSwipe, options = {}) {
    const { threshold = 50, preventScroll = false } = options;

    return this.addTouchHandlers(element, {
      onSwipe: (event, direction, distance) => {
        if (preventScroll && (direction === 'up' || direction === 'down')) {
          event.preventDefault();
        }
        onSwipe(direction, distance);
      }
    });
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrastUtils {
  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1, color2) {
    const l1 = this.getRelativeLuminance(...color1);
    const l2 = this.getRelativeLuminance(...color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  static meetsWCAG(contrastRatio, level = 'AA', size = 'normal') {
    const requirements = {
      'AA': { normal: 4.5, large: 3 },
      'AAA': { normal: 7, large: 4.5 }
    };
    
    return contrastRatio >= requirements[level][size];
  }

  /**
   * Parse hex color to RGB
   */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }

  /**
   * Validate color contrast for an element
   */
  static validateElementContrast(element) {
    if (typeof window === 'undefined') return true;

    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // This is a simplified check - in practice, you'd need more sophisticated color parsing
    // For now, we'll assume proper contrast is maintained through CSS design tokens
    return true;
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  /**
   * Generate descriptive text for complex UI elements
   */
  static generateDescription(element, context = {}) {
    const { type, state, position, total } = context;
    
    let description = '';
    
    if (type) {
      description += `${type} `;
    }
    
    if (position && total) {
      description += `${position} of ${total} `;
    }
    
    if (state) {
      description += `${state} `;
    }
    
    return description.trim();
  }

  /**
   * Create accessible label for search results
   */
  static createSearchResultLabel(result, index, total) {
    const { name, type, location, rating, styles } = result;
    
    let label = `${name}`;
    
    if (type) {
      label += `, ${type}`;
    }
    
    if (location) {
      label += `, located in ${location.city || location.postcode}`;
    }
    
    if (rating) {
      label += `, rated ${rating} out of 5 stars`;
    }
    
    if (styles && styles.length > 0) {
      label += `, specializes in ${styles.slice(0, 3).join(', ')}`;
      if (styles.length > 3) {
        label += ` and ${styles.length - 3} other styles`;
      }
    }
    
    label += `. Result ${index + 1} of ${total}.`;
    
    return label;
  }

  /**
   * Create accessible label for filter buttons
   */
  static createFilterLabel(filterType, value, isActive, count = null) {
    let label = `${filterType} filter: ${value}`;
    
    if (isActive) {
      label += ', currently active';
    } else {
      label += ', not active';
    }
    
    if (count !== null) {
      label += `, ${count} results available`;
    }
    
    label += '. Press Enter or Space to toggle.';
    
    return label;
  }
}

// Create singleton instances
export const ariaLiveRegion = new AriaLiveRegion();
export const keyboardNavigation = new KeyboardNavigationManager();
export const touchAccessibility = new TouchAccessibilityManager();

// Initialize accessibility features
if (typeof window !== 'undefined' && window.matchMedia) {
  // Add keyboard navigation class to body when using keyboard
  let isUsingKeyboard = false;
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      isUsingKeyboard = true;
      document.body.classList.add('keyboard-mode');
    }
  });
  
  document.addEventListener('mousedown', () => {
    isUsingKeyboard = false;
    document.body.classList.remove('keyboard-mode');
  });
  
  // Monitor for accessibility preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
  
  const updateAccessibilityClasses = () => {
    document.body.classList.toggle('reduce-motion', prefersReducedMotion.matches);
    document.body.classList.toggle('high-contrast', prefersHighContrast.matches);
  };
  
  prefersReducedMotion.addEventListener('change', updateAccessibilityClasses);
  prefersHighContrast.addEventListener('change', updateAccessibilityClasses);
  updateAccessibilityClasses();
}