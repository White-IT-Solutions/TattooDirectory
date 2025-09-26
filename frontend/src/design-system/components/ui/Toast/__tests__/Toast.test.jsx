import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

// Test component that uses the toast hook
function TestComponent() {
  const toast = useToast();
  
  return (
    <div>
      <button onClick={() => toast.success('Success!', 'Operation completed')}>
        Success Toast
      </button>
      <button onClick={() => toast.error('Error!', 'Something went wrong')}>
        Error Toast
      </button>
      <button onClick={() => toast.warning('Warning!', 'Please be careful')}>
        Warning Toast
      </button>
      <button onClick={() => toast.info('Info!', 'Just so you know')}>
        Info Toast
      </button>
      <button onClick={() => toast.addToast({ 
        variant: 'success', 
        title: 'Custom', 
        description: 'Custom toast',
        persistent: true 
      })}>
        Persistent Toast
      </button>
      <button onClick={() => toast.clearAllToasts()}>
        Clear All
      </button>
    </div>
  );
}

describe('Toast System', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');
    
    consoleSpy.mockRestore();
  });

  it('renders toast provider without error', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('shows success toast', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Success Toast'));
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('shows error toast', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Error Toast'));
    
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows warning toast', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Warning Toast'));
    
    expect(screen.getByText('Warning!')).toBeInTheDocument();
    expect(screen.getByText('Please be careful')).toBeInTheDocument();
  });

  it('shows info toast', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Info Toast'));
    
    expect(screen.getByText('Info!')).toBeInTheDocument();
    expect(screen.getByText('Just so you know')).toBeInTheDocument();
  });

  it('auto-dismisses toasts after duration', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Success Toast'));
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    
    // Fast-forward time by 5 seconds (default duration)
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });
  });

  it('allows manual dismissal via close button', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Success Toast'));
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });
  });

  it('handles persistent toasts', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Persistent Toast'));
    
    expect(screen.getByText('Custom')).toBeInTheDocument();
    
    // Fast-forward time - persistent toast should not auto-dismiss
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('clears all toasts', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    // Add multiple toasts
    await user.click(screen.getByText('Success Toast'));
    await user.click(screen.getByText('Error Toast'));
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
    
    // Clear all toasts
    await user.click(screen.getByText('Clear All'));
    
    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
      expect(screen.queryByText('Error!')).not.toBeInTheDocument();
    });
  });

  it('stacks multiple toasts', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Success Toast'));
    await user.click(screen.getByText('Error Toast'));
    await user.click(screen.getByText('Warning Toast'));
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('handles toasts with only title', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    function TitleOnlyComponent() {
      const toast = useToast();
      return (
        <button onClick={() => toast.success('Title Only')}>
          Title Only Toast
        </button>
      );
    }
    
    render(
      <ToastProvider>
        <TitleOnlyComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Title Only Toast'));
    
    expect(screen.getByText('Title Only')).toBeInTheDocument();
  });

  it('handles toasts with action buttons', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    function ActionToastComponent() {
      const toast = useToast();
      return (
        <button onClick={() => toast.addToast({
          variant: 'info',
          title: 'Action Toast',
          description: 'This has an action',
          action: <button>Action Button</button>
        })}>
          Trigger Action Toast
        </button>
      );
    }
    
    render(
      <ToastProvider>
        <ActionToastComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Trigger Action Toast'));
    
    expect(screen.getByText('Action Toast')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('provides correct ARIA attributes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Success Toast'));
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});