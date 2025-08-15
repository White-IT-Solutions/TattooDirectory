export const API_CONFIG = {
  local: {
    baseURL: "http://localhost:3000",
  },
  production: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://your-api-gateway-url.execute-api.eu-west-2.amazonaws.com",
  },
};

export const getApiUrl = () => {
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? API_CONFIG.local.baseURL : API_CONFIG.production.baseURL;
};
