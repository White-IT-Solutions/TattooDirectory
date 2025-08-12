"use client";
import Image from "next/image";
import Link from "next/link";

export default function ArtistCard({ artist }) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col justify-between">
      {/* Avatar & Info */}
      <div className="text-center">
        <Image
          src={artist.avatar}
          alt={artist.artistsName}
          width={80}
          height={80}
          className="rounded-full mx-auto"
        />
        <h2 className="mt-3 font-semibold">{artist.artistsName}</h2>
        <p className="text-gray-600 text-sm">{artist.bio}</p>

        {/* Styles */}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {artist.styles.slice(0, 3).map((style, index) => (
            <span
              key={style + index}
              className="bg-blue-800 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-300"
            >
              #{style}
            </span>
          ))}
        </div>
        {/* Location */}
        <div className="mt-2">
          <span className="bg-blue-200 px-2 py-1 rounded text-xs">
            {artist.tattooStudio.address.city}
          </span>
        </div>
      </div>

      {/* Portfolio Thumbnails */}
      <div className="mt-4 grid grid-cols-3 gap-1">
        {artist.portfolio.slice(0, 3).map((img, i) => (
          <Image
            key={i}
            src={img}
            alt={`Portfolio ${i}`}
            width={100}
            height={100}
            className="object-cover rounded-md"
          />
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={artist.profileLink}
          target="_blank"
          className="text-blue-600 text-sm hover:underline text-center"
        >
          Instagram: @{artist.instagramHandle}
        </Link>
        <Link
          href={`/artists/${artist.PK}`}
          className="bg-black text-white py-2 rounded-lg text-center hover:bg-gray-800"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
