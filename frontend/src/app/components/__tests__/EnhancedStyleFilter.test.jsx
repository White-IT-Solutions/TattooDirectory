import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnhancedStyleFilter from '../EnhancedStyleFilter';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the design system components
jest.mock('../../../design-system/components/ui/Badge/Badge', () => {
  return function MockBadge({ children, variant, size }) {
    return <span data-testid="badge" data-variant={variant} data-size={size}>{children}</span>;
  };
});

jest.mock('../../../design-system/components/ui/Tag/Tag', () => {
  return function MockTag({ children, variant, size, removable, onRemove }) {
    return (
      <span data-testid="tag" data-variant={variant} data-size={size}>
        {children}
        {removable && <button onClick={onRemove} data-testid="remove-tag">×</button>}
      </span>
    );
  };
});

describe('EnhancedStyleFilter', () => {
  const mockPush = jest.fn();
  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    useRouter.mockReturnValue({ push: mockPush });
    useSearchParams.mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    mockPush.mockClear();
  });

  it('renders the enhanced style filter with search functionality', () => {
    render(<EnhancedStyleFilter />);
    
    expect(screen.getByText('Filter by Tattoo Style')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search styles...')).toBeInTheDocument();
  });

  it('displays style buttons with difficulty badges and popularity indicators', () => {
    render(<EnhancedStyleFilter />);
    
    // Check for style buttons
    const styleButtons = screen.getAllByRole('button').filter(button => 
      button.getAttribute('data-testid')?.startsWith('style-button-')
    );
    expect(styleButtons.length).toBeGreaterThan(0);

    // Check for difficulty badges
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('handles style selection and deselection', () => {
    render(<EnhancedStyleFilter />);
    
    const styleButton = screen.getByTestId('style-button-old_school');
    fireEvent.click(styleButton);
    
    expect(mockPush).toHaveBeenCalledWith('/artists?styles=old_school');
  });

  it('handles search functionality', async () => {
    render(<EnhancedStyleFilter />);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    fireEvent.change(searchInput, { target: { value: 'traditional' } });
    
    await waitFor(() => {
      expect(searchInput.value).toBe('traditional');
    });
  });

  it('displays selected styles as removable tags', () => {
    mockSearchParams.get.mockReturnValue('old_school,traditional');
    
    render(<EnhancedStyleFilter />);
    
    expect(screen.getByText('Selected styles:')).toBeInTheDocument();
    const tags = screen.getAllByTestId('tag');
    expect(tags.length).toBeGreaterThanOrEqual(2);
  });

  it('handles clear all functionality', () => {
    mockSearchParams.get.mockReturnValue('old_school');
    
    render(<EnhancedStyleFilter />);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(mockPush).toHaveBeenCalledWith('/artists');
  });

  it('shows tooltip on hover', async () => {
    render(<EnhancedStyleFilter />);
    
    const styleButton = screen.getByTestId('style-button-old_school');
    fireEvent.mouseEnter(styleButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Classic American traditional tattoos/)).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', () => {
    render(<EnhancedStyleFilter />);
    
    const styleButton = screen.getByTestId('style-button-old_school');
    fireEvent.keyDown(styleButton, { key: 'Enter' });
    
    expect(mockPush).toHaveBeenCalledWith('/artists?styles=old_school');
  });

  it('displays no results message when search yields no matches', async () => {
    render(<EnhancedStyleFilter />);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText(/No styles found for "nonexistent"/)).toBeInTheDocument();
    });
  });

  it('handles alias search functionality', async () => {
    render(<EnhancedStyleFilter />);
    
    const searchInput = screen.getByPlaceholderText('Search styles...');
    fireEvent.change(searchInput, { target: { value: 'sailor jerry' } });
    
    await waitFor(() => {
      // Should find Old School style via alias
      expect(screen.getByTestId('style-button-old_school')).toBeInTheDocument();
    });
  });

  it('displays style characteristics on hover', async () => {
    render(<EnhancedStyleFilter />);
    
    const styleButton = screen.getByTestId('style-button-old_school');
    fireEvent.mouseEnter(styleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Characteristics')).toBeInTheDocument();
    });
  });
});