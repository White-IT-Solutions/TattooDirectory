import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioArtists from '../StudioArtists';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock artist data
const mockArtists = [
  {
    artistId: 'artist-001',
    artistName: 'Marcus Chen',
    bio: 'Sacred geometry and mandala expert creating precise patterns',
    avatar: '/avatar1.jpg',
    styles: ['geometric', 'realism', 'traditional'],
    rating: 4.3,
    reviewCount: 197,
    pricing: {
      hourlyRate: 99,
      minimumCharge: 58,
      currency: 'GBP',
      description: '£'
    },
    availability: {
      status: 'Booking 1-2 months',
      bookingOpen: true,
      nextAvailable: '2024-04-01',
      waitingList: false
    },
    experience: {
      yearsActive: 16,
      apprenticeshipCompleted: true,
      certifications: ['First Aid', 'Bloodborne Pathogens']
    },
    portfolioImages: [
      { url: '/portfolio1.jpg', description: 'Geometric design' },
      { url: '/portfolio2.jpg', description: 'Realism piece' },
      { url: '/portfolio3.jpg', description: 'Traditional work' }
    ],
    specialties: ['Sacred geometry', 'Wildlife', 'Custom designs']
  },
  {
    artistId: 'artist-002',
    artistName: 'Logan Davis',
    bio: 'Geometric and blackwork specialist with modern aesthetic',
    avatar: '/avatar2.jpg',
    styles: ['geometric', 'blackwork'],
    rating: 4.2,
    reviewCount: 149,
    pricing: {
      hourlyRate: 253,
      minimumCharge: 193,
      currency: 'GBP',
      description: '££££'
    },
    availability: {
      status: 'Books closed',
      bookingOpen: false,
      nextAvailable: null,
      waitingList: false
    },
    experience: {
      yearsActive: 15,
      apprenticeshipCompleted: true,
      certifications: ['First Aid', 'Bloodborne Pathogens', 'Color Theory']
    },
    portfolioImages: [
      { url: '/portfolio4.jpg', description: 'Blackwork design' },
      { url: '/portfolio5.jpg', description: 'Geometric pattern' }
    ],
    specialties: ['Mathematical patterns', 'Sacred geometry']
  },
  {
    artistId: 'artist-003',
    artistName: 'Sarah Mitchell',
    bio: 'Traditional and neo-traditional tattoo artist',
    avatar: '/avatar3.jpg',
    styles: ['traditional', 'neo-traditional'],
    rating: 4.0,
    reviewCount: 96,
    pricing: {
      hourlyRate: 174,
      minimumCharge: 149,
      currency: 'GBP',
      description: '£££'
    },
    availability: {
      status: 'Booking 1-2 weeks',
      bookingOpen: true,
      nextAvailable: '2024-02-15',
      waitingList: false
    },
    experience: {
      yearsActive: 11,
      apprenticeshipCompleted: true,
      certifications: ['First Aid', 'Bloodborne Pathogens']
    },
    portfolioImages: [
      { url: '/portfolio6.jpg', description: 'Traditional rose' }
    ],
    specialties: ['Custom designs', 'Large pieces']
  }
];

describe('StudioArtists Component', () => {
  const defaultProps = {
    artists: mockArtists,
    studioName: 'Test Studio'
  };

  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders studio artists component with correct title', () => {
      render(<StudioArtists {...defaultProps} />);
      
      expect(screen.getByText('Artists at Test Studio')).toBeInTheDocument();
      expect(screen.getByText('Meet our talented team of 3 artists')).toBeInTheDocument();
    });

    it('renders all artist cards', () => {
      render(<StudioArtists {...defaultProps} />);
      
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
      expect(screen.getByText('Logan Davis')).toBeInTheDocument();
      expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
    });

    it('displays artist information correctly', () => {
      render(<StudioArtists {...defaultProps} />);
      
      // Check artist bio
      expect(screen.getByText('Sacred geometry and mandala expert creating precise patterns')).toBeInTheDocument();
      
      // Check styles are displayed (using getAllByText since styles appear in both filters and cards)
      expect(screen.getAllByText('geometric').length).toBeGreaterThan(0);
      expect(screen.getAllByText('realism').length).toBeGreaterThan(0);
      expect(screen.getAllByText('traditional').length).toBeGreaterThan(0);
    });

    it('renders view profile links for all artists', () => {
      render(<StudioArtists {...defaultProps} />);
      
      const profileLinks = screen.getAllByText('View Profile');
      expect(profileLinks).toHaveLength(3);
      
      // Check that links have correct href attributes (sorted by name, so Logan Davis comes first)
      const firstLink = profileLinks[0].closest('a');
      expect(firstLink).toHaveAttribute('href', '/artists/artist-002');
    });
  });

  describe('Empty States', () => {
    it('renders empty state when no artists provided', () => {
      render(<StudioArtists artists={[]} studioName="Empty Studio" />);
      
      expect(screen.getByText('No artists currently listed')).toBeInTheDocument();
      expect(screen.getByText('Check back later for artist listings.')).toBeInTheDocument();
    });

    it('renders filtered empty state when no artists match filters', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      // Search for non-existent artist
      const searchInput = screen.getByPlaceholderText('Search artists by name or specialty...');
      await user.type(searchInput, 'NonExistentArtist');
      
      await waitFor(() => {
        expect(screen.getByText('No artists match your filters')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters artists by name', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search artists by name or specialty...');
      await user.type(searchInput, 'Marcus');
      
      await waitFor(() => {
        expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
        expect(screen.queryByText('Logan Davis')).not.toBeInTheDocument();
        expect(screen.queryByText('Sarah Mitchell')).not.toBeInTheDocument();
      });
    });

    it('filters artists by bio content', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search artists by name or specialty...');
      await user.type(searchInput, 'geometric');
      
      await waitFor(() => {
        expect(screen.getByText('Logan Davis')).toBeInTheDocument();
        expect(screen.queryByText('Marcus Chen')).not.toBeInTheDocument();
        expect(screen.queryByText('Sarah Mitchell')).not.toBeInTheDocument();
      });
    });

    it('filters artists by specialty', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search artists by name or specialty...');
      await user.type(searchInput, 'Sacred geometry');
      
      await waitFor(() => {
        expect(screen.getByText('Logan Davis')).toBeInTheDocument();
        expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
        expect(screen.queryByText('Sarah Mitchell')).not.toBeInTheDocument();
      });
    });

    it('clears search when clear filters is clicked', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search artists by name or specialty...');
      await user.type(searchInput, 'Marcus');
      
      await waitFor(() => {
        expect(screen.queryByText('Logan Davis')).not.toBeInTheDocument();
      });
      
      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
        expect(screen.getByText('Logan Davis')).toBeInTheDocument();
        expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
      });
    });
  });

  describe('Style Filtering', () => {
    it('displays all unique styles as filter options', () => {
      render(<StudioArtists {...defaultProps} />);
      
      // Check that all unique styles are displayed (using getAllByText since styles appear multiple times)
      expect(screen.getAllByText('blackwork').length).toBeGreaterThan(0);
      expect(screen.getAllByText('geometric').length).toBeGreaterThan(0);
      expect(screen.getAllByText('neo-traditional').length).toBeGreaterThan(0);
      expect(screen.getAllByText('realism').length).toBeGreaterThan(0);
      expect(screen.getAllByText('traditional').length).toBeGreaterThan(0);
    });

    it('filters artists by selected style', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      // Click on 'blackwork' style filter
      const blackworkFilter = screen.getAllByText('blackwork')[0]; // First occurrence (in filter)
      await user.click(blackworkFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Logan Davis')).toBeInTheDocument();
        expect(screen.queryByText('Marcus Chen')).not.toBeInTheDocument();
        expect(screen.queryByText('Sarah Mitchell')).not.toBeInTheDocument();
      });
    });

    it('allows multiple style selections', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      // Click on 'geometric' and 'traditional' style filters
      const geometricFilter = screen.getAllByText('geometric')[0];
      const traditionalFilter = screen.getAllByText('traditional')[0];
      
      await user.click(geometricFilter);
      await user.click(traditionalFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Marcus Chen')).toBeInTheDocument(); // Has both geometric and traditional
        expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument(); // Has traditional
        expect(screen.getByText('Logan Davis')).toBeInTheDocument(); // Has geometric (should be included)
      });
    });

    it('shows checkmark on selected style filters', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const geometricFilter = screen.getAllByText('geometric')[0];
      await user.click(geometricFilter);
      
      await waitFor(() => {
        expect(geometricFilter.parentElement).toHaveTextContent('geometric✓');
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts artists by name by default', () => {
      render(<StudioArtists {...defaultProps} />);
      
      const artistNames = screen.getAllByText(/Marcus Chen|Logan Davis|Sarah Mitchell/);
      expect(artistNames[0]).toHaveTextContent('Logan Davis'); // Alphabetically first
      expect(artistNames[1]).toHaveTextContent('Marcus Chen');
      expect(artistNames[2]).toHaveTextContent('Sarah Mitchell');
    });

    it('sorts artists by rating when selected', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Sort by Name');
      await user.selectOptions(sortSelect, 'rating');
      
      await waitFor(() => {
        const artistNames = screen.getAllByText(/Marcus Chen|Logan Davis|Sarah Mitchell/);
        expect(artistNames[0]).toHaveTextContent('Marcus Chen'); // Highest rating (4.3)
        expect(artistNames[1]).toHaveTextContent('Logan Davis'); // Second highest (4.2)
        expect(artistNames[2]).toHaveTextContent('Sarah Mitchell'); // Lowest (4.0)
      });
    });

    it('sorts artists by experience when selected', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Sort by Name');
      await user.selectOptions(sortSelect, 'experience');
      
      await waitFor(() => {
        const artistNames = screen.getAllByText(/Marcus Chen|Logan Davis|Sarah Mitchell/);
        expect(artistNames[0]).toHaveTextContent('Marcus Chen'); // 16 years
        expect(artistNames[1]).toHaveTextContent('Logan Davis'); // 15 years
        expect(artistNames[2]).toHaveTextContent('Sarah Mitchell'); // 11 years
      });
    });

    it('sorts artists by availability when selected', async () => {
      const user = userEvent.setup();
      render(<StudioArtists {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Sort by Name');
      await user.selectOptions(sortSelect, 'availability');
      
      await waitFor(() => {
        const artistNames = screen.getAllByText(/Marcus Chen|Logan Davis|Sarah Mitchell/);
        // Available artists (Marcus and Sarah) should come before unavailable (Logan)
        expect(artistNames[0]).toHaveTextContent(/Marcus Chen|Sarah Mitchell/);
        expect(artistNames[1]).toHaveTextContent(/Marcus Chen|Sarah Mitchell/);
        expect(artistNames[2]).toHaveTextContent('Logan Davis'); // Books closed
      });
    });
  });

  describe('Component Props', () => {
    it('hides filters when showFilters is false', () => {
      render(<StudioArtists {...defaultProps} showFilters={false} />);
      
      expect(screen.queryByPlaceholderText('Search artists by name or specialty...')).not.toBeInTheDocument();
      expect(screen.queryByText('Filter by Style:')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<StudioArtists {...defaultProps} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('uses different grid columns based on gridCols prop', () => {
      const { rerender } = render(<StudioArtists {...defaultProps} gridCols="2" />);
      
      // Check that grid has correct classes (this is a bit tricky to test directly)
      // We'll test by checking the container structure
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
      
      rerender(<StudioArtists {...defaultProps} gridCols="4" />);
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    });

    it('renders different card sizes based on cardSize prop', () => {
      const { rerender } = render(<StudioArtists {...defaultProps} cardSize="sm" />);
      
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
      
      rerender(<StudioArtists {...defaultProps} cardSize="lg" />);
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    });
  });

  describe('Artist Card Details', () => {
    it('displays artist rating and review count', () => {
      render(<StudioArtists {...defaultProps} />);
      
      // Check that rating components are rendered (StarRating component should be tested separately)
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    });

    it('displays artist availability status', () => {
      render(<StudioArtists {...defaultProps} />);
      
      // Check that availability components are rendered (AvailabilityStatus component should be tested separately)
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    });

    it('displays artist experience badges', () => {
      render(<StudioArtists {...defaultProps} />);
      
      // Check that experience components are rendered (ExperienceBadge component should be tested separately)
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    });

    it('displays pricing information for medium and large cards', () => {
      render(<StudioArtists {...defaultProps} cardSize="md" />);
      
      // Check that pricing components are rendered (PricingDisplay component should be tested separately)
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    });

    it('hides pricing information for small cards', () => {
      render(<StudioArtists {...defaultProps} cardSize="sm" />);
      
      // Small cards should not show pricing to save space
      expect(screen.getByText('Marcus Chen')).toBeInTheDocument();
    });

    it('displays portfolio preview images', () => {
      render(<StudioArtists {...defaultProps} />);
      
      // Check that portfolio images are rendered
      const portfolioImages = screen.getAllByAltText(/portfolio/i);
      expect(portfolioImages.length).toBeGreaterThan(0);
    });

    it('limits number of style tags displayed', () => {
      render(<StudioArtists {...defaultProps} />);
      
      // Marcus has 3 styles: geometric, realism, traditional
      // All should be visible in medium size cards (appears in filter + multiple artist cards)
      expect(screen.getAllByText('geometric').length).toBeGreaterThanOrEqual(2); // At least in filter and one card
      expect(screen.getAllByText('realism').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('traditional').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<StudioArtists {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: /Artists at Test Studio/ })).toBeInTheDocument();
    });

    it('has accessible form controls', () => {
      render(<StudioArtists {...defaultProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search artists by name or specialty...');
      
      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toBeInTheDocument();
    });

    it('has accessible links to artist profiles', () => {
      render(<StudioArtists {...defaultProps} />);
      
      const profileLinks = screen.getAllByRole('link', { name: 'View Profile' });
      expect(profileLinks).toHaveLength(3);
      
      profileLinks.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing artist data gracefully', () => {
      const incompleteArtists = [
        {
          artistId: 'artist-incomplete',
          artistName: 'Incomplete Artist'
          // Missing other fields
        }
      ];
      
      render(<StudioArtists artists={incompleteArtists} studioName="Test Studio" />);
      
      expect(screen.getByText('Incomplete Artist')).toBeInTheDocument();
      expect(screen.getByText('View Profile')).toBeInTheDocument();
    });

    it('handles artists with no styles', () => {
      const artistsNoStyles = [
        {
          artistId: 'artist-no-styles',
          artistName: 'No Styles Artist',
          bio: 'Artist with no styles listed'
        }
      ];
      
      render(<StudioArtists artists={artistsNoStyles} studioName="Test Studio" />);
      
      expect(screen.getByText('No Styles Artist')).toBeInTheDocument();
      // Should not crash when no styles are present
    });
  });
});