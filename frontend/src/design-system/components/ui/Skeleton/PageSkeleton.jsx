"use client";
import { Skeleton, SkeletonVariants } from './Skeleton';
import { ArtistCardSkeletonGrid } from './ArtistCardSkeleton';
import { StudioCardSkeletonGrid } from './StudioCardSkeleton';
import { cn } from '../../../utils/cn';

/**
 * Page-level loading components for different page types
 */

/**
 * Artist listing page skeleton
 */
export function ArtistListPageSkeleton({ className, ...props }) {
  return (
    <div className={cn('min-h-screen bg-neutral-50', className)} {...props}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="lg:w-64 space-y-6">
            {/* Search */}
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            
            {/* Location Filter */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            
            {/* Style Filter */}
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>

            {/* Artist Grid */}
            <ArtistCardSkeletonGrid count={9} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Artist profile page skeleton
 */
export function ArtistProfilePageSkeleton({ className, ...props }) {
  return (
    <div className={cn('min-h-screen bg-neutral-50', className)} {...props}>
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <SkeletonVariants.Avatar size="xl" />
            
            <div className="flex-1">
              {/* Name */}
              <Skeleton className="h-8 w-48 mb-2" />
              
              {/* Bio */}
              <SkeletonVariants.Text lines={2} className="mb-4" />
              
              {/* Styles */}
              <div className="flex flex-wrap gap-2 mb-4">
                <SkeletonVariants.Badge />
                <SkeletonVariants.Badge />
                <SkeletonVariants.Badge />
              </div>
              
              {/* Contact Info */}
              <div className="flex gap-4">
                <SkeletonVariants.Button size="md" />
                <SkeletonVariants.Button size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-24 mb-6" />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonVariants.Image key={i} aspectRatio="square" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Studio listing page skeleton
 */
export function StudioListPageSkeleton({ className, ...props }) {
  return (
    <div className={cn('min-h-screen bg-neutral-50', className)} {...props}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <Skeleton className="h-12 w-full max-w-md rounded-lg" />
        </div>

        {/* Studio Grid */}
        <StudioCardSkeletonGrid count={8} />
      </div>
    </div>
  );
}

/**
 * Search results page skeleton
 */
export function SearchResultsPageSkeleton({ className, ...props }) {
  return (
    <div className={cn('min-h-screen bg-neutral-50', className)} {...props}>
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Skeleton className="h-10 w-full max-w-lg rounded-lg" />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results Count */}
        <Skeleton className="h-5 w-48 mb-6" />
        
        {/* Mixed Results */}
        <div className="space-y-8">
          {/* Artists Section */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <ArtistCardSkeletonGrid count={6} />
          </div>
          
          {/* Studios Section */}
          <div>
            <Skeleton className="h-6 w-28 mb-4" />
            <StudioCardSkeletonGrid count={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic page skeleton for unknown page types
 */
export function GenericPageSkeleton({ className, ...props }) {
  return (
    <div className={cn('min-h-screen bg-neutral-50', className)} {...props}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <SkeletonVariants.Text lines={3} />
        <SkeletonVariants.Text lines={2} />
        <Skeleton className="h-48 w-full rounded-lg" />
        <SkeletonVariants.Text lines={4} />
      </div>
    </div>
  );
}

