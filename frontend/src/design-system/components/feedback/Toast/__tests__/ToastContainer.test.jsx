import { render, screen } from '@testing-library/react';
import ToastContainer from '../ToastContainer';

// Mock createPortal to render in the same container
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (element) => element,
}));

describe('ToastContainer', () => {
  const mockToasts = [
    {
      id: '1',
      type: 'success',
      message: 'Success message',
    },
    {
      id: '2',
      type: 'error',
      message: 'Error message',
    },
    {
      id: '3',
      type: 'warning',
      message: 'Warning message',
    },
  ];

  const defaultProps = {
    toasts: mockToasts,
    onRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all toasts', () => {
    render(<ToastContainer {...defaultProps} />);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('renders with default top-right position', () => {
    const { container } = render(<ToastContainer {...defaultProps} />);
    
    const containerElement = container.querySelector('.fixed');
    expect(containerElement).toHaveClass('top-4', 'right-4');
  });

  it('renders with custom position', () => {
    const { container } = render(
      <ToastContainer {...defaultProps} position="bottom-left" />
    );
    
    const containerElement = container.querySelector('.fixed');
    expect(containerElement).toHaveClass('bottom-4', 'left-4');
  });

  it('handles all position variants', () => {
    const positions = [
      'top-right',
      'top-left', 
      'top-center',
      'bottom-right',
      'bottom-left',
      'bottom-center'
    ];

    positions.forEach(position => {
      const { container, unmount } = render(
        <ToastContainer {...defaultProps} position={position} />
      );
      
      const containerElement = container.querySelector('.fixed');
      expect(containerElement).toBeInTheDocument();
      unmount();
    });
  });

  it('limits toasts to maxToasts', () => {
    const manyToasts = Array.from({ length: 10 }, (_, i) => ({
      id: `toast-${i}`,
      type: 'info',
      message: `Message ${i}`,
    }));

    render(
      <ToastContainer 
        toasts={manyToasts} 
        onRemove={jest.fn()} 
        maxToasts={3} 
      />
    );

    // Should only show the last 3 toasts
    expect(screen.getByText('Message 7')).toBeInTheDocument();
    expect(screen.getByText('Message 8')).toBeInTheDocument();
    expect(screen.getByText('Message 9')).toBeInTheDocument();
    expect(screen.queryByText('Message 6')).not.toBeInTheDocument();
  });

  it('renders empty container when no toasts', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onRemove={jest.fn()} />
    );
    
    const containerElement = container.querySelector('.fixed');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement.querySelector('.flex')).toBeEmptyDOMElement();
  });

  it('has proper accessibility attributes', () => {
    const { container } = render(<ToastContainer {...defaultProps} />);
    
    const containerElement = container.querySelector('.fixed');
    expect(containerElement).toHaveAttribute('aria-live', 'polite');
    expect(containerElement).toHaveAttribute('aria-label', 'Notifications');
  });

  it('applies stacking styles to multiple toasts', () => {
    const { container } = render(<ToastContainer {...defaultProps} />);
    
    const toastElements = container.querySelectorAll('[role="alert"]');
    expect(toastElements).toHaveLength(3);
    
    // Each toast should be in its own stacking container with proper z-index
    const stackingContainers = container.querySelectorAll('[style*="z-index"]');
    expect(stackingContainers).toHaveLength(3);
  });

  it('does not render when not mounted', () => {
    // Mock useState to return false for mounted state
    const mockUseState = jest.spyOn(require('react'), 'useState');
    mockUseState.mockReturnValueOnce([false, jest.fn()]);

    const { container } = render(<ToastContainer {...defaultProps} />);
    
    expect(container).toBeEmptyDOMElement();
    
    mockUseState.mockRestore();
  });
});