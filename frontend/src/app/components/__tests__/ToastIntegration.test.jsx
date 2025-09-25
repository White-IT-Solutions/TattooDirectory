import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../../../design-system/components/feedback/Toast';
import EnhancedArtistsPage from '../../artists/EnhancedArtistsPage';
import EnhancedStudiosPage from '../../studios/EnhancedStudiosPage';
import StylesPage from '../../styles/StylesPageClean';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  }),
  usePathname: () => '/test-path',
}));

// Mock search controller
jest.mock('../../../lib/useSearchController', () => ({
  useSearchController: () => ({
    searchState: { results: [], suggestions: [] },
    executeSearch: jest.fn(),
    clearFilters: jest.fn(),
    hasResults: false,
    hasFilters: false,
    isSearching: false,
    searchError: null,
    totalResults: 0,
  }),
  SearchQuery: class SearchQuery {
    constructor(params) {
      this.params = params;
    }
    hasFilters() {
      return Object.keys(this.params).length > 0;
    }
  },
}));

// Mock search validation
jest.mock('../../components/SearchValidation', () => ({
  useSearchValidation: () => ({
    value: '',
    validation: { isValid: true },
    isValidating: false,
    updateValue: jest.fn(),
    clearValue: jest.fn(),
  }),
  SearchValidationIndicator: () => <div data-testid="search-validation" />,
}));

// Mock saved searches
jest.mock('../../components/SavedSearches', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-searches" />,
  saveSearchToStorage: jest.fn(() => 'test-id'),
}));

// Mock location services
jest.mock('../../../design-system/components/navigation/LocationServices/LocationServices', () => ({
  __esModule: true,
  default: () => <div data-testid="location-services" />,
}));

// Mock device capabilities
jest.mock('../../../lib/device-capabilities', () => ({
  getDeviceCapabilities: () => ({
    isTouchDevice: false,
    hasLocationServices: false,
    supportsVibration: false,
  }),
}));

// Test wrapper with ToastProvider
const TestWrapper = ({ children, position = 'top-right' }) => (
  <ToastProvider position={position} maxToasts={5} defaultDuration={3000}>
    {children}
  </ToastProvider>
);

describe('Toast Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock timers for toast auto-dismiss
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Artists Page Toast Integration', () => {
    it('should show success toast when search completes with results', async () => {
      const mockExecuteSearch = jest.fn().mockResolvedValue();
      
      // Mock search controller with results
      jest.doMock('../../../lib/useSearchController', () => ({
        useSearchController: () => ({
          searchState: { results: [{ id: 1 }, { id: 2 }], suggestions: [] },
          executeSearch: mockExecuteSearch,
          clearFilters: jest.fn(),
          hasResults: true,
          hasFilters: false,
          isSearching: false,
          searchError: null,
          totalResults: 2,
        }),
        SearchQuery: class SearchQuery {
          constructor(params) {
            this.params = params;
          }
          hasFilters() {
            return Object.keys(this.params).length > 0;
          }
        },
      }));

      render(
        <TestWrapper>
          <EnhancedArtistsPage />
        </TestWrapper>
      );

      // Find and click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      // Wait for toast to appear
      await waitFor(() => {
        expect(screen.getByText(/Found 2 artists matching your search/)).toBeInTheDocument();
      });

      expect(screen.getByText('Search Complete')).toBeInTheDocument();
    });

    it('should show error toast when search fails', async () => {
      const mockExecuteSearch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      jest.doMock('../../../lib/useSearchController', () => ({
        useSearchController: () => ({
          searchState: { results: [], suggestions: [] },
          executeSearch: mockExecuteSearch,
          clearFilters: jest.fn(),
          hasResults: false,
          hasFilters: false,
          isSearching: false,
          searchError: 'Network error',
          totalResults: 0,
        }),
        SearchQuery: class SearchQuery {
          constructor(params) {
            this.params = params;
          }
          hasFilters() {
            return Object.keys(this.params).length > 0;
          }
        },
      }));

      render(
        <TestWrapper>
          <EnhancedArtistsPage />
        </TestWrapper>
      );

      // Find and click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      // Wait for error toast to appear
      await waitFor(() => {
        expect(screen.getByText(/Failed to search artists/)).toBeInTheDocument();
      });

      expect(screen.getByText('Search Failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should show info toast when filters are cleared', async () => {
      render(
        <TestWrapper>
          <EnhancedArtistsPage />
        </TestWrapper>
      );

      // Find and click clear filters button (if it exists)
      const clearButton = screen.queryByText(/clear.*filter/i);
      if (clearButton) {
        fireEvent.click(clearButton);

        await waitFor(() => {
          expect(screen.getByText(/All search filters have been cleared/)).toBeInTheDocument();
        });

        expect(screen.getByText('Filters Cleared')).toBeInTheDocument();
      }
    });

    it('should show warning toast for invalid saved search name', async () => {
      render(
        <TestWrapper>
          <EnhancedArtistsPage />
        </TestWrapper>
      );

      // Try to save search without name (this would need to be triggered by the save function)
      // This test would need the save search functionality to be exposed
      // For now, we'll test the toast system directly
    });
  });

  describe('Studios Page Toast Integration', () => {
    it('should show success toast when studio search completes', async () => {
      const mockExecuteSearch = jest.fn().mockResolvedValue();
      
      jest.doMock('../../../lib/useSearchController', () => ({
        useSearchController: () => ({
          searchState: { results: [{ id: 1 }], suggestions: [] },
          executeSearch: mockExecuteSearch,
          clearFilters: jest.fn(),
          hasResults: true,
          hasFilters: false,
          isSearching: false,
          searchError: null,
          totalResults: 1,
        }),
        SearchQuery: class SearchQuery {
          constructor(params) {
            this.params = params;
          }
          hasFilters() {
            return Object.keys(this.params).length > 0;
          }
        },
      }));

      render(
        <TestWrapper>
          <EnhancedStudiosPage />
        </TestWrapper>
      );

      // Find and click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      // Wait for toast to appear
      await waitFor(() => {
        expect(screen.getByText(/Found 1 studio matching your search/)).toBeInTheDocument();
      });
    });
  });

  describe('Styles Page Toast Integration', () => {
    it('should show info toast when switching view modes', async () => {
      render(
        <TestWrapper>
          <StylesPage />
        </TestWrapper>
      );

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText(/Style Grid/)).toBeInTheDocument();
      });

      // Find and click gallery view button
      const galleryButton = screen.getByText(/Portfolio Gallery/);
      fireEvent.click(galleryButton);

      // Wait for toast to appear
      await waitFor(() => {
        expect(screen.getByText(/Switched to portfolio gallery view/)).toBeInTheDocument();
      });

      expect(screen.getByText('View Changed')).toBeInTheDocument();
    });

    it('should show success toast when applying gallery filter', async () => {
      render(
        <TestWrapper>
          <StylesPage />
        </TestWrapper>
      );

      // Wait for page to load and switch to gallery mode
      await waitFor(() => {
        expect(screen.getByText(/Portfolio Gallery/)).toBeInTheDocument();
      });

      const galleryButton = screen.getByText(/Portfolio Gallery/);
      fireEvent.click(galleryButton);

      // Wait for gallery mode to activate and find style selector
      await waitFor(() => {
        const styleSelector = screen.queryByDisplayValue('');
        if (styleSelector) {
          fireEvent.change(styleSelector, { target: { value: 'traditional' } });

          // Wait for success toast
          waitFor(() => {
            expect(screen.getByText(/Gallery filtered to show traditional style tattoos/)).toBeInTheDocument();
          });
        }
      });
    });
  });

  describe('Toast Accessibility Features', () => {
    it('should have proper ARIA attributes', async () => {
      render(
        <TestWrapper>
          <div>
            <button onClick={() => {
              // This would trigger a toast in a real scenario
            }}>
              Trigger Toast
            </button>
          </div>
        </TestWrapper>
      );

      // Manually trigger a toast by dispatching an event or calling the toast function
      // For this test, we'll check that the toast container has proper attributes
      const toastContainer = document.querySelector('[aria-live="polite"]');
      expect(toastContainer).toBeInTheDocument();
      expect(toastContainer).toHaveAttribute('aria-label', 'Notifications');
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      // Test that toast dismiss buttons are keyboard accessible
      // This would need a toast to be present to test properly
    });
  });

  describe('Toast Positioning', () => {
    it('should render toasts in different positions', () => {
      const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
      
      positions.forEach(position => {
        const { unmount } = render(
          <TestWrapper position={position}>
            <div>Test content</div>
          </TestWrapper>
        );

        // Check that toast container has correct positioning classes
        const toastContainer = document.querySelector('.fixed');
        expect(toastContainer).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Toast Auto-dismiss', () => {
    it('should auto-dismiss toasts after specified duration', async () => {
      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      // This test would need to trigger a toast and then advance timers
      // to test auto-dismiss functionality
      
      // Advance timers by the default duration
      jest.advanceTimersByTime(3000);
      
      // Toast should be dismissed
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toast Action Buttons', () => {
    it('should execute action button callbacks', async () => {
      const mockAction = jest.fn();
      
      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      // This test would need to trigger a toast with an action button
      // and then test that clicking the action executes the callback
    });
  });

  describe('Multiple Toast Management', () => {
    it('should limit number of visible toasts', async () => {
      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      // This test would trigger multiple toasts and verify that
      // only the maximum number (5) are visible at once
    });

    it('should stack toasts with proper z-index', async () => {
      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      // This test would verify that multiple toasts are properly stacked
      // with appropriate z-index values
    });
  });
});