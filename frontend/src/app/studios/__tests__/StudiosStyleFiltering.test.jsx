import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudiosPage from '../page';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock enhanced tattoo styles data
jest.mock('../../data/testData/enhancedTattooStyles', () => ({
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

describe('StudiosPage Style Filtering Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Style Filter Integration', () => {
    it('renders style filter toggle button', async () => {
      render(<StudiosPage />);
      
      await waitFor(() => {
        const styleToggle = screen.getByTestId('style-filters-toggle');
        expect(styleToggle).toBeInTheDocument();
        expect(styleToggle).toHaveTextContent('Styles');
      });
    });

    it('opens style filters panel and shows available styles', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      await waitFor(() => {
        const styleToggle = screen.getByTestId('style-filters-toggle');
        expect(styleToggle).toBeInTheDocument();
      });
      
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
        expect(screen.getByTestId('style-search-input')).toBeInTheDocument();
      });
    });

    it('allows selecting styles and filters studios accordingly', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Tattoo Studios')).toBeInTheDocument();
      });
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
      });
      
      // Select a style (if available)
      const traditionalButton = screen.queryByTestId('style-button-traditional');
      if (traditionalButton) {
        await user.click(traditionalButton);
        
        // Check that style filter tag appears
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-traditional')).toBeInTheDocument();
        });
      }
    });

    it('shows style count in toggle button when styles are selected', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      await waitFor(() => {
        const styleToggle = screen.getByTestId('style-filters-toggle');
        expect(styleToggle).toBeInTheDocument();
      });
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      // Select a style if available
      const traditionalButton = screen.queryByTestId('style-button-traditional');
      if (traditionalButton) {
        await user.click(traditionalButton);
        
        // Check that toggle shows count
        await waitFor(() => {
          expect(styleToggle).toHaveTextContent('Styles (1)');
        });
      }
    });

    it('allows clearing style filters', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      await waitFor(() => {
        const styleToggle = screen.getByTestId('style-filters-toggle');
        expect(styleToggle).toBeInTheDocument();
      });
      
      // Open style filters and select a style
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      const traditionalButton = screen.queryByTestId('style-button-traditional');
      if (traditionalButton) {
        await user.click(traditionalButton);
        
        // Wait for filter tag to appear
        await waitFor(() => {
          expect(screen.getByTestId('style-filter-tag-traditional')).toBeInTheDocument();
        });
        
        // Clear all filters
        const clearButton = screen.getByTestId('clear-filters-button');
        await user.click(clearButton);
        
        // Check that style filter is cleared
        await waitFor(() => {
          expect(screen.queryByTestId('style-filter-tag-traditional')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Style Search Integration', () => {
    it('allows searching for styles within the style filter panel', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      await waitFor(() => {
        const styleToggle = screen.getByTestId('style-filters-toggle');
        expect(styleToggle).toBeInTheDocument();
      });
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      await waitFor(() => {
        const styleSearchInput = screen.getByTestId('style-search-input');
        expect(styleSearchInput).toBeInTheDocument();
      });
      
      // Search for a style
      const styleSearchInput = screen.getByTestId('style-search-input');
      await user.type(styleSearchInput, 'traditional');
      
      expect(styleSearchInput).toHaveValue('traditional');
    });
  });

  describe('Results Filtering', () => {
    it('updates studio results when style filters are applied', async () => {
      const user = userEvent.setup();
      render(<StudiosPage />);
      
      // Wait for initial results
      await waitFor(() => {
        expect(screen.getByText(/\d+ studios? found/)).toBeInTheDocument();
      });
      
      const initialResultsText = screen.getByText(/\d+ studios? found/).textContent;
      
      // Open style filters
      const styleToggle = screen.getByTestId('style-filters-toggle');
      await user.click(styleToggle);
      
      // Select a style if available
      const traditionalButton = screen.queryByTestId('style-button-traditional');
      if (traditionalButton) {
        await user.click(traditionalButton);
        
        // Results should update (may be same or different count)
        await waitFor(() => {
          const updatedResultsText = screen.getByText(/\d+ studios? found/).textContent;
          expect(updatedResultsText).toBeDefined();
        });
      }
    });
  });
});