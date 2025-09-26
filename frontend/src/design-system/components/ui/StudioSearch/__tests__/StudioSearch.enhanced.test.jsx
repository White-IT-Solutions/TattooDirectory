import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioSearch from '../StudioSearch';

// Mock enhanced tattoo styles data
jest.mock('../../../../../app/data/testData/enhancedTattooStyles', () => ({
  enhancedTattooStyles: {
    'traditional': {
      id: 'traditional',
      name: 'Traditional',
      description: 'Classic tattoo style with bold lines',
      difficulty: 'beginner',
      characteristics: ['Bold Lines', 'Limited Colors'],
      popularMotifs: ['Anchors', 'Roses'],
      aliases: ['Old School'],
      popularity: 85
    },
    'realism': {
      id: 'realism',
      name: 'Realism',
      description: 'Photorealistic tattoo style',
      difficulty: 'advanced',
      characteristics: ['Photographic Quality', 'Fine Details'],
      popularMotifs: ['Portraits', 'Animals'],
      aliases: ['Photo-realism'],
      popularity: 90
    }
  },
  difficultyLevels: {
    beginner: { label: 'Beginner', color: 'success' },
    intermediate: { label: 'Intermediate', color: 'warning' },
    advanced: { label: 'Advanced', color: 'error' }
  },
  searchStylesByAlias: jest.fn((query) => {
    const styles = [
      {
        id: 'traditional',
        name: 'Traditional',
        description: 'Classic tattoo style with bold lines',
        difficulty: 'beginner',
        characteristics: ['Bold Lines', 'Limited Colors'],
        popularMotifs: ['Anchors', 'Roses'],
        aliases: ['Old School'],
        popularity: 85
      }
    ];
    return styles.filter(style => 
      style.name.toLowerCase().includes(query.toLowerCase()) ||
      style.aliases.some(alias => alias.toLowerCase().includes(query.toLowerCase()))
    );
  })
}));

// Mock studios data with style information
const mockStudios = [
  {
    studioId: 'studio-001',
    studioName: 'Test Studio',
    locationDisplay: 'London, UK',
    specialties: ['Traditional', 'Realism'],
    styles: ['traditional', 'realism'],
    rating: 4.5,
    address: { city: 'London' }
  },
  {
    studioId: 'studio-002',
    studioName: 'Modern Studio',
    locationDisplay: 'Manchester, UK',
    specialties: ['Minimalist'],
    styles: ['minimalist'],
    rating: 4.2,
    address: { city: 'Manchester' }
  }
];

describe('StudioSearch Enhanced Style Filtering', () => {
  const defaultProps = {
    studios: mockStudios,
    onFilterChange: jest.fn(),
    onSortChange: jest.fn(),
    onViewModeChange: jest.fn(),
    onMapToggle: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Style Filter Toggle', () => {
    it('renders style filters toggle button', () => {
      render(<StudioSearch {...defaultProps} />);
      
      const styleToggle = screen.getByTestId('style-filters-toggle');
      expect(styleToggle).toBeInTheDocument();
      expect(styleToggle).toHaveTextContent('Styles');
    });

    it('shows style filters panel when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      expect(screen.getByTestId('style-search-input')).toBeInTheDocument();
    });
  });

  describe('Style Search and Selection', () => {
    it('allows searching for styles', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      // Search for a style
      const styleSearchInput = screen.getByTestId('style-search-input');
      await user.type(styleSearchInput, 'traditional');
      
      expect(styleSearchInput).toHaveValue('traditional');
    });

    it('displays style buttons for selection', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      // Check for style buttons
      expect(screen.getByTestId('style-button-traditional')).toBeInTheDocument();
      expect(screen.getByTestId('style-button-realism')).toBeInTheDocument();
    });

    it('allows selecting and deselecting styles', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      // Select a style
      const traditionalButton = screen.getByTestId('style-button-traditional');
      await user.click(traditionalButton);
      
      // Check that filter change was called with style filters
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            styleFilters: ['traditional']
          })
        );
      });
    });
  });

  describe('Style Filter Tags', () => {
    it('displays selected styles as filter tags', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      // Select a style
      const traditionalButton = screen.getByTestId('style-button-traditional');
      await user.click(traditionalButton);
      
      // Check for style filter tag
      await waitFor(() => {
        expect(screen.getByTestId('style-filter-tag-traditional')).toBeInTheDocument();
      });
    });

    it('allows removing style filters via tags', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open style filters and select a style
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      const traditionalButton = screen.getByTestId('style-button-traditional');
      await user.click(traditionalButton);
      
      // Wait for tag to appear and remove it
      await waitFor(() => {
        const styleTag = screen.getByTestId('style-filter-tag-traditional');
        expect(styleTag).toBeInTheDocument();
      });
      
      const removeButton = screen.getByTestId('style-filter-tag-traditional').querySelector('button');
      await user.click(removeButton);
      
      // Check that filter was removed
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            styleFilters: []
          })
        );
      });
    });
  });

  describe('Style Autocomplete Suggestions', () => {
    it('includes style suggestions in main search autocomplete', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const searchInput = screen.getByTestId('studio-search-input');
      await user.type(searchInput, 'trad');
      
      // Should show style suggestions
      await waitFor(() => {
        const suggestions = screen.getByTestId('search-suggestions');
        expect(suggestions).toBeInTheDocument();
      });
    });
  });

  describe('Clear Filters', () => {
    it('clears all filters including styles', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open style filters and select a style
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      const traditionalButton = screen.getByTestId('style-button-traditional');
      await user.click(traditionalButton);
      
      // Clear all filters
      await waitFor(() => {
        const clearButton = screen.getByTestId('clear-filters-button');
        expect(clearButton).toBeInTheDocument();
      });
      
      const clearButton = screen.getByTestId('clear-filters-button');
      await user.click(clearButton);
      
      // Check that all filters were cleared
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            styleFilters: [],
            specialtyFilters: [],
            searchTerm: '',
            locationFilter: ''
          })
        );
      });
    });
  });
});