/**
 * Animation Enhanced Studios Page
 * 
 * Studios page with comprehensive animation and interaction systems integration
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
const mockStudios = [
  {
    id: 1,
    name: "Ink & Soul Studio",
    location: "London, UK",
    rating: 4.9,
    reviewCount: 234,
    specialties: ["Traditional", "Neo-Traditional", "Blackwork", "Color Work"],
    image: "/api/placeholder/400/300",
    artistCount: 8,
    established: 2015,
    priceRange: { min: 120, max: 500, currency: "GBP" },
    amenities: ["Private Rooms", "Consultation", "Custom Design", "Touch-ups"],
    hours: "Mon-Sat 10AM-8PM"
  },
  {
    id: 2,
    name: "Electric Canvas",
    location: "Manchester, UK",
    rating: 4.8,
    reviewCount: 189,
    specialties: ["Realism", "Portrait", "Biomechanical", "Sleeve Work"],
    image: "/api/placeholder/400/300",
    artistCount: 6,
    established: 2018,
    priceRange: { min: 150, max: 600, currency: "GBP" },
    amenities: ["Walk-ins Welcome", "Digital Portfolio", "Aftercare Kit"],
    hours: "Tue-Sun 11AM-9PM"
  },
  {
    id: 3,
    name: "Artisan Ink",
    location: "Birmingham, UK",
    rating: 4.7,
    reviewCount: 156,
    specialties: ["Minimalist", "Fine Line", "Geometric", "Watercolor"],
    image: "/api/placeholder/400/300",
    artistCount: 4,
    established: 2020,
    priceRange: { min: 100, max: 400, currency: "GBP" },
    amenities: ["Sterile Environment", "Vegan Inks", "Female Artists"],
    hours: "Wed-Sun 12PM-7PM"
  }
];

/**
 * Animated Studio Card Component
 */
const AnimatedStudioCard = ({ studio, index }) => {
  const { prefersReducedMotion } = useMicroInteractions();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <FullyAnimatedCard
      hoverEffect="lift"
      focusStyle="glow"
      clickEffect="scale"
      className="overflow-hidden"
      style={{
        animationDelay: prefersReducedMotion ? '0ms' : `${index * 150}ms`
      }}
    >
      {/* Studio Image with Loading Animation */}
      <div className="relative h-48 overflow-hidden">
        <HoverEffectsProvider effect="scale">
          <img
            src={studio.image}
            alt={studio.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
            )}
            onLoad={() => setImageLoaded(true)}
          />
        </HoverEffectsProvider>
        
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <LoadingAnimation type="shimmer" size="large" />
          </div>
        )}
        
        {/* Floating Rating Badge */}
        <HoverEffectsProvider effect="float" className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold">{studio.rating}</span>
            </div>
          </div>
        </HoverEffectsProvider>
      </div>

      {/* Studio Info */}
      <div className="p-6 space-y-4">
        {/* Header with Staggered Animation */}
        <StaggeredContainer staggerDelay={75}>
          <h3 className="text-xl font-bold text-gray-900">{studio.name}</h3>
          <div className="flex items-center text-gray-600 space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{studio.location}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{studio.artistCount} Artists</span>
            <span>Est. {studio.established}</span>
          </div>
        </StaggeredContainer>

        {/* Specialties with Shimmer Effect */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Specialties</h4>
          <div className="flex flex-wrap gap-2">
            {studio.specialties.map((specialty, i) => (
              <HoverEffectsProvider
                key={specialty}
                effect="shimmer"
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                style={{
                  animationDelay: prefersReducedMotion ? '0ms' : `${i * 100}ms`
                }}
              >
                {specialty}
              </HoverEffectsProvider>
            ))}
          </div>
        </div>

        {/* Amenities with Breathe Animation */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Amenities</h4>
          <div className="grid grid-cols-2 gap-1">
            {studio.amenities.map((amenity, i) => (
              <HoverEffectsProvider
                key={amenity}
                effect="breathe"
                className="flex items-center space-x-1 text-xs text-gray-600"
                style={{
                  animationDelay: prefersReducedMotion ? '0ms' : `${i * 150}ms`
                }}
              >
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{amenity}</span>
              </HoverEffectsProvider>
            ))}
          </div>
        </div>

        {/* Pricing with Glow Pulse */}
        <HoverEffectsProvider effect="glowPulse" className="text-center py-2">
          <div className="text-lg font-semibold text-green-600">
            £{studio.priceRange.min} - £{studio.priceRange.max}
          </div>
          <div className="text-sm text-gray-500">Price Range</div>
        </HoverEffectsProvider>

        {/* Hours */}
        <div className="text-center text-sm text-gray-600 border-t pt-3">
          <div className="flex items-center justify-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>{studio.hours}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <FocusIndicator variant="ring" color="primary" className="flex-1">
            <HoverEffectsProvider effect="scale">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none">
                View Studio
              </button>
            </HoverEffectsProvider>
          </FocusIndicator>
          
          <FocusIndicator variant="glow" color="secondary" className="flex-1">
            <HoverEffectsProvider effect="lift">
              <button className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium transition-all duration-200 hover:bg-blue-50 focus:outline-none">
                Book Now
              </button>
            </HoverEffectsProvider>
          </FocusIndicator>
        </div>
      </div>
    </FullyAnimatedCard>
  );
};

/**
 * Animated Map View Toggle
 */
const AnimatedMapToggle = ({ isMapView, onToggle }) => {
  return (
    <FocusIndicator variant="ring" color="primary">
      <HoverEffectsProvider effect="scale">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none",
            isMapView
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>{isMapView ? 'List View' : 'Map View'}</span>
        </button>
      </HoverEffectsProvider>
    </FocusIndicator>
  );
};

/**
 * Main Animation Enhanced Studios Page
 */
export default function AnimationEnhancedStudiosPage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMapView, setIsMapView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudios(mockStudios);
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async (query) => {
    setSearchLoading(true);
    setSearchQuery(query);
    
    // Simulate search API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const filtered = mockStudios.filter(studio =>
      studio.name.toLowerCase().includes(query.toLowerCase()) ||
      studio.location.toLowerCase().includes(query.toLowerCase()) ||
      studio.specialties.some(s => s.toLowerCase().includes(query.toLowerCase()))
    );
    
    setStudios(filtered);
    setSearchLoading(false);
  };

  if (loading) {
    return (
      <AnimationInteractionIntegration>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <PageTransitionManager transitionType="scale" duration={600}>
            <div className="text-center space-y-4">
              <LoadingAnimation type="pulse" size="large" color="primary" />
              <h2 className="text-2xl font-semibold text-gray-900">Loading Studios...</h2>
              <p className="text-gray-600">Discovering the best tattoo studios</p>
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
                  Discover Tattoo Studios
                </h1>
                <p className="text-xl text-gray-600 text-center mb-8">
                  Find professional studios across the UK
                </p>
                
                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}>
                    <FocusIndicator variant="glow" color="primary">
                      <HoverEffectsProvider effect="glow">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search studios by name, location, or specialty..."
                            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 shadow-lg"
                          />
                          <button
                            type="submit"
                            disabled={searchLoading}
                            className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 disabled:opacity-50"
                          >
                            {searchLoading ? (
                              <LoadingAnimation type="spin" size="small" color="white" />
                            ) : (
                              'Search'
                            )}
                          </button>
                        </div>
                      </HoverEffectsProvider>
                    </FocusIndicator>
                  </form>
                </div>

                {/* View Toggle */}
                <div className="flex justify-center">
                  <AnimatedMapToggle 
                    isMapView={isMapView} 
                    onToggle={() => setIsMapView(!isMapView)} 
                  />
                </div>
              </StaggeredContainer>
            </div>
          </header>
        </PageTransitionManager>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageTransitionManager transitionType="fade" duration={400}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                {studios.length} Studios Found
              </h2>
              
              <FocusIndicator variant="ring" color="secondary">
                <HoverEffectsProvider effect="scale">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200">
                    <option>Sort by Rating</option>
                    <option>Sort by Distance</option>
                    <option>Sort by Price</option>
                    <option>Sort by Artists</option>
                  </select>
                </HoverEffectsProvider>
              </FocusIndicator>
            </div>

            {isMapView ? (
              <PageTransitionManager transitionType="scale" duration={400}>
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Map View</h3>
                  <p className="text-gray-600">Interactive map would be displayed here</p>
                </div>
              </PageTransitionManager>
            ) : studios.length === 0 ? (
              <PageTransitionManager transitionType="scale" duration={400}>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Studios Found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria</p>
                </div>
              </PageTransitionManager>
            ) : (
              <StaggeredContainer 
                staggerDelay={150}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {studios.map((studio, index) => (
                  <AnimatedStudioCard
                    key={studio.id}
                    studio={studio}
                    index={index}
                  />
                ))}
              </StaggeredContainer>
            )}
          </PageTransitionManager>
        </main>
      </div>
    </AnimationInteractionIntegration>
  );
}