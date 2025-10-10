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
  
  // Debug logging to help troubleshoot configuration issues
  if (typeof window !== 'undefined') {
    console.log('Config Debug:', {
      environment,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV,
      hostname: window.location.hostname
    });
  }
  
  // Local development with Docker backend
  if (environment === 'local') {
    // Use CORS proxy for local development (port 9001)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';
    console.log('Using API URL:', apiUrl);
    return apiUrl;
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
  // If using the proxy server (port 9001), use regular REST calls
  if (apiUrl.includes('localhost:9001')) {
    return false;
  }
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