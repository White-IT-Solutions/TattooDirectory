import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { 
  ProgressiveImage, 
  StaggeredLoader, 
  ContentPlaceholder, 
  InfiniteScrollLoader,
  SkeletonList,
  useLoadingState 
} from '../ProgressiveLoading';

// Mock component for testing useLoadingState hook
function TestLoadingStateComponent() {
  const { isLoading, error, startLoading, stopLoading, setLoadingError } = useLoadingState();
  
  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error-state">{error || 'no-error'}</div>
      <button onClick={startLoading} data-testid="start-loading">Start</button>
      <button onClick={stopLoading} data-testid="stop-loading">Stop</button>
      <button onClick={() => setLoadingError('test error')} data-testid="set-error">Error</button>
    </div>
  );
}

describe('ProgressiveImage', () => {
  it('shows skeleton while loading', () => {
    const { container } = render(
      <ProgressiveImage 
        src="https://example.com/test.jpg" 
        alt="Test image"
        data-testid="progressive-image"
      />
    );
    
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('hides skeleton when image loads', async () => {
    const { container } = render(
      <ProgressiveImage 
        src="https://example.com/test.jpg" 
        alt="Test image"
        data-testid="progressive-image"
      />
    );
    
    const image = container.querySelector('img');
    
    // Simulate image load
    act(() => {
      fireEvent.load(image);
    });
    
    await waitFor(() => {
      expect(image).toHaveClass('opacity-100');
    });
  });

  it('shows error state when image fails to load', async () => {
    const { container } = render(
      <ProgressiveImage 
        src="https://example.com/invalid.jpg" 
        alt="Test image"
        data-testid="progressive-image"
      />
    );
    
    const image = container.querySelector('img');
    
    // Simulate image error
    act(() => {
      fireEvent.error(image);
    });
    
    await waitFor(() => {
      const errorIcon = container.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  it('renders with onLoad callback prop', () => {
    const onLoad = jest.fn();
    const { container } = render(
      <ProgressiveImage 
        src="https://example.com/test.jpg" 
        alt="Test image"
        onLoad={onLoad}
      />
    );
    
    // Just verify the component renders with the callback prop
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('StaggeredLoader', () => {
  it('renders all children', () => {
    const children = [
      <div key="1" data-testid="item-1">Item 1</div>,
      <div key="2" data-testid="item-2">Item 2</div>,
      <div key="3" data-testid="item-3">Item 3</div>,
    ];

    render(
      <StaggeredLoader delay={100} data-testid="staggered-loader">
        {children}
      </StaggeredLoader>
    );

    // All items should be rendered
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-3')).toBeInTheDocument();
  });

  it('handles single child correctly', () => {
    render(
      <StaggeredLoader data-testid="staggered-loader">
        <div data-testid="single-item">Single Item</div>
      </StaggeredLoader>
    );

    expect(screen.getByTestId('single-item')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <StaggeredLoader className="custom-class" data-testid="staggered-loader">
        <div>Item</div>
      </StaggeredLoader>
    );

    expect(screen.getByTestId('staggered-loader')).toHaveClass('custom-class');
  });
});

describe('ContentPlaceholder', () => {
  it('shows skeleton when loading', () => {
    const skeleton = <div data-testid="skeleton">Loading...</div>;
    const content = <div data-testid="content">Content</div>;

    render(
      <ContentPlaceholder 
        isLoading={true} 
        skeleton={skeleton}
        data-testid="placeholder"
      >
        {content}
      </ContentPlaceholder>
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('shows content when not loading', () => {
    const skeleton = <div data-testid="skeleton">Loading...</div>;
    const content = <div data-testid="content">Content</div>;

    render(
      <ContentPlaceholder 
        isLoading={false} 
        skeleton={skeleton}
        data-testid="placeholder"
      >
        {content}
      </ContentPlaceholder>
    );

    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});

describe('InfiniteScrollLoader', () => {
  it('shows loading indicator when loading', () => {
    render(
      <InfiniteScrollLoader 
        isLoading={true} 
        hasMore={true}
        data-testid="infinite-loader"
      />
    );

    expect(screen.getByText('Loading more...')).toBeInTheDocument();
    expect(screen.getByTestId('infinite-loader')).toBeInTheDocument();
  });

  it('shows end message when no more items', () => {
    render(
      <InfiniteScrollLoader 
        isLoading={false} 
        hasMore={false}
        data-testid="infinite-loader"
      />
    );

    expect(screen.getByText('No more items to load')).toBeInTheDocument();
  });

  it('renders nothing when not loading and has more', () => {
    const { container } = render(
      <InfiniteScrollLoader 
        isLoading={false} 
        hasMore={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('SkeletonList', () => {
  it('renders default number of items (5)', () => {
    const itemSkeleton = <div data-testid="skeleton-item">Skeleton</div>;
    const { container } = render(
      <SkeletonList 
        itemSkeleton={itemSkeleton}
        data-testid="skeleton-list"
      />
    );

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    expect(items).toHaveLength(5);
  });

  it('renders custom number of items', () => {
    const itemSkeleton = <div data-testid="skeleton-item">Skeleton</div>;
    const { container } = render(
      <SkeletonList 
        count={3}
        itemSkeleton={itemSkeleton}
        data-testid="skeleton-list"
      />
    );

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    expect(items).toHaveLength(3);
  });

  it('calls function skeleton with index', () => {
    const itemSkeleton = jest.fn((index) => <div data-testid={`item-${index}`}>Item {index}</div>);
    
    render(
      <SkeletonList 
        count={2}
        itemSkeleton={itemSkeleton}
        data-testid="skeleton-list"
      />
    );

    expect(itemSkeleton).toHaveBeenCalledWith(0);
    expect(itemSkeleton).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('item-0')).toBeInTheDocument();
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
  });
});

describe('useLoadingState', () => {
  it('initializes with default loading state', () => {
    render(<TestLoadingStateComponent />);
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
    expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
  });

  it('can start and stop loading', () => {
    render(<TestLoadingStateComponent />);
    
    // Stop loading
    fireEvent.click(screen.getByTestId('stop-loading'));
    expect(screen.getByTestId('loading-state')).toHaveTextContent('not-loading');
    
    // Start loading
    fireEvent.click(screen.getByTestId('start-loading'));
    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
    expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
  });

  it('can set error state', () => {
    render(<TestLoadingStateComponent />);
    
    fireEvent.click(screen.getByTestId('set-error'));
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('error-state')).toHaveTextContent('test error');
  });
});