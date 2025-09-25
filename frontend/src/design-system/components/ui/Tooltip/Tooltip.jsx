"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '../../../utils/cn';

/**
 * Tooltip Component
 * Provides contextual information with 0.3s delay and smooth animations
 * Supports multiple positions and accessibility features
 */
const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 300,
  className,
  disabled = false,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const showTooltip = () => {
    if (disabled) return;
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsAnimating(false);
    
    // Allow animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      hideTooltip();
    }
  };

  // Add global escape key listener when tooltip is visible
  useEffect(() => {
    if (isVisible) {
      const handleGlobalKeyDown = (event) => {
        if (event.key === 'Escape') {
          hideTooltip();
        }
      };
      
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    'top-start': 'bottom-full left-0 mb-2',
    'top-end': 'bottom-full right-0 mb-2',
    'bottom-start': 'top-full left-0 mt-2',
    'bottom-end': 'top-full right-0 mt-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-neutral-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-neutral-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-neutral-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-neutral-900',
    'top-start': 'top-full left-3 border-l-transparent border-r-transparent border-b-transparent border-t-neutral-900',
    'top-end': 'top-full right-3 border-l-transparent border-r-transparent border-b-transparent border-t-neutral-900',
    'bottom-start': 'bottom-full left-3 border-l-transparent border-r-transparent border-t-transparent border-b-neutral-900',
    'bottom-end': 'bottom-full right-3 border-l-transparent border-r-transparent border-t-transparent border-b-neutral-900',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onKeyDown={handleKeyDown}
      ref={triggerRef}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            // Base styles
            'absolute z-tooltip px-3 py-2 text-sm font-medium text-white',
            'bg-neutral-900 rounded-md shadow-lg',
            'pointer-events-none select-none',
            'max-w-xs break-words',
            // Position
            positionClasses[position],
            // Animation
            isAnimating ? 'animate-tooltip-in' : 'animate-tooltip-out',
            className
          )}
          role="tooltip"
          aria-hidden={!isVisible}
          {...props}
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
};

/**
 * TooltipProvider - Context provider for tooltip configuration
 */
export const TooltipProvider = ({ children, defaultDelay = 300 }) => {
  return (
    <div data-tooltip-delay={defaultDelay}>
      {children}
    </div>
  );
};

/**
 * TooltipTrigger - Wrapper for tooltip trigger elements
 */
export const TooltipTrigger = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn('inline-block', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * TooltipContent - Styled tooltip content wrapper
 */
export const TooltipContent = ({ 
  children, 
  className, 
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-neutral-900 text-white',
    light: 'bg-white text-neutral-900 border border-neutral-200 shadow-lg',
    primary: 'bg-primary-500 text-white',
    accent: 'bg-accent-500 text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    error: 'bg-error-500 text-white',
  };

  return (
    <div 
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-md',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Tooltip;