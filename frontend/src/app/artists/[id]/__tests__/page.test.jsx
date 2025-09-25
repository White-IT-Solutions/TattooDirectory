import { render, screen } from '@testing-library/react';
import ArtistPage from '../page';
import { mockArtistData } from '../../../data/mockArtistData';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock the API
jest.mock('../../../../lib/api', () => ({
  api: {
    getArtist: jest.fn()
  }
}));

// Mock the Lightbox component
jest.mock('../../../components/Lightbox', () => {
  return function MockLightbox({ images }) {
    return (
      <div data-testid="lightbox">
        {images?.map((img, i) => (
          <div key={i} data-testid="portfolio-image">
            {typeof img === 'string' ? img : img?.url}
          </div>
        ))}
      </div>
    );
  };
});

// Mock the AvatarImage component
jest.mock('../../../components/AvatarImage', () => {
  return function MockAvatarImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} data-testid="avatar-image" />;
  };
});

describe('Enhanced Artist Detail Page', () => {
  const mockParams = { id: 'artist-001' };
  const mockArtist = mockArtistData[0];

  beforeEach(() => {
    // Set up environment to use mock data
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('renders enhanced artist profile with design system components', async () => {
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check if artist name is displayed
    expect(screen.getByTestId('artist-name')).toBeInTheDocument();
    expect(screen.getByTestId('artist-name')).toHaveTextContent(mockArtist.artistName);

    // Check if portfolio section is present
    expect(screen.getByTestId('portfolio-images')).toBeInTheDocument();

    // Check if contact info section is present
    expect(screen.getByTestId('contact-info')).toBeInTheDocument();
  });

  it('displays artist styles using enhanced Tag components', async () => {
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check if styles are displayed
    const stylesSection = screen.getByTestId('artist-styles');
    expect(stylesSection).toBeInTheDocument();

    // Check if individual styles are present
    mockArtist.styles.forEach(style => {
      expect(screen.getByText(style)).toBeInTheDocument();
    });
  });

  it('shows portfolio gallery when images are available', async () => {
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check if lightbox component is rendered
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();

    // Check if portfolio images are present
    const portfolioImages = screen.getAllByTestId('portfolio-image');
    expect(portfolioImages.length).toBeGreaterThan(0);
  });

  it('displays enhanced not found page when artist does not exist', async () => {
    const ArtistPageComponent = await ArtistPage({ params: { id: 'non-existent' } });
    render(ArtistPageComponent);

    // Check if not found message is displayed
    expect(screen.getByText('Artist not found')).toBeInTheDocument();
    expect(screen.getByText('Browse Artists')).toBeInTheDocument();
  });

  it('renders responsive layout with sidebar and main content', async () => {
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check if the main layout structure is present
    expect(screen.getByTestId('artist-profile')).toBeInTheDocument();
    expect(screen.getByTestId('portfolio-images')).toBeInTheDocument();
  });
});