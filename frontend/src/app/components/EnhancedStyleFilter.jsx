"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { enhancedTattooStyles, difficultyLevels, searchStylesByAlias } from "../data/testData/enhancedTattooStyles";
import { mockArtistData as mockArtists } from "../data/mockArtistData";
import Badge from "../../design-system/components/ui/Badge/Badge";
import Tag from "../../design-system/components/ui/Tag/Tag";
import { debounce } from "../../lib/performance-utils";
import { 
  ariaLiveRegion, 
  keyboardNavigation, 
  touchAccessibility,
  ScreenReaderUtils 
} from "../../lib/accessibility-utils";

// Get styles that exist in our artist data
const AVAILABLE_STYLES = [
  ...new Set(mockArtists.flatMap((artist) => artist.styles)),
].sort();

// Filter enhanced styles to only include those we have artists for
const getAvailableEnhancedStyles = () => {
  return Object.values(enhancedTattooStyles).filter(style => 
    AVAILABLE_STYLES.includes(style.id)
  );
};

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

export default function EnhancedStyleFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Memoize available styles to prevent infinite loops
  const availableEnhancedStyles = useMemo(() => getAvailableEnhancedStyles(), []);
  
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredStyle, setHoveredStyle] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [filteredStyles, setFilteredStyles] = useState(availableEnhancedStyles);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const styleButtonsRef = useRef([]);

  useEffect(() => {
    const styleParams = searchParams.get("styles");
    if (styleParams) setSelected(styleParams.split(","));
    else setSelected([]);
  }, [searchParams]);

  // Memoized filtered styles for performance
  const memoizedFilteredStyles = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableEnhancedStyles;
    } else {
      const searchResults = searchStylesByAlias(searchQuery);
      return searchResults.filter(style => 
        AVAILABLE_STYLES.includes(style.id)
      );
    }
  }, [searchQuery, availableEnhancedStyles]);

  // Debounced search query update
  const debouncedSetSearchQuery = useCallback(
    debounce((query) => {
      setSearchQuery(query);
      setFocusedIndex(-1); // Reset focus when search changes
    }, 300),
    []
  );

  // Update filtered styles when memoized styles change
  useEffect(() => {
    setFilteredStyles(memoizedFilteredStyles);
  }, [memoizedFilteredStyles]);

  const updateSearchParams = useCallback((newSelected) => {
    if (newSelected.length > 0) {
      router.push(`/artists?styles=${newSelected.join(",")}`);
    } else {
      router.push('/artists');
    }
  }, [router]);

  const toggleStyle = useCallback((styleId) => {
    const newSelected = selected.includes(styleId)
      ? selected.filter((s) => s !== styleId)
      : [...selected, styleId];
    
    setSelected(newSelected);
    updateSearchParams(newSelected);
    
    // Announce filter change to screen readers
    const style = enhancedTattooStyles[styleId];
    const isAdded = !selected.includes(styleId);
    ariaLiveRegion.announceFilterChange('Style', style?.name || styleId, isAdded);
  }, [selected, updateSearchParams]);

  const clearAll = useCallback(() => {
    setSelected([]);
    setSearchQuery("");
    setFocusedIndex(-1);
    updateSearchParams([]);
    
    // Announce clearing to screen readers
    ariaLiveRegion.announce('All style filters cleared', 'polite');
    
    // Focus search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [updateSearchParams]);

  // Touch accessibility setup
  useEffect(() => {
    const cleanupFunctions = [];
    
    // Ensure all style buttons meet touch target requirements
    styleButtonsRef.current.forEach(button => {
      if (button) {
        touchAccessibility.ensureTouchTarget(button, 44);
        
        // Add touch handlers for better mobile experience
        const cleanup = touchAccessibility.addTouchHandlers(button, {
          onTap: (event) => {
            const styleId = button.dataset.styleId;
            if (styleId) {
              toggleStyle(styleId);
            }
          }
        });
        
        cleanupFunctions.push(cleanup);
      }
    });
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [filteredStyles, toggleStyle]);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((event, styleId, index) => {
    setIsKeyboardMode(true);
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleStyle(styleId);
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      
      const newIndex = keyboardNavigation.handleArrowNavigation(
        event, 
        styleButtonsRef.current.filter(Boolean), 
        index,
        { 
          orientation: 'grid', 
          columns: 5, // Adjust based on grid layout
          wrap: true 
        }
      );
      
      setFocusedIndex(newIndex);
    }
  }, [toggleStyle]);

  // Handle search input keyboard navigation
  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'ArrowDown' && filteredStyles.length > 0) {
      event.preventDefault();
      setFocusedIndex(0);
      if (styleButtonsRef.current[0]) {
        styleButtonsRef.current[0].focus();
      }
    } else if (event.key === 'Escape') {
      setSearchQuery("");
      debouncedSetSearchQuery("");
    }
  }, [filteredStyles.length, debouncedSetSearchQuery]);

  // Handle mouse interactions (disable keyboard mode)
  const handleMouseEnter = useCallback((style, event) => {
    setIsKeyboardMode(false);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    
    setTooltipPosition({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top - 10
    });
    setHoveredStyle(style);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredStyle(null);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4" data-testid="enhanced-style-filter" ref={containerRef}>
      {/* Header with search and clear */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Filter by Tattoo Style</h3>
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search styles..."
              value={searchQuery}
              onChange={(e) => debouncedSetSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="px-3 py-1.5 text-sm bg-neutral-800 text-white rounded-md border border-neutral-600 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-neutral-900 w-40 touch-target"
              aria-label="Search tattoo styles"
              aria-describedby="search-help"
              data-testid="style-search-input"
              role="searchbox"
              aria-expanded={filteredStyles.length > 0}
              aria-haspopup="listbox"
            />
            <div id="search-help" className="sr-only">
              Type to search for tattoo styles. Use arrow keys to navigate results.
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
          
          {(selected.length > 0 || searchQuery) && (
            <button
              onClick={clearAll}
              className="text-sm px-4 py-1.5 bg-neutral-800 rounded-md hover:bg-neutral-700 transition font-medium text-white border border-neutral-600"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Selected styles display */}
      {selected.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-neutral-300 mb-2">Selected styles:</div>
          <div className="flex flex-wrap gap-2">
            {selected.map((styleId) => {
              const styleData = enhancedTattooStyles[styleId];
              return (
                <Tag
                  key={styleId}
                  variant="accent"
                  size="sm"
                  removable
                  onRemove={() => toggleStyle(styleId)}
                >
                  {styleData?.name || styleId}
                </Tag>
              );
            })}
          </div>
        </div>
      )}

      {/* Style grid */}
      <div className="relative">
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          role="listbox"
          aria-label="Tattoo style filters"
          aria-multiselectable="true"
        >
          {filteredStyles.map((style, index) => {
            const isSelected = selected.includes(style.id);
            const isFocused = focusedIndex === index;
            const ariaLabel = ScreenReaderUtils.createFilterLabel(
              'Style', 
              style.name, 
              isSelected,
              null // Could add count if available
            );
            
            return (
              <button
                key={style.id}
                ref={el => styleButtonsRef.current[index] = el}
                type="button"
                onClick={() => toggleStyle(style.id)}
                onMouseEnter={(e) => handleMouseEnter(style, e)}
                onMouseLeave={handleMouseLeave}
                onKeyDown={(e) => handleKeyDown(e, style.id, index)}
                onFocus={() => setFocusedIndex(index)}
                className={`
                  group relative flex flex-col items-stretch w-full h-20 md:h-24 rounded-xl overflow-hidden
                  bg-neutral-900 transition-all duration-200 ease-out touch-target
                  ${isSelected ? "ring-2 ring-accent-500 shadow-lg shadow-accent-500/25" : ""}
                  ${isFocused && isKeyboardMode ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900" : ""}
                  hover:scale-105 hover:shadow-xl hover:shadow-accent-500/20
                  focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-neutral-900
                  @media (prefers-reduced-motion: reduce) {
                    transition: none;
                    transform: none;
                  }
                `}
                title={style.name}
                data-testid={`style-button-${style.id}`}
                data-style-id={style.id}
                aria-label={ariaLabel}
                aria-pressed={isSelected}
                role="option"
                aria-selected={isSelected}
                tabIndex={isFocused ? 0 : -1}
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
                    <span className="text-white text-sm md:text-base font-semibold leading-tight">
                      {style.name}
                    </span>
                  </div>
                </div>

                {/* Characteristics tags (visible on hover) */}
                <div className="absolute inset-x-2 bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <div className="flex flex-wrap gap-1">
                    {style.characteristics.slice(0, 2).map((char, index) => (
                      <Tag key={index} variant="secondary" size="sm">
                        {char}
                      </Tag>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tooltip */}
        <StyleTooltip 
          style={hoveredStyle} 
          isVisible={!!hoveredStyle} 
          position={tooltipPosition}
        />
      </div>

      {/* No results message */}
      {filteredStyles.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <p className="text-neutral-400 mb-2">No styles found for &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-accent-500 hover:text-accent-400 text-sm"
          >
            Clear search to see all styles
          </button>
        </div>
      )}

      {/* Style count and search info */}
      <div className="mt-4 text-sm text-neutral-400 text-center">
        {searchQuery ? (
          <span>Showing {filteredStyles.length} styles matching &quot;{searchQuery}&quot;</span>
        ) : (
          <span>Showing {filteredStyles.length} available tattoo styles</span>
        )}
      </div>
    </div>
  );
}