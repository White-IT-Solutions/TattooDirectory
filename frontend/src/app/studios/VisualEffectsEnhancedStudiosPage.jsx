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
  EnhancedStudioCard,
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
import { useToast } from "../../design-system/components/feedback/Toast";

// Mock data for demonstration
const MOCK_STUDIOS = [
  {
    id: 1,
    name: "Ink & Soul Studio",
    location: "London, UK",
    address: "123 Camden High Street, London NW1 7JR",
    specialties: ["Traditional", "Neo-Traditional", "Blackwork", "Realism"],
    artistCount: 8,
    rating: 4.8,
    reviewCount: 156,
    established: 2015,
    image: "/placeholder-studio.jpg",
    features: ["Walk-ins Welcome", "Custom Designs", "Aftercare Support"],
    priceRange: { min: 80, max: 200 },
    openHours: "Mon-Sat 10AM-8PM, Sun 12PM-6PM"
  },
  {
    id: 2,
    name: "Electric Canvas",
    location: "Manchester, UK", 
    address: "45 Northern Quarter, Manchester M1 1JG",
    specialties: ["Realism", "Portrait", "Black & Grey", "Biomechanical"],
    artistCount: 12,
    rating: 4.9,
    reviewCount: 203,
    established: 2012,
    image: "/placeholder-studio.jpg",
    features: ["Award Winning", "Sterile Environment", "Free Consultations"],
    priceRange: { min: 120, max: 300 },
    openHours: "Tue-Sat 11AM-7PM"
  },
  {
    id: 3,
    name: "Crimson Rose Tattoo",
    location: "Birmingham, UK",
    address: "78 Digbeth, Birmingham B5 6DY",
    specialties: ["Watercolor", "Floral", "Fine Line", "Minimalist"],
    artistCount: 6,
    rating: 4.7,
    reviewCount: 89,
    established: 2018,
    image: "/placeholder-studio.jpg",
    features: ["Female Artists", "LGBTQ+ Friendly", "Vegan Inks"],
    priceRange: { min: 90, max: 180 },
    openHours: "Wed-Sun 10AM-6PM"
  },
  {
    id: 4,
    name: "Royal Ink",
    location: "Edinburgh, UK",
    address: "22 Royal Mile, Edinburgh EH1 2PB",
    specialties: ["Japanese", "Oriental", "Geometric", "Tribal"],
    artistCount: 10,
    rating: 4.6,
    reviewCount: 134,
    established: 2010,
    image: "/placeholder-studio.jpg",
    features: ["Historic Location", "Master Artists", "Traditional Methods"],
    priceRange: { min: 100, max: 250 },
    openHours: "Mon-Sat 9AM-8PM"
  }
];

/**
 * Visual Effects Enhanced Studios Page
 * Integrates sophisticated visual effects for studio browsing experience
 */
export default function VisualEffectsEnhancedStudiosPage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [location, setLocation] = useState("");
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const { showToast } = useToast();

  // Simulate loading and data fetching
  useEffect(() => {
    const loadStudios = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      setStudios(MOCK_STUDIOS);
      setLoading(false);
    };

    loadStudios();
  }, []);

  // Filter studios based on search criteria
  const filteredStudios = studios.filter(studio => {
    const matchesSearch = !searchQuery || 
      studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studio.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studio.specialties.some(specialty => specialty.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation = !location || 
      studio.location.toLowerCase().includes(location.toLowerCase());

    const matchesSpecialties = selectedSpecialties.length === 0 ||
      selectedSpecialties.some(specialty => studio.specialties.includes(specialty));

    return matchesSearch && matchesLocation && matchesSpecialties;
  });

  // Sort studios
  const sortedStudios = [...filteredStudios].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "artistCount":
        return b.artistCount - a.artistCount;
      case "established":
        return a.established - b.established;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    showToast({
      type: "info",
      message: `Searching studios for "${query}"...`,
      duration: 2000
    });
  }, [showToast]);

  const handleSpecialtySelect = useCallback((specialty) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedSpecialties([]);
    setLocation("");
    setFilters({});
    setSortBy("rating");
    showToast({
      type: "success",
      message: "Filters cleared",
      duration: 2000
    });
  }, [showToast]);

  return (
    <EnhancedPageContainer 
      gradient="hero-neutral" 
      texture="paper-subtle"
      className="bg-neutral-50"
    >
      {/* Enhanced Hero Section */}
      <EnhancedHero 
        gradient="hero-accent"
        texture="fabric-subtle"
        premium
        className="py-16 text-center text-white"
      >
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <AnimationEffect animation="breathe">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Premier Tattoo Studios
            </h1>
          </AnimationEffect>
          <p className="text-xl mb-8 opacity-90">
            Find professional studios with experienced artists and exceptional standards
          </p>
          
          {/* Enhanced Search Bar in Hero */}
          <div className="max-w-2xl mx-auto">
            <EnhancedSearchBar
              placeholder="Search studios, specialties, or locations..."
              glassmorphism
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="mb-6"
            />
          </div>

          {/* Quick Specialty Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Traditional", "Realism", "Watercolor", "Japanese", "Fine Line"].map((specialty) => (
              <EnhancedButton
                key={specialty}
                variant={selectedSpecialties.includes(specialty) ? "accent" : "secondary"}
                glow={selectedSpecialties.includes(specialty)}
                onClick={() => handleSpecialtySelect(specialty)}
                className="text-sm"
              >
                {specialty}
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
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                  </ShadowEffect>
                </div>

                {/* Sort By */}
                <div className="min-w-[200px]">
                  <ShadowEffect elevation="surface">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="rating">Sort by Rating</option>
                      <option value="artistCount">Sort by Artist Count</option>
                      <option value="established">Sort by Established</option>
                      <option value="name">Sort by Name</option>
                    </select>
                  </ShadowEffect>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <EnhancedButton
                    variant={viewMode === "grid" ? "accent" : "secondary"}
                    onClick={() => setViewMode("grid")}
                    className="px-3 py-2"
                  >
                    Grid
                  </EnhancedButton>
                  <EnhancedButton
                    variant={viewMode === "list" ? "accent" : "secondary"}
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
                <EnhancedDivider variant="gradient-accent" className="mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ShadowEffect elevation="surface">
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500">
                      <option>Any Studio Size</option>
                      <option>Small (1-5 artists)</option>
                      <option>Medium (6-10 artists)</option>
                      <option>Large (11+ artists)</option>
                    </select>
                  </ShadowEffect>
                  
                  <ShadowEffect elevation="surface">
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500">
                      <option>Any Price Range</option>
                      <option>Budget (£50-100/hour)</option>
                      <option>Standard (£100-150/hour)</option>
                      <option>Premium (£150-250/hour)</option>
                      <option>Luxury (£250+/hour)</option>
                    </select>
                  </ShadowEffect>
                  
                  <ShadowEffect elevation="surface">
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500">
                      <option>Any Rating</option>
                      <option>4.5+ Stars</option>
                      <option>4.0+ Stars</option>
                      <option>3.5+ Stars</option>
                    </select>
                  </ShadowEffect>

                  <ShadowEffect elevation="surface">
                    <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500">
                      <option>Any Features</option>
                      <option>Walk-ins Welcome</option>
                      <option>Award Winning</option>
                      <option>Female Artists</option>
                      <option>LGBTQ+ Friendly</option>
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
                Found <span className="font-semibold text-accent-600">{sortedStudios.length}</span> studios
                {searchQuery && ` for "${searchQuery}"`}
                {location && ` in ${location}`}
              </p>
            </GlassEffect>

            {/* Selected Filters */}
            {(selectedSpecialties.length > 0 || searchQuery || location) && (
              <div className="flex flex-wrap gap-2">
                {selectedSpecialties.map((specialty) => (
                  <ShadowEffect key={specialty} elevation="surface">
                    <span className="inline-flex items-center px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm">
                      {specialty}
                      <button
                        onClick={() => handleSpecialtySelect(specialty)}
                        className="ml-2 hover:text-accent-900"
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

        {/* Studios Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <EnhancedLoadingState 
                key={index}
                message="Loading studio..."
                glassmorphism
              />
            ))}
          </div>
        ) : sortedStudios.length === 0 ? (
          <EnhancedCard 
            elevation="floating" 
            glassmorphism 
            className="text-center py-16"
          >
            <AnimationEffect animation="breathe">
              <div className="w-16 h-16 bg-neutral-300 rounded-full mx-auto mb-4"></div>
            </AnimationEffect>
            <h3 className="text-xl font-semibold mb-2">No Studios Found</h3>
            <p className="text-neutral-600 mb-6">
              Try adjusting your search criteria or browse all studios
            </p>
            <EnhancedButton onClick={clearFilters} glow>
              Clear Filters
            </EnhancedButton>
          </EnhancedCard>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          }`}>
            {sortedStudios.map((studio, index) => (
              <AnimationEffect 
                key={studio.id} 
                animation="float"
                className="h-full"
              >
                <EnhancedStudioCard
                  studio={studio}
                  premium={index === 0} // Make first studio premium
                  glassmorphism={index % 3 === 1} // Every third studio gets glassmorphism
                  elevation={index % 2 === 0 ? "raised" : "surface"}
                  className="h-full"
                />
              </AnimationEffect>
            ))}
          </div>
        )}

        {/* Featured Studios Section */}
        {sortedStudios.length > 0 && (
          <div className="mt-16">
            <EnhancedDivider variant="gradient-accent" decorative className="mb-8" />
            
            <div className="text-center mb-8">
              <GradientEffect variant="accent-subtle" className="inline-block px-6 py-3 rounded-lg">
                <h2 className="text-2xl font-bold text-accent-700">Featured Studios</h2>
                <p className="text-accent-600">Premium studios with exceptional ratings</p>
              </GradientEffect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sortedStudios.slice(0, 2).map((studio, index) => (
                <PremiumCard key={studio.id} className="p-8">
                  <div className="flex items-start gap-6">
                    <ShadowEffect elevation="premium" className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={studio.image} 
                        alt={studio.name}
                        className="w-full h-full object-cover"
                      />
                    </ShadowEffect>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{studio.name}</h3>
                      <p className="text-neutral-600 mb-3">{studio.location}</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <span className="text-accent-500">★</span>
                          <span className="font-semibold">{studio.rating}</span>
                          <span className="text-sm text-neutral-500">({studio.reviewCount} reviews)</span>
                        </div>
                        <div className="text-sm text-neutral-600">
                          {studio.artistCount} artists
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {studio.specialties.slice(0, 3).map((specialty) => (
                          <ShadowEffect key={specialty} elevation="surface">
                            <span className="px-2 py-1 bg-accent-100 text-accent-700 rounded text-xs">
                              {specialty}
                            </span>
                          </ShadowEffect>
                        ))}
                      </div>

                      <EnhancedButton premium className="w-full">
                        View Studio Details
                      </EnhancedButton>
                    </div>
                  </div>
                </PremiumCard>
              ))}
            </div>
          </div>
        )}

        {/* Load More Section */}
        {sortedStudios.length > 0 && (
          <div className="text-center mt-12">
            <EnhancedDivider variant="gradient-accent" className="mb-8" />
            <PremiumCard className="inline-block p-6">
              <p className="text-neutral-600 mb-4">
                Showing {sortedStudios.length} of {studios.length} studios
              </p>
              <EnhancedButton premium glow>
                Load More Studios
              </EnhancedButton>
            </PremiumCard>
          </div>
        )}
      </div>

      {/* Enhanced Footer Section */}
      <div className="bg-neutral-900 text-white py-16 mt-16">
        <GradientEffect variant="top-accent" className="h-full">
          <TextureEffect variant="fabric-subtle" overlay>
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Visit a Studio?</h2>
              <p className="text-neutral-300 mb-8 max-w-2xl mx-auto">
                Book a consultation with professional studios and experienced artists
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <EnhancedButton premium className="px-8 py-3">
                  Browse All Studios
                </EnhancedButton>
                <EnhancedButton variant="outline" className="px-8 py-3 border-white text-white hover:bg-white hover:text-neutral-900">
                  List Your Studio
                </EnhancedButton>
              </div>
            </div>
          </TextureEffect>
        </GradientEffect>
      </div>
    </EnhancedPageContainer>
  );
}