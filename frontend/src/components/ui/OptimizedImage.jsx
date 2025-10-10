"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '../../design-system/utils/cn';

/**
 * OptimizedImage Component
 * 
 * Handles image loading with proper CORS, fallbacks, and error handling
 * Fixes the OpaqueResponseBlocking issues seen in browser console
 */

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/placeholder-avatar.svg',
  crossOrigin = 'anonymous',
  loading = 'lazy',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  // Don't set crossOrigin for same-origin requests or data URLs
  const shouldUseCrossOrigin = currentSrc && 
    !currentSrc.startsWith('/') && 
    !currentSrc.startsWith(window.location.origin) &&
    !currentSrc.startsWith('data:');

  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 text-neutral-500">
          <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          crossOrigin={shouldUseCrossOrigin ? crossOrigin : undefined}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
        />
      )}
    </div>
  );
};

export default OptimizedImage;