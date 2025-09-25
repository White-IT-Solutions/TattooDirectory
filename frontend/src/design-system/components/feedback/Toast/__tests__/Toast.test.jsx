import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Toast from '../Toast';

// Mock timers for testing auto-dismiss
jest.useFakeTimers();

describe('Toast Component', () => {
  const defaultProps = {
    id: 'test-toast',
    message: 'Test message',
    onRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('renders with default info variant', () => {
    render(<Toast {...defaultProps} />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
  });

  it('renders all toast variants correctly', () => {
    const variants = ['success', 'error', 'warning', 'info'];
    
    variants.forEach(variant => {
      const { unmount } = render(
        <Toast {...defaultProps} type={variant} message={`${variant} message`} />
      );
      
      expect(screen.getByText(`${variant} message`)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders title when provided', () => {
    render(<Toast {...defaultProps} title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const actionMock = jest.fn();
    const action = {
      label: 'Retry',
      onClick: actionMock,
    };

    render(<Toast {...defaultProps} action={action} />);
    
    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(actionMock).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when dismiss button is clicked', () => {
    const onRemoveMock = jest.fn();
    render(<Toast {...defaultProps} onRemove={onRemoveMock} />);
    
    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);
    
    // Should trigger exit animation, then call onRemove after delay
    jest.advanceTimersByTime(300);
    expect(onRemoveMock).toHaveBeenCalledWith('test-toast');
  });

  it('auto-dismisses after specified duration', () => {
    const onRemoveMock = jest.fn();
    render(<Toast {...defaultProps} onRemove={onRemoveMock} duration={3000} />);
    
    // Should not be dismissed immediately
    expect(onRemoveMock).not.toHaveBeenCalled();
    
    // Should be dismissed after duration + animation time
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(300);
    expect(onRemoveMock).toHaveBeenCalledWith('test-toast');
  });

  it('does not auto-dismiss when duration is 0', () => {
    const onRemoveMock = jest.fn();
    render(<Toast {...defaultProps} onRemove={onRemoveMock} duration={0} />);
    
    jest.advanceTimersByTime(10000);
    expect(onRemoveMock).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
    
    const dismissButton = screen.getByLabelText('Dismiss notification');
    expect(dismissButton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Toast {...defaultProps} className="custom-class" />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('custom-class');
  });

  it('handles success variant styling', () => {
    render(<Toast {...defaultProps} type="success" />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('handles error variant styling', () => {
    render(<Toast {...defaultProps} type="error" />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('handles warning variant styling', () => {
    render(<Toast {...defaultProps} type="warning" />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('handles info variant styling', () => {
    render(<Toast {...defaultProps} type="info" />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });
});