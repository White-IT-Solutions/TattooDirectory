#!/usr/bin/env node

/**
 * LEGACY SCRIPT - DEPRECATED
 * 
 * This script has been replaced by the unified data management system.
 * Please use: npm run seed --workspace=scripts --workspace=scripts-scenario <scenario-name>
 * 
 * This wrapper maintains backward compatibility for existing Docker integration.
 */

// Redirect to new wrapper for backward compatibility
const { main } = require('./selective-seeder-wrapper');

// If this script is called directly, use the wrapper
if (require.main === module) {
  console.log('\n⚠️  DEPRECATION NOTICE: This script is deprecated');
  console.log('Please use: npm run seed --workspace=scripts --workspace=scripts-scenario <scenario-name>');
  console.log('Running via compatibility layer...\n');
  
  main().catch(error => {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  });
}

// Legacy exports for any code that imports this module
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { validateArtistData, validateStudioData, validateStyleData } = require('./simple-validator');

// Configure AWS SDK for LocalStack
const isRunningInContainer = process.env.DOCKER_CONTAINER === 'true' || fs.existsSync('/.dockerenv');
const defaultEndpoint = isRunningInContainer ? 'http://localstack:4566' : 'http://localhost:4566';

AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
  endpoint: process.env.AWS_ENDPOINT_URL || defaultEndpoint,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  s3ForcePathStyle: true
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || defaultEndpoint;
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'artists-local';

// Test scenarios configuration
const TEST_SCENARIOS = {
  'search-basic': {
    description: 'Basic search functionality testing',
    artists: ['artist-001', 'artist-002', 'artist-003'],
    studios: ['studio-001', 'studio-002'],
    styles: ['traditional', 'realism', 'blackwork']
  },
  'location-london': {
    description: 'London-based artists for location testing',
    filter: (item) => item.locationDisplay && item.locationDisplay.includes('London'),
    minItems: 5
  },
  'style-traditional': {
    description: 'Traditional style artists for style filtering',
    filter: (item) => item.styles && item.styles.includes('traditional'),
    minItems: 3
  },
  'high-rating': {
    description: 'High-rated artists for rating tests',
    filter: (item) => item.rating && item.rating >= 4.5,
    minItems: 3
  },
  'new-artists': {
    description: 'Recently joined artists for timeline tests',
    filter: (item) => {
      if (!item.experience || !item.experience.yearsActive) return false;
      return item.experience.yearsActive <= 2;
    },
    minItems: 2
  },
  'booking-available': {
    description: 'Artists with open booking for availability tests',
    filter: (item) => item.availability && item.availability.bookingOpen === true,
    minItems: 4
  },
  'portfolio-rich': {
    description: 'Artists with extensive portfolios for image testing',
    filter: (item) => item.portfolioImages && item.portfolioImages.length >= 8,
    minItems: 2
  },
  'multi-style': {
    description: 'Artists with multiple styles for complex filtering',
    filter: (item) => item.styles && item.styles.length >= 3,
    minItems: 3
  },
  'pricing-range': {
    description: 'Artists with various pricing for price filtering',
    artists: ['artist-001', 'artist-005', 'artist-010', 'artist-015', 'artist-020'],
    ensurePricingVariety: true
  },
  'minimal': {
    description: 'Minimal dataset for quick testing',
    artists: ['artist-001', 'artist-002'],
    studios: ['studio-001'],
    styles: ['traditional', 'realism']
  }
};

class SelectiveSeeder {
  constructor() {
    this.stats = {
      artists: { loaded: 0, failed: 0 },
      studios: { loaded: 0, failed: 0 },
      styles: { loaded: 0, failed: 0 },
      opensearch: { indexed: 0, failed: 0 }
    };
    this.allData = {
      artists: [],
      studios: [],
      styles: []
    };
  }

  makeOpenSearchRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const hostname = isRunningInContainer ? 'localstack' : 'localhost';
      const options = {
        hostname: hostname,
        port: 4566,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async loadAllTestData() {
    console.log('📊 Loading all test data...');
    
    const dataTypes = ['artists', 'studios', 'styles'];
    
    for (const type of dataTypes) {
      const testDataPath = path.join(__dirname, '..', 'test-data', `${type}.json`);
      
      if (!fs.existsSync(testDataPath)) {
        console.warn(`⚠️  Test data file not found: ${type}.json`);
        continue;
      }
      
      try {
        const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
        this.allData[type] = data;
        console.log(`✅ Loaded ${data.length} ${type} records`);
      } catch (error) {
        console.error(`❌ Failed to load ${type} data:`, error.message);
      }
    }
  }

  filterDataForScenario(scenario) {
    console.log(`🎯 Filtering data for scenario: ${scenario.description}`);
    
    const filtered = {
      artists: [],
      studios: [],
      styles: []
    };

    // Handle specific ID-based selection
    if (scenario.artists) {
      filtered.artists = this.allData.artists.filter(artist => 
        scenario.artists.includes(artist.artistId)
      );
    }
    
    if (scenario.studios) {
      filtered.studios = this.allData.studios.filter(studio => 
        scenario.studios.includes(studio.studioId)
      );
    }
    
    if (scenario.styles) {
      filtered.styles = this.allData.styles.filter(style => 
        scenario.styles.includes(style.styleId)
      );
    }

    // Handle filter-based selection
    if (scenario.filter) {
      const filteredArtists = this.allData.artists.filter(scenario.filter);
      
      // Ensure minimum items if specified
      if (scenario.minItems && filteredArtists.length < scenario.minItems) {
        console.warn(`⚠️  Only found ${filteredArtists.length} items, need ${scenario.minItems}`);
        // Add random items to meet minimum
        const remaining = this.allData.artists.filter(artist => !filteredArtists.includes(artist));
        const additional = remaining.slice(0, scenario.minItems - filteredArtists.length);
        filtered.artists = [...filteredArtists, ...additional];
      } else {
        filtered.artists = filteredArtists;
      }
      
      // Include related studios and styles
      const artistStyles = new Set();
      const studioIds = new Set();
      
      filtered.artists.forEach(artist => {
        if (artist.styles) {
          artist.styles.forEach(style => artistStyles.add(style));
        }
        if (artist.studioId) {
          studioIds.add(artist.studioId);
        }
      });
      
      filtered.styles = this.allData.styles.filter(style => 
        artistStyles.has(style.styleId)
      );
      
      filtered.studios = this.allData.studios.filter(studio => 
        studioIds.has(studio.studioId)
      );
    }

    // Handle special requirements
    if (scenario.ensurePricingVariety) {
      this.ensurePricingVariety(filtered.artists);
    }

    console.log(`📊 Filtered data: ${filtered.artists.length} artists, ${filtered.studios.length} studios, ${filtered.styles.length} styles`);
    return filtered;
  }

  ensurePricingVariety(artists) {
    // Ensure artists have varied pricing for testing
    const pricingRanges = [
      { hourlyRate: 80, minimumCharge: 100 },
      { hourlyRate: 120, minimumCharge: 150 },
      { hourlyRate: 150, minimumCharge: 200 },
      { hourlyRate: 200, minimumCharge: 300 },
      { hourlyRate: 250, minimumCharge: 400 }
    ];

    artists.forEach((artist, index) => {
      if (!artist.pricing) {
        artist.pricing = {
          currency: 'GBP',
          ...pricingRanges[index % pricingRanges.length]
        };
      }
    });
  }

  async seedFilteredData(filteredData) {
    console.log('🌱 Seeding filtered data...');
    
    // Seed styles first (dependencies)
    for (const style of filteredData.styles) {
      await this.seedStyle(style);
    }
    
    // Seed studios
    for (const studio of filteredData.studios) {
      await this.seedStudio(studio);
    }
    
    // Seed artists
    for (const artist of filteredData.artists) {
      await this.seedArtist(artist);
    }
    
    // Index in OpenSearch
    await this.indexArtistsInOpenSearch(filteredData.artists);
  }

  async seedArtist(artist) {
    try {
      const validationErrors = validateArtistData(artist);
      if (validationErrors.length > 0) {
        console.error(`❌ Invalid artist data for ${artist.artistName}: ${validationErrors.join(', ')}`);
        this.stats.artists.failed++;
        return;
      }

      const item = {
        PK: `ARTIST#${artist.artistId}`,
        SK: `PROFILE`,
        gsi1pk: `STYLE#${artist.styles[0]}`,
        gsi1sk: `${artist.geohash}#${artist.artistId}`,
        gsi2pk: `LOCATION#${artist.geohash}`,
        gsi2sk: `${artist.artistName}`,
        gsi3pk: `INSTAGRAM#${artist.instagramHandle}`,
        ...artist,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();
      
      console.log(`✅ Seeded artist: ${artist.artistName}`);
      this.stats.artists.loaded++;
      
    } catch (error) {
      console.error(`❌ Failed to seed artist ${artist.artistName}:`, error.message);
      this.stats.artists.failed++;
    }
  }

  async seedStudio(studio) {
    try {
      const validationErrors = validateStudioData(studio);
      if (validationErrors.length > 0) {
        console.error(`❌ Invalid studio data for ${studio.studioName}: ${validationErrors.join(', ')}`);
        this.stats.studios.failed++;
        return;
      }

      const item = {
        PK: `STUDIO#${studio.studioId}`,
        SK: `PROFILE`,
        gsi1pk: `LOCATION#${studio.geohash}`,
        gsi1sk: `${studio.studioName}`,
        gsi2pk: `POSTCODE#${studio.postcode}`,
        gsi2sk: `${studio.studioName}`,
        ...studio,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();
      
      console.log(`✅ Seeded studio: ${studio.studioName}`);
      this.stats.studios.loaded++;
      
    } catch (error) {
      console.error(`❌ Failed to seed studio ${studio.studioName}:`, error.message);
      this.stats.studios.failed++;
    }
  }

  async seedStyle(style) {
    try {
      const validationErrors = validateStyleData(style);
      if (validationErrors.length > 0) {
        console.error(`❌ Invalid style data for ${style.styleName}: ${validationErrors.join(', ')}`);
        this.stats.styles.failed++;
        return;
      }

      const item = {
        PK: `STYLE#${style.styleId}`,
        SK: `METADATA`,
        gsi1pk: `STYLE_CATEGORY#${style.difficulty}`,
        gsi1sk: `${style.styleName}`,
        ...style,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();
      
      console.log(`✅ Seeded style: ${style.styleName}`);
      this.stats.styles.loaded++;
      
    } catch (error) {
      console.error(`❌ Failed to seed style ${style.styleName}:`, error.message);
      this.stats.styles.failed++;
    }
  }

  async setupOpenSearchIndex() {
    console.log('🔍 Setting up OpenSearch index...');
    
    try {
      // Delete existing index if it exists
      try {
        await this.makeOpenSearchRequest('DELETE', `/${OPENSEARCH_INDEX}`);
      } catch (error) {
        // Index doesn't exist, which is fine
      }

      // Create index with mapping
      const indexMapping = {
        mappings: {
          properties: {
            artistId: { type: 'keyword' },
            artistName: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            instagramHandle: { type: 'keyword' },
            styles: { type: 'keyword' },
            specialties: { type: 'keyword' },
            locationDisplay: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            geohash: { type: 'keyword' },
            location: { type: 'geo_point' },
            rating: { type: 'float' },
            reviewCount: { type: 'integer' },
            pricing: {
              properties: {
                hourlyRate: { type: 'integer' },
                minimumCharge: { type: 'integer' },
                currency: { type: 'keyword' }
              }
            },
            availability: {
              properties: {
                bookingOpen: { type: 'boolean' },
                nextAvailable: { type: 'date' },
                waitingList: { type: 'boolean' }
              }
            },
            experience: {
              properties: {
                yearsActive: { type: 'integer' },
                apprenticeshipCompleted: { type: 'boolean' }
              }
            }
          }
        }
      };

      await this.makeOpenSearchRequest('PUT', `/${OPENSEARCH_INDEX}`, indexMapping);
      console.log('✅ OpenSearch index created successfully');
      
    } catch (error) {
      console.error('❌ Failed to setup OpenSearch index:', error.message);
      throw error;
    }
  }

  async indexArtistsInOpenSearch(artists) {
    console.log('🔍 Indexing artists in OpenSearch...');
    
    for (const artist of artists) {
      try {
        const document = {
          ...artist,
          location: {
            lat: artist.latitude,
            lon: artist.longitude
          }
        };

        await this.makeOpenSearchRequest(
          'PUT', 
          `/${OPENSEARCH_INDEX}/_doc/${artist.artistId}`,
          document
        );
        
        console.log(`✅ Indexed artist: ${artist.artistName}`);
        this.stats.opensearch.indexed++;
        
      } catch (error) {
        console.error(`❌ Failed to index artist ${artist.artistName}:`, error.message);
        this.stats.opensearch.failed++;
      }
    }

    // Refresh index
    try {
      await this.makeOpenSearchRequest('POST', `/${OPENSEARCH_INDEX}/_refresh`);
      console.log('✅ OpenSearch index refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh OpenSearch index:', error.message);
    }
  }

  listScenarios() {
    console.log('\n🎯 Available Test Scenarios:');
    console.log('┌─────────────────────┬─────────────────────────────────────────────────┐');
    console.log('│ Scenario            │ Description                                     │');
    console.log('├─────────────────────┼─────────────────────────────────────────────────┤');
    
    Object.entries(TEST_SCENARIOS).forEach(([key, scenario]) => {
      const description = scenario.description.length > 47 
        ? scenario.description.substring(0, 44) + '...'
        : scenario.description;
      console.log(`│ ${key.padEnd(19)} │ ${description.padEnd(47)} │`);
    });
    
    console.log('└─────────────────────┴─────────────────────────────────────────────────┘');
  }

  printStats() {
    console.log('\n📈 Selective Seeding Statistics:');
    console.log('┌─────────────┬─────────┬────────┐');
    console.log('│ Data Type   │ Loaded  │ Failed │');
    console.log('├─────────────┼─────────┼────────┤');
    console.log(`│ Artists     │ ${this.stats.artists.loaded.toString().padStart(7)} │ ${this.stats.artists.failed.toString().padStart(6)} │`);
    console.log(`│ Studios     │ ${this.stats.studios.loaded.toString().padStart(7)} │ ${this.stats.studios.failed.toString().padStart(6)} │`);
    console.log(`│ Styles      │ ${this.stats.styles.loaded.toString().padStart(7)} │ ${this.stats.styles.failed.toString().padStart(6)} │`);
    console.log(`│ OpenSearch  │ ${this.stats.opensearch.indexed.toString().padStart(7)} │ ${this.stats.opensearch.failed.toString().padStart(6)} │`);
    console.log('└─────────────┴─────────┴────────┘');
  }

  async seedScenario(scenarioName) {
    console.log(`🎯 Seeding scenario: ${scenarioName}`);
    
    const scenario = TEST_SCENARIOS[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    console.log(`📋 ${scenario.description}`);
    
    await this.loadAllTestData();
    const filteredData = this.filterDataForScenario(scenario);
    
    await this.setupOpenSearchIndex();
    await this.seedFilteredData(filteredData);
    
    console.log(`✅ Scenario '${scenarioName}' seeded successfully`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const seeder = new SelectiveSeeder();

  try {
    switch (command) {
      case 'list':
        seeder.listScenarios();
        break;
        
      case 'seed':
        const scenarioName = args[1];
        if (!scenarioName) {
          throw new Error('Scenario name is required');
        }
        await seeder.seedScenario(scenarioName);
        seeder.printStats();
        break;
        
      default:
        console.log('🎯 Selective Seeder Usage:');
        console.log('  node selective-seeder.js list');
        console.log('  node selective-seeder.js seed <scenario-name>');
        console.log('\nExample:');
        console.log('  node selective-seeder.js seed search-basic');
        process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    seeder.printStats();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SelectiveSeeder, TEST_SCENARIOS };