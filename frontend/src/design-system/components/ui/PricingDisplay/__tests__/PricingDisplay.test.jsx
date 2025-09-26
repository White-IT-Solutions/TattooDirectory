import { render, screen } from '@testing-library/react';
import PricingDisplay from '../PricingDisplay';

describe('PricingDisplay', () => {
  it('renders hourly rate correctly', () => {
    const pricing = { hourlyRate: 150, currency: 'GBP' };
    render(<PricingDisplay pricing={pricing} />);
    
    expect(screen.getByText('Hourly:')).toBeInTheDocument();
    expect(screen.getByText('£150')).toBeInTheDocument();
  });

  it('renders minimum charge correctly', () => {
    const pricing = { minimumCharge: 80, currency: 'GBP' };
    render(<PricingDisplay pricing={pricing} />);
    
    expect(screen.getByText('Minimum:')).toBeInTheDocument();
    expect(screen.getByText('£80')).toBeInTheDocument();
  });

  it('renders both hourly and minimum when provided', () => {
    const pricing = { hourlyRate: 150, minimumCharge: 80, currency: 'GBP' };
    render(<PricingDisplay pricing={pricing} />);
    
    expect(screen.getByText('Hourly:')).toBeInTheDocument();
    expect(screen.getByText('£150')).toBeInTheDocument();
    expect(screen.getByText('Minimum:')).toBeInTheDocument();
    expect(screen.getByText('£80')).toBeInTheDocument();
  });

  it('handles USD currency', () => {
    const pricing = { hourlyRate: 200, currency: 'USD' };
    render(<PricingDisplay pricing={pricing} />);
    
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('handles EUR currency', () => {
    const pricing = { hourlyRate: 180, currency: 'EUR' };
    render(<PricingDisplay pricing={pricing} />);
    
    expect(screen.getByText('€180')).toBeInTheDocument();
  });

  it('returns null when no pricing provided', () => {
    const { container } = render(<PricingDisplay pricing={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles missing currency (defaults to GBP)', () => {
    const pricing = { hourlyRate: 150 };
    render(<PricingDisplay pricing={pricing} />);
    
    expect(screen.getByText('£150')).toBeInTheDocument();
  });
});