"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Tag,
  Input,
  StarRating,
  AvailabilityStatus,
  ExperienceBadge,
  PricingDisplay
} from '../index';
import { cn } from '../../../utils/cn';

/**
 * StudioArtists Component
 * 
 * Displays a grid of artists working at a studio with:
 * - Artist preview cards with key information
 * - Filtering by artist styles within studio
 * - Artist availability indicators
 * - Direct links to artist profiles
 * 
 * Requirements: 1.3, 6.2, 11.1
 */
export default function StudioArtists({ 
  artists = [], 
  studioName = '',
  className = '',
  showFilters = true,
  gridCols = 'auto',
  cardSize = 'md'
}) {
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, rating, experience, availability

  // Get all unique styles from artists
  const allStyles = useMemo(() => {
    const styles = new Set();
    artists.forEach(artist => {
      artist.styles?.forEach(style => styles.add(style));
    });
    return Array.from(styles).sort();
  }, [artists]);

  // Filter and sort artists
  const filteredArtists = useMemo(() => {
    let filtered = artists;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(artist => 
        artist.artistName?.toLowerCase().includes(query) ||
        artist.bio?.toLowerCase().includes(query) ||
        artist.specialties?.some(specialty => 
          specialty.toLowerCase().includes(query)
        )
      );
    }

    // Filter by selected styles
    if (selectedStyles.length > 0) {
      filtered = filtered.filter(artist =>
        artist.styles?.some(style => selectedStyles.includes(style))
      );
    }

    // Sort artists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'experience':
          return (b.experience?.yearsActive || 0) - (a.experience?.yearsActive || 0);
        case 'availability': {
          // Available artists first
          const aAvailable = a.availability?.bookingOpen ? 1 : 0;
          const bAvailable = b.availability?.bookingOpen ? 1 : 0;
          return bAvailable - aAvailable;
        }
        case 'name':
        default:
          return (a.artistName || '').localeCompare(b.artistName || '');
      }
    });

    return filtered;
  }, [artists, searchQuery, selectedStyles, sortBy]);

  const handleStyleToggle = (style) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const clearFilters = () => {
    setSelectedStyles([]);
    setSearchQuery('');
    setSortBy('name');
  };

  // Grid column classes based on gridCols prop
  const gridClasses = {
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <Card elevation="medium" padding="lg" className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>
          Artists at {studioName}
          {filteredArtists.length !== artists.length && (
            <span className="text-sm font-normal text-neutral-600 ml-2">
              ({filteredArtists.length} of {artists.length})
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Meet our talented team of {artists.length} {artists.length === 1 ? 'artist' : 'artists'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters Section */}
        {showFilters && (allStyles.length > 0 || artists.length > 3) && (
          <div className="space-y-4">
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search artists by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="experience">Sort by Experience</option>
                  <option value="availability">Sort by Availability</option>
                </select>
                {(selectedStyles.length > 0 || searchQuery.trim()) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Style Filters */}
            {allStyles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  Filter by Style:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {allStyles.map((style) => (
                    <Tag
                      key={style}
                      variant={selectedStyles.includes(style) ? 'primary' : 'ghost'}
                      size="sm"
                      className="cursor-pointer transition-all duration-200 hover:scale-105"
                      onClick={() => handleStyleToggle(style)}
                    >
                      {style}
                      {selectedStyles.includes(style) && (
                        <span className="ml-1">✓</span>
                      )}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Artists Grid */}
        {filteredArtists.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {searchQuery.trim() || selectedStyles.length > 0 
                ? 'No artists match your filters'
                : 'No artists currently listed'
              }
            </h3>
            <p className="text-neutral-600 mb-4">
              {searchQuery.trim() || selectedStyles.length > 0
                ? 'Try adjusting your search or filter criteria.'
                : 'Check back later for artist listings.'
              }
            </p>
            {(searchQuery.trim() || selectedStyles.length > 0) && (
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={cn('grid gap-6', gridClasses[gridCols] || gridClasses.auto)}>
            {filteredArtists.map((artist) => (
              <ArtistRosterCard 
                key={artist.artistId} 
                artist={artist} 
                size={cardSize}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Artist Roster Card Component
 * 
 * Enhanced artist preview card with key information for studio roster display
 */
function ArtistRosterCard({ artist, size = 'md' }) {
  const sizeClasses = {
    sm: {
      avatar: 'w-12 h-12',
      title: 'text-base',
      bio: 'text-xs',
      spacing: 'gap-2 p-3'
    },
    md: {
      avatar: 'w-16 h-16',
      title: 'text-lg',
      bio: 'text-sm',
      spacing: 'gap-3 p-4'
    },
    lg: {
      avatar: 'w-20 h-20',
      title: 'text-xl',
      bio: 'text-base',
      spacing: 'gap-4 p-6'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <Card 
      elevation="low" 
      padding="none"
      className="hover:elevation-medium transition-all duration-200 group"
    >
      <div className={cn('flex flex-col h-full', classes.spacing)}>
        {/* Artist Header */}
        <div className="flex gap-3">
          {/* Artist Avatar */}
          <div className="flex-shrink-0">
            <Image
              src={artist.avatar || '/placeholder-avatar.svg'}
              alt={artist.artistName}
              width={size === 'sm' ? 48 : size === 'lg' ? 80 : 64}
              height={size === 'sm' ? 48 : size === 'lg' ? 80 : 64}
              className={cn('rounded-lg object-cover border border-neutral-200', classes.avatar)}
              onError={(e) => {
                e.target.src = '/placeholder-avatar.svg';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Artist Name */}
            <h3 className={cn('font-semibold text-primary-800 truncate', classes.title)}>
              {artist.artistName}
            </h3>
            
            {/* Bio */}
            {artist.bio && (
              <p className={cn('text-neutral-600 mt-1 line-clamp-2', classes.bio)}>
                {artist.bio}
              </p>
            )}

            {/* Rating */}
            {artist.rating && (
              <div className="mt-2">
                <StarRating 
                  rating={artist.rating} 
                  reviewCount={artist.reviewCount}
                  size="sm"
                  showCount={size !== 'sm'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Artist Details */}
        <div className="space-y-3 flex-1">
          {/* Styles */}
          {artist.styles && artist.styles.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-1">
                {artist.styles.slice(0, size === 'sm' ? 2 : 4).map((style, index) => (
                  <Tag
                    key={style + index}
                    variant="ghost"
                    size="sm"
                  >
                    {style}
                  </Tag>
                ))}
                {artist.styles.length > (size === 'sm' ? 2 : 4) && (
                  <Tag variant="ghost" size="sm">
                    +{artist.styles.length - (size === 'sm' ? 2 : 4)}
                  </Tag>
                )}
              </div>
            </div>
          )}

          {/* Experience and Availability */}
          <div className="flex flex-wrap gap-2">
            {artist.experience && (
              <ExperienceBadge 
                experience={artist.experience}
                size="sm"
              />
            )}
            {artist.availability && (
              <AvailabilityStatus 
                availability={artist.availability}
                size="sm"
              />
            )}
          </div>

          {/* Pricing */}
          {artist.pricing && size !== 'sm' && (
            <div className="bg-neutral-50 rounded-lg p-2">
              <PricingDisplay 
                pricing={artist.pricing}
                size="sm"
              />
            </div>
          )}

          {/* Portfolio Preview */}
          {artist.portfolioImages && artist.portfolioImages.length > 0 && size !== 'sm' && (
            <div className="grid grid-cols-3 gap-1">
              {artist.portfolioImages.slice(0, 3).map((img, i) => {
                const imgSrc = typeof img === 'string' ? img : img?.url;
                return imgSrc ? (
                  <div key={i} className="aspect-square relative overflow-hidden rounded-md">
                    <Image
                      src={imgSrc}
                      alt={`${artist.artistName} portfolio ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-3">
          <Link href={`/artists/${artist.artistId}`}>
            <Button 
              variant="outline" 
              size={size === 'sm' ? 'sm' : 'md'} 
              className="w-full group-hover:variant-primary transition-all duration-200"
            >
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}