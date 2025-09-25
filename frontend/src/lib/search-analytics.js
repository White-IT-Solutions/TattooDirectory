/**
 * Search Analytics and Monitoring System
 * 
 * Comprehensive analytics system for tracking search performance, user behavior,
 * error rates, and providing optimization recommendations.
 * 
 * Requirements: 6.5, 13.4, 13.5
 */

import { performanceMonitor } from './performance-utils.js';

/**
 * Search event types for analytics tracking
 */
export const SEARCH_EVENTS = {
  SEARCH_INITIATED: 'search_initiated',
  SEARCH_COMPLETED: 'search_completed',
  SEARCH_FAILED: 'search_failed',
  FILTER_APPLIED: 'filter_applied',
  FILTER_REMOVED: 'filter_removed',
  RESULT_CLICKED: 'result_clicked',
  SUGGESTION_CLICKED: 'suggestion_clicked',
  NO_RESULTS: 'no_results',
  SEARCH_ABANDONED: 'search_abandoned',
  PAGE_CHANGED: 'page_changed',
  SORT_CHANGED: 'sort_changed'
};

/**
 * Search performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  FAST_SEARCH: 200,      // < 200ms is fast
  ACCEPTABLE_SEARCH: 500, // < 500ms is acceptable
  SLOW_SEARCH: 1000,     // > 1000ms is slow
  TIMEOUT: 10000         // 10s timeout
};

/**
 * Search Analytics Collector
 * Collects and stores search analytics data
 */
export class SearchAnalyticsCollector {
  constructor() {
    this.events = [];
    this.sessions = new Map();
    this.currentSessionId = this.generateSessionId();
    this.maxEvents = 1000; // Limit stored events
    this.storageKey = 'tattoo-search-analytics';
    
    // Initialize session
    this.initializeSession();
    
    // Setup periodic data persistence
    this.setupPeriodicSave();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize current session
   */
  initializeSession() {
    const session = {
      id: this.currentSessionId,
      startTime: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : null,
      events: [],
      searchCount: 0,
      successfulSearches: 0,
      failedSearches: 0,
      totalSearchTime: 0,
      averageSearchTime: 0
    };
    
    this.sessions.set(this.currentSessionId, session);
  }

  /**
   * Track search event
   */
  trackEvent(eventType, data = {}) {
    const timestamp = Date.now();
    const event = {
      id: this.generateEventId(),
      sessionId: this.currentSessionId,
      type: eventType,
      timestamp,
      data: { ...data },
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    };

    // Add to events array
    this.events.push(event);
    
    // Add to current session
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.events.push(event);
      this.updateSessionMetrics(session, event);
    }

    // Limit stored events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Trigger analytics processing
    this.processEvent(event);
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update session metrics based on event
   */
  updateSessionMetrics(session, event) {
    switch (event.type) {
      case SEARCH_EVENTS.SEARCH_INITIATED:
        session.searchCount++;
        break;
        
      case SEARCH_EVENTS.SEARCH_COMPLETED:
        session.successfulSearches++;
        if (event.data.duration) {
          session.totalSearchTime += event.data.duration;
          session.averageSearchTime = session.totalSearchTime / session.successfulSearches;
        }
        break;
        
      case SEARCH_EVENTS.SEARCH_FAILED:
        session.failedSearches++;
        break;
    }
  }

  /**
   * Process individual event for real-time analytics
   */
  processEvent(event) {
    // Check for performance issues
    if (event.type === SEARCH_EVENTS.SEARCH_COMPLETED && event.data.duration) {
      if (event.data.duration > PERFORMANCE_THRESHOLDS.SLOW_SEARCH) {
        this.trackPerformanceIssue('slow_search', {
          duration: event.data.duration,
          query: event.data.query,
          resultCount: event.data.resultCount
        });
      }
    }

    // Check for no results
    if (event.type === SEARCH_EVENTS.NO_RESULTS) {
      this.trackSearchIssue('no_results', {
        query: event.data.query,
        filters: event.data.filters
      });
    }

    // Check for search failures
    if (event.type === SEARCH_EVENTS.SEARCH_FAILED) {
      this.trackSearchIssue('search_error', {
        error: event.data.error,
        query: event.data.query
      });
    }
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(issueType, data) {
    console.warn(`Search performance issue: ${issueType}`, data);
    
    // Could send to external analytics service here
    this.trackEvent('performance_issue', {
      issueType,
      ...data
    });
  }

  /**
   * Track search issues
   */
  trackSearchIssue(issueType, data) {
    console.warn(`Search issue: ${issueType}`, data);
    
    // Could send to external analytics service here
    this.trackEvent('search_issue', {
      issueType,
      ...data
    });
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    const session = this.sessions.get(this.currentSessionId);
    const recentEvents = this.events.slice(-100); // Last 100 events
    
    return {
      session: session ? {
        id: session.id,
        duration: Date.now() - session.startTime,
        searchCount: session.searchCount,
        successfulSearches: session.successfulSearches,
        failedSearches: session.failedSearches,
        successRate: session.searchCount > 0 ? 
          (session.successfulSearches / session.searchCount) * 100 : 0,
        averageSearchTime: session.averageSearchTime
      } : null,
      recentEvents: recentEvents.map(event => ({
        type: event.type,
        timestamp: event.timestamp,
        data: event.data
      })),
      totalEvents: this.events.length
    };
  }

  /**
   * Setup periodic data persistence
   */
  setupPeriodicSave() {
    if (typeof window !== 'undefined') {
      // Save data every 30 seconds
      setInterval(() => {
        this.saveToStorage();
      }, 30000);

      // Save on page unload
      window.addEventListener('beforeunload', () => {
        this.saveToStorage();
      });
    }
  }

  /**
   * Save analytics data to local storage
   */
  saveToStorage() {
    try {
      const data = {
        events: this.events.slice(-500), // Keep last 500 events
        sessions: Array.from(this.sessions.entries()).slice(-10), // Keep last 10 sessions
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }

  /**
   * Load analytics data from local storage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      // Load events (but not too old ones)
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.events = (data.events || []).filter(event => event.timestamp > oneWeekAgo);
      
      // Load sessions
      if (data.sessions) {
        data.sessions.forEach(([sessionId, session]) => {
          if (session.startTime > oneWeekAgo) {
            this.sessions.set(sessionId, session);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  /**
   * Clear analytics data
   */
  clearData() {
    this.events = [];
    this.sessions.clear();
    this.initializeSession();
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear analytics data:', error);
    }
  }
}

/**
 * Search Performance Monitor
 * Monitors search performance and provides optimization recommendations
 */
export class SearchPerformanceMonitor {
  constructor() {
    this.performanceData = new Map();
    this.thresholds = { ...PERFORMANCE_THRESHOLDS };
    this.recommendations = [];
  }

  /**
   * Record search performance
   */
  recordSearchPerformance(searchId, metrics) {
    const performanceRecord = {
      searchId,
      timestamp: Date.now(),
      duration: metrics.duration || 0,
      resultCount: metrics.resultCount || 0,
      cacheHit: metrics.cacheHit || false,
      queryComplexity: this.calculateQueryComplexity(metrics.query),
      ...metrics
    };

    this.performanceData.set(searchId, performanceRecord);
    
    // Analyze performance
    this.analyzePerformance(performanceRecord);
    
    // Limit stored data
    if (this.performanceData.size > 1000) {
      const oldestKey = this.performanceData.keys().next().value;
      this.performanceData.delete(oldestKey);
    }
  }

  /**
   * Calculate query complexity score
   */
  calculateQueryComplexity(query) {
    if (!query) return 0;
    
    let complexity = 0;
    
    // Text search complexity
    if (query.text) {
      complexity += query.text.length > 20 ? 2 : 1;
    }
    
    // Filter complexity
    complexity += (query.styles?.length || 0) * 0.5;
    complexity += query.location ? 1 : 0;
    complexity += (query.difficulty?.length || 0) * 0.3;
    complexity += query.priceRange ? 0.5 : 0;
    complexity += query.rating ? 0.3 : 0;
    
    return Math.round(complexity * 10) / 10;
  }

  /**
   * Analyze search performance and generate recommendations
   */
  analyzePerformance(record) {
    const { duration, resultCount, cacheHit, queryComplexity } = record;
    
    // Check for slow searches
    if (duration > this.thresholds.SLOW_SEARCH) {
      this.addRecommendation({
        type: 'performance',
        severity: 'high',
        message: `Search took ${duration}ms (>${this.thresholds.SLOW_SEARCH}ms threshold)`,
        suggestion: 'Consider optimizing query or implementing better caching',
        data: { duration, queryComplexity, cacheHit }
      });
    }
    
    // Check for cache misses on complex queries
    if (!cacheHit && queryComplexity > 3) {
      this.addRecommendation({
        type: 'caching',
        severity: 'medium',
        message: 'Complex query resulted in cache miss',
        suggestion: 'Consider pre-caching common complex queries',
        data: { queryComplexity, duration }
      });
    }
    
    // Check for no results
    if (resultCount === 0) {
      this.addRecommendation({
        type: 'results',
        severity: 'medium',
        message: 'Search returned no results',
        suggestion: 'Consider improving search suggestions or expanding search criteria',
        data: { queryComplexity, duration }
      });
    }
  }

  /**
   * Add performance recommendation
   */
  addRecommendation(recommendation) {
    recommendation.id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    recommendation.timestamp = Date.now();
    
    this.recommendations.push(recommendation);
    
    // Limit recommendations
    if (this.recommendations.length > 100) {
      this.recommendations = this.recommendations.slice(-100);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const records = Array.from(this.performanceData.values());
    
    if (records.length === 0) {
      return {
        totalSearches: 0,
        averageDuration: 0,
        cacheHitRate: 0,
        slowSearches: 0,
        recommendations: []
      };
    }

    const durations = records.map(r => r.duration);
    const cacheHits = records.filter(r => r.cacheHit).length;
    const slowSearches = records.filter(r => r.duration > this.thresholds.SLOW_SEARCH).length;

    return {
      totalSearches: records.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      cacheHitRate: (cacheHits / records.length) * 100,
      slowSearches,
      slowSearchRate: (slowSearches / records.length) * 100,
      recommendations: this.recommendations.slice(-10) // Last 10 recommendations
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const summary = this.getPerformanceSummary();
    const recommendations = [];

    // Performance recommendations
    if (summary.averageDuration > this.thresholds.ACCEPTABLE_SEARCH) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Improve Search Performance',
        description: `Average search time is ${summary.averageDuration.toFixed(0)}ms, which exceeds the ${this.thresholds.ACCEPTABLE_SEARCH}ms target.`,
        actions: [
          'Implement search result caching',
          'Optimize database queries',
          'Consider search result pagination',
          'Implement search debouncing'
        ]
      });
    }

    // Cache recommendations
    if (summary.cacheHitRate < 50) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        title: 'Improve Cache Hit Rate',
        description: `Cache hit rate is ${summary.cacheHitRate.toFixed(1)}%, which is below the 50% target.`,
        actions: [
          'Increase cache TTL for stable queries',
          'Pre-cache popular search terms',
          'Implement smarter cache invalidation',
          'Cache partial results for faster filtering'
        ]
      });
    }

    // Error rate recommendations
    if (summary.slowSearchRate > 10) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Reduce Slow Search Rate',
        description: `${summary.slowSearchRate.toFixed(1)}% of searches are slow (>${this.thresholds.SLOW_SEARCH}ms).`,
        actions: [
          'Implement search timeouts',
          'Add loading indicators for slow searches',
          'Optimize complex query handling',
          'Consider search result streaming'
        ]
      });
    }

    return recommendations;
  }
}

/**
 * Search Error Tracker
 * Tracks and analyzes search errors for debugging and optimization
 */
export class SearchErrorTracker {
  constructor() {
    this.errors = [];
    this.errorCounts = new Map();
    this.maxErrors = 500;
  }

  /**
   * Track search error
   */
  trackError(error, context = {}) {
    const errorRecord = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: error.name || 'Error',
      context: { ...context },
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    };

    this.errors.push(errorRecord);
    
    // Count error types
    const errorKey = `${errorRecord.type}:${errorRecord.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // Limit stored errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log error for debugging
    console.error('Search error tracked:', errorRecord);
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    const recentErrors = this.errors.slice(-50); // Last 50 errors
    const errorTypes = new Map();
    
    recentErrors.forEach(error => {
      errorTypes.set(error.type, (errorTypes.get(error.type) || 0) + 1);
    });

    return {
      totalErrors: this.errors.length,
      recentErrors: recentErrors.length,
      errorTypes: Object.fromEntries(errorTypes),
      mostCommonErrors: Array.from(this.errorCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([error, count]) => ({ error, count }))
    };
  }

  /**
   * Get error trends
   */
  getErrorTrends() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    const lastHour = this.errors.filter(e => now - e.timestamp < oneHour).length;
    const lastDay = this.errors.filter(e => now - e.timestamp < oneDay).length;
    
    return {
      lastHour,
      lastDay,
      hourlyRate: lastHour,
      dailyRate: lastDay / 24
    };
  }
}

/**
 * A/B Testing Framework for Search Interfaces
 */
export class SearchABTestFramework {
  constructor() {
    this.tests = new Map();
    this.userAssignments = new Map();
    this.results = new Map();
    this.storageKey = 'tattoo-search-ab-tests';
    
    this.loadFromStorage();
  }

  /**
   * Create A/B test
   */
  createTest(testId, config) {
    const test = {
      id: testId,
      name: config.name,
      description: config.description,
      variants: config.variants, // Array of variant objects
      trafficSplit: config.trafficSplit || 50, // Percentage for variant B
      startDate: config.startDate || Date.now(),
      endDate: config.endDate,
      active: config.active !== false,
      metrics: config.metrics || ['conversion_rate', 'search_success_rate'],
      ...config
    };

    this.tests.set(testId, test);
    this.results.set(testId, {
      variants: {},
      totalUsers: 0,
      startTime: Date.now()
    });

    this.saveToStorage();
    return test;
  }

  /**
   * Get user's variant for a test
   */
  getUserVariant(testId, userId = null) {
    const test = this.tests.get(testId);
    if (!test || !test.active) {
      return test?.variants[0] || null; // Return control variant
    }

    // Check if user already assigned
    const assignmentKey = `${testId}:${userId || 'anonymous'}`;
    if (this.userAssignments.has(assignmentKey)) {
      return this.userAssignments.get(assignmentKey);
    }

    // Assign user to variant
    const random = Math.random() * 100;
    const variant = random < test.trafficSplit ? test.variants[1] : test.variants[0];
    
    this.userAssignments.set(assignmentKey, variant);
    
    // Initialize results for this variant if needed
    const testResults = this.results.get(testId);
    if (!testResults.variants[variant.id]) {
      testResults.variants[variant.id] = {
        users: 0,
        events: [],
        metrics: {}
      };
    }
    
    testResults.variants[variant.id].users++;
    testResults.totalUsers++;
    
    this.saveToStorage();
    return variant;
  }

  /**
   * Track A/B test event
   */
  trackEvent(testId, eventType, data = {}, userId = null) {
    const variant = this.getUserVariant(testId, userId);
    if (!variant) return;

    const testResults = this.results.get(testId);
    if (!testResults) return;

    const variantResults = testResults.variants[variant.id];
    if (!variantResults) return;

    const event = {
      type: eventType,
      timestamp: Date.now(),
      data: { ...data }
    };

    variantResults.events.push(event);
    
    // Update metrics
    this.updateTestMetrics(testId, variant.id, event);
    
    this.saveToStorage();
  }

  /**
   * Update test metrics based on event
   */
  updateTestMetrics(testId, variantId, event) {
    const testResults = this.results.get(testId);
    const variantResults = testResults.variants[variantId];
    
    if (!variantResults.metrics) {
      variantResults.metrics = {};
    }

    // Update conversion rate
    if (event.type === 'conversion') {
      variantResults.metrics.conversions = (variantResults.metrics.conversions || 0) + 1;
      variantResults.metrics.conversion_rate = 
        (variantResults.metrics.conversions / variantResults.users) * 100;
    }

    // Update search success rate
    if (event.type === SEARCH_EVENTS.SEARCH_COMPLETED) {
      variantResults.metrics.successful_searches = (variantResults.metrics.successful_searches || 0) + 1;
    }
    
    if (event.type === SEARCH_EVENTS.SEARCH_FAILED) {
      variantResults.metrics.failed_searches = (variantResults.metrics.failed_searches || 0) + 1;
    }

    const totalSearches = (variantResults.metrics.successful_searches || 0) + 
                         (variantResults.metrics.failed_searches || 0);
    
    if (totalSearches > 0) {
      variantResults.metrics.search_success_rate = 
        ((variantResults.metrics.successful_searches || 0) / totalSearches) * 100;
    }
  }

  /**
   * Get test results
   */
  getTestResults(testId) {
    const test = this.tests.get(testId);
    const results = this.results.get(testId);
    
    if (!test || !results) return null;

    return {
      test,
      results: {
        ...results,
        duration: Date.now() - results.startTime,
        variants: Object.entries(results.variants).map(([variantId, data]) => ({
          id: variantId,
          name: test.variants.find(v => v.id === variantId)?.name || variantId,
          ...data
        }))
      }
    };
  }

  /**
   * Save A/B test data to storage
   */
  saveToStorage() {
    try {
      const data = {
        tests: Array.from(this.tests.entries()),
        userAssignments: Array.from(this.userAssignments.entries()),
        results: Array.from(this.results.entries()),
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save A/B test data:', error);
    }
  }

  /**
   * Load A/B test data from storage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      if (data.tests) {
        this.tests = new Map(data.tests);
      }
      
      if (data.userAssignments) {
        this.userAssignments = new Map(data.userAssignments);
      }
      
      if (data.results) {
        this.results = new Map(data.results);
      }
    } catch (error) {
      console.warn('Failed to load A/B test data:', error);
    }
  }
}

// Create singleton instances
export const searchAnalytics = new SearchAnalyticsCollector();
export const searchPerformanceMonitor = new SearchPerformanceMonitor();
export const searchErrorTracker = new SearchErrorTracker();
export const searchABTesting = new SearchABTestFramework();

// Initialize analytics on load
if (typeof window !== 'undefined') {
  searchAnalytics.loadFromStorage();
}