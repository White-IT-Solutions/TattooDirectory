/**
 * Configuration helper for environment-specific settings
 * This module provides a centralized way to access configuration values
 * that vary between development, staging, and production environments.
 */

/**
 * Get the current environment
 * @returns {string} The current environment (development, production, etc.)
 */
export const getEnvironment = () => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // In browser, check hostname for local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'local';
    }
  }
  
  // Use environment variables
  return process.env.NEXT_PUBLIC_ENVIRONMENT || 
         process.env.NODE_ENV || 
         'production';
};

/**
 * Get the API base URL for the current environment
 * @returns {string} The API base URL
 */
export const getApiUrl = () => {
  const environment = getEnvironment();
  
  // Local development with Docker backend
  if (environment === 'local') {
    // Check if we're running in Docker (backend service available)
    if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_API_URL) {
      // Server-side or explicit API URL set (Docker environment)
      return process.env.NEXT_PUBLIC_API_URL || 'http://backend:8080/2015-03-31/functions/function/invocations';
    } else {
      // Client-side local development (direct Lambda RIE access)
      return 'http://localhost:9000/2015-03-31/functions/function/invocations';
    }
  }
  
  // Environment-specific URLs
  switch (environment) {
    case 'development':
    case 'dev':
      return process.env.NEXT_PUBLIC_API_URL_DEV || 
             process.env.NEXT_PUBLIC_API_URL ||
             'https://dev-api-gateway-url.execute-api.eu-west-2.amazonaws.com';
             
    case 'production':
    case 'prod':
      return process.env.NEXT_PUBLIC_API_URL_PROD || 
             process.env.NEXT_PUBLIC_API_URL ||
             'https://prod-api-gateway-url.execute-api.eu-west-2.amazonaws.com';
             
    default:
      return process.env.NEXT_PUBLIC_API_URL ||
             'https://prod-api-gateway-url.execute-api.eu-west-2.amazonaws.com';
  }
};

/**
 * Check if we're using Lambda RIE (Runtime Interface Emulator)
 * @returns {boolean} True if using Lambda RIE
 */
export const isUsingLambdaRIE = () => {
  const apiUrl = getApiUrl();
  return apiUrl.includes('/2015-03-31/functions/function/invocations');
};

/**
 * Get Google Maps API key
 * @returns {string} The Google Maps API key
 */
export const getGoogleMapsApiKey = () => {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
};

/**
 * Check if we're running in Docker environment
 * @returns {boolean} True if running in Docker
 */
export const isDockerEnvironment = () => {
  // Check for Docker-specific environment indicators
  return process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' && 
         process.env.NEXT_PUBLIC_API_URL && 
         process.env.NEXT_PUBLIC_API_URL.includes('backend:');
};

/**
 * Check if we're in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
  const env = getEnvironment();
  return env === 'local' || env === 'development' || env === 'dev';
};

/**
 * Check if we're in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = () => {
  const env = getEnvironment();
  return env === 'production' || env === 'prod';
};

/**
 * Get all configuration values
 * @returns {object} Configuration object
 */
export const getConfig = () => ({
  environment: getEnvironment(),
  apiUrl: getApiUrl(),
  googleMapsApiKey: getGoogleMapsApiKey(),
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
  isDockerEnvironment: isDockerEnvironment(),
});

// Export default configuration
export default getConfig();