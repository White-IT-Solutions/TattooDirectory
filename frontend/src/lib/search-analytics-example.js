/**
 * Search Analytics Usage Examples
 * 
 * Demonstrates how to integrate search analytics into React components
 * and search functionality throughout the application.
 * 
 * Requirements: 6.5, 13.4, 13.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  searchAnalytics, 
  searchPerformanceMonitor, 
  searchErrorTracker,
  SEARCH_EVENTS 
} from './search-analytics.js';
import { searchController, useSearchAnalytics } from './search-integration.js';

/**
 * Example: Enhanced Search Component with Analytics
 */
export function AnalyticsEnabledSearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState(null);
  
  const {
    executeSearch,
    trackResultClick,
    trackSuggestionClick,
    trackFilterApplied,
    trackNoResults,
    getSearchHistory
  } = useSearchAnalytics();

  /**
   * Handle search with full analytics tracking
   */
  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResult = await executeSearch({
        text: searchQuery,
        styles: [], // Add selected styles
        location: null, // Add location if available
      });

      setResults(searchResult.results || []);
      setSearchId(searchResult.searchId);

      // Track no results scenario
      if (searchResult.results.length === 0) {
        trackNoResults({ text: searchQuery }, [
          'Try different keywords',
          'Check spelling',
          'Use broader search terms'
        ]);
      }

    } catch (err) {
      setError(err.message);
      // Error tracking is handled automatically by executeSearch
    } finally {
      setLoading(false);
    }
  }, [executeSearch, trackNoResults]);

  /**
   * Handle result click with analytics
   */
  const handleResultClick = useCallback((result, index) => {
    if (searchId) {
      trackResultClick(searchId, result.id, {
        type: result.type,
        position: index,
        title: result.title
      });
    }
    
    // Navigate to result page
    console.log('Navigating to:', result);
  }, [searchId, trackResultClick]);

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = useCallback((suggestion) => {
    trackSuggestionClick(suggestion, {
      currentQuery: query,
      searchId
    });
    
    setQuery(suggestion);
    handleSearch(suggestion);
  }, [query, searchId, trackSuggestionClick, handleSearch]);

  /**
   * Handle filter application
   */
  const handleFilterApplied = useCallback((filterType, filterValue) => {
    trackFilterApplied(filterType, filterValue, {
      currentQuery: query,
      searchId
    });
    
    // Re-execute search with new filters
    handleSearch(query);
  }, [query, searchId, trackFilterApplied, handleSearch]);

  return (
    <div className="analytics-enabled-search">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="Search for artists, styles, or studios..."
        />
        <button onClick={() => handleSearch(query)} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="search-error">
          <p>Search failed: {error}</p>
          <button onClick={() => handleSearch(query)}>Try Again</button>
        </div>
      )}

      <div className="search-suggestions">
        <button onClick={() => handleSuggestionClick('traditional tattoo')}>
          Traditional Tattoo
        </button>
        <button onClick={() => handleSuggestionClick('japanese style')}>
          Japanese Style
        </button>
        <button onClick={() => handleSuggestionClick('london artists')}>
          London Artists
        </button>
      </div>

      <div className="search-filters">
        <button onClick={() => handleFilterApplied('style', 'traditional')}>
          Traditional Style
        </button>
        <button onClick={() => handleFilterApplied('location', 'london')}>
          London
        </button>
        <button onClick={() => handleFilterApplied('experience', 'expert')}>
          Expert Level
        </button>
      </div>

      <div className="search-results">
        {results.map((result, index) => (
          <div 
            key={result.id} 
            className="search-result"
            onClick={() => handleResultClick(result, index)}
          >
            <h3>{result.title}</h3>
            <p>Type: {result.type}</p>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && query && (
        <div className="no-results">
          <p>No results found for "{query}"</p>
          <div className="suggestions">
            <p>Try:</p>
            <button onClick={() => handleSuggestionClick('tattoo artists')}>
              Tattoo Artists
            </button>
            <button onClick={() => handleSuggestionClick('tattoo studios')}>
              Tattoo Studios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Search Analytics Dashboard Integration
 */
export function SearchAnalyticsDashboardExample() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [errorData, setErrorData] = useState(null);

  useEffect(() => {
    const loadAnalytics = () => {
      setAnalyticsData(searchAnalytics.getAnalyticsSummary());
      setPerformanceData(searchPerformanceMonitor.getPerformanceSummary());
      setErrorData(searchErrorTracker.getErrorSummary());
    };

    loadAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="search-analytics-dashboard">
      <h2>Search Analytics Dashboard</h2>
      
      <div className="analytics-summary">
        <h3>Current Session</h3>
        {analyticsData?.session && (
          <div className="session-stats">
            <p>Total Searches: {analyticsData.session.searchCount}</p>
            <p>Successful: {analyticsData.session.successfulSearches}</p>
            <p>Success Rate: {analyticsData.session.successRate.toFixed(1)}%</p>
            <p>Avg Response Time: {analyticsData.session.averageSearchTime.toFixed(0)}ms</p>
          </div>
        )}
      </div>

      <div className="performance-summary">
        <h3>Performance Metrics</h3>
        {performanceData && (
          <div className="performance-stats">
            <p>Total Searches: {performanceData.totalSearches}</p>
            <p>Average Duration: {performanceData.averageDuration?.toFixed(0) || 0}ms</p>
            <p>Cache Hit Rate: {performanceData.cacheHitRate?.toFixed(1) || 0}%</p>
            <p>Slow Searches: {performanceData.slowSearches || 0}</p>
          </div>
        )}
      </div>

      <div className="error-summary">
        <h3>Error Tracking</h3>
        {errorData && (
          <div className="error-stats">
            <p>Total Errors: {errorData.totalErrors}</p>
            <p>Recent Errors: {errorData.recentErrors}</p>
            {errorData.mostCommonErrors?.length > 0 && (
              <div className="common-errors">
                <h4>Most Common Errors:</h4>
                {errorData.mostCommonErrors.slice(0, 3).map((error, index) => (
                  <p key={index}>{error.error}: {error.count} times</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example: A/B Test Integration
 */
export function ABTestEnabledSearchComponent() {
  const [searchInterface, setSearchInterface] = useState('control');
  
  useEffect(() => {
    // Get user's variant for search interface test
    import('./search-analytics.js').then(({ searchABTesting }) => {
      // Create test if it doesn't exist
      if (!searchABTesting.tests.has('search-interface-v2')) {
        searchABTesting.createTest('search-interface-v2', {
          name: 'Search Interface V2 Test',
          description: 'Testing new search interface design',
          variants: [
            { id: 'control', name: 'Original Interface' },
            { id: 'variant', name: 'Enhanced Interface' }
          ],
          trafficSplit: 50,
          metrics: ['conversion_rate', 'search_success_rate']
        });
      }

      const variant = searchABTesting.getUserVariant('search-interface-v2');
      setSearchInterface(variant.id);
    });
  }, []);

  const handleSearchSuccess = useCallback(() => {
    // Track successful search for A/B test
    import('./search-analytics.js').then(({ searchABTesting }) => {
      searchABTesting.trackEvent('search-interface-v2', 'search_success');
    });
  }, []);

  const handleConversion = useCallback(() => {
    // Track conversion (e.g., user contacts artist)
    import('./search-analytics.js').then(({ searchABTesting }) => {
      searchABTesting.trackEvent('search-interface-v2', 'conversion');
    });
  }, []);

  return (
    <div className={`search-component interface-${searchInterface}`}>
      {searchInterface === 'control' ? (
        <div className="original-interface">
          <h3>Original Search Interface</h3>
          <input type="text" placeholder="Search..." />
          <button onClick={handleSearchSuccess}>Search</button>
        </div>
      ) : (
        <div className="enhanced-interface">
          <h3>Enhanced Search Interface</h3>
          <div className="enhanced-search-box">
            <input type="text" placeholder="What kind of tattoo are you looking for?" />
            <div className="quick-filters">
              <button>Traditional</button>
              <button>Realism</button>
              <button>Japanese</button>
            </div>
            <button onClick={handleSearchSuccess} className="enhanced-search-btn">
              Find Artists
            </button>
          </div>
        </div>
      )}
      
      <div className="search-results">
        {/* Search results would go here */}
        <button onClick={handleConversion} className="contact-artist-btn">
          Contact Artist
        </button>
      </div>
    </div>
  );
}

/**
 * Example: Manual Analytics Tracking
 */
export function ManualAnalyticsExample() {
  const trackCustomEvent = useCallback(() => {
    // Track custom search-related events
    searchAnalytics.trackEvent('custom_search_action', {
      action: 'advanced_filter_used',
      filterType: 'price_range',
      filterValue: { min: 100, max: 500 },
      timestamp: Date.now()
    });
  }, []);

  const trackPerformance = useCallback(() => {
    // Manual performance tracking
    const searchId = 'manual-search-' + Date.now();
    
    searchPerformanceMonitor.recordSearchPerformance(searchId, {
      duration: 250,
      resultCount: 12,
      cacheHit: true,
      query: {
        text: 'traditional dragon tattoo',
        styles: ['traditional', 'japanese'],
        location: 'London'
      }
    });
  }, []);

  const trackError = useCallback(() => {
    // Manual error tracking
    const error = new Error('Custom search error');
    
    searchErrorTracker.trackError(error, {
      searchContext: 'advanced_search',
      userAction: 'filter_application',
      additionalInfo: 'User applied too many filters simultaneously'
    });
  }, []);

  return (
    <div className="manual-analytics-example">
      <h3>Manual Analytics Tracking</h3>
      <button onClick={trackCustomEvent}>Track Custom Event</button>
      <button onClick={trackPerformance}>Track Performance</button>
      <button onClick={trackError}>Track Error</button>
    </div>
  );
}

/**
 * Example: Search History Integration
 */
export function SearchHistoryExample() {
  const [searchHistory, setSearchHistory] = useState([]);
  
  useEffect(() => {
    setSearchHistory(searchController.getSearchHistory());
  }, []);

  const repeatSearch = useCallback((historicalSearch) => {
    // Re-execute a search from history
    searchController.executeSearch(historicalSearch.query)
      .then(() => {
        // Track repeat search
        searchAnalytics.trackEvent('repeat_search', {
          originalSearchId: historicalSearch.searchId,
          originalTimestamp: historicalSearch.timestamp,
          timeSinceOriginal: Date.now() - historicalSearch.timestamp
        });
      });
  }, []);

  return (
    <div className="search-history">
      <h3>Recent Searches</h3>
      {searchHistory.slice(0, 10).map((search, index) => (
        <div key={search.searchId} className="history-item">
          <span className="query">{search.query?.text || 'Advanced Search'}</span>
          <span className="results">{search.resultCount} results</span>
          <span className="duration">{search.duration}ms</span>
          <button onClick={() => repeatSearch(search)}>Repeat</button>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Real-time Analytics Updates
 */
export function RealTimeAnalyticsExample() {
  const [liveStats, setLiveStats] = useState({
    activeSearches: 0,
    recentErrors: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    const updateStats = () => {
      const analytics = searchAnalytics.getAnalyticsSummary();
      const performance = searchPerformanceMonitor.getPerformanceSummary();
      const errors = searchErrorTracker.getErrorSummary();

      setLiveStats({
        activeSearches: analytics.session?.searchCount || 0,
        recentErrors: errors.recentErrors || 0,
        averageResponseTime: performance.averageDuration || 0
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="real-time-analytics">
      <h3>Live Search Analytics</h3>
      <div className="live-stats">
        <div className="stat">
          <label>Active Searches:</label>
          <span>{liveStats.activeSearches}</span>
        </div>
        <div className="stat">
          <label>Recent Errors:</label>
          <span className={liveStats.recentErrors > 0 ? 'error' : 'success'}>
            {liveStats.recentErrors}
          </span>
        </div>
        <div className="stat">
          <label>Avg Response Time:</label>
          <span className={liveStats.averageResponseTime > 500 ? 'warning' : 'success'}>
            {liveStats.averageResponseTime.toFixed(0)}ms
          </span>
        </div>
      </div>
    </div>
  );
}

export default {
  AnalyticsEnabledSearchComponent,
  SearchAnalyticsDashboardExample,
  ABTestEnabledSearchComponent,
  ManualAnalyticsExample,
  SearchHistoryExample,
  RealTimeAnalyticsExample
};