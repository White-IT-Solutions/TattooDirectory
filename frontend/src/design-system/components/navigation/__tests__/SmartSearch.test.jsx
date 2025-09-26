import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SmartSearch from '../SmartSearch/SmartSearch';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('SmartSearch', () => {
  const mockPush = jest.fn();
  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    useRouter.mockReturnValue({ push: mockPush });
    useSearchParams.mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    mockPush.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  it('renders search input with placeholder', () => {
    render(<SmartSearch placeholder="Search test..." />);
    
    expect(screen.getByPlaceholderText('Search test...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('shows search results when typing', async () => {
    render(<SmartSearch />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sarah' } });

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });
  });

  it('navigates to result when clicked', async () => {
    render(<SmartSearch />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sarah' } });

    await waitFor(() => {
      const result = screen.getByText('Sarah Chen');
      fireEvent.click(result);
    });

    expect(mockPush).toHaveBeenCalledWith('/artists/1');
  });

  it('handles keyboard navigation', async () => {
    render(<SmartSearch />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sarah' } });

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    // Arrow down to highlight first result
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalledWith('/artists/1');
  });

  it('shows recent searches when focused with empty query', () => {
    const recentSearches = [
      { query: 'traditional tattoo', href: '/search?q=traditional%20tattoo' }
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(recentSearches));

    render(<SmartSearch showRecentSearches={true} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText('traditional tattoo')).toBeInTheDocument();
    expect(screen.getByText('Recent search')).toBeInTheDocument();
  });

  it('saves searches to recent searches', async () => {
    render(<SmartSearch showRecentSearches={true} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sarah' } });

    await waitFor(() => {
      const result = screen.getByText('Sarah Chen');
      fireEvent.click(result);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'tattoo-directory-recent-searches',
      expect.stringContaining('Sarah Chen')
    );
  });

  it('clears recent searches when clear button is clicked', () => {
    const recentSearches = [
      { query: 'traditional tattoo', href: '/search?q=traditional%20tattoo' }
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(recentSearches));

    render(<SmartSearch showRecentSearches={true} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearButton);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tattoo-directory-recent-searches');
  });

  it('handles escape key to close results', async () => {
    render(<SmartSearch />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sarah' } });

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Sarah Chen')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during search', async () => {
    render(<SmartSearch />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sarah' } });

    // Should show loading immediately
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when no matches found', async () => {
    render(<SmartSearch />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/No results found for "nonexistent"/)).toBeInTheDocument();
    });
  });

  it('calls onSearch callback when provided', async () => {
    const mockOnSearch = jest.fn();
    render(<SmartSearch onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sarah' } });

    await waitFor(() => {
      const result = screen.getByText('Sarah Chen');
      fireEvent.click(result);
    });

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'artist',
        title: 'Sarah Chen'
      })
    );
  });
});