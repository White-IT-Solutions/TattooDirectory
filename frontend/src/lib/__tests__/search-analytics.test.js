/**
 * Search Analytics Test Suite
 * 
 * Comprehensive tests for search analytics, performance monitoring,
 * error tracking, and A/B testing functionality.
 * 
 * Requirements: 6.5, 13.4, 13.5
 */

import { 
  SearchAnalyticsCollector,
  SearchPerformanceMonitor,
  SearchErrorTracker,
  SearchABTestFramework,
  SEARCH_EVENTS,
  PERFORMANCE_THRESHOLDS
} from '../search-analytics.js';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn()
};

describe('SearchAnalyticsCollector', () => {
  let analytics;

  beforeEach(() => {
    analytics = new SearchAnalyticsCollector();
    jest.clearAllMocks();
  });

  describe('Event Tracking', () => {
    test('should track search events with proper structure', () => {
      const eventData = {
        query: 'traditional tattoo',
        duration: 250,
        resultCount: 15
      };

      analytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, eventData);

      expect(analytics.events).toHaveLength(1);
      const event = analytics.events[0];
      
      expect(event).toMatchObject({
        type: SEARCH_EVENTS.SEARCH_COMPLETED,
        data: eventData,
        sessionId: analytics.currentSessionId
      });
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    test('should update session metrics correctly', () => {
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_INITIATED, { query: 'test' });
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, { 
        query: 'test', 
        duration: 300,
        resultCount: 10 
      });

      const session = analytics.sessions.get(analytics.currentSessionId);
      
      expect(session.searchCount).toBe(1);
      expect(session.successfulSearches).toBe(1);
      expect(session.totalSearchTime).toBe(300);
      expect(session.averageSearchTime).toBe(300);
    });

    test('should track failed searches', () => {
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_INITIATED, { query: 'test' });
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_FAILED, { 
        query: 'test', 
        error: 'Network error' 
      });

      const session = analytics.sessions.get(analytics.currentSessionId);
      
      expect(session.searchCount).toBe(1);
      expect(session.failedSearches).toBe(1);
      expect(session.successfulSearches).toBe(0);
    });

    test('should limit stored events to maxEvents', () => {
      analytics.maxEvents = 5;
      
      // Add more events than the limit
      for (let i = 0; i < 10; i++) {
        analytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, { query: `test${i}` });
      }

      expect(analytics.events).toHaveLength(5);
      // Should keep the most recent events
      expect(analytics.events[0].data.query).toBe('test5');
      expect(analytics.events[4].data.query).toBe('test9');
    });
  });

  describe('Performance Issue Detection', () => {
    test('should detect slow searches', () => {
      const slowDuration = PERFORMANCE_THRESHOLDS.SLOW_SEARCH + 100;
      const trackSpy = jest.spyOn(analytics, 'trackPerformanceIssue');

      analytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, {
        query: 'test',
        duration: slowDuration,
        resultCount: 5
      });

      expect(trackSpy).toHaveBeenCalledWith('slow_search', {
        duration: slowDuration,
        query: 'test',
        resultCount: 5
      });
    });

    test('should detect no results scenarios', () => {
      const trackSpy = jest.spyOn(analytics, 'trackSearchIssue');

      analytics.trackEvent(SEARCH_EVENTS.NO_RESULTS, {
        query: 'nonexistent style',
        filters: { styles: ['nonexistent'] }
      });

      expect(trackSpy).toHaveBeenCalledWith('no_results', {
        query: 'nonexistent style',
        filters: { styles: ['nonexistent'] }
      });
    });

    test('should detect search failures', () => {
      const trackSpy = jest.spyOn(analytics, 'trackSearchIssue');

      analytics.trackEvent(SEARCH_EVENTS.SEARCH_FAILED, {
        query: 'test',
        error: 'Server error'
      });

      expect(trackSpy).toHaveBeenCalledWith('search_error', {
        error: 'Server error',
        query: 'test'
      });
    });
  });

  describe('Analytics Summary', () => {
    test('should generate comprehensive analytics summary', () => {
      // Add some test events
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_INITIATED, { query: 'test1' });
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, { 
        query: 'test1', 
        duration: 200,
        resultCount: 10 
      });
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_INITIATED, { query: 'test2' });
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_FAILED, { 
        query: 'test2', 
        error: 'Network error' 
      });

      const summary = analytics.getAnalyticsSummary();

      expect(summary.session).toMatchObject({
        searchCount: 2,
        successfulSearches: 1,
        failedSearches: 1,
        successRate: 50,
        averageSearchTime: 200
      });
      expect(summary.recentEvents).toHaveLength(4);
      expect(summary.totalEvents).toBe(4);
    });
  });

  describe('Data Persistence', () => {
    test('should save data to localStorage', () => {
      analytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, { query: 'test' });
      
      analytics.saveToStorage();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        analytics.storageKey,
        expect.stringContaining('"events"')
      );
    });

    test('should load data from localStorage', () => {
      const mockData = {
        events: [
          {
            id: 'test-event',
            type: SEARCH_EVENTS.SEARCH_COMPLETED,
            timestamp: Date.now(),
            data: { query: 'test' }
          }
        ],
        sessions: [],
        timestamp: Date.now()
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(mockData));
      
      analytics.loadFromStorage();

      expect(analytics.events).toHaveLength(1);
      expect(analytics.events[0].data.query).toBe('test');
    });

    test('should handle localStorage errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => analytics.saveToStorage()).not.toThrow();
    });
  });
});

describe('SearchPerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new SearchPerformanceMonitor();
  });

  describe('Performance Recording', () => {
    test('should record search performance metrics', () => {
      const searchId = 'test-search-1';
      const metrics = {
        duration: 250,
        resultCount: 15,
        cacheHit: true,
        query: { text: 'traditional tattoo', styles: ['traditional'] }
      };

      monitor.recordSearchPerformance(searchId, metrics);

      expect(monitor.performanceData.has(searchId)).toBe(true);
      const record = monitor.performanceData.get(searchId);
      
      expect(record).toMatchObject({
        searchId,
        duration: 250,
        resultCount: 15,
        cacheHit: true,
        queryComplexity: expect.any(Number)
      });
    });

    test('should calculate query complexity correctly', () => {
      const simpleQuery = { text: 'tattoo' };
      const complexQuery = {
        text: 'traditional japanese dragon tattoo with cherry blossoms',
        styles: ['traditional', 'japanese'],
        location: 'London',
        difficulty: ['intermediate', 'advanced'],
        priceRange: { min: 200, max: 500 },
        rating: 4.5
      };

      const simpleComplexity = monitor.calculateQueryComplexity(simpleQuery);
      const complexComplexity = monitor.calculateQueryComplexity(complexQuery);

      expect(simpleComplexity).toBeLessThan(complexComplexity);
      expect(complexComplexity).toBeGreaterThan(3);
    });
  });

  describe('Performance Analysis', () => {
    test('should generate performance recommendations for slow searches', () => {
      const searchId = 'slow-search';
      const metrics = {
        duration: PERFORMANCE_THRESHOLDS.SLOW_SEARCH + 200,
        resultCount: 5,
        cacheHit: false,
        query: { text: 'complex query', styles: ['style1', 'style2', 'style3'] }
      };

      monitor.recordSearchPerformance(searchId, metrics);

      expect(monitor.recommendations.length).toBeGreaterThan(0);
      const recommendation = monitor.recommendations[0];
      expect(recommendation.type).toBe('performance');
      expect(recommendation.severity).toBe('high');
    });

    test('should recommend caching for complex queries with cache misses', () => {
      const searchId = 'cache-miss-search';
      const metrics = {
        duration: 400,
        resultCount: 10,
        cacheHit: false,
        query: { 
          text: 'very complex query with multiple filters',
          styles: ['style1', 'style2', 'style3', 'style4'],
          location: 'London',
          difficulty: ['advanced']
        }
      };

      monitor.recordSearchPerformance(searchId, metrics);

      const cachingRecommendations = monitor.recommendations.filter(
        r => r.type === 'caching'
      );
      expect(cachingRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Summary', () => {
    test('should generate comprehensive performance summary', () => {
      // Add various performance records
      monitor.recordSearchPerformance('fast-search', {
        duration: 150,
        resultCount: 20,
        cacheHit: true,
        query: { text: 'simple' }
      });

      monitor.recordSearchPerformance('slow-search', {
        duration: 1200,
        resultCount: 5,
        cacheHit: false,
        query: { text: 'complex' }
      });

      const summary = monitor.getPerformanceSummary();

      expect(summary.totalSearches).toBe(2);
      expect(summary.averageDuration).toBe(675); // (150 + 1200) / 2
      expect(summary.cacheHitRate).toBe(50); // 1 out of 2
      expect(summary.slowSearches).toBe(1);
      expect(summary.slowSearchRate).toBe(50);
    });

    test('should handle empty performance data', () => {
      const summary = monitor.getPerformanceSummary();

      expect(summary).toMatchObject({
        totalSearches: 0,
        averageDuration: 0,
        cacheHitRate: 0,
        slowSearches: 0,
        recommendations: []
      });
    });
  });

  describe('Optimization Recommendations', () => {
    test('should provide optimization recommendations based on performance', () => {
      // Add slow searches
      for (let i = 0; i < 5; i++) {
        monitor.recordSearchPerformance(`slow-${i}`, {
          duration: PERFORMANCE_THRESHOLDS.SLOW_SEARCH + 100,
          resultCount: 10,
          cacheHit: false,
          query: { text: `query-${i}` }
        });
      }

      const recommendations = monitor.getOptimizationRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
      
      const performanceRec = recommendations.find(r => r.type === 'performance');
      expect(performanceRec).toBeDefined();
      expect(performanceRec.priority).toBe('high');
      expect(performanceRec.actions).toContain('Implement search result caching');
    });
  });
});

describe('SearchErrorTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new SearchErrorTracker();
  });

  describe('Error Tracking', () => {
    test('should track search errors with context', () => {
      const error = new Error('Network timeout');
      const context = {
        query: 'test query',
        filters: { styles: ['traditional'] },
        duration: 5000
      };

      tracker.trackError(error, context);

      expect(tracker.errors).toHaveLength(1);
      const errorRecord = tracker.errors[0];
      
      expect(errorRecord).toMatchObject({
        message: 'Network timeout',
        type: 'Error',
        context
      });
      expect(errorRecord.id).toBeDefined();
      expect(errorRecord.timestamp).toBeDefined();
    });

    test('should count error occurrences', () => {
      const error1 = new Error('Network timeout');
      const error2 = new Error('Network timeout');
      const error3 = new Error('Server error');

      tracker.trackError(error1);
      tracker.trackError(error2);
      tracker.trackError(error3);

      expect(tracker.errorCounts.get('Error:Network timeout')).toBe(2);
      expect(tracker.errorCounts.get('Error:Server error')).toBe(1);
    });

    test('should limit stored errors', () => {
      tracker.maxErrors = 3;

      for (let i = 0; i < 5; i++) {
        tracker.trackError(new Error(`Error ${i}`));
      }

      expect(tracker.errors).toHaveLength(3);
      // Should keep the most recent errors
      expect(tracker.errors[0].message).toBe('Error 2');
      expect(tracker.errors[2].message).toBe('Error 4');
    });
  });

  describe('Error Analysis', () => {
    test('should generate error summary', () => {
      tracker.trackError(new Error('Network error'));
      tracker.trackError(new Error('Server error'));
      tracker.trackError(new Error('Network error'));

      const summary = tracker.getErrorSummary();

      expect(summary.totalErrors).toBe(3);
      expect(summary.recentErrors).toBe(3);
      expect(summary.errorTypes.Error).toBe(3);
      expect(summary.mostCommonErrors).toHaveLength(2);
      expect(summary.mostCommonErrors[0]).toMatchObject({
        error: 'Error:Network error',
        count: 2
      });
    });

    test('should calculate error trends', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      // Mock timestamps
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(oneDayAgo)
        .mockReturnValueOnce(oneHourAgo)
        .mockReturnValueOnce(now);

      tracker.trackError(new Error('Old error'));
      tracker.trackError(new Error('Recent error'));
      tracker.trackError(new Error('Current error'));

      // Reset Date.now for trend calculation
      Date.now.mockRestore();

      const trends = tracker.getErrorTrends();

      expect(trends.lastHour).toBe(2); // Recent and current errors
      expect(trends.lastDay).toBe(3); // All errors
    });
  });
});

describe('SearchABTestFramework', () => {
  let framework;

  beforeEach(() => {
    framework = new SearchABTestFramework();
    localStorage.clear();
  });

  describe('Test Creation', () => {
    test('should create A/B test with proper configuration', () => {
      const testConfig = {
        name: 'Search Interface Test',
        description: 'Testing new search interface',
        variants: [
          { id: 'control', name: 'Original Interface' },
          { id: 'variant', name: 'New Interface' }
        ],
        trafficSplit: 50,
        metrics: ['conversion_rate', 'search_success_rate']
      };

      const test = framework.createTest('search-interface-test', testConfig);

      expect(test.id).toBe('search-interface-test');
      expect(test.name).toBe('Search Interface Test');
      expect(test.variants).toHaveLength(2);
      expect(test.active).toBe(true);
      expect(framework.tests.has('search-interface-test')).toBe(true);
    });
  });

  describe('User Assignment', () => {
    beforeEach(() => {
      framework.createTest('test-1', {
        name: 'Test 1',
        variants: [
          { id: 'control', name: 'Control' },
          { id: 'variant', name: 'Variant' }
        ],
        trafficSplit: 50
      });
    });

    test('should assign users to variants consistently', () => {
      const userId = 'user-123';
      
      const variant1 = framework.getUserVariant('test-1', userId);
      const variant2 = framework.getUserVariant('test-1', userId);

      expect(variant1).toEqual(variant2);
      expect(['control', 'variant']).toContain(variant1.id);
    });

    test('should respect traffic split', () => {
      const assignments = [];
      
      // Mock Math.random to control traffic split
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        // First 25 calls return < 0.5 (variant), next 25 return >= 0.5 (control)
        return callCount++ < 25 ? 0.25 : 0.75;
      };

      for (let i = 0; i < 50; i++) {
        const variant = framework.getUserVariant('test-1', `user-${i}`);
        assignments.push(variant.id);
      }

      Math.random = originalRandom;

      const variantCount = assignments.filter(v => v === 'variant').length;
      const controlCount = assignments.filter(v => v === 'control').length;

      expect(variantCount).toBe(25);
      expect(controlCount).toBe(25);
    });

    test('should return control variant for inactive tests', () => {
      framework.createTest('inactive-test', {
        name: 'Inactive Test',
        variants: [
          { id: 'control', name: 'Control' },
          { id: 'variant', name: 'Variant' }
        ],
        active: false
      });

      const variant = framework.getUserVariant('inactive-test', 'user-1');
      expect(variant.id).toBe('control');
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      framework.createTest('conversion-test', {
        name: 'Conversion Test',
        variants: [
          { id: 'control', name: 'Control' },
          { id: 'variant', name: 'Variant' }
        ],
        trafficSplit: 50
      });
    });

    test('should track events for test variants', () => {
      const userId = 'user-123';
      framework.getUserVariant('conversion-test', userId); // Assign user
      
      framework.trackEvent('conversion-test', 'conversion', { value: 100 }, userId);

      const results = framework.getTestResults('conversion-test');
      const variantResults = results.results.variants;
      
      expect(variantResults).toHaveLength(1);
      expect(variantResults[0].events).toHaveLength(1);
      expect(variantResults[0].events[0].type).toBe('conversion');
    });

    test('should update metrics based on events', () => {
      const userId = 'user-123';
      framework.getUserVariant('conversion-test', userId); // Assign user
      
      framework.trackEvent('conversion-test', 'conversion', {}, userId);

      const results = framework.getTestResults('conversion-test');
      const variantResults = results.results.variants[0];
      
      expect(variantResults.metrics.conversions).toBe(1);
      expect(variantResults.metrics.conversion_rate).toBe(100); // 1 conversion / 1 user
    });
  });

  describe('Results Analysis', () => {
    test('should provide comprehensive test results', () => {
      framework.createTest('results-test', {
        name: 'Results Test',
        variants: [
          { id: 'control', name: 'Control' },
          { id: 'variant', name: 'Variant' }
        ]
      });

      // Simulate user interactions
      framework.getUserVariant('results-test', 'user-1');
      framework.getUserVariant('results-test', 'user-2');
      framework.trackEvent('results-test', 'conversion', {}, 'user-1');

      const results = framework.getTestResults('results-test');

      expect(results.test.name).toBe('Results Test');
      expect(results.results.totalUsers).toBe(2);
      expect(results.results.variants).toHaveLength(2);
      expect(results.results.duration).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence', () => {
    test('should save and load test data', () => {
      framework.createTest('persistence-test', {
        name: 'Persistence Test',
        variants: [
          { id: 'control', name: 'Control' },
          { id: 'variant', name: 'Variant' }
        ]
      });

      framework.saveToStorage();
      expect(localStorage.setItem).toHaveBeenCalled();

      // Create new framework instance and load data
      const newFramework = new SearchABTestFramework();
      expect(newFramework.tests.has('persistence-test')).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  test('should work together for complete analytics flow', () => {
    const analytics = new SearchAnalyticsCollector();
    const performance = new SearchPerformanceMonitor();
    const errors = new SearchErrorTracker();

    // Simulate a search flow
    analytics.trackEvent(SEARCH_EVENTS.SEARCH_INITIATED, { query: 'traditional' });
    
    performance.recordSearchPerformance('search-1', {
      duration: 300,
      resultCount: 15,
      cacheHit: false,
      query: { text: 'traditional', styles: ['traditional'] }
    });

    analytics.trackEvent(SEARCH_EVENTS.SEARCH_COMPLETED, {
      query: 'traditional',
      duration: 300,
      resultCount: 15
    });

    // Verify all systems recorded the data
    expect(analytics.events).toHaveLength(2);
    expect(performance.performanceData.size).toBe(1);
    
    const analyticsSummary = analytics.getAnalyticsSummary();
    const performanceSummary = performance.getPerformanceSummary();

    expect(analyticsSummary.session.successfulSearches).toBe(1);
    expect(performanceSummary.totalSearches).toBe(1);
    expect(performanceSummary.averageDuration).toBe(300);
  });
});