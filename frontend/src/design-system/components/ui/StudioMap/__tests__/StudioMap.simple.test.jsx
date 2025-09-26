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
  }
];

describe('StudioMap Component - Core Functionality', () => {
  const defaultProps = {
    studios: mockStudios,
    onStudioSelect: jest.fn(),
    onStudioHover: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('shows loading state initially', () => {
      render(<StudioMap {...defaultProps} />);
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });

    it('renders map after loading', async () => {
      render(<StudioMap {...defaultProps} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByTestId('studio-map')).toBeInTheDocument();
    });

    it('renders studio markers', async () => {
      render(<StudioMap {...defaultProps} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
      expect(screen.getByTestId('studio-marker-studio-002')).toBeInTheDocument();
    });

    it('renders map controls', async () => {
      render(<StudioMap {...defaultProps} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByTestId('locate-user-button')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-in-button')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-out-button')).toBeInTheDocument();
    });
  });

  describe('Studio Interactions', () => {
    it('calls onStudioSelect when marker is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const marker = screen.getByTestId('studio-marker-studio-001');
      await user.click(marker);
      
      expect(defaultProps.onStudioSelect).toHaveBeenCalledWith(mockStudios[0]);
    });

    it('shows studio popup on hover', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<StudioMap {...defaultProps} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const marker = screen.getByTestId('studio-marker-studio-001');
      await user.hover(marker);
      
      await waitFor(() => {
        expect(screen.getByText('Rebel Ink Studio')).toBeInTheDocument();
        expect(screen.getByText('Manchester, UK')).toBeInTheDocument();
      });
    });
  });

  describe('User Location', () => {
    it('shows user location marker when provided', async () => {
      const userLocation = { lat: 53.4808, lng: -2.2426 };
      render(<StudioMap {...defaultProps} userLocation={userLocation} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByTestId('user-location-marker')).toBeInTheDocument();
      expect(screen.getByText('Your Location')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles empty studios array', async () => {
      render(<StudioMap {...defaultProps} studios={[]} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(screen.getByTestId('studio-map')).toBeInTheDocument();
      expect(screen.getByText('0 studios shown')).toBeInTheDocument();
    });

    it('handles studios without coordinates gracefully', async () => {
      const studiosWithoutCoords = [
        ...mockStudios,
        {
          studioId: 'studio-003',
          studioName: 'No Coords Studio',
          locationDisplay: 'Unknown Location',
          specialties: ['traditional'],
          rating: 4.0,
          reviewCount: 50,
          artistCount: 2
        }
      ];

      render(<StudioMap {...defaultProps} studios={studiosWithoutCoords} />);
      
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should only render markers for studios with coordinates
      expect(screen.getByTestId('studio-marker-studio-001')).toBeInTheDocument();
      expect(screen.getByTestId('studio-marker-studio-002')).toBeInTheDocument();
      expect(screen.queryByTestId('studio-marker-studio-003')).not.toBeInTheDocument();
    });
  });
});