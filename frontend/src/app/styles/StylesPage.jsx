"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Badge from '../../design-system/components/ui/Badge/Badge';
import Tag from '../../design-system/components/ui/Tag/Tag';
import Button from '../../design-system/components/ui/Button/Button';
import { Skeleton } from '../../design-system/components/ui/Skeleton/Skeleton';
import { PageWrapper } from '../../design-system/components/layout';
import { enhancedTattooStyles, difficultyLevels, searchStylesByAlias } from '../data/testData/enhancedTattooStyles';
import { 
  NoFilterResults, 
  LoadingEmptyState,
  NewUserOnboarding 
} from '../../design-system/components/feedback/EmptyState';

// Search Feedback Components
import { ValidatedSearchInput } from '../../design-system/components/feedback/SearchValidation/SearchValidation';
import SearchProgressIndicator from '../../design-system/components/feedback/SearchProgressIndicator/SearchProgressIndicator';
import SearchErrorMessage from '../../design-system/components/feedback/SearchErrorMessage/SearchErrorMessage';
import { useToast } from '../../design-system/components/feedback/Toast';

// Data Visualization Components
import {
  BarChart,
  LineChart,
  DonutChart,
  TrendIndicator,
  MetricCard
} from '../../design-system/components/ui/DataVisualization';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../design-system/components/ui';

// Lazy load StyleGallery component
const StyleGallery = React.lazy(() => import('../../design-system/components/ui/StyleGallery/StyleGallery'));

// Get all styles as array
const getAllStyles = () => Object.values(enhancedTattooStyles);

// Tooltip component for style descriptions
const StyleTooltip = ({ style, isVisible, position }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="absolute z-50 w-80 p-4 bg-white rounded-lg shadow-xl border border-neutral-200"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-lg text-primary-600 mb-1">{style.name}</h4>
          <p className="text-sm text-neutral-700 leading-relaxed">{style.description}</p>
        </div>
        
        <div>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Difficulty</span>
          <div className="mt-1">
            <Badge 
              variant={difficultyLevels[style.difficulty].color}
              size="sm"
            >
              {difficultyLevels[style.difficulty].label}
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Characteristics</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {style.characteristics.slice(0, 4).map((char, index) => (
              <Tag key={index} variant="secondary" size="sm">
                {char}
              </Tag>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Popular Motifs</span>
          <div className="text-sm text-neutral-600 mt-1">
            {style.popularMotifs.slice(0, 3).join(", ")}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Time Origin</span>
          <div className="text-sm text-neutral-600 mt-1">{style.timeOrigin}</div>
        </div>
      </div>
    </div>
  );
};

// Popularity indicator component
const PopularityIndicator = ({ popularity }) => {
  const getPopularityLevel = (score) => {
    if (score >= 85) return { label: "Very Popular", color: "success", dots: 5 };
    if (score >= 70) return { label: "Popular", color: "accent", dots: 4 };
    if (score >= 55) return { label: "Moderate", color: "warning", dots: 3 };
    if (score >= 40) return { label: "Niche", color: "secondary", dots: 2 };
    return { label: "Rare", color: "neutral", dots: 1 };
  };

  const level = getPopularityLevel(popularity);

  return (
    <div className="flex items-center gap-1" title={`${level.label} (${popularity}% popularity)`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < level.dots 
              ? level.color === 'success' ? 'bg-success-500' :
                level.color === 'accent' ? 'bg-accent-500' :
                level.color === 'warning' ? 'bg-warning-500' :
                level.color === 'secondary' ? 'bg-neutral-400' :
                'bg-neutral-300'
              : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  );
};

export default function StylesPage() {
  const router = useRouter();
  const { success, error, warning, info } = useToast();
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchValidation, setSearchValidation] = useState({ isValid: true });
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStep, setSearchStep] = useState(0);
  const [searchError, setSearchError] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [hoveredStyle, setHoveredStyle] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "gallery"
  const [selectedStyleForGallery, setSelectedStyleForGallery] = useState("");
  const containerRef = useRef(null);

  // Search progress steps
  const searchSteps = [
    'Validating search',
    'Searching styles',
    'Processing results',
    'Finalizing'
  ];

  useEffect(() => {
    // Load styles data immediately for testing
    const loadStyles = () => {
      setLoading(true);
      try {
        const stylesData = getAllStyles();
        setStyles(stylesData);
        setLoading(false);
      } catch (error) {
        // Error loading styles
        setLoading(false);
        setSearchError({
          type: 'server-error',
          message: 'Failed to load styles data'
        });
      }
    };

    loadStyles();
  }, []);

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
      }, 200);

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Clear progress
      clearInterval(progressInterval);
      setSearchProgress(100);
      setSearchStep(3);
      
      // Get filtered results
      const results = filteredAndSortedStyles();
      
      // Show success toast with results count
      if (results.length > 0) {
        success(`Found ${results.length} style${results.length === 1 ? '' : 's'} matching your search`, {
          title: 'Search Complete'
        });
      } else {
        info('No styles found matching your search criteria', {
          title: 'No Results'
        });
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError({
        type: 'server-error',
        message: 'Search service temporarily unavailable'
      });
      
      // Show error toast with retry option
      error('Failed to search styles. Please try again.', {
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
    
    // Auto-search on valid input with debouncing
    if (validationData.isValid && validationData.value.length >= 2) {
      const timeoutId = setTimeout(() => {
        executeSearchWithProgress(validationData.value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Filter and sort styles
  const filteredAndSortedStyles = () => {
    let filtered = styles;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchStylesByAlias(searchQuery);
    }

    // Apply difficulty filter
    if (difficultyFilter) {
      filtered = filtered.filter(style => style.difficulty === difficultyFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case "popularity":
        return filtered.sort((a, b) => b.popularity - a.popularity);
      case "name":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "difficulty": {
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        return filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      }
      default:
        return filtered;
    }
  };

  const handleMouseEnter = (style, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    
    setTooltipPosition({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top - 10
    });
    setHoveredStyle(style);
  };

  const handleMouseLeave = () => {
    setHoveredStyle(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSearchValidation({ isValid: true });
    setSearchError(null);
    setDifficultyFilter("");
    setSortBy("popularity");
    setIsSearching(false);
    setSearchProgress(0);
    setSearchStep(0);
  };

  const navigateToArtists = (styleId) => {
    router.push(`/artists?styles=${styleId}`);
  };

  const navigateToStudios = (styleId) => {
    router.push(`/studios?styles=${styleId}`);
  };

  if (loading) {
    return (
      <PageWrapper
        title="Tattoo Styles"
        description="Loading tattoo styles..."
        maxWidth="xl"
        contentPadding="lg"
      >
        <div className="space-y-8">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-6" />
            <div className="flex flex-wrap gap-4 mb-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="aspect-square">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  const displayedStyles = filteredAndSortedStyles();

  return (
    <PageWrapper
      title="Tattoo Styles"
      description="Explore different tattoo styles to find the perfect match for your next piece. Each style has its own unique characteristics, history, and artistic approach."
      maxWidth="xl"
      contentPadding="lg"
    >
      <div className="space-y-8" ref={containerRef}>
        {/* Search and Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Enhanced Search Input with Validation */}
            <div className="flex-1 min-w-64">
              <ValidatedSearchInput
                type="general"
                placeholder="Search styles by name, alias, or description..."
                onValidatedChange={handleSearchValidation}
                showSuggestions={true}
                className="w-full"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)]"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)]"
            >
              <option value="popularity">Sort by Popularity</option>
              <option value="name">Sort by Name</option>
              <option value="difficulty">Sort by Difficulty</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-[var(--border-primary)] rounded-md overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none border-0"
              >
                Style Grid
              </Button>
              <Button
                variant={viewMode === "gallery" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("gallery")}
                className="rounded-none border-0 border-l border-[var(--border-primary)]"
              >
                Portfolio Gallery
              </Button>
            </div>

            {/* Search Actions */}
            <Button 
              variant="primary" 
              onClick={() => executeSearchWithProgress(searchQuery)}
              loading={isSearching}
              disabled={!searchValidation.isValid || !searchQuery.trim()}
            >
              Search Styles
            </Button>

            {/* Clear Filters */}
            {(searchQuery || difficultyFilter || sortBy !== "popularity") && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Search Progress */}
          {isSearching && (
            <div className="mb-4">
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
            <div className="mb-4">
              <SearchErrorMessage
                errorType={searchError.type}
                query={searchQuery}
                variant="error"
                showSuggestions={true}
                showActions={true}
                showPopularSearches={true}
                onRetry={() => executeSearchWithProgress(searchQuery)}
                onClear={clearFilters}
                onHelp={() => info('Try searching for style names like "Traditional", "Realism", or "Watercolor"', { title: 'Search Tips' })}
                className="mb-4"
              />
            </div>
          )}

          {/* Style selector for gallery mode */}
          {viewMode === "gallery" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Filter gallery by style (optional):
              </label>
              <select
                value={selectedStyleForGallery}
                onChange={(e) => setSelectedStyleForGallery(e.target.value)}
                className="px-3 py-2 bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)]"
              >
                <option value="">All Styles</option>
                {displayedStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-[var(--text-secondary)] mb-4">
            {searchQuery ? (
              <span>Showing {displayedStyles.length} styles matching &quot;{searchQuery}&quot;</span>
            ) : (
              <span>Showing {displayedStyles.length} tattoo styles</span>
            )}
          </div>
        </div>

        {/* Style Analytics Dashboard */}
        <div className="mb-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Style Trends & Analytics</CardTitle>
              <CardDescription>
                Insights into tattoo style popularity, trends, and distribution across the UK
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Style Metrics */}
                <MetricCard
                  title="Total Styles"
                  value={styles.length}
                  subtitle="Available styles"
                  icon="🎨"
                />
                
                <MetricCard
                  title="Most Popular"
                  value={displayedStyles[0]?.name || "Traditional"}
                  subtitle="Highest demand"
                  icon="🔥"
                />
                
                <MetricCard
                  title="Trending Up"
                  value="Watercolor"
                  change={15.2}
                  trend="up"
                  subtitle="Fastest growing"
                  icon="📈"
                />
                
                <MetricCard
                  title="Avg Difficulty"
                  value={2.3}
                  subtitle="Out of 3 levels"
                  icon="⭐"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Style Popularity Distribution */}
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                    Style Popularity Distribution
                  </h4>
                  <DonutChart
                    data={displayedStyles.slice(0, 6).map((style, index) => ({
                      label: style.name,
                      value: style.popularity,
                      color: [
                        '#8B5CF6', '#06B6D4', '#10B981', 
                        '#F59E0B', '#EF4444', '#6B7280'
                      ][index]
                    }))}
                    size={250}
                    showLabels={true}
                  />
                </div>

                {/* Difficulty Level Distribution */}
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                    Styles by Difficulty Level
                  </h4>
                  <BarChart
                    data={[
                      { 
                        label: 'Beginner', 
                        value: styles.filter(s => s.difficulty === 'beginner').length 
                      },
                      { 
                        label: 'Intermediate', 
                        value: styles.filter(s => s.difficulty === 'intermediate').length 
                      },
                      { 
                        label: 'Advanced', 
                        value: styles.filter(s => s.difficulty === 'advanced').length 
                      }
                    ]}
                    height={200}
                    color="#8B5CF6"
                    showValues={true}
                  />
                </div>

                {/* Style Trends Over Time */}
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                    Style Popularity Trends (6 Months)
                  </h4>
                  <LineChart
                    data={[
                      { x: 'Jul', y: 78 },
                      { x: 'Aug', y: 82 },
                      { x: 'Sep', y: 85 },
                      { x: 'Oct', y: 88 },
                      { x: 'Nov', y: 91 },
                      { x: 'Dec', y: 95 }
                    ]}
                    height={200}
                    color="#10B981"
                    showDots={true}
                  />
                </div>

                {/* Style Performance Indicators */}
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-4">
                    Style Performance Metrics
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Traditional Growth</span>
                      <TrendIndicator value={5.2} trend="up" size="sm" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Realism Demand</span>
                      <TrendIndicator value={12.8} trend="up" size="sm" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Watercolor Trend</span>
                      <TrendIndicator value={18.5} trend="up" size="sm" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Japanese Stability</span>
                      <TrendIndicator value={2.1} trend="neutral" size="sm" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Tribal Interest</span>
                      <TrendIndicator value={-3.2} trend="down" size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Display */}
        {viewMode === "grid" ? (
          <StyleGridView 
            displayedStyles={displayedStyles}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            navigateToArtists={navigateToArtists}
            navigateToStudios={navigateToStudios}
            hoveredStyle={hoveredStyle}
            tooltipPosition={tooltipPosition}
          />
        ) : (
          <StyleGalleryView selectedStyleForGallery={selectedStyleForGallery} />
        )}

        {/* No results message */}
        {displayedStyles.length === 0 && (
          <NoFilterResults
            filterType="styles"
            onClearFilters={clearFilters}
            onResetAll={() => {
              setSearchQuery("");
              setDifficultyFilter("");
              setSortBy("popularity");
            }}
            activeFiltersCount={
              (searchQuery ? 1 : 0) + 
              (difficultyFilter ? 1 : 0) + 
              (sortBy !== "popularity" ? 1 : 0)
            }
          />
        )}

        {/* Style aliases info */}
        {searchQuery && displayedStyles.length > 0 && (
          <div className="mt-8 p-4 bg-[var(--background-secondary)] rounded-lg">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              Search Tips
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Try searching by alternative names like &quot;sailor jerry&quot; for Traditional, &quot;irezumi&quot; for Japanese, 
              or &quot;single needle&quot; for Fine Line styles.
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// Separate component for Style Grid View
const StyleGridView = ({ 
  displayedStyles, 
  handleMouseEnter, 
  handleMouseLeave, 
  navigateToArtists, 
  navigateToStudios,
  hoveredStyle,
  tooltipPosition
}) => (
  <div className="relative">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {displayedStyles.map((style) => (
        <div
          key={style.id}
          className="group relative flex flex-col items-stretch w-full aspect-square rounded-xl overflow-hidden bg-[var(--background-secondary)] transition-all duration-200 ease-out hover:scale-105 hover:shadow-xl cursor-pointer"
          onMouseEnter={(e) => handleMouseEnter(style, e)}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background image */}
          {style.image && (
            <>
              <Image
                src={style.image}
                alt={`${style.name} tattoo style`}
                fill
                className="object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            </>
          )}

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-between h-full p-3">
            {/* Top section with difficulty badge and popularity */}
            <div className="flex justify-between items-start">
              <Badge 
                variant={difficultyLevels[style.difficulty].color}
                size="sm"
              >
                {difficultyLevels[style.difficulty].label}
              </Badge>
              <PopularityIndicator popularity={style.popularity} />
            </div>

            {/* Bottom section with style name and actions */}
            <div className="space-y-2">
              <div className="text-left">
                <span className="text-white text-base font-semibold leading-tight block">
                  {style.name}
                </span>
                {style.aliases.length > 0 && (
                  <span className="text-neutral-300 text-xs">
                    aka {style.aliases[0]}
                  </span>
                )}
              </div>

              {/* Action buttons (visible on hover) */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToArtists(style.id);
                  }}
                  className="text-xs px-2 py-1"
                >
                  Find Artists
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToStudios(style.id);
                  }}
                  className="text-xs px-2 py-1"
                >
                  Find Studios
                </Button>
              </div>
            </div>
          </div>

          {/* Characteristics tags (visible on hover) */}
          <div className="absolute inset-x-3 bottom-16 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            <div className="flex flex-wrap gap-1">
              {style.characteristics.slice(0, 2).map((char, index) => (
                <Tag key={index} variant="secondary" size="sm">
                  {char}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Tooltip */}
    <StyleTooltip 
      style={hoveredStyle} 
      isVisible={!!hoveredStyle} 
      position={tooltipPosition}
    />
  </div>
);

// Separate component for Style Gallery View
const StyleGalleryView = ({ selectedStyleForGallery }) => (
  <div className="bg-[var(--background-primary)] rounded-lg p-6">
    <div className="mb-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Style Portfolio Gallery
      </h2>
      <p className="text-[var(--text-secondary)]">
        Browse tattoo portfolio images organized by style with advanced filtering and lightbox viewing.
      </p>
    </div>
    
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-neutral-600">Loading gallery...</span>
      </div>
    }>
      <StyleGallery
        initialStyle={selectedStyleForGallery}
        showFilters={true}
        maxImages={50}
        columns={4}
        lazyLoading={true}
      />
    </Suspense>
  </div>
);