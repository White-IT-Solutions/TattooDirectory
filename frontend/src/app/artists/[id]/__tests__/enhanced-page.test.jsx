/**
 * Enhanced Artist Detail Page Tests
 * Tests the integration of design system components in the artist detail page
 */

import { render, screen } from '@testing-library/react';
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

// Mock components to avoid complex dependencies
jest.mock('../../../components/Lightbox', () => {
  return function MockLightbox({ images }) {
    return (
      <div data-testid="lightbox">
        Portfolio Gallery ({images?.length || 0} images)
      </div>
    );
  };
});

jest.mock('../../../components/AvatarImage', () => {
  return function MockAvatarImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} data-testid="avatar-image" />;
  };
});

// Mock design system components
jest.mock('../../../../design-system/components/ui', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }) => <p data-testid="card-description">{children}</p>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  Button: ({ children, variant, ...props }) => (
    <button data-testid="button" data-variant={variant} {...props}>{children}</button>
  ),
  Badge: ({ children, variant, icon }) => (
    <span data-testid="badge" data-variant={variant}>{icon}{children}</span>
  ),
  Tag: ({ children, variant }) => (
    <span data-testid="tag" data-variant={variant}>{children}</span>
  ),
  StarRating: ({ rating, reviewCount }) => (
    <div data-testid="star-rating">★ {rating} ({reviewCount} reviews)</div>
  ),
  PricingDisplay: ({ pricing }) => (
    <div data-testid="pricing-display">
      {pricing?.hourlyRate && `£${pricing.hourlyRate}/hr`}
    </div>
  ),
  AvailabilityStatus: ({ availability }) => (
    <div data-testid="availability-status">
      {availability?.bookingOpen ? 'Available' : 'Unavailable'}
    </div>
  ),
  ExperienceBadge: ({ experience }) => (
    <div data-testid="experience-badge">
      {experience?.yearsActive} years
    </div>
  ),
  ContactOptions: ({ contactInfo }) => (
    <div data-testid="contact-options">
      {contactInfo?.instagram && 'Instagram'}
    </div>
  ),
  StudioCard: ({ studio }) => (
    <div data-testid="studio-card">
      {studio?.studioName}
    </div>
  )
}));

describe('Enhanced Artist Detail Page - Design System Integration', () => {
  // Mock environment for using mock data
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('renders with enhanced design system components', async () => {
    // Import the component after mocks are set up
    const ArtistPage = (await import('../page')).default;
    const mockParams = { id: 'artist-001' };
    
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check if design system components are used
    expect(screen.getAllByTestId('card')).toHaveLength(7); // Multiple cards for different sections
    expect(screen.getAllByTestId('card-title')).toHaveLength(5); // Multiple card titles
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getAllByTestId('tag')).toHaveLength(7); // 3 styles + 4 specialties
  });

  it('displays enhanced business information components', async () => {
    const ArtistPage = (await import('../page')).default;
    const mockParams = { id: 'artist-001' };
    
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check business info components
    expect(screen.getByTestId('pricing-display')).toBeInTheDocument();
    expect(screen.getByTestId('availability-status')).toBeInTheDocument();
    expect(screen.getByTestId('experience-badge')).toBeInTheDocument();
    expect(screen.getByTestId('contact-options')).toBeInTheDocument();
  });

  it('shows enhanced portfolio section', async () => {
    const ArtistPage = (await import('../page')).default;
    const mockParams = { id: 'artist-001' };
    
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check portfolio section
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    expect(screen.getAllByText(/Portfolio/)).toHaveLength(2); // Title and gallery text
  });

  it('displays studio information with StudioCard', async () => {
    const ArtistPage = (await import('../page')).default;
    const mockParams = { id: 'artist-001' };
    
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check studio card
    expect(screen.getByTestId('studio-card')).toBeInTheDocument();
  });

  it('renders enhanced not found page', async () => {
    const ArtistPage = (await import('../page')).default;
    const mockParams = { id: 'non-existent-artist' };
    
    const ArtistPageComponent = await ArtistPage({ params: mockParams });
    render(ArtistPageComponent);

    // Check enhanced not found page
    expect(screen.getByText('Artist not found')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByText('Browse Artists')).toBeInTheDocument();
  });
});