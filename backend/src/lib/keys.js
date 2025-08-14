export const artistPK = (id) => {
  if (!id) throw new Error("Artist ID is required");
  return `ARTIST#${id}`;
};
export const artistSK = () => `PROFILE`;
export const stylePK = (style) => {
  if (!style) throw new Error("Style is required");
  return `STYLE#${style}`;
};
export const styleSK = (id) => {
  if (!id) throw new Error("Artist ID is required");
  return `ARTIST#${id}`;
};
