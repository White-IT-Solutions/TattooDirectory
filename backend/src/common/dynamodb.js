/**
 * DynamoDB Data Access Layer
 * 
 * This module provides functions for correct key generation and data access
 * operations following the single-table design pattern specified in the LLD.
 * 
 * Key Structure:
 * - PK: ARTIST#{artistId}
 * - SK: METADATA | IMAGE#{imageId} | STYLE#{styleName}
 * - GSI1: style-geohash-index (gsi1pk, gsi1sk)
 * - GSI2: artist-name-index (gsi2pk, gsi2sk)  
 * - GSI3: instagram-index (gsi3pk)
 */

import { 
    PutCommand, 
    GetCommand, 
    QueryCommand, 
    UpdateCommand, 
    DeleteCommand,
    BatchWriteCommand 
} from '@aws-sdk/lib-dynamodb';

import { createDynamoDBDocumentClient, getTableName } from './aws-config.js';
import logger from './logger.js';

// Initialize DynamoDB client using aws-config
const docClient = createDynamoDBDocumentClient();
const TABLE_NAME = getTableName();

/**
 * Generate primary keys for an artist
 * @param {string} artistId - Unique artist identifier
 * @returns {Object} Primary key structure
 */
function generateArtistKeys(artistId) {
    if (!artistId) {
        throw new Error('artistId is required for key generation');
    }
    
    return {
        PK: `ARTIST#${artistId}`,
        SK: 'METADATA'
    };
}

/**
 * Generate GSI keys for style-geohash index (GSI1)
 * @param {string} style - Tattoo style (e.g., 'traditional', 'realism')
 * @param {string} geohash - Geographic hash for location
 * @param {string} artistId - Unique artist identifier
 * @param {number} shardNumber - Random shard number (0-9) for load distribution
 * @returns {Object} GSI1 key structure
 */
function generateStyleGeohashKeys(style, geohash, artistId, shardNumber = null) {
    if (!style || !geohash || !artistId) {
        throw new Error('style, geohash, and artistId are required for GSI1 key generation');
    }
    
    // Generate random shard number if not provided (0-9)
    const shard = shardNumber !== null ? shardNumber : Math.floor(Math.random() * 10);
    
    return {
        gsi1pk: `STYLE#${style.toLowerCase()}#SHARD#${shard}`,
        gsi1sk: `GEOHASH#${geohash}#ARTIST#${artistId}`
    };
}

/**
 * Generate GSI keys for artist name index (GSI2)
 * @param {string} artistName - Artist's full name
 * @param {string} artistId - Unique artist identifier
 * @returns {Object} GSI2 key structure
 */
function generateArtistNameKeys(artistName, artistId) {
    if (!artistName || !artistId) {
        throw new Error('artistName and artistId are required for GSI2 key generation');
    }
    
    // Normalize name: lowercase, remove spaces and special characters
    const normalizedName = artistName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
    
    return {
        gsi2pk: `ARTISTNAME#${normalizedName}`,
        gsi2sk: `ARTIST#${artistId}`
    };
}

/**
 * Generate GSI keys for Instagram index (GSI3)
 * @param {string} instagramHandle - Instagram handle (without @)
 * @returns {Object} GSI3 key structure
 */
function generateInstagramKeys(instagramHandle) {
    if (!instagramHandle) {
        throw new Error('instagramHandle is required for GSI3 key generation');
    }
    
    // Remove @ symbol if present and normalize to lowercase
    const handle = instagramHandle.replace('@', '').toLowerCase();
    
    return {
        gsi3pk: `INSTAGRAM#${handle}`
    };
}

/**
 * Generate all GSI keys for an artist
 * @param {Object} artistData - Artist data object
 * @returns {Object} All GSI keys combined
 */
function generateAllGSIKeys(artistData) {
    const { artistId, artistName, instagramHandle, styles, geohash } = artistData;
    
    if (!artistId || !artistName) {
        throw new Error('artistId and artistName are required');
    }
    
    const gsiKeys = {};
    
    // GSI2: Artist name index (always present)
    Object.assign(gsiKeys, generateArtistNameKeys(artistName, artistId));
    
    // GSI3: Instagram index (if handle provided)
    if (instagramHandle) {
        Object.assign(gsiKeys, generateInstagramKeys(instagramHandle));
    }
    
    // GSI1: Style-geohash index (if style and geohash provided)
    if (styles && styles.length > 0 && geohash) {
        // Use the primary style for GSI1 key generation
        const primaryStyle = styles[0];
        Object.assign(gsiKeys, generateStyleGeohashKeys(primaryStyle, geohash, artistId));
    }
    
    return gsiKeys;
}

/**
 * Create a complete artist item with all required keys
 * @param {Object} artistData - Artist data object
 * @returns {Object} Complete DynamoDB item
 */
function createArtistItem(artistData) {
    const {
        artistId,
        artistName,
        instagramHandle,
        geohash,
        locationDisplay,
        styles = [],
        portfolioImages = [],
        contactInfo = {},
        createdAt = new Date().toISOString(),
        updatedAt = new Date().toISOString()
    } = artistData;
    
    if (!artistId || !artistName) {
        throw new Error('artistId and artistName are required');
    }
    
    // Generate primary keys
    const primaryKeys = generateArtistKeys(artistId);
    
    // Generate all GSI keys
    const gsiKeys = generateAllGSIKeys(artistData);
    
    return {
        ...primaryKeys,
        ...gsiKeys,
        artistName,
        instagramHandle,
        geohash,
        locationDisplay,
        styles,
        portfolioImages,
        contactInfo,
        createdAt,
        updatedAt,
        // Add item type for easier querying
        itemType: 'ARTIST_METADATA'
    };
}

/**
 * Put an artist record into DynamoDB
 * @param {Object} artistData - Artist data object
 * @returns {Promise<Object>} DynamoDB response
 */
async function putArtist(artistData) {
    try {
        const item = createArtistItem(artistData);
        
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            // Prevent overwriting existing items
            ConditionExpression: 'attribute_not_exists(PK)'
        });
        
        const result = await docClient.send(command);
        
        logger.info('Artist created successfully', {
            artistId: artistData.artistId,
            artistName: artistData.artistName
        });
        
        return result;
    } catch (error) {
        logger.error('Failed to create artist', {
            error: error.message,
            artistId: artistData.artistId
        });
        throw error;
    }
}

/**
 * Get an artist by ID
 * @param {string} artistId - Unique artist identifier
 * @returns {Promise<Object|null>} Artist data or null if not found
 */
async function getArtist(artistId) {
    try {
        const keys = generateArtistKeys(artistId);
        
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: keys
        });
        
        const result = await docClient.send(command);
        
        if (!result.Item) {
            logger.info('Artist not found', { artistId });
            return null;
        }
        
        logger.info('Artist retrieved successfully', { artistId });
        return result.Item;
    } catch (error) {
        logger.error('Failed to get artist', {
            error: error.message,
            artistId
        });
        throw error;
    }
}

/**
 * Update an artist record
 * @param {string} artistId - Unique artist identifier
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated artist data
 */
async function updateArtist(artistId, updates) {
    try {
        const keys = generateArtistKeys(artistId);
        
        // Build update expression dynamically
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        
        // Always update the updatedAt timestamp
        updates.updatedAt = new Date().toISOString();
        
        Object.keys(updates).forEach((key, index) => {
            const attrName = `#attr${index}`;
            const attrValue = `:val${index}`;
            
            updateExpressions.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = updates[key];
        });
        
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: keys,
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        });
        
        const result = await docClient.send(command);
        
        logger.info('Artist updated successfully', { artistId });
        return result.Attributes;
    } catch (error) {
        logger.error('Failed to update artist', {
            error: error.message,
            artistId
        });
        throw error;
    }
}

/**
 * Delete an artist record
 * @param {string} artistId - Unique artist identifier
 * @returns {Promise<Object>} DynamoDB response
 */
async function deleteArtist(artistId) {
    try {
        const keys = generateArtistKeys(artistId);
        
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: keys
        });
        
        const result = await docClient.send(command);
        
        logger.info('Artist deleted successfully', { artistId });
        return result;
    } catch (error) {
        logger.error('Failed to delete artist', {
            error: error.message,
            artistId
        });
        throw error;
    }
}

/**
 * Search artists by style and location using GSI1
 * @param {string} style - Tattoo style to search for
 * @param {string} geohashPrefix - Geohash prefix for location filtering
 * @param {Object} options - Query options (limit, lastEvaluatedKey)
 * @returns {Promise<Object>} Query results
 */
async function searchArtistsByStyleAndLocation(style, geohashPrefix, options = {}) {
    try {
        const { limit = 20, lastEvaluatedKey } = options;
        
        // Query all shards in parallel for better performance
        const shardPromises = [];
        for (let shard = 0; shard < 10; shard++) {
            const gsi1pk = `STYLE#${style.toLowerCase()}#SHARD#${shard}`;
            
            const command = new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'style-geohash-index',
                KeyConditionExpression: 'gsi1pk = :gsi1pk AND begins_with(gsi1sk, :geohashPrefix)',
                ExpressionAttributeValues: {
                    ':gsi1pk': gsi1pk,
                    ':geohashPrefix': `GEOHASH#${geohashPrefix}`
                },
                Limit: Math.ceil(limit / 10), // Distribute limit across shards
                ExclusiveStartKey: lastEvaluatedKey
            });
            
            shardPromises.push(docClient.send(command));
        }
        
        const results = await Promise.all(shardPromises);
        
        // Combine results from all shards
        const items = results.flatMap(result => result.Items || []);
        
        logger.info('Artist search completed', {
            style,
            geohashPrefix,
            resultCount: items.length
        });
        
        return {
            Items: items.slice(0, limit), // Respect the original limit
            Count: items.length,
            ScannedCount: results.reduce((sum, result) => sum + (result.ScannedCount || 0), 0)
        };
    } catch (error) {
        logger.error('Failed to search artists by style and location', {
            error: error.message,
            style,
            geohashPrefix
        });
        throw error;
    }
}

/**
 * Find artist by name using GSI2
 * @param {string} artistName - Artist name to search for
 * @returns {Promise<Object|null>} Artist data or null if not found
 */
async function findArtistByName(artistName) {
    try {
        const { gsi2pk } = generateArtistNameKeys(artistName, 'dummy');
        
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'artist-name-index',
            KeyConditionExpression: 'gsi2pk = :gsi2pk',
            ExpressionAttributeValues: {
                ':gsi2pk': gsi2pk
            }
        });
        
        const result = await docClient.send(command);
        
        if (!result.Items || result.Items.length === 0) {
            logger.info('Artist not found by name', { artistName });
            return null;
        }
        
        // Return the first match (there should only be one)
        const artist = result.Items[0];
        logger.info('Artist found by name', { artistName, artistId: artist.PK });
        return artist;
    } catch (error) {
        logger.error('Failed to find artist by name', {
            error: error.message,
            artistName
        });
        throw error;
    }
}

/**
 * Find artist by Instagram handle using GSI3
 * @param {string} instagramHandle - Instagram handle to search for
 * @returns {Promise<Object|null>} Artist data or null if not found
 */
async function findArtistByInstagram(instagramHandle) {
    try {
        const { gsi3pk } = generateInstagramKeys(instagramHandle);
        
        const command = new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'instagram-index',
            KeyConditionExpression: 'gsi3pk = :gsi3pk',
            ExpressionAttributeValues: {
                ':gsi3pk': gsi3pk
            }
        });
        
        const result = await docClient.send(command);
        
        if (!result.Items || result.Items.length === 0) {
            logger.info('Artist not found by Instagram handle', { instagramHandle });
            return null;
        }
        
        // Return the first match (there should only be one)
        const artist = result.Items[0];
        logger.info('Artist found by Instagram handle', { 
            instagramHandle, 
            artistId: artist.PK 
        });
        return artist;
    } catch (error) {
        logger.error('Failed to find artist by Instagram handle', {
            error: error.message,
            instagramHandle
        });
        throw error;
    }
}

/**
 * Batch write multiple artist records
 * @param {Array<Object>} artistsData - Array of artist data objects
 * @returns {Promise<Object>} Batch write results
 */
async function batchPutArtists(artistsData) {
    try {
        if (!Array.isArray(artistsData) || artistsData.length === 0) {
            throw new Error('artistsData must be a non-empty array');
        }
        
        // DynamoDB batch write limit is 25 items
        const batchSize = 25;
        const batches = [];
        
        for (let i = 0; i < artistsData.length; i += batchSize) {
            batches.push(artistsData.slice(i, i + batchSize));
        }
        
        const results = [];
        
        for (const batch of batches) {
            const requestItems = batch.map(artistData => ({
                PutRequest: {
                    Item: createArtistItem(artistData)
                }
            }));
            
            const command = new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: requestItems
                }
            });
            
            const result = await docClient.send(command);
            results.push(result);
        }
        
        logger.info('Batch put artists completed', {
            totalArtists: artistsData.length,
            batchCount: batches.length
        });
        
        return results;
    } catch (error) {
        logger.error('Failed to batch put artists', {
            error: error.message,
            artistCount: artistsData.length
        });
        throw error;
    }
}

export {
    // Key generation functions
    generateArtistKeys,
    generateStyleGeohashKeys,
    generateArtistNameKeys,
    generateInstagramKeys,
    generateAllGSIKeys,
    createArtistItem,
    
    // CRUD operations
    putArtist,
    getArtist,
    updateArtist,
    deleteArtist,
    batchPutArtists,
    
    // Search operations
    searchArtistsByStyleAndLocation,
    findArtistByName,
    findArtistByInstagram,
    
    // Constants
    TABLE_NAME
};