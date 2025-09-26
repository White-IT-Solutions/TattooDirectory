"use client";

import React from 'react';
import { cva } from '../../../utils/cn';

const progressIndicatorVariants = cva(
  "flex items-center space-x-2 text-sm",
  {
    variants: {
      variant: {
        default: "text-[var(--text-secondary)]",
        loading: "text-[var(--interactive-primary)]",
        success: "text-[var(--feedback-success)]",
        error: "text-[var(--feedback-error)]"
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4", 
        lg: "h-5 w-5"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

export function SearchProgressIndicator({
  isLoading = false,
  progress = 0,
  steps = [],
  currentStep = 0,
  variant = "default",
  size = "md",
  showSteps = true,
  className = "",
  ...props
}) {
  const getVariant = () => {
    if (isLoading) return "loading";
    if (progress === 100) return "success";
    return variant;
  };

  return (
    <div className={progressIndicatorVariants({ variant: getVariant(), size, className })} {...props}>
      {/* Loading Spinner */}
      {isLoading && (
        <div className={spinnerVariants({ size })} />
      )}

      {/* Progress Text */}
      <div className="flex items-center space-x-2">
        {showSteps && steps.length > 0 ? (
          <span>
            {steps[currentStep] || 'Processing...'}
            {steps.length > 1 && ` (${currentStep + 1}/${steps.length})`}
          </span>
        ) : (
          <span>
            {isLoading ? 'Searching...' : progress === 100 ? 'Complete' : 'Ready'}
          </span>
        )}

        {/* Progress Percentage */}
        {progress > 0 && progress < 100 && (
          <span className="text-xs opacity-75">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="flex-1 max-w-32 bg-[var(--background-muted)] rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Success/Error Icons */}
      {!isLoading && progress === 100 && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}

      {variant === "error" && !isLoading && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  );
}

export default SearchProgressIndicator;