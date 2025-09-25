import { render, screen } from '@testing-library/react';
import StudioSearch from '../StudioSearch';

// Mock studios data for testing
const mockStudios = [
  {
    studioId: 'studio-001',
    studioName: 'Rebel Ink Studio',
    locationDisplay: 'Manchester, UK',
    address: { city: 'Manchester' },
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
    address: { city: 'London' },
    specialties: ['minimalist', 'fine line', 'watercolor'],
    rating: 4.6,
    reviewCount: 89,
    artistCount: 3,
    established: 2018
  }
];

describe('StudioSearch Component - Basic Functionality', () => {
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

    it('calls onFilterChange on initial render', () => {
      render(<StudioSearch {...defaultProps} />);
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
        searchTerm: '',
        locationFilter: '',
        specialtyFilters: [],
        ratingFilter: 0,
        establishedYearRange: [2000, 2024],
        artistCountRange: [1, 20]
      });
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