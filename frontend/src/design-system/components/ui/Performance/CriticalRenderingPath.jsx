"use client";

import { useEffect, useState, useCallback } from 'react';

/**
 * Critical Rendering Path Optimization
 * 
 * Optimizes the critical rendering path for faster initial page loads
 * 
 * Features:
 * - Critical CSS inlining
 * - Non-critical resource deferring
 * - Progressive enhancement
 * - Resource prioritization
 * - Performance monitoring
 * 
 * Requirements: 12.5
 */

/**
 * Critical CSS Manager
 * Handles inlining critical CSS and deferring non-critical styles
 */
export const useCriticalCSS = () => {
  const [criticalLoaded, setCriticalLoaded] = useState(false);

  const inlineCriticalCSS = useCallback((css) => {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }, []);

  const loadNonCriticalCSS = useCallback((href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
    document.head.appendChild(link);
  }, []);

  const deferCSS = useCallback((href) => {
    // Load CSS after initial render
    requestIdleCallback(() => {
      loadNonCriticalCSS(href);
    });
  }, [loadNonCriticalCSS]);

  return {
    inlineCriticalCSS,
    loadNonCriticalCSS,
    deferCSS,
    criticalLoaded
  };
};

/**
 * Resource Priority Manager
 * Manages loading priority of different resources
 */
export const useResourcePriority = () => {
  const setResourcePriority = useCallback((element, priority) => {
    if ('fetchPriority' in element) {
      element.fetchPriority = priority;
    }
  }, []);

  const preloadCriticalResources = useCallback((resources) => {
    resources.forEach(({ href, as, type, priority = 'high' }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      
      if (type) link.type = type;
      setResourcePriority(link, priority);
      
      document.head.appendChild(link);
    });
  }, [setResourcePriority]);

  return {
    setResourcePriority,
    preloadCriticalResources
  };
};

/**
 * Progressive Enhancement Hook
 * Enables progressive loading of features
 */
export const useProgressiveEnhancement = () => {
  const [enhancementsLoaded, setEnhancementsLoaded] = useState({});

  const loadEnhancement = useCallback(async (name, loader) => {
    if (enhancementsLoaded[name]) return;

    try {
      await loader();
      setEnhancementsLoaded(prev => ({ ...prev, [name]: true }));
    } catch (error) {
      console.warn(`Failed to load enhancement: ${name}`, error);
    }
  }, [enhancementsLoaded]);

  const isEnhancementLoaded = useCallback((name) => {
    return enhancementsLoaded[name] || false;
  }, [enhancementsLoaded]);

  return {
    loadEnhancement,
    isEnhancementLoaded,
    enhancementsLoaded
  };
};

/**
 * Performance Metrics Hook
 * Monitors and reports performance metrics
 */
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({});

  const measurePerformance = useCallback((name, fn) => {
    const startTime = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        setMetrics(prev => ({
          ...prev,
          [name]: endTime - startTime
        }));
      });
    } else {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        [name]: endTime - startTime
      }));
      return result;
    }
  }, []);

  const recordMetric = useCallback((name, value) => {
    setMetrics(prev => ({ ...prev, [name]: value }));
  }, []);

  const getWebVitals = useCallback(() => {
    return new Promise((resolve) => {
      // Get Core Web Vitals
      const vitals = {};

      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }

      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
          lcpObserver.disconnect();
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Cumulative Layout Shift
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }

      // First Input Delay
      if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.fid = entry.processingStart - entry.startTime;
            fidObserver.disconnect();
            break;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      }

      // Return vitals after a short delay to collect data
      setTimeout(() => resolve(vitals), 1000);
    });
  }, []);

  return {
    metrics,
    measurePerformance,
    recordMetric,
    getWebVitals
  };
};

/**
 * Critical Path Optimizer Component
 * Orchestrates critical rendering path optimizations
 */
export const CriticalPathOptimizer = ({
  criticalCSS,
  nonCriticalCSS = [],
  criticalResources = [],
  children
}) => {
  const { inlineCriticalCSS, deferCSS } = useCriticalCSS();
  const { preloadCriticalResources } = useResourcePriority();
  const { recordMetric } = usePerformanceMetrics();

  useEffect(() => {
    const startTime = performance.now();

    // Inline critical CSS immediately
    if (criticalCSS) {
      inlineCriticalCSS(criticalCSS);
    }

    // Preload critical resources
    if (criticalResources.length > 0) {
      preloadCriticalResources(criticalResources);
    }

    // Defer non-critical CSS
    nonCriticalCSS.forEach(href => {
      deferCSS(href);
    });

    // Record optimization time
    const endTime = performance.now();
    recordMetric('criticalPathOptimization', endTime - startTime);
  }, [criticalCSS, nonCriticalCSS, criticalResources]);

  return <>{children}</>;
};

/**
 * Lazy Component Loader
 * Loads components only when needed
 */
export const LazyComponentLoader = ({
  loader,
  fallback = null,
  trigger = 'viewport', // 'viewport', 'interaction', 'idle'
  rootMargin = '50px'
}) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    try {
      const LoadedComponent = await loader();
      setComponent(() => LoadedComponent.default || LoadedComponent);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [Component, loading, loader]);

  useEffect(() => {
    if (trigger === 'idle') {
      requestIdleCallback(loadComponent);
    } else if (trigger === 'interaction') {
      // Load on first user interaction
      const handleInteraction = () => {
        loadComponent();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        document.removeEventListener('scroll', handleInteraction);
      };

      document.addEventListener('click', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
      document.addEventListener('scroll', handleInteraction);

      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        document.removeEventListener('scroll', handleInteraction);
      };
    }
  }, [trigger, loadComponent]);

  if (error) {
    return <div>Error loading component: {error.message}</div>;
  }

  if (loading) {
    return fallback;
  }

  if (Component) {
    return <Component />;
  }

  if (trigger === 'viewport') {
    return (
      <div
        ref={(el) => {
          if (el) {
            const observer = new IntersectionObserver(
              ([entry]) => {
                if (entry.isIntersecting) {
                  loadComponent();
                  observer.disconnect();
                }
              },
              { rootMargin }
            );
            observer.observe(el);
          }
        }}
      >
        {fallback}
      </div>
    );
  }

  return fallback;
};

/**
 * Performance Budget Monitor
 * Monitors and enforces performance budgets
 */
export const usePerformanceBudget = (budgets = {}) => {
  const [budgetStatus, setBudgetStatus] = useState({});

  const checkBudget = useCallback(async () => {
    const status = {};

    // Check bundle size budget
    if (budgets.bundleSize) {
      // This would typically be measured by your build process
      // For demo purposes, we'll simulate it
      status.bundleSize = {
        budget: budgets.bundleSize,
        actual: 245, // KB
        passed: 245 <= budgets.bundleSize
      };
    }

    // Check performance metrics budget
    if (budgets.lcp) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const lcp = navigation ? navigation.loadEventEnd : 0;
      
      status.lcp = {
        budget: budgets.lcp,
        actual: lcp,
        passed: lcp <= budgets.lcp
      };
    }

    setBudgetStatus(status);
  }, [budgets]);

  useEffect(() => {
    // Check budgets after page load
    if (document.readyState === 'complete') {
      checkBudget();
    } else {
      window.addEventListener('load', checkBudget);
      return () => window.removeEventListener('load', checkBudget);
    }
  }, [checkBudget]);

  return { budgetStatus, checkBudget };
};

export default {
  CriticalPathOptimizer,
  LazyComponentLoader,
  useCriticalCSS,
  useResourcePriority,
  useProgressiveEnhancement,
  usePerformanceMetrics,
  usePerformanceBudget
};