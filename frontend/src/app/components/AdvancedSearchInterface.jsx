"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { enhancedTattooStyles, difficultyLevels } from "../data/testData/enhancedTattooStyles";
import { mockArtistData } from "../data/mockArtistData";
import Button from "../../design-system/components/ui/Button/Button";
import Card from "../../design-system/components/ui/Card/Card";
import Input from "../../design-system/components/ui/Input/Input";
import Badge from "../../design-system/components/ui/Badge/Badge";

// Search presets for common search patterns
const SEARCH_PRESETS = [
  {
    id: "beginner_friendly",
    name: "Beginner Friendly",
    description: "Styles perfect for first-time tattoo clients",
    filters: {
      difficulty: ["beginner"],
      styles: ["minimalist", "fineline", "lettering"]
    }
  },
  {
    id: "bold_traditional",
    name: "Bold & Traditional",
    description: "Classic tattoo styles with strong visual impact",
    filters: {
      styles: ["old_school", "traditional", "tribal"],
      characteristics: ["Bold Lines", "High Contrast"]
    }
  },
  {
    id: "artistic_detailed",
    name: "Artistic & Detailed",
    description: "Complex styles requiring advanced skill",
    filters: {
      difficulty: ["advanced"],
      styles: ["realism", "portrait", "biomechanical", "dotwork"]
    }
  },
  {
    id: "nature_inspired",
    name: "Nature Inspired",
    description: "Styles featuring natural elements and organic forms",
    filters: {
      styles: ["floral", "watercolour", "japanese"],
      motifs: ["Flowers", "Animals", "Nature"]
    }
  },
  {
    id: "modern_minimal",
    name: "Modern & Minimal",
    description: "Contemporary styles with clean aesthetics",
    filters: {
      styles: ["minimalist", "fineline", "geometric"],
      characteristics: ["Clean Lines", "Minimal Detail"]
    }
  }
];

// Location radius options
const RADIUS_OPTIONS = [
  { value: 5, label: "5 miles" },
  { value: 10, label: "10 miles" },
  { value: 25, label: "25 miles" },
  { value: 50, label: "50 miles" },
  { value: 100, label: "100 miles" }
];

// Experience level options
const EXPERIENCE_LEVELS = [
  { value: "apprentice", label: "Apprentice (0-2 years)" },
  { value: "junior", label: "Junior (2-5 years)" },
  { value: "experienced", label: "Experienced (5-10 years)" },
  { value: "master", label: "Master (10+ years)" }
];

// Price range options
const PRICE_RANGES = [
  { value: "budget", label: "Budget (£50-100/hour)" },
  { value: "mid", label: "Mid-range (£100-150/hour)" },
  { value: "premium", label: "Premium (£150-200/hour)" },
  { value: "luxury", label: "Luxury (£200+/hour)" }
];

// Availability options
const AVAILABILITY_OPTIONS = [
  { value: "immediate", label: "Available now" },
  { value: "week", label: "Within a week" },
  { value: "month", label: "Within a month" },
  { value: "flexible", label: "Flexible timing" }
];

export default function AdvancedSearchInterface({ isOpen, onClose, onSearch }) {
  const router = useRouter();
  const [searchCriteria, setSearchCriteria] = useState({
    text: "",
    styles: [],
    location: "",
    radius: 25,
    difficulty: [],
    experience: [],
    priceRange: [],
    availability: [],
    rating: 0,
    sortBy: "relevance"
  });
  
  const [savedSearches, setSavedSearches] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("criteria");
  const modalRef = useRef(null);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tattoo_saved_searches");
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const updateCriteria = (key, value) => {
    setSearchCriteria(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayValue = (key, value) => {
    setSearchCriteria(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setSearchCriteria({
      text: "",
      styles: [],
      location: "",
      radius: 25,
      difficulty: [],
      experience: [],
      priceRange: [],
      availability: [],
      rating: 0,
      sortBy: "relevance"
    });
  };

  const applyPreset = (preset) => {
    setSearchCriteria(prev => ({
      ...prev,
      ...preset.filters,
      styles: preset.filters.styles || [],
      difficulty: preset.filters.difficulty || []
    }));
  };

  const saveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch = {
      id: Date.now().toString(),
      name: searchName,
      criteria: searchCriteria,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem("tattoo_saved_searches", JSON.stringify(updated));
    setSearchName("");
    setShowSaveDialog(false);
  };

  const loadSavedSearch = (search) => {
    setSearchCriteria(search.criteria);
    setActiveTab("criteria");
  };

  const deleteSavedSearch = (searchId) => {
    const updated = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updated);
    localStorage.setItem("tattoo_saved_searches", JSON.stringify(updated));
  };

  const executeSearch = () => {
    // Build search query
    const query = new URLSearchParams();
    
    if (searchCriteria.text) query.set("q", searchCriteria.text);
    if (searchCriteria.styles.length > 0) query.set("styles", searchCriteria.styles.join(","));
    if (searchCriteria.location) query.set("location", searchCriteria.location);
    if (searchCriteria.radius !== 25) query.set("radius", searchCriteria.radius.toString());
    if (searchCriteria.difficulty.length > 0) query.set("difficulty", searchCriteria.difficulty.join(","));
    if (searchCriteria.experience.length > 0) query.set("experience", searchCriteria.experience.join(","));
    if (searchCriteria.priceRange.length > 0) query.set("price", searchCriteria.priceRange.join(","));
    if (searchCriteria.availability.length > 0) query.set("availability", searchCriteria.availability.join(","));
    if (searchCriteria.rating > 0) query.set("rating", searchCriteria.rating.toString());
    if (searchCriteria.sortBy !== "relevance") query.set("sort", searchCriteria.sortBy);

    // Navigate to search results
    router.push(`/search?${query.toString()}`);
    
    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(searchCriteria);
    }
    
    onClose();
  };

  const exportResults = () => {
    const exportData = {
      searchCriteria,
      timestamp: new Date().toISOString(),
      resultsCount: mockArtistData.length // This would be actual results count
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tattoo-search-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="advanced-search-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 id="advanced-search-title" className="text-2xl font-bold text-neutral-900">
            Advanced Search
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-2xl"
            aria-label="Close advanced search"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setActiveTab("criteria")}
            className={`px-6 py-3 font-medium ${
              activeTab === "criteria"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Search Criteria
          </button>
          <button
            onClick={() => setActiveTab("presets")}
            className={`px-6 py-3 font-medium ${
              activeTab === "presets"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-6 py-3 font-medium ${
              activeTab === "saved"
                ? "text-primary-600 border-b-2 border-primary-600"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Saved Searches ({savedSearches.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "criteria" && (
            <div className="space-y-6">
              {/* Text Search */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Search Text
                </label>
                <Input
                  type="text"
                  placeholder="Search artists, studios, or keywords..."
                  value={searchCriteria.text}
                  onChange={(e) => updateCriteria("text", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Location & Radius */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Location
                  </label>
                  <Input
                    type="text"
                    placeholder="City, postcode, or area..."
                    value={searchCriteria.location}
                    onChange={(e) => updateCriteria("location", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Search Radius
                  </label>
                  <select
                    value={searchCriteria.radius}
                    onChange={(e) => updateCriteria("radius", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {RADIUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tattoo Styles
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.values(enhancedTattooStyles).map(style => (
                    <button
                      key={style.id}
                      onClick={() => toggleArrayValue("styles", style.id)}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        searchCriteria.styles.includes(style.id)
                          ? "bg-primary-100 border-primary-500 text-primary-700"
                          : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Levels */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Difficulty Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(difficultyLevels).map(([key, level]) => (
                    <button
                      key={key}
                      onClick={() => toggleArrayValue("difficulty", key)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        searchCriteria.difficulty.includes(key)
                          ? "bg-primary-100 border-primary-500 text-primary-700 border"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Artist Experience
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => toggleArrayValue("experience", level.value)}
                      className={`p-2 text-sm rounded-md border transition-colors text-left ${
                        searchCriteria.experience.includes(level.value)
                          ? "bg-primary-100 border-primary-500 text-primary-700"
                          : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Price Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.value}
                      onClick={() => toggleArrayValue("priceRange", range.value)}
                      className={`p-2 text-sm rounded-md border transition-colors text-left ${
                        searchCriteria.priceRange.includes(range.value)
                          ? "bg-primary-100 border-primary-500 text-primary-700"
                          : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Availability
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {AVAILABILITY_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => toggleArrayValue("availability", option.value)}
                      className={`p-2 text-sm rounded-md border transition-colors text-left ${
                        searchCriteria.availability.includes(option.value)
                          ? "bg-primary-100 border-primary-500 text-primary-700"
                          : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Minimum Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => updateCriteria("rating", rating === searchCriteria.rating ? 0 : rating)}
                      className={`px-3 py-1 rounded-md border transition-colors ${
                        searchCriteria.rating >= rating
                          ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                          : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {rating}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sort Results By
                </label>
                <select
                  value={searchCriteria.sortBy}
                  onChange={(e) => updateCriteria("sortBy", e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="distance">Distance</option>
                  <option value="rating">Rating</option>
                  <option value="experience">Experience</option>
                  <option value="price_low">Price (Low to High)</option>
                  <option value="price_high">Price (High to Low)</option>
                  <option value="availability">Availability</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "presets" && (
            <div className="space-y-4">
              <p className="text-neutral-600 mb-4">
                Quick start your search with these popular preset combinations:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SEARCH_PRESETS.map(preset => (
                  <Card key={preset.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-neutral-900">{preset.name}</h3>
                      <Button
                        size="sm"
                        onClick={() => applyPreset(preset)}
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">{preset.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {preset.filters.styles?.map(styleId => (
                        <Badge key={styleId} variant="secondary" size="sm">
                          {enhancedTattooStyles[styleId]?.name || styleId}
                        </Badge>
                      ))}
                      {preset.filters.difficulty?.map(diff => (
                        <Badge key={diff} variant={difficultyLevels[diff].color} size="sm">
                          {difficultyLevels[diff].label}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "saved" && (
            <div className="space-y-4">
              {savedSearches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-4">No saved searches yet.</p>
                  <p className="text-sm text-neutral-500">
                    Create a search in the Criteria tab and save it for quick access later.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSearches.map(search => (
                    <Card key={search.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-neutral-900">{search.name}</h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => loadSavedSearch(search)}
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteSavedSearch(search.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">
                        Created: {new Date(search.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {search.criteria.styles?.slice(0, 3).map(styleId => (
                          <Badge key={styleId} variant="secondary" size="sm">
                            {enhancedTattooStyles[styleId]?.name || styleId}
                          </Badge>
                        ))}
                        {search.criteria.styles?.length > 3 && (
                          <Badge variant="neutral" size="sm">
                            +{search.criteria.styles.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
            {activeTab === "criteria" && (
              <Button
                variant="secondary"
                onClick={() => setShowSaveDialog(true)}
              >
                Save Search
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={exportResults}
            >
              Export
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={executeSearch}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <Input
              type="text"
              placeholder="Enter search name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveSearch}
                disabled={!searchName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}