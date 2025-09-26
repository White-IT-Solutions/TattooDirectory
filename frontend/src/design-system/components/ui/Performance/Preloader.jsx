"use client";

import { useEffect, useRef, useCallback } from 'react';

/**
 * Preloader Component and Hooks
 * 
 * Implements intelligent preloading for likely user actions
 * 
 * Features:
 * - Link prefetching on hover
 * - Image preloading for likely views
 * - Route preloading based on user behavior
 * - Resource prioritization
 * - Bandwidth-aware preloading
 * 
 * Requirements: 12.4
 */

/**
 * Preload images that are likely to be viewed
 */
export const useImagePreloader = () => {
  const preloadedImages = useRef(new Set());

  const preloadImage = useCallback((src, priority = 'low') => {
    if (!src || preloadedImages.current.has(src)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    // Set fetch priority if supported
    if ('fetchPriority' in link) {
      link.fetchPriority = priority;
    }

    document.head.appendChild(link);
    preloadedImages.current.add(src);

    // Clean up after a reasonable time
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 30000); // 30 seconds
  }, []);

  const preloadImages = useCallback((urls, priority = 'low') => {
    urls.forEach(url => preloadImage(url, priority));
  }, [preloadImage]);

  return { preloadImage, preloadImages };
};

/**
 * Preload routes that user is likely to visit
 */
export const useRoutePreloader = () => {
  const preloadedRoutes = useRef(new Set());

  const preloadRoute = useCallback((href) => {
    if (!href || preloadedRoutes.current.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;

    document.head.appendChild(link);
    preloadedRoutes.current.add(href);

    // Clean up after a reasonable time
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 60000); // 1 minute
  }, []);

  return { preloadRoute };
};

/**
 * Smart Link component with hover preloading
 */
export const SmartLink = ({
  href,
  children,
  preloadOnHover = true,
  preloadDelay = 100,
  className,
  ...props
}) => {
  const { preloadRoute } = useRoutePreloader();
  const timeoutRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (!preloadOnHover || !href) return;

    timeoutRef.current = setTimeout(() => {
      preloadRoute(href);
    }, preloadDelay);
  }, [href, preloadOnHover, preloadDelay, preloadRoute]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </a>
  );
};

/**
 * Portfolio Image Preloader
 * Preloads images when user hovers over artist cards
 */
export const PortfolioPreloader = ({ artistId, portfolioImages = [] }) => {
  const { preloadImages } = useImagePreloader();

  const preloadPortfolio = useCallback(() => {
    if (portfolioImages.length === 0) return;

    // Preload first 3 images with high priority
    const priorityImages = portfolioImages.slice(0, 3).map(img => img.url);
    preloadImages(priorityImages, 'high');

    // Preload remaining images with low priority
    const remainingImages = portfolioImages.slice(3).map(img => img.url);
    preloadImages(remainingImages, 'low');
  }, [portfolioImages, preloadImages]);

  return { preloadPortfolio };
};

/**
 * Connection-aware preloading hook
 */
export const useConnectionAwarePreloading = () => {
  const getConnectionSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return connection.effectiveType;
    }
    return '4g'; // Default to fast connection
  }, []);

  const shouldPreload = useCallback((resourceType = 'image') => {
    const connectionSpeed = getConnectionSpeed();
    
    // Don't preload on slow connections
    if (connectionSpeed === 'slow-2g' || connectionSpeed === '2g') {
      return false;
    }

    // Limit preloading on 3G for large resources
    if (connectionSpeed === '3g' && resourceType === 'video') {
      return false;
    }

    return true;
  }, [getConnectionSpeed]);

  return { shouldPreload, getConnectionSpeed };
};

/**
 * Viewport-based preloading
 * Preloads content that's about to come into view
 */
export const useViewportPreloader = ({
  onPreload,
  rootMargin = '200px',
  threshold = 0.1
}) => {
  const observerRef = useRef(null);
  const preloadedElements = useRef(new Set());

  const observe = useCallback((element) => {
    if (!element || preloadedElements.current.has(element)) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !preloadedElements.current.has(entry.target)) {
              preloadedElements.current.add(entry.target);
              onPreload?.(entry.target);
            }
          });
        },
        { rootMargin, threshold }
      );
    }

    observerRef.current.observe(element);
  }, [onPreload, rootMargin, threshold]);

  const unobserve = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
    }
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { observe, unobserve };
};

/**
 * Critical Resource Preloader
 * Preloads critical resources for faster page loads
 */
export const CriticalResourcePreloader = ({ resources = [] }) => {
  useEffect(() => {
    resources.forEach(({ href, as, type, crossorigin }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      
      if (type) link.type = type;
      if (crossorigin) link.crossOrigin = crossorigin;

      document.head.appendChild(link);
    });

    // Cleanup function
    return () => {
      resources.forEach(({ href }) => {
        const existingLink = document.querySelector(`link[rel="preload"][href="${href}"]`);
        if (existingLink) {
          document.head.removeChild(existingLink);
        }
      });
    };
  }, [resources]);

  return null;
};

/**
 * Predictive Preloader
 * Uses user behavior patterns to predict and preload likely next actions
 */
export const usePredictivePreloader = () => {
  const userActions = useRef([]);
  const { preloadRoute } = useRoutePreloader();
  const { preloadImages } = useImagePreloader();

  const recordAction = useCallback((action) => {
    userActions.current.push({
      ...action,
      timestamp: Date.now()
    });

    // Keep only recent actions (last 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    userActions.current = userActions.current.filter(
      action => action.timestamp > tenMinutesAgo
    );
  }, []);

  const predictNextAction = useCallback(() => {
    const recentActions = userActions.current.slice(-5); // Last 5 actions
    
    // Simple pattern detection
    const patterns = recentActions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {});

    // Return most common action type
    return Object.entries(patterns).reduce((a, b) => 
      patterns[a[0]] > patterns[b[0]] ? a : b
    )?.[0];
  }, []);

  const preloadPredictedContent = useCallback(() => {
    const predictedAction = predictNextAction();
    
    switch (predictedAction) {
      case 'view_artist':
        // Preload artist detail page resources
        preloadRoute('/artists/[id]');
        break;
      case 'view_portfolio':
        // Preload common portfolio images
        break;
      case 'search':
        // Preload search page resources
        preloadRoute('/search');
        break;
      default:
        break;
    }
  }, [predictNextAction, preloadRoute]);

  return {
    recordAction,
    predictNextAction,
    preloadPredictedContent
  };
};

export default {
  SmartLink,
  PortfolioPreloader,
  CriticalResourcePreloader,
  useImagePreloader,
  useRoutePreloader,
  useConnectionAwarePreloading,
  useViewportPreloader,
  usePredictivePreloader
};