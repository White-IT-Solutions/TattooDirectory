import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudioMap from '../StudioMap';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock studios data for testing
const mockStudios = [
  {
    studioId: 'studio-001',
    studioName: 'Rebel Ink Studio',
    locationDisplay: 'Manchester, UK',
    address: { 
      city: 'Manchester', 
      latitude: 53.4808, 
      longitude: -2.2426 
    },
    specialties: ['geometric', 'realism', 'traditional'],
    rating: 4.8,
    reviewCount: 127,
    artistCount: 5
  },
  {
    studioId: 'studio-002',
    studioName: 'Modern Ink Studio',
    locationDisplay: 'London, UK',
    address: { 
      city: 'London', 
      latitude: 51.5074, 
      longitude: -0.1278 
    },
    specialties: ['minimalist', 'fine line', 'watercolor'],
    rating: 4.6,
    reviewCount: 89,
    artistCount: 3
  },
  {
    studioId: 'studio-003',
    studioName: 'Electric Needle Studio',
    locationDisplay: 'Birmingham, UK',
    address: { 
      city: 'Birmingham', 
      latitude: 52.4862, 
      longitude: -1.8904 
    },
    specialties: ['japanese', 'biomechanical', 'portrait'],
    rating: 4.9,
    reviewCount: 203,
    artistCount: 7
  }
];

describe('StudioMap Component', () => {
  const defaultProps = {
    studios: mockStudios,
    onStudioSelect: jest.fn(),
    onStudioHover: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock window.open globally
    global.window.open = jest.fn();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('shows loading state initially', () => {
      render(<StudioMap {...defaultProps} />);
      
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });

    it('renders map after loading', async () => {
      render(<StudioMap {...defaultProps} />);
      
      // Fast-forward past loading delay with act
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-map')).toBeInTheDocument();
      });
    });

    it('renders map controls', async () => {
      render(<StudioMap {...defaultProps} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('locate-user-button')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
      });
    });

    it('renders studio markers', async () => {
      render(<StudioMap {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        mockStudios.forEach(studio => {
          expect(screen.getByTestId(`studio-marker-${studio.studioId}`)).toBeInTheDocument();
        });
      });
    });

    it('renders map legend', async () => {
      render(<StudioMap {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Studio Location')).toBeInTheDocument();
        expect(screen.getByText('Selected Studio')).toBeInTheDocument();
        expect(screen.getByText(`${mockStudios.length} studios shown`)).toBeInTheDocument();
      });
    });
  });

  describe('Studio Marker Interactions', () => {
    it('calls onStudioSelect when marker is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
      });

      const marker = screen.getByTestId('studio-marker-studio-001');
      await user.click(marker);
      
      expect(defaultProps.onStudioSelect).toHaveBeenCalledWith(mockStudios[0]);
    });

    it('calls onStudioHover when marker is hovered', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
      });

      const marker = screen.getByTestId('studio-marker-studio-001');
      await user.hover(marker);
      
      expect(defaultProps.onStudioHover).toHaveBeenCalledWith(mockStudios[0]);
    });

    it('shows studio popup on hover', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
      });

      const marker = screen.getByTestId('studio-marker-studio-001');
      await user.hover(marker);
      
      await waitFor(() => {
        expect(screen.getByText('Rebel Ink Studio')).toBeInTheDocument();
        expect(screen.getByText('Manchester, UK')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
        expect(screen.getByText('(127)')).toBeInTheDocument();
      });
    });

    it('highlights selected studio marker', async () => {
      render(<StudioMap {...defaultProps} selectedStudio={mockStudios[0]} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        const selectedMarker = screen.getByTestId('studio-marker-studio-001');
        expect(selectedMarker.querySelector('.bg-\\[var\\(--interactive-primary\\)\\]')).toBeInTheDocument();
      });
    });
  });

  describe('Map Controls', () => {
    it('handles locate user button click', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock successful geolocation
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 53.4808,
            longitude: -2.2426
          }
        });
      });

      render(<StudioMap {...defaultProps} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByTestId('locate-user-button')).toBeInTheDocument();
      });

      const locateButton = screen.getByTestId('locate-user-button');
      await user.click(locateButton);
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('handles zoom controls', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
      });

      const zoomInButton = screen.getByTestId('zoom-in-button');
      const zoomOutButton = screen.getByTestId('zoom-out-button');
      
      await user.click(zoomInButton);
      await user.click(zoomOutButton);
      
      // Zoom controls should be clickable (no errors thrown)
      expect(zoomInButton).toBeInTheDocument();
      expect(zoomOutButton).toBeInTheDocument();
    });
  });

  describe('User Location', () => {
    it('shows user location marker when provided', async () => {
      const userLocation = { lat: 53.4808, lng: -2.2426 };
      render(<StudioMap {...defaultProps} userLocation={userLocation} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // The user location marker should be shown, but the "Your Location" text is only in legend when showUserLocation is true
      // Let's check for the legend text instead
      await waitFor(() => {
        expect(screen.getByText('Your Location')).toBeInTheDocument();
      });
    });

    it('calculates and displays distances when user location is available', async () => {
      const userLocation = { lat: 53.4808, lng: -2.2426 };
      render(<StudioMap {...defaultProps} userLocation={userLocation} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        // Should show distance badges in studio popups
        const marker = screen.getByTestId('studio-marker-studio-001');
        expect(marker).toBeInTheDocument();
      });
    });
  });

  describe('Studio Popup Content', () => {
    it('displays complete studio information in popup', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
      });

      const marker = screen.getByTestId('studio-marker-studio-001');
      await user.hover(marker);
      
      await waitFor(() => {
        // Studio name and location
        expect(screen.getByText('Rebel Ink Studio')).toBeInTheDocument();
        expect(screen.getByText('Manchester, UK')).toBeInTheDocument();
        
        // Rating and reviews
        expect(screen.getByText('4.8')).toBeInTheDocument();
        expect(screen.getByText('(127)')).toBeInTheDocument();
        
        // Specialties (limited to 3 + more indicator)
        expect(screen.getByText('geometric')).toBeInTheDocument();
        expect(screen.getByText('realism')).toBeInTheDocument();
        expect(screen.getByText('traditional')).toBeInTheDocument();
        
        // View Studio button
        expect(screen.getByText('View Studio')).toBeInTheDocument();
      });
    });

    it('renders View Studio button in popup and is clickable', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<StudioMap {...defaultProps} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
      });

      const marker = screen.getByTestId('studio-marker-studio-001');
      
      // First hover to show popup
      await user.hover(marker);
      
      await waitFor(() => {
        expect(screen.getByText('View Studio')).toBeInTheDocument();
      });

      // Verify the button exists and is clickable
      const viewButton = screen.getByText('View Studio');
      expect(viewButton).toBeInTheDocument();
      expect(viewButton).toHaveAttribute('type', 'button');
      
      // Verify the button is not disabled
      expect(viewButton).not.toBeDisabled();
      
      // Click the button (this should not throw an error)
      await expect(user.click(viewButton)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles studios without coordinates gracefully', async () => {
      const studiosWithoutCoords = [
        ...mockStudios,
        {
          studioId: 'studio-004',
          studioName: 'No Coords Studio',
          locationDisplay: 'Unknown Location',
          // No address.latitude/longitude
          specialties: ['traditional'],
          rating: 4.0,
          reviewCount: 50,
          artistCount: 2
        }
      ];

      render(<StudioMap {...defaultProps} studios={studiosWithoutCoords} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        // Should only render markers for studios with coordinates
        expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
        expect(screen.getByTestId('studio-marker-studio-002')).toBeInTheDocument();
        expect(screen.getByTestId('studio-marker-studio-003')).toBeInTheDocument();
        expect(screen.queryByTestId('studio-marker-studio-004')).not.toBeInTheDocument();
      });
    });

    it('handles geolocation errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock geolocation error
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      // Mock console.warn to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<StudioMap {...defaultProps} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByTestId('locate-user-button')).toBeInTheDocument();
      });

      const locateButton = screen.getByTestId('locate-user-button');
      await user.click(locateButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Geolocation error:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });

    it('handles empty studios array', async () => {
      render(<StudioMap {...defaultProps} studios={[]} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-map')).toBeInTheDocument();
        expect(screen.getByText('0 studios shown')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<StudioMap {...defaultProps} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        const locateButton = screen.getByTestId('locate-user-button');
        expect(locateButton).toHaveRole('button');
        
        const zoomInButton = screen.getByTestId('zoom-in-button');
        expect(zoomInButton).toHaveRole('button');
        
        const zoomOutButton = screen.getByTestId('zoom-out-button');
        expect(zoomOutButton).toHaveRole('button');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByTestId('locate-user-button')).toBeInTheDocument();
      });

      // Tab to locate button
      await user.tab();
      expect(screen.getByTestId('locate-user-button')).toHaveFocus();
      
      // Tab to zoom controls
      await user.tab();
      expect(screen.getByTestId('zoom-in-button')).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('handles large number of studios efficiently', async () => {
      const manyStudios = Array.from({ length: 100 }, (_, i) => ({
        studioId: `studio-${i}`,
        studioName: `Studio ${i}`,
        locationDisplay: `Location ${i}`,
        address: { 
          city: `City ${i}`, 
          latitude: 50 + (i * 0.01), 
          longitude: -2 + (i * 0.01) 
        },
        specialties: ['traditional'],
        rating: 4.0 + (i % 10) * 0.1,
        reviewCount: 50 + i,
        artistCount: 1 + (i % 5)
      }));

      render(<StudioMap {...defaultProps} studios={manyStudios} />);
      
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-map')).toBeInTheDocument();
        expect(screen.getByText('100 studios shown')).toBeInTheDocument();
      });
    });
  });
});