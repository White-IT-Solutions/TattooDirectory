"use client";

import { forwardRef } from 'react';
import { cva } from '../../../utils/cn';

// Tag variant configurations using our design system
const tagVariants = cva(
  // Base styles - common to all tags
  [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200 ease-out',
    'border select-none cursor-default',
    'whitespace-nowrap'
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'text-[var(--interactive-primary)]',
          'bg-[var(--color-primary-50)]',
          'border-[var(--color-primary-200)]',
          'hover:bg-[var(--color-primary-100)]'
        ].join(' '),
        secondary: [
          'text-[var(--text-primary)]',
          'bg-[var(--background-secondary)]',
          'border-[var(--border-secondary)]',
          'hover:bg-[var(--background-tertiary)]'
        ].join(' '),
        accent: [
          'text-[var(--interactive-accent)]',
          'bg-[var(--color-accent-50)]',
          'border-[var(--color-accent-200)]',
          'hover:bg-[var(--color-accent-100)]'
        ].join(' '),
        success: [
          'text-[var(--feedback-success)]',
          'bg-[var(--color-success-50)]',
          'border-[var(--color-success-200)]',
          'hover:bg-[var(--color-success-100)]'
        ].join(' '),
        warning: [
          'text-[var(--feedback-warning)]',
          'bg-[var(--color-warning-50)]',
          'border-[var(--color-warning-200)]',
          'hover:bg-[var(--color-warning-100)]'
        ].join(' '),
        error: [
          'text-[var(--feedback-error)]',
          'bg-[var(--color-error-50)]',
          'border-[var(--color-error-200)]',
          'hover:bg-[var(--color-error-100)]'
        ].join(' '),
        neutral: [
          'text-[var(--text-secondary)]',
          'bg-[var(--color-neutral-100)]',
          'border-[var(--color-neutral-200)]',
          'hover:bg-[var(--color-neutral-200)]'
        ].join(' ')
      },
      size: {
        sm: [
          'h-6 px-2 text-xs',
          'rounded-[var(--radius)]',
          'gap-1'
        ].join(' '),
        md: [
          'h-7 px-2.5 text-sm',
          'rounded-[var(--radius-md)]',
          'gap-1.5'
        ].join(' '),
        lg: [
          'h-8 px-3 text-sm',
          'rounded-[var(--radius-md)]',
          'gap-2'
        ].join(' ')
      },
      removable: {
        true: 'pr-1',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      removable: false
    }
  }
);

// Remove button styles
const removeButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full transition-all duration-150 ease-out',
    'hover:bg-black/10 active:bg-black/20',
    'focus:outline-none focus:ring-1 focus:ring-current',
    'ml-1'
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-5 w-5'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
);

// Icon component for tags
const TagIcon = ({ size = 'md', children, className = '' }) => {
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4'
  };

  return (
    <span 
      className={`${iconSizes[size]} ${className} inline-flex items-center justify-center`} 
      style={{ lineHeight: '1' }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
};

// Remove button component
const RemoveButton = ({ size = 'md', onRemove, ariaLabel, className = '' }) => {
  return (
    <button
      type="button"
      className={removeButtonVariants({ size, className })}
      onClick={onRemove}
      aria-label={ariaLabel || 'Remove tag'}
      tabIndex={0}
    >
      <svg
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
};

const Tag = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md',
  icon,
  removable = false,
  onRemove,
  removeAriaLabel,
  children,
  ...props 
}, ref) => {
  const handleKeyDown = (event) => {
    // Allow removal with Delete or Backspace keys when focused
    if (removable && onRemove && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      onRemove();
    }
  };

  return (
    <span
      className={tagVariants({ variant, size, removable, className })}
      ref={ref}
      onKeyDown={handleKeyDown}
      tabIndex={removable ? 0 : undefined}
      role={removable ? 'button' : undefined}
      aria-label={removable ? `${children} (removable)` : undefined}
      {...props}
    >
      {icon && (
        <TagIcon size={size}>
          {icon}
        </TagIcon>
      )}
      <span>{children}</span>
      {removable && onRemove && (
        <RemoveButton
          size={size}
          onRemove={onRemove}
          ariaLabel={removeAriaLabel || `Remove ${children}`}
        />
      )}
    </span>
  );
});

Tag.displayName = 'Tag';

export default Tag;
export { Tag, tagVariants, TagIcon, RemoveButton };