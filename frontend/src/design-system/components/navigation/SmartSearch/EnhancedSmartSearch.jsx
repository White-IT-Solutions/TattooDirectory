"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cva } from '../../../utils/cn';
import { Input } from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { SearchValidation } from '../../feedback/SearchValidation/SearchValidation';
import { SearchProgressIndicator } from '../../feedback/SearchProgressIndicator/SearchProgressIndicator';
import { SearchErrorMessage } from '../../feedback/SearchErrorMessage/SearchErrorMessage';

const searchVariants = cva(
  "relative w-full max-w-2xl mx-auto",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl"
      },
      variant: {
        default: "bg-white border border-gray-200 rounded-lg shadow-sm",
        elevated: "bg-white border border-gray-200 rounded-lg shadow-lg",
        minimal: "bg-transparent border-0"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);

export function EnhancedSmartSearch({
  placeholder = "Search artists, styles, or locations...",
  onSearch,
  onFilterChange,
  initialQuery = "",
  filters = {},
  suggestions = [],
  isLoading = false,
  size = "md",
  variant = "default",
  className = "",
  showContextualHelp = true,
  showKeyboardShortcuts = true,
  showProgressIndicator = true,
  showErrorRecovery = true,
  maxSuggestions = 8,
  debounceMs = 300,
  ...props
}) {
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(filters);
  const [validationState, setValidationState] = useState({ isValid: true, message: "" });
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchError, setSearchError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Contextual help content
  const helpContent = {
    title: "Search Tips & Shortcuts",
    sections: [
      {
        title: "Quick Search",
        items: [
          'Type artist names, styles, or locations',
          'Use quotes for exact phrases: "traditional rose"',
          'Try style aliases: "sailor jerry" finds Traditional'
        ]
      },
      {
        title: "Keyboard Shortcuts",
        items: [
          'Press "/" to focus search from anywhere',
          'Use ↑↓ arrow keys to navigate results',
          'Press Enter to select highlighted result',
          'Press Escape to close search dropdown'
        ]
      },
      {
        title: "Advanced Features",
        items: [
          'Save searches for quick access later',
          'Use filters to narrow down results',
          'Browse by location with radius search'
        ]
      }
    ]
  };

  // Search suggestions with categories
  const searchSuggestions = [
    { category: 'Artists', examples: ['Sarah Chen', 'Marcus Rodriguez', 'Emma Thompson'] },
    { category: 'Styles', examples: ['Traditional', 'Realism', 'Watercolor', 'Japanese'] },
    { category: 'Studios', examples: ['Ink & Steel', 'Black Rose Tattoo', 'Sacred Art'] },
    { category: 'Locations', examples: ['London', 'Manchester', 'Birmingham', 'SW1A 1AA'] }
  ];

  // Load recent searches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tattoo-directory-recent-searches');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          setRecentSearches([]);
        }
      }
    }
  }, []);

  // Sync with URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // Validate search input
  const validateSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      return { isValid: false, message: "Please enter a search term" };
    }
    if (searchQuery.length < 2) {
      return { isValid: false, message: "Search term must be at least 2 characters" };
    }
    if (searchQuery.length > 100) {
      return { isValid: false, message: "Search term is too long" };
    }
    return { isValid: true, message: "" };
  }, []);

  // Handle search submission with progress tracking
  const handleSearch = useCallback(async (searchQuery = query) => {
    const validation = validateSearch(searchQuery);
    setValidationState(validation);
    setSearchError(null);
    
    if (validation.isValid) {
      try {
        // Start progress tracking
        if (showProgressIndicator) {
          setSearchProgress(10);
        }

        // Save to recent searches
        if (searchQuery.trim()) {
          const newSearch = { query: searchQuery.trim(), timestamp: Date.now() };
          const updatedRecent = [
            newSearch,
            ...recentSearches.filter(s => s.query !== searchQuery.trim())
          ].slice(0, 5);
          
          setRecentSearches(updatedRecent);
          localStorage.setItem('tattoo-directory-recent-searches', JSON.stringify(updatedRecent));
        }

        // Simulate search progress
        if (showProgressIndicator) {
          setSearchProgress(50);
          await new Promise(resolve => setTimeout(resolve, 200));
          setSearchProgress(80);
        }

        // Execute search
        await onSearch?.(searchQuery, selectedFilters);
        
        // Update URL
        const params = new URLSearchParams(searchParams);
        if (searchQuery) {
          params.set('q', searchQuery);
        } else {
          params.delete('q');
        }
        router.push(`?${params.toString()}`);

        // Complete progress
        if (showProgressIndicator) {
          setSearchProgress(100);
          setTimeout(() => setSearchProgress(0), 1000);
        }

        setShowSuggestions(false);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError({
          type: error.type || 'server-error',
          message: error.message || 'Search failed'
        });
        setSearchProgress(0);
      }
    }
  }, [query, selectedFilters, onSearch, validateSearch, router, searchParams, recentSearches, showProgressIndicator]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setHighlightedIndex(-1);
    setSearchError(null);
    
    // Show suggestions for queries longer than 1 character
    setShowSuggestions(value.length > 1);
    setShowHelp(value.length === 0 && showContextualHelp);
    
    // Clear validation errors on input
    if (!validationState.isValid) {
      setValidationState({ isValid: true, message: "" });
    }

    // Debounced suggestion fetching
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length > 1) {
      debounceRef.current = setTimeout(() => {
        // Trigger suggestion fetch (would normally be an API call)
        // For now, we'll use the provided suggestions
      }, debounceMs);
    }
  }, [validationState.isValid, showContextualHelp, debounceMs]);

  // Handle filter changes
  const handleFilterToggle = useCallback((filterKey, filterValue) => {
    const newFilters = { ...selectedFilters };
    
    if (newFilters[filterKey]?.includes(filterValue)) {
      newFilters[filterKey] = newFilters[filterKey].filter(v => v !== filterValue);
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      newFilters[filterKey] = [...(newFilters[filterKey] || []), filterValue];
    }
    
    setSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [selectedFilters, onFilterChange]);



  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions && e.key !== 'Enter' && e.key !== 'Escape') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionSelect(suggestions[highlightedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setShowHelp(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case '?':
        if (e.shiftKey && showKeyboardShortcuts) {
          e.preventDefault();
          setShowHelp(!showHelp);
        }
        break;
    }
  }, [handleSearch, showSuggestions, suggestions, highlightedIndex, showKeyboardShortcuts, showHelp]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.title;
    setQuery(suggestionText);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    handleSearch(suggestionText);
  }, [handleSearch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Focus search on "/" key
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only if not already focused on an input
        if (document.activeElement?.tagName !== 'INPUT' && 
            document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    if (showKeyboardShortcuts) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [showKeyboardShortcuts]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={searchVariants({ size, variant, className })} {...props}>
      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length > 1) {
                setShowSuggestions(true);
              } else if (showContextualHelp) {
                setShowHelp(true);
              } else if (recentSearches.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className={showContextualHelp ? "pr-20" : "pr-12"}
            aria-label="Search"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Help Button */}
            {showContextualHelp && (
              <Button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="h-8 w-8 p-0"
                variant="ghost"
                size="sm"
                aria-label="Search help"
                title="Search tips and shortcuts (Shift + ?)"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
            )}

            {/* Search Button */}
            <Button
              type="button"
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              variant="ghost"
              size="sm"
              aria-label="Search"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Search Validation */}
        <SearchValidation
          isValid={validationState.isValid}
          message={validationState.message}
          className="mt-1"
        />

        {/* Search Progress Indicator */}
        {showProgressIndicator && searchProgress > 0 && (
          <SearchProgressIndicator
            isLoading={searchProgress > 0 && searchProgress < 100}
            progress={searchProgress}
            steps={['Validating query', 'Searching database', 'Processing results']}
            currentStep={Math.floor(searchProgress / 33)}
            className="mt-2"
          />
        )}

        {/* Search Error Message */}
        {showErrorRecovery && searchError && (
          <SearchErrorMessage
            errorType={searchError.type}
            query={query}
            onRetry={() => handleSearch()}
            onClear={() => {
              setQuery('');
              setSearchError(null);
            }}
            onHelp={() => setShowHelp(true)}
            className="mt-2"
          />
        )}

        {/* Contextual Help Dropdown */}
        {showHelp && showContextualHelp && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto p-4"
            role="dialog"
            aria-label="Search help"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {helpContent.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(false)}
                className="text-xs"
              >
                ✕
              </Button>
            </div>

            {/* Search Tips */}
            <div className="space-y-3 mb-4">
              {searchSuggestions.map((tip, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => {
                    const example = tip.examples[Math.floor(Math.random() * tip.examples.length)];
                    setQuery(example);
                    setShowHelp(false);
                    handleSearch(example);
                  }}
                >
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {tip.category}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tip.examples.slice(0, 3).map((example, i) => (
                      <Badge key={i} variant="outline" size="sm">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Help Sections */}
            <div className="border-t border-gray-200 pt-3">
              {helpContent.sections.map((section, index) => (
                <div key={index} className="mb-3 last:mb-0">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">
                    {section.title}
                  </h4>
                  <ul className="space-y-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-2 mt-1 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && !showHelp && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            role="listbox"
          >
            {suggestions.slice(0, maxSuggestions).map((suggestion, index) => {
              const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.title;
              const isHighlighted = index === highlightedIndex;
              
              return (
                <button
                  key={index}
                  type="button"
                  className={`w-full px-4 py-2 text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    isHighlighted 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'hover:bg-gray-50 focus:bg-gray-50'
                  } focus:outline-none`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  role="option"
                  aria-selected={isHighlighted}
                >
                  {suggestionText}
                </button>
              );
            })}
          </div>
        )}

        {/* Recent Searches */}
        {showSuggestions && !showHelp && suggestions.length === 0 && recentSearches.length > 0 && !query && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            role="listbox"
          >
            <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              Recent searches
            </div>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                onClick={() => handleSuggestionSelect(search.query)}
                role="option"
              >
                <span>{search.query}</span>
                <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {Object.keys(selectedFilters).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([filterKey, filterValues]) =>
            filterValues.map((value) => (
              <Badge
                key={`${filterKey}-${value}`}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200"
                onClick={() => handleFilterToggle(filterKey, value)}
              >
                {value}
                <button
                  type="button"
                  className="ml-1 hover:text-red-600"
                  aria-label={`Remove ${value} filter`}
                >
                  ×
                </button>
              </Badge>
            ))
          )}
          
          {Object.keys(selectedFilters).length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFilters({});
                onFilterChange?.({});
              }}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EnhancedSmartSearch;