import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import StudioProfilePage from '../[studioId]/page';
import { mockStudios } from '../../data/mockStudioData';
import { mockArtistData } from '../../data/mockArtistData';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('StudioProfilePage', () => {
  const mockStudio = mockStudios[0]; // Rebel Ink Studio
  // const mockStudioArtists = mockArtistData.filter(
  //   artist => artist.tattooStudio?.studioId === mockStudio.studioId
  // );

  beforeEach(() => {
    useParams.mockReturnValue({ studioId: mockStudio.studioId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Studio Found', () => {
    test('renders studio header with basic information', async () => {
      render(<StudioProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('studio-name')).toHaveTextContent(mockStudio.studioName);
        expect(screen.getByTestId('studio-location')).toHaveTextContent(mockStudio.locationDisplay);
      });
    });

    test('shows studio statistics badges', async () => {
      render(<StudioProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('artist-count')).toHaveTextContent(`${mockStudio.artists.length} Artists`);
        expect(screen.getByTestId('established-year')).toHaveTextContent(`Est. ${mockStudio.established}`);
        expect(screen.getByTestId('specialties-count')).toHaveTextContent(`${mockStudio.specialties.length} Specialties`);
      });
    });

    test('displays studio specialties', async () => {
      render(<StudioProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Specialties')).toBeInTheDocument();
        // Check that at least some specialties are displayed
        expect(screen.getAllByText(mockStudio.specialties[0]).length).toBeGreaterThan(0);
      });
    });

    test('shows main content sections', async () => {
      render(<StudioProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Studio Gallery')).toBeInTheDocument();
        expect(screen.getByText(`Artists at ${mockStudio.studioName}`)).toBeInTheDocument();
        expect(screen.getByText('Contact Information')).toBeInTheDocument();
        expect(screen.getByText('Opening Hours')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
      });
    });

    test('displays basic navigation elements', async () => {
      render(<StudioProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Get Directions')).toBeInTheDocument();
      });
    });
  });

  describe('Studio Not Found', () => {
    test('displays error message for non-existent studio', async () => {
      useParams.mockReturnValue({ studioId: 'non-existent-studio' });
      render(<StudioProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Studio not found')).toBeInTheDocument();
        expect(screen.getByText('Browse All Studios')).toBeInTheDocument();
      });
    });
  });

});