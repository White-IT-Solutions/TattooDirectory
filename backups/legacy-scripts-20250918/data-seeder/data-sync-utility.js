#!/usr/bin/env node

/**
 * Data Synchronization Utility
 * Provides advanced data synchronization capabilities between different environments
 * and ensures data consistency across multiple LocalStack instances
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

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

class DataSyncUtility {
  constructor() {
    this.stats = {
      synced: 0,
      conflicts: 0,
      failed: 0,
      skipped: 0
    };
    this.syncLog = [];
  }

  makeOpenSearchRequest(method, path, data = null, endpoint = null) {
    return new Promise((resolve, reject) => {
      const hostname = endpoint ? new URL(endpoint).hostname : (isRunningInContainer ? 'localstack' : 'localhost');
      const port = endpoint ? new URL(endpoint).port : 4566;
      
      const options = {
        hostname: hostname,
        port: port,
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

  generateDataHash(item) {
    // Create a hash of the item for change detection
    const itemCopy = { ...item };
    delete itemCopy.updatedAt;
    delete itemCopy.createdAt;
    delete itemCopy.syncHash;
    
    return crypto.createHash('md5').update(JSON.stringify(itemCopy)).digest('hex');
  }

  async syncDynamoDBToOpenSearch() {
    console.log('🔄 Syncing DynamoDB to OpenSearch...');
    
    try {
      // Get all artists from DynamoDB
      let items = [];
      let lastEvaluatedKey = null;
      
      do {
        const params = {
          TableName: TABLE_NAME,
          FilterExpression: 'begins_with(PK, :pk)',
          ExpressionAttributeValues: { ':pk': 'ARTIST#' },
          ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
        };
        
        const result = await dynamodb.scan(params).promise();
        items = items.concat(result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
        
      } while (lastEvaluatedKey);
      
      console.log(`📊 Found ${items.length} artists to sync`);
      
      // Sync each artist to OpenSearch
      for (const artist of items) {
        try {
          await this.syncArtistToOpenSearch(artist);
          this.stats.synced++;
        } catch (error) {
          console.error(`❌ Failed to sync artist ${artist.artistId}:`, error.message);
          this.stats.failed++;
        }
      }
      
      // Refresh OpenSearch index
      await this.makeOpenSearchRequest('POST', `/${OPENSEARCH_INDEX}/_refresh`);
      
      console.log(`✅ Sync completed: ${this.stats.synced} synced, ${this.stats.failed} failed`);
      
    } catch (error) {
      console.error('❌ DynamoDB to OpenSearch sync failed:', error.message);
      throw error;
    }
  }

  async syncArtistToOpenSearch(artist) {
    const osDocument = {
      ...artist,
      location: {
        lat: artist.latitude,
        lon: artist.longitude
      },
      syncHash: this.generateDataHash(artist),
      lastSynced: new Date().toISOString()
    };
    
    // Check if document exists and has changed
    try {
      const existing = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_doc/${artist.artistId}`);
      
      if (existing._source && existing._source.syncHash === osDocument.syncHash) {
        this.stats.skipped++;
        return; // No changes, skip sync
      }
    } catch (error) {
      // Document doesn't exist, proceed with creation
    }
    
    await this.makeOpenSearchRequest(
      'PUT',
      `/${OPENSEARCH_INDEX}/_doc/${artist.artistId}`,
      osDocument
    );
  }

  async syncOpenSearchToDynamoDB() {
    console.log('🔄 Syncing OpenSearch to DynamoDB...');
    
    try {
      // Get all documents from OpenSearch
      const searchResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_search`, {
        query: { match_all: {} },
        size: 10000
      });
      
      const documents = searchResult.hits.hits;
      console.log(`📊 Found ${documents.length} documents to sync`);
      
      for (const doc of documents) {
        try {
          await this.syncDocumentToDynamoDB(doc._source);
          this.stats.synced++;
        } catch (error) {
          console.error(`❌ Failed to sync document ${doc._id}:`, error.message);
          this.stats.failed++;
        }
      }
      
      console.log(`✅ Sync completed: ${this.stats.synced} synced, ${this.stats.failed} failed`);
      
    } catch (error) {
      console.error('❌ OpenSearch to DynamoDB sync failed:', error.message);
      throw error;
    }
  }

  async syncDocumentToDynamoDB(document) {
    // Check if item exists in DynamoDB
    try {
      const existing = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: {
          PK: `ARTIST#${document.artistId}`,
          SK: 'PROFILE'
        }
      }).promise();
      
      if (existing.Item && existing.Item.syncHash === document.syncHash) {
        this.stats.skipped++;
        return; // No changes, skip sync
      }
    } catch (error) {
      // Item doesn't exist, proceed with creation
    }
    
    // Prepare DynamoDB item
    const dynamoItem = {
      ...document,
      PK: `ARTIST#${document.artistId}`,
      SK: 'PROFILE',
      gsi1pk: `STYLE#${document.styles[0]}`,
      gsi1sk: `${document.geohash}#${document.artistId}`,
      gsi2pk: `LOCATION#${document.geohash}`,
      gsi2sk: `${document.artistName}`,
      gsi3pk: `INSTAGRAM#${document.instagramHandle}`,
      updatedAt: new Date().toISOString()
    };
    
    // Remove OpenSearch-specific fields
    delete dynamoItem.location;
    delete dynamoItem.lastSynced;
    
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: dynamoItem
    }).promise();
  }

  async detectConflicts() {
    console.log('🔍 Detecting data conflicts...');
    
    const conflicts = [];
    
    try {
      // Get artists from both sources
      const dynamoArtists = await this.getDynamoArtists();
      const osArtists = await this.getOpenSearchArtists();
      
      // Create maps for easier comparison
      const dynamoMap = new Map(dynamoArtists.map(a => [a.artistId, a]));
      const osMap = new Map(osArtists.map(a => [a.artistId, a]));
      
      // Check for conflicts
      for (const [artistId, dynamoArtist] of dynamoMap) {
        const osArtist = osMap.get(artistId);
        
        if (osArtist) {
          const dynamoHash = this.generateDataHash(dynamoArtist);
          const osHash = this.generateDataHash(osArtist);
          
          if (dynamoHash !== osHash) {
            conflicts.push({
              artistId,
              type: 'data_mismatch',
              dynamoHash,
              osHash,
              dynamoUpdated: dynamoArtist.updatedAt,
              osUpdated: osArtist.lastSynced
            });
          }
        } else {
          conflicts.push({
            artistId,
            type: 'missing_in_opensearch',
            dynamoUpdated: dynamoArtist.updatedAt
          });
        }
      }
      
      // Check for items only in OpenSearch
      for (const [artistId, osArtist] of osMap) {
        if (!dynamoMap.has(artistId)) {
          conflicts.push({
            artistId,
            type: 'missing_in_dynamodb',
            osUpdated: osArtist.lastSynced
          });
        }
      }
      
      this.stats.conflicts = conflicts.length;
      
      if (conflicts.length > 0) {
        console.log(`⚠️  Found ${conflicts.length} conflicts`);
        this.printConflicts(conflicts);
      } else {
        console.log('✅ No conflicts detected');
      }
      
      return conflicts;
      
    } catch (error) {
      console.error('❌ Conflict detection failed:', error.message);
      throw error;
    }
  }

  async resolveConflicts(strategy = 'latest') {
    console.log(`🔧 Resolving conflicts using strategy: ${strategy}`);
    
    const conflicts = await this.detectConflicts();
    
    if (conflicts.length === 0) {
      console.log('✅ No conflicts to resolve');
      return;
    }
    
    for (const conflict of conflicts) {
      try {
        await this.resolveConflict(conflict, strategy);
        console.log(`✅ Resolved conflict for ${conflict.artistId}`);
      } catch (error) {
        console.error(`❌ Failed to resolve conflict for ${conflict.artistId}:`, error.message);
        this.stats.failed++;
      }
    }
  }

  async resolveConflict(conflict, strategy) {
    switch (strategy) {
      case 'latest':
        await this.resolveByLatest(conflict);
        break;
      case 'dynamo_wins':
        await this.resolveDynamoWins(conflict);
        break;
      case 'opensearch_wins':
        await this.resolveOpenSearchWins(conflict);
        break;
      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
  }

  async resolveByLatest(conflict) {
    if (conflict.type === 'data_mismatch') {
      const dynamoTime = new Date(conflict.dynamoUpdated);
      const osTime = new Date(conflict.osUpdated);
      
      if (dynamoTime > osTime) {
        await this.resolveDynamoWins(conflict);
      } else {
        await this.resolveOpenSearchWins(conflict);
      }
    } else if (conflict.type === 'missing_in_opensearch') {
      await this.resolveDynamoWins(conflict);
    } else if (conflict.type === 'missing_in_dynamodb') {
      await this.resolveOpenSearchWins(conflict);
    }
  }

  async resolveDynamoWins(conflict) {
    // Get artist from DynamoDB and sync to OpenSearch
    const dynamoArtist = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `ARTIST#${conflict.artistId}`,
        SK: 'PROFILE'
      }
    }).promise();
    
    if (dynamoArtist.Item) {
      await this.syncArtistToOpenSearch(dynamoArtist.Item);
    }
  }

  async resolveOpenSearchWins(conflict) {
    // Get document from OpenSearch and sync to DynamoDB
    const osDoc = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_doc/${conflict.artistId}`);
    
    if (osDoc._source) {
      await this.syncDocumentToDynamoDB(osDoc._source);
    }
  }

  async getDynamoArtists() {
    let items = [];
    let lastEvaluatedKey = null;
    
    do {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: { ':pk': 'ARTIST#' },
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

  printConflicts(conflicts) {
    console.log('\n⚠️  Data Conflicts:');
    console.log('┌─────────────────┬─────────────────────┬─────────────────────────────────────┐');
    console.log('│ Artist ID       │ Conflict Type       │ Details                             │');
    console.log('├─────────────────┼─────────────────────┼─────────────────────────────────────┤');
    
    conflicts.slice(0, 10).forEach(conflict => {
      let details = '';
      if (conflict.type === 'data_mismatch') {
        details = `Hash mismatch: ${conflict.dynamoHash.slice(0, 8)}.../${conflict.osHash.slice(0, 8)}...`;
      } else {
        details = conflict.type.replace(/_/g, ' ');
      }
      
      console.log(`│ ${conflict.artistId.padEnd(15)} │ ${conflict.type.padEnd(19)} │ ${details.padEnd(35)} │`);
    });
    
    console.log('└─────────────────┴─────────────────────┴─────────────────────────────────────┘');
    
    if (conflicts.length > 10) {
      console.log(`... and ${conflicts.length - 10} more conflicts`);
    }
  }

  async createSyncPoint(name) {
    console.log(`📸 Creating sync point: ${name}`);
    
    try {
      const syncPoint = {
        name: name,
        timestamp: new Date().toISOString(),
        dynamoCount: 0,
        osCount: 0,
        hash: ''
      };
      
      // Count items in both sources
      const dynamoResult = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: { ':pk': 'ARTIST#' },
        Select: 'COUNT'
      }).promise();
      
      const osResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_count`);
      
      syncPoint.dynamoCount = dynamoResult.Count;
      syncPoint.osCount = osResult.count;
      
      // Create a hash of the current state
      const stateData = {
        dynamoCount: syncPoint.dynamoCount,
        osCount: syncPoint.osCount,
        timestamp: syncPoint.timestamp
      };
      syncPoint.hash = crypto.createHash('md5').update(JSON.stringify(stateData)).digest('hex');
      
      // Save sync point
      const filename = `sync-point-${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      fs.writeFileSync(filename, JSON.stringify(syncPoint, null, 2));
      
      console.log(`✅ Sync point created: ${filename}`);
      return syncPoint;
      
    } catch (error) {
      console.error('❌ Failed to create sync point:', error.message);
      throw error;
    }
  }

  async validateSyncPoint(filename) {
    console.log(`🔍 Validating sync point: ${filename}`);
    
    try {
      if (!fs.existsSync(filename)) {
        throw new Error(`Sync point file not found: ${filename}`);
      }
      
      const syncPoint = JSON.parse(fs.readFileSync(filename, 'utf8'));
      
      // Get current counts
      const dynamoResult = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: { ':pk': 'ARTIST#' },
        Select: 'COUNT'
      }).promise();
      
      const osResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_count`);
      
      const currentCounts = {
        dynamo: dynamoResult.Count,
        opensearch: osResult.count
      };
      
      const syncPointCounts = {
        dynamo: syncPoint.dynamoCount,
        opensearch: syncPoint.osCount
      };
      
      console.log('\n📊 Sync Point Validation:');
      console.log(`  • Sync Point: ${syncPoint.name} (${syncPoint.timestamp})`);
      console.log(`  • DynamoDB: ${syncPointCounts.dynamo} → ${currentCounts.dynamo} (${currentCounts.dynamo - syncPointCounts.dynamo >= 0 ? '+' : ''}${currentCounts.dynamo - syncPointCounts.dynamo})`);
      console.log(`  • OpenSearch: ${syncPointCounts.opensearch} → ${currentCounts.opensearch} (${currentCounts.opensearch - syncPointCounts.opensearch >= 0 ? '+' : ''}${currentCounts.opensearch - syncPointCounts.opensearch})`);
      
      const isValid = currentCounts.dynamo === currentCounts.opensearch;
      console.log(`  • Status: ${isValid ? '✅ Consistent' : '❌ Inconsistent'}`);
      
      return {
        valid: isValid,
        syncPoint: syncPointCounts,
        current: currentCounts
      };
      
    } catch (error) {
      console.error('❌ Sync point validation failed:', error.message);
      throw error;
    }
  }

  printStats() {
    console.log('\n📈 Sync Statistics:');
    console.log('┌─────────────┬─────────┐');
    console.log('│ Operation   │ Count   │');
    console.log('├─────────────┼─────────┤');
    console.log(`│ Synced      │ ${this.stats.synced.toString().padStart(7)} │`);
    console.log(`│ Conflicts   │ ${this.stats.conflicts.toString().padStart(7)} │`);
    console.log(`│ Skipped     │ ${this.stats.skipped.toString().padStart(7)} │`);
    console.log(`│ Failed      │ ${this.stats.failed.toString().padStart(7)} │`);
    console.log('└─────────────┴─────────┘');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const syncUtility = new DataSyncUtility();

  try {
    switch (command) {
      case 'dynamo-to-os':
        await syncUtility.syncDynamoDBToOpenSearch();
        break;
        
      case 'os-to-dynamo':
        await syncUtility.syncOpenSearchToDynamoDB();
        break;
        
      case 'detect-conflicts':
        await syncUtility.detectConflicts();
        break;
        
      case 'resolve-conflicts':
        const strategy = args[1] || 'latest';
        await syncUtility.resolveConflicts(strategy);
        break;
        
      case 'sync-point':
        const pointName = args[1];
        if (!pointName) {
          throw new Error('Sync point name is required');
        }
        await syncUtility.createSyncPoint(pointName);
        break;
        
      case 'validate-sync-point':
        const filename = args[1];
        if (!filename) {
          throw new Error('Sync point filename is required');
        }
        await syncUtility.validateSyncPoint(filename);
        break;
        
      default:
        console.log('🔄 Data Sync Utility Usage:');
        console.log('  node data-sync-utility.js dynamo-to-os                    - Sync DynamoDB to OpenSearch');
        console.log('  node data-sync-utility.js os-to-dynamo                    - Sync OpenSearch to DynamoDB');
        console.log('  node data-sync-utility.js detect-conflicts                - Detect data conflicts');
        console.log('  node data-sync-utility.js resolve-conflicts [strategy]    - Resolve conflicts');
        console.log('  node data-sync-utility.js sync-point <name>               - Create sync point');
        console.log('  node data-sync-utility.js validate-sync-point <file>      - Validate sync point');
        console.log('\nConflict Resolution Strategies:');
        console.log('  • latest (default) - Use most recently updated data');
        console.log('  • dynamo_wins      - DynamoDB data takes precedence');
        console.log('  • opensearch_wins  - OpenSearch data takes precedence');
        console.log('\nExample:');
        console.log('  node data-sync-utility.js resolve-conflicts latest');
        process.exit(1);
    }
    
    syncUtility.printStats();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Sync operation failed:', error.message);
    syncUtility.printStats();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataSyncUtility;