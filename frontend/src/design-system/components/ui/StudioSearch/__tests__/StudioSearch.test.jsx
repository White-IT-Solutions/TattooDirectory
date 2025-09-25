import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioSearch from '../StudioSearch';

// Mock studios data for testing
const mockStudios = [
  {
    studioId: 'studio-001',
    studioName: 'Rebel Ink Studio',
    locationDisplay: 'Manchester, UK',
    address: { city: 'Manchester', latitude: 53.4808, longitude: -2.2426 },
    specialties: ['geometric', 'realism', 'traditional'],
    rating: 4.8,
    reviewCount: 127,
    artistCount: 5,
    established: 2015
  },
  {
    studioId: 'studio-002',
    studioName: 'Modern Ink Studio',
    locationDisplay: 'London, UK',
    address: { city: 'London', latitude: 51.5074, longitude: -0.1278 },
    specialties: ['minimalist', 'fine line', 'watercolor'],
    rating: 4.6,
    reviewCount: 89,
    artistCount: 3,
    established: 2018
  },
  {
    studioId: 'studio-003',
    studioName: 'Electric Needle Studio',
    locationDisplay: 'Birmingham, UK',
    address: { city: 'Birmingham', latitude: 52.4862, longitude: -1.8904 },
    specialties: ['japanese', 'biomechanical', 'portrait'],
    rating: 4.9,
    reviewCount: 203,
    artistCount: 7,
    established: 2012
  }
];

describe('StudioSearch Component', () => {
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

  describe('Basic Rendering', () => {
    it('renders search input correctly', () => {
      render(<StudioSearch {...defaultProps} />);
      
      const searchInput = screen.getByTestId('studio-search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search studios by name, location, or specialty...');
    });

    it('renders all filter controls', () => {
      render(<StudioSearch {...defaultProps} />);
      
      expect(screen.getByTestId('location-filter')).toBeInTheDocument();
      expect(screen.getByTestId('rating-filter')).toBeInTheDocument();
      expect(screen.getByTestId('sort-select')).toBeInTheDocument();
      expect(screen.getByTestId('grid-view-button')).toBeInTheDocument();
      expect(screen.getByTestId('list-view-button')).toBeInTheDocument();
    });

    it('renders map toggle and advanced filters buttons', () => {
      render(<StudioSearch {...defaultProps} />);
      
      expect(screen.getByTestId('map-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-filters-toggle')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onFilterChange when search term changes', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const searchInput = screen.getByTestId('studio-search-input');
      await user.type(searchInput, 'Rebel');
      
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchTerm: 'Rebel'
          })
        );
      });
    });

    it('shows autocomplete suggestions when typing', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const searchInput = screen.getByTestId('studio-search-input');
      await user.type(searchInput, 'Rebel');
      
      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
      });
    });

    it('filters suggestions by studio name', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const searchInput = screen.getByTestId('studio-search-input');
      await user.type(searchInput, 'Modern');
      
      await waitFor(() => {
        const suggestions = screen.getByTestId('search-suggestions');
        expect(suggestions).toHaveTextContent('Modern Ink Studio');
      });
    });

    it('handles keyboard navigation in suggestions', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const searchInput = screen.getByTestId('studio-search-input');
      await user.type(searchInput, 'ink');
      
      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
      });

      // Test arrow down navigation
      await user.keyboard('{ArrowDown}');
      
      // First suggestion should be highlighted
      const firstSuggestion = screen.getByTestId('suggestion-0');
      expect(firstSuggestion).toHaveClass('bg-[var(--background-secondary)]');
    });
  });

  describe('Filter Controls', () => {
    it('handles location filter changes', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const locationFilter = screen.getByTestId('location-filter');
      await user.selectOptions(locationFilter, 'Manchester');
      
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            locationFilter: 'Manchester'
          })
        );
      });
    });

    it('handles rating filter changes', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const ratingFilter = screen.getByTestId('rating-filter');
      await user.selectOptions(ratingFilter, '4.5');
      
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            ratingFilter: 4.5
          })
        );
      });
    });

    it('handles sort changes', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'rating');
      
      expect(defaultProps.onSortChange).toHaveBeenCalledWith('rating');
    });
  });

  describe('View Mode Controls', () => {
    it('handles grid view selection', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const gridButton = screen.getByTestId('grid-view-button');
      await user.click(gridButton);
      
      expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('grid');
    });

    it('handles list view selection', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const listButton = screen.getByTestId('list-view-button');
      await user.click(listButton);
      
      expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('list');
    });

    it('handles map toggle', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const mapToggle = screen.getByTestId('map-toggle');
      await user.click(mapToggle);
      
      expect(defaultProps.onMapToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Advanced Filters', () => {
    it('shows advanced filters when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      const advancedToggle = screen.getByTestId('advanced-filters-toggle');
      await user.click(advancedToggle);
      
      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      expect(screen.getByText('Specialties')).toBeInTheDocument();
      expect(screen.getByText('Established Year')).toBeInTheDocument();
      expect(screen.getByText('Number of Artists')).toBeInTheDocument();
    });

    it('handles specialty filter selection', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open advanced filters
      const advancedToggle = screen.getByTestId('advanced-filters-toggle');
      await user.click(advancedToggle);
      
      // Select a specialty
      const geometricCheckbox = screen.getByTestId('specialty-checkbox-geometric');
      await user.click(geometricCheckbox);
      
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            specialtyFilters: ['geometric']
          })
        );
      });
    });

    it('handles established year range changes', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open advanced filters
      const advancedToggle = screen.getByTestId('advanced-filters-toggle');
      await user.click(advancedToggle);
      
      // Change year range
      const yearFromInput = screen.getByTestId('established-year-from');
      await user.clear(yearFromInput);
      await user.type(yearFromInput, '2010');
      
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            establishedYearRange: [2010, 2024]
          })
        );
      });
    });

    it('handles artist count range changes', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Open advanced filters
      const advancedToggle = screen.getByTestId('advanced-filters-toggle');
      await user.click(advancedToggle);
      
      // Change artist count range
      const artistMinInput = screen.getByTestId('artist-count-min');
      await user.clear(artistMinInput);
      await user.type(artistMinInput, '3');
      
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            artistCountRange: [3, 20]
          })
        );
      });
    });
  });

  describe('Active Filters Display', () => {
    it('shows active filter tags when filters are applied', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Apply a search filter
      const searchInput = screen.getByTestId('studio-search-input');
      await user.type(searchInput, 'Rebel');
      
      await waitFor(() => {
        expect(screen.getByTestId('search-filter-tag')).toBeInTheDocument();
        expect(screen.getByText('Search: Rebel')).toBeInTheDocument();
      });
    });

    it('allows removing individual filter tags', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Apply a location filter
      const locationFilter = screen.getByTestId('location-filter');
      await user.selectOptions(locationFilter, 'Manchester');
      
      await waitFor(() => {
        expect(screen.getByTestId('location-filter-tag')).toBeInTheDocument();
      });

      // Remove the filter tag
      const removeButton = screen.getByTestId('location-filter-tag').querySelector('button');
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            locationFilter: ''
          })
        );
      });
    });

    it('allows clearing all filters', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Apply multiple filters
      const searchInput = screen.getByTestId('studio-search-input');
      await user.type(searchInput, 'test');
      
      const locationFilter = screen.getByTestId('location-filter');
      await user.selectOptions(locationFilter, 'Manchester');
      
      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
      });

      // Clear all filters
      const clearButton = screen.getByTestId('clear-filters-button');
      await user.click(clearButton);
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: '',
          locationFilter: '',
          specialtyFilters: [],
          styleFilters: [],
          ratingFilter: 0,
          establishedYearRange: [2000, 2024],
          artistCountRange: [1, 20]
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<StudioSearch {...defaultProps} />);
      
      const searchInput = screen.getByTestId('studio-search-input');
      expect(searchInput).toHaveAttribute('type', 'search');
      
      const locationFilter = screen.getByTestId('location-filter');
      expect(locationFilter).toHaveRole('combobox');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StudioSearch {...defaultProps} />);
      
      // Tab through controls
      await user.tab();
      expect(screen.getByTestId('studio-search-input')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('map-toggle')).toHaveFocus();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders mobile-friendly controls', () => {
      render(<StudioSearch {...defaultProps} />);
      
      // Check that view mode buttons have proper touch targets
      const gridButton = screen.getByTestId('grid-view-button');
      const listButton = screen.getByTestId('list-view-button');
      
      expect(gridButton).toHaveClass('min-w-16');
      expect(listButton).toHaveClass('min-w-16');
    });

    it('handles responsive layout classes', () => {
      render(<StudioSearch {...defaultProps} />);
      
      const container = screen.getByTestId('studio-search-input').closest('.flex');
      expect(container).toHaveClass('flex-col', 'md:flex-row');
    });
  });

  describe('Error Handling', () => {
    it('handles empty studios array gracefully', () => {
      render(<StudioSearch {...defaultProps} studios={[]} />);
      
      expect(screen.getByTestId('studio-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('location-filter')).toBeInTheDocument();
    });

    it('handles missing callback props gracefully', () => {
      const { onFilterChange, onSortChange, ...propsWithoutCallbacks } = defaultProps;
      
      expect(() => {
        render(<StudioSearch {...propsWithoutCallbacks} studios={mockStudios} />);
      }).not.toThrow();
    });
  });
});