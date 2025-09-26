"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ArtistCard from "../components/ArtistCard";
import EnhancedStyleFilter from "../components/EnhancedStyleFilter";
import { useSearchController, SearchQuery } from "../../lib/useSearchController";
import { 
  Input, 
  SearchInput,
  Button, 
  Card, 
  Badge, 
  Tag 
} from "../../design-system/components/ui";
import { TouchTarget, TouchButton, LocationServices } from "../../design-system/components/navigation";
import { 
  InteractiveElement, 
  AnimatedButton, 
  AnimatedCard, 
  MotionWrapper,
  Tooltip 
} from "../../design-system/components/ui";
import { ArtistCardSkeleton } from "../../design-system/components/ui/Skeleton/ArtistCardSkeleton";
import SearchProgressIndicator from "../../design-system/components/feedback/SearchProgressIndicator/SearchProgressIndicator";
import SearchErrorMessage from "../../design-system/components/feedback/SearchErrorMessage/SearchErrorMessage";
import { PageWrapper } from "../../design-system/components/layout";
import { 
  NoSearchResults, 
  NewUserOnboarding, 
  LoadingEmptyState,
  NoFilterResults 
} from "../../design-system/components/feedback/EmptyState";
import { useToast } from "../../design-system/components/feedback/Toast";

import SavedSearches, { saveSearchToStorage } from "../components/SavedSearches";
import { useSearchValidation, SearchValidationIndicator } from "../components/SearchValidation";

// Location suggestions for UK cities
const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Sheffield", 
  "Bristol", "Newcastle", "Nottingham", "Leicester", "Coventry", "Bradford",
  "Edinburgh", "Glasgow", "Cardiff", "Belfast", "Brighton", "Oxford",
  "Cambridge", "Bath", "York", "Canterbury", "Chester", "Durham"
];

// Experience level options with difficulty mapping
const EXPERIENCE_LEVELS = [
  { value: "apprentice", label: "Apprentice (0-2 years)", difficulty: ["beginner"] },
  { value: "junior", label: "Junior (2-5 years)", difficulty: ["beginner", "intermediate"] },
  { value: "experienced", label: "Experienced (5-10 years)", difficulty: ["intermediate", "advanced"] },
  { value: "senior", label: "Senior (10+ years)", difficulty: ["advanced", "expert"] },
  { value: "master", label: "Master Artist (15+ years)", difficulty: ["expert"] }
];

// Price range options
const PRICE_RANGES = [
  { value: "budget", label: "Budget (£50-100/hour)", min: 50, max: 100 },
  { value: "standard", label: "Standard (£100-150/hour)", min: 100, max: 150 },
  { value: "premium", label: "Premium (£150-250/hour)", min: 150, max: 250 },
  { value: "luxury", label: "Luxury (£250+/hour)", min: 250, max: 1000 }
];

// Availability options
const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available Now" },
  { value: "booking", label: "Taking Bookings" },
  { value: "waitlist", label: "Waitlist Only" },
  { value: "consultation", label: "Consultation Available" }
];

// Rating options
const RATING_OPTIONS = [
  { value: 4.5, label: "4.5+ Stars" },
  { value: 4.0, label: "4.0+ Stars" },
  { value: 3.5, label: "3.5+ Stars" },
  { value: 3.0, label: "3.0+ Stars" }
];

// Autocomplete suggestions component
const AutocompleteSuggestions = ({ suggestions, onSelect, onClose, isVisible }) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type="button"
          className="w-full px-4 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
          onClick={() => onSelect(suggestion)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{suggestion.text}</span>
            <Badge variant="secondary" size="sm">
              {suggestion.type}
            </Badge>
          </div>
          {suggestion.metadata && (
            <div className="text-xs text-neutral-500 mt-1">
              {suggestion.metadata}
            </div>
          )}
        </button>
      ))}
      <button
        type="button"
        className="w-full px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600 border-t border-neutral-100"
        onClick={onClose}
      >
        Close suggestions
      </button>
    </div>
  );
};

// Advanced filters component
const AdvancedFilters = ({ isOpen, onToggle, filters, onFilterChange }) => {
  if (!isOpen) return null;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Advanced Filters</h3>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Experience Level Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Experience Level</label>
          <select
            value={filters.experience || ""}
            onChange={(e) => onFilterChange({ experience: e.target.value || null })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Any Experience</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Price Range</label>
          <select
            value={filters.priceRange || ""}
            onChange={(e) => {
              const range = PRICE_RANGES.find(r => r.value === e.target.value);
              onFilterChange({ 
                priceRange: range ? { min: range.min, max: range.max } : null 
              });
            }}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Any Price</option>
            {PRICE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Availability</label>
          <select
            value={filters.availability || ""}
            onChange={(e) => onFilterChange({ availability: e.target.value || null })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Any Availability</option>
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Minimum Rating</label>
          <select
            value={filters.rating || ""}
            onChange={(e) => onFilterChange({ rating: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Any Rating</option>
            {RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Location with Radius */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <Input
            type="text"
            placeholder="Enter city or postcode..."
            value={filters.location?.city || filters.location?.postcode || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                // Simple heuristic: if it looks like a postcode (contains numbers), treat as postcode
                const isPostcode = /\d/.test(value);
                onFilterChange({
                  location: isPostcode 
                    ? { postcode: value }
                    : { city: value }
                });
              } else {
                onFilterChange({ location: null });
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Search Radius (miles)</label>
          <select
            value={filters.radius || ""}
            onChange={(e) => onFilterChange({ radius: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
            disabled={!filters.location}
          >
            <option value="">Any Distance</option>
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
            <option value="100">Within 100 miles</option>
          </select>
        </div>
      </div>
    </Card>
  );
};

export default function EnhancedArtistsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error, warning, info } = useToast();
  const {
    searchState,
    executeSearch,
    clearFilters,
    hasResults,
    hasFilters,
    isSearching,
    searchError,
    totalResults
  } = useSearchController();

  // Search validation
  const {
    value: searchText,
    validation: searchValidation,
    isValidating,
    updateValue: setSearchText,
    clearValue: clearSearchText
  } = useSearchValidation('', 'general', 300);

  // Local state for UI
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStep, setSearchStep] = useState(0);
  const [saveSearchName, setSaveSearchName] = useState("");

  // Search progress steps
  const searchSteps = [
    { label: 'Validating search', description: 'Checking search parameters' },
    { label: 'Searching database', description: 'Finding matching artists' },
    { label: 'Processing results', description: 'Organizing and ranking' },
    { label: 'Finalizing', description: 'Preparing display' }
  ];

  // Initialize search from URL parameters
  useEffect(() => {
    const query = SearchQuery.fromURLSearchParams(searchParams);
    setSearchText(query.text || "");
    
    // Set advanced filters from query
    setAdvancedFilters({
      experience: null, // This would come from query if we had it
      priceRange: query.priceRange,
      availability: query.availability,
      rating: query.rating,
      location: query.location,
      radius: query.radius
    });

    // Execute search if there are parameters
    if (query.hasFilters()) {
      executeSearchWithProgress(query);
    }
  }, [searchParams]);

  // Generate autocomplete suggestions
  const generateSuggestions = useCallback((text) => {
    if (!text || text.length < 2) {
      setSuggestions([]);
      return;
    }

    const suggestions = [];
    const lowerText = text.toLowerCase();

    // Artist name suggestions (mock data)
    const artistSuggestions = [
      "Sarah Johnson", "Mike Thompson", "Emma Wilson", "James Brown", "Lisa Davis"
    ].filter(name => name.toLowerCase().includes(lowerText))
     .map(name => ({
       type: "artist",
       text: name,
       metadata: "Tattoo Artist"
     }));

    // Studio name suggestions (mock data)
    const studioSuggestions = [
      "Ink Masters Studio", "Royal Tattoo", "Black Rose Tattoo", "Urban Art Collective"
    ].filter(name => name.toLowerCase().includes(lowerText))
     .map(name => ({
       type: "studio",
       text: name,
       metadata: "Tattoo Studio"
     }));

    // City suggestions
    const citySuggestions = UK_CITIES
      .filter(city => city.toLowerCase().includes(lowerText))
      .slice(0, 3)
      .map(city => ({
        type: "location",
        text: city,
        metadata: "City"
      }));

    // Style suggestions (from enhanced styles data)
    const styleSuggestions = [
      "Traditional", "Realism", "Watercolor", "Geometric", "Japanese", "Blackwork"
    ].filter(style => style.toLowerCase().includes(lowerText))
     .map(style => ({
       type: "style",
       text: style,
       metadata: "Tattoo Style"
     }));

    suggestions.push(...artistSuggestions, ...studioSuggestions, ...citySuggestions, ...styleSuggestions);
    setSuggestions(suggestions.slice(0, 8)); // Limit to 8 suggestions
  }, []);

  // Handle search text changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateSuggestions(searchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, generateSuggestions]);

  // Enhanced search execution with progress tracking
  const executeSearchWithProgress = useCallback(async (query) => {
    setSearchProgress(0);
    setSearchStep(0);
    
    try {
      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          const newProgress = prev + 25;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          setSearchStep(Math.floor(newProgress / 25));
          return newProgress;
        });
      }, 300);

      // Execute actual search
      await executeSearch(query);
      
      // Ensure progress completes
      clearInterval(progressInterval);
      setSearchProgress(100);
      setSearchStep(3);
      
      // Show success toast with results count
      if (totalResults > 0) {
        success(`Found ${totalResults} artist${totalResults === 1 ? '' : 's'} matching your search`, {
          title: 'Search Complete'
        });
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      setSearchProgress(0);
      setSearchStep(0);
      
      // Show error toast with retry option
      error('Failed to search artists. Please check your connection and try again.', {
        title: 'Search Failed',
        action: {
          label: 'Retry',
          onClick: () => executeSearchWithProgress(query)
        }
      });
    }
  }, [executeSearch, success, error, totalResults]);

  // Handle search execution
  const handleSearch = useCallback((searchQuery = null) => {
    // Validate search input first
    if (searchText && searchValidation && !searchValidation.isValid) {
      return; // Don't search with invalid input
    }

    const query = searchQuery || new SearchQuery({
      text: searchText,
      ...advancedFilters
    });

    // Update URL
    const params = query.toURLSearchParams();
    router.push(`/artists?${params.toString()}`);

    // Execute search with progress
    executeSearchWithProgress(query);
    setShowSuggestions(false);
  }, [searchText, searchValidation, advancedFilters, router, executeSearchWithProgress]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    if (suggestion.type === "style") {
      // Navigate to artists with style filter
      const query = new SearchQuery({ styles: [suggestion.text.toLowerCase()] });
      handleSearch(query);
    } else if (suggestion.type === "location") {
      // Set location filter
      const query = new SearchQuery({ 
        text: searchText,
        location: { city: suggestion.text },
        ...advancedFilters
      });
      handleSearch(query);
    } else {
      // For artist/studio names, use as text search
      setSearchText(suggestion.text);
      const query = new SearchQuery({ 
        text: suggestion.text,
        ...advancedFilters
      });
      handleSearch(query);
    }
  }, [searchText, advancedFilters, handleSearch]);

  // Handle advanced filter changes
  const handleAdvancedFilterChange = useCallback((newFilters) => {
    const updatedFilters = { ...advancedFilters, ...newFilters };
    setAdvancedFilters(updatedFilters);
    
    // Auto-apply filters
    const query = new SearchQuery({
      text: searchText,
      ...updatedFilters
    });
    handleSearch(query);
  }, [advancedFilters, searchText, handleSearch]);

  // Handle clear all filters
  const handleClearFilters = useCallback(() => {
    clearSearchText();
    setAdvancedFilters({});
    clearFilters();
    router.push("/artists");
    
    // Show info toast about cleared filters
    info('All search filters have been cleared', {
      title: 'Filters Cleared'
    });
  }, [clearSearchText, clearFilters, router, info]);

  // Handle save search
  const handleSaveSearch = useCallback(() => {
    if (!saveSearchName.trim()) {
      warning('Please enter a name for your saved search', {
        title: 'Name Required'
      });
      return;
    }

    const query = new SearchQuery({
      text: searchText,
      ...advancedFilters
    });

    const searchId = saveSearchToStorage(
      query, 
      saveSearchName.trim(),
      `Search for ${searchText || 'artists'} with ${Object.keys(advancedFilters).length} filters`
    );

    if (searchId) {
      setSaveSearchName("");
      success(`Search "${saveSearchName.trim()}" has been saved successfully`, {
        title: 'Search Saved',
        action: {
          label: 'View Saved',
          onClick: () => setShowSavedSearches(true)
        }
      });
    } else {
      error('Failed to save search. Please try again.', {
        title: 'Save Failed'
      });
    }
  }, [searchText, advancedFilters, saveSearchName, success, error, warning]);

  // Handle saved search selection
  const handleSavedSearchSelect = useCallback((query, name) => {
    // Update form with saved search parameters
    setSearchText(query.text || "");
    setAdvancedFilters({
      experience: query.experience,
      priceRange: query.priceRange,
      availability: query.availability,
      rating: query.rating,
      location: query.location,
      radius: query.radius
    });

    // Execute the search
    handleSearch(query);
    setShowSavedSearches(false);
  }, [handleSearch]);

  return (
    <PageWrapper
      title="Find Your Perfect Tattoo Artist"
      description="Discover talented tattoo artists across the UK. Search by style, location, experience level, and more to find the perfect artist for your next tattoo."
      maxWidth="xl"
      contentPadding="lg"
    >
      <div className="space-y-8">
        {/* Enhanced Search Interface */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <SearchInput
                placeholder="Search artists, studios, styles, or locations..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!searchValidation || searchValidation.isValid) {
                      handleSearch();
                    }
                  }
                  if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                size="lg"
                className={searchValidation && !searchValidation.isValid ? 'border-red-300' : ''}
              />
              
              {/* Search Validation */}
              {searchText && (
                <SearchValidationIndicator
                  validation={searchValidation}
                  showSuggestions={true}
                  onSuggestionClick={(suggestion) => {
                    setSearchText(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="mt-2"
                />
              )}
              
              {/* Autocomplete Suggestions */}
              <AutocompleteSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
                isVisible={showSuggestions && suggestions.length > 0}
              />
            </div>

            {/* Search Progress */}
            {isSearching && (
              <SearchProgressIndicator
                isLoading={isSearching}
                progress={searchProgress}
                steps={searchSteps.map(step => step.label)}
                currentStep={searchStep}
                showSteps={true}
                className="py-2"
              />
            )}

            {/* Search Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="primary" 
                onClick={() => handleSearch()}
                loading={isSearching}
                disabled={searchText && searchValidation && !searchValidation.isValid}
              >
                Search Artists
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Advanced Filters
                {Object.values(advancedFilters).some(v => v !== null && v !== undefined) && (
                  <Badge variant="accent" size="sm" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowSavedSearches(!showSavedSearches)}
              >
                Saved Searches
              </Button>

              {hasFilters && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              )}

              {/* Save Search */}
              {(searchText || hasFilters) && (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Save search as..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    size="sm"
                    className="w-40"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSaveSearch}
                    disabled={!saveSearchName.trim()}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
              isOpen={showAdvancedFilters}
              onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
              filters={advancedFilters}
              onFilterChange={handleAdvancedFilterChange}
            />
          </div>
        </Card>

        {/* Saved Searches */}
        {showSavedSearches && (
          <SavedSearches
            onSearchSelect={handleSavedSearchSelect}
            className="mb-8"
          />
        )}

        {/* Enhanced Style Filter with Difficulty Badges and Characteristics */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Filter by Tattoo Style
              </h3>
              <p className="text-neutral-600 text-sm">
                Select tattoo styles to find artists who specialize in them. 
                Hover over styles to see difficulty levels and characteristics.
              </p>
            </div>
            <EnhancedStyleFilter />
          </Card>
        </div>

        {/* Search Results Header */}
        {(hasResults || isSearching || searchError) && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-primary-800">
                {isSearching ? "Searching..." : `Search Results`}
              </h2>
              {totalResults > 0 && (
                <p className="text-neutral-600 mt-1">
                  Found {totalResults} artist{totalResults !== 1 ? "s" : ""}
                  {searchText && ` matching "${searchText}"`}
                </p>
              )}
            </div>

            {/* Active Filters Display */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2">
                {searchState.query?.styles?.map((style) => (
                  <Tag key={style} variant="accent" size="sm" removable>
                    {style}
                  </Tag>
                ))}
                {searchState.query?.location && (
                  <Tag variant="secondary" size="sm">
                    📍 {searchState.query.location.city || searchState.query.location.postcode}
                  </Tag>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {searchError && (
          <SearchErrorMessage
            errorType={searchError.type || 'server-error'}
            query={searchText}
            variant="error"
            showSuggestions={true}
            showActions={true}
            showPopularSearches={true}
            onRetry={() => handleSearch()}
            onClear={() => handleClearFilters()}
            onHelp={() => setShowAdvancedFilters(true)}
            className="mb-8"
          />
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ArtistCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Search Results */}
        {hasResults && !isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="search-results">
            {searchState.results.map((artist) => (
              <ArtistCard 
                key={artist.artistId || artist.PK || artist.id} 
                artist={artist} 
              />
            ))}
          </div>
        )}

        {/* No Results State */}
        {!hasResults && !isSearching && !searchError && searchState.query?.hasFilters() && (
          <NoSearchResults
            searchTerm={searchText}
            onClearSearch={handleClearFilters}
            onBrowseAll={() => router.push("/artists")}
            suggestions={searchState.suggestions?.map(s => s.text) || ['Traditional', 'Realism', 'Blackwork', 'Watercolor']}
          />
        )}

        {/* Default State - No Search Performed */}
        {!hasResults && !isSearching && !searchError && !searchState.query?.hasFilters() && (
          <NewUserOnboarding
            onStartExploring={() => {
              const query = new SearchQuery({});
              executeSearch(query);
            }}
            onViewGuide={() => router.push("/faq")}
          />
        )}
      </div>
    </PageWrapper>
  );
}