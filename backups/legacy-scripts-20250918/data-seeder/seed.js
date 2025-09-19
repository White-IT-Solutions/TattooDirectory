/**
 * LEGACY SCRIPT - DEPRECATED
 * 
 * This script has been replaced by the unified data management system.
 * Please use: npm run setup-data
 * 
 * This wrapper maintains backward compatibility for existing Docker integration.
 */

// Redirect to new wrapper for backward compatibility
const { main } = require('./seed-wrapper');

// If this script is called directly, use the wrapper
if (require.main === module) {
  console.log('\n⚠️  DEPRECATION NOTICE: This script is deprecated');
  console.log('Please use: npm run setup-data');
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
// Detect if running from host or container
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
const dynamodbClient = new AWS.DynamoDB();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || defaultEndpoint;
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'artists-local';

class DataSeeder {
  constructor() {
    this.stats = {
      artists: { loaded: 0, failed: 0 },
      studios: { loaded: 0, failed: 0 },
      styles: { loaded: 0, failed: 0 },
      opensearch: { indexed: 0, failed: 0 }
    };
  }

  async waitForServices() {
    console.log('⏳ Waiting for LocalStack services to be ready...');
    
    // Wait for DynamoDB
    await this.waitForDynamoDB();
    
    // Wait for OpenSearch
    await this.waitForOpenSearch();
    
    console.log('✅ All services are ready');
  }

  async waitForDynamoDB() {
    let retries = 30;
    while (retries > 0) {
      try {
        await dynamodbClient.describeTable({ TableName: TABLE_NAME }).promise();
        console.log('✅ DynamoDB is ready');
        return;
      } catch (error) {
        console.log(`⏳ Waiting for DynamoDB... (${retries} retries left)`);
        retries--;
        await this.sleep(2000);
      }
    }
    throw new Error('❌ DynamoDB not ready after 60 seconds');
  }

  async waitForOpenSearch() {
    let retries = 30;
    while (retries > 0) {
      try {
        await this.makeOpenSearchRequest('GET', '/');
        console.log('✅ OpenSearch is ready');
        return;
      } catch (error) {
        console.log(`⏳ Waiting for OpenSearch... (${retries} retries left)`);
        retries--;
        await this.sleep(2000);
      }
    }
    throw new Error('❌ OpenSearch not ready after 60 seconds');
  }

  makeOpenSearchRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      // For LocalStack, we need to use the correct Host header for OpenSearch domain routing
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

  async loadTestData(filename) {
    // Try Docker container path first, then fallback to relative path
    const dockerPath = path.join('/app', 'test-data', filename);
    const relativePath = path.join(__dirname, '..', 'test-data', filename);
    
    const testDataPath = fs.existsSync(dockerPath) ? dockerPath : relativePath;
    
    if (!fs.existsSync(testDataPath)) {
      throw new Error(`Test data file not found: ${filename} (tried ${dockerPath} and ${relativePath})`);
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
      console.log(`📊 Loaded ${data.length} records from ${filename}`);
      return data;
    } catch (error) {
      throw new Error(`Failed to parse ${filename}: ${error.message}`);
    }
  }

  async seedArtists() {
    console.log('🎨 Seeding artist data...');
    
    const artists = await this.loadTestData('artists.json');
    
    for (const artist of artists) {
      try {
        // Validate artist data
        const validationErrors = validateArtistData(artist);
        if (validationErrors.length > 0) {
          console.error(`❌ Invalid artist data for ${artist.artistName}: ${validationErrors.join(', ')}`);
          this.stats.artists.failed++;
          continue;
        }

        // Create DynamoDB item
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
        
        console.log(`✅ Loaded artist: ${artist.artistName}`);
        this.stats.artists.loaded++;
        
      } catch (error) {
        console.error(`❌ Failed to load artist ${artist.artistName}:`, error.message);
        this.stats.artists.failed++;
      }
    }
  }

  async seedStudios() {
    console.log('🏢 Seeding studio data...');
    
    const studios = await this.loadTestData('studios.json');
    
    for (const studio of studios) {
      try {
        // Validate studio data
        const validationErrors = validateStudioData(studio);
        if (validationErrors.length > 0) {
          console.error(`❌ Invalid studio data for ${studio.studioName}: ${validationErrors.join(', ')}`);
          this.stats.studios.failed++;
          continue;
        }

        // Create DynamoDB item
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
        
        console.log(`✅ Loaded studio: ${studio.studioName}`);
        this.stats.studios.loaded++;
        
      } catch (error) {
        console.error(`❌ Failed to load studio ${studio.studioName}:`, error.message);
        this.stats.studios.failed++;
      }
    }
  }

  async seedStyles() {
    console.log('🎭 Seeding style data...');
    
    const styles = await this.loadTestData('styles.json');
    
    for (const style of styles) {
      try {
        // Validate style data
        const validationErrors = validateStyleData(style);
        if (validationErrors.length > 0) {
          console.error(`❌ Invalid style data for ${style.styleName}: ${validationErrors.join(', ')}`);
          this.stats.styles.failed++;
          continue;
        }

        // Create DynamoDB item
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
        
        console.log(`✅ Loaded style: ${style.styleName}`);
        this.stats.styles.loaded++;
        
      } catch (error) {
        console.error(`❌ Failed to load style ${style.styleName}:`, error.message);
        this.stats.styles.failed++;
      }
    }
  }

  async setupOpenSearchIndex() {
    console.log('🔍 Setting up OpenSearch index...');
    
    try {
      // Check if index exists
      try {
        await this.makeOpenSearchRequest('HEAD', `/${OPENSEARCH_INDEX}`);
        console.log('📋 OpenSearch index already exists, deleting...');
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

  async indexArtistsInOpenSearch() {
    console.log('🔍 Indexing artists in OpenSearch...');
    
    const artists = await this.loadTestData('artists.json');
    
    for (const artist of artists) {
      try {
        // Prepare document for OpenSearch
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

    // Refresh index to make documents searchable
    try {
      await this.makeOpenSearchRequest('POST', `/${OPENSEARCH_INDEX}/_refresh`);
      console.log('✅ OpenSearch index refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh OpenSearch index:', error.message);
    }
  }

  async validateSeededData() {
    console.log('🔍 Validating seeded data...');
    
    try {
      // Check DynamoDB data
      const scanResult = await dynamodb.scan({
        TableName: TABLE_NAME,
        Select: 'COUNT'
      }).promise();
      
      console.log(`📊 DynamoDB contains ${scanResult.Count} items`);
      
      // Check OpenSearch data
      const searchResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_count`);
      console.log(`📊 OpenSearch contains ${searchResult.count} documents`);
      
      return {
        dynamodb: scanResult.Count,
        opensearch: searchResult.count
      };
      
    } catch (error) {
      console.error('❌ Failed to validate seeded data:', error.message);
      throw error;
    }
  }

  printStats() {
    console.log('\n📈 Seeding Statistics:');
    console.log('┌─────────────┬─────────┬────────┐');
    console.log('│ Data Type   │ Loaded  │ Failed │');
    console.log('├─────────────┼─────────┼────────┤');
    console.log(`│ Artists     │ ${this.stats.artists.loaded.toString().padStart(7)} │ ${this.stats.artists.failed.toString().padStart(6)} │`);
    console.log(`│ Studios     │ ${this.stats.studios.loaded.toString().padStart(7)} │ ${this.stats.studios.failed.toString().padStart(6)} │`);
    console.log(`│ Styles      │ ${this.stats.styles.loaded.toString().padStart(7)} │ ${this.stats.styles.failed.toString().padStart(6)} │`);
    console.log(`│ OpenSearch  │ ${this.stats.opensearch.indexed.toString().padStart(7)} │ ${this.stats.opensearch.failed.toString().padStart(6)} │`);
    console.log('└─────────────┴─────────┴────────┘');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      console.log('🌱 Starting comprehensive data seeding process...');
      
      await this.waitForServices();
      
      // Seed DynamoDB data
      await this.seedStyles();
      await this.seedStudios();
      await this.seedArtists();
      
      // Setup and populate OpenSearch
      await this.setupOpenSearchIndex();
      await this.indexArtistsInOpenSearch();
      
      // Validate results
      const validation = await this.validateSeededData();
      
      this.printStats();
      
      console.log('\n✅ Data seeding completed successfully!');
      console.log(`📊 Total items in DynamoDB: ${validation.dynamodb}`);
      console.log(`🔍 Total documents in OpenSearch: ${validation.opensearch}`);
      
      process.exit(0);
      
    } catch (error) {
      console.error('\n❌ Data seeding failed:', error.message);
      this.printStats();
      process.exit(1);
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const seeder = new DataSeeder();
  seeder.run();
}

module.exports = DataSeeder;