import { render } from '@testing-library/react';
import StudioArtists from '../StudioArtists';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, ...props }) {
    return <img src={src} alt={alt} width={width} height={height} {...props} />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock artist data for visual testing
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
  }
];

describe('StudioArtists Visual Tests', () => {
  it('renders default layout correctly', () => {
    const { container } = render(
      <StudioArtists 
        artists={mockArtists} 
        studioName="Rebel Ink Studio" 
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with small card size', () => {
    const { container } = render(
      <StudioArtists 
        artists={mockArtists} 
        studioName="Rebel Ink Studio"
        cardSize="sm"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with large card size', () => {
    const { container } = render(
      <StudioArtists 
        artists={mockArtists} 
        studioName="Rebel Ink Studio"
        cardSize="lg"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders without filters', () => {
    const { container } = render(
      <StudioArtists 
        artists={mockArtists} 
        studioName="Rebel Ink Studio"
        showFilters={false}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with 2-column grid', () => {
    const { container } = render(
      <StudioArtists 
        artists={mockArtists} 
        studioName="Rebel Ink Studio"
        gridCols="2"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with 4-column grid', () => {
    const { container } = render(
      <StudioArtists 
        artists={mockArtists} 
        studioName="Rebel Ink Studio"
        gridCols="4"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders empty state', () => {
    const { container } = render(
      <StudioArtists 
        artists={[]} 
        studioName="Empty Studio" 
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders single artist', () => {
    const { container } = render(
      <StudioArtists 
        artists={[mockArtists[0]]} 
        studioName="Single Artist Studio" 
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <StudioArtists 
        artists={mockArtists} 
        studioName="Rebel Ink Studio"
        className="custom-studio-artists"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders artist with minimal data', () => {
    const minimalArtist = {
      artistId: 'artist-minimal',
      artistName: 'Minimal Artist'
    };

    const { container } = render(
      <StudioArtists 
        artists={[minimalArtist]} 
        studioName="Minimal Studio" 
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});