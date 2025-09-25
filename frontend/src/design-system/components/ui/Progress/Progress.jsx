"use client";

import React, { forwardRef } from 'react';
import { cva } from '../../../utils/cn';

// Progress variant configurations
const progressVariants = cva(
  [
    'relative w-full overflow-hidden',
    'bg-[var(--background-secondary)]',
    'rounded-full'
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
);

const progressBarVariants = cva(
  [
    'h-full transition-all duration-300 ease-out',
    'rounded-full'
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-[var(--interactive-primary)]',
        success: 'bg-[var(--feedback-success)]',
        warning: 'bg-[var(--feedback-warning)]',
        error: 'bg-[var(--feedback-error)]',
        accent: 'bg-[var(--interactive-accent)]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// Check icon for completed steps
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Progress bar component
const Progress = forwardRef(({
  className,
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  label,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full">
      {/* Label and value */}
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm text-[var(--text-secondary)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      {/* Progress bar */}
      <div
        ref={ref}
        className={progressVariants({ size, className })}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        {...props}
      >
        <div
          className={progressBarVariants({ variant })}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

Progress.displayName = 'Progress';

// Step progress component for multi-step forms
const StepProgress = forwardRef(({
  className,
  steps = [],
  currentStep = 0,
  variant = 'default',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className || ''}`} ref={ref} {...props}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={step.id || index}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${isCompleted 
                      ? 'bg-[var(--feedback-success)] border-[var(--feedback-success)] text-white' 
                      : isCurrent 
                        ? 'bg-[var(--interactive-primary)] border-[var(--interactive-primary)] text-white'
                        : 'bg-[var(--background-primary)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                
                {/* Step label */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    isCurrent 
                      ? 'text-[var(--text-primary)]' 
                      : 'text-[var(--text-secondary)]'
                  }`}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 transition-all duration-200 ${
                    index < currentStep 
                      ? 'bg-[var(--feedback-success)]' 
                      : 'bg-[var(--border-primary)]'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

StepProgress.displayName = 'StepProgress';

// Circular progress component
const CircularProgress = forwardRef(({
  className,
  value = 0,
  max = 100,
  size = 64,
  strokeWidth = 4,
  variant = 'default',
  showValue = false,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    default: 'var(--interactive-primary)',
    success: 'var(--feedback-success)',
    warning: 'var(--feedback-warning)',
    error: 'var(--feedback-error)',
    accent: 'var(--interactive-accent)'
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className || ''}`}
      style={{ width: size, height: size }}
      ref={ref}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-primary)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[variant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
});

CircularProgress.displayName = 'CircularProgress';

export default Progress;
export { 
  Progress, 
  StepProgress, 
  CircularProgress,
  progressVariants,
  progressBarVariants 
};