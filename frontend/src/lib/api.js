import { getApiUrl, isUsingLambdaRIE } from "./config.js";
import { apiRequest, withRetry, ApiError } from "./errors.js";
import { lambdaRequest } from "./lambda-adapter.js";

const apiUrl = getApiUrl();
const useLambdaRIE = isUsingLambdaRIE();

// Create retry-enabled versions of API calls for better reliability
const retryableRequest = withRetry(apiRequest, {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000
});

/**
 * Make an API request, using Lambda RIE adapter if needed
 * @param {string} path - API path (e.g., '/v1/artists')
 * @param {Object} options - Request options
 * @returns {Promise<Response>} Fetch response
 */
async function makeApiRequest(path, options = {}) {
  if (useLambdaRIE) {
    // Extract query parameters from URL if present
    const url = new URL(path, 'http://dummy.com');
    const searchParams = url.searchParams;
    const cleanPath = url.pathname;
    
    return lambdaRequest(apiUrl, options.method || 'GET', cleanPath, searchParams, options.body);
  } else {
    // Regular API Gateway request
    return retryableRequest(`${apiUrl}${path}`, options);
  }
}

export const api = {
  /**
   * Get artists with optional pagination
   * @param {number} limit - Number of artists to return
   * @param {string|null} cursor - Pagination cursor
   * @returns {Promise<Object>} - Artists data
   * @throws {ApiError} - RFC 9457 compliant error
   */
  async getArtists(limit = 20, cursor = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await makeApiRequest(`/v1/artists?${params}`);
    return response.json();
  },

  /**
   * Get a specific artist by ID
   * @param {string} artistId - The artist ID
   * @returns {Promise<Object>} - Artist data
   * @throws {ApiError} - RFC 9457 compliant error
   */
  async getArtist(artistId) {
    if (!artistId) {
      throw new ApiError({
        type: 'https://api.tattoodirectory.com/docs/errors#validation',
        title: 'Validation Error',
        status: 400,
        detail: 'Artist ID is required',
        instance: null
      });
    }

    const response = await makeApiRequest(`/v1/artists/${artistId}`);
    return response.json();
  },

  /**
   * Search artists by styles
   * @param {string|string[]} styles - Style(s) to search for
   * @returns {Promise<Object>} - Artists data
   * @throws {ApiError} - RFC 9457 compliant error
   */
  async getArtistsByStyles(styles) {
    if (!styles || (Array.isArray(styles) && styles.length === 0)) {
      throw new ApiError({
        type: 'https://api.tattoodirectory.com/docs/errors#validation',
        title: 'Validation Error',
        status: 400,
        detail: 'At least one style is required',
        instance: null
      });
    }

    const stylesParam = Array.isArray(styles) ? styles.join(",") : styles;
    const response = await makeApiRequest(
      `/v1/artists?styles=${encodeURIComponent(stylesParam)}`
    );
    return response.json();
  },

  /**
   * Search artists with multiple parameters
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Text query
   * @param {string} searchParams.style - Style filter
   * @param {string} searchParams.location - Location filter
   * @returns {Promise<Object>} - Artists data
   * @throws {ApiError} - RFC 9457 compliant error
   */
  async searchArtists({ query, style, location }) {
    const params = new URLSearchParams();
    
    if (query) params.append('query', query);
    if (style) params.append('style', style);
    if (location) params.append('location', location);

    if (params.toString() === '') {
      throw new ApiError({
        type: 'https://api.tattoodirectory.com/docs/errors#validation',
        title: 'Validation Error',
        status: 400,
        detail: 'At least one search parameter is required: query, style, or location',
        instance: null
      });
    }

    const response = await makeApiRequest(`/v1/artists?${params}`);
    return response.json();
  },

  /**
   * Get available tattoo styles
   * @returns {Promise<Object>} - Styles data
   * @throws {ApiError} - RFC 9457 compliant error
   */
  async getStyles() {
    const response = await makeApiRequest(`/v1/styles`);
    return response.json();
  },

  /**
   * Submit a removal request
   * @param {Object} data - Removal request data
   * @returns {Promise<Object>} - Response data
   * @throws {ApiError} - RFC 9457 compliant error
   */
  async submitRemovalRequest(data) {
    if (!data || typeof data !== 'object') {
      throw new ApiError({
        type: 'https://api.tattoodirectory.com/docs/errors#validation',
        title: 'Validation Error',
        status: 400,
        detail: 'Request data is required',
        instance: null
      });
    }

    const response = await makeApiRequest(`/v1/removal-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
    });
    return response.json();
  },
};

// Export error handling utilities for use in components
export { ApiError } from "./errors.js";
