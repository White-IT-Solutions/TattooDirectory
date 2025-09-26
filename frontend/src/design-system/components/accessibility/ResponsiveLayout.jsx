"use client";

import React, { useState, useEffect } from 'react';
import { cva } from '../../utils/cn';

// Breakpoint definitions matching our design system
const breakpoints = {
  xs: 320,   // Extra small devices
  sm: 640,   // Small devices
  md: 768,   // Medium devices
  lg: 1024,  // Large devices
  xl: 1280,  // Extra large devices
  '2xl': 1536 // 2X large devices
};

// Container variants for responsive layouts
const containerVariants = cva(
  [
    'w-full mx-auto px-4',
    'transition-all duration-200 ease-out'
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'max-w-none',
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md', 
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full'
      },
      padding: {
        none: 'px-0',
        sm: 'px-2 sm:px-4',
        md: 'px-4 sm:px-6',
        lg: 'px-4 sm:px-6 lg:px-8',
        xl: 'px-6 sm:px-8 lg:px-12'
      }
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md'
    }
  }
);

// Grid variants for responsive grids
const gridVariants = cva(
  [
    'grid gap-4',
    'transition-all duration-200 ease-out'
  ].join(' '),
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        auto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]'
      },
      gap: {
        none: 'gap-0',
        sm: 'gap-2 sm:gap-3',
        md: 'gap-4 sm:gap-6',
        lg: 'gap-6 sm:gap-8',
        xl: 'gap-8 sm:gap-12'
      }
    },
    defaultVariants: {
      cols: 'auto',
      gap: 'md'
    }
  }
);

// Stack variants for vertical layouts
const stackVariants = cva(
  [
    'flex flex-col',
    'transition-all duration-200 ease-out'
  ].join(' '),
  {
    variants: {
      spacing: {
        none: 'space-y-0',
        xs: 'space-y-1',
        sm: 'space-y-2',
        md: 'space-y-4',
        lg: 'space-y-6',
        xl: 'space-y-8',
        '2xl': 'space-y-12'
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch'
      }
    },
    defaultVariants: {
      spacing: 'md',
      align: 'stretch'
    }
  }
);

/**
 * useMediaQuery Hook
 * Detects media query matches for responsive behavior
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  // Return false during SSR to prevent hydration mismatches
  return mounted ? matches : false;
};

/**
 * useBreakpoint Hook
 * Provides current breakpoint information
 */
const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('xs');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const isBreakpoint = (bp) => {
    if (!mounted) return false;
    const currentIndex = Object.keys(breakpoints).indexOf(currentBreakpoint);
    const targetIndex = Object.keys(breakpoints).indexOf(bp);
    return currentIndex >= targetIndex;
  };

  return {
    current: mounted ? currentBreakpoint : 'xs',
    isXs: mounted ? currentBreakpoint === 'xs' : false,
    isSm: mounted ? isBreakpoint('sm') : false,
    isMd: mounted ? isBreakpoint('md') : false,
    isLg: mounted ? isBreakpoint('lg') : false,
    isXl: mounted ? isBreakpoint('xl') : false,
    is2xl: mounted ? isBreakpoint('2xl') : false,
    isMobile: mounted ? !isBreakpoint('md') : false,
    isTablet: mounted ? isBreakpoint('md') && !isBreakpoint('lg') : false,
    isDesktop: mounted ? isBreakpoint('lg') : false
  };
};

/**
 * Container Component
 * Responsive container with consistent max-widths and padding
 */
const Container = ({ 
  children, 
  size = 'xl',
  padding = 'md',
  className,
  ...props 
}) => {
  return (
    <div 
      className={containerVariants({ size, padding, className })}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Grid Component
 * Responsive grid layout with automatic column adjustment
 */
const Grid = ({ 
  children, 
  cols = 'auto',
  gap = 'md',
  className,
  ...props 
}) => {
  return (
    <div 
      className={gridVariants({ cols, gap, className })}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Stack Component
 * Vertical layout with consistent spacing
 */
const Stack = ({ 
  children, 
  spacing = 'md',
  align = 'stretch',
  className,
  ...props 
}) => {
  return (
    <div 
      className={stackVariants({ spacing, align, className })}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Flex Component
 * Flexible layout component with responsive options
 */
const Flex = ({ 
  children,
  direction = 'row',
  wrap = 'wrap',
  justify = 'start',
  align = 'start',
  gap = 'md',
  className,
  ...props 
}) => {
  const directionClasses = {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    col: 'flex-col',
    'col-reverse': 'flex-col-reverse'
  };

  const wrapClasses = {
    wrap: 'flex-wrap',
    nowrap: 'flex-nowrap',
    'wrap-reverse': 'flex-wrap-reverse'
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  };

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div 
      className={`
        flex
        ${directionClasses[direction]}
        ${wrapClasses[wrap]}
        ${justifyClasses[justify]}
        ${alignClasses[align]}
        ${gapClasses[gap]}
        transition-all duration-200 ease-out
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveImage Component
 * Image that adapts to different screen sizes
 */
const ResponsiveImage = ({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className,
  priority = false,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={`w-full h-auto object-cover ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
};

/**
 * Show/Hide Components
 * Conditionally show/hide content based on breakpoints
 */
const ShowAt = ({ breakpoint, children }) => {
  const bp = useBreakpoint();
  const shouldShow = bp[`is${breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)}`];
  
  return shouldShow ? children : null;
};

const HideAt = ({ breakpoint, children }) => {
  const bp = useBreakpoint();
  const shouldHide = bp[`is${breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)}`];
  
  return shouldHide ? null : children;
};

/**
 * AspectRatio Component
 * Maintains aspect ratio across different screen sizes
 */
const AspectRatio = ({ 
  ratio = '16/9', 
  children, 
  className,
  ...props 
}) => {
  return (
    <div 
      className={`relative w-full ${className}`}
      style={{ aspectRatio: ratio }}
      {...props}
    >
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
};

/**
 * Spacer Component
 * Responsive spacing utility
 */
const Spacer = ({ 
  size = 'md',
  axis = 'y',
  className,
  ...props 
}) => {
  const sizeClasses = {
    xs: axis === 'y' ? 'h-2' : 'w-2',
    sm: axis === 'y' ? 'h-4' : 'w-4',
    md: axis === 'y' ? 'h-8' : 'w-8',
    lg: axis === 'y' ? 'h-12' : 'w-12',
    xl: axis === 'y' ? 'h-16' : 'w-16'
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${className || ''}`}
      aria-hidden="true"
      {...props}
    />
  );
};

export default Container;
export {
  Container,
  Grid,
  Stack,
  Flex,
  ResponsiveImage,
  ShowAt,
  HideAt,
  AspectRatio,
  Spacer,
  useMediaQuery,
  useBreakpoint,
  breakpoints,
  containerVariants,
  gridVariants,
  stackVariants
};