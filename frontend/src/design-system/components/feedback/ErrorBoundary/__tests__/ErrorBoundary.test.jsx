import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeAll(() => {
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

// Test component that throws an error
function ThrowError({ shouldThrow = false, errorMessage = 'Test error' }) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('does not show error UI when no error', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches and displays error with default UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
    });

    it('generates unique error ID', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorIdElement = screen.getByText(/error id:/i);
      expect(errorIdElement).toBeInTheDocument();
      expect(errorIdElement.textContent).toMatch(/err_\d+_[a-z0-9]+/);
    });

    it('displays user-friendly message for network errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network connection failed" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/trouble connecting to our servers/i)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('shows reload button by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('shows home button by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('renders compact variant correctly', () => {
      render(
        <ErrorBoundary variant="compact">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
    });
  });
});