"use client";

import { useState, useCallback, useEffect } from 'react';
import InfiniteScroll, { useInfiniteScroll } from './InfiniteScroll';
import EnhancedArtistCard from './EnhancedArtistCard';
import { ArtistCardSkeleton } from '../Skeleton';
import { EmptyState } from '../../feedback/EmptyState';
import { cn } from '../../../utils/cn';

/**
 * Enhanced Artist Listing with Performance Optimizations
 * 
 * Features:
 * - Infinite scroll for large datasets
 * - Lazy loading of artist cards
 * - Progressive image loading
 * - Connection-aware optimization
 * - Virtual scrolling for very large lists
 * 
 * Requirements: 12.1, 12.2, 12.3
 */

const EnhancedArtistListing = ({
  initialArtists = [],
  fetchMoreArtists,
  pageSize = 20,
  className,
  cardSize = 'medium',
  showPortfolio = true,
  showContact = true,
  emptyMessage = "No artists found",
  loadingMessage = "Loading more artists...",
  errorMessage = "Failed to load more artists",
  onArtistClick,
  ...props
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  const {
    data: artists,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  } = useInfiniteScroll({
    initialData: initialArtists,
    fetchMore: fetchMoreArtists,
    pageSize
  });

  // Handle artist card click
  const handleArtistClick = useCallback((artist) => {
    onArtistClick?.(artist);
  }, [onArtistClick]);

  // Handle view mode change
  const handleViewModeChange = useCallback((newViewMode) => {
    setViewMode(newViewMode);
  }, []);

  // Grid layout classes
  const gridClasses = {
    small: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    medium: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    large: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  // Loading skeleton component
  const LoadingComponent = () => (
    <div className={cn(
      'grid gap-6',
      viewMode === 'grid' ? gridClasses[cardSize] : 'grid-cols-1'
    )}>
      {[...Array(pageSize)].map((_, index) => (
        <ArtistCardSkeleton key={index} />
      ))}
    </div>
  );

  // Error component
  const ErrorComponent = ({ error, onRetry }) => (
    <div className="text-center py-8">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="font-medium">{errorMessage}</p>
        <p className="text-sm text-neutral-500 mt-1">{error?.message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  // End message component
  const EndMessage = () => (
    <div className="text-center py-8 text-neutral-500">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
      <p>You've seen all available artists!</p>
    </div>
  );

  // Empty state
  if (artists.length === 0 && !loading && !error) {
    return (
      <EmptyState
        title="No Artists Found"
        description={emptyMessage}
        action={{
          label: "Browse All Artists",
          onClick: () => window.location.href = "/artists"
        }}
      />
    );
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* View Mode Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-600">
            {artists.length} artist{artists.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
            aria-label="Grid view"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          
          <button
            onClick={() => handleViewModeChange('list')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
            aria-label="List view"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Artist Grid/List */}
      <InfiniteScroll
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
        loadingComponent={LoadingComponent}
        errorComponent={ErrorComponent}
        endMessage={EndMessage}
        error={error}
        className="w-full"
      >
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid' ? gridClasses[cardSize] : 'grid-cols-1'
        )}>
          {artists.map((artist, index) => (
            <EnhancedArtistCard
              key={artist.artistId || artist.id || index}
              artist={artist}
              size={viewMode === 'list' ? 'large' : cardSize}
              showPortfolio={showPortfolio}
              showContact={showContact}
              onCardClick={handleArtistClick}
              className={cn(
                'transition-all duration-200',
                viewMode === 'list' && 'flex-row items-center'
              )}
            />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

/**
 * Hook for managing artist listing data
 */
export const useArtistListing = ({
  searchQuery = {},
  apiEndpoint = '/api/artists',
  pageSize = 20
}) => {
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState(searchQuery);

  const fetchArtists = useCallback(async (page = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...filters
    });

    const response = await fetch(`${apiEndpoint}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch artists: ${response.statusText}`);
    }

    const data = await response.json();
    
    setTotalCount(data.total || 0);
    
    return {
      data: data.artists || [],
      hasMore: data.hasMore !== false && (data.artists?.length || 0) === pageSize
    };
  }, [apiEndpoint, pageSize, filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    fetchArtists,
    updateFilters,
    clearFilters,
    totalCount,
    filters
  };
};

export default EnhancedArtistListing;