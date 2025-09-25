/**
 * Micro-Interactions Component
 * 
 * Provides subtle animations and micro-interactions to enhance user experience
 * including hover effects, focus indicators, and smooth transitions.
 * 
 * Requirements: 3.6, 6.1, 6.2
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../utils/cn';

// Micro-interaction variants
const microInteractionVariants = {
  // Hover animations
  float: 'animate-float hover:animate-float-active',
  breathe: 'animate-breathe hover:animate-breathe-active',
  glowPulse: 'animate-glow-pulse hover:animate-glow-pulse-active',
  shimmer: 'border-shimmer hover:border-shimmer-active',
  
  // Scale effects
  scaleUp: 'transition-transform duration-200 hover:scale-105',
  scaleDown: 'transition-transform duration-200 hover:scale-95',
  
  // Shadow effects
  shadowGrow: 'transition-shadow duration-200 hover:shadow-elevation-raised',
  shadowShrink: 'transition-shadow duration-200 hover:shadow-elevation-surface',
  
  // Color transitions
  colorShift: 'transition-colors duration-200',
  backgroundShift: 'transition-all duration-200',
  
  // Rotation effects
  rotateSlightly: 'transition-transform duration-200 hover:rotate-1',
  rotateMore: 'transition-transform duration-200 hover:rotate-3',
  
  // Slide effects
  slideUp: 'transition-transform duration-200 hover:-translate-y-1',
  slideDown: 'transition-transform duration-200 hover:translate-y-1',
  slideLeft: 'transition-transform duration-200 hover:-translate-x-1',
  slideRight: 'transition-transform duration-200 hover:translate-x-1'
};

// Focus indicator variants
const focusIndicatorVariants = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:ring-offset-2',
  glow: 'focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)]',
  underline: 'focus:outline-none focus:border-b-2 focus:border-[var(--interactive-primary)]',
  background: 'focus:outline-none focus:bg-[var(--interactive-primary)]/10',
  scale: 'focus:outline-none focus:scale-105 transition-transform duration-200'
};

/**
 * Interactive Element with Micro-interactions
 */
export const InteractiveElement = ({
  children,
  animation = 'scaleUp',
  focusStyle = 'ring',
  disabled = false,
  onClick,
  onHover,
  className,
  as: Component = 'div',
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = (e) => {
    if (!disabled) {
      setIsHovered(true);
      onHover?.(e, true);
    }
  };

  const handleMouseLeave = (e) => {
    setIsHovered(false);
    setIsPressed(false);
    onHover?.(e, false);
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClick = (e) => {
    if (!disabled) {
      onClick?.(e);
    }
  };

  return (
    <Component
      className={cn(
        // Base styles
        'cursor-pointer select-none',
        // Animation styles
        microInteractionVariants[animation],
        // Focus styles
        focusIndicatorVariants[focusStyle],
        // State-based styles
        {
          'opacity-50 cursor-not-allowed': disabled,
          'transform scale-95': isPressed && !disabled
        },
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Animated Button with Micro-interactions
 */
export const AnimatedButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  animation = 'scaleUp',
  loading = false,
  disabled = false,
  onClick,
  className,
  ...props
}) => {
  const variants = {
    primary: 'bg-[var(--interactive-primary)] text-white hover:bg-[var(--interactive-primary-hover)]',
    secondary: 'bg-[var(--interactive-secondary)] text-[var(--text-primary)] hover:bg-[var(--interactive-secondary-hover)]',
    outline: 'border-2 border-[var(--interactive-primary)] text-[var(--interactive-primary)] hover:bg-[var(--interactive-primary)] hover:text-white',
    ghost: 'text-[var(--interactive-primary)] hover:bg-[var(--interactive-primary)]/10'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <InteractiveElement
      as="button"
      animation={animation}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        // Base button styles
        'inline-flex items-center justify-center font-semibold rounded-lg',
        'transition-all duration-200',
        // Variant styles
        variants[variant],
        // Size styles
        sizes[size],
        // Loading state
        {
          'cursor-wait': loading
        },
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </InteractiveElement>
  );
};

/**
 * Animated Card with Hover Effects
 */
export const AnimatedCard = ({
  children,
  animation = 'shadowGrow',
  elevation = 'surface',
  className,
  onClick,
  ...props
}) => {
  const elevations = {
    surface: 'shadow-elevation-surface',
    raised: 'shadow-elevation-raised',
    floating: 'shadow-elevation-floating',
    premium: 'shadow-elevation-premium'
  };

  return (
    <InteractiveElement
      animation={animation}
      onClick={onClick}
      className={cn(
        // Base card styles
        'bg-white rounded-lg p-6',
        'border border-[var(--border-primary)]',
        // Elevation
        elevations[elevation],
        className
      )}
      {...props}
    >
      {children}
    </InteractiveElement>
  );
};

/**
 * Ripple Effect Component
 */
export const RippleEffect = ({ children, className, ...props }) => {
  const [ripples, setRipples] = useState([]);
  const rippleRef = useRef(null);

  const createRipple = (event) => {
    const button = rippleRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <div
      ref={rippleRef}
      className={cn('relative overflow-hidden', className)}
      onClick={createRipple}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}
    </div>
  );
};

/**
 * Smooth Scroll Component
 */
export const SmoothScrollContainer = ({ 
  children, 
  className,
  scrollBehavior = 'smooth',
  ...props 
}) => {
  useEffect(() => {
    // Apply smooth scrolling to the container
    const container = document.querySelector('.smooth-scroll-container');
    if (container) {
      container.style.scrollBehavior = scrollBehavior;
    }
  }, [scrollBehavior]);

  return (
    <div 
      className={cn('smooth-scroll-container', className)}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Page Transition Wrapper
 */
export const PageTransitionWrapper = ({ 
  children, 
  type = 'fade',
  duration = 300,
  className 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const transitionClasses = {
    fade: isVisible ? 'opacity-100' : 'opacity-0',
    slideUp: isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
    slideDown: isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
    scale: isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        transitionClasses[type],
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

/**
 * Accessibility-aware Reduced Motion Wrapper
 */
export const MotionWrapper = ({ children, reduceMotion = false }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (prefersReducedMotion || reduceMotion) {
    return <div className="motion-reduced">{children}</div>;
  }

  return children;
};

export default {
  InteractiveElement,
  AnimatedButton,
  AnimatedCard,
  RippleEffect,
  SmoothScrollContainer,
  PageTransitionWrapper,
  MotionWrapper
};