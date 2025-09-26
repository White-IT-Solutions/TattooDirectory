"use client";

import React from 'react';
import { 
  Card, 
  CardContent
} from "../../design-system/components/ui";
import { ArtistCardSkeleton } from '../../design-system/components/ui/Skeleton/ArtistCardSkeleton';
import { StudioCardSkeleton, StudioCardSkeletonCompact } from '../../design-system/components/ui/Skeleton/StudioCardSkeleton';
import { Skeleton } from '../../design-system/components/ui/Skeleton/Skeleton';
import { cn } from '../../design-system/utils/cn';

/**
 * SearchLoadingStates Component
 * 
 * Provides comprehensive loading states for search operations:
 * - Search result skeletons with proper animations
 * - Progressive disclosure loading
 * - Staggered loading animations
 * - Search interface loading states
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

// Search header loading skeleton
function SearchHeaderSkeleton({ className }) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="animate-pulse space-y-3">
        {/* Title and result count */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Active filters skeleton */}
        <div className="flex flex-wrap items-center gap-2 p-4 bg-[var(--background-secondary)] rounded-lg">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-18 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Search results grid skeleton with staggered animation
function SearchResultsGridSkeleton({ 
  count = 8, 
  viewMode = "grid",
  staggered = true,
  className 
}) {
  const skeletonItems = Array.from({ length: count }, (_, i) => {
    const delay = staggered ? i * 100 : 0;
    const isArtist = i % 3 !== 0; // Mix of artist and studio cards
    
    return (
      <div 
        key={i} 
        className="animate-pulse"
        style={{ 
          animationDelay: `${delay}ms`,
          animationDuration: '1.5s'
        }}
      >
        {viewMode === "list" ? (
          isArtist ? (
            <ArtistCardSkeleton className="flex items-center p-4" />
          ) : (
            <StudioCardSkeletonCompact />
          )
        ) : (
          isArtist ? (
            <ArtistCardSkeleton />
          ) : (
            <StudioCardSkeleton />
          )
        )}
      </div>
    );
  });

  return (
    <div className={cn(
      viewMode === "grid" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4",
      className
    )}>
      {skeletonItems}
    </div>
  );
}

// Search suggestions loading skeleton
function SearchSuggestionsSkeleton({ count = 6, className }) {
  return (
    <Card className={cn("mt-4", className)}>
      <CardContent className="p-4">
        <div className="animate-pulse space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-[var(--border-secondary)] rounded-lg">
                <Skeleton className="h-6 w-6 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Search filters loading skeleton
function SearchFiltersSkeleton({ className }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="animate-pulse">
        {/* Filter categories */}
        {['Styles', 'Location', 'Difficulty', 'Price Range'].map((category, i) => (
          <div key={category} className="mb-4">
            <Skeleton className="h-5 w-20 mb-2" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 + (i % 3) }, (_, j) => (
                <Skeleton key={j} className="h-8 w-16 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Progressive loading component for search results
function ProgressiveSearchLoading({ 
  stage = 'searching', // 'searching', 'filtering', 'rendering'
  progress = 0,
  className 
}) {
  const stages = {
    searching: {
      title: 'Searching...',
      description: 'Finding matching results',
      icon: '🔍'
    },
    filtering: {
      title: 'Filtering results...',
      description: 'Applying your criteria',
      icon: '🎯'
    },
    rendering: {
      title: 'Loading results...',
      description: 'Preparing your results',
      icon: '📋'
    }
  };

  const currentStage = stages[stage] || stages.searching;

  return (
    <div className={cn("text-center py-12", className)}>
      <div className="animate-pulse">
        <div className="text-4xl mb-4" role="img" aria-label={stage}>
          {currentStage.icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {currentStage.title}
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">
          {currentStage.description}
        </p>
        
        {/* Progress bar */}
        {progress > 0 && (
          <div className="max-w-xs mx-auto">
            <div className="bg-[var(--background-secondary)] rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[var(--interactive-primary)] h-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Search interface loading (for forms, inputs, etc.)
function SearchInterfaceSkeleton({ className }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="animate-pulse">
        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Sort and view options */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Infinite scroll loading indicator
function InfiniteScrollLoader({ className }) {
  return (
    <div className={cn("flex justify-center py-8", className)}>
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--interactive-primary)] border-t-transparent"></div>
        <span className="text-[var(--text-secondary)]">Loading more results...</span>
      </div>
    </div>
  );
}

// Search error loading state (when retrying)
function SearchRetryLoader({ 
  onRetry, 
  retryCount = 0,
  maxRetries = 3,
  className 
}) {
  return (
    <div className={cn("text-center py-8", className)}>
      <div className="animate-pulse">
        <div className="text-3xl mb-3">🔄</div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Retrying search...
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">
          Attempt {retryCount + 1} of {maxRetries}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[var(--interactive-primary)] hover:text-[var(--interactive-primary-hover)] text-sm underline"
          >
            Cancel retry
          </button>
        )}
      </div>
    </div>
  );
}

// Main SearchLoadingStates component
export default function SearchLoadingStates({
  type = 'results', // 'results', 'suggestions', 'filters', 'interface', 'progressive'
  viewMode = 'grid',
  count = 8,
  staggered = true,
  stage = 'searching',
  progress = 0,
  className,
  ...props
}) {
  switch (type) {
    case 'header':
      return <SearchHeaderSkeleton className={className} {...props} />;
    
    case 'results':
      return (
        <SearchResultsGridSkeleton 
          count={count}
          viewMode={viewMode}
          staggered={staggered}
          className={className}
          {...props}
        />
      );
    
    case 'suggestions':
      return <SearchSuggestionsSkeleton className={className} {...props} />;
    
    case 'filters':
      return <SearchFiltersSkeleton className={className} {...props} />;
    
    case 'interface':
      return <SearchInterfaceSkeleton className={className} {...props} />;
    
    case 'progressive':
      return (
        <ProgressiveSearchLoading 
          stage={stage}
          progress={progress}
          className={className}
          {...props}
        />
      );
    
    case 'infinite':
      return <InfiniteScrollLoader className={className} {...props} />;
    
    case 'retry':
      return <SearchRetryLoader className={className} {...props} />;
    
    default:
      return (
        <SearchResultsGridSkeleton 
          count={count}
          viewMode={viewMode}
          staggered={staggered}
          className={className}
          {...props}
        />
      );
  }
}

// Export individual loading components
export {
  SearchHeaderSkeleton,
  SearchResultsGridSkeleton,
  SearchSuggestionsSkeleton,
  SearchFiltersSkeleton,
  SearchInterfaceSkeleton,
  ProgressiveSearchLoading,
  InfiniteScrollLoader,
  SearchRetryLoader
};