/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock Next.js components
jest.mock('next/link', () => {
  const MockLink = ({ children, href }) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />;
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// Mock the design system components
jest.mock('../../design-system/components/ui', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }) => <p data-testid="card-description">{children}</p>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  Button: ({ children, variant, size, ...props }) => (
    <button data-testid="button" data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
  SearchInput: ({ placeholder, ...props }) => (
    <input data-testid="search-input" placeholder={placeholder} {...props} />
  )
}));

// Mock ArtistCard component
jest.mock('../components/ArtistCard', () => {
  return function MockArtistCard({ artist }) {
    return (
      <div data-testid="artist-card">
        <h3>{artist.artistName}</h3>
        <p>{artist.bio}</p>
      </div>
    );
  };
});

// Mock ArtistCardSkeleton
jest.mock('../../design-system/components/ui/Skeleton/ArtistCardSkeleton', () => ({
  ArtistCardSkeleton: () => <div data-testid="artist-card-skeleton">Loading...</div>
}));

describe('Enhanced Homepage', () => {
  it('renders the main heading with brand typography', () => {
    render(<Home />);
    
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('Tattoo Directory');
    expect(mainHeading).toHaveClass('font-family-brand');
  });

  it('renders the hero section with proper structure', () => {
    render(<Home />);
    
    // Check for subheading
    const subheading = screen.getByRole('heading', { level: 2, name: /discover exceptional tattoo artists/i });
    expect(subheading).toBeInTheDocument();
    expect(subheading).toHaveClass('font-family-heading');

    // Check for description
    const description = screen.getByText(/connect with talented artists/i);
    expect(description).toBeInTheDocument();
  });

  it('renders search functionality with enhanced components', () => {
    render(<Home />);
    
    // Check for search input
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search artists, styles, or locations...');

    // Check for CTA buttons
    const browseButton = screen.getByRole('button', { name: /browse all artists/i });
    const studiosButton = screen.getByRole('button', { name: /find studios/i });
    
    expect(browseButton).toBeInTheDocument();
    expect(studiosButton).toBeInTheDocument();
  });

  it('renders statistics cards with proper data', () => {
    render(<Home />);
    
    // Check for stats cards - use more specific text to avoid conflicts
    const verifiedArtistsCard = screen.getByText('Verified Artists');
    const tattooStylesCard = screen.getByText('Tattoo Styles');
    const ukCitiesCard = screen.getByText('UK Cities');
    
    expect(verifiedArtistsCard).toBeInTheDocument();
    expect(tattooStylesCard).toBeInTheDocument();
    expect(ukCitiesCard).toBeInTheDocument();
  });

  it('renders featured artists section', () => {
    render(<Home />);
    
    const featuredHeading = screen.getByRole('heading', { name: /featured artists/i });
    expect(featuredHeading).toBeInTheDocument();
    
    const featuredDescription = screen.getByText(/discover some of our highest-rated artists/i);
    expect(featuredDescription).toBeInTheDocument();
    
    // Check for artist cards (should render featured artists)
    const artistCards = screen.getAllByTestId('artist-card');
    expect(artistCards.length).toBeGreaterThan(0);
    expect(artistCards.length).toBeLessThanOrEqual(6); // Max 6 featured artists
  });

  it('renders popular styles section with correct data', () => {
    render(<Home />);
    
    const stylesHeading = screen.getByRole('heading', { name: /popular tattoo styles/i });
    expect(stylesHeading).toBeInTheDocument();
    
    // Check for style cards
    const traditionalStyle = screen.getByText('Traditional');
    const realismStyle = screen.getByText('Realism');
    const geometricStyle = screen.getByText('Geometric');
    const watercolourStyle = screen.getByText('Watercolour');
    
    expect(traditionalStyle).toBeInTheDocument();
    expect(realismStyle).toBeInTheDocument();
    expect(geometricStyle).toBeInTheDocument();
    expect(watercolourStyle).toBeInTheDocument();
  });

  it('renders call-to-action section with proper buttons', () => {
    render(<Home />);
    
    const ctaHeading = screen.getByRole('heading', { name: /ready to find your perfect artist/i });
    expect(ctaHeading).toBeInTheDocument();
    
    const ctaDescription = screen.getByText(/join thousands of satisfied clients/i);
    expect(ctaDescription).toBeInTheDocument();
    
    // Check for CTA buttons
    const startBrowsingButton = screen.getByRole('button', { name: /start browsing artists/i });
    const findStudiosButton = screen.getByRole('button', { name: /find local studios/i });
    
    expect(startBrowsingButton).toBeInTheDocument();
    expect(findStudiosButton).toBeInTheDocument();
  });

  it('uses design system components with proper variants', () => {
    render(<Home />);
    
    // Check that buttons use proper variants
    const primaryButtons = screen.getAllByTestId('button');
    const primaryButton = primaryButtons.find(btn => btn.getAttribute('data-variant') === 'primary');
    const accentButton = primaryButtons.find(btn => btn.getAttribute('data-variant') === 'accent');
    const outlineButton = primaryButtons.find(btn => btn.getAttribute('data-variant') === 'outline');
    
    expect(primaryButton).toBeInTheDocument();
    expect(accentButton).toBeInTheDocument();
    expect(outlineButton).toBeInTheDocument();
  });

  it('implements responsive design with proper breakpoints', () => {
    render(<Home />);
    
    // Check for responsive classes
    const heroSection = screen.getByRole('heading', { level: 1 }).closest('section');
    expect(heroSection).toHaveClass('py-16');
    expect(heroSection).toHaveClass('md:py-24');
    
    // Check for responsive grid classes - find the actual grid container
    const verifiedArtistsText = screen.getByText('Verified Artists');
    let currentElement = verifiedArtistsText.parentElement;
    
    // Traverse up to find the grid container
    while (currentElement && !currentElement.className.includes('grid')) {
      currentElement = currentElement.parentElement;
    }
    
    expect(currentElement).toHaveClass('grid');
    expect(currentElement).toHaveClass('grid-cols-1');
    expect(currentElement).toHaveClass('md:grid-cols-3');
  });

  it('uses proper design tokens for typography and spacing', () => {
    render(<Home />);
    
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveClass('text-[var(--typography-heading-1-size)]');
    expect(mainHeading).toHaveClass('font-[var(--typography-heading-1-weight)]');
    
    const subheading = screen.getByRole('heading', { level: 2, name: /discover exceptional tattoo artists/i });
    expect(subheading).toHaveClass('text-[var(--typography-heading-3-size)]');
  });
});