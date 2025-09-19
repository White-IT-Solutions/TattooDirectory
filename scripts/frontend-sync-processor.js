#!/usr/bin/env node

/**
 * Frontend Sync Processor Class
 * 
 * Handles frontend mock data generation and synchronization with support for
 * frontend-only mode without backend services. Creates realistic mock data
 * with proper formatting for the Next.js frontend application.
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
 * Mock bio templates for different styles
 */
const BIO_TEMPLATES = {
  traditional: [
    'Traditional and neo-traditional tattoo artist specializing in roses, eagles, and nautical themes',
    'Classic American traditional style with bold lines and vibrant colors',
    'Old school tattoo specialist with expertise in sailor jerry designs'
  ],
  realism: [
    'Photorealistic tattoo artist creating lifelike portraits and nature scenes',
    'Realism specialist focusing on detailed black and grey work',
    'Portrait and wildlife realism expert with 10+ years experience'
  ],
  geometric: [
    'Geometric and blackwork specialist with modern aesthetic',
    'Sacred geometry and mandala expert creating precise patterns',
    'Contemporary geometric designs with mathematical precision'
  ],
  watercolour: [
    'Watercolor and realism specialist creating vibrant, lifelike tattoos',
    'Abstract watercolor artist bringing paintings to skin',
    'Colorful watercolor specialist with fine art background'
  ],
  blackwork: [
    'Bold blackwork and tribal specialist with striking designs',
    'Solid black tattoo expert creating powerful visual statements',
    'Blackwork and dotwork artist with minimalist approach'
  ],
  fineline: [
    'Fine line and minimalist tattoo artist with delicate touch',
    'Intricate fine line work specialist in botanical designs',
    'Delicate line work expert creating subtle, elegant tattoos'
  ],
  dotwork: [
    'Dotwork and floral specialist with intricate detail work',
    'Stippling and dotwork expert creating textured masterpieces',
    'Mandala and dotwork specialist with meditative approach'
  ]
};

/**
 * FrontendSyncProcessor class for mock data generation and synchronization
 */
class FrontendSyncProcessor {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.stateManager = STATE_MANAGER;
    this.frontendMockPath = config.paths.frontendMockData;
    
    // Processing statistics
    this.stats = {
      generated: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Generate mock data for frontend-only mode
   */
  async generateMockData(options = {}) {
    const { 
      artistCount = 8, 
      useRealData = false, 
      imageUrls = null,
      scenario = null 
    } = options;
    
    console.log(`🎨 Generating mock data for ${artistCount} artists...`);
    
    try {
      let mockArtists;
      
      if (useRealData && this.hasRealData()) {
        // Use real seeded data if available
        mockArtists = await this.generateFromRealData(artistCount, imageUrls);
      } else {
        // Generate pure mock data
        mockArtists = this.generatePureMockData(artistCount, imageUrls, scenario);
      }
      
      console.log(`✅ Generated ${mockArtists.length} mock artists`);
      this.stats.generated = mockArtists.length;
      
      return {
        success: true,
        mockData: mockArtists,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Mock data generation failed:', error.message);
      this.stats.errors.push({
        type: 'generation_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
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
   * Create a single mock artist
   */
  createMockArtist(index, imageUrls = null, scenario = null) {
    const artistId = `artist-${String(index).padStart(3, '0')}`;
    const styles = this.selectRandomStyles(scenario);
    const primaryStyle = styles[0];
    const location = this.selectRandomLocation();
    const studio = this.selectRandomStudio();
    
    const artist = {
      pk: `ARTIST#${index}`,
      sk: 'PROFILE',
      artistId: artistId,
      artistsName: this.generateArtistName(),
      instagramHandle: this.generateInstagramHandle(),
      bio: this.generateBio(primaryStyle),
      avatar: this.selectRandomAvatar(),
      profileLink: `https://instagram.com/${this.generateInstagramHandle()}`,
      tattooStudio: {
        studioName: studio,
        streetAddress: this.selectRandomAddress(location),
        address: {
          city: location.city,
          latitude: location.latitude + (Math.random() - 0.5) * 0.01, // Small variation
          longitude: location.longitude + (Math.random() - 0.5) * 0.01
        }
      },
      styles: styles,
      portfolioImages: this.generatePortfolioImages(styles, imageUrls),
      opted_out: false
    };
    
    return artist;
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
      artistsName: realArtist.artistName,
      instagramHandle: realArtist.instagramHandle,
      bio: realArtist.bio || this.generateBio(realArtist.styles[0]),
      avatar: this.selectRandomAvatar(),
      profileLink: `https://instagram.com/${realArtist.instagramHandle}`,
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
   * Generate artist name
   */
  generateArtistName() {
    const firstNames = [
      'Sarah', 'Marcus', 'Luna', 'Isabella', 'Jake', 'Emma', 'Oliver', 'Sophia',
      'James', 'Ava', 'William', 'Mia', 'Benjamin', 'Charlotte', 'Lucas', 'Amelia'
    ];
    
    const lastNames = [
      'Mitchell', 'Chen', 'Rodriguez', 'Foster', 'Thompson', 'Johnson', 'Williams',
      'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate Instagram handle
   */
  generateInstagramHandle() {
    const prefixes = ['', 'ink', 'tattoo', 'art', 'needle', 'skin'];
    const suffixes = ['tattoos', 'ink', 'art', 'tattoo', 'studio', 'artist'];
    
    const name = this.generateArtistName().toLowerCase().replace(' ', '');
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${name}_${suffix}`.replace(/_{2,}/g, '_').replace(/^_|_$/g, '');
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
      const mockResult = await this.generateMockData({
        useRealData: true,
        imageUrls,
        scenario,
        artistCount: 8
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
        scenario
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
   * Validate mock data structure
   */
  validateMockData(mockData) {
    const errors = [];
    
    if (!Array.isArray(mockData)) {
      errors.push('Mock data must be an array');
      return errors;
    }
    
    mockData.forEach((artist, index) => {
      if (!artist.artistId) {
        errors.push(`Artist ${index}: missing artistId`);
      }
      if (!artist.artistsName) {
        errors.push(`Artist ${index}: missing artistsName`);
      }
      if (!artist.styles || !Array.isArray(artist.styles)) {
        errors.push(`Artist ${index}: styles must be an array`);
      }
      if (!artist.portfolioImages || !Array.isArray(artist.portfolioImages)) {
        errors.push(`Artist ${index}: portfolioImages must be an array`);
      }
    });
    
    return errors;
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
}

// Export the class
module.exports = {
  FrontendSyncProcessor
};

// CLI usage when run directly
if (require.main === module) {
  const processor = new FrontendSyncProcessor();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  async function main() {
    try {
      switch (command) {
        case 'generate':
          const artistCount = parseInt(args[1]) || 8;
          const result = await processor.processFrontendOnly({ artistCount });
          console.log(`🎉 Generated ${result.artistCount} mock artists`);
          break;
          
        case 'sync':
          const syncResult = await processor.syncWithBackend();
          console.log(`🔄 Synchronized ${syncResult.artistCount} artists`);
          break;
          
        case 'validate':
          if (fs.existsSync(processor.frontendMockPath)) {
            const content = fs.readFileSync(processor.frontendMockPath, 'utf8');
            const match = content.match(/export const mockArtistData = (\[[\s\S]*\]);/);
            if (match) {
              const mockData = JSON.parse(match[1]);
              const errors = processor.validateMockData(mockData);
              if (errors.length === 0) {
                console.log(`✅ Mock data is valid (${mockData.length} artists)`);
              } else {
                console.log(`❌ Validation errors: ${errors.join(', ')}`);
              }
            }
          } else {
            console.log('❌ Mock data file not found');
          }
          break;
          
        default:
          console.log('🎨 Frontend Sync Processor Usage:');
          console.log('  node frontend-sync-processor.js generate [count]');
          console.log('  node frontend-sync-processor.js sync');
          console.log('  node frontend-sync-processor.js validate');
          console.log('\nExample:');
          console.log('  node frontend-sync-processor.js generate 10');
          process.exit(1);
      }
      
      console.log('✅ Operation completed successfully');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Operation failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}