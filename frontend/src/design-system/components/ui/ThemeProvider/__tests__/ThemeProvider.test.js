/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test component that uses the theme
function TestComponent() {
  const { theme, actualTheme, toggleTheme, setTheme, mounted } = useTheme();
  
  if (!mounted) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="actual-theme">{actualTheme}</div>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-system" onClick={() => setTheme('system')}>
        Set System
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    document.documentElement.className = '';
  });

  it('renders without crashing', () => {
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );
  });

  it('provides default theme context', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('actual-theme')).toHaveTextContent('light');
  });

  it('toggles theme correctly', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId('toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('actual-theme')).toHaveTextContent('dark');
    });
  });

  it('sets theme correctly', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const setDarkButton = screen.getByTestId('set-dark');
    fireEvent.click(setDarkButton);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('actual-theme')).toHaveTextContent('dark');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('tattoo-directory-theme', 'dark');
  });

  it('handles system theme correctly', async () => {
    // Mock system preference for dark mode
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('actual-theme')).toHaveTextContent('dark');
  });

  it('persists theme preference', async () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('tattoo-directory-theme');
  });

  it('removes theme preference when set to system', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const setSystemButton = screen.getByTestId('set-system');
    fireEvent.click(setSystemButton);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('tattoo-directory-theme');
  });

  it('applies theme class to document', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });
});

describe('ThemeProvider accessibility features', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.className = '';
  });

  it('detects high contrast preference', async () => {
    // Mock high contrast preference
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-contrast: high)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    function HighContrastTest() {
      const { isHighContrast, mounted } = useTheme();
      if (!mounted) return <div>Loading...</div>;
      return <div data-testid="high-contrast">{isHighContrast.toString()}</div>;
    }

    render(
      <ThemeProvider>
        <HighContrastTest />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });
  });

  it('detects reduced motion preference', async () => {
    // Mock reduced motion preference
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    function ReducedMotionTest() {
      const { isReducedMotion, mounted } = useTheme();
      if (!mounted) return <div>Loading...</div>;
      return <div data-testid="reduced-motion">{isReducedMotion.toString()}</div>;
    }

    render(
      <ThemeProvider>
        <ReducedMotionTest />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });
  });
});