"use client";

import React, { forwardRef } from 'react';
import { cva } from '../../../utils/cn';
import Badge from '../../ui/Badge/Badge';
import Button from '../../ui/Button/Button';

// Status display variants
const statusDisplayVariants = cva(
  "flex items-center space-x-3 p-4 rounded-[var(--radius)] border transition-all duration-200",
  {
    variants: {
      variant: {
        available: "border-[var(--feedback-success)] bg-[var(--feedback-success-bg)]",
        busy: "border-[var(--feedback-warning)] bg-[var(--feedback-warning-bg)]",
        unavailable: "border-[var(--feedback-error)] bg-[var(--feedback-error-bg)]",
        processing: "border-[var(--interactive-primary)] bg-[var(--interactive-primary-bg)]",
        completed: "border-[var(--feedback-success)] bg-[var(--feedback-success-bg)]",
        pending: "border-[var(--border-primary)] bg-[var(--background-secondary)]",
        info: "border-[var(--interactive-accent)] bg-[var(--interactive-accent-bg)]"
      },
      size: {
        sm: "p-2 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg"
      }
    },
    defaultVariants: {
      variant: "pending",
      size: "md"
    }
  }
);

// Status icons mapping
const StatusIcons = {
  available: (
    <svg className="h-5 w-5 text-[var(--feedback-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  busy: (
    <svg className="h-5 w-5 text-[var(--feedback-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  unavailable: (
    <svg className="h-5 w-5 text-[var(--feedback-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
    </svg>
  ),
  processing: (
    <svg className="h-5 w-5 text-[var(--interactive-primary)] animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  completed: (
    <svg className="h-5 w-5 text-[var(--feedback-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending: (
    <svg className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-[var(--interactive-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

// Enhanced Availability Status Display
export const EnhancedAvailabilityStatus = forwardRef(({
  status = 'available', // available, busy, unavailable
  title,
  description,
  nextAvailable,
  waitingList = false,
  waitingListCount = 0,
  estimatedWaitTime,
  emergencySlots = false,
  consultationRequired = false,
  bookingUrl,
  onBookingClick,
  onWaitListClick,
  showActions = true,
  className,
  ...props
}, ref) => {
  const getStatusText = () => {
    if (emergencySlots) return 'Emergency Slots Available';
    if (status === 'unavailable') return 'Currently Unavailable';
    if (waitingList) return 'Waiting List Open';
    if (status === 'busy') return 'Busy - Limited Availability';
    return 'Available for Booking';
  };

  const getStatusVariant = () => {
    if (status === 'unavailable') return 'unavailable';
    if (emergencySlots) return 'info';
    if (waitingList) return 'busy';
    if (status === 'busy') return 'busy';
    return 'available';
  };

  return (
    <div ref={ref} className={`space-y-3 ${className || ''}`} {...props}>
      {/* Main Status Display */}
      <div className={statusDisplayVariants({ variant: getStatusVariant() })}>
        <div className="flex-shrink-0">
          {StatusIcons[getStatusVariant()]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium">
            {title || getStatusText()}
          </div>
          
          {description && (
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {description}
            </div>
          )}
          
          {/* Status Details */}
          <div className="flex flex-wrap gap-2 mt-2">
            {nextAvailable && (
              <Badge variant="outline" size="sm">
                Next: {new Date(nextAvailable).toLocaleDateString()}
              </Badge>
            )}
            
            {waitingList && waitingListCount > 0 && (
              <Badge variant="warning" size="sm">
                {waitingListCount} waiting
              </Badge>
            )}
            
            {estimatedWaitTime && (
              <Badge variant="info" size="sm">
                Est. wait: {estimatedWaitTime}
              </Badge>
            )}
            
            {consultationRequired && (
              <Badge variant="accent" size="sm">
                Consultation required
              </Badge>
            )}
            
            {emergencySlots && (
              <Badge variant="success" size="sm">
                ⚡ Last-minute slots
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2">
          {status === 'available' && !waitingList && (
            <Button
              variant="primary"
              size="sm"
              onClick={onBookingClick}
              className="flex-1"
            >
              Book Now
            </Button>
          )}
          
          {waitingList && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onWaitListClick}
              className="flex-1"
            >
              Join Wait List
            </Button>
          )}
          
          {status === 'unavailable' && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex-1"
            >
              Bookings Closed
            </Button>
          )}
          
          {consultationRequired && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => onBookingClick && onBookingClick('consultation')}
              className="flex-1"
            >
              Book Consultation
            </Button>
          )}
          
          {bookingUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(bookingUrl, '_blank')}
              className="flex-1"
            >
              External Booking
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

EnhancedAvailabilityStatus.displayName = 'EnhancedAvailabilityStatus';

// Processing Status Display
export const ProcessingStatusDisplay = forwardRef(({
  status = 'pending', // pending, processing, completed, error
  title,
  description,
  progress = 0,
  steps = [],
  currentStep = 0,
  error = null,
  onRetry,
  onCancel,
  className,
  ...props
}, ref) => {
  const getStatusVariant = () => {
    switch (status) {
      case 'processing': return 'processing';
      case 'completed': return 'completed';
      case 'error': return 'unavailable';
      default: return 'pending';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed Successfully';
      case 'error': return 'Processing Failed';
      default: return 'Ready to Process';
    }
  };

  return (
    <div ref={ref} className={`space-y-3 ${className || ''}`} {...props}>
      {/* Main Status */}
      <div className={statusDisplayVariants({ variant: getStatusVariant() })}>
        <div className="flex-shrink-0">
          {StatusIcons[getStatusVariant()]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium">
            {title || getStatusText()}
          </div>
          
          {description && (
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {description}
            </div>
          )}
          
          {error && (
            <div className="text-sm text-[var(--feedback-error)] mt-2">
              {error}
            </div>
          )}
          
          {/* Progress Bar */}
          {status === 'processing' && progress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-[var(--background-muted)] rounded-full h-2">
                <div 
                  className="bg-[var(--interactive-primary)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Steps */}
          {steps.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-[var(--text-secondary)] mb-2">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="space-y-1">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      index < currentStep ? 'bg-[var(--feedback-success)]' :
                      index === currentStep ? 'bg-[var(--interactive-primary)]' :
                      'bg-[var(--background-muted)]'
                    }`} />
                    <span className={
                      index === currentStep ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex-shrink-0 space-x-2">
          {status === 'processing' && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          {status === 'error' && onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

ProcessingStatusDisplay.displayName = 'ProcessingStatusDisplay';

// Completion Status Display
export const CompletionStatusDisplay = forwardRef(({
  isCompleted = false,
  title,
  description,
  completedAt,
  duration,
  results = [],
  onViewDetails,
  onDownload,
  onShare,
  className,
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`${className || ''}`} {...props}>
      <div className={statusDisplayVariants({ variant: isCompleted ? 'completed' : 'pending' })}>
        <div className="flex-shrink-0">
          {StatusIcons[isCompleted ? 'completed' : 'pending']}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium">
            {title || (isCompleted ? 'Task Completed' : 'Task Pending')}
          </div>
          
          {description && (
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {description}
            </div>
          )}
          
          {isCompleted && (
            <div className="mt-2 space-y-1">
              {completedAt && (
                <div className="text-xs text-[var(--text-secondary)]">
                  Completed: {new Date(completedAt).toLocaleString()}
                </div>
              )}
              
              {duration && (
                <div className="text-xs text-[var(--text-secondary)]">
                  Duration: {duration}
                </div>
              )}
              
              {results.length > 0 && (
                <div className="text-xs text-[var(--text-secondary)]">
                  Results: {results.length} item{results.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        {isCompleted && (
          <div className="flex-shrink-0 space-x-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                View Details
              </Button>
            )}
            
            {onDownload && (
              <Button variant="secondary" size="sm" onClick={onDownload}>
                Download
              </Button>
            )}
            
            {onShare && (
              <Button variant="accent" size="sm" onClick={onShare}>
                Share
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

CompletionStatusDisplay.displayName = 'CompletionStatusDisplay';

export default {
  EnhancedAvailabilityStatus,
  ProcessingStatusDisplay,
  CompletionStatusDisplay
};