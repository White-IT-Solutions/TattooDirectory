"use client";

import React, { useState, useCallback } from 'react';
import { cn } from '../../../utils/cn';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import { ToastProvider } from '../Toast/ToastProvider';
import SearchFeedback from '../SearchFeedback/SearchFeedback';
import { ValidatedSearchInput, ValidatedSearchForm } from '../SearchValidation/SearchValidation';
import { 
  useSearchNotifications, 
  SearchNotificationHandler,
  createSearchState,
  SEARCH_STATES,
  ERROR_TYPES 
} from '../SearchNotifications/SearchNotifications';

/**
 * SearchFeedbackSystem - Comprehensive feedback system for search functionality
 * 
 * This is the main orchestrator component that brings together:
 * - Toast notifications for search actions
 * - Progress indicators for multi-step searches
 * - Loading states with progress bars
 * - Error handling with recovery suggestions
 * - Real-time validation feedback
 * - Success confirmations
 * - Integration with ErrorBoundary system
 */

// Search feedback context for sharing state across components
const SearchFeedbackContext = React.createContext();

export function useSearchFeedback() {
  const context = React.useContext(SearchFeedbackContext);
  if (!context) {
    throw new Error('useSearchFeedback must be used within a SearchFeedbackProvider');
  }
  return context;
}

// Inner provider component that has access to ToastProvider
function SearchFeedbackProviderInner({ children }) {
  const [searchState, setSearchState] = useState({
    status: SEARCH_STATES.IDLE,
    query: '',
    results: [],
    error: null,
    progress: null,
    steps: [],
    currentStep: 0,
    searchTime: null,
    filterChanges: [],
    location: null,
    savedSearch: null,
    loadedSearch: null
  });

  const notifications = useSearchNotifications();

  // Update search state
  const updateSearchState = useCallback((updates) => {
    setSearchState(prev => ({
      ...prev,
      ...updates,
      timestamp: Date.now()
    }));
  }, []);

  // Start search operation
  const startSearch = useCallback((query, options = {}) => {
    const newState = createSearchState(SEARCH_STATES.SEARCHING, {
      query,
      results: [],
      error: null,
      progress: 0,
      steps: options.steps || [],
      currentStep: 0,
      searchTime: null
    });
    
    updateSearchState(newState);
    return newState;
  }, [updateSearchState]);

  // Complete search operation
  const completeSearch = useCallback((results, searchTime) => {
    const newState = createSearchState(SEARCH_STATES.COMPLETED, {
      results,
      searchTime,
      progress: 100,
      currentStep: searchState.steps.length - 1
    });
    
    updateSearchState(newState);
    return newState;
  }, [updateSearchState, searchState.steps.length]);

  // Fail search operation
  const failSearch = useCallback((error) => {
    const newState = createSearchState(SEARCH_STATES.ERROR, {
      error: {
        id: `search_error_${Date.now()}`,
        type: error.type || ERROR_TYPES.UNKNOWN,
        message: error.message || 'An unexpected error occurred',
        ...error
      }
    });
    
    updateSearchState(newState);
    return newState;
  }, [updateSearchState]);

  // Update search progress
  const updateProgress = useCallback((progress, currentStep) => {
    updateSearchState({
      progress,
      currentStep: currentStep !== undefined ? currentStep : searchState.currentStep
    });
  }, [updateSearchState, searchState.currentStep]);

  // Apply filter
  const applyFilter = useCallback((filterName, filterValue) => {
    const filterChange = {
      action: 'applied',
      name: filterName,
      value: filterValue,
      timestamp: Date.now()
    };
    
    updateSearchState({
      filterChanges: [filterChange]
    });
  }, [updateSearchState]);

  // Clear filters
  const clearFilters = useCallback((filterCount = 1) => {
    const filterChange = {
      action: 'cleared',
      count: filterCount,
      timestamp: Date.now()
    };
    
    updateSearchState({
      filterChanges: [filterChange]
    });
  }, [updateSearchState]);

  // Set location
  const setLocation = useCallback((location, detected = false) => {
    updateSearchState({
      location: {
        name: location,
        detected,
        failed: false,
        timestamp: Date.now()
      }
    });
  }, [updateSearchState]);

  // Location detection failed
  const locationFailed = useCallback(() => {
    updateSearchState({
      location: {
        failed: true,
        timestamp: Date.now()
      }
    });
  }, [updateSearchState]);

  // Save search
  const saveSearch = useCallback((searchName, searchData) => {
    updateSearchState({
      savedSearch: {
        name: searchName,
        data: searchData,
        timestamp: Date.now()
      }
    });
  }, [updateSearchState]);

  // Load search
  const loadSearch = useCallback((searchName, searchData) => {
    updateSearchState({
      loadedSearch: {
        name: searchName,
        data: searchData,
        timestamp: Date.now()
      },
      query: searchData.query || '',
      status: SEARCH_STATES.IDLE
    });
  }, [updateSearchState]);

  // Reset search state
  const resetSearch = useCallback(() => {
    updateSearchState({
      status: SEARCH_STATES.IDLE,
      query: '',
      results: [],
      error: null,
      progress: null,
      steps: [],
      currentStep: 0,
      searchTime: null,
      filterChanges: [],
      location: null,
      savedSearch: null,
      loadedSearch: null
    });
  }, [updateSearchState]);

  const contextValue = {
    searchState,
    updateSearchState,
    startSearch,
    completeSearch,
    failSearch,
    updateProgress,
    applyFilter,
    clearFilters,
    setLocation,
    locationFailed,
    saveSearch,
    loadSearch,
    resetSearch,
    notifications
  };

  return (
    <SearchFeedbackContext.Provider value={contextValue}>
      <ErrorBoundary
        fallback={(error, { retry, reload, goHome, errorId }) => (
          <div className="min-h-screen flex items-center justify-center bg-[var(--background-primary)] p-4">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="text-6xl">🔍</div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Search System Error
              </h1>
              <p className="text-[var(--text-secondary)]">
                The search system encountered an unexpected error. This has been reported to our team.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-[var(--interactive-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--interactive-primary-hover)] transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={reload}
                  className="px-4 py-2 bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-[var(--radius)] hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={goHome}
                  className="px-4 py-2 border border-[var(--border-primary)] text-[var(--text-primary)] rounded-[var(--radius)] hover:bg-[var(--background-secondary)] transition-colors"
                >
                  Go Home
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Error ID: {errorId}
              </p>
            </div>
          </div>
        )}
        onError={(error, errorInfo, errorId) => {
          // Log search system errors
          console.error('Search System Error:', {
            error,
            errorInfo,
            errorId,
            searchState
          });
        }}
      >
        <SearchNotificationHandler
          searchState={searchState}
          onRetry={() => {
            if (searchState.query) {
              startSearch(searchState.query);
            }
          }}
          onClearFilters={() => clearFilters()}
          onManualLocationEntry={() => {
            // Handle manual location entry
            // Manual location entry requested
          }}
        >
          {children}
        </SearchNotificationHandler>
      </ErrorBoundary>
    </SearchFeedbackContext.Provider>
  );
}

// Main provider component that wraps with ToastProvider
export function SearchFeedbackProvider({ 
  children,
  toastPosition = 'top-right',
  maxToasts = 5,
  defaultToastDuration = 5000
}) {
  return (
    <ToastProvider
      position={toastPosition}
      maxToasts={maxToasts}
      defaultDuration={defaultToastDuration}
    >
      <SearchFeedbackProviderInner>
        {children}
      </SearchFeedbackProviderInner>
    </ToastProvider>
  );
}

// Enhanced search component with integrated feedback
export function EnhancedSearchWithFeedback({
  onSearch,
  onValidatedChange,
  searchType = 'general',
  showValidation = true,
  showProgress = true,
  placeholder = "Search...",
  className
}) {
  const { 
    searchState, 
    startSearch, 
    completeSearch, 
    failSearch, 
    updateProgress 
  } = useSearchFeedback();

  const [query, setQuery] = useState('');

  // Simulate search operation with progress
  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;

    try {
      // Start search
      const searchSteps = [
        { label: 'Validating query', description: 'Checking search parameters' },
        { label: 'Searching database', description: 'Finding matching results' },
        { label: 'Processing results', description: 'Organizing and ranking results' },
        { label: 'Finalizing', description: 'Preparing results for display' }
      ];

      startSearch(searchQuery, { steps: searchSteps });

      // Simulate multi-step search process
      for (let i = 0; i < searchSteps.length; i++) {
        updateProgress((i / searchSteps.length) * 100, i);
        
        // Simulate step processing time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      }

      // Simulate search results
      const mockResults = [
        { id: 1, name: 'Result 1' },
        { id: 2, name: 'Result 2' },
        { id: 3, name: 'Result 3' }
      ];

      const searchTime = Math.floor(Math.random() * 500) + 200;
      completeSearch(mockResults, searchTime);

      // Call parent handler
      if (onSearch) {
        onSearch({
          query: searchQuery,
          results: mockResults,
          searchTime
        });
      }

    } catch (error) {
      failSearch({
        type: ERROR_TYPES.UNKNOWN,
        message: error.message || 'Search failed unexpectedly'
      });
    }
  }, [startSearch, completeSearch, failSearch, updateProgress, onSearch]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {showValidation ? (
          <ValidatedSearchInput
            type={searchType}
            placeholder={placeholder}
            onValidatedChange={(data) => {
              setQuery(data.value);
              if (onValidatedChange) {
                onValidatedChange(data);
              }
            }}
            className="flex-1"
          />
        ) : (
          <input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          />
        )}
        
        <button
          type="submit"
          disabled={!query.trim() || searchState.status === SEARCH_STATES.SEARCHING}
          className={cn(
            'px-4 py-2 rounded-[var(--radius)] font-medium transition-all duration-200',
            query.trim() && searchState.status !== SEARCH_STATES.SEARCHING
              ? 'bg-[var(--interactive-primary)] text-white hover:bg-[var(--interactive-primary-hover)]'
              : 'bg-[var(--background-muted)] text-[var(--text-muted)] cursor-not-allowed'
          )}
        >
          {searchState.status === SEARCH_STATES.SEARCHING ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Search Feedback */}
      {showProgress && (
        <SearchFeedback
          state={searchState.status}
          error={searchState.error}
          progress={searchState.progress}
          steps={searchState.steps}
          currentStep={searchState.currentStep}
          resultCount={searchState.results.length}
          searchTime={searchState.searchTime}
          estimatedTime={searchState.status === SEARCH_STATES.SEARCHING ? 2 : null}
          onRetry={() => handleSearch(query)}
          onClearFilters={() => {
            // Handle clear filters
            // Clear filters requested
          }}
          onGoHome={() => {
            window.location.href = '/';
          }}
          onViewResults={() => {
            // View results: searchState.results
          }}
          onNewSearch={() => {
            setQuery('');
            // Reset search state handled by context
          }}
          suggestions={[
            { label: 'Traditional', value: 'traditional', onClick: (value) => handleSearch(value) },
            { label: 'Realism', value: 'realism', onClick: (value) => handleSearch(value) },
            { label: 'London', value: 'london', onClick: (value) => handleSearch(value) }
          ]}
        />
      )}
    </div>
  );
}

// Multi-field search form with comprehensive feedback
export function EnhancedSearchForm({
  fields = [],
  onSubmit,
  showProgress = true,
  className
}) {
  const { 
    searchState, 
    startSearch, 
    completeSearch, 
    failSearch 
  } = useSearchFeedback();

  const handleFormSubmit = useCallback(async (formData, fieldStates) => {
    try {
      const searchQuery = Object.values(formData).filter(Boolean).join(' ');
      
      startSearch(searchQuery);

      // Simulate form processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResults = [
        { id: 1, name: 'Form Result 1' },
        { id: 2, name: 'Form Result 2' }
      ];

      completeSearch(mockResults, 800);

      if (onSubmit) {
        onSubmit(formData, fieldStates, mockResults);
      }

    } catch (error) {
      failSearch({
        type: ERROR_TYPES.VALIDATION,
        message: 'Form submission failed'
      });
    }
  }, [startSearch, completeSearch, failSearch, onSubmit]);

  return (
    <div className={cn('space-y-4', className)}>
      <ValidatedSearchForm
        fields={fields}
        onSubmit={handleFormSubmit}
      />

      {showProgress && (
        <SearchFeedback
          state={searchState.status}
          error={searchState.error}
          resultCount={searchState.results.length}
          searchTime={searchState.searchTime}
          onRetry={() => {
            // Retry form submission
            // Retry form submission
          }}
        />
      )}
    </div>
  );
}

export default SearchFeedbackProvider;