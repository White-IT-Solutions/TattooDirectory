"use client";

import { forwardRef } from 'react';
import { cva } from '../../../utils/cn';

// Badge variant configurations using our design system
const badgeVariants = cva(
  // Base styles - common to all badges
  [
    'inline-flex items-center justify-center',
    'font-semibold transition-all duration-200 ease-out',
    'border select-none',
    'whitespace-nowrap'
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'text-white',
          'bg-[var(--interactive-primary)]',
          'border-[var(--interactive-primary)]',
          'hover:bg-[var(--interactive-primary-hover)]'
        ].join(' '),
        secondary: [
          'text-[var(--text-primary)]',
          'bg-[var(--interactive-secondary)]',
          'border-[var(--border-primary)]',
          'hover:bg-[var(--interactive-secondary-hover)]'
        ].join(' '),
        accent: [
          'text-white',
          'bg-[var(--interactive-accent)]',
          'border-[var(--interactive-accent)]',
          'hover:bg-[var(--interactive-accent-hover)]'
        ].join(' '),
        success: [
          'text-white',
          'bg-[var(--feedback-success)]',
          'border-[var(--feedback-success)]',
          'hover:bg-[var(--color-success-600)]'
        ].join(' '),
        warning: [
          'text-white',
          'bg-[var(--feedback-warning)]',
          'border-[var(--feedback-warning)]',
          'hover:bg-[var(--color-warning-600)]'
        ].join(' '),
        error: [
          'text-white',
          'bg-[var(--feedback-error)]',
          'border-[var(--feedback-error)]',
          'hover:bg-[var(--color-error-600)]'
        ].join(' '),
        outline: [
          'text-[var(--interactive-primary)]',
          'bg-transparent',
          'border-[var(--interactive-primary)]',
          'hover:bg-[var(--interactive-primary)] hover:text-white'
        ].join(' '),
        ghost: [
          'text-[var(--text-primary)]',
          'bg-[var(--background-secondary)]',
          'border-transparent',
          'hover:bg-[var(--interactive-secondary)]'
        ].join(' ')
      },
      size: {
        sm: [
          'h-5 px-2 text-xs',
          'rounded-[var(--radius)]',
          'gap-1'
        ].join(' '),
        md: [
          'h-6 px-2.5 text-sm',
          'rounded-[var(--radius)]',
          'gap-1.5'
        ].join(' '),
        lg: [
          'h-7 px-3 text-sm',
          'rounded-[var(--radius-md)]',
          'gap-2'
        ].join(' ')
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

// Icon component for badges
const BadgeIcon = ({ size = 'md', children, className = '' }) => {
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

const Badge = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md',
  icon,
  children,
  ...props 
}, ref) => {
  return (
    <span
      className={badgeVariants({ variant, size, className })}
      ref={ref}
      {...props}
    >
      {icon && (
        <BadgeIcon size={size}>
          {icon}
        </BadgeIcon>
      )}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
export { Badge, badgeVariants, BadgeIcon };