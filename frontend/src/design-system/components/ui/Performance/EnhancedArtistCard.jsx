"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent } from '../Card/Card';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';
import { StarRating } from '../StarRating/StarRating';
import { PricingDisplay } from '../PricingDisplay/PricingDisplay';
import { AvailabilityStatus } from '../AvailabilityStatus/AvailabilityStatus';
import { ExperienceBadge } from '../ExperienceBadge/ExperienceBadge';
import { ContactOptions } from '../ContactOptions/ContactOptions';
import { AvatarImage, PortfolioImageGrid } from './ImageOptimization';
import { SmartLink, PortfolioPreloader } from './Preloader';
import { cn } from '../../../utils/cn';

/**
 * Enhanced Artist Card with Performance Optimizations
 * 
 * Features:
 * - Lazy loading for portfolio images
 * - Smart preloading on hover
 * - Optimized image formats (WebP)
 * - Progressive enhancement
 * - Connection-aware loading
 * 
 * Requirements: 12.1, 12.3, 12.4
 */

const EnhancedArtistCard = ({
  artist,
  size = 'medium',
  showPortfolio = true,
  showContact = true,
  className,
  onCardClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { preloadPortfolio } = PortfolioPreloader({
    artistId: artist.artistId,
    portfolioImages: artist.portfolioImages || []
  });

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Preload portfolio images when user hovers
    preloadPortfolio();
  }, [preloadPortfolio]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleCardClick = useCallback(() => {
    onCardClick?.(artist);
  }, [artist, onCardClick]);

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const avatarSizes = {
    small: 'small',
    medium: 'medium',
    large: 'large'
  };

  const portfolioColumns = {
    small: 2,
    medium: 3,
    large: 4
  };

  return (
    <Card
      elevation={isHovered ? 'high' : 'medium'}
      className={cn(
        'transition-all duration-300 cursor-pointer hover:scale-[1.02]',
        sizeClasses[size],
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      {...props}
    >
      <CardContent className="space-y-4">
        {/* Artist Header */}
        <div className="flex items-center space-x-3">
          <AvatarImage
            src={artist.avatar}
            alt={artist.artistName}
            size={avatarSizes[size]}
            fallback={artist.artistName?.charAt(0)}
            priority={size === 'large'}
          />
          
          <div className="flex-1 min-w-0">
            <SmartLink
              href={`/artists/${artist.artistId}`}
              className="block"
              preloadOnHover={true}
            >
              <h3 className="font-semibold text-lg text-primary-800 truncate hover:text-primary-600 transition-colors">
                {artist.artistName}
              </h3>
            </SmartLink>
            
            {artist.tattooStudio?.studioName && (
              <SmartLink
                href={`/studios/${artist.tattooStudio.studioId}`}
                className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                preloadOnHover={true}
              >
                {artist.tattooStudio.studioName}
              </SmartLink>
            )}
            
            <p className="text-sm text-neutral-500">
              {artist.locationDisplay}
            </p>
          </div>
        </div>

        {/* Artist Bio */}
        {artist.bio && (
          <p className="text-sm text-neutral-700 line-clamp-2">
            {artist.bio}
          </p>
        )}

        {/* Rating and Experience */}
        <div className="flex items-center justify-between">
          {artist.rating && (
            <div className="flex items-center space-x-2">
              <StarRating 
                rating={artist.rating} 
                size="sm"
                showValue={true}
              />
              {artist.reviewCount && (
                <span className="text-xs text-neutral-500">
                  ({artist.reviewCount})
                </span>
              )}
            </div>
          )}
          
          {artist.experience?.yearsActive && (
            <ExperienceBadge
              yearsActive={artist.experience.yearsActive}
              size="sm"
            />
          )}
        </div>

        {/* Pricing and Availability */}
        <div className="flex items-center justify-between">
          {artist.pricing && (
            <PricingDisplay
              pricing={artist.pricing}
              size="sm"
              compact={true}
            />
          )}
          
          {artist.availability && (
            <AvailabilityStatus
              availability={artist.availability}
              size="sm"
            />
          )}
        </div>

        {/* Styles */}
        {artist.styles && artist.styles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {artist.styles.slice(0, 3).map((style, index) => (
              <Badge
                key={index}
                variant="secondary"
                size="sm"
              >
                {style}
              </Badge>
            ))}
            {artist.styles.length > 3 && (
              <Badge variant="outline" size="sm">
                +{artist.styles.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Portfolio Preview */}
        {showPortfolio && artist.portfolioImages && artist.portfolioImages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-700">Recent Work</h4>
            <PortfolioImageGrid
              images={artist.portfolioImages.slice(0, portfolioColumns[size] * 2)}
              columns={portfolioColumns[size]}
              gap={2}
              lazy={!isHovered} // Load immediately on hover
              onImageClick={(image, index) => {
                // Navigate to artist profile with image focus
                window.location.href = `/artists/${artist.artistId}?image=${index}`;
              }}
            />
          </div>
        )}

        {/* Contact Options */}
        {showContact && (
          <div className="pt-2 border-t border-neutral-200">
            <ContactOptions
              contactInfo={artist.contactInfo}
              artistName={artist.artistName}
              size="sm"
              layout="horizontal"
            />
          </div>
        )}

        {/* Action Button */}
        <SmartLink
          href={`/artists/${artist.artistId}`}
          className="block"
          preloadOnHover={true}
        >
          <Button
            variant="primary"
            size={size === 'small' ? 'sm' : 'md'}
            className="w-full"
          >
            View Profile
          </Button>
        </SmartLink>
      </CardContent>
    </Card>
  );
};

export default EnhancedArtistCard;