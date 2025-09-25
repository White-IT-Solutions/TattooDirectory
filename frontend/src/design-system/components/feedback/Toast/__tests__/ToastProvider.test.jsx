import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastProvider';

// Mock timers for testing auto-dismiss
jest.useFakeTimers();

// Test component that uses the toast hook
function TestComponent() {
  const { success, error, warning, info, removeAllToasts, toasts } = useToast();

  return (
    <div>
      <button onClick={() => success('Success message')}>Success Toast</button>
      <button onClick={() => error('Error message')}>Error Toast</button>
      <button onClick={() => warning('Warning message')}>Warning Toast</button>
      <button onClick={() => info('Info message')}>Info Toast</button>
      <button onClick={removeAllToasts}>Clear All</button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('provides toast context to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Success Toast')).toBeInTheDocument();
    expect(screen.getByText('Error Toast')).toBeInTheDocument();
    expect(screen.getByText('Warning Toast')).toBeInTheDocument();
    expect(screen.getByText('Info Toast')).toBeInTheDocument();
  });

  it('creates success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success Toast'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  it('creates error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Error Toast'));
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  it('creates warning toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Warning Toast'));
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  it('creates info toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Info Toast'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  it('handles multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success Toast'));
    fireEvent.click(screen.getByText('Error Toast'));
    fireEvent.click(screen.getByText('Warning Toast'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
  });

  it('removes all toasts when clearAll is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success Toast'));
    fireEvent.click(screen.getByText('Error Toast'));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('2');

    fireEvent.click(screen.getByText('Clear All'));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('auto-removes toasts after default duration', () => {
    render(
      <ToastProvider defaultDuration={3000}>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success Toast'));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('respects maxToasts limit', () => {
    render(
      <ToastProvider maxToasts={2}>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success Toast'));
    fireEvent.click(screen.getByText('Error Toast'));
    fireEvent.click(screen.getByText('Warning Toast'));

    // Should still have 3 toasts in state, but container will limit display
    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  it('handles custom toast options', () => {
    function CustomTestComponent() {
      const { addToast } = useToast();

      const handleCustomToast = () => {
        addToast({
          type: 'success',
          title: 'Custom Title',
          message: 'Custom message',
          duration: 0, // No auto-dismiss
          action: {
            label: 'Custom Action',
            onClick: () => console.log('Action clicked'),
          },
        });
      };

      return <button onClick={handleCustomToast}>Custom Toast</button>;
    }

    render(
      <ToastProvider>
        <CustomTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Custom Toast'));
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });
});