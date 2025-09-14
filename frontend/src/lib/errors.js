/**
 * RFC 9457 Error Handling Utilities
 * 
 * This module provides utilities for handling RFC 9457 compliant error responses
 * from the backend API, including user-friendly error messages and debugging support.
 */

/**
 * RFC 9457 Problem Details structure
 * @typedef {Object} ProblemDetails
 * @property {string} type - URI reference that identifies the problem type
 * @property {string} title - Short, human-readable summary of the problem type
 * @property {number} status - HTTP status code
 * @property {string} detail - Human-readable explanation specific to this occurrence
 * @property {string} instance - URI reference that identifies the specific occurrence
 */

/**
 * Enhanced error class for RFC 9457 problem details
 */
export class ApiError extends Error {
  constructor(problemDetails, originalResponse = null) {
    super(problemDetails.detail || problemDetails.title || 'Unknown API error');
    
    this.name = 'ApiError';
    this.type = problemDetails.type;
    this.title = problemDetails.title;
    this.status = problemDetails.status;
    this.detail = problemDetails.detail;
    this.instance = problemDetails.instance;
    this.originalResponse = originalResponse;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Get user-friendly error message based on status code and type
   */
  getUserFriendlyMessage() {
    return getUserFriendlyErrorMessage(this);
  }

  /**
   * Check if this is a specific type of error
   */
  isType(errorType) {
    return this.type && this.type.includes(errorType);
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError() {
    return this.status >= 500;
  }
}

/**
 * Parse an HTTP response and extract RFC 9457 problem details
 * @param {Response} response - Fetch API response object
 * @returns {Promise<ProblemDetails>} - Parsed problem details
 */
export async function parseProblemDetails(response) {
  const contentType = response.headers.get('content-type') || '';
  
  try {
    if (contentType.includes('application/problem+json') || contentType.includes('application/json')) {
      const problemDetails = await response.json();
      
      // Validate that this looks like RFC 9457 format
      if (problemDetails.status || problemDetails.title || problemDetails.type) {
        return {
          type: problemDetails.type || `https://api.tattoodirectory.com/docs/errors#${response.status}`,
          title: problemDetails.title || getDefaultErrorTitle(response.status),
          status: problemDetails.status || response.status,
          detail: problemDetails.detail || response.statusText,
          instance: problemDetails.instance || null
        };
      }
    }
  } catch (parseError) {
    // If we can't parse the response, create a generic problem details object
    console.warn('Failed to parse error response as JSON:', parseError);
  }

  // Fallback for non-RFC 9457 responses
  return {
    type: `https://api.tattoodirectory.com/docs/errors#${response.status}`,
    title: getDefaultErrorTitle(response.status),
    status: response.status,
    detail: response.statusText || 'An error occurred',
    instance: null
  };
}

/**
 * Get default error title for HTTP status codes
 * @param {number} status - HTTP status code
 * @returns {string} - Default error title
 */
function getDefaultErrorTitle(status) {
  const statusTitles = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };

  return statusTitles[status] || 'Unknown Error';
}

/**
 * Generate user-friendly error messages based on error details
 * @param {ApiError} error - The API error object
 * @returns {string} - User-friendly error message
 */
export function getUserFriendlyErrorMessage(error) {
  // Handle specific error types first
  if (error.type) {
    if (error.type.includes('service-unavailable') || error.status === 503) {
      return 'Our search service is temporarily unavailable. Please try again in a few moments.';
    }
    
    if (error.type.includes('rate-limit') || error.status === 429) {
      return 'You\'re making requests too quickly. Please wait a moment and try again.';
    }
  }

  // Handle by status code
  switch (error.status) {
    case 400:
      return error.detail || 'Please check your search parameters and try again.';
    
    case 401:
      return 'You need to be logged in to access this feature.';
    
    case 403:
      return 'You don\'t have permission to access this resource.';
    
    case 404:
      if (error.detail && error.detail.includes('Artist')) {
        return 'The artist you\'re looking for could not be found.';
      }
      return 'The requested resource could not be found.';
    
    case 408:
      return 'The request took too long to complete. Please try again.';
    
    case 422:
      return error.detail || 'The information provided is not valid. Please check and try again.';
    
    case 500:
      return 'Something went wrong on our end. Please try again later.';
    
    case 502:
    case 504:
      return 'Our service is experiencing connectivity issues. Please try again in a few moments.';
    
    case 503:
      return 'Our service is temporarily unavailable for maintenance. Please try again later.';
    
    default:
      // For unknown errors, use the detail if available, otherwise a generic message
      return error.detail || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Log error details for debugging purposes
 * @param {ApiError} error - The API error to log
 * @param {Object} context - Additional context for debugging
 */
export function logApiError(error, context = {}) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    type: error.type,
    title: error.title,
    status: error.status,
    detail: error.detail,
    instance: error.instance,
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...context
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 API Error ${error.status}: ${error.title}`);
    console.warn('Error Details:', errorDetails);
    if (error.stack) {
      console.warn('Stack Trace:', error.stack);
    }
    if (error.originalResponse) {
      console.warn('Original Response:', error.originalResponse);
    }
    console.groupEnd();
  }

  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, { extra: errorDetails });
    
    // For now, just log essential info
    console.error('API Error:', {
      status: error.status,
      type: error.type,
      instance: error.instance,
      timestamp: errorDetails.timestamp
    });
  }
}

/**
 * Enhanced fetch wrapper that handles RFC 9457 error responses
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Response object or throws ApiError
 */
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const problemDetails = await parseProblemDetails(response);
      const apiError = new ApiError(problemDetails, response);
      
      // Log the error for debugging
      logApiError(apiError, {
        url,
        method: options.method || 'GET',
        requestBody: options.body
      });
      
      throw apiError;
    }

    return response;
  } catch (error) {
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors or other fetch failures
    const networkError = new ApiError({
      type: 'https://api.tattoodirectory.com/docs/errors#network',
      title: 'Network Error',
      status: 0,
      detail: 'Unable to connect to the server. Please check your internet connection.',
      instance: null
    });

    // Only log network errors in development if they're not expected
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Network error for ${url}:`, error.message);
    } else {
      logApiError(networkError, {
        url,
        method: options.method || 'GET',
        originalError: error.message
      });
    }

    throw networkError;
  }
}

/**
 * Utility to check if an error is retryable
 * @param {ApiError} error - The API error to check
 * @returns {boolean} - Whether the error is retryable
 */
export function isRetryableError(error) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // Retry on server errors and specific client errors
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.status);
}

/**
 * Create a retry wrapper for API calls
 * @param {Function} apiCall - The API call function to retry
 * @param {Object} options - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
export function withRetry(apiCall, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  return async function(...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's not a retryable error or if we've exhausted retries
        if (!isRetryableError(error) || attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        console.log(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
}