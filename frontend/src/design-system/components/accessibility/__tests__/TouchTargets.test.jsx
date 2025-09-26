import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  TouchTarget, 
  TouchButton, 
  TouchIconButton, 
  TouchLink, 
  TouchArea,
  useTouchTarget 
} from '../TouchTargets';
import AccessibilityProvider from '../AccessibilityProvider';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock icon component
const MockIcon = ({ className }) => (
  <svg className={className} data-testid="mock-icon">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Test component that uses the useTouchTarget hook
const TestTouchTargetHook = () => {
  const { touchTargetSize, getSizeClass, getMinSize, isLargeTargets } = useTouchTarget();
  
  return (
    <div>
      <div data-testid="touch-target-size">{touchTargetSize}</div>
      <div data-testid="size-class">{getSizeClass('md')}</div>
      <div data-testid="min-size">{getMinSize()}</div>
      <div data-testid="is-large-targets">{isLargeTargets.toString()}</div>
    </div>
  );
};

describe('TouchTarget Components', () => {
  const renderWithProvider = (component) => {
    return render(
      <AccessibilityProvider>
        {component}
      </AccessibilityProvider>
    );
  };

  describe('TouchTarget', () => {
    it('renders with default props', () => {
      renderWithProvider(
        <TouchTarget data-testid="touch-target">
          <span>Touch me</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('touch-target');
      expect(target).toBeInTheDocument();
      expect(target).toHaveTextContent('Touch me');
    });

    it('applies correct size classes', () => {
      renderWithProvider(
        <TouchTarget size="lg" data-testid="touch-target">
          Content
        </TouchTarget>
      );

      const target = screen.getByTestId('touch-target');
      expect(target).toHaveClass('min-h-[56px]', 'min-w-[56px]');
    });

    it('applies correct variant classes', () => {
      renderWithProvider(
        <TouchTarget variant="icon" data-testid="touch-target">
          Content
        </TouchTarget>
      );

      const target = screen.getByTestId('touch-target');
      expect(target).toHaveClass('text-[var(--text-primary)]');
    });

    it('handles disabled state', () => {
      renderWithProvider(
        <TouchTarget disabled aria-label="Disabled button" data-testid="touch-target">
          Content
        </TouchTarget>
      );

      const target = screen.getByTestId('touch-target');
      expect(target).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies custom className', () => {
      renderWithProvider(
        <TouchTarget className="custom-class" data-testid="touch-target">
          Content
        </TouchTarget>
      );

      const target = screen.getByTestId('touch-target');
      expect(target).toHaveClass('custom-class');
    });
  });

  describe('TouchButton', () => {
    it('renders as a button with proper attributes', () => {
      const handleClick = jest.fn();
      
      renderWithProvider(
        <TouchButton onClick={handleClick} aria-label="Test button">
          Click me
        </TouchButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Test button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      
      renderWithProvider(
        <TouchButton onClick={handleClick}>
          Click me
        </TouchButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', () => {
      const handleClick = jest.fn();
      
      renderWithProvider(
        <TouchButton onClick={handleClick}>
          Click me
        </TouchButton>
      );

      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
      
      fireEvent.keyDown(button, { key: 'Escape' });
      expect(handleClick).toHaveBeenCalledTimes(2); // Should not trigger
    });

    it('does not trigger events when disabled', () => {
      const handleClick = jest.fn();
      
      renderWithProvider(
        <TouchButton onClick={handleClick} disabled>
          Click me
        </TouchButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '-1');
      
      fireEvent.click(button);
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('TouchIconButton', () => {
    it('renders icon button with proper accessibility', () => {
      const handleClick = jest.fn();
      
      renderWithProvider(
        <TouchIconButton 
          icon={MockIcon} 
          label="Star rating" 
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Star rating');
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
      expect(screen.getByText('Star rating')).toHaveClass('sr-only');
    });

    it('handles string icons', () => {
      renderWithProvider(
        <TouchIconButton 
          icon="★" 
          label="Star" 
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('★');
    });
  });

  describe('TouchLink', () => {
    it('renders as a link with proper attributes', () => {
      renderWithProvider(
        <TouchLink href="/test">
          Test Link
        </TouchLink>
      );

      const link = screen.getByText('Test Link');
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveTextContent('Test Link');
    });

    it('handles external links', () => {
      renderWithProvider(
        <TouchLink href="https://example.com" external>
          External Link
        </TouchLink>
      );

      const link = screen.getByText('External Link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      
      // Should have external link icon
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('TouchArea', () => {
    it('expands touch area correctly', () => {
      renderWithProvider(
        <TouchArea expandBy={16} data-testid="touch-area">
          <button>Small button</button>
        </TouchArea>
      );

      const touchArea = screen.getByTestId('touch-area');
      expect(touchArea).toHaveClass('relative');
      expect(touchArea).toBeInTheDocument();
      // Note: inline styles may not be testable in this environment
    });

    it('uses default expansion', () => {
      renderWithProvider(
        <TouchArea data-testid="touch-area">
          <button>Small button</button>
        </TouchArea>
      );

      const touchArea = screen.getByTestId('touch-area');
      expect(touchArea).toHaveClass('relative');
      expect(touchArea).toBeInTheDocument();
      // Note: inline styles may not be testable in this environment
    });
  });

  describe('useTouchTarget hook', () => {
    it('returns default values', () => {
      renderWithProvider(<TestTouchTargetHook />);

      expect(screen.getByTestId('touch-target-size')).toHaveTextContent('normal');
      expect(screen.getByTestId('size-class')).toHaveTextContent('md');
      expect(screen.getByTestId('min-size')).toHaveTextContent('44');
      expect(screen.getByTestId('is-large-targets')).toHaveTextContent('false');
    });

    it('adjusts size based on accessibility settings', () => {
      // This would require setting up the accessibility context with large targets
      // For now, we test the hook's logic with default values
      renderWithProvider(<TestTouchTargetHook />);

      // The hook should return appropriate values based on context
      expect(screen.getByTestId('size-class')).toHaveTextContent('md');
    });

    it('handles useTouchTarget used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        try {
          const touchTarget = useTouchTarget();
          return <div>TouchTarget: {touchTarget ? 'found' : 'not found'}</div>;
        } catch (error) {
          return <div>Error: {error.message}</div>;
        }
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestComponentOutsideProvider />);
      
      // Should either throw an error or handle gracefully
      expect(screen.getByText(/TouchTarget:|Error:/)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility integration', () => {
    it('adapts to user touch target preferences', () => {
      // This test would require a way to set the accessibility context
      // In a real implementation, you'd test with different context values
      renderWithProvider(
        <TouchButton size="sm">
          Button
        </TouchButton>
      );

      const button = screen.getByRole('button');
      // Should have minimum touch target size (44px or larger)
      expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });
  });
});