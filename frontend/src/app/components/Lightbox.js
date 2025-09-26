"use client";
import { useState } from "react";
import Image from "next/image";

export default function Lightbox({ images, thumbSize = 600, grid = false }) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out empty or invalid images and normalize the format
  const validImages = (images || []).map(img => {
    if (typeof img === 'string') {
      return img;
    } else if (img && img.url) {
      return img.url;
    }
    return null;
  }).filter(img => img && img.trim() !== '');

  if (validImages.length === 0) {
    return (
      <div className="text-center mt-20">
        <p className="text-lg text-gray-600">No portfolio images available.</p>
      </div>
    );
  }

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  const closeLightbox = () => setOpen(false);

  const showPrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));

  const showNext = () =>
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));

  return (
    <div>
      {/* Thumbnails */}
      <div
        className={
          grid ? "columns-3 gap-1 space-y-1" : "grid grid-cols-3 gap-1"
        }
      >
        {validImages.map((img, i) => (
          <div key={i} className="relative group cursor-zoom-in hover:z-10">
            <Image
              src={img}
              alt={`Tattoo ${i}`}
              width={thumbSize}
              height={thumbSize}
              className="w-full rounded-md group-hover:scale-105 transition-transform duration-200 z-10"
              onClick={() => openLightbox(i)}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <button
            className="absolute top-5 right-5 text-white text-2xl"
            onClick={closeLightbox}
          >
            ✕
          </button>
          <button
            className="absolute left-5 text-white text-2xl"
            onClick={showPrev}
          >
            ‹
          </button>
          <Image
            src={validImages[currentIndex]}
            alt={`Tattoo ${currentIndex}`}
            width={900}
            height={900}
            className="rounded-lg max-h-[90vh] max-w-[90vw]"
          />
          <button
            className="absolute right-5 text-white text-2xl"
            onClick={showNext}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
