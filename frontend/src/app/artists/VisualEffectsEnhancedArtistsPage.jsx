"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  EnhancedCard,
  EnhancedButton,
  EnhancedNavigation,
  EnhancedHero,
  EnhancedDivider,
  EnhancedPageContainer,
  EnhancedArtistCard,
  EnhancedSearchBar,
  EnhancedFilterPanel,
  EnhancedLoadingState,
  ShadowEffect,
  GlassEffect,
  GradientEffect,
  TextureEffect,
  AnimationEffect,
  PremiumCard
} from "../components/VisualEffectsIntegration";
import { 
  Input, 
  SearchInput,
  Button, 
  Card, 
  Badge, 
  Tag 
} from "../../design-system/components/ui";
import { TouchTarget, TouchButton, LocationServices } from "../../design-system/components/navigation";
import { 
  InteractiveElement, 
  AnimatedButton, 
  AnimatedCard, 
  MotionWrapper,
  Tooltip 
} from "../../design-system/components/ui";
import { ArtistCardSkeleton } from "../../design-system/components/ui/Skeleton/ArtistCardSkeleton";
import SearchProgressIndicator from "../../design-system/components/feedback/SearchProgressIndicator/SearchProgressIndicator";
import SearchErrorMessage from "../../design-system/components/feedback/SearchErrorMessage/SearchErrorMessage";
import { PageWrapper } from "../../design-system/components/layout";
import { 
  NoSearchResults, 
  NewUserOnboarding, 
  LoadingEmptyState,
  NoFilterResults 
} from "../../design-system/components/feedback/EmptyState";
import { useToast } from "../../design-system/components/feedback/Toast";

// Mock data for demonstration
const MOCK_ARTISTS = [
  {
    id: 1,
    name: "Sarah Mitchell",
    studio: "Ink & Soul Studio",
    location: "London",
    styles: ["Traditional", "Neo-Traditional", "Blackwork"],
    rating: 4.8,
    experience: "senior",
    availability: "booking",
    priceRange: { min: 120, max: 180 },
    avatar: "/placeholder-avatar.jpg",
    portfolio: ["/portfolio1.jpg", "/portfolio2.jpg"]
  },
  {
    id: 2,
    name: "Marcus Chen",
    studio: "Electric Canvas",
    location: "Manchester",
    styles: ["Realism", "Portrait", "Black & Grey"],
    rating: 4.9,
    experience: "master",
    availability: "waitlist",
    priceRange: { min: 200, max: 300 },
    avatar: "/placeholder-avatar.jpg",
    portfolio: ["/portfolio3.jpg", "/portfolio4.jpg"]
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    studio: "Crimson Rose Tattoo",
    location: "Birmingham",
    styles: ["Watercolor", "Floral", "Fine Line"],
    rating: 4.7,
    experience: "experienced",
    availability: "available",
    priceRange: { min: 100, max: 150 },
    avatar: "/placeholder-avatar.jpg",
    portfolio: ["/portfolio5.jpg", "/portfolio6.jpg"]
  },
  {
    id: 4,
    name: "James Thompson",
    studio: "Royal Ink",
    location: "Edinburgh",
    styles: ["Japanese", "Oriental", "Geometric"],
    rating: 4.6,
    experience: "senior",
    availability: "consultation",
    priceRange: { min: 150, max: 220 },
    avatar: "/placeholder-avatar.jpg",
    portfolio: ["/portfolio7.jpg", "/portfolio8.jpg"]
  }
];

/**
 * Visual Effects Enhanced Artists Page
 * Integrates sophisticated visual effects including shadows, glassmorphism, 
 * gradients, textures, and premium component combinations
 */
export default function VisualEffectsEnhancedArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [location, setLocation] = useState("");
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const { showToast } = useToast();

  // Simulate loading and data fetching
  useEffect(() => {
    const loadArtists = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setArtists(MOCK_ARTISTS);
      setLoading(false);
    };

    loadArtists();
  }, []);

  // Filter artists based on search criteria
  const filteredArtists = artists.filter(artist => {
    const matchesSearch = !searchQuery || 
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.studio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.styles.some(style => style.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation = !location || 
      artist.location.toLowerCase().includes(location.toLowerCase());

    const matchesStyles = selectedStyles.length === 0 ||
      selectedStyles.some(style => artist.styles.includes(style));

    return matchesSearch && matchesLocation && matchesStyles;
  });

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    showToast({
      type: "info",
      message: `Searching for "${query}"...`,
      duration: 2000
    });
  }, [showToast]);

  const handleStyleSelect = useCallback((style) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedStyles([]);
    setLocation("");
    setFilters({});
    showToast({
      type: "success",
      message: "Filters cleared",
      duration: 2000
    });
  }, [showToast]);

  return (
    <EnhancedPageContainer 
      gradient="hero-neutral" 
      texture="noise-subtle"
      className="bg-neutral-50"
    >
      {/* Enhanced Hero Section */}
      <EnhancedHero 
        gradient="hero-primary"
        texture="noise-subtle"
        premium
        className="py-16 text-center text-white"
      >
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <AnimationEffect animation="float">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Talented Tattoo Artists
            </h1>
          </AnimationEffect>
          <p className="text-xl mb-8 opacity-90">
            Find the perfect artist for your next tattoo with our comprehensive directory
          </p>
          
          {/* Enhanced Search Bar in Hero */}
          <div className="max-w-2xl mx-auto">
            <EnhancedSearchBar
              placeholder="Search artists, styles, or locations..."
              glassmorphism
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="mb-6"
            />
          </div>

          {/* Quick Style Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Traditional", "Realism", "Watercolor", "Japanese", "Geometric"].map((style) => (
              <EnhancedButton
                key={style}
                variant={selectedStyles.includes(style) ? "primary" : "secondary"}
                glow={selectedStyles.includes(style)}
                onClick={() => handleStyleSelect(style)}
                className="text-sm"
              >
                {style}
              </EnhancedButton>
            ))}
          </div>
        </div>
      </EnhancedHero>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Filter Panel */}
        <div className="mb-8">
          <EnhancedFilterPanel glassmorphism className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Location Filter */}
                <div className="flex-1">
                  <ShadowEffect elevation="surface">
                    <input
                      type="text"
                      placeholder="Location (e.g., London, Manchester)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </ShadowEffect>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <EnhancedButton
                    variant={viewMode === "grid" ? "primary" : "secondary"}
                    onClick={() => setViewMode("grid")}
                    className="px-3 py-2"
                  >
                    Grid
                  </EnhancedButton>
                  <EnhancedButton
                    variant={viewMode === "list" ? "primary" : "secondary"}
                    onClick={() => setViewMode("list")}
                    className="px-3 py-2"
                  >
                    List
                  </EnhancedButton>
                </div>
              </div>

              <div className="flex gap-3">
                <EnhancedButton
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  Advanced Filters
                </EnhancedButton>
                <EnhancedButton
                  variant="ghost"
                  onClick={clearFilters}
                >
                  Clear All
                </EnhancedButton>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <EnhancedDivider variant="gradient-primary" className="mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ShadowEffect elevation="surface">
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Any Experience</option>
                      <option>Apprentice (0-2 years)</option>
                      <option>Junior (2-5 years)</option>
                      <option>Experienced (5-10 years)</option>
                      <option>Senior (10+ years)</option>
                      <option>Master (15+ years)</option>
                    </select>
                  </ShadowEffect>
                  
                  <ShadowEffect elevation="surface">
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Any Price Range</option>
                      <option>Budget (£50-100/hour)</option>
                      <option>Standard (£100-150/hour)</option>
                      <option>Premium (£150-250/hour)</option>
                      <option>Luxury (£250+/hour)</option>
                    </select>
                  </ShadowEffect>
                  
                  <ShadowEffect elevation="surface">
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>Any Availability</option>
                      <option>Available Now</option>
                      <option>Taking Bookings</option>
                      <option>Waitlist Only</option>
                      <option>Consultation Available</option>
                    </select>
                  </ShadowEffect>
                </div>
              </div>
            )}
          </EnhancedFilterPanel>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <GlassEffect variant="card" className="px-4 py-2 rounded-lg">
              <p className="text-sm text-neutral-600">
                Found <span className="font-semibold text-primary-600">{filteredArtists.length}</span> artists
                {searchQuery && ` for "${searchQuery}"`}
                {location && ` in ${location}`}
              </p>
            </GlassEffect>

            {/* Selected Filters */}
            {(selectedStyles.length > 0 || searchQuery || location) && (
              <div className="flex flex-wrap gap-2">
                {selectedStyles.map((style) => (
                  <ShadowEffect key={style} elevation="surface">
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {style}
                      <button
                        onClick={() => handleStyleSelect(style)}
                        className="ml-2 hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  </ShadowEffect>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Artists Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <EnhancedLoadingState 
                key={index}
                message="Loading artist..."
                glassmorphism
              />
            ))}
          </div>
        ) : filteredArtists.length === 0 ? (
          <EnhancedCard 
            elevation="floating" 
            glassmorphism 
            className="text-center py-16"
          >
            <AnimationEffect animation="breathe">
              <div className="w-16 h-16 bg-neutral-300 rounded-full mx-auto mb-4"></div>
            </AnimationEffect>
            <h3 className="text-xl font-semibold mb-2">No Artists Found</h3>
            <p className="text-neutral-600 mb-6">
              Try adjusting your search criteria or browse all artists
            </p>
            <EnhancedButton onClick={clearFilters} glow>
              Clear Filters
            </EnhancedButton>
          </EnhancedCard>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}>
            {filteredArtists.map((artist, index) => (
              <AnimationEffect 
                key={artist.id} 
                animation="float"
                className="h-full"
              >
                <EnhancedArtistCard
                  artist={artist}
                  premium={index === 0} // Make first artist premium
                  glassmorphism={index % 3 === 1} // Every third artist gets glassmorphism
                  elevation={index % 2 === 0 ? "raised" : "surface"}
                  className="h-full"
                />
              </AnimationEffect>
            ))}
          </div>
        )}

        {/* Load More Section */}
        {filteredArtists.length > 0 && (
          <div className="text-center mt-12">
            <EnhancedDivider variant="gradient-primary" className="mb-8" />
            <PremiumCard className="inline-block p-6">
              <p className="text-neutral-600 mb-4">
                Showing {filteredArtists.length} of {artists.length} artists
              </p>
              <EnhancedButton premium glow>
                Load More Artists
              </EnhancedButton>
            </PremiumCard>
          </div>
        )}
      </div>

      {/* Enhanced Footer Section */}
      <div className="bg-neutral-900 text-white py-16 mt-16">
        <GradientEffect variant="top-primary" className="h-full">
          <TextureEffect variant="noise-subtle" overlay>
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Inked?</h2>
              <p className="text-neutral-300 mb-8 max-w-2xl mx-auto">
                Connect with talented artists in your area and bring your tattoo vision to life
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <EnhancedButton premium className="px-8 py-3">
                  Browse All Artists
                </EnhancedButton>
                <EnhancedButton variant="outline" className="px-8 py-3 border-white text-white hover:bg-white hover:text-neutral-900">
                  Join as Artist
                </EnhancedButton>
              </div>
            </div>
          </TextureEffect>
        </GradientEffect>
      </div>
    </EnhancedPageContainer>
  );
}