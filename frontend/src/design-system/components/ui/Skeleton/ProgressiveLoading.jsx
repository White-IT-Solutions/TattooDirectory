"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '../../../utils/cn';
import { Skeleton } from './Skeleton';

/**
 * Progressive loading patterns for enhanced user experience
 */

/**
 * Progressive Image Loading with skeleton fallback
 */
export function ProgressiveImage({ 
  src, 
  alt, 
  width = 300,
  height = 200,
  className, 
  skeletonClassName,
  onLoad,
  onError,
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
  };

  return (
    <div className="relative">
      {isLoading && (
        <Skeleton 
          className={cn('absolute inset-0', skeletonClassName)} 
        />
      )}
      
      {!hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {hasError && (
        <div className={cn(
          'flex items-center justify-center bg-neutral-100 text-neutral-500',
          className
        )}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Staggered Loading Animation
 * Shows items with a staggered delay for smooth appearance
 */
export function StaggeredLoader({ 
  children, 
  delay = 100, 
  className,
  ...props 
}) {
  const [visibleItems, setVisibleItems] = useState(0);
  const childrenArray = Array.isArray(children) ? children : [children];

  useEffect(() => {
    let timer;
    
    // Start the timer after a small delay to ensure initial render
    const startTimer = () => {
      timer = setInterval(() => {
        setVisibleItems(prev => {
          if (prev < childrenArray.length) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, delay);
    };

    // Start after a microtask to ensure initial state is rendered
    setTimeout(startTimer, 0);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [childrenArray.length, delay]);

  return (
    <div className={className} {...props}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-300',
            index < visibleItems 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Content Placeholder with progressive reveal
 */
export function ContentPlaceholder({ 
  isLoading, 
  skeleton, 
  children, 
  className,
  ...props 
}) {
  return (
    <div className={cn('relative', className)} {...props}>
      {isLoading ? (
        <div className="animate-in fade-in duration-200">
          {skeleton}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Infinite Scroll Loading Indicator
 */
export function InfiniteScrollLoader({ 
  isLoading, 
  hasMore, 
  className,
  ...props 
}) {
  if (!isLoading && !hasMore) {
    return (
      <div className={cn('text-center py-8 text-neutral-500', className)} {...props}>
        <p>No more items to load</p>
      </div>
    );
  }

  if (!isLoading) return null;

  return (
    <div className={cn('flex justify-center py-8', className)} {...props}>
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
        <span className="text-neutral-600">Loading more...</span>
      </div>
    </div>
  );
}

/**
 * Skeleton List with progressive loading
 */
export function SkeletonList({ 
  count = 5, 
  itemSkeleton, 
  className,
  staggered = false,
  ...props 
}) {
  const items = Array.from({ length: count }).map((_, i) => (
    <div key={i}>
      {typeof itemSkeleton === 'function' ? itemSkeleton(i) : itemSkeleton}
    </div>
  ));

  if (staggered) {
    return (
      <StaggeredLoader className={className} {...props}>
        {items}
      </StaggeredLoader>
    );
  }

  return (
    <div className={className} {...props}>
      {items}
    </div>
  );
}

/**
 * Loading State Manager Hook
 */
export function useLoadingState(initialState = true) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setLoadingError = (error) => {
    setIsLoading(false);
    setError(error);
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
  };
}

