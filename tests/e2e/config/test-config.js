/**
 * E2E Test Configuration
 * Centralized configuration for Puppeteer E2E tests
 */

const config = {
  // Application URLs
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    backend: process.env.BACKEND_URL || 'http://localhost:9000',
    swagger: process.env.SWAGGER_URL || 'http://localhost:8080',
    localstack: process.env.LOCALSTACK_URL || 'http://localhost:4566'
  },

  // Puppeteer configuration
  puppeteer: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.DEBUG === 'true' ? 100 : 0,
    devtools: process.env.DEBUG === 'true',
    defaultViewport: {
      width: 1280,
      height: 720
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },

  // Test timeouts
  timeouts: {
    navigation: 30000,
    element: 10000,
    api: 5000,
    screenshot: 3000
  },

  // Visual regression testing
  visual: {
    threshold: 0.1, // 10% difference threshold
    screenshotDir: './screenshots',
    baselineDir: './screenshots/baseline',
    diffDir: './screenshots/diff'
  },

  // Test data
  testData: {
    searchTerms: ['traditional', 'realism', 'blackwork', 'watercolor'],
    locations: ['London', 'Manchester', 'Birmingham'],
    artistIds: ['artist-001', 'artist-002', 'artist-003']
  },

  // Selectors for common elements
  selectors: {
    // Navigation
    searchInput: '[data-testid="search-input"]',
    searchButton: '[data-testid="search-button"]',
    locationFilter: '[data-testid="location-filter"]',
    styleFilter: '[data-testid="style-filter"]',
    styleButton: '[data-testid^="style-button-"]', // Matches any style button
    
    // Results
    searchResults: '[data-testid="search-results"]',
    artistCard: '[data-testid="artist-card"]',
    artistName: '[data-testid="artist-name"]',
    artistLocation: '[data-testid="artist-location"]',
    artistStyles: '[data-testid="artist-styles"]',
    
    // Artist Profile
    artistProfile: '[data-testid="artist-profile"]',
    portfolioImages: '[data-testid="portfolio-images"]',
    contactInfo: '[data-testid="contact-info"]',
    instagramLink: '[data-testid="instagram-link"]',
    
    // Map View
    mapContainer: '[data-testid="map-container"]',
    mapMarker: '[data-testid="map-marker"]',
    
    // Loading states
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]'
  }
};

module.exports = config;