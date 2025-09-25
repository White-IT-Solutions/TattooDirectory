import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  FormattedPrice,
  PriceRange,
  FormattedNumber,
  FormattedDate,
  BarChart,
  LineChart,
  DonutChart,
  TrendIndicator,
  MetricCard
} from '../DataVisualization';

describe('DataVisualization Components', () => {
  describe('FormattedPrice', () => {
    test('formats GBP currency correctly', () => {
      render(<FormattedPrice amount={150} currency="GBP" />);
      expect(screen.getByText('£150')).toBeInTheDocument();
    });

    test('formats USD currency correctly', () => {
      render(<FormattedPrice amount={150} currency="USD" />);
      expect(screen.getByText(/\$150/)).toBeInTheDocument();
    });

    test('handles decimal amounts', () => {
      render(<FormattedPrice amount={150.50} currency="GBP" />);
      expect(screen.getByText('£150.50')).toBeInTheDocument();
    });

    test('applies variant styling', () => {
      const { container } = render(
        <FormattedPrice amount={150} currency="GBP" variant="primary" />
      );
      expect(container.querySelector('.text-primary-600')).toBeInTheDocument();
    });

    test('applies size styling', () => {
      const { container } = render(
        <FormattedPrice amount={150} currency="GBP" size="lg" />
      );
      expect(container.querySelector('.text-lg')).toBeInTheDocument();
    });
  });

  describe('PriceRange', () => {
    test('displays price range correctly', () => {
      render(<PriceRange min={80} max={300} currency="GBP" />);
      expect(screen.getByText('£80')).toBeInTheDocument();
      expect(screen.getByText('£300')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    test('uses custom separator', () => {
      render(<PriceRange min={80} max={300} currency="GBP" separator=" to " />);
      expect(screen.getByText('to')).toBeInTheDocument();
    });

    test('applies variant to both prices', () => {
      const { container } = render(
        <PriceRange min={80} max={300} currency="GBP" variant="accent" />
      );
      expect(container.querySelectorAll('.text-accent-600')).toHaveLength(2);
    });
  });

  describe('FormattedNumber', () => {
    test('formats regular numbers', () => {
      render(<FormattedNumber value={1234567} />);
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    test('formats percentages', () => {
      render(<FormattedNumber value={0.847} format="percentage" />);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    test('formats compact numbers', () => {
      render(<FormattedNumber value={1234567} compact={true} />);
      expect(screen.getByText('1.2M')).toBeInTheDocument();
    });

    test('handles decimal places', () => {
      render(<FormattedNumber value={123.456} decimals={2} />);
      expect(screen.getByText('123.46')).toBeInTheDocument();
    });

    test('formats currency', () => {
      render(<FormattedNumber value={150} format="currency" />);
      expect(screen.getByText('£150')).toBeInTheDocument();
    });
  });

  describe('FormattedDate', () => {
    const testDate = '2024-02-15';

    test('formats short date', () => {
      render(<FormattedDate date={testDate} format="short" />);
      expect(screen.getByText('15 Feb')).toBeInTheDocument();
    });

    test('formats long date', () => {
      render(<FormattedDate date={testDate} format="long" />);
      expect(screen.getByText(/Thursday.*15 February 2024/)).toBeInTheDocument();
    });

    test('formats relative date for today', () => {
      const today = new Date().toISOString().split('T')[0];
      render(<FormattedDate date={today} format="relative" />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    test('formats time', () => {
      render(<FormattedDate date="2024-02-15T14:30:00" format="time" />);
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });
  });

  describe('BarChart', () => {
    const sampleData = [
      { label: 'Jan', value: 45 },
      { label: 'Feb', value: 52 },
      { label: 'Mar', value: 38 }
    ];

    test('renders bar chart with data', () => {
      const { container } = render(<BarChart data={sampleData} />);
      expect(container.querySelector('.flex')).toBeInTheDocument();
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
    });

    test('shows values when enabled', () => {
      render(<BarChart data={sampleData} showValues={true} />);
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('52')).toBeInTheDocument();
    });

    test('handles empty data', () => {
      render(<BarChart data={[]} />);
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });

    test('applies custom height', () => {
      const { container } = render(<BarChart data={sampleData} height={300} />);
      const chart = container.firstChild;
      expect(chart).toHaveStyle('height: 300px');
    });
  });

  describe('LineChart', () => {
    const sampleData = [
      { x: 'Week 1', y: 120 },
      { x: 'Week 2', y: 135 },
      { x: 'Week 3', y: 128 }
    ];

    test('renders line chart with data', () => {
      const { container } = render(<LineChart data={sampleData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('polyline')).toBeInTheDocument();
    });

    test('shows data points when enabled', () => {
      const { container } = render(<LineChart data={sampleData} showDots={true} />);
      expect(container.querySelectorAll('circle')).toHaveLength(3);
    });

    test('hides data points when disabled', () => {
      const { container } = render(<LineChart data={sampleData} showDots={false} />);
      expect(container.querySelectorAll('circle')).toHaveLength(0);
    });

    test('handles empty data', () => {
      render(<LineChart data={[]} />);
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });
  });

  describe('DonutChart', () => {
    const sampleData = [
      { label: 'Traditional', value: 35, color: '#8B5CF6' },
      { label: 'Realism', value: 25, color: '#06B6D4' },
      { label: 'Neo-Traditional', value: 20, color: '#10B981' }
    ];

    test('renders donut chart with data', () => {
      const { container } = render(<DonutChart data={sampleData} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelectorAll('circle')).toHaveLength(4); // 3 data + 1 background
    });

    test('shows legend when enabled', () => {
      render(<DonutChart data={sampleData} showLabels={true} />);
      expect(screen.getByText('Traditional')).toBeInTheDocument();
      expect(screen.getByText('Realism')).toBeInTheDocument();
      expect(screen.getByText('43.8%')).toBeInTheDocument(); // 35/80 * 100
    });

    test('hides legend when disabled', () => {
      render(<DonutChart data={sampleData} showLabels={false} />);
      expect(screen.queryByText('Traditional')).not.toBeInTheDocument();
    });

    test('shows total in center', () => {
      render(<DonutChart data={sampleData} />);
      expect(screen.getByText('80')).toBeInTheDocument(); // Total of values
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    test('handles empty data', () => {
      render(<DonutChart data={[]} />);
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });
  });

  describe('TrendIndicator', () => {
    test('shows upward trend', () => {
      render(<TrendIndicator value={12.5} trend="up" />);
      expect(screen.getByText('↗')).toBeInTheDocument();
      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });

    test('shows downward trend', () => {
      render(<TrendIndicator value={-8.3} trend="down" />);
      expect(screen.getByText('↘')).toBeInTheDocument();
      expect(screen.getByText('-8.3%')).toBeInTheDocument();
    });

    test('shows neutral trend', () => {
      render(<TrendIndicator value={0} trend="neutral" />);
      expect(screen.getByText('→')).toBeInTheDocument();
      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    test('shows label when provided', () => {
      render(<TrendIndicator value={12.5} trend="up" label="Rating Trend" />);
      expect(screen.getByText('Rating Trend')).toBeInTheDocument();
    });

    test('hides icon when disabled', () => {
      render(<TrendIndicator value={12.5} trend="up" showIcon={false} />);
      expect(screen.queryByText('↗')).not.toBeInTheDocument();
    });

    test('applies correct styling for trends', () => {
      const { container } = render(<TrendIndicator value={12.5} trend="up" />);
      expect(container.querySelector('.text-success-600')).toBeInTheDocument();
      expect(container.querySelector('.bg-success-50')).toBeInTheDocument();
    });
  });

  describe('MetricCard', () => {
    test('renders metric card with basic props', () => {
      render(<MetricCard title="Total Bookings" value={142} />);
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
    });

    test('shows trend indicator when provided', () => {
      render(
        <MetricCard 
          title="Total Bookings" 
          value={142} 
          change={12.5} 
          trend="up" 
        />
      );
      expect(screen.getByText('↗')).toBeInTheDocument();
      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });

    test('shows subtitle when provided', () => {
      render(
        <MetricCard 
          title="Total Bookings" 
          value={142} 
          subtitle="This month" 
        />
      );
      expect(screen.getByText('This month')).toBeInTheDocument();
    });

    test('shows icon when provided', () => {
      render(
        <MetricCard 
          title="Total Bookings" 
          value={142} 
          icon="📅" 
        />
      );
      expect(screen.getByText('📅')).toBeInTheDocument();
    });

    test('formats large values', () => {
      render(<MetricCard title="Total Views" value={1234567} />);
      expect(screen.getByText('1.2M')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('charts provide proper titles for screen readers', () => {
      const sampleData = [{ label: 'Jan', value: 45 }];
      const { container } = render(<BarChart data={sampleData} />);
      
      const bars = container.querySelectorAll('[title]');
      expect(bars.length).toBeGreaterThan(0);
      expect(bars[0]).toHaveAttribute('title', 'Jan: 45');
    });

    test('donut chart segments have proper titles', () => {
      const sampleData = [{ label: 'Traditional', value: 35, color: '#8B5CF6' }];
      const { container } = render(<DonutChart data={sampleData} />);
      
      const segments = container.querySelectorAll('circle[title]');
      expect(segments.length).toBeGreaterThan(0);
    });

    test('trend indicators have proper semantic meaning', () => {
      const { container } = render(<TrendIndicator value={12.5} trend="up" />);
      expect(container.querySelector('.text-success-600')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('components apply responsive classes', () => {
      const { container } = render(<FormattedPrice amount={150} size="lg" />);
      expect(container.querySelector('.text-lg')).toBeInTheDocument();
    });

    test('charts maintain aspect ratios', () => {
      const sampleData = [{ label: 'Jan', value: 45 }];
      const { container } = render(<BarChart data={sampleData} height={200} />);
      expect(container.firstChild).toHaveStyle('height: 200px');
    });
  });

  describe('Error Handling', () => {
    test('handles invalid data gracefully', () => {
      render(<FormattedPrice amount={null} />);
      // Should not crash
      expect(document.querySelector('span')).toBeInTheDocument();
    });

    test('handles empty chart data', () => {
      render(<BarChart data={[]} />);
      expect(document.body.firstChild).toBeEmptyDOMElement();
    });

    test('handles invalid dates', () => {
      render(<FormattedDate date="invalid-date" />);
      // Should not crash and show something reasonable
      expect(document.querySelector('span')).toBeInTheDocument();
    });
  });
});