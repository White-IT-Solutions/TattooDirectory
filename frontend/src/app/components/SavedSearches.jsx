"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge, Tag } from '../../design-system/components/ui';
import { SearchQuery } from '../../lib/useSearchController';

// Local storage key for saved searches
const SAVED_SEARCHES_KEY = 'tattoo-directory-saved-searches';

// Predefined search presets
const SEARCH_PRESETS = [
  {
    id: 'traditional-london',
    name: 'Traditional Artists in London',
    description: 'Classic traditional tattoo artists in London area',
    query: new SearchQuery({
      styles: ['traditional'],
      location: { city: 'London' },
      radius: 25
    }),
    icon: '🏛️'
  },
  {
    id: 'realism-experienced',
    name: 'Experienced Realism Artists',
    description: 'Senior realism artists with 10+ years experience',
    query: new SearchQuery({
      styles: ['realism'],
      experience: 'senior',
      rating: 4.5
    }),
    icon: '🎨'
  },
  {
    id: 'watercolor-premium',
    name: 'Premium Watercolor Artists',
    description: 'High-end watercolor specialists',
    query: new SearchQuery({
      styles: ['watercolor'],
      priceRange: { min: 150, max: 1000 },
      rating: 4.0
    }),
    icon: '💧'
  },
  {
    id: 'japanese-traditional',
    name: 'Japanese Traditional Masters',
    description: 'Master artists specializing in Japanese traditional',
    query: new SearchQuery({
      styles: ['japanese'],
      experience: 'master',
      difficulty: ['advanced', 'expert']
    }),
    icon: '🌸'
  },
  {
    id: 'geometric-modern',
    name: 'Modern Geometric Artists',
    description: 'Contemporary geometric and minimalist artists',
    query: new SearchQuery({
      styles: ['geometric', 'minimalist'],
      experience: 'experienced',
      availability: 'available'
    }),
    icon: '📐'
  },
  {
    id: 'blackwork-specialists',
    name: 'Blackwork Specialists',
    description: 'Artists specializing in bold blackwork designs',
    query: new SearchQuery({
      styles: ['blackwork'],
      difficulty: ['intermediate', 'advanced'],
      rating: 4.0
    }),
    icon: '⚫'
  }
];

export default function SavedSearches({ onSearchSelect, className = '' }) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [showPresets, setShowPresets] = useState(true);
  const [showSaved, setShowSaved] = useState(true);

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        setSavedSearches(parsedSaved.map(item => ({
          ...item,
          query: new SearchQuery(item.query)
        })));
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }, []);

  // Save a new search
  const saveSearch = useCallback((query, name, description = '') => {
    const newSearch = {
      id: `saved-${Date.now()}`,
      name,
      description,
      query: query.toObject(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 0
    };

    const updatedSaved = [...savedSearches, newSearch];
    setSavedSearches(updatedSaved);

    try {
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSaved));
    } catch (error) {
      console.error('Failed to save search:', error);
    }

    return newSearch.id;
  }, [savedSearches]);

  // Remove a saved search
  const removeSavedSearch = useCallback((searchId) => {
    const updatedSaved = savedSearches.filter(search => search.id !== searchId);
    setSavedSearches(updatedSaved);

    try {
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSaved));
    } catch (error) {
      console.error('Failed to remove saved search:', error);
    }
  }, [savedSearches]);

  // Update search usage
  const updateSearchUsage = useCallback((searchId) => {
    const updatedSaved = savedSearches.map(search => {
      if (search.id === searchId) {
        return {
          ...search,
          lastUsed: new Date().toISOString(),
          useCount: (search.useCount || 0) + 1
        };
      }
      return search;
    });

    setSavedSearches(updatedSaved);

    try {
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSaved));
    } catch (error) {
      console.error('Failed to update search usage:', error);
    }
  }, [savedSearches]);

  // Handle search selection
  const handleSearchSelect = useCallback((search, isPreset = false) => {
    if (!isPreset) {
      updateSearchUsage(search.id);
    }
    
    onSearchSelect?.(search.query, search.name);
  }, [onSearchSelect, updateSearchUsage]);

  // Render search item
  const renderSearchItem = (search, isPreset = false) => (
    <div
      key={search.id}
      className="group flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 hover:border-accent-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => handleSearchSelect(search, isPreset)}
    >
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center text-lg">
          {search.icon || '🔍'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-neutral-900 truncate">
              {search.name}
            </h4>
            {isPreset && (
              <Badge variant="secondary" size="sm">
                Preset
              </Badge>
            )}
            {!isPreset && search.useCount > 0 && (
              <Badge variant="accent" size="sm">
                Used {search.useCount}x
              </Badge>
            )}
          </div>
          
          {search.description && (
            <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
              {search.description}
            </p>
          )}

          {/* Query preview */}
          <div className="flex flex-wrap gap-1">
            {search.query.styles?.map(style => (
              <Tag key={style} variant="accent" size="sm">
                {style}
              </Tag>
            ))}
            {search.query.location && (
              <Tag variant="secondary" size="sm">
                📍 {search.query.location.city || search.query.location.postcode}
              </Tag>
            )}
            {search.query.experience && (
              <Tag variant="secondary" size="sm">
                👨‍🎨 {search.query.experience}
              </Tag>
            )}
            {search.query.rating && (
              <Tag variant="secondary" size="sm">
                ⭐ {search.query.rating}+
              </Tag>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isPreset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removeSavedSearch(search.id);
            }}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </Button>
        )}
        <Button variant="outline" size="sm">
          Use Search
        </Button>
      </div>
    </div>
  );

  if (savedSearches.length === 0 && !showPresets) {
    return null;
  }

  return (
    <Card className={`p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          Saved Searches & Presets
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
          >
            {showPresets ? 'Hide' : 'Show'} Presets
          </Button>
          {savedSearches.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaved(!showSaved)}
            >
              {showSaved ? 'Hide' : 'Show'} Saved
            </Button>
          )}
        </div>
      </div>

      {/* Search Presets */}
      {showPresets && (
        <div className="space-y-3">
          <h4 className="font-medium text-neutral-700 text-sm uppercase tracking-wide">
            Popular Search Presets
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SEARCH_PRESETS.map(preset => renderSearchItem(preset, true))}
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {showSaved && savedSearches.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-neutral-700 text-sm uppercase tracking-wide">
            Your Saved Searches
          </h4>
          <div className="space-y-2">
            {savedSearches
              .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
              .map(search => renderSearchItem(search, false))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {savedSearches.length === 0 && showSaved && (
        <div className="text-center py-6 text-neutral-500">
          <p className="mb-2">No saved searches yet</p>
          <p className="text-sm">
            Perform a search and save it for quick access later
          </p>
        </div>
      )}
    </Card>
  );
}

// Utility function to save a search from outside the component
export const saveSearchToStorage = (query, name, description = '') => {
  try {
    const saved = localStorage.getItem(SAVED_SEARCHES_KEY);
    const existingSaved = saved ? JSON.parse(saved) : [];
    
    const newSearch = {
      id: `saved-${Date.now()}`,
      name,
      description,
      query: query.toObject(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 0
    };

    const updatedSaved = [...existingSaved, newSearch];
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSaved));
    
    return newSearch.id;
  } catch (error) {
    console.error('Failed to save search:', error);
    return null;
  }
};