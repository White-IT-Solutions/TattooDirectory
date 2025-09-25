"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  LazyImage,
  InfiniteScroll,
  OptimizedImage,
  PortfolioImageGrid,
  AvatarImage,
  SmartLink,
  useImagePreloader,
  useRoutePreloader,
  useConnectionAwarePreloading,
  useInfiniteScroll
} from '../../design-system/components/ui/Performance';
import { Card, CardContent, Button, Badge } from '../../design-system';

/**
 * Performance Optimization Integration Component
 * 
 * Integrates all performance optimization components into main application pages
 * 
 * Features:
 * - LazyImage with WebP optimization and intersection observers
 * - InfiniteScroll with debouncing and error handling
 * - OptimizedImage with responsive sizing and quality adjustment
 * - SmartLink with hover preloading and connection-aware loading
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6
 */

const PerformanceOptimizationIntegration = ({
  pageType = 'artists', // 'artists', 'studios', 'styles'
  initialData = [],
  fetchMoreData,
  onImageClick,
  className = ''
}) => {
  const [isClient, setIsClient] = useState(false);
  const { preloadImages } = useImagePreloader();
  const { preloadRoute } = useRoutePreloader();
  const { shouldPreload, getConnectionSpeed } = useConnectionAwarePreloading();

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Infinite scroll hook for data loading
  const {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  } = useInfiniteScroll({
    initialData,
    fetchMore: fetchMoreData,
    pageSize: 20
  });

  // Preload critical resources based on page type
  useEffect(() => {
    if (!isClient || !shouldPreload()) return;

    const criticalRoutes = {
      artists: ['/artists', '/search'],
      studios: ['/studios', '/search'],
      styles: ['/styles', '/search']
    };

    // Preload likely next routes
    criticalRoutes[pageType]?.forEach(route => {
      setTimeout(() => preloadRoute(route), 1000);
    });
  }, [isClient, pageType, shouldPreload, preloadRoute]);

  // Handle hover preloading for artist/studio cards
  const handleCardHover = useCallback((item) => {
    if (!shouldPreload('image')) return;

    // Preload portfolio images
    if (item.portfolioImages?.length > 0) {
      const imagesToPreload = item.portfolioImages
        .slice(0, 3)
        .map(img => img.url);
      preloadImages(imagesToPreload, 'high');
    }

    // Preload detail page
    const detailRoute = `/${pageType}/${item.id}`;
    preloadRoute(detailRoute);
  }, [shouldPreload, preloadImages, preloadRoute, pageType]);

  // Render performance-optimized card
  const renderOptimizedCard = (item, index) => {
    const isAboveFold = index < 6; // First 6 items are above the fold

    return (
      <Card 
        key={item.id}
        className="group hover:shadow-lg transition-shadow duration-300"
        onMouseEnter={() => handleCardHover(item)}
      >
        <CardContent className="p-0">
          {/* Optimized main image */}
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <OptimizedImage
              src={item.mainImage || item.portfolioImages?.[0]?.url}
              alt={`${item.name} - ${pageType.slice(0, -1)} image`}
              width={400}
              height={300}
              priority={isAboveFold}
              responsive={true}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay with quick actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <SmartLink
                href={`/${pageType}/${item.id}`}
                preloadOnHover={true}
                className="px-4 py-2 bg-white/90 text-primary-600 rounded-lg font-medium hover:bg-white transition-colors"
              >
                View Details
              </SmartLink>
            </div>
          </div>

          {/* Card content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                {/* Optimized avatar */}
                <AvatarImage
                  src={item.avatar}
                  alt={item.name}
                  size="medium"
                  fallback={item.name?.charAt(0)}
                />
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-neutral-600 text-sm">{item.location}</p>
                </div>
              </div>
              
              {item.rating && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{item.rating.toFixed(1)}</span>
                </Badge>
              )}
            </div>

            {/* Specialties/Styles */}
            {item.specialties && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.specialties.slice(0, 3).map((specialty, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {item.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.specialties.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Portfolio preview grid */}
            {item.portfolioImages?.length > 0 && (
              <div className="mb-3">
                <PortfolioImageGrid
                  images={item.portfolioImages.slice(0, 4)}
                  columns={2}
                  gap={2}
                  className="h-24"
                  onImageClick={onImageClick}
                  lazy={!isAboveFold}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-2">
              <SmartLink
                href={`/${pageType}/${item.id}`}
                preloadOnHover={true}
                className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-center text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                View Profile
              </SmartLink>
              
              {item.contactMethods?.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 py-2"
                  onClick={() => {
                    // Handle contact action
                    console.log('Contact:', item.name);
                  }}
                >
                  Contact
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading skeleton for performance
  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-0">
            <div className="aspect-video bg-neutral-200 rounded-t-lg" />
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-24" />
                  <div className="h-3 bg-neutral-200 rounded w-16" />
                </div>
              </div>
              <div className="flex space-x-1">
                <div className="h-6 bg-neutral-200 rounded w-16" />
                <div className="h-6 bg-neutral-200 rounded w-20" />
              </div>
              <div className="grid grid-cols-2 gap-2 h-24">
                <div className="bg-neutral-200 rounded" />
                <div className="bg-neutral-200 rounded" />
                <div className="bg-neutral-200 rounded" />
                <div className="bg-neutral-200 rounded" />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 h-8 bg-neutral-200 rounded" />
                <div className="w-20 h-8 bg-neutral-200 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (!isClient) {
    return renderLoadingSkeleton();
  }

  return (
    <div className={`performance-optimized-listing ${className}`}>
      {/* Connection status indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-700">
              Connection: <Badge variant="secondary">{getConnectionSpeed()}</Badge>
            </span>
            <span className="text-blue-700">
              Preloading: <Badge variant={shouldPreload() ? 'success' : 'warning'}>
                {shouldPreload() ? 'Enabled' : 'Disabled'}
              </Badge>
            </span>
          </div>
        </div>
      )}

      {/* Infinite scroll container */}
      <InfiniteScroll
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
        error={error}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item, index) => renderOptimizedCard(item, index))}
        </div>
      </InfiniteScroll>

      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-neutral-50 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">Performance Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-neutral-600">Items Loaded</div>
              <div className="font-medium">{data.length}</div>
            </div>
            <div>
              <div className="text-neutral-600">Has More</div>
              <div className="font-medium">{hasMore ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-neutral-600">Loading</div>
              <div className="font-medium">{loading ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-neutral-600">Error</div>
              <div className="font-medium">{error ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="text-xs"
            >
              Reset Demo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizationIntegration;