"use client";

import { Suspense } from "react";
import EnhancedArtistsPage from "./EnhancedArtistsPage";

export default function ArtistsListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnhancedArtistsPage />
    </Suspense>
  );
}
