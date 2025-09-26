#!/usr/bin/env node

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

class DataValidator {
  constructor() {
    this.stats = {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 0,
      errors: []
    };
    this.validationRules = {
      artist: this.getArtistValidationRules(),
      studio: this.getStudioValidationRules(),
      style: this.getStyleValidationRules()
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

  getArtistValidationRules() {
    return {
      required: ['artistId', 'artistName', 'instagramHandle', 'styles', 'locationDisplay', 'geohash'],
      types: {
        artistId: 'string',
        artistName: 'string',
        instagramHandle: 'string',
        styles: 'array',
        locationDisplay: 'string',
        geohash: 'string',
        latitude: 'number',
        longitude: 'number',
        rating: 'number',
        reviewCount: 'number',
        portfolioImages: 'array'
      },
      ranges: {
        rating: { min: 0, max: 5 },
        reviewCount: { min: 0, max: 10000 },
        latitude: { min: -90, max: 90 },
        longitude: { min: -180, max: 180 }
      },
      patterns: {
        artistId: /^artist-\d+$/,
        instagramHandle: /^[a-zA-Z0-9._]+$/,
        geohash: /^[0-9a-z]+$/
      },
      custom: {
        styles: (styles) => Array.isArray(styles) && styles.length > 0,
        portfolioImages: (images) => !images || (Array.isArray(images) && images.every(img => 
          img.url && typeof img.url === 'string' && img.url.startsWith('http')
        ))
      }
    };
  }

  getStudioValidationRules() {
    return {
      required: ['studioId', 'studioName', 'address', 'postcode', 'geohash'],
      types: {
        studioId: 'string',
        studioName: 'string',
        address: 'string',
        postcode: 'string',
        geohash: 'string',
        latitude: 'number',
        longitude: 'number',
        specialties: 'array'
      },
      patterns: {
        studioId: /^studio-\d+$/,
        postcode: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
        geohash: /^[0-9a-z]+$/
      },
      custom: {
        specialties: (specialties) => !specialties || Array.isArray(specialties)
      }
    };
  }

  getStyleValidationRules() {
    return {
      required: ['styleId', 'styleName', 'description'],
      types: {
        styleId: 'string',
        styleName: 'string',
        description: 'string',
        difficulty: 'string',
        popularity: 'number'
      },
      patterns: {
        styleId: /^[a-z_]+$/
      },
      enums: {
        difficulty: ['beginner', 'intermediate', 'advanced', 'expert']
      }
    };
  }

  validateItem(item, type) {
    const rules = this.validationRules[type];
    if (!rules) {
      return { valid: false, errors: [`Unknown validation type: ${type}`] };
    }

    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of rules.required) {
      if (!(field in item) || item[field] === null || item[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check types
    if (rules.types) {
      for (const [field, expectedType] of Object.entries(rules.types)) {
        if (field in item && item[field] !== null && item[field] !== undefined) {
          const actualType = Array.isArray(item[field]) ? 'array' : typeof item[field];
          if (actualType !== expectedType) {
            errors.push(`Field '${field}' should be ${expectedType}, got ${actualType}`);
          }
        }
      }
    }

    // Check ranges
    if (rules.ranges) {
      for (const [field, range] of Object.entries(rules.ranges)) {
        if (field in item && typeof item[field] === 'number') {
          if (item[field] < range.min || item[field] > range.max) {
            errors.push(`Field '${field}' should be between ${range.min} and ${range.max}`);
          }
        }
      }
    }

    // Check patterns
    if (rules.patterns) {
      for (const [field, pattern] of Object.entries(rules.patterns)) {
        if (field in item && typeof item[field] === 'string') {
          if (!pattern.test(item[field])) {
            errors.push(`Field '${field}' does not match required pattern`);
          }
        }
      }
    }

    // Check enums
    if (rules.enums) {
      for (const [field, allowedValues] of Object.entries(rules.enums)) {
        if (field in item && !allowedValues.includes(item[field])) {
          errors.push(`Field '${field}' must be one of: ${allowedValues.join(', ')}`);
        }
      }
    }

    // Check custom validations
    if (rules.custom) {
      for (const [field, validator] of Object.entries(rules.custom)) {
        if (field in item) {
          try {
            if (!validator(item[field])) {
              errors.push(`Field '${field}' failed custom validation`);
            }
          } catch (error) {
            errors.push(`Field '${field}' custom validation error: ${error.message}`);
          }
        }
      }
    }

    // Additional business logic validations
    this.performBusinessValidations(item, type, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  performBusinessValidations(item, type, errors, warnings) {
    switch (type) {
      case 'artist':
        this.validateArtistBusinessRules(item, errors, warnings);
        break;
      case 'studio':
        this.validateStudioBusinessRules(item, errors, warnings);
        break;
      case 'style':
        this.validateStyleBusinessRules(item, errors, warnings);
        break;
    }
  }

  validateArtistBusinessRules(artist, errors, warnings) {
    // Check portfolio image count
    if (artist.portfolioImages && artist.portfolioImages.length < 3) {
      warnings.push('Artist should have at least 3 portfolio images');
    }

    // Check rating consistency
    if (artist.rating && artist.reviewCount) {
      if (artist.rating > 0 && artist.reviewCount === 0) {
        errors.push('Artist cannot have rating without reviews');
      }
    }

    // Check location consistency
    if (artist.latitude && artist.longitude && artist.geohash) {
      // Basic geohash validation (simplified)
      const lat = Math.abs(artist.latitude);
      const lon = Math.abs(artist.longitude);
      if (lat > 90 || lon > 180) {
        errors.push('Invalid latitude/longitude coordinates');
      }
    }

    // Check availability logic
    if (artist.availability) {
      if (artist.availability.bookingOpen === false && artist.availability.nextAvailable) {
        const nextAvailable = new Date(artist.availability.nextAvailable);
        if (nextAvailable < new Date()) {
          warnings.push('Next available date is in the past');
        }
      }
    }

    // Check experience consistency
    if (artist.experience) {
      if (artist.experience.yearsActive < 0) {
        errors.push('Years active cannot be negative');
      }
      if (artist.experience.yearsActive > 50) {
        warnings.push('Years active seems unusually high');
      }
    }
  }

  validateStudioBusinessRules(studio, errors, warnings) {
    // Check address format
    if (studio.address && !studio.address.includes(',')) {
      warnings.push('Address should include city/area information');
    }

    // Check postcode format for UK
    if (studio.postcode && studio.locationDisplay && studio.locationDisplay.includes('UK')) {
      const ukPostcodePattern = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
      if (!ukPostcodePattern.test(studio.postcode)) {
        errors.push('Invalid UK postcode format');
      }
    }

    // Check specialties
    if (studio.specialties && studio.specialties.length === 0) {
      warnings.push('Studio should have at least one specialty');
    }
  }

  validateStyleBusinessRules(style, errors, warnings) {
    // Check description length
    if (style.description && style.description.length < 10) {
      warnings.push('Style description should be more descriptive');
    }

    // Check popularity range
    if (style.popularity !== undefined) {
      if (style.popularity < 0 || style.popularity > 100) {
        errors.push('Style popularity should be between 0 and 100');
      }
    }
  }

  async validateTestDataFiles() {
    console.log('📋 Validating test data files...');
    
    const results = {
      artists: { valid: 0, invalid: 0, warnings: 0, errors: [] },
      studios: { valid: 0, invalid: 0, warnings: 0, errors: [] },
      styles: { valid: 0, invalid: 0, warnings: 0, errors: [] }
    };

    const dataTypes = ['artists', 'studios', 'styles'];
    
    for (const type of dataTypes) {
      const testDataPath = path.join(__dirname, '..', 'test-data', `${type}.json`);
      
      if (!fs.existsSync(testDataPath)) {
        console.warn(`⚠️  Test data file not found: ${type}.json`);
        continue;
      }
      
      try {
        const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
        console.log(`🔍 Validating ${data.length} ${type} records...`);
        
        for (const [index, item] of data.entries()) {
          const validation = this.validateItem(item, type.slice(0, -1)); // Remove 's' from plural
          
          if (validation.valid) {
            results[type].valid++;
          } else {
            results[type].invalid++;
            results[type].errors.push({
              index,
              id: item[`${type.slice(0, -1)}Id`] || `item-${index}`,
              errors: validation.errors
            });
          }
          
          if (validation.warnings.length > 0) {
            results[type].warnings++;
            console.warn(`⚠️  ${type.slice(0, -1)} ${item[`${type.slice(0, -1)}Id`] || index}: ${validation.warnings.join(', ')}`);
          }
        }
        
        console.log(`✅ ${type}: ${results[type].valid} valid, ${results[type].invalid} invalid, ${results[type].warnings} warnings`);
        
      } catch (error) {
        console.error(`❌ Failed to validate ${type}:`, error.message);
        results[type].errors.push({ error: error.message });
      }
    }

    return results;
  }

  async validateDatabaseData() {
    console.log('🗄️  Validating database data...');
    
    try {
      let items = [];
      let lastEvaluatedKey = null;
      
      do {
        const params = {
          TableName: TABLE_NAME,
          ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
        };
        
        const result = await dynamodb.scan(params).promise();
        items = items.concat(result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
        
      } while (lastEvaluatedKey);
      
      console.log(`📊 Found ${items.length} items in database`);
      
      const results = {
        artists: { valid: 0, invalid: 0, warnings: 0, errors: [] },
        studios: { valid: 0, invalid: 0, warnings: 0, errors: [] },
        styles: { valid: 0, invalid: 0, warnings: 0, errors: [] }
      };
      
      for (const item of items) {
        let type = null;
        if (item.PK.startsWith('ARTIST#')) type = 'artist';
        else if (item.PK.startsWith('STUDIO#')) type = 'studio';
        else if (item.PK.startsWith('STYLE#')) type = 'style';
        
        if (!type) continue;
        
        const validation = this.validateItem(item, type);
        const typeKey = type + 's';
        
        if (validation.valid) {
          results[typeKey].valid++;
        } else {
          results[typeKey].invalid++;
          results[typeKey].errors.push({
            pk: item.PK,
            sk: item.SK,
            errors: validation.errors
          });
        }
        
        if (validation.warnings.length > 0) {
          results[typeKey].warnings++;
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Database validation failed:', error.message);
      throw error;
    }
  }

  async validateOpenSearchData() {
    console.log('🔍 Validating OpenSearch data...');
    
    try {
      const searchResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_search`, {
        query: { match_all: {} },
        size: 10000
      });
      
      const documents = searchResult.hits.hits;
      console.log(`📊 Found ${documents.length} documents in OpenSearch`);
      
      let valid = 0;
      let invalid = 0;
      let warnings = 0;
      const errors = [];
      
      for (const doc of documents) {
        const validation = this.validateItem(doc._source, 'artist');
        
        if (validation.valid) {
          valid++;
        } else {
          invalid++;
          errors.push({
            id: doc._id,
            errors: validation.errors
          });
        }
        
        if (validation.warnings.length > 0) {
          warnings++;
        }
      }
      
      return { valid, invalid, warnings, errors };
      
    } catch (error) {
      console.error('❌ OpenSearch validation failed:', error.message);
      throw error;
    }
  }

  async validateDataConsistency() {
    console.log('🔄 Validating data consistency between services...');
    
    try {
      // Get data from both sources
      const dynamoArtists = await this.getDynamoArtists();
      const openSearchArtists = await this.getOpenSearchArtists();
      
      const consistency = {
        dynamoCount: dynamoArtists.length,
        openSearchCount: openSearchArtists.length,
        missing: [],
        extra: [],
        mismatched: []
      };
      
      // Check for missing artists in OpenSearch
      for (const dynamoArtist of dynamoArtists) {
        const artistId = dynamoArtist.artistId;
        const openSearchArtist = openSearchArtists.find(a => a.artistId === artistId);
        
        if (!openSearchArtist) {
          consistency.missing.push(artistId);
        } else {
          // Check for data mismatches
          const mismatches = this.compareArtistData(dynamoArtist, openSearchArtist);
          if (mismatches.length > 0) {
            consistency.mismatched.push({ artistId, mismatches });
          }
        }
      }
      
      // Check for extra artists in OpenSearch
      for (const openSearchArtist of openSearchArtists) {
        const artistId = openSearchArtist.artistId;
        const dynamoArtist = dynamoArtists.find(a => a.artistId === artistId);
        
        if (!dynamoArtist) {
          consistency.extra.push(artistId);
        }
      }
      
      return consistency;
      
    } catch (error) {
      console.error('❌ Consistency validation failed:', error.message);
      throw error;
    }
  }

  async getDynamoArtists() {
    let items = [];
    let lastEvaluatedKey = null;
    
    do {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: {
          ':pk': 'ARTIST#'
        },
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
      };
      
      const result = await dynamodb.scan(params).promise();
      items = items.concat(result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
      
    } while (lastEvaluatedKey);
    
    return items;
  }

  async getOpenSearchArtists() {
    const searchResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_search`, {
      query: { match_all: {} },
      size: 10000
    });
    
    return searchResult.hits.hits.map(hit => hit._source);
  }

  compareArtistData(dynamoArtist, openSearchArtist) {
    const mismatches = [];
    const fieldsToCompare = ['artistName', 'instagramHandle', 'styles', 'locationDisplay', 'rating'];
    
    for (const field of fieldsToCompare) {
      const dynamoValue = dynamoArtist[field];
      const openSearchValue = openSearchArtist[field];
      
      if (JSON.stringify(dynamoValue) !== JSON.stringify(openSearchValue)) {
        mismatches.push({
          field,
          dynamo: dynamoValue,
          openSearch: openSearchValue
        });
      }
    }
    
    return mismatches;
  }

  printValidationReport(results) {
    console.log('\n📊 Validation Report:');
    console.log('┌─────────────┬─────────┬─────────┬──────────┐');
    console.log('│ Data Type   │ Valid   │ Invalid │ Warnings │');
    console.log('├─────────────┼─────────┼─────────┼──────────┤');
    
    Object.entries(results).forEach(([type, stats]) => {
      if (typeof stats === 'object' && 'valid' in stats) {
        console.log(`│ ${type.padEnd(11)} │ ${stats.valid.toString().padStart(7)} │ ${stats.invalid.toString().padStart(7)} │ ${stats.warnings.toString().padStart(8)} │`);
      }
    });
    
    console.log('└─────────────┴─────────┴─────────┴──────────┘');
    
    // Print detailed errors
    Object.entries(results).forEach(([type, stats]) => {
      if (typeof stats === 'object' && stats.errors && stats.errors.length > 0) {
        console.log(`\n❌ ${type.toUpperCase()} Errors:`);
        stats.errors.slice(0, 5).forEach(error => {
          console.log(`  • ${error.id || error.pk}: ${error.errors ? error.errors.join(', ') : error.error}`);
        });
        if (stats.errors.length > 5) {
          console.log(`  ... and ${stats.errors.length - 5} more errors`);
        }
      }
    });
  }

  printConsistencyReport(consistency) {
    console.log('\n🔄 Data Consistency Report:');
    console.log(`📊 DynamoDB Artists: ${consistency.dynamoCount}`);
    console.log(`🔍 OpenSearch Artists: ${consistency.openSearchCount}`);
    console.log(`❌ Missing in OpenSearch: ${consistency.missing.length}`);
    console.log(`➕ Extra in OpenSearch: ${consistency.extra.length}`);
    console.log(`⚠️  Data Mismatches: ${consistency.mismatched.length}`);
    
    if (consistency.missing.length > 0) {
      console.log('\n❌ Missing Artists:');
      consistency.missing.slice(0, 5).forEach(id => console.log(`  • ${id}`));
      if (consistency.missing.length > 5) {
        console.log(`  ... and ${consistency.missing.length - 5} more`);
      }
    }
    
    if (consistency.mismatched.length > 0) {
      console.log('\n⚠️  Data Mismatches:');
      consistency.mismatched.slice(0, 3).forEach(mismatch => {
        console.log(`  • ${mismatch.artistId}:`);
        mismatch.mismatches.forEach(m => {
          console.log(`    - ${m.field}: DynamoDB="${m.dynamo}" vs OpenSearch="${m.openSearch}"`);
        });
      });
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const validator = new DataValidator();

  try {
    switch (command) {
      case 'files':
        const fileResults = await validator.validateTestDataFiles();
        validator.printValidationReport(fileResults);
        break;
        
      case 'database':
        const dbResults = await validator.validateDatabaseData();
        validator.printValidationReport(dbResults);
        break;
        
      case 'opensearch':
        const osResults = await validator.validateOpenSearchData();
        validator.printValidationReport({ opensearch: osResults });
        break;
        
      case 'consistency':
        const consistency = await validator.validateDataConsistency();
        validator.printConsistencyReport(consistency);
        break;
        
      case 'all':
        console.log('🔍 Running comprehensive validation...\n');
        
        const allFileResults = await validator.validateTestDataFiles();
        const allDbResults = await validator.validateDatabaseData();
        const allOsResults = await validator.validateOpenSearchData();
        const allConsistency = await validator.validateDataConsistency();
        
        validator.printValidationReport({
          ...allFileResults,
          database: {
            valid: allDbResults.artists.valid + allDbResults.studios.valid + allDbResults.styles.valid,
            invalid: allDbResults.artists.invalid + allDbResults.studios.invalid + allDbResults.styles.invalid,
            warnings: allDbResults.artists.warnings + allDbResults.studios.warnings + allDbResults.styles.warnings,
            errors: [...allDbResults.artists.errors, ...allDbResults.studios.errors, ...allDbResults.styles.errors]
          },
          opensearch: allOsResults
        });
        
        validator.printConsistencyReport(allConsistency);
        break;
        
      default:
        console.log('🔍 Data Validator Usage:');
        console.log('  node data-validator.js files       - Validate test data files');
        console.log('  node data-validator.js database     - Validate DynamoDB data');
        console.log('  node data-validator.js opensearch   - Validate OpenSearch data');
        console.log('  node data-validator.js consistency  - Check data consistency');
        console.log('  node data-validator.js all          - Run all validations');
        process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataValidator;