import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Setup TextEncoder/TextDecoder for jsdom
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock CSS custom properties for testing
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  disconnect() {}
  observe(element) {
    // Simulate intersection for testing
    setTimeout(() => {
      this.callback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
      }]);
    }, 100);
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  disconnect() {}
  observe(element) {
    // Simulate resize for testing
    setTimeout(() => {
      this.callback([{
        target: element,
        contentRect: {
          width: 300,
          height: 200,
        },
      }]);
    }, 100);
  }
  unobserve() {}
};

// Mock matchMedia for responsive testing
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

// Mock performance API for performance testing
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn().mockReturnValue([]),
  getEntriesByType: jest.fn().mockReturnValue([]),
  now: jest.fn(() => Date.now()),
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: () => '',
  }),
  useParams: () => ({}),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return React.createElement('a', { href, ...props }, children);
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return React.createElement('img', { src, alt, ...props });
  };
});

// Suppress console warnings in tests unless explicitly needed
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  // Only show warnings that are not related to React testing
  if (!args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
    originalConsoleWarn(...args);
  }
};

console.error = (...args) => {
  // Only show errors that are not related to React testing
  if (!args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
    originalConsoleError(...args);
  }
};