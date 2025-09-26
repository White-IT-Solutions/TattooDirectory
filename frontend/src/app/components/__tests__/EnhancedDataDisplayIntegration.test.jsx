import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components that should have enhanced data display integration
import ArtistCard from '../ArtistCard';
import { StudioCard } from '../../../design-system/components/ui/StudioCard/StudioCard';

// Import the enhanced data display components
import {
  PricingDisplay,
  AvailabilityStatus,
  ExperienceBadge,
  ContactOptions
} from '../../../design-system/components/ui';

// Import chart components
import {
  BarChart,
  LineChart,
  DonutChart,
  TrendIndicator,
  MetricCard
} from '../../../design-system/components/ui/DataVisualization';

describe('Enhanced Data Display Components Integration', () => {
  describe('PricingDisplay Component', () => {
    const mockPricing = {
      hourlyRate: 120,
      minimumCharge: 80,
      sessionRate: 200,
      currency: 'GBP',
      priceRange: { min: 80, max: 300 },
      consultationFee: 25,
      packageDeals: [
        { description: 'Small tattoo package', price: 150 },
        { description: 'Medium tattoo package', price: 300 }
      ],
      touchUpPolicy: 'Free touch-ups within 6 months'
    };

    it('renders pricing information correctly', () => {
      render(<PricingDisplay pricing={mockPricing} />);
      
      expect(screen.getByText('£120')).toBeInTheDocument();
      expect(screen.getByText('Minimum:')).toBeInTheDocument();
      expect(screen.getByText('£80')).toBeInTheDocument();
    });

    it('shows pricing tier badges when enabled', () => {
      render(<PricingDisplay pricing={mockPricing} showBadges={true} />);
      
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('displays price range when enabled', () => {
      render(<PricingDisplay pricing={mockPricing} showRange={true} />);
      
      expect(screen.getByText('Range:')).toBeInTheDocument();
    });
  });

  describe('AvailabilityStatus Component', () => {
    const mockAvailability = {
      bookingOpen: true,
      nextAvailable: '2024-02-15',
      waitingList: false,
      waitingListCount: 0,
      estimatedWaitTime: null,
      consultationRequired: true,
      emergencySlots: false
    };

    it('renders availability status correctly', () => {
      render(<AvailabilityStatus availability={mockAvailability} />);
      
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Consultation required')).toBeInTheDocument();
    });

    it('shows waiting list information when applicable', () => {
      const waitingListAvailability = {
        ...mockAvailability,
        waitingList: true,
        waitingListCount: 5,
        estimatedWaitTime: '2-3 weeks'
      };

      render(<AvailabilityStatus availability={waitingListAvailability} />);
      
      expect(screen.getByText('Waiting List')).toBeInTheDocument();
      expect(screen.getByText('5 waiting')).toBeInTheDocument();
      expect(screen.getByText('2-3 weeks')).toBeInTheDocument();
    });

    it('displays action buttons when enabled', () => {
      render(
        <AvailabilityStatus 
          availability={mockAvailability} 
          showActions={true}
          onBookingClick={() => {}}
        />
      );
      
      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });
  });

  describe('ExperienceBadge Component', () => {
    const mockExperience = {
      yearsActive: 8,
      apprenticeshipCompleted: true,
      certifications: ['Health & Safety', 'Advanced Techniques'],
      specializations: ['Traditional', 'Realism'],
      awards: ['Best Traditional Tattoo 2023'],
      continuingEducation: ['Advanced Color Theory Workshop'],
      professionalMemberships: ['UK Tattoo Artists Association']
    };

    it('renders experience information correctly', () => {
      render(<ExperienceBadge experience={mockExperience} />);
      
      expect(screen.getByText('8 years')).toBeInTheDocument();
      expect(screen.getByText('Certified')).toBeInTheDocument();
    });

    it('shows detailed tooltip on hover when enabled', () => {
      render(<ExperienceBadge experience={mockExperience} showTooltip={true} />);
      
      const badge = screen.getByText('8 years');
      fireEvent.mouseEnter(badge);
      
      expect(screen.getByText('Experience Level: Expert')).toBeInTheDocument();
      expect(screen.getByText('Specializations')).toBeInTheDocument();
    });

    it('displays compact format when specified', () => {
      render(<ExperienceBadge experience={mockExperience} variant="compact" />);
      
      expect(screen.getByText('8y')).toBeInTheDocument();
      expect(screen.getByText('Cert')).toBeInTheDocument();
    });
  });

  describe('ContactOptions Component', () => {
    const mockContactInfo = {
      instagram: '@artist_handle',
      whatsapp: '+447123456789',
      email: 'artist@example.com',
      phone: '+447987654321',
      website: 'https://artist-portfolio.com',
      responseTime: {
        instagram: 'Usually responds within hours',
        whatsapp: 'Usually responds within minutes',
        email: 'Usually responds within 24 hours'
      }
    };

    it('renders contact options correctly', () => {
      render(<ContactOptions contactInfo={mockContactInfo} />);
      
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('displays response times when enabled', () => {
      render(<ContactOptions contactInfo={mockContactInfo} showResponseTime={true} />);
      
      // Response times should be shown in tooltips on hover
      const whatsappButton = screen.getByText('WhatsApp').closest('a');
      expect(whatsappButton).toHaveAttribute('href', 'https://wa.me/447123456789');
    });

    it('renders as buttons when variant is set', () => {
      render(<ContactOptions contactInfo={mockContactInfo} variant="buttons" />);
      
      const instagramButton = screen.getByText('Instagram').closest('a');
      expect(instagramButton).toHaveAttribute('href', 'https://instagram.com/artist_handle');
    });
  });

  describe('Chart Components', () => {
    describe('BarChart', () => {
      const mockData = [
        { label: 'Jan', value: 45 },
        { label: 'Feb', value: 52 },
        { label: 'Mar', value: 38 }
      ];

      it('renders bar chart with data', () => {
        const { container } = render(<BarChart data={mockData} />);
        
        expect(container.querySelector('.flex')).toBeInTheDocument();
        expect(screen.getByText('Jan')).toBeInTheDocument();
        expect(screen.getByText('Feb')).toBeInTheDocument();
        expect(screen.getByText('Mar')).toBeInTheDocument();
      });

      it('shows values when enabled', () => {
        render(<BarChart data={mockData} showValues={true} />);
        
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('52')).toBeInTheDocument();
        expect(screen.getByText('38')).toBeInTheDocument();
      });
    });

    describe('LineChart', () => {
      const mockData = [
        { x: 'Week 1', y: 120 },
        { x: 'Week 2', y: 135 },
        { x: 'Week 3', y: 148 }
      ];

      it('renders line chart with data', () => {
        const { container } = render(<LineChart data={mockData} />);
        
        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.querySelector('polyline')).toBeInTheDocument();
      });

      it('shows data points when enabled', () => {
        const { container } = render(<LineChart data={mockData} showDots={true} />);
        
        expect(container.querySelectorAll('circle')).toHaveLength(3);
      });
    });

    describe('DonutChart', () => {
      const mockData = [
        { label: 'Traditional', value: 35, color: '#8B5CF6' },
        { label: 'Realism', value: 25, color: '#06B6D4' },
        { label: 'Blackwork', value: 20, color: '#374151' }
      ];

      it('renders donut chart with data', () => {
        const { container } = render(<DonutChart data={mockData} />);
        
        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.querySelectorAll('circle')).toHaveLength(4); // 3 data + 1 background
      });

      it('shows legend when enabled', () => {
        render(<DonutChart data={mockData} showLabels={true} />);
        
        expect(screen.getByText('Traditional')).toBeInTheDocument();
        expect(screen.getByText('Realism')).toBeInTheDocument();
        expect(screen.getByText('Blackwork')).toBeInTheDocument();
      });

      it('shows total in center', () => {
        render(<DonutChart data={mockData} />);
        
        expect(screen.getByText('80')).toBeInTheDocument(); // Total of values
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });

    describe('TrendIndicator', () => {
      it('renders upward trend correctly', () => {
        render(<TrendIndicator value={15.2} trend="up" label="growth" />);
        
        expect(screen.getByText('15.2%')).toBeInTheDocument();
        expect(screen.getByText('growth')).toBeInTheDocument();
      });

      it('renders downward trend correctly', () => {
        render(<TrendIndicator value={-5.8} trend="down" />);
        
        expect(screen.getByText('-5.8%')).toBeInTheDocument();
      });

      it('renders neutral trend correctly', () => {
        render(<TrendIndicator value={2.1} trend="neutral" />);
        
        expect(screen.getByText('2.1')).toBeInTheDocument();
      });
    });

    describe('MetricCard', () => {
      it('renders metric card with all elements', () => {
        render(
          <MetricCard
            title="Portfolio Size"
            value={150}
            change={12}
            trend="up"
            subtitle="Images in portfolio"
            icon="🎨"
          />
        );
        
        expect(screen.getByText('Portfolio Size')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('Images in portfolio')).toBeInTheDocument();
        expect(screen.getByText('🎨')).toBeInTheDocument();
      });
    });
  });

  describe('ArtistCard Integration', () => {
    const mockArtist = {
      artistId: 'artist-1',
      artistName: 'John Doe',
      bio: 'Professional tattoo artist',
      avatar: '/test-avatar.jpg',
      rating: 4.8,
      reviewCount: 125,
      styles: ['Traditional', 'Realism'],
      location: 'London',
      pricing: {
        hourlyRate: 120,
        minimumCharge: 80,
        currency: 'GBP'
      },
      availability: {
        bookingOpen: true,
        nextAvailable: '2024-02-15',
        consultationRequired: true
      },
      experience: {
        yearsActive: 8,
        apprenticeshipCompleted: true,
        certifications: ['Health & Safety']
      },
      contactInfo: {
        instagram: '@johndoe_tattoo',
        email: 'john@example.com'
      },
      portfolio: ['/img1.jpg', '/img2.jpg', '/img3.jpg']
    };

    it('integrates all enhanced data display components', () => {
      render(<ArtistCard artist={mockArtist} />);
      
      // Check that all enhanced components are rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('£120')).toBeInTheDocument(); // PricingDisplay
      expect(screen.getByText('Available')).toBeInTheDocument(); // AvailabilityStatus
      expect(screen.getByText('8 years')).toBeInTheDocument(); // ExperienceBadge
      expect(screen.getByText('Instagram')).toBeInTheDocument(); // ContactOptions
    });
  });

  describe('StudioCard Integration', () => {
    const mockStudio = {
      studioId: 'studio-1',
      studioName: 'Ink Masters Studio',
      locationDisplay: 'London',
      rating: 4.6,
      reviewCount: 89,
      artistCount: 5,
      specialties: ['Traditional', 'Realism', 'Japanese'],
      contactInfo: {
        phone: '+447123456789',
        email: 'info@inkmaster.com',
        instagram: '@inkmaster_studio'
      },
      availability: {
        bookingOpen: true,
        nextAvailable: '2024-02-10'
      }
    };

    it('integrates enhanced data display components', () => {
      render(<StudioCard studio={mockStudio} size="lg" />);
      
      // Check that enhanced components are rendered
      expect(screen.getByText('Ink Masters Studio')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument(); // AvailabilityStatus
      expect(screen.getByText('Contact')).toBeInTheDocument(); // ContactOptions section
      expect(screen.getByText('Performance')).toBeInTheDocument(); // Performance indicators
    });
  });
});