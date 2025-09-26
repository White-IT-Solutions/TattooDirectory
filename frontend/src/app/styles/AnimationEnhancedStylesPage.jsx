/**
 * Animation Enhanced Styles Page
 * 
 * Styles page with comprehensive animation and interaction systems integration
 * including micro-interactions, page transitions, hover effects, and accessibility.
 * 
 * Task 18: Integrate animation and interaction systems
 */

"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '../../design-system/utils/cn';
import {
  AnimationInteractionIntegration,
  HoverEffectsProvider,
  FocusIndicator,
  PageTransitionManager,
  LoadingAnimation,
  StaggeredContainer,
  FullyAnimatedCard,
  useMicroInteractions
} from '../components/AnimationInteractionIntegration';

// Mock data for demonstration
const mockStyles = [
  {
    id: 1,
    name: "Traditional",
    description: "Bold lines, solid colors, and classic imagery",
    difficulty: "Beginner",
    popularity: 95,
    characteristics: ["Bold Lines", "Solid Colors", "Classic Motifs"],
    images: [
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300"
    ],
    artistCount: 156,
    averagePrice: { min: 120, max: 300, currency: "GBP" },
    timeOrigin: "1900s",
    popularMotifs: ["Anchors", "Roses", "Eagles", "Hearts"]
  },
  {
    id: 2,
    name: "Realism",
    description: "Photorealistic tattoos with incredible detail",
    difficulty: "Expert",
    popularity: 88,
    characteristics: ["Photorealistic", "High Detail", "Shading"],
    images: [
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300"
    ],
    artistCount: 89,
    averagePrice: { min: 200, max: 600, currency: "GBP" },
    timeOrigin: "1980s",
    popularMotifs: ["Portraits", "Animals", "Nature", "Objects"]
  },
  {
    id: 3,
    name: "Minimalist",
    description: "Simple, clean designs with elegant lines",
    difficulty: "Intermediate",
    popularity: 92,
    characteristics: ["Clean Lines", "Simple Design", "Negative Space"],
    images: [
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300"
    ],
    artistCount: 134,
    averagePrice: { min: 80, max: 250, currency: "GBP" },
    timeOrigin: "2000s",
    popularMotifs: ["Geometric", "Symbols", "Text", "Nature"]
  },
  {
    id: 4,
    name: "Blackwork",
    description: "Bold black ink designs and patterns",
    difficulty: "Advanced",
    popularity: 76,
    characteristics: ["Black Ink Only", "Bold Patterns", "Geometric"],
    images: [
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300",
      "/api/placeholder/300/300"
    ],
    artistCount: 67,
    averagePrice: { min: 150, max: 400, currency: "GBP" },
    timeOrigin: "Ancient",
    popularMotifs: ["Tribal", "Mandala", "Geometric", "Abstract"]
  }
];

/**
 * Animated Style Card Component
 */
const AnimatedStyleCard = ({ style, index, onImageClick }) => {
  const { prefersReducedMotion } = useMicroInteractions();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Auto-rotate images
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % style.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [style.images.length, prefersReducedMotion]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <FullyAnimatedCard
      hoverEffect="lift"
      focusStyle="glow"
      clickEffect="scale"
      className="overflow-hidden"
      style={{
        animationDelay: prefersReducedMotion ? '0ms' : `${index * 200}ms`
      }}
    >
      {/* Image Gallery with Hover Animation */}
      <div className="relative h-64 overflow-hidden group">
        <HoverEffectsProvider effect="scale">
          <img
            src={style.images[currentImageIndex]}
            alt={`${style.name} tattoo style`}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 cursor-pointer",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onClick={() => onImageClick(style, currentImageIndex)}
          />
        </HoverEffectsProvider>
        
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <LoadingAnimation type="shimmer" size="large" />
          </div>
        )}

        {/* Image Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {style.images.map((_, i) => (
            <HoverEffectsProvider key={i} effect="scale">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(i);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  i === currentImageIndex
                    ? "bg-white shadow-lg scale-125"
                    : "bg-white/60 hover:bg-white/80"
                )}
              />
            </HoverEffectsProvider>
          ))}
        </div>

        {/* Difficulty Badge */}
        <HoverEffectsProvider effect="float" className="absolute top-4 right-4">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold shadow-lg",
            getDifficultyColor(style.difficulty)
          )}>
            {style.difficulty}
          </div>
        </HoverEffectsProvider>

        {/* Popularity Indicator */}
        <HoverEffectsProvider effect="breathe" className="absolute top-4 left-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">{style.popularity}%</span>
            </div>
          </div>
        </HoverEffectsProvider>
      </div>

      {/* Style Info */}
      <div className="p-6 space-y-4">
        {/* Header with Staggered Animation */}
        <StaggeredContainer staggerDelay={75}>
          <h3 className="text-2xl font-bold text-gray-900">{style.name}</h3>
          <p className="text-gray-600">{style.description}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{style.artistCount} Artists</span>
            <span>Origin: {style.timeOrigin}</span>
          </div>
        </StaggeredContainer>

        {/* Characteristics with Shimmer Effect */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Characteristics</h4>
          <div className="flex flex-wrap gap-2">
            {style.characteristics.map((characteristic, i) => (
              <HoverEffectsProvider
                key={characteristic}
                effect="shimmer"
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                style={{
                  animationDelay: prefersReducedMotion ? '0ms' : `${i * 100}ms`
                }}
              >
                {characteristic}
              </HoverEffectsProvider>
            ))}
          </div>
        </div>

        {/* Popular Motifs */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Popular Motifs</h4>
          <div className="grid grid-cols-2 gap-1">
            {style.popularMotifs.map((motif, i) => (
              <HoverEffectsProvider
                key={motif}
                effect="breathe"
                className="flex items-center space-x-1 text-sm text-gray-600"
                style={{
                  animationDelay: prefersReducedMotion ? '0ms' : `${i * 150}ms`
                }}
              >
                <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{motif}</span>
              </HoverEffectsProvider>
            ))}
          </div>
        </div>

        {/* Pricing with Glow Pulse */}
        <HoverEffectsProvider effect="glowPulse" className="text-center py-3 border-t">
          <div className="text-lg font-semibold text-green-600">
            £{style.averagePrice.min} - £{style.averagePrice.max}
          </div>
          <div className="text-sm text-gray-500">Average Price Range</div>
        </HoverEffectsProvider>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <FocusIndicator variant="ring" color="primary" className="flex-1">
            <HoverEffectsProvider effect="scale">
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-purple-700 focus:outline-none">
                View Gallery
              </button>
            </HoverEffectsProvider>
          </FocusIndicator>
          
          <FocusIndicator variant="glow" color="secondary" className="flex-1">
            <HoverEffectsProvider effect="lift">
              <button className="w-full px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-medium transition-all duration-200 hover:bg-purple-50 focus:outline-none">
                Find Artists
              </button>
            </HoverEffectsProvider>
          </FocusIndicator>
        </div>
      </div>
    </FullyAnimatedCard>
  );
};

/**
 * Animated Filter Bar
 */
const AnimatedFilterBar = ({ filters, onFilterChange }) => {
  const filterOptions = [
    { key: 'difficulty', label: 'Difficulty', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    { key: 'popularity', label: 'Popularity', options: ['90%+', '80%+', '70%+', '60%+'] },
    { key: 'price', label: 'Price Range', options: ['Under £150', '£150-300', '£300-500', '£500+'] }
  ];

  return (
    <PageTransitionManager transitionType="slideUp" duration={400}>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Styles</h3>
        
        <StaggeredContainer staggerDelay={100} className="space-y-4">
          {filterOptions.map((filter) => (
            <div key={filter.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {filter.label}
              </label>
              <div className="flex flex-wrap gap-2">
                {filter.options.map((option) => (
                  <FocusIndicator key={option} variant="ring" color="primary">
                    <HoverEffectsProvider effect="scale">
                      <button
                        onClick={() => onFilterChange(filter.key, option)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none",
                          filters[filter.key] === option
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {option}
                      </button>
                    </HoverEffectsProvider>
                  </FocusIndicator>
                ))}
              </div>
            </div>
          ))}
        </StaggeredContainer>
      </div>
    </PageTransitionManager>
  );
};

/**
 * Lightbox Modal for Image Viewing
 */
const AnimatedLightbox = ({ style, imageIndex, isOpen, onClose, onNext, onPrev }) => {
  if (!isOpen || !style) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <PageTransitionManager transitionType="scale" duration={300}>
        <div className="relative max-w-4xl max-h-[90vh] mx-4">
          <HoverEffectsProvider effect="scale">
            <img
              src={style.images[imageIndex]}
              alt={`${style.name} tattoo`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </HoverEffectsProvider>
          
          {/* Navigation */}
          <FocusIndicator variant="glow" className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <HoverEffectsProvider effect="scale">
              <button
                onClick={onPrev}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-200 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </HoverEffectsProvider>
          </FocusIndicator>
          
          <FocusIndicator variant="glow" className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <HoverEffectsProvider effect="scale">
              <button
                onClick={onNext}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-200 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </HoverEffectsProvider>
          </FocusIndicator>
          
          {/* Close Button */}
          <FocusIndicator variant="glow" className="absolute top-4 right-4">
            <HoverEffectsProvider effect="scale">
              <button
                onClick={onClose}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-200 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </HoverEffectsProvider>
          </FocusIndicator>
        </div>
      </PageTransitionManager>
    </div>
  );
};

/**
 * Main Animation Enhanced Styles Page
 */
export default function AnimationEnhancedStylesPage() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [lightbox, setLightbox] = useState({ isOpen: false, style: null, imageIndex: 0 });

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setStyles(mockStyles);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? null : value
    }));
  };

  const handleImageClick = (style, imageIndex) => {
    setLightbox({ isOpen: true, style, imageIndex });
  };

  const handleLightboxNext = () => {
    if (!lightbox.style) return;
    setLightbox(prev => ({
      ...prev,
      imageIndex: (prev.imageIndex + 1) % prev.style.images.length
    }));
  };

  const handleLightboxPrev = () => {
    if (!lightbox.style) return;
    setLightbox(prev => ({
      ...prev,
      imageIndex: prev.imageIndex === 0 ? prev.style.images.length - 1 : prev.imageIndex - 1
    }));
  };

  if (loading) {
    return (
      <AnimationInteractionIntegration>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <PageTransitionManager transitionType="scale" duration={600}>
            <div className="text-center space-y-4">
              <LoadingAnimation type="pulse" size="large" color="primary" />
              <h2 className="text-2xl font-semibold text-gray-900">Loading Styles...</h2>
              <p className="text-gray-600">Exploring tattoo art styles</p>
            </div>
          </PageTransitionManager>
        </div>
      </AnimationInteractionIntegration>
    );
  }

  return (
    <AnimationInteractionIntegration>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <PageTransitionManager transitionType="slideDown" duration={600}>
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <StaggeredContainer staggerDelay={150}>
                <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
                  Explore Tattoo Styles
                </h1>
                <p className="text-xl text-gray-600 text-center mb-8">
                  Discover different tattoo art styles and find your perfect match
                </p>
              </StaggeredContainer>
            </div>
          </header>
        </PageTransitionManager>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <AnimatedFilterBar filters={filters} onFilterChange={handleFilterChange} />

          {/* Styles Grid */}
          <PageTransitionManager transitionType="fade" duration={400}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {styles.length} Tattoo Styles
              </h2>
            </div>

            <StaggeredContainer 
              staggerDelay={200}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {styles.map((style, index) => (
                <AnimatedStyleCard
                  key={style.id}
                  style={style}
                  index={index}
                  onImageClick={handleImageClick}
                />
              ))}
            </StaggeredContainer>
          </PageTransitionManager>
        </main>

        {/* Lightbox */}
        <AnimatedLightbox
          style={lightbox.style}
          imageIndex={lightbox.imageIndex}
          isOpen={lightbox.isOpen}
          onClose={() => setLightbox({ isOpen: false, style: null, imageIndex: 0 })}
          onNext={handleLightboxNext}
          onPrev={handleLightboxPrev}
        />
      </div>
    </AnimationInteractionIntegration>
  );
}