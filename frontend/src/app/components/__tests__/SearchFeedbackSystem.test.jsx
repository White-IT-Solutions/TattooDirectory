import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchFeedbackSystem, { RelatedCategories } from '../SearchFeedbackSystem';

// Mock the design system components
jest.mock('../../../design-system/components/ui', () => ({
  Card: ({ children, className }) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
  Badge: ({ children, variant, size }) => (
    <span data-testid="badge" data-variant={variant} data-size={size}>
      {children}
    </span>
  ),
  Tag: ({ children, variant, size }) => (
    <span data-testid="tag" data-variant={variant} data-size={size}>
      {children}
    </span>
  ),
  Button: ({ children, variant, size, onClick }) => (
    <button data-testid="button" data-variant={variant} data-size={size} onClick={onClick}>
      {children}
    </button>
  )
}));

// Mock the enhanced tattoo styles data
jest.mock('../../data/testData/enhancedTattooStyles', () => ({
  enhancedTattooStyles: {
    traditional: {
      id: 'traditional',
      name: 'Traditional',
      aliases: ['old_school', 'sailor_jerry'],
      description: 'Bold, iconic tattoo style',
      characteristics: ['Bold outlines', 'Solid colors'],
      difficulty: 'beginner',
      popularity: 85
    },
    realism: {
      id: 'realism',
      name: 'Realism',
      aliases: ['realistic', 'photo_realism'],
      description: 'Lifelike tattoo representations',
      characteristics: ['Detailed shading', 'Realistic proportions'],
      difficulty: 'advanced',
      popularity: 78
    }
  },
  searchStylesByAlias: jest.fn((query) => {
    const styles = {
      traditional: {
        id: 'traditional',
        name: 'Traditional',
        aliases: ['old_school', 'sailor_jerry'],
        difficulty: 'beginner',
        popularity: 85
      }
    };
    
    if (query.toLowerCase().includes('traditional') || query.toLowerCase().includes('sailor')) {
      return [styles.traditional];
    }
    return [];
  })
}));

// Mock utility functions
jest.mock('../../../design-system/utils/cn', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' ')
}));

describe('SearchFeedbackSystem', () => {
  const defaultProps = {
    searchQuery: '',
    activeFilters: {},
    showSuggestions: true,
    showTips: true,
    showPopular: true,
    showRelated: true,
    onSuggestionClick: jest.fn(),
    onSearchClick: jest.fn(),
    onCategoryClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Suggestions', () => {
    it('displays search suggestions for valid queries', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="traditional"
        />
      );

      expect(screen.getByText('Search Suggestions')).toBeInTheDocument();
    });

    it('shows spelling correction suggestions', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="tradional" // misspelled
        />
      );

      expect(screen.getByText('traditional')).toBeInTheDocument();
      expect(screen.getByText(/Did you mean "traditional"/)).toBeInTheDocument();
    });

    it('displays style suggestions with metadata', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="sailor"
        />
      );

      // Use more specific selector for suggestions section
      expect(screen.getByText('Search Suggestions')).toBeInTheDocument();
      expect(screen.getByText(/beginner difficulty • 85% popularity/)).toBeInTheDocument();
    });

    it('shows location suggestions for city names', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="lond"
        />
      );

      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Search in this location')).toBeInTheDocument();
    });

    it('calls onSuggestionClick when suggestion is clicked', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="traditional"
        />
      );

      // Find the suggestion button by looking for the one with the style icon
      const suggestionButtons = screen.getAllByRole('button');
      const styleButton = suggestionButtons.find(button => 
        button.textContent.includes('🎨') && button.textContent.includes('Traditional')
      );
      
      expect(styleButton).toBeInTheDocument();
      fireEvent.click(styleButton);

      expect(defaultProps.onSuggestionClick).toHaveBeenCalled();
    });

    it('limits suggestions to maxSuggestions prop', () => {
      const { container } = render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="a" // Should match many items
        />
      );

      const suggestionButtons = container.querySelectorAll('button');
      // Should not exceed default max of 6 suggestions
      expect(suggestionButtons.length).toBeLessThanOrEqual(6);
    });

    it('does not show suggestions for queries less than 2 characters', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="a"
        />
      );

      expect(screen.queryByText('Search Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('Search Tips', () => {
    it('displays search tips section', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      expect(screen.getByText('Search Tips')).toBeInTheDocument();
    });

    it('shows query-specific tips for short queries', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="ab"
        />
      );

      expect(screen.getByText('Try using at least 3 characters for better results')).toBeInTheDocument();
    });

    it('shows tip for long queries', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="very long search query with many words"
        />
      );

      expect(screen.getByText('Try shorter, more specific search terms')).toBeInTheDocument();
    });

    it('shows filter-specific tips when filters are active', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          activeFilters={{ styles: ['traditional'], location: 'London' }}
        />
      );

      expect(screen.getByText('Remove some filters to see more results')).toBeInTheDocument();
    });

    it('shows general tips when no specific conditions are met', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      expect(screen.getByText('Use style names like "traditional" or "realism"')).toBeInTheDocument();
      expect(screen.getByText('Search by location like "London" or "Manchester"')).toBeInTheDocument();
      expect(screen.getByText('Try artist or studio names')).toBeInTheDocument();
    });
  });

  describe('Popular Searches', () => {
    it('displays popular searches when no search query', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      expect(screen.getByText('Popular Searches')).toBeInTheDocument();
      // Look for buttons containing the popular search text
      expect(screen.getByRole('button', { name: /Traditional tattoos/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /London artists/ })).toBeInTheDocument();
    });

    it('does not show popular searches when there is a search query', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="traditional"
        />
      );

      expect(screen.queryByText('Popular Searches')).not.toBeInTheDocument();
    });

    it('calls onSearchClick when popular search is clicked', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      const popularSearchButton = screen.getByRole('button', { name: /Traditional tattoos/ });
      fireEvent.click(popularSearchButton);

      expect(defaultProps.onSearchClick).toHaveBeenCalledWith('Traditional tattoos');
    });
  });

  describe('Related Categories', () => {
    it('displays browse categories when no search query', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      expect(screen.getByText('Browse Categories')).toBeInTheDocument();
      // Look for category buttons specifically
      const categoryButtons = screen.getAllByRole('button');
      const traditionalButton = categoryButtons.find(button => 
        button.textContent.includes('Traditional') && button.textContent.includes('⚓')
      );
      const realismButton = categoryButtons.find(button => 
        button.textContent.includes('Realism') && button.textContent.includes('🎭')
      );
      expect(traditionalButton).toBeInTheDocument();
      expect(realismButton).toBeInTheDocument();
    });

    it('shows related categories when there is a search query', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="traditional"
        />
      );

      expect(screen.getByText('Related Categories')).toBeInTheDocument();
    });

    it('calls onCategoryClick when category is clicked', () => {
      const mockOnCategoryClick = jest.fn();
      
      // Test the RelatedCategories component directly to avoid conflicts
      render(
        <RelatedCategories
          searchQuery=""
          onCategoryClick={mockOnCategoryClick}
        />
      );

      // Find the Traditional category button
      const traditionalButton = screen.getByRole('button', {
        name: /traditional/i
      });
      
      expect(traditionalButton).toBeInTheDocument();
      
      fireEvent.click(traditionalButton);

      expect(mockOnCategoryClick).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Traditional'
        })
      );
    });
  });

  describe('Visibility Control', () => {
    it('auto-hides after 5 seconds when there is a search query', async () => {
      jest.useFakeTimers();
      
      const { container } = render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="traditional"
        />
      );

      expect(container.firstChild).toBeInTheDocument();

      // Fast-forward time by 5 seconds and wrap in act
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      jest.useRealTimers();
    });

    it('remains visible when there is no search query', async () => {
      jest.useFakeTimers();
      
      const { container } = render(<SearchFeedbackSystem {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();

      // Fast-forward time by 5 seconds and wrap in act
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Should still be visible
      expect(container.firstChild).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Component Visibility Props', () => {
    it('hides suggestions when showSuggestions is false', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          searchQuery="traditional"
          showSuggestions={false}
        />
      );

      expect(screen.queryByText('Search Suggestions')).not.toBeInTheDocument();
    });

    it('hides tips when showTips is false', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          showTips={false}
        />
      );

      expect(screen.queryByText('Search Tips')).not.toBeInTheDocument();
    });

    it('hides popular searches when showPopular is false', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          showPopular={false}
        />
      );

      expect(screen.queryByText('Popular Searches')).not.toBeInTheDocument();
    });

    it('hides related categories when showRelated is false', () => {
      render(
        <SearchFeedbackSystem 
          {...defaultProps} 
          showRelated={false}
        />
      );

      expect(screen.queryByText('Browse Categories')).not.toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('renders components in proper grid layout', () => {
      const { container } = render(<SearchFeedbackSystem {...defaultProps} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });

    it('organizes content in left and right columns', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      // Tips should be in left column
      expect(screen.getByText('Search Tips')).toBeInTheDocument();
      
      // Categories should be in right column
      expect(screen.getByText('Browse Categories')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles undefined searchQuery gracefully', () => {
      expect(() => {
        render(
          <SearchFeedbackSystem 
            {...defaultProps} 
            searchQuery={undefined}
          />
        );
      }).not.toThrow();
    });

    it('handles empty activeFilters object', () => {
      expect(() => {
        render(
          <SearchFeedbackSystem 
            {...defaultProps} 
            activeFilters={{}}
          />
        );
      }).not.toThrow();
    });

    it('handles missing callback functions', () => {
      expect(() => {
        render(
          <SearchFeedbackSystem 
            searchQuery="test"
            activeFilters={{}}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 4, name: 'Search Tips' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Browse Categories' })).toBeInTheDocument();
    });

    it('provides accessible button labels', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/\S/); // Should have some text content
      });
    });

    it('uses semantic HTML structure', () => {
      render(<SearchFeedbackSystem {...defaultProps} />);

      // Should have proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});