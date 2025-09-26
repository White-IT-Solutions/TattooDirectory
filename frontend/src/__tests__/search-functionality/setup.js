/**
 * Search Functionality Test Setup
 * 
 * This file provides common setup, mocks, and utilities for all search functionality tests.
 */

import '@testing-library/jest-dom';

// Performance monitoring setup
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
};

// Mock console methods to reduce test noise while preserving error reporting
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep errors visible
  debug: jest.fn(),
};

// Mock window.matchMedia for responsive and accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  
  observe() {
    // Immediately trigger callback for testing
    this.callback([{
      isIntersecting: true,
      target: document.createElement('div'),
      intersectionRatio: 1,
      boundingClientRect: { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 },
      intersectionRect: { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 },
      rootBounds: { top: 0, left: 0, bottom: 1000, right: 1000, width: 1000, height: 1000 },
      time: Date.now()
    }]);
  }
  
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver for responsive component tests
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {
    // Immediately trigger callback for testing
    this.callback([{
      target: document.createElement('div'),
      contentRect: { width: 1024, height: 768, top: 0, left: 0, bottom: 768, right: 1024 }
    }]);
  }
  
  unobserve() {}
  disconnect() {}
};

// Mock localStorage with proper error handling
const localStorageMock = {
  getItem: jest.fn((key) => {
    const mockData = {
      'search-history': JSON.stringify([
        { text: 'dragon', styles: ['old_school'], timestamp: Date.now() - 1000 },
        { text: 'rose', styles: ['realism'], timestamp: Date.now() - 2000 }
      ]),
      'search-preferences': JSON.stringify({
        defaultSort: 'relevance',
        resultsPerPage: 20
      })
    };
    return mockData[key] || null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      artists: [],
      studios: [],
      totalCount: 0
    }),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    url: 'http://localhost:3001/api/test'
  })
);

// Mock URL constructor for search parameter handling
global.URL = class URL {
  constructor(url, base) {
    this.href = url;
    this.origin = base || 'http://localhost:3000';
    this.pathname = url.split('?')[0];
    this.search = url.includes('?') ? '?' + url.split('?')[1] : '';
    this.searchParams = new URLSearchParams(this.search);
  }
};

// Mock URLSearchParams for query string handling
global.URLSearchParams = class URLSearchParams {
  constructor(init) {
    this.params = new Map();
    
    if (typeof init === 'string') {
      init = init.startsWith('?') ? init.slice(1) : init;
      init.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
        }
      });
    } else if (init instanceof URLSearchParams) {
      init.forEach((value, key) => this.params.set(key, value));
    } else if (Array.isArray(init)) {
      init.forEach(([key, value]) => this.params.set(key, value));
    }
  }
  
  get(key) {
    return this.params.get(key);
  }
  
  set(key, value) {
    this.params.set(key, String(value));
  }
  
  has(key) {
    return this.params.has(key);
  }
  
  delete(key) {
    this.params.delete(key);
  }
  
  forEach(callback) {
    this.params.forEach(callback);
  }
  
  toString() {
    const pairs = [];
    this.params.forEach((value, key) => {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    return pairs.join('&');
  }
};

// Mock scrollTo for smooth scrolling tests
window.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

// Mock getBoundingClientRect for layout tests
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  width: 100,
  height: 100,
  x: 0,
  y: 0
}));

// Mock focus and blur methods
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();

// Mock CSS custom properties for design system tests
const mockComputedStyle = {
  getPropertyValue: jest.fn((prop) => {
    const mockValues = {
      '--interactive-primary': '#5c475c',
      '--interactive-primary-hover': '#523f52',
      '--interactive-primary-active': '#453645',
      '--interactive-secondary': '#d6d6d6',
      '--interactive-accent': '#ef8354',
      '--feedback-error': '#ef4444',
      '--feedback-success': '#22c55e',
      '--feedback-warning': '#f59e0b',
      '--text-primary': '#4a474d',
      '--text-secondary': '#6b7280',
      '--border-primary': '#bfc0c0',
      '--border-secondary': '#e5e7eb',
      '--surface-primary': '#ffffff',
      '--surface-secondary': '#f9fafb'
    };
    return mockValues[prop] || '';
  })
};

window.getComputedStyle = jest.fn(() => mockComputedStyle);

// Mock requestAnimationFrame for animation tests
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock Image constructor for image loading tests
global.Image = class Image {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.alt = '';
    
    // Simulate successful image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
};

// Test utilities for search functionality
export const searchTestUtils = {
  // Create mock search results
  createMockArtists: (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `artist-${i + 1}`,
      name: `Test Artist ${i + 1}`,
      styles: ['old_school', 'realism'][i % 2] ? ['old_school'] : ['realism'],
      location: { city: ['London', 'Manchester', 'Birmingham'][i % 3] },
      rating: 4.0 + (i % 10) / 10,
      portfolioImages: [`image-${i + 1}.jpg`],
      contactMethods: ['instagram', 'email']
    }));
  },
  
  createMockStudios: (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `studio-${i + 1}`,
      name: `Test Studio ${i + 1}`,
      specialties: ['old_school', 'realism'][i % 2] ? ['old_school'] : ['realism'],
      location: { city: ['London', 'Manchester', 'Birmingham'][i % 3] },
      rating: 4.0 + (i % 10) / 10,
      artists: [`artist-${i + 1}`]
    }));
  },
  
  // Wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock API responses
  mockApiSuccess: (data) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
      headers: new Headers()
    });
  },
  
  mockApiError: (error = 'API Error') => {
    global.fetch.mockRejectedValueOnce(new Error(error));
  },
  
  // Performance testing helpers
  measurePerformance: (fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  },
  
  // Accessibility testing helpers
  simulateKeyboardNavigation: async (user, element, key = 'Tab') => {
    element.focus();
    await user.keyboard(`{${key}}`);
    return document.activeElement;
  },
  
  // Style model validation helpers
  validateStyleStructure: (style) => {
    const requiredFields = [
      'id', 'name', 'description', 'difficulty', 'characteristics',
      'popularMotifs', 'colorPalette', 'timeOrigin', 'aliases', 'popularity'
    ];
    
    return requiredFields.every(field => Object.prototype.hasOwnProperty.call(style, field));
  }
};

// Global test configuration
export const testConfig = {
  performanceThresholds: {
    componentRender: 50, // ms
    searchResponse: 300, // ms
    userInteraction: 100 // ms
  },
  
  accessibilityStandards: {
    contrastRatio: 4.5,
    touchTargetSize: 44, // px
    focusIndicatorSize: 2 // px
  },
  
  searchDefaults: {
    debounceDelay: 300, // ms
    resultsPerPage: 20,
    maxCacheSize: 100
  }
};

// Setup cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset sessionStorage
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch
  global.fetch.mockClear();
  
  // Reset performance mocks
  performance.now.mockClear();
  performance.mark.mockClear();
  performance.measure.mockClear();
  
  // Reset DOM mocks
  Element.prototype.scrollIntoView.mockClear();
  HTMLElement.prototype.focus.mockClear();
  HTMLElement.prototype.blur.mockClear();
  
  // Clear any pending timers
  jest.clearAllTimers();
});

// Setup before all tests
beforeAll(() => {
  // Suppress specific console warnings that are expected in tests
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    
    // Suppress known test warnings
    if (typeof message === 'string' && (
      message.includes('Warning: ReactDOM.render is deprecated') ||
      message.includes('Warning: componentWillReceiveProps has been renamed') ||
      message.includes('localStorage is not available')
    )) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
});

// Cleanup after all tests
afterAll(() => {
  // Restore original console
  Object.assign(console, originalConsole);
  
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Reset all mocks
  jest.restoreAllMocks();
});