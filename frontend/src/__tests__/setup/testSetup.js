/**
 * Comprehensive Test Setup Configuration
 * 
 * This file provides setup utilities and configurations for the comprehensive
 * component integration test suite.
 * 
 * Includes:
 * - Mock configurations
 * - Test utilities
 * - Accessibility testing setup
 * - Visual regression testing helpers
 * - Performance testing utilities
 * 
 * Requirements: 11.1, 11.2
 */

import '@testing-library/jest-dom';
import { configure, render } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Global test setup
beforeAll(() => {
  // Setup global mocks
  setupGlobalMocks();
  
  // Setup CSS custom properties
  setupCSSCustomProperties();
  
  // Setup intersection observer
  setupIntersectionObserver();
  
  // Setup resize observer
  setupResizeObserver();
  
  // Setup media query mocks
  setupMediaQueryMocks();
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset CSS custom properties
  resetCSSCustomProperties();
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
});

// Global mock functions
function setupGlobalMocks() {
  // Mock Next.js router
  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }),
    usePathname: () => '/test',
    useSearchParams: () => new URLSearchParams(),
  }));

  // Mock Next.js Image component
  jest.mock('next/image', () => {
    return function MockImage({ src, alt, className, width, height, ...props }) {
      return (
        <img 
          src={src} 
          alt={alt} 
          className={className}
          width={width}
          height={height}
          {...props} 
        />
      );
    };
  });

  // Mock Next.js Link component
  jest.mock('next/link', () => {
    return function MockLink({ href, children, ...props }) {
      return <a href={href} {...props}>{children}</a>;
    };
  });

  // Mock window.matchMedia
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

  // Mock window.getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: (prop) => {
        const mockValues = {
          '--interactive-primary': '#5c475c',
          '--interactive-primary-hover': '#523f52',
          '--interactive-primary-active': '#453645',
          '--interactive-secondary': '#d6d6d6',
          '--interactive-accent': '#ef8354',
          '--feedback-error': '#ef4444',
          '--feedback-success': '#22c55e',
          '--feedback-warning': '#f59e0b',
          '--feedback-info': '#3b82f6',
          '--text-primary': '#4a474d',
          '--text-secondary': '#6b7280',
          '--border-primary': '#bfc0c0',
          '--surface-primary': '#ffffff',
          '--surface-secondary': '#f8fafc',
          '--shadow-elevation-surface': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          '--shadow-elevation-raised': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          '--shadow-elevation-floating': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          '--shadow-elevation-premium': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        };
        return mockValues[prop] || '';
      },
    }),
  });

  // Mock console methods for cleaner test output
  global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  };
}

function setupCSSCustomProperties() {
  // Create a style element with CSS custom properties
  const style = document.createElement('style');
  style.textContent = `
    :root {
      /* Color System */
      --interactive-primary: #5c475c;
      --interactive-primary-hover: #523f52;
      --interactive-primary-active: #453645;
      --interactive-secondary: #d6d6d6;
      --interactive-accent: #ef8354;
      
      /* Feedback Colors */
      --feedback-error: #ef4444;
      --feedback-success: #22c55e;
      --feedback-warning: #f59e0b;
      --feedback-info: #3b82f6;
      
      /* Text Colors */
      --text-primary: #4a474d;
      --text-secondary: #6b7280;
      --text-tertiary: #9ca3af;
      
      /* Surface Colors */
      --surface-primary: #ffffff;
      --surface-secondary: #f8fafc;
      --surface-tertiary: #f1f5f9;
      
      /* Border Colors */
      --border-primary: #bfc0c0;
      --border-secondary: #e2e8f0;
      
      /* Shadow System */
      --shadow-elevation-surface: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-elevation-raised: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-elevation-floating: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      --shadow-elevation-premium: 0 25px 50px -12px rgb(0 0 0 / 0.25);
      
      /* Spacing System */
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 1.5rem;
      --spacing-xl: 2rem;
      --spacing-2xl: 3rem;
      
      /* Typography */
      --font-size-xs: 0.75rem;
      --font-size-sm: 0.875rem;
      --font-size-md: 1rem;
      --font-size-lg: 1.125rem;
      --font-size-xl: 1.25rem;
      --font-size-2xl: 1.5rem;
      --font-size-3xl: 1.875rem;
      --font-size-4xl: 2.25rem;
      
      /* Animation */
      --animation-duration-fast: 150ms;
      --animation-duration-normal: 300ms;
      --animation-duration-slow: 500ms;
      --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  document.head.appendChild(style);
}

function resetCSSCustomProperties() {
  // Reset any modified CSS custom properties
  const root = document.documentElement;
  root.style.removeProperty('--test-property');
}

function setupIntersectionObserver() {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  });
  
  window.IntersectionObserver = mockIntersectionObserver;
  global.IntersectionObserver = mockIntersectionObserver;
}

function setupResizeObserver() {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  window.ResizeObserver = mockResizeObserver;
  global.ResizeObserver = mockResizeObserver;
}

function setupMediaQueryMocks() {
  // Mock different viewport sizes
  const mockViewport = (width, height) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  };

  // Expose viewport mock globally
  global.mockViewport = mockViewport;
  
  // Mock common media queries
  const mockMediaQuery = (query, matches = false) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(q => ({
        matches: q === query ? matches : false,
        media: q,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };
  
  global.mockMediaQuery = mockMediaQuery;
}

// Test utilities
export const testUtils = {
  // Accessibility testing utilities
  accessibility: {
    // Check for proper ARIA attributes
    checkAriaAttributes: (element, expectedAttributes) => {
      expectedAttributes.forEach(attr => {
        expect(element).toHaveAttribute(attr);
      });
    },
    
    // Check for proper heading hierarchy
    checkHeadingHierarchy: (container) => {
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      
      headings.forEach(heading => {
        const currentLevel = parseInt(heading.tagName.charAt(1));
        expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
        previousLevel = currentLevel;
      });
    },
    
    // Check for proper focus management
    checkFocusManagement: async (user, focusableElements) => {
      for (let i = 0; i < focusableElements.length; i++) {
        await user.tab();
        expect(focusableElements[i]).toHaveFocus();
      }
    },
  },
  
  // Visual testing utilities
  visual: {
    // Check for consistent class application
    checkClassConsistency: (elements, expectedClasses) => {
      elements.forEach(element => {
        expectedClasses.forEach(className => {
          expect(element).toHaveClass(className);
        });
      });
    },
    
    // Check for proper responsive classes
    checkResponsiveClasses: (element, breakpoints) => {
      breakpoints.forEach(({ breakpoint, classes }) => {
        classes.forEach(className => {
          expect(element).toHaveClass(`${breakpoint}:${className}`);
        });
      });
    },
    
    // Check for proper state classes
    checkStateClasses: (element, states) => {
      states.forEach(({ state, classes }) => {
        classes.forEach(className => {
          if (state === 'hover') {
            expect(element).toHaveClass(`hover:${className}`);
          } else if (state === 'focus') {
            expect(element).toHaveClass(`focus:${className}`);
          } else {
            expect(element).toHaveClass(`${state}:${className}`);
          }
        });
      });
    },
  },
  
  // Performance testing utilities
  performance: {
    // Mock performance observer
    mockPerformanceObserver: () => {
      const mockObserver = jest.fn();
      mockObserver.mockReturnValue({
        observe: jest.fn(),
        disconnect: jest.fn(),
        takeRecords: jest.fn().mockReturnValue([]),
      });
      
      global.PerformanceObserver = mockObserver;
      return mockObserver;
    },
    
    // Mock intersection observer for lazy loading tests
    mockLazyLoading: () => {
      const mockEntries = [];
      const mockObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn((element) => {
          // Simulate element entering viewport
          setTimeout(() => {
            callback([{
              target: element,
              isIntersecting: true,
              intersectionRatio: 1,
            }]);
          }, 100);
        }),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      }));
      
      global.IntersectionObserver = mockObserver;
      return mockObserver;
    },
  },
  
  // Component testing utilities
  component: {
    // Render component with all providers
    renderWithProviders: (component, providers = []) => {
      let wrappedComponent = component;
      
      providers.forEach(Provider => {
        wrappedComponent = <Provider>{wrappedComponent}</Provider>;
      });
      
      return render(wrappedComponent);
    },
    
    // Test component with different props
    testWithProps: (Component, propVariations) => {
      propVariations.forEach((props, index) => {
        const { unmount } = render(
          <Component {...props} data-testid={`variant-${index}`} />
        );
        
        const element = screen.getByTestId(`variant-${index}`);
        expect(element).toBeInTheDocument();
        
        unmount();
      });
    },
    
    // Test component states
    testComponentStates: async (Component, states, user) => {
      const { rerender } = render(<Component data-testid="stateful-component" />);
      
      for (const state of states) {
        rerender(
          <Component 
            {...state.props} 
            data-testid="stateful-component" 
          />
        );
        
        const element = screen.getByTestId('stateful-component');
        
        if (state.interactions) {
          for (const interaction of state.interactions) {
            await interaction(user, element);
          }
        }
        
        if (state.expectations) {
          state.expectations(element);
        }
      }
    },
  },
  
  // Cross-page testing utilities
  crossPage: {
    // Test consistency across multiple page components
    testPageConsistency: (pageComponents, consistencyChecks) => {
      pageComponents.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        consistencyChecks.forEach(check => {
          check(name, screen);
        });
        
        unmount();
      });
    },
    
    // Test navigation consistency
    testNavigationConsistency: (pages) => {
      pages.forEach(({ name, component: PageComponent }) => {
        const { unmount } = render(<PageComponent />);
        
        // Check for navigation presence
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
        
        // Check for consistent navigation structure
        const navLinks = nav.querySelectorAll('a');
        expect(navLinks.length).toBeGreaterThan(0);
        
        unmount();
      });
    },
  },
};

// Export cleanup function
export function cleanup() {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Clear DOM
  document.body.innerHTML = '';
  
  // Reset viewport
  if (global.mockViewport) {
    global.mockViewport(1024, 768);
  }
  
  // Reset media queries
  if (global.mockMediaQuery) {
    global.mockMediaQuery('(min-width: 768px)', false);
  }
}

// Export mock functions for use in tests
export {
  setupGlobalMocks,
  setupCSSCustomProperties,
  setupIntersectionObserver,
  setupResizeObserver,
  setupMediaQueryMocks,
};