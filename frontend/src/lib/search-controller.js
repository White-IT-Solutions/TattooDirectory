/**
 * Enhanced Search Controller
 * 
 * Centralized search controller that manages search state across all pages.
 * Provides unified search query interface supporting text, style, location, and advanced filters.
 * Includes search history, debounced search, and comprehensive state management.
 */

import { api } from './api.js';
import { enhancedTattooStyles, searchStylesByAlias } from '../app/data/testData/enhancedTattooStyles.js';
import { 
  debounce, 
  performanceMonitor, 
  searchCache, 
  requestDeduplicator 
} from './performance-utils.js';
import { ariaLiveRegion } from './accessibility-utils.js';

/**
 * Search query interface supporting multiple search types
 */
export class SearchQuery {
  constructor({
    text = '',
    styles = [],
    location = null,
    difficulty = [],
    sortBy = 'relevance',
    page = 1,
    limit = 20,
    radius = null,
    priceRange = null,
    availability = null,
    rating = null
  } = {}) {
    this.text = text;
    this.styles = Array.isArray(styles) ? styles : [];
    this.location = location;
    this.difficulty = Array.isArray(difficulty) ? difficulty : [];
    this.sortBy = sortBy;
    this.page = page;
    this.limit = limit;
    this.radius = radius;
    this.priceRange = priceRange;
    this.availability = availability;
    this.rating = rating;
    this.timestamp = Date.now();
  }

  /**
   * Check if the query has any active filters
   */
  hasFilters() {
    return !!(
      this.text ||
      this.styles.length > 0 ||
      this.location ||
      this.difficulty.length > 0 ||
      this.priceRange ||
      this.availability ||
      this.rating
    );
  }

  /**
   * Get a unique key for this query (for caching)
   */
  getCacheKey() {
    const keyParts = [
      this.text,
      this.styles.sort().join(','),
      this.location?.postcode || this.location?.city || '',
      this.difficulty.sort().join(','),
      this.sortBy,
      this.page,
      this.limit,
      this.radius,
      JSON.stringify(this.priceRange),
      this.availability,
      this.rating
    ];
    return keyParts.join('|');
  }

  /**
   * Convert to URL search parameters
   */
  toURLSearchParams() {
    const params = new URLSearchParams();
    
    if (this.text) params.append('query', this.text);
    if (this.styles.length > 0) params.append('styles', this.styles.join(','));
    if (this.location) {
      if (this.location.postcode) params.append('postcode', this.location.postcode);
      if (this.location.city) params.append('city', this.location.city);
      if (this.location.coordinates) {
        params.append('lat', this.location.coordinates.lat.toString());
        params.append('lng', this.location.coordinates.lng.toString());
      }
    }
    if (this.difficulty.length > 0) params.append('difficulty', this.difficulty.join(','));
    if (this.sortBy !== 'relevance') params.append('sortBy', this.sortBy);
    if (this.page !== 1) params.append('page', this.page.toString());
    if (this.limit !== 20) params.append('limit', this.limit.toString());
    if (this.radius) params.append('radius', this.radius.toString());
    if (this.priceRange) {
      params.append('minPrice', this.priceRange.min.toString());
      params.append('maxPrice', this.priceRange.max.toString());
    }
    if (this.availability) params.append('availability', this.availability);
    if (this.rating) params.append('minRating', this.rating.toString());

    return params;
  }

  /**
   * Create from URL search parameters
   */
  static fromURLSearchParams(params) {
    const location = {};
    if (params.get('postcode')) location.postcode = params.get('postcode');
    if (params.get('city')) location.city = params.get('city');
    if (params.get('lat') && params.get('lng')) {
      location.coordinates = {
        lat: parseFloat(params.get('lat')),
        lng: parseFloat(params.get('lng'))
      };
    }

    const priceRange = {};
    if (params.get('minPrice')) priceRange.min = parseFloat(params.get('minPrice'));
    if (params.get('maxPrice')) priceRange.max = parseFloat(params.get('maxPrice'));

    return new SearchQuery({
      text: params.get('query') || '',
      styles: params.get('styles') ? params.get('styles').split(',') : [],
      location: Object.keys(location).length > 0 ? location : null,
      difficulty: params.get('difficulty') ? params.get('difficulty').split(',') : [],
      sortBy: params.get('sortBy') || 'relevance',
      page: parseInt(params.get('page')) || 1,
      limit: parseInt(params.get('limit')) || 20,
      radius: params.get('radius') ? parseInt(params.get('radius')) : null,
      priceRange: Object.keys(priceRange).length > 0 ? priceRange : null,
      availability: params.get('availability') || null,
      rating: params.get('minRating') ? parseFloat(params.get('minRating')) : null
    });
  }
}

/**
 * Search state management
 */
export class SearchState {
  constructor() {
    this.query = new SearchQuery();
    this.results = null;
    this.loading = false;
    this.error = null;
    this.totalCount = 0;
    this.facets = null;
    this.suggestions = [];
    this.executionTime = 0;
    this.lastUpdated = null;
  }

  /**
   * Update the search state
   */
  update(updates) {
    Object.assign(this, updates);
    this.lastUpdated = Date.now();
  }

  /**
   * Reset the search state
   */
  reset() {
    this.query = new SearchQuery();
    this.results = null;
    this.loading = false;
    this.error = null;
    this.totalCount = 0;
    this.facets = null;
    this.suggestions = [];
    this.executionTime = 0;
    this.lastUpdated = null;
  }
}

/**
 * Search history manager with local storage persistence
 */
export class SearchHistoryManager {
  constructor(maxHistorySize = 50) {
    this.maxHistorySize = maxHistorySize;
    this.storageKey = 'tattoo-search-history';
  }

  /**
   * Save a search query to history
   */
  saveSearch(query) {
    if (!query.hasFilters()) return;

    try {
      const history = this.getHistory();
      const queryData = {
        ...query,
        timestamp: Date.now(),
        id: this.generateId()
      };

      // Remove duplicate queries
      const filteredHistory = history.filter(
        item => {
          if (item.getCacheKey && typeof item.getCacheKey === 'function') {
            return item.getCacheKey() !== query.getCacheKey();
          }
          return true;
        }
      );

      // Add new query to the beginning
      filteredHistory.unshift(queryData);

      // Limit history size
      const trimmedHistory = filteredHistory.slice(0, this.maxHistorySize);

      localStorage.setItem(this.storageKey, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Get search history
   */
  getHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.map(item => new SearchQuery(item));
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * Get recent searches (last 10)
   */
  getRecentSearches() {
    return this.getHistory().slice(0, 10);
  }

  /**
   * Clear search history
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }

  /**
   * Remove a specific search from history
   */
  removeSearch(searchId) {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.id !== searchId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
    } catch (error) {
      console.warn('Failed to remove search from history:', error);
    }
  }

  /**
   * Generate a unique ID for search queries
   */
  generateId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Enhanced Debounced search functionality with performance monitoring
 */
export class DebouncedSearch {
  constructor(searchFunction, delay = 300) {
    this.searchFunction = searchFunction;
    this.debouncedFn = debounce(searchFunction, delay, { maxWait: delay * 2 });
    this.delay = delay;
  }

  /**
   * Execute search with debouncing and performance monitoring
   */
  async search(query, ...args) {
    const operationName = `debounced_search_${query.getCacheKey ? query.getCacheKey() : 'unknown'}`;
    performanceMonitor.startTiming(operationName);
    
    try {
      const result = await this.debouncedFn(query, ...args);
      performanceMonitor.endTiming(operationName);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(operationName);
      throw error;
    }
  }

  /**
   * Cancel pending search
   */
  cancel() {
    if (this.debouncedFn.cancel) {
      this.debouncedFn.cancel();
    }
  }

  /**
   * Check if search is pending
   */
  pending() {
    return this.debouncedFn.pending ? this.debouncedFn.pending() : false;
  }

  /**
   * Flush pending search immediately
   */
  flush() {
    return this.debouncedFn.flush ? this.debouncedFn.flush() : null;
  }
}
/**

 * Enhanced Search Controller
 * 
 * Central coordinator for all search functionality across pages.
 * Manages search state, executes searches, handles caching, and provides
 * a unified interface for all search operations.
 */
export class EnhancedSearchController {
  constructor() {
    this.state = new SearchState();
    this.historyManager = new SearchHistoryManager();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.listeners = new Set();
    
    // Create debounced search function
    this.debouncedSearch = new DebouncedSearch(
      this._executeSearchInternal.bind(this),
      300
    );
  }

  /**
   * Add a state change listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state changes
   */
  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in search state listener:', error);
      }
    });
  }

  /**
   * Get current search state
   */
  getSearchState() {
    return { ...this.state };
  }

  /**
   * Update search state
   */
  updateSearchState(updates) {
    this.state.update(updates);
    this._notifyListeners();
  }

  /**
   * Execute search with debouncing and accessibility announcements
   */
  async executeSearch(query) {
    // Validate query
    if (!(query instanceof SearchQuery)) {
      query = new SearchQuery(query);
    }

    // Update state to loading
    this.updateSearchState({
      query,
      loading: true,
      error: null
    });

    // Announce loading state
    ariaLiveRegion.announceLoading(true, 'search');

    try {
      const result = await this.debouncedSearch.search(query);
      
      // Save successful search to history
      this.historyManager.saveSearch(query);
      
      return result;
    } catch (error) {
      this.updateSearchState({
        loading: false,
        error
      });
      
      // Announce error
      ariaLiveRegion.announceError(error, 'search');
      
      throw error;
    }
  }

  /**
   * Internal search execution (called by debounced search)
   */
  async _executeSearchInternal(query) {
    const operationName = `search_execution_${query.getCacheKey()}`;
    performanceMonitor.startTiming(operationName);
    
    const cacheKey = query.getCacheKey();

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
      const executionTime = performanceMonitor.endTiming(operationName);
      
      this.updateSearchState({
        ...cached,
        loading: false,
        executionTime
      });
      
      // Announce cached results
      ariaLiveRegion.announceSearchResults(cached.totalCount, query.text);
      
      return cached;
    }

    try {
      // Use request deduplication to prevent duplicate API calls
      const results = await requestDeduplicator.execute(cacheKey, async () => {
        // Determine search type and execute appropriate API call
        if (query.text || query.location || query.styles.length > 0) {
          // Use the existing searchArtists API
          const searchParams = {};
          if (query.text) searchParams.query = query.text;
          if (query.styles.length > 0) searchParams.style = query.styles.join(',');
          if (query.location) {
            if (query.location.postcode) {
              searchParams.location = query.location.postcode;
            } else if (query.location.city) {
              searchParams.location = query.location.city;
            }
          }
          
          return await api.searchArtists(searchParams);
        } else {
          // Default to getting all artists
          return await api.getArtists(query.limit, null);
        }
      });

      // Process and enhance results
      const processedResults = this._processSearchResults(results, query);
      
      // Cache the results
      searchCache.set(cacheKey, processedResults);

      // Update state with results
      const executionTime = performanceMonitor.endTiming(operationName);
      this.updateSearchState({
        results: processedResults.items,
        totalCount: processedResults.totalCount,
        facets: processedResults.facets,
        suggestions: processedResults.suggestions,
        loading: false,
        error: null,
        executionTime
      });

      // Announce results to screen readers
      ariaLiveRegion.announceSearchResults(processedResults.totalCount, query.text);

      return processedResults;
    } catch (error) {
      const executionTime = performanceMonitor.endTiming(operationName);
      this.updateSearchState({
        loading: false,
        error,
        executionTime
      });
      
      // Announce error to screen readers
      ariaLiveRegion.announceError(error, 'search');
      
      throw error;
    }
  }

  /**
   * Process and enhance search results
   */
  _processSearchResults(apiResults, query) {
    const items = apiResults.artists || apiResults.items || [];
    const totalCount = apiResults.totalCount || items.length;

    // Generate search suggestions based on query and results
    const suggestions = this._generateSearchSuggestions(query, items);

    // Generate facets for filtering
    const facets = this._generateSearchFacets(items);

    return {
      items,
      totalCount,
      facets,
      suggestions,
      query
    };
  }

  /**
   * Generate search suggestions
   */
  _generateSearchSuggestions(query, results) {
    const suggestions = [];

    // If no results, suggest alternative searches
    if (results.length === 0) {
      if (query.text) {
        // Suggest style-based searches using alias matching
        const styleMatches = searchStylesByAlias(query.text);
        styleMatches.forEach(style => {
          suggestions.push({
            type: 'style',
            text: `Search for ${style.name} style`,
            query: new SearchQuery({ styles: [style.id] })
          });
        });
      }

      if (query.styles.length > 0) {
        // Suggest removing some style filters
        suggestions.push({
          type: 'filter',
          text: 'Try fewer style filters',
          query: new SearchQuery({ ...query, styles: query.styles.slice(0, 1) })
        });
      }

      if (query.location) {
        // Suggest expanding location search
        suggestions.push({
          type: 'location',
          text: 'Search in a wider area',
          query: new SearchQuery({ ...query, radius: (query.radius || 10) * 2 })
        });
      }
    }

    // If few results, suggest related searches
    if (results.length > 0 && results.length < 5) {
      // Extract common styles from results
      const commonStyles = this._extractCommonStyles(results);
      commonStyles.forEach(style => {
        if (!query.styles.includes(style.id)) {
          suggestions.push({
            type: 'related',
            text: `Also search ${style.name}`,
            query: new SearchQuery({ ...query, styles: [...query.styles, style.id] })
          });
        }
      });
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate search facets for filtering
   */
  _generateSearchFacets(results) {
    const facets = {
      styles: {},
      locations: {},
      difficulty: {},
      priceRanges: {}
    };

    results.forEach(artist => {
      // Count styles
      if (artist.styles) {
        artist.styles.forEach(style => {
          facets.styles[style] = (facets.styles[style] || 0) + 1;
        });
      }

      // Count locations (cities)
      if (artist.location?.city) {
        const city = artist.location.city;
        facets.locations[city] = (facets.locations[city] || 0) + 1;
      }

      // Count difficulty levels (based on styles)
      if (artist.styles) {
        artist.styles.forEach(styleId => {
          const styleData = enhancedTattooStyles[styleId];
          if (styleData?.difficulty) {
            facets.difficulty[styleData.difficulty] = (facets.difficulty[styleData.difficulty] || 0) + 1;
          }
        });
      }
    });

    return facets;
  }

  /**
   * Extract common styles from results
   */
  _extractCommonStyles(results) {
    const styleCounts = {};
    
    results.forEach(artist => {
      if (artist.styles) {
        artist.styles.forEach(styleId => {
          styleCounts[styleId] = (styleCounts[styleId] || 0) + 1;
        });
      }
    });

    // Get top 3 most common styles
    return Object.entries(styleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([styleId]) => enhancedTattooStyles[styleId])
      .filter(Boolean);
  }

  /**
   * Apply filters to current search
   */
  applyFilters(filters) {
    const currentQuery = this.state.query;
    const newQuery = new SearchQuery({
      ...currentQuery,
      ...filters,
      page: 1 // Reset to first page when applying filters
    });

    return this.executeSearch(newQuery);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    const newQuery = new SearchQuery({
      text: this.state.query.text // Keep text search, clear everything else
    });

    return this.executeSearch(newQuery);
  }

  /**
   * Get recent searches
   */
  getRecentSearches() {
    return this.historyManager.getRecentSearches();
  }

  /**
   * Clear search history
   */
  clearSearchHistory() {
    this.historyManager.clearHistory();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return performanceMonitor.getAllMetrics();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return searchCache.getStats();
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics() {
    performanceMonitor.clear();
  }

  /**
   * Cancel any pending searches
   */
  cancelPendingSearch() {
    this.debouncedSearch.cancel();
    this.updateSearchState({ loading: false });
  }

  /**
   * Reset search state
   */
  reset() {
    this.cancelPendingSearch();
    this.state.reset();
    this._notifyListeners();
  }
}

// Create and export a singleton instance
export const searchController = new EnhancedSearchController();

// All classes are already exported above as class declarations