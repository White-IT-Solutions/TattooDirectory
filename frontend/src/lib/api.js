import { getApiUrl } from "../../../backend/api-config.js";

const apiUrl = getApiUrl();

export const api = {
  async getArtists(limit = 20, cursor = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await fetch(`${apiUrl}/artists?${params}`);
    return response.json();
  },

  async getArtist(id) {
    const response = await fetch(`${apiUrl}/artist/${id}`);
    return response.json();
  },

  async getArtistsByStyles(styles) {
    const stylesParam = Array.isArray(styles) ? styles.join(",") : styles;
    const response = await fetch(
      `${apiUrl}/artists/${encodeURIComponent(stylesParam)}`
    );
    return response.json();
  },

  async submitRemovalRequest(data) {
    const response = await fetch(`${apiUrl}/removal-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
