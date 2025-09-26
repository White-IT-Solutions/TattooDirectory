/**
 * Animation Enhanced Artists Page
 * 
 * Artists page with comprehensive animation and interaction systems integration
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
const mockArtists = [
  {
    id: 1,
    name: "Sarah Chen",
    studio: "Ink & Soul Studio",
    location: "London, UK",
    rating: 4.9,
    reviewCount: 127,
    specialties: ["Traditional", "Neo-Traditional", "Blackwork"],
    avatar: "/api/placeholder/150/150",
    portfolio: ["/api/placeholder/300/300", "/api/placeholder/300/300"],
    pricing: { min: 150, max: 400, currency: "GBP" },
    availability: "Available",
    experience: "Expert"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    studio: "Electric Canvas",
    location: "Manchester, UK",
    rating: 4.8,
    reviewCount: 89,
    specialties: ["Realism", "Portrait", "Color Work"],
    avatar: "/api/placeholder/150/150",
    portfolio: ["/api/placeholder/300/300", "/api/placeholder/300/300"],
    pricing: { min: 200, max: 500, currency: "GBP" },
    availability: "Booking",
    experience: "Advanced"
  },
  {
    id: 3,
    name: "Emma Thompson",
    studio: "Artisan Ink",
    location: "Birmingham, UK",
    rating: 4.7,
    reviewCount: 156,
    specialties: ["Minimalist", "Fine Line", "Geometric"],
    avatar: "/api/placeholder/150/150",
    portfolio: ["/api/placeholder/300/300", "/api/placeholder/300/300"],
    pricing: { min: 120, max: 350, currency: "GBP" },
    availability: "Available",
    experience: "Intermediate"
  }
];

/**
 * Animated Artist Card Component
 */
const AnimatedArtistCard = ({ artist, index }) => {
  const { prefersReducedMotion } = useMicroInteractions();

  return (
    <FullyAnimatedCard
      hoverEffect="lift"
      focusStyle="ring"
      clickEffect="scale"
      className="p-6 space-y-4"
      style={{
        animationDelay: prefersReducedMotion ? '0ms' : `${index * 100}ms`
      }}
    >
      {/* Artist Avatar with Hover Animation */}
      <HoverEffectsProvider effect="float" className="flex justify-center">
        <div className="relative">
          <img
            src={artist.avatar}
            alt={artist.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </HoverEffectsProvider>

      {/* Artist Info with Staggered Animation */}
      <StaggeredContainer staggerDelay={50} className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-900">{artist.name}</h3>
        <p className="text-gray-600">{artist.studio}</p>
        <p className="text-sm text-gray-500">{artist.location}</p>
      </StaggeredContainer>

      {/* Rating with Glow Animation */}
      <HoverEffectsProvider effect="glowPulse" className="flex items-center justify-center space-x-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={cn(
                "w-4 h-4 transition-colors duration-200",
                i < Math.floor(artist.rating) ? "text-yellow-400" : "text-gray-300"
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {artist.rating} ({artist.reviewCount} reviews)
        </span>
      </HoverEffectsProvider>

      {/* Specialties with Shimmer Effect */}
      <div className="flex flex-wrap justify-center gap-2">
        {artist.specialties.map((specialty, i) => (
          <HoverEffectsProvider
            key={specialty}
            effect="shimmer"
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            style={{
              animationDelay: prefersReducedMotion ? '0ms' : `${i * 100}ms`
            }}
          >
            {specialty}
          </HoverEffectsProvider>
        ))}
      </div>

      {/* Pricing with Breathe Animation */}
      <HoverEffectsProvider effect="breathe" className="text-center">
        <div className="text-lg font-semibold text-green-600">
          £{artist.pricing.min} - £{artist.pricing.max}
        </div>
        <div className="text-sm text-gray-500">Per session</div>
      </HoverEffectsProvider>

      {/* Action Buttons with Focus Indicators */}
      <div className="flex space-x-3 pt-4">
        <FocusIndicator variant="ring" color="primary" className="flex-1">
          <HoverEffectsProvider effect="scale">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none">
              View Portfolio
            </button>
          </HoverEffectsProvider>
        </FocusIndicator>
        
        <FocusIndicator variant="glow" color="secondary" className="flex-1">
          <HoverEffectsProvider effect="lift">
            <button className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium transition-all duration-200 hover:bg-blue-50 focus:outline-none">
              Contact
            </button>
          </HoverEffectsProvider>
        </FocusIndicator>
      </div>
    </FullyAnimatedCard>
  );
};

/**
 * Animated Search Bar Component
 */
const AnimatedSearchBar = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const { prefersReducedMotion } = useMicroInteractions();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <PageTransitionManager transitionType="slideDown" duration={400}>
      <form onSubmit={handleSubmit} className="relative">
        <FocusIndicator variant="glow" color="primary">
          <HoverEffectsProvider effect="glow">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artists by name, style, or location..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 shadow-lg"
            />
          </HoverEffectsProvider>
        </FocusIndicator>
        
        <FocusIndicator variant="ring" className="absolute right-2 top-2">
          <HoverEffectsProvider effect="scale">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 focus:outline-none"
            >
              {loading ? (
                <LoadingAnimation type="spin" size="small" color="white" />
              ) : (
                'Search'
              )}
            </button>
          </HoverEffectsProvider>
        </FocusIndicator>
      </form>
    </PageTransitionManager>
  );
};

/**
 * Animated Filter Section
 */
const AnimatedFilters = ({ filters, onFilterChange }) => {
  const filterOptions = [
    { key: 'style', label: 'Style', options: ['Traditional', 'Realism', 'Minimalist', 'Blackwork'] },
    { key: 'location', label: 'Location', options: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
    { key: 'availability', label: 'Availability', options: ['Available', 'Booking', 'Waitlist'] }
  ];

  return (
    <PageTransitionManager transitionType="slideUp" duration={500}>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        
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
                            ? "bg-blue-600 text-white shadow-lg"
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
 * Main Animation Enhanced Artists Page
 */
export default function AnimationEnhancedArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({});

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setArtists(mockArtists);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async (query) => {
    setSearchLoading(true);
    
    // Simulate search API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const filtered = mockArtists.filter(artist =>
      artist.name.toLowerCase().includes(query.toLowerCase()) ||
      artist.specialties.some(s => s.toLowerCase().includes(query.toLowerCase())) ||
      artist.location.toLowerCase().includes(query.toLowerCase())
    );
    
    setArtists(filtered);
    setSearchLoading(false);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? null : value
    }));
  };

  if (loading) {
    return (
      <AnimationInteractionIntegration>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <PageTransitionManager transitionType="scale" duration={600}>
            <div className="text-center space-y-4">
              <LoadingAnimation type="pulse" size="large" color="primary" />
              <h2 className="text-2xl font-semibold text-gray-900">Loading Artists...</h2>
              <p className="text-gray-600">Finding the best tattoo artists for you</p>
            </div>
          </PageTransitionManager>
        </div>
      </AnimationInteractionIntegration>
    );
  }

  return (
    <AnimationInteractionIntegration>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Page Transition */}
        <PageTransitionManager transitionType="slideDown" duration={600}>
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <StaggeredContainer staggerDelay={150}>
                <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
                  Find Your Perfect Tattoo Artist
                </h1>
                <p className="text-xl text-gray-600 text-center mb-8">
                  Discover talented artists across the UK
                </p>
                
                <div className="max-w-2xl mx-auto">
                  <AnimatedSearchBar onSearch={handleSearch} loading={searchLoading} />
                </div>
              </StaggeredContainer>
            </div>
          </header>
        </PageTransitionManager>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <AnimatedFilters filters={filters} onFilterChange={handleFilterChange} />
            </div>

            {/* Artists Grid */}
            <div className="lg:col-span-3">
              <PageTransitionManager transitionType="fade" duration={400}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {artists.length} Artists Found
                  </h2>
                  
                  <FocusIndicator variant="ring" color="secondary">
                    <HoverEffectsProvider effect="scale">
                      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200">
                        <option>Sort by Rating</option>
                        <option>Sort by Distance</option>
                        <option>Sort by Price</option>
                      </select>
                    </HoverEffectsProvider>
                  </FocusIndicator>
                </div>

                {artists.length === 0 ? (
                  <PageTransitionManager transitionType="scale" duration={400}>
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎨</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Artists Found</h3>
                      <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                  </PageTransitionManager>
                ) : (
                  <StaggeredContainer 
                    staggerDelay={100}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {artists.map((artist, index) => (
                      <AnimatedArtistCard
                        key={artist.id}
                        artist={artist}
                        index={index}
                      />
                    ))}
                  </StaggeredContainer>
                )}
              </PageTransitionManager>
            </div>
          </div>
        </main>
      </div>
    </AnimationInteractionIntegration>
  );
}