"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent,
  Button 
} from "../../design-system/components/ui";
import { enhancedTattooStyles, searchStylesByAlias } from '../data/testData/enhancedTattooStyles';
import { cn } from '../../design-system/utils/cn';

/**
 * SearchFeedbackSystem Component
 * 
 * Provides comprehensive search feedback including:
 * - Search suggestions for ambiguous terms
 * - Related category suggestions
 * - Spelling correction suggestions
 * - Alternative search strategies
 * - Popular search terms
 * 
 * Requirements: 6.3, 6.4, 6.5
 */

// Common search patterns and their corrections
const SEARCH_CORRECTIONS = {
  // Common misspellings
  'tradional': 'traditional',
  'realisim': 'realism',
  'geometic': 'geometric',
  'minimalist': 'minimalist',
  'watercolour': 'watercolor',
  'blackwork': 'blackwork',
  'dotwork': 'dotwork',
  
  // Alternative terms
  'sailor jerry': 'traditional',
  'old school': 'traditional',
  'new school': 'new_school',
  'japanese': 'irezumi',
  'tribal': 'tribal',
  'realistic': 'realism',
  'black and grey': 'black_and_grey',
  'fine line': 'fine_line'
};

// Popular search categories
const POPULAR_CATEGORIES = [
  { id: 'traditional', name: 'Traditional', icon: '⚓', popularity: 85 },
  { id: 'realism', name: 'Realism', icon: '🎭', popularity: 78 },
  { id: 'geometric', name: 'Geometric', icon: '🔷', popularity: 72 },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨', popularity: 68 },
  { id: 'minimalist', name: 'Minimalist', icon: '✨', popularity: 65 },
  { id: 'blackwork', name: 'Blackwork', icon: '⚫', popularity: 62 }
];

// Location suggestions (UK cities)
const POPULAR_LOCATIONS = [
  'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 
  'Sheffield', 'Bristol', 'Newcastle', 'Nottingham', 'Brighton'
];

function SearchSuggestions({ 
  searchQuery, 
  onSuggestionClick,
  maxSuggestions = 6,
  className 
}) {
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase().trim();
    const suggestions = [];

    // Check for spelling corrections
    const correction = SEARCH_CORRECTIONS[query];
    if (correction && correction !== query) {
      suggestions.push({
        type: 'correction',
        text: correction,
        originalText: query,
        subtitle: `Did you mean "${correction}"?`,
        icon: '🔤',
        priority: 10
      });
    }

    // Style suggestions (exact matches and aliases)
    const styleMatches = searchStylesByAlias(query);
    styleMatches.forEach(style => {
      if (suggestions.length < maxSuggestions) {
        suggestions.push({
          type: 'style',
          text: style.name,
          subtitle: `${style.difficulty} difficulty • ${style.popularity}% popularity`,
          icon: '🎨',
          data: style,
          priority: style.name.toLowerCase() === query ? 9 : 7
        });
      }
    });

    // Partial style matches
    Object.values(enhancedTattooStyles).forEach(style => {
      if (suggestions.length >= maxSuggestions) return;
      
      const nameMatch = style.name.toLowerCase().includes(query);
      const aliasMatch = style.aliases.some(alias => 
        alias.toLowerCase().includes(query)
      );
      const characteristicMatch = style.characteristics.some(char =>
        char.toLowerCase().includes(query)
      );

      if ((nameMatch || aliasMatch || characteristicMatch) && 
          !suggestions.some(s => s.data?.id === style.id)) {
        suggestions.push({
          type: 'style',
          text: style.name,
          subtitle: `Tattoo style • ${style.difficulty} difficulty`,
          icon: '🎨',
          data: style,
          priority: nameMatch ? 6 : aliasMatch ? 5 : 4
        });
      }
    });

    // Location suggestions
    POPULAR_LOCATIONS.forEach(location => {
      if (suggestions.length >= maxSuggestions) return;
      
      if (location.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'location',
          text: location,
          subtitle: 'Search in this location',
          icon: '📍',
          priority: 3
        });
      }
    });

    // Popular category suggestions if no specific matches
    if (suggestions.length < 3) {
      POPULAR_CATEGORIES.forEach(category => {
        if (suggestions.length >= maxSuggestions) return;
        
        if (category.name.toLowerCase().includes(query) &&
            !suggestions.some(s => s.text === category.name)) {
          suggestions.push({
            type: 'category',
            text: category.name,
            subtitle: `Popular style • ${category.popularity}% popularity`,
            icon: category.icon,
            priority: 2
          });
        }
      });
    }

    // Sort by priority and return
    return suggestions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, maxSuggestions);
  }, [searchQuery, maxSuggestions]);

  if (suggestions.length === 0) return null;

  return (
    <Card className={cn("mt-4", className)}>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Search Suggestions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.text}-${index}`}
              onClick={() => onSuggestionClick(suggestion)}
              className="flex items-center gap-3 p-3 text-left rounded-lg border border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:bg-[var(--background-secondary)] transition-all duration-200"
            >
              <span className="text-lg" role="img" aria-label={suggestion.type}>
                {suggestion.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text-primary)] truncate">
                  {suggestion.text}
                </div>
                <div className="text-xs text-[var(--text-secondary)] truncate">
                  {suggestion.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchTips({ searchQuery, activeFilters, className }) {
  const tips = useMemo(() => {
    const tips = [];
    
    // Query-specific tips
    if (searchQuery) {
      if (searchQuery.length < 3) {
        tips.push({
          type: 'query',
          text: 'Try using at least 3 characters for better results',
          icon: '💡'
        });
      }
      
      if (searchQuery.includes(' ') && searchQuery.split(' ').length > 3) {
        tips.push({
          type: 'query',
          text: 'Try shorter, more specific search terms',
          icon: '🎯'
        });
      }
    }

    // Filter-specific tips
    const hasFilters = Object.keys(activeFilters).some(key => 
      activeFilters[key] && (Array.isArray(activeFilters[key]) ? activeFilters[key].length > 0 : true)
    );

    if (hasFilters) {
      tips.push({
        type: 'filters',
        text: 'Remove some filters to see more results',
        icon: '🔍'
      });
    }

    // General tips
    if (tips.length === 0) {
      tips.push(
        {
          type: 'general',
          text: 'Use style names like "traditional" or "realism"',
          icon: '🎨'
        },
        {
          type: 'general',
          text: 'Search by location like "London" or "Manchester"',
          icon: '📍'
        },
        {
          type: 'general',
          text: 'Try artist or studio names',
          icon: '👤'
        }
      );
    }

    return tips.slice(0, 3);
  }, [searchQuery, activeFilters]);

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
        Search Tips
      </h4>
      <div className="space-y-1">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span role="img" aria-label={tip.type}>{tip.icon}</span>
            <span>{tip.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PopularSearches({ onSearchClick, className }) {
  const popularSearches = [
    { text: 'Traditional tattoos', type: 'style', icon: '⚓' },
    { text: 'London artists', type: 'location', icon: '📍' },
    { text: 'Realism portraits', type: 'style', icon: '🎭' },
    { text: 'Geometric designs', type: 'style', icon: '🔷' },
    { text: 'Manchester studios', type: 'location', icon: '🏢' },
    { text: 'Watercolor tattoos', type: 'style', icon: '🎨' }
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
        Popular Searches
      </h4>
      <div className="flex flex-wrap gap-2">
        {popularSearches.map((search, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSearchClick(search.text)}
            className="text-xs"
          >
            {search.icon} {search.text}
          </Button>
        ))}
      </div>
    </div>
  );
}

function RelatedCategories({ searchQuery, onCategoryClick, className }) {
  const relatedCategories = useMemo(() => {
    if (!searchQuery) return POPULAR_CATEGORIES.slice(0, 6);

    const query = searchQuery.toLowerCase();
    const related = [];

    // Find style-based relations
    Object.values(enhancedTattooStyles).forEach(style => {
      if (style.name.toLowerCase().includes(query) || 
          style.aliases.some(alias => alias.toLowerCase().includes(query))) {
        
        // Add related styles based on characteristics
        Object.values(enhancedTattooStyles).forEach(relatedStyle => {
          if (relatedStyle.id !== style.id && 
              relatedStyle.characteristics.some(char => 
                style.characteristics.includes(char)
              )) {
            related.push({
              id: relatedStyle.id,
              name: relatedStyle.name,
              icon: '🎨',
              reason: 'Similar characteristics'
            });
          }
        });
      }
    });

    // Remove duplicates and limit
    const uniqueRelated = related.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    ).slice(0, 6);

    return uniqueRelated.length > 0 ? uniqueRelated : POPULAR_CATEGORIES.slice(0, 6);
  }, [searchQuery]);

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
        {searchQuery ? 'Related Categories' : 'Browse Categories'}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {relatedCategories.map((category, index) => (
          <button
            key={category.id || index}
            onClick={() => onCategoryClick(category)}
            className="flex items-center gap-2 p-2 text-left rounded-lg border border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:bg-[var(--background-secondary)] transition-all duration-200"
          >
            <span className="text-base" role="img" aria-label="category">
              {category.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                {category.name}
              </div>
              {category.reason && (
                <div className="text-xs text-[var(--text-secondary)] truncate">
                  {category.reason}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Main SearchFeedbackSystem component
export default function SearchFeedbackSystem({
  searchQuery = "",
  activeFilters = {},
  showSuggestions = true,
  showTips = true,
  showPopular = true,
  showRelated = true,
  onSuggestionClick,
  onSearchClick,
  onCategoryClick,
  className
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after successful search
  useEffect(() => {
    if (searchQuery && searchQuery.length > 0) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [searchQuery]);

  if (!isVisible && searchQuery) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search suggestions for current query */}
      {showSuggestions && searchQuery && (
        <SearchSuggestions
          searchQuery={searchQuery}
          onSuggestionClick={onSuggestionClick}
        />
      )}

      {/* Feedback sections in a grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {showTips && (
            <Card>
              <CardContent className="p-4">
                <SearchTips 
                  searchQuery={searchQuery}
                  activeFilters={activeFilters}
                />
              </CardContent>
            </Card>
          )}

          {showPopular && !searchQuery && (
            <Card>
              <CardContent className="p-4">
                <PopularSearches onSearchClick={onSearchClick} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {showRelated && (
            <Card>
              <CardContent className="p-4">
                <RelatedCategories
                  searchQuery={searchQuery}
                  onCategoryClick={onCategoryClick}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Export sub-components for individual use
export {
  SearchSuggestions,
  SearchTips,
  PopularSearches,
  RelatedCategories
};