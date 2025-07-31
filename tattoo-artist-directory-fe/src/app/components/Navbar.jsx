"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [search, setSearch] = useState("");

  // Handle the search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim() !== "") {
      // Redirect to a search results page (adjust the path as needed)
      router.push(`/search?query=${encodeURIComponent(search)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-10 bg-inhereit/30 backdrop-filter backdrop-blur-lg border-b border-gray-950">
      <div className=" mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <span className="text-2xl text-white font-semibold">
            <Link
              href="/home"
              className="text-2xl font-bold tracking-tight text-grey hover:text-gray-400"
            >
              TD
            </Link>
          </span>
          <div className="flex space-x-4 text-white">
            <Link
              href="/artists"
              className="text-base text-gray-200 hover:text-gray-400 transition"
            >
              Artists
            </Link>
            {/* <Link
              href="/login"
              className="text-base text-gray-200 hover:text-gray-400 transition"
            >
              Log In
            </Link> */}
          </div>
          {/* Right side: Search bar */}
          {/* <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full px-3 py-1 shadow-inner">
        <input
          type="text"
          placeholder="Search artist or style..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none px-2 py-1 w-48"
        />
        <button
          type="submit"
          className="ml-2 px-3 py-1 rounded-full bg-black text-white font-medium hover:bg-gray-900 transition"
        >
          Search
        </button>
      </form> */}
        </div>
      </div>
    </nav>
  );
}
