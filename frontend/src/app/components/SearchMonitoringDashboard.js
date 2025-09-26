/**
 * Search Monitoring Dashboard Component
 * 
 * Provides a comprehensive dashboard for monitoring search system health,
 * performance metrics, error rates, and analytics insights.
 * 
 * Requirements: 6.5, 13.4, 13.5
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  searchAnalytics, 
  searchPerformanceMonitor, 
  searchErrorTracker,
  searchABTesting,
  SEARCH_EVENTS,
  PERFORMANCE_THRESHOLDS
} from '../../lib/search-analytics.js';
import './SearchMonitoringDashboard.css';

/**
 * Search Monitoring Dashboard Component
 */
export default function SearchMonitoringDashboard({ className = '' }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [abTestData, setAbTestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Load dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load analytics data
      const analytics = searchAnalytics.getAnalyticsSummary();
      setAnalyticsData(analytics);
      
      // Load performance data
      const performance = searchPerformanceMonitor.getPerformanceSummary();
      setPerformanceData(performance);
      
      // Load error data
      const errors = searchErrorTracker.getErrorSummary();
      setErrorData(errors);
      
      // Load A/B test data (if any tests are running)
      const abTests = Array.from(searchABTesting.tests.keys()).map(testId => 
        searchABTesting.getTestResults(testId)
      ).filter(Boolean);
      setAbTestData(abTests);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    loadDashboardData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadDashboardData, autoRefresh, refreshInterval]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Clear analytics data
   */
  const handleClearData = useCallback(() => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      searchAnalytics.clearData();
      loadDashboardData();
    }
  }, [loadDashboardData]);

  /**
   * Export analytics data
   */
  const handleExportData = useCallback(() => {
    const data = {
      analytics: analyticsData,
      performance: performanceData,
      errors: errorData,
      abTests: abTestData,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analyticsData, performanceData, errorData, abTestData]);

  if (isLoading && !analyticsData) {
    return (
      <div className={`search-monitoring-dashboard ${className}`}>
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`search-monitoring-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Search Monitoring Dashboard</h1>
          <p>Real-time analytics and performance monitoring for search functionality</p>
        </div>
        
        <div className="header-controls">
          <div className="refresh-controls">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleRefresh} className="btn-secondary">
              🔄 Refresh
            </button>
            <button onClick={handleExportData} className="btn-secondary">
              📊 Export
            </button>
            <button onClick={handleClearData} className="btn-danger">
              🗑️ Clear Data
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          ⚡ Performance
        </button>
        <button
          className={`tab ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          🚨 Errors
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        {abTestData && abTestData.length > 0 && (
          <button
            className={`tab ${activeTab === 'abtests' ? 'active' : ''}`}
            onClick={() => setActiveTab('abtests')}
          >
            🧪 A/B Tests
          </button>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            analyticsData={analyticsData}
            performanceData={performanceData}
            errorData={errorData}
          />
        )}
        
        {activeTab === 'performance' && (
          <PerformanceTab 
            performanceData={performanceData}
          />
        )}
        
        {activeTab === 'errors' && (
          <ErrorsTab 
            errorData={errorData}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            analyticsData={analyticsData}
          />
        )}
        
        {activeTab === 'abtests' && abTestData && (
          <ABTestsTab 
            abTestData={abTestData}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Overview Tab Component
 */
function OverviewTab({ analyticsData, performanceData, errorData }) {
  const getHealthStatus = () => {
    const issues = [];
    
    if (performanceData?.averageDuration > PERFORMANCE_THRESHOLDS.ACCEPTABLE_SEARCH) {
      issues.push('Slow search performance');
    }
    
    if (performanceData?.slowSearchRate > 10) {
      issues.push('High slow search rate');
    }
    
    if (errorData?.recentErrors > 5) {
      issues.push('Recent error spike');
    }
    
    if (analyticsData?.session?.successRate < 80) {
      issues.push('Low search success rate');
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'warning' : 'critical',
      issues
    };
  };

  const health = getHealthStatus();

  return (
    <div className="overview-tab">
      {/* System Health */}
      <div className="health-section">
        <h2>System Health</h2>
        <div className={`health-indicator ${health.status}`}>
          <div className="health-status">
            <span className="status-icon">
              {health.status === 'healthy' ? '✅' : health.status === 'warning' ? '⚠️' : '🚨'}
            </span>
            <span className="status-text">
              {health.status === 'healthy' ? 'All Systems Operational' : 
               health.status === 'warning' ? 'Minor Issues Detected' : 'Critical Issues'}
            </span>
          </div>
          
          {health.issues.length > 0 && (
            <div className="health-issues">
              <h4>Issues:</h4>
              <ul>
                {health.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Search Performance</h3>
          <div className="metric-value">
            {performanceData?.averageDuration?.toFixed(0) || 0}ms
          </div>
          <div className="metric-label">Average Response Time</div>
          <div className={`metric-trend ${
            (performanceData?.averageDuration || 0) < PERFORMANCE_THRESHOLDS.FAST_SEARCH ? 'good' :
            (performanceData?.averageDuration || 0) < PERFORMANCE_THRESHOLDS.ACCEPTABLE_SEARCH ? 'ok' : 'bad'
          }`}>
            Target: &lt;{PERFORMANCE_THRESHOLDS.ACCEPTABLE_SEARCH}ms
          </div>
        </div>

        <div className="metric-card">
          <h3>Search Success Rate</h3>
          <div className="metric-value">
            {analyticsData?.session?.successRate?.toFixed(1) || 0}%
          </div>
          <div className="metric-label">Successful Searches</div>
          <div className={`metric-trend ${
            (analyticsData?.session?.successRate || 0) > 90 ? 'good' :
            (analyticsData?.session?.successRate || 0) > 70 ? 'ok' : 'bad'
          }`}>
            Target: &gt;90%
          </div>
        </div>

        <div className="metric-card">
          <h3>Cache Hit Rate</h3>
          <div className="metric-value">
            {performanceData?.cacheHitRate?.toFixed(1) || 0}%
          </div>
          <div className="metric-label">Cache Efficiency</div>
          <div className={`metric-trend ${
            (performanceData?.cacheHitRate || 0) > 70 ? 'good' :
            (performanceData?.cacheHitRate || 0) > 50 ? 'ok' : 'bad'
          }`}>
            Target: &gt;70%
          </div>
        </div>

        <div className="metric-card">
          <h3>Error Rate</h3>
          <div className="metric-value">
            {errorData?.recentErrors || 0}
          </div>
          <div className="metric-label">Recent Errors</div>
          <div className={`metric-trend ${
            (errorData?.recentErrors || 0) === 0 ? 'good' :
            (errorData?.recentErrors || 0) < 5 ? 'ok' : 'bad'
          }`}>
            Target: 0 errors
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {analyticsData?.recentEvents?.slice(0, 10).map((event, index) => (
            <div key={index} className="activity-item">
              <span className="activity-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="activity-type">{event.type}</span>
              <span className="activity-details">
                {event.data.query && `Query: "${event.data.query}"`}
                {event.data.duration && ` (${event.data.duration}ms)`}
                {event.data.resultCount !== undefined && ` - ${event.data.resultCount} results`}
              </span>
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );
}

/**
 * Performance Tab Component
 */
function PerformanceTab({ performanceData }) {
  const recommendations = searchPerformanceMonitor.getOptimizationRecommendations();

  return (
    <div className="performance-tab">
      <div className="performance-summary">
        <h2>Performance Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Total Searches:</label>
            <span>{performanceData?.totalSearches || 0}</span>
          </div>
          <div className="summary-item">
            <label>Average Duration:</label>
            <span>{performanceData?.averageDuration?.toFixed(0) || 0}ms</span>
          </div>
          <div className="summary-item">
            <label>Min Duration:</label>
            <span>{performanceData?.minDuration?.toFixed(0) || 0}ms</span>
          </div>
          <div className="summary-item">
            <label>Max Duration:</label>
            <span>{performanceData?.maxDuration?.toFixed(0) || 0}ms</span>
          </div>
          <div className="summary-item">
            <label>Cache Hit Rate:</label>
            <span>{performanceData?.cacheHitRate?.toFixed(1) || 0}%</span>
          </div>
          <div className="summary-item">
            <label>Slow Searches:</label>
            <span>{performanceData?.slowSearches || 0} ({performanceData?.slowSearchRate?.toFixed(1) || 0}%)</span>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2>Optimization Recommendations</h2>
          <div className="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className={`recommendation ${rec.priority}`}>
                <div className="rec-header">
                  <h3>{rec.title}</h3>
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p>{rec.description}</p>
                <div className="rec-actions">
                  <h4>Suggested Actions:</h4>
                  <ul>
                    {rec.actions.map((action, actionIndex) => (
                      <li key={actionIndex}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {performanceData?.recommendations && performanceData.recommendations.length > 0 && (
        <div className="recent-recommendations">
          <h2>Recent Performance Issues</h2>
          <div className="issues-list">
            {performanceData.recommendations.map((rec, index) => (
              <div key={index} className={`issue ${rec.severity}`}>
                <div className="issue-time">
                  {new Date(rec.timestamp).toLocaleString()}
                </div>
                <div className="issue-message">{rec.message}</div>
                <div className="issue-suggestion">{rec.suggestion}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Errors Tab Component
 */
function ErrorsTab({ errorData }) {
  const errorTrends = searchErrorTracker.getErrorTrends();

  return (
    <div className="errors-tab">
      <div className="error-summary">
        <h2>Error Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Total Errors:</label>
            <span>{errorData?.totalErrors || 0}</span>
          </div>
          <div className="summary-item">
            <label>Recent Errors:</label>
            <span>{errorData?.recentErrors || 0}</span>
          </div>
          <div className="summary-item">
            <label>Last Hour:</label>
            <span>{errorTrends?.lastHour || 0}</span>
          </div>
          <div className="summary-item">
            <label>Last 24 Hours:</label>
            <span>{errorTrends?.lastDay || 0}</span>
          </div>
        </div>
      </div>

      {errorData?.errorTypes && Object.keys(errorData.errorTypes).length > 0 && (
        <div className="error-types">
          <h2>Error Types</h2>
          <div className="error-types-list">
            {Object.entries(errorData.errorTypes).map(([type, count]) => (
              <div key={type} className="error-type-item">
                <span className="error-type">{type}</span>
                <span className="error-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorData?.mostCommonErrors && errorData.mostCommonErrors.length > 0 && (
        <div className="common-errors">
          <h2>Most Common Errors</h2>
          <div className="common-errors-list">
            {errorData.mostCommonErrors.map((error, index) => (
              <div key={index} className="common-error-item">
                <div className="error-message">{error.error}</div>
                <div className="error-count">{error.count} occurrences</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Analytics Tab Component
 */
function AnalyticsTab({ analyticsData }) {
  return (
    <div className="analytics-tab">
      {analyticsData?.session && (
        <div className="session-info">
          <h2>Current Session</h2>
          <div className="session-grid">
            <div className="session-item">
              <label>Session ID:</label>
              <span>{analyticsData.session.id}</span>
            </div>
            <div className="session-item">
              <label>Duration:</label>
              <span>{Math.round(analyticsData.session.duration / 1000 / 60)} minutes</span>
            </div>
            <div className="session-item">
              <label>Total Searches:</label>
              <span>{analyticsData.session.searchCount}</span>
            </div>
            <div className="session-item">
              <label>Successful:</label>
              <span>{analyticsData.session.successfulSearches}</span>
            </div>
            <div className="session-item">
              <label>Failed:</label>
              <span>{analyticsData.session.failedSearches}</span>
            </div>
            <div className="session-item">
              <label>Success Rate:</label>
              <span>{analyticsData.session.successRate.toFixed(1)}%</span>
            </div>
            <div className="session-item">
              <label>Avg Search Time:</label>
              <span>{analyticsData.session.averageSearchTime.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      )}

      <div className="event-history">
        <h2>Recent Events ({analyticsData?.totalEvents || 0} total)</h2>
        <div className="events-list">
          {analyticsData?.recentEvents?.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
              <div className="event-type">{event.type}</div>
              <div className="event-data">
                {JSON.stringify(event.data, null, 2)}
              </div>
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );
}

/**
 * A/B Tests Tab Component
 */
function ABTestsTab({ abTestData }) {
  return (
    <div className="abtests-tab">
      <h2>A/B Tests</h2>
      <div className="tests-list">
        {abTestData.map((testResult, index) => (
          <div key={index} className="test-item">
            <div className="test-header">
              <h3>{testResult.test.name}</h3>
              <span className={`test-status ${testResult.test.active ? 'active' : 'inactive'}`}>
                {testResult.test.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p>{testResult.test.description}</p>
            
            <div className="test-metrics">
              <div className="metric">
                <label>Total Users:</label>
                <span>{testResult.results.totalUsers}</span>
              </div>
              <div className="metric">
                <label>Duration:</label>
                <span>{Math.round(testResult.results.duration / 1000 / 60 / 60)} hours</span>
              </div>
            </div>

            <div className="variants-comparison">
              <h4>Variants:</h4>
              <div className="variants-grid">
                {testResult.results.variants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="variant-card">
                    <h5>{variant.name}</h5>
                    <div className="variant-metrics">
                      <div>Users: {variant.users}</div>
                      <div>Events: {variant.events.length}</div>
                      {variant.metrics.conversion_rate && (
                        <div>Conversion: {variant.metrics.conversion_rate.toFixed(1)}%</div>
                      )}
                      {variant.metrics.search_success_rate && (
                        <div>Success Rate: {variant.metrics.search_success_rate.toFixed(1)}%</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}