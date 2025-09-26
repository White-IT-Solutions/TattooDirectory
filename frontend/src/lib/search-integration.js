/**
 * Search Integration Utilities
 * 
 * Integration layer that connects search functionality with analytics,
 * performance monitoring, and error tracking.
 * 
 * Requirements: 6.5, 13.4, 13.5
 */

import { 
  searchAnalytics, 
  searchPerformanceMonitor, 
  searchErrorTracker,
  SEARCH_EVENTS 
} from './search-analytics.js';
import { performanceMonitor } from './performance-utils.js';

/**
 * Enhanced Search Controller with Analytics Integration
 */
export class AnalyticsEnabledSearchController {
  constructor() {
    this.activeSearches = new Map();
    this.searchHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Execute search with full analytics tracking
   */
  async executeSearch(query, options = {}) {
    const searchId = this.generateSearchId();
    const startTime = Date.now();
    
    try {
      // Start performance measurement
      performanceMonitor.startMeasurement(searchId, {
        query: query.text || '',
        queryComplexity: this.calculateQueryComplexity(query),
        filters: Object.keys(query).filter(key => key !== 'text').length,
        options
      });

      // Track search initiation
      searchAnalytics.trackEvent(SEARCH_EVENTS.SEARCH_INITIATED, {
        searchId,
        query: query.text || '',
        filters: this.sanitizeQuery(query),
        timestamp: startTime,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });

      // Add to active searches
      this.activeSearches.set(searchId, {
        query,
        startTime,
        options
      });

      // Execute the actual search
      performanceMonitor.addMark(searchId, 'search-start');
      const results = await this.performSearch(query, options);
      performanceMonitor.addMark(searchId, 'search-complete', {
        resultCount: results.length
      });

      // Calculate performance metrics
      const duration = Date.now() - startTime;
      const cacheHit = results.fromCache || false;

      // Record performance
      searchPerformanceMonitor.recordSearchPerformance(searchId, {
        duration,
        resultCount: results.length,
        cacheHit,
        query,
        options
      });

      // Track successful completion
      searchAnalytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, {
        searchId,
        duration,
        resultCount: results.length,
        cacheHit,
        query: query.text || '',
        filters: this.sanitizeQuery(query)
      });

      // End performance measurement
      performanceMonitor.endMeasurement(searchId, {
        resultCount: results.length,
        cacheHit,
        success: true
      });

      // Add to search history
      this.addToHistory({
        searchId,
        query,
        resultCount: results.length,
        duration,
        timestamp: startTime,
        success: true
      });

      // Clean up active searches
      this.activeSearches.delete(searchId);

      return {
        ...results,
        searchId,
        duration,
        analytics: {
          searchId,
          duration,
          resultCount: results.length,
          cacheHit
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      // Track search failure
      searchErrorTracker.trackError(error, {
        searchId,
        query: query.text || '',
        filters: this.sanitizeQuery(query),
        duration,
        options
      });

      searchAnalytics.trackEvent(SEARCH_EVENTS.SEARCH_FAILED, {
        searchId,
        error: error.message,
        duration,
        query: query.text || '',
        filters: this.sanitizeQuery(query)
      });

      // End performance measurement with error
      performanceMonitor.endMeasurement(searchId, {
        success: false,
        error: error.message
      });

      // Add to search history
      this.addToHistory({
        searchId,
        query,
        duration,
        timestamp: startTime,
        success: false,
        error: error.message
      });

      // Clean up active searches
      this.activeSearches.delete(searchId);

      throw error;
    }
  }

  /**
   * Perform the actual search (to be implemented by specific search providers)
   */
  async performSearch(query, options = {}) {
    // This is a placeholder - implement actual search logic here
    // For now, simulate search with delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    // Simulate different result scenarios
    const resultCount = Math.floor(Math.random() * 50);
    const results = Array.from({ length: resultCount }, (_, i) => ({
      id: `result-${i}`,
      title: `Search Result ${i + 1}`,
      type: Math.random() > 0.5 ? 'artist' : 'studio'
    }));

    return {
      results,
      length: resultCount,
      fromCache: Math.random() > 0.7, // 30% cache hit rate
      query,
      options
    };
  }

  /**
   * Track search result interaction
   */
  trackResultClick(searchId, resultId, resultData = {}) {
    searchAnalytics.trackEvent(SEARCH_EVENTS.RESULT_CLICKED, {
      searchId,
      resultId,
      resultType: resultData.type,
      resultPosition: resultData.position,
      timestamp: Date.now()
    });
  }

  /**
   * Track search suggestion click
   */
  trackSuggestionClick(suggestion, searchContext = {}) {
    searchAnalytics.trackEvent(SEARCH_EVENTS.SUGGESTION_CLICKED, {
      suggestion,
      searchContext,
      timestamp: Date.now()
    });
  }

  /**
   * Track filter application
   */
  trackFilterApplied(filterType, filterValue, searchContext = {}) {
    searchAnalytics.trackEvent(SEARCH_EVENTS.FILTER_APPLIED, {
      filterType,
      filterValue,
      searchContext,
      timestamp: Date.now()
    });
  }

  /**
   * Track filter removal
   */
  trackFilterRemoved(filterType, filterValue, searchContext = {}) {
    searchAnalytics.trackEvent(SEARCH_EVENTS.FILTER_REMOVED, {
      filterType,
      filterValue,
      searchContext,
      timestamp: Date.now()
    });
  }

  /**
   * Track no results scenario
   */
  trackNoResults(query, suggestions = []) {
    searchAnalytics.trackEvent(SEARCH_EVENTS.NO_RESULTS, {
      query: query.text || '',
      filters: this.sanitizeQuery(query),
      suggestions,
      timestamp: Date.now()
    });
  }

  /**
   * Track search abandonment
   */
  trackSearchAbandoned(searchId, partialQuery = '') {
    const activeSearch = this.activeSearches.get(searchId);
    if (activeSearch) {
      const duration = Date.now() - activeSearch.startTime;
      
      searchAnalytics.trackEvent(SEARCH_EVENTS.SEARCH_ABANDONED, {
        searchId,
        partialQuery,
        duration,
        originalQuery: activeSearch.query,
        timestamp: Date.now()
      });

      this.activeSearches.delete(searchId);
    }
  }

  /**
   * Generate unique search ID
   */
  generateSearchId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate query complexity score
   */
  calculateQueryComplexity(query) {
    let complexity = 0;
    
    // Text search complexity
    if (query.text) {
      complexity += query.text.length > 20 ? 2 : 1;
      complexity += (query.text.match(/\s+/g) || []).length * 0.5; // Word count
    }
    
    // Filter complexity
    complexity += (query.styles?.length || 0) * 0.5;
    complexity += query.location ? 1 : 0;
    complexity += (query.difficulty?.length || 0) * 0.3;
    complexity += query.priceRange ? 0.5 : 0;
    complexity += query.rating ? 0.3 : 0;
    complexity += query.availability ? 0.3 : 0;
    complexity += query.experience ? 0.3 : 0;
    
    return Math.round(complexity * 10) / 10;
  }

  /**
   * Sanitize query for analytics (remove sensitive data)
   */
  sanitizeQuery(query) {
    const sanitized = { ...query };
    
    // Remove or sanitize potentially sensitive fields
    if (sanitized.text && sanitized.text.length > 100) {
      sanitized.text = sanitized.text.substring(0, 100) + '...';
    }
    
    // Keep only essential filter information
    return {
      hasText: !!sanitized.text,
      textLength: sanitized.text?.length || 0,
      styles: sanitized.styles?.length || 0,
      hasLocation: !!sanitized.location,
      hasFilters: Object.keys(sanitized).filter(key => 
        key !== 'text' && sanitized[key] !== undefined
      ).length
    };
  }

  /**
   * Add search to history
   */
  addToHistory(searchRecord) {
    this.searchHistory.unshift(searchRecord);
    
    // Limit history size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
    
    // Persist to localStorage
    try {
      localStorage.setItem('tattoo-search-history', JSON.stringify(
        this.searchHistory.slice(0, 20) // Store only last 20 searches
      ));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Get search history
   */
  getSearchHistory() {
    return [...this.searchHistory];
  }

  /**
   * Get recent successful searches
   */
  getRecentSuccessfulSearches(limit = 10) {
    return this.searchHistory
      .filter(search => search.success && search.resultCount > 0)
      .slice(0, limit);
  }

  /**
   * Get search analytics summary
   */
  getAnalyticsSummary() {
    const recentSearches = this.searchHistory.slice(0, 50);
    const successful = recentSearches.filter(s => s.success);
    const failed = recentSearches.filter(s => !s.success);
    
    return {
      totalSearches: recentSearches.length,
      successfulSearches: successful.length,
      failedSearches: failed.length,
      successRate: recentSearches.length > 0 ? 
        (successful.length / recentSearches.length) * 100 : 0,
      averageDuration: successful.length > 0 ?
        successful.reduce((sum, s) => sum + s.duration, 0) / successful.length : 0,
      averageResultCount: successful.length > 0 ?
        successful.reduce((sum, s) => sum + s.resultCount, 0) / successful.length : 0,
      commonErrors: this.getCommonErrors(failed),
      popularQueries: this.getPopularQueries(successful)
    };
  }

  /**
   * Get common error patterns
   */
  getCommonErrors(failedSearches) {
    const errorCounts = failedSearches.reduce((acc, search) => {
      const error = search.error || 'Unknown error';
      acc[error] = (acc[error] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * Get popular query patterns
   */
  getPopularQueries(successfulSearches) {
    const queryCounts = successfulSearches.reduce((acc, search) => {
      const queryText = search.query?.text || '';
      if (queryText.length > 0) {
        acc[queryText] = (acc[queryText] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  /**
   * Load search history from localStorage
   */
  loadSearchHistory() {
    try {
      const stored = localStorage.getItem('tattoo-search-history');
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  /**
   * Clear search history
   */
  clearSearchHistory() {
    this.searchHistory = [];
    try {
      localStorage.removeItem('tattoo-search-history');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }
}

/**
 * Search Analytics Hook for React Components
 */
export function useSearchAnalytics() {
  const controller = new AnalyticsEnabledSearchController();
  
  return {
    executeSearch: (query, options) => controller.executeSearch(query, options),
    trackResultClick: (searchId, resultId, resultData) => 
      controller.trackResultClick(searchId, resultId, resultData),
    trackSuggestionClick: (suggestion, context) => 
      controller.trackSuggestionClick(suggestion, context),
    trackFilterApplied: (type, value, context) => 
      controller.trackFilterApplied(type, value, context),
    trackFilterRemoved: (type, value, context) => 
      controller.trackFilterRemoved(type, value, context),
    trackNoResults: (query, suggestions) => 
      controller.trackNoResults(query, suggestions),
    trackSearchAbandoned: (searchId, partialQuery) => 
      controller.trackSearchAbandoned(searchId, partialQuery),
    getSearchHistory: () => controller.getSearchHistory(),
    getAnalyticsSummary: () => controller.getAnalyticsSummary(),
    clearSearchHistory: () => controller.clearSearchHistory()
  };
}

// Create singleton instance
export const searchController = new AnalyticsEnabledSearchController();

// Initialize search history on load
if (typeof window !== 'undefined') {
  searchController.loadSearchHistory();
}