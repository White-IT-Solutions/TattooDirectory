"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

// Dynamic imports to avoid SSR issues
const SearchResultsContainer = React.lazy(() => import("../components/SearchResultsContainer"));
const AdvancedSearchInterface = React.lazy(() => import("../components/AdvancedSearchInterface"));

// Search Feedback Components
import { ValidatedSearchInput } from "../../design-system/components/feedback/SearchValidation/SearchValidation";
import SearchProgressIndicator from "../../design-system/components/feedback/SearchProgressIndicator/SearchProgressIndicator";
import SearchErrorMessage from "../../design-system/components/feedback/SearchErrorMessage/SearchErrorMessage";
import { useToast } from "../../design-system/components/feedback/Toast";

// Simple button component to avoid design system issues
const SimpleButton = ({ onClick, variant, children, ...props }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === "secondary"
        ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
        : "bg-primary-500 text-white hover:bg-primary-600"
    }`}
    {...props}
  >
    {children}
  </button>
);

// Sort options
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "experience", label: "Experience" },
  { value: "price_low", label: "Price (Low to High)" },
  { value: "price_high", label: "Price (High to Low)" },
  { value: "availability", label: "Availability" }
];

// View mode options
const VIEW_MODES = [
  { value: "grid", label: "Grid", icon: "⊞" },
  { value: "list", label: "List", icon: "☰" },
  { value: "map", label: "Map", icon: "🗺️" }
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error, warning, info } = useToast();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(20);
  const [enhancedTattooStyles, setEnhancedTattooStyles] = useState({});
  const [difficultyLevels, setDifficultyLevels] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Search feedback state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchValidation, setSearchValidation] = useState({ isValid: true });
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStep, setSearchStep] = useState(0);
  const [searchError, setSearchError] = useState(null);

  // Search progress steps
  const searchSteps = [
    'Validating search',
    'Searching database',
    'Processing results',
    'Finalizing'
  ];

  // Initialize with empty data to avoid loading issues
  useEffect(() => {
    setEnhancedTattooStyles({});
    setDifficultyLevels({});
    setSearchQuery(searchParams.get("q") || "");
    setIsLoading(false);
  }, [searchParams]);

  // Enhanced search execution with progress tracking
  const executeSearchWithProgress = async (query) => {
    if (!searchValidation.isValid) {
      warning('Please fix search validation errors before searching', {
        title: 'Invalid Search'
      });
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setSearchStep(0);
    setSearchError(null);
    
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

      // Update URL with search query
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      router.push(`/search?${params.toString()}`);

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Clear progress
      clearInterval(progressInterval);
      setSearchProgress(100);
      setSearchStep(3);
      
      // Show success toast
      success(`Search completed for "${query}"`, {
        title: 'Search Complete'
      });
      
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError({
        type: 'server-error',
        message: 'Search service temporarily unavailable'
      });
      
      // Show error toast with retry option
      error('Failed to execute search. Please try again.', {
        title: 'Search Failed',
        action: {
          label: 'Retry',
          onClick: () => executeSearchWithProgress(query)
        }
      });
    } finally {
      setIsSearching(false);
      // Reset progress after a delay
      setTimeout(() => {
        setSearchProgress(0);
        setSearchStep(0);
      }, 2000);
    }
  };

  // Handle search validation changes
  const handleSearchValidation = (validationData) => {
    setSearchQuery(validationData.value);
    setSearchValidation(validationData.validation);
  };

  // Parse search parameters
  const searchCriteria = useMemo(() => {
    return {
      text: searchParams.get("q") || "",
      styles: searchParams.get("styles")?.split(",").filter(Boolean) || [],
      location: searchParams.get("location") || "",
      radius: parseInt(searchParams.get("radius")) || 25,
      difficulty: searchParams.get("difficulty")?.split(",").filter(Boolean) || [],
      experience: searchParams.get("experience")?.split(",").filter(Boolean) || [],
      priceRange: searchParams.get("price")?.split(",").filter(Boolean) || [],
      availability: searchParams.get("availability")?.split(",").filter(Boolean) || [],
      rating: parseInt(searchParams.get("rating")) || 0,
      sortBy: searchParams.get("sort") || "relevance"
    };
  }, [searchParams]);

  // Convert search criteria to active filters format
  const activeFilters = useMemo(() => {
    const filters = {};
    if (searchCriteria.styles.length > 0) filters.styles = searchCriteria.styles;
    if (searchCriteria.location) filters.location = searchCriteria.location;
    if (searchCriteria.difficulty.length > 0) filters.difficulty = searchCriteria.difficulty;
    if (searchCriteria.experience.length > 0) filters.experience = searchCriteria.experience;
    if (searchCriteria.priceRange.length > 0) filters.priceRange = searchCriteria.priceRange;
    if (searchCriteria.availability.length > 0) filters.availability = searchCriteria.availability;
    if (searchCriteria.rating > 0) filters.rating = searchCriteria.rating;
    if (searchCriteria.radius !== 25) filters.radius = searchCriteria.radius;
    return filters;
  }, [searchCriteria]);

  // Handle filters change
  const handleFiltersChange = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    
    // Update URL parameters based on filters
    Object.keys(newFilters).forEach(key => {
      if (Array.isArray(newFilters[key]) && newFilters[key].length > 0) {
        params.set(key, newFilters[key].join(','));
      } else if (newFilters[key] && !Array.isArray(newFilters[key])) {
        params.set(key, newFilters[key]);
      } else {
        params.delete(key);
      }
    });

    // Remove deleted filters
    Object.keys(activeFilters).forEach(key => {
      if (!newFilters[key] || (Array.isArray(newFilters[key]) && newFilters[key].length === 0)) {
        params.delete(key);
      }
    });

    router.push(`/search?${params.toString()}`);
  };

  // Update URL when sort changes
  useEffect(() => {
    if (sortBy !== searchCriteria.sortBy) {
      const params = new URLSearchParams(searchParams);
      if (sortBy === "relevance") {
        params.delete("sort");
      } else {
        params.set("sort", sortBy);
      }
      router.push(`/search?${params.toString()}`);
    }
  }, [sortBy, searchCriteria.sortBy, searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading search...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Enhanced Search Interface */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Search Artists, Studios & Styles
            </h1>
            
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <ValidatedSearchInput
                  type="general"
                  placeholder="Search for artists, studios, styles, or locations..."
                  onValidatedChange={handleSearchValidation}
                  showSuggestions={true}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2">
                <SimpleButton
                  onClick={() => executeSearchWithProgress(searchQuery)}
                  disabled={!searchValidation.isValid || !searchQuery.trim() || isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </SimpleButton>
                
                <SimpleButton
                  onClick={() => setShowAdvancedSearch(true)}
                  variant="secondary"
                >
                  Advanced
                </SimpleButton>
              </div>
            </div>

            {/* Search Progress */}
            {isSearching && (
              <div className="mt-4">
                <SearchProgressIndicator
                  isLoading={isSearching}
                  progress={searchProgress}
                  steps={searchSteps}
                  currentStep={searchStep}
                  showSteps={true}
                  className="py-2"
                />
              </div>
            )}

            {/* Search Error */}
            {searchError && (
              <div className="mt-4">
                <SearchErrorMessage
                  errorType={searchError.type}
                  query={searchQuery}
                  variant="error"
                  showSuggestions={true}
                  showActions={true}
                  showPopularSearches={true}
                  onRetry={() => executeSearchWithProgress(searchQuery)}
                  onClear={() => {
                    setSearchQuery("");
                    setSearchError(null);
                    const params = new URLSearchParams(searchParams);
                    params.delete('q');
                    router.push(`/search?${params.toString()}`);
                  }}
                  onHelp={() => info('Try searching for artist names, studio names, tattoo styles, or UK locations', { title: 'Search Tips' })}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-neutral-600">
                Enhanced search with comprehensive feedback and validation
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-neutral-300 rounded-md overflow-hidden">
                {VIEW_MODES.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    className={`px-3 py-2 text-sm ${
                      viewMode === mode.value
                        ? "bg-primary-500 text-white"
                        : "bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                    title={mode.label}
                  >
                    {mode.icon}
                  </button>
                ))}
              </div>

              {/* Advanced Search Button */}
              <SimpleButton
                onClick={() => setShowAdvancedSearch(true)}
                variant="secondary"
              >
                Advanced Search
              </SimpleButton>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search Results Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        }>
          <SearchResultsContainer
            searchQuery={searchCriteria.text}
            activeFilters={activeFilters}
            viewMode={viewMode}
            sortBy={sortBy}
            resultsPerPage={resultsPerPage}
            onFiltersChange={handleFiltersChange}
            onViewModeChange={setViewMode}
            onSortChange={setSortBy}
          />
        </Suspense>
      </div>

      {/* Advanced Search Modal */}
      <Suspense fallback={null}>
        <AdvancedSearchInterface
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          onSearch={(criteria) => {
            // This would typically update the URL with new search parameters
            console.log("Advanced search executed:", criteria);
          }}
        />
      </Suspense>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}