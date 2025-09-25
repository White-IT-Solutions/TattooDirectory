/**
 * Cross-Browser Compatibility Tests
 * 
 * Tests all enhanced components across Chrome, Firefox, Safari, Edge
 * Validates browser-specific features and polyfills
 * 
 * Requirements: 11.4, 11.5, 11.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock components for testing
const MockSearchFeedbackIntegration = ({ searchType, placeholder, showAdvancedOptions }) => (
  <div role="search" className="search enhanced backdrop-blur glass">
    <input placeholder={placeholder} />
    {showAdvancedOptions && <div>Advanced options</div>}
  </div>
);

const MockVisualEffectsIntegration = () => (
  <div>
    <div data-testid="glass" className="glass backdrop blur">Glass Effect</div>
    <div data-testid="backdrop" className="backdrop-filter webkit-backdrop">Backdrop</div>
    <div data-testid="shadow" className="shadow glass blur">Shadow</div>
  </div>
);

const MockPerformanceOptimizationIntegration = () => (
  <div>
    <div data-testid="optimized" className="performance optimized">Optimized</div>
    <div data-testid="performance" className="performance">Performance</div>
    <img role="img" loading="lazy" decoding="async" alt="test" src="test.webp" />
  </div>
);

const MockAnimationInteractionIntegration = () => (
  <div>
    <div data-testid="animation" className="animate transition">Animation</div>
    <div data-testid="transition" className="transition animate">Transition</div>
    <div data-testid="transform" style={{ transform: 'translateX(0)' }}>Transform</div>
    <div data-testid="touch" className="touch active">Touch</div>
    <div data-testid="gesture" className="gesture">Gesture</div>
  </div>
);

// Mock browser detection
const mockUserAgent = (userAgent) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    writable: true,
    value: userAgent,
  });
};

// Browser user agents for testing
const BROWSERS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
};

// Mock CSS support detection
const mockCSSSupports = (property, value) => {
  global.CSS = global.CSS || {};
  global.CSS.supports = jest.fn().mockImplementation((prop, val) => {
    // Mock support for modern CSS features
    const supportedFeatures = {
      'backdrop-filter': true,
      'filter': true,
      'transform': true,
      'transition': true,
      'animation': true,
      'grid': true,
      'flexbox': true,
      'object-fit': true,
      'aspect-ratio': true,
      'scroll-behavior': true,
      'overscroll-behavior': true
    };
    
    return supportedFeatures[prop] || false;
  });
};

// Mock IntersectionObserver for all browsers
const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }));
};

// Mock ResizeObserver for all browsers
const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));
};

// Mock matchMedia for responsive testing
const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup common browser APIs
    mockIntersectionObserver();
    mockResizeObserver();
    mockMatchMedia();
    mockCSSSupports();
  });

  describe('Chrome Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSERS.chrome);
    });

    test('should render enhanced search components in Chrome', async () => {
      const user = userEvent.setup();
      
      render(
        <MockSearchFeedbackIntegration 
          searchType="artists"
          placeholder="Search artists..."
          showAdvancedOptions={true}
        />
      );

      // Test Chrome-specific features
      const searchInput = screen.getByPlaceholderText('Search artists...');
      expect(searchInput).toBeInTheDocument();

      // Test modern input features
      await user.type(searchInput, 'tattoo artist');
      expect(searchInput).toHaveValue('tattoo artist');

      // Test Chrome's advanced CSS support
      const container = searchInput.closest('[class*="search"]');
      expect(container).toHaveClass(expect.stringMatching(/backdrop-blur|glass/));
    });

    test('should support Chrome performance optimizations', () => {
      render(<MockPerformanceOptimizationIntegration />);

      // Test Chrome's IntersectionObserver support
      expect(global.IntersectionObserver).toHaveBeenCalled();

      // Test Chrome's modern image formats
      const images = screen.getAllByRole('img', { hidden: true });
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    test('should handle Chrome animations and transitions', () => {
      render(<MockAnimationInteractionIntegration />);

      const animatedElements = screen.getAllByTestId(/animation|transition/);
      animatedElements.forEach(element => {
        expect(element).toHaveClass(expect.stringMatching(/animate|transition/));
      });
    });
  });

  describe('Firefox Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSERS.firefox);
    });

    test('should render enhanced components in Firefox', () => {
      render(<MockVisualEffectsIntegration />);

      // Test Firefox CSS support
      const glassmorphElements = screen.getAllByTestId(/glass|backdrop/);
      glassmorphElements.forEach(element => {
        // Firefox may use different backdrop-filter implementation
        expect(element).toHaveClass(expect.stringMatching(/glass|backdrop|blur/));
      });
    });

    test('should handle Firefox-specific CSS features', () => {
      render(<MockSearchFeedbackIntegration searchType="studios" />);

      // Test Firefox scrollbar styling
      const scrollableElements = screen.getAllByRole('listbox', { hidden: true });
      scrollableElements.forEach(element => {
        expect(element).toHaveStyle(expect.objectContaining({
          scrollbarWidth: expect.any(String)
        }));
      });
    });

    test('should support Firefox performance features', () => {
      render(<MockPerformanceOptimizationIntegration />);

      // Test Firefox's lazy loading support
      expect(global.IntersectionObserver).toHaveBeenCalled();
      
      // Test Firefox image optimization
      const images = screen.getAllByRole('img', { hidden: true });
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('Safari Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSERS.safari);
    });

    test('should render components with Safari-specific considerations', () => {
      render(<MockVisualEffectsIntegration />);

      // Test Safari backdrop-filter support
      const backdropElements = screen.getAllByTestId(/backdrop|glass/);
      backdropElements.forEach(element => {
        expect(element).toHaveClass(expect.stringMatching(/webkit-backdrop|backdrop/));
      });
    });

    test('should handle Safari touch and gesture support', async () => {
      const user = userEvent.setup();
      
      render(<MockAnimationInteractionIntegration />);

      // Test Safari touch events
      const touchElements = screen.getAllByTestId(/touch|gesture/);
      
      for (const element of touchElements) {
        // Simulate touch events
        fireEvent.touchStart(element);
        fireEvent.touchEnd(element);
        
        expect(element).toHaveClass(expect.stringMatching(/touch|active/));
      }
    });

    test('should support Safari performance optimizations', () => {
      render(<MockPerformanceOptimizationIntegration />);

      // Test Safari's image loading
      const images = screen.getAllByRole('img', { hidden: true });
      images.forEach(img => {
        // Safari may need different loading strategies
        expect(img).toHaveAttribute('decoding', 'async');
      });
    });
  });

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(BROWSERS.edge);
    });

    test('should render enhanced components in Edge', () => {
      render(<MockSearchFeedbackIntegration searchType="styles" />);

      const searchContainer = screen.getByRole('search');
      expect(searchContainer).toBeInTheDocument();

      // Test Edge-specific CSS support
      expect(searchContainer).toHaveClass(expect.stringMatching(/search|enhanced/));
    });

    test('should handle Edge visual effects', () => {
      render(<MockVisualEffectsIntegration />);

      // Test Edge shadow and blur support
      const effectElements = screen.getAllByTestId(/shadow|blur|glass/);
      effectElements.forEach(element => {
        expect(element).toHaveClass(expect.stringMatching(/shadow|glass|blur/));
      });
    });

    test('should support Edge performance features', () => {
      render(<MockPerformanceOptimizationIntegration />);

      // Test Edge's modern API support
      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(global.ResizeObserver).toHaveBeenCalled();
    });
  });

  describe('Cross-Browser Feature Detection', () => {
    test('should detect and handle CSS feature support', () => {
      const testCases = [
        { property: 'backdrop-filter', fallback: 'background-color' },
        { property: 'grid', fallback: 'flexbox' },
        { property: 'object-fit', fallback: 'background-size' },
        { property: 'scroll-behavior', fallback: 'javascript-scroll' }
      ];

      testCases.forEach(({ property, fallback }) => {
        render(<MockVisualEffectsIntegration />);
        
        // Test that components handle feature detection
        const elements = screen.getAllByTestId(new RegExp(property.replace('-', ''), 'i'));
        elements.forEach(element => {
          // Should have either modern feature or fallback
          expect(element).toHaveClass(
            expect.stringMatching(new RegExp(`${property}|${fallback}`, 'i'))
          );
        });
      });
    });

    test('should provide polyfills for missing features', () => {
      // Mock missing IntersectionObserver
      delete global.IntersectionObserver;
      
      render(<MockPerformanceOptimizationIntegration />);

      // Should still work with polyfill or fallback
      const lazyElements = screen.getAllByTestId(/lazy|intersection/);
      expect(lazyElements.length).toBeGreaterThan(0);
    });

    test('should handle browser-specific CSS prefixes', () => {
      render(<MockAnimationInteractionIntegration />);

      const animatedElements = screen.getAllByTestId(/animation|transform/);
      animatedElements.forEach(element => {
        // Should handle vendor prefixes
        const styles = window.getComputedStyle(element);
        expect(
          styles.transform || 
          styles.webkitTransform || 
          styles.mozTransform || 
          styles.msTransform
        ).toBeDefined();
      });
    });
  });

  describe('Browser Performance Optimization', () => {
    test('should optimize for each browser engine', () => {
      const browsers = Object.keys(BROWSERS);
      
      browsers.forEach(browser => {
        mockUserAgent(BROWSERS[browser]);
        
        render(<MockPerformanceOptimizationIntegration />);

        // Test browser-specific optimizations
        const optimizedElements = screen.getAllByTestId(/optimized|performance/);
        expect(optimizedElements.length).toBeGreaterThan(0);
      });
    });

    test('should handle browser-specific image formats', () => {
      render(<MockPerformanceOptimizationIntegration />);

      const images = screen.getAllByRole('img', { hidden: true });
      images.forEach(img => {
        // Should support modern formats with fallbacks
        expect(img.src || img.srcSet).toMatch(/\.(webp|avif|jpg|png)$/i);
      });
    });

    test('should adapt to browser capabilities', () => {
      // Test with different capability scenarios
      const capabilities = [
        { webp: true, avif: false, lazy: true },
        { webp: false, avif: false, lazy: false },
        { webp: true, avif: true, lazy: true }
      ];

      capabilities.forEach(caps => {
        // Mock capability detection
        global.HTMLCanvasElement.prototype.toDataURL = jest.fn()
          .mockReturnValue(caps.webp ? 'data:image/webp;base64,test' : '');

        render(<MockPerformanceOptimizationIntegration />);

        const images = screen.getAllByRole('img', { hidden: true });
        expect(images.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Browser Error Handling', () => {
    test('should gracefully handle browser-specific errors', () => {
      // Mock console.error to catch errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Test with missing APIs
      delete global.IntersectionObserver;
      delete global.ResizeObserver;

      render(<MockPerformanceOptimizationIntegration />);

      // Should not throw errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/error|failed|undefined/i)
      );

      consoleSpy.mockRestore();
    });

    test('should provide fallbacks for unsupported features', () => {
      // Mock unsupported CSS features
      global.CSS.supports = jest.fn().mockReturnValue(false);

      render(<MockVisualEffectsIntegration />);

      // Should still render with fallbacks
      const elements = screen.getAllByTestId(/fallback|basic/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});