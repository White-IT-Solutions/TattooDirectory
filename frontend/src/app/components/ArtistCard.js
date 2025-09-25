"use client";
import Image from "next/image";
import Link from "next/link";
import { 
  Card, 
  Badge, 
  Tag, 
  Button,
  StarRating,
  PricingDisplay,
  AvailabilityStatus,
  ExperienceBadge,
  ContactOptions
} from "../../design-system/components/ui";

export default function ArtistCard({ artist }) {
  // Use fallback values for missing or undefined fields
  const artistName = artist.artistName || artist.artistsName || artist.name || 'Unknown Artist';
  const avatarSrc = artist.avatar || '/placeholder-avatar.svg';
  const bio = artist.bio || 'Tattoo artist';
  const instagramHandle = artist.instagramHandle || artist.contactInfo?.instagram || 'unknown';
  
  return (
    <Card 
      elevation="medium" 
      padding="md" 
      className="flex flex-col justify-between h-full transition-all duration-200 hover:elevation-high" 
      data-testid="artist-card"
    >
      {/* Avatar & Basic Info */}
      <div className="text-center">
        <Image
          src={avatarSrc}
          alt={artistName}
          width={80}
          height={80}
          className="rounded-full mx-auto object-cover"
          onError={(e) => {
            e.target.src = '/placeholder-avatar.svg';
          }}
        />
        <h2 className="mt-3 font-semibold text-lg text-primary-800" data-testid="artist-name">
          {artistName}
        </h2>
        <p className="text-neutral-600 text-sm mt-1 line-clamp-2">{bio}</p>

        {/* Rating Display */}
        {artist.rating && (
          <div className="mt-2 flex justify-center">
            <StarRating 
              rating={artist.rating} 
              reviewCount={artist.reviewCount}
              size="sm"
            />
          </div>
        )}

        {/* Experience Badges */}
        {artist.experience && (
          <div className="mt-2 flex justify-center">
            <ExperienceBadge 
              experience={artist.experience}
              size="sm"
            />
          </div>
        )}

        {/* Styles */}
        <div className="mt-3 flex flex-wrap justify-center gap-1" data-testid="artist-styles">
          {artist.styles?.slice(0, 3).map((style, index) => (
            <Tag
              key={style + index}
              variant="primary"
              size="sm"
            >
              {style}
            </Tag>
          )) || []}
        </div>

        {/* Location */}
        <div className="mt-2">
          <Badge variant="secondary" size="sm" data-testid="artist-location">
            {artist.location || artist.locationDisplay || artist.tattooStudio?.address?.city || 'Location not available'}
          </Badge>
        </div>
      </div>

      {/* Business Information */}
      <div className="mt-4 space-y-3">
        {/* Pricing Information */}
        {artist.pricing && (
          <div className="bg-neutral-50 rounded-lg p-3">
            <PricingDisplay 
              pricing={artist.pricing}
              size="sm"
            />
          </div>
        )}

        {/* Availability Status */}
        {artist.availability && (
          <div className="flex justify-center">
            <AvailabilityStatus 
              availability={artist.availability}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Portfolio Thumbnails */}
      <div className="mt-4 grid grid-cols-3 gap-1" data-testid="portfolio-images">
        {(artist.portfolio || artist.portfolioImages)?.slice(0, 3).map((img, i) => {
          const imgSrc = typeof img === 'string' ? img : img?.url;
          return imgSrc ? (
            <div key={i} className="aspect-square relative overflow-hidden rounded-md">
              <Image
                src={imgSrc}
                alt={`Portfolio ${i}`}
                fill
                className="object-cover transition-transform duration-200 hover:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : null;
        }) || []}
      </div>

      {/* Contact Options */}
      <div className="mt-4">
        <ContactOptions 
          contactInfo={artist.contactInfo}
          instagramHandle={instagramHandle}
          size="sm"
        />
      </div>

      {/* CTA Button */}
      <div className="mt-4">
        <Link href={`/artists/${artist.artistId || artist.PK || 'unknown'}`}>
          <Button
            variant="primary"
            size="md"
            className="w-full"
          >
            View Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}
