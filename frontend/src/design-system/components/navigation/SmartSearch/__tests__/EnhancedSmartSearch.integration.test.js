import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnhancedSmartSearch } from '../EnhancedSmartSearch';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('EnhancedSmartSearch Integration', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  const mockSearchParams = {
    get: jest.fn(),
  };

  const defaultProps = {
    onSearch: jest.fn(),
    onFilterChange: jest.fn(),
    suggestions: [
      'Traditional tattoos',
      'Realism artists',
      'London studios',
      'Watercolor style'
    ]
  };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(mockSearchParams);
    localStorageMock.getItem.mockReturnValue(null);
    jest.clearAllMocks();
  });

  describe('Task 4 Requirements - Enhanced Search Integration', () => {
    test('integrates contextual help with search tips', async () => {
      const user = userEvent.setup();
      render(<EnhancedSmartSearch {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      
      // Focus should show contextual help when empty
      await user.click(searchInput);
      
      expect(screen.getByText('Search Tips & Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Quick Search')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Advanced Features')).toBeInTheDocument();
    });

    test('provides rich suggestions with categories', async () => {
      const user = userEvent.setup();
      render(<EnhancedSmartSearch {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      
      // Type to trigger suggestions
      await user.type(searchInput, 'tra');
      
      await waitFor(() => {
        expect(screen.getByText('Traditional tattoos')).toBeInTheDocument();
      });
    });

    test('implements keyboard shortcuts for navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedSmartSearch {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'test');

      // Test arrow key navigation
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{Escape}');

      // Help shortcut
      await user.keyboard('{Shift>}{?}{/Shift}');
      
      expect(screen.getByText('Search Tips & Shortcuts')).toBeInTheDocument();
    });

    test('shows search progress indicators', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(
        <EnhancedSmartSearch 
          {...defaultProps} 
          onSearch={mockOnSearch}
          showProgressIndicator={true}
        />
      );

      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'test query');
      await user.keyboard('{Enter}');

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByText(/Searching/)).toBeInTheDocument();
      });
    });

    test('implements search feedback system with validation', async () => {
      const user = userEvent.setup();
      render(<EnhancedSmartSearch {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      
      // Test validation for short query
      await user.type(searchInput, 'a');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/must be at least 2 characters/)).toBeInTheDocument();
      });
    });

    test('handles search errors with recovery suggestions', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn().mockRejectedValue(
        new Error('Network error')
      );
      
      render(
        <EnhancedSmartSearch 
          {...defaultProps} 
          onSearch={mockOnSearch}
          showErrorRecovery={true}
        />
      );

      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'test query');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Search temporarily unavailable/)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('manages recent searches with localStorage', async () => {
      const user = userEvent.setup();
      const recentSearches = [
        { query: 'traditional tattoos', timestamp: Date.now() }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentSearches));
      
      render(<EnhancedSmartSearch {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      await user.click(searchInput);

      // Should show recent searches when focused with empty query
      await waitFor(() => {
        expect(screen.getByText('Recent searches')).toBeInTheDocument();
        expect(screen.getByText('traditional tattoos')).toBeInTheDocument();
      });
    });

    test('integrates with URL parameters for search state', async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue('existing query');
      
      render(<EnhancedSmartSearch {...defaultProps} />);

      // Should initialize with URL query
      const searchInput = screen.getByRole('combobox');
      expect(searchInput.value).toBe('existing query');

      // Should update URL on search
      await user.type(searchInput, ' updated');
      await user.keyboard('{Enter}');

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('q=existing%20query%20updated')
      );
    });

    test('supports global keyboard shortcut for focus', async () => {
      const user = userEvent.setup();
      render(<EnhancedSmartSearch {...defaultProps} />);

      // Press "/" to focus search
      await user.keyboard('/');

      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toHaveFocus();
    });

    test('provides accessible search experience', () => {
      render(<EnhancedSmartSearch {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toHaveAttribute('aria-expanded', 'false');
      expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toBeInTheDocument();
      
      const helpButton = screen.getByRole('button', { name: /search help/i });
      expect(helpButton).toBeInTheDocument();
    });

    test('handles filter management with badges', async () => {
      const user = userEvent.setup();
      const filters = {
        styles: ['Traditional', 'Realism'],
        location: ['London']
      };
      
      render(
        <EnhancedSmartSearch 
          {...defaultProps} 
          filters={filters}
        />
      );

      // Should show active filters as badges
      expect(screen.getByText('Traditional')).toBeInTheDocument();
      expect(screen.getByText('Realism')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();

      // Should be able to remove filters
      const traditionalBadge = screen.getByText('Traditional').closest('div');
      const removeButton = traditionalBadge.querySelector('button');
      
      await user.click(removeButton);
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          styles: ['Realism'],
          location: ['London']
        })
      );
    });
  });

  describe('Performance and UX', () => {
    test('debounces search input to avoid excessive API calls', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();
      
      render(
        <EnhancedSmartSearch 
          {...defaultProps} 
          onSearch={mockOnSearch}
          debounceMs={100}
        />
      );

      const searchInput = screen.getByRole('combobox');
      
      // Type rapidly
      await user.type(searchInput, 'rapid typing');
      
      // Should not call search immediately
      expect(mockOnSearch).not.toHaveBeenCalled();
      
      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
    });

    test('limits suggestions to prevent UI overflow', async () => {
      const user = userEvent.setup();
      const manySuggestions = Array.from({ length: 20 }, (_, i) => `Suggestion ${i + 1}`);
      
      render(
        <EnhancedSmartSearch 
          {...defaultProps} 
          suggestions={manySuggestions}
          maxSuggestions={5}
        />
      );

      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole('option');
        expect(suggestionButtons).toHaveLength(5);
      });
    });

    test('closes dropdowns when clicking outside', async () => {
      const user = userEvent.setup();
      render(<EnhancedSmartSearch {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      await user.click(searchInput);

      // Help should be visible
      expect(screen.getByText('Search Tips & Shortcuts')).toBeInTheDocument();

      // Click outside
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Search Tips & Shortcuts')).not.toBeInTheDocument();
      });
    });
  });
});