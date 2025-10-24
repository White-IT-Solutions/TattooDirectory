const AWS = require('aws-sdk');
const http = require('http');

// Configure AWS SDK for LocalStack
AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localstack:4566',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  s3ForcePathStyle: true
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || 'http://localhost:4571';
const OPENSEARCH_INDEX = 'tattoo-artists';

class DataCleaner {
  constructor() {
    this.stats = {
      dynamodb: { deleted: 0, failed: 0 },
      opensearch: { deleted: 0, failed: 0 }
    };
  }

  makeOpenSearchRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, OPENSEARCH_ENDPOINT);
      const options = {
        hostname: url.hostname,
        port: url.port || 4566,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
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

  async cleanDynamoDB() {
    console.log('🧹 Cleaning DynamoDB data...');
    
    try {
      // Scan all items
      const scanParams = {
        TableName: TABLE_NAME
      };
      
      let items = [];
      let lastEvaluatedKey = null;
      
      do {
        if (lastEvaluatedKey) {
          scanParams.ExclusiveStartKey = lastEvaluatedKey;
        }
        
        const result = await dynamodb.scan(scanParams).promise();
        items = items.concat(result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
        
      } while (lastEvaluatedKey);
      
      console.log(`📊 Found ${items.length} items to delete`);
      
      // Delete items in batches
      const batchSize = 25; // DynamoDB batch write limit
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
        
        try {
          await dynamodb.batchWrite({
            RequestItems: {
              [TABLE_NAME]: deleteRequests
            }
          }).promise();
          
          this.stats.dynamodb.deleted += deleteRequests.length;
          console.log(`✅ Deleted batch of ${deleteRequests.length} items`);
          
        } catch (error) {
          console.error(`❌ Failed to delete batch:`, error.message);
          this.stats.dynamodb.failed += deleteRequests.length;
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to clean DynamoDB:', error.message);
      throw error;
    }
  }

  async cleanOpenSearch() {
    console.log('🧹 Cleaning OpenSearch data...');
    
    try {
      // Check if index exists
      try {
        await this.makeOpenSearchRequest('HEAD', `/${OPENSEARCH_INDEX}`);
        
        // Delete the entire index
        await this.makeOpenSearchRequest('DELETE', `/${OPENSEARCH_INDEX}`);
        console.log('✅ OpenSearch index deleted successfully');
        this.stats.opensearch.deleted = 1;
        
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('📋 OpenSearch index does not exist, nothing to clean');
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to clean OpenSearch:', error.message);
      this.stats.opensearch.failed = 1;
      throw error;
    }
  }

  async validateCleaning() {
    console.log('🔍 Validating data cleanup...');
    
    try {
      // Check DynamoDB
      const scanResult = await dynamodb.scan({
        TableName: TABLE_NAME,
        Select: 'COUNT'
      }).promise();
      
      console.log(`📊 DynamoDB items remaining: ${scanResult.Count}`);
      
      // Check OpenSearch
      try {
        const searchResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_count`);
        console.log(`📊 OpenSearch documents remaining: ${searchResult.count}`);
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('📊 OpenSearch index does not exist (successfully cleaned)');
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to validate cleanup:', error.message);
      throw error;
    }
  }

  printStats() {
    console.log('\n📈 Cleanup Statistics:');
    console.log('┌─────────────┬─────────┬────────┐');
    console.log('│ Service     │ Deleted │ Failed │');
    console.log('├─────────────┼─────────┼────────┤');
    console.log(`│ DynamoDB    │ ${this.stats.dynamodb.deleted.toString().padStart(7)} │ ${this.stats.dynamodb.failed.toString().padStart(6)} │`);
    console.log(`│ OpenSearch  │ ${this.stats.opensearch.deleted.toString().padStart(7)} │ ${this.stats.opensearch.failed.toString().padStart(6)} │`);
    console.log('└─────────────┴─────────┴────────┘');
  }

  async run() {
    try {
      console.log('🧹 Starting data cleanup process...');
      
      await this.cleanDynamoDB();
      await this.cleanOpenSearch();
      await this.validateCleaning();
      
      this.printStats();
      
      console.log('\n✅ Data cleanup completed successfully!');
      process.exit(0);
      
    } catch (error) {
      console.error('\n❌ Data cleanup failed:', error.message);
      this.printStats();
      process.exit(1);
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const cleaner = new DataCleaner();
  cleaner.run();
}

module.exports = DataCleaner;