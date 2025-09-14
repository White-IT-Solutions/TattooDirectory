/**
 * Find Artists Handler
 * 
 * This Lambda function processes individual studio websites to find artists
 * working at those studios. It receives studio information from the discover-studios
 * step and extracts artist profiles, portfolio links, and contact information.
 */

import { createLogger } from '../../common/logger.js';
import { generateArtistKeys, generateAllGSIKeys } from '../../common/dynamodb.js';

export const handler = async (event, context) => {
    const logger = createLogger(context, event);
    
    try {
        logger.info('Find Artists on Site Event received', {
            studioId: event.studioId,
            studioWebsite: event.metadata?.studioWebsite,
            location: event.location
        });

        // Extract studio information from the event
        const { 
            studioId, 
            location, 
            style,
            metadata = {},
            keys = {} 
        } = event;

        if (!studioId) {
            throw new Error('studioId is required for artist discovery');
        }

        // Placeholder for website scraping logic
        // In a real implementation, this would:
        // 1. Fetch the studio website content
        // 2. Parse HTML to find artist profiles/pages
        // 3. Extract artist names, portfolio links, Instagram handles
        // 4. Validate and clean the extracted data
        // 5. Generate proper DynamoDB keys for each artist

        const artists = [];
        const studioWebsite = metadata.studioWebsite || `https://studio-${studioId}.com`;
        
        // Simulate finding 2-4 artists per studio
        const artistCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 1; i <= artistCount; i++) {
            const artistId = `${studioId}-artist-${i}`;
            const artistName = `${style} Artist ${i}`;
            const instagramHandle = `${studioId.replace(/[^a-z0-9]/g, '')}_artist_${i}`;
            
            // Generate mock geohash based on location
            const geohash = generateGeohashForLocation(location);
            
            // Create artist data with proper key structure
            const artistData = {
                artistId,
                artistName,
                instagramHandle,
                styles: [style, getRandomSecondaryStyle()],
                geohash,
                locationDisplay: location,
                studioId,
                studioName: metadata.studioName || `Studio ${studioId}`
            };

            // Generate all required DynamoDB keys
            const primaryKeys = generateArtistKeys(artistId);
            const gsiKeys = generateAllGSIKeys(artistData);

            const artist = {
                ...artistData,
                keys: {
                    ...primaryKeys,
                    ...gsiKeys
                },
                portfolioUrl: `https://instagram.com/${instagramHandle}`,
                discoverySource: 'studio_website',
                discoveryTimestamp: new Date().toISOString(),
                contactInfo: {
                    instagram: instagramHandle,
                    studioWebsite,
                    bookingMethod: 'instagram_dm'
                },
                portfolioImages: generateMockPortfolioImages(artistId, style),
                metadata: {
                    confidence: Math.random() * 0.2 + 0.8, // 0.8-1.0 confidence
                    lastUpdated: new Date().toISOString(),
                    sourceUrl: `${studioWebsite}/artists/${artistId}`
                }
            };

            artists.push(artist);
        }

        logger.info('Artist discovery completed for studio', {
            studioId,
            artistsFound: artists.length,
            location,
            style
        });

        // Return structured response for Step Functions
        return {
            statusCode: 200,
            studioId,
            artists,
            summary: {
                studioId,
                artistCount: artists.length,
                location,
                style,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        logger.error('Failed to find artists on studio site', {
            error: error.message,
            stack: error.stack,
            studioId: event.studioId,
            eventData: event
        });

        // Return error response that Step Functions can handle
        return {
            statusCode: 500,
            studioId: event.studioId || 'unknown',
            artists: [],
            error: {
                message: error.message,
                type: 'ARTIST_DISCOVERY_ERROR',
                timestamp: new Date().toISOString()
            }
        };
    }
};

/**
 * Generate geohash for a given location
 * @param {string} location - Location name
 * @returns {string} Geohash for the location
 */
function generateGeohashForLocation(location) {
    const locationHashes = {
        'london': 'gcpvj0',
        'manchester': 'gcw2j0', 
        'birmingham': 'gcqd50',
        'leeds': 'gcxe80',
        'glasgow': 'gcyv20',
        'bristol': 'gcnp30',
        'liverpool': 'gcw0j0',
        'edinburgh': 'gcyf70'
    };
    
    return locationHashes[location.toLowerCase()] || 'gcpvj0';
}

/**
 * Get a random secondary tattoo style
 * @returns {string} Random tattoo style
 */
function getRandomSecondaryStyle() {
    const styles = [
        'blackwork', 'dotwork', 'geometric', 'watercolor', 
        'minimalist', 'neo-traditional', 'japanese', 'tribal'
    ];
    return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * Generate mock portfolio images for an artist
 * @param {string} artistId - Artist identifier
 * @param {string} primaryStyle - Primary tattoo style
 * @returns {Array} Array of portfolio image objects
 */
function generateMockPortfolioImages(artistId, primaryStyle) {
    const imageCount = Math.floor(Math.random() * 8) + 5; // 5-12 images
    const images = [];
    
    for (let i = 1; i <= imageCount; i++) {
        images.push({
            imageId: `${artistId}-img-${i}`,
            url: `https://portfolio-images.tattoodirectory.com/${artistId}/image-${i}.jpg`,
            thumbnailUrl: `https://portfolio-images.tattoodirectory.com/${artistId}/thumb-${i}.jpg`,
            style: i <= 3 ? primaryStyle : getRandomSecondaryStyle(),
            uploadDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            tags: [`${primaryStyle}`, 'portfolio', 'tattoo'],
            dimensions: {
                width: 800 + Math.floor(Math.random() * 400),
                height: 600 + Math.floor(Math.random() * 600)
            }
        });
    }
    
    return images;
}