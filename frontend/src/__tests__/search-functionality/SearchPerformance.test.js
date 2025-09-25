/**
 * Search Performance Tests
 * 
 * These tests validate that search functionality meets performance targets
 * for response times, component rendering, and resource usage.
 */

import { performance } from 'perf_hooks';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import search components
import EnhancedStyleFilter from '../../app/components/EnhancedStyleFilter';
import SearchResultsDisplay from '../../app/components/SearchResultsDisplay';
import AdvancedSearchInterface from '../../app/components/AdvancedSearchInterface';

// Import search controller
import { 
  EnhancedSearchController, 
  SearchQuery, 
  DebouncedSearch 
} from '../../lib/search-controller';

// Import pages
import ArtistsPage from '../../app/artists/page';
import StudiosPage from '../../app/studios/page';

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

// Mock API with configurable response times
const createMockApiWithDelay = (delay = 0) => ({
  searchArtists: jest.fn().mockImplementation(() => 
    new Promise(resolve => 
      setTimeout(() => resolve({ 
        artists: Array.from({ length: 20 }, (_, i) => ({
          id: `artist-${i}`,
          name: `Artist ${i}`,
          styles: ['old_school']
        })), 
        totalCount: 20 
      }), delay)
    )
  ),
  searchStudios: jest.fn().mockImplementation(() => 
    new Promise(resolve => 
      setTimeout(() => resolve({ 
        studios: Array.from({ length: 15 }, (_, i) => ({
          id: `studio-${i}`,
          name: `Studio ${i}`,
          specialties: ['old_school']
        })), 
        totalCount: 15 
      }), delay)
    )
  ),
  getArtists: jest.fn().mockResolvedValue([]),
  getStudios: jest.fn().mockResolvedValue([]),
});

jest.mock('../../lib/api', () => ({
  api: createMockApiWithDelay(50) // Default 50ms delay
}));

describe('Search Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performance.mark = jest.fn();
    performance.measure = jest.fn();
  });

  describe('Search Response Time Performance', () => {
    it('should complete basic search within 300ms target', async () => {
      const controller = new EnhancedSearchController();
      const query = new SearchQuery({ text: 'dragon' });

      const startTime = performance.now();
      await controller.executeSearch(query);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300); // 300ms target from requirements
    });

    it('should complete style-filtered search within performance target', async () => {
      const controller = new EnhancedSearchController();
      const query = new SearchQuery({ 
        text: 'dragon', 
        styles: ['old_school', 'realism'] 
      });

      const startTime = performance.now();
      await controller.executeSearch(query);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(300);
    });

    it('should complete complex search with multiple filters within target', async () => {
      const controller = new EnhancedSearchController();
      const query = new SearchQuery({ 
        text: 'dragon tattoo',
        styles: ['old_school', 'realism', 'japanese'],
        location: { city: 'London', postcode: 'SW1A 1AA' },
        difficulty: ['beginner', 'intermediate'],
        sortBy: 'popularity'
      });

      const startTime = performance.now();
      await controller.executeSearch(query);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500); // Allow slightly more time for complex queries
    });

    it('should handle concurrent searches efficiently', async () => {
      const controller = new EnhancedSearchController();
      const queries = [
        new SearchQuery({ text: 'dragon' }),
        new SearchQuery({ text: 'rose' }),
        new SearchQuery({ text: 'skull' })
      ];

      const startTime = performance.now();
      await Promise.all(queries.map(query => controller.executeSearch(query)));
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(600); // Should handle 3 concurrent searches in under 600ms
    });
  });

  describe('Debounced Search Performance', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce rapid search calls effectively', async () => {
      const mockSearchFunction = jest.fn().mockResolvedValue({ artists: [], totalCount: 0 });
      const debouncedSearch = new DebouncedSearch(mockSearchFunction, 300);
      
      const query = new SearchQuery({ text: 'dragon' });
      
      // Make 10 rapid calls
      for (let i = 0; i < 10; i++) {
        debouncedSearch.search(query);
      }
      
      // Fast-forward time
      jest.advanceTimersByTime(300);
      await Promise.resolve(); // Allow promises to resolve
      
      // Should only call the search function once
      expect(mockSearchFunction).toHaveBeenCalledTimes(1);
    });

    it('should handle debounce cancellation efficiently', () => {
      const mockSearchFunction = jest.fn();
      const debouncedSearch = new DebouncedSearch(mockSearchFunction, 300);
      
      const query = new SearchQuery({ text: 'dragon' });
      
      // Start search
      debouncedSearch.search(query);
      
      // Cancel before debounce completes
      debouncedSearch.cancel();
      
      // Fast-forward time
      jest.advanceTimersByTime(300);
      
      // Should not call search function
      expect(mockSearchFunction).not.toHaveBeenCalled();
    });

    it('should maintain performance with frequent debounce operations', () => {
      const mockSearchFunction = jest.fn().mockResolvedValue({ artists: [], totalCount: 0 });
      const debouncedSearch = new DebouncedSearch(mockSearchFunction, 300);
      
      const startTime = performance.now();
      
      // Simulate rapid typing (100 keystrokes)
      for (let i = 0; i < 100; i++) {
        const query = new SearchQuery({ text: `dragon${i}` });
        debouncedSearch.search(query);
        debouncedSearch.cancel();
      }
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Should handle 100 debounce operations quickly
      expect(operationTime).toBeLessThan(50); // 50ms for 100 operations
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render EnhancedStyleFilter within performance target', () => {
      const startTime = performance.now();
      
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(50); // 50ms target for component rendering
    });

    it('should render SearchResultsDisplay with small dataset quickly', () => {
      const results = Array.from({ length: 10 }, (_, i) => ({
        id: `artist-${i}`,
        name: `Artist ${i}`,
        styles: ['old_school']
      }));

      const startTime = performance.now();
      
      render(
        <SearchResultsDisplay 
          results={results} 
          totalCount={10}
          loading={false}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(30); // 30ms for small dataset
    });

    it('should render SearchResultsDisplay with large dataset within target', () => {
      const results = Array.from({ length: 100 }, (_, i) => ({
        id: `artist-${i}`,
        name: `Artist ${i}`,
        styles: ['old_school'],
        location: { city: 'London' },
        rating: 4.5,
        portfolioImages: [`image${i}.jpg`]
      }));

      const startTime = performance.now();
      
      render(
        <SearchResultsDisplay 
          results={results} 
          totalCount={100}
          loading={false}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(100); // 100ms target for large dataset
    });

    it('should render AdvancedSearchInterface efficiently', () => {
      const startTime = performance.now();
      
      render(<AdvancedSearchInterface />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(75); // 75ms for complex interface
    });

    it('should handle rapid re-renders efficiently', () => {
      const results = [
        { id: '1', name: 'Artist 1', styles: ['old_school'] }
      ];

      const { rerender } = render(
        <SearchResultsDisplay 
          results={results} 
          totalCount={1}
          loading={false}
        />
      );

      const startTime = performance.now();
      
      // Perform 20 rapid re-renders
      for (let i = 0; i < 20; i++) {
        rerender(
          <SearchResultsDisplay 
            results={[...results, { id: `${i+2}`, name: `Artist ${i+2}`, styles: ['realism'] }]} 
            totalCount={i + 2}
            loading={false}
          />
        );
      }
      
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;
      
      expect(rerenderTime).toBeLessThan(200); // 200ms for 20 re-renders
    });
  });

  describe('Page Load Performance', () => {
    it('should load Artists page within performance target', async () => {
      const startTime = performance.now();
      
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(200); // 200ms for page load
    });

    it('should load Studios page within performance target', async () => {
      const startTime = performance.now();
      
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(200); // 200ms for page load
    });

    it('should handle page transitions efficiently', async () => {
      // Render Artists page
      const { unmount } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      const startTime = performance.now();
      
      // Unmount and render Studios page (simulating navigation)
      unmount();
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const transitionTime = endTime - startTime;
      
      expect(transitionTime).toBeLessThan(150); // 150ms for page transition
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should not create memory leaks with search controller', () => {
      const controller = new EnhancedSearchController();
      const listeners = [];
      
      // Add 50 listeners
      for (let i = 0; i < 50; i++) {
        const unsubscribe = controller.addListener(() => {});
        listeners.push(unsubscribe);
      }
      
      expect(controller.listeners).toHaveLength(50);
      
      // Remove all listeners
      listeners.forEach(unsubscribe => unsubscribe());
      
      // Should have no listeners
      expect(controller.listeners).toHaveLength(0);
    });

    it('should clean up debounced search timers', () => {
      const mockSearchFunction = jest.fn();
      const debouncedSearch = new DebouncedSearch(mockSearchFunction, 300);
      
      // Start multiple searches
      for (let i = 0; i < 10; i++) {
        debouncedSearch.search(new SearchQuery({ text: `query${i}` }));
      }
      
      // Cancel all
      debouncedSearch.cancel();
      
      // Should not have any pending timers
      expect(debouncedSearch.timeoutId).toBeNull();
    });

    it('should handle component unmounting without memory leaks', () => {
      const { unmount } = render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Should unmount cleanly without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid mount/unmount cycles efficiently', () => {
      const startTime = performance.now();
      
      // Mount and unmount 20 times
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(<EnhancedStyleFilter onStylesChange={() => {}} />);
        unmount();
      }
      
      const endTime = performance.now();
      const cycleTime = endTime - startTime;
      
      expect(cycleTime).toBeLessThan(500); // 500ms for 20 mount/unmount cycles
    });
  });

  describe('Search Cache Performance', () => {
    it('should cache search results for improved performance', async () => {
      const controller = new EnhancedSearchController();
      const query = new SearchQuery({ text: 'dragon' });
      
      // First search (should hit API)
      const startTime1 = performance.now();
      await controller.executeSearch(query);
      const endTime1 = performance.now();
      const firstSearchTime = endTime1 - startTime1;
      
      // Second search (should use cache)
      const startTime2 = performance.now();
      await controller.executeSearch(query);
      const endTime2 = performance.now();
      const secondSearchTime = endTime2 - startTime2;
      
      // Cached search should be significantly faster
      expect(secondSearchTime).toBeLessThan(firstSearchTime * 0.5);
      expect(secondSearchTime).toBeLessThan(10); // Should be very fast from cache
    });

    it('should handle cache invalidation efficiently', async () => {
      const controller = new EnhancedSearchController();
      
      // Fill cache with multiple queries
      const queries = [
        new SearchQuery({ text: 'dragon' }),
        new SearchQuery({ text: 'rose' }),
        new SearchQuery({ text: 'skull' })
      ];
      
      // Execute all queries to populate cache
      await Promise.all(queries.map(query => controller.executeSearch(query)));
      
      const startTime = performance.now();
      
      // Clear cache (if method exists)
      if (controller.clearCache) {
        controller.clearCache();
      }
      
      const endTime = performance.now();
      const clearTime = endTime - startTime;
      
      expect(clearTime).toBeLessThan(10); // Cache clearing should be very fast
    });

    it('should maintain cache performance with large datasets', async () => {
      const controller = new EnhancedSearchController();
      
      // Create 50 different queries
      const queries = Array.from({ length: 50 }, (_, i) => 
        new SearchQuery({ text: `query${i}` })
      );
      
      const startTime = performance.now();
      
      // Execute all queries (will populate cache)
      await Promise.all(queries.map(query => controller.executeSearch(query)));
      
      // Execute same queries again (should use cache)
      await Promise.all(queries.map(query => controller.executeSearch(query)));
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle 100 total operations (50 cache misses + 50 cache hits) efficiently
      expect(totalTime).toBeLessThan(1000); // 1 second for 100 operations
    });
  });

  describe('User Interaction Performance', () => {
    it('should handle rapid filter toggling efficiently', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      const styleButton = screen.getByTestId('style-button-old_school');
      
      const startTime = performance.now();
      
      // Rapidly toggle filter 20 times
      for (let i = 0; i < 20; i++) {
        await user.click(styleButton);
      }
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      expect(interactionTime).toBeLessThan(1000); // 1 second for 20 interactions
    });

    it('should handle rapid search input changes efficiently', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      const searchInput = screen.getByTestId('style-search-input');
      
      const startTime = performance.now();
      
      // Type and clear rapidly
      for (let i = 0; i < 10; i++) {
        await user.type(searchInput, `query${i}`);
        await user.clear(searchInput);
      }
      
      const endTime = performance.now();
      const typingTime = endTime - startTime;
      
      expect(typingTime).toBeLessThan(2000); // 2 seconds for rapid typing
    });

    it('should maintain responsiveness during heavy operations', async () => {
      const user = userEvent.setup();
      const onStylesChange = jest.fn();
      
      render(<EnhancedStyleFilter onStylesChange={onStylesChange} />);
      
      // Simulate heavy operation by selecting many styles rapidly
      const styleButtons = screen.getAllByTestId(/^style-button-/);
      
      const startTime = performance.now();
      
      // Select first 10 styles rapidly
      for (let i = 0; i < Math.min(10, styleButtons.length); i++) {
        await user.click(styleButtons[i]);
      }
      
      const endTime = performance.now();
      const selectionTime = endTime - startTime;
      
      expect(selectionTime).toBeLessThan(1500); // 1.5 seconds for 10 selections
      expect(onStylesChange).toHaveBeenCalledTimes(Math.min(10, styleButtons.length));
    });
  });
});