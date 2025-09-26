/**
 * Performance Monitor Component
 * Task 20: Real-time performance monitoring and validation
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  WebVitalsTracker, 
  LazyLoadingTracker, 
  ConnectionAwareTracker,
  ImageOptimizationValidator,
  BundleSizeAnalyzer 
} from './performanceUtils';

const PerformanceMonitor = ({ 
  enableRealTimeMonitoring = true,
  showDetailedMetrics = false,
  onPerformanceUpdate = null 
}) => {
  const [metrics, setMetrics] = useState({
    webVitals: {},
    lazyLoading: {},
    connection: {},
    bundleAnalysis: {},
    realTime: {}
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(0);
  
  const trackersRef = useRef({});
  const intervalRef = useRef(null);

  useEffect(() => {
    if (enableRealTimeMonitoring) {
      initializeTrackers();
      startMonitoring();
    }

    return () => {
      stopMonitoring();
      cleanupTrackers();
    };
  }, [enableRealTimeMonitoring]);

  const initializeTrackers = () => {
    trackersRef.current = {
      webVitals: new WebVitalsTracker(),
      lazyLoading: new LazyLoadingTracker(),
      connection: new ConnectionAwareTracker(),
      imageOptimization: new ImageOptimizationValidator(),
      bundleAnalyzer: new BundleSizeAnalyzer()
    };
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Initial metrics collection
    collectMetrics();
    
    // Set up real-time monitoring
    if (enableRealTimeMonitoring) {
      intervalRef.current = setInterval(collectMetrics, 5000); // Every 5 seconds
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const cleanupTrackers = () => {
    Object.values(trackersRef.current).forEach(tracker => {
      if (tracker.disconnect) {
        tracker.disconnect();
      }
    });
  };

  const collectMetrics = async () => {
    try {
      const { webVitals, lazyLoading, connection, bundleAnalyzer } = trackersRef.current;
      
      // Collect Web Vitals
      const webVitalsData = {
        navigation: webVitals.getNavigationMetrics(),
        lcp: await webVitals.measureLCP().catch(() => null),
        cls: await webVitals.measureCLS().catch(() => null)
      };

      // Collect lazy loading stats
      const lazyLoadingData = lazyLoading.getStatistics();

      // Collect connection info
      const connectionData = {
        info: connection.getConnectionInfo(),
        strategy: connection.getPreloadStrategy(),
        preloadStats: connection.getPreloadStatistics()
      };

      // Collect bundle analysis
      const bundleData = bundleAnalyzer.analyzeLoadedResources();

      // Real-time performance metrics
      const realTimeData = {
        timestamp: Date.now(),
        memoryUsage: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null,
        resourceCount: performance.getEntriesByType('resource').length,
        navigationCount: performance.getEntriesByType('navigation').length
      };

      const newMetrics = {
        webVitals: webVitalsData,
        lazyLoading: lazyLoadingData,
        connection: connectionData,
        bundleAnalysis: bundleData,
        realTime: realTimeData
      };

      setMetrics(newMetrics);
      
      // Calculate performance score
      const score = calculatePerformanceScore(newMetrics);
      setPerformanceScore(score);

      // Notify parent component
      if (onPerformanceUpdate) {
        onPerformanceUpdate({ metrics: newMetrics, score });
      }

    } catch (error) {
      console.error('Performance monitoring error:', error);
    }
  };

  const calculatePerformanceScore = (metricsData) => {
    let score = 0;
    let factors = 0;

    // Web Vitals scoring (40%)
    if (metricsData.webVitals.navigation?.loadTime) {
      score += metricsData.webVitals.navigation.loadTime <= 2500 ? 15 : 0;
      factors += 15;
    }
    
    if (metricsData.webVitals.lcp) {
      score += metricsData.webVitals.lcp <= 2500 ? 15 : 0;
      factors += 15;
    }
    
    if (metricsData.webVitals.cls !== undefined) {
      score += metricsData.webVitals.cls <= 0.1 ? 10 : 0;
      factors += 10;
    }

    // Bundle size scoring (20%)
    if (metricsData.bundleAnalysis.isWithinBudget) {
      score += 20;
    }
    factors += 20;

    // Connection awareness (20%)
    if (metricsData.connection.strategy !== 'unknown') {
      score += 20;
    }
    factors += 20;

    // Lazy loading efficiency (20%)
    if (metricsData.lazyLoading.averageLoadTime < 1000) {
      score += 20;
    }
    factors += 20;

    return factors > 0 ? Math.round((score / factors) * 100) : 0;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 70) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="performance-monitor p-4 bg-white rounded-lg shadow-lg" data-testid="performance-monitor">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: isMonitoring ? '#22c55e' : '#ef4444' }}
            data-testid="monitoring-status"
          />
          <span className="text-sm text-gray-600">
            {isMonitoring ? 'Monitoring' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Performance Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Score</span>
          <span 
            className="text-2xl font-bold"
            style={{ color: getScoreColor(performanceScore) }}
            data-testid="performance-score"
          >
            {performanceScore}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${performanceScore}%`,
              backgroundColor: getScoreColor(performanceScore)
            }}
          />
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Load Time */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900" data-testid="load-time">
            {metrics.webVitals.navigation?.loadTime 
              ? formatTime(metrics.webVitals.navigation.loadTime)
              : '--'
            }
          </div>
          <div className="text-xs text-gray-600">Load Time</div>
        </div>

        {/* LCP */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900" data-testid="lcp-metric">
            {metrics.webVitals.lcp ? formatTime(metrics.webVitals.lcp) : '--'}
          </div>
          <div className="text-xs text-gray-600">LCP</div>
        </div>

        {/* Bundle Size */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900" data-testid="bundle-size">
            {metrics.bundleAnalysis.totalSize 
              ? formatBytes(metrics.bundleAnalysis.totalSize)
              : '--'
            }
          </div>
          <div className="text-xs text-gray-600">Bundle Size</div>
        </div>

        {/* Connection */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900" data-testid="connection-type">
            {metrics.connection.info?.effectiveType?.toUpperCase() || '--'}
          </div>
          <div className="text-xs text-gray-600">Connection</div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <div className="space-y-4">
          {/* Web Vitals Details */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Web Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>FCP: {metrics.webVitals.navigation?.firstContentfulPaint ? formatTime(metrics.webVitals.navigation.firstContentfulPaint) : '--'}</div>
              <div>CLS: {metrics.webVitals.cls !== undefined ? metrics.webVitals.cls.toFixed(3) : '--'}</div>
              <div>TTFB: {metrics.webVitals.navigation?.firstByte ? formatTime(metrics.webVitals.navigation.firstByte) : '--'}</div>
              <div>DCL: {metrics.webVitals.navigation?.domContentLoaded ? formatTime(metrics.webVitals.navigation.domContentLoaded) : '--'}</div>
            </div>
          </div>

          {/* Lazy Loading Stats */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Lazy Loading</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Images: {metrics.lazyLoading.totalImages || 0}</div>
              <div>Avg Load: {metrics.lazyLoading.averageLoadTime ? formatTime(metrics.lazyLoading.averageLoadTime) : '--'}</div>
              <div>Max Load: {metrics.lazyLoading.maxLoadTime ? formatTime(metrics.lazyLoading.maxLoadTime) : '--'}</div>
              <div>Min Load: {metrics.lazyLoading.minLoadTime ? formatTime(metrics.lazyLoading.minLoadTime) : '--'}</div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Connection</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Type: {metrics.connection.info?.effectiveType || '--'}</div>
              <div>Downlink: {metrics.connection.info?.downlink ? `${metrics.connection.info.downlink} Mbps` : '--'}</div>
              <div>RTT: {metrics.connection.info?.rtt ? `${metrics.connection.info.rtt}ms` : '--'}</div>
              <div>Save Data: {metrics.connection.info?.saveData ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Memory Usage */}
          {metrics.realTime.memoryUsage && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Memory Usage</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Used: {formatBytes(metrics.realTime.memoryUsage.used)}</div>
                <div>Total: {formatBytes(metrics.realTime.memoryUsage.total)}</div>
                <div>Limit: {formatBytes(metrics.realTime.memoryUsage.limit)}</div>
                <div>Usage: {((metrics.realTime.memoryUsage.used / metrics.realTime.memoryUsage.total) * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isMonitoring 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          data-testid="monitoring-toggle"
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        
        <button
          onClick={collectMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          data-testid="refresh-metrics"
        >
          Refresh Metrics
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitor;