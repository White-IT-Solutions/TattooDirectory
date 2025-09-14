import Image from "next/image";
import Link from "next/link";
import { api } from "../../../lib/api";
import Lightbox from "@/app/components/Lightbox";
import AvatarImage from "@/app/components/AvatarImage";
import { mockArtistData as mockArtists } from "../../data/mockArtistData";

export default async function ArtistPage({ params }) {
  const { id: artistId } = await params;

  let artist = null;
  try {
    // Check if we should use mock data in development
    const shouldUseMock = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;
    
    if (shouldUseMock) {
      console.warn('Using mock data - backend not configured');
      artist = mockArtists.find(a => a.artistId === artistId || a.PK === artistId);
    } else {
      artist = await api.getArtist(artistId);
      console.log('Individual artist API result:', artist);
    }
  } catch (error) {
    console.error("Failed to fetch artist, trying mock data:", error);
    // Fallback to mock data
    artist = mockArtists.find(a => a.artistId === artistId || a.PK === artistId);
  }

  if (!artist) {
    return (
      <div className="p-10 text-center">
        <p>Artist not found.</p>
      </div>
    );
  }

  // Use fallback values for missing or undefined fields
  const artistName = artist.artistsName || artist.name || 'Unknown Artist';
  const avatarSrc = artist.avatar || '/placeholder-avatar.svg';
  const bio = artist.bio || 'Tattoo artist';
  const profileLink = artist.profileLink || artist.contactInfo?.website || artist.contactInfo?.instagram || '#';
  const instagramHandle = artist.instagramHandle || 'unknown';
  const location = artist.location || artist.locationDisplay || artist.tattooStudio?.address?.city || 'Location not available';
  const portfolio = artist.portfolio || artist.portfolioImages || [];

  return (
    <div className="flex min-h-screen" data-testid="artist-profile">
      {/* Sidebar */}
      <aside className="w-80 bg-white p-6 shadow-lg">
        <div className="text-center">
          <AvatarImage
            src={avatarSrc}
            alt={artistName}
            width={120}
            height={120}
            className="rounded-full mx-auto"
          />
          <h2 className="mt-4 text-xl font-semibold" data-testid="artist-name">{artistName}</h2>
          <p className="text-gray-600">{bio}</p>

          {/* Styles */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {artist.styles?.map((style) => (
              <span
                key={style}
                className="bg-gray-200 px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-300"
              >
                #{style}
              </span>
            )) || []}
          </div>

          {/* Location */}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <span className="bg-blue-200 px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-300">
              {location}
            </span>
          </div>

          {/* Social + contact */}
          <div className="mt-4 flex flex-col items-center gap-2" data-testid="contact-info">
            {profileLink && profileLink !== '#' && (
              <Link
                href={profileLink}
                target="_blank"
                className="text-blue-600 hover:underline"
                data-testid="instagram-link"
              >
                Instagram: @{instagramHandle}
              </Link>
            )}
            <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
              Contact the artist
            </button>
          </div>

          {/* Google Maps */}
          {(artist.tattooStudio?.address?.latitude && artist.tattooStudio?.address?.longitude) ||
           (artist.latitude && artist.longitude) ? (
              <div className="mt-4">
                <iframe
                  className="rounded-lg"
                  width="100%"
                  height="200"
                  frameBorder="0"
                  src={`https://www.google.com/maps?q=${
                    artist.latitude || artist.tattooStudio.address.latitude
                  }%2C${
                    artist.longitude || artist.tattooStudio.address.longitude
                  }&z=15&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            ) : null}

          {/* Delist Button */}
          <div className="mt-4">
            <Link
              href="/takedown"
              className="block bg-red-500 text-white text-center py-2 rounded-lg hover:bg-red-600"
            >
              Request Profile Removal
            </Link>
          </div>
        </div>
      </aside>
      {/* Main Section */}
      <main className="flex-1 p-6 overflow-y-auto" data-testid="portfolio-images">
        {portfolio && portfolio.length > 0 ? (
          <Lightbox images={portfolio} grid />
        ) : (
          <div className="text-center mt-20">
            <p className="text-lg text-gray-600">
              Portfolio not available. Please check their{" "}
              {profileLink && profileLink !== '#' ? (
                <Link
                  href={profileLink}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  social media
                </Link>
              ) : (
                <span>social media</span>
              )}
              .
            </p>
          </div>
        )}
      </main>{" "}
    </div>
  );
}
