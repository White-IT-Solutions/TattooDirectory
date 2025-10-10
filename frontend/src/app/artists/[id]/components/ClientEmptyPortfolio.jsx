"use client";

import { EmptyPortfolio } from "../../../../design-system/components/feedback/EmptyState";

export default function ClientEmptyPortfolio({ isOwnProfile, artistName }) {
  const handleContactArtist = () => {
    // Scroll to contact section or open contact modal
    const contactSection = document.getElementById('contact-options');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <EmptyPortfolio
      isOwnProfile={isOwnProfile}
      artistName={artistName}
      onContactArtist={handleContactArtist}
    />
  );
}