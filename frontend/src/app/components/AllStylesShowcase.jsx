"use client";

import React, { useState } from "react";
import { enhancedTattooStyles, difficultyLevels } from "../data/testData/enhancedTattooStyles";
import Badge from "../../design-system/components/ui/Badge/Badge";
import Tag from "../../design-system/components/ui/Tag/Tag";

// Popularity indicator component
const PopularityIndicator = ({ popularity }) => {
  const getPopularityLevel = (score) => {
    if (score >= 85) return { label: "Very Popular", color: "success", dots: 5 };
    if (score >= 70) return { label: "Popular", color: "accent", dots: 4 };
    if (score >= 55) return { label: "Moderate", color: "warning", dots: 3 };
    if (score >= 40) return { label: "Niche", color: "secondary", dots: 2 };
    return { label: "Rare", color: "neutral", dots: 1 };
  };

  const level = getPopularityLevel(popularity);

  return (
    <div className="flex items-center gap-1" title={`${level.label} (${popularity}% popularity)`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < level.dots 
              ? level.color === 'success' ? 'bg-success-500' :
                level.color === 'accent' ? 'bg-accent-500' :
                level.color === 'warning' ? 'bg-warning-500' :
                level.color === 'secondary' ? 'bg-neutral-400' :
                'bg-neutral-300'
              : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  );
};

export default function AllStylesShowcase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  const allStyles = Object.values(enhancedTattooStyles);

  // Filter styles based on search and difficulty
  const filteredStyles = allStyles.filter(style => {
    const matchesSearch = !searchQuery || 
      style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.aliases.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase())) ||
      style.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDifficulty = !selectedDifficulty || style.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">All Tattoo Styles Showcase</h2>
        <p className="text-neutral-300 text-lg">
          Complete collection of {allStyles.length} tattoo styles with rich metadata
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search styles, aliases, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>
        <div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Styles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStyles.map((style) => (
          <div
            key={style.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-accent-500/50 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">{style.name}</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={difficultyLevels[style.difficulty].color}
                  size="sm"
                >
                  {difficultyLevels[style.difficulty].label}
                </Badge>
                <PopularityIndicator popularity={style.popularity} />
              </div>
            </div>

            {/* Description */}
            <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
              {style.description}
            </p>

            {/* Characteristics */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Characteristics
              </h4>
              <div className="flex flex-wrap gap-1">
                {style.characteristics.map((char, index) => (
                  <Tag key={index} variant="secondary" size="sm">
                    {char}
                  </Tag>
                ))}
              </div>
            </div>

            {/* Popular Motifs */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Popular Motifs
              </h4>
              <p className="text-neutral-300 text-sm">
                {style.popularMotifs.slice(0, 4).join(", ")}
                {style.popularMotifs.length > 4 && ` +${style.popularMotifs.length - 4} more`}
              </p>
            </div>

            {/* Color Palette */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                Color Palette
              </h4>
              <div className="flex flex-wrap gap-1">
                {style.colorPalette.map((color, index) => (
                  <span key={index} className="text-neutral-300 text-sm bg-neutral-700 px-2 py-1 rounded">
                    {color}
                  </span>
                ))}
              </div>
            </div>

            {/* Time Origin & Aliases */}
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Origin: </span>
                <span className="text-neutral-300 text-sm">{style.timeOrigin}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Aliases: </span>
                <span className="text-neutral-300 text-sm">{style.aliases.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results */}
      {filteredStyles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-400 text-lg mb-4">No styles found matching your criteria</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedDifficulty("");
            }}
            className="text-accent-500 hover:text-accent-400 underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="mt-8 text-center text-neutral-400 text-sm">
        Showing {filteredStyles.length} of {allStyles.length} tattoo styles
      </div>
    </div>
  );
}