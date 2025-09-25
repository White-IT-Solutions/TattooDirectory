import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchFeedbackIntegration from '../../../design-system/components/feedback/SearchFeedbackIntegration/SearchFeedbackIntegration';
import { ToastProvider } from '../../../design-system/components/feedback/Toast/ToastProvider';

// Mock the toast hook
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
};

jest.mock('../../../design-system/components/feedback/Toast', () => ({
  useToast: () => mockToast
}));

// Test wrapper with ToastProvider
const TestWrapper = ({ children }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

describe('SearchFeedbackIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders search input with placeholder', () => {
      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search for artists..."
          />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Search for artists...')).toBeInTheDocument();
    });

    it('handles search input changes', async () => {
      const user = userEvent.setup();
      const mockOnValidatedChange = jest.fn();

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search for artists..."
            onValidatedChange={mockOnValidatedChange}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search for artists...');
      await user.type(searchInput, 'traditional');

      await waitFor(() => {
        expect(mockOnValidatedChange).toHaveBeenCalled();
      });
    });

    it('displays validation feedback', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            searchType="postcode"
            placeholder="Enter UK postcode..."
            enableValidation={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Enter UK postcode...');
      await user.type(searchInput, 'invalid');

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid UK postcode/)).toBeInTheDocument();
      });
    });
  });

  describe('Search Progress', () => {
    it('shows progress indicator during search', async () => {
      const mockOnSearch = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableProgress={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Validating search/)).toBeInTheDocument();
      });
    });

    it('completes progress and shows success toast', async () => {
      const mockOnSearch = jest.fn(() => 
        Promise.resolve({ success: true, count: 5 })
      );

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableProgress={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          expect.stringContaining('Found 5 results'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when search fails', async () => {
      const mockOnSearch = jest.fn(() => 
        Promise.reject(new Error('Network error'))
      );

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableErrorHandling={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Search temporarily unavailable/)).toBeInTheDocument();
      });
    });

    it('shows retry button in error state', async () => {
      const mockOnSearch = jest.fn(() => 
        Promise.reject(new Error('Network error'))
      );

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableErrorHandling={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('handles retry action', async () => {
      const mockOnSearch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, count: 3 });

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableErrorHandling={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      // First search fails
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Retry search
      const retryButton = screen.getByText('Try Again');
      await act(async () => {
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(2);
        expect(mockToast.success).toHaveBeenCalledWith(
          expect.stringContaining('Found 3 results'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Validation States', () => {
    it('prevents search with invalid input', async () => {
      const mockOnSearch = jest.fn();

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            searchType="email"
            placeholder="Enter email..."
            onSearch={mockOnSearch}
            enableValidation={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Enter email...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'invalid-email' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith(
          'Please fix search validation errors before searching',
          expect.any(Object)
        );
        expect(mockOnSearch).not.toHaveBeenCalled();
      });
    });

    it('shows suggestions for invalid input', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            searchType="artistName"
            placeholder="Enter artist name..."
            enableValidation={true}
            showSuggestions={true}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'sar');

      await waitFor(() => {
        expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
      });
    });
  });

  describe('Configuration Options', () => {
    it('disables validation when enableValidation is false', () => {
      const mockOnSearch = jest.fn();

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableValidation={false}
          />
        </TestWrapper>
      );

      // Should render basic input instead of ValidatedSearchInput
      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('disables progress when enableProgress is false', async () => {
      const mockOnSearch = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableProgress={false}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      // Should not show progress indicator
      expect(screen.queryByText(/Validating search/)).not.toBeInTheDocument();
    });

    it('uses custom progress steps', async () => {
      const customSteps = ['Step 1', 'Step 2', 'Step 3'];
      const mockOnSearch = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            enableProgress={true}
            progressSteps={customSteps}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
    });
  });

  describe('Callback Functions', () => {
    it('calls onSuccess when search succeeds', async () => {
      const mockOnSearch = jest.fn(() => Promise.resolve({ success: true, count: 5 }));
      const mockOnSuccess = jest.fn();

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          { success: true, count: 5 },
          'test search'
        );
      });
    });

    it('calls onError when search fails', async () => {
      const mockError = new Error('Network error');
      const mockOnSearch = jest.fn(() => Promise.reject(mockError));
      const mockOnError = jest.fn();

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
            onError={mockOnError}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(mockError, 'test search');
      });
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const mockOnSearch = jest.fn(() => Promise.resolve({ success: true }));

      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
            onSearch={mockOnSearch}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test search', expect.any(Object));
      });
    });

    it('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <SearchFeedbackIntegration 
            placeholder="Search..."
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toHaveAttribute('type', 'search');
    });
  });
});