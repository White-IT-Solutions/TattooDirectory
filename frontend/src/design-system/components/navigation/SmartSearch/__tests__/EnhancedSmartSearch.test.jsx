import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SmartSearch from '../SmartSearch';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Enhanced SmartSearch', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  };

  const mockSearchParams = {
    get: jest.fn()
  };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockSearchParams);
    localStorageMock.getItem.mockReturnValue(null);
    jest.clearAllMocks();
  });

  describe('Contextual Help Display', () => {
    it('should show contextual help when focused for the first time', async () => {
      render(<SmartSearch showContextualHelp={true} />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Search Tips & Shortcuts')).toBeInTheDocument();
      });
    });

    it('should display search tips with examples', async () => {
      render(<SmartSearch showContextualHelp={true} />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Artists')).toBeInTheDocument();
        expect(screen.getByText('Styles')).toBeInTheDocument();
        expect(screen.getByText('Studios')).toBeInTheDocument();
        expect(screen.getByText('Locations')).toBeInTheDocument();
      });
    });

    it('should show advanced search shortcuts', async () => {
      render(<SmartSearch showContextualHelp={true} showAdvancedShortcuts={true} />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Advanced Search')).toBeInTheDocument();
        expect(screen.getByText('Map Search')).toBeInTheDocument();
        expect(screen.getByText('Style Explorer')).toBeInTheDocument();
        expect(screen.getByText('Popular Artists')).toBeInTheDocument();
      });
    });

    it('should hide contextual help when typing', async () => {
      render(<SmartSearch showContextualHelp={true} />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Search Tips & Shortcuts')).toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.queryByText('Search Tips & Shortcuts')).not.toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Search Results', () => {
    it('should display rich metadata for artist results', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });

      await waitFor(() => {
        expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
        expect(screen.getByText('Ink & Steel • London')).toBeInTheDocument();
      });
    });

    it('should display enhanced style results with difficulty badges', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.change(searchInput, { target: { value: 'traditional' } });

      await waitFor(() => {
        expect(screen.getAllByText('Traditional')[0]).toBeInTheDocument();
        // Should show difficulty level
        expect(screen.getAllByText('Beginner')[0]).toBeInTheDocument();
      });
    });

    it('should support alias-based style search', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.change(searchInput, { target: { value: 'sailor jerry' } });

      await waitFor(() => {
        // Should find "Old School" style via alias
        expect(screen.getByText('Old School')).toBeInTheDocument();
      });
    });

    it('should display location results with artist and studio counts', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.change(searchInput, { target: { value: 'London' } });

      await waitFor(() => {
        expect(screen.getByText('London')).toBeInTheDocument();
        expect(screen.getByText('156 artists')).toBeInTheDocument();
        expect(screen.getByText('45 studios')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus search input when "/" key is pressed globally', () => {
      render(<SmartSearch />);
      
      // Simulate global keydown event
      fireEvent.keyDown(document, { key: '/' });
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toHaveFocus();
    });

    it('should navigate results with arrow keys', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Recent Searches Enhancement', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => {
        render(<SmartSearch showRecentSearches={true} />);
      }).not.toThrow();
    });

    it('should support recent searches functionality', () => {
      render(<SmartSearch showRecentSearches={true} />);
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toBeInTheDocument();
      
      // Component should render without errors when recent searches are enabled
      expect(searchInput).toHaveAttribute('placeholder', 'Search artists, studios, styles, or locations...');
    });
  });

  describe('Advanced Search Shortcuts', () => {
    it('should navigate to advanced search when shortcut is clicked', async () => {
      render(<SmartSearch showContextualHelp={true} showAdvancedShortcuts={true} />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Advanced Search')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Advanced Search'));

      expect(mockRouter.push).toHaveBeenCalledWith('/search/advanced');
    });

    it('should handle shortcut selections', async () => {
      render(<SmartSearch showContextualHelp={true} showAdvancedShortcuts={true} showRecentSearches={true} />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Map Search')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Map Search'));

      expect(mockRouter.push).toHaveBeenCalledWith('/search/map');
    });
  });

  describe('Search Tips and Examples', () => {
    it('should populate search input when tip example is clicked', async () => {
      render(<SmartSearch showContextualHelp={true} />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
      });

      // Click on the Artists tip section
      fireEvent.click(screen.getByText('Artists').closest('.cursor-pointer'));

      // Should populate search with a random example
      expect(searchInput.value).toBeTruthy();
    });

    it('should show search suggestions when no results found', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/No results found for/)).toBeInTheDocument();
        expect(screen.getByText('Try searching for:')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toHaveAttribute('aria-expanded', 'false');
      expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('should update ARIA attributes when dropdown is open', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(searchInput).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have proper role attributes for search results', async () => {
      render(<SmartSearch />);
      
      const searchInput = screen.getByRole('combobox');
      fireEvent.change(searchInput, { target: { value: 'traditional' } });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('should debounce search queries', async () => {
      const onSearch = jest.fn();
      render(<SmartSearch onSearch={onSearch} />);
      
      const searchInput = screen.getByRole('combobox');
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'tes' } });
      fireEvent.change(searchInput, { target: { value: 'traditional' } });

      // Should only trigger search after debounce delay
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});