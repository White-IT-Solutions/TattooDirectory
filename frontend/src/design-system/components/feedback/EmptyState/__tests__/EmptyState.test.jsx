import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState, { EmptyStateIllustration } from '../EmptyState';
import Button from '../../../ui/Button/Button';

describe('EmptyState Component', () => {
  it('renders with default props', () => {
    render(<EmptyState />);
    
    // Should render the default search illustration
    expect(screen.getByRole('img', { name: /no search results/i })).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    const title = 'Custom Title';
    const description = 'Custom description text';
    
    render(
      <EmptyState 
        title={title}
        description={description}
      />
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('renders with custom actions', () => {
    const handlePrimary = jest.fn();
    const handleSecondary = jest.fn();
    
    const actions = (
      <>
        <Button onClick={handlePrimary}>Primary Action</Button>
        <Button variant="outline" onClick={handleSecondary}>Secondary Action</Button>
      </>
    );
    
    render(
      <EmptyState 
        title="Test Title"
        actions={actions}
      />
    );
    
    const primaryButton = screen.getByText('Primary Action');
    const secondaryButton = screen.getByText('Secondary Action');
    
    expect(primaryButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();
    
    fireEvent.click(primaryButton);
    fireEvent.click(secondaryButton);
    
    expect(handlePrimary).toHaveBeenCalledTimes(1);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders different illustration variants', () => {
    const { rerender } = render(<EmptyState variant="search" />);
    expect(screen.getByRole('img', { name: /no search results/i })).toBeInTheDocument();
    
    rerender(<EmptyState variant="onboarding" />);
    expect(screen.getByRole('img', { name: /welcome onboarding/i })).toBeInTheDocument();
    
    rerender(<EmptyState variant="favorites" />);
    expect(screen.getByRole('img', { name: /no favorites/i })).toBeInTheDocument();
    
    rerender(<EmptyState variant="portfolio" />);
    expect(screen.getByRole('img', { name: /empty portfolio/i })).toBeInTheDocument();
    
    rerender(<EmptyState variant="loading" />);
    expect(screen.getByRole('img', { name: /loading content/i })).toBeInTheDocument();
  });

  it('applies different size classes', () => {
    const { rerender } = render(<EmptyState size="sm" data-testid="empty-state" />);
    expect(screen.getByTestId('empty-state')).toHaveClass('max-w-sm');
    
    rerender(<EmptyState size="md" data-testid="empty-state" />);
    expect(screen.getByTestId('empty-state')).toHaveClass('max-w-md');
    
    rerender(<EmptyState size="lg" data-testid="empty-state" />);
    expect(screen.getByTestId('empty-state')).toHaveClass('max-w-lg');
    
    rerender(<EmptyState size="xl" data-testid="empty-state" />);
    expect(screen.getByTestId('empty-state')).toHaveClass('max-w-xl');
  });

  it('accepts custom className', () => {
    render(<EmptyState className="custom-class" data-testid="empty-state" />);
    expect(screen.getByTestId('empty-state')).toHaveClass('custom-class');
  });

  it('renders custom illustration', () => {
    const CustomIllustration = () => (
      <div data-testid="custom-illustration">Custom SVG</div>
    );
    
    render(
      <EmptyState 
        illustration={<CustomIllustration />}
      />
    );
    
    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<EmptyState ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('EmptyStateIllustration Component', () => {
  it('renders search illustration by default', () => {
    render(<EmptyStateIllustration />);
    expect(screen.getByRole('img', { name: /no search results/i })).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const variants = ['search', 'onboarding', 'favorites', 'portfolio', 'loading'];
    
    variants.forEach(variant => {
      const { unmount } = render(<EmptyStateIllustration variant={variant} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
      unmount();
    });
  });

  it('applies custom className', () => {
    render(<EmptyStateIllustration className="custom-svg-class" />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveClass('custom-svg-class');
  });

  it('falls back to search variant for invalid variant', () => {
    render(<EmptyStateIllustration variant="invalid-variant" />);
    expect(screen.getByRole('img', { name: /no search results/i })).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<EmptyStateIllustration variant="search" />);
    const svg = screen.getByRole('img');
    
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label');
  });

  it('contains animated elements for loading variant', () => {
    render(<EmptyStateIllustration variant="loading" />);
    const svg = screen.getByRole('img');
    
    // Check for animate elements (SVG animations)
    const animateElements = svg.querySelectorAll('animate, animateTransform');
    expect(animateElements.length).toBeGreaterThan(0);
  });

  it('contains proper SVG structure', () => {
    render(<EmptyStateIllustration variant="search" />);
    const svg = screen.getByRole('img');
    
    expect(svg.tagName).toBe('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
    expect(svg).toHaveAttribute('fill', 'none');
  });
});

describe('EmptyState Accessibility', () => {
  it('has proper heading hierarchy', () => {
    render(
      <EmptyState 
        title="Main Title"
        description="Description text"
      />
    );
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Main Title');
  });

  it('has proper text contrast with design tokens', () => {
    render(
      <EmptyState 
        title="Test Title"
        description="Test description"
      />
    );
    
    const title = screen.getByText('Test Title');
    const description = screen.getByText('Test description');
    
    // Check that design token CSS variables are used
    expect(title).toHaveStyle('color: var(--text-primary)');
    expect(description).toHaveStyle('color: var(--text-secondary)');
  });

  it('maintains focus management with actions', () => {
    const handleAction = jest.fn();
    
    render(
      <EmptyState 
        title="Test"
        actions={<Button onClick={handleAction}>Action</Button>}
      />
    );
    
    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});

describe('EmptyState Responsive Behavior', () => {
  it('has responsive action layout classes', () => {
    render(
      <EmptyState 
        actions={<Button>Test Action</Button>}
        data-testid="empty-state"
      />
    );
    
    const actionsContainer = screen.getByTestId('empty-state').querySelector('.flex');
    expect(actionsContainer).toHaveClass('flex-col', 'sm:flex-row');
  });

  it('has proper spacing classes', () => {
    render(<EmptyState data-testid="empty-state" />);
    const container = screen.getByTestId('empty-state');
    
    expect(container).toHaveClass('space-y-6');
    expect(container).toHaveClass('p-8');
  });
});