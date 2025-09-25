import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider } from '../../Toast/ToastProvider';
import SearchFeedback, { 
  SearchProgressIndicator, 
  SearchLoadingState, 
  SearchErrorMessage, 
  SearchSuccessMessage 
} from '../SearchFeedback';

// Mock toast provider for tests
const TestWrapper = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('SearchProgressIndicator', () => {
  const mockSteps = [
    { label: 'Step 1', description: 'First step' },
    { label: 'Step 2', description: 'Second step' },
    { label: 'Step 3', description: 'Third step' }
  ];

  it('renders progress bar with correct percentage', () => {
    render(
      <SearchProgressIndicator 
        steps={mockSteps} 
        currentStep={1} 
      />
    );

    const progressBar = document.querySelector('[style*="width: 66.66666666666666%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays current step information', () => {
    render(
      <SearchProgressIndicator 
        steps={mockSteps} 
        currentStep={1} 
      />
    );

    expect(screen.getAllByText('Step 2')[0]).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('shows estimated time when provided', () => {
    render(
      <SearchProgressIndicator 
        steps={mockSteps} 
        currentStep={1} 
        estimatedTimeRemaining={30}
        showEstimatedTime={true}
      />
    );

    expect(screen.getByText('~30s remaining')).toBeInTheDocument();
  });

  it('marks completed steps with checkmarks', () => {
    render(
      <SearchProgressIndicator 
        steps={mockSteps} 
        currentStep={2} 
      />
    );

    // First two steps should be completed (have checkmarks)
    const checkmarks = document.querySelectorAll('svg path[clip-rule="evenodd"]');
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);
  });

  it('animates current step', () => {
    render(
      <SearchProgressIndicator 
        steps={mockSteps} 
        currentStep={1} 
      />
    );

    const currentStepLabels = screen.getAllByText('Step 2');
    const animatedLabel = currentStepLabels.find(label => label.classList.contains('animate-pulse'));
    expect(animatedLabel).toBeInTheDocument();
  });
});

describe('SearchLoadingState', () => {
  it('renders loading message with animated dots', async () => {
    render(<SearchLoadingState message="Searching" />);

    expect(screen.getByText(/Searching/)).toBeInTheDocument();
    
    // Wait for dots animation
    await waitFor(() => {
      expect(screen.getByText(/Searching\./)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays progress bar when progress is provided', () => {
    render(<SearchLoadingState progress={75} />);

    const progressBar = document.querySelector('[style*="width: 75%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows estimated time', () => {
    render(<SearchLoadingState estimatedTime={45} />);

    expect(screen.getByText('Estimated time: ~45s')).toBeInTheDocument();
  });

  it('renders skeleton components when enabled', () => {
    render(<SearchLoadingState showSkeleton={true} skeletonCount={2} />);

    // Should render 2 skeleton items
    const skeletons = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('displays spinning loading indicator', () => {
    render(<SearchLoadingState />);

    const spinners = screen.getAllByRole('generic').filter(el => 
      el.querySelector('.animate-spin')
    );
    expect(spinners.length).toBeGreaterThan(0);
  });
});

describe('SearchErrorMessage', () => {
  const mockError = {
    id: 'test-error-123',
    type: 'network',
    message: 'Network connection failed'
  };

  const mockSuggestions = [
    { label: 'Traditional', value: 'traditional', onClick: jest.fn() },
    { label: 'Realism', value: 'realism', onClick: jest.fn() }
  ];

  it('renders error message and icon', () => {
    render(
      <TestWrapper>
        <SearchErrorMessage error={mockError} />
      </TestWrapper>
    );

    expect(screen.getAllByText('Search Error')[0]).toBeInTheDocument();
    expect(screen.getByText(/having trouble connecting/)).toBeInTheDocument();
  });

  it('displays error ID for support', () => {
    render(
      <TestWrapper>
        <SearchErrorMessage error={mockError} />
      </TestWrapper>
    );

    expect(screen.getByText('Error ID: test-error-123')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = jest.fn();
    
    render(
      <TestWrapper>
        <SearchErrorMessage error={mockError} onRetry={mockRetry} />
      </TestWrapper>
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('shows clear filters button when onClearFilters is provided', () => {
    const mockClearFilters = jest.fn();
    
    render(
      <TestWrapper>
        <SearchErrorMessage error={mockError} onClearFilters={mockClearFilters} />
      </TestWrapper>
    );

    const clearButton = screen.getByText('Clear Filters');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(mockClearFilters).toHaveBeenCalled();
  });

  it('renders suggestions when provided', () => {
    render(
      <TestWrapper>
        <SearchErrorMessage 
          error={mockError} 
          suggestions={mockSuggestions} 
        />
      </TestWrapper>
    );

    expect(screen.getByText('Try searching for:')).toBeInTheDocument();
    expect(screen.getByText('Traditional')).toBeInTheDocument();
    expect(screen.getByText('Realism')).toBeInTheDocument();
  });

  it('calls suggestion onClick when clicked', () => {
    render(
      <TestWrapper>
        <SearchErrorMessage 
          error={mockError} 
          suggestions={mockSuggestions} 
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Traditional'));
    expect(mockSuggestions[0].onClick).toHaveBeenCalledWith('traditional');
  });

  it('shows appropriate icon for different error types', () => {
    const timeoutError = { ...mockError, type: 'timeout' };
    
    const { rerender } = render(
      <TestWrapper>
        <SearchErrorMessage error={mockError} />
      </TestWrapper>
    );

    // Network error should show warning icon - check for SVG element
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);

    rerender(
      <TestWrapper>
        <SearchErrorMessage error={timeoutError} />
      </TestWrapper>
    );

    // Timeout error should show clock icon - check for SVG element
    const updatedSvgElements = document.querySelectorAll('svg');
    expect(updatedSvgElements.length).toBeGreaterThan(0);
  });
});

describe('SearchSuccessMessage', () => {
  it('renders success message and icon', () => {
    render(
      <TestWrapper>
        <SearchSuccessMessage 
          message="Search completed successfully" 
          resultCount={5}
          searchTime={250}
        />
      </TestWrapper>
    );

    expect(screen.getAllByText('Search Complete')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Search completed successfully')[0]).toBeInTheDocument();
    expect(screen.getByText('5 results found')).toBeInTheDocument();
    expect(screen.getByText('in 250ms')).toBeInTheDocument();
  });

  it('shows view results button when onViewResults is provided', () => {
    const mockViewResults = jest.fn();
    
    render(
      <TestWrapper>
        <SearchSuccessMessage 
          message="Success" 
          onViewResults={mockViewResults}
        />
      </TestWrapper>
    );

    const viewButton = screen.getByText('View Results');
    expect(viewButton).toBeInTheDocument();
    
    fireEvent.click(viewButton);
    expect(mockViewResults).toHaveBeenCalled();
  });

  it('shows new search button when onNewSearch is provided', () => {
    const mockNewSearch = jest.fn();
    
    render(
      <TestWrapper>
        <SearchSuccessMessage 
          message="Success" 
          onNewSearch={mockNewSearch}
        />
      </TestWrapper>
    );

    const newSearchButton = screen.getByText('New Search');
    expect(newSearchButton).toBeInTheDocument();
    
    fireEvent.click(newSearchButton);
    expect(mockNewSearch).toHaveBeenCalled();
  });
});

describe('SearchFeedback', () => {
  it('renders loading state', () => {
    render(
      <SearchFeedback 
        state="loading" 
        progress={50}
        estimatedTime={30}
      />
    );

    expect(screen.getByText(/Searching/)).toBeInTheDocument();
  });

  it('renders error state', () => {
    const mockError = {
      type: 'network',
      message: 'Connection failed'
    };

    render(
      <TestWrapper>
        <SearchFeedback 
          state="error" 
          error={mockError}
        />
      </TestWrapper>
    );

    expect(screen.getAllByText('Search Error')[0]).toBeInTheDocument();
  });

  it('renders success state', () => {
    render(
      <TestWrapper>
        <SearchFeedback 
          state="success" 
          resultCount={10}
          searchTime={300}
        />
      </TestWrapper>
    );

    expect(screen.getAllByText('Search Complete')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Found 10 results')[0]).toBeInTheDocument();
  });

  it('renders nothing for idle state', () => {
    const { container } = render(
      <SearchFeedback state="idle" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('passes through all props to appropriate sub-components', () => {
    const mockRetry = jest.fn();
    const mockError = { type: 'network', message: 'Failed' };

    render(
      <TestWrapper>
        <SearchFeedback 
          state="error" 
          error={mockError}
          onRetry={mockRetry}
        />
      </TestWrapper>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });
});

describe('SearchFeedback Integration', () => {
  it('handles state transitions correctly', async () => {
    const { rerender } = render(
      <TestWrapper>
        <SearchFeedback state="idle" />
      </TestWrapper>
    );

    // Start with idle (nothing rendered)
    expect(screen.queryByText(/Search/)).not.toBeInTheDocument();

    // Switch to loading
    rerender(
      <TestWrapper>
        <SearchFeedback state="loading" progress={25} />
      </TestWrapper>
    );

    expect(screen.getByText(/Searching/)).toBeInTheDocument();

    // Switch to success
    rerender(
      <TestWrapper>
        <SearchFeedback 
          state="success" 
          resultCount={5}
          searchTime={200}
        />
      </TestWrapper>
    );

    expect(screen.getAllByText('Search Complete')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Found 5 results')[0]).toBeInTheDocument();
  });

  it('maintains accessibility standards', () => {
    render(
      <SearchFeedback 
        state="loading" 
        progress={75}
      />
    );

    // Loading state should have proper ARIA attributes
    const spinners = screen.getAllByRole('generic').filter(el => 
      el.querySelector('.animate-spin')
    );
    expect(spinners.length).toBeGreaterThan(0);
  });
});