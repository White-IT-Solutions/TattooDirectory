/**
 * ErrorDisplay Component
 * 
 * A reusable component for displaying RFC 9457 compliant API errors
 * with user-friendly messages and retry functionality.
 */

'use client';

import { useState } from 'react';
import { ApiError, getUserFriendlyErrorMessage, isRetryableError } from '../../lib/errors.js';

/**
 * Props for ErrorDisplay component
 * @typedef {Object} ErrorDisplayProps
 * @property {ApiError|Error|null} error - The error to display
 * @property {Function} onRetry - Callback for retry button
 * @property {Function} onDismiss - Callback for dismiss button
 * @property {string} className - Additional CSS classes
 * @property {boolean} showDetails - Whether to show technical details (default: false)
 * @property {boolean} showRetry - Whether to show retry button (default: true)
 * @property {boolean} showDismiss - Whether to show dismiss button (default: true)
 * @property {string} variant - Display variant: 'banner', 'card', 'inline' (default: 'card')
 */

export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
  showDetails = false,
  showRetry = true,
  showDismiss = true,
  variant = 'card'
}) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!error) {
    return null;
  }

  // Convert regular errors to ApiError for consistent handling
  const apiError = error instanceof ApiError ? error : new ApiError({
    type: 'https://api.tattoodirectory.com/docs/errors#unknown',
    title: 'Unknown Error',
    status: 500,
    detail: error.message || 'An unknown error occurred',
    instance: null
  });

  const userMessage = getUserFriendlyErrorMessage(apiError);
  const canRetry = isRetryableError(apiError);
  const isClientError = apiError.isClientError();
  const isServerError = apiError.isServerError();

  // Determine styling based on error type and variant
  const getErrorStyles = () => {
    const baseStyles = 'rounded-lg border';
    const variantStyles = {
      banner: 'w-full p-4',
      card: 'p-6 shadow-md',
      inline: 'p-3'
    };

    const severityStyles = isServerError 
      ? 'bg-red-50 border-red-200 text-red-800'
      : isClientError 
        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
        : 'bg-gray-50 border-gray-200 text-gray-800';

    return `${baseStyles} ${variantStyles[variant]} ${severityStyles} ${className}`;
  };

  const getIconForError = () => {
    if (isServerError) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    } else if (isClientError) {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className={getErrorStyles()} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIconForError()}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {apiError.title || 'Error'}
            </h3>
            
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="mt-2 text-sm">
            <p>{userMessage}</p>
          </div>

          {/* Action buttons */}
          {(showRetry || showDetails) && (
            <div className="mt-4 flex items-center space-x-3">
              {showRetry && canRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Try Again
                </button>
              )}

              {showDetails && (
                <button
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <svg 
                    className={`w-3 h-3 mr-1 transform transition-transform ${isDetailsExpanded ? 'rotate-180' : ''}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {isDetailsExpanded ? 'Hide' : 'Show'} Details
                </button>
              )}
            </div>
          )}

          {/* Technical details (collapsible) */}
          {showDetails && isDetailsExpanded && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
              <div className="space-y-1">
                <div><strong>Status:</strong> {apiError.status}</div>
                <div><strong>Type:</strong> {apiError.type}</div>
                {apiError.instance && (
                  <div><strong>Instance:</strong> {apiError.instance}</div>
                )}
                {apiError.detail && apiError.detail !== userMessage && (
                  <div><strong>Detail:</strong> {apiError.detail}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified error banner component for top-level errors
 */
export function ErrorBanner({ error, onRetry, onDismiss, className = '' }) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className={className}
      variant="banner"
      showDetails={false}
      showRetry={true}
      showDismiss={true}
    />
  );
}

/**
 * Inline error component for form fields and small spaces
 */
export function InlineError({ error, className = '' }) {
  return (
    <ErrorDisplay
      error={error}
      className={className}
      variant="inline"
      showDetails={false}
      showRetry={false}
      showDismiss={false}
    />
  );
}