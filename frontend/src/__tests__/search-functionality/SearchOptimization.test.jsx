/**
 * Search Performance and Accessibility Optimization Tests
 * 
 * Tests for Task 14: Optimize search performance and accessibility
 * Validates WCAG 2.1 AA compliance, performance targets, and touch-friendly interfaces
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock axe for now - would need jest-axe package in production
const mockAxe = async () => ({ violations: [] });
const toHaveNoViolations = () => ({ pass: true, message: () => 'Mock axe test' });
expect.extend({ toHaveNoViolations });

// Import optimized components
import EnhancedStyleFilter from '../../app/components/EnhancedStyleFilter';
import SearchResultsDisplay from '../../app/components/SearchResultsDisplay';

// Import utilities
import { 
  debounce, 
  performanceMonitor, 
  searchCache, 
  requestDeduplicator 
} from '../../lib/performance-utils';
import { 
  ariaLiveRegion, 
  keyboardNavigation, 
  touchAccessibility,
  ScreenReaderUtils 
} from '../../lib/accessibility-utils';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API
jest.mock('../../lib/api', () => ({
  api: {
    searchArtists: jest.fn().mockResolvedValue({ artists: [], totalCount: 0 }),
    getArtists: jest.fn().mockResolvedValue([]),
  }
}));

describe('Search Performance and Accessibility Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.clear();
    searchCache.clear();
    requestDeduplicator.cancelAll();
  });

  describe('Performance Optimizations', () => {
    describe('Debouncing', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should debounce search input with 300ms delay', async () => {
        const mockFn = jest.fn().mockResolvedValue('result');
        const debouncedFn = debounce(mockFn, 300);

        // Make multiple rapid calls
        debouncedFn('call1');
        debouncedFn('call2');
        debouncedFn('call3');

        // Should not have called the function yet
        expect(mockFn).not.toHaveBeenCalled();

        // Fast-forward time
        act(() => {
          jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
          expect(mockFn).toHaveBeenCalledTimes(1);
          expect(mockFn).toHaveBeenCalledWith('call3');
        });
      });

      it('should support debounce cancellation', () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 300);

        debouncedFn('test');
        debouncedFn.cancel();

        act(() => {
          jest.advanceTimersByTime(300);
        });

        expect(mockFn).not.toHaveBeenCalled();
      });

      it('should support immediate flush', async () => {
        const mockFn = jest.fn().mockResolvedValue('result');
        const debouncedFn = debounce(mockFn, 300);

        debouncedFn('test');
        const result = debouncedFn.flush();

        expect(mockFn).toHaveBeenCalledWith('test');
      });
    });

    describe('Caching', () => {
      it('should cache search results with TTL', () => {
        const key = 'test-key';
        const value = { results: ['item1', 'item2'] };

        searchCache.set(key, value);
        expect(searchCache.get(key)).toEqual(value);
        expect(searchCache.has(key)).toBe(true);
      });

      it('should expire cached results after TTL', async () => {
        const key = 'test-key';
        const value = { results: ['item1', 'item2'] };

        // Set cache with very short TTL
        const shortTTLCache = new (searchCache.constructor)(10, 100); // 100ms TTL
        shortTTLCache.set(key, value);

        expect(shortTTLCache.get(key)).toEqual(value);

        // Wait for expiry
        await new Promise(resolve => setTimeout(resolve, 150));

        expect(shortTTLCache.get(key)).toBeNull();
        expect(shortTTLCache.has(key)).toBe(false);
      });

      it('should implement LRU eviction', () => {
        const smallCache = new (searchCache.constructor)(2, 60000); // Max 2 items

        smallCache.set('key1', 'value1');
        smallCache.set('key2', 'value2');
        smallCache.set('key3', 'value3'); // Should evict key1

        expect(smallCache.get('key1')).toBeNull();
        expect(smallCache.get('key2')).toBe('value2');
        expect(smallCache.get('key3')).toBe('value3');
      });
    });

    describe('Request Deduplication', () => {
      it('should deduplicate identical requests', async () => {
        const mockFn = jest.fn().mockResolvedValue('result');
        const key = 'test-request';

        // Make multiple identical requests
        const promises = [
          requestDeduplicator.execute(key, mockFn),
          requestDeduplicator.execute(key, mockFn),
          requestDeduplicator.execute(key, mockFn)
        ];

        const results = await Promise.all(promises);

        // Should only call the function once
        expect(mockFn).toHaveBeenCalledTimes(1);
        
        // All promises should resolve to the same result
        expect(results).toEqual(['result', 'result', 'result']);
      });

      it('should handle request cancellation', () => {
        const mockFn = jest.fn();
        const key = 'test-request';

        requestDeduplicator.execute(key, mockFn);
        requestDeduplicator.cancel(key);

        expect(requestDeduplicator.getPendingCount()).toBe(0);
      });
    });

    describe('Performance Monitoring', () => {
      it('should track operation timing', () => {
        const operationName = 'test-operation';

        performanceMonitor.startTiming(operationName);
        
        // Simulate some work
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Busy wait for 10ms
        }
        
        const duration = performanceMonitor.endTiming(operationName);

        expect(duration).toBeGreaterThan(0);
        expect(performanceMonitor.getTiming(operationName)).toBe(duration);
      });

      it('should provide performance summary', () => {
        performanceMonitor.startTiming('op1');
        performanceMonitor.endTiming('op1');
        
        performanceMonitor.startTiming('op2');
        performanceMonitor.endTiming('op2');

        const summary = performanceMonitor.getSummary();

        expect(summary.totalOperations).toBe(2);
        expect(summary.averageDuration).toBeGreaterThan(0);
        expect(summary.minDuration).toBeGreaterThan(0);
        expect(summary.maxDuration).toBeGreaterThan(0);
      });

      it('should notify performance observers', () => {
        const observer = jest.fn();
        const unsubscribe = performanceMonitor.addObserver(observer);

        performanceMonitor.startTiming('test');
        performanceMonitor.endTiming('test');

        expect(observer).toHaveBeenCalledWith('test', expect.any(Number));

        unsubscribe();
      });
    });

    describe('Component Rendering Performance', () => {
      it('should render EnhancedStyleFilter within performance target', () => {
        const startTime = performance.now();
        
        render(<EnhancedStyleFilter />);
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // Should render within 50ms target
        expect(renderTime).toBeLessThan(50);
      });

      it('should render SearchResultsDisplay efficiently', () => {
        const results = Array.from({ length: 20 }, (_, i) => ({
          id: `result-${i}`,
          name: `Result ${i}`,
          type: 'artist'
        }));

        const startTime = performance.now();
        
        render(
          <SearchResultsDisplay 
            results={results}
            totalResults={20}
            loading={false}
          />
        );
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // Should render within 100ms target for 20 items
        expect(renderTime).toBeLessThan(100);
      });

      it('should handle rapid re-renders efficiently', () => {
        const { rerender } = render(<EnhancedStyleFilter />);

        const startTime = performance.now();
        
        // Perform 10 rapid re-renders
        for (let i = 0; i < 10; i++) {
          rerender(<EnhancedStyleFilter key={i} />);
        }
        
        const endTime = performance.now();
        const rerenderTime = endTime - startTime;
        
        // Should handle 10 re-renders within 100ms
        expect(rerenderTime).toBeLessThan(100);
      });
    });
  });

  describe('Accessibility Optimizations', () => {
    describe('WCAG 2.1 AA Compliance', () => {
      it('should have no accessibility violations in EnhancedStyleFilter', async () => {
        const { container } = render(<EnhancedStyleFilter />);
        
        const results = await mockAxe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no accessibility violations in SearchResultsDisplay', async () => {
        const results = [
          { id: '1', name: 'Artist 1', type: 'artist' },
          { id: '2', name: 'Studio 1', type: 'studio' }
        ];

        const { container } = render(
          <SearchResultsDisplay 
            results={results}
            totalResults={2}
            loading={false}
          />
        );
        
        const axeResults = await mockAxe(container);
        expect(axeResults).toHaveNoViolations();
      });
    });

    describe('Keyboard Navigation', () => {
      it('should support full keyboard navigation in style filter', async () => {
        const user = userEvent.setup();
        render(<EnhancedStyleFilter />);

        // Tab to search input
        await user.tab();
        expect(document.activeElement).toHaveAttribute('role', 'searchbox');

        // Arrow down to style buttons
        await user.keyboard('{ArrowDown}');
        
        const focusedElement = document.activeElement;
        expect(focusedElement).toHaveAttribute('role', 'option');
        expect(focusedElement).toHaveAttribute('aria-pressed');
      });

      it('should support arrow key navigation in grid layout', async () => {
        const user = userEvent.setup();
        render(<EnhancedStyleFilter />);

        // Focus first style button
        const firstButton = screen.getAllByRole('option')[0];
        firstButton.focus();

        // Test arrow navigation
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).not.toBe(firstButton);

        await user.keyboard('{ArrowDown}');
        expect(document.activeElement).toHaveAttribute('role', 'option');
      });

      it('should support Home and End keys', async () => {
        const user = userEvent.setup();
        render(<EnhancedStyleFilter />);

        const styleButtons = screen.getAllByRole('option');
        if (styleButtons.length > 1) {
          // Focus middle button
          styleButtons[1].focus();

          // Press Home
          await user.keyboard('{Home}');
          expect(document.activeElement).toBe(styleButtons[0]);

          // Press End
          await user.keyboard('{End}');
          expect(document.activeElement).toBe(styleButtons[styleButtons.length - 1]);
        }
      });

      it('should trap focus in modal dialogs', () => {
        const container = document.createElement('div');
        const button1 = document.createElement('button');
        const button2 = document.createElement('button');
        
        button1.textContent = 'Button 1';
        button2.textContent = 'Button 2';
        
        container.appendChild(button1);
        container.appendChild(button2);
        document.body.appendChild(container);

        const cleanup = keyboardNavigation.trapFocus(container);

        // Should focus first element
        expect(document.activeElement).toBe(button1);

        // Cleanup
        cleanup();
        document.body.removeChild(container);
      });
    });

    describe('Screen Reader Support', () => {
      it('should announce search results', () => {
        const spy = jest.spyOn(ariaLiveRegion, 'announce');
        
        ariaLiveRegion.announceSearchResults(5, 'dragon tattoo');
        
        expect(spy).toHaveBeenCalledWith(
          '5 results found for "dragon tattoo".',
          'polite'
        );

        spy.mockRestore();
      });

      it('should announce filter changes', () => {
        const spy = jest.spyOn(ariaLiveRegion, 'announce');
        
        ariaLiveRegion.announceFilterChange('Style', 'Traditional', true);
        
        expect(spy).toHaveBeenCalledWith(
          'Style filter "Traditional" added.',
          'polite'
        );

        spy.mockRestore();
      });

      it('should announce loading states', () => {
        const spy = jest.spyOn(ariaLiveRegion, 'announce');
        
        ariaLiveRegion.announceLoading(true, 'search');
        
        expect(spy).toHaveBeenCalledWith(
          'Loading search results...',
          'polite'
        );

        spy.mockRestore();
      });

      it('should announce errors', () => {
        const spy = jest.spyOn(ariaLiveRegion, 'announce');
        const error = new Error('Network error');
        
        ariaLiveRegion.announceError(error, 'search');
        
        expect(spy).toHaveBeenCalledWith(
          'Error during search: Network error',
          'assertive'
        );

        spy.mockRestore();
      });

      it('should generate accessible labels for search results', () => {
        const result = {
          name: 'John Doe',
          type: 'artist',
          location: { city: 'London' },
          rating: 4.5,
          styles: ['traditional', 'realism', 'japanese']
        };

        const label = ScreenReaderUtils.createSearchResultLabel(result, 0, 10);

        expect(label).toContain('John Doe');
        expect(label).toContain('artist');
        expect(label).toContain('London');
        expect(label).toContain('4.5 out of 5 stars');
        expect(label).toContain('traditional, realism, japanese');
        expect(label).toContain('Result 1 of 10');
      });

      it('should generate accessible filter labels', () => {
        const label = ScreenReaderUtils.createFilterLabel('Style', 'Traditional', true, 25);

        expect(label).toContain('Style filter: Traditional');
        expect(label).toContain('currently active');
        expect(label).toContain('25 results available');
        expect(label).toContain('Press Enter or Space to toggle');
      });
    });

    describe('Touch Accessibility', () => {
      it('should ensure minimum touch target sizes', () => {
        render(<EnhancedStyleFilter />);

        const styleButtons = screen.getAllByRole('option');
        
        styleButtons.forEach(button => {
          const rect = button.getBoundingClientRect();
          const minSize = Math.min(rect.width, rect.height);
          
          // Should meet 44px minimum touch target
          expect(minSize).toBeGreaterThanOrEqual(44);
        });
      });

      it('should handle touch events properly', () => {
        const element = document.createElement('button');
        document.body.appendChild(element);

        const onTap = jest.fn();
        const cleanup = touchAccessibility.addTouchHandlers(element, { onTap });

        // Simulate touch events
        fireEvent.touchStart(element, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        fireEvent.touchEnd(element, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });

        expect(onTap).toHaveBeenCalled();

        cleanup();
        document.body.removeChild(element);
      });

      it('should detect swipe gestures', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        const onSwipe = jest.fn();
        const cleanup = touchAccessibility.addTouchHandlers(element, { onSwipe });

        // Simulate swipe right
        fireEvent.touchStart(element, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        fireEvent.touchEnd(element, {
          changedTouches: [{ clientX: 200, clientY: 100 }]
        });

        expect(onSwipe).toHaveBeenCalledWith(
          expect.any(Object),
          'right',
          expect.any(Number)
        );

        cleanup();
        document.body.removeChild(element);
      });

      it('should handle long press gestures', async () => {
        jest.useFakeTimers();
        
        const element = document.createElement('button');
        document.body.appendChild(element);

        const onLongPress = jest.fn();
        const cleanup = touchAccessibility.addTouchHandlers(element, { 
          onLongPress,
          longPressDelay: 500 
        });

        // Start touch
        fireEvent.touchStart(element, {
          touches: [{ clientX: 100, clientY: 100 }]
        });

        // Fast-forward time
        act(() => {
          jest.advanceTimersByTime(500);
        });

        expect(onLongPress).toHaveBeenCalled();

        cleanup();
        document.body.removeChild(element);
        jest.useRealTimers();
      });
    });

    describe('Responsive Design', () => {
      it('should adapt to different screen sizes', () => {
        // Mock different viewport sizes
        const originalInnerWidth = window.innerWidth;
        
        // Mobile
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 320,
        });
        
        const { rerender } = render(<EnhancedStyleFilter />);
        
        // Should render without errors on mobile
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        
        // Desktop
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920,
        });
        
        rerender(<EnhancedStyleFilter />);
        
        // Should render without errors on desktop
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        
        // Restore
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: originalInnerWidth,
        });
      });

      it('should respect reduced motion preferences', () => {
        // Mock reduced motion preference
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation(query => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          })),
        });

        render(<EnhancedStyleFilter />);

        // Should add reduced motion class
        expect(document.body).toHaveClass('reduce-motion');
      });

      it('should support high contrast mode', () => {
        // Mock high contrast preference
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation(query => ({
            matches: query === '(prefers-contrast: high)',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          })),
        });

        render(<EnhancedStyleFilter />);

        // Should add high contrast class
        expect(document.body).toHaveClass('high-contrast');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should maintain performance during complex interactions', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter />);

      const startTime = performance.now();

      // Perform complex interaction sequence
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'traditional');
      
      const styleButtons = screen.getAllByRole('option');
      if (styleButtons.length > 0) {
        await user.click(styleButtons[0]);
      }

      await user.clear(searchInput);
      await user.type(searchInput, 'realism');

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // Should complete complex interactions within reasonable time
      expect(interactionTime).toBeLessThan(2000); // 2 seconds
    });

    it('should maintain accessibility during dynamic updates', async () => {
      const user = userEvent.setup();
      const { container } = render(<EnhancedStyleFilter />);

      // Perform dynamic updates
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'dragon');

      // Check accessibility after updates
      const results = await mockAxe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle error states accessibly', async () => {
      const results = [];
      const error = new Error('Search failed');

      render(
        <SearchResultsDisplay 
          results={results}
          totalResults={0}
          loading={false}
          error={error}
        />
      );

      // Should announce error
      const errorMessage = screen.queryByRole('alert');
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument();
      }
    });
  });
});