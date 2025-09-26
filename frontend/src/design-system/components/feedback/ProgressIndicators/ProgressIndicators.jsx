"use client";

import React, { useState, useEffect, forwardRef } from 'react';
import { cva } from '../../../utils/cn';
import { Progress, StepProgress, CircularProgress } from '../../ui/Progress/Progress';
import { Skeleton } from '../../ui/Skeleton/Skeleton';

// Progress indicator variants
const progressIndicatorVariants = cva(
  "flex items-center space-x-3 p-4 rounded-[var(--radius)] border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-[var(--border-primary)] bg-[var(--background-secondary)]",
        processing: "border-[var(--interactive-primary)] bg-[var(--interactive-primary-bg)]",
        success: "border-[var(--feedback-success)] bg-[var(--feedback-success-bg)]",
        error: "border-[var(--feedback-error)] bg-[var(--feedback-error-bg)]",
        warning: "border-[var(--feedback-warning)] bg-[var(--feedback-warning-bg)]"
      },
      size: {
        sm: "p-2 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

// Status icons
const StatusIcons = {
  processing: (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

// File Upload Progress Indicator
export const FileUploadProgress = forwardRef(({
  files = [],
  uploadProgress = {},
  onRetry,
  onCancel,
  className,
  ...props
}, ref) => {
  const totalFiles = files.length;
  const completedFiles = Object.values(uploadProgress).filter(p => p.status === 'completed').length;
  const failedFiles = Object.values(uploadProgress).filter(p => p.status === 'error').length;
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  if (totalFiles === 0) return null;

  return (
    <div ref={ref} className={`space-y-4 ${className || ''}`} {...props}>
      {/* Overall Progress */}
      <div className={progressIndicatorVariants({ 
        variant: failedFiles > 0 ? 'error' : completedFiles === totalFiles ? 'success' : 'processing' 
      })}>
        <div className="flex-shrink-0">
          {failedFiles > 0 ? StatusIcons.error : 
           completedFiles === totalFiles ? StatusIcons.success : 
           StatusIcons.processing}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Uploading {totalFiles} file{totalFiles !== 1 ? 's' : ''}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              {completedFiles}/{totalFiles} complete
            </span>
          </div>
          <Progress 
            value={overallProgress} 
            variant={failedFiles > 0 ? 'error' : 'default'}
            size="sm"
          />
        </div>
      </div>

      {/* Individual File Progress */}
      <div className="space-y-2">
        {files.map((file, index) => {
          const progress = uploadProgress[file.name] || { progress: 0, status: 'pending' };
          
          return (
            <div key={`${file.name}-${index}`} className="flex items-center space-x-3 p-3 bg-[var(--background-primary)] rounded-[var(--radius)] border border-[var(--border-primary)]">
              <div className="flex-shrink-0">
                {progress.status === 'completed' ? StatusIcons.success :
                 progress.status === 'error' ? StatusIcons.error :
                 progress.status === 'uploading' ? StatusIcons.processing :
                 StatusIcons.info}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {progress.status === 'completed' ? 'Complete' :
                     progress.status === 'error' ? 'Failed' :
                     progress.status === 'uploading' ? `${Math.round(progress.progress)}%` :
                     'Pending'}
                  </span>
                </div>
                
                {progress.status === 'uploading' && (
                  <Progress 
                    value={progress.progress} 
                    size="sm" 
                    className="mt-1"
                  />
                )}
                
                {progress.status === 'error' && progress.error && (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-[var(--feedback-error)]">{progress.error}</span>
                    {onRetry && (
                      <button
                        onClick={() => onRetry(file)}
                        className="text-xs text-[var(--interactive-primary)] hover:underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {(failedFiles > 0 || (completedFiles < totalFiles && completedFiles > 0)) && (
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
          )}
          {failedFiles > 0 && onRetry && (
            <button
              onClick={() => {
                const failedFilesList = files.filter(file => 
                  uploadProgress[file.name]?.status === 'error'
                );
                failedFilesList.forEach(file => onRetry(file));
              }}
              className="px-3 py-1 text-sm bg-[var(--interactive-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--interactive-primary-hover)] transition-colors"
            >
              Retry Failed
            </button>
          )}
        </div>
      )}
    </div>
  );
});

FileUploadProgress.displayName = 'FileUploadProgress';

// Form Submission Progress
export const FormSubmissionProgress = forwardRef(({
  steps = [],
  currentStep = 0,
  isSubmitting = false,
  error = null,
  onRetry,
  className,
  ...props
}, ref) => {
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep && isSubmitting) return 'processing';
    if (stepIndex === currentStep && error) return 'error';
    return 'pending';
  };

  return (
    <div ref={ref} className={`space-y-4 ${className || ''}`} {...props}>
      {/* Step Progress */}
      <StepProgress 
        steps={steps.map((step, index) => ({
          ...step,
          status: getStepStatus(index)
        }))}
        currentStep={currentStep}
      />

      {/* Current Step Details */}
      {steps[currentStep] && (
        <div className={progressIndicatorVariants({ 
          variant: error ? 'error' : isSubmitting ? 'processing' : 'default'
        })}>
          <div className="flex-shrink-0">
            {error ? StatusIcons.error : 
             isSubmitting ? StatusIcons.processing : 
             StatusIcons.info}
          </div>
          <div className="flex-1">
            <div className="font-medium">{steps[currentStep].title}</div>
            {steps[currentStep].description && (
              <div className="text-sm text-[var(--text-secondary)] mt-1">
                {steps[currentStep].description}
              </div>
            )}
            {error && (
              <div className="text-sm text-[var(--feedback-error)] mt-2">
                {error}
              </div>
            )}
          </div>
          {error && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-[var(--interactive-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--interactive-primary-hover)] transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
});

FormSubmissionProgress.displayName = 'FormSubmissionProgress';

// Processing Status Indicator
export const ProcessingStatus = forwardRef(({
  status = 'idle', // idle, processing, completed, error
  title,
  description,
  progress = 0,
  estimatedTime,
  onCancel,
  onRetry,
  className,
  ...props
}, ref) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval;
    if (status === 'processing') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVariant = () => {
    switch (status) {
      case 'processing': return 'processing';
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <div ref={ref} className={`${className || ''}`} {...props}>
      <div className={progressIndicatorVariants({ variant: getVariant() })}>
        <div className="flex-shrink-0">
          {status === 'processing' ? StatusIcons.processing :
           status === 'completed' ? StatusIcons.success :
           status === 'error' ? StatusIcons.error :
           StatusIcons.info}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium mb-1">{title}</div>
          )}
          
          {description && (
            <div className="text-sm text-[var(--text-secondary)] mb-2">
              {description}
            </div>
          )}
          
          {status === 'processing' && progress > 0 && (
            <div className="mb-2">
              <Progress value={progress} size="sm" />
            </div>
          )}
          
          {status === 'processing' && (
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              {estimatedTime && (
                <span>Est. remaining: {formatTime(Math.max(0, estimatedTime - elapsedTime))}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 space-x-2">
          {status === 'processing' && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
          )}
          
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-[var(--interactive-primary)] text-white rounded-[var(--radius)] hover:bg-[var(--interactive-primary-hover)] transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProcessingStatus.displayName = 'ProcessingStatus';

// Loading State with Skeleton
export const LoadingStateWithSkeleton = forwardRef(({
  isLoading = true,
  children,
  skeletonType = 'default',
  skeletonCount = 1,
  className,
  ...props
}, ref) => {
  if (!isLoading) {
    return children;
  }

  const renderSkeleton = () => {
    switch (skeletonType) {
      case 'card':
        return (
          <div className="space-y-4">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="p-4 border border-[var(--border-primary)] rounded-[var(--radius)]">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        );
      
      default:
        return <Skeleton className="h-32 w-full" />;
    }
  };

  return (
    <div ref={ref} className={className} {...props}>
      {renderSkeleton()}
    </div>
  );
});

LoadingStateWithSkeleton.displayName = 'LoadingStateWithSkeleton';

export default {
  FileUploadProgress,
  FormSubmissionProgress,
  ProcessingStatus,
  LoadingStateWithSkeleton
};