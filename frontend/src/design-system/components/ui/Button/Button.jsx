"use client";

import { forwardRef } from 'react';
import { cva } from '../../../utils/cn';
import { ButtonFeedback } from '../../feedback/MicroFeedback/MicroFeedback';
import { useStandardizedProps } from '../../StandardizedComponent';
import { generateComponentClasses, applyVisualEffects } from '../../../utils/design-system-utils';

// Button variant configurations using our design system
const buttonVariants = cva(
  // Base styles - common to all buttons with enhanced micro-interactions
  [
    'inline-flex items-center justify-center',
    'font-semibold transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none touch-manipulation',
    'border border-transparent',
    // Enhanced hover and active states
    'hover:-translate-y-0.5 hover:shadow-md',
    'active:scale-95 active:translate-y-0',
    // Focus accessibility improvements
    'focus:ring-opacity-50 focus:ring-offset-2',
    // Touch target optimization
    'min-h-[44px] min-w-[44px]'
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'text-white',
          'bg-[var(--interactive-primary)]',
          'hover:bg-[var(--interactive-primary-hover)]',
          'active:bg-[var(--interactive-primary-active)]',
          'focus:ring-[var(--interactive-primary)]',
          'disabled:bg-[var(--interactive-primary-disabled)]'
        ].join(' '),
        secondary: [
          'text-[var(--text-primary)]',
          'bg-[var(--interactive-secondary)]',
          'border-[var(--border-primary)]',
          'hover:bg-[var(--interactive-secondary-hover)]',
          'active:bg-[var(--interactive-secondary-active)]',
          'focus:ring-[var(--interactive-primary)]',
          'disabled:bg-[var(--interactive-secondary-disabled)]'
        ].join(' '),
        outline: [
          'text-[var(--interactive-primary)]',
          'bg-transparent',
          'border-2 border-[var(--interactive-primary)]',
          'hover:bg-[var(--interactive-primary)] hover:text-white',
          'active:bg-[var(--interactive-primary-active)] active:text-white',
          'focus:ring-[var(--interactive-primary)]',
          'disabled:border-[var(--interactive-primary-disabled)] disabled:text-[var(--interactive-primary-disabled)]'
        ].join(' '),
        ghost: [
          'text-[var(--interactive-primary)]',
          'bg-transparent',
          'hover:bg-[var(--interactive-secondary)]',
          'active:bg-[var(--interactive-secondary-active)]',
          'focus:ring-[var(--interactive-primary)]',
          'disabled:text-[var(--interactive-primary-disabled)]'
        ].join(' '),
        destructive: [
          'text-white',
          'bg-[var(--feedback-error)]',
          'hover:bg-[var(--color-error-600)]',
          'active:bg-[var(--color-error-700)]',
          'focus:ring-[var(--feedback-error)]',
          'disabled:bg-[var(--color-error-300)]'
        ].join(' '),
        accent: [
          'text-white',
          'bg-[var(--interactive-accent)]',
          'hover:bg-[var(--interactive-accent-hover)]',
          'active:bg-[var(--interactive-accent-active)]',
          'focus:ring-[var(--interactive-accent)]',
          'disabled:bg-[var(--interactive-accent-disabled)]'
        ].join(' ')
      },
      size: {
        sm: [
          'h-8 px-3 text-sm',
          'rounded-[var(--radius)]',
          'min-w-[4rem]'
        ].join(' '),
        md: [
          'h-10 px-4 text-base',
          'rounded-[var(--radius-md)]',
          'min-w-[5rem]'
        ].join(' '),
        lg: [
          'h-12 px-6 text-lg',
          'rounded-[var(--radius-lg)]',
          'min-w-[6rem]'
        ].join(' ')
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

// Loading spinner component
const LoadingSpinner = ({ size = 'md' }) => {
  const spinnerSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <svg 
      className={`animate-spin ${spinnerSizes[size]}`}
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  );
};

const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  children,
  type = 'button',
  withFeedback = true,
  feedbackType = 'press',
  ...props 
}, ref) => {
  // Apply standardized design system integration
  const standardizedProps = useStandardizedProps('button', {
    className,
    variant,
    size,
    loading,
    disabled,
    withFeedback,
    feedbackType,
    ...props
  });

  const isDisabled = standardizedProps.disabled || standardizedProps.loading;

  // Generate design system classes
  const designSystemClasses = generateComponentClasses(standardizedProps);
  const visualEffectsClasses = applyVisualEffects(standardizedProps);

  const buttonContent = (
    <button
      className={buttonVariants({ 
        variant: standardizedProps.variant, 
        size: standardizedProps.size, 
        className: `${designSystemClasses} ${visualEffectsClasses} ${standardizedProps.className}` 
      })}
      ref={ref}
      disabled={isDisabled}
      type={type}
      {...(isDisabled && { 'aria-disabled': true })}
      {...standardizedProps}
    >
      {standardizedProps.loading && (
        <LoadingSpinner size={standardizedProps.size} />
      )}
      {standardizedProps.loading && children && (
        <span className="ml-2">{children}</span>
      )}
      {!standardizedProps.loading && children}
    </button>
  );

  // Wrap with micro-feedback if enabled and not disabled
  if (standardizedProps.withFeedback && !isDisabled) {
    return (
      <ButtonFeedback variant={standardizedProps.feedbackType}>
        {buttonContent}
      </ButtonFeedback>
    );
  }

  return buttonContent;
});

Button.displayName = 'Button';

export default Button;
export { buttonVariants };