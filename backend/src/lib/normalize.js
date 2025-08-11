export function normalizeArtistForEntityIndex(artist) {
  return {
    gsi1pk: "ARTIST",
    gsi1sk: artist.artistsName?.toLowerCase() || artist.artistId,
  };
}

export function instagramIndex(instagramHandle) {
  if (!instagramHandle) return {};
  return { gsi2pk: instagramHandle.toLowerCase() };
}
