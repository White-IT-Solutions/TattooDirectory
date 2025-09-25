/**
 * Example component demonstrating how to use the Enhanced Search Controller
 * 
 * This example shows the basic usage patterns for the search functionality
 * including text search, filters, and search history.
 */

import React from 'react';
import { useSearchController, useDebouncedSearch, SearchQuery } from '../useSearchController.js';

export function SearchExample() {
  const {
    searchState,
    executeSearch,
    applyFilters,
    clearFilters,
    recentSearches,
    hasResults,
    isSearching,
    searchError,
    totalResults
  } = useSearchController();

  const {
    searchText,
    debouncedText,
    updateSearchText,
    clearSearchText,
    isDebouncing
  } = useDebouncedSearch(300);

  // Execute search when debounced text changes
  React.useEffect(() => {
    if (debouncedText) {
      const query = new SearchQuery({ text: debouncedText });
      executeSearch(query);
    }
  }, [debouncedText, executeSearch]);

  const handleStyleFilter = (styleId) => {
    const currentStyles = searchState.query?.styles || [];
    const newStyles = currentStyles.includes(styleId)
      ? currentStyles.filter(id => id !== styleId)
      : [...currentStyles, styleId];
    
    applyFilters({ styles: newStyles });
  };

  const handleRecentSearch = (recentQuery) => {
    executeSearch(recentQuery);
    updateSearchText(recentQuery.text || '');
  };

  return (
    <div className="search-example p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Enhanced Search Example</h2>
      
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => updateSearchText(e.target.value)}
            placeholder="Search for artists, styles, or locations..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isDebouncing && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {searchText && (
            <button
              onClick={clearSearchText}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Style Filters */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Style Filters</h3>
        <div className="flex flex-wrap gap-2">
          {['old_school', 'realism', 'watercolor', 'geometric', 'minimalist'].map(styleId => {
            const isActive = searchState.query?.styles?.includes(styleId);
            return (
              <button
                key={styleId}
                onClick={() => handleStyleFilter(styleId)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {styleId.replace('_', ' ')}
              </button>
            );
          })}
        </div>
        {searchState.query?.styles?.length > 0 && (
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Search Status */}
      <div className="mb-6">
        {isSearching && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
            Searching...
          </div>
        )}
        
        {searchError && (
          <div className="text-red-600 bg-red-50 p-3 rounded-lg">
            Error: {searchError.message}
          </div>
        )}
        
        {hasResults && !isSearching && (
          <div className="text-green-600">
            Found {totalResults} results
            {searchState.executionTime && (
              <span className="text-gray-500 ml-2">
                ({searchState.executionTime}ms)
              </span>
            )}
          </div>
        )}
        
        {!hasResults && !isSearching && searchState.query?.hasFilters() && (
          <div className="text-gray-600">
            No results found. Try adjusting your search criteria.
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasResults && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Search Results</h3>
          <div className="grid gap-4">
            {searchState.results.map((result, index) => (
              <div key={result.id || index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold">{result.name}</h4>
                {result.studioName && (
                  <p className="text-gray-600">Studio: {result.studioName}</p>
                )}
                {result.styles && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Styles: </span>
                    {result.styles.map(style => (
                      <span key={style} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1">
                        {style}
                      </span>
                    ))}
                  </div>
                )}
                {result.location && (
                  <p className="text-sm text-gray-500 mt-1">
                    Location: {result.location.city || result.location.postcode}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {searchState.suggestions && searchState.suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Suggestions</h3>
          <div className="space-y-2">
            {searchState.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => executeSearch(suggestion.query)}
                className="block w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 5).map((recentQuery, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearch(recentQuery)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {recentQuery.text || 'Style search'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <details className="mt-8">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
          Debug Information
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify({
              searchText,
              debouncedText,
              isDebouncing,
              searchState: {
                query: searchState.query,
                loading: searchState.loading,
                error: searchState.error?.message,
                totalCount: searchState.totalCount,
                executionTime: searchState.executionTime
              },
              recentSearchesCount: recentSearches.length
            }, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}

export default SearchExample;