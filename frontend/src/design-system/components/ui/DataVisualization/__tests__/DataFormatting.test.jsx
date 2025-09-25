import { render, screen } from '@testing-library/react';
import { 
  formatters,
  FormattedPrice,
  FormattedDate,
  FormattedNumber,
  FormattedDuration,
  PriceRange
} from '../DataFormatting';

describe('Data Formatting Utilities', () => {
  describe('formatters.price', () => {
    it('formats GBP currency correctly', () => {
      expect(formatters.price(100, 'GBP')).toBe('£100.00');
      expect(formatters.price(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('handles compact formatting', () => {
      expect(formatters.price(1000, 'GBP', { compact: true })).toBe('£1.00K');
      expect(formatters.price(1500000, 'GBP', { compact: true })).toBe('£1.50M');
    });

    it('handles null/undefined values', () => {
      expect(formatters.price(null)).toBe('N/A');
      expect(formatters.price(undefined)).toBe('N/A');
    });

    it('handles no decimals option', () => {
      expect(formatters.price(100.99, 'GBP', { showDecimals: false })).toBe('£101');
    });
  });

  describe('formatters.date', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('formats dates in different formats', () => {
      expect(formatters.date(testDate, 'short')).toBe('15 Jan 2024');
      expect(formatters.date(testDate, 'time')).toBe('10:30');
    });

    it('handles invalid dates', () => {
      expect(formatters.date('invalid')).toBe('Invalid date');
      expect(formatters.date(null)).toBe('N/A');
    });
  });

  describe('formatters.number', () => {
    it('formats numbers correctly', () => {
      expect(formatters.number(1234)).toBe('1,234');
      expect(formatters.number(1234.567, { decimals: 2 })).toBe('1,234.57');
    });

    it('handles compact formatting', () => {
      expect(formatters.number(1000, { compact: true })).toBe('1K');
      expect(formatters.number(1500000, { compact: true })).toBe('2M');
    });

    it('handles percentage formatting', () => {
      expect(formatters.number(25, { percentage: true })).toBe('25%');
    });

    it('handles signed numbers', () => {
      expect(formatters.number(25, { signed: true })).toBe('+25');
      expect(formatters.number(-25, { signed: true })).toBe('-25');
    });
  });

  describe('formatters.duration', () => {
    it('formats duration correctly', () => {
      expect(formatters.duration(30)).toBe('30m');
      expect(formatters.duration(60)).toBe('1h');
      expect(formatters.duration(90)).toBe('1h 30m');
      expect(formatters.duration(120)).toBe('2h');
    });

    it('handles invalid durations', () => {
      expect(formatters.duration(0)).toBe('N/A');
      expect(formatters.duration(-30)).toBe('N/A');
      expect(formatters.duration(null)).toBe('N/A');
    });
  });
});

describe('Data Formatting Components', () => {
  describe('FormattedPrice', () => {
    it('renders price correctly', () => {
      render(<FormattedPrice amount={100} />);
      expect(screen.getByText('£100.00')).toBeInTheDocument();
    });

    it('applies variant classes', () => {
      render(<FormattedPrice amount={100} variant="success" />);
      const element = screen.getByText('£100.00');
      expect(element).toHaveClass('text-success-600');
    });

    it('applies size classes', () => {
      render(<FormattedPrice amount={100} size="lg" />);
      const element = screen.getByText('£100.00');
      expect(element).toHaveClass('text-lg');
    });
  });

  describe('FormattedDate', () => {
    it('renders date correctly', () => {
      const testDate = '2024-01-15T10:30:00Z';
      render(<FormattedDate date={testDate} format="short" />);
      expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    });

    it('includes dateTime attribute', () => {
      const testDate = '2024-01-15T10:30:00Z';
      render(<FormattedDate date={testDate} />);
      const timeElement = screen.getByText(/ago/);
      expect(timeElement).toHaveAttribute('dateTime', testDate);
    });
  });

  describe('FormattedNumber', () => {
    it('renders number correctly', () => {
      render(<FormattedNumber value={1234} />);
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('handles compact formatting', () => {
      render(<FormattedNumber value={1000} compact />);
      expect(screen.getByText('1K')).toBeInTheDocument();
    });
  });

  describe('FormattedDuration', () => {
    it('renders duration correctly', () => {
      render(<FormattedDuration minutes={90} />);
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });
  });

  describe('PriceRange', () => {
    it('renders price range correctly', () => {
      render(<PriceRange min={50} max={150} />);
      expect(screen.getByText('£50.00')).toBeInTheDocument();
      expect(screen.getByText('£150.00')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('handles single price (min only)', () => {
      render(<PriceRange min={100} />);
      expect(screen.getByText('£100.00')).toBeInTheDocument();
      expect(screen.queryByText('-')).not.toBeInTheDocument();
    });

    it('handles no prices', () => {
      render(<PriceRange />);
      expect(screen.getByText('Price on request')).toBeInTheDocument();
    });
  });
});