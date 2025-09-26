#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const DataManager = require('./data-manager');
const { SelectiveSeeder, TEST_SCENARIOS } = require('./selective-seeder');

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
const s3 = new AWS.S3();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || defaultEndpoint;
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'artists-local';

// Reset configurations for different testing scenarios
const RESET_CONFIGS = {
  'clean': {
    description: 'Complete clean state - no data',
    actions: ['clear-dynamodb', 'clear-opensearch', 'clear-s3']
  },
  'fresh': {
    description: 'Fresh start with full test dataset',
    actions: ['clear-dynamodb', 'clear-opensearch', 'clear-s3', 'seed-full']
  },
  'minimal': {
    description: 'Minimal dataset for quick testing',
    actions: ['clear-dynamodb', 'clear-opensearch', 'seed-scenario:minimal']
  },
  'search-ready': {
    description: 'Dataset optimized for search testing',
    actions: ['clear-dynamodb', 'clear-opensearch', 'seed-scenario:search-basic']
  },
  'location-test': {
    description: 'London-focused dataset for location testing',
    actions: ['clear-dynamodb', 'clear-opensearch', 'seed-scenario:location-london']
  },
  'style-test': {
    description: 'Traditional style focused dataset',
    actions: ['clear-dynamodb', 'clear-opensearch', 'seed-scenario:style-traditional']
  },
  'performance-test': {
    description: 'Large dataset for performance testing',
    actions: ['clear-dynamodb', 'clear-opensearch', 'seed-full', 'duplicate-data:5']
  },
  'backup-restore': {
    description: 'Reset to last backup state',
    actions: ['clear-dynamodb', 'clear-opensearch', 'restore-latest-backup']
  }
};

class DataReset {
  constructor() {
    this.stats = {
      cleared: 0,
      seeded: 0,
      restored: 0,
      failed: 0
    };
    this.dataManager = new DataManager();
    this.selectiveSeeder = new SelectiveSeeder();
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

  async clearDynamoDB() {
    console.log('🧹 Clearing DynamoDB data...');
    
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
      
      console.log(`📊 Found ${items.length} items to delete`);
      
      // Delete in batches
      const batchSize = 25;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              PK: item.PK,
              SK: item.SK
            }
          }
        }));
        
        await dynamodb.batchWrite({
          RequestItems: {
            [TABLE_NAME]: deleteRequests
          }
        }).promise();
        
        this.stats.cleared += deleteRequests.length;
      }
      
      console.log(`✅ Cleared ${this.stats.cleared} items from DynamoDB`);
      
    } catch (error) {
      console.error('❌ Failed to clear DynamoDB:', error.message);
      this.stats.failed++;
      throw error;
    }
  }

  async clearOpenSearch() {
    console.log('🔍 Clearing OpenSearch data...');
    
    try {
      // Delete the entire index
      try {
        await this.makeOpenSearchRequest('DELETE', `/${OPENSEARCH_INDEX}`);
        console.log('✅ OpenSearch index deleted');
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('📋 OpenSearch index does not exist');
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to clear OpenSearch:', error.message);
      this.stats.failed++;
      throw error;
    }
  }

  async clearS3() {
    console.log('📦 Clearing S3 data...');
    
    try {
      const buckets = ['tattoo-directory-images', 'tattoo-directory-backups'];
      
      for (const bucketName of buckets) {
        try {
          // List objects in bucket
          const objects = await s3.listObjects({ Bucket: bucketName }).promise();
          
          if (objects.Contents.length > 0) {
            // Delete objects
            const deleteParams = {
              Bucket: bucketName,
              Delete: {
                Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
              }
            };
            
            await s3.deleteObjects(deleteParams).promise();
            console.log(`✅ Cleared ${objects.Contents.length} objects from ${bucketName}`);
          } else {
            console.log(`📋 Bucket ${bucketName} is already empty`);
          }
          
        } catch (error) {
          if (error.statusCode === 404) {
            console.log(`📋 Bucket ${bucketName} does not exist`);
          } else {
            throw error;
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to clear S3:', error.message);
      this.stats.failed++;
      throw error;
    }
  }

  async seedFull() {
    console.log('🌱 Seeding full test dataset...');
    
    try {
      // Use the existing comprehensive seeder
      const DataSeeder = require('./seed');
      const seeder = new DataSeeder();
      await seeder.run();
      
      this.stats.seeded++;
      console.log('✅ Full dataset seeded successfully');
      
    } catch (error) {
      console.error('❌ Failed to seed full dataset:', error.message);
      this.stats.failed++;
      throw error;
    }
  }

  async seedScenario(scenarioName) {
    console.log(`🎯 Seeding scenario: ${scenarioName}`);
    
    try {
      await this.selectiveSeeder.seedScenario(scenarioName);
      this.stats.seeded++;
      console.log(`✅ Scenario '${scenarioName}' seeded successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to seed scenario '${scenarioName}':`, error.message);
      this.stats.failed++;
      throw error;
    }
  }

  async duplicateData(multiplier) {
    console.log(`📈 Duplicating data ${multiplier}x for performance testing...`);
    
    try {
      // Get existing artists
      const scanResult = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: {
          ':pk': 'ARTIST#'
        }
      }).promise();
      
      const originalArtists = scanResult.Items;
      console.log(`📊 Found ${originalArtists.length} original artists`);
      
      // Create duplicates with modified IDs
      for (let i = 1; i <= multiplier; i++) {
        for (const artist of originalArtists) {
          const duplicateArtist = {
            ...artist,
            PK: `ARTIST#${artist.artistId}-dup-${i}`,
            artistId: `${artist.artistId}-dup-${i}`,
            artistName: `${artist.artistName} (Copy ${i})`,
            instagramHandle: `${artist.instagramHandle}_${i}`,
            gsi1sk: `${artist.geohash}#${artist.artistId}-dup-${i}`,
            gsi2sk: `${artist.artistName} (Copy ${i})`,
            gsi3pk: `INSTAGRAM#${artist.instagramHandle}_${i}`
          };
          
          await dynamodb.put({
            TableName: TABLE_NAME,
            Item: duplicateArtist
          }).promise();
          
          // Also add to OpenSearch
          const osDocument = {
            ...duplicateArtist,
            location: {
              lat: duplicateArtist.latitude,
              lon: duplicateArtist.longitude
            }
          };
          
          await this.makeOpenSearchRequest(
            'PUT',
            `/${OPENSEARCH_INDEX}/_doc/${duplicateArtist.artistId}`,
            osDocument
          );
        }
      }
      
      // Refresh OpenSearch index
      await this.makeOpenSearchRequest('POST', `/${OPENSEARCH_INDEX}/_refresh`);
      
      const totalDuplicates = originalArtists.length * multiplier;
      console.log(`✅ Created ${totalDuplicates} duplicate artists`);
      this.stats.seeded += totalDuplicates;
      
    } catch (error) {
      console.error('❌ Failed to duplicate data:', error.message);
      this.stats.failed++;
      throw error;
    }
  }

  async restoreLatestBackup() {
    console.log('🔄 Restoring from latest backup...');
    
    try {
      const backups = await this.dataManager.listBackups();
      
      if (backups.length === 0) {
        throw new Error('No backups available');
      }
      
      // Get the most recent backup
      const latestBackup = backups.sort((a, b) => 
        new Date(b.lastModified) - new Date(a.lastModified)
      )[0];
      
      console.log(`📦 Restoring from backup: ${latestBackup.key}`);
      await this.dataManager.restoreData(latestBackup.key);
      
      this.stats.restored++;
      console.log('✅ Backup restored successfully');
      
    } catch (error) {
      console.error('❌ Failed to restore backup:', error.message);
      this.stats.failed++;
      throw error;
    }
  }

  async executeAction(action) {
    console.log(`🔧 Executing action: ${action}`);
    
    try {
      if (action === 'clear-dynamodb') {
        await this.clearDynamoDB();
      } else if (action === 'clear-opensearch') {
        await this.clearOpenSearch();
      } else if (action === 'clear-s3') {
        await this.clearS3();
      } else if (action === 'seed-full') {
        await this.seedFull();
      } else if (action.startsWith('seed-scenario:')) {
        const scenarioName = action.split(':')[1];
        await this.seedScenario(scenarioName);
      } else if (action.startsWith('duplicate-data:')) {
        const multiplier = parseInt(action.split(':')[1]);
        await this.duplicateData(multiplier);
      } else if (action === 'restore-latest-backup') {
        await this.restoreLatestBackup();
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      
    } catch (error) {
      console.error(`❌ Action '${action}' failed:`, error.message);
      throw error;
    }
  }

  async resetToState(stateName) {
    console.log(`🔄 Resetting to state: ${stateName}`);
    
    const config = RESET_CONFIGS[stateName];
    if (!config) {
      throw new Error(`Unknown reset state: ${stateName}`);
    }
    
    console.log(`📋 ${config.description}`);
    console.log(`🔧 Actions: ${config.actions.join(', ')}`);
    
    try {
      for (const action of config.actions) {
        await this.executeAction(action);
      }
      
      console.log(`✅ Successfully reset to state: ${stateName}`);
      
    } catch (error) {
      console.error(`❌ Failed to reset to state '${stateName}':`, error.message);
      throw error;
    }
  }

  async createSnapshot(snapshotName) {
    console.log(`📸 Creating snapshot: ${snapshotName}`);
    
    try {
      const backupKey = await this.dataManager.backupData(snapshotName);
      console.log(`✅ Snapshot created: ${backupKey}`);
      return backupKey;
      
    } catch (error) {
      console.error('❌ Failed to create snapshot:', error.message);
      throw error;
    }
  }

  async restoreSnapshot(snapshotName) {
    console.log(`🔄 Restoring snapshot: ${snapshotName}`);
    
    try {
      await this.clearDynamoDB();
      await this.clearOpenSearch();
      await this.dataManager.restoreData(snapshotName);
      
      this.stats.restored++;
      console.log(`✅ Snapshot restored: ${snapshotName}`);
      
    } catch (error) {
      console.error('❌ Failed to restore snapshot:', error.message);
      throw error;
    }
  }

  listResetStates() {
    console.log('\n🔄 Available Reset States:');
    console.log('┌─────────────────┬─────────────────────────────────────────────────┐');
    console.log('│ State           │ Description                                     │');
    console.log('├─────────────────┼─────────────────────────────────────────────────┤');
    
    Object.entries(RESET_CONFIGS).forEach(([key, config]) => {
      const description = config.description.length > 47 
        ? config.description.substring(0, 44) + '...'
        : config.description;
      console.log(`│ ${key.padEnd(15)} │ ${description.padEnd(47)} │`);
    });
    
    console.log('└─────────────────┴─────────────────────────────────────────────────┘');
  }

  async validateResetState() {
    console.log('🔍 Validating current state...');
    
    try {
      // Check DynamoDB
      const scanResult = await dynamodb.scan({
        TableName: TABLE_NAME,
        Select: 'COUNT'
      }).promise();
      
      // Check OpenSearch
      let osCount = 0;
      try {
        const searchResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_count`);
        osCount = searchResult.count;
      } catch (error) {
        if (!error.message.includes('404')) {
          throw error;
        }
      }
      
      console.log(`📊 Current state:`);
      console.log(`  • DynamoDB items: ${scanResult.Count}`);
      console.log(`  • OpenSearch documents: ${osCount}`);
      
      return {
        dynamodb: scanResult.Count,
        opensearch: osCount
      };
      
    } catch (error) {
      console.error('❌ Failed to validate state:', error.message);
      throw error;
    }
  }

  printStats() {
    console.log('\n📈 Reset Statistics:');
    console.log('┌─────────────┬─────────┐');
    console.log('│ Operation   │ Count   │');
    console.log('├─────────────┼─────────┤');
    console.log(`│ Cleared     │ ${this.stats.cleared.toString().padStart(7)} │`);
    console.log(`│ Seeded      │ ${this.stats.seeded.toString().padStart(7)} │`);
    console.log(`│ Restored    │ ${this.stats.restored.toString().padStart(7)} │`);
    console.log(`│ Failed      │ ${this.stats.failed.toString().padStart(7)} │`);
    console.log('└─────────────┴─────────┘');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const dataReset = new DataReset();

  try {
    switch (command) {
      case 'list':
        dataReset.listResetStates();
        break;
        
      case 'reset':
        const stateName = args[1];
        if (!stateName) {
          throw new Error('State name is required');
        }
        await dataReset.resetToState(stateName);
        await dataReset.validateResetState();
        break;
        
      case 'snapshot':
        const snapshotName = args[1];
        if (!snapshotName) {
          throw new Error('Snapshot name is required');
        }
        await dataReset.createSnapshot(snapshotName);
        break;
        
      case 'restore':
        const restoreSnapshot = args[1];
        if (!restoreSnapshot) {
          throw new Error('Snapshot name is required');
        }
        await dataReset.restoreSnapshot(restoreSnapshot);
        await dataReset.validateResetState();
        break;
        
      case 'validate':
        await dataReset.validateResetState();
        break;
        
      case 'clear':
        const clearType = args[1] || 'all';
        if (clearType === 'all' || clearType === 'dynamodb') {
          await dataReset.clearDynamoDB();
        }
        if (clearType === 'all' || clearType === 'opensearch') {
          await dataReset.clearOpenSearch();
        }
        if (clearType === 'all' || clearType === 's3') {
          await dataReset.clearS3();
        }
        await dataReset.validateResetState();
        break;
        
      default:
        console.log('🔄 Data Reset Usage:');
        console.log('  node data-reset.js list                    - List available reset states');
        console.log('  node data-reset.js reset <state>          - Reset to specific state');
        console.log('  node data-reset.js snapshot <name>        - Create data snapshot');
        console.log('  node data-reset.js restore <snapshot>     - Restore from snapshot');
        console.log('  node data-reset.js validate               - Validate current state');
        console.log('  node data-reset.js clear [type]           - Clear data (all/dynamodb/opensearch/s3)');
        console.log('\nExample:');
        console.log('  node data-reset.js reset fresh');
        console.log('  node data-reset.js reset search-ready');
        process.exit(1);
    }
    
    dataReset.printStats();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    dataReset.printStats();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataReset;