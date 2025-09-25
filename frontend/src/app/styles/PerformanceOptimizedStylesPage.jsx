"use client";

import { useState, useCallback } from 'react';
import PerformanceOptimizationIntegration from '../components/PerformanceOptimizationIntegration';
import { Card, CardContent, Button, Badge } from '../../design-system';

/**
 * Performance Optimized Styles Page
 * 
 * Integrates all performance optimization components for the styles gallery
 * 
 * Features:
 * - LazyImage with WebP optimization for style examples
 * - InfiniteScroll for smooth style browsing
 * - OptimizedImage for style gallery previews
 * - SmartLink with hover preloading for style details
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6
 */

// Mock data generator for demonstration
const generateMockStyles = (page, count = 20) => {
  const styleNames = [
    'Traditional American', 'Japanese Traditional', 'Blackwork', 'Realism', 'Watercolor',
    'Minimalist', 'Geometric', 'Neo-Traditional', 'Biomechanical', 'Tribal',
    'Celtic', 'Dotwork', 'Abstract', 'Portrait', 'Lettering',
    'Fine Line', 'Ornamental', 'Surrealism', 'New School', 'Old School'
  ];

  const characteristics = [
    'Bold Lines', 'Vibrant Colors', 'Detailed Shading', 'Symbolic', 'Cultural',
    'Minimalist', 'Intricate Patterns', 'Realistic', 'Artistic', 'Modern',
    'Classic', 'Spiritual', 'Nature-Inspired', 'Geometric Shapes', 'Fine Details'
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const popularMotifs = [
    'Roses', 'Skulls', 'Dragons', 'Birds', 'Flowers', 'Anchors', 'Hearts',
    'Butterflies', 'Lions', 'Wolves', 'Trees', 'Mandala', 'Compass', 'Feathers'
  ];

  return Array.from({ length: count }, (_, i) => {
    const id = (page - 1) * count + i + 1;
    const styleName = styleNames[id % styleNames.length] || `Style ${id}`;
    
    return {
      id: `style-${id}`,
      name: styleName,
      location: 'Various Locations', // Styles are not location-specific
      avatar: `https://picsum.photos/80/80?random=${id + 7000}`, // Style icon/symbol
      mainImage: `https://picsum.photos/400/300?random=${id + 8000}`,
      rating: 4.0 + (Math.random() * 1.0),
      reviewCount: Math.floor(Math.random() * 500) + 50,
      specialties: characteristics.slice(0, Math.floor(Math.random() * 4) + 2),
      portfolioImages: Array.from({ length: Math.floor(Math.random() * 12) + 6 }, (_, j) => ({
        id: `style-example-${id}-${j}`,
        url: `https://picsum.photos/300/300?random=${id * 300 + j + 9000}`,
        description: `${styleName} example ${j + 1}`,
        artistName: `Artist ${(j % 10) + 1}`,
        style: styleName,
        difficulty: difficulties[j % difficulties.length]
      })),
      contactMethods: [], // Styles don't have direct contact methods
      difficulty: difficulties[id % difficulties.length],
      timeOrigin: [
        'Ancient Times', '1800s', 'Early 1900s', 'Mid 1900s', 'Late 1900s', 
        'Early 2000s', '2010s', 'Modern Era'
      ][id % 8],
      popularMotifs: popularMotifs.slice(0, Math.floor(Math.random() * 6) + 3),
      artistCount: Math.floor(Math.random() * 200) + 20,
      averagePrice: {
        min: 80 + Math.floor(Math.random() * 50),
        max: 200 + Math.floor(Math.random() * 400)
      },
      colorPalette: [
        'Black & Grey', 'Full Color', 'Limited Palette', 'Monochrome',
        'Vibrant Colors', 'Earth Tones', 'Pastel Colors'
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      description: `${styleName} is characterized by ${characteristics[id % characteristics.length].toLowerCase()} and ${characteristics[(id + 1) % characteristics.length].toLowerCase()}. Popular since ${[
        'Ancient Times', '1800s', 'Early 1900s', 'Mid 1900s', 'Late 1900s', 
        'Early 2000s', '2010s', 'Modern Era'
      ][id % 8]}.`,
      trending: Math.random() > 0.8, // 20% chance of being trending
      featured: Math.random() > 0.7 // 30% chance of being featured
    };
  });
};

const PerformanceOptimizedStylesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    difficulty: [],
    colorPalette: [],
    timeOrigin: '',
    characteristics: [],
    trending: false,
    featured: false
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'gallery'
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'name', 'difficulty'

  // Initial data
  const initialStyles = generateMockStyles(1, 15);

  // Fetch more styles function for infinite scroll
  const fetchMoreStyles = useCallback(async (page) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const newStyles = generateMockStyles(page, 20);
    
    return {
      data: newStyles,
      hasMore: page < 6 // Limit to 6 pages for demo
    };
  }, []);

  // Handle style example image click
  const handleStyleExampleClick = useCallback((image, index) => {
    console.log('Style example image clicked:', image, 'at index:', index);
    // In a real app, this would open a lightbox or navigate to full view
  }, []);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    console.log('Searching styles for:', query);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    console.log('Style filter changed:', filterType, value);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary-800">
                Tattoo Styles
              </h1>
              <p className="text-neutral-600 mt-1">
                Explore different tattoo styles and find inspiration
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                {initialStyles.length}+ Styles
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
                  variant={viewMode === 'gallery' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('gallery')}
                >
                  Gallery
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
                  placeholder="Search styles by name, characteristics, or motifs..."
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
                <option value="popularity">Popularity</option>
                <option value="name">Name</option>
                <option value="difficulty">Difficulty</option>
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilters.trending ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('trending', !selectedFilters.trending)}
            >
              🔥 Trending
            </Button>
            
            <Button
              variant={selectedFilters.featured ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('featured', !selectedFilters.featured)}
            >
              ⭐ Featured
            </Button>
            
            {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(difficulty => (
              <Button
                key={difficulty}
                variant={selectedFilters.difficulty.includes(difficulty) ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  const newDifficulty = selectedFilters.difficulty.includes(difficulty)
                    ? selectedFilters.difficulty.filter(d => d !== difficulty)
                    : [...selectedFilters.difficulty, difficulty];
                  handleFilterChange('difficulty', newDifficulty);
                }}
              >
                {difficulty}
              </Button>
            ))}
            
            {['Black & Grey', 'Full Color', 'Vibrant Colors'].map(palette => (
              <Button
                key={palette}
                variant={selectedFilters.colorPalette.includes(palette) ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  const newPalette = selectedFilters.colorPalette.includes(palette)
                    ? selectedFilters.colorPalette.filter(p => p !== palette)
                    : [...selectedFilters.colorPalette, palette];
                  handleFilterChange('colorPalette', newPalette);
                }}
              >
                {palette}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Performance Optimized Style Listing */}
        <PerformanceOptimizationIntegration
          pageType="styles"
          initialData={initialStyles}
          fetchMoreData={fetchMoreStyles}
          onImageClick={handleStyleExampleClick}
          className="performance-optimized-styles"
        />

        {/* Style Categories Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-primary-800 mb-6">Popular Style Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌹</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Traditional</h3>
                <p className="text-neutral-600 text-sm">
                  Classic American traditional with bold lines and vibrant colors
                </p>
                <Badge variant="outline" className="mt-2">
                  {Math.floor(Math.random() * 50) + 20} Artists
                </Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚫</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Blackwork</h3>
                <p className="text-neutral-600 text-sm">
                  Bold black ink designs with geometric and tribal influences
                </p>
                <Badge variant="outline" className="mt-2">
                  {Math.floor(Math.random() * 40) + 15} Artists
                </Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Watercolor</h3>
                <p className="text-neutral-600 text-sm">
                  Artistic watercolor effects with flowing, painterly techniques
                </p>
                <Badge variant="outline" className="mt-2">
                  {Math.floor(Math.random() * 30) + 10} Artists
                </Badge>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📐</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Geometric</h3>
                <p className="text-neutral-600 text-sm">
                  Precise geometric patterns and mathematical designs
                </p>
                <Badge variant="outline" className="mt-2">
                  {Math.floor(Math.random() * 35) + 12} Artists
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Style Guide Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Choosing Your Style</h3>
              <div className="space-y-3 text-sm text-neutral-600">
                <div className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Consider your personal aesthetic and lifestyle</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Think about placement and size requirements</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Research artists who specialize in your chosen style</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Consider long-term aging of different style elements</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Style Difficulty Guide</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Beginner</span>
                  <Badge variant="success" size="sm">Simple lines, basic shading</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Intermediate</span>
                  <Badge variant="warning" size="sm">Detailed work, color blending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Advanced</span>
                  <Badge variant="error" size="sm">Complex techniques, realism</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expert</span>
                  <Badge variant="primary" size="sm">Master-level artistry</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Features Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-6 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-3">Styles Page Performance Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Optimized style example image galleries</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Smart preloading for style detail pages</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Infinite scroll for style browsing</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Responsive portfolio grids for style examples</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Connection-aware image quality for style galleries</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Lazy loading for style characteristic data</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceOptimizedStylesPage;