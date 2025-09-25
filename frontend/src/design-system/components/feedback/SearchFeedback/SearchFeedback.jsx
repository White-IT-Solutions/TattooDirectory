"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '../../../utils/cn';
// Toast notifications are handled at a higher level to avoid SSR issues
import Button from '../../ui/Button/Button';
import Badge from '../../ui/Badge/Badge';
import Skeleton from '../../ui/Skeleton/Skeleton';

/**
 * SearchFeedback - Comprehensive feedback system for search operations
 * 
 * Features:
 * - Toast notifications for search actions
 * - Progress indicators for multi-step searches
 * - Loading states with progress bars
 * - Error messages with recovery suggestions
 * - Real-time validation feedback
 * - Success confirmations
 */

// Progress indicator component for multi-step searches
export function SearchProgressIndicator({ 
  steps = [], 
  currentStep = 0, 
  className,
  showEstimatedTime = true,
  estimatedTimeRemaining = null 
}) {
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  
  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-[var(--background-secondary)] rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-[var(--interactive-primary)] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress Percentage */}
        <div className="absolute -top-6 right-0 text-xs text-[var(--text-secondary)]">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Current Step Info */}
      {steps.length > 0 && currentStep < steps.length && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[var(--interactive-primary)] rounded-full animate-pulse" />
            <span className="text-[var(--text-primary)] font-medium">
              {steps[currentStep]?.label || `Step ${currentStep + 1}`}
            </span>
          </div>
          
          {showEstimatedTime && estimatedTimeRemaining && (
            <span className="text-[var(--text-secondary)]">
              ~{estimatedTimeRemaining}s remaining
            </span>
          )}
        </div>
      )}

      {/* Step List */}
      <div className="space-y-1">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={cn(
              'flex items-center space-x-2 text-xs transition-colors duration-200',
              index < currentStep && 'text-[var(--feedback-success)]',
              index === currentStep && 'text-[var(--interactive-primary)]',
              index > currentStep && 'text-[var(--text-muted)]'
            )}
          >
            {/* Step Icon */}
            <div className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold',
              index < currentStep && 'bg-[var(--feedback-success)] text-white',
              index === currentStep && 'bg-[var(--interactive-primary)] text-white',
              index > currentStep && 'bg-[var(--background-muted)] text-[var(--text-muted)]'
            )}>
              {index < currentStep ? (
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            
            {/* Step Label */}
            <span className={cn(
              'font-medium',
              index === currentStep && 'animate-pulse'
            )}>
              {step.label}
            </span>
            
            {/* Step Description */}
            {step.description && (
              <span className="text-[var(--text-muted)]">
                - {step.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading state with progress bar for search operations
export function SearchLoadingState({ 
  message = "Searching...", 
  progress = null,
  estimatedTime = null,
  showSkeleton = true,
  skeletonCount = 3,
  className 
}) {
  const [dots, setDots] = useState('');

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Loading Message */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--interactive-primary)]" />
          <span className="text-[var(--text-primary)] font-medium">
            {message}{dots}
          </span>
        </div>
        
        {estimatedTime && (
          <p className="text-sm text-[var(--text-secondary)]">
            Estimated time: ~{estimatedTime}s
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {progress !== null && (
        <div className="w-full bg-[var(--background-secondary)] rounded-full h-2">
          <div 
            className="h-full bg-[var(--interactive-primary)] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Skeleton Results */}
      {showSkeleton && (
        <div className="space-y-3">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-[var(--background-secondary)] rounded-[var(--radius)]">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Error message component with recovery suggestions
export function SearchErrorMessage({ 
  error,
  onRetry,
  onClearFilters,
  onGoHome,
  suggestions = [],
  className 
}) {
  // Toast notifications are handled at a higher level to avoid SSR issues

  if (!error) return null;

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'network':
        return (
          <svg className="h-8 w-8 text-[var(--feedback-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'timeout':
        return (
          <svg className="h-8 w-8 text-[var(--feedback-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-8 w-8 text-[var(--feedback-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getUserFriendlyMessage = (error) => {
    if (error.type === 'network') {
      return "We're having trouble connecting to our search service. Please check your internet connection.";
    }
    if (error.type === 'timeout') {
      return "The search is taking longer than expected. Please try again.";
    }
    if (error.type === 'no_results') {
      return "No results found for your search. Try adjusting your filters or search terms.";
    }
    return error.message || "Something went wrong with your search. Please try again.";
  };

  return (
    <div className={cn('text-center space-y-4 p-6', className)}>
      {/* Error Icon */}
      <div className="flex justify-center">
        {getErrorIcon(error.type)}
      </div>

      {/* Error Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Search Error
        </h3>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          {getUserFriendlyMessage(error)}
        </p>
      </div>

      {/* Recovery Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <Button 
            variant="primary" 
            onClick={onRetry}
            className="flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </Button>
        )}

        {onClearFilters && (
          <Button 
            variant="secondary" 
            onClick={onClearFilters}
            className="flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Clear Filters</span>
          </Button>
        )}

        {onGoHome && (
          <Button 
            variant="outline" 
            onClick={onGoHome}
            className="flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Go Home</span>
          </Button>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--text-primary)]">
            Try searching for:
          </h4>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="cursor-pointer hover:bg-[var(--interactive-secondary)]"
                onClick={() => suggestion.onClick?.(suggestion.value)}
              >
                {suggestion.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error ID for support */}
      {error.id && (
        <div className="pt-4 border-t border-[var(--border-muted)]">
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Error ID: {error.id}
          </p>
        </div>
      )}
    </div>
  );
}

// Success message component for search operations
export function SearchSuccessMessage({ 
  message,
  resultCount = 0,
  searchTime = null,
  onViewResults,
  onNewSearch,
  className 
}) {
  // Toast notifications are handled at a higher level to avoid SSR issues

  if (!message) return null;

  return (
    <div className={cn('text-center space-y-4 p-6 bg-[var(--feedback-success-bg)] border border-[var(--feedback-success)] rounded-[var(--radius-lg)]', className)}>
      {/* Success Icon */}
      <div className="flex justify-center">
        <svg className="h-8 w-8 text-[var(--feedback-success)]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--feedback-success)]">
          Search Complete
        </h3>
        <p className="text-[var(--text-primary)]">
          {message}
        </p>
        
        {/* Search Stats */}
        <div className="flex items-center justify-center space-x-4 text-sm text-[var(--text-secondary)]">
          {resultCount > 0 && (
            <span>{resultCount} results found</span>
          )}
          {searchTime && (
            <span>in {searchTime}ms</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onViewResults && (
          <Button 
            variant="primary" 
            onClick={onViewResults}
          >
            View Results
          </Button>
        )}

        {onNewSearch && (
          <Button 
            variant="outline" 
            onClick={onNewSearch}
          >
            New Search
          </Button>
        )}
      </div>
    </div>
  );
}

// Main SearchFeedback component that orchestrates all feedback types
export function SearchFeedback({
  state = 'idle', // 'idle', 'loading', 'success', 'error'
  error = null,
  progress = null,
  resultCount = 0,
  searchTime = null,
  estimatedTime = null,
  onRetry,
  onClearFilters,
  onGoHome,
  onViewResults,
  onNewSearch,
  suggestions = [],
  className
}) {
  switch (state) {
    case 'loading':
      return (
        <SearchLoadingState
          progress={progress}
          estimatedTime={estimatedTime}
          className={className}
        />
      );

    case 'error':
      return (
        <SearchErrorMessage
          error={error}
          onRetry={onRetry}
          onClearFilters={onClearFilters}
          onGoHome={onGoHome}
          suggestions={suggestions}
          className={className}
        />
      );

    case 'success':
      return (
        <SearchSuccessMessage
          message={`Found ${resultCount} results`}
          resultCount={resultCount}
          searchTime={searchTime}
          onViewResults={onViewResults}
          onNewSearch={onNewSearch}
          className={className}
        />
      );

    default:
      return null;
  }
}

export default SearchFeedback;