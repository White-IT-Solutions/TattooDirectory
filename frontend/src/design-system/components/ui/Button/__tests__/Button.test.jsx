import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

// Mock CSS custom properties for testing
const mockCSSCustomProperties = {
  '--interactive-primary': '#5c475c',
  '--interactive-primary-hover': '#523f52',
  '--interactive-primary-active': '#453645',
  '--interactive-secondary': '#d6d6d6',
  '--interactive-accent': '#ef8354',
  '--feedback-error': '#ef4444',
  '--text-primary': '#4a474d',
  '--border-primary': '#bfc0c0'
};

// Setup CSS custom properties for tests
beforeAll(() => {
  Object.entries(mockCSSCustomProperties).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
});

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('renders with custom text content', () => {
      render(<Button>Custom Button Text</Button>);
      expect(screen.getByRole('button', { name: /custom button text/i })).toBeInTheDocument();
    });

    it('renders with JSX children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toContainHTML('<span>Icon</span>');
      expect(button).toContainHTML('<span>Text</span>');
    });
  });

  describe('Variants', () => {
    it('renders primary variant correctly', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('bg-[var(--interactive-primary)]');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-[var(--text-primary)]');
      expect(button).toHaveClass('bg-[var(--interactive-secondary)]');
      expect(button).toHaveClass('border-[var(--border-primary)]');
    });

    it('renders outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-[var(--interactive-primary)]');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-[var(--interactive-primary)]');
    });

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-[var(--interactive-primary)]');
      expect(button).toHaveClass('bg-transparent');
    });

    it('renders destructive variant correctly', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('bg-[var(--feedback-error)]');
    });

    it('renders accent variant correctly', () => {
      render(<Button variant="accent">Accent</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('bg-[var(--interactive-accent)]');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('min-w-[4rem]');
    });

    it('renders medium size correctly (default)', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('text-base');
      expect(button).toHaveClass('min-w-[5rem]');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('text-lg');
      expect(button).toHaveClass('min-w-[6rem]');
    });

    it('uses medium size as default', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('text-base');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      
      // Check for spinner SVG
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('shows loading spinner with text', () => {
      render(<Button loading>Save Changes</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toContainHTML('Save Changes');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('adjusts spinner size based on button size', () => {
      const { rerender } = render(<Button loading size="sm">Small</Button>);
      let spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toHaveClass('h-3', 'w-3');

      rerender(<Button loading size="md">Medium</Button>);
      spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toHaveClass('h-4', 'w-4');

      rerender(<Button loading size="lg">Large</Button>);
      spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toHaveClass('h-5', 'w-5');
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('disables button when both disabled and loading are true', () => {
      render(<Button disabled loading>Disabled Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('applies disabled styles correctly', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
      expect(button).toHaveClass('disabled:pointer-events-none');
    });
  });

  describe('Event Handling', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not trigger click when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button loading onClick={handleClick}>Loading</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation (Enter)', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation (Space)', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus States', () => {
    it('applies focus styles correctly', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
    });

    it('is focusable by default', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    it('is not focusable when disabled', () => {
      render(<Button disabled>Not focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).not.toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('accepts custom type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveTextContent('Ref Button');
    });

    it('passes through additional props', () => {
      render(
        <Button 
          data-testid="custom-button" 
          aria-label="Custom aria label"
          id="custom-id"
        >
          Custom Props
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom aria label');
      expect(button).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('has proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('has proper ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('spinner has aria-hidden attribute', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('svg');
      
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('maintains semantic button role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Base Styles', () => {
    it('applies base button styles', () => {
      render(<Button>Base Styles</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
      expect(button).toHaveClass('font-semibold');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
      expect(button).toHaveClass('ease-out');
      expect(button).toHaveClass('select-none');
      expect(button).toHaveClass('touch-manipulation');
    });

    it('applies border styles', () => {
      render(<Button>Border</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-transparent');
    });
  });
});