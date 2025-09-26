import { render } from '@testing-library/react';
import { Input, TextInput, EmailInput, PasswordInput, SearchInput } from '../Input';

// Mock the design tokens CSS for consistent testing
const mockDesignTokens = `
  :root {
    --input-height-sm: 2rem;
    --input-height-md: 2.5rem;
    --input-height-lg: 3rem;
    --input-padding-x: 0.75rem;
    --input-radius: 0.25rem;
    --radius: 0.25rem;
    --radius-md: 0.5rem;
    --spacing-4: 1rem;
    --background-primary: #ffffff;
    --text-primary: #4a474d;
    --text-muted: #919292;
    --border-primary: #bfc0c0;
    --border-strong: #a8a9a9;
    --interactive-primary: #5c475c;
    --feedback-error: #ef4444;
    --feedback-error-bg: #fef2f2;
    --feedback-success: #22c55e;
    --feedback-success-bg: #f0fdf4;
    --feedback-warning: #f59e0b;
    --feedback-warning-bg: #fefce8;
    --focus-ring: #5c475c;
    --focus-ring-offset: #ffffff;
    --typography-body-size: 1.125rem;
    --typography-label-size: 0.9375rem;
    --typography-caption-size: 0.75rem;
    --font-size-sm: 0.9375rem;
    --font-size-lg: 1.5rem;
  }
`;

// Helper to render component with design tokens
const renderWithTokens = (component) => {
  const style = document.createElement('style');
  style.textContent = mockDesignTokens;
  document.head.appendChild(style);
  
  const result = render(component);
  
  // Cleanup
  return {
    ...result,
    cleanup: () => {
      document.head.removeChild(style);
      result.unmount();
    }
  };
};

describe('Input Visual Tests', () => {
  describe('Basic Input Variants', () => {
    it('renders default input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input placeholder="Default input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-default');
      cleanup();
    });

    it('renders text input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <TextInput placeholder="Text input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-text');
      cleanup();
    });

    it('renders email input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <EmailInput placeholder="Email input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-email');
      cleanup();
    });

    it('renders password input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <PasswordInput placeholder="Password input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-password');
      cleanup();
    });

    it('renders search input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <SearchInput placeholder="Search input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-search');
      cleanup();
    });
  });

  describe('Size Variants', () => {
    it('renders small input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input size="sm" placeholder="Small input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-size-sm');
      cleanup();
    });

    it('renders medium input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input size="md" placeholder="Medium input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-size-md');
      cleanup();
    });

    it('renders large input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input size="lg" placeholder="Large input" />
      );
      expect(container.firstChild).toMatchSnapshot('input-size-lg');
      cleanup();
    });
  });

  describe('Validation States', () => {
    it('renders error state correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          variant="error"
          error="This field is required"
          placeholder="Error input"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-error');
      cleanup();
    });

    it('renders success state correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          variant="success"
          success="Valid input"
          placeholder="Success input"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-success');
      cleanup();
    });

    it('renders warning state correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          variant="warning"
          warning="Please check this input"
          placeholder="Warning input"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-warning');
      cleanup();
    });
  });

  describe('With Labels and Help Text', () => {
    it('renders input with label correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          label="Username"
          placeholder="Enter your username"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-with-label');
      cleanup();
    });

    it('renders input with required label correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          label="Email Address"
          placeholder="Enter your email"
          required
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-with-required-label');
      cleanup();
    });

    it('renders input with help text correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          label="Password"
          helpText="Must be at least 8 characters long"
          placeholder="Enter your password"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-with-help-text');
      cleanup();
    });

    it('renders complete input with all elements correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          label="Full Name"
          placeholder="Enter your full name"
          helpText="First and last name"
          required
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-complete');
      cleanup();
    });
  });

  describe('Disabled State', () => {
    it('renders disabled input correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          disabled
          label="Disabled Input"
          placeholder="This input is disabled"
          helpText="This field is currently disabled"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-disabled');
      cleanup();
    });
  });

  describe('Complex Combinations', () => {
    it('renders error state with all elements correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          error="Please enter a valid email address"
          required
          size="lg"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-error-complete');
      cleanup();
    });

    it('renders success state with all elements correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <Input 
          label="Username"
          placeholder="Enter your username"
          success="Username is available"
          size="md"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-success-complete');
      cleanup();
    });

    it('renders search input with label correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <SearchInput 
          label="Search Artists"
          placeholder="Search by name, style, or location"
          helpText="Use keywords to find tattoo artists"
          size="lg"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-search-complete');
      cleanup();
    });

    it('renders password input with all features correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <PasswordInput 
          label="Password"
          placeholder="Enter your password"
          helpText="Must contain at least 8 characters"
          required
          size="md"
        />
      );
      expect(container.firstChild).toMatchSnapshot('input-password-complete');
      cleanup();
    });
  });

  describe('Size Combinations', () => {
    it('renders all sizes with labels correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <div className="space-y-4">
          <Input 
            size="sm"
            label="Small Input"
            placeholder="Small size"
          />
          <Input 
            size="md"
            label="Medium Input"
            placeholder="Medium size"
          />
          <Input 
            size="lg"
            label="Large Input"
            placeholder="Large size"
          />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot('input-all-sizes');
      cleanup();
    });
  });

  describe('Validation State Combinations', () => {
    it('renders all validation states correctly', () => {
      const { container, cleanup } = renderWithTokens(
        <div className="space-y-4">
          <Input 
            label="Default State"
            placeholder="Default input"
            helpText="This is a default input"
          />
          <Input 
            label="Error State"
            placeholder="Error input"
            error="This field has an error"
          />
          <Input 
            label="Success State"
            placeholder="Success input"
            success="This field is valid"
          />
          <Input 
            label="Warning State"
            placeholder="Warning input"
            warning="Please check this field"
          />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot('input-all-validation-states');
      cleanup();
    });
  });
});