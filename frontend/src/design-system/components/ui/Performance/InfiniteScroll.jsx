"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../../utils/cn';

/**
 * InfiniteScroll Component
 * 
 * Implements infinite scrolling for artist and studio listings
 * 
 * Features:
 * - Intersection Observer for scroll detection
 * - Configurable loading thresholds
 * - Loading states and error handling
 * - Performance optimized with debouncing
 * - Supports both vertical and horizontal scrolling
 * 
 * Requirements: 12.2
 */

const InfiniteScroll = ({
  children,
  hasMore = true,
  loading = false,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px',
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  endMessage: EndMessage,
  className,
  error = null,
  retryOnError = true,
  debounceMs = 300,
  ...props
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);
  const timeoutRef = useRef(null);

  // Debounced load more function
  const debouncedLoadMore = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (!loading && !isLoadingMore && hasMore && !error && onLoadMore) {
        setIsLoadingMore(true);
        Promise.resolve(onLoadMore()).finally(() => {
          setIsLoadingMore(false);
        });
      }
    }, debounceMs);
  }, [loading, isLoadingMore, hasMore, error, onLoadMore, debounceMs]);

  // Set up intersection observer
  useEffect(() => {
    const currentLoadingRef = loadingRef.current;
    if (!currentLoadingRef || !hasMore || loading || error) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          debouncedLoadMore();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observerRef.current.observe(currentLoadingRef);

    return () => {
      observerRef.current?.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasMore, loading, error, rootMargin, threshold]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (error && retryOnError) {
      debouncedLoadMore();
    }
  }, [error, retryOnError, debouncedLoadMore]);

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Main content */}
      {children}

      {/* Loading indicator */}
      {(hasMore && !error) && (
        <div
          ref={loadingRef}
          className="flex justify-center items-center py-8"
        >
          {(loading || isLoadingMore) && (
            LoadingComponent ? (
              <LoadingComponent />
            ) : (
              <DefaultLoadingComponent />
            )
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex justify-center items-center py-8">
          {ErrorComponent ? (
            <ErrorComponent error={error} onRetry={handleRetry} />
          ) : (
            <DefaultErrorComponent error={error} onRetry={handleRetry} />
          )}
        </div>
      )}

      {/* End message */}
      {!hasMore && !error && (
        <div className="flex justify-center items-center py-8">
          {EndMessage ? (
            <EndMessage />
          ) : (
            <DefaultEndMessage />
          )}
        </div>
      )}
    </div>
  );
};

// Default loading component
const DefaultLoadingComponent = () => (
  <div className="flex items-center space-x-2 text-neutral-600" data-testid="loading">
    <div className="w-6 h-6 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
    <span className="text-sm">Loading more...</span>
  </div>
);

// Default error component
const DefaultErrorComponent = ({ error, onRetry }) => (
  <div className="text-center" data-testid="error">
    <div className="text-red-600 mb-2">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p className="text-sm font-medium">Error: {error?.message || 'Failed to load more content'}</p>
    </div>
    <button
      onClick={onRetry}
      className="px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Default end message component
const DefaultEndMessage = () => (
  <div className="text-center text-neutral-500">
    <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
    </svg>
    <p className="text-sm">You've reached the end!</p>
  </div>
);

/**
 * Hook for managing infinite scroll state
 */
export const useInfiniteScroll = ({
  initialData = [],
  fetchMore,
  pageSize = 20,
  hasMoreInitial = true
}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || loading || !hasMore) return Promise.resolve();

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const result = await fetchMore(page);
      
      if (result.data && result.data.length > 0) {
        setData(prevData => [...prevData, ...result.data]);
        setPage(prevPage => prevPage + 1);
        
        // Check if we have more data
        if (result.data.length < pageSize || result.hasMore === false) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [loading, hasMore, page, fetchMore, pageSize]);

  const reset = useCallback(() => {
    setData(initialData);
    setPage(1);
    setHasMore(hasMoreInitial);
    setError(null);
    setLoading(false);
  }, [initialData, hasMoreInitial]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  };
};

export default InfiniteScroll;