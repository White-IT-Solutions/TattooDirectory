/**
 * React Hook for Enhanced Search Controller
 * 
 * Provides React integration for the Enhanced Search Controller,
 * managing state updates and providing a clean API for components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchController, SearchQuery } from './search-controller.js';

/**
 * Main hook for using the search controller in React components
 */
export function useSearchController(initialQuery = null) {
  const [searchState, setSearchState] = useState(() => searchController.getSearchState());
  const [recentSearches, setRecentSearches] = useState([]);
  const unsubscribeRef = useRef(null);

  // Subscribe to search controller state changes
  useEffect(() => {
    // Initial state sync
    setSearchState(searchController.getSearchState());
    setRecentSearches(searchController.getRecentSearches());

    // Subscribe to updates
    unsubscribeRef.current = searchController.addListener((newState) => {
      setSearchState({ ...newState });
    });

    // Initialize with query if provided
    if (initialQuery) {
      searchController.executeSearch(initialQuery).catch(console.error);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Update recent searches when search state changes
  useEffect(() => {
    if (searchState.lastUpdated) {
      setRecentSearches(searchController.getRecentSearches());
    }
  }, [searchState.lastUpdated]);

  // Search execution
  const executeSearch = useCallback(async (query) => {
    try {
      return await searchController.executeSearch(query);
    } catch (error) {
      console.error('Search execution failed:', error);
      throw error;
    }
  }, []);

  // Filter management
  const applyFilters = useCallback(async (filters) => {
    try {
      return await searchController.applyFilters(filters);
    } catch (error) {
      console.error('Filter application failed:', error);
      throw error;
    }
  }, []);

  const clearFilters = useCallback(async () => {
    try {
      return await searchController.clearFilters();
    } catch (error) {
      console.error('Filter clearing failed:', error);
      throw error;
    }
  }, []);

  // State management
  const updateSearchState = useCallback((updates) => {
    searchController.updateSearchState(updates);
  }, []);

  const resetSearch = useCallback(() => {
    searchController.reset();
  }, []);

  // History management
  const clearSearchHistory = useCallback(() => {
    searchController.clearSearchHistory();
    setRecentSearches([]);
  }, []);

  // Cancel pending searches
  const cancelPendingSearch = useCallback(() => {
    searchController.cancelPendingSearch();
  }, []);

  return {
    // State
    searchState,
    recentSearches,
    
    // Search operations
    executeSearch,
    applyFilters,
    clearFilters,
    
    // State management
    updateSearchState,
    resetSearch,
    
    // History management
    clearSearchHistory,
    
    // Utility
    cancelPendingSearch,
    
    // Computed properties
    hasResults: searchState.results && searchState.results.length > 0,
    hasFilters: searchState.query?.hasFilters() || false,
    isSearching: searchState.loading,
    searchError: searchState.error,
    totalResults: searchState.totalCount || 0,
    executionTime: searchState.executionTime || 0
  };
}

/**
 * Hook for debounced text search
 */
export function useDebouncedSearch(delay = 300) {
  const [searchText, setSearchText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedText(searchText);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchText, delay]);

  const updateSearchText = useCallback((text) => {
    setSearchText(text);
  }, []);

  const clearSearchText = useCallback(() => {
    setSearchText('');
    setDebouncedText('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    searchText,
    debouncedText,
    updateSearchText,
    clearSearchText,
    isDebouncing: searchText !== debouncedText
  };
}

/**
 * Hook for search suggestions
 */
export function useSearchSuggestions() {
  const { searchState } = useSearchController();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = searchState.suggestions || [];
  const hasNoResults = searchState.results && searchState.results.length === 0;
  const hasFewResults = searchState.results && searchState.results.length > 0 && searchState.results.length < 5;

  const toggleSuggestions = useCallback(() => {
    setShowSuggestions(prev => !prev);
  }, []);

  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  const showSuggestionsPanel = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  return {
    suggestions,
    showSuggestions,
    hasNoResults,
    hasFewResults,
    toggleSuggestions,
    hideSuggestions,
    showSuggestionsPanel
  };
}

/**
 * Hook for search facets (filters)
 */
export function useSearchFacets() {
  const { searchState, applyFilters } = useSearchController();
  
  const facets = searchState.facets || {};
  const currentQuery = searchState.query || new SearchQuery();

  const applyStyleFilter = useCallback(async (styleId) => {
    const currentStyles = currentQuery.styles || [];
    const newStyles = currentStyles.includes(styleId)
      ? currentStyles.filter(id => id !== styleId)
      : [...currentStyles, styleId];
    
    return applyFilters({ styles: newStyles });
  }, [currentQuery.styles, applyFilters]);

  const applyLocationFilter = useCallback(async (location) => {
    return applyFilters({ location });
  }, [applyFilters]);

  const applyDifficultyFilter = useCallback(async (difficulty) => {
    const currentDifficulty = currentQuery.difficulty || [];
    const newDifficulty = currentDifficulty.includes(difficulty)
      ? currentDifficulty.filter(d => d !== difficulty)
      : [...currentDifficulty, difficulty];
    
    return applyFilters({ difficulty: newDifficulty });
  }, [currentQuery.difficulty, applyFilters]);

  return {
    facets,
    currentQuery,
    applyStyleFilter,
    applyLocationFilter,
    applyDifficultyFilter,
    
    // Computed properties
    availableStyles: Object.keys(facets.styles || {}),
    availableLocations: Object.keys(facets.locations || {}),
    availableDifficulties: Object.keys(facets.difficulty || {}),
    
    // Active filter counts
    activeStylesCount: (currentQuery.styles || []).length,
    activeDifficultyCount: (currentQuery.difficulty || []).length,
    hasActiveFilters: currentQuery.hasFilters()
  };
}

/**
 * Hook for search history management
 */
export function useSearchHistory() {
  const { recentSearches, clearSearchHistory } = useSearchController();
  const [showHistory, setShowHistory] = useState(false);

  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  const hideHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  const executeHistorySearch = useCallback(async (historicalQuery) => {
    hideHistory();
    return searchController.executeSearch(historicalQuery);
  }, [hideHistory]);

  return {
    recentSearches,
    showHistory,
    toggleHistory,
    hideHistory,
    executeHistorySearch,
    clearSearchHistory,
    hasHistory: recentSearches.length > 0
  };
}

// Export the SearchQuery class for use in components
export { SearchQuery };