/**
 * ErrorBoundary Component
 * 
 * React Error Boundary that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI with RFC 9457 compliant error handling.
 */

'use client';

import React from 'react';
import { ApiError, logApiError } from '../../lib/errors.js';
import ErrorDisplay from './ErrorDisplay.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Convert the error to an ApiError for consistent handling
    const apiError = error instanceof ApiError ? error : new ApiError({
      type: 'https://api.tattoodirectory.com/docs/errors#client-error',
      title: 'Application Error',
      status: 500,
      detail: error.message || 'An unexpected error occurred in the application',
      instance: null
    });

    // Log the error with additional context
    logApiError(apiError, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      errorStack: error.stack,
      props: this.props.logProps ? JSON.stringify(this.props) : undefined
    });

    // Update state with error info
    this.setState({
      error: apiError,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(apiError, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReload = () => {
    // Reload the page as a last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h1>
              
              <ErrorDisplay
                error={this.state.error}
                onRetry={this.handleRetry}
                showDetails={process.env.NODE_ENV === 'development'}
                variant="card"
                className="text-left"
              />

              <div className="mt-6 space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Reload Page
                </button>

                {this.props.showHomeLink !== false && (
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Go to Home
                  </button>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Developer Information
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-64">
                    <div className="mb-4">
                      <strong>Error:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.error?.stack}</pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 * @param {React.Component} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Props to pass to ErrorBoundary
 * @returns {React.Component} - Wrapped component
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to manually trigger error boundary (for functional components)
 * @returns {Function} - Function to throw an error that will be caught by error boundary
 */
export function useErrorBoundary() {
  const [, setState] = React.useState();
  
  return React.useCallback((error) => {
    setState(() => {
      throw error;
    });
  }, []);
}

export default ErrorBoundary;