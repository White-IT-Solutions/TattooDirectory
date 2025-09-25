"use client";

import { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '../../../utils/cn';

/**
 * LazyImage Component
 * 
 * Implements lazy loading for images with WebP optimization and loading states
 * 
 * Features:
 * - Intersection Observer for lazy loading
 * - WebP format with fallback
 * - Loading states and error handling
 * - Responsive image sizing
 * - Progressive loading with blur effect
 * 
 * Requirements: 12.1, 12.3
 */

const LazyImage = forwardRef(({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  priority = false,
  onLoad,
  onError,
  ...props
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate WebP and fallback URLs
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return '';
    
    // If it's already a WebP or data URL, return as is
    if (originalSrc.includes('.webp') || originalSrc.startsWith('data:')) {
      return originalSrc;
    }

    // For external URLs, try to convert to WebP
    // This would typically be handled by your image optimization service
    const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return webpSrc;
  };

  const getFallbackSrc = (originalSrc) => {
    if (!originalSrc) return '';
    
    // Return original for fallback
    return originalSrc;
  };

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Handle image loading
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    
    // Try WebP first
    const webpSrc = getOptimizedSrc(src);
    
    img.onload = () => {
      setCurrentSrc(webpSrc);
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      // Fallback to original format
      const fallbackSrc = getFallbackSrc(src);
      
      if (webpSrc !== fallbackSrc) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setCurrentSrc(fallbackSrc);
          setIsLoaded(true);
          setHasError(false);
          onLoad?.();
        };
        fallbackImg.onerror = () => {
          setHasError(true);
          onError?.();
        };
        fallbackImg.src = fallbackSrc;
      } else {
        setHasError(true);
        onError?.();
      }
    };

    img.src = webpSrc;
  }, [isInView, src, onLoad, onError]);

  // Use a consistent placeholder that works on both server and client
  const getPlaceholderSrc = () => {
    if (blurDataURL) return blurDataURL;
    
    // Always use the same SVG placeholder to avoid hydration mismatches
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCA0MCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=';
  };

  const containerStyle = {
    width: width || '100%',
    height: height || 'auto',
    aspectRatio: width && height ? `${width}/${height}` : undefined
  };

  return (
    <div
      ref={ref || imgRef}
      className={cn(
        'relative overflow-hidden bg-neutral-100',
        className
      )}
      style={containerStyle}
      {...props}
    >
      {/* Placeholder/Loading State */}
      {(!isLoaded || !isInView) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder === 'blur' && (
            <img
              src={getPlaceholderSrc()}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
              style={{ opacity: isLoaded ? 0 : 1 }}
              suppressHydrationWarning
            />
          )}
          {placeholder === 'skeleton' && (
            <div className="w-full h-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse" />
          )}
          {!isInView && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 text-neutral-500">
          <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Failed to load</span>
        </div>
      )}

      {/* Actual Image */}
      {isInView && currentSrc && !hasError && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;