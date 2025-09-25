"use client";

import React from 'react';
import { cva } from '../../utils/cn';
import { useAccessibility } from './AccessibilityProvider';

// Touch target variants ensuring minimum 44px size
const touchTargetVariants = cva(
  [
    'inline-flex items-center justify-center',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--focus-ring)]',
    'touch-manipulation select-none',
    'relative'
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'min-h-[44px] min-w-[44px] p-2',      // Meets 44px minimum
        md: 'min-h-[48px] min-w-[48px] p-3',      // Comfortable default
        lg: 'min-h-[56px] min-w-[56px] p-4',      // Large touch targets
        xl: 'min-h-[64px] min-w-[64px] p-5'       // Extra large for accessibility
      },
      variant: {
        button: [
          'rounded-[var(--radius-md)]',
          'bg-[var(--interactive-primary)]',
          'text-white',
          'hover:bg-[var(--interactive-primary-hover)]',
          'active:bg-[var(--interactive-primary-active)]',
          'disabled:bg-[var(--interactive-primary-disabled)]'
        ].join(' '),
        icon: [
          'rounded-[var(--radius)]',
          'text-[var(--text-primary)]',
          'hover:bg-[var(--interactive-secondary)]',
          'active:bg-[var(--interactive-secondary-active)]'
        ].join(' '),
        link: [
          'rounded-[var(--radius)]',
          'text-[var(--interactive-primary)]',
          'hover:bg-[var(--interactive-secondary)]',
          'underline-offset-4 hover:underline'
        ].join(' '),
        invisible: [
          'rounded-[var(--radius)]',
          'hover:bg-[var(--interactive-secondary)]'
        ].join(' ')
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'button'
    }
  }
);

/**
 * TouchTarget Component
 * Ensures all interactive elements meet minimum touch target size requirements
 * Automatically adjusts based on user accessibility preferences
 */
const TouchTarget = ({ 
  children, 
  size: propSize,
  variant = 'button',
  className,
  disabled = false,
  as: Component = 'div',
  'aria-label': ariaLabel,
  ...props 
}) => {
  const { touchTargetSize } = useAccessibility();
  
  // Determine effective size based on user preference
  const getEffectiveSize = () => {
    if (propSize) return propSize;
    
    switch (touchTargetSize) {
      case 'large': return 'lg';
      case 'extra-large': return 'xl';
      default: return 'md';
    }
  };

  const effectiveSize = getEffectiveSize();

  return (
    <Component
      className={touchTargetVariants({ 
        size: effectiveSize, 
        variant,
        className 
      })}
      {...(disabled && { 'aria-disabled': true })}
      {...(ariaLabel && { 'aria-label': ariaLabel })}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * TouchButton Component
 * Button optimized for touch interactions with proper sizing
 */
const TouchButton = ({ 
  children, 
  size,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  className,
  ...props 
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <TouchTarget
      variant="button"
      size={size}
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
    </TouchTarget>
  );
};

/**
 * TouchIconButton Component
 * Icon button with proper touch target sizing
 */
const TouchIconButton = ({ 
  icon: Icon,
  label,
  size,
  onClick,
  disabled = false,
  className,
  ...props 
}) => {
  return (
    <TouchButton
      size={size}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${className} text-[var(--text-primary)] hover:text-[var(--interactive-primary)]`}
      {...props}
    >
      {typeof Icon === 'function' ? (
        <Icon className="h-5 w-5" aria-hidden="true" />
      ) : (
        Icon
      )}
      <span className="sr-only">{label}</span>
    </TouchButton>
  );
};

/**
 * TouchLink Component
 * Link with proper touch target sizing
 */
const TouchLink = ({ 
  children,
  href,
  size,
  external = false,
  className,
  ...props 
}) => {
  const linkProps = external ? {
    target: '_blank',
    rel: 'noopener noreferrer'
  } : {};

  return (
    <TouchTarget
      as="a"
      href={href}
      variant="link"
      size={size}
      className={className}
      {...linkProps}
      {...props}
    >
      {children}
      {external && (
        <svg 
          className="ml-1 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
          />
        </svg>
      )}
    </TouchTarget>
  );
};

/**
 * TouchArea Component
 * Invisible touch area for expanding touch targets
 */
const TouchArea = ({ 
  children,
  expandBy = 12, // pixels to expand touch area
  className,
  ...props 
}) => {
  return (
    <div
      className={`relative ${className}`}
      style={{
        padding: `${expandBy}px`,
        margin: `-${expandBy}px`
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * useTouchTarget Hook
 * Provides touch target utilities and sizing information
 */
const useTouchTarget = () => {
  const { touchTargetSize } = useAccessibility();
  
  const getSizeClass = (baseSize = 'md') => {
    switch (touchTargetSize) {
      case 'large': 
        return baseSize === 'sm' ? 'md' : baseSize === 'md' ? 'lg' : 'xl';
      case 'extra-large':
        return baseSize === 'sm' ? 'lg' : baseSize === 'md' ? 'xl' : 'xl';
      default:
        return baseSize;
    }
  };

  const getMinSize = () => {
    switch (touchTargetSize) {
      case 'large': return 56;
      case 'extra-large': return 64;
      default: return 44;
    }
  };

  return {
    touchTargetSize,
    getSizeClass,
    getMinSize,
    isLargeTargets: touchTargetSize !== 'normal'
  };
};

export default TouchTarget;
export { 
  TouchTarget,
  TouchButton,
  TouchIconButton,
  TouchLink,
  TouchArea,
  useTouchTarget,
  touchTargetVariants
};