#!/usr/bin/env node

/**
 * Enhanced Frontend Sync Processor Class
 * 
 * Handles frontend mock data generation and synchronization with comprehensive
 * mock data generation capabilities. Integrates advanced features from mock-data-generator
 * including realistic business data, multiple testing scenarios, CLI interface,
 * RFC 9457 compliant error responses, and performance testing data generation.
 */

const fs = require('fs');
const path = require('path');
const { DATA_CONFIG } = require('./data-config');
const { STATE_MANAGER } = require('./state-manager');

/**
 * Mock avatar URLs for realistic frontend data
 */
const MOCK_AVATARS = [
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-72.jpg',
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/96.jpg',
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-25.jpg',
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-45.jpg',
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-67.jpg',
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-89.jpg',
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-12.jpg',
  'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-34.jpg'
];

/**
 * Mock studio names for realistic data
 */
const MOCK_STUDIOS = [
  'Ink & Steel Studio',
  'Modern Ink Studio',
  'Vibrant Ink Studio',
  'Botanical Tattoo Collective',
  'Classic Ink Parlour',
  'Urban Canvas Studio',
  'Artisan Tattoo Co.',
  'Electric Needle Studio',
  'Sacred Art Tattoos',
  'Rebel Ink Studio'
];

/**
 * Mock locations with realistic UK coordinates
 */
const MOCK_LOCATIONS = [
  { city: 'London', latitude: 51.5074, longitude: -0.1278, addresses: ['45 Camden High Street', '78 Shoreditch High Street', '92 Brick Lane', '156 Camden Market'] },
  { city: 'Manchester', latitude: 53.4808, longitude: -2.2426, addresses: ['23 Northern Quarter', '67 Deansgate', '89 Oxford Road'] },
  { city: 'Birmingham', latitude: 52.4862, longitude: -1.8904, addresses: ['12 Digbeth', '34 Jewellery Quarter', '56 Broad Street'] },
  { city: 'Leeds', latitude: 53.8008, longitude: -1.5491, addresses: ['78 Call Lane', '90 Briggate', '45 Headrow'] },
  { city: 'Liverpool', latitude: 53.4084, longitude: -2.9916, addresses: ['23 Bold Street', '67 Mathew Street', '89 Hope Street'] },
  { city: 'Bristol', latitude: 51.4545, longitude: -2.5879, addresses: ['12 Park Street', '34 Gloucester Road', '56 Stokes Croft'] },
  { city: 'Edinburgh', latitude: 55.9533, longitude: -3.1883, addresses: ['78 Royal Mile', '90 Grassmarket', '45 Rose Street'] },
  { city: 'Glasgow', latitude: 55.8642, longitude: -4.2518, addresses: ['23 Merchant City', '67 West End', '89 Southside'] }
];

/**
 * Enhanced mock data generation constants with comprehensive business data
 */

// Expanded artist names for more variety
const ARTIST_NAMES = [
  'Sarah Mitchell', 'Jake Thompson', 'Luna Rodriguez', 'Marcus Chen',
  'Isabella Foster', 'Ethan Brooks', 'Maya Patel', 'Connor Walsh',
  'Zoe Anderson', 'Dylan Martinez', 'Aria Kim', 'Logan Davis',
  'Nova Johnson', 'Phoenix Taylor', 'River Stone', 'Sage Williams',
  'Emma Wilson', 'Oliver Brown', 'Sophia Garcia', 'James Miller',
  'Ava Davis', 'William Moore', 'Mia Taylor', 'Benjamin Wilson',
  'Charlotte Anderson', 'Lucas Thomas', 'Amelia Jackson', 'Henry White'
];

// Enhanced bio templates with more variety and realistic content
const BIO_TEMPLATES = {
  traditional: [
    'Traditional and neo-traditional tattoo artist specializing in roses, eagles, and nautical themes',
    'Classic American traditional style with bold lines and vibrant colors',
    'Old school tattoo specialist with expertise in sailor jerry designs',
    'Traditional tattoo artist with 8+ years experience in bold, timeless designs',
    'Specializing in classic American traditional with modern twist and attention to detail'
  ],
  realism: [
    'Photorealistic tattoo artist creating lifelike portraits and nature scenes',
    'Realism specialist focusing on detailed black and grey work',
    'Portrait and wildlife realism expert with 10+ years experience',
    'Hyperrealistic tattoo artist bringing photographs to life on skin',
    'Black and grey realism specialist with fine art background'
  ],
  geometric: [
    'Geometric and blackwork specialist with modern aesthetic',
    'Sacred geometry and mandala expert creating precise patterns',
    'Contemporary geometric designs with mathematical precision',
    'Minimalist geometric tattoo artist with architectural background',
    'Sacred geometry specialist creating meaningful, balanced designs'
  ],
  watercolour: [
    'Watercolor and realism specialist creating vibrant, lifelike tattoos',
    'Abstract watercolor artist bringing paintings to skin',
    'Colorful watercolor specialist with fine art background',
    'Painterly tattoo artist specializing in flowing, artistic designs',
    'Watercolor technique expert with contemporary art influence'
  ],
  blackwork: [
    'Bold blackwork and tribal specialist with striking designs',
    'Solid black tattoo expert creating powerful visual statements',
    'Blackwork and dotwork artist with minimalist approach',
    'Heavy blackwork specialist with gothic and dark art influence',
    'Tribal and blackwork expert preserving traditional techniques'
  ],
  fineline: [
    'Fine line and minimalist tattoo artist with delicate touch',
    'Intricate fine line work specialist in botanical designs',
    'Delicate line work expert creating subtle, elegant tattoos',
    'Minimalist fine line artist with botanical and nature focus',
    'Single needle specialist creating delicate, detailed artwork'
  ],
  dotwork: [
    'Dotwork and floral specialist with intricate detail work',
    'Stippling and dotwork expert creating textured masterpieces',
    'Mandala and dotwork specialist with meditative approach',
    'Pointillism tattoo artist with patience for detailed stippling',
    'Sacred dotwork specialist creating spiritual and meaningful designs'
  ],
  neo_traditional: [
    'Neo-traditional artist blending classic and contemporary styles',
    'Modern twist on traditional tattoos with enhanced color palettes',
    'Neo-traditional specialist with illustration background'
  ],
  japanese: [
    'Traditional Japanese tattoo artist specializing in irezumi',
    'Japanese style expert with cultural respect and authenticity',
    'Tebori and machine specialist in traditional Japanese designs'
  ],
  biomechanical: [
    'Biomechanical tattoo artist creating futuristic organic designs',
    'Sci-fi and biomech specialist with technical precision',
    'Cyberpunk and biomechanical expert with detailed shading'
  ]
};

// Realistic pricing ranges and business data
const PRICING_RANGES = {
  budget: { hourlyRate: 80, minimumCharge: 60, currency: 'GBP', description: '£' },
  mid: { hourlyRate: 120, minimumCharge: 100, currency: 'GBP', description: '££' },
  premium: { hourlyRate: 180, minimumCharge: 150, currency: 'GBP', description: '£££' },
  luxury: { hourlyRate: 250, minimumCharge: 200, currency: 'GBP', description: '££££' }
};

// Availability statuses with realistic booking scenarios
const AVAILABILITY_OPTIONS = [
  { status: 'Available', bookingOpen: true, nextAvailable: null, waitingList: false },
  { status: 'Booking 1-2 weeks', bookingOpen: true, nextAvailable: '2024-02-15', waitingList: false },
  { status: 'Booking 2-4 weeks', bookingOpen: true, nextAvailable: '2024-03-01', waitingList: false },
  { status: 'Booking 1-2 months', bookingOpen: true, nextAvailable: '2024-04-01', waitingList: false },
  { status: 'Waitlist only', bookingOpen: false, nextAvailable: null, waitingList: true },
  { status: 'Books closed', bookingOpen: false, nextAvailable: null, waitingList: false }
];

// Experience levels and certifications
const EXPERIENCE_LEVELS = [
  { yearsActive: 2, apprenticeshipCompleted: true, certifications: ['First Aid', 'Bloodborne Pathogens'] },
  { yearsActive: 5, apprenticeshipCompleted: true, certifications: ['First Aid', 'Bloodborne Pathogens', 'Advanced Shading'] },
  { yearsActive: 8, apprenticeshipCompleted: true, certifications: ['First Aid', 'Bloodborne Pathogens', 'Color Theory', 'Guest Artist'] },
  { yearsActive: 12, apprenticeshipCompleted: true, certifications: ['First Aid', 'Bloodborne Pathogens', 'Color Theory', 'Guest Artist', 'Convention Judge'] },
  { yearsActive: 15, apprenticeshipCompleted: true, certifications: ['First Aid', 'Bloodborne Pathogens', 'Color Theory', 'Guest Artist', 'Convention Judge', 'Master Artist'] }
];

// Enhanced testing scenarios with templates for different use cases
const TESTING_SCENARIOS = {
  empty: { 
    artistCount: 0, 
    description: 'Empty results for testing no-data states',
    template: 'empty-state'
  },
  single: { 
    artistCount: 1, 
    description: 'Single result for testing minimal data display',
    template: 'minimal',
    styles: ['traditional'],
    locations: ['London']
  },
  few: { 
    artistCount: 3, 
    description: 'Few results for testing small datasets',
    template: 'basic',
    styles: ['traditional', 'realism'],
    locations: ['London', 'Manchester']
  },
  normal: { 
    artistCount: 8, 
    description: 'Normal result set for standard testing',
    template: 'standard',
    styles: ['traditional', 'realism', 'geometric', 'watercolour'],
    locations: ['London', 'Manchester', 'Birmingham']
  },
  many: { 
    artistCount: 20, 
    description: 'Many results for testing pagination and performance',
    template: 'extended',
    styles: ['traditional', 'realism', 'geometric', 'watercolour', 'blackwork', 'fineline'],
    locations: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool']
  },
  large: { 
    artistCount: 50, 
    description: 'Large dataset for performance testing',
    template: 'performance',
    includePerformanceData: true
  },
  huge: { 
    artistCount: 100, 
    description: 'Huge dataset for stress testing',
    template: 'stress-test',
    includePerformanceData: true
  },
  // Specialized scenario templates
  'london-focused': {
    artistCount: 10,
    description: 'London-focused artists for location testing',
    template: 'location-specific',
    locations: ['London'],
    styles: ['traditional', 'realism', 'geometric']
  },
  'style-diverse': {
    artistCount: 12,
    description: 'Diverse styles for filtering tests',
    template: 'style-focused',
    styles: ['traditional', 'realism', 'geometric', 'watercolour', 'blackwork', 'fineline', 'dotwork', 'japanese'],
    ensureAllStyles: true
  },
  'high-rated': {
    artistCount: 3,
    description: 'High-rated artists for quality testing',
    template: 'quality-focused',
    minRating: 4.5,
    styles: ['realism', 'traditional']
  },
  'booking-available': {
    artistCount: 8,
    description: 'Artists with open booking slots',
    template: 'availability-focused',
    bookingOpen: true,
    styles: ['traditional', 'realism', 'blackwork']
  }
};

// Data scenario templates for reuse
const SCENARIO_TEMPLATES = {
  'empty-state': {
    includeBusinessData: false,
    validateData: false,
    exportToFile: false
  },
  'minimal': {
    includeBusinessData: true,
    portfolioImageCount: 3,
    contactInfoLevel: 'basic'
  },
  'basic': {
    includeBusinessData: true,
    portfolioImageCount: 5,
    contactInfoLevel: 'standard'
  },
  'standard': {
    includeBusinessData: true,
    portfolioImageCount: 6,
    contactInfoLevel: 'full',
    includeStudioData: true
  },
  'extended': {
    includeBusinessData: true,
    portfolioImageCount: 8,
    contactInfoLevel: 'full',
    includeStudioData: true,
    includeStyleMetadata: true
  },
  'performance': {
    includeBusinessData: true,
    includePerformanceData: true,
    portfolioImageCount: 5,
    optimizeForSize: true
  },
  'stress-test': {
    includeBusinessData: true,
    includePerformanceData: true,
    portfolioImageCount: 10,
    includeAllFeatures: true
  }
};

// Error response templates following RFC 9457 format
const ERROR_TEMPLATES = {
  validation: {
    type: 'https://tattoo-directory.com/errors/validation-error',
    title: 'Validation Error',
    status: 400,
    detail: 'The request contains invalid parameters'
  },
  not_found: {
    type: 'https://tattoo-directory.com/errors/not-found',
    title: 'Artist Not Found',
    status: 404,
    detail: 'The requested artist could not be found'
  },
  rate_limit: {
    type: 'https://tattoo-directory.com/errors/rate-limit',
    title: 'Rate Limit Exceeded',
    status: 429,
    detail: 'Too many requests. Please try again later.'
  },
  server_error: {
    type: 'https://tattoo-directory.com/errors/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred while processing your request'
  },
  service_unavailable: {
    type: 'https://tattoo-directory.com/errors/service-unavailable',
    title: 'Service Unavailable',
    status: 503,
    detail: 'The search service is temporarily unavailable'
  }
};

/**
 * Enhanced FrontendSyncProcessor class with comprehensive mock data generation
 */
class FrontendSyncProcessor {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.stateManager = STATE_MANAGER;
    this.frontendMockPath = config.paths.frontendMockData;
    
    // Enhanced processing statistics
    this.stats = {
      generated: 0,
      updated: 0,
      failed: 0,
      errors: [],
      scenarios: {},
      performance: {
        startTime: null,
        endTime: null,
        duration: 0,
        memoryUsage: 0
      }
    };
    
    // Load existing test data for enhanced generation
    this.loadTestData();
  }
  
  /**
   * Load existing test data for enhanced mock generation
   */
  loadTestData() {
    try {
      const artistsPath = path.join(this.config.paths.testDataDir, 'artists.json');
      const studiosPath = path.join(this.config.paths.testDataDir, 'studios.json');
      const stylesPath = path.join(this.config.paths.testDataDir, 'styles.json');
      
      this.testData = {
        artists: fs.existsSync(artistsPath) ? JSON.parse(fs.readFileSync(artistsPath, 'utf8')) : [],
        studios: fs.existsSync(studiosPath) ? JSON.parse(fs.readFileSync(studiosPath, 'utf8')) : [],
        styles: fs.existsSync(stylesPath) ? JSON.parse(fs.readFileSync(stylesPath, 'utf8')) : []
      };
      
      console.log(`📚 Loaded test data: ${this.testData.artists.length} artists, ${this.testData.studios.length} studios, ${this.testData.styles.length} styles`);
    } catch (error) {
      console.warn('⚠️  Could not load test data, using built-in templates:', error.message);
      this.testData = { artists: [], studios: [], styles: [] };
    }
  }

  /**
   * Enhanced mock data generation with comprehensive business data and scenarios
   */
  async generateMockData(options = {}) {
    const { 
      artistCount = 8, 
      useRealData = false, 
      imageUrls = null,
      scenario = null,
      includeBusinessData = true,
      includePerformanceData = false,
      exportToFile = false,
      validateData = true
    } = options;
    
    this.stats.performance.startTime = Date.now();
    this.stats.performance.memoryUsage = process.memoryUsage().heapUsed;
    
    console.log(`🎨 Generating enhanced mock data for ${artistCount} artists...`);
    if (scenario) console.log(`📋 Using scenario: ${scenario}`);
    
    try {
      let mockArtists;
      
      // Apply scenario-specific configuration
      const scenarioConfig = this.getScenarioConfig(scenario, artistCount);
      const finalArtistCount = scenarioConfig.artistCount;
      
      if (useRealData && this.hasRealData() && !includeBusinessData) {
        // Use real seeded data if available (only when business data is not needed)
        mockArtists = await this.generateFromRealData(finalArtistCount, imageUrls, scenarioConfig);
      } else {
        // Generate enhanced mock data (preferred for business data)
        mockArtists = this.generateEnhancedMockData(finalArtistCount, imageUrls, scenarioConfig, includeBusinessData);
      }
      
      // Add performance testing data if requested
      if (includePerformanceData) {
        mockArtists = this.addPerformanceTestingData(mockArtists);
      }
      
      // Validate data structure if requested
      if (validateData) {
        const validationErrors = this.validateMockData(mockArtists);
        if (validationErrors.length > 0) {
          console.warn(`⚠️  Data validation warnings: ${validationErrors.length} issues found`);
          this.stats.errors.push(...validationErrors.map(error => ({
            type: 'validation_warning',
            message: error,
            timestamp: new Date().toISOString()
          })));
        }
      }
      
      // Export to file if requested
      if (exportToFile) {
        await this.exportDataToFile(mockArtists, scenario);
      }
      
      this.stats.performance.endTime = Date.now();
      this.stats.performance.duration = this.stats.performance.endTime - this.stats.performance.startTime;
      this.stats.generated = mockArtists.length;
      this.stats.scenarios[scenario || 'default'] = {
        artistCount: mockArtists.length,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Generated ${mockArtists.length} enhanced mock artists in ${this.stats.performance.duration}ms`);
      
      return {
        success: true,
        mockData: mockArtists,
        stats: this.stats,
        scenario: scenarioConfig
      };
      
    } catch (error) {
      console.error('❌ Enhanced mock data generation failed:', error.message);
      this.stats.errors.push({
        type: 'generation_error',
        message: error.message,
        timestamp: new Date().toISOString(),
        scenario: scenario
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }
  
  /**
   * Get scenario configuration with fallback to default
   */
  getScenarioConfig(scenario, defaultCount) {
    if (!scenario) {
      return { artistCount: defaultCount, description: 'Default generation' };
    }
    
    const scenarioConfig = TESTING_SCENARIOS[scenario];
    if (scenarioConfig) {
      return { ...scenarioConfig, artistCount: scenarioConfig.artistCount || defaultCount };
    }
    
    // Check if it's a config scenario
    const configScenario = this.config.scenarios[scenario];
    if (configScenario) {
      return { 
        artistCount: configScenario.artistCount || defaultCount,
        description: configScenario.description,
        styles: configScenario.styles,
        locations: configScenario.locations,
        ...configScenario
      };
    }
    
    console.warn(`⚠️  Unknown scenario '${scenario}', using default configuration`);
    return { artistCount: defaultCount, description: 'Default generation' };
  }
  
  /**
   * Generate enhanced mock data with comprehensive business information and studio relationships
   */
  generateEnhancedMockData(artistCount, imageUrls = null, scenarioConfig = {}, includeBusinessData = true) {
    const mockArtists = [];
    
    // Generate individual artists first
    for (let i = 0; i < artistCount; i++) {
      const artist = this.createEnhancedMockArtist(i + 1, imageUrls, scenarioConfig, includeBusinessData);
      mockArtists.push(artist);
    }
    
    // Generate bidirectional artist-studio relationships
    const relationshipData = this.generateArtistStudioRelationships(mockArtists);
    
    // Store studio data for potential export
    this.generatedStudios = relationshipData.studios;
    
    // Add style metadata to artists if requested
    if (includeBusinessData) {
      relationshipData.artists.forEach(artist => {
        artist.styleMetadata = artist.styles.map(style => ({
          styleName: style,
          ...this.generateStyleMetadata(style)
        }));
      });
    }
    
    return relationshipData.artists;
  }

  /**
   * Generate pure mock data without backend dependencies
   */
  generatePureMockData(artistCount, imageUrls = null, scenario = null) {
    const mockArtists = [];
    
    for (let i = 0; i < artistCount; i++) {
      const artist = this.createMockArtist(i + 1, imageUrls, scenario);
      mockArtists.push(artist);
    }
    
    return mockArtists;
  }

  /**
   * Create enhanced mock artist with comprehensive business data
   */
  createEnhancedMockArtist(index, imageUrls = null, scenarioConfig = {}, includeBusinessData = true) {
    const artistId = `artist-${String(index).padStart(3, '0')}`;
    const artistName = this.generateArtistName();
    const styles = this.selectRandomStyles(scenarioConfig);
    const primaryStyle = styles[0];
    const location = this.selectRandomLocation(scenarioConfig);
    const studio = this.selectRandomStudio();
    const instagramHandle = this.generateInstagramHandle(artistName);
    
    // Base artist structure with required fields
    const artist = {
      // System fields
      pk: `ARTIST#${index}`,
      sk: 'PROFILE',
      artistId: artistId,
      
      // Core identity (standardized naming)
      artistName: artistName, // Fixed: was artistsName
      bio: this.generateBio(primaryStyle), // Added: was missing
      avatar: this.selectRandomAvatar(),
      instagramHandle: instagramHandle,
      
      // Location & Studio (restructured format)
      locationDisplay: `${location.city}, UK`,
      tattooStudio: { // Fixed: was studioInfo
        studioId: `studio-${String(Math.floor(index / 2) + 1).padStart(3, '0')}`,
        studioName: studio,
        address: { // Fixed: moved latitude/longitude here
          street: this.selectRandomAddress(location),
          city: location.city,
          postcode: location.postcode || this.generatePostcode(location.city),
          latitude: location.latitude + (Math.random() - 0.5) * 0.01,
          longitude: location.longitude + (Math.random() - 0.5) * 0.01
        }
      },
      
      // Artistic information
      styles: styles,
      portfolioImages: this.generatePortfolioImages(styles, imageUrls),
      
      // System fields
      geohash: this.generateGeohash(location.latitude, location.longitude),
      opted_out: false // Added: privacy control
    };
    
    // Add comprehensive business data if requested
    if (includeBusinessData) {
      const pricingTier = this.selectRandomChoice(Object.keys(PRICING_RANGES));
      const pricing = PRICING_RANGES[pricingTier];
      const availability = this.selectRandomChoice(AVAILABILITY_OPTIONS);
      const experience = this.selectRandomChoice(EXPERIENCE_LEVELS);
      
      // Business information
      artist.rating = this.randomFloat(3.8, 5.0, 1);
      artist.reviewCount = this.randomInt(5, 200);
      
      artist.pricing = {
        hourlyRate: pricing.hourlyRate + this.randomInt(-20, 20),
        minimumCharge: pricing.minimumCharge + this.randomInt(-10, 10),
        currency: pricing.currency,
        description: pricing.description
      };
      
      artist.availability = {
        status: availability.status,
        bookingOpen: availability.bookingOpen,
        nextAvailable: availability.nextAvailable,
        waitingList: availability.waitingList
      };
      
      artist.experience = {
        yearsActive: experience.yearsActive + this.randomInt(-1, 2),
        apprenticeshipCompleted: experience.apprenticeshipCompleted,
        certifications: [...experience.certifications]
      };
      
      // Enhanced contact information
      artist.contactInfo = {
        instagram: `@${instagramHandle}`,
        email: `${artistName.toLowerCase().replace(/\s+/g, '.')}@${studio.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: this.generatePhoneNumber(),
        website: `https://${artistName.toLowerCase().replace(/\s+/g, '')}.tattoo.com`
      };
      
      // Additional specialties
      artist.specialties = this.generateSpecialties(styles);
    }
    
    return artist;
  }
  
  /**
   * Create a single mock artist (legacy method for backward compatibility)
   */
  createMockArtist(index, imageUrls = null, scenario = null) {
    return this.createEnhancedMockArtist(index, imageUrls, scenario, false);
  }

  /**
   * Generate from real seeded data
   */
  async generateFromRealData(artistCount, imageUrls) {
    try {
      // Try to load real artist data
      const testDataPath = path.join(this.config.paths.testDataDir, 'artists.json');
      
      if (!fs.existsSync(testDataPath)) {
        console.warn('⚠️  Real data not found, falling back to pure mock data');
        return this.generatePureMockData(artistCount, imageUrls);
      }
      
      const realArtists = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
      const selectedArtists = realArtists.slice(0, artistCount);
      
      return selectedArtists.map(artist => this.convertRealArtistToMockFormat(artist, imageUrls));
      
    } catch (error) {
      console.warn('⚠️  Could not load real data, using mock data:', error.message);
      return this.generatePureMockData(artistCount, imageUrls);
    }
  }

  /**
   * Convert real artist data to frontend mock format
   */
  convertRealArtistToMockFormat(realArtist, imageUrls) {
    return {
      pk: `ARTIST#${realArtist.artistId}`,
      sk: 'PROFILE',
      artistId: realArtist.artistId,
      artistName: realArtist.artistName, // Fixed: was artistsName
      instagramHandle: realArtist.instagramHandle,
      bio: realArtist.bio || this.generateBio(realArtist.styles[0]),
      avatar: this.selectRandomAvatar(),
      profileLink: `https://instagram.com/${realArtist.instagramHandle}`,
      locationDisplay: realArtist.locationDisplay || `${realArtist.city || 'London'}, UK`,
      tattooStudio: {
        studioName: realArtist.studioName || this.selectRandomStudio(),
        streetAddress: realArtist.address || this.selectRandomAddress(),
        address: {
          city: realArtist.locationDisplay || 'London',
          latitude: realArtist.latitude || 51.5074,
          longitude: realArtist.longitude || -0.1278
        }
      },
      styles: realArtist.styles,
      portfolioImages: this.generatePortfolioImagesFromReal(realArtist, imageUrls),
      opted_out: false
    };
  }

  /**
   * Generate portfolio images from real artist data
   */
  generatePortfolioImagesFromReal(realArtist, imageUrls) {
    if (realArtist.portfolioImages && realArtist.portfolioImages.length > 0) {
      return realArtist.portfolioImages.map(img => ({
        url: img.url || img,
        description: img.description || `${realArtist.styles[0]} tattoo design`,
        style: img.style || realArtist.styles[0]
      }));
    }
    
    return this.generatePortfolioImages(realArtist.styles, imageUrls);
  }

  /**
   * Select random styles for an artist
   */
  selectRandomStyles(scenario = null) {
    const allStyles = [
      'traditional', 'realism', 'geometric', 'watercolour', 'blackwork',
      'neo_traditional', 'fineline', 'dotwork', 'floral', 'minimalism',
      'old_school', 'new_school', 'tribal', 'lettering'
    ];
    
    // Scenario-specific style selection
    if (scenario) {
      const scenarioConfig = this.config.scenarios[scenario];
      if (scenarioConfig && scenarioConfig.styles) {
        const scenarioStyles = scenarioConfig.styles;
        const styleCount = Math.min(3, scenarioStyles.length);
        return this.shuffleArray([...scenarioStyles]).slice(0, styleCount);
      }
    }
    
    // Random selection
    const styleCount = Math.floor(Math.random() * 3) + 1; // 1-3 styles
    return this.shuffleArray([...allStyles]).slice(0, styleCount);
  }

  /**
   * Generate portfolio images for styles
   */
  generatePortfolioImages(styles, imageUrls = null) {
    const images = [];
    const imagesPerStyle = Math.floor(5 / styles.length) + 1;
    
    styles.forEach(style => {
      for (let i = 0; i < imagesPerStyle && images.length < 5; i++) {
        const image = {
          url: this.generateImageUrl(style, i + 1, imageUrls),
          description: this.generateImageDescription(style),
          style: style
        };
        images.push(image);
      }
    });
    
    return images.slice(0, 5); // Limit to 5 images
  }

  /**
   * Generate image URL
   */
  generateImageUrl(style, index, imageUrls = null) {
    // Use real image URLs if available
    if (imageUrls && imageUrls[style] && imageUrls[style].length > 0) {
      const styleImages = imageUrls[style];
      const randomImage = styleImages[Math.floor(Math.random() * styleImages.length)];
      return randomImage.url;
    }
    
    // Generate placeholder URL
    const endpoint = this.config.services.s3.endpoint;
    const bucket = this.config.services.s3.bucketName;
    const filename = `tattoo_${Math.floor(Math.random() * 150) + 1}.png`;
    
    return `${endpoint}/${bucket}/styles/${style}/${filename}`;
  }

  /**
   * Generate image description
   */
  generateImageDescription(style) {
    const descriptions = {
      traditional: ['Classic rose design', 'Bold eagle tattoo', 'Nautical anchor piece', 'Traditional swallow pair'],
      realism: ['Realistic portrait piece', 'Photorealistic animal', 'Detailed nature scene', 'Lifelike flower'],
      geometric: ['Sacred geometry pattern', 'Abstract geometric shapes', 'Mandala design', 'Mathematical precision'],
      watercolour: ['Watercolor butterfly', 'Abstract color splash', 'Painterly floral', 'Vibrant color blend'],
      blackwork: ['Bold blackwork design', 'Solid black pattern', 'Tribal-inspired piece', 'Minimalist black'],
      neo_traditional: ['Neo-traditional rose', 'Modern twist classic', 'Contemporary eagle', 'Updated traditional'],
      fineline: ['Delicate line work', 'Fine botanical design', 'Subtle minimalist', 'Elegant line art'],
      dotwork: ['Intricate dotwork mandala', 'Stippled pattern', 'Textured design', 'Meditative dots'],
      floral: ['Botanical arrangement', 'Realistic flower', 'Garden composition', 'Delicate petals'],
      minimalism: ['Simple line art', 'Clean geometric', 'Subtle design', 'Minimalist symbol']
    };
    
    const styleDescriptions = descriptions[style] || descriptions.traditional;
    return styleDescriptions[Math.floor(Math.random() * styleDescriptions.length)];
  }

  /**
   * Generate artist name from expanded list
   */
  generateArtistName() {
    return this.selectRandomChoice(ARTIST_NAMES);
  }

  /**
   * Generate Instagram handle based on artist name
   */
  generateInstagramHandle(artistName = null) {
    const name = artistName || this.generateArtistName();
    const prefixes = ['', 'ink', 'tattoo', 'art', 'needle', 'skin'];
    const suffixes = ['tattoos', 'ink', 'art', 'tattoo', 'studio', 'artist'];
    
    const cleanName = name.toLowerCase().replace(/\s+/g, '');
    const prefix = this.selectRandomChoice(prefixes);
    const suffix = this.selectRandomChoice(suffixes);
    
    return `${prefix}${cleanName}_${suffix}`.replace(/_{2,}/g, '_').replace(/^_|_$/g, '');
  }

  /**
   * Generate bio based on style
   */
  generateBio(primaryStyle) {
    const templates = BIO_TEMPLATES[primaryStyle] || BIO_TEMPLATES.traditional;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Select random avatar
   */
  selectRandomAvatar() {
    return MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)];
  }

  /**
   * Select random studio
   */
  selectRandomStudio() {
    return MOCK_STUDIOS[Math.floor(Math.random() * MOCK_STUDIOS.length)];
  }

  /**
   * Select random location
   */
  selectRandomLocation() {
    return MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
  }

  /**
   * Select random address for location
   */
  selectRandomAddress(location = null) {
    if (!location) {
      location = this.selectRandomLocation();
    }
    
    return location.addresses[Math.floor(Math.random() * location.addresses.length)];
  }

  /**
   * Update frontend mock data file
   */
  async updateFrontendMockData(mockData) {
    console.log('📝 Updating frontend mock data file...');
    
    try {
      // Ensure directory exists
      const mockDir = path.dirname(this.frontendMockPath);
      if (!fs.existsSync(mockDir)) {
        fs.mkdirSync(mockDir, { recursive: true });
      }
      
      // Generate the JavaScript file content
      const fileContent = this.generateMockDataFileContent(mockData);
      
      // Write to file
      fs.writeFileSync(this.frontendMockPath, fileContent, 'utf8');
      
      console.log(`✅ Updated frontend mock data: ${this.frontendMockPath}`);
      console.log(`📊 Mock data contains ${mockData.length} artists`);
      
      this.stats.updated++;
      
      return {
        success: true,
        filePath: this.frontendMockPath,
        artistCount: mockData.length
      };
      
    } catch (error) {
      console.error('❌ Failed to update frontend mock data:', error.message);
      this.stats.failed++;
      this.stats.errors.push({
        type: 'file_update_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate the JavaScript file content
   */
  generateMockDataFileContent(mockData) {
    const timestamp = new Date().toISOString();
    
    return `// mockArtistData.js
// Generated automatically by FrontendSyncProcessor
// Last updated: ${timestamp}

export const mockArtistData = ${JSON.stringify(mockData, null, 2)};
`;
  }

  /**
   * Synchronize frontend with backend data
   */
  async syncWithBackend(options = {}) {
    const { imageUrls = null, scenario = null } = options;
    
    console.log('🔄 Synchronizing frontend with backend data...');
    
    try {
      // Generate mock data using real data if available
      const scenarioConfig = this.getScenarioConfig(scenario, 8);
      const mockResult = await this.generateMockData({
        useRealData: true,
        imageUrls,
        scenario,
        artistCount: scenarioConfig.artistCount,
        includeBusinessData: true, // Add business data
        validateData: true
      });
      
      if (!mockResult.success) {
        throw new Error(mockResult.error);
      }
      
      // Update frontend file
      const updateResult = await this.updateFrontendMockData(mockResult.mockData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }
      
      console.log('✅ Frontend synchronization completed');
      
      return {
        success: true,
        artistCount: mockResult.mockData.length,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Frontend synchronization failed:', error.message);
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Process frontend-only mode
   */
  async processFrontendOnly(options = {}) {
    const { artistCount = 8, scenario = null } = options;
    
    console.log('🎨 Processing frontend-only mode...');
    
    try {
      // Generate pure mock data
      const mockResult = await this.generateMockData({
        useRealData: false,
        artistCount,
        scenario,
        includeBusinessData: true, // Add business data
        validateData: true
      });
      
      if (!mockResult.success) {
        throw new Error(mockResult.error);
      }
      
      // Update frontend file
      const updateResult = await this.updateFrontendMockData(mockResult.mockData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }
      
      console.log('✅ Frontend-only processing completed');
      
      return {
        success: true,
        mode: 'frontend-only',
        artistCount: mockResult.mockData.length,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Frontend-only processing failed:', error.message);
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Check if real data is available
   */
  hasRealData() {
    const testDataPath = path.join(this.config.paths.testDataDir, 'artists.json');
    return fs.existsSync(testDataPath);
  }

  /**
   * Enhanced validation for mock data structure with comprehensive checks
   */
  validateMockData(mockData) {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(mockData)) {
      errors.push('Mock data must be an array');
      return errors;
    }
    
    const artistIds = new Set();
    const studioIds = new Set();
    
    mockData.forEach((artist, index) => {
      // Required core fields
      if (!artist.artistId) {
        errors.push(`Artist ${index}: missing artistId`);
      } else {
        // Check for duplicate artist IDs
        if (artistIds.has(artist.artistId)) {
          errors.push(`Artist ${index}: duplicate artistId '${artist.artistId}'`);
        }
        artistIds.add(artist.artistId);
      }
      
      if (!artist.artistName) {
        errors.push(`Artist ${index}: missing artistName`);
      }
      if (!artist.bio) {
        errors.push(`Artist ${index}: missing bio field`);
      }
      
      // System fields validation
      if (!artist.pk) {
        errors.push(`Artist ${index}: missing pk (system field)`);
      }
      if (!artist.sk) {
        errors.push(`Artist ${index}: missing sk (system field)`);
      }
      if (artist.opted_out === undefined) {
        errors.push(`Artist ${index}: missing opted_out field`);
      }
      
      // Array fields validation
      if (!artist.styles || !Array.isArray(artist.styles)) {
        errors.push(`Artist ${index}: styles must be an array`);
      } else if (artist.styles.length === 0) {
        warnings.push(`Artist ${index}: no styles specified`);
      }
      
      if (!artist.portfolioImages || !Array.isArray(artist.portfolioImages)) {
        errors.push(`Artist ${index}: portfolioImages must be an array`);
      } else if (artist.portfolioImages.length < 3) {
        warnings.push(`Artist ${index}: fewer than 3 portfolio images`);
      }
      
      // Studio structure validation
      if (!artist.tattooStudio) {
        errors.push(`Artist ${index}: missing tattooStudio field`);
      } else {
        if (artist.tattooStudio.studioId) {
          studioIds.add(artist.tattooStudio.studioId);
        }
        
        if (!artist.tattooStudio.address) {
          errors.push(`Artist ${index}: missing tattooStudio.address`);
        } else {
          // Validate latitude/longitude are in address
          if (typeof artist.tattooStudio.address.latitude !== 'number') {
            errors.push(`Artist ${index}: latitude must be in tattooStudio.address`);
          }
          if (typeof artist.tattooStudio.address.longitude !== 'number') {
            errors.push(`Artist ${index}: longitude must be in tattooStudio.address`);
          }
          if (!artist.tattooStudio.address.city) {
            errors.push(`Artist ${index}: missing city in tattooStudio.address`);
          }
          if (!artist.tattooStudio.address.postcode) {
            warnings.push(`Artist ${index}: missing postcode in tattooStudio.address`);
          }
        }
      }
      
      // Contact info validation
      if (artist.contactInfo) {
        if (!artist.contactInfo.instagram) {
          errors.push(`Artist ${index}: missing instagram in contactInfo`);
        }
        if (artist.contactInfo.email && !artist.contactInfo.email.includes('@')) {
          warnings.push(`Artist ${index}: invalid email format`);
        }
        if (artist.contactInfo.website && !artist.contactInfo.website.startsWith('http')) {
          warnings.push(`Artist ${index}: invalid website URL format`);
        }
      }
      
      // Business data validation
      if (artist.pricing) {
        if (!artist.pricing.currency) {
          errors.push(`Artist ${index}: missing currency in pricing`);
        }
        if (typeof artist.pricing.hourlyRate !== 'number' || artist.pricing.hourlyRate <= 0) {
          warnings.push(`Artist ${index}: invalid hourly rate`);
        }
      }
      
      // Rating validation
      if (artist.rating !== undefined) {
        if (typeof artist.rating !== 'number' || artist.rating < 0 || artist.rating > 5) {
          warnings.push(`Artist ${index}: rating should be between 0 and 5`);
        }
      }
    });
    
    // Return combined errors and warnings
    return [...errors, ...warnings];
  }
  
  /**
   * Comprehensive data consistency checking
   */
  validateDataConsistency(artists, studios = []) {
    const issues = [];
    
    // Check artist-studio relationships
    const studioMap = new Map(studios.map(s => [s.studioId, s]));
    const artistMap = new Map(artists.map(a => [a.artistId, a]));
    
    artists.forEach(artist => {
      if (artist.tattooStudio && artist.tattooStudio.studioId) {
        const studio = studioMap.get(artist.tattooStudio.studioId);
        if (!studio) {
          issues.push(`Artist ${artist.artistId}: references non-existent studio ${artist.tattooStudio.studioId}`);
        } else {
          // Check if studio lists this artist
          if (!studio.artists || !studio.artists.includes(artist.artistId)) {
            issues.push(`Studio ${studio.studioId}: missing artist ${artist.artistId} in artists list`);
          }
        }
      }
    });
    
    // Check studio-artist relationships
    studios.forEach(studio => {
      if (studio.artists) {
        studio.artists.forEach(artistId => {
          const artist = artistMap.get(artistId);
          if (!artist) {
            issues.push(`Studio ${studio.studioId}: references non-existent artist ${artistId}`);
          } else {
            // Check if artist references this studio
            if (!artist.tattooStudio || artist.tattooStudio.studioId !== studio.studioId) {
              issues.push(`Artist ${artistId}: should reference studio ${studio.studioId}`);
            }
          }
        });
      }
    });
    
    // Check location consistency
    const locationGroups = new Map();
    artists.forEach(artist => {
      if (artist.tattooStudio && artist.tattooStudio.address) {
        const city = artist.tattooStudio.address.city;
        if (!locationGroups.has(city)) {
          locationGroups.set(city, []);
        }
        locationGroups.get(city).push(artist);
      }
    });
    
    // Validate coordinates are reasonable for UK
    artists.forEach(artist => {
      if (artist.tattooStudio && artist.tattooStudio.address) {
        const { latitude, longitude } = artist.tattooStudio.address;
        if (latitude < 49 || latitude > 61 || longitude < -8 || longitude > 2) {
          issues.push(`Artist ${artist.artistId}: coordinates outside UK bounds`);
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Data size estimation and optimization
   */
  estimateDataSize(data) {
    const jsonString = JSON.stringify(data);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
    const sizeKB = Math.round(sizeBytes / 1024 * 100) / 100;
    const sizeMB = Math.round(sizeKB / 1024 * 100) / 100;
    
    // Analyze data composition
    const analysis = {
      totalSize: {
        bytes: sizeBytes,
        kb: sizeKB,
        mb: sizeMB
      },
      artistCount: Array.isArray(data) ? data.length : (data.artists ? data.artists.length : 0),
      studioCount: data.studios ? data.studios.length : 0,
      averageArtistSize: 0,
      portfolioImageCount: 0,
      estimatedLoadTime: Math.round(sizeKB / 100) // Rough estimate: 100KB/s
    };
    
    if (analysis.artistCount > 0) {
      const artists = Array.isArray(data) ? data : data.artists;
      analysis.averageArtistSize = Math.round(sizeBytes / analysis.artistCount);
      analysis.portfolioImageCount = artists.reduce((total, artist) => 
        total + (artist.portfolioImages ? artist.portfolioImages.length : 0), 0);
    }
    
    return analysis;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset processing statistics
   */
  resetStats() {
    this.stats = {
      generated: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Generate RFC 9457 compliant error response
   */
  generateErrorResponse(type = 'validation', options = {}) {
    const template = ERROR_TEMPLATES[type] || ERROR_TEMPLATES.server_error;
    
    return {
      ...template,
      instance: options.instance || '/v1/artists',
      timestamp: new Date().toISOString(),
      requestId: this.generateRandomId(),
      ...options
    };
  }
  
  /**
   * Generate performance testing data
   */
  addPerformanceTestingData(artists) {
    return artists.map(artist => ({
      ...artist,
      performanceMetrics: {
        loadTime: this.randomInt(50, 300),
        imageLoadTime: this.randomInt(100, 500),
        searchRelevance: this.randomFloat(0.7, 1.0, 2),
        popularityScore: this.randomFloat(0.1, 1.0, 2)
      }
    }));
  }
  
  /**
   * Export data to file for reuse with comprehensive validation and optimization
   */
  async exportDataToFile(data, scenario = null, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mock-data-${scenario || 'default'}-${timestamp}.json`;
    const exportPath = path.join(this.config.paths.outputDir, filename);
    
    // Validate data before export
    const validationErrors = this.validateMockData(data);
    const consistencyIssues = this.validateDataConsistency(data, this.generatedStudios || []);
    const sizeAnalysis = this.estimateDataSize(data);
    
    // Create comprehensive export data with metadata
    const exportData = {
      artists: data,
      studios: this.generatedStudios || [],
      metadata: {
        generatedAt: new Date().toISOString(),
        scenario: scenario,
        artistCount: data.length,
        studioCount: (this.generatedStudios || []).length,
        version: '2.0.0',
        generator: 'enhanced-frontend-sync-processor',
        validation: {
          errors: validationErrors.length,
          consistencyIssues: consistencyIssues.length,
          isValid: validationErrors.length === 0 && consistencyIssues.length === 0
        },
        sizeAnalysis: sizeAnalysis,
        compatibility: {
          backwardCompatible: true,
          requiredFields: ['artistId', 'artistName', 'bio', 'tattooStudio', 'styles'],
          optionalFields: ['contactInfo', 'pricing', 'availability', 'experience']
        }
      }
    };
    
    // Add scenario template information if available
    if (scenario && SCENARIO_TEMPLATES[TESTING_SCENARIOS[scenario]?.template]) {
      exportData.metadata.template = TESTING_SCENARIOS[scenario].template;
      exportData.metadata.templateConfig = SCENARIO_TEMPLATES[TESTING_SCENARIOS[scenario].template];
    }
    
    try {
      await fs.promises.writeFile(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`💾 Exported comprehensive data to: ${exportPath}`);
      console.log(`📊 Data analysis:`);
      console.log(`   Artists: ${exportData.metadata.artistCount}`);
      console.log(`   Studios: ${exportData.metadata.studioCount}`);
      console.log(`   Size: ${sizeAnalysis.totalSize.kb}KB`);
      console.log(`   Validation: ${exportData.metadata.validation.isValid ? '✅ Valid' : '❌ Issues found'}`);
      
      if (validationErrors.length > 0) {
        console.log(`   Validation errors: ${validationErrors.length}`);
      }
      if (consistencyIssues.length > 0) {
        console.log(`   Consistency issues: ${consistencyIssues.length}`);
      }
      
      // Export validation report if there are issues
      if (validationErrors.length > 0 || consistencyIssues.length > 0) {
        const reportPath = path.join(this.config.paths.outputDir, `validation-report-${scenario || 'default'}-${timestamp}.json`);
        const report = {
          validationErrors,
          consistencyIssues,
          generatedAt: new Date().toISOString(),
          dataFile: filename
        };
        await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📋 Validation report: ${reportPath}`);
      }
      
      // Also export studios separately if they exist
      if (this.generatedStudios && this.generatedStudios.length > 0) {
        const studioFilename = `mock-studios-${scenario || 'default'}-${timestamp}.json`;
        const studioPath = path.join(this.config.paths.outputDir, studioFilename);
        await fs.promises.writeFile(studioPath, JSON.stringify(this.generatedStudios, null, 2));
        console.log(`🏢 Studio data: ${studioPath}`);
      }
      
      return exportPath;
    } catch (error) {
      console.error(`❌ Failed to export data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Import and reuse previously exported data
   */
  async importDataFromFile(filePath) {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const importedData = JSON.parse(fileContent);
      
      // Validate imported data structure
      if (!importedData.artists || !Array.isArray(importedData.artists)) {
        throw new Error('Invalid data format: missing artists array');
      }
      
      // Check version compatibility
      const version = importedData.metadata?.version || '1.0.0';
      console.log(`📥 Importing data version ${version}`);
      
      // Apply backward compatibility transformations if needed
      const compatibleData = this.ensureBackwardCompatibility(importedData.artists);
      
      // Store imported studios if available
      if (importedData.studios) {
        this.generatedStudios = importedData.studios;
      }
      
      console.log(`✅ Imported ${compatibleData.length} artists from ${filePath}`);
      if (importedData.metadata?.sizeAnalysis) {
        console.log(`📊 Data size: ${importedData.metadata.sizeAnalysis.totalSize.kb}KB`);
      }
      
      return {
        success: true,
        artists: compatibleData,
        studios: importedData.studios || [],
        metadata: importedData.metadata
      };
      
    } catch (error) {
      console.error(`❌ Failed to import data: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Ensure backward compatibility with existing data structures
   */
  ensureBackwardCompatibility(artists) {
    return artists.map(artist => {
      const compatibleArtist = { ...artist };
      
      // Handle old artistsName field
      if (artist.artistsName && !artist.artistName) {
        compatibleArtist.artistName = artist.artistsName;
        delete compatibleArtist.artistsName;
      }
      
      // Handle old studioInfo structure
      if (artist.studioInfo && !artist.tattooStudio) {
        compatibleArtist.tattooStudio = {
          studioName: artist.studioInfo.studioName || artist.studioInfo,
          address: {
            street: artist.studioInfo.streetAddress || artist.studioInfo.address,
            city: artist.locationDisplay?.split(',')[0] || 'London',
            latitude: artist.latitude || 51.5074,
            longitude: artist.longitude || -0.1278
          }
        };
        delete compatibleArtist.studioInfo;
      }
      
      // Ensure required fields exist
      if (!compatibleArtist.bio) {
        const primaryStyle = compatibleArtist.styles?.[0] || 'traditional';
        compatibleArtist.bio = this.generateBio(primaryStyle);
      }
      
      if (!compatibleArtist.pk) {
        compatibleArtist.pk = `ARTIST#${compatibleArtist.artistId}`;
      }
      
      if (!compatibleArtist.sk) {
        compatibleArtist.sk = 'PROFILE';
      }
      
      if (compatibleArtist.opted_out === undefined) {
        compatibleArtist.opted_out = false;
      }
      
      return compatibleArtist;
    });
  }
  
  /**
   * List available exported data files for reuse
   */
  async listExportedDataFiles() {
    try {
      const outputDir = this.config.paths.outputDir;
      const files = await fs.promises.readdir(outputDir);
      
      const dataFiles = files
        .filter(file => file.startsWith('mock-data-') && file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(outputDir, file);
          const stats = require('fs').statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: Math.round(stats.size / 1024 * 100) / 100, // KB
            created: stats.birthtime,
            scenario: file.match(/mock-data-(.+?)-\d{4}/)?.[1] || 'unknown'
          };
        })
        .sort((a, b) => b.created - a.created);
      
      return dataFiles;
    } catch (error) {
      console.error(`❌ Failed to list exported files: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Generate comprehensive studio data with opening hours and contact details
   */
  generateStudioData(studioId, studioName, location, artistIds = []) {
    const openingHours = this.generateOpeningHours();
    const contactInfo = this.generateStudioContactInfo(studioName);
    const established = this.randomInt(2005, 2020);
    const specialties = this.generateStudioSpecialties();
    
    return {
      studioId: studioId,
      studioName: studioName,
      address: {
        street: this.selectRandomAddress(location),
        city: location.city,
        postcode: location.postcode || this.generatePostcode(location.city),
        latitude: location.latitude + (Math.random() - 0.5) * 0.01,
        longitude: location.longitude + (Math.random() - 0.5) * 0.01
      },
      locationDisplay: `${location.city}, UK`,
      contactInfo: contactInfo,
      openingHours: openingHours,
      artists: artistIds, // Bidirectional relationship
      rating: this.randomFloat(4.0, 5.0, 1),
      reviewCount: this.randomInt(20, 150),
      established: established,
      specialties: specialties,
      geohash: this.generateGeohash(location.latitude, location.longitude)
    };
  }
  
  /**
   * Generate realistic opening hours for studios
   */
  generateOpeningHours() {
    const schedules = [
      // Standard schedule
      {
        monday: '10:00-18:00',
        tuesday: '10:00-18:00', 
        wednesday: '10:00-18:00',
        thursday: '10:00-20:00',
        friday: '10:00-20:00',
        saturday: '10:00-18:00',
        sunday: '12:00-16:00'
      },
      // Extended hours
      {
        monday: '09:00-19:00',
        tuesday: '09:00-19:00',
        wednesday: '09:00-19:00', 
        thursday: '09:00-21:00',
        friday: '09:00-21:00',
        saturday: '09:00-19:00',
        sunday: 'Closed'
      },
      // Compact schedule
      {
        monday: 'Closed',
        tuesday: '11:00-17:00',
        wednesday: '11:00-17:00',
        thursday: '11:00-19:00',
        friday: '11:00-19:00',
        saturday: '10:00-18:00',
        sunday: '12:00-17:00'
      }
    ];
    
    return this.selectRandomChoice(schedules);
  }
  
  /**
   * Generate studio contact information
   */
  generateStudioContactInfo(studioName) {
    const cleanName = studioName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = `${cleanName}.com`;
    const instagramHandle = `@${cleanName}studio`;
    
    return {
      phone: this.generatePhoneNumber(),
      email: `info@${domain}`,
      website: `https://${domain}`,
      instagram: instagramHandle
    };
  }
  
  /**
   * Generate studio specialties
   */
  generateStudioSpecialties() {
    const allSpecialties = [
      'traditional', 'neo_traditional', 'realism', 'blackwork', 'geometric',
      'watercolour', 'fineline', 'dotwork', 'japanese', 'biomechanical',
      'tribal', 'lettering', 'minimalism', 'floral'
    ];
    
    return this.selectRandomChoices(allSpecialties, 2, 5);
  }
  
  /**
   * Generate bidirectional artist-studio relationships
   */
  generateArtistStudioRelationships(artists) {
    const studios = new Map();
    const studiosPerLocation = new Map();
    
    artists.forEach((artist, index) => {
      const location = artist.tattooStudio.address.city;
      
      // Get or create studios for this location
      if (!studiosPerLocation.has(location)) {
        studiosPerLocation.set(location, []);
      }
      
      let studioData;
      const locationStudios = studiosPerLocation.get(location);
      
      // Assign artists to studios (2-3 artists per studio)
      if (locationStudios.length === 0 || 
          (locationStudios[locationStudios.length - 1].artists.length >= 3 && Math.random() > 0.3)) {
        // Create new studio
        const studioId = `studio-${String(studios.size + 1).padStart(3, '0')}`;
        const studioName = this.selectRandomStudio();
        const locationData = MOCK_LOCATIONS.find(loc => loc.city === location) || MOCK_LOCATIONS[0];
        
        studioData = this.generateStudioData(studioId, studioName, locationData, [artist.artistId]);
        studios.set(studioId, studioData);
        locationStudios.push(studioData);
      } else {
        // Add to existing studio
        studioData = locationStudios[locationStudios.length - 1];
        studioData.artists.push(artist.artistId);
      }
      
      // Update artist's studio reference
      artist.tattooStudio.studioId = studioData.studioId;
      artist.tattooStudio.studioName = studioData.studioName;
      artist.tattooStudio.address = { ...studioData.address };
    });
    
    return {
      artists: artists,
      studios: Array.from(studios.values())
    };
  }
  
  /**
   * Generate style metadata with characteristics and difficulty levels
   */
  generateStyleMetadata(styleName) {
    const styleMetadata = {
      traditional: {
        characteristics: ['bold-lines', 'solid-colors', 'iconic-imagery', 'vintage'],
        popularMotifs: ['roses', 'eagles', 'anchors', 'swallows', 'hearts'],
        colorPalette: ['red', 'blue', 'yellow', 'green', 'black'],
        difficulty: 'intermediate',
        timeOrigin: '1900s',
        aliases: ['old-school', 'american-traditional']
      },
      realism: {
        characteristics: ['photorealistic', 'detailed-shading', 'lifelike', 'precise'],
        popularMotifs: ['portraits', 'animals', 'nature', 'objects'],
        colorPalette: ['black-and-grey', 'full-color', 'skin-tones'],
        difficulty: 'advanced',
        timeOrigin: '1970s',
        aliases: ['photo-realism', 'hyperrealism']
      },
      geometric: {
        characteristics: ['precise-lines', 'mathematical', 'symmetrical', 'modern'],
        popularMotifs: ['mandalas', 'sacred-geometry', 'patterns', 'shapes'],
        colorPalette: ['black', 'minimal-color', 'monochrome'],
        difficulty: 'intermediate',
        timeOrigin: '2000s',
        aliases: ['sacred-geometry', 'mathematical']
      },
      watercolour: {
        characteristics: ['flowing-colors', 'soft-edges', 'painterly', 'artistic'],
        popularMotifs: ['flowers', 'butterflies', 'abstract-shapes', 'landscapes'],
        colorPalette: ['pastels', 'bright-colors', 'flowing-gradients'],
        difficulty: 'advanced',
        timeOrigin: '2000s',
        aliases: ['watercolor', 'paint-style']
      },
      blackwork: {
        characteristics: ['solid-black', 'bold-contrast', 'graphic', 'striking'],
        popularMotifs: ['tribal-patterns', 'geometric-shapes', 'silhouettes', 'text'],
        colorPalette: ['black', 'minimal-white'],
        difficulty: 'intermediate',
        timeOrigin: 'ancient',
        aliases: ['solid-black', 'tribal']
      }
    };
    
    return styleMetadata[styleName] || {
      characteristics: ['custom-style'],
      popularMotifs: ['various'],
      colorPalette: ['black'],
      difficulty: 'intermediate',
      timeOrigin: 'modern',
      aliases: [styleName]
    };
  }
  
  /**
   * Generate specialties based on styles
   */
  generateSpecialties(styles) {
    const specialtyMap = {
      traditional: ['Custom designs', 'Cover-ups', 'Bold lines', 'Classic imagery'],
      realism: ['Portraits', 'Black and grey', 'Photo realism', 'Wildlife'],
      geometric: ['Sacred geometry', 'Mandala', 'Precision work', 'Mathematical patterns'],
      watercolour: ['Color work', 'Artistic designs', 'Painterly style', 'Abstract'],
      blackwork: ['Solid black', 'Tribal', 'Bold designs', 'Minimalist'],
      fineline: ['Delicate work', 'Botanical', 'Single needle', 'Fine details'],
      dotwork: ['Stippling', 'Texture work', 'Mandala', 'Meditative designs']
    };
    
    const specialties = [];
    styles.forEach(style => {
      const styleSpecialties = specialtyMap[style] || ['Custom designs'];
      specialties.push(...this.selectRandomChoices(styleSpecialties, 1, 2));
    });
    
    // Add common specialties
    const commonSpecialties = ['Walk-ins welcome', 'Consultations', 'Large pieces'];
    specialties.push(...this.selectRandomChoices(commonSpecialties, 0, 2));
    
    return [...new Set(specialties)]; // Remove duplicates
  }
  
  /**
   * Generate UK phone number
   */
  generatePhoneNumber() {
    const areaCodes = ['020', '0161', '0121', '0113', '0141', '0151', '0117', '0131'];
    const areaCode = this.selectRandomChoice(areaCodes);
    const number = Math.floor(Math.random() * 9000000) + 1000000;
    return `+44 ${areaCode.substring(1)} ${number.toString().substring(0, 4)} ${number.toString().substring(4)}`;
  }
  
  /**
   * Generate postcode for city
   */
  generatePostcode(city) {
    const postcodeMap = {
      'London': ['E1 6AN', 'SW1A 1AA', 'W1A 0AX', 'EC1A 1BB'],
      'Manchester': ['M1 1AA', 'M2 3BB', 'M3 4CC'],
      'Birmingham': ['B1 1AA', 'B2 4QA', 'B3 1JJ'],
      'Leeds': ['LS1 1AA', 'LS2 7UE', 'LS6 2AS'],
      'Glasgow': ['G1 1AA', 'G2 3BZ', 'G12 8QQ'],
      'Liverpool': ['L1 1AA', 'L2 2DX', 'L8 7NJ'],
      'Bristol': ['BS1 1AA', 'BS2 0SP', 'BS8 1TH'],
      'Edinburgh': ['EH1 1AA', 'EH2 2AD', 'EH8 9YL']
    };
    
    const postcodes = postcodeMap[city] || postcodeMap['London'];
    return this.selectRandomChoice(postcodes);
  }
  
  /**
   * Generate geohash for coordinates
   */
  generateGeohash(lat, lng) {
    // Simple geohash generation (basic implementation)
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let hash = '';
    let precision = 6;
    
    // This is a simplified geohash - in production, use a proper library
    for (let i = 0; i < precision; i++) {
      hash += base32[Math.floor(Math.random() * base32.length)];
    }
    
    return hash;
  }
  
  /**
   * Generate random ID
   */
  generateRandomId() {
    return Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Enhanced location selection with scenario support
   */
  selectRandomLocation(scenarioConfig = {}) {
    if (scenarioConfig.locations && scenarioConfig.locations.length > 0) {
      const cityName = this.selectRandomChoice(scenarioConfig.locations);
      const location = MOCK_LOCATIONS.find(loc => loc.city === cityName);
      return location || this.selectRandomChoice(MOCK_LOCATIONS);
    }
    
    return this.selectRandomChoice(MOCK_LOCATIONS);
  }
  
  /**
   * Enhanced style selection with scenario support
   */
  selectRandomStyles(scenarioConfig = {}) {
    const allStyles = [
      'traditional', 'realism', 'geometric', 'watercolour', 'blackwork',
      'neo_traditional', 'fineline', 'dotwork', 'floral', 'minimalism',
      'old_school', 'new_school', 'tribal', 'lettering', 'japanese', 'biomechanical'
    ];
    
    // Scenario-specific style selection
    if (scenarioConfig.styles && scenarioConfig.styles.length > 0) {
      const styleCount = Math.min(3, scenarioConfig.styles.length);
      return this.selectRandomChoices(scenarioConfig.styles, 1, styleCount);
    }
    
    // Random selection
    const styleCount = Math.floor(Math.random() * 3) + 1; // 1-3 styles
    return this.selectRandomChoices(allStyles, styleCount, styleCount);
  }
  
  // Enhanced utility methods
  selectRandomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  selectRandomChoices(array, min, max) {
    const count = this.randomInt(min, max);
    const shuffled = this.shuffleArray([...array]);
    return shuffled.slice(0, count);
  }
  
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
  
  /**
   * Utility: Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Save mock data to file (for testing purposes)
   */
  async saveMockDataToFile(mockData, filename = null) {
    try {
      const outputPath = filename || this.frontendMockPath;
      
      // Generate JavaScript module content
      const content = this.generateJavaScriptModule(mockData);
      
      // Ensure directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(outputPath, content, 'utf8');
      
      console.log(`💾 Saved mock data to: ${outputPath}`);
      
      return {
        success: true,
        path: outputPath,
        artistCount: mockData.length
      };
      
    } catch (error) {
      console.error('❌ Failed to save mock data to file:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export the class
module.exports = {
  FrontendSyncProcessor
};

// Enhanced CLI interface when run directly
if (require.main === module) {
  const processor = new FrontendSyncProcessor();
  
  // Parse command line arguments with enhanced options
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Parse options
  const options = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key] = isNaN(value) ? value : parseInt(value);
        i++; // Skip next argument as it's the value
      } else {
        options[key] = true;
      }
    }
  }
  
  async function main() {
    try {
      // Handle global options first
      if (options.help || command === 'help' || command === '--help') {
        console.log('🎨 Enhanced Frontend Sync Processor Usage:');
        console.log('\nBasic Commands:');
        console.log('  generate [count]              Generate mock artists');
        console.log('  sync                          Sync with backend data');
        console.log('  validate                      Validate existing mock data');
        console.log('  scenario <name>               Generate specific scenario');
        console.log('  studios                       Generate and display studio data');
        console.log('  error <type>                  Generate error response');
        console.log('  performance                   Generate performance test data');
        console.log('\nData Management:');
        console.log('  export <scenario>             Export data to file with validation');
        console.log('  import <filepath>             Import and reuse exported data');
        console.log('  list-exports                  List available exported data files');
        console.log('  validate-consistency          Check data consistency and relationships');
        console.log('  analyze                       Analyze data size and composition');
        console.log('  stats                         Show processing statistics');
        console.log('\nOptions:');
        console.log('  --count <n>                   Number of artists to generate');
        console.log('  --scenario <name>             Use specific scenario');
        console.log('  --business-data               Include business data (default: true)');
        console.log('  --export                      Export to file');
        console.log('  --validate                    Validate generated data');
        console.log('  --dry-run                     Show what would be done without executing');
        console.log('  --help                        Show this help message');
        console.log('  --instance <path>             API instance path for errors');
        console.log('\nScenarios:');
        Object.keys(TESTING_SCENARIOS).forEach(name => {
          console.log(`  ${name.padEnd(20)} ${TESTING_SCENARIOS[name].description}`);
        });
        console.log('\nError Types:');
        Object.keys(ERROR_TEMPLATES).forEach(type => {
          console.log(`  ${type.padEnd(20)} ${ERROR_TEMPLATES[type].title}`);
        });
        console.log('\nExamples:');
        console.log('  node frontend-sync-processor.js generate --count 10 --scenario normal');
        console.log('  node frontend-sync-processor.js scenario empty --export');
        console.log('  node frontend-sync-processor.js error validation --instance /v1/search');
        console.log('  node frontend-sync-processor.js performance --count 50');
        console.log('  node frontend-sync-processor.js --help');
        process.exit(0);
      }

      // Handle dry-run mode
      if (options['dry-run']) {
        console.log('🔍 DRY RUN MODE - Showing what would be executed:');
        console.log(`Command: ${command || 'default'}`);
        console.log(`Options: ${JSON.stringify(options, null, 2)}`);
        console.log('✅ Dry run completed - no actual operations performed');
        process.exit(0);
      }

      switch (command) {
        case 'generate':
          const artistCount = options.count || parseInt(args[1]) || 8;
          const scenario = options.scenario || null;
          const includeBusinessData = options['business-data'] !== false;
          const exportToFile = options.export || false;
          
          const result = await processor.processFrontendOnly({ 
            artistCount, 
            scenario,
            includeBusinessData,
            exportToFile
          });
          console.log(`🎉 Generated ${result.artistCount} mock artists`);
          if (scenario) console.log(`📋 Scenario: ${scenario}`);
          break;
          
        case 'sync':
          const syncResult = await processor.syncWithBackend(options);
          console.log(`🔄 Synchronized ${syncResult.artistCount} artists`);
          break;
          
        case 'scenario':
          const scenarioName = args[1];
          if (!scenarioName) {
            console.log('📋 Available scenarios:');
            Object.keys(TESTING_SCENARIOS).forEach(name => {
              const scenario = TESTING_SCENARIOS[name];
              console.log(`  ${name}: ${scenario.description} (${scenario.artistCount} artists)`);
            });
            break;
          }
          
          const scenarioResult = await processor.generateMockData({
            scenario: scenarioName,
            includeBusinessData: true,
            exportToFile: options.export || false,
            validateData: options.validate || false
          });
          
          if (scenarioResult.success) {
            await processor.updateFrontendMockData(scenarioResult.mockData);
            console.log(`🎯 Generated scenario '${scenarioName}': ${scenarioResult.mockData.length} artists`);
            
            if (options.validate) {
              console.log('✅ Data validation completed during scenario generation');
              if (scenarioResult.stats.errors.length > 0) {
                console.log('⚠️  Validation warnings:');
                scenarioResult.stats.errors.forEach(error => {
                  console.log(`  - ${error.type}: ${error.message}`);
                });
              }
            }
          }
          break;
          
        case 'error':
          const errorType = args[1] || 'validation';
          const errorResponse = processor.generateErrorResponse(errorType, options);
          console.log(JSON.stringify(errorResponse, null, 2));
          break;
          
        case 'performance':
          const perfCount = options.count || 100;
          const perfResult = await processor.generateMockData({
            artistCount: perfCount,
            includePerformanceData: true,
            scenario: 'large'
          });
          
          if (perfResult.success) {
            console.log(`⚡ Generated performance dataset: ${perfResult.mockData.length} artists`);
            console.log(`📊 Generation time: ${perfResult.stats.performance.duration}ms`);
            console.log(`💾 Memory usage: ${Math.round(perfResult.stats.performance.memoryUsage / 1024 / 1024)}MB`);
          }
          break;
          
        case 'validate':
          console.log('🔍 Validating mock data...');
          
          // Check if existing mock data file exists
          if (fs.existsSync(processor.frontendMockPath)) {
            const content = fs.readFileSync(processor.frontendMockPath, 'utf8');
            const match = content.match(/export const mockArtistData = (\[[\s\S]*\]);/);
            if (match) {
              const mockData = JSON.parse(match[1]);
              const errors = processor.validateMockData(mockData);
              if (errors.length === 0) {
                console.log(`✅ Existing mock data is valid (${mockData.length} artists)`);
              } else {
                console.log(`❌ Validation errors in existing data: ${errors.join(', ')}`);
              }
            }
          } else {
            console.log('ℹ️  No existing mock data file found, generating test data for validation...');
          }
          
          // Generate fresh test data for validation
          const testResult = await processor.generateMockData({
            artistCount: 3,
            scenario: options.scenario || 'single',
            validateData: true,
            includeBusinessData: true
          });
          
          if (testResult.success) {
            console.log(`✅ Fresh data validation completed successfully`);
            console.log(`📊 Generated ${testResult.mockData.length} test artists for validation`);
            console.log(`⏱️  Processing time: ${testResult.stats.performance.duration}ms`);
            
            if (testResult.stats.errors.length > 0) {
              console.log('⚠️  Validation warnings:');
              testResult.stats.errors.forEach(error => {
                console.log(`  - ${error.type}: ${error.message}`);
              });
            }
          } else {
            console.log(`❌ Fresh data validation failed: ${testResult.error}`);
            process.exit(1);
          }
          break;
          
        case 'export':
          const exportScenario = args[1] || 'default';
          const exportResult = await processor.generateMockData({
            artistCount: options.count || 20,
            scenario: exportScenario,
            exportToFile: true,
            validateData: true
          });
          
          if (exportResult.success) {
            console.log(`💾 Exported ${exportResult.mockData.length} artists to file`);
          }
          break;
          
        case 'import':
          const importFile = args[1];
          if (!importFile) {
            console.log('❌ Please specify a file to import');
            console.log('Usage: node frontend-sync-processor.js import <filepath>');
            break;
          }
          
          const importResult = await processor.importDataFromFile(importFile);
          if (importResult.success) {
            // Update frontend mock data with imported data
            await processor.updateFrontendMockData(importResult.artists);
            console.log(`✅ Imported and updated frontend with ${importResult.artists.length} artists`);
          }
          break;
          
        case 'list-exports':
          const exportedFiles = await processor.listExportedDataFiles();
          if (exportedFiles.length === 0) {
            console.log('📁 No exported data files found');
          } else {
            console.log('📁 Available exported data files:');
            exportedFiles.forEach(file => {
              console.log(`   ${file.filename}`);
              console.log(`     Scenario: ${file.scenario}`);
              console.log(`     Size: ${file.size}KB`);
              console.log(`     Created: ${file.created.toLocaleString()}`);
              console.log('');
            });
          }
          break;
          
        case 'validate-consistency':
          const consistencyResult = await processor.generateMockData({
            artistCount: options.count || 8,
            scenario: options.scenario || 'normal',
            validateData: true
          });
          
          if (consistencyResult.success) {
            const consistencyIssues = processor.validateDataConsistency(
              consistencyResult.mockData, 
              processor.generatedStudios || []
            );
            
            if (consistencyIssues.length === 0) {
              console.log('✅ Data consistency validation passed');
            } else {
              console.log('❌ Data consistency issues found:');
              consistencyIssues.forEach(issue => console.log(`   ${issue}`));
            }
          }
          break;
          
        case 'analyze':
          const analyzeResult = await processor.generateMockData({
            artistCount: options.count || 20,
            scenario: options.scenario || 'normal'
          });
          
          if (analyzeResult.success) {
            const sizeAnalysis = processor.estimateDataSize(analyzeResult.mockData);
            console.log('📊 Data Analysis:');
            console.log(`   Total Size: ${sizeAnalysis.totalSize.kb}KB (${sizeAnalysis.totalSize.mb}MB)`);
            console.log(`   Artists: ${sizeAnalysis.artistCount}`);
            console.log(`   Studios: ${sizeAnalysis.studioCount}`);
            console.log(`   Average Artist Size: ${Math.round(sizeAnalysis.averageArtistSize / 1024 * 100) / 100}KB`);
            console.log(`   Portfolio Images: ${sizeAnalysis.portfolioImageCount}`);
            console.log(`   Estimated Load Time: ${sizeAnalysis.estimatedLoadTime}s`);
          }
          break;
          
        case 'studios':
          const studioResult = await processor.generateMockData({
            artistCount: options.count || 8,
            scenario: options.scenario || 'normal',
            includeBusinessData: true
          });
          
          if (studioResult.success && processor.generatedStudios) {
            console.log('🏢 Generated Studio Data:');
            processor.generatedStudios.forEach(studio => {
              console.log(`\n📍 ${studio.studioName} (${studio.studioId})`);
              console.log(`   Location: ${studio.locationDisplay}`);
              console.log(`   Artists: ${studio.artists.length} (${studio.artists.join(', ')})`);
              console.log(`   Specialties: ${studio.specialties.join(', ')}`);
              console.log(`   Rating: ${studio.rating} (${studio.reviewCount} reviews)`);
              console.log(`   Contact: ${studio.contactInfo.phone} | ${studio.contactInfo.website}`);
              console.log(`   Hours: Mon-Fri ${studio.openingHours.monday || 'Closed'}`);
            });
          }
          break;
          
        case 'stats':
          const stats = processor.getStats();
          console.log('📊 Processing Statistics:');
          console.log(`  Generated: ${stats.generated}`);
          console.log(`  Updated: ${stats.updated}`);
          console.log(`  Failed: ${stats.failed}`);
          console.log(`  Errors: ${stats.errors.length}`);
          if (stats.performance.duration > 0) {
            console.log(`  Last Duration: ${stats.performance.duration}ms`);
          }
          if (processor.generatedStudios) {
            console.log(`  Studios Generated: ${processor.generatedStudios.length}`);
          }
          break;
          
        default:
          console.log('🎨 Enhanced Frontend Sync Processor Usage:');
          console.log('\nBasic Commands:');
          console.log('  generate [count]              Generate mock artists');
          console.log('  sync                          Sync with backend data');
          console.log('  validate                      Validate existing mock data');
          console.log('  scenario <name>               Generate specific scenario');
          console.log('  studios                       Generate and display studio data');
          console.log('  error <type>                  Generate error response');
          console.log('  performance                   Generate performance test data');
          console.log('\nData Management:');
          console.log('  export <scenario>             Export data to file with validation');
          console.log('  import <filepath>             Import and reuse exported data');
          console.log('  list-exports                  List available exported data files');
          console.log('  validate-consistency          Check data consistency and relationships');
          console.log('  analyze                       Analyze data size and composition');
          console.log('  stats                         Show processing statistics');
          console.log('\nOptions:');
          console.log('  --count <n>                   Number of artists to generate');
          console.log('  --scenario <name>             Use specific scenario');
          console.log('  --business-data               Include business data (default: true)');
          console.log('  --export                      Export to file');
          console.log('  --instance <path>             API instance path for errors');
          console.log('\nScenarios:');
          Object.keys(TESTING_SCENARIOS).forEach(name => {
            console.log(`  ${name.padEnd(20)} ${TESTING_SCENARIOS[name].description}`);
          });
          console.log('\nError Types:');
          Object.keys(ERROR_TEMPLATES).forEach(type => {
            console.log(`  ${type.padEnd(20)} ${ERROR_TEMPLATES[type].title}`);
          });
          console.log('\nExamples:');
          console.log('  node frontend-sync-processor.js generate --count 10 --scenario normal');
          console.log('  node frontend-sync-processor.js scenario empty --export');
          console.log('  node frontend-sync-processor.js error validation --instance /v1/search');
          console.log('  node frontend-sync-processor.js performance --count 50');
          process.exit(1);
      }
      
      console.log('✅ Operation completed successfully');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Operation failed:', error.message);
      if (options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
  
  main();
}