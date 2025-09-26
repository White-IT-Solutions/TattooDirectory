'use client';

import Image from "next/image";
import { useState } from "react";

export default function AvatarImage({ src, alt, width = 120, height = 120, className = "" }) {
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    setImageSrc('/placeholder-avatar.svg');
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}