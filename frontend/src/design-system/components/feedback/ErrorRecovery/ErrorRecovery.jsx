"use client";

import React, { useState, forwardRef } from 'react';
import { cva } from '../../../utils/cn';
import Button from '../../ui/Button/Button';

// Error recovery variants
const errorRecoveryVariants = cva(
  "p-4 rounded-[var(--radius)] border transition-all duration-200",
  {
    variants: {
      severity: {
        low: "border-[var(--feedback-warning)] bg-[var(--feedback-warning-bg)]",
        medium: "border-[var(--feedback-error)] bg-[var(--feedback-error-bg)]",
        high: "border-[var(--feedback-error)] bg-[var(--feedback-error-bg)] border-2",
        critical: "border-red-600 bg-red-50 border-2 shadow-lg"
      },
      size: {
        sm: "p-3 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg"
      }
    },
    defaultVariants: {
      severity: "medium",
      size: "md"
    }
  }
);

// Error icons
const ErrorIcons = {
  network: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  ),
  validation: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  permission: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  server: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
    </svg>
  ),
  timeout: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  generic: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
};

// Error type configurations
const errorConfigurations = {
  network: {
    title: "Connection Problem",
    description: "We're having trouble connecting to our servers. This might be a temporary network issue.",
    severity: "medium",
    icon: "network",
    recoveryActions: [
      { label: "Try Again", action: "retry", primary: true },
      { label: "Check Connection", action: "checkConnection" },
      { label: "Work Offline", action: "offline" }
    ],
    tips: [
      "Check your internet connection",
      "Try refreshing the page",
      "Contact support if the problem persists"
    ]
  },
  validation: {
    title: "Invalid Input",
    description: "Some of the information you provided doesn't meet our requirements.",
    severity: "low",
    icon: "validation",
    recoveryActions: [
      { label: "Fix Issues", action: "fix", primary: true },
      { label: "Reset Form", action: "reset" }
    ],
    tips: [
      "Check highlighted fields for errors",
      "Make sure all required fields are filled",
      "Follow the format examples provided"
    ]
  },
  permission: {
    title: "Access Denied",
    description: "You don't have permission to perform this action.",
    severity: "medium",
    icon: "permission",
    recoveryActions: [
      { label: "Sign In", action: "signIn", primary: true },
      { label: "Request Access", action: "requestAccess" },
      { label: "Go Back", action: "goBack" }
    ],
    tips: [
      "Make sure you're signed in to your account",
      "Contact an administrator for access",
      "Check if your session has expired"
    ]
  },
  server: {
    title: "Server Error",
    description: "Something went wrong on our end. Our team has been notified.",
    severity: "high",
    icon: "server",
    recoveryActions: [
      { label: "Try Again", action: "retry", primary: true },
      { label: "Report Issue", action: "report" },
      { label: "Go Home", action: "goHome" }
    ],
    tips: [
      "This is usually temporary - try again in a few minutes",
      "Clear your browser cache if the problem persists",
      "Contact support with error details if needed"
    ]
  },
  timeout: {
    title: "Request Timeout",
    description: "The request took too long to complete. This might be due to a slow connection or server load.",
    severity: "medium",
    icon: "timeout",
    recoveryActions: [
      { label: "Try Again", action: "retry", primary: true },
      { label: "Simplify Request", action: "simplify" },
      { label: "Try Later", action: "tryLater" }
    ],
    tips: [
      "Try breaking large requests into smaller ones",
      "Check your internet connection speed",
      "Server might be experiencing high load"
    ]
  }
};

// Main Error Recovery Component
export const ErrorRecovery = forwardRef(({
  error,
  errorType = "generic",
  title,
  description,
  severity,
  recoveryActions = [],
  tips = [],
  onAction,
  showDetails = false,
  className,
  ...props
}, ref) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Get error configuration
  const config = errorConfigurations[errorType] || errorConfigurations.generic;
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalSeverity = severity || config.severity;
  const finalRecoveryActions = recoveryActions.length > 0 ? recoveryActions : config.recoveryActions;
  const finalTips = tips.length > 0 ? tips : config.tips;

  const handleAction = async (action) => {
    if (action === 'retry') {
      setIsRetrying(true);
      try {
        await onAction?.(action);
      } finally {
        setIsRetrying(false);
      }
    } else {
      onAction?.(action);
    }
  };

  return (
    <div ref={ref} className={`${className || ''}`} {...props}>
      <div className={errorRecoveryVariants({ severity: finalSeverity })}>
        {/* Header */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-[var(--feedback-error)]">
            {ErrorIcons[config.icon]}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              {finalTitle}
            </h3>
            
            <p className="text-[var(--text-secondary)] mb-4">
              {finalDescription}
            </p>

            {/* Recovery Actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {finalRecoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleAction(action.action)}
                  disabled={isRetrying && action.action === 'retry'}
                  className={action.primary ? "" : ""}
                >
                  {isRetrying && action.action === 'retry' ? 'Retrying...' : action.label}
                </Button>
              ))}
            </div>

            {/* Tips */}
            {finalTips.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  What you can try:
                </h4>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  {finalTips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-[var(--interactive-primary)] mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Details Toggle */}
            {(showDetails || error) && (
              <div className="border-t border-[var(--border-primary)] pt-3">
                <button
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="text-sm text-[var(--interactive-primary)] hover:underline"
                >
                  {showErrorDetails ? 'Hide' : 'Show'} technical details
                </button>
                
                {showErrorDetails && error && (
                  <div className="mt-2 p-3 bg-[var(--background-muted)] rounded-[var(--radius)] border">
                    <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap overflow-auto">
                      {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ErrorRecovery.displayName = 'ErrorRecovery';

// Inline Error Recovery (for forms and smaller components)
export const InlineErrorRecovery = forwardRef(({
  error,
  onRetry,
  onDismiss,
  className,
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`flex items-center justify-between p-3 bg-[var(--feedback-error-bg)] border border-[var(--feedback-error)] rounded-[var(--radius)] ${className || ''}`} {...props}>
      <div className="flex items-center space-x-2">
        <svg className="h-4 w-4 text-[var(--feedback-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="text-sm text-[var(--feedback-error)]">
          {error || "Something went wrong"}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-[var(--interactive-primary)] hover:underline"
          >
            Try again
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

InlineErrorRecovery.displayName = 'InlineErrorRecovery';

// Error Boundary with Recovery
export class ErrorBoundaryWithRecovery extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorRecovery
          errorType="server"
          error={this.state.error?.toString()}
          recoveryActions={[
            { label: "Try Again", action: "retry", primary: true },
            { label: "Reload Page", action: "reload" },
            { label: "Go Home", action: "home" }
          ]}
          onAction={(action) => {
            switch (action) {
              case 'retry':
                this.handleRetry();
                break;
              case 'reload':
                window.location.reload();
                break;
              case 'home':
                window.location.href = '/';
                break;
            }
          }}
          showDetails={true}
        />
      );
    }

    return this.props.children;
  }
}

export default {
  ErrorRecovery,
  InlineErrorRecovery,
  ErrorBoundaryWithRecovery
};