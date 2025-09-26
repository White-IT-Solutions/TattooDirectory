import React from 'react';
import Card from '../Card/Card';

/**
 * Studio Card Skeleton Component
 * 
 * Loading skeleton for studio cards with proper spacing and animation
 */
export const StudioCardSkeleton = () => {
  return (
    <Card className="p-6 animate-pulse">
      {/* Studio name skeleton */}
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
      
      {/* Location skeleton */}
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
      
      {/* Rating skeleton */}
      <div className="flex items-center mb-2">
        <div className="h-4 w-4 bg-gray-200 rounded mr-1" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      
      {/* Specialties skeleton */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded" />
          <div className="h-6 w-14 bg-gray-200 rounded" />
        </div>
      </div>
      
      {/* Button skeleton */}
      <div className="h-8 w-full bg-gray-200 rounded" />
    </Card>
  );
};

// Compact variant for mobile/small screens
export const StudioCardSkeletonCompact = () => {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex space-x-3">
        <div className="w-16 h-16 bg-neutral-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
          <div className="h-3 bg-neutral-200 rounded w-1/2" />
          <div className="h-3 bg-neutral-200 rounded w-2/3" />
        </div>
      </div>
    </Card>
  );
};

// Grid variant for grid layouts
export const StudioCardSkeletonGrid = () => {
  return (
    <Card className="p-4 animate-pulse">
      <div className="space-y-3">
        <div className="w-full h-32 bg-neutral-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
          <div className="h-3 bg-neutral-200 rounded w-1/2" />
        </div>
      </div>
    </Card>
  );
};

export default StudioCardSkeleton;