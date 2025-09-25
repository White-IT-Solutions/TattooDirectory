import { render, screen } from '@testing-library/react';
import ArtistCard from '../ArtistCard';

// Mock the design system components
jest.mock('../../../design-system/components/ui', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  Badge: ({ children, ...props }) => <span data-testid="badge" {...props}>{children}</span>,
  Tag: ({ children, ...props }) => <span data-testid="tag" {...props}>{children}</span>,
  Button: ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>,
  StarRating: ({ rating, reviewCount }) => (
    <div data-testid="star-rating">
      {rating} stars ({reviewCount} reviews)
    </div>
  ),
  PricingDisplay: ({ pricing }) => (
    <div data-testid="pricing-display">
      {pricing?.hourlyRate && `£${pricing.hourlyRate}/hr`}
      {pricing?.minimumCharge && ` Min: £${pricing.minimumCharge}`}
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
  ContactOptions: ({ contactInfo, instagramHandle }) => (
    <div data-testid="contact-options">
      {instagramHandle && <span>Instagram: {instagramHandle}</span>}
      {contactInfo?.email && <span>Email: {contactInfo.email}</span>}
    </div>
  )
}));

describe('Enhanced ArtistCard', () => {
  const mockArtist = {
    artistId: 'artist-123',
    artistName: 'John Doe',
    bio: 'Specializing in traditional and neo-traditional tattoos',
    avatar: '/test-avatar.jpg',
    styles: ['Traditional', 'Neo-Traditional', 'Blackwork'],
    locationDisplay: 'London, UK',
    rating: 4.5,
    reviewCount: 127,
    pricing: {
      hourlyRate: 150,
      minimumCharge: 80,
      currency: 'GBP'
    },
    availability: {
      bookingOpen: true,
      nextAvailable: '2024-03-15',
      waitingList: false
    },
    experience: {
      yearsActive: 8,
      apprenticeshipCompleted: true,
      certifications: ['First Aid', 'Bloodborne Pathogens']
    },
    contactInfo: {
      instagram: '@johndoe_tattoo',
      email: 'john@example.com',
      website: 'https://johndoe.com'
    },
    portfolioImages: [
      { url: '/portfolio1.jpg' },
      { url: '/portfolio2.jpg' },
      { url: '/portfolio3.jpg' }
    ]
  };

  it('renders artist basic information', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Specializing in traditional and neo-traditional tattoos')).toBeInTheDocument();
    expect(screen.getByText('London, UK')).toBeInTheDocument();
  });

  it('displays rating and review count', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByTestId('star-rating')).toHaveTextContent('4.5 stars (127 reviews)');
  });

  it('shows pricing information', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByTestId('pricing-display')).toHaveTextContent('£150/hr Min: £80');
  });

  it('displays availability status', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByTestId('availability-status')).toHaveTextContent('Available');
  });

  it('shows experience information', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByTestId('experience-badge')).toHaveTextContent('8 years');
  });

  it('displays contact options', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const contactOptions = screen.getByTestId('contact-options');
    expect(contactOptions).toHaveTextContent('Instagram: @johndoe_tattoo');
    expect(contactOptions).toHaveTextContent('Email: john@example.com');
  });

  it('renders style tags', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    expect(screen.getByText('Traditional')).toBeInTheDocument();
    expect(screen.getByText('Neo-Traditional')).toBeInTheDocument();
    expect(screen.getByText('Blackwork')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalArtist = {
      artistId: 'artist-456',
      artistName: 'Jane Smith'
    };
    
    render(<ArtistCard artist={minimalArtist} />);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Tattoo artist')).toBeInTheDocument(); // Default bio
  });

  it('creates correct profile link', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const profileLink = screen.getByRole('link');
    expect(profileLink).toHaveAttribute('href', '/artists/artist-123');
  });

  it('handles legacy artist name field', () => {
    const legacyArtist = {
      artistsName: 'Legacy Artist Name',
      artistId: 'legacy-123'
    };
    
    render(<ArtistCard artist={legacyArtist} />);
    
    expect(screen.getByText('Legacy Artist Name')).toBeInTheDocument();
  });

  it('displays portfolio images', () => {
    render(<ArtistCard artist={mockArtist} />);
    
    const portfolioSection = screen.getByTestId('portfolio-images');
    const images = portfolioSection.querySelectorAll('img');
    expect(images).toHaveLength(3);
  });

  it('limits styles to 3 maximum', () => {
    const artistWithManyStyles = {
      ...mockArtist,
      styles: ['Traditional', 'Neo-Traditional', 'Blackwork', 'Realism', 'Watercolor']
    };
    
    render(<ArtistCard artist={artistWithManyStyles} />);
    
    expect(screen.getByText('Traditional')).toBeInTheDocument();
    expect(screen.getByText('Neo-Traditional')).toBeInTheDocument();
    expect(screen.getByText('Blackwork')).toBeInTheDocument();
    expect(screen.queryByText('Realism')).not.toBeInTheDocument();
    expect(screen.queryByText('Watercolor')).not.toBeInTheDocument();
  });
});