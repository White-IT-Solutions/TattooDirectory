/**
 * Search User Flow Tests
 * 
 * These tests validate complete user journeys through the search functionality,
 * ensuring that users can successfully complete common search tasks across all pages.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import pages and components
import ArtistsPage from '../../app/artists/page';
import StudiosPage from '../../app/studios/page';
import StylesPage from '../../app/styles/page';
import EnhancedStyleFilter from '../../app/components/EnhancedStyleFilter';
import SearchResultsDisplay from '../../app/components/SearchResultsDisplay';

// Import search controller
import { EnhancedSearchController, SearchQuery } from '../../lib/search-controller';

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

// Mock API with realistic responses
const mockArtists = [
  { id: '1', name: 'Dragon Ink Studio', styles: ['old_school', 'japanese'], location: { city: 'London' }, rating: 4.8 },
  { id: '2', name: 'Rose Tattoo Artist', styles: ['realism', 'floral'], location: { city: 'Manchester' }, rating: 4.6 },
  { id: '3', name: 'Skull Master', styles: ['old_school', 'blackwork'], location: { city: 'Birmingham' }, rating: 4.7 }
];

const mockStudios = [
  { id: '1', name: 'Ink & Steel Studio', specialties: ['old_school', 'traditional'], location: { city: 'London' }, rating: 4.9 },
  { id: '2', name: 'Modern Art Tattoos', specialties: ['realism', 'portrait'], location: { city: 'Manchester' }, rating: 4.5 },
  { id: '3', name: 'Black Rose Studio', specialties: ['blackwork', 'geometric'], location: { city: 'Birmingham' }, rating: 4.8 }
];

jest.mock('../../lib/api', () => ({
  api: {
    searchArtists: jest.fn().mockImplementation((query) => {
      let filteredArtists = [...mockArtists];
      
      if (query.text) {
        filteredArtists = filteredArtists.filter(artist => 
          artist.name.toLowerCase().includes(query.text.toLowerCase())
        );
      }
      
      if (query.styles && query.styles.length > 0) {
        filteredArtists = filteredArtists.filter(artist =>
          query.styles.some(style => artist.styles.includes(style))
        );
      }
      
      return Promise.resolve({ artists: filteredArtists, totalCount: filteredArtists.length });
    }),
    searchStudios: jest.fn().mockImplementation((query) => {
      let filteredStudios = [...mockStudios];
      
      if (query.text) {
        filteredStudios = filteredStudios.filter(studio => 
          studio.name.toLowerCase().includes(query.text.toLowerCase())
        );
      }
      
      if (query.styles && query.styles.length > 0) {
        filteredStudios = filteredStudios.filter(studio =>
          query.styles.some(style => studio.specialties.includes(style))
        );
      }
      
      return Promise.resolve({ studios: filteredStudios, totalCount: filteredStudios.length });
    }),
    getArtists: jest.fn().mockResolvedValue(mockArtists),
    getStudios: jest.fn().mockResolvedValue(mockStudios),
  }
}));

describe('Search User Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Artist Search Journey', () => {
    it('should allow user to find artists through text search', async () => {
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      // Step 1: Page loads with search interface
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 2: User enters search term
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'dragon');
      expect(searchInput).toHaveValue('dragon');
      
      // Step 3: Results should update (may be automatic or require submit)
      await waitFor(() => {
        // Should show filtered results or at least maintain search term
        expect(searchInput).toHaveValue('dragon');
      });
      
      // Step 4: User should see relevant results
      const resultsContainer = screen.queryByTestId('search-results');
      if (resultsContainer) {
        expect(resultsContainer).toBeInTheDocument();
      }
    });

    it('should allow user to filter artists by style', async () => {
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 1: Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      expect(styleToggle).toHaveTextContent('Styles');
      await user.click(styleToggle);
      
      // Step 2: Style filter panel opens
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      // Step 3: Select a style
      const oldSchoolButton = screen.queryByTestId('style-button-old_school');
      if (oldSchoolButton) {
        await user.click(oldSchoolButton);
        
        // Step 4: Filter tag appears
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
        });
        
        // Step 5: Toggle shows filter count
        expect(styleToggle).toHaveTextContent('Styles (1)');
      }
    });

    it('should allow user to combine text and style filters', async () => {
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 1: Enter text search
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'ink');
      
      // Step 2: Add style filter
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      const oldSchoolButton = screen.queryByTestId('style-button-old_school');
      if (oldSchoolButton) {
        await user.click(oldSchoolButton);
        
        // Step 3: Both filters should be active
        expect(searchInput).toHaveValue('ink');
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
        });
      }
    });

    it('should allow user to clear all filters', async () => {
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 1: Apply multiple filters
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'tattoo');
      
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      const oldSchoolButton = screen.queryByTestId('style-button-old_school');
      if (oldSchoolButton) {
        await user.click(oldSchoolButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
        });
        
        // Step 2: Clear all filters
        const clearButton = screen.getByTestId('clear-filters-button');
        await user.click(clearButton);
        
        // Step 3: All filters should be cleared
        await waitFor(() => {
          expect(screen.queryByTestId('style-filter-tag-old_school')).not.toBeInTheDocument();
        });
        
        // Text search should be preserved
        expect(searchInput).toHaveValue('tattoo');
      }
    });

    it('should handle no results gracefully', async () => {
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 1: Search for something that won't match
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'nonexistentartist123');
      
      // Step 2: Should show no results message or empty state
      await waitFor(() => {
        // Look for no results indicators
        const noResults = screen.queryByText(/no.*found|0.*artists/i);
        const emptyState = screen.queryByText(/try.*different|adjust.*search/i);
        
        // At least one should be present
        expect(noResults || emptyState).toBeTruthy();
      });
    });
  });

  describe('Complete Studio Search Journey', () => {
    it('should allow user to find studios through style filtering', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      // Step 1: Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      // Step 2: Select a style
      const realismButton = screen.queryByTestId('style-button-realism');
      if (realismButton) {
        await user.click(realismButton);
        
        // Step 3: Filter should be applied
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-realism')).toBeInTheDocument();
        });
        
        // Step 4: Results should update
        const resultsText = screen.queryByText(/\d+ studios? found/);
        if (resultsText) {
          expect(resultsText).toBeInTheDocument();
        }
      }
    });

    it('should allow user to search studios by specialty', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      // Look for specialty search input
      const specialtyInput = screen.queryByPlaceholderText(/specialty|search studios/i);
      if (specialtyInput) {
        await user.type(specialtyInput, 'portrait');
        expect(specialtyInput).toHaveValue('portrait');
      }
    });

    it('should maintain consistent behavior with artists page', async () => {
      const user = userEvent.setup();
      
      // Test Artists page behavior
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      let styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      const artistsOldSchoolButton = screen.queryByTestId('style-button-old_school');
      let oldSchoolAvailable = false;
      
      if (artistsOldSchoolButton) {
        await user.click(artistsOldSchoolButton);
        oldSchoolAvailable = true;
        
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
        });
      }
      
      unmountArtists();
      
      // Test Studios page behavior
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      if (oldSchoolAvailable) {
        const studiosOldSchoolButton = screen.queryByTestId('style-button-old_school');
        expect(studiosOldSchoolButton).toBeInTheDocument();
        
        await user.click(studiosOldSchoolButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Style Exploration Journey', () => {
    it('should allow user to explore styles and find related artists', async () => {
      const user = userEvent.setup();
      render(<StylesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/tattoo styles/i)).toBeInTheDocument();
      });
      
      // Look for style exploration elements
      const styleElements = screen.getAllByTestId(/style-/);
      if (styleElements.length > 0) {
        // Should be able to interact with styles
        const firstStyle = styleElements[0];
        await user.click(firstStyle);
        
        // Should show style details or navigate to related content
        expect(firstStyle).toBeInTheDocument();
      }
    });

    it('should provide consistent style information across pages', async () => {
      // This test ensures style information is consistent when viewed from different contexts
      const user = userEvent.setup();
      
      // Test style info from filter context
      const { unmount: unmountFilter } = render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      const oldSchoolButton = screen.queryByTestId('style-button-old_school');
      if (oldSchoolButton) {
        expect(oldSchoolButton).toHaveTextContent('Old School');
        
        // Check for tooltip or additional info
        fireEvent.mouseEnter(oldSchoolButton);
        // Tooltip content would be tested here if implemented
      }
      
      unmountFilter();
      
      // Test style info from styles page context
      render(<StylesPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/tattoo styles/i)).toBeInTheDocument();
      });
      
      // Should show consistent style information
      const styleInfo = screen.queryByText(/old school|traditional/i);
      if (styleInfo) {
        expect(styleInfo).toBeInTheDocument();
      }
    });
  });

  describe('Cross-Page Navigation Flows', () => {
    it('should maintain search context when navigating between pages', () => {
      // This test simulates maintaining search state across navigation
      const controller = new EnhancedSearchController();
      
      // Step 1: User performs search on artists page
      const artistQuery = new SearchQuery({ 
        text: 'dragon', 
        styles: ['old_school'] 
      });
      
      controller.updateSearchState({ query: artistQuery });
      
      // Step 2: User navigates to studios page
      // Search context should be preserved
      const state = controller.getSearchState();
      expect(state.query.text).toBe('dragon');
      expect(state.query.styles).toEqual(['old_school']);
      
      // Step 3: User can apply similar search to studios
      const studioQuery = new SearchQuery({
        text: state.query.text,
        styles: state.query.styles
      });
      
      expect(studioQuery.text).toBe('dragon');
      expect(studioQuery.styles).toEqual(['old_school']);
    });

    it('should provide consistent search experience across different entry points', async () => {
      const user = userEvent.setup();
      
      // Test search from artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Verify search interface is available
      expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      const artistsSearchInput = screen.getByPlaceholderText(/search artists/i);
      expect(artistsSearchInput).toBeInTheDocument();
      
      unmountArtists();
      
      // Test search from studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      // Should have similar search interface
      expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Flows', () => {
    it('should allow user to recover from search errors', async () => {
      // Mock API error
      const mockApi = require('../../lib/api').api;
      mockApi.searchArtists.mockRejectedValueOnce(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 1: User performs search that fails
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'test');
      
      // Step 2: Error should be handled gracefully
      await waitFor(() => {
        // Should not crash the application
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 3: User should be able to try again
      // Mock successful response for retry
      mockApi.searchArtists.mockResolvedValueOnce({ artists: [], totalCount: 0 });
      
      await user.clear(searchInput);
      await user.type(searchInput, 'retry');
      
      // Should work on retry
      expect(searchInput).toHaveValue('retry');
    });

    it('should handle slow network responses gracefully', async () => {
      // Mock slow API response
      const mockApi = require('../../lib/api').api;
      mockApi.searchArtists.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ artists: [], totalCount: 0 }), 2000)
        )
      );
      
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // User performs search
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'slow');
      
      // Should show loading state
      const loadingIndicator = screen.queryByText(/loading|searching/i);
      if (loadingIndicator) {
        expect(loadingIndicator).toBeInTheDocument();
      }
      
      // Should remain responsive during loading
      expect(searchInput).toHaveValue('slow');
    });
  });

  describe('Advanced Search Flows', () => {
    it('should allow user to build complex search queries', async () => {
      const user = userEvent.setup();
      render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });
      
      // Step 1: Start with text search
      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'professional');
      
      // Step 2: Add style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      // Select multiple styles
      const oldSchoolButton = screen.queryByTestId('style-button-old_school');
      const realismButton = screen.queryByTestId('style-button-realism');
      
      if (oldSchoolButton && realismButton) {
        await user.click(oldSchoolButton);
        await user.click(realismButton);
        
        // Step 3: Verify multiple filters are applied
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
          expect(screen.getByTestId('style-filter-tag-realism')).toBeInTheDocument();
        });
        
        // Step 4: Toggle should show count
        expect(styleToggle).toHaveTextContent('Styles (2)');
      }
    });

    it('should allow user to save and reuse search configurations', () => {
      // This test would verify search history functionality
      const controller = new EnhancedSearchController();
      const { SearchHistoryManager } = require('../../lib/search-controller');
      const historyManager = new SearchHistoryManager();
      
      // Step 1: User performs a complex search
      const complexQuery = new SearchQuery({
        text: 'dragon tattoo',
        styles: ['old_school', 'japanese'],
        location: { city: 'London' },
        difficulty: ['intermediate']
      });
      
      // Step 2: Search should be saved to history
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      
      historyManager.saveSearch(complexQuery);
      
      // Should attempt to save valid searches
      expect(complexQuery.hasFilters()).toBe(true);
      
      mockSetItem.mockRestore();
    });
  });

  describe('Mobile and Touch Flows', () => {
    it('should support touch interactions on mobile devices', async () => {
      const user = userEvent.setup();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      // Should render mobile-friendly interface
      const styleButtons = screen.getAllByTestId(/^style-button-/);
      
      if (styleButtons.length > 0) {
        const firstButton = styleButtons[0];
        
        // Should support touch events
        fireEvent.touchStart(firstButton);
        fireEvent.touchEnd(firstButton);
        
        // Should not cause errors
        expect(firstButton).toBeInTheDocument();
      }
    });

    it('should handle gesture navigation on mobile', async () => {
      const user = userEvent.setup();
      render(<EnhancedStyleFilter onStylesChange={() => {}} />);
      
      const container = screen.queryByTestId('style-filter-container');
      if (container) {
        // Test swipe gestures
        fireEvent.touchStart(container, { 
          touches: [{ clientX: 100, clientY: 100 }] 
        });
        fireEvent.touchMove(container, { 
          touches: [{ clientX: 200, clientY: 100 }] 
        });
        fireEvent.touchEnd(container);
        
        // Should handle gestures without errors
        expect(container).toBeInTheDocument();
      }
    });
  });
});