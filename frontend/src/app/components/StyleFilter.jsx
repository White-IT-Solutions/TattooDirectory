"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { styleImages } from "../data/testData/tattooStyles";

const STYLES = [
  "Old School",
  "Traditional",
  "New School",
  "Neo Traditional",
  "Tribal",
  "Blackwork",
  "Dotwork",
  "Geometric",
  "Illustrative",
  "Sketch",
  "Watercolour",
  "Japanese",
  "Anime",
  "Lettering",
  "Minimalism",
  "Realism",
  "Psychedelic",
  "Surrealism",
  "Floral",
  "Fine Line",
];

export default function TattooStyleFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const styles = searchParams.get("styles");
    if (styles) setSelected(styles.split(","));
    else setSelected([]);
  }, [searchParams]);

  const updateSearchParams = (newSelected) => {
    const params = new URLSearchParams(window.location.search);
    if (newSelected.length > 0) params.set("styles", newSelected.join(","));
    else params.delete("styles");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const toggleStyle = (style) => {
    let newSelected = selected.includes(style)
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
    <div className="w-full max-w-xl mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">Filter by Tattoo Style</h3>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 transition font-medium text-white"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {STYLES.map((style) => {
          const isSelected = selected.includes(style);
          return (
            <button
              key={style}
              type="button"
              onClick={() => toggleStyle(style)}
              className={`
                group relative flex items-end justify-center w-full h-14 md:h-16 rounded-xl overflow-hidden
                border border-gray-700 bg-gray-900
                transition-all duration-200 ease-out
                ${isSelected ? "ring-2 ring-blue-400" : ""}
                hover:scale-110 hover:shadow-[0_0_18px_4px_rgba(59,130,246,0.4)]
                focus:outline-none
              `}
              style={{ minWidth: 0 }}
              title={style}
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
                  <span className="relative z-10 text-white text-xs md:text-sm font-semibold px-2 py-1 bg-black/40 rounded">
                    {style}
                  </span>
                </>
              ) : (
                <span className="relative z-10 text-white text-xs md:text-sm font-semibold px-2 py-1 bg-black/60 rounded">
                  {style}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
