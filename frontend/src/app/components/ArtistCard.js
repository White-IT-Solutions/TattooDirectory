"use client";
import Image from "next/image";
import Link from "next/link";

export default function ArtistCard({ artist }) {
  // Use fallback values for missing or undefined fields
  const artistName = artist.artistsName || artist.name || 'Unknown Artist';
  const avatarSrc = artist.avatar || '/placeholder-avatar.svg';
  const bio = artist.bio || 'Tattoo artist';
  const profileLink = artist.profileLink || artist.contactInfo?.website || artist.contactInfo?.instagram || '#';
  const instagramHandle = artist.instagramHandle || 'unknown';
  
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col justify-between" data-testid="artist-card">
      {/* Avatar & Info */}
      <div className="text-center">
        <Image
          src={avatarSrc}
          alt={artistName}
          width={80}
          height={80}
          className="rounded-full mx-auto"
          onError={(e) => {
            e.target.src = '/placeholder-avatar.svg';
          }}
        />
        <h2 className="mt-3 font-semibold" data-testid="artist-name">{artistName}</h2>
        <p className="text-gray-600 text-sm">{bio}</p>

        {/* Styles */}
        <div className="mt-2 flex flex-wrap justify-center gap-2" data-testid="artist-styles">
          {artist.styles?.slice(0, 3).map((style, index) => (
            <span
              key={style + index}
              className="bg-blue-800 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-300"
            >
              #{style}
            </span>
          )) || []}
        </div>
        {/* Location */}
        <div className="mt-2">
          <span className="bg-blue-200 px-2 py-1 rounded text-xs" data-testid="artist-location">
            {artist.location || artist.locationDisplay || artist.tattooStudio?.address?.city || 'Location not available'}
          </span>
        </div>
      </div>

      {/* Portfolio Thumbnails */}
      <div className="mt-4 grid grid-cols-3 gap-1" data-testid="portfolio-images">
        {(artist.portfolio || artist.portfolioImages)?.slice(0, 3).map((img, i) => {
          const imgSrc = typeof img === 'string' ? img : img?.url;
          return imgSrc ? (
            <Image
              key={i}
              src={imgSrc}
              alt={`Portfolio ${i}`}
              width={100}
              height={100}
              className="object-cover rounded-md"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null;
        }) || []}
      </div>

      {/* CTA Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        {profileLink && profileLink !== '#' && (
          <Link
            href={profileLink}
            target="_blank"
            className="text-blue-600 text-sm hover:underline text-center"
            data-testid="instagram-link"
          >
            Instagram: @{instagramHandle}
          </Link>
        )}
        <Link
          href={`/artists/${artist.artistId || artist.PK || 'unknown'}`}
          className="bg-black text-white py-2 rounded-lg text-center hover:bg-gray-800"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
