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
const s3 = new AWS.S3();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || defaultEndpoint;
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'artists-local';
const BACKUP_BUCKET = process.env.BACKUP_BUCKET || 'tattoo-directory-backups';

class DataManager {
  constructor() {
    this.stats = {
      exported: 0,
      imported: 0,
      backed_up: 0,
      restored: 0,
      validated: 0,
      failed: 0
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

  async ensureBackupBucket() {
    try {
      await s3.headBucket({ Bucket: BACKUP_BUCKET }).promise();
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`📦 Creating backup bucket: ${BACKUP_BUCKET}`);
        await s3.createBucket({ Bucket: BACKUP_BUCKET }).promise();
      } else {
        throw error;
      }
    }
  }

  async exportData(outputPath = './exports') {
    console.log('📤 Exporting data from LocalStack...');
    
    try {
      // Create export directory
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportDir = path.join(outputPath, `export-${timestamp}`);
      fs.mkdirSync(exportDir, { recursive: true });

      // Export DynamoDB data
      await this.exportDynamoDBData(exportDir);
      
      // Export OpenSearch data
      await this.exportOpenSearchData(exportDir);
      
      // Create export manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: ['dynamodb', 'opensearch'],
        stats: this.stats
      };
      
      fs.writeFileSync(
        path.join(exportDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log(`✅ Data exported to: ${exportDir}`);
      return exportDir;
      
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      throw error;
    }
  }

  async exportDynamoDBData(exportDir) {
    console.log('📊 Exporting DynamoDB data...');
    
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
      
      // Group items by type
      const groupedData = {
        artists: items.filter(item => item.PK.startsWith('ARTIST#')),
        studios: items.filter(item => item.PK.startsWith('STUDIO#')),
        styles: items.filter(item => item.PK.startsWith('STYLE#'))
      };
      
      // Write grouped data files
      for (const [type, data] of Object.entries(groupedData)) {
        const filename = path.join(exportDir, `${type}.json`);
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`✅ Exported ${data.length} ${type} records`);
        this.stats.exported += data.length;
      }
      
    } catch (error) {
      console.error('❌ DynamoDB export failed:', error.message);
      throw error;
    }
  }

  async exportOpenSearchData(exportDir) {
    console.log('🔍 Exporting OpenSearch data...');
    
    try {
      // Get all documents from OpenSearch
      const searchResult = await this.makeOpenSearchRequest('GET', `/${OPENSEARCH_INDEX}/_search`, {
        query: { match_all: {} },
        size: 10000
      });
      
      const documents = searchResult.hits.hits.map(hit => ({
        _id: hit._id,
        _source: hit._source
      }));
      
      const filename = path.join(exportDir, 'opensearch_documents.json');
      fs.writeFileSync(filename, JSON.stringify(documents, null, 2));
      
      console.log(`✅ Exported ${documents.length} OpenSearch documents`);
      this.stats.exported += documents.length;
      
    } catch (error) {
      console.error('❌ OpenSearch export failed:', error.message);
      throw error;
    }
  }

  async importData(importPath) {
    console.log(`📥 Importing data from: ${importPath}`);
    
    try {
      // Validate import directory
      if (!fs.existsSync(importPath)) {
        throw new Error(`Import path does not exist: ${importPath}`);
      }

      const manifestPath = path.join(importPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Import manifest not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`📋 Import manifest version: ${manifest.version}`);

      // Import DynamoDB data
      await this.importDynamoDBData(importPath);
      
      // Import OpenSearch data
      await this.importOpenSearchData(importPath);
      
      console.log('✅ Data import completed successfully');
      
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
  }

  async importDynamoDBData(importPath) {
    console.log('📊 Importing DynamoDB data...');
    
    const dataTypes = ['artists', 'studios', 'styles'];
    
    for (const type of dataTypes) {
      const filename = path.join(importPath, `${type}.json`);
      
      if (!fs.existsSync(filename)) {
        console.log(`⚠️  No ${type} data file found, skipping`);
        continue;
      }
      
      try {
        const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
        
        // Import in batches
        const batchSize = 25;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          
          const putRequests = batch.map(item => ({
            PutRequest: { Item: item }
          }));
          
          await dynamodb.batchWrite({
            RequestItems: {
              [TABLE_NAME]: putRequests
            }
          }).promise();
          
          this.stats.imported += putRequests.length;
        }
        
        console.log(`✅ Imported ${data.length} ${type} records`);
        
      } catch (error) {
        console.error(`❌ Failed to import ${type}:`, error.message);
        this.stats.failed++;
      }
    }
  }

  async importOpenSearchData(importPath) {
    console.log('🔍 Importing OpenSearch data...');
    
    const filename = path.join(importPath, 'opensearch_documents.json');
    
    if (!fs.existsSync(filename)) {
      console.log('⚠️  No OpenSearch data file found, skipping');
      return;
    }
    
    try {
      const documents = JSON.parse(fs.readFileSync(filename, 'utf8'));
      
      for (const doc of documents) {
        await this.makeOpenSearchRequest(
          'PUT',
          `/${OPENSEARCH_INDEX}/_doc/${doc._id}`,
          doc._source
        );
        this.stats.imported++;
      }
      
      // Refresh index
      await this.makeOpenSearchRequest('POST', `/${OPENSEARCH_INDEX}/_refresh`);
      
      console.log(`✅ Imported ${documents.length} OpenSearch documents`);
      
    } catch (error) {
      console.error('❌ OpenSearch import failed:', error.message);
      this.stats.failed++;
    }
  }

  async backupData(backupName = null) {
    console.log('💾 Creating data backup...');
    
    try {
      await this.ensureBackupBucket();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupKey = backupName || `backup-${timestamp}`;
      
      // Export data to temporary directory
      const tempDir = path.join(__dirname, 'temp-backup');
      const exportDir = await this.exportData(tempDir);
      
      // Create backup archive and upload to S3
      const archivePath = `${exportDir}.tar.gz`;
      await this.createArchive(exportDir, archivePath);
      
      const archiveData = fs.readFileSync(archivePath);
      await s3.putObject({
        Bucket: BACKUP_BUCKET,
        Key: `${backupKey}.tar.gz`,
        Body: archiveData,
        ContentType: 'application/gzip'
      }).promise();
      
      // Cleanup temporary files
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.unlinkSync(archivePath);
      
      console.log(`✅ Backup created: ${backupKey}.tar.gz`);
      this.stats.backed_up++;
      
      return backupKey;
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async restoreData(backupKey) {
    console.log(`🔄 Restoring data from backup: ${backupKey}`);
    
    try {
      await this.ensureBackupBucket();
      
      // Download backup from S3
      const backupObject = await s3.getObject({
        Bucket: BACKUP_BUCKET,
        Key: `${backupKey}.tar.gz`
      }).promise();
      
      // Extract backup
      const tempDir = path.join(__dirname, 'temp-restore');
      const archivePath = path.join(tempDir, `${backupKey}.tar.gz`);
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(archivePath, backupObject.Body);
      await this.extractArchive(archivePath, tempDir);
      
      // Find extracted directory
      const extractedDir = fs.readdirSync(tempDir)
        .find(name => name.startsWith('export-') && fs.statSync(path.join(tempDir, name)).isDirectory());
      
      if (!extractedDir) {
        throw new Error('Extracted backup directory not found');
      }
      
      // Import the restored data
      await this.importData(path.join(tempDir, extractedDir));
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      console.log('✅ Data restoration completed successfully');
      this.stats.restored++;
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  async createArchive(sourceDir, archivePath) {
    // Simple tar.gz creation using Node.js (for cross-platform compatibility)
    const { execSync } = require('child_process');
    const command = process.platform === 'win32' 
      ? `powershell Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${archivePath.replace('.tar.gz', '.zip')}"`
      : `tar -czf "${archivePath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`;
    
    execSync(command);
  }

  async extractArchive(archivePath, extractDir) {
    const { execSync } = require('child_process');
    const command = process.platform === 'win32'
      ? `powershell Expand-Archive -Path "${archivePath}" -DestinationPath "${extractDir}"`
      : `tar -xzf "${archivePath}" -C "${extractDir}"`;
    
    execSync(command);
  }

  async listBackups() {
    console.log('📋 Listing available backups...');
    
    try {
      await this.ensureBackupBucket();
      
      const result = await s3.listObjects({
        Bucket: BACKUP_BUCKET,
        Prefix: 'backup-'
      }).promise();
      
      const backups = result.Contents.map(obj => ({
        key: obj.Key.replace('.tar.gz', ''),
        size: obj.Size,
        lastModified: obj.LastModified
      }));
      
      console.log('\n📦 Available Backups:');
      console.log('┌─────────────────────────┬──────────┬─────────────────────┐');
      console.log('│ Backup Key              │ Size     │ Created             │');
      console.log('├─────────────────────────┼──────────┼─────────────────────┤');
      
      backups.forEach(backup => {
        const sizeKB = Math.round(backup.size / 1024);
        const date = backup.lastModified.toISOString().slice(0, 19).replace('T', ' ');
        console.log(`│ ${backup.key.padEnd(23)} │ ${(sizeKB + 'KB').padStart(8)} │ ${date} │`);
      });
      
      console.log('└─────────────────────────┴──────────┴─────────────────────┘');
      
      return backups;
      
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      throw error;
    }
  }

  printStats() {
    console.log('\n📈 Data Management Statistics:');
    console.log('┌─────────────┬─────────┐');
    console.log('│ Operation   │ Count   │');
    console.log('├─────────────┼─────────┤');
    console.log(`│ Exported    │ ${this.stats.exported.toString().padStart(7)} │`);
    console.log(`│ Imported    │ ${this.stats.imported.toString().padStart(7)} │`);
    console.log(`│ Backed Up   │ ${this.stats.backed_up.toString().padStart(7)} │`);
    console.log(`│ Restored    │ ${this.stats.restored.toString().padStart(7)} │`);
    console.log(`│ Validated   │ ${this.stats.validated.toString().padStart(7)} │`);
    console.log(`│ Failed      │ ${this.stats.failed.toString().padStart(7)} │`);
    console.log('└─────────────┴─────────┘');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const dataManager = new DataManager();

  try {
    switch (command) {
      case 'export':
        const exportPath = args[1] || './exports';
        await dataManager.exportData(exportPath);
        break;
        
      case 'import':
        const importPath = args[1];
        if (!importPath) {
          throw new Error('Import path is required');
        }
        await dataManager.importData(importPath);
        break;
        
      case 'backup':
        const backupName = args[1];
        await dataManager.backupData(backupName);
        break;
        
      case 'restore':
        const backupKey = args[1];
        if (!backupKey) {
          throw new Error('Backup key is required');
        }
        await dataManager.restoreData(backupKey);
        break;
        
      case 'list-backups':
        await dataManager.listBackups();
        break;
        
      default:
        console.log('📋 Data Manager Usage:');
        console.log('  node data-manager.js export [path]');
        console.log('  node data-manager.js import <path>');
        console.log('  node data-manager.js backup [name]');
        console.log('  node data-manager.js restore <backup-key>');
        console.log('  node data-manager.js list-backups');
        process.exit(1);
    }
    
    dataManager.printStats();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    dataManager.printStats();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataManager;