"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Card, 
  CardContent,
  Button,
  Input,
  Badge,
  Tag
} from '../index';
import { cn } from '../../../utils/cn';
import { enhancedTattooStyles, difficultyLevels, searchStylesByAlias } from '../../../../app/data/testData/enhancedTattooStyles';

/**
 * Popularity indicator component for styles
 */
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
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            i < level.dots 
              ? level.color === 'success' ? 'bg-[var(--status-success)]' :
                level.color === 'accent' ? 'bg-[var(--interactive-primary)]' :
                level.color === 'warning' ? 'bg-[var(--status-warning)]' :
                level.color === 'secondary' ? 'bg-[var(--text-tertiary)]' :
                'bg-[var(--text-quaternary)]'
              : 'bg-[var(--background-tertiary)]'
          )}
        />
      ))}
    </div>
  );
};

/**
 * StudioSearch Component
 * 
 * Advanced search and filtering component for studios with:
 * - Location-based filtering with autocomplete
 * - Filtering by studio specialties and ratings
 * - Studio name and location search with suggestions
 * - Map view toggle for studio locations
 * - Sorting options (distance, rating, established date)
 * 
 * Requirements: 6.2, 7.2, 11.2
 */
export default function StudioSearch({
  studios = [],
  onFilterChange,
  onSortChange,
  onViewModeChange,
  onMapToggle,
  className,
  ...props
}) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [specialtyFilters, setSpecialtyFilters] = useState([]);
  const [styleFilters, setStyleFilters] = useState([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [showMap, setShowMap] = useState(false);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStyleFilters, setShowStyleFilters] = useState(false);
  const [establishedYearRange, setEstablishedYearRange] = useState([2000, 2024]);
  const [artistCountRange, setArtistCountRange] = useState([1, 20]);
  
  // Style search state
  const [styleSearchQuery, setStyleSearchQuery] = useState('');
  const [hoveredStyle, setHoveredStyle] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Refs for autocomplete
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Get unique values for filter options - memoized to prevent infinite loops
  const allSpecialties = useMemo(() => 
    [...new Set(studios.flatMap(studio => studio.specialties || []))].sort(), 
    [studios]
  );
  const allLocations = useMemo(() => 
    [...new Set(studios.map(studio => studio.locationDisplay))].sort(), 
    [studios]
  );
  const allCities = useMemo(() => 
    [...new Set(studios.map(studio => studio.address?.city).filter(Boolean))].sort(), 
    [studios]
  );
  
  // Get available styles from studios data
  const availableStyles = useMemo(() => {
    const studioStyles = new Set(studios.flatMap(studio => studio.styles || studio.specialties || []));
    return Object.values(enhancedTattooStyles).filter(style => 
      studioStyles.has(style.id) || studioStyles.has(style.name)
    );
  }, [studios]);
  
  // Filter styles based on search query
  const filteredStyles = useMemo(() => {
    if (!styleSearchQuery.trim()) {
      return availableStyles;
    } else {
      const searchResults = searchStylesByAlias(styleSearchQuery);
      return searchResults.filter(style => 
        availableStyles.some(availableStyle => availableStyle.id === style.id)
      );
    }
  }, [styleSearchQuery, availableStyles]);

  // Generate search suggestions based on input
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const newSuggestions = [];

    // Studio name suggestions
    studios.forEach(studio => {
      if (studio.studioName.toLowerCase().includes(searchLower)) {
        newSuggestions.push({
          type: 'studio',
          value: studio.studioName,
          label: studio.studioName,
          subtitle: studio.locationDisplay,
          id: studio.studioId
        });
      }
    });

    // Location suggestions
    allLocations.forEach(location => {
      if (location.toLowerCase().includes(searchLower)) {
        newSuggestions.push({
          type: 'location',
          value: location,
          label: location,
          subtitle: 'Location'
        });
      }
    });

    // Specialty suggestions
    allSpecialties.forEach(specialty => {
      if (specialty.toLowerCase().includes(searchLower)) {
        newSuggestions.push({
          type: 'specialty',
          value: specialty,
          label: specialty,
          subtitle: 'Specialty'
        });
      }
    });

    // Style suggestions
    availableStyles.forEach(style => {
      if (style.name.toLowerCase().includes(searchLower) || 
          style.aliases.some(alias => alias.toLowerCase().includes(searchLower))) {
        newSuggestions.push({
          type: 'style',
          value: style.id,
          label: style.name,
          subtitle: 'Tattoo Style',
          difficulty: style.difficulty,
          popularity: style.popularity
        });
      }
    });

    setSuggestions(newSuggestions.slice(0, 8)); // Limit to 8 suggestions
    setShowSuggestions(newSuggestions.length > 0);
  }, [searchTerm, studios, allLocations, allSpecialties]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setActiveSuggestion(-1);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          selectSuggestion(suggestions[activeSuggestion]);
        } else {
          applyFilters();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion) => {
    switch (suggestion.type) {
      case 'studio':
        setSearchTerm(suggestion.value);
        break;
      case 'location':
        setLocationFilter(suggestion.value);
        setSearchTerm('');
        break;
      case 'specialty':
        if (!specialtyFilters.includes(suggestion.value)) {
          setSpecialtyFilters(prev => [...prev, suggestion.value]);
        }
        setSearchTerm('');
        break;
      case 'style':
        if (!styleFilters.includes(suggestion.value)) {
          setStyleFilters(prev => [...prev, suggestion.value]);
        }
        setSearchTerm('');
        break;
    }
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  // Apply all filters
  const applyFilters = () => {
    setShowSuggestions(false);
  };

  // Handle specialty filter toggle
  const toggleSpecialtyFilter = (specialty) => {
    setSpecialtyFilters(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  // Handle style filter toggle
  const toggleStyleFilter = (styleId) => {
    setStyleFilters(prev => 
      prev.includes(styleId)
        ? prev.filter(s => s !== styleId)
        : [...prev, styleId]
    );
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    onSortChange?.(newSortBy);
  };

  // Handle view mode change
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    onViewModeChange?.(newViewMode);
  };

  // Handle map toggle
  const handleMapToggle = () => {
    const newShowMap = !showMap;
    setShowMap(newShowMap);
    onMapToggle?.(newShowMap);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setSpecialtyFilters([]);
    setStyleFilters([]);
    setRatingFilter(0);
    setEstablishedYearRange([2000, 2024]);
    setArtistCountRange([1, 20]);
    setStyleSearchQuery('');
  };

  // Apply filters when any filter changes
  useEffect(() => {
    const filters = {
      searchTerm,
      locationFilter,
      specialtyFilters,
      styleFilters,
      ratingFilter,
      establishedYearRange,
      artistCountRange
    };
    
    onFilterChange?.(filters);
  }, [searchTerm, locationFilter, specialtyFilters, styleFilters, ratingFilter, establishedYearRange, artistCountRange]);

  // Style tooltip handlers
  const handleStyleMouseEnter = (style, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left,
      y: rect.top - 10
    });
    setHoveredStyle(style);
  };

  const handleStyleMouseLeave = () => {
    setHoveredStyle(null);
  };

  return (
    <Card 
      elevation="medium" 
      padding="lg" 
      className={cn('space-y-6', className)}
      {...props}
    >
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input with Autocomplete */}
          <div className="flex-1 relative">
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search studios by name, location, or specialty..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full pr-10"
              data-testid="studio-search-input"
            />
            
            {/* Search Icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-md shadow-lg max-h-64 overflow-y-auto"
                data-testid="search-suggestions"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}`}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-[var(--background-secondary)] transition-colors',
                      'flex items-center justify-between',
                      activeSuggestion === index && 'bg-[var(--background-secondary)]'
                    )}
                    onClick={() => selectSuggestion(suggestion)}
                    data-testid={`suggestion-${index}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">
                        {suggestion.label}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {suggestion.subtitle}
                        {suggestion.type === 'style' && suggestion.difficulty && (
                          <span className="ml-2">
                            <Badge 
                              variant={difficultyLevels[suggestion.difficulty].color}
                              size="sm"
                            >
                              {difficultyLevels[suggestion.difficulty].label}
                            </Badge>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {suggestion.type === 'style' && suggestion.popularity && (
                        <PopularityIndicator popularity={suggestion.popularity} />
                      )}
                      <Badge variant="ghost" size="sm">
                        {suggestion.type}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {/* Map Toggle */}
            <Button
              variant={showMap ? "primary" : "outline"}
              size="md"
              onClick={handleMapToggle}
              className="flex items-center gap-2"
              data-testid="map-toggle"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {showMap ? 'List View' : 'Map View'}
            </Button>

            {/* Style Filters Toggle */}
            <Button
              variant={styleFilters.length > 0 ? "primary" : "outline"}
              size="md"
              onClick={() => setShowStyleFilters(!showStyleFilters)}
              className="flex items-center gap-2"
              data-testid="style-filters-toggle"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              Styles {styleFilters.length > 0 && `(${styleFilters.length})`}
            </Button>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
              data-testid="advanced-filters-toggle"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Location Filter */}
        <div className="flex-1 min-w-48">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md bg-[var(--background-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)]"
            data-testid="location-filter"
          >
            <option value="">All Locations</option>
            {allCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div className="flex-1 min-w-32">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md bg-[var(--background-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)]"
            data-testid="rating-filter"
          >
            <option value={0}>Any Rating</option>
            <option value={4.5}>4.5+ Stars</option>
            <option value={4.0}>4.0+ Stars</option>
            <option value={3.5}>3.5+ Stars</option>
            <option value={3.0}>3.0+ Stars</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex-1 min-w-40">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md bg-[var(--background-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)]"
            data-testid="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="rating">Sort by Rating</option>
            <option value="artists">Sort by Artists</option>
            <option value="established">Sort by Established</option>
            <option value="distance">Sort by Distance</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex border border-[var(--border-primary)] rounded-md overflow-hidden">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={cn(
              'px-3 py-2 text-sm transition-colors min-w-16',
              viewMode === 'grid'
                ? 'bg-[var(--interactive-primary)] text-white'
                : 'bg-[var(--background-primary)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]'
            )}
            data-testid="grid-view-button"
          >
            <svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={cn(
              'px-3 py-2 text-sm transition-colors min-w-16',
              viewMode === 'list'
                ? 'bg-[var(--interactive-primary)] text-white'
                : 'bg-[var(--background-primary)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)]'
            )}
            data-testid="list-view-button"
          >
            <svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || locationFilter || specialtyFilters.length > 0 || styleFilters.length > 0 || ratingFilter > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Active filters:</span>
          
          {searchTerm && (
            <Tag
              variant="primary"
              size="sm"
              removable
              onRemove={() => setSearchTerm('')}
              data-testid="search-filter-tag"
            >
              Search: {searchTerm}
            </Tag>
          )}
          
          {locationFilter && (
            <Tag
              variant="primary"
              size="sm"
              removable
              onRemove={() => setLocationFilter('')}
              data-testid="location-filter-tag"
            >
              Location: {locationFilter}
            </Tag>
          )}
          
          {specialtyFilters.map(specialty => (
            <Tag
              key={specialty}
              variant="primary"
              size="sm"
              removable
              onRemove={() => toggleSpecialtyFilter(specialty)}
              data-testid={`specialty-filter-tag-${specialty}`}
            >
              {specialty}
            </Tag>
          ))}
          
          {styleFilters.map(styleId => {
            const style = enhancedTattooStyles[styleId];
            return (
              <Tag
                key={styleId}
                variant="accent"
                size="sm"
                removable
                onRemove={() => toggleStyleFilter(styleId)}
                data-testid={`style-filter-tag-${styleId}`}
              >
                {style?.name || styleId}
              </Tag>
            );
          })}
          
          {ratingFilter > 0 && (
            <Tag
              variant="primary"
              size="sm"
              removable
              onRemove={() => setRatingFilter(0)}
              data-testid="rating-filter-tag"
            >
              {ratingFilter}+ Stars
            </Tag>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
            data-testid="clear-filters-button"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Style Filters Panel */}
      {showStyleFilters && (
        <div className="border-t border-[var(--border-subtle)] pt-6 space-y-4 relative">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Filter by Tattoo Style</h3>
            <div className="flex items-center gap-3">
              {/* Style search input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search styles..."
                  value={styleSearchQuery}
                  onChange={(e) => setStyleSearchQuery(e.target.value)}
                  className="w-40 text-sm"
                  data-testid="style-search-input"
                />
                {styleSearchQuery && (
                  <button
                    onClick={() => setStyleSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {styleFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStyleFilters([])}
                  className="text-xs"
                >
                  Clear Styles
                </Button>
              )}
            </div>
          </div>

          {/* Selected styles display */}
          {styleFilters.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-[var(--text-secondary)] mb-2">Selected styles:</div>
              <div className="flex flex-wrap gap-2">
                {styleFilters.map((styleId) => {
                  const styleData = enhancedTattooStyles[styleId];
                  return (
                    <Tag
                      key={styleId}
                      variant="accent"
                      size="sm"
                      removable
                      onRemove={() => toggleStyleFilter(styleId)}
                    >
                      {styleData?.name || styleId}
                    </Tag>
                  );
                })}
              </div>
            </div>
          )}

          {/* Style grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredStyles.map((style) => {
              const isSelected = styleFilters.includes(style.id);
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => toggleStyleFilter(style.id)}
                  onMouseEnter={(e) => handleStyleMouseEnter(style, e)}
                  onMouseLeave={handleStyleMouseLeave}
                  className={cn(
                    'group relative flex flex-col items-stretch w-full h-16 rounded-lg overflow-hidden',
                    'bg-[var(--background-secondary)] transition-all duration-200 ease-out border',
                    isSelected 
                      ? 'ring-2 ring-[var(--interactive-primary)] shadow-lg border-[var(--interactive-primary)]' 
                      : 'border-[var(--border-primary)] hover:border-[var(--interactive-primary)]',
                    'hover:scale-105 hover:shadow-md',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)]'
                  )}
                  title={style.name}
                  data-testid={`style-button-${style.id}`}
                >
                  {/* Background image */}
                  {style.image && (
                    <>
                      <img
                        src={style.image}
                        alt={`${style.name} tattoo style`}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                    </>
                  )}

                  {/* Content overlay */}
                  <div className="relative z-10 flex flex-col justify-between h-full p-2">
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

                    {/* Bottom section with style name */}
                    <div className="text-left">
                      <span className="text-white text-xs font-semibold leading-tight">
                        {style.name}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* No results message */}
          {filteredStyles.length === 0 && styleSearchQuery && (
            <div className="text-center py-4">
              <p className="text-[var(--text-secondary)] mb-2">No styles found for "{styleSearchQuery}"</p>
              <button
                onClick={() => setStyleSearchQuery('')}
                className="text-[var(--interactive-primary)] hover:text-[var(--interactive-secondary)] text-sm"
              >
                Clear search to see all styles
              </button>
            </div>
          )}

          {/* Style count info */}
          <div className="text-sm text-[var(--text-tertiary)] text-center">
            {styleSearchQuery ? (
              <span>Showing {filteredStyles.length} styles matching "{styleSearchQuery}"</span>
            ) : (
              <span>Showing {filteredStyles.length} available tattoo styles</span>
            )}
          </div>

          {/* Style Tooltip */}
          {hoveredStyle && (
            <div 
              className="absolute z-50 w-80 p-4 bg-[var(--background-primary)] rounded-lg shadow-xl border border-[var(--border-primary)]"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: 'translateY(-100%)'
              }}
            >
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-lg text-[var(--interactive-primary)] mb-1">{hoveredStyle.name}</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{hoveredStyle.description}</p>
                </div>
                
                <div>
                  <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Difficulty</span>
                  <div className="mt-1">
                    <Badge 
                      variant={difficultyLevels[hoveredStyle.difficulty].color}
                      size="sm"
                    >
                      {difficultyLevels[hoveredStyle.difficulty].label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Characteristics</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hoveredStyle.characteristics.slice(0, 4).map((char, index) => (
                      <Tag key={index} variant="secondary" size="sm">
                        {char}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Popular Motifs</span>
                  <div className="text-sm text-[var(--text-secondary)] mt-1">
                    {hoveredStyle.popularMotifs.slice(0, 3).join(", ")}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Time Origin</span>
                  <div className="text-sm text-[var(--text-secondary)] mt-1">{hoveredStyle.timeOrigin}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="border-t border-[var(--border-subtle)] pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Specialty Filters */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Specialties</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allSpecialties.map(specialty => (
                  <label
                    key={specialty}
                    className="flex items-center gap-2 cursor-pointer hover:bg-[var(--background-secondary)] p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={specialtyFilters.includes(specialty)}
                      onChange={() => toggleSpecialtyFilter(specialty)}
                      className="rounded border-[var(--border-primary)] text-[var(--interactive-primary)] focus:ring-[var(--interactive-primary)]"
                      data-testid={`specialty-checkbox-${specialty}`}
                    />
                    <span className="text-sm text-[var(--text-primary)]">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Established Year Range */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Established Year</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1990"
                    max="2024"
                    value={establishedYearRange[0]}
                    onChange={(e) => setEstablishedYearRange([Number(e.target.value), establishedYearRange[1]])}
                    className="flex-1 px-2 py-1 border border-[var(--border-primary)] rounded text-sm"
                    placeholder="From"
                    data-testid="established-year-from"
                  />
                  <input
                    type="number"
                    min="1990"
                    max="2024"
                    value={establishedYearRange[1]}
                    onChange={(e) => setEstablishedYearRange([establishedYearRange[0], Number(e.target.value)])}
                    className="flex-1 px-2 py-1 border border-[var(--border-primary)] rounded text-sm"
                    placeholder="To"
                    data-testid="established-year-to"
                  />
                </div>
              </div>
            </div>

            {/* Artist Count Range */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Number of Artists</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={artistCountRange[0]}
                    onChange={(e) => setArtistCountRange([Number(e.target.value), artistCountRange[1]])}
                    className="flex-1 px-2 py-1 border border-[var(--border-primary)] rounded text-sm"
                    placeholder="Min"
                    data-testid="artist-count-min"
                  />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={artistCountRange[1]}
                    onChange={(e) => setArtistCountRange([artistCountRange[0], Number(e.target.value)])}
                    className="flex-1 px-2 py-1 border border-[var(--border-primary)] rounded text-sm"
                    placeholder="Max"
                    data-testid="artist-count-max"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}