"use client";

import React, { Component, useState, useCallback } from 'react';
import { cn } from '../../../utils/cn';
import Button from '../../ui/Button/Button';
import { ErrorIllustration } from './ErrorIllustration';

/**
 * Enhanced ErrorBoundary with branded error pages and comprehensive error handling
 * 
 * Features:
 * - Branded error illustrations and messaging
 * - User-friendly error messages with recovery options
 * - Error reporting functionality for debugging
 * - Graceful fallbacks for component failures
 * - Retry mechanisms for transient errors
 * - Design system integration
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    const { errorId } = this.state;
    
    // Enhanced error reporting with context
    this.reportError(error, errorInfo, errorId);
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  /**
   * Report error to monitoring service and console
   */
  reportError = (error, errorInfo, errorId) => {
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous',
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
      retryCount: this.state.retryCount
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary Caught Error [${errorId}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }

    // Report to monitoring service (implement based on your monitoring solution)
    if (this.props.onReportError) {
      this.props.onReportError(errorReport);
    } else if (typeof window !== 'undefined' && window.reportError) {
      // Use browser's built-in error reporting if available
      window.reportError(errorReport);
    }

    // Send to analytics/monitoring service
    this.sendToMonitoring(errorReport);
  };

  /**
   * Send error report to monitoring service
   */
  sendToMonitoring = async (errorReport) => {
    try {
      // Only send in production to avoid noise
      if (process.env.NODE_ENV === 'production') {
        // Replace with your actual monitoring endpoint
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport)
        });
      }
    } catch (monitoringError) {
      console.warn('Failed to send error report to monitoring:', monitoringError);
    }
  };

  /**
   * Determine if error is likely transient and retryable
   */
  isRetryableError = (error) => {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /connection/i,
      /temporary/i,
      /ChunkLoadError/i,
      /Loading chunk/i
    ];

    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  };

  /**
   * Get user-friendly error message based on error type
   */
  getUserFriendlyMessage = (error) => {
    // Network/loading errors
    if (/ChunkLoadError|Loading chunk/i.test(error.message)) {
      return "We're having trouble loading part of the application. This usually happens after an update.";
    }
    
    if (/network|fetch|connection/i.test(error.message)) {
      return "We're having trouble connecting to our servers. Please check your internet connection.";
    }
    
    if (/timeout/i.test(error.message)) {
      return "The request is taking longer than expected. Please try again.";
    }

    // Generic fallback
    return "Something unexpected happened. Our team has been notified and we're working to fix it.";
  };

  /**
   * Handle retry attempt
   */
  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Reset error state to retry rendering
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: newRetryCount
    });

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry(newRetryCount);
    }
  };

  /**
   * Handle page reload
   */
  handleReload = () => {
    if (this.props.onReload) {
      this.props.onReload();
    } else {
      window.location.reload();
    }
  };

  /**
   * Handle navigation to home
   */
  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  /**
   * Handle feedback submission
   */
  handleSendFeedback = () => {
    const { errorId, error } = this.state;
    const feedbackUrl = `/feedback?error=${errorId}&message=${encodeURIComponent(error?.message || '')}`;
    
    if (this.props.onSendFeedback) {
      this.props.onSendFeedback(errorId, error);
    } else {
      window.open(feedbackUrl, '_blank');
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId, retryCount } = this.state;
      const { 
        fallback, 
        showRetry = true, 
        showReload = true, 
        showHome = true,
        showFeedback = true,
        maxRetries = 3,
        variant = 'full'
      } = this.props;

      // Custom fallback UI
      if (fallback) {
        return fallback(error, {
          retry: this.handleRetry,
          reload: this.handleReload,
          goHome: this.handleGoHome,
          errorId,
          retryCount
        });
      }

      const isRetryable = this.isRetryableError(error);
      const canRetry = showRetry && isRetryable && retryCount < maxRetries;
      const userMessage = this.getUserFriendlyMessage(error);

      // Compact variant for smaller spaces
      if (variant === 'compact') {
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-[var(--background-secondary)] rounded-[var(--radius-lg)] border border-[var(--border-primary)]">
            <div className="w-16 h-16 mb-4">
              <ErrorIllustration variant="simple" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-sm text-[var(--text-secondary)] text-center mb-4">
              {userMessage}
            </p>
            <div className="flex gap-2">
              {canRetry && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleReload}
              >
                Reload
              </Button>
            </div>
          </div>
        );
      }

      // Full page error display
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-primary)] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg w-full">
            {/* Error Illustration */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 sm:w-40 sm:h-40">
                <ErrorIllustration variant="detailed" />
              </div>
            </div>

            {/* Error Content */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4 font-[var(--font-family-heading)]">
                Oops! Something went wrong
              </h1>
              
              <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
                {userMessage}
              </p>

              {/* Action Buttons */}
              <div className="space-y-4">
                {canRetry && (
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={this.handleRetry}
                    className="w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </Button>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {showReload && (
                    <Button 
                      variant="secondary" 
                      size="md" 
                      onClick={this.handleReload}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reload Page
                    </Button>
                  )}

                  {showHome && (
                    <Button 
                      variant="outline" 
                      size="md" 
                      onClick={this.handleGoHome}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Go Home
                    </Button>
                  )}
                </div>

                {showFeedback && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={this.handleSendFeedback}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Send Feedback
                  </Button>
                )}
              </div>

              {/* Error ID for support */}
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Error ID: {errorId}
                </p>
                {retryCount > 0 && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Retry attempts: {retryCount}
                  </p>
                )}
              </div>

              {/* Developer Information */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold">
                    🔧 Developer Information
                  </summary>
                  <div className="mt-4 p-4 bg-[var(--background-tertiary)] rounded-[var(--radius)] text-xs font-mono overflow-auto max-h-64 border border-[var(--border-primary)]">
                    <div className="mb-4">
                      <strong className="text-[var(--feedback-error)]">Error:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-[var(--text-primary)]">
                        {error?.stack}
                      </pre>
                    </div>
                    <div>
                      <strong className="text-[var(--feedback-warning)]">Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-[var(--text-primary)]">
                        {this.state.errorInfo.componentStack}
                      </pre>
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
 * Higher-order component to wrap components with enhanced error boundary
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
 */
export function useErrorBoundary() {
  const [, setState] = useState();
  
  return useCallback((error) => {
    setState(() => {
      throw error;
    });
  }, []);
}

export default ErrorBoundary;
export { ErrorBoundary };