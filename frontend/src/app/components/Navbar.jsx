"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-10 bg-inhereit/30 backdrop-filter backdrop-blur-lg border-b border-gray-950">
      <div className=" mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <span className="text-2xl text-white font-semibold">
            <Link
              href="/"
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
            <Link
              href="/"
              className="text-base text-gray-200 hover:text-gray-400 transition"
            >
              Home
            </Link>
            {/* <Link
              href="/login"
              className="text-base text-gray-200 hover:text-gray-400 transition"
            >
              Log In
            </Link> */}
          </div>{" "}
        </div>
      </div>
    </nav>
  );
}
