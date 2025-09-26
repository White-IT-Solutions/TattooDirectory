/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
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
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Simple test component
function SimpleThemeTest() {
  const { theme, actualTheme, setTheme, mounted } = useTheme();
  
  if (!mounted) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="actual-theme">{actualTheme}</div>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
    </div>
  );
}

describe('ThemeProvider Simple Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    document.documentElement.className = '';
  });

  it('renders and provides theme context', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <SimpleThemeTest />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('actual-theme')).toHaveTextContent('light');
  });

  it('can change theme', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <SimpleThemeTest />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('actual-theme')).toHaveTextContent('dark');
    });
  });

  it('applies theme class to document', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <SimpleThemeTest />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Check that the dark class is applied
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});