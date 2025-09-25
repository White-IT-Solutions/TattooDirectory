/**
 * Performance Monitoring Utilities
 * 
 * Utilities for monitoring and measuring performance across the application,
 * with specific focus on search functionality performance.
 * 
 * Requirements: 6.5, 13.4, 13.5
 */

/**
 * Performance Monitor Class
 * Tracks performance metrics and provides optimization insights
 */
export class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
    this.thresholds = {
      fast: 200,
      acceptable: 500,
      slow: 1000,
      timeout: 10000
    };
  }

  /**
   * Start performance measurement
   */
  startMeasurement(id, metadata = {}) {
    const measurement = {
      id,
      startTime: performance.now(),
      startTimestamp: Date.now(),
      metadata: { ...metadata },
      marks: []
    };
    
    this.measurements.set(id, measurement);
    
    // Use Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${id}-start`);
    }
    
    return measurement;
  }

  /**
   * Add intermediate mark to measurement
   */
  addMark(id, markName, data = {}) {
    const measurement = this.measurements.get(id);
    if (!measurement) return null;

    const mark = {
      name: markName,
      time: performance.now(),
      timestamp: Date.now(),
      duration: performance.now() - measurement.startTime,
      data: { ...data }
    };

    measurement.marks.push(mark);
    
    // Use Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${id}-${markName}`);
    }
    
    return mark;
  }

  /**
   * End performance measurement
   */
  endMeasurement(id, metadata = {}) {
    const measurement = this.measurements.get(id);
    if (!measurement) return null;

    const endTime = performance.now();
    const duration = endTime - measurement.startTime;
    
    measurement.endTime = endTime;
    measurement.endTimestamp = Date.now();
    measurement.duration = duration;
    measurement.endMetadata = { ...metadata };
    
    // Use Performance API if available
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${id}-end`);
      try {
        performance.measure(id, `${id}-start`, `${id}-end`);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    
    // Analyze performance
    this.analyzePerformance(measurement);
    
    return measurement;
  }

  /**
   * Analyze performance measurement
   */
  analyzePerformance(measurement) {
    const { duration } = measurement;
    
    let category = 'fast';
    if (duration > this.thresholds.slow) {
      category = 'slow';
    } else if (duration > this.thresholds.acceptable) {
      category = 'acceptable';
    }
    
    measurement.category = category;
    measurement.analysis = {
      category,
      isOptimal: duration < this.thresholds.fast,
      isAcceptable: duration < this.thresholds.acceptable,
      needsOptimization: duration > this.thresholds.slow,
      suggestions: this.getOptimizationSuggestions(measurement)
    };
    
    return measurement.analysis;
  }

  /**
   * Get optimization suggestions based on performance
   */
  getOptimizationSuggestions(measurement) {
    const suggestions = [];
    const { duration, metadata, marks } = measurement;
    
    if (duration > this.thresholds.slow) {
      suggestions.push('Consider implementing caching for this operation');
      suggestions.push('Review database query optimization');
      suggestions.push('Consider pagination or result limiting');
    }
    
    if (duration > this.thresholds.acceptable) {
      suggestions.push('Add loading indicators for better user experience');
      suggestions.push('Consider debouncing user input');
    }
    
    // Analyze marks for bottlenecks
    if (marks.length > 0) {
      const slowestMark = marks.reduce((prev, current) => 
        (prev.duration > current.duration) ? prev : current
      );
      
      if (slowestMark.duration > duration * 0.5) {
        suggestions.push(`Optimize "${slowestMark.name}" operation - it takes ${Math.round(slowestMark.duration)}ms`);
      }
    }
    
    // Metadata-based suggestions
    if (metadata.queryComplexity > 5) {
      suggestions.push('Consider simplifying complex queries');
    }
    
    if (metadata.resultCount === 0) {
      suggestions.push('Implement search suggestions for no-result queries');
    }
    
    return suggestions;
  }

  /**
   * Get measurement by ID
   */
  getMeasurement(id) {
    return this.measurements.get(id);
  }

  /**
   * Get all measurements
   */
  getAllMeasurements() {
    return Array.from(this.measurements.values());
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const measurements = this.getAllMeasurements();
    const completedMeasurements = measurements.filter(m => m.duration !== undefined);
    
    if (completedMeasurements.length === 0) {
      return {
        totalMeasurements: 0,
        averageDuration: 0,
        fastCount: 0,
        acceptableCount: 0,
        slowCount: 0,
        categories: {}
      };
    }
    
    const durations = completedMeasurements.map(m => m.duration);
    const categories = completedMeasurements.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalMeasurements: completedMeasurements.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      fastCount: categories.fast || 0,
      acceptableCount: categories.acceptable || 0,
      slowCount: categories.slow || 0,
      categories,
      percentiles: this.calculatePercentiles(durations)
    };
  }

  /**
   * Calculate performance percentiles
   */
  calculatePercentiles(durations) {
    const sorted = [...durations].sort((a, b) => a - b);
    const length = sorted.length;
    
    return {
      p50: sorted[Math.floor(length * 0.5)],
      p75: sorted[Math.floor(length * 0.75)],
      p90: sorted[Math.floor(length * 0.9)],
      p95: sorted[Math.floor(length * 0.95)],
      p99: sorted[Math.floor(length * 0.99)]
    };
  }

  /**
   * Clear old measurements
   */
  clearOldMeasurements(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Date.now() - maxAge;
    
    for (const [id, measurement] of this.measurements.entries()) {
      if (measurement.startTimestamp < cutoff) {
        this.measurements.delete(id);
      }
    }
  }

  /**
   * Export measurements data
   */
  exportMeasurements() {
    return {
      measurements: Array.from(this.measurements.entries()),
      summary: this.getPerformanceSummary(),
      thresholds: this.thresholds,
      exportTime: new Date().toISOString()
    };
  }
}

/**
 * Web Vitals Monitor
 * Monitors Core Web Vitals and other performance metrics
 */
export class WebVitalsMonitor {
  constructor() {
    this.vitals = new Map();
    this.observers = new Map();
    this.thresholds = {
      LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
      FID: { good: 100, poor: 300 },   // First Input Delay
      CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
      FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
      TTFB: { good: 800, poor: 1800 }  // Time to First Byte
    };
    
    this.initializeObservers();
  }

  /**
   * Initialize performance observers
   */
  initializeObservers() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    this.observeLCP();
    
    // First Input Delay
    this.observeFID();
    
    // Cumulative Layout Shift
    this.observeCLS();
    
    // First Contentful Paint
    this.observeFCP();
    
    // Navigation timing
    this.observeNavigation();
  }

  /**
   * Observe Largest Contentful Paint
   */
  observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordVital('LCP', lastEntry.startTime, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
          size: lastEntry.size
        });
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('LCP', observer);
    } catch (error) {
      console.warn('LCP observer failed:', error);
    }
  }

  /**
   * Observe First Input Delay
   */
  observeFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordVital('FID', entry.processingStart - entry.startTime, {
            eventType: entry.name,
            target: entry.target?.tagName
          });
        });
      });
      
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.set('FID', observer);
    } catch (error) {
      console.warn('FID observer failed:', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordVital('CLS', clsValue, {
              sources: entry.sources?.map(source => ({
                element: source.node?.tagName,
                previousRect: source.previousRect,
                currentRect: source.currentRect
              }))
            });
          }
        });
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('CLS', observer);
    } catch (error) {
      console.warn('CLS observer failed:', error);
    }
  }

  /**
   * Observe First Contentful Paint
   */
  observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.recordVital('FCP', entry.startTime);
          }
        });
      });
      
      observer.observe({ type: 'paint', buffered: true });
      this.observers.set('FCP', observer);
    } catch (error) {
      console.warn('FCP observer failed:', error);
    }
  }

  /**
   * Observe navigation timing
   */
  observeNavigation() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordVital('TTFB', entry.responseStart - entry.requestStart, {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            domComplete: entry.domComplete - entry.domLoading,
            loadComplete: entry.loadEventEnd - entry.loadEventStart
          });
        });
      });
      
      observer.observe({ type: 'navigation', buffered: true });
      this.observers.set('Navigation', observer);
    } catch (error) {
      console.warn('Navigation observer failed:', error);
    }
  }

  /**
   * Record a vital metric
   */
  recordVital(name, value, metadata = {}) {
    const vital = {
      name,
      value,
      timestamp: Date.now(),
      rating: this.getRating(name, value),
      metadata: { ...metadata }
    };
    
    this.vitals.set(`${name}-${Date.now()}`, vital);
    
    // Trigger callback if registered
    if (this.onVital) {
      this.onVital(vital);
    }
  }

  /**
   * Get rating for a vital metric
   */
  getRating(name, value) {
    const threshold = this.thresholds[name];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get all vitals
   */
  getVitals() {
    return Array.from(this.vitals.values());
  }

  /**
   * Get vitals summary
   */
  getVitalsSummary() {
    const vitals = this.getVitals();
    const summary = {};
    
    // Group by vital name
    const grouped = vitals.reduce((acc, vital) => {
      if (!acc[vital.name]) acc[vital.name] = [];
      acc[vital.name].push(vital);
      return acc;
    }, {});
    
    // Calculate summary for each vital
    Object.entries(grouped).forEach(([name, values]) => {
      const latestValue = values[values.length - 1];
      const ratings = values.reduce((acc, v) => {
        acc[v.rating] = (acc[v.rating] || 0) + 1;
        return acc;
      }, {});
      
      summary[name] = {
        current: latestValue?.value,
        rating: latestValue?.rating,
        count: values.length,
        ratings,
        threshold: this.thresholds[name]
      };
    });
    
    return summary;
  }

  /**
   * Set callback for vital updates
   */
  onVitalUpdate(callback) {
    this.onVital = callback;
  }

  /**
   * Disconnect all observers
   */
  disconnect() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect observer:', error);
      }
    });
    this.observers.clear();
  }
}

// Create singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const webVitalsMonitor = new WebVitalsMonitor();

// Auto-cleanup old measurements every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.clearOldMeasurements();
  }, 60 * 60 * 1000); // 1 hour
}

/**
 * Debounce utility function
 * Delays function execution until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle utility function
 * Limits function execution to at most once per specified time period
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Search Cache Implementation
 * Provides caching for search results with TTL and size limits
 */
export class SearchCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generate cache key from search parameters
   */
  generateKey(params) {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  /**
   * Get cached result
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Update access time for LRU
    item.lastAccessed = Date.now();
    return item.data;
  }

  /**
   * Set cache item
   */
  set(key, data) {
    // Remove oldest items if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl,
      lastAccessed: Date.now()
    });
  }

  /**
   * Evict oldest accessed item
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear expired items
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitRate || 0
    };
  }
}

/**
 * Request Deduplicator
 * Prevents duplicate requests by caching pending promises
 */
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Execute request with deduplication
   */
  async execute(key, requestFn) {
    // Return existing promise if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request promise
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key);
      });

    // Store pending promise
    this.pendingRequests.set(key, promise);

    return promise;
  }

  /**
   * Cancel pending request
   */
  cancel(key) {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Get pending request count
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }
}

// Create singleton instances
export const searchCache = new SearchCache();
export const requestDeduplicator = new RequestDeduplicator();

// Auto-cleanup expired cache items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.clearExpired();
  }, 5 * 60 * 1000); // 5 minutes
}