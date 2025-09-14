/**
 * Discover Studios Handler
 * 
 * This Lambda function is responsible for discovering tattoo studios and artists
 * from various data sources (e.g., Google Maps API, directory websites).
 * It's part of the data aggregation pipeline and feeds discovered items to
 * subsequent processing steps.
 */

import { createLogger } from '../../common/logger.js';
import { generateArtistKeys, generateAllGSIKeys } from '../../common/dynamodb.js';

export const handler = async (event, context) => {
    const logger = createLogger(context, event);
    
    try {
        logger.info('Discover Studios Event received', { 
            eventType: event.source || 'unknown',
            inputCount: event.searchParams?.locations?.length || 0
        });

        // Extract search parameters from the event
        const { 
            locations = ['london', 'manchester', 'birmingham'], 
            styles = ['traditional', 'realism', 'blackwork'],
            maxResults = 50 
        } = event.searchParams || {};

        // Placeholder for studio discovery logic
        // In a real implementation, this would:
        // 1. Query Google Maps API for tattoo studios in specified locations
        // 2. Extract studio information (name, address, website, phone)
        // 3. Generate unique studio IDs and prepare data for next step
        // 4. Return structured data for the find-artists step

        const discoveredItems = [];
        
        // Simulate discovery of studios for each location and style combination
        for (const location of locations) {
            for (const style of styles) {
                // Generate mock discovered studios
                const studioCount = Math.floor(Math.random() * 5) + 1; // 1-5 studios per location/style
                
                for (let i = 0; i < studioCount; i++) {
                    const studioId = `studio-${location}-${style}-${i}`;
                    const artistId = `${studioId}-artist-${i}`;
                    
                    // Generate proper GSI keys for the discovered artist
                    const mockArtistData = {
                        artistId,
                        artistName: `Artist ${i} ${style}`,
                        instagramHandle: `artist_${location}_${style}_${i}`,
                        styles: [style],
                        geohash: generateMockGeohash(location),
                        locationDisplay: location
                    };
                    
                    // Generate all required keys for proper data structure
                    const gsiKeys = generateAllGSIKeys(mockArtistData);
                    const primaryKeys = generateArtistKeys(artistId);
                    
                    discoveredItems.push({
                        artistId,
                        studioId,
                        source: 'google_maps',
                        location,
                        style,
                        discoveryTimestamp: new Date().toISOString(),
                        // Include key structure for downstream processing
                        keys: {
                            ...primaryKeys,
                            ...gsiKeys
                        },
                        metadata: {
                            studioName: `${location} ${style} Studio ${i}`,
                            studioWebsite: `https://studio-${studioId}.com`,
                            confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0 confidence score
                        }
                    });
                }
            }
        }

        logger.info('Studio discovery completed successfully', {
            totalDiscovered: discoveredItems.length,
            locationCount: locations.length,
            styleCount: styles.length
        });

        // Return structured response for Step Functions
        return {
            statusCode: 200,
            body: 'Studios discovered successfully',
            discoveredItems,
            summary: {
                totalItems: discoveredItems.length,
                locations: locations.length,
                styles: styles.length,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        logger.error('Failed to discover studios', {
            error: error.message,
            stack: error.stack,
            eventData: event
        });

        // Return error response that Step Functions can handle
        return {
            statusCode: 500,
            body: 'Studio discovery failed',
            error: {
                message: error.message,
                type: 'DISCOVERY_ERROR',
                timestamp: new Date().toISOString()
            }
        };
    }
};

/**
 * Generate a mock geohash for a given location
 * In a real implementation, this would use actual coordinates
 * @param {string} location - Location name
 * @returns {string} Mock geohash
 */
function generateMockGeohash(location) {
    const locationHashes = {
        'london': 'gcpvj0',
        'manchester': 'gcw2j0',
        'birmingham': 'gcqd50',
        'leeds': 'gcxe80',
        'glasgow': 'gcyv20'
    };
    
    return locationHashes[location.toLowerCase()] || 'gcpvj0';
}