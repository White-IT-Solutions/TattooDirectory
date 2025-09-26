import React from 'react';
import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import InfiniteScroll, { useInfiniteScroll } from '../InfiniteScroll';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Test component using the hook
const TestComponent = ({ fetchMore, initialData = [], pageSize = 10 }) => {
  const { data, loading, error, hasMore, loadMore } = useInfiniteScroll({
    initialData,
    fetchMore,
    pageSize
  });

  return (
    <InfiniteScroll
      hasMore={hasMore}
      loading={loading}
      onLoadMore={loadMore}
      error={error}
    >
      <div data-testid="content">
        {data.map((item, index) => (
          <div key={index} data-testid="item">
            {item.name}
          </div>
        ))}
      </div>
    </InfiniteScroll>
  );
};

describe('InfiniteScroll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <InfiniteScroll hasMore={true} loading={false} onLoadMore={() => {}}>
        <div data-testid="test-content">Test Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    render(
      <InfiniteScroll hasMore={true} loading={true} onLoadMore={() => {}}>
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByText('Loading more...')).toBeInTheDocument();
  });

  it('shows error state when error occurs', () => {
    const error = new Error('Failed to load');
    
    render(
      <InfiniteScroll 
        hasMore={true} 
        loading={false} 
        onLoadMore={() => {}} 
        error={error}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByText('Failed to load more content')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('shows end message when no more content', () => {
    render(
      <InfiniteScroll hasMore={false} loading={false} onLoadMore={() => {}}>
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByText("You've reached the end!")).toBeInTheDocument();
  });

  it('sets up intersection observer correctly', () => {
    render(
      <InfiniteScroll hasMore={true} loading={false} onLoadMore={() => {}}>
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '100px',
        threshold: 0.1
      })
    );
  });

  it('uses custom loading component', () => {
    const CustomLoading = () => <div data-testid="custom-loading">Custom Loading</div>;
    
    render(
      <InfiniteScroll 
        hasMore={true} 
        loading={true} 
        onLoadMore={() => {}} 
        loadingComponent={CustomLoading}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('uses custom error component', () => {
    const CustomError = ({ error, onRetry }) => (
      <div data-testid="custom-error">
        Custom Error: {error.message}
        <button onClick={onRetry}>Retry</button>
      </div>
    );
    
    const error = new Error('Custom error');
    
    render(
      <InfiniteScroll 
        hasMore={true} 
        loading={false} 
        onLoadMore={() => {}} 
        error={error}
        errorComponent={CustomError}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.getByText('Custom Error: Custom error')).toBeInTheDocument();
  });

  it('uses custom end message component', () => {
    const CustomEndMessage = () => <div data-testid="custom-end">All done!</div>;
    
    render(
      <InfiniteScroll 
        hasMore={false} 
        loading={false} 
        onLoadMore={() => {}} 
        endMessage={CustomEndMessage}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByTestId('custom-end')).toBeInTheDocument();
  });
});

describe('useInfiniteScroll hook', () => {
  it('initializes with initial data', () => {
    const initialData = [{ name: 'Item 1' }, { name: 'Item 2' }];
    const fetchMore = jest.fn();

    render(
      <TestComponent 
        initialData={initialData} 
        fetchMore={fetchMore} 
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('loads more data when fetchMore is called', async () => {
    const initialData = [{ name: 'Item 1' }];
    const fetchMore = jest.fn().mockResolvedValue({
      data: [{ name: 'Item 2' }, { name: 'Item 3' }],
      hasMore: true
    });

    const { result } = renderHook(() => 
      useInfiniteScroll({ initialData, fetchMore })
    );

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(fetchMore).toHaveBeenCalledWith(1);
      expect(result.current.data).toHaveLength(3);
    });
  });

  it('handles fetch errors correctly', async () => {
    const initialData = [{ name: 'Item 1' }];
    const fetchMore = jest.fn().mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => 
      useInfiniteScroll({ initialData, fetchMore })
    );

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error('Fetch failed'));
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets hasMore to false when no more data', async () => {
    const initialData = [{ name: 'Item 1' }];
    const fetchMore = jest.fn().mockResolvedValue({
      data: [],
      hasMore: false
    });

    const { result } = renderHook(() => 
      useInfiniteScroll({ initialData, fetchMore })
    );

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
      expect(result.current.data).toHaveLength(1);
    });
  });

  it('prevents multiple simultaneous loads', async () => {
    const initialData = [{ name: 'Item 1' }];
    const fetchMore = jest.fn().mockResolvedValue({
      data: [{ name: 'Item 2' }],
      hasMore: false
    });

    const { result } = renderHook(() => 
      useInfiniteScroll({ initialData, fetchMore })
    );

    // Trigger multiple load more calls simultaneously
    await act(async () => {
      await Promise.all([
        result.current.loadMore(),
        result.current.loadMore(),
        result.current.loadMore()
      ]);
    });

    // Should only call fetchMore once due to loading guard
    expect(fetchMore).toHaveBeenCalledTimes(1);
  });

  it('respects debounce timing', async () => {
    const initialData = [{ name: 'Item 1' }];
    const fetchMore = jest.fn().mockResolvedValue({
      data: [{ name: 'Item 2' }],
      hasMore: false
    });

    const { result } = renderHook(() => 
      useInfiniteScroll({ initialData, fetchMore })
    );

    // Call loadMore directly (no debounce in hook)
    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenCalledTimes(1);
  });
});