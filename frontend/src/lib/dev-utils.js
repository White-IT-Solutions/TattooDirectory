/**
 * Development utilities for handling API calls when backend is not available
 */

/**
 * Check if we're in development mode and should use mock data
 */
export function shouldUseMockData() {
  return process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;
}

/**
 * Safe API call wrapper that falls back to mock data in development
 */
export async function safeApiCall(apiCall, fallbackData = null) {
  if (shouldUseMockData()) {
    console.warn('Backend not available, using mock data');
    return fallbackData;
  }

  try {
    return await apiCall();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('API call failed, falling back to mock data:', error.message);
      return fallbackData;
    }
    throw error;
  }
}