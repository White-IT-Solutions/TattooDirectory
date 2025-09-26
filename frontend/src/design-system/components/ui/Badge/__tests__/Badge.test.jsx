import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge Component', () => {
  it('renders with default props', () => {
    render(<Badge>Test Badge</Badge>);
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('renders with different variants', () => {
    const variants = ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'outline', 'ghost'];
    
    variants.forEach((variant, index) => {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      const badge = screen.getByText(variant);
      expect(badge).toBeInTheDocument();
      unmount(); // Clean up for next iteration
    });
  });

  it('renders with different sizes', () => {
    const sizes = ['sm', 'md', 'lg'];
    
    sizes.forEach((size, index) => {
      const { unmount } = render(<Badge size={size}>{size}</Badge>);
      const badge = screen.getByText(size);
      expect(badge).toBeInTheDocument();
      unmount(); // Clean up for next iteration
    });
  });

  it('renders with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">★</span>;
    render(
      <Badge icon={<TestIcon />}>
        Badge with Icon
      </Badge>
    );
    
    expect(screen.getByText('Badge with Icon')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Test</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes through additional props', () => {
    render(<Badge data-testid="badge" title="Test title">Test</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('title', 'Test title');
  });

  it('has proper semantic structure', () => {
    render(<Badge>Accessible Badge</Badge>);
    const badge = screen.getByText('Accessible Badge');
    expect(badge.tagName).toBe('SPAN');
  });

  describe('Badge variants styling', () => {
    it('applies primary variant styles correctly', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge).toHaveClass('text-white');
    });

    it('applies outline variant styles correctly', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('bg-transparent');
    });

    it('applies ghost variant styles correctly', () => {
      render(<Badge variant="ghost">Ghost</Badge>);
      const badge = screen.getByText('Ghost');
      expect(badge).toHaveClass('border-transparent');
    });
  });

  describe('Badge sizes', () => {
    it('applies small size styles correctly', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('h-5', 'px-2', 'text-xs');
    });

    it('applies medium size styles correctly', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('h-6', 'px-2.5', 'text-sm');
    });

    it('applies large size styles correctly', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('h-7', 'px-3', 'text-sm');
    });
  });
});