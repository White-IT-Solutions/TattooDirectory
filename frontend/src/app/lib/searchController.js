/**
 * Enhanced Search Controller
 * Central coordinator for all search functionality across pages
 */

import { enhancedTattooStyles, searchStylesByAlias } from "../data/testData/enhancedTattooStyles";

// Import mock data with fallbacks for testing
let mockArtistData, mockStudioData;
try {
  mockArtistData = require("../data/mockArtistData").mockArtistData || [];
  mockStudioData = require("../data/mockStudioData").mockStudioData || [];
} catch (error) {
  // Fallback for testing environment
  mockArtistData = [];
  mockStudioData = [];
}

// Search state management
class SearchController {
  constructor() {
    this.searchState = {
      query: "",
      activeFilters: {},
      results: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0
      },
      sortBy: "relevance",
      viewMode: "grid",
      recentSearches: this.loadRecentSearches()
    };

    this.searchHistory = [];
    this.debounceTimeout = null;
  }

  // Load recent searches from localStorage
  loadRecentSearches() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return [];
      }
      const saved = localStorage.getItem("tattoo_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading recent searches:", error);
      return [];
    }
  }

  // Save recent searches to localStorage
  saveRecentSearches() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      localStorage.setItem("tattoo_recent_searches", JSON.stringify(this.searchState.recentSearches));
    } catch (error) {
      console.error("Error saving recent searches:", error);
    }
  }

  // Get current search state
  getSearchState() {
    return { ...this.searchState };
  }

  // Update search state
  updateSearchState(updates) {
    this.searchState = {
      ...this.searchState,
      ...updates
    };
    return this.searchState;
  }

  // Execute search with debouncing
  async executeSearch(query, options = {}) {
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Set loading state
    this.updateSearchState({ loading: true, error: null });

    // Debounce search execution
    return new Promise((resolve) => {
      this.debounceTimeout = setTimeout(async () => {
        try {
          const results = await this.performSearch(query, options);
          
          // Update search state
          this.updateSearchState({
            query,
            results,
            loading: false,
            pagination: {
              ...this.searchState.pagination,
              total: results.length
            }
          });

          // Save to recent searches
          this.saveSearch(query, options);

          resolve(results);
        } catch (error) {
          this.updateSearchState({
            loading: false,
            error: error.message
          });
          throw error;
        }
      }, 300); // 300ms debounce delay
    });
  }

  // Perform the actual search
  async performSearch(query, options = {}) {
    const {
      styles = [],
      location = "",
      radius = 25,
      difficulty = [],
      experience = [],
      priceRange = [],
      availability = [],
      rating = 0,
      sortBy = "relevance",
      resultTypes = ["artist", "studio", "style"]
    } = options;

    let results = [];

    // Search artists
    if (resultTypes.includes("artist")) {
      const artistResults = this.searchArtists(query, {
        styles,
        location,
        radius,
        difficulty,
        experience,
        priceRange,
        availability,
        rating
      });
      results = [...results, ...artistResults];
    }

    // Search studios
    if (resultTypes.includes("studio")) {
      const studioResults = this.searchStudios(query, {
        location,
        radius,
        styles
      });
      results = [...results, ...studioResults];
    }

    // Search styles
    if (resultTypes.includes("style")) {
      const styleResults = this.searchStyles(query, {
        difficulty,
        styles
      });
      results = [...results, ...styleResults];
    }

    // Sort results
    results = this.sortResults(results, sortBy);

    return results;
  }

  // Search artists
  searchArtists(query, filters) {
    if (!mockArtistData || !Array.isArray(mockArtistData)) {
      return [];
    }

    return mockArtistData.filter(artist => {
      // Ensure artist has required properties
      if (!artist || typeof artist !== 'object') return false;
      
      // Text search
      if (query) {
        const searchText = query.toLowerCase();
        const matchesText = 
          (artist.name && artist.name.toLowerCase().includes(searchText)) ||
          (artist.studioName && artist.studioName.toLowerCase().includes(searchText)) ||
          (artist.specialties && Array.isArray(artist.specialties) && 
           artist.specialties.some(spec => spec && spec.toLowerCase().includes(searchText))) ||
          (artist.styles && Array.isArray(artist.styles) && 
           artist.styles.some(style => {
            const styleData = enhancedTattooStyles[style];
            return styleData && (
              styleData.name.toLowerCase().includes(searchText) ||
              styleData.aliases.some(alias => alias.toLowerCase().includes(searchText))
            );
          }));
        
        if (!matchesText) return false;
      }

      // Style filtering
      if (filters.styles && filters.styles.length > 0) {
        if (!artist.styles || !Array.isArray(artist.styles)) return false;
        const hasMatchingStyle = filters.styles.some(style => 
          artist.styles.includes(style)
        );
        if (!hasMatchingStyle) return false;
      }

      // Location filtering
      if (filters.location) {
        const locationMatch = 
          (artist.location && artist.location.toLowerCase().includes(filters.location.toLowerCase())) ||
          (artist.postcode && artist.postcode.toLowerCase().includes(filters.location.toLowerCase()));
        if (!locationMatch) return false;
      }

      // Rating filtering
      if (filters.rating > 0) {
        if (!artist.rating || artist.rating < filters.rating) return false;
      }

      // Experience filtering (simplified)
      if (filters.experience && filters.experience.length > 0) {
        const yearsActive = artist.yearsActive || 0;
        const matchesExperience = filters.experience.some(level => {
          switch (level) {
            case "apprentice": return yearsActive <= 2;
            case "junior": return yearsActive > 2 && yearsActive <= 5;
            case "experienced": return yearsActive > 5 && yearsActive <= 10;
            case "master": return yearsActive > 10;
            default: return false;
          }
        });
        if (!matchesExperience) return false;
      }

      // Price range filtering (simplified)
      if (filters.priceRange && filters.priceRange.length > 0) {
        const hourlyRate = artist.hourlyRate || 0;
        const matchesPrice = filters.priceRange.some(range => {
          switch (range) {
            case "budget": return hourlyRate >= 50 && hourlyRate <= 100;
            case "mid": return hourlyRate > 100 && hourlyRate <= 150;
            case "premium": return hourlyRate > 150 && hourlyRate <= 200;
            case "luxury": return hourlyRate > 200;
            default: return false;
          }
        });
        if (!matchesPrice) return false;
      }

      return true;
    }).map(artist => ({
      ...artist,
      type: "artist",
      relevanceScore: this.calculateRelevanceScore(artist, query, "artist")
    }));
  }

  // Search studios
  searchStudios(query, filters) {
    if (!mockStudioData || !Array.isArray(mockStudioData)) {
      return [];
    }

    return mockStudioData.filter(studio => {
      // Ensure studio has required properties
      if (!studio || typeof studio !== 'object') return false;

      // Text search
      if (query) {
        const searchText = query.toLowerCase();
        const matchesText = 
          (studio.name && studio.name.toLowerCase().includes(searchText)) ||
          (studio.specialties && Array.isArray(studio.specialties) && 
           studio.specialties.some(spec => spec && spec.toLowerCase().includes(searchText))) ||
          (studio.description && studio.description.toLowerCase().includes(searchText));
        
        if (!matchesText) return false;
      }

      // Location filtering
      if (filters.location) {
        const locationMatch = 
          (studio.location && studio.location.toLowerCase().includes(filters.location.toLowerCase())) ||
          (studio.postcode && studio.postcode.toLowerCase().includes(filters.location.toLowerCase()));
        if (!locationMatch) return false;
      }

      // Style filtering (check if studio specializes in the styles)
      if (filters.styles && filters.styles.length > 0) {
        if (!studio.specialties || !Array.isArray(studio.specialties)) return false;
        const hasMatchingStyle = filters.styles.some(style => {
          const styleData = enhancedTattooStyles[style];
          return styleData && studio.specialties.some(specialty =>
            specialty && (
              specialty.toLowerCase().includes(styleData.name.toLowerCase()) ||
              styleData.aliases.some(alias => 
                specialty.toLowerCase().includes(alias.toLowerCase())
              )
            )
          );
        });
        if (!hasMatchingStyle) return false;
      }

      return true;
    }).map(studio => ({
      ...studio,
      type: "studio",
      relevanceScore: this.calculateRelevanceScore(studio, query, "studio")
    }));
  }

  // Search styles
  searchStyles(query, filters) {
    let styles = Object.values(enhancedTattooStyles);

    if (query) {
      styles = searchStylesByAlias(query);
    }

    return styles.filter(style => {
      // Difficulty filtering
      if (filters.difficulty && filters.difficulty.length > 0) {
        if (!filters.difficulty.includes(style.difficulty)) return false;
      }

      // Style filtering (if specific styles are selected)
      if (filters.styles && filters.styles.length > 0) {
        if (!filters.styles.includes(style.id)) return false;
      }

      return true;
    }).map(style => ({
      ...style,
      type: "style",
      relevanceScore: this.calculateRelevanceScore(style, query, "style")
    }));
  }

  // Calculate relevance score for sorting
  calculateRelevanceScore(item, query, type) {
    if (!query || !item) return 0;

    let score = 0;
    const searchText = query.toLowerCase();

    switch (type) {
      case "artist":
        if (item.name && item.name.toLowerCase().includes(searchText)) score += 10;
        if (item.studioName && item.studioName.toLowerCase().includes(searchText)) score += 5;
        if (item.specialties && Array.isArray(item.specialties) && 
            item.specialties.some(spec => spec && spec.toLowerCase().includes(searchText))) score += 3;
        score += item.rating || 0;
        break;

      case "studio":
        if (item.name && item.name.toLowerCase().includes(searchText)) score += 10;
        if (item.specialties && Array.isArray(item.specialties) && 
            item.specialties.some(spec => spec && spec.toLowerCase().includes(searchText))) score += 5;
        score += item.rating || 0;
        break;

      case "style":
        if (item.name && item.name.toLowerCase() === searchText) score += 20;
        if (item.name && item.name.toLowerCase().includes(searchText)) score += 10;
        if (item.aliases && Array.isArray(item.aliases) && 
            item.aliases.some(alias => alias && alias.toLowerCase().includes(searchText))) score += 8;
        if (item.description && item.description.toLowerCase().includes(searchText)) score += 3;
        score += (item.popularity || 0) / 10;
        break;
    }

    return score;
  }

  // Sort results
  sortResults(results, sortBy) {
    return results.sort((a, b) => {
      switch (sortBy) {
        case "relevance":
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "experience":
          return (b.yearsActive || 0) - (a.yearsActive || 0);
        case "price_low":
          return (a.hourlyRate || 0) - (b.hourlyRate || 0);
        case "price_high":
          return (b.hourlyRate || 0) - (a.hourlyRate || 0);
        case "distance":
          // Would implement actual distance calculation in real app
          return 0;
        case "availability":
          // Would implement availability sorting in real app
          return 0;
        default:
          return 0;
      }
    });
  }

  // Apply filters
  applyFilters(filters) {
    this.updateSearchState({
      activeFilters: { ...this.searchState.activeFilters, ...filters }
    });
    
    // Re-execute search with new filters
    return this.executeSearch(this.searchState.query, {
      ...this.searchState.activeFilters,
      ...filters
    });
  }

  // Clear filters
  clearFilters() {
    this.updateSearchState({ activeFilters: {} });
    return this.executeSearch(this.searchState.query);
  }

  // Save search to history
  saveSearch(query, options = {}) {
    if (!query.trim()) return;

    const searchEntry = {
      query,
      options,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };

    // Add to recent searches (limit to 10)
    const recentSearches = [
      searchEntry,
      ...this.searchState.recentSearches.filter(s => s.query !== query)
    ].slice(0, 10);

    this.updateSearchState({ recentSearches });
    this.saveRecentSearches();

    // Add to search history
    this.searchHistory.push(searchEntry);
  }

  // Get recent searches
  getRecentSearches() {
    return this.searchState.recentSearches;
  }

  // Clear recent searches
  clearRecentSearches() {
    this.updateSearchState({ recentSearches: [] });
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem("tattoo_recent_searches");
    }
  }

  // Get search suggestions
  getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];

    const suggestions = [];
    const searchText = query.toLowerCase();

    // Artist name suggestions
    if (mockArtistData && Array.isArray(mockArtistData)) {
      mockArtistData.forEach(artist => {
        if (artist && artist.name && artist.name.toLowerCase().includes(searchText)) {
          suggestions.push({
            type: "artist",
            text: artist.name,
            subtitle: `Artist at ${artist.studioName || 'Unknown Studio'}`,
            icon: "👤"
          });
        }
      });
    }

    // Studio name suggestions
    if (mockStudioData && Array.isArray(mockStudioData)) {
      mockStudioData.forEach(studio => {
        if (studio && studio.name && studio.name.toLowerCase().includes(searchText)) {
          suggestions.push({
            type: "studio",
            text: studio.name,
            subtitle: `Studio in ${studio.location || 'Unknown Location'}`,
            icon: "🏢"
          });
        }
      });
    }

    // Style suggestions
    Object.values(enhancedTattooStyles).forEach(style => {
      if (
        style.name.toLowerCase().includes(searchText) ||
        style.aliases.some(alias => alias.toLowerCase().includes(searchText))
      ) {
        suggestions.push({
          type: "style",
          text: style.name,
          subtitle: `${style.difficulty} difficulty • ${style.popularity}% popularity`,
          icon: "🎨"
        });
      }
    });

    // Limit and sort suggestions
    return suggestions
      .slice(0, 8)
      .sort((a, b) => a.text.localeCompare(b.text));
  }

  // Export search results
  exportResults(format = "json") {
    const exportData = {
      searchQuery: this.searchState.query,
      activeFilters: this.searchState.activeFilters,
      results: this.searchState.results,
      totalResults: this.searchState.pagination.total,
      timestamp: new Date().toISOString(),
      sortBy: this.searchState.sortBy
    };

    switch (format) {
      case "json":
        return JSON.stringify(exportData, null, 2);
      case "csv":
        return this.convertToCSV(exportData.results);
      default:
        return exportData;
    }
  }

  // Convert results to CSV format
  convertToCSV(results) {
    if (results.length === 0) return "";

    const headers = ["Type", "Name", "Location", "Rating", "Styles/Specialties"];
    const rows = results.map(result => [
      result.type,
      result.name,
      result.location || "",
      result.rating || "",
      result.type === "artist" ? result.styles?.join("; ") : 
      result.type === "studio" ? result.specialties?.join("; ") :
      result.characteristics?.join("; ") || ""
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  }
}

// Create singleton instance
const searchController = new SearchController();

export default searchController;