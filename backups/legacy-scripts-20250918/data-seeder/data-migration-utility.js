#!/usr/bin/env node

/**
 * Data Migration Utility
 * Provides advanced data migration and transformation capabilities
 * for upgrading test data schemas and handling data format changes
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const http = require('http');

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
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'artists-local';

class DataMigrationUtility {
  constructor() {
    this.stats = {
      migrated: 0,
      failed: 0,
      skipped: 0,
      transformed: 0
    };
    this.migrations = new Map();
    this.registerMigrations();
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

  registerMigrations() {
    // Migration: Add missing fields to existing artists
    this.migrations.set('add-missing-fields', {
      description: 'Add missing fields to existing artist records',
      version: '1.1.0',
      transform: (item) => {
        if (item.PK.startsWith('ARTIST#')) {
          // Add default availability if missing
          if (!item.availability) {
            item.availability = {
              bookingOpen: true,
              nextAvailable: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              waitingList: false
            };
          }
          
          // Add default experience if missing
          if (!item.experience) {
            item.experience = {
              yearsActive: Math.floor(Math.random() * 10) + 1,
              apprenticeshipCompleted: true
            };
          }
          
          // Add default pricing if missing
          if (!item.pricing) {
            item.pricing = {
              currency: 'GBP',
              hourlyRate: 100 + Math.floor(Math.random() * 150),
              minimumCharge: 120 + Math.floor(Math.random() * 180)
            };
          }
          
          return item;
        }
        return item;
      }
    });

    // Migration: Normalize location data
    this.migrations.set('normalize-locations', {
      description: 'Normalize location display formats',
      version: '1.2.0',
      transform: (item) => {
        if (item.PK.startsWith('ARTIST#') && item.locationDisplay) {
          // Ensure consistent location format
          let location = item.locationDisplay;
          if (!location.includes(', UK') && location.includes('London')) {
            location = location.replace('London', 'London, UK');
          }
          if (!location.includes(', UK') && location.includes('Manchester')) {
            location = location.replace('Manchester', 'Manchester, UK');
          }
          if (!location.includes(', UK') && location.includes('Birmingham')) {
            location = location.replace('Birmingham', 'Birmingham, UK');
          }
          
          item.locationDisplay = location;
          return item;
        }
        return item;
      }
    });

    // Migration: Update portfolio image structure
    this.migrations.set('update-portfolio-structure', {
      description: 'Update portfolio image structure with metadata',
      version: '1.3.0',
      transform: (item) => {
        if (item.PK.startsWith('ARTIST#') && item.portfolioImages) {
          item.portfolioImages = item.portfolioImages.map(img => {
            if (typeof img === 'string') {
              // Convert old string format to new object format
              return {
                url: img,
                caption: 'Portfolio image',
                style: item.styles[0] || 'traditional',
                uploadDate: new Date().toISOString(),
                featured: false
              };
            } else if (img && !img.style) {
              // Add missing metadata to existing objects
              return {
                ...img,
                style: item.styles[0] || 'traditional',
                uploadDate: img.uploadDate || new Date().toISOString(),
                featured: img.featured || false
              };
            }
            return img;
          });
          return item;
        }
        return item;
      }
    });

    // Migration: Add social media links
    this.migrations.set('add-social-media', {
      description: 'Add social media links structure',
      version: '1.4.0',
      transform: (item) => {
        if (item.PK.startsWith('ARTIST#')) {
          if (!item.socialMedia) {
            item.socialMedia = {
              instagram: item.instagramHandle ? `https://instagram.com/${item.instagramHandle}` : null,
              website: null,
              facebook: null,
              tiktok: null
            };
          }
          return item;
        }
        return item;
      }
    });
  }

  async runMigration(migrationName) {
    console.log(`🔄 Running migration: ${migrationName}`);
    
    const migration = this.migrations.get(migrationName);
    if (!migration) {
      throw new Error(`Migration '${migrationName}' not found`);
    }

    console.log(`📋 ${migration.description} (v${migration.version})`);

    try {
      // Get all items from DynamoDB
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

      console.log(`📊 Found ${items.length} items to process`);

      // Apply migration to each item
      for (const item of items) {
        try {
          const originalItem = JSON.stringify(item);
          const transformedItem = migration.transform(item);
          
          // Check if item was actually changed
          if (JSON.stringify(transformedItem) !== originalItem) {
            // Update item in DynamoDB
            await dynamodb.put({
              TableName: TABLE_NAME,
              Item: {
                ...transformedItem,
                updatedAt: new Date().toISOString(),
                migrationVersion: migration.version
              }
            }).promise();
            
            // Update in OpenSearch if it's an artist
            if (transformedItem.PK.startsWith('ARTIST#')) {
              const osDocument = {
                ...transformedItem,
                location: {
                  lat: transformedItem.latitude,
                  lon: transformedItem.longitude
                }
              };
              
              await this.makeOpenSearchRequest(
                'PUT',
                `/${OPENSEARCH_INDEX}/_doc/${transformedItem.artistId}`,
                osDocument
              );
            }
            
            this.stats.transformed++;
            console.log(`✅ Migrated: ${item.PK}`);
          } else {
            this.stats.skipped++;
          }
          
          this.stats.migrated++;
          
        } catch (error) {
          console.error(`❌ Failed to migrate ${item.PK}:`, error.message);
          this.stats.failed++;
        }
      }

      // Refresh OpenSearch index
      await this.makeOpenSearchRequest('POST', `/${OPENSEARCH_INDEX}/_refresh`);

      console.log(`✅ Migration '${migrationName}' completed`);
      
    } catch (error) {
      console.error(`❌ Migration '${migrationName}' failed:`, error.message);
      throw error;
    }
  }

  async runAllMigrations() {
    console.log('🔄 Running all available migrations...');
    
    for (const [name, migration] of this.migrations) {
      try {
        await this.runMigration(name);
      } catch (error) {
        console.error(`❌ Migration '${name}' failed:`, error.message);
        // Continue with other migrations
      }
    }
    
    console.log('✅ All migrations completed');
  }

  listMigrations() {
    console.log('\n🔄 Available Migrations:');
    console.log('┌─────────────────────────┬─────────┬─────────────────────────────────────────────────┐');
    console.log('│ Migration               │ Version │ Description                                     │');
    console.log('├─────────────────────────┼─────────┼─────────────────────────────────────────────────┤');
    
    for (const [name, migration] of this.migrations) {
      const description = migration.description.length > 47 
        ? migration.description.substring(0, 44) + '...'
        : migration.description;
      console.log(`│ ${name.padEnd(23)} │ ${migration.version.padEnd(7)} │ ${description.padEnd(47)} │`);
    }
    
    console.log('└─────────────────────────┴─────────┴─────────────────────────────────────────────────┘');
  }

  async validateMigrationResults() {
    console.log('🔍 Validating migration results...');
    
    try {
      // Check for items with migration version
      const result = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'attribute_exists(migrationVersion)'
      }).promise();
      
      console.log(`📊 Found ${result.Items.length} migrated items`);
      
      // Group by migration version
      const versionCounts = {};
      result.Items.forEach(item => {
        const version = item.migrationVersion;
        versionCounts[version] = (versionCounts[version] || 0) + 1;
      });
      
      console.log('\n📈 Migration Version Distribution:');
      Object.entries(versionCounts).forEach(([version, count]) => {
        console.log(`  • v${version}: ${count} items`);
      });
      
      return versionCounts;
      
    } catch (error) {
      console.error('❌ Migration validation failed:', error.message);
      throw error;
    }
  }

  async rollbackMigration(migrationName) {
    console.log(`🔄 Rolling back migration: ${migrationName}`);
    
    const migration = this.migrations.get(migrationName);
    if (!migration) {
      throw new Error(`Migration '${migrationName}' not found`);
    }

    try {
      // Find items with this migration version
      const result = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'migrationVersion = :version',
        ExpressionAttributeValues: {
          ':version': migration.version
        }
      }).promise();
      
      console.log(`📊 Found ${result.Items.length} items to rollback`);
      
      for (const item of result.Items) {
        try {
          // Remove migration-specific fields
          delete item.migrationVersion;
          
          // Update item
          await dynamodb.put({
            TableName: TABLE_NAME,
            Item: {
              ...item,
              updatedAt: new Date().toISOString()
            }
          }).promise();
          
          console.log(`✅ Rolled back: ${item.PK}`);
          this.stats.migrated++;
          
        } catch (error) {
          console.error(`❌ Failed to rollback ${item.PK}:`, error.message);
          this.stats.failed++;
        }
      }
      
      console.log(`✅ Rollback of '${migrationName}' completed`);
      
    } catch (error) {
      console.error(`❌ Rollback of '${migrationName}' failed:`, error.message);
      throw error;
    }
  }

  printStats() {
    console.log('\n📈 Migration Statistics:');
    console.log('┌─────────────┬─────────┐');
    console.log('│ Operation   │ Count   │');
    console.log('├─────────────┼─────────┤');
    console.log(`│ Migrated    │ ${this.stats.migrated.toString().padStart(7)} │`);
    console.log(`│ Transformed │ ${this.stats.transformed.toString().padStart(7)} │`);
    console.log(`│ Skipped     │ ${this.stats.skipped.toString().padStart(7)} │`);
    console.log(`│ Failed      │ ${this.stats.failed.toString().padStart(7)} │`);
    console.log('└─────────────┴─────────┘');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const migrationUtility = new DataMigrationUtility();

  try {
    switch (command) {
      case 'list':
        migrationUtility.listMigrations();
        break;
        
      case 'run':
        const migrationName = args[1];
        if (!migrationName) {
          throw new Error('Migration name is required');
        }
        await migrationUtility.runMigration(migrationName);
        break;
        
      case 'run-all':
        await migrationUtility.runAllMigrations();
        break;
        
      case 'validate':
        await migrationUtility.validateMigrationResults();
        break;
        
      case 'rollback':
        const rollbackName = args[1];
        if (!rollbackName) {
          throw new Error('Migration name is required for rollback');
        }
        await migrationUtility.rollbackMigration(rollbackName);
        break;
        
      default:
        console.log('🔄 Data Migration Utility Usage:');
        console.log('  node data-migration-utility.js list                    - List available migrations');
        console.log('  node data-migration-utility.js run <migration>         - Run specific migration');
        console.log('  node data-migration-utility.js run-all                 - Run all migrations');
        console.log('  node data-migration-utility.js validate                - Validate migration results');
        console.log('  node data-migration-utility.js rollback <migration>    - Rollback specific migration');
        console.log('\nExample:');
        console.log('  node data-migration-utility.js run add-missing-fields');
        process.exit(1);
    }
    
    migrationUtility.printStats();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    migrationUtility.printStats();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataMigrationUtility;