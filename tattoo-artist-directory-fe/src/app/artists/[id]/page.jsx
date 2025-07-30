import Image from "next/image";
import Link from "next/link";
import {mockArtistData} from "../../data/mockArtistData";

export default function ArtistPage({ params }) {
  const artistId = params.id;
  const artist = [...mockArtistData].find(
    (artist) => artist.PK.toString() === artistId
  );

  if (!artist) {
    return (
      <div className="p-10 text-center">
        <p>Artist not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-80 bg-white p-6 shadow-lg">
        <div className="text-center">
          <Image
            src={artist.avatar}
            alt={artist.artistsName}
            width={120}
            height={120}
            className="rounded-full mx-auto"
          />
          <h2 className="mt-4 text-xl font-semibold">{artist.artistsName}</h2>
          <p className="text-gray-600">{artist.bio}</p>

          {/* Styles */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {artist.styles.map((style) => (
              <span
                key={style}
                className="bg-gray-200 px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-300"
              >
                #{style}
              </span>
            ))}
          </div>

          {/* Location */}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <span className="bg-blue-200 px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-300">
              {artist.tattooStudio.address.city}
            </span>
          </div>

          {/* Social + contact */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <Link
              href={artist.profileLink}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Instagram: @{artist.instagramHandle}
            </Link>
            <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
              Contact the artist
            </button>
          </div>

          {/* Google Maps */}
          <div className="mt-4">
            <iframe
              className="rounded-lg"
              width="100%"
              height="200"
              frameBorder="0"
              src={`https://www.google.com/maps?q=${artist.tattooStudio.address.latitude},${artist.tattooStudio.address.longitude}&z=15&output=embed`}
              allowFullScreen
            ></iframe>
          </div>

          {/* Delist Button */}
          <div className="mt-4">
            <Link
              href="/delist"
              className="block bg-red-500 text-white text-center py-2 rounded-lg hover:bg-red-600"
            >
              Request Delisting
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 p-6 overflow-y-auto">
        {artist.portfolio && artist.portfolio.length > 0 ? (
          <div className="columns-3 gap-1 space-y-1">
            {artist.portfolio.map((img, i) => (
              <div key={i} className="relative group cursor-zoom-in">
                <Image
                  src={img}
                  alt={`Tattoo ${i}`}
                  width={600}
                  height={600}
                  className="w-full rounded-md group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-20">
            <p className="text-lg text-gray-600">
              Portfolio not available. Please check their{" "}
              <Link
                href={artist.profileLink}
                target="_blank"
                className="text-blue-600 underline"
              >
                social media
              </Link>
              .
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
