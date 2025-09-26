"use client";

import { useState, useCallback } from 'react';
import PerformanceOptimizationIntegration from '../components/PerformanceOptimizationIntegration';
import { Card, CardContent, Button, Badge } from '../../design-system';

/**
 * Performance Optimized Artists Page
 * 
 * Integrates all performance optimization components for the artists listing
 * 
 * Features:
 * - LazyImage with WebP optimization for artist photos
 * - InfiniteScroll for smooth artist loading
 * - OptimizedImage for portfolio previews
 * - SmartLink with hover preloading for artist profiles
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6
 */

// Mock data generator for demonstration
const generateMockArtists = (page, count = 20) => {
  return Array.from({ length: count }, (_, i) => {
    const id = (page - 1) * count + i + 1;
    return {
      id: `artist-${id}`,
      name: `Artist ${id}`,
      location: `City ${(id % 10) + 1}, UK`,
      avatar: `https://picsum.photos/80/80?random=${id + 1000}`,
      mainImage: `https://picsum.photos/400/300?random=${id + 2000}`,
      rating: 4.0 + (Math.random() * 1.0),
      reviewCount: Math.floor(Math.random() * 100) + 10,
      specialties: [
        'Traditional', 'Blackwork', 'Realism', 'Watercolor', 'Minimalist', 
        'Japanese', 'Geometric', 'Portrait', 'Abstract', 'Neo-Traditional'
      ].slice(0, Math.floor(Math.random() * 4) + 1),
      portfolioImages: Array.from({ length: Math.floor(Math.random() * 6) + 2 }, (_, j) => ({
        id: `portfolio-${id}-${j}`,
        url: `https://picsum.photos/300/300?random=${id * 100 + j + 3000}`,
        description: `Portfolio piece ${j + 1} by Artist ${id}`,
        style: ['Traditional', 'Blackwork', 'Realism'][j % 3]
      })),
      contactMethods: ['email', 'phone', 'instagram'].slice(0, Math.floor(Math.random() * 3) + 1),
      experience: Math.floor(Math.random() * 15) + 1,
      priceRange: {
        min: 80 + Math.floor(Math.random() * 50),
        max: 200 + Math.floor(Math.random() * 300)
      },
      availability: ['Available', 'Booking', 'Busy'][Math.floor(Math.random() * 3)],
      studioName: `Studio ${(id % 5) + 1}`,
      bio: `Experienced tattoo artist specializing in ${['traditional', 'modern', 'custom'][id % 3]} designs. Creating unique artwork for ${Math.floor(Math.random() * 15) + 1} years.`
    };
  });
};

const PerformanceOptimizedArtistsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    styles: [],
    location: '',
    priceRange: { min: 0, max: 1000 },
    availability: 'all'
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Initial data
  const initialArtists = generateMockArtists(1, 12);

  // Fetch more artists function for infinite scroll
  const fetchMoreArtists = useCallback(async (page) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newArtists = generateMockArtists(page, 20);
    
    return {
      data: newArtists,
      hasMore: page < 5 // Limit to 5 pages for demo
    };
  }, []);

  // Handle portfolio image click
  const handlePortfolioClick = useCallback((image, index) => {
    console.log('Portfolio image clicked:', image, 'at index:', index);
    // In a real app, this would open a lightbox or navigate to full view
  }, []);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // In a real app, this would trigger a new search
    console.log('Searching for:', query);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    console.log('Filter changed:', filterType, value);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary-800">
                Tattoo Artists
              </h1>
              <p className="text-neutral-600 mt-1">
                Discover talented tattoo artists across the UK
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                {initialArtists.length}+ Artists
              </Badge>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search artists by name, style, or location..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {['Traditional', 'Blackwork', 'Realism', 'Watercolor'].map(style => (
                <Button
                  key={style}
                  variant={selectedFilters.styles.includes(style) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newStyles = selectedFilters.styles.includes(style)
                      ? selectedFilters.styles.filter(s => s !== style)
                      : [...selectedFilters.styles, style];
                    handleFilterChange('styles', newStyles);
                  }}
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Performance Optimized Artist Listing */}
        <PerformanceOptimizationIntegration
          pageType="artists"
          initialData={initialArtists}
          fetchMoreData={fetchMoreArtists}
          onImageClick={handlePortfolioClick}
          className="performance-optimized-artists"
        />

        {/* Additional Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
              <p className="text-neutral-600 text-sm">
                Optimized images and smart preloading ensure instant browsing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Loading</h3>
              <p className="text-neutral-600 text-sm">
                Connection-aware optimization saves data on slower networks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Mobile Optimized</h3>
              <p className="text-neutral-600 text-sm">
                Perfect experience across all devices with responsive design
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Tips */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-3">Performance Features Active</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>WebP image optimization with JPEG fallbacks</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Lazy loading with intersection observers</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Infinite scroll with debounced loading</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Smart preloading on hover and viewport</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Connection-aware quality adjustment</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Responsive image sizing and srcSet</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceOptimizedArtistsPage;