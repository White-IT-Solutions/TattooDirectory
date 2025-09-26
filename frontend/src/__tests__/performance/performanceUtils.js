/**
 * Performance Testing Utilities
 * Task 20: Performance optimization validation utilities
 */

/**
 * Measure Core Web Vitals
 */
export class WebVitalsTracker {
  constructor() {
    this.metrics = {};
    this.observers = [];
  }

  // Measure Largest Contentful Paint (LCP)
  measureLCP() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        resolve(lastEntry.startTime);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    });
  }

  // Measure First Input Delay (FID)
  measureFID() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.fid = fid;
          resolve(fid);
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    });
  }

  // Measure Cumulative Layout Shift (CLS)
  measureCLS() {
    return new Promise((resolve) => {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.metrics.cls = clsValue;
        resolve(clsValue);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    });
  }

  // Get navigation timing metrics
  getNavigationMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      return {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstByte: navigation.responseStart - navigation.fetchStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      };
    }
    
    return null;
  }

  // Get First Paint timing
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  // Get First Contentful Paint timing
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  // Validate performance against targets
  validatePerformanceTargets() {
    const navigation = this.getNavigationMetrics();
    
    const targets = {
      loadTime: 2500, // 2.5s
      domContentLoaded: 1800, // 1.8s
      firstByte: 300, // 300ms
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1 // 0.1
    };

    const results = {
      loadTime: navigation?.loadTime <= targets.loadTime,
      domContentLoaded: navigation?.domContentLoaded <= targets.domContentLoaded,
      firstByte: navigation?.firstByte <= targets.firstByte,
      lcp: this.metrics.lcp <= targets.lcp,
      fid: this.metrics.fid <= targets.fid,
      cls: this.metrics.cls <= targets.cls
    };

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    return {
      results,
      score: (passed / total) * 100,
      passed: passed === total
    };
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Lazy Loading Performance Tracker
 */
export class LazyLoadingTracker {
  constructor() {
    this.loadTimes = new Map();
    this.intersectionTimes = new Map();
  }

  // Track intersection observer performance
  trackIntersectionPerformance(element, callback) {
    const startTime = performance.now();
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const intersectionTime = performance.now() - startTime;
          this.intersectionTimes.set(element, intersectionTime);
          callback(entry);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before element enters viewport
    });

    observer.observe(element);
    return observer;
  }

  // Track image loading performance
  trackImageLoading(imageElement) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const handleLoad = () => {
        const loadTime = performance.now() - startTime;
        this.loadTimes.set(imageElement.src, loadTime);
        resolve(loadTime);
      };

      const handleError = () => {
        resolve(null);
      };

      if (imageElement.complete) {
        handleLoad();
      } else {
        imageElement.addEventListener('load', handleLoad, { once: true });
        imageElement.addEventListener('error', handleError, { once: true });
      }
    });
  }

  // Get average loading performance
  getAverageLoadTime() {
    const times = Array.from(this.loadTimes.values());
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  // Get performance statistics
  getStatistics() {
    const loadTimes = Array.from(this.loadTimes.values());
    const intersectionTimes = Array.from(this.intersectionTimes.values());

    return {
      totalImages: loadTimes.length,
      averageLoadTime: this.getAverageLoadTime(),
      maxLoadTime: Math.max(...loadTimes, 0),
      minLoadTime: Math.min(...loadTimes, Infinity),
      averageIntersectionTime: intersectionTimes.length > 0 
        ? intersectionTimes.reduce((a, b) => a + b, 0) / intersectionTimes.length 
        : 0
    };
  }
}

/**
 * Connection-Aware Performance Tracker
 */
export class ConnectionAwareTracker {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this.preloadStrategies = new Map();
  }

  // Get connection information
  getConnectionInfo() {
    if (!this.connection) {
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      };
    }

    return {
      effectiveType: this.connection.effectiveType,
      downlink: this.connection.downlink,
      rtt: this.connection.rtt,
      saveData: this.connection.saveData
    };
  }

  // Determine optimal preload strategy
  getPreloadStrategy() {
    const connection = this.getConnectionInfo();
    
    if (connection.saveData) {
      return 'minimal';
    }
    
    if (connection.effectiveType === '4g' && connection.downlink > 5) {
      return 'aggressive';
    }
    
    if (connection.effectiveType === '3g') {
      return 'moderate';
    }
    
    return 'conservative';
  }

  // Track preload effectiveness
  trackPreloadEffectiveness(url, strategy) {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'image';
      
      const handleLoad = () => {
        const loadTime = performance.now() - startTime;
        this.preloadStrategies.set(url, {
          strategy,
          loadTime,
          successful: true,
          connection: this.getConnectionInfo()
        });
        resolve({ loadTime, successful: true });
      };

      const handleError = () => {
        this.preloadStrategies.set(url, {
          strategy,
          loadTime: null,
          successful: false,
          connection: this.getConnectionInfo()
        });
        resolve({ loadTime: null, successful: false });
      };

      link.addEventListener('load', handleLoad, { once: true });
      link.addEventListener('error', handleError, { once: true });
      
      document.head.appendChild(link);
    });
  }

  // Get preload statistics by strategy
  getPreloadStatistics() {
    const stats = {};
    
    for (const [url, data] of this.preloadStrategies) {
      if (!stats[data.strategy]) {
        stats[data.strategy] = {
          total: 0,
          successful: 0,
          totalLoadTime: 0,
          averageLoadTime: 0
        };
      }
      
      stats[data.strategy].total++;
      
      if (data.successful) {
        stats[data.strategy].successful++;
        stats[data.strategy].totalLoadTime += data.loadTime;
      }
    }
    
    // Calculate averages
    Object.keys(stats).forEach(strategy => {
      const strategyStats = stats[strategy];
      strategyStats.successRate = (strategyStats.successful / strategyStats.total) * 100;
      strategyStats.averageLoadTime = strategyStats.successful > 0 
        ? strategyStats.totalLoadTime / strategyStats.successful 
        : 0;
    });
    
    return stats;
  }
}

/**
 * Image Optimization Validator
 */
export class ImageOptimizationValidator {
  constructor() {
    this.supportedFormats = this.detectSupportedFormats();
  }

  // Detect supported image formats
  detectSupportedFormats() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return {
      webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
      avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
      jpeg2000: canvas.toDataURL('image/jp2').indexOf('data:image/jp2') === 0
    };
  }

  // Get optimal image format
  getOptimalFormat(originalFormat = 'jpeg') {
    if (this.supportedFormats.avif) return 'avif';
    if (this.supportedFormats.webp) return 'webp';
    if (this.supportedFormats.jpeg2000) return 'jp2';
    return originalFormat;
  }

  // Generate responsive image URLs
  generateResponsiveUrls(baseUrl, sizes = [320, 640, 960, 1280, 1920]) {
    const format = this.getOptimalFormat();
    const extension = format === 'jpeg' ? 'jpg' : format;
    
    return sizes.map(size => ({
      url: baseUrl.replace(/\.(jpg|jpeg|png|webp)$/i, `_${size}w.${extension}`),
      width: size,
      descriptor: `${size}w`
    }));
  }

  // Validate image optimization
  async validateImageOptimization(imageUrl) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const loadTime = performance.now() - startTime;
      
      return {
        url: imageUrl,
        contentType,
        size: parseInt(contentLength) || 0,
        loadTime,
        isOptimized: contentType?.includes('webp') || contentType?.includes('avif'),
        isCompressed: parseInt(contentLength) < 100000 // Less than 100KB considered compressed
      };
    } catch (error) {
      return {
        url: imageUrl,
        error: error.message,
        loadTime: performance.now() - startTime
      };
    }
  }
}

/**
 * Bundle Size Analyzer
 */
export class BundleSizeAnalyzer {
  constructor() {
    this.resourceSizes = new Map();
  }

  // Analyze loaded resources
  analyzeLoadedResources() {
    const resources = performance.getEntriesByType('resource');
    let totalSize = 0;
    const breakdown = {
      scripts: 0,
      stylesheets: 0,
      images: 0,
      fonts: 0,
      other: 0
    };

    resources.forEach(resource => {
      const size = resource.transferSize || resource.encodedBodySize || 0;
      totalSize += size;
      
      if (resource.name.includes('.js')) {
        breakdown.scripts += size;
      } else if (resource.name.includes('.css')) {
        breakdown.stylesheets += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
        breakdown.images += size;
      } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
        breakdown.fonts += size;
      } else {
        breakdown.other += size;
      }
      
      this.resourceSizes.set(resource.name, size);
    });

    return {
      totalSize,
      breakdown,
      isWithinBudget: totalSize < 250000, // 250KB budget
      compressionRatio: this.calculateCompressionRatio(resources)
    };
  }

  // Calculate compression ratio
  calculateCompressionRatio(resources) {
    let totalTransferred = 0;
    let totalUncompressed = 0;
    
    resources.forEach(resource => {
      totalTransferred += resource.transferSize || 0;
      totalUncompressed += resource.decodedBodySize || resource.transferSize || 0;
    });
    
    return totalUncompressed > 0 ? (totalTransferred / totalUncompressed) : 1;
  }

  // Get largest resources
  getLargestResources(limit = 10) {
    return Array.from(this.resourceSizes.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, size]) => ({ name, size }));
  }
}

/**
 * Performance Test Runner
 */
export class PerformanceTestRunner {
  constructor() {
    this.webVitals = new WebVitalsTracker();
    this.lazyLoading = new LazyLoadingTracker();
    this.connection = new ConnectionAwareTracker();
    this.imageOptimization = new ImageOptimizationValidator();
    this.bundleAnalyzer = new BundleSizeAnalyzer();
  }

  // Run comprehensive performance test
  async runPerformanceTest() {
    const results = {
      timestamp: new Date().toISOString(),
      webVitals: {},
      navigation: {},
      lazyLoading: {},
      connection: {},
      bundleAnalysis: {},
      imageOptimization: {},
      overallScore: 0
    };

    try {
      // Web Vitals
      results.webVitals = {
        lcp: await this.webVitals.measureLCP(),
        cls: await this.webVitals.measureCLS(),
        navigation: this.webVitals.getNavigationMetrics()
      };

      // Connection info
      results.connection = {
        info: this.connection.getConnectionInfo(),
        strategy: this.connection.getPreloadStrategy()
      };

      // Bundle analysis
      results.bundleAnalysis = this.bundleAnalyzer.analyzeLoadedResources();

      // Lazy loading stats
      results.lazyLoading = this.lazyLoading.getStatistics();

      // Calculate overall score
      results.overallScore = this.calculateOverallScore(results);

      return results;
    } catch (error) {
      console.error('Performance test failed:', error);
      return { error: error.message, results };
    }
  }

  // Calculate overall performance score
  calculateOverallScore(results) {
    let score = 0;
    let factors = 0;

    // Web Vitals scoring (40% weight)
    if (results.webVitals.lcp <= 2500) score += 15;
    if (results.webVitals.cls <= 0.1) score += 15;
    if (results.webVitals.navigation?.loadTime <= 2500) score += 10;
    factors += 40;

    // Bundle size scoring (20% weight)
    if (results.bundleAnalysis.isWithinBudget) score += 20;
    factors += 20;

    // Connection awareness (20% weight)
    if (results.connection.strategy !== 'unknown') score += 20;
    factors += 20;

    // Lazy loading efficiency (20% weight)
    if (results.lazyLoading.averageLoadTime < 1000) score += 20;
    factors += 20;

    return Math.round((score / factors) * 100);
  }

  // Clean up
  cleanup() {
    this.webVitals.disconnect();
  }
}