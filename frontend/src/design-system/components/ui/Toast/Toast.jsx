"use client";

import React, { createContext, useContext, useState, useEffect, forwardRef } from 'react';
import { cva } from '../../../utils/cn';

// Toast context
const ToastContext = createContext();

// Toast variant configurations
const toastVariants = cva(
  [
    'relative flex items-start p-4 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]',
    'border border-[var(--border-primary)]',
    'backdrop-blur-sm',
    'transition-all duration-300 ease-out',
    'animate-in slide-in-from-right-full fade-in duration-300'
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--background-primary)]/95',
          'text-[var(--text-primary)]',
          'border-[var(--border-primary)]'
        ].join(' '),
        success: [
          'bg-[var(--feedback-success-bg)]/95',
          'text-[var(--feedback-success-text)]',
          'border-[var(--feedback-success)]'
        ].join(' '),
        error: [
          'bg-[var(--feedback-error-bg)]/95',
          'text-[var(--feedback-error-text)]',
          'border-[var(--feedback-error)]'
        ].join(' '),
        warning: [
          'bg-[var(--feedback-warning-bg)]/95',
          'text-[var(--feedback-warning-text)]',
          'border-[var(--feedback-warning)]'
        ].join(' '),
        info: [
          'bg-[var(--interactive-primary-bg)]/95',
          'text-[var(--interactive-primary-text)]',
          'border-[var(--interactive-primary)]'
        ].join(' ')
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// Icons for different toast types
const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const InformationCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XMarkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Get icon for toast variant
const getToastIcon = (variant) => {
  const iconProps = { className: "h-5 w-5 flex-shrink-0" };
  
  switch (variant) {
    case 'success':
      return <CheckCircleIcon {...iconProps} />;
    case 'error':
      return <XCircleIcon {...iconProps} />;
    case 'warning':
      return <ExclamationTriangleIcon {...iconProps} />;
    case 'info':
      return <InformationCircleIcon {...iconProps} />;
    default:
      return <InformationCircleIcon {...iconProps} />;
  }
};

// Individual Toast component
const Toast = forwardRef(({
  id,
  variant = 'default',
  title,
  description,
  action,
  onClose,
  duration = 5000,
  persistent = false,
  className,
  ...props
}, ref) => {
  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onClose]);

  return (
    <div
      ref={ref}
      className={toastVariants({ variant, className })}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {/* Icon */}
      <div className="mr-3 mt-0.5">
        {getToastIcon(variant)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold">
            {title}
          </p>
        )}
        {description && (
          <p className={`text-sm ${title ? 'mt-1' : ''}`}>
            {description}
          </p>
        )}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        className="ml-4 flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
        onClick={() => onClose?.(id)}
        aria-label="Close notification"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
});

Toast.displayName = 'Toast';

// Toast container component
const ToastContainer = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now().toString();
    const newToast = { id, ...toast };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    // Convenience methods
    success: (title, description, options = {}) => 
      addToast({ variant: 'success', title, description, ...options }),
    error: (title, description, options = {}) => 
      addToast({ variant: 'error', title, description, ...options }),
    warning: (title, description, options = {}) => 
      addToast({ variant: 'warning', title, description, ...options }),
    info: (title, description, options = {}) => 
      addToast({ variant: 'info', title, description, ...options }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;
export { Toast, ToastContainer, toastVariants };