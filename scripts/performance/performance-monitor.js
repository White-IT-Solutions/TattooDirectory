#!/usr/bin/env node

/**
 * Performance Monitor for Frontend Sync Processor
 * 
 * Provides continuous performance monitoring capabilities for the enhanced
 * frontend-sync-processor, including real-time metrics collection, alerting,
 * and performance trend analysis.
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

/**
 * Performance metrics collector
 */
class PerformanceMetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      sampleInterval: options.sampleInterval || 1000, // 1 second
      maxSamples: options.maxSamples || 1000,
      alertThresholds: {
        memoryUsage: options.memoryThreshold || 256 * 1024 * 1024, // 256MB
        executionTime: options.executionThreshold || 5000, // 5 seconds
        errorRate: options.errorRateThreshold || 0.1 // 10%
      },
      ...options
    };
    
    this.metrics = {
      samples: [],
      operations: [],
      errors: [],
      alerts: []
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }
  
  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.warn('⚠️  Performance monitoring is already running');
      return;
    }
    
    console.log('📊 Starting performance monitoring...');
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.options.sampleInterval);
    
    this.emit('monitoring-started');
  }
  
  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.warn('⚠️  Performance monitoring is not running');
      return;
    }
    
    console.log('🛑 Stopping performance monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.emit('monitoring-stopped');
    return this.getMetricsSummary();
  }
  
  /**
   * Collect current performance metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const sample = {
      timestamp,
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    };
    
    this.metrics.samples.push(sample);
    
    // Limit sample history
    if (this.metrics.samples.length > this.options.maxSamples) {
      this.metrics.samples.shift();
    }
    
    // Check for alerts
    this.checkAlerts(sample);
    
    this.emit('metrics-collected', sample);
  }
  
  /**
   * Record operation performance
   */
  recordOperation(operationName, duration, success = true, metadata = {}) {
    const operation = {
      timestamp: Date.now(),
      name: operationName,
      duration,
      success,
      metadata
    };
    
    this.metrics.operations.push(operation);
    
    // Limit operation history
    if (this.metrics.operations.length > this.options.maxSamples) {
      this.metrics.operations.shift();
    }
    
    // Check for performance alerts
    if (duration > this.options.alertThresholds.executionTime) {
      this.recordAlert('slow-operation', `Operation ${operationName} took ${duration}ms`, {
        operation: operationName,
        duration,
        threshold: this.options.alertThresholds.executionTime
      });
    }
    
    this.emit('operation-recorded', operation);
  }
  
  /**
   * Record error
   */
  recordError(error, context = {}) {
    const errorRecord = {
      timestamp: Date.now(),
      message: error.message || error,
      stack: error.stack,
      context
    };
    
    this.metrics.errors.push(errorRecord);
    
    // Limit error history
    if (this.metrics.errors.length > this.options.maxSamples) {
      this.metrics.errors.shift();
    }
    
    // Check error rate
    this.checkErrorRate();
    
    this.emit('error-recorded', errorRecord);
  }
  
  /**
   * Check for performance alerts
   */
  checkAlerts(sample) {
    // Memory usage alert
    if (sample.memory.heapUsed > this.options.alertThresholds.memoryUsage) {
      this.recordAlert('high-memory-usage', 
        `Memory usage exceeded threshold: ${(sample.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`, {
          currentUsage: sample.memory.heapUsed,
          threshold: this.options.alertThresholds.memoryUsage
        });
    }
  }
  
  /**
   * Check error rate
   */
  checkErrorRate() {
    const recentOperations = this.metrics.operations.filter(op => 
      Date.now() - op.timestamp < 60000 // Last minute
    );
    
    const recentErrors = this.metrics.errors.filter(err => 
      Date.now() - err.timestamp < 60000 // Last minute
    );
    
    if (recentOperations.length > 0) {
      const errorRate = recentErrors.length / recentOperations.length;
      
      if (errorRate > this.options.alertThresholds.errorRate) {
        this.recordAlert('high-error-rate', 
          `Error rate exceeded threshold: ${(errorRate * 100).toFixed(1)}%`, {
            errorRate,
            threshold: this.options.alertThresholds.errorRate,
            recentOperations: recentOperations.length,
            recentErrors: recentErrors.length
          });
      }
    }
  }
  
  /**
   * Record alert
   */
  recordAlert(type, message, metadata = {}) {
    const alert = {
      timestamp: Date.now(),
      type,
      message,
      metadata
    };
    
    this.metrics.alerts.push(alert);
    
    // Limit alert history
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts.shift();
    }
    
    console.warn(`🚨 ALERT [${type}]: ${message}`);
    this.emit('alert-triggered', alert);
  }
  
  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;
    
    // Recent samples
    const recentSamples = this.metrics.samples.filter(s => s.timestamp > oneMinuteAgo);
    const recentOperations = this.metrics.operations.filter(op => op.timestamp > fiveMinutesAgo);
    const recentErrors = this.metrics.errors.filter(err => err.timestamp > fiveMinutesAgo);
    const recentAlerts = this.metrics.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
    
    // Calculate averages
    const avgMemoryUsage = recentSamples.length > 0 ? 
      recentSamples.reduce((sum, s) => sum + s.memory.heapUsed, 0) / recentSamples.length : 0;
    
    const avgOperationTime = recentOperations.length > 0 ?
      recentOperations.reduce((sum, op) => sum + op.duration, 0) / recentOperations.length : 0;
    
    const successfulOperations = recentOperations.filter(op => op.success).length;
    const successRate = recentOperations.length > 0 ? 
      successfulOperations / recentOperations.length : 1;
    
    return {
      timestamp: now,
      monitoring: {
        isActive: this.isMonitoring,
        sampleInterval: this.options.sampleInterval,
        totalSamples: this.metrics.samples.length
      },
      memory: {
        current: recentSamples.length > 0 ? recentSamples[recentSamples.length - 1].memory.heapUsed : 0,
        average: avgMemoryUsage,
        peak: recentSamples.length > 0 ? Math.max(...recentSamples.map(s => s.memory.heapUsed)) : 0
      },
      operations: {
        total: recentOperations.length,
        successful: successfulOperations,
        failed: recentOperations.length - successfulOperations,
        successRate: successRate,
        averageTime: avgOperationTime
      },
      errors: {
        total: recentErrors.length,
        rate: recentOperations.length > 0 ? recentErrors.length / recentOperations.length : 0
      },
      alerts: {
        total: recentAlerts.length,
        types: recentAlerts.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }
  
  /**
   * Export metrics to file
   */
  exportMetrics(filePath) {
    const exportData = {
      timestamp: Date.now(),
      summary: this.getMetricsSummary(),
      samples: this.metrics.samples,
      operations: this.metrics.operations,
      errors: this.metrics.errors,
      alerts: this.metrics.alerts
    };
    
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    console.log(`📁 Metrics exported to: ${filePath}`);
  }
}

/**
 * Performance trend analyzer
 */
class PerformanceTrendAnalyzer {
  constructor() {
    this.historicalData = [];
  }
  
  /**
   * Load historical performance data
   */
  loadHistoricalData(dataPath) {
    try {
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        this.historicalData = Array.isArray(data) ? data : [data];
        console.log(`📈 Loaded ${this.historicalData.length} historical data points`);
      }
    } catch (error) {
      console.warn('⚠️  Could not load historical data:', error.message);
    }
  }
  
  /**
   * Add current metrics to historical data
   */
  addMetrics(metrics) {
    this.historicalData.push({
      timestamp: Date.now(),
      metrics
    });
    
    // Limit historical data (keep last 100 entries)
    if (this.historicalData.length > 100) {
      this.historicalData.shift();
    }
  }
  
  /**
   * Analyze performance trends
   */
  analyzeTrends() {
    if (this.historicalData.length < 2) {
      return {
        status: 'insufficient-data',
        message: 'Need at least 2 data points for trend analysis'
      };
    }
    
    const recent = this.historicalData.slice(-10); // Last 10 data points
    const older = this.historicalData.slice(-20, -10); // Previous 10 data points
    
    if (older.length === 0) {
      return {
        status: 'insufficient-data',
        message: 'Need more historical data for comparison'
      };
    }
    
    // Calculate averages
    const recentAvg = this.calculateAverages(recent);
    const olderAvg = this.calculateAverages(older);
    
    // Calculate trends
    const trends = {
      memory: this.calculateTrend(olderAvg.memory, recentAvg.memory),
      operationTime: this.calculateTrend(olderAvg.operationTime, recentAvg.operationTime),
      errorRate: this.calculateTrend(olderAvg.errorRate, recentAvg.errorRate),
      successRate: this.calculateTrend(olderAvg.successRate, recentAvg.successRate)
    };
    
    return {
      status: 'success',
      trends,
      recent: recentAvg,
      older: olderAvg,
      analysis: this.generateTrendAnalysis(trends)
    };
  }
  
  /**
   * Calculate averages for a dataset
   */
  calculateAverages(dataPoints) {
    const validPoints = dataPoints.filter(dp => dp.metrics);
    
    if (validPoints.length === 0) {
      return { memory: 0, operationTime: 0, errorRate: 0, successRate: 1 };
    }
    
    const totals = validPoints.reduce((acc, dp) => {
      acc.memory += dp.metrics.memory.average || 0;
      acc.operationTime += dp.metrics.operations.averageTime || 0;
      acc.errorRate += dp.metrics.errors.rate || 0;
      acc.successRate += dp.metrics.operations.successRate || 1;
      return acc;
    }, { memory: 0, operationTime: 0, errorRate: 0, successRate: 0 });
    
    return {
      memory: totals.memory / validPoints.length,
      operationTime: totals.operationTime / validPoints.length,
      errorRate: totals.errorRate / validPoints.length,
      successRate: totals.successRate / validPoints.length
    };
  }
  
  /**
   * Calculate trend direction and magnitude
   */
  calculateTrend(oldValue, newValue) {
    if (oldValue === 0) return { direction: 'stable', change: 0, percentage: 0 };
    
    const change = newValue - oldValue;
    const percentage = (change / oldValue) * 100;
    
    let direction = 'stable';
    if (Math.abs(percentage) > 5) {
      direction = percentage > 0 ? 'increasing' : 'decreasing';
    }
    
    return {
      direction,
      change,
      percentage: Math.abs(percentage),
      oldValue,
      newValue
    };
  }
  
  /**
   * Generate trend analysis
   */
  generateTrendAnalysis(trends) {
    const analysis = [];
    
    // Memory trend
    if (trends.memory.direction === 'increasing' && trends.memory.percentage > 10) {
      analysis.push(`Memory usage is increasing by ${trends.memory.percentage.toFixed(1)}% - consider optimization`);
    } else if (trends.memory.direction === 'decreasing') {
      analysis.push(`Memory usage is improving by ${trends.memory.percentage.toFixed(1)}%`);
    }
    
    // Operation time trend
    if (trends.operationTime.direction === 'increasing' && trends.operationTime.percentage > 10) {
      analysis.push(`Operation time is increasing by ${trends.operationTime.percentage.toFixed(1)}% - performance regression detected`);
    } else if (trends.operationTime.direction === 'decreasing') {
      analysis.push(`Operation time is improving by ${trends.operationTime.percentage.toFixed(1)}%`);
    }
    
    // Error rate trend
    if (trends.errorRate.direction === 'increasing') {
      analysis.push(`Error rate is increasing by ${trends.errorRate.percentage.toFixed(1)}% - stability issues detected`);
    } else if (trends.errorRate.direction === 'decreasing') {
      analysis.push(`Error rate is improving by ${trends.errorRate.percentage.toFixed(1)}%`);
    }
    
    // Success rate trend
    if (trends.successRate.direction === 'decreasing') {
      analysis.push(`Success rate is decreasing by ${trends.successRate.percentage.toFixed(1)}% - reliability issues detected`);
    } else if (trends.successRate.direction === 'increasing') {
      analysis.push(`Success rate is improving by ${trends.successRate.percentage.toFixed(1)}%`);
    }
    
    if (analysis.length === 0) {
      analysis.push('Performance metrics are stable with no significant trends detected');
    }
    
    return analysis;
  }
  
  /**
   * Save historical data
   */
  saveHistoricalData(filePath) {
    fs.writeFileSync(filePath, JSON.stringify(this.historicalData, null, 2));
    console.log(`💾 Historical data saved to: ${filePath}`);
  }
}

/**
 * Performance monitoring wrapper for frontend-sync-processor
 */
class FrontendSyncPerformanceMonitor {
  constructor(processor, options = {}) {
    this.processor = processor;
    this.metricsCollector = new PerformanceMetricsCollector(options);
    this.trendAnalyzer = new PerformanceTrendAnalyzer();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Monitor processor operations
    const originalGenerateMockData = this.processor.generateMockData.bind(this.processor);
    
    this.processor.generateMockData = async (options = {}) => {
      const operationName = `generateMockData-${options.artistCount || 'default'}`;
      const startTime = Date.now();
      
      try {
        const result = await originalGenerateMockData(options);
        const duration = Date.now() - startTime;
        
        this.metricsCollector.recordOperation(operationName, duration, result.success, {
          artistCount: options.artistCount,
          scenario: options.scenario,
          includeBusinessData: options.includeBusinessData
        });
        
        return result;
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.metricsCollector.recordOperation(operationName, duration, false, {
          artistCount: options.artistCount,
          error: error.message
        });
        
        this.metricsCollector.recordError(error, {
          operation: operationName,
          options
        });
        
        throw error;
      }
    };
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    this.metricsCollector.startMonitoring();
  }
  
  /**
   * Stop monitoring and generate report
   */
  stopMonitoring() {
    const summary = this.metricsCollector.stopMonitoring();
    
    // Add to trend analysis
    this.trendAnalyzer.addMetrics(summary);
    
    return summary;
  }
  
  /**
   * Generate performance report
   */
  generateReport() {
    const summary = this.metricsCollector.getMetricsSummary();
    const trends = this.trendAnalyzer.analyzeTrends();
    
    return {
      timestamp: Date.now(),
      summary,
      trends,
      recommendations: this.generateRecommendations(summary, trends)
    };
  }
  
  /**
   * Generate performance recommendations
   */
  generateRecommendations(summary, trends) {
    const recommendations = [];
    
    // Memory recommendations
    if (summary.memory.peak > 256 * 1024 * 1024) {
      recommendations.push('Consider implementing memory optimization for large datasets');
    }
    
    // Performance recommendations
    if (summary.operations.averageTime > 3000) {
      recommendations.push('Operation time is high - consider performance optimization');
    }
    
    // Error rate recommendations
    if (summary.errors.rate > 0.05) {
      recommendations.push('Error rate is elevated - investigate error causes');
    }
    
    // Trend-based recommendations
    if (trends.status === 'success') {
      if (trends.trends.memory.direction === 'increasing') {
        recommendations.push('Memory usage trend is increasing - monitor for memory leaks');
      }
      
      if (trends.trends.operationTime.direction === 'increasing') {
        recommendations.push('Performance trend is degrading - investigate recent changes');
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are within acceptable ranges');
    }
    
    return recommendations;
  }
}

// Export classes
module.exports = {
  PerformanceMetricsCollector,
  PerformanceTrendAnalyzer,
  FrontendSyncPerformanceMonitor
};

// CLI interface
if (require.main === module) {
  console.log('Performance Monitor for Frontend Sync Processor');
  console.log('This module provides performance monitoring capabilities.');
  console.log('Use it programmatically or integrate with other scripts.');
}