import { render, screen } from '@testing-library/react';
import TrendIndicator, { 
  PopularityTrend, 
  TrendBadge, 
  MetricCard 
} from '../TrendIndicator';

describe('TrendIndicator', () => {
  it('renders value correctly', () => {
    render(<TrendIndicator value={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows upward trend correctly', () => {
    render(<TrendIndicator value={120} previousValue={100} />);
    
    // Should show the current value
    expect(screen.getByText('120')).toBeInTheDocument();
    
    // Should show percentage change
    expect(screen.getByText('+20.0%')).toBeInTheDocument();
  });

  it('shows downward trend correctly', () => {
    render(<TrendIndicator value={80} previousValue={100} />);
    
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('-20.0%')).toBeInTheDocument();
  });

  it('handles no previous value', () => {
    render(<TrendIndicator value={100} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    // Should not show percentage when no previous value
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('shows label when provided', () => {
    render(<TrendIndicator value={100} label="Total Sales" />);
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
  });

  it('handles percentage format', () => {
    render(<TrendIndicator value={25.5} format="percentage" />);
    
    expect(screen.getByText('25.5%')).toBeInTheDocument();
  });

  it('handles compact format', () => {
    render(<TrendIndicator value={1500} format="compact" />);
    
    expect(screen.getByText('2K')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    render(<TrendIndicator value={100} size="lg" />);
    
    const container = screen.getByText('100').closest('div');
    expect(container).toHaveClass('text-lg');
  });

  it('does not show trend for minimal changes', () => {
    render(<TrendIndicator value={100.05} previousValue={100} />);
    
    // Should not show percentage for changes < 0.1%
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });
});

describe('PopularityTrend', () => {
  it('renders both views and bookings trends', () => {
    render(
      <PopularityTrend 
        currentViews={150} 
        previousViews={100}
        currentBookings={10}
        previousBookings={8}
      />
    );
    
    expect(screen.getByText('Profile views')).toBeInTheDocument();
    expect(screen.getByText('Inquiries')).toBeInTheDocument();
  });

  it('handles missing previous values', () => {
    render(
      <PopularityTrend 
        currentViews={150} 
        currentBookings={10}
      />
    );
    
    // Should still render the labels
    expect(screen.getByText('Profile views')).toBeInTheDocument();
    expect(screen.getByText('Inquiries')).toBeInTheDocument();
  });
});

describe('TrendBadge', () => {
  it('renders positive trend badge', () => {
    render(<TrendBadge value={120} previousValue={100} />);
    
    expect(screen.getByText('+20.0%')).toBeInTheDocument();
    
    const badge = screen.getByText('+20.0%').closest('span');
    expect(badge).toBeInTheDocument();
  });

  it('renders negative trend badge', () => {
    render(<TrendBadge value={80} previousValue={100} />);
    
    expect(screen.getByText('-20.0%')).toBeInTheDocument();
    
    const badge = screen.getByText('-20.0%').closest('span');
    expect(badge).toBeInTheDocument();
  });

  it('shows value when requested', () => {
    render(<TrendBadge value={120} previousValue={100} showValue />);
    
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('+20.0%')).toBeInTheDocument();
  });

  it('does not render for minimal changes', () => {
    const { container } = render(<TrendBadge value={100.05} previousValue={100} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render without previous value', () => {
    const { container } = render(<TrendBadge value={100} />);
    
    expect(container.firstChild).toBeNull();
  });
});

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Total Sales" value={1500} />);
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('shows trend badge when previous value provided', () => {
    render(<MetricCard title="Total Sales" value={1500} previousValue={1200} />);
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = ({ className }) => (
      <svg className={className} data-testid="test-icon">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
    
    render(<MetricCard title="Total Sales" value={1500} icon={TestIcon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('handles percentage format', () => {
    render(<MetricCard title="Conversion Rate" value={25.5} format="percentage" />);
    
    expect(screen.getByText('25.5%')).toBeInTheDocument();
  });

  it('handles compact format', () => {
    render(<MetricCard title="Total Views" value={1500000} format="compact" />);
    
    expect(screen.getByText('2M')).toBeInTheDocument();
  });
});