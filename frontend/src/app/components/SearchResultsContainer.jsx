"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SearchResultsDisplay from './SearchResultsDisplay';
import SearchFeedbackSystem from './SearchFeedbackSystem';
import SearchLoadingStates from './SearchLoadingStates';
import searchController from '../lib/searchController';
import { enhancedTattooStyles } from '../data/testData/enhancedTattooStyles';
import { cn } from '../../design-system/utils/cn';

/**
 * SearchResultsContainer Component
 * 
 * Comprehensive container that orchestrates all search result display components:
 * - Integrates SearchResultsDisplay for consistent result cards
 * - Uses SearchFeedbackSystem for suggestions and tips
 * - Implements SearchLoadingStates for all loading scenarios
 * - Manages search state and user interactions
 * - Provides search suggestions for ambiguous terms
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 5.4, 5.5, 12.1, 12.2, 12.3
 */

export default function SearchResultsContainer({
  searchQuery = "",
  activeFilters = {},
  viewMode = "grid",
  sortBy = "relevance",
  resultsPerPage = 20,
  onFiltersChange,
  onViewModeChange,
  onSortChange,
  className
}) {
  const router = useRouter();
  
  // Search state
  const [searchState, setSearchState] = useState({
    results: [],
    loading: false,
    error: null,
    totalResults: 0,
    currentPage: 1,
    hasMore: false
  });

  // UI state
  const [showFeedback, setShowFeedback] = useState(true);
  const [loadingStage, setLoadingStage] = useState('searching');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Generate search suggestions for ambiguous terms
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchState.results.length > 0) return [];

    const suggestions = [];
    const query = searchQuery.toLowerCase().trim();

    // Check for partial matches in styles
    Object.values(enhancedTattooStyles).forEach(style => {
      const nameMatch = style.name.toLowerCase().includes(query);
      const aliasMatch = style.aliases.some(alias => 
        alias.toLowerCase().includes(query)
      );
      
      if (nameMatch || aliasMatch) {
        suggestions.push({
          type: 'style',
          text: style.name,
          subtitle: `Try searching for "${style.name}" instead`,
          icon: '🎨',
          onClick: () => handleSuggestionClick({ text: style.name, type: 'style' })
        });
      }
    });

    // Add spelling suggestions
    const commonMisspellings = {
      'tradional': 'traditional',
      'realisim': 'realism',
      'geometic': 'geometric',
      'watercolour': 'watercolor'
    };

    if (commonMisspellings[query]) {
      suggestions.unshift({
        type: 'correction',
        text: commonMisspellings[query],
        subtitle: `Did you mean "${commonMisspellings[query]}"?`,
        icon: '🔤',
        onClick: () => handleSuggestionClick({ text: commonMisspellings[query], type: 'correction' })
      });
    }

    return suggestions.slice(0, 6);
  }, [searchQuery, searchState.results.length]);

  // Execute search when parameters change
  useEffect(() => {
    if (searchQuery || Object.keys(activeFilters).length > 0) {
      executeSearch();
    } else {
      // Clear results when no search criteria
      setSearchState(prev => ({
        ...prev,
        results: [],
        totalResults: 0,
        loading: false,
        error: null
      }));
    }
  }, [searchQuery, activeFilters, sortBy]);

  // Execute search with loading states
  const executeSearch = async () => {
    try {
      setSearchState(prev => ({ ...prev, loading: true, error: null }));
      setLoadingStage('searching');
      setLoadingProgress(0);

      // Simulate progressive loading
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Execute search
      const results = await searchController.executeSearch(searchQuery, {
        ...activeFilters,
        sortBy,
        resultTypes: ['artist', 'studio', 'style']
      });

      setLoadingStage('filtering');
      setLoadingProgress(95);

      // Simulate filtering delay
      await new Promise(resolve => setTimeout(resolve, 200));

      setLoadingStage('rendering');
      setLoadingProgress(100);

      // Update state
      setSearchState(prev => ({
        ...prev,
        results,
        totalResults: results.length,
        loading: false,
        currentPage: 1,
        hasMore: results.length > resultsPerPage
      }));

      clearInterval(progressInterval);
      setLoadingProgress(0);

    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Search failed. Please try again.'
      }));
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setSearchState(prev => ({ ...prev, currentPage: page }));
    
    // Scroll to top of results
    const resultsElement = document.getElementById('search-results');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    const routes = {
      artist: `/artists/${result.artistId || result.id}`,
      studio: `/studios/${result.studioId || result.id}`,
      style: `/styles?style=${result.id}`
    };

    const route = routes[result.type];
    if (route) {
      router.push(route);
    }
  };

  // Handle filter removal
  const handleRemoveFilter = (filterType, value) => {
    const newFilters = { ...activeFilters };
    
    if (Array.isArray(newFilters[filterType])) {
      newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
      if (newFilters[filterType].length === 0) {
        delete newFilters[filterType];
      }
    } else {
      delete newFilters[filterType];
    }

    onFiltersChange && onFiltersChange(newFilters);
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    onFiltersChange && onFiltersChange({});
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'style' || suggestion.type === 'correction') {
      // Update search query
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('q', suggestion.text);
      router.push(newUrl.toString());
    } else if (suggestion.type === 'location') {
      // Update location filter
      const newFilters = { ...activeFilters, location: suggestion.text };
      onFiltersChange && onFiltersChange(newFilters);
    }
  };

  // Handle popular search click
  const handlePopularSearchClick = (searchText) => {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('q', searchText);
    router.push(newUrl.toString());
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    if (category.id) {
      const newFilters = { 
        ...activeFilters, 
        styles: [...(activeFilters.styles || []), category.id]
      };
      onFiltersChange && onFiltersChange(newFilters);
    }
  };

  // Handle refine search
  const handleRefineSearch = () => {
    setShowFeedback(true);
    // Could open advanced search modal here
  };

  // Get paginated results
  const paginatedResults = useMemo(() => {
    const startIndex = (searchState.currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return searchState.results.slice(startIndex, endIndex);
  }, [searchState.results, searchState.currentPage, resultsPerPage]);

  const totalPages = Math.ceil(searchState.totalResults / resultsPerPage);

  return (
    <div className={cn("space-y-6", className)} id="search-results">
      {/* Loading state */}
      {searchState.loading && (
        <div className="space-y-6">
          <SearchLoadingStates type="header" />
          <SearchLoadingStates 
            type="progressive" 
            stage={loadingStage}
            progress={loadingProgress}
          />
          <SearchLoadingStates 
            type="results" 
            viewMode={viewMode}
            count={resultsPerPage}
            staggered={true}
          />
        </div>
      )}

      {/* Error state */}
      {searchState.error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Search Error
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {searchState.error}
          </p>
          <button
            onClick={executeSearch}
            className="px-4 py-2 bg-[var(--interactive-primary)] text-white rounded-lg hover:bg-[var(--interactive-primary-hover)] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results display */}
      {!searchState.loading && !searchState.error && (
        <>
          <SearchResultsDisplay
            results={paginatedResults}
            loading={searchState.loading}
            searchQuery={searchQuery}
            activeFilters={activeFilters}
            viewMode={viewMode}
            currentPage={searchState.currentPage}
            resultsPerPage={resultsPerPage}
            totalResults={searchState.totalResults}
            suggestions={searchSuggestions}
            onResultClick={handleResultClick}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            onRefineSearch={handleRefineSearch}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(searchState.currentPage - 1)}
                disabled={searchState.currentPage === 1}
                className="px-4 py-2 text-sm border border-[var(--border-primary)] rounded-lg hover:bg-[var(--background-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        "px-3 py-1 text-sm rounded transition-colors",
                        searchState.currentPage === page
                          ? "bg-[var(--interactive-primary)] text-white"
                          : "bg-white text-[var(--text-primary)] hover:bg-[var(--background-secondary)] border border-[var(--border-primary)]"
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(searchState.currentPage + 1)}
                disabled={searchState.currentPage === totalPages}
                className="px-4 py-2 text-sm border border-[var(--border-primary)] rounded-lg hover:bg-[var(--background-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Search feedback system */}
          {showFeedback && (searchState.results.length === 0 || searchQuery.length < 3) && (
            <SearchFeedbackSystem
              searchQuery={searchQuery}
              activeFilters={activeFilters}
              showSuggestions={searchQuery.length > 0}
              showTips={true}
              showPopular={!searchQuery}
              showRelated={true}
              onSuggestionClick={handleSuggestionClick}
              onSearchClick={handlePopularSearchClick}
              onCategoryClick={handleCategoryClick}
            />
          )}
        </>
      )}
    </div>
  );
}