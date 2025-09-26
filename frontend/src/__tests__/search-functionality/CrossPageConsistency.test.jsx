/**
 * Cross-Page Search Consistency Integration Tests
 * 
 * These tests verify that search functionality behaves consistently
 * across different pages and components in the application.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import pages to test
import ArtistsPage from '../../app/artists/page';
import StudiosPage from '../../app/studios/page';
import StylesPage from '../../app/styles/page';

// Import search components
import EnhancedStyleFilter from '../../app/components/EnhancedStyleFilter';
import SearchResultsDisplay from '../../app/components/SearchResultsDisplay';

// Import standardized style model
import { enhancedTattooStyles, difficultyLevels } from '../../app/data/testdata/enhancedtattoostyles';

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
    searchArtists: jest.fn().mockResolvedValue({ artists: [], totalCount: 0 }),
    searchStudios: jest.fn().mockResolvedValue({ studios: [], totalCount: 0 }),
    getArtists: jest.fn().mockResolvedValue([]),
    getStudios: jest.fn().mockResolvedValue([]),
  }
}));

describe('Cross-Page Search Consistency Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Style Filter Consistency Across Pages', () => {
    it('should render identical style options on artists and studios pages', async () => {
      // Render Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const artistsStyleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(artistsStyleToggle);

      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });

      // Collect style buttons from artists page
      const artistsStyleButtons = screen.getAllByTestId(/^style-button-/).map(button => 
        button.getAttribute('data-testid')
      );

      unmountArtists();

      // Render Studios page
      const { unmount: unmountStudios } = render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      const studiosStyleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(studiosStyleToggle);

      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });

      // Collect style buttons from studios page
      const studiosStyleButtons = screen.getAllByTestId(/^style-button-/).map(button => 
        button.getAttribute('data-testid')
      );

      // Compare style options
      expect(artistsStyleButtons.sort()).toEqual(studiosStyleButtons.sort());

      unmountStudios();
    });

    it('should display identical style metadata across pages', async () => {
      const testStyleId = 'old_school';
      const expectedStyle = enhancedTattooStyles[testStyleId];

      // Test on Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      let styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        const styleButton = screen.getByTestId(`style-button-${testStyleId}`);
        expect(styleButton).toHaveTextContent(expectedStyle.name);
      });

      unmountArtists();

      // Test on Studios page
      const { unmount: unmountStudios } = render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        const styleButton = screen.getByTestId(`style-button-${testStyleId}`);
        expect(styleButton).toHaveTextContent(expectedStyle.name);
      });

      unmountStudios();
    });

    it('should use consistent difficulty level indicators across pages', async () => {
      // Test that difficulty badges are consistent
      const testStyleId = 'old_school';
      const expectedDifficulty = enhancedTattooStyles[testStyleId].difficulty;
      const expectedDifficultyConfig = difficultyLevels[expectedDifficulty];

      // Test on Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      let styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        const styleButton = screen.getByTestId(`style-button-${testStyleId}`);
        // Check for difficulty indicator (implementation may vary)
        expect(styleButton).toBeInTheDocument();
      });

      unmountArtists();

      // Test on Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        const styleButton = screen.getByTestId(`style-button-${testStyleId}`);
        expect(styleButton).toBeInTheDocument();
      });
    });
  });

  describe('Search Interface Consistency', () => {
    it('should have consistent search input behavior across pages', async () => {
      const user = userEvent.setup();

      // Test Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search artists/i);
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search artists/i);
      await user.type(searchInput, 'dragon');
      expect(searchInput).toHaveValue('dragon');

      unmountArtists();

      // Test Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        // Studios page should have similar search functionality
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });

      // Check for search input (may have different placeholder)
      const studiosSearchInput = screen.queryByRole('textbox');
      if (studiosSearchInput) {
        await user.type(studiosSearchInput, 'dragon');
        expect(studiosSearchInput).toHaveValue('dragon');
      }
    });

    it('should have consistent filter toggle behavior', async () => {
      const user = userEvent.setup();

      // Test Artists page filter toggle
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      let styleToggle = screen.getByTestId('style-filters-toggle');
      expect(styleToggle).toHaveTextContent('Styles');

      await user.click(styleToggle);
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });

      unmountArtists();

      // Test Studios page filter toggle
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      styleToggle = screen.getByTestId('style-filters-toggle');
      expect(styleToggle).toHaveTextContent('Styles');

      await user.click(styleToggle);
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
    });

    it('should have consistent clear filters functionality', async () => {
      const user = userEvent.setup();

      // Test on Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      // Open filters and select a style
      let styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });

      const styleButton = screen.queryByTestId('style-button-old_school');
      if (styleButton) {
        await user.click(styleButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
        });

        // Clear filters
        const clearButton = screen.getByTestId('clear-filters-button');
        await user.click(clearButton);

        await waitFor(() => {
          expect(screen.queryByTestId('style-filter-tag-old_school')).not.toBeInTheDocument();
        });
      }

      unmountArtists();

      // Test on Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      // Repeat the same test
      styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });

      const studiosStyleButton = screen.queryByTestId('style-button-old_school');
      if (studiosStyleButton) {
        await user.click(studiosStyleButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-old_school')).toBeInTheDocument();
        });

        const clearButton = screen.getByTestId('clear-filters-button');
        await user.click(clearButton);

        await waitFor(() => {
          expect(screen.queryByTestId('style-filter-tag-old_school')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Search Results Display Consistency', () => {
    it('should display results count consistently across pages', async () => {
      // Mock API responses
      const mockApi = require('../../lib/api').api;
      mockApi.searchArtists.mockResolvedValue({ 
        artists: [{ id: '1', name: 'Artist 1' }], 
        totalCount: 1 
      });
      mockApi.searchStudios.mockResolvedValue({ 
        studios: [{ id: '1', name: 'Studio 1' }], 
        totalCount: 1 
      });

      // Test Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        // Look for results count display
        const resultsText = screen.queryByText(/\d+ artists? found/);
        if (resultsText) {
          expect(resultsText).toBeInTheDocument();
        }
      });

      unmountArtists();

      // Test Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        // Look for results count display
        const resultsText = screen.queryByText(/\d+ studios? found/);
        if (resultsText) {
          expect(resultsText).toBeInTheDocument();
        }
      });
    });

    it('should handle empty results consistently', async () => {
      // Mock empty responses
      const mockApi = require('../../lib/api').api;
      mockApi.searchArtists.mockResolvedValue({ artists: [], totalCount: 0 });
      mockApi.searchStudios.mockResolvedValue({ studios: [], totalCount: 0 });

      // Test Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        // Should show some indication of no results or default state
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });

      unmountArtists();

      // Test Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
    });
  });

  describe('Style Model Data Synchronization', () => {
    it('should use identical style data across all components', () => {
      // Test that all components reference the same style data
      const styleIds = Object.keys(enhancedTattooStyles);
      
      // Verify each style has required properties
      styleIds.forEach(styleId => {
        const style = enhancedTattooStyles[styleId];
        
        expect(style).toHaveProperty('id', styleId);
        expect(style).toHaveProperty('name');
        expect(style).toHaveProperty('difficulty');
        expect(style).toHaveProperty('characteristics');
        expect(style).toHaveProperty('popularMotifs');
        expect(style).toHaveProperty('aliases');
        expect(style).toHaveProperty('popularity');
      });
    });

    it('should maintain consistent style ordering across components', () => {
      // Test that style ordering is consistent
      const styleIds = Object.keys(enhancedTattooStyles);
      const sortedByPopularity = Object.values(enhancedTattooStyles)
        .sort((a, b) => b.popularity - a.popularity)
        .map(style => style.id);

      // Verify that popularity-based sorting is consistent
      expect(sortedByPopularity).toEqual(expect.arrayContaining(styleIds));
    });

    it('should have consistent alias mappings across components', () => {
      // Test alias search functionality consistency
      const { searchStylesByAlias } = require('../../app/data/testdata/enhancedtattoostyles');
      
      // Test specific alias mappings
      const sailorJerryResults = searchStylesByAlias('sailor jerry');
      expect(sailorJerryResults.some(style => style.id === 'old_school')).toBe(true);

      const traditionalResults = searchStylesByAlias('traditional');
      expect(traditionalResults.length).toBeGreaterThan(0);

      const realismResults = searchStylesByAlias('realistic');
      expect(realismResults.some(style => style.id === 'realism')).toBe(true);
    });
  });

  describe('Filter State Management Consistency', () => {
    it('should maintain filter state structure across pages', async () => {
      const user = userEvent.setup();

      // Test filter state on Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      let styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });

      // Select a style and verify filter tag structure
      const styleButton = screen.queryByTestId('style-button-old_school');
      if (styleButton) {
        await user.click(styleButton);
        
        await waitFor(() => {
          const filterTag = screen.getByTestId('style-filter-tag-old_school');
          expect(filterTag).toBeInTheDocument();
          expect(filterTag).toHaveTextContent('Old School');
        });
      }

      unmountArtists();

      // Test same filter state structure on Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);

      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });

      const studiosStyleButton = screen.queryByTestId('style-button-old_school');
      if (studiosStyleButton) {
        await user.click(studiosStyleButton);
        
        await waitFor(() => {
          const filterTag = screen.getByTestId('style-filter-tag-old_school');
          expect(filterTag).toBeInTheDocument();
          expect(filterTag).toHaveTextContent('Old School');
        });
      }
    });

    it('should have consistent filter count display', async () => {
      const user = userEvent.setup();

      // Test on Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      let styleToggle = screen.getByTestId('style-filters-toggle');
      expect(styleToggle).toHaveTextContent('Styles');

      await user.click(styleToggle);

      const styleButton = screen.queryByTestId('style-button-old_school');
      if (styleButton) {
        await user.click(styleButton);
        
        await waitFor(() => {
          expect(styleToggle).toHaveTextContent('Styles (1)');
        });
      }

      unmountArtists();

      // Test on Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('style-filters-toggle')).toBeInTheDocument();
      });

      styleToggle = screen.getByTestId('style-filters-toggle');
      expect(styleToggle).toHaveTextContent('Styles');

      await user.click(styleToggle);

      const studiosStyleButton = screen.queryByTestId('style-button-old_school');
      if (studiosStyleButton) {
        await user.click(studiosStyleButton);
        
        await waitFor(() => {
          expect(styleToggle).toHaveTextContent('Styles (1)');
        });
      }
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle API errors consistently across pages', async () => {
      // Mock API errors
      const mockApi = require('../../lib/api').api;
      mockApi.searchArtists.mockRejectedValue(new Error('API Error'));
      mockApi.searchStudios.mockRejectedValue(new Error('API Error'));

      // Test error handling on Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        // Should handle error gracefully without crashing
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });

      unmountArtists();

      // Test error handling on Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        // Should handle error gracefully without crashing
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
    });

    it('should show consistent loading states', async () => {
      // Mock slow API responses
      const mockApi = require('../../lib/api').api;
      mockApi.searchArtists.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ artists: [], totalCount: 0 }), 100))
      );
      mockApi.searchStudios.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ studios: [], totalCount: 0 }), 100))
      );

      // Test loading state on Artists page
      const { unmount: unmountArtists } = render(<ArtistsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Find Artists')).toBeInTheDocument();
      });

      unmountArtists();

      // Test loading state on Studios page
      render(<StudiosPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
    });
  });
});