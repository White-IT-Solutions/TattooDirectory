//GET /artists (paginated; optional limit, cursor)

import { mockArtists } from "../data/mockData.js";

export const handler = async (event) => {
  try {
    return resp(200, { items: mockArtists, nextCursor: null });
  } catch (error) {
    console.error("Error listing artists:", error);
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
