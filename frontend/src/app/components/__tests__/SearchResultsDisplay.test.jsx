import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchResultsDisplay from '../SearchResultsDisplay';
import { enhancedTattooStyles } from '../../data/testData/enhancedTattooStyles';

// Mock the design system components
jest.mock('../../../design-system/components/ui', () => ({
  Card: ({ children, className, ...props }) => (
    <div className={className} data-testid="card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className }) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }) => (
    <h3 className={className} data-testid="card-title">{children}</h3>
  ),
  CardDescription: ({ children, className }) => (
    <p className={className} data-testid="card-description">{children}</p>
  ),
  CardContent: ({ children, className }) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
  CardFooter: ({ children, className }) => (
    <div className={className} data-testid="card-footer">{children}</div>
  ),
  Badge: ({ children, variant, size, ...props }) => (
    <span data-testid="badge" data-variant={variant} data-size={size} {...props}>
      {children}
    </span>
  ),
  Tag: ({ children, variant, size, removable, onRemove, ...props }) => (
    <span 
      data-testid="tag" 
      data-variant={variant} 
      data-size={size} 
      data-removable={removable}
      {...props}
    >
      {children}
      {removable && (
        <button onClick={onRemove} data-testid="tag-remove">×</button>
      )}
    </span>
  ),
  Button: ({ children, variant, size, onClick, disabled, ...props }) => (
    <button 
      data-testid="button" 
      data-variant={variant} 
      data-size={size}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock ArtistCard and StudioCard
jest.mock('../ArtistCard', () => {
  return function MockArtistCard({ artist }) {
    return (
      <div data-testid="artist-card">
        <h3>{artist.name}</h3>
        <p>{artist.location}</p>
      </div>
    );
  };
});

jest.mock('../../../design-system/components/ui/StudioCard/StudioCard', () => {
  return function MockStudioCard({ studio }) {
    return (
      <div data-testid="studio-card">
        <h3>{studio.name}</h3>
        <p>{studio.location}</p>
      </div>
    );
  };
});

// Mock skeleton components
jest.mock('../../../design-system/components/ui/Skeleton/ArtistCardSkeleton', () => ({
  ArtistCardSkeleton: () => <div data-testid="artist-skeleton">Loading artist...</div>
}));

jest.mock('../../../design-system/components/ui/Skeleton/StudioCardSkeleton', () => ({
  StudioCardSkeleton: () => <div data-testid="studio-skeleton">Loading studio...</div>
}));

// Mock utility functions
jest.mock('../../../design-system/utils/cn', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' ')
}));

describe('SearchResultsDisplay', () => {
  const mockResults = [
    {
      id: '1',
      type: 'artist',
      name: 'John Doe',
      location: 'London',
      styles: ['traditional', 'realism'],
      rating: 4.5
    },
    {
      id: '2',
      type: 'studio',
      name: 'Ink Studio',
      location: 'Manchester',
      specialties: ['Traditional', 'Realism'],
      rating: 4.2
    },
    {
      id: '3',
      type: 'style',
      name: 'Traditional Style', // Changed to avoid conflicts
      description: 'Bold, iconic tattoo style',
      difficulty: 'beginner',
      popularity: 85,
      characteristics: ['Bold outlines', 'Solid colors']
    }
  ];

  const mockActiveFilters = {
    styles: ['traditional'],
    location: 'London',
    rating: 4
  };

  const defaultProps = {
    results: mockResults,
    loading: false,
    searchQuery: 'traditional',
    activeFilters: mockActiveFilters,
    viewMode: 'grid',
    currentPage: 1,
    resultsPerPage: 20,
    totalResults: 3,
    suggestions: [],
    onResultClick: jest.fn(),
    onRemoveFilter: jest.fn(),
    onClearFilters: jest.fn(),
    onRefineSearch: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('displays loading skeletons when loading is true', () => {
      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          loading={true}
          results={[]}
        />
      );

      // Check for skeleton elements - should have at least some skeletons
      const allSkeletons = [
        ...screen.queryAllByTestId('artist-skeleton'),
        ...screen.queryAllByTestId('studio-skeleton')
      ];
      expect(allSkeletons.length).toBeGreaterThan(0);
    });

    it('shows correct number of skeleton items based on resultsPerPage', () => {
      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          loading={true}
          results={[]}
          resultsPerPage={4}
        />
      );

      // Should show 4 skeleton items total (mix of artist and studio)
      const artistSkeletons = screen.queryAllByTestId('artist-skeleton');
      const studioSkeletons = screen.queryAllByTestId('studio-skeleton');
      const totalSkeletons = artistSkeletons.length + studioSkeletons.length;
      expect(totalSkeletons).toBe(4);
    });
  });

  describe('Empty States', () => {
    it('displays empty state when no results and not loading', () => {
      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          results={[]}
          loading={false}
        />
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/No results found for "traditional"/)).toBeInTheDocument();
    });

    it('shows clear filters button in empty state when filters are active', () => {
      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          results={[]}
          loading={false}
        />
      );

      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    it('shows refine search button in empty state', () => {
      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          results={[]}
          loading={false}
        />
      );

      expect(screen.getByText('Refine Search')).toBeInTheDocument();
    });

    it('displays search suggestions in empty state', () => {
      const suggestions = [
        { text: 'realism', icon: '🎨', onClick: jest.fn() },
        { text: 'geometric', icon: '🔷', onClick: jest.fn() }
      ];

      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          results={[]}
          loading={false}
          suggestions={suggestions}
        />
      );

      expect(screen.getByText('🎨 realism')).toBeInTheDocument();
      expect(screen.getByText('🔷 geometric')).toBeInTheDocument();
    });
  });

  describe('Results Summary', () => {
    it('displays correct result count and search query', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(screen.getByText(/Showing 1-3 of 3 results for "traditional"/)).toBeInTheDocument();
    });

    it('shows total results badge', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      expect(screen.getByText('3 total results')).toBeInTheDocument();
    });

    it('displays active filters with remove buttons', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      // Should show active filters
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      // Look for the filter tag specifically, not the style result
      const filterTags = screen.getAllByTestId('tag');
      const styleFilter = filterTags.find(tag => tag.textContent.includes('Traditional'));
      expect(styleFilter).toBeInTheDocument();
      expect(screen.getByText('📍 London')).toBeInTheDocument(); // Location filter
      expect(screen.getByText('⭐ 4+ stars')).toBeInTheDocument(); // Rating filter
    });

    it('calls onRemoveFilter when filter remove button is clicked', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      const removeButtons = screen.getAllByTestId('tag-remove');
      fireEvent.click(removeButtons[0]);

      expect(defaultProps.onRemoveFilter).toHaveBeenCalledWith('styles', 'traditional');
    });

    it('calls onClearFilters when clear all button is clicked', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      const clearButton = screen.getByText('Clear all');
      fireEvent.click(clearButton);

      expect(defaultProps.onClearFilters).toHaveBeenCalled();
    });
  });

  describe('Result Display', () => {
    it('renders artist cards for artist results', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      expect(screen.getByTestId('artist-card')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders studio cards for studio results', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      expect(screen.getByTestId('studio-card')).toBeInTheDocument();
      expect(screen.getByText('Ink Studio')).toBeInTheDocument();
    });

    it('renders generic cards for style results', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      // Use more specific selectors to avoid ambiguity
      expect(screen.getByTestId('card-title')).toHaveTextContent('Traditional Style');
      expect(screen.getByText('Bold, iconic tattoo style')).toBeInTheDocument();
    });

    it('applies correct grid layout for grid view mode', () => {
      const { container } = render(
        <SearchResultsDisplay {...defaultProps} viewMode="grid" />
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });

    it('applies correct layout for list view mode', () => {
      const { container } = render(
        <SearchResultsDisplay {...defaultProps} viewMode="list" />
      );

      const listContainer = container.querySelector('.space-y-4');
      expect(listContainer).toBeInTheDocument();
    });

    it('calls onResultClick when result is clicked', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      const artistCard = screen.getByTestId('artist-card');
      fireEvent.click(artistCard);

      expect(defaultProps.onResultClick).toHaveBeenCalledWith(mockResults[0]);
    });
  });

  describe('Style Results', () => {
    it('displays style characteristics as tags', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      // Find characteristics within the style card content
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveTextContent('Bold outlines');
      expect(cardContent).toHaveTextContent('Solid colors');
    });

    it('shows difficulty badge for styles', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      // Case-insensitive match for difficulty
      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });

    it('displays popularity percentage for styles', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      expect(screen.getByText('85% popularity')).toBeInTheDocument();
    });

    it('limits characteristics display and shows overflow indicator', () => {
      const styleWithManyCharacteristics = {
        ...mockResults[2],
        characteristics: ['Char1', 'Char2', 'Char3', 'Char4', 'Char5']
      };

      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          results={[styleWithManyCharacteristics]}
        />
      );

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Search Results' })).toBeInTheDocument();
    });

    it('has accessible filter removal buttons', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      const removeButtons = screen.getAllByTestId('tag-remove');
      removeButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('provides meaningful text for screen readers', () => {
      render(<SearchResultsDisplay {...defaultProps} />);

      expect(screen.getByText(/Showing 1-3 of 3 results/)).toBeInTheDocument();
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing result properties gracefully', () => {
      const incompleteResults = [
        { id: '1', type: 'artist' }, // Missing name, location, etc.
        { id: '2', type: 'studio' }, // Missing name, location, etc.
        { id: '3', type: 'style' }   // Missing name, description, etc.
      ];

      expect(() => {
        render(
          <SearchResultsDisplay 
            {...defaultProps} 
            results={incompleteResults}
          />
        );
      }).not.toThrow();
    });

    it('handles empty activeFilters object', () => {
      expect(() => {
        render(
          <SearchResultsDisplay 
            {...defaultProps} 
            activeFilters={{}}
          />
        );
      }).not.toThrow();
    });

    it('handles undefined suggestions array', () => {
      expect(() => {
        render(
          <SearchResultsDisplay 
            {...defaultProps} 
            suggestions={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Pagination Context', () => {
    it('displays correct pagination information', () => {
      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          currentPage={2}
          resultsPerPage={10}
          totalResults={25}
        />
      );

      expect(screen.getByText(/Showing 11-20 of 25 results/)).toBeInTheDocument();
    });

    it('handles last page pagination correctly', () => {
      render(
        <SearchResultsDisplay 
          {...defaultProps} 
          currentPage={3}
          resultsPerPage={10}
          totalResults={25}
        />
      );

      expect(screen.getByText(/Showing 21-25 of 25 results/)).toBeInTheDocument();
    });
  });
});