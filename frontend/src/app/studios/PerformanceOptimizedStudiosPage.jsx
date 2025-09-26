"use client";

import { useState, useCallback } from 'react';
import PerformanceOptimizationIntegration from '../components/PerformanceOptimizationIntegration';
import { Card, CardContent, Button, Badge } from '../../design-system';

/**
 * Performance Optimized Studios Page
 * 
 * Integrates all performance optimization components for the studios listing
 * 
 * Features:
 * - LazyImage with WebP optimization for studio photos
 * - InfiniteScroll for smooth studio loading
 * - OptimizedImage for studio portfolio previews
 * - SmartLink with hover preloading for studio profiles
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6
 */

// Mock data generator for demonstration
const generateMockStudios = (page, count = 20) => {
  return Array.from({ length: count }, (_, i) => {
    const id = (page - 1) * count + i + 1;
    const studioNames = [
      'Ink & Steel Studio', 'Sacred Art Tattoo', 'Black Rose Parlour', 'Electric Canvas',
      'Crimson Needle', 'Artisan Ink', 'The Tattoo Collective', 'Midnight Studio',
      'Royal Ink', 'Urban Canvas', 'Classic Tattoo Co', 'Modern Skin Art'
    ];
    
    return {
      id: `studio-${id}`,
      name: studioNames[id % studioNames.length] || `Studio ${id}`,
      location: `${['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Sheffield', 'Newcastle'][id % 8]}, UK`,
      avatar: `https://picsum.photos/80/80?random=${id + 4000}`,
      mainImage: `https://picsum.photos/400/300?random=${id + 5000}`,
      rating: 4.0 + (Math.random() * 1.0),
      reviewCount: Math.floor(Math.random() * 200) + 20,
      specialties: [
        'Traditional', 'Blackwork', 'Realism', 'Watercolor', 'Minimalist', 
        'Japanese', 'Geometric', 'Portrait', 'Abstract', 'Neo-Traditional',
        'Biomechanical', 'Tribal', 'Celtic', 'Dotwork'
      ].slice(0, Math.floor(Math.random() * 5) + 2),
      portfolioImages: Array.from({ length: Math.floor(Math.random() * 8) + 4 }, (_, j) => ({
        id: `studio-portfolio-${id}-${j}`,
        url: `https://picsum.photos/300/300?random=${id * 200 + j + 6000}`,
        description: `Studio work ${j + 1} from ${studioNames[id % studioNames.length]}`,
        artistName: `Artist ${j + 1}`,
        style: ['Traditional', 'Blackwork', 'Realism', 'Watercolor'][j % 4]
      })),
      contactMethods: ['email', 'phone', 'instagram', 'website'].slice(0, Math.floor(Math.random() * 4) + 2),
      artistCount: Math.floor(Math.random() * 8) + 2,
      establishedYear: 2000 + Math.floor(Math.random() * 23),
      priceRange: {
        min: 60 + Math.floor(Math.random() * 40),
        max: 150 + Math.floor(Math.random() * 250)
      },
      amenities: [
        'Private Rooms', 'Consultation Area', 'Aftercare Products', 'Parking Available',
        'Wheelchair Accessible', 'Air Conditioning', 'Sterile Environment', 'Custom Designs'
      ].slice(0, Math.floor(Math.random() * 5) + 2),
      openingHours: {
        weekdays: '10:00 AM - 8:00 PM',
        weekends: '10:00 AM - 6:00 PM'
      },
      description: `Professional tattoo studio specializing in ${['custom', 'traditional', 'contemporary'][id % 3]} artwork. Established in ${2000 + Math.floor(Math.random() * 23)} with ${Math.floor(Math.random() * 8) + 2} talented artists.`,
      featured: Math.random() > 0.7 // 30% chance of being featured
    };
  });
};

const PerformanceOptimizedStudiosPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    styles: [],
    location: '',
    priceRange: { min: 0, max: 1000 },
    amenities: [],
    featured: false
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'name', 'established'

  // Initial data
  const initialStudios = generateMockStudios(1, 12);

  // Fetch more studios function for infinite scroll
  const fetchMoreStudios = useCallback(async (page) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const newStudios = generateMockStudios(page, 20);
    
    return {
      data: newStudios,
      hasMore: page < 4 // Limit to 4 pages for demo
    };
  }, []);

  // Handle portfolio image click
  const handlePortfolioClick = useCallback((image, index) => {
    console.log('Studio portfolio image clicked:', image, 'at index:', index);
    // In a real app, this would open a lightbox or navigate to full view
  }, []);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    console.log('Searching studios for:', query);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    console.log('Studio filter changed:', filterType, value);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary-800">
                Tattoo Studios
              </h1>
              <p className="text-neutral-600 mt-1">
                Find professional tattoo studios across the UK
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                {initialStudios.length}+ Studios
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
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search studios by name, location, or specialty..."
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

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="rating">Rating</option>
                <option value="name">Name</option>
                <option value="established">Established</option>
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilters.featured ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('featured', !selectedFilters.featured)}
            >
              ⭐ Featured
            </Button>
            
            {['Traditional', 'Blackwork', 'Realism', 'Japanese', 'Geometric'].map(style => (
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
            
            {['Private Rooms', 'Parking Available', 'Wheelchair Accessible'].map(amenity => (
              <Button
                key={amenity}
                variant={selectedFilters.amenities.includes(amenity) ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  const newAmenities = selectedFilters.amenities.includes(amenity)
                    ? selectedFilters.amenities.filter(a => a !== amenity)
                    : [...selectedFilters.amenities, amenity];
                  handleFilterChange('amenities', newAmenities);
                }}
              >
                {amenity}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Performance Optimized Studio Listing */}
        <PerformanceOptimizationIntegration
          pageType="studios"
          initialData={initialStudios}
          fetchMoreData={fetchMoreStudios}
          onImageClick={handlePortfolioClick}
          className="performance-optimized-studios"
        />

        {/* Studio Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Verified Studios</h3>
              <p className="text-neutral-600 text-sm">
                All studios are verified for quality and safety standards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Location Based</h3>
              <p className="text-neutral-600 text-sm">
                Find studios near you with accurate location data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Multiple Artists</h3>
              <p className="text-neutral-600 text-sm">
                Browse portfolios from multiple artists in each studio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Real-time Info</h3>
              <p className="text-neutral-600 text-sm">
                Up-to-date hours, availability, and contact information
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Features Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-6 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-3">Studio Page Performance Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Optimized studio portfolio image loading</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Smart preloading for studio detail pages</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Infinite scroll with error handling</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Responsive image grids for multiple artists</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Connection-aware image quality for studio photos</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Lazy loading for studio amenity information</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceOptimizedStudiosPage;