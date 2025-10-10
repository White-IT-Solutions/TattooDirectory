/**
 * API Service Layer
 * Handles switching between LocalStack (local) and AWS API Gateway (production)
 */

class ApiService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.apiUrl = this.isDevelopment
      ? process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:9000"
      : process.env.NEXT_PUBLIC_API_URL;
  }

  /**
   * Search for artists
   * @param {Object} params - Search parameters
   * @param {string} params.q - Text query
   * @param {string} params.location - Location filter
   * @param {string} params.style - Style filter
   * @returns {Promise<Object>} Search results
   */
  async searchArtists(params = {}) {
    if (!this.apiUrl) {
      throw new Error("API URL not configured");
    }

    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append("q", params.q);
    if (params.location) queryParams.append("location", params.location);
    if (params.style) queryParams.append("style", params.style);

    const response = await fetch(`${this.apiUrl}/artists?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get artist by ID
   * @param {string} id - Artist ID
   * @returns {Promise<Object>} Artist data
   */
  async getArtistById(id) {
    if (!this.apiUrl) {
      throw new Error("API URL not configured");
    }

    const response = await fetch(`${this.apiUrl}/artists/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Artist with ID ${id} not found`);
      }
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing
export { ApiService };
