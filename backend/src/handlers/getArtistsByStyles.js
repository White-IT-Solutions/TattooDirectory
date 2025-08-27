//GET /artists/{styles} (comma-separated list, e.g. /artists/Tribal,Old%20School)

import { handler as listArtistsHandler } from "./listArtists.js";

export const handler = async (event) => {
  const raw = event.pathParameters?.styles || "";
  const styles = raw
    .split(",")
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean);

  if (!styles.length) return resp(400, { message: "No styles provided" });

  try {
    const allArtistsResponse = await listArtistsHandler(event);
    const allArtistsData = JSON.parse(allArtistsResponse.body);
    const allArtists = allArtistsData.items || [];

    const filteredArtists = allArtists.filter((artist) =>
      artist.styles.some((style) => styles.includes(style))
    );

    return resp(200, { items: filteredArtists });
  } catch (error) {
    console.error("Error fetching artists by styles:", error);
    return resp(500, { message: "Internal server error" });
  }
};
const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});
