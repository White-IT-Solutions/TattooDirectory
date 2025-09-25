"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { enhancedTattooStyles, getAllMotifs, getAllCharacteristics } from "../../../../app/data/testData/enhancedTattooStyles";
import { mockArtistData } from "../../../../app/data/mockArtistData";
import { cn } from '../../../utils/cn';
import Card from "../Card/Card";
import Button from "../Button/Button";
import Tag from "../Tag/Tag";
import Badge from "../Badge/Badge";

// Lightbox component for detailed image viewing
const ImageLightbox = ({ image, isOpen, onClose, onNext, onPrev, hasNext, hasPrev }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev) onPrev();
          break;
        case 'ArrowRight':
          if (hasNext) onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-accent-500 text-2xl z-10"
        aria-label="Close lightbox"
      >
        ×
      </button>

      {/* Navigation buttons */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-accent-500 text-3xl z-10"
          aria-label="Previous image"
        >
          ‹
        </button>
      )}
      
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-accent-500 text-3xl z-10"
          aria-label="Next image"
        >
          ›
        </button>
      )}

      {/* Image container */}
      <div className="max-w-4xl max-h-full flex flex-col">
        <img
          src={image.url}
          alt={image.description}
          className="max-w-full max-h-[80vh] object-contain"
        />
        
        {/* Image details */}
        <div className="bg-white p-4 mt-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-neutral-900">{image.description}</h3>
              <p className="text-neutral-600 mt-1">
                by <span className="font-medium">{image.artistName}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" size="sm">
                  {enhancedTattooStyles[image.style]?.name || image.style}
                </Badge>
                {image.tags && image.tags.map((tag, index) => (
                  <Tag key={index} variant="outline" size="sm">
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Filter component
const GalleryFilters = ({ 
  selectedStyle, 
  onStyleChange, 
  selectedMotifs, 
  onMotifsChange, 
  selectedCharacteristics, 
  onCharacteristicsChange,
  searchQuery,
  onSearchChange,
  onClearAll 
}) => {
  const availableStyles = Object.values(enhancedTattooStyles);
  const allMotifs = getAllMotifs();
  const allCharacteristics = getAllCharacteristics();

  return (
    <Card className="p-4 mb-6">
      <h3 className="font-semibold text-lg mb-4">Filter Gallery</h3>
      
      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Search Images
        </label>
        <input
          type="text"
          placeholder="Search by description, artist, or tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Style filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tattoo Style
        </label>
        <select
          value={selectedStyle}
          onChange={(e) => onStyleChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Styles</option>
          {availableStyles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </select>
      </div>

      {/* Motifs filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Popular Motifs
        </label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {allMotifs.slice(0, 20).map((motif) => (
            <Tag
              key={motif}
              variant={selectedMotifs.includes(motif) ? "primary" : "outline"}
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                if (selectedMotifs.includes(motif)) {
                  onMotifsChange(selectedMotifs.filter(m => m !== motif));
                } else {
                  onMotifsChange([...selectedMotifs, motif]);
                }
              }}
            >
              {motif}
            </Tag>
          ))}
        </div>
      </div>

      {/* Characteristics filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Style Characteristics
        </label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {allCharacteristics.slice(0, 15).map((characteristic) => (
            <Tag
              key={characteristic}
              variant={selectedCharacteristics.includes(characteristic) ? "accent" : "outline"}
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                if (selectedCharacteristics.includes(characteristic)) {
                  onCharacteristicsChange(selectedCharacteristics.filter(c => c !== characteristic));
                } else {
                  onCharacteristicsChange([...selectedCharacteristics, characteristic]);
                }
              }}
            >
              {characteristic}
            </Tag>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {(selectedStyle || selectedMotifs.length > 0 || selectedCharacteristics.length > 0 || searchQuery) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}
    </Card>
  );
};

// Lazy loading image component
const LazyImage = ({ src, alt, className, onClick, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)} onClick={onClick} {...props}>
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Main StyleGallery component
export default function StyleGallery({ 
  initialStyle = "",
  showFilters = true,
  maxImages = 50,
  columns = 4,
  lazyLoading = true,
  artistId = null, // Filter by specific artist
  studioId = null // Filter by specific studio
}) {
  const [selectedStyle, setSelectedStyle] = useState(initialStyle);
  const [selectedMotifs, setSelectedMotifs] = useState([]);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Prepare gallery images with artist attribution
  const galleryImages = useMemo(() => {
    const images = [];
    
    let artistsToProcess = mockArtistData;
    
    // Filter by specific artist
    if (artistId) {
      artistsToProcess = mockArtistData.filter(artist => artist.artistId === artistId);
    }
    // Filter by specific studio
    else if (studioId) {
      artistsToProcess = mockArtistData.filter(artist => 
        artist.tattooStudio?.studioId === studioId
      );
    }
    
    artistsToProcess.forEach((artist) => {
      artist.portfolioImages.forEach((image) => {
        images.push({
          ...image,
          artistName: artist.artistName,
          artistId: artist.artistId,
          studioName: artist.tattooStudio?.studioName || '',
          tags: image.tags || [],
          rating: artist.rating || 0,
          location: artist.location
        });
      });
    });

    return images;
  }, [artistId, studioId]);

  // Filter images based on current filters
  const filteredImages = useMemo(() => {
    let filtered = [...galleryImages];

    // Filter by style
    if (selectedStyle) {
      filtered = filtered.filter(image => image.style === selectedStyle);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(image => 
        image.description.toLowerCase().includes(query) ||
        image.artistName.toLowerCase().includes(query) ||
        image.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by motifs (check if style has selected motifs)
    if (selectedMotifs.length > 0) {
      filtered = filtered.filter(image => {
        const style = enhancedTattooStyles[image.style];
        if (!style) return false;
        return selectedMotifs.some(motif => 
          style.popularMotifs.includes(motif)
        );
      });
    }

    // Filter by characteristics (check if style has selected characteristics)
    if (selectedCharacteristics.length > 0) {
      filtered = filtered.filter(image => {
        const style = enhancedTattooStyles[image.style];
        if (!style) return false;
        return selectedCharacteristics.some(characteristic => 
          style.characteristics.includes(characteristic)
        );
      });
    }

    return filtered.slice(0, maxImages);
  }, [galleryImages, selectedStyle, selectedMotifs, selectedCharacteristics, searchQuery, maxImages]);

  const openLightbox = (image, index) => {
    setLightboxImage(image);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxIndex(0);
  };

  const nextImage = () => {
    if (lightboxIndex < filteredImages.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(filteredImages[newIndex]);
    }
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(filteredImages[newIndex]);
    }
  };

  const clearAllFilters = () => {
    setSelectedStyle("");
    setSelectedMotifs([]);
    setSelectedCharacteristics([]);
    setSearchQuery("");
  };

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
  };

  return (
    <div className="w-full">
      {/* Filters */}
      {showFilters && (
        <GalleryFilters
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          selectedMotifs={selectedMotifs}
          onMotifsChange={setSelectedMotifs}
          selectedCharacteristics={selectedCharacteristics}
          onCharacteristicsChange={setSelectedCharacteristics}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearAll={clearAllFilters}
        />
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-neutral-600">
          Showing {filteredImages.length} of {galleryImages.length} images
        </p>
        {selectedStyle && (
          <Badge variant="primary" size="sm">
            {enhancedTattooStyles[selectedStyle]?.name || selectedStyle}
          </Badge>
        )}
      </div>

      {/* Gallery grid */}
      <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4`}>
        {filteredImages.map((image, index) => (
          <Card
            key={`${image.artistId}-${index}`}
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
            onClick={() => openLightbox(image, index)}
          >
            <div className="aspect-square relative overflow-hidden">
              {lazyLoading ? (
                <LazyImage
                  src={image.url}
                  alt={image.description}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <img
                  src={image.url}
                  alt={image.description}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
              
              {/* Style badge */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Badge variant="secondary" size="sm">
                  {enhancedTattooStyles[image.style]?.name || image.style}
                </Badge>
              </div>

              {/* Rating badge */}
              {image.rating > 0 && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Badge variant="accent" size="sm">
                    ⭐ {image.rating.toFixed(1)}
                  </Badge>
                </div>
              )}
              
              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-sm font-medium truncate">{image.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs opacity-90">by {image.artistName}</p>
                  {image.location && (
                    <p className="text-xs opacity-75">{image.location}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredImages.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No images found</h3>
          <p className="text-neutral-600 mb-4">
            Try adjusting your filters or search terms to see more results.
          </p>
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </Card>
      )}

      {/* Lightbox */}
      <ImageLightbox
        image={lightboxImage}
        isOpen={!!lightboxImage}
        onClose={closeLightbox}
        onNext={nextImage}
        onPrev={prevImage}
        hasNext={lightboxIndex < filteredImages.length - 1}
        hasPrev={lightboxIndex > 0}
      />
    </div>
  );
}