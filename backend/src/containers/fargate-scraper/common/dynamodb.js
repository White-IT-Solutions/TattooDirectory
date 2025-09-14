/**
 * DynamoDB Data Access Layer (CommonJS version)
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

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
    DynamoDBDocumentClient, 
    PutCommand, 
    GetCommand, 
    QueryCommand, 
    UpdateCommand, 
    DeleteCommand,
    BatchWriteCommand 
} = require('@aws-sdk/lib-dynamodb');

const { logger } = require('./logger');

// Initialize DynamoDB client
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-2'
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'TattooDirectory';

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

module.exports = {
    // Key generation functions
    generateArtistKeys,
    generateStyleGeohashKeys,
    generateArtistNameKeys,
    generateInstagramKeys,
    generateAllGSIKeys,
    createArtistItem,
    
    // CRUD operations
    updateArtist,
    
    // Constants
    TABLE_NAME
};