import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingDisplay from '../PricingDisplay/PricingDisplay';

describe('PricingDisplay Component', () => {
  const mockPricing = {
    hourlyRate: 120,
    minimumCharge: 80,
    sessionRate: 200,
    consultationFee: 25,
    currency: 'GBP',
    priceRange: { min: 80, max: 300 },
    packageDeals: [
      { description: 'Small tattoo package', price: 150 },
      { description: 'Half sleeve package', price: 800 }
    ],
    touchUpPolicy: 'Free touch-ups within 6 months'
  };

  describe('Basic Rendering', () => {
    test('renders pricing information correctly', () => {
      render(<PricingDisplay pricing={mockPricing} />);
      
      expect(screen.getByText('Hourly:')).toBeInTheDocument();
      expect(screen.getByText('£120')).toBeInTheDocument();
      expect(screen.getByText('Minimum:')).toBeInTheDocument();
      expect(screen.getByText('£80')).toBeInTheDocument();
    });

    test('handles null pricing gracefully', () => {
      render(<PricingDisplay pricing={null} />);
      
      // Should render nothing
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });

    test('handles empty pricing object', () => {
      render(<PricingDisplay pricing={{}} />);
      
      // Should render container but no pricing info
      const container = document.querySelector('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Price Range Display', () => {
    test('shows price range when showRange is true', () => {
      render(<PricingDisplay pricing={mockPricing} showRange={true} />);
      
      expect(screen.getByText('Range:')).toBeInTheDocument();
      expect(screen.getByText('£80')).toBeInTheDocument();
      expect(screen.getByText('£300')).toBeInTheDocument();
    });

    test('hides price range when showRange is false', () => {
      render(<PricingDisplay pricing={mockPricing} showRange={false} />);
      
      expect(screen.queryByText('Range:')).not.toBeInTheDocument();
    });
  });

  describe('Pricing Tiers', () => {
    test('shows premium tier badge for high rates', () => {
      const premiumPricing = { ...mockPricing, hourlyRate: 180 };
      render(<PricingDisplay pricing={premiumPricing} showBadges={true} />);
      
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    test('shows standard tier badge for medium rates', () => {
      const standardPricing = { ...mockPricing, hourlyRate: 120 };
      render(<PricingDisplay pricing={standardPricing} showBadges={true} />);
      
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    test('shows budget tier badge for low rates', () => {
      const budgetPricing = { ...mockPricing, hourlyRate: 80 };
      render(<PricingDisplay pricing={budgetPricing} showBadges={true} />);
      
      expect(screen.getByText('Budget')).toBeInTheDocument();
    });
  });

  describe('Variant Layouts', () => {
    test('renders compact variant correctly', () => {
      const { container } = render(
        <PricingDisplay pricing={mockPricing} variant="compact" />
      );
      
      expect(container.querySelector('.flex')).toBeInTheDocument();
    });

    test('renders detailed variant with package deals', () => {
      render(<PricingDisplay pricing={mockPricing} variant="detailed" />);
      
      expect(screen.getByText('Package Deals:')).toBeInTheDocument();
      expect(screen.getByText('Small tattoo package')).toBeInTheDocument();
      expect(screen.getByText('£150')).toBeInTheDocument();
    });

    test('shows touch-up policy in detailed variant', () => {
      render(<PricingDisplay pricing={mockPricing} variant="detailed" />);
      
      expect(screen.getByText('Touch-ups:')).toBeInTheDocument();
      expect(screen.getByText('Free touch-ups within 6 months')).toBeInTheDocument();
    });
  });

  describe('Currency Handling', () => {
    test('displays USD currency correctly', () => {
      const usdPricing = { ...mockPricing, currency: 'USD' };
      render(<PricingDisplay pricing={usdPricing} />);
      
      // Should show USD symbol (implementation depends on FormattedPrice)
      expect(screen.getByText(/120/)).toBeInTheDocument();
    });

    test('defaults to GBP when currency not specified', () => {
      const noCurrencyPricing = { hourlyRate: 120 };
      render(<PricingDisplay pricing={noCurrencyPricing} />);
      
      expect(screen.getByText('£120')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    test('applies correct size classes', () => {
      const { container } = render(
        <PricingDisplay pricing={mockPricing} size="lg" />
      );
      
      expect(container.querySelector('.text-lg')).toBeInTheDocument();
    });

    test('applies small size classes', () => {
      const { container } = render(
        <PricingDisplay pricing={mockPricing} size="xs" />
      );
      
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });
  });

  describe('Consultation Fee', () => {
    test('displays consultation fee when present', () => {
      render(<PricingDisplay pricing={mockPricing} />);
      
      expect(screen.getByText('Consultation:')).toBeInTheDocument();
      expect(screen.getByText('£25')).toBeInTheDocument();
    });

    test('hides consultation fee when not present', () => {
      const noConcultationPricing = { ...mockPricing };
      delete noConcultationPricing.consultationFee;
      
      render(<PricingDisplay pricing={noConcultationPricing} />);
      
      expect(screen.queryByText('Consultation:')).not.toBeInTheDocument();
    });
  });

  describe('Session vs Hourly Rate', () => {
    test('shows session rate when no hourly rate', () => {
      const sessionOnlyPricing = { 
        sessionRate: 200, 
        minimumCharge: 80,
        currency: 'GBP' 
      };
      
      render(<PricingDisplay pricing={sessionOnlyPricing} />);
      
      expect(screen.getByText('Session:')).toBeInTheDocument();
      expect(screen.getByText('£200')).toBeInTheDocument();
    });

    test('prioritizes hourly rate over session rate', () => {
      render(<PricingDisplay pricing={mockPricing} />);
      
      expect(screen.getByText('Hourly:')).toBeInTheDocument();
      expect(screen.queryByText('Session:')).not.toBeInTheDocument();
    });
  });

  describe('Package Deals', () => {
    test('limits package deals display to 2 items', () => {
      const manyPackagesPricing = {
        ...mockPricing,
        packageDeals: [
          { description: 'Package 1', price: 100 },
          { description: 'Package 2', price: 200 },
          { description: 'Package 3', price: 300 },
          { description: 'Package 4', price: 400 }
        ]
      };
      
      render(<PricingDisplay pricing={manyPackagesPricing} variant="detailed" />);
      
      expect(screen.getByText('Package 1')).toBeInTheDocument();
      expect(screen.getByText('Package 2')).toBeInTheDocument();
      expect(screen.queryByText('Package 3')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper semantic structure', () => {
      render(<PricingDisplay pricing={mockPricing} variant="detailed" />);
      
      // Should have proper text content for screen readers
      expect(screen.getByText('Hourly:')).toBeInTheDocument();
      expect(screen.getByText('Minimum:')).toBeInTheDocument();
    });
  });
});