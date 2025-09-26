"use client";

import React, { forwardRef, useState } from 'react';
import { cva } from '../../../utils/cn';

// Input variant configurations using our design system
const inputVariants = cva(
  // Base styles - common to all inputs with enhanced micro-interactions
  [
    'w-full transition-all duration-150 ease-out',
    'font-family-body text-[var(--typography-body-size)]',
    'placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--focus-ring-offset)]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--background-muted)]',
    'border border-[var(--border-primary)]',
    'bg-[var(--background-primary)]',
    'text-[var(--text-primary)]',
    // Enhanced hover and focus states
    'hover:border-[var(--border-strong)]',
    'focus:border-[var(--interactive-primary)]',
    'focus:shadow-sm',
    // Smooth placeholder transitions
    'placeholder:transition-colors placeholder:duration-200',
    'focus:placeholder:text-[var(--text-subtle)]'
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'border-[var(--border-primary)]',
          'hover:border-[var(--border-strong)]',
          'focus:border-[var(--interactive-primary)]'
        ].join(' '),
        error: [
          'border-[var(--feedback-error)]',
          'bg-[var(--feedback-error-bg)]',
          'hover:border-[var(--color-error-600)]',
          'focus:border-[var(--feedback-error)]',
          'focus:ring-[var(--feedback-error)]'
        ].join(' '),
        success: [
          'border-[var(--feedback-success)]',
          'bg-[var(--feedback-success-bg)]',
          'hover:border-[var(--color-success-600)]',
          'focus:border-[var(--feedback-success)]',
          'focus:ring-[var(--feedback-success)]'
        ].join(' '),
        warning: [
          'border-[var(--feedback-warning)]',
          'bg-[var(--feedback-warning-bg)]',
          'hover:border-[var(--color-warning-600)]',
          'focus:border-[var(--feedback-warning)]',
          'focus:ring-[var(--feedback-warning)]'
        ].join(' ')
      },
      size: {
        sm: [
          'h-[var(--input-height-sm)]',
          'px-[var(--input-padding-x)]',
          'text-[var(--font-size-sm)]',
          'rounded-[var(--radius)]'
        ].join(' '),
        md: [
          'h-[var(--input-height-md)]',
          'px-[var(--input-padding-x)]',
          'text-[var(--typography-body-size)]',
          'rounded-[var(--input-radius)]'
        ].join(' '),
        lg: [
          'h-[var(--input-height-lg)]',
          'px-[var(--spacing-4)]',
          'text-[var(--font-size-lg)]',
          'rounded-[var(--radius-md)]'
        ].join(' ')
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

// Label styles
const labelVariants = cva(
  [
    'block font-semibold',
    'text-[var(--typography-label-size)]',
    'font-weight-[var(--typography-label-weight)]',
    'line-height-[var(--typography-label-line-height)]',
    'letter-spacing-[var(--typography-label-letter-spacing)]'
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'text-[var(--text-primary)]',
        error: 'text-[var(--feedback-error)]',
        success: 'text-[var(--feedback-success)]',
        warning: 'text-[var(--feedback-warning)]'
      },
      size: {
        sm: 'mb-1',
        md: 'mb-1.5',
        lg: 'mb-2'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

// Help text styles
const helpTextVariants = cva(
  [
    'text-[var(--typography-caption-size)]',
    'font-weight-[var(--typography-caption-weight)]',
    'line-height-[var(--typography-caption-line-height)]'
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'text-[var(--text-secondary)]',
        error: 'text-[var(--feedback-error)]',
        success: 'text-[var(--feedback-success)]',
        warning: 'text-[var(--feedback-warning)]'
      },
      size: {
        sm: 'mt-1',
        md: 'mt-1.5',
        lg: 'mt-2'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

// Icon components for different input types
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Main Input component
const Input = forwardRef(({ 
  className,
  type = 'text',
  variant = 'default',
  size = 'md',
  label,
  helpText,
  error,
  success,
  warning,
  required = false,
  disabled = false,
  id,
  name,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  'aria-describedby': ariaDescribedBy,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine the actual input type
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Determine variant based on validation states
  const resolvedVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;

  // Generate unique IDs if not provided - use useId for SSR compatibility
  const generatedId = React.useId();
  const inputId = id || `input-${generatedId}`;
  const helpTextId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  // Build aria-describedby
  const describedBy = [
    ariaDescribedBy,
    helpText && helpTextId,
    error && errorId
  ].filter(Boolean).join(' ') || undefined;

  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Icon size based on input size
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size];

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={labelVariants({ variant: resolvedVariant, size })}
        >
          {label}
          {required && (
            <span className="text-[var(--feedback-error)] ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Search Icon (left side) */}
        {type === 'search' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className={`${iconSize} text-[var(--text-muted)]`} />
          </div>
        )}

        {/* Input Element */}
        <input
          ref={ref}
          type={inputType}
          id={inputId}
          name={name}
          className={inputVariants({ 
            variant: resolvedVariant, 
            size, 
            className: [
              className,
              type === 'search' && 'pl-10', // Add left padding for search icon
              type === 'password' && 'pr-10' // Add right padding for password toggle
            ].filter(Boolean).join(' ')
          })}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          {...props}
        />

        {/* Password Toggle Button (right side) */}
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOffIcon className={`${iconSize} text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors`} />
            ) : (
              <EyeIcon className={`${iconSize} text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors`} />
            )}
          </button>
        )}
      </div>

      {/* Help Text / Error Message / Success / Warning */}
      {(helpText || error || success || warning) && (
        <div 
          id={error ? errorId : helpTextId}
          className={helpTextVariants({ variant: resolvedVariant, size })}
          role={error ? 'alert' : undefined}
        >
          {error || success || warning || helpText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Specialized input components
const TextInput = forwardRef((props, ref) => (
  <Input ref={ref} type="text" {...props} />
));
TextInput.displayName = 'TextInput';

const EmailInput = forwardRef((props, ref) => (
  <Input ref={ref} type="email" {...props} />
));
EmailInput.displayName = 'EmailInput';

const PasswordInput = forwardRef((props, ref) => (
  <Input ref={ref} type="password" {...props} />
));
PasswordInput.displayName = 'PasswordInput';

const SearchInput = forwardRef((props, ref) => (
  <Input ref={ref} type="search" {...props} />
));
SearchInput.displayName = 'SearchInput';

export default Input;
export { 
  Input,
  TextInput,
  EmailInput,
  PasswordInput,
  SearchInput,
  inputVariants,
  labelVariants,
  helpTextVariants
};