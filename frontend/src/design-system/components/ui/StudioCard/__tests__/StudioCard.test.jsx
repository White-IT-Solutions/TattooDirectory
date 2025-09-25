import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudioCard, { StudioCardCompact } from '../StudioCard';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

const mockStudio = {
  studioId: "studio-001",
  studioName: "Rebel Ink Studio",
  locationDisplay: "Manchester, UK",
  rating: 4.8,
  reviewCount: 127,
  artistCount: 5,
  specialties: ["geometric", "realism", "traditional", "blackwork"],
  contactInfo: {
    phone: "+44 161 123 4567",
    email: "info@rebelinkstudio.co.uk",
    website: "https://rebelinkstudio.co.uk",
    instagram: "@rebelinkstudio"
  },
  openingHours: {
    monday: "10:00-18:00",
    tuesday: "10:00-18:00",
    wednesday: "10:00-18:00",
    thursday: "10:00-20:00",
    friday: "10:00-20:00",
    saturday: "09:00-17:00",
    sunday: "Closed"
  },
  avatar: "/studio-logos/rebel-ink.jpg",
  galleryImages: [
    "/studio-gallery/rebel-ink-1.jpg",
    "/studio-gallery/rebel-ink-2.jpg",
    "/studio-gallery/rebel-ink-3.jpg"
  ]
};

describe('StudioCard Component', () => {
  it('renders studio card with all information', () => {
    render(<StudioCard studio={mockStudio} />);
    
    // Check studio name
    expect(screen.getByTestId('studio-name')).toHaveTextContent('Rebel Ink Studio');
    
    // Check location
    expect(screen.getByTestId('studio-location')).toHaveTextContent('📍 Manchester, UK');
    
    // Check artist count
    expect(screen.getByTestId('artist-count')).toHaveTextContent('5 artists');
    
    // Check specialties
    const specialtiesContainer = screen.getByTestId('studio-specialties');
    expect(specialtiesContainer).toBeInTheDocument();
    expect(specialtiesContainer).toHaveTextContent('geometric');
    expect(specialtiesContainer).toHaveTextContent('realism');
  });

  it('displays rating when provided', () => {
    render(<StudioCard studio={mockStudio} />);
    
    // StarRating component should be rendered
    const ratingElement = screen.getByText('(127)');
    expect(ratingElement).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(<StudioCard studio={mockStudio} />);
    
    // Check phone link
    const phoneLink = screen.getByTestId('studio-phone');
    expect(phoneLink).toHaveAttribute('href', 'tel:+44 161 123 4567');
    
    // Check email link
    const emailLink = screen.getByTestId('studio-email');
    expect(emailLink).toHaveAttribute('href', 'mailto:info@rebelinkstudio.co.uk');
  });

  it('displays opening hours for today', () => {
    render(<StudioCard studio={mockStudio} />);
    
    const openingHours = screen.getByTestId('opening-hours');
    expect(openingHours).toBeInTheDocument();
  });

  it('displays gallery images when provided and size is large', () => {
    // Gallery only shows for large size
    render(<StudioCard studio={mockStudio} size="lg" />);
    
    const gallery = screen.getByTestId('studio-gallery');
    expect(gallery).toBeInTheDocument();
    
    // Should show up to 4 images for large size
    const images = gallery.querySelectorAll('div[class*="aspect-square"]');
    expect(images).toHaveLength(3); // mockStudio has 3 gallery images
  });

  it('does not display gallery for small and medium sizes', () => {
    // Small size - no gallery
    const { rerender } = render(<StudioCard studio={mockStudio} size="sm" />);
    expect(screen.queryByTestId('studio-gallery')).not.toBeInTheDocument();
    
    // Medium size - no gallery
    rerender(<StudioCard studio={mockStudio} size="md" />);
    expect(screen.queryByTestId('studio-gallery')).not.toBeInTheDocument();
  });

  it('creates correct links to studio profile', () => {
    render(<StudioCard studio={mockStudio} />);
    
    const viewStudioLink = screen.getByText('View Studio').closest('a');
    expect(viewStudioLink).toHaveAttribute('href', '/studios/studio-001');
  });

  it('creates correct external links', () => {
    render(<StudioCard studio={mockStudio} />);
    
    const websiteLink = screen.getByText('Website').closest('a');
    expect(websiteLink).toHaveAttribute('href', 'https://rebelinkstudio.co.uk');
    expect(websiteLink).toHaveAttribute('target', '_blank');
    
    const instagramLink = screen.getByText('Instagram').closest('a');
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/rebelinkstudio');
    expect(instagramLink).toHaveAttribute('target', '_blank');
  });

  it('handles missing data gracefully', () => {
    const minimalStudio = {
      studioId: "studio-minimal",
      studioName: "Minimal Studio"
    };
    
    render(<StudioCard studio={minimalStudio} />);
    
    expect(screen.getByTestId('studio-name')).toHaveTextContent('Minimal Studio');
    expect(screen.getByTestId('studio-location')).toHaveTextContent('Location not available');
    expect(screen.getByTestId('artist-count')).toHaveTextContent('0 artists');
  });

  it('handles image loading errors', () => {
    render(<StudioCard studio={mockStudio} />);
    
    const studioImage = screen.getByAltText('Rebel Ink Studio logo');
    
    // Simulate image error
    fireEvent.error(studioImage);
    
    expect(studioImage).toHaveAttribute('src', '/placeholder-studio.svg');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<StudioCard studio={mockStudio} size="sm" />);
    
    let card = screen.getByTestId('studio-card');
    expect(card).toHaveClass('max-w-xs');
    expect(card).toHaveClass('flex-shrink-0');
    
    rerender(<StudioCard studio={mockStudio} size="md" />);
    card = screen.getByTestId('studio-card');
    expect(card).toHaveClass('max-w-sm');
    expect(card).toHaveClass('flex-shrink-0');
    
    rerender(<StudioCard studio={mockStudio} size="lg" />);
    card = screen.getByTestId('studio-card');
    expect(card).toHaveClass('max-w-lg');
    expect(card).toHaveClass('flex-shrink-0');
  });

  it('shows size-appropriate content', () => {
    const studioWithGallery = {
      ...mockStudio,
      specialties: ["geometric", "realism", "traditional", "blackwork", "watercolor", "minimalist"],
      galleryImages: ["/img1.jpg", "/img2.jpg", "/img3.jpg", "/img4.jpg"]
    };

    // Small size - no gallery, limited specialties
    const { rerender } = render(<StudioCard studio={studioWithGallery} size="sm" />);
    expect(screen.queryByTestId('studio-gallery')).not.toBeInTheDocument();
    
    // Medium size - no gallery, more specialties
    rerender(<StudioCard studio={studioWithGallery} size="md" />);
    expect(screen.queryByTestId('studio-gallery')).not.toBeInTheDocument();
    
    // Large size - shows gallery
    rerender(<StudioCard studio={studioWithGallery} size="lg" />);
    expect(screen.getByTestId('studio-gallery')).toBeInTheDocument();
  });

  it('shows "more" indicator when there are many specialties', () => {
    const studioWithManySpecialties = {
      ...mockStudio,
      specialties: ["geometric", "realism", "traditional", "blackwork", "watercolor", "minimalist"]
    };
    
    render(<StudioCard studio={studioWithManySpecialties} />);
    
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });
});

describe('StudioCardCompact Component', () => {
  it('renders compact studio card', () => {
    render(<StudioCardCompact studio={mockStudio} />);
    
    expect(screen.getByTestId('studio-card-compact')).toBeInTheDocument();
    expect(screen.getByTestId('studio-name')).toHaveTextContent('Rebel Ink Studio');
  });

  it('displays rating without review count in compact mode', () => {
    render(<StudioCardCompact studio={mockStudio} />);
    
    // Should not show review count in compact mode
    expect(screen.queryByText('(127)')).not.toBeInTheDocument();
  });

  it('creates correct link in compact mode', () => {
    render(<StudioCardCompact studio={mockStudio} />);
    
    const viewLink = screen.getByText('View').closest('a');
    expect(viewLink).toHaveAttribute('href', '/studios/studio-001');
  });

  it('handles minimal data in compact mode', () => {
    const minimalStudio = {
      studioId: "studio-minimal",
      studioName: "Minimal Studio"
    };
    
    render(<StudioCardCompact studio={minimalStudio} />);
    
    expect(screen.getByTestId('studio-name')).toHaveTextContent('Minimal Studio');
    expect(screen.getByText('Location not available')).toBeInTheDocument();
  });
});

describe('StudioCard Accessibility', () => {
  it('has proper alt text for images', () => {
    render(<StudioCard studio={mockStudio} size="lg" />);
    
    const studioLogo = screen.getByAltText('Rebel Ink Studio logo');
    expect(studioLogo).toBeInTheDocument();
    
    // Gallery images only appear in large size
    const galleryImages = screen.getAllByAltText(/Rebel Ink Studio gallery/);
    expect(galleryImages).toHaveLength(3);
  });

  it('has proper link attributes for external links', () => {
    render(<StudioCard studio={mockStudio} />);
    
    const externalLinks = screen.getAllByRole('link', { name: /Website|Instagram/ });
    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('has proper semantic structure', () => {
    render(<StudioCard studio={mockStudio} />);
    
    // Should have proper heading structure
    const studioName = screen.getByRole('heading', { level: 3 });
    expect(studioName).toHaveTextContent('Rebel Ink Studio');
  });
});