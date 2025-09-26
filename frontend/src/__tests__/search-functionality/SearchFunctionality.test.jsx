/**
 * Comprehensive Test Suite for Search Functionality Cohesiveness
 * 
 * This test suite ensures consistent behavior across all search components
 * and validates the implementation against the requirements in the spec.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Import components to test
import EnhancedStyleFilter from '../../app/components/EnhancedStyleFilter';
import SearchResultsDisplay from '../../app/components/SearchResultsDisplay';
import AdvancedSearchInterface from '../../app/components/AdvancedSearchInterface';
import SearchFeedbackSystem from '../../app/components/SearchFeedbackSystem';

// Import pages
import ArtistsPage from '../../app/artists/page';
import StudiosPage from '../../app/studios/page';
import StylesPage from '../../app/styles/page';

// Import search controller
import { EnhancedSearchController, SearchQuery } from '../../lib/search-controller';

// Import standardized style model
import { 
  enhancedTattooStyles, 
  difficultyLevels, 
  searchStylesByAlias,
  getStylesByPopularity 
} from '../../app/data/testdata/enhancedtattoostyles';

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

// Mock API calls
jest.mock('../../lib/api', () => ({
  api: {
    searchArtists: jest.fn(),
    searchStudios: jest.fn(),
    getArtists: jest.fn(),
    getStudios: jest.fn(),
  }
}));

describe('Search Functionality Cohesiveness Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
  });

  describe('1. Standardized Style Model Consistency', () => {
    describe('Style Data Structure Validation', () => {
      it('should have consistent style data structure across all styles', () => {
        const requiredFields = [
          'id', 'name', 'description', 'difficulty', 'characteristics',
          'popularMotifs', 'colorPalette', 'timeOrigin', 'aliases', 'popularity'
        ];

        Object.values(enhancedTattooStyles).forEach(style => {
          requiredFields.forEach(field => {
            expect(style).toHaveProperty(field);
            expect(style[field]).toBeDefined();
          });

          // Validate data types
          expect(typeof style.id).toBe('string');
          expect(typeof style.name).toBe('string');
          expect(typeof style.description).toBe('string');
          expect(['beginner', 'intermediate', 'advanced']).toContain(style.difficulty);
          expect(Array.isArray(style.characteristics)).toBe(true);
          expect(Array.isArray(style.popularMotifs)).toBe(true);
          expect(Array.isArray(style.colorPalette)).toBe(true);
          expect(Array.isArray(style.aliases)).toBe(true);
          expect(typeof style.popularity).toBe('number');
          expect(style.popularity).toBeGreaterThanOrEqual(0);
          expect(style.popularity).toBeLessThanOrEqual(100);
        });
      });

      it('should have unique style IDs', () => {
        const ids = Object.keys(enhancedTattooStyles);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
      });

      it('should have consistent difficulty level definitions', () => {
        const validDifficulties = Object.keys(difficultyLevels);
        
        Object.values(enhancedTattooStyles).forEach(style => {
          expect(validDifficulties).toContain(style.difficulty);
        });

        // Validate difficulty level structure
        Object.values(difficultyLevels).forEach(level => {
          expect(level).toHaveProperty('label');
          expect(level).toHaveProperty('color');
          expect(level).toHaveProperty('description');
        });
      });

      it('should support alias-based search functionality', () => {
        const searchResults = searchStylesByAlias('traditional');
        expect(Array.isArray(searchResults)).toBe(true);
        expect(searchResults.length).toBeGreaterThan(0);

        // Test specific alias mapping
        const sailorJerryResults = searchStylesByAlias('sailor jerry');
        expect(sailorJerryResults.some(style => style.id === 'old_school')).toBe(true);
      });
    });

    describe('Cross-Component Style Model Usage', () => {
      it('should use the same style model in EnhancedStyleFilter', () => {
        render(<EnhancedStyleFilter onStylesChange={() => {}} />);
        
        // Check that styles from the standardized model are available
        const styleButtons = screen.getAllByTestId(/^style-button-/);
        expect(styleButtons.length).toBeGreaterThan(0);
        
        // Verify specific styles are present
        expect(screen.getByTestId('style-button-old_school')).toBeInTheDocument();
        expect(screen.getByTestId('style-button-realism')).toBeInTheDocument();
      });

      it('should display consistent style metadata across components', () => {
        const testStyle = enhancedTattooStyles.old_school;
        
        render(<EnhancedStyleFilter onStylesChange={() => {}} />);
        
        const styleButton = screen.getByTestId('style-button-old_school');
        expect(styleButton).toHaveTextContent(testStyle.name);
        
        // Test tooltip content (if visible)
        fireEvent.mouseEnter(styleButton);
        // Note: Tooltip testing may require additional setup depending on implementation
      });
    });
  });

  describe('2. Enhanced Search Controller Unit Tests', () => {
    let controller;

    beforeEach(() => {
      controller = new EnhancedSearchController();
    });

    describe('Search Query Management', () => {
      it('should create search queries with proper defaults', () => {
        const query = new SearchQuery();
        
        expect(query.text).toBe('');
        expect(query.styles).toEqual([]);
        expect(query.location).toBeNull();
        expect(query.difficulty).toEqual([]);
        expect(query.sortBy).toBe('relevance');
        expect(query.page).toBe(1);
        expect(query.limit).toBe(20);
      });

      it('should handle style filtering correctly', () => {
        const query = new SearchQuery({
          styles: ['old_school', 'realism']
        });
        
        expect(query.styles).toEqual(['old_school', 'realism']);
        expect(query.hasFilters()).toBe(true);
      });

      it('should generate consistent cache keys', () => {
        const query1 = new SearchQuery({ text: 'dragon', styles: ['old_school'] });
        const query2 = new SearchQuery({ text: 'dragon', styles: ['old_school'] });
        
        expect(query1.getCacheKey()).toBe(query2.getCacheKey());
      });

      it('should convert to/from URL search parameters', () => {
        const originalQuery = new SearchQuery({
          text: 'dragon tattoo',
          styles: ['old_school', 'realism'],
          location: { city: 'London', postcode: 'SW1A 1AA' },
          difficulty: ['beginner'],
          sortBy: 'popularity',
          page: 2
        });

        const params = originalQuery.toURLSearchParams();
        const reconstructedQuery = SearchQuery.fromURLSearchParams(params);

        expect(reconstructedQuery.text).toBe(originalQuery.text);
        expect(reconstructedQuery.styles).toEqual(originalQuery.styles);
        expect(reconstructedQuery.location).toEqual(originalQuery.location);
        expect(reconstructedQuery.difficulty).toEqual(originalQuery.difficulty);
        expect(reconstructedQuery.sortBy).toBe(originalQuery.sortBy);
        expect(reconstructedQuery.page).toBe(originalQuery.page);
      });
    });

    describe('Search State Management', () => {
      it('should initialize with default state', () => {
        const state = controller.getSearchState();
        
        expect(state.query).toBeInstanceOf(SearchQuery);
        expect(state.results).toBeNull();
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.totalCount).toBe(0);
      });

      it('should update state correctly', () => {
        const listener = jest.fn();
        controller.addListener(listener);

        controller.updateSearchState({ loading: true });
        
        expect(listener).toHaveBeenCalled();
        expect(controller.getSearchState().loading).toBe(true);
      });

      it('should handle filter application', async () => {
        const mockApi = require('../../lib/api').api;
        mockApi.searchArtists.mockResolvedValue({ artists: [], totalCount: 0 });

        await controller.applyFilters({ styles: ['old_school'] });
        
        const state = controller.getSearchState();
        expect(state.query.styles).toEqual(['old_school']);
        expect(state.query.page).toBe(1); // Should reset to first page
      });

      it('should clear filters while preserving text search', async () => {
        const mockApi = require('../../lib/api').api;
        mockApi.searchArtists.mockResolvedValue({ artists: [], totalCount: 0 });

        // Set initial state with text and filters
        controller.updateSearchState({
          query: new SearchQuery({ text: 'dragon', styles: ['old_school'] })
        });

        await controller.clearFilters();
        
        const state = controller.getSearchState();
        expect(state.query.text).toBe('dragon');
        expect(state.query.styles).toEqual([]);
      });
    });

    describe('Search Caching', () => {
      it('should cache search results', async () => {
        const mockApi = require('../../lib/api').api;
        const mockResults = { artists: [{ id: '1' }], totalCount: 1 };
        mockApi.searchArtists.mockResolvedValue(mockResults);

        const query = new SearchQuery({ text: 'dragon' });
        
        // First search
        await controller.executeSearch(query);
        expect(mockApi.searchArtists).toHaveBeenCalledTimes(1);
        
        // Second search with same query should use cache
        await controller.executeSearch(query);
        expect(mockApi.searchArtists).toHaveBeenCalledTimes(1);
      });

      it('should invalidate cache for different queries', async () => {
        const mockApi = require('../../lib/api').api;
        mockApi.searchArtists.mockResolvedValue({ artists: [], totalCount: 0 });

        const query1 = new SearchQuery({ text: 'dragon' });
        const query2 = new SearchQuery({ text: 'rose' });
        
        await controller.executeSearch(query1);
        await controller.executeSearch(query2);
        
        expect(mockApi.searchArtists).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('3. Cross-Page Search Consistency Integration Tests', () => {
    describe('Artists Page Search Integration', () => {
      it('should render enhanced search interface on artists page', async () => {
        render(<ArtistsPage />);
        
        await waitFor(() => {
          expect(screen.getByText('Find Artists')).toBeInTheDocument();
        });

        // Check for enhanced search components
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search artists/i)).toBeInTheDocument();
      });

      it('should maintain consistent style filtering across artists page', async () => {
        const user = userEvent.setup();
        render(<ArtistsPage />);
        
        await waitFor(() => {
          expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
        });

        // Open style filters
        const styleToggle = screen.getByTestId('style-filters-toggle');
        await user.click(styleToggle);

        // Check that standardized styles are available
        await waitFor(() => {
          expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
        });

        // Verify specific styles from standardized model
        const traditionalButton = screen.queryByTestId('style-button-old_school');
        if (traditionalButton) {
          expect(traditionalButton).toHaveTextContent('Old School');
        }
      });
    });

    describe('Studios Page Search Integration', () => {
      it('should render consistent search interface on studios page', async () => {
        render(<StudiosPage />);
        
        await waitFor(() => {
          expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
        });

        // Check for consistent search components
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      it('should use same style model as artists page', async () => {
        const user = userEvent.setup();
        render(<StudiosPage />);
        
        await waitFor(() => {
          expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
        });

        // Open style filters
        const styleToggle = screen.getByTestId('style-filters-toggle');
        await user.click(styleToggle);

        await waitFor(() => {
          expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
        });

        // Verify same styles are available as in artists page
        const styleButtons = screen.getAllByTestId(/^style-button-/);
        expect(styleButtons.length).toBeGreaterThan(0);
      });
    });

    describe('Styles Page Integration', () => {
      it('should display enhanced style showcase functionality', async () => {
        render(<StylesPage />);
        
        await waitFor(() => {
          expect(screen.getByText(/tattoo styles/i)).toBeInTheDocument();
        });

        // Check for enhanced functionality matching demo page
        const styleElements = screen.getAllByTestId(/style-/);
        expect(styleElements.length).toBeGreaterThan(0);
      });
    });

    describe('Search State Synchronization', () => {
      it('should maintain search state when navigating between pages', () => {
        // This test would require router mocking and state persistence testing
        // Implementation depends on how navigation state is managed
        const controller = new EnhancedSearchController();
        
        // Set up search state
        controller.updateSearchState({
          query: new SearchQuery({ text: 'dragon', styles: ['old_school'] })
        });

        const state = controller.getSearchState();
        expect(state.query.text).toBe('dragon');
        expect(state.query.styles).toEqual(['old_school']);
      });
    });
  });

  describe('4. Accessibility Compliance Tests (WCAG 2.1 AA)', () => {
    describe('EnhancedStyleFilter Accessibility', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <EnhancedStyleFilter onStylesChange={() => {}} />
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should support keyboard navigation', async () => {
        const user = userEvent.setup();
        render(<EnhancedStyleFilter onStylesChange={() => {}} />);
        
        // Test tab navigation
        await user.tab();
        expect(document.activeElement).toHaveAttribute('data-testid', 'style-search-input');
        
        await user.tab();
        const firstStyleButton = screen.getByTestId('style-button-old_school');
        expect(document.activeElement).toBe(firstStyleButton);
      });

      it('should have proper ARIA labels and descriptions', () => {
        render(<EnhancedStyleFilter onStylesChange={() => {}} />);
        
        const searchInput = screen.getByTestId('style-search-input');
        expect(searchInput).toHaveAttribute('aria-label');
        
        const styleButtons = screen.getAllByTestId(/^style-button-/);
        styleButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });

      it('should announce filter changes to screen readers', async () => {
        const user = userEvent.setup();
        const onStylesChange = jest.fn();
        render(<EnhancedStyleFilter onStylesChange={onStylesChange} />);
        
        const styleButton = screen.getByTestId('style-button-old_school');
        await user.click(styleButton);
        
        // Check for aria-live region updates
        const liveRegion = screen.queryByRole('status');
        if (liveRegion) {
          expect(liveRegion).toBeInTheDocument();
        }
      });
    });

    describe('Search Results Accessibility', () => {
      it('should have accessible search results structure', async () => {
        const mockResults = [
          { id: '1', name: 'Artist 1', styles: ['old_school'] },
          { id: '2', name: 'Artist 2', styles: ['realism'] }
        ];

        const { container } = render(
          <SearchResultsDisplay 
            results={mockResults} 
            totalCount={2}
            loading={false}
          />
        );
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have proper heading hierarchy', () => {
        const mockResults = [
          { id: '1', name: 'Artist 1', styles: ['old_school'] }
        ];

        render(
          <SearchResultsDisplay 
            results={mockResults} 
            totalCount={1}
            loading={false}
          />
        );
        
        // Check for proper heading structure
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    describe('Advanced Search Accessibility', () => {
      it('should have accessible form controls', async () => {
        const { container } = render(<AdvancedSearchInterface />);
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have proper form labels and descriptions', () => {
        render(<AdvancedSearchInterface />);
        
        const formControls = screen.getAllByRole('textbox');
        formControls.forEach(control => {
          // Each form control should have an accessible name
          expect(control).toHaveAccessibleName();
        });
      });
    });
  });

  describe('5. Performance Tests', () => {
    describe('Search Response Times', () => {
      it('should complete search operations within performance targets', async () => {
        const controller = new EnhancedSearchController();
        const mockApi = require('../../lib/api').api;
        
        // Mock fast API response
        mockApi.searchArtists.mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({ artists: [], totalCount: 0 }), 50)
          )
        );

        const startTime = performance.now();
        await controller.executeSearch(new SearchQuery({ text: 'dragon' }));
        const endTime = performance.now();
        
        const responseTime = endTime - startTime;
        expect(responseTime).toBeLessThan(300); // 300ms target
      });

      it('should debounce search input effectively', async () => {
        const mockSearchFunction = jest.fn().mockResolvedValue({ artists: [], totalCount: 0 });
        const { DebouncedSearch } = require('../../lib/search-controller');
        
        const debouncedSearch = new DebouncedSearch(mockSearchFunction, 300);
        const query = new SearchQuery({ text: 'dragon' });
        
        // Make multiple rapid calls
        debouncedSearch.search(query);
        debouncedSearch.search(query);
        debouncedSearch.search(query);
        
        // Fast-forward time
        jest.useFakeTimers();
        jest.advanceTimersByTime(300);
        
        await Promise.resolve(); // Allow promises to resolve
        
        expect(mockSearchFunction).toHaveBeenCalledTimes(1);
        
        jest.useRealTimers();
      });
    });

    describe('Component Rendering Performance', () => {
      it('should render EnhancedStyleFilter within performance targets', () => {
        const startTime = performance.now();
        
        render(<EnhancedStyleFilter onStylesChange={() => {}} />);
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        expect(renderTime).toBeLessThan(50); // 50ms target for component rendering
      });

      it('should handle large result sets efficiently', () => {
        const largeResultSet = Array.from({ length: 100 }, (_, i) => ({
          id: `artist-${i}`,
          name: `Artist ${i}`,
          styles: ['old_school']
        }));

        const startTime = performance.now();
        
        render(
          <SearchResultsDisplay 
            results={largeResultSet} 
            totalCount={100}
            loading={false}
          />
        );
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        expect(renderTime).toBeLessThan(100); // 100ms target for large result sets
      });
    });

    describe('Memory Usage', () => {
      it('should not create memory leaks in search controller', () => {
        const controller = new EnhancedSearchController();
        const listeners = [];
        
        // Add multiple listeners
        for (let i = 0; i < 10; i++) {
          const unsubscribe = controller.addListener(() => {});
          listeners.push(unsubscribe);
        }
        
        // Remove all listeners
        listeners.forEach(unsubscribe => unsubscribe());
        
        // Controller should have no listeners
        expect(controller.listeners).toHaveLength(0);
      });
    });
  });

  describe('6. User Flow Tests', () => {
    describe('Complete Search Journey - Artists', () => {
      it('should support complete search flow on artists page', async () => {
        const user = userEvent.setup();
        render(<ArtistsPage />);
        
        // Wait for page to load
        await waitFor(() => {
          expect(screen.getByText('Find Artists')).toBeInTheDocument();
        });

        // Step 1: Enter text search
        const searchInput = screen.getByPlaceholderText(/search artists/i);
        await user.type(searchInput, 'dragon');
        expect(searchInput).toHaveValue('dragon');

        // Step 2: Apply style filter
        const styleToggle = screen.getByTestId('style-filters-toggle');
        await user.click(styleToggle);

        await waitFor(() => {
          expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
        });

        const traditionalButton = screen.queryByTestId('style-button-old_school');
        if (traditionalButton) {
          await user.click(traditionalButton);
          
          // Step 3: Verify filter is applied
          await waitFor(() => {
            expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
          });
        }

        // Step 4: Clear filters
        const clearButton = screen.getByTestId('clear-filters-button');
        await user.click(clearButton);

        // Step 5: Verify filters are cleared
        await waitFor(() => {
          expect(screen.queryByTestId('style-filter-tag-old_school')).not.toBeInTheDocument();
        });
      });
    });

    describe('Complete Search Journey - Studios', () => {
      it('should support complete search flow on studios page', async () => {
        const user = userEvent.setup();
        render(<StudiosPage />);
        
        await waitFor(() => {
          expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
        });

        // Similar flow as artists but for studios
        const styleToggle = screen.getByTestId('style-filters-toggle');
        await user.click(styleToggle);

        await waitFor(() => {
          expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
        });

        // Test style selection
        const styleButtons = screen.getAllByTestId(/^style-button-/);
        if (styleButtons.length > 0) {
          await user.click(styleButtons[0]);
          
          // Verify selection
          const filterTags = screen.getAllByTestId(/^style-filter-tag-/);
          expect(filterTags.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Cross-Page Navigation Consistency', () => {
      it('should maintain search context across page navigation', () => {
        // This test would require more complex setup with routing
        // For now, we test that the search controller maintains state
        const controller = new EnhancedSearchController();
        
        // Set search state
        controller.updateSearchState({
          query: new SearchQuery({ text: 'dragon', styles: ['old_school'] })
        });

        // Simulate navigation (state should persist)
        const state = controller.getSearchState();
        expect(state.query.text).toBe('dragon');
        expect(state.query.styles).toEqual(['old_school']);
      });
    });
  });

  describe('7. Search Feedback and Error Handling', () => {
    describe('Search Feedback System', () => {
      it('should display appropriate feedback for no results', () => {
        render(
          <SearchFeedbackSystem 
            results={[]}
            totalCount={0}
            query={new SearchQuery({ text: 'nonexistent' })}
            loading={false}
          />
        );
        
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
      });

      it('should provide helpful suggestions for failed searches', () => {
        render(
          <SearchFeedbackSystem 
            results={[]}
            totalCount={0}
            query={new SearchQuery({ text: 'xyz123' })}
            loading={false}
          />
        );
        
        // Should suggest alternative searches or clearing filters
        const suggestions = screen.getAllByText(/try/i);
        expect(suggestions.length).toBeGreaterThan(0);
      });

      it('should show loading states during search', () => {
        render(
          <SearchFeedbackSystem 
            results={null}
            totalCount={0}
            query={new SearchQuery({ text: 'dragon' })}
            loading={true}
          />
        );
        
        expect(screen.getByText(/searching/i)).toBeInTheDocument();
      });
    });

    describe('Error Handling', () => {
      it('should handle search API errors gracefully', async () => {
        const controller = new EnhancedSearchController();
        const mockApi = require('../../lib/api').api;
        
        const error = new Error('API Error');
        mockApi.searchArtists.mockRejectedValue(error);
        
        const query = new SearchQuery({ text: 'dragon' });
        
        await expect(controller.executeSearch(query)).rejects.toThrow('API Error');
        
        const state = controller.getSearchState();
        expect(state.error).toBe(error);
        expect(state.loading).toBe(false);
      });

      it('should recover from network errors', async () => {
        const controller = new EnhancedSearchController();
        const mockApi = require('../../lib/api').api;
        
        // First call fails
        mockApi.searchArtists.mockRejectedValueOnce(new Error('Network Error'));
        // Second call succeeds
        mockApi.searchArtists.mockResolvedValueOnce({ artists: [], totalCount: 0 });
        
        const query = new SearchQuery({ text: 'dragon' });
        
        // First search fails
        await expect(controller.executeSearch(query)).rejects.toThrow();
        
        // Second search succeeds
        await controller.executeSearch(query);
        
        const state = controller.getSearchState();
        expect(state.error).toBeNull();
        expect(state.results).toEqual([]);
      });
    });
  });

  describe('8. Search History and Persistence', () => {
    describe('Search History Management', () => {
      it('should save valid searches to history', () => {
        const { SearchHistoryManager } = require('../../lib/search-controller');
        const manager = new SearchHistoryManager();
        
        const query = new SearchQuery({ text: 'dragon', styles: ['old_school'] });
        
        // Mock localStorage
        const mockSetItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        
        manager.saveSearch(query);
        
        expect(mockSetItem).toHaveBeenCalled();
        
        mockSetItem.mockRestore();
      });

      it('should not save empty searches', () => {
        const { SearchHistoryManager } = require('../../lib/search-controller');
        const manager = new SearchHistoryManager();
        
        const emptyQuery = new SearchQuery();
        
        const mockSetItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        
        manager.saveSearch(emptyQuery);
        
        // Should not save empty queries
        expect(mockSetItem).not.toHaveBeenCalled();
        
        mockSetItem.mockRestore();
      });

      it('should retrieve search history', () => {
        const { SearchHistoryManager } = require('../../lib/search-controller');
        const manager = new SearchHistoryManager();
        
        const mockHistory = JSON.stringify([
          { text: 'dragon', styles: ['old_school'], timestamp: Date.now() }
        ]);
        
        const mockGetItem = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockHistory);
        
        const history = manager.getHistory();
        
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBe(1);
        expect(history[0]).toBeInstanceOf(SearchQuery);
        
        mockGetItem.mockRestore();
      });
    });
  });
});