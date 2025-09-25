"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { styleImages } from "../data/testData/tattooStyles";
import { mockArtistData as mockArtists } from "../data/mockArtistData";

//decide how style options for the filter are going to be handled. A list of common styles (originally done this way), was updated to include only styles that the artists in data have.
const STYLES = [
  ...new Set(mockArtists.flatMap((artist) => artist.styles)),
].sort();

export default function TattooStyleFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const styleParams = searchParams.get("styles");
    if (styleParams) setSelected(styleParams.split(","));
    else setSelected([]);
  }, [searchParams]);

  const updateSearchParams = (newSelected) => {
    if (newSelected.length > 0) {
      // Navigate to artists page with style filter
      router.push(`/artists?styles=${newSelected.join(",")}`);
    } else {
      // Navigate to artists page without filters
      router.push('/artists');
    }
  };

  //improve readability
  const toggleStyle = (style) => {
    const newSelected = selected.includes(style)
      ? selected.filter((s) => s !== style)
      : [...selected, style];
    setSelected(newSelected);
    updateSearchParams(newSelected);
  };

  const clearAll = () => {
    setSelected([]);
    updateSearchParams([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4" data-testid="style-filter">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">Filter by Tattoo Style</h3>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-s px-5 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition font-medium text-white"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="max-w-3/4">
        <div className="grid row-auto sm:grid-cols-4 md:grid-cols-5 gap-y-1 mb-1">
          {STYLES.map((style) => {
            const isSelected = selected.includes(style);
            return (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`
                group relative flex items-end justify-items-stretch w-3/4 h-14 md:h-16  rounded-xl overflow-hidden
               bg-gray-900
                transition-all duration-200 ease-out
                ${isSelected ? "ring-2 ring-blue-800" : ""}
                hover:scale-110 hover:shadow-[0_0_18px_4px_rgba(59,130,246,0.4)]
                focus:outline-none
              `}
                style={{ minWidth: 0 }}
                title={style}
                data-testid={`style-button-${style.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {styleImages[style] ? (
                  <>
                    <img
                      src={styleImages[style]}
                      alt={style}
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
                    <span className="relative z-10 text-white text-xs md:text-sm font-semibold px-2 py-1 rounded">
                      {style}
                    </span>
                  </>
                ) : (
                  <span className="relative z-10 text-white text-xs md:text-sm font-semibold px-2 py-1 rounded">
                    {style}
                    {/*need images for all of these, decide if style name will always be included */}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
