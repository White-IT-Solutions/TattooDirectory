import { mockArtists } from "../data/mockData.js";

//GET /artist/{id}

export const handler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id || typeof id !== "string" || id.trim() === "") {
    return resp(400, { message: "Missing or invalid id" });
  }

  try {
    const artist = mockArtists.find(a => a.artistId === id);
    if (!artist) return resp(404, { message: "Artist not found" });
    return resp(200, artist);
  } catch (error) {
    console.error("Error fetching artist:", error.message);
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
