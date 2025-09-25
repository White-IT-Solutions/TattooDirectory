"use client";
import { cn } from '../../../utils/cn';

/**
 * Base Skeleton component with proper animation
 * Provides a loading placeholder with shimmer animation
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        // Base skeleton styles
        'animate-pulse rounded-md bg-neutral-200',
        // Shimmer effect using CSS gradient animation
        'relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:-translate-x-full',
        'before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-neutral-100 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton variants for common shapes and sizes
 */
export const SkeletonVariants = {
  // Avatar shapes
  Avatar: ({ size = 'md', className, ...props }) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-20 w-20',
      lg: 'h-24 w-24',
      xl: 'h-32 w-32',
    };
    
    return (
      <Skeleton
        className={cn('rounded-full', sizeClasses[size], className)}
        {...props}
      />
    );
  },

  // Text lines
  Text: ({ lines = 1, className, ...props }) => {
    if (lines === 1) {
      return <Skeleton className={cn('h-4 w-full', className)} {...props} />;
    }
    
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full', // Last line shorter
              className
            )}
            {...props}
          />
        ))}
      </div>
    );
  },

  // Button shapes
  Button: ({ size = 'md', className, ...props }) => {
    const sizeClasses = {
      sm: 'h-8 w-20',
      md: 'h-10 w-24',
      lg: 'h-12 w-32',
    };
    
    return (
      <Skeleton
        className={cn('rounded-lg', sizeClasses[size], className)}
        {...props}
      />
    );
  },

  // Image/thumbnail shapes
  Image: ({ aspectRatio = 'square', className, ...props }) => {
    const aspectClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
      landscape: 'aspect-[4/3]',
    };
    
    return (
      <Skeleton
        className={cn('w-full rounded-md', aspectClasses[aspectRatio], className)}
        {...props}
      />
    );
  },

  // Badge/tag shapes
  Badge: ({ className, ...props }) => (
    <Skeleton
      className={cn('h-6 w-16 rounded-full', className)}
      {...props}
    />
  ),
};

export default Skeleton;