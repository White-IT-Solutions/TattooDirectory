import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, TextInput, EmailInput, PasswordInput, SearchInput } from '../Input';

describe('Input Component', () => {
  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders with custom className', () => {
      render(<Input className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref} data-testid="input" />);
      expect(ref.current).toBe(screen.getByTestId('input'));
    });

    it('handles controlled input correctly', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Input 
          value="test value" 
          onChange={handleChange}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveValue('test value');
      
      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Input Types', () => {
    it('renders text input correctly', () => {
      render(<TextInput data-testid="text-input" />);
      const input = screen.getByTestId('text-input');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders email input correctly', () => {
      render(<EmailInput data-testid="email-input" />);
      const input = screen.getByTestId('email-input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password input correctly', () => {
      render(<PasswordInput data-testid="password-input" />);
      const input = screen.getByTestId('password-input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders search input correctly', () => {
      render(<SearchInput data-testid="search-input" />);
      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute('type', 'search');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordInput data-testid="password-input" />);
      
      const input = screen.getByTestId('password-input');
      const toggleButton = screen.getByLabelText('Show password');
      
      expect(input).toHaveAttribute('type', 'password');
      
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
      
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });

    it('does not include toggle button in tab order', () => {
      render(<PasswordInput />);
      const toggleButton = screen.getByLabelText('Show password');
      expect(toggleButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Search Input Icon', () => {
    it('displays search icon for search input', () => {
      render(<SearchInput />);
      // Look for the SVG element directly since it has aria-hidden="true"
      const searchIcon = document.querySelector('svg[aria-hidden="true"]');
      expect(searchIcon).toBeInTheDocument();
    });

    it('applies correct padding for search icon', () => {
      render(<SearchInput data-testid="search-input" />);
      const input = screen.getByTestId('search-input');
      expect(input).toHaveClass('pl-10');
    });
  });

  describe('Label and Help Text', () => {
    it('renders label correctly', () => {
      render(<Input label="Username" id="username" />);
      const label = screen.getByText('Username');
      const input = screen.getByLabelText('Username');
      
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('shows required indicator when required', () => {
      render(<Input label="Username" required />);
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveAttribute('aria-label', 'required');
    });

    it('renders help text correctly', () => {
      render(<Input helpText="Enter your username" />);
      const helpText = screen.getByText('Enter your username');
      expect(helpText).toBeInTheDocument();
    });

    it('associates help text with input via aria-describedby', () => {
      render(<Input helpText="Enter your username" data-testid="input" />);
      const input = screen.getByTestId('input');
      const helpText = screen.getByText('Enter your username');
      
      expect(input).toHaveAttribute('aria-describedby');
      expect(helpText).toHaveAttribute('id');
      expect(input.getAttribute('aria-describedby')).toContain(helpText.getAttribute('id'));
    });
  });

  describe('Validation States', () => {
    it('renders error state correctly', () => {
      render(
        <Input 
          error="This field is required" 
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      const errorMessage = screen.getByText('This field is required');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('renders success state correctly', () => {
      render(<Input success="Valid input" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByText('Valid input')).toBeInTheDocument();
    });

    it('renders warning state correctly', () => {
      render(<Input warning="Check this input" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByText('Check this input')).toBeInTheDocument();
    });

    it('prioritizes error over other states', () => {
      render(
        <Input 
          error="Error message"
          success="Success message"
          warning="Warning message"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size classes correctly', () => {
      render(<Input size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-[var(--input-height-sm)]');
    });

    it('applies medium size classes correctly', () => {
      render(<Input size="md" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-[var(--input-height-md)]');
    });

    it('applies large size classes correctly', () => {
      render(<Input size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-[var(--input-height-lg)]');
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles and attributes', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:opacity-50');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });

    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input disabled onChange={handleChange} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('handles focus and blur events', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(
        <Input 
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('applies focus ring styles', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-[var(--focus-ring)]');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Input 
          label="Username"
          helpText="Enter your username"
          required
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('required');
    });

    it('supports custom aria-describedby', () => {
      render(
        <Input 
          aria-describedby="custom-description"
          helpText="Help text"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('custom-description');
    });

    it('generates unique IDs when not provided', () => {
      render(
        <>
          <Input label="First" helpText="First help" data-testid="input1" />
          <Input label="Second" helpText="Second help" data-testid="input2" />
        </>
      );
      
      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      
      expect(input1.getAttribute('id')).not.toBe(input2.getAttribute('id'));
    });
  });

  describe('Event Handling', () => {
    it('calls onChange when input value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} data-testid="input" />);
      const input = screen.getByTestId('input');
      
      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('passes through additional props', () => {
      render(
        <Input 
          data-testid="input"
          autoComplete="username"
          maxLength={50}
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('autoComplete', 'username');
      expect(input).toHaveAttribute('maxLength', '50');
    });
  });
});