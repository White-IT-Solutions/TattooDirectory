"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { StudioCardSkeleton } from "../../design-system/components/ui/Skeleton/StudioCardSkeleton";
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
import EnhancedStyleFilter from "../components/EnhancedStyleFilter";
import SavedSearches, { saveSearchToStorage } from "../components/SavedSearches";
import { useSearchValidation, SearchValidationIndicator } from "../components/SearchValidation";

// UK Cities for location suggestions
const UK_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Sheffield", 
  "Bristol", "Newcastle", "Nottingham", "Leicester", "Coventry", "Bradford",
  "Edinburgh", "Glasgow", "Cardiff", "Belfast", "Brighton", "Oxford",
  "Cambridge", "Bath", "York", "Canterbury", "Chester", "Durham"
];

// Studio-specific filter options
const STUDIO_SPECIALTIES = [
  "Traditional", "Realism", "Japanese", "Blackwork", "Watercolor", "Geometric",
  "Neo-Traditional", "Tribal", "Portrait", "Biomechanical", "Abstract", "Minimalist"
];

const STUDIO_SERVICES = [
  "Walk-ins Welcome", "Consultation Available", "Custom Design", "Cover-ups",
  "Touch-ups", "Piercing", "Laser Removal", "Apprenticeship Program"
];

const ESTABLISHMENT_YEARS = [
  { value: "recent", label: "Recently Opened (2020+)", min: 2020, max: 2024 },
  { value: "established", label: "Established (2010-2019)", min: 2010, max: 2019 },
  { value: "veteran", label: "Veteran (2000-2009)", min: 2000, max: 2009 },
  { value: "legacy", label: "Legacy (Before 2000)", min: 1980, max: 1999 }
];

const ARTIST_COUNT_RANGES = [
  { value: "small", label: "Small Studio (1-3 artists)", min: 1, max: 3 },
  { value: "medium", label: "Medium Studio (4-8 artists)", min: 4, max: 8 },
  { value: "large", label: "Large Studio (9-15 artists)", min: 9, max: 15 },
  { value: "mega", label: "Mega Studio (15+ artists)", min: 15, max: 50 }
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

// Advanced filters component for studios
const AdvancedFilters = ({ isOpen, onToggle, filters, onFilterChange }) => {
  if (!isOpen) return null;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Advanced Studio Filters</h3>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Studio Size Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Studio Size</label>
          <select
            value={filters.studioSize || ""}
            onChange={(e) => {
              const range = ARTIST_COUNT_RANGES.find(r => r.value === e.target.value);
              onFilterChange({ 
                studioSize: range ? { min: range.min, max: range.max } : null 
              });
            }}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Any Size</option>
            {ARTIST_COUNT_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Establishment Year Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Established</label>
          <select
            value={filters.establishmentYear || ""}
            onChange={(e) => {
              const range = ESTABLISHMENT_YEARS.find(r => r.value === e.target.value);
              onFilterChange({ 
                establishmentYear: range ? { min: range.min, max: range.max } : null 
              });
            }}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Any Year</option>
            {ESTABLISHMENT_YEARS.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Services Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Services</label>
          <select
            value={filters.services || ""}
            onChange={(e) => onFilterChange({ services: e.target.value || null })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Any Services</option>
            {STUDIO_SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
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
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="3.0">3.0+ Stars</option>
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

// Simple studio card component
const SimpleStudioCard = ({ studio }) => (
  <Card className="p-6" data-testid="studio-card">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {studio.studioName}
    </h3>
    <p className="text-gray-600 mb-2">{studio.locationDisplay}</p>
    {studio.rating && (
      <div className="flex items-center mb-2">
        <span className="text-yellow-500">★</span>
        <span className="ml-1 text-sm text-gray-600">
          {studio.rating} ({studio.reviewCount || 0} reviews)
        </span>
      </div>
    )}
    {studio.specialties && (
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {studio.specialties.slice(0, 3).map((specialty, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {specialty}
            </Badge>
          ))}
        </div>
      </div>
    )}
    <Link href={`/studios/${studio.studioId}`}>
      <Button variant="primary" size="sm" className="w-full">
        View Studio
      </Button>
    </Link>
  </Card>
);

export default function EnhancedStudiosPage() {
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
  const [showMap, setShowMap] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStep, setSearchStep] = useState(0);
  const [saveSearchName, setSaveSearchName] = useState("");

  // Search progress steps
  const searchSteps = [
    { label: 'Validating search', description: 'Checking search parameters' },
    { label: 'Searching studios', description: 'Finding matching studios' },
    { label: 'Processing results', description: 'Organizing and ranking' },
    { label: 'Finalizing', description: 'Preparing display' }
  ];

  // Initialize search from URL parameters
  useEffect(() => {
    const query = SearchQuery.fromURLSearchParams(searchParams);
    setSearchText(query.text || "");
    
    // Set advanced filters from query
    setAdvancedFilters({
      studioSize: query.studioSize,
      establishmentYear: query.establishmentYear,
      services: query.services,
      rating: query.rating,
      location: query.location,
      radius: query.radius
    });

    // Execute search if there are parameters
    if (query.hasFilters()) {
      executeSearchWithProgress(query);
    }
  }, [searchParams]);

  // Generate autocomplete suggestions for studios
  const generateSuggestions = useCallback((text) => {
    if (!text || text.length < 2) {
      setSuggestions([]);
      return;
    }

    const suggestions = [];
    const lowerText = text.toLowerCase();

    // Studio name suggestions (mock data)
    const studioSuggestions = [
      "Ink Masters Studio", "Royal Tattoo", "Black Rose Tattoo", "Urban Art Collective",
      "Sacred Art Studio", "Electric Ink", "Crimson Tide Tattoo", "Phoenix Rising Studio"
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

    // Specialty suggestions
    const specialtySuggestions = STUDIO_SPECIALTIES
      .filter(specialty => specialty.toLowerCase().includes(lowerText))
      .map(specialty => ({
        type: "specialty",
        text: specialty,
        metadata: "Studio Specialty"
      }));

    // Service suggestions
    const serviceSuggestions = STUDIO_SERVICES
      .filter(service => service.toLowerCase().includes(lowerText))
      .map(service => ({
        type: "service",
        text: service,
        metadata: "Studio Service"
      }));

    suggestions.push(...studioSuggestions, ...citySuggestions, ...specialtySuggestions, ...serviceSuggestions);
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
        success(`Found ${totalResults} studio${totalResults === 1 ? '' : 's'} matching your search`, {
          title: 'Search Complete'
        });
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      setSearchProgress(0);
      setSearchStep(0);
      
      // Show error toast with retry option
      error('Failed to search studios. Please check your connection and try again.', {
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
    router.push(`/studios?${params.toString()}`);

    // Execute search with progress
    executeSearchWithProgress(query);
    setShowSuggestions(false);
  }, [searchText, searchValidation, advancedFilters, router, executeSearchWithProgress]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    if (suggestion.type === "specialty") {
      // Navigate to studios with specialty filter
      const query = new SearchQuery({ 
        text: searchText,
        specialties: [suggestion.text],
        ...advancedFilters
      });
      handleSearch(query);
    } else if (suggestion.type === "location") {
      // Set location filter
      const query = new SearchQuery({ 
        text: searchText,
        location: { city: suggestion.text },
        ...advancedFilters
      });
      handleSearch(query);
    } else if (suggestion.type === "service") {
      // Set services filter
      const query = new SearchQuery({ 
        text: searchText,
        services: suggestion.text,
        ...advancedFilters
      });
      handleSearch(query);
    } else {
      // For studio names, use as text search
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
    router.push("/studios");
  }, [clearSearchText, clearFilters, router]);

  // Handle save search
  const handleSaveSearch = useCallback(() => {
    if (!saveSearchName.trim()) return;

    const query = new SearchQuery({
      text: searchText,
      ...advancedFilters
    });

    const searchId = saveSearchToStorage(
      query, 
      saveSearchName.trim(),
      `Search for ${searchText || 'studios'} with ${Object.keys(advancedFilters).length} filters`
    );

    if (searchId) {
      setSaveSearchName("");
      // Could show a toast notification here
      console.log('Search saved successfully');
    }
  }, [searchText, advancedFilters, saveSearchName]);

  // Handle saved search selection
  const handleSavedSearchSelect = useCallback((query, name) => {
    // Update form with saved search parameters
    setSearchText(query.text || "");
    setAdvancedFilters({
      studioSize: query.studioSize,
      establishmentYear: query.establishmentYear,
      services: query.services,
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
      title="Find Your Perfect Tattoo Studio"
      description="Discover professional tattoo studios across the UK. Search by specialty, location, services, and more to find the perfect studio for your next tattoo."
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
                placeholder="Search studios, specialties, services, or locations..."
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
                Search Studios
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

              <Button 
                variant={showMap ? "primary" : "outline"}
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? 'List View' : 'Map View'}
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

        {/* Enhanced Style Filter with Studio-Relevant Metadata */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Filter by Studio Specialties
              </h3>
              <p className="text-neutral-600 text-sm">
                Select tattoo styles to find studios that specialize in them. 
                Hover over styles to see difficulty levels and studio characteristics.
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
                  Found {totalResults} studio{totalResults !== 1 ? "s" : ""}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <StudioCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Map View */}
        {showMap && hasResults && !isSearching && (
          <Card className="p-6 mb-8">
            <div className="h-96 bg-neutral-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                  Studio Map View
                </h3>
                <p className="text-neutral-600">
                  Interactive map showing {totalResults} studio{totalResults !== 1 ? "s" : ""} would be displayed here
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Search Results */}
        {hasResults && !isSearching && !showMap && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="search-results">
            {searchState.results.map((studio) => (
              <SimpleStudioCard 
                key={studio.studioId || studio.PK || studio.id} 
                studio={studio} 
              />
            ))}
          </div>
        )}

        {/* No Results State */}
        {!hasResults && !isSearching && !searchError && searchState.query?.hasFilters() && (
          <NoSearchResults
            searchTerm={searchText}
            onClearSearch={handleClearFilters}
            onBrowseAll={() => router.push("/studios")}
            suggestions={searchState.suggestions?.map(s => s.text) || ['Traditional Studios', 'Realism Specialists', 'Walk-in Friendly', 'Custom Design']}
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

        {/* Call to Action */}
        {hasResults && !isSearching && (
          <Card className="mt-12 text-center p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-gray-600 mb-4">
              Browse our directory of talented tattoo artists or search by style and location.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/artists">
                <Button variant="primary" size="md">
                  Browse Artists
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" size="md">
                  Advanced Search
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}