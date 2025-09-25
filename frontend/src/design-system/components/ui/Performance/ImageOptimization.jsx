"use client";

import { useState, useEffect, useCallback } from 'react';
import LazyImage from './LazyImage';

/**
 * ImageOptimization Component
 * 
 * Provides comprehensive image optimization with WebP format support
 * 
 * Features:
 * - Automatic WebP conversion with fallbacks
 * - Responsive image sizing
 * - Progressive loading
 * - Bandwidth-aware loading
 * - Image compression optimization
 * 
 * Requirements: 12.3
 */

// Image size presets for responsive loading
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  xlarge: { width: 1920, height: 1080 }
};

// Quality settings based on connection speed
const QUALITY_SETTINGS = {
  slow: 60,
  medium: 75,
  fast: 85,
  auto: 80
};

/**
 * Get optimal image size based on container dimensions and device pixel ratio
 */
const getOptimalSize = (containerWidth, containerHeight, devicePixelRatio = 1) => {
  const targetWidth = Math.ceil(containerWidth * devicePixelRatio);
  const targetHeight = Math.ceil(containerHeight * devicePixelRatio);

  // Find the best matching preset
  const sizeEntries = Object.entries(IMAGE_SIZES);
  const bestMatch = sizeEntries.reduce((best, [key, size]) => {
    const widthDiff = Math.abs(size.width - targetWidth);
    const heightDiff = Math.abs(size.height - targetHeight);
    const totalDiff = widthDiff + heightDiff;

    if (!best || totalDiff < best.diff) {
      return { key, size, diff: totalDiff };
    }
    return best;
  }, null);

  return bestMatch?.size || IMAGE_SIZES.medium;
};

/**
 * Detect connection speed for quality optimization
 */
const useConnectionSpeed = () => {
  const [connectionSpeed, setConnectionSpeed] = useState('auto');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateConnectionSpeed = () => {
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            setConnectionSpeed('slow');
            break;
          case '3g':
            setConnectionSpeed('medium');
            break;
          case '4g':
            setConnectionSpeed('fast');
            break;
          default:
            setConnectionSpeed('auto');
        }
      };

      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);

      return () => {
        connection.removeEventListener('change', updateConnectionSpeed);
      };
    }
  }, []);

  return connectionSpeed;
};

/**
 * Generate optimized image URL with WebP support
 */
const generateOptimizedUrl = (src, options = {}) => {
  if (!src) return '';

  const {
    width,
    height,
    quality = QUALITY_SETTINGS.auto,
    format = 'webp',
    fit = 'cover'
  } = options;

  // If it's already optimized or a data URL, return as is
  if (src.includes('?') || src.startsWith('data:') || src.includes('.webp')) {
    return src;
  }

  // Build optimization parameters
  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality) params.set('q', quality.toString());
  if (format) params.set('f', format);
  if (fit) params.set('fit', fit);

  // For development/demo purposes, we'll just add parameters
  // In production, this would integrate with your image optimization service
  return `${src}?${params.toString()}`;
};

/**
 * Generate responsive srcSet for different screen densities
 */
const generateSrcSet = (src, baseWidth, baseHeight, quality) => {
  const densities = [1, 1.5, 2, 3];
  
  return densities.map(density => {
    const width = Math.round(baseWidth * density);
    const height = Math.round(baseHeight * density);
    
    const optimizedUrl = generateOptimizedUrl(src, {
      width,
      height,
      quality,
      format: 'webp'
    });
    
    return `${optimizedUrl} ${density}x`;
  }).join(', ');
};

/**
 * Generate sizes attribute for responsive images
 */
const generateSizes = (breakpoints = {}) => {
  const defaultBreakpoints = {
    sm: '(max-width: 640px) 100vw',
    md: '(max-width: 768px) 50vw',
    lg: '(max-width: 1024px) 33vw',
    xl: '25vw'
  };

  const merged = { ...defaultBreakpoints, ...breakpoints };
  return Object.values(merged).join(', ');
};

/**
 * OptimizedImage Component
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  responsive = true,
  quality,
  format = 'webp',
  fit = 'cover',
  sizes: customSizes,
  onLoad,
  onError,
  ...props
}) => {
  const connectionSpeed = useConnectionSpeed();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  // Update device pixel ratio
  useEffect(() => {
    setDevicePixelRatio(window.devicePixelRatio || 1);
  }, []);

  // Determine optimal quality based on connection speed
  const optimalQuality = quality || QUALITY_SETTINGS[connectionSpeed] || QUALITY_SETTINGS.auto;

  // Generate optimized URLs
  const optimizedSrc = generateOptimizedUrl(src, {
    width,
    height,
    quality: optimalQuality,
    format,
    fit
  });

  // Generate fallback URL (JPEG)
  const fallbackSrc = generateOptimizedUrl(src, {
    width,
    height,
    quality: optimalQuality,
    format: 'jpeg',
    fit
  });

  // Generate responsive attributes
  const srcSet = responsive && width && height 
    ? generateSrcSet(src, width, height, optimalQuality)
    : undefined;

  const sizes = customSizes || (responsive ? generateSizes() : undefined);

  return (
    <picture className={className}>
      {/* WebP source */}
      <source
        srcSet={srcSet || optimizedSrc}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback source */}
      <source
        srcSet={srcSet ? generateSrcSet(src, width, height, optimalQuality).replace(/webp/g, 'jpeg') : fallbackSrc}
        sizes={sizes}
        type="image/jpeg"
      />
      
      {/* Fallback img element */}
      <LazyImage
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        onLoad={onLoad}
        onError={onError}
        {...props}
      />
    </picture>
  );
};

/**
 * PortfolioImageGrid Component
 * Optimized for displaying multiple portfolio images
 */
export const PortfolioImageGrid = ({
  images = [],
  columns = 3,
  gap = 4,
  className,
  onImageClick,
  lazy = true
}) => {
  const connectionSpeed = useConnectionSpeed();
  
  // Adjust image quality based on connection and grid size
  const getImageQuality = () => {
    const baseQuality = QUALITY_SETTINGS[connectionSpeed] || QUALITY_SETTINGS.auto;
    
    // Reduce quality for grids with many images
    if (images.length > 12) return Math.max(baseQuality - 15, 50);
    if (images.length > 6) return Math.max(baseQuality - 10, 60);
    
    return baseQuality;
  };

  const imageQuality = getImageQuality();

  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`
      }}
    >
      {images.map((image, index) => (
        <div
          key={image.id || index}
          className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onImageClick?.(image, index)}
        >
          <OptimizedImage
            src={image.url}
            alt={image.description || `Portfolio image ${index + 1}`}
            width={300}
            height={300}
            quality={imageQuality}
            priority={!lazy && index < 6} // Prioritize first 6 images
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

/**
 * AvatarImage Component
 * Optimized for profile avatars
 */
export const AvatarImage = ({
  src,
  alt,
  size = 'medium',
  className,
  fallback,
  ...props
}) => {
  const sizeMap = {
    small: 40,
    medium: 80,
    large: 120,
    xlarge: 160
  };

  const dimension = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={dimension}
        height={dimension}
        quality={85} // Higher quality for avatars
        priority={size === 'large' || size === 'xlarge'}
        className="w-full h-full object-cover"
        {...props}
      />
      
      {/* Fallback for missing avatars */}
      {!src && fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 text-neutral-500">
          {typeof fallback === 'string' ? (
            <span className="text-lg font-semibold">{fallback}</span>
          ) : (
            fallback
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;