"use client";

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge, 
  Tag, 
  Button 
} from "../../design-system/components/ui";
import ArtistCard from './ArtistCard';
import StudioCard from '../../design-system/components/ui/StudioCard/StudioCard';
import { ArtistCardSkeleton } from '../../design-system/components/ui/Skeleton/ArtistCardSkeleton';
import { StudioCardSkeleton } from '../../design-system/components/ui/Skeleton/StudioCardSkeleton';
import { enhancedTattooStyles, difficultyLevels } from '../data/testData/enhancedTattooStyles';
import { cn } from '../../design-system/utils/cn';
import { 
  ariaLiveRegion, 
  keyboardNavigation, 
  touchAccessibility,
  ScreenReaderUtils 
} from '../../lib/accessibility-utils';
import { performanceMonitor } from '../../lib/performance-utils';

// Fallback difficulty levels if not imported properly
const fallbackDifficultyLevels = {
  beginner: { label: 'Beginner', color: 'success' },
  intermediate: { label: 'Intermediate', color: 'warning' },
  advanced: { label: 'Advanced', color: 'error' },
  expert: { label: 'Expert', color: 'accent' }
};

/**
 * SearchResultsDisplay Component
 * 
 * Provides consistent search result display with:
 * - Standardized result cards using available components
 * - Loading states with skeleton components
 * - Empty states with actionable suggestions
 * - Result count and filter feedback
 * - Search suggestions for ambiguous terms
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 5.4, 5.5
 */

// Result type configurations
const RESULT_TYPES = {
  artist: { 
    label: "Artist", 
    color: "primary", 
    icon: "👤",
    description: "Tattoo artist profile"
  },
  studio: { 
    label: "Studio", 
    color: "secondary", 
    icon: "🏢",
    description: "Tattoo studio"
  },
  style: { 
    label: "Style", 
    color: "accent", 
    icon: "🎨",
    description: "Tattoo style"
  }
};

// Loading skeleton component with accessibility
function SearchResultsSkeleton({ count = 6, viewMode = "grid" }) {
  const skeletonItems = useMemo(() => 
    Array.from({ length: count }, (_, i) => (
      <div 
        key={i} 
        className="animate-pulse"
        role="status"
        aria-label={`Loading result ${i + 1} of ${count}`}
      >
        {i % 2 === 0 ? (
          <ArtistCardSkeleton />
        ) : (
          <StudioCardSkeleton />
        )}
      </div>
    )), [count]
  );

  return (
    <div 
      className={cn(
        viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading search results"
    >
      {skeletonItems}
      <div className="sr-only">Loading search results, please wait...</div>
    </div>
  );
}

// Empty state component with actionable suggestions
function EmptySearchState({ 
  searchQuery, 
  activeFilters, 
  onClearFilters, 
  onRefineSearch,
  suggestions = []
}) {
  const hasFilters = Object.keys(activeFilters).some(key => 
    activeFilters[key] && (Array.isArray(activeFilters[key]) ? activeFilters[key].length > 0 : true)
  );

  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        No results found
      </h2>
      
      {searchQuery ? (
        <p className="text-[var(--text-secondary)] mb-6">
          No results found for "<strong>{searchQuery}</strong>"
          {hasFilters && " with the current filters"}
        </p>
      ) : (
        <p className="text-[var(--text-secondary)] mb-6">
          Try adjusting your search criteria or removing some filters.
        </p>
      )}

      {/* Search suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Did you mean?
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => suggestion.onClick && suggestion.onClick()}
              >
                {suggestion.icon} {suggestion.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Actionable buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        {hasFilters && (
          <Button
            variant="secondary"
            onClick={onClearFilters}
          >
            Clear All Filters
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onRefineSearch}
        >
          Refine Search
        </Button>
      </div>

      {/* Helpful tips */}
      <div className="mt-8 max-w-md mx-auto">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Search Tips
        </h3>
        <div className="text-sm text-[var(--text-secondary)] space-y-2">
          <p>• Try broader search terms (e.g., "traditional" instead of "sailor jerry")</p>
          <p>• Check your spelling and try alternative terms</p>
          <p>• Remove location filters to see more results</p>
          <p>• Browse by style categories instead of specific searches</p>
        </div>
      </div>
    </div>
  );
}

// Result count and filter summary component
function ResultsSummary({ 
  totalResults, 
  searchQuery, 
  activeFilters, 
  currentPage, 
  resultsPerPage,
  onRemoveFilter,
  onClearFilters 
}) {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);
  
  const hasActiveFilters = Object.keys(activeFilters).some(key => 
    activeFilters[key] && (Array.isArray(activeFilters[key]) ? activeFilters[key].length > 0 : true)
  );

  return (
    <div className="mb-6">
      {/* Results count */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Search Results
          </h2>
          <p className="text-[var(--text-secondary)] mt-1">
            {totalResults > 0 ? (
              <>
                Showing {startResult}-{endResult} of {totalResults} results
                {searchQuery && ` for "${searchQuery}"`}
              </>
            ) : (
              <>
                No results found
                {searchQuery && ` for "${searchQuery}"`}
              </>
            )}
          </p>
        </div>

        {/* Results per page indicator */}
        {totalResults > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="ghost" size="sm">
              {totalResults} total results
            </Badge>
          </div>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-4 bg-[var(--background-secondary)] rounded-lg">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Active filters:
          </span>
          
          {/* Style filters */}
          {activeFilters.styles?.map(styleId => (
            <Tag
              key={`style-${styleId}`}
              variant="primary"
              size="sm"
              removable
              onRemove={() => onRemoveFilter('styles', styleId)}
            >
              {enhancedTattooStyles[styleId]?.name || styleId}
            </Tag>
          ))}

          {/* Difficulty filters */}
          {activeFilters.difficulty?.map(diff => (
            <Tag
              key={`difficulty-${diff}`}
              variant={(difficultyLevels || fallbackDifficultyLevels)[diff]?.color || 'secondary'}
              size="sm"
              removable
              onRemove={() => onRemoveFilter('difficulty', diff)}
            >
              {(difficultyLevels || fallbackDifficultyLevels)[diff]?.label || 
               (diff ? diff.charAt(0).toUpperCase() + diff.slice(1) : 'Unknown')}
            </Tag>
          ))}

          {/* Location filter */}
          {activeFilters.location && (
            <Tag
              variant="secondary"
              size="sm"
              removable
              onRemove={() => onRemoveFilter('location', activeFilters.location)}
            >
              📍 {activeFilters.location}
            </Tag>
          )}

          {/* Rating filter */}
          {activeFilters.rating > 0 && (
            <Tag
              variant="warning"
              size="sm"
              removable
              onRemove={() => onRemoveFilter('rating', activeFilters.rating)}
            >
              ⭐ {activeFilters.rating}+ stars
            </Tag>
          )}

          {/* Experience filters */}
          {activeFilters.experience?.map(exp => (
            <Tag
              key={`experience-${exp}`}
              variant="accent"
              size="sm"
              removable
              onRemove={() => onRemoveFilter('experience', exp)}
            >
              {exp}
            </Tag>
          ))}

          {/* Price range filters */}
          {activeFilters.priceRange?.map(price => (
            <Tag
              key={`price-${price}`}
              variant="success"
              size="sm"
              removable
              onRemove={() => onRemoveFilter('priceRange', price)}
            >
              💰 {price}
            </Tag>
          ))}

          {/* Clear all button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearFilters}
            className="ml-2"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

// Individual result card component with accessibility
function SearchResultCard({ result, viewMode = "grid", onClick, index, total }) {
  const resultType = RESULT_TYPES[result.type] || RESULT_TYPES.artist;
  const cardRef = useRef(null);

  // Generate accessible label
  const accessibleLabel = useMemo(() => 
    ScreenReaderUtils.createSearchResultLabel(result, index, total),
    [result, index, total]
  );

  // Ensure touch targets meet accessibility requirements
  useEffect(() => {
    if (cardRef.current) {
      touchAccessibility.ensureTouchTarget(cardRef.current, 44);
    }
  }, []);

  const handleClick = useCallback((event) => {
    if (onClick) {
      onClick(result, event);
    }
  }, [onClick, result]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  }, [handleClick]);

  // Use specialized components for artists and studios
  if (result.type === 'artist') {
    return (
      <div 
        ref={cardRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 rounded-lg"
        role="button"
        tabIndex={0}
        aria-label={accessibleLabel}
      >
        <ArtistCard artist={result} />
      </div>
    );
  }

  if (result.type === 'studio') {
    return (
      <div 
        ref={cardRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 rounded-lg"
        role="button"
        tabIndex={0}
        aria-label={accessibleLabel}
      >
        <StudioCard 
          studio={result} 
          size={viewMode === 'list' ? 'sm' : 'md'}
        />
      </div>
    );
  }

  // Generic card for styles and other result types
  return (
    <Card 
      elevation="medium"
      className={cn(
        "hover:elevation-high transition-all duration-200 cursor-pointer",
        viewMode === "list" && "flex items-center p-4"
      )}
      onClick={onClick}
    >
      <CardHeader className={viewMode === "list" ? "flex-row items-center gap-4 pb-0" : ""}>
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-2">
            <Badge 
              variant={resultType.color}
              size="sm"
            >
              {resultType.icon} {resultType.label}
            </Badge>
            {result.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm font-medium">{result.rating}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={viewMode === "list" ? "flex-1" : ""}>
        <CardTitle className="text-lg mb-1">
          {result.name}
        </CardTitle>
        
        {result.type === 'style' && (
          <>
            <CardDescription className="mb-2">
              {result.description}
            </CardDescription>
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={(difficultyLevels || fallbackDifficultyLevels)[result.difficulty]?.color || 'secondary'}
                size="sm"
              >
                {(difficultyLevels || fallbackDifficultyLevels)[result.difficulty]?.label || 
                 (result.difficulty ? result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1) : 'Unknown')}
              </Badge>
              <span className="text-sm text-[var(--text-secondary)]">
                {result.popularity}% popularity
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.characteristics?.slice(0, 3).map(char => (
                <Tag key={char} variant="secondary" size="sm">
                  {char}
                </Tag>
              ))}
              {result.characteristics?.length > 3 && (
                <Tag variant="ghost" size="sm">
                  +{result.characteristics.length - 3} more
                </Tag>
              )}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className={viewMode === "list" ? "pt-0" : ""}>
        <Button
          size="sm"
          variant="secondary"
          className={viewMode === "list" ? "ml-auto" : "w-full"}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main SearchResultsDisplay component with performance monitoring
export default function SearchResultsDisplay({
  results = [],
  loading = false,
  searchQuery = "",
  activeFilters = {},
  viewMode = "grid",
  currentPage = 1,
  resultsPerPage = 20,
  totalResults = 0,
  suggestions = [],
  onResultClick,
  onRemoveFilter,
  onClearFilters,
  onRefineSearch,
  className
}) {
  const containerRef = useRef(null);

  // Performance monitoring for render time
  useEffect(() => {
    const operationName = `search_results_render_${results.length}_items`;
    performanceMonitor.startTiming(operationName);
    
    return () => {
      performanceMonitor.endTiming(operationName);
    };
  }, [results.length]);

  // Memoized results for performance
  const memoizedResults = useMemo(() => results, [results]);

  // Optimized event handlers
  const handleResultClick = useCallback((result, event) => {
    if (onResultClick) {
      onResultClick(result, event);
    }
  }, [onResultClick]);

  const handleRemoveFilter = useCallback((filterType, value) => {
    if (onRemoveFilter) {
      onRemoveFilter(filterType, value);
      ariaLiveRegion.announceFilterChange(filterType, value, false);
    }
  }, [onRemoveFilter]);

  const handleClearFilters = useCallback(() => {
    if (onClearFilters) {
      onClearFilters();
      ariaLiveRegion.announce('All filters cleared', 'polite');
    }
  }, [onClearFilters]);

  const handleRefineSearch = useCallback(() => {
    if (onRefineSearch) {
      onRefineSearch();
    }
  }, [onRefineSearch]);
  // Show loading state
  if (loading) {
    return (
      <div className={className}>
        <div className="mb-6">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--background-secondary)] rounded w-48 mb-2"></div>
            <div className="h-4 bg-[var(--background-secondary)] rounded w-64"></div>
          </div>
        </div>
        <SearchResultsSkeleton count={resultsPerPage} viewMode={viewMode} />
      </div>
    );
  }

  // Show empty state
  if (!loading && results.length === 0) {
    return (
      <div className={className}>
        <ResultsSummary
          totalResults={0}
          searchQuery={searchQuery}
          activeFilters={activeFilters}
          currentPage={currentPage}
          resultsPerPage={resultsPerPage}
          onRemoveFilter={onRemoveFilter}
          onClearFilters={onClearFilters}
        />
        <EmptySearchState
          searchQuery={searchQuery}
          activeFilters={activeFilters}
          onClearFilters={onClearFilters}
          onRefineSearch={onRefineSearch}
          suggestions={suggestions}
        />
      </div>
    );
  }

  // Show results
  return (
    <div className={className} ref={containerRef}>
      <ResultsSummary
        totalResults={totalResults}
        searchQuery={searchQuery}
        activeFilters={activeFilters}
        currentPage={currentPage}
        resultsPerPage={resultsPerPage}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Results grid/list with accessibility */}
      <div 
        className={cn(
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        )}
        role="region"
        aria-label={`Search results, ${totalResults} items found`}
        aria-live="polite"
      >
        {memoizedResults.map((result, index) => (
          <SearchResultCard
            key={`${result.type}-${result.id || result.name || index}`}
            result={result}
            viewMode={viewMode}
            onClick={handleResultClick}
            index={index}
            total={totalResults}
          />
        ))}
      </div>
    </div>
  );
}

// Export sub-components for individual use
export {
  SearchResultsSkeleton,
  EmptySearchState,
  ResultsSummary,
  SearchResultCard
};