"use client";

import React from 'react';
import { cva } from '../../../utils/cn';
import Button from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';

const errorMessageVariants = cva(
  "rounded-lg border p-4 space-y-3",
  {
    variants: {
      variant: {
        error: "border-[var(--feedback-error)] bg-[var(--feedback-error)]/5",
        warning: "border-[var(--feedback-warning)] bg-[var(--feedback-warning)]/5",
        info: "border-[var(--interactive-primary)] bg-[var(--interactive-primary)]/5"
      },
      size: {
        sm: "p-3 text-sm",
        md: "p-4 text-base",
        lg: "p-5 text-lg"
      }
    },
    defaultVariants: {
      variant: "error",
      size: "md"
    }
  }
);

const iconVariants = cva(
  "flex-shrink-0",
  {
    variants: {
      variant: {
        error: "text-[var(--feedback-error)]",
        warning: "text-[var(--feedback-warning)]",
        info: "text-[var(--interactive-primary)]"
      },
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6"
      }
    },
    defaultVariants: {
      variant: "error",
      size: "md"
    }
  }
);

// Common search error types and their recovery suggestions
const errorRecoveryMap = {
  'no-results': {
    title: 'No results found',
    suggestions: [
      'Check your spelling',
      'Try broader search terms',
      'Use different keywords',
      'Browse by category instead'
    ],
    actions: [
      { label: 'Browse Artists', href: '/artists' },
      { label: 'Browse Styles', href: '/styles' },
      { label: 'Advanced Search', href: '/search/advanced' }
    ]
  },
  'network-error': {
    title: 'Connection problem',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again'
    ],
    actions: [
      { label: 'Retry Search', action: 'retry' },
      { label: 'Refresh Page', action: 'refresh' }
    ]
  },
  'server-error': {
    title: 'Search temporarily unavailable',
    suggestions: [
      'Our search service is experiencing issues',
      'Please try again in a few minutes',
      'Browse categories while we fix this'
    ],
    actions: [
      { label: 'Try Again', action: 'retry' },
      { label: 'Browse Artists', href: '/artists' }
    ]
  },
  'invalid-query': {
    title: 'Invalid search query',
    suggestions: [
      'Search terms must be at least 2 characters',
      'Avoid special characters',
      'Use letters, numbers, and spaces only'
    ],
    actions: [
      { label: 'Clear Search', action: 'clear' },
      { label: 'Search Tips', action: 'help' }
    ]
  },
  'location-error': {
    title: 'Location not found',
    suggestions: [
      'Check the postcode format (e.g., SW1A 1AA)',
      'Try a nearby city or area',
      'Use the map search instead'
    ],
    actions: [
      { label: 'Map Search', href: '/search/map' },
      { label: 'Browse Locations', href: '/locations' }
    ]
  }
};

// Popular search suggestions
const popularSuggestions = [
  'Traditional tattoos',
  'Realism artists',
  'London studios',
  'Watercolor style',
  'Japanese tattoos',
  'Portrait artists'
];

export function SearchErrorMessage({
  errorType = 'no-results',
  query = '',
  variant = 'error',
  size = 'md',
  showSuggestions = true,
  showActions = true,
  showPopularSearches = true,
  onRetry,
  onClear,
  onHelp,
  className = '',
  ...props
}) {
  const errorConfig = errorRecoveryMap[errorType] || errorRecoveryMap['no-results'];

  const handleActionClick = (action) => {
    switch (action.action) {
      case 'retry':
        onRetry?.();
        break;
      case 'clear':
        onClear?.();
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'help':
        onHelp?.();
        break;
      default:
        if (action.href) {
          window.location.href = action.href;
        }
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg className={iconVariants({ variant, size })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconVariants({ variant, size })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconVariants({ variant, size })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={errorMessageVariants({ variant, size, className })} {...props}>
      {/* Error Header */}
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)]">
            {errorConfig.title}
            {query && (
              <span className="font-normal text-[var(--text-secondary)]">
                {' '}for "{query}"
              </span>
            )}
          </h3>
        </div>
      </div>

      {/* Recovery Suggestions */}
      {showSuggestions && errorConfig.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[var(--text-primary)]">
            Try these suggestions:
          </h4>
          <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
            {errorConfig.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 mt-1.5 w-1 h-1 bg-current rounded-full flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && errorConfig.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {errorConfig.actions.map((action, index) => (
            <Button
              key={index}
              variant={index === 0 ? "primary" : "outline"}
              size="sm"
              onClick={() => handleActionClick(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Popular Searches */}
      {showPopularSearches && errorType === 'no-results' && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
          <h4 className="text-sm font-medium text-[var(--text-primary)]">
            Popular searches:
          </h4>
          <div className="flex flex-wrap gap-2">
            {popularSuggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                size="sm"
                className="cursor-pointer hover:bg-[var(--interactive-secondary)] transition-colors"
                onClick={() => {
                  // Trigger search with this suggestion
                  const searchInput = document.querySelector('[type="search"]');
                  if (searchInput) {
                    searchInput.value = suggestion;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    searchInput.form?.dispatchEvent(new Event('submit', { bubbles: true }));
                  }
                }}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchErrorMessage;