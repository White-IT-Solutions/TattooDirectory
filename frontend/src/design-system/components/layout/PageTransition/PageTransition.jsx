"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '../../../utils/cn';

/**
 * PageTransition Component
 * Provides smooth transitions between pages and sections
 */
export const PageTransition = ({ 
  children, 
  type = 'fade',
  duration = 300,
  className,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Reset visibility on route change
    setIsVisible(false);
    
    // Trigger entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  const transitionClasses = {
    fade: isVisible ? 'animate-fade-in' : 'opacity-0',
    slideUp: isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4',
    slideInRight: isVisible ? 'animate-slide-in-right' : 'opacity-0 translate-x-4',
    slideInLeft: isVisible ? 'animate-slide-in-left' : 'opacity-0 -translate-x-4',
    scale: isVisible ? 'animate-fade-in' : 'opacity-0 scale-95',
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        transitionClasses[type],
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * SectionTransition - Transition for page sections
 */
export const SectionTransition = ({ 
  children, 
  delay = 0,
  className,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * StaggeredTransition - Staggered animation for lists
 */
export const StaggeredTransition = ({ 
  children, 
  staggerDelay = 100,
  className,
  ...props 
}) => {
  const [visibleItems, setVisibleItems] = useState(new Set());

  useEffect(() => {
    const childrenArray = Array.isArray(children) ? children : [children];
    
    childrenArray.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]));
      }, index * staggerDelay);
    });
  }, [children, staggerDelay]);

  const renderChildren = () => {
    if (!Array.isArray(children)) {
      return (
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            visibleItems.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {children}
        </div>
      );
    }

    return children.map((child, index) => (
      <div
        key={index}
        className={cn(
          'transition-all duration-300 ease-out',
          visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {child}
      </div>
    ));
  };

  return (
    <div className={cn(className)} {...props}>
      {renderChildren()}
    </div>
  );
};

/**
 * FadeInOnScroll - Fade in elements when they come into view
 */
export const FadeInOnScroll = ({ 
  children, 
  threshold = 0.1,
  rootMargin = '0px',
  className,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [elementRef, setElementRef] = useState(null);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(elementRef);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef);

    return () => {
      if (elementRef) {
        observer.unobserve(elementRef);
      }
    };
  }, [elementRef, threshold, rootMargin]);

  return (
    <div
      ref={setElementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * SlideInOnScroll - Slide in elements from different directions
 */
export const SlideInOnScroll = ({ 
  children, 
  direction = 'up',
  threshold = 0.1,
  className,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [elementRef, setElementRef] = useState(null);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(elementRef);
        }
      },
      { threshold }
    );

    observer.observe(elementRef);

    return () => {
      if (elementRef) {
        observer.unobserve(elementRef);
      }
    };
  }, [elementRef, threshold]);

  const directionClasses = {
    up: isVisible ? 'translate-y-0' : 'translate-y-8',
    down: isVisible ? 'translate-y-0' : '-translate-y-8',
    left: isVisible ? 'translate-x-0' : 'translate-x-8',
    right: isVisible ? 'translate-x-0' : '-translate-x-8',
  };

  return (
    <div
      ref={setElementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        directionClasses[direction],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ParallaxSection - Simple parallax effect
 */
export const ParallaxSection = ({ 
  children, 
  speed = 0.5,
  className,
  ...props 
}) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      className={cn('relative', className)}
      style={{ transform: `translateY(${offset}px)` }}
      {...props}
    >
      {children}
    </div>
  );
};

export default PageTransition;