export const API_CONFIG = {
  local: {
    baseURL: "http://localhost:3000",
  },
  development: {
    baseURL: process.env.NEXT_PUBLIC_API_URL_DEV || 
             process.env.NEXT_PUBLIC_API_URL ||
             "https://dev-api-gateway-url.execute-api.eu-west-2.amazonaws.com",
  },
  production: {
    baseURL: process.env.NEXT_PUBLIC_API_URL_PROD || 
             process.env.NEXT_PUBLIC_API_URL ||
             "https://prod-api-gateway-url.execute-api.eu-west-2.amazonaws.com",
  },
};

export const getApiUrl = () => {
  // Check if we're in local development mode (running on localhost)
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log('API Config: Using local development URL');
    return API_CONFIG.local.baseURL;
  }
  
  // Use environment-specific configuration
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 
                     process.env.NODE_ENV || 
                     'production';
  
  let apiUrl;
  switch (environment) {
    case 'development':
    case 'dev':
      apiUrl = API_CONFIG.development.baseURL;
      break;
    case 'production':
    case 'prod':
      apiUrl = API_CONFIG.production.baseURL;
      break;
    default:
      apiUrl = API_CONFIG.production.baseURL;
  }
  
  // Debug logging (only in development)
  if (environment === 'development' || environment === 'dev') {
    console.log(`API Config: Environment=${environment}, URL=${apiUrl}`);
  }
  
  return apiUrl;
};
