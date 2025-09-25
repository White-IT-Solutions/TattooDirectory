"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ValidatedSearchInput } from '../SearchValidation/SearchValidation';
import SearchProgressIndicator from '../SearchProgressIndicator/SearchProgressIndicator';
import SearchErrorMessage from '../SearchErrorMessage/SearchErrorMessage';
import { useToast } from '../Toast';
import { cn } from '../../../utils/cn';

/**
 * SearchFeedbackIntegration - Comprehensive search component with validation, progress, and error handling
 * 
 * This component provides a complete search experience with:
 * - Real-time validation with debounced input checking
 * - Progress indicators for multi-step operations
 * - Error messages with recovery suggestions
 * - Toast notifications for feedback
 * - Consistent integration across all search contexts
 */

const SearchFeedbackIntegration = ({
  // Search configuration
  searchType = 'general',
  placeholder = 'Search...',
  initialValue = '',
  
  // Validation settings
  enableValidation = true,
  showSuggestions = true,
  debounceMs = 300,
  
  // Progress settings
  enableProgress = true,
  progressSteps = [
    'Validating search',
    'Searching database', 
    'Processing results',
    'Finalizing'
  ],
  
  // Error handling
  enableErrorHandling = true,
  showPopularSearches = true,
  
  // Callbacks
  onSearch,
  onValidatedChange,
  onError,
  onSuccess,
  
  // Styling
  className = '',
  size = 'md',
  
  // Additional props
  ...props
}) => {
  const { success, error, warning, info } = useToast();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchValidation, setSearchValidation] = useState({ isValid: true });
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStep, setSearchStep] = useState(0);
  const [searchError, setSearchError] = useState(null);

  // Initialize search query from initial value
  useEffect(() => {
    setSearchQuery(initialValue);
  }, [initialValue]);

  // Enhanced search execution with progress tracking
  const executeSearchWithProgress = useCallback(async (query) => {
    if (enableValidation && !searchValidation.isValid) {
      warning('Please fix search validation errors before searching', {
        title: 'Invalid Search'
      });
      return;
    }

    if (!query?.trim()) {
      warning('Please enter a search term', {
        title: 'Empty Search'
      });
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setSearchStep(0);
    setSearchError(null);
    
    try {
      let progressInterval;
      
      if (enableProgress) {
        // Simulate progress steps
        progressInterval = setInterval(() => {
          setSearchProgress(prev => {
            const newProgress = prev + (100 / progressSteps.length);
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            setSearchStep(Math.floor(newProgress / (100 / progressSteps.length)));
            return newProgress;
          });
        }, 200);
      }

      // Execute the actual search
      const result = await onSearch?.(query, {
        searchType,
        validation: searchValidation
      });
      
      // Clear progress
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setSearchProgress(100);
      setSearchStep(progressSteps.length - 1);
      
      // Handle success
      if (result?.success !== false) {
        const resultCount = result?.count || result?.results?.length || 0;
        
        if (resultCount > 0) {
          success(`Found ${resultCount} result${resultCount === 1 ? '' : 's'} for "${query}"`, {
            title: 'Search Complete'
          });
        } else {
          info('No results found for your search', {
            title: 'No Results'
          });
        }
        
        onSuccess?.(result, query);
      } else {
        throw new Error(result?.message || 'Search failed');
      }
      
    } catch (err) {
      console.error('Search failed:', err);
      
      const errorType = err.name === 'NetworkError' ? 'network-error' : 'server-error';
      const errorMessage = err.message || 'Search service temporarily unavailable';
      
      setSearchError({
        type: errorType,
        message: errorMessage
      });
      
      // Show error toast with retry option
      error('Failed to execute search. Please try again.', {
        title: 'Search Failed',
        action: {
          label: 'Retry',
          onClick: () => executeSearchWithProgress(query)
        }
      });
      
      onError?.(err, query);
    } finally {
      setIsSearching(false);
      // Reset progress after a delay
      setTimeout(() => {
        setSearchProgress(0);
        setSearchStep(0);
      }, 2000);
    }
  }, [
    searchValidation, 
    enableValidation, 
    enableProgress, 
    progressSteps, 
    onSearch, 
    onSuccess, 
    onError,
    success, 
    error, 
    warning, 
    info
  ]);

  // Handle search validation changes
  const handleSearchValidation = useCallback((validationData) => {
    setSearchQuery(validationData.value);
    setSearchValidation(validationData.validation);
    setSearchError(null); // Clear any previous errors
    
    // Notify parent of validation changes
    onValidatedChange?.(validationData);
    
    // Auto-search on valid input with debouncing (if enabled)
    if (validationData.isValid && validationData.value.length >= 2 && onSearch) {
      const timeoutId = setTimeout(() => {
        executeSearchWithProgress(validationData.value);
      }, debounceMs + 200); // Add extra delay for auto-search
      
      return () => clearTimeout(timeoutId);
    }
  }, [onValidatedChange, onSearch, executeSearchWithProgress, debounceMs]);

  // Handle manual search trigger
  const handleManualSearch = useCallback(() => {
    executeSearchWithProgress(searchQuery);
  }, [executeSearchWithProgress, searchQuery]);

  // Handle error recovery actions
  const handleRetry = useCallback(() => {
    executeSearchWithProgress(searchQuery);
  }, [executeSearchWithProgress, searchQuery]);

  const handleClearError = useCallback(() => {
    setSearchError(null);
    setSearchQuery('');
    setSearchValidation({ isValid: true });
  }, []);

  const handleHelp = useCallback(() => {
    const helpMessages = {
      general: 'Try searching for artist names, studio names, tattoo styles, or UK locations',
      artistName: 'Enter the full name or partial name of a tattoo artist',
      studioName: 'Enter the name of a tattoo studio or shop',
      postcode: 'Enter a valid UK postcode (e.g., SW1A 1AA)',
      location: 'Enter a city name, area, or postcode in the UK'
    };
    
    info(helpMessages[searchType] || helpMessages.general, {
      title: 'Search Tips'
    });
  }, [searchType, info]);

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Enhanced Search Input */}
      <div className="space-y-2">
        {enableValidation ? (
          <ValidatedSearchInput
            type={searchType}
            placeholder={placeholder}
            onValidatedChange={handleSearchValidation}
            showSuggestions={showSuggestions}
            size={size}
            className="w-full"
          />
        ) : (
          <input
            type="search"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onValidatedChange?.({
                value: e.target.value,
                isValid: true,
                validation: { isValid: true }
              });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleManualSearch();
              }
            }}
            className={cn(
              'w-full px-3 py-2 border border-neutral-300 rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'bg-white text-neutral-900 placeholder-neutral-500',
              size === 'sm' && 'px-2 py-1 text-sm',
              size === 'lg' && 'px-4 py-3 text-lg'
            )}
          />
        )}
      </div>

      {/* Search Progress */}
      {enableProgress && isSearching && (
        <SearchProgressIndicator
          isLoading={isSearching}
          progress={searchProgress}
          steps={progressSteps}
          currentStep={searchStep}
          showSteps={true}
          size={size}
          className="py-2"
        />
      )}

      {/* Search Error */}
      {enableErrorHandling && searchError && (
        <SearchErrorMessage
          errorType={searchError.type}
          query={searchQuery}
          variant="error"
          showSuggestions={true}
          showActions={true}
          showPopularSearches={showPopularSearches}
          onRetry={handleRetry}
          onClear={handleClearError}
          onHelp={handleHelp}
          size={size}
        />
      )}
    </div>
  );
};

export default SearchFeedbackIntegration;

// Export hook for programmatic search control
export const useSearchFeedback = (initialConfig = {}) => {
  const [config, setConfig] = useState({
    searchType: 'general',
    enableValidation: true,
    enableProgress: true,
    enableErrorHandling: true,
    ...initialConfig
  });

  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    config,
    updateConfig
  };
};

// Export validation utilities
export { useSearchValidation } from '../SearchValidation/SearchValidation';