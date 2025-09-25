/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
const createMatchMediaMock = (matches = false) => jest.fn().mockImplementation(query => ({
  matches,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Test component with theme controls
function ThemeTestComponent() {
  const { 
    theme, 
    actualTheme, 
    setTheme, 
    toggleTheme, 
    isHighContrast, 
    isReducedMotion,
    mounted 
  } = useTheme();
  
  if (!mounted) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="actual-theme">{actualTheme}</div>
      <div data-testid="high-contrast">{isHighContrast.toString()}</div>
      <div data-testid="reduced-motion">{isReducedMotion.toString()}</div>
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

describe('ThemeProvider Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    document.documentElement.className = '';
    
    // Reset matchMedia to default
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(false),
    });
  });

  it('initializes with default theme', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('actual-theme')).toHaveTextContent('light');
  });

  it('toggles between light and dark themes', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Initial state should be light
    expect(screen.getByTestId('theme')).toHaveTextContent('light');

    // Toggle to dark
    fireEvent.click(screen.getByTestId('toggle'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('actual-theme')).toHaveTextContent('dark');
    });

    // Toggle back to light
    fireEvent.click(screen.getByTestId('toggle'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(screen.getByTestId('actual-theme')).toHaveTextContent('light');
    });
  });

  it('sets specific themes correctly', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Set to dark
    fireEvent.click(screen.getByTestId('set-dark'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('actual-theme')).toHaveTextContent('dark');
    });

    // Set to light
    fireEvent.click(screen.getByTestId('set-light'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(screen.getByTestId('actual-theme')).toHaveTextContent('light');
    });
  });

  it('handles system theme with dark preference', async () => {
    // Mock system dark preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <ThemeProvider defaultTheme="system">
        <ThemeTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('actual-theme')).toHaveTextContent('dark');
  });

  it('detects accessibility preferences', async () => {
    // Mock accessibility preferences
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)' || query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
  });

  it('applies theme classes to document', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('persists theme changes to localStorage', async () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Set to dark theme
    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tattoo-directory-theme', 'dark');
    });

    // Set to system theme (should remove from localStorage)
    fireEvent.click(screen.getByTestId('set-system'));

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tattoo-directory-theme');
    });
  });
});

describe('ThemeProvider Error Handling', () => {
  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    function TestComponent() {
      useTheme();
      return <div>Test</div>;
    }
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });
});