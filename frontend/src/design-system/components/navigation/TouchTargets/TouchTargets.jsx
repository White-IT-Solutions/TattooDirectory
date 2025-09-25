/**
 * Touch Targets Component
 * 
 * Ensures all interactive elements meet touch accessibility standards
 * with proper target sizes and spacing for mobile devices.
 * 
 * Requirements: 8.2, 8.4
 */

"use client";

import React from 'react';
import { deviceCapabilities } from '../../../../lib/device-capabilities';

// Touch target size constants (following WCAG guidelines)
const TOUCH_TARGET_SIZES = {
  minimum: '44px', // WCAG minimum
  comfortable: '48px', // Recommended comfortable size
  large: '56px' // Large touch targets for primary actions
};

const TouchTarget = ({ 
  children, 
  size = 'minimum',
  spacing = '8px',
  className = '',
  onClick,
  onTouchStart,
  onTouchEnd,
  disabled = false,
  ...props 
}) => {
  const isMobile = deviceCapabilities.isMobile();
  const hasTouch = deviceCapabilities.hasTouch();

  // Apply touch-friendly styles only on touch devices
  const touchStyles = hasTouch ? {
    minWidth: TOUCH_TARGET_SIZES[size],
    minHeight: TOUCH_TARGET_SIZES[size],
    margin: spacing,
    padding: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent', // Remove iOS tap highlight
    touchAction: 'manipulation', // Prevent double-tap zoom
    transition: 'all 0.15s ease-in-out'
  } : {};

  const handleTouchStart = (e) => {
    if (!hasTouch) return;
    
    // Add visual feedback for touch
    e.currentTarget.style.transform = 'scale(0.95)';
    e.currentTarget.style.opacity = '0.8';
    
    onTouchStart?.(e);
  };

  const handleTouchEnd = (e) => {
    if (!hasTouch) return;
    
    // Remove visual feedback
    e.currentTarget.style.transform = '';
    e.currentTarget.style.opacity = '';
    
    onTouchEnd?.(e);
  };

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <div
      className={`touch-target ${className} ${disabled ? 'disabled' : ''}`}
      style={touchStyles}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
};

// Higher-order component to wrap existing buttons with touch targets
export const withTouchTarget = (Component, options = {}) => {
  return React.forwardRef((props, ref) => {
    const { size = 'minimum', spacing = '8px', ...restOptions } = options;
    
    return (
      <TouchTarget size={size} spacing={spacing} {...restOptions}>
        <Component ref={ref} {...props} />
      </TouchTarget>
    );
  });
};

// Pre-configured touch target variants
export const TouchButton = ({ children, variant = 'primary', size = 'minimum', ...props }) => (
  <TouchTarget 
    size={size}
    className={`touch-button touch-button--${variant}`}
    {...props}
  >
    {children}
  </TouchTarget>
);

export const TouchIconButton = ({ icon, label, size = 'comfortable', ...props }) => (
  <TouchTarget 
    size={size}
    className="touch-icon-button"
    aria-label={label}
    {...props}
  >
    {icon}
  </TouchTarget>
);

export const TouchLink = ({ children, href, size = 'minimum', ...props }) => (
  <TouchTarget 
    size={size}
    className="touch-link"
    as="a"
    href={href}
    {...props}
  >
    {children}
  </TouchTarget>
);

export default TouchTarget;