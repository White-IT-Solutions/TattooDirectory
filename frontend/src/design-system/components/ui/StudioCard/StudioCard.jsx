"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge, 
  Tag, 
  Button,
  StarRating,
  ContactOptions,
  AvailabilityStatus,
  TrendIndicator
} from "../index";
import { cn } from '../../../utils/cn';

/**
 * StudioCard Component
 * 
 * Displays studio information including:
 * - Studio name, location, and rating
 * - Studio specialties and artist count
 * - Contact information and opening hours
 * - Studio image/avatar support
 * - Proper linking to studio profiles
 * 
 * Requirements: 1.3, 4.4, 11.1
 */
export default function StudioCard({ 
  studio, 
  className,
  size = 'md',
  ...props 
}) {
  // Extract studio data with fallbacks
  const studioId = studio.studioId || studio.id || 'unknown';
  const studioName = studio.studioName || studio.name || 'Unknown Studio';
  const location = studio.locationDisplay || studio.address?.city || 'Location not available';
  const rating = studio.rating || 0;
  const reviewCount = studio.reviewCount || 0;
  const artistCount = studio.artists?.length || studio.artistCount || 0;
  const specialties = studio.specialties || [];
  const avatar = studio.avatar || studio.image || '/placeholder-studio.svg';
  
  // Contact information
  const contactInfo = studio.contactInfo || {};
  const openingHours = studio.openingHours || {};
  
  // Get today's opening hours
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = openingHours[today] || 'Hours not available';
  
  // Size variants - using width and responsive classes with more distinct sizes
  const sizeClasses = {
    sm: 'max-w-xs flex-shrink-0',      // 320px
    md: 'max-w-sm flex-shrink-0',      // 384px  
    lg: 'max-w-lg flex-shrink-0'       // 512px - more distinct difference
  };

  // Explicit width styles for testing
  const explicitWidths = {
    sm: { width: '320px' },
    md: { width: '384px' },
    lg: { width: '512px' }
  };



  // Content variations based on size
  const maxSpecialties = {
    sm: 3,
    md: 4, 
    lg: 6
  };

  const showGallery = {
    sm: false,
    md: false,
    lg: true
  };

  const galleryImages = {
    sm: 0,
    md: 0,
    lg: 4
  };

  return (
    <Card 
      elevation="medium" 
      padding="md" 
      className={cn(
        'flex flex-col justify-between transition-all duration-200 hover:elevation-high',
        sizeClasses[size],
        className
      )}
      data-testid="studio-card"
      style={{
        ...explicitWidths[size],
        ...(props.style || {})
      }}
      {...props}
      {...props}
    >
      {/* Studio Header */}
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          {/* Studio Avatar/Logo */}
          <div className="flex-shrink-0">
            <Image
              src={avatar}
              alt={`${studioName} logo`}
              width={64}
              height={64}
              className="rounded-lg object-cover border border-[var(--border-secondary)]"
              onError={(e) => {
                e.target.src = '/placeholder-studio.svg';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Studio Name */}
            <CardTitle className="text-lg font-bold text-[var(--text-primary)] truncate" data-testid="studio-name">
              {studioName}
            </CardTitle>
            
            {/* Location */}
            <CardDescription className="text-sm text-[var(--text-secondary)] mt-1" data-testid="studio-location">
              📍 {location}
            </CardDescription>
            
            {/* Rating */}
            {rating > 0 && (
              <div className="mt-2">
                <StarRating 
                  rating={rating} 
                  reviewCount={reviewCount}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-grow">
        {/* Studio Specialties */}
        {specialties.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-1" data-testid="studio-specialties">
              {specialties.slice(0, maxSpecialties[size]).map((specialty, index) => (
                <Tag
                  key={specialty + index}
                  variant="primary"
                  size="sm"
                >
                  {specialty}
                </Tag>
              ))}
              {specialties.length > maxSpecialties[size] && (
                <Tag variant="ghost" size="sm">
                  +{specialties.length - maxSpecialties[size]} more
                </Tag>
              )}
            </div>
          </div>
        )}

        {/* Studio Info */}
        <div className="space-y-2">
          {/* Artist Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Artists</span>
            <Badge variant="secondary" size="sm" data-testid="artist-count">
              {artistCount} {artistCount === 1 ? 'artist' : 'artists'}
            </Badge>
          </div>

          {/* Opening Hours (Today) */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Today</span>
            <span className="text-[var(--text-primary)] font-medium" data-testid="opening-hours">
              {todayHours}
            </span>
          </div>

          {/* Studio Performance Indicators */}
          {size === 'lg' && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Booking Rate</span>
                  <TrendIndicator value={85.2} trend="up" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Response Time</span>
                  <TrendIndicator value={2.1} trend="down" label="hrs" size="sm" />
                </div>
              </div>
            </div>
          )}

          {/* Availability Status */}
          {studio.availability && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <AvailabilityStatus 
                availability={studio.availability}
                size="sm"
                showActions={false}
              />
            </div>
          )}

          {/* Contact Information */}
          {size !== 'sm' && (contactInfo.phone || contactInfo.email || contactInfo.instagram || contactInfo.website) && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Contact</h4>
              <ContactOptions 
                contactInfo={contactInfo}
                size="sm"
                variant="compact"
                showLabels={false}
              />
            </div>
          )}
        </div>

        {/* Studio Gallery Preview */}
        {showGallery[size] && studio.galleryImages && studio.galleryImages.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Gallery</h4>
            <div className={`grid gap-1 ${size === 'lg' ? 'grid-cols-4' : 'grid-cols-3'}`} data-testid="studio-gallery">
              {studio.galleryImages.slice(0, galleryImages[size]).map((img, i) => {
                const imgSrc = typeof img === 'string' ? img : img?.url;
                return imgSrc ? (
                  <div key={i} className="aspect-square relative overflow-hidden rounded-md">
                    <Image
                      src={imgSrc}
                      alt={`${studioName} gallery ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-200 hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* CTA Footer */}
      <CardFooter className="pt-4">
        <div className="w-full space-y-2">
          {/* Primary CTA */}
          <Link href={`/studios/${studioId}`} className="block">
            <Button
              variant="primary"
              size="md"
              className="w-full"
            >
              View Studio
            </Button>
          </Link>
          
          {/* Secondary Actions */}
          <div className="flex gap-2">
            {contactInfo.website && (
              <Link 
                href={contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  Website
                </Button>
              </Link>
            )}
            {contactInfo.instagram && (
              <Link 
                href={`https://instagram.com/${contactInfo.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  Instagram
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Compact variant for list views
export function StudioCardCompact({ 
  studio, 
  className,
  ...props 
}) {
  const studioId = studio.studioId || studio.id || 'unknown';
  const studioName = studio.studioName || studio.name || 'Unknown Studio';
  const location = studio.locationDisplay || studio.address?.city || 'Location not available';
  const rating = studio.rating || 0;
  const reviewCount = studio.reviewCount || 0;
  const artistCount = studio.artists?.length || studio.artistCount || 0;
  const avatar = studio.avatar || studio.image || '/placeholder-studio.svg';

  return (
    <Card 
      elevation="low" 
      padding="sm" 
      className={cn(
        'flex items-center gap-3 transition-all duration-200 hover:elevation-medium',
        className
      )}
      data-testid="studio-card-compact"
      {...props}
    >
      {/* Studio Avatar */}
      <div className="flex-shrink-0">
        <Image
          src={avatar}
          alt={`${studioName} logo`}
          width={48}
          height={48}
          className="rounded-md object-cover border border-[var(--border-secondary)]"
          onError={(e) => {
            e.target.src = '/placeholder-studio.svg';
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Studio Name */}
        <h3 className="font-semibold text-[var(--text-primary)] truncate" data-testid="studio-name">
          {studioName}
        </h3>
        
        {/* Location & Rating */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-[var(--text-secondary)] truncate">{location}</span>
          {rating > 0 && (
            <StarRating 
              rating={rating} 
              reviewCount={reviewCount}
              size="xs"
              showCount={false}
            />
          )}
        </div>
        
        {/* Artist Count */}
        <div className="mt-1">
          <Badge variant="ghost" size="sm">
            {artistCount} {artistCount === 1 ? 'artist' : 'artists'}
          </Badge>
        </div>
      </div>

      {/* Quick Action */}
      <div className="flex-shrink-0">
        <Link href={`/studios/${studioId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="px-3"
          >
            View
          </Button>
        </Link>
      </div>
    </Card>
  );
}