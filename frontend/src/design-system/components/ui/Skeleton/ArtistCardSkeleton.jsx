"use client";
import { Skeleton, SkeletonVariants } from './Skeleton';
import { cn } from '../../../utils/cn';

/**
 * ArtistCardSkeleton - Loading state for artist cards
 * Matches the structure of the existing ArtistCard component
 */
export function ArtistCardSkeleton({ className, ...props }) {
  return (
    <div 
      className={cn(
        'bg-white shadow-lg rounded-lg p-4 flex flex-col justify-between',
        className
      )}
      {...props}
    >
      {/* Avatar & Info Section */}
      <div className="text-center">
        {/* Avatar */}
        <SkeletonVariants.Avatar size="md" className="mx-auto" />
        
        {/* Artist Name */}
        <Skeleton className="h-5 w-24 mx-auto mt-3" />
        
        {/* Bio/Description */}
        <Skeleton className="h-4 w-32 mx-auto mt-2" />

        {/* Styles Tags */}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <SkeletonVariants.Badge />
          <SkeletonVariants.Badge />
          <SkeletonVariants.Badge />
        </div>

        {/* Location */}
        <div className="mt-2 flex justify-center">
          <SkeletonVariants.Badge className="w-20" />
        </div>
      </div>

      {/* Portfolio Thumbnails */}
      <div className="mt-4 grid grid-cols-3 gap-1">
        <SkeletonVariants.Image aspectRatio="square" />
        <SkeletonVariants.Image aspectRatio="square" />
        <SkeletonVariants.Image aspectRatio="square" />
      </div>

      {/* CTA Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        {/* Instagram Link */}
        <Skeleton className="h-4 w-32 mx-auto" />
        
        {/* View Profile Button */}
        <SkeletonVariants.Button size="lg" className="w-full" />
      </div>
    </div>
  );
}

/**
 * Multiple ArtistCard skeletons for grid layouts
 */
export function ArtistCardSkeletonGrid({ count = 6, className, ...props }) {
  return (
    <div 
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ArtistCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default ArtistCardSkeleton;