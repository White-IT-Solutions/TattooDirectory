"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cva } from '../../../utils/cn';
import Input from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import Badge from '../../ui/Badge/Badge';

import { enhancedTattooStyles } from '../../../../app/data/testData/enhancedTattooStyles';

// Smart Search variant configurations
const smartSearchVariants = cva(
  [
    'relative w-full max-w-2xl mx-auto'
  ].join(' ')
);

const searchResultsVariants = cva(
  [
    'absolute top-full left-0 right-0 z-50',
    'bg-[var(--background-primary)]',
    'border border-[var(--border-primary)]',
    'rounded-[var(--radius-md)]',
    'shadow-lg shadow-[var(--shadow-color)]/10',
    'max-h-96 overflow-y-auto',
    'mt-1'
  ].join(' ')
);

const contextualHelpVariants = cva(
  [
    'absolute top-full left-0 right-0 z-50',
    'bg-[var(--background-primary)]',
    'border border-[var(--border-primary)]',
    'rounded-[var(--radius-md)]',
    'shadow-lg shadow-[var(--shadow-color)]/10',
    'max-h-80 overflow-y-auto',
    'mt-1 p-4'
  ].join(' ')
);

const searchTipVariants = cva(
  [
    'p-3 rounded-[var(--radius-sm)]',
    'bg-[var(--background-secondary)]',
    'border border-[var(--border-muted)]',
    'transition-colors duration-150',
    'hover:bg-[var(--interactive-secondary)]',
    'cursor-pointer'
  ].join(' ')
);

const shortcutVariants = cva(
  [
    'flex items-center space-x-3 p-3',
    'rounded-[var(--radius-sm)]',
    'transition-colors duration-150',
    'hover:bg-[var(--interactive-secondary)]',
    'cursor-pointer'
  ].join(' ')
);

const searchResultItemVariants = cva(
  [
    'flex items-center justify-between',
    'px-4 py-3',
    'cursor-pointer',
    'transition-colors duration-150',
    'border-b border-[var(--border-muted)] last:border-b-0'
  ].join(' '),
  {
    variants: {
      highlighted: {
        true: 'bg-[var(--interactive-secondary)] text-[var(--text-primary)]',
        false: 'hover:bg-[var(--interactive-secondary)] text-[var(--text-secondary)]'
      },
      type: {
        artist: 'border-l-4 border-l-[var(--interactive-primary)]',
        studio: 'border-l-4 border-l-[var(--interactive-accent)]',
        style: 'border-l-4 border-l-[var(--feedback-success)]',
        location: 'border-l-4 border-l-[var(--feedback-warning)]'
      }
    },
    defaultVariants: {
      highlighted: false,
      type: 'artist'
    }
  }
);

// Search result type icons
const SearchIcons = {
  artist: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  studio: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  style: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  location: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  settings: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  map: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  palette: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h10a2 2 0 012 2v2a2 2 0 01-2 2H9" />
    </svg>
  ),
  star: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  help: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

// Mock search data - in real app this would come from API
const mockSearchData = {
  artists: [
    { 
      id: '1', 
      name: 'Sarah Chen', 
      studio: 'Ink & Steel', 
      location: 'London', 
      styles: ['Traditional', 'Neo-Traditional'],
      experience: '8 years',
      rating: 4.8,
      specialties: ['Bold Lines', 'Classic Imagery'],
      availability: 'Available'
    },
    { 
      id: '2', 
      name: 'Marcus Rodriguez', 
      studio: 'Black Rose Tattoo', 
      location: 'Manchester', 
      styles: ['Realism', 'Portrait'],
      experience: '12 years',
      rating: 4.9,
      specialties: ['Photorealistic', 'Portrait Work'],
      availability: 'Booking 2 weeks out'
    },
    { 
      id: '3', 
      name: 'Emma Thompson', 
      studio: 'Sacred Art', 
      location: 'Birmingham', 
      styles: ['Watercolor', 'Abstract'],
      experience: '6 years',
      rating: 4.7,
      specialties: ['Color Blending', 'Abstract Art'],
      availability: 'Available'
    }
  ],
  studios: [
    { 
      id: '1', 
      name: 'Ink & Steel', 
      location: 'Shoreditch, London', 
      artistCount: 8,
      rating: 4.6,
      specialties: ['Traditional', 'Neo-Traditional', 'Japanese'],
      established: '2015'
    },
    { 
      id: '2', 
      name: 'Black Rose Tattoo', 
      location: 'Northern Quarter, Manchester', 
      artistCount: 5,
      rating: 4.8,
      specialties: ['Realism', 'Portrait', 'Black & Grey'],
      established: '2012'
    },
    { 
      id: '3', 
      name: 'Sacred Art', 
      location: 'Jewellery Quarter, Birmingham', 
      artistCount: 12,
      rating: 4.5,
      specialties: ['Watercolor', 'Abstract', 'Fine Line'],
      established: '2018'
    }
  ],
  locations: [
    { 
      id: '1', 
      name: 'London', 
      region: 'Greater London', 
      artistCount: 156,
      studioCount: 45,
      popularStyles: ['Traditional', 'Realism', 'Japanese']
    },
    { 
      id: '2', 
      name: 'Manchester', 
      region: 'Greater Manchester', 
      artistCount: 89,
      studioCount: 28,
      popularStyles: ['Realism', 'Black & Grey', 'Portrait']
    },
    { 
      id: '3', 
      name: 'Birmingham', 
      region: 'West Midlands', 
      artistCount: 67,
      studioCount: 22,
      popularStyles: ['Watercolor', 'Fine Line', 'Abstract']
    }
  ]
};

// Recent searches storage key
const RECENT_SEARCHES_KEY = 'tattoo-directory-recent-searches';

// Search tips and examples
const searchTips = [
  {
    category: 'Artists',
    examples: ['Sarah Chen', 'Marcus Rodriguez', 'Emma Thompson'],
    tip: 'Search by artist name to find specific tattoo artists'
  },
  {
    category: 'Styles',
    examples: ['Traditional', 'Realism', 'Watercolor', 'Japanese'],
    tip: 'Find artists who specialize in specific tattoo styles'
  },
  {
    category: 'Studios',
    examples: ['Ink & Steel', 'Black Rose Tattoo', 'Sacred Art'],
    tip: 'Search for tattoo studios and parlors'
  },
  {
    category: 'Locations',
    examples: ['London', 'Manchester', 'Birmingham', 'SW1A 1AA'],
    tip: 'Find artists and studios near you using city names or postcodes'
  }
];

// Advanced search shortcuts
const advancedSearchShortcuts = [
  {
    title: 'Advanced Search',
    description: 'Use multiple filters and criteria',
    href: '/search/advanced',
    icon: 'settings'
  },
  {
    title: 'Map Search',
    description: 'Find artists on an interactive map',
    href: '/search/map',
    icon: 'map'
  },
  {
    title: 'Style Explorer',
    description: 'Browse all tattoo styles with examples',
    href: '/styles',
    icon: 'palette'
  },
  {
    title: 'Popular Artists',
    description: 'Discover trending and highly-rated artists',
    href: '/artists?sort=popular',
    icon: 'star'
  }
];

// Contextual help content
const contextualHelpContent = {
  title: 'Search Tips & Shortcuts',
  sections: [
    {
      title: 'Quick Search',
      items: [
        'Type artist names, styles, or locations',
        'Use quotes for exact phrases: "traditional rose"',
        'Try style aliases: "sailor jerry" finds Traditional'
      ]
    },
    {
      title: 'Keyboard Shortcuts',
      items: [
        'Press "/" to focus search from anywhere',
        'Use ↑↓ arrow keys to navigate results',
        'Press Enter to select highlighted result',
        'Press Escape to close search dropdown'
      ]
    },
    {
      title: 'Advanced Features',
      items: [
        'Save searches for quick access later',
        'Use filters to narrow down results',
        'Browse by location with radius search'
      ]
    }
  ]
};

const SmartSearch = ({
  className,
  placeholder = "Search artists, studios, styles, or locations...",
  showRecentSearches = true,
  showContextualHelp = true,
  showAdvancedShortcuts = true,
  maxRecentSearches = 5,
  onSearch,
  ...props
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedOnce, setFocusedOnce] = useState(false);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && showRecentSearches) {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          // Failed to parse recent searches, reset to empty array
          setRecentSearches([]);
        }
      }
    }
  }, [showRecentSearches]);

  // Initialize from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
    }
  }, [searchParams]);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const searchResults = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Search artists
    mockSearchData.artists
      .filter(artist => 
        artist.name.toLowerCase().includes(lowerQuery) ||
        artist.studio.toLowerCase().includes(lowerQuery) ||
        artist.styles.some(style => style.toLowerCase().includes(lowerQuery)) ||
        artist.specialties.some(specialty => specialty.toLowerCase().includes(lowerQuery))
      )
      .forEach(artist => {
        searchResults.push({
          type: 'artist',
          id: artist.id,
          title: artist.name,
          subtitle: `${artist.studio} • ${artist.location}`,
          metadata: [
            `⭐ ${artist.rating}`,
            `${artist.experience}`,
            artist.availability
          ],
          styles: artist.styles,
          href: `/artists/${artist.id}`
        });
      });

    // Search studios
    mockSearchData.studios
      .filter(studio => 
        studio.name.toLowerCase().includes(lowerQuery) ||
        studio.location.toLowerCase().includes(lowerQuery) ||
        studio.specialties.some(specialty => specialty.toLowerCase().includes(lowerQuery))
      )
      .forEach(studio => {
        searchResults.push({
          type: 'studio',
          id: studio.id,
          title: studio.name,
          subtitle: studio.location,
          metadata: [
            `${studio.artistCount} artists`,
            `⭐ ${studio.rating}`,
            `Est. ${studio.established}`
          ],
          styles: studio.specialties,
          href: `/studios/${studio.id}`
        });
      });

    // Search enhanced styles with alias support
    Object.values(enhancedTattooStyles)
      .filter(style => {
        const matchesName = style.name.toLowerCase().includes(lowerQuery);
        const matchesDescription = style.description.toLowerCase().includes(lowerQuery);
        const matchesAlias = style.aliases.some(alias => alias.toLowerCase().includes(lowerQuery));
        const matchesCharacteristic = style.characteristics.some(char => char.toLowerCase().includes(lowerQuery));
        return matchesName || matchesDescription || matchesAlias || matchesCharacteristic;
      })
      .forEach(style => {
        const difficultyColors = {
          beginner: 'success',
          intermediate: 'warning', 
          advanced: 'error'
        };
        
        searchResults.push({
          type: 'style',
          id: style.id,
          title: style.name,
          subtitle: style.description,
          metadata: [
            `${style.difficulty.charAt(0).toUpperCase() + style.difficulty.slice(1)}`,
            `Popularity: ${style.popularity}%`,
            style.timeOrigin
          ],
          difficulty: style.difficulty,
          difficultyColor: difficultyColors[style.difficulty],
          characteristics: style.characteristics,
          href: `/styles/${style.id}`
        });
      });

    // Search locations
    mockSearchData.locations
      .filter(location => 
        location.name.toLowerCase().includes(lowerQuery) ||
        location.region.toLowerCase().includes(lowerQuery)
      )
      .forEach(location => {
        searchResults.push({
          type: 'location',
          id: location.id,
          title: location.name,
          subtitle: location.region,
          metadata: [
            `${location.artistCount} artists`,
            `${location.studioCount} studios`
          ],
          styles: location.popularStyles,
          href: `/search?location=${encodeURIComponent(location.name)}`
        });
      });

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
    setIsLoading(false);
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setHighlightedIndex(-1);
    setIsOpen(true); // Open dropdown when typing
    setShowHelp(false); // Hide help when typing

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    
    // Show contextual help on first focus or when no query
    if (!focusedOnce && showContextualHelp && !query) {
      setShowHelp(true);
      setFocusedOnce(true);
    } else if (!query && showRecentSearches && recentSearches.length > 0) {
      // Show recent searches when focused with empty query
      const recentResults = recentSearches.map((search, index) => ({
        type: 'recent',
        id: `recent-${index}`,
        title: search.query,
        subtitle: 'Recent search',
        metadata: [],
        href: search.href || `/search?q=${encodeURIComponent(search.query)}`
      }));
      setResults(recentResults);
      setShowHelp(false);
    } else if (!query && showContextualHelp) {
      setShowHelp(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleResultSelect(results[highlightedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleResultSelect = (result) => {
    // Save to recent searches
    if (showRecentSearches && result.type !== 'recent') {
      const newSearch = { query: result.title, href: result.href };
      const updatedRecent = [
        newSearch,
        ...recentSearches.filter(s => s.query !== result.title)
      ].slice(0, maxRecentSearches);
      
      setRecentSearches(updatedRecent);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
    }

    // Navigate to result
    router.push(result.href);
    setIsOpen(false);
    setQuery(result.title);
    
    // Call custom onSearch handler
    onSearch?.(result);
  };

  // Handle search submission
  const handleSearch = () => {
    if (!query.trim()) return;

    const searchUrl = `/search?q=${encodeURIComponent(query)}`;
    
    // Save to recent searches
    if (showRecentSearches) {
      const newSearch = { query: query.trim(), href: searchUrl };
      const updatedRecent = [
        newSearch,
        ...recentSearches.filter(s => s.query !== query.trim())
      ].slice(0, maxRecentSearches);
      
      setRecentSearches(updatedRecent);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
    }

    router.push(searchUrl);
    setIsOpen(false);
    
    // Call custom onSearch handler
    onSearch?.({ type: 'search', query: query.trim(), href: searchUrl });
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowHelp(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Focus search on "/" key
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only if not already focused on an input
        if (document.activeElement?.tagName !== 'INPUT' && 
            document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchRef.current?.querySelector('input')?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    if (!query) {
      setResults([]);
    }
  };

  // Handle shortcut selection
  const handleShortcutSelect = (shortcut) => {
    router.push(shortcut.href);
    setIsOpen(false);
    setShowHelp(false);
    
    // Save to recent searches
    if (showRecentSearches) {
      const newSearch = { query: shortcut.title, href: shortcut.href };
      const updatedRecent = [
        newSearch,
        ...recentSearches.filter(s => s.query !== shortcut.title)
      ].slice(0, maxRecentSearches);
      
      setRecentSearches(updatedRecent);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
    }
    
    // Call custom onSearch handler
    onSearch?.({ type: 'shortcut', ...shortcut });
  };

  // Handle search tip selection
  const handleSearchTipSelect = (tip) => {
    const example = tip.examples[Math.floor(Math.random() * tip.examples.length)];
    setQuery(example);
    setShowHelp(false);
    performSearch(example);
  };

  return (
    <div className={smartSearchVariants({ className })} ref={searchRef} {...props}>
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="flex-1"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        <Button
          onClick={handleSearch}
          disabled={!query.trim()}
          variant="primary"
          size="md"
          aria-label="Search"
        >
          Search
        </Button>
      </div>

      {/* Contextual Help Dropdown */}
      {isOpen && showHelp && showContextualHelp && (
        <div className={contextualHelpVariants()} ref={resultsRef}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center">
                <SearchIcons.help className="h-4 w-4 mr-2" />
                {contextualHelpContent.title}
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
              {searchTips.map((tip, index) => (
                <div
                  key={index}
                  className={searchTipVariants()}
                  onClick={() => handleSearchTipSelect(tip)}
                >
                  <div className="font-medium text-sm text-[var(--text-primary)] mb-1">
                    {tip.category}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mb-2">
                    {tip.tip}
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

            {/* Advanced Search Shortcuts */}
            {showAdvancedShortcuts && (
              <>
                <div className="border-t border-[var(--border-muted)] pt-3 mb-3">
                  <h4 className="font-medium text-sm text-[var(--text-primary)] mb-2">
                    Quick Access
                  </h4>
                </div>
                <div className="space-y-1">
                  {advancedSearchShortcuts.map((shortcut, index) => {
                    const Icon = SearchIcons[shortcut.icon] || SearchIcons.settings;
                    return (
                      <div
                        key={index}
                        className={shortcutVariants()}
                        onClick={() => handleShortcutSelect(shortcut)}
                      >
                        <Icon className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-[var(--text-primary)]">
                            {shortcut.title}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {shortcut.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Help Sections */}
            <div className="border-t border-[var(--border-muted)] pt-3 mt-3">
              {contextualHelpContent.sections.map((section, index) => (
                <div key={index} className="mb-3 last:mb-0">
                  <h4 className="font-medium text-sm text-[var(--text-primary)] mb-2">
                    {section.title}
                  </h4>
                  <ul className="space-y-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start">
                        <span className="mr-2 mt-1 w-1 h-1 bg-[var(--text-muted)] rounded-full flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && !showHelp && (
        <div className={searchResultsVariants()} ref={resultsRef}>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--interactive-primary)]"></div>
              <span className="ml-2 text-[var(--text-secondary)]">Searching...</span>
            </div>
          )}

          {!isLoading && results.length === 0 && query && (
            <div className="px-4 py-8 text-center text-[var(--text-secondary)]">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <div className="mt-3 space-y-2">
                <p className="text-sm">Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {searchTips.slice(0, 2).map((tip, index) => (
                    <div key={index} className="flex gap-1">
                      {tip.examples.slice(0, 2).map((example, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          size="sm"
                          className="cursor-pointer hover:bg-[var(--interactive-secondary)]"
                          onClick={() => {
                            setQuery(example);
                            performSearch(example);
                          }}
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && results.length === 0 && !query && showRecentSearches && recentSearches.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--text-secondary)]">
              <p>Start typing to search for artists, studios, styles, or locations</p>
              <p className="text-sm mt-2">Press <kbd className="px-1 py-0.5 bg-[var(--background-secondary)] rounded text-xs">/</kbd> to focus search from anywhere</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <>
              {/* Recent searches header */}
              {!query && showRecentSearches && results[0]?.type === 'recent' && (
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--background-secondary)] border-b border-[var(--border-muted)]">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">Recent Searches</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Search results */}
              <div role="listbox" aria-label="Search results">
                {results.map((result, index) => {
                  const Icon = SearchIcons[result.type] || SearchIcons.artist;
                  
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={searchResultItemVariants({ 
                        highlighted: index === highlightedIndex,
                        type: result.type === 'recent' ? 'artist' : result.type
                      })}
                      onClick={() => handleResultSelect(result)}
                      role="option"
                      aria-selected={index === highlightedIndex}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Icon className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-sm text-[var(--text-secondary)] truncate">
                              {result.subtitle}
                            </div>
                          )}
                          {/* Style tags for enhanced results */}
                          {result.styles && result.styles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.styles.slice(0, 3).map((style, i) => (
                                <Badge key={i} variant="outline" size="xs">
                                  {style}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced metadata badges */}
                      {result.metadata && result.metadata.length > 0 && (
                        <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                          {result.metadata.slice(0, 3).map((meta, i) => (
                            <Badge 
                              key={i} 
                              variant={result.type === 'style' && i === 0 ? result.difficultyColor || 'secondary' : 'secondary'} 
                              size="sm"
                            >
                              {meta}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Show help link at bottom */}
              {query && showContextualHelp && (
                <div className="border-t border-[var(--border-muted)] px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowHelp(true);
                      setQuery('');
                      setResults([]);
                    }}
                    className="text-xs w-full justify-center"
                  >
                    <SearchIcons.help className="h-3 w-3 mr-1" />
                    Search Tips & Shortcuts
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
export { SmartSearch, smartSearchVariants };