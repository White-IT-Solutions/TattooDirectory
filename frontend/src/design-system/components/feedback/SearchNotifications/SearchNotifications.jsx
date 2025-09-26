"use client";

import { useEffect, useCallback, useState } from 'react';
import { useToast } from '../Toast/ToastProvider';

/**
 * SearchNotifications - Centralized notification system for search operations
 * 
 * Features:
 * - Toast notifications for all search actions
 * - Contextual notifications based on search state
 * - Success, error, warning, and info notifications
 * - Action buttons in notifications for quick recovery
 * - Integration with search feedback system
 */

// Notification templates for different search scenarios
const notificationTemplates = {
  searchStarted: {
    type: 'info',
    title: 'Search Started',
    message: 'Searching for results...',
    duration: 2000
  },
  searchCompleted: {
    type: 'success',
    title: 'Search Complete',
    duration: 3000
  },
  searchFailed: {
    type: 'error',
    title: 'Search Failed',
    message: 'Unable to complete search. Please try again.',
    duration: 5000
  },
  noResults: {
    type: 'warning',
    title: 'No Results Found',
    message: 'Try adjusting your search terms or filters.',
    duration: 4000
  },
  filterApplied: {
    type: 'info',
    title: 'Filter Applied',
    duration: 2000
  },
  filterCleared: {
    type: 'info',
    title: 'Filters Cleared',
    message: 'All search filters have been removed.',
    duration: 2000
  },
  savedSearch: {
    type: 'success',
    title: 'Search Saved',
    message: 'Your search has been saved for quick access.',
    duration: 3000
  },
  searchLoaded: {
    type: 'info',
    title: 'Search Loaded',
    message: 'Previous search has been restored.',
    duration: 2000
  },
  locationDetected: {
    type: 'success',
    title: 'Location Detected',
    duration: 3000
  },
  locationFailed: {
    type: 'warning',
    title: 'Location Access Denied',
    message: 'Please enter your location manually or enable location services.',
    duration: 5000
  },
  validationError: {
    type: 'error',
    title: 'Validation Error',
    duration: 4000
  },
  networkError: {
    type: 'error',
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
    duration: 5000
  },
  timeout: {
    type: 'warning',
    title: 'Search Timeout',
    message: 'The search is taking longer than expected. Please try again.',
    duration: 5000
  }
};

// Hook for search notifications
export function useSearchNotifications() {
  const [mounted, setMounted] = useState(false);
  
  // Check if component is mounted (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Always call useToast hook (required by React hooks rules)
  const { success, error, warning, info } = useToast();

  const showNotification = useCallback((type, customOptions = {}) => {
    const template = notificationTemplates[type];
    if (!template) {
      // Unknown notification type, return early
      return;
    }

    const options = {
      ...template,
      ...customOptions,
      message: customOptions.message || template.message
    };

    // Only show notifications if mounted (client-side)
    if (!mounted) return;

    switch (template.type) {
      case 'success':
        return success(options.message, {
          title: options.title,
          duration: options.duration,
          action: options.action
        });
      case 'error':
        return error(options.message, {
          title: options.title,
          duration: options.duration,
          action: options.action
        });
      case 'warning':
        return warning(options.message, {
          title: options.title,
          duration: options.duration,
          action: options.action
        });
      case 'info':
      default:
        return info(options.message, {
          title: options.title,
          duration: options.duration,
          action: options.action
        });
    }
  }, [success, error, warning, info, mounted]);

  // Specific notification methods
  const notifySearchStarted = useCallback((query) => {
    return showNotification('searchStarted', {
      message: `Searching for "${query}"...`
    });
  }, [showNotification]);

  const notifySearchCompleted = useCallback((resultCount, searchTime) => {
    const message = resultCount === 1 
      ? `Found 1 result in ${searchTime}ms`
      : `Found ${resultCount} results in ${searchTime}ms`;
    
    return showNotification('searchCompleted', { message });
  }, [showNotification]);

  const notifySearchFailed = useCallback((error, onRetry) => {
    const action = onRetry ? {
      label: 'Retry',
      onClick: onRetry
    } : undefined;

    return showNotification('searchFailed', {
      message: error?.message || 'Unable to complete search. Please try again.',
      action
    });
  }, [showNotification]);

  const notifyNoResults = useCallback((query, onClearFilters) => {
    const action = onClearFilters ? {
      label: 'Clear Filters',
      onClick: onClearFilters
    } : undefined;

    return showNotification('noResults', {
      message: `No results found for "${query}". Try adjusting your search terms or filters.`,
      action
    });
  }, [showNotification]);

  const notifyFilterApplied = useCallback((filterName, filterValue) => {
    return showNotification('filterApplied', {
      message: `${filterName}: ${filterValue}`
    });
  }, [showNotification]);

  const notifyFilterCleared = useCallback((filterCount) => {
    const message = filterCount === 1 
      ? 'Filter cleared'
      : `${filterCount} filters cleared`;
    
    return showNotification('filterCleared', { message });
  }, [showNotification]);

  const notifySavedSearch = useCallback((searchName) => {
    return showNotification('savedSearch', {
      message: `Search "${searchName}" has been saved for quick access.`
    });
  }, [showNotification]);

  const notifySearchLoaded = useCallback((searchName) => {
    return showNotification('searchLoaded', {
      message: `Loaded search: "${searchName}"`
    });
  }, [showNotification]);

  const notifyLocationDetected = useCallback((location) => {
    return showNotification('locationDetected', {
      message: `Location set to ${location}`
    });
  }, [showNotification]);

  const notifyLocationFailed = useCallback((onManualEntry) => {
    const action = onManualEntry ? {
      label: 'Enter Manually',
      onClick: onManualEntry
    } : undefined;

    return showNotification('locationFailed', { action });
  }, [showNotification]);

  const notifyValidationError = useCallback((field, message) => {
    return showNotification('validationError', {
      message: `${field}: ${message}`
    });
  }, [showNotification]);

  const notifyNetworkError = useCallback((onRetry) => {
    const action = onRetry ? {
      label: 'Retry',
      onClick: onRetry
    } : undefined;

    return showNotification('networkError', { action });
  }, [showNotification]);

  const notifyTimeout = useCallback((onRetry) => {
    const action = onRetry ? {
      label: 'Try Again',
      onClick: onRetry
    } : undefined;

    return showNotification('timeout', { action });
  }, [showNotification]);

  return {
    showNotification,
    notifySearchStarted,
    notifySearchCompleted,
    notifySearchFailed,
    notifyNoResults,
    notifyFilterApplied,
    notifyFilterCleared,
    notifySavedSearch,
    notifySearchLoaded,
    notifyLocationDetected,
    notifyLocationFailed,
    notifyValidationError,
    notifyNetworkError,
    notifyTimeout
  };
}

// Component that automatically handles search state notifications
export function SearchNotificationHandler({
  searchState,
  onRetry,
  onClearFilters,
  onManualLocationEntry,
  children
}) {
  const notifications = useSearchNotifications();

  // Handle search state changes
  useEffect(() => {
    if (!searchState) return;

    switch (searchState.status) {
      case 'searching':
        if (searchState.query) {
          notifications.notifySearchStarted(searchState.query);
        }
        break;

      case 'completed':
        if (searchState.results?.length > 0) {
          notifications.notifySearchCompleted(
            searchState.results.length,
            searchState.searchTime || 0
          );
        } else {
          notifications.notifyNoResults(searchState.query, onClearFilters);
        }
        break;

      case 'error':
        if (searchState.error?.type === 'network') {
          notifications.notifyNetworkError(onRetry);
        } else if (searchState.error?.type === 'timeout') {
          notifications.notifyTimeout(onRetry);
        } else {
          notifications.notifySearchFailed(searchState.error, onRetry);
        }
        break;

      case 'validation_error':
        if (searchState.validationError) {
          notifications.notifyValidationError(
            searchState.validationError.field,
            searchState.validationError.message
          );
        }
        break;
    }
  }, [searchState, notifications, onRetry, onClearFilters]);

  // Handle filter changes
  useEffect(() => {
    if (searchState?.filterChanges) {
      searchState.filterChanges.forEach(change => {
        if (change.action === 'applied') {
          notifications.notifyFilterApplied(change.name, change.value);
        } else if (change.action === 'cleared') {
          notifications.notifyFilterCleared(change.count || 1);
        }
      });
    }
  }, [searchState?.filterChanges, notifications]);

  // Handle location changes
  useEffect(() => {
    if (searchState?.location) {
      if (searchState.location.detected) {
        notifications.notifyLocationDetected(searchState.location.name);
      } else if (searchState.location.failed) {
        notifications.notifyLocationFailed(onManualLocationEntry);
      }
    }
  }, [searchState?.location, notifications, onManualLocationEntry]);

  // Handle saved searches
  useEffect(() => {
    if (searchState?.savedSearch) {
      notifications.notifySavedSearch(searchState.savedSearch.name);
    }
  }, [searchState?.savedSearch, notifications]);

  // Handle loaded searches
  useEffect(() => {
    if (searchState?.loadedSearch) {
      notifications.notifySearchLoaded(searchState.loadedSearch.name);
    }
  }, [searchState?.loadedSearch, notifications]);

  return children || null;
}

// Utility function to create search state objects
export function createSearchState(status, options = {}) {
  return {
    status,
    timestamp: Date.now(),
    ...options
  };
}

// Search state constants
export const SEARCH_STATES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  COMPLETED: 'completed',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error'
};

// Error types
export const ERROR_TYPES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  VALIDATION: 'validation',
  SERVER: 'server',
  UNKNOWN: 'unknown'
};

export default useSearchNotifications;