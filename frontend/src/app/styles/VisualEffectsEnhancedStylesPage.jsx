"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  EnhancedCard,
  EnhancedButton,
  EnhancedHero,
  EnhancedDivider,
  EnhancedPageContainer,
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

// Mock data for tattoo styles
const MOCK_STYLES = [
  {
    id: 1,
    name: "Traditional",
    description: "Bold lines, bright colors, and classic imagery define this timeless style",
    characteristics: ["Bold Lines", "Bright Colors", "Classic Imagery", "Solid Fill"],
    difficulty: "Intermediate",
    popularity: 95,
    averagePrice: { min: 80, max: 150 },
    timeOrigin: "1900s",
    commonMotifs: ["Anchors", "Roses", "Eagles", "Hearts", "Skulls"],
    artistCount: 245,
    portfolioImages: [
      "/portfolio/traditional1.jpg",
      "/portfolio/traditional2.jpg", 
      "/portfolio/traditional3.jpg",
      "/portfolio/traditional4.jpg"
    ],
    colorPalette: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#000000"]
  },
  {
    id: 2,
    name: "Realism",
    description: "Photorealistic tattoos that capture incredible detail and lifelike imagery",
    characteristics: ["Photorealistic", "High Detail", "Shading", "Depth"],
    difficulty: "Expert",
    popularity: 88,
    averagePrice: { min: 150, max: 300 },
    timeOrigin: "1970s",
    commonMotifs: ["Portraits", "Animals", "Nature", "Objects"],
    artistCount: 156,
    portfolioImages: [
      "/portfolio/realism1.jpg",
      "/portfolio/realism2.jpg",
      "/portfolio/realism3.jpg",
      "/portfolio/realism4.jpg"
    ],
    colorPalette: ["#000000", "#808080", "#C0C0C0", "#FFFFFF", "#8B4513"]
  },
  {
    id: 3,
    name: "Watercolor",
    description: "Soft, flowing colors that mimic watercolor painting techniques",
    characteristics: ["Soft Colors", "Flowing", "Painterly", "Abstract"],
    difficulty: "Advanced",
    popularity: 76,
    averagePrice: { min: 100, max: 200 },
    timeOrigin: "2000s",
    commonMotifs: ["Flowers", "Animals", "Abstract", "Splashes"],
    artistCount: 89,
    portfolioImages: [
      "/portfolio/watercolor1.jpg",
      "/portfolio/watercolor2.jpg",
      "/portfolio/watercolor3.jpg",
      "/portfolio/watercolor4.jpg"
    ],
    colorPalette: ["#FF69B4", "#87CEEB", "#98FB98", "#DDA0DD", "#F0E68C"]
  },
  {
    id: 4,
    name: "Japanese",
    description: "Traditional Japanese imagery with rich cultural symbolism and flowing composition",
    characteristics: ["Cultural Symbols", "Flowing Composition", "Rich Colors", "Large Scale"],
    difficulty: "Expert",
    popularity: 82,
    averagePrice: { min: 120, max: 250 },
    timeOrigin: "300 AD",
    commonMotifs: ["Dragons", "Koi Fish", "Cherry Blossoms", "Waves"],
    artistCount: 134,
    portfolioImages: [
      "/portfolio/japanese1.jpg",
      "/portfolio/japanese2.jpg",
      "/portfolio/japanese3.jpg",
      "/portfolio/japanese4.jpg"
    ],
    colorPalette: ["#DC143C", "#000000", "#FFD700", "#4169E1", "#228B22"]
  },
  {
    id: 5,
    name: "Geometric",
    description: "Clean lines, patterns, and mathematical precision create striking visual impact",
    characteristics: ["Clean Lines", "Patterns", "Symmetry", "Precision"],
    difficulty: "Advanced",
    popularity: 71,
    averagePrice: { min: 90, max: 180 },
    timeOrigin: "2010s",
    commonMotifs: ["Mandalas", "Sacred Geometry", "Patterns", "Abstract"],
    artistCount: 98,
    portfolioImages: [
      "/portfolio/geometric1.jpg",
      "/portfolio/geometric2.jpg",
      "/portfolio/geometric3.jpg",
      "/portfolio/geometric4.jpg"
    ],
    colorPalette: ["#000000", "#FFFFFF", "#808080", "#FF0000", "#0000FF"]
  },
  {
    id: 6,
    name: "Fine Line",
    description: "Delicate, thin lines create minimalist and elegant designs",
    characteristics: ["Thin Lines", "Minimalist", "Elegant", "Delicate"],
    difficulty: "Advanced",
    popularity: 85,
    averagePrice: { min: 70, max: 140 },
    timeOrigin: "2015",
    commonMotifs: ["Minimalist", "Nature", "Text", "Small Symbols"],
    artistCount: 167,
    portfolioImages: [
      "/portfolio/fineline1.jpg",
      "/portfolio/fineline2.jpg",
      "/portfolio/fineline3.jpg",
      "/portfolio/fineline4.jpg"
    ],
    colorPalette: ["#000000", "#808080", "#C0C0C0"]
  }
];

/**
 * Visual Effects Enhanced Styles Page
 * Showcases tattoo styles with sophisticated visual effects and interactive gallery
 */
export default function VisualEffectsEnhancedStylesPage() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedCharacteristics, setSelectedCharacteristics] = useState([]);
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const { showToast } = useToast();

  // Simulate loading and data fetching
  useEffect(() => {
    const loadStyles = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStyles(MOCK_STYLES);
      setLoading(false);
    };

    loadStyles();
  }, []);

  // Filter styles based on search criteria
  const filteredStyles = styles.filter(style => {
    const matchesSearch = !searchQuery || 
      style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.commonMotifs.some(motif => motif.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty = !selectedDifficulty || 
      style.difficulty === selectedDifficulty;

    const matchesCharacteristics = selectedCharacteristics.length === 0 ||
      selectedCharacteristics.some(char => style.characteristics.includes(char));

    return matchesSearch && matchesDifficulty && matchesCharacteristics;
  });

  // Sort styles
  const sortedStyles = [...filteredStyles].sort((a, b) => {
    switch (sortBy) {
      case "popularity":
        return b.popularity - a.popularity;
      case "artistCount":
        return b.artistCount - a.artistCount;
      case "name":
        return a.name.localeCompare(b.name);
      case "difficulty": {
        const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3, "Expert": 4 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
      default:
        return 0;
    }
  });

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    showToast({
      type: "info",
      message: `Searching styles for "${query}"...`,
      duration: 2000
    });
  }, [showToast]);

  const handleCharacteristicSelect = useCallback((characteristic) => {
    setSelectedCharacteristics(prev => 
      prev.includes(characteristic) 
        ? prev.filter(c => c !== characteristic)
        : [...prev, characteristic]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedDifficulty("");
    setSelectedCharacteristics([]);
    setSortBy("popularity");
    showToast({
      type: "success",
      message: "Filters cleared",
      duration: 2000
    });
  }, [showToast]);

  const openStyleModal = (style) => {
    setSelectedStyle(style);
    setShowStyleModal(true);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-700";
      case "Intermediate": return "bg-yellow-100 text-yellow-700";
      case "Advanced": return "bg-orange-100 text-orange-700";
      case "Expert": return "bg-red-100 text-red-700";
      default: return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <EnhancedPageContainer 
      gradient="hero-neutral" 
      texture="paper-subtle"
      className="bg-neutral-50"
    >
      {/* Enhanced Hero Section */}
      <EnhancedHero 
        gradient="hero-primary"
        texture="noise-subtle"
        premium
        className="py-20 text-center text-white"
      >
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <AnimationEffect animation="float">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Explore Tattoo Styles
            </h1>
          </AnimationEffect>
          <p className="text-xl mb-8 opacity-90">
            Discover the rich diversity of tattoo artistry and find your perfect style
          </p>
          
          {/* Enhanced Search Bar in Hero */}
          <div className="max-w-2xl mx-auto">
            <EnhancedSearchBar
              placeholder="Search styles, motifs, or characteristics..."
              glassmorphism
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="mb-8"
            />
          </div>

          {/* Style Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { label: "Styles", value: styles.length },
              { label: "Artists", value: styles.reduce((sum, style) => sum + style.artistCount, 0) },
              { label: "Portfolios", value: styles.length * 4 },
              { label: "Motifs", value: styles.reduce((sum, style) => sum + style.commonMotifs.length, 0) }
            ].map((stat, index) => (
              <GlassEffect key={index} variant="card" className="p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </GlassEffect>
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
                {/* Difficulty Filter */}
                <div className="min-w-[200px]">
                  <ShadowEffect elevation="surface">
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Any Difficulty</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </ShadowEffect>
                </div>

                {/* Sort By */}
                <div className="min-w-[200px]">
                  <ShadowEffect elevation="surface">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="popularity">Sort by Popularity</option>
                      <option value="artistCount">Sort by Artist Count</option>
                      <option value="name">Sort by Name</option>
                      <option value="difficulty">Sort by Difficulty</option>
                    </select>
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
                    variant={viewMode === "gallery" ? "primary" : "secondary"}
                    onClick={() => setViewMode("gallery")}
                    className="px-3 py-2"
                  >
                    Gallery
                  </EnhancedButton>
                </div>
              </div>

              <div className="flex gap-3">
                <EnhancedButton
                  variant="ghost"
                  onClick={clearFilters}
                >
                  Clear All
                </EnhancedButton>
              </div>
            </div>

            {/* Characteristic Filters */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h3 className="font-semibold mb-3">Filter by Characteristics</h3>
              <div className="flex flex-wrap gap-2">
                {["Bold Lines", "Bright Colors", "Photorealistic", "Soft Colors", "Clean Lines", "Thin Lines", "Cultural Symbols", "Patterns"].map((characteristic) => (
                  <EnhancedButton
                    key={characteristic}
                    variant={selectedCharacteristics.includes(characteristic) ? "primary" : "outline"}
                    onClick={() => handleCharacteristicSelect(characteristic)}
                    className="text-sm"
                  >
                    {characteristic}
                  </EnhancedButton>
                ))}
              </div>
            </div>
          </EnhancedFilterPanel>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <GlassEffect variant="card" className="px-4 py-2 rounded-lg">
              <p className="text-sm text-neutral-600">
                Found <span className="font-semibold text-primary-600">{sortedStyles.length}</span> styles
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </GlassEffect>

            {/* Selected Filters */}
            {(selectedCharacteristics.length > 0 || selectedDifficulty || searchQuery) && (
              <div className="flex flex-wrap gap-2">
                {selectedDifficulty && (
                  <ShadowEffect elevation="surface">
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {selectedDifficulty}
                      <button
                        onClick={() => setSelectedDifficulty("")}
                        className="ml-2 hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  </ShadowEffect>
                )}
                {selectedCharacteristics.map((characteristic) => (
                  <ShadowEffect key={characteristic} elevation="surface">
                    <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {characteristic}
                      <button
                        onClick={() => handleCharacteristicSelect(characteristic)}
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

        {/* Styles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <EnhancedLoadingState 
                key={index}
                message="Loading style..."
                glassmorphism
              />
            ))}
          </div>
        ) : sortedStyles.length === 0 ? (
          <EnhancedCard 
            elevation="floating" 
            glassmorphism 
            className="text-center py-16"
          >
            <AnimationEffect animation="breathe">
              <div className="w-16 h-16 bg-neutral-300 rounded-full mx-auto mb-4"></div>
            </AnimationEffect>
            <h3 className="text-xl font-semibold mb-2">No Styles Found</h3>
            <p className="text-neutral-600 mb-6">
              Try adjusting your search criteria or browse all styles
            </p>
            <EnhancedButton onClick={clearFilters} glow>
              Clear Filters
            </EnhancedButton>
          </EnhancedCard>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1 md:grid-cols-2"
          }`}>
            {sortedStyles.map((style, index) => (
              <AnimationEffect 
                key={style.id} 
                animation="float"
                className="h-full"
              >
                <EnhancedCard
                  elevation={index === 0 ? "premium" : "raised"}
                  glassmorphism={index % 3 === 1}
                  gradient={index === 0 ? "primary-subtle" : null}
                  texture={index === 0 ? "noise-subtle" : null}
                  premium={index === 0}
                  className="h-full p-6 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2"
                  onClick={() => openStyleModal(style)}
                >
                  <div className="space-y-4">
                    {/* Style Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{style.name}</h3>
                        <ShadowEffect elevation="surface" className="inline-block">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(style.difficulty)}`}>
                            {style.difficulty}
                          </span>
                        </ShadowEffect>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-500">{style.popularity}%</div>
                        <div className="text-xs text-neutral-500">Popularity</div>
                      </div>
                    </div>

                    {/* Portfolio Preview */}
                    <div className="grid grid-cols-2 gap-2">
                      {style.portfolioImages.slice(0, 4).map((image, imgIndex) => (
                        <ShadowEffect key={imgIndex} elevation="surface" className="aspect-square rounded-lg overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                            <span className="text-xs text-neutral-500">Portfolio {imgIndex + 1}</span>
                          </div>
                        </ShadowEffect>
                      ))}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {style.description}
                    </p>

                    {/* Characteristics */}
                    <div className="flex flex-wrap gap-1">
                      {style.characteristics.slice(0, 3).map((characteristic) => (
                        <span key={characteristic} className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs">
                          {characteristic}
                        </span>
                      ))}
                      {style.characteristics.length > 3 && (
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs">
                          +{style.characteristics.length - 3} more
                        </span>
                      )}
                    </div>

                    <EnhancedDivider variant="gradient-primary" className="my-4" />

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="font-semibold text-accent-500">{style.artistCount}</div>
                        <div className="text-xs text-neutral-500">Artists</div>
                      </div>
                      <div>
                        <div className="font-semibold text-accent-500">£{style.averagePrice.min}-{style.averagePrice.max}</div>
                        <div className="text-xs text-neutral-500">Price Range</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <EnhancedButton 
                      variant="primary" 
                      glow={index === 0}
                      premium={index === 0}
                      className="w-full"
                    >
                      Explore Style
                    </EnhancedButton>
                  </div>
                </EnhancedCard>
              </AnimationEffect>
            ))}
          </div>
        )}

        {/* Popular Motifs Section */}
        {sortedStyles.length > 0 && (
          <div className="mt-16">
            <EnhancedDivider variant="gradient-primary" decorative className="mb-8" />
            
            <div className="text-center mb-8">
              <GradientEffect variant="primary-subtle" className="inline-block px-6 py-3 rounded-lg">
                <h2 className="text-2xl font-bold text-primary-700">Popular Motifs</h2>
                <p className="text-primary-600">Common themes across tattoo styles</p>
              </GradientEffect>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {["Roses", "Dragons", "Skulls", "Animals", "Geometric", "Nature", "Portraits", "Abstract"].map((motif, index) => (
                <AnimationEffect key={motif} animation="breathe">
                  <GlassEffect variant="card" className="p-4 text-center rounded-lg hover:transform hover:scale-105 transition-all duration-200 cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full mx-auto mb-2"></div>
                    <div className="font-medium text-sm">{motif}</div>
                  </GlassEffect>
                </AnimationEffect>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Style Detail Modal */}
      {showStyleModal && selectedStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStyleModal(false)}
          ></div>
          <div className="relative z-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PremiumCard className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedStyle.name}</h2>
                  <p className="text-neutral-600">{selectedStyle.description}</p>
                </div>
                <EnhancedButton
                  variant="ghost"
                  onClick={() => setShowStyleModal(false)}
                  className="text-2xl"
                >
                  ×
                </EnhancedButton>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Portfolio Gallery */}
                <div>
                  <h3 className="font-semibold mb-4">Portfolio Examples</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedStyle.portfolioImages.map((image, index) => (
                      <ShadowEffect key={index} elevation="raised" className="aspect-square rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                          <span className="text-sm text-neutral-500">Portfolio {index + 1}</span>
                        </div>
                      </ShadowEffect>
                    ))}
                  </div>
                </div>

                {/* Style Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Characteristics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStyle.characteristics.map((char) => (
                        <ShadowEffect key={char} elevation="surface">
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                            {char}
                          </span>
                        </ShadowEffect>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Common Motifs</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStyle.commonMotifs.map((motif) => (
                        <span key={motif} className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-sm">
                          {motif}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Difficulty</h4>
                      <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(selectedStyle.difficulty)}`}>
                        {selectedStyle.difficulty}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Origin</h4>
                      <p className="text-neutral-600">{selectedStyle.timeOrigin}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Artists</h4>
                      <p className="text-2xl font-bold text-accent-500">{selectedStyle.artistCount}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Price Range</h4>
                      <p className="text-2xl font-bold text-accent-500">£{selectedStyle.averagePrice.min}-{selectedStyle.averagePrice.max}</p>
                    </div>
                  </div>

                  <EnhancedButton premium className="w-full">
                    Find {selectedStyle.name} Artists
                  </EnhancedButton>
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>
      )}

      {/* Enhanced Footer Section */}
      <div className="bg-neutral-900 text-white py-16 mt-16">
        <GradientEffect variant="top-primary" className="h-full">
          <TextureEffect variant="noise-subtle" overlay>
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold mb-4">Found Your Style?</h2>
              <p className="text-neutral-300 mb-8 max-w-2xl mx-auto">
                Connect with artists who specialize in your preferred tattoo style
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <EnhancedButton premium className="px-8 py-3">
                  Find Artists
                </EnhancedButton>
                <EnhancedButton variant="outline" className="px-8 py-3 border-white text-white hover:bg-white hover:text-neutral-900">
                  Browse Portfolios
                </EnhancedButton>
              </div>
            </div>
          </TextureEffect>
        </GradientEffect>
      </div>
    </EnhancedPageContainer>
  );
}