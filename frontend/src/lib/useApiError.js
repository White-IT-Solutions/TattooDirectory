/**
 * React hook for handling API errors with RFC 9457 support
 * 
 * This hook provides utilities for handling API errors in React components,
 * including user-friendly error messages and error state management.
 */

import { useState, useCallback } from 'react';
import { ApiError, getUserFriendlyErrorMessage, logApiError } from './errors.js';

/**
 * Custom hook for API error handling
 * @param {Object} options - Hook options
 * @param {boolean} options.logErrors - Whether to log errors (default: true)
 * @param {Function} options.onError - Custom error handler
 * @returns {Object} - Error handling utilities
 */
export function useApiError(options = {}) {
  const { logErrors = true, onError } = options;
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle an API error
   * @param {Error|ApiError} error - The error to handle
   * @param {Object} context - Additional context for logging
   */
  const handleError = useCallback((error, context = {}) => {
    let apiError;

    // Convert regular errors to ApiError if needed
    if (error instanceof ApiError) {
      apiError = error;
    } else {
      apiError = new ApiError({
        type: 'https://api.tattoodirectory.com/docs/errors#unknown',
        title: 'Unknown Error',
        status: 500,
        detail: error.message || 'An unknown error occurred',
        instance: null
      });
    }

    // Log the error if enabled
    if (logErrors) {
      logApiError(apiError, context);
    }

    // Set error state
    setError(apiError);
    setIsLoading(false);

    // Call custom error handler if provided
    if (onError) {
      onError(apiError, context);
    }
  }, [logErrors, onError]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Execute an async API call with error handling
   * @param {Function} apiCall - The API call function
   * @param {Object} context - Additional context for error logging
   * @returns {Promise} - The API call result
   */
  const executeApiCall = useCallback(async (apiCall, context = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiCall();
      setIsLoading(false);
      return result;
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so calling code can handle it if needed
    }
  }, [handleError]);

  /**
   * Get user-friendly error message
   */
  const errorMessage = error ? getUserFriendlyErrorMessage(error) : null;

  /**
   * Check if the current error is retryable
   */
  const isRetryable = error ? error.status >= 500 || error.status === 408 || error.status === 429 : false;

  return {
    error,
    errorMessage,
    isLoading,
    isRetryable,
    handleError,
    clearError,
    executeApiCall
  };
}

/**
 * Hook for handling specific API operations with built-in error handling
 * @param {Function} apiFunction - The API function to wrap
 * @param {Object} options - Hook options
 * @returns {Object} - API operation utilities
 */
export function useApiOperation(apiFunction, options = {}) {
  const { logErrors = true, onError, onSuccess } = options;
  
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Execute the API operation
   * @param {...any} args - Arguments to pass to the API function
   * @returns {Promise} - The operation result
   */
  const execute = useCallback(async (...args) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      setData(result);
      setIsLoading(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      let apiError;

      if (err instanceof ApiError) {
        apiError = err;
      } else {
        apiError = new ApiError({
          type: 'https://api.tattoodirectory.com/docs/errors#unknown',
          title: 'Unknown Error',
          status: 500,
          detail: err.message || 'An unknown error occurred',
          instance: null
        });
      }

      if (logErrors) {
        logApiError(apiError, { operation: apiFunction.name, args });
      }

      setError(apiError);
      setIsLoading(false);

      if (onError) {
        onError(apiError);
      }

      throw apiError;
    }
  }, [apiFunction, logErrors, onError, onSuccess]);

  /**
   * Reset the operation state
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Get user-friendly error message
   */
  const errorMessage = error ? getUserFriendlyErrorMessage(error) : null;

  /**
   * Check if the current error is retryable
   */
  const isRetryable = error ? error.status >= 500 || error.status === 408 || error.status === 429 : false;

  return {
    data,
    error,
    errorMessage,
    isLoading,
    isRetryable,
    execute,
    reset
  };
}

/**
 * Hook for managing multiple API operations
 * @param {Object} operations - Object with operation names as keys and API functions as values
 * @param {Object} options - Hook options
 * @returns {Object} - Multiple operation utilities
 */
export function useApiOperations(operations, options = {}) {
  const [states, setStates] = useState(() => {
    const initialStates = {};
    Object.keys(operations).forEach(key => {
      initialStates[key] = {
        data: null,
        error: null,
        isLoading: false
      };
    });
    return initialStates;
  });

  const updateState = useCallback((operationName, updates) => {
    setStates(prev => ({
      ...prev,
      [operationName]: {
        ...prev[operationName],
        ...updates
      }
    }));
  }, []);

  const executeOperation = useCallback(async (operationName, ...args) => {
    const apiFunction = operations[operationName];
    if (!apiFunction) {
      throw new Error(`Operation '${operationName}' not found`);
    }

    try {
      updateState(operationName, { isLoading: true, error: null });
      
      const result = await apiFunction(...args);
      updateState(operationName, { 
        data: result, 
        isLoading: false, 
        error: null 
      });
      
      return result;
    } catch (err) {
      let apiError;

      if (err instanceof ApiError) {
        apiError = err;
      } else {
        apiError = new ApiError({
          type: 'https://api.tattoodirectory.com/docs/errors#unknown',
          title: 'Unknown Error',
          status: 500,
          detail: err.message || 'An unknown error occurred',
          instance: null
        });
      }

      if (options.logErrors !== false) {
        logApiError(apiError, { operation: operationName, args });
      }

      updateState(operationName, { 
        error: apiError, 
        isLoading: false 
      });

      throw apiError;
    }
  }, [operations, updateState, options.logErrors]);

  const resetOperation = useCallback((operationName) => {
    updateState(operationName, {
      data: null,
      error: null,
      isLoading: false
    });
  }, [updateState]);

  const resetAll = useCallback(() => {
    const resetStates = {};
    Object.keys(operations).forEach(key => {
      resetStates[key] = {
        data: null,
        error: null,
        isLoading: false
      };
    });
    setStates(resetStates);
  }, [operations]);

  // Create convenience methods for each operation
  const operationMethods = {};
  Object.keys(operations).forEach(operationName => {
    operationMethods[operationName] = {
      ...states[operationName],
      execute: (...args) => executeOperation(operationName, ...args),
      reset: () => resetOperation(operationName),
      errorMessage: states[operationName].error 
        ? getUserFriendlyErrorMessage(states[operationName].error) 
        : null,
      isRetryable: states[operationName].error 
        ? states[operationName].error.status >= 500 || 
          states[operationName].error.status === 408 || 
          states[operationName].error.status === 429 
        : false
    };
  });

  return {
    ...operationMethods,
    resetAll,
    hasAnyError: Object.values(states).some(state => state.error),
    isAnyLoading: Object.values(states).some(state => state.isLoading)
  };
}