/**
 * Animation and Interaction Systems Integration
 * 
 * Comprehensive integration of micro-interactions, page transitions, hover effects,
 * focus indicators, and accessibility-aware animations across the application.
 * 
 * Task 18: Integrate animation and interaction systems
 * Requirements: 10.4, 6.4, 6.5
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../design-system/utils/cn';
import { 
  InteractiveElement, 
  AnimatedButton, 
  AnimatedCard, 
  RippleEffect,
  SmoothScrollContainer,
  PageTransitionWrapper,
  MotionWrapper
} from '../../design-system/components/ui/MicroInteractions/MicroInteractions';

/**
 * Enhanced Micro-Interactions Hook
 */
export const useMicroInteractions = (options = {}) => {
  const {
    enableFloat = true,
    enableBreathe = true,
    enableGlowPulse = true,
    enableShimmer = true,
    respectReducedMotion = true
  } = options;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (respectReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);

      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [respectReducedMotion]);

  const getAnimationClasses = useCallback((baseAnimation) => {
    if (prefersReducedMotion) return '';
    
    const animations = {
      float: enableFloat ? 'animate-float hover:animate-float-active' : '',
      breathe: enableBreathe ? 'animate-breathe hover:animate-breathe-active' : '',
      glowPulse: enableGlowPulse ? 'animate-glow-pulse hover:animate-glow-pulse-active' : '',
      shimmer: enableShimmer ? 'border-shimmer hover:border-shimmer-active' : ''
    };

    return animations[baseAnimation] || '';
  }, [prefersReducedMotion, enableFloat, enableBreathe, enableGlowPulse, enableShimmer]);

  const interactionHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onMouseDown: () => setIsActive(true),
    onMouseUp: () => setIsActive(false)
  };

  return {
    prefersReducedMotion,
    isHovered,
    isFocused,
    isActive,
    getAnimationClasses,
    interactionHandlers
  };
};

/**
 * Enhanced Hover Effects Component
 */
export const HoverEffectsProvider = ({ children, effect = 'lift', className, ...props }) => {
  const { getAnimationClasses, interactionHandlers, prefersReducedMotion } = useMicroInteractions();

  const hoverEffects = {
    lift: 'hover-lift',
    glow: 'hover-glow',
    scale: 'hover-scale',
    rotate: 'hover-rotate',
    float: getAnimationClasses('float'),
    breathe: getAnimationClasses('breathe'),
    glowPulse: getAnimationClasses('glowPulse'),
    shimmer: getAnimationClasses('shimmer')
  };

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out',
        !prefersReducedMotion && hoverEffects[effect],
        prefersReducedMotion && 'motion-reduced',
        className
      )}
      {...interactionHandlers}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Enhanced Focus Indicators Component
 */
export const FocusIndicator = ({ 
  children, 
  variant = 'ring', 
  color = 'primary',
  className,
  ...props 
}) => {
  const { isFocused, prefersReducedMotion } = useMicroInteractions();

  const focusVariants = {
    ring: `focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      color === 'primary' ? 'focus:ring-blue-500' : 
      color === 'secondary' ? 'focus:ring-gray-500' :
      color === 'success' ? 'focus:ring-green-500' :
      color === 'error' ? 'focus:ring-red-500' :
      'focus:ring-blue-500'
    }`,
    glow: `focus:outline-none ${
      color === 'primary' ? 'focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)]' :
      color === 'secondary' ? 'focus:shadow-[0_0_0_3px_rgba(107,114,128,0.3)]' :
      color === 'success' ? 'focus:shadow-[0_0_0_3px_rgba(34,197,94,0.3)]' :
      color === 'error' ? 'focus:shadow-[0_0_0_3px_rgba(239,68,68,0.3)]' :
      'focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)]'
    }`,
    underline: `focus:outline-none focus:border-b-2 ${
      color === 'primary' ? 'focus:border-blue-500' :
      color === 'secondary' ? 'focus:border-gray-500' :
      color === 'success' ? 'focus:border-green-500' :
      color === 'error' ? 'focus:border-red-500' :
      'focus:border-blue-500'
    }`,
    background: `focus:outline-none ${
      color === 'primary' ? 'focus:bg-blue-50' :
      color === 'secondary' ? 'focus:bg-gray-50' :
      color === 'success' ? 'focus:bg-green-50' :
      color === 'error' ? 'focus:bg-red-50' :
      'focus:bg-blue-50'
    }`,
    scale: 'focus:outline-none focus:scale-105 transition-transform duration-200'
  };

  return (
    <div
      className={cn(
        'transition-all duration-150 ease-out',
        focusVariants[variant],
        prefersReducedMotion && 'motion-reduced',
        className
      )}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Page Transition Manager
 */
export const PageTransitionManager = ({ 
  children, 
  transitionType = 'fade',
  duration = 300,
  staggerChildren = false,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { prefersReducedMotion } = useMicroInteractions();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (prefersReducedMotion) {
    return <div className={cn('motion-reduced', className)} {...props}>{children}</div>;
  }

  const transitionClasses = {
    fade: isVisible ? 'opacity-100' : 'opacity-0',
    slideUp: isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    slideDown: isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0',
    slideLeft: isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
    slideRight: isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0',
    scale: isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
    scaleUp: isVisible ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        transitionClasses[transitionType],
        staggerChildren && 'stagger-children',
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: staggerChildren ? '0ms' : undefined
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Loading Animation Component
 */
export const LoadingAnimation = ({ 
  type = 'pulse', 
  size = 'medium',
  color = 'primary',
  className,
  ...props
}) => {
  const { prefersReducedMotion } = useMicroInteractions();

  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colors = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    success: 'text-green-500',
    error: 'text-red-500'
  };

  if (prefersReducedMotion) {
    return (
      <div className={cn(
        'rounded-full border-2 border-current opacity-50',
        sizes[size],
        colors[color],
        className
      )} {...props} />
    );
  }

  const loadingTypes = {
    pulse: (
      <div className={cn(
        'rounded-full animate-pulse bg-current',
        sizes[size],
        colors[color],
        className
      )} {...props} />
    ),
    spin: (
      <div className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizes[size],
        colors[color],
        className
      )} {...props} />
    ),
    bounce: (
      <div className="flex space-x-1" {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-current animate-bounce',
              size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3',
              colors[color]
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    ),
    shimmer: (
      <div className={cn(
        'rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse',
        sizes[size],
        className
      )} {...props} />
    )
  };

  return loadingTypes[type];
};

/**
 * Scroll-to-Top Button with Animation
 */
export const ScrollToTopButton = ({ 
  threshold = 300,
  smooth = true,
  className 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { prefersReducedMotion } = useMicroInteractions();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    if (prefersReducedMotion || !smooth) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatedButton
      onClick={scrollToTop}
      animation={prefersReducedMotion ? 'none' : 'float'}
      className={cn(
        'fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg',
        'bg-blue-500 text-white hover:bg-blue-600',
        'transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
      aria-label="Scroll to top"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </AnimatedButton>
  );
};

/**
 * Staggered Animation Container
 */
export const StaggeredContainer = ({ 
  children, 
  staggerDelay = 50,
  animation = 'slideUp',
  className,
  ...props
}) => {
  const { prefersReducedMotion } = useMicroInteractions();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (prefersReducedMotion) {
    return <div className={cn('motion-reduced', className)} {...props}>{children}</div>;
  }

  return (
    <div className={cn('stagger-children', className)} {...props}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-300 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{ 
            transitionDelay: `${index * staggerDelay}ms` 
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

/**
 * Interactive Card with Full Animation Suite
 */
export const FullyAnimatedCard = ({ 
  children, 
  hoverEffect = 'lift',
  focusStyle = 'ring',
  clickEffect = 'scale',
  className,
  onClick,
  ...props 
}) => {
  const { 
    isHovered, 
    isFocused, 
    isActive, 
    interactionHandlers, 
    prefersReducedMotion 
  } = useMicroInteractions();

  return (
    <RippleEffect
      className={cn(
        'relative overflow-hidden rounded-lg bg-white border border-gray-200',
        'transition-all duration-200 ease-out cursor-pointer',
        // Hover effects
        !prefersReducedMotion && {
          'hover:shadow-lg hover:-translate-y-1': hoverEffect === 'lift',
          'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]': hoverEffect === 'glow',
          'hover:scale-105': hoverEffect === 'scale',
          'hover:rotate-1': hoverEffect === 'rotate'
        },
        // Focus effects
        {
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2': focusStyle === 'ring',
          'focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.3)]': focusStyle === 'glow'
        },
        // Active state
        !prefersReducedMotion && {
          'scale-95': isActive && clickEffect === 'scale'
        },
        prefersReducedMotion && 'motion-reduced',
        className
      )}
      onClick={onClick}
      tabIndex={0}
      {...interactionHandlers}
      {...props}
    >
      {children}
    </RippleEffect>
  );
};

/**
 * Main Animation Integration Component
 */
export const AnimationInteractionIntegration = ({ children, className, ...props }) => {
  return (
    <MotionWrapper>
      <SmoothScrollContainer className={cn('min-h-screen', className)} {...props}>
        <PageTransitionManager transitionType="fade" duration={300}>
          {children}
        </PageTransitionManager>
        <ScrollToTopButton />
      </SmoothScrollContainer>
    </MotionWrapper>
  );
};

// All components are already exported individually above

export default AnimationInteractionIntegration;