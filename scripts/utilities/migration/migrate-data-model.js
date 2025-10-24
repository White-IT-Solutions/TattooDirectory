#!/usr/bin/env node

/**
 * Data Model Migration Script
 * 
 * This script migrates existing data from the current format to the LLD-compliant format:
 * - Changes SK from "PROFILE" to "METADATA"
 * - Updates GSI key structures to match LLD specification
 * - Adds sharding to GSI1 keys
 * - Normalizes artist names for GSI2
 */

const AWS = require('aws-sdk');

// Simple logger for migration script
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

class DataModelMigrator {
    constructor() {
        // Configure for LocalStack
        const isLocal = process.env.NODE_ENV !== 'production';
        
        const config = {
            region: process.env.AWS_REGION || 'eu-west-2',
        };
        
        if (isLocal) {
            config.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
            config.accessKeyId = 'test';
            config.secretAccessKey = 'test';
        }
        
        this.dynamodb = new AWS.DynamoDB.DocumentClient(config);
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
        this.batchSize = 25; // DynamoDB batch write limit
        
        logger.info(`Configured for ${isLocal ? 'LocalStack' : 'AWS'} with table: ${this.tableName}`);
    }

    /**
     * Scan all artist records that need migration
     */
    async scanArtistRecords() {
        const params = {
            TableName: this.tableName,
            FilterExpression: 'begins_with(PK, :artistPrefix) AND (SK = :profileSK)',
            ExpressionAttributeValues: {
                ':artistPrefix': 'ARTIST#',
                ':profileSK': 'PROFILE'
            }
        };

        const items = [];
        let lastEvaluatedKey = null;

        do {
            if (lastEvaluatedKey) {
                params.ExclusiveStartKey = lastEvaluatedKey;
            }

            const result = await this.dynamodb.scan(params).promise();
            items.push(...result.Items);
            lastEvaluatedKey = result.LastEvaluatedKey;

            logger.info(`Scanned ${result.Items.length} items, total: ${items.length}`);
        } while (lastEvaluatedKey);

        return items;
    }

    /**
     * Generate LLD-compliant GSI keys for an artist
     */
    generateLLDKeys(artist) {
        const { artistId, artistName, instagramHandle, styles, geohash } = artist;
        
        const keys = {};
        
        // GSI1: Style-geohash index with sharding
        if (styles && styles.length > 0 && geohash) {
            const primaryStyle = styles[0];
            const shard = Math.floor(Math.random() * 10);
            keys.gsi1pk = `STYLE#${primaryStyle.toLowerCase()}#SHARD#${shard}`;
            keys.gsi1sk = `GEOHASH#${geohash}#ARTIST#${artistId}`;
        }
        
        // GSI2: Artist name index
        if (artistName) {
            const normalizedName = artistName.toLowerCase().replace(/[^a-z0-9]/g, '');
            keys.gsi2pk = `ARTISTNAME#${normalizedName}`;
            keys.gsi2sk = `ARTIST#${artistId}`;
        }
        
        // GSI3: Instagram index
        if (instagramHandle) {
            const handle = instagramHandle.replace('@', '').toLowerCase();
            keys.gsi3pk = `INSTAGRAM#${handle}`;
        }
        
        return keys;
    }

    /**
     * Migrate a single artist record
     */
    migrateArtistRecord(artist) {
        const newKeys = this.generateLLDKeys(artist);
        
        return {
            ...artist,
            SK: 'METADATA', // Change from PROFILE to METADATA
            ...newKeys,
            updatedAt: new Date().toISOString(),
            // Add migration metadata
            migrationVersion: '1.0',
            migratedAt: new Date().toISOString()
        };
    }

    /**
     * Batch write migrated records
     */
    async batchWriteRecords(records) {
        const batches = [];
        for (let i = 0; i < records.length; i += this.batchSize) {
            batches.push(records.slice(i, i + this.batchSize));
        }

        for (const [index, batch] of batches.entries()) {
            const requestItems = batch.map(record => ({
                PutRequest: {
                    Item: record
                }
            }));

            const params = {
                RequestItems: {
                    [this.tableName]: requestItems
                }
            };

            try {
                await this.dynamodb.batchWrite(params).promise();
                logger.info(`Batch ${index + 1}/${batches.length} written successfully (${batch.length} items)`);
            } catch (error) {
                logger.error(`Failed to write batch ${index + 1}:`, error);
                throw error;
            }
        }
    }

    /**
     * Delete old records with PROFILE SK
     */
    async deleteOldRecords(originalRecords) {
        const batches = [];
        for (let i = 0; i < originalRecords.length; i += this.batchSize) {
            batches.push(originalRecords.slice(i, i + this.batchSize));
        }

        for (const [index, batch] of batches.entries()) {
            const requestItems = batch.map(record => ({
                DeleteRequest: {
                    Key: {
                        PK: record.PK,
                        SK: record.SK
                    }
                }
            }));

            const params = {
                RequestItems: {
                    [this.tableName]: requestItems
                }
            };

            try {
                await this.dynamodb.batchWrite(params).promise();
                logger.info(`Deleted batch ${index + 1}/${batches.length} (${batch.length} old records)`);
            } catch (error) {
                logger.error(`Failed to delete batch ${index + 1}:`, error);
                throw error;
            }
        }
    }

    /**
     * Run the complete migration
     */
    async migrate() {
        try {
            logger.info('Starting data model migration...');
            
            // 1. Scan existing records
            logger.info('Scanning existing artist records...');
            const originalRecords = await this.scanArtistRecords();
            logger.info(`Found ${originalRecords.length} records to migrate`);

            if (originalRecords.length === 0) {
                logger.info('No records found to migrate');
                return;
            }

            // 2. Migrate records
            logger.info('Migrating records to LLD format...');
            const migratedRecords = originalRecords.map(record => this.migrateArtistRecord(record));

            // 3. Write migrated records
            logger.info('Writing migrated records...');
            await this.batchWriteRecords(migratedRecords);

            // 4. Delete old records
            logger.info('Deleting old records...');
            await this.deleteOldRecords(originalRecords);

            logger.info('Migration completed successfully!');
            logger.info(`Migrated ${originalRecords.length} artist records`);

        } catch (error) {
            logger.error('Migration failed:', error);
            throw error;
        }
    }

    /**
     * Validate migration results
     */
    async validateMigration() {
        try {
            logger.info('Validating migration results...');

            // Check for any remaining PROFILE records
            const profileRecords = await this.dynamodb.scan({
                TableName: this.tableName,
                FilterExpression: 'begins_with(PK, :artistPrefix) AND SK = :profileSK',
                ExpressionAttributeValues: {
                    ':artistPrefix': 'ARTIST#',
                    ':profileSK': 'PROFILE'
                }
            }).promise();

            if (profileRecords.Items.length > 0) {
                logger.warn(`Found ${profileRecords.Items.length} unmigrated PROFILE records`);
                return false;
            }

            // Check for METADATA records
            const metadataRecords = await this.dynamodb.scan({
                TableName: this.tableName,
                FilterExpression: 'begins_with(PK, :artistPrefix) AND SK = :metadataSK',
                ExpressionAttributeValues: {
                    ':artistPrefix': 'ARTIST#',
                    ':metadataSK': 'METADATA'
                }
            }).promise();

            logger.info(`Found ${metadataRecords.Items.length} migrated METADATA records`);

            // Validate GSI key formats
            let validGSI1 = 0, validGSI2 = 0, validGSI3 = 0;
            
            for (const record of metadataRecords.Items) {
                if (record.gsi1pk && record.gsi1pk.includes('#SHARD#') && record.gsi1sk && record.gsi1sk.startsWith('GEOHASH#')) {
                    validGSI1++;
                }
                if (record.gsi2pk && record.gsi2pk.startsWith('ARTISTNAME#') && record.gsi2sk && record.gsi2sk.startsWith('ARTIST#')) {
                    validGSI2++;
                }
                if (record.gsi3pk && record.gsi3pk.startsWith('INSTAGRAM#')) {
                    validGSI3++;
                }
            }

            logger.info(`GSI validation: GSI1=${validGSI1}, GSI2=${validGSI2}, GSI3=${validGSI3} valid records`);

            return profileRecords.Items.length === 0 && metadataRecords.Items.length > 0;

        } catch (error) {
            logger.error('Validation failed:', error);
            return false;
        }
    }
}

// CLI execution
async function main() {
    const migrator = new DataModelMigrator();
    
    const command = process.argv[2];
    
    try {
        switch (command) {
            case 'migrate':
                await migrator.migrate();
                break;
            case 'validate':
                const isValid = await migrator.validateMigration();
                process.exit(isValid ? 0 : 1);
                break;
            default:
                console.log('Usage: node migrate-data-model.js [migrate|validate]');
                console.log('  migrate  - Run the data migration');
                console.log('  validate - Validate migration results');
                process.exit(1);
        }
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { DataModelMigrator };