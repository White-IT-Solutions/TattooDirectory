import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudioCard, { StudioCardCompact } from '../StudioCard';

// Mock Next.js components for visual tests
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, ...props }) {
    return (
      <div 
        data-testid="mock-image"
        style={{ width, height, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        {...props}
      >
        {alt}
      </div>
    );
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <div data-href={href} {...props}>{children}</div>;
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

const minimalStudio = {
  studioId: "studio-minimal",
  studioName: "Minimal Studio",
  locationDisplay: "London, UK"
};

const studioWithoutGallery = {
  studioId: "studio-no-gallery",
  studioName: "Simple Studio",
  locationDisplay: "Birmingham, UK",
  rating: 4.2,
  reviewCount: 45,
  artistCount: 2,
  specialties: ["traditional", "blackwork"],
  contactInfo: {
    phone: "+44 121 234 5678"
  },
  openingHours: {
    monday: "10:00-18:00",
    tuesday: "10:00-18:00",
    wednesday: "Closed",
    thursday: "10:00-18:00",
    friday: "10:00-18:00",
    saturday: "09:00-17:00",
    sunday: "Closed"
  }
};

describe('StudioCard Visual Tests', () => {
  it('renders full studio card with all features', () => {
    const { container } = render(
      <div className="max-w-md p-4 bg-gray-50">
        <StudioCard studio={mockStudio} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-full');
  });

  it('renders studio card in different sizes', () => {
    const sizes = ['sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      const { container } = render(
        <div className="p-4 bg-gray-50">
          <StudioCard studio={mockStudio} size={size} />
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot(`studio-card-size-${size}`);
    });
  });

  it('renders size-specific content variations', () => {
    const { container: smallContainer } = render(
      <StudioCard studio={mockStudio} size="sm" />
    );
    const { container: largeContainer } = render(
      <StudioCard studio={mockStudio} size="lg" />
    );
    
    // Small should not have gallery
    expect(smallContainer.querySelector('[data-testid="studio-gallery"]')).toBeNull();
    
    // Large should have gallery (if galleryImages exist)
    if (mockStudio.galleryImages && mockStudio.galleryImages.length > 0) {
      expect(largeContainer.querySelector('[data-testid="studio-gallery"]')).toBeInTheDocument();
    }
  });

  it('renders minimal studio card', () => {
    const { container } = render(
      <div className="max-w-md p-4 bg-gray-50">
        <StudioCard studio={minimalStudio} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-minimal');
  });

  it('renders studio card without gallery', () => {
    const { container } = render(
      <div className="max-w-md p-4 bg-gray-50">
        <StudioCard studio={studioWithoutGallery} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-no-gallery');
  });

  it('renders studio card with many specialties', () => {
    const studioWithManySpecialties = {
      ...mockStudio,
      specialties: ["geometric", "realism", "traditional", "blackwork", "watercolor", "minimalist", "dotwork"]
    };
    
    const { container } = render(
      <div className="max-w-md p-4 bg-gray-50">
        <StudioCard studio={studioWithManySpecialties} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-many-specialties');
  });

  it('renders compact studio card', () => {
    const { container } = render(
      <div className="max-w-lg p-4 bg-gray-50">
        <StudioCardCompact studio={mockStudio} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-compact');
  });

  it('renders compact studio card with minimal data', () => {
    const { container } = render(
      <div className="max-w-lg p-4 bg-gray-50">
        <StudioCardCompact studio={minimalStudio} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-compact-minimal');
  });

  it('renders studio card grid layout', () => {
    const { container } = render(
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50">
        <StudioCard studio={mockStudio} />
        <StudioCard studio={studioWithoutGallery} />
        <StudioCard studio={minimalStudio} />
        <StudioCard studio={{
          ...mockStudio,
          studioId: "studio-002",
          studioName: "Another Studio",
          locationDisplay: "Bristol, UK",
          rating: 4.5,
          reviewCount: 89
        }} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-grid');
  });

  it('renders compact studio cards in list layout', () => {
    const { container } = render(
      <div className="space-y-2 p-4 bg-gray-50">
        <StudioCardCompact studio={mockStudio} />
        <StudioCardCompact studio={studioWithoutGallery} />
        <StudioCardCompact studio={minimalStudio} />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-compact-list');
  });

  it('renders studio card with different contact options', () => {
    const studioVariations = [
      {
        ...mockStudio,
        studioId: "studio-phone-only",
        studioName: "Phone Only Studio",
        contactInfo: { phone: "+44 161 123 4567" }
      },
      {
        ...mockStudio,
        studioId: "studio-email-only", 
        studioName: "Email Only Studio",
        contactInfo: { email: "info@emailonly.co.uk" }
      },
      {
        ...mockStudio,
        studioId: "studio-website-only",
        studioName: "Website Only Studio", 
        contactInfo: { website: "https://websiteonly.co.uk" }
      },
      {
        ...mockStudio,
        studioId: "studio-no-contact",
        studioName: "No Contact Studio",
        contactInfo: {}
      }
    ];

    const { container } = render(
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50">
        {studioVariations.map(studio => (
          <StudioCard key={studio.studioId} studio={studio} />
        ))}
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot('studio-card-contact-variations');
  });
});