"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';

/**
 * MicroFeedback Component
 * Provides instant visual feedback for user actions
 */
export const MicroFeedback = ({ 
  children, 
  type = 'default',
  trigger = 'click',
  duration = 600,
  className,
  disabled = false,
  onFeedback,
  ...props 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef(null);
  const timeoutRef = useRef(null);

  const triggerFeedback = () => {
    if (disabled || isAnimating) return;

    setIsAnimating(true);
    onFeedback?.(type);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  };

  const handleInteraction = (event) => {
    if (trigger === 'click' && event.type === 'click') {
      triggerFeedback();
    } else if (trigger === 'hover' && event.type === 'mouseenter') {
      triggerFeedback();
    } else if (trigger === 'focus' && event.type === 'focus') {
      triggerFeedback();
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const feedbackClasses = {
    default: isAnimating ? 'animate-button-press' : '',
    success: isAnimating ? 'animate-success-pulse' : '',
    error: isAnimating ? 'animate-error-shake' : '',
    ripple: isAnimating ? 'animate-ripple' : '',
    scale: isAnimating ? 'animate-button-press' : '',
    glow: isAnimating ? 'shadow-lg shadow-primary/30' : '',
  };

  const eventHandlers = {
    ...(trigger === 'click' && { onClick: handleInteraction }),
    ...(trigger === 'hover' && { onMouseEnter: handleInteraction }),
    ...(trigger === 'focus' && { onFocus: handleInteraction }),
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative transition-all duration-200',
        feedbackClasses[type],
        className
      )}
      {...eventHandlers}
      {...props}
    >
      {children}
      
      {/* Ripple effect overlay */}
      {type === 'ripple' && isAnimating && (
        <div className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-white/30 rounded-full animate-ripple" />
        </div>
      )}
    </div>
  );
};

/**
 * ButtonFeedback - Specialized feedback for buttons
 */
export const ButtonFeedback = ({ 
  children, 
  variant = 'press',
  className,
  ...props 
}) => {
  return (
    <MicroFeedback
      type={variant}
      trigger="click"
      className={cn('btn-animated', className)}
      {...props}
    >
      {children}
    </MicroFeedback>
  );
};

/**
 * FormFeedback - Feedback for form interactions
 */
export const FormFeedback = ({ 
  children, 
  success = false,
  error = false,
  className,
  ...props 
}) => {
  const feedbackType = error ? 'error' : success ? 'success' : 'default';
  
  return (
    <MicroFeedback
      type={feedbackType}
      trigger="focus"
      className={cn('input-animated', className)}
      {...props}
    >
      {children}
    </MicroFeedback>
  );
};

/**
 * CardFeedback - Feedback for card interactions
 */
export const CardFeedback = ({ 
  children, 
  interactive = true,
  className,
  ...props 
}) => {
  if (!interactive) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <MicroFeedback
      type="default"
      trigger="hover"
      className={cn('card-animated', className)}
      {...props}
    >
      {children}
    </MicroFeedback>
  );
};

/**
 * LinkFeedback - Feedback for link interactions
 */
export const LinkFeedback = ({ 
  children, 
  underline = true,
  className,
  ...props 
}) => {
  return (
    <MicroFeedback
      type="default"
      trigger="hover"
      className={cn(
        'link-animated',
        underline && 'hover:underline underline-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </MicroFeedback>
  );
};

/**
 * RippleButton - Button with ripple effect
 */
export const RippleButton = ({ 
  children, 
  className,
  onClick,
  ...props 
}) => {
  const handleClick = (event) => {
    onClick?.(event);
  };

  return (
    <MicroFeedback
      type="ripple"
      trigger="click"
      className={cn(
        'relative overflow-hidden',
        'transition-all duration-200 ease-out',
        'active:scale-95',
        className
      )}
      onFeedback={handleClick}
      {...props}
    >
      {children}
    </MicroFeedback>
  );
};

/**
 * PulseIndicator - Pulsing indicator for notifications
 */
export const PulseIndicator = ({ 
  active = true,
  color = 'primary',
  size = 'md',
  className,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  return (
    <div
      className={cn(
        'rounded-full',
        sizeClasses[size],
        colorClasses[color],
        active && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
};

/**
 * LoadingDots - Animated loading dots
 */
export const LoadingDots = ({ 
  count = 3,
  size = 'md',
  color = 'primary',
  className,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    neutral: 'bg-neutral-500',
  };

  return (
    <div 
      className={cn('flex items-center space-x-1', className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-bounce',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${index * 100}ms`,
            animationDuration: '600ms',
          }}
        />
      ))}
    </div>
  );
};

export default MicroFeedback;