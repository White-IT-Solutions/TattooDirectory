// API configuration for frontend integration
export const API_CONFIG = {
  local: {
    baseURL: 'http://localhost:3000',
    endpoints: {
      artists: '/artists',
      artist: '/artist',
      artistsByStyles: '/artists',
      removalRequests: '/removal-requests'
    }
  },
  production: {
    baseURL: 'https://your-api-gateway-url.execute-api.eu-west-2.amazonaws.com',
    endpoints: {
      artists: '/artists',
      artist: '/artist', 
      artistsByStyles: '/artists',
      removalRequests: '/removal-requests'
    }
  }
};

// Usage in frontend:
// const config = API_CONFIG[process.env.NODE_ENV === 'production' ? 'production' : 'local'];
// const response = await fetch(`${config.baseURL}${config.endpoints.artists}`);