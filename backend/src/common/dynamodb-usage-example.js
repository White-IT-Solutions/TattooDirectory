/**
 * DynamoDB Usage Examples
 * 
 * This file demonstrates how to use the DynamoDB data access layer
 * for common operations in the Tattoo Artist Directory application.
 */

import {
    generateArtistKeys,
    generateAllGSIKeys,
    createArtistItem,
    putArtist,
    getArtist,
    updateArtist,
    searchArtistsByStyleAndLocation,
    findArtistByName,
    findArtistByInstagram
} from './dynamodb.js';

/**
 * Example: Creating a new artist profile
 */
export async function createArtistExample() {
    const artistData = {
        artistId: 'artist-alex-leeds-001',
        artistName: 'Alex Thompson',
        instagramHandle: 'alexthompsontattoo',
        geohash: 'gcpvj0r',
        locationDisplay: 'Leeds, UK',
        styles: ['traditional', 'neotraditional', 'blackwork'],
        portfolioImages: [
            'https://example.com/portfolio/alex-1.jpg',
            'https://example.com/portfolio/alex-2.jpg',
            'https://example.com/portfolio/alex-3.jpg'
        ],
        contactInfo: {
            website: 'https://alexthompsontattoo.com',
            email: 'alex@alexthompsontattoo.com',
            phone: '+44 113 123 4567',
            studioName: 'Ink & Steel Tattoo Studio',
            studioAddress: '123 Briggate, Leeds LS1 6AZ'
        }
    };

    try {
        // Create the artist item with all correct keys
        const result = await putArtist(artistData);
        console.log('Artist created successfully:', result);
        return result;
    } catch (error) {
        console.error('Failed to create artist:', error.message);
        throw error;
    }
}

/**
 * Example: Retrieving an artist profile
 */
export async function getArtistExample(artistId) {
    try {
        const artist = await getArtist(artistId);
        
        if (!artist) {
            console.log(`Artist with ID ${artistId} not found`);
            return null;
        }
        
        console.log('Artist retrieved:', {
            name: artist.artistName,
            location: artist.locationDisplay,
            styles: artist.styles,
            instagram: artist.instagramHandle
        });
        
        return artist;
    } catch (error) {
        console.error('Failed to get artist:', error.message);
        throw error;
    }
}

/**
 * Example: Searching for artists by style and location
 */
export async function searchArtistsExample(style, geohashPrefix) {
    try {
        const results = await searchArtistsByStyleAndLocation(style, geohashPrefix, {
            limit: 10
        });
        
        console.log(`Found ${results.Count} artists for style "${style}" in area "${geohashPrefix}"`);
        
        results.Items.forEach(artist => {
            console.log(`- ${artist.artistName} (${artist.locationDisplay})`);
        });
        
        return results;
    } catch (error) {
        console.error('Failed to search artists:', error.message);
        throw error;
    }
}

/**
 * Example: Finding an artist by name
 */
export async function findArtistByNameExample(artistName) {
    try {
        const artist = await findArtistByName(artistName);
        
        if (!artist) {
            console.log(`Artist "${artistName}" not found`);
            return null;
        }
        
        console.log(`Found artist: ${artist.artistName} (${artist.locationDisplay})`);
        return artist;
    } catch (error) {
        console.error('Failed to find artist by name:', error.message);
        throw error;
    }
}

/**
 * Example: Finding an artist by Instagram handle
 */
export async function findArtistByInstagramExample(instagramHandle) {
    try {
        const artist = await findArtistByInstagram(instagramHandle);
        
        if (!artist) {
            console.log(`Artist with Instagram handle "${instagramHandle}" not found`);
            return null;
        }
        
        console.log(`Found artist: ${artist.artistName} (@${artist.instagramHandle})`);
        return artist;
    } catch (error) {
        console.error('Failed to find artist by Instagram:', error.message);
        throw error;
    }
}

/**
 * Example: Updating an artist profile
 */
export async function updateArtistExample(artistId, updates) {
    try {
        const updatedArtist = await updateArtist(artistId, updates);
        
        console.log('Artist updated successfully:', {
            id: updatedArtist.PK,
            name: updatedArtist.artistName,
            updatedAt: updatedArtist.updatedAt
        });
        
        return updatedArtist;
    } catch (error) {
        console.error('Failed to update artist:', error.message);
        throw error;
    }
}

/**
 * Example: Demonstrating key generation
 */
export function demonstrateKeyGeneration() {
    const artistData = {
        artistId: 'artist-demo-001',
        artistName: 'Demo Artist',
        instagramHandle: 'demoartist',
        styles: ['traditional'],
        geohash: 'gcpvj'
    };

    console.log('=== Key Generation Examples ===');
    
    // Primary keys
    const primaryKeys = generateArtistKeys(artistData.artistId);
    console.log('Primary Keys:', primaryKeys);
    
    // All GSI keys
    const gsiKeys = generateAllGSIKeys(artistData);
    console.log('GSI Keys:', gsiKeys);
    
    // Complete item structure
    const completeItem = createArtistItem(artistData);
    console.log('Complete Item Structure:', JSON.stringify(completeItem, null, 2));
    
    return {
        primaryKeys,
        gsiKeys,
        completeItem
    };
}

/**
 * Example: Batch operations for data migration
 */
export async function batchCreateArtistsExample() {
    const artistsData = [
        {
            artistId: 'artist-batch-001',
            artistName: 'Sarah Wilson',
            instagramHandle: 'sarahwilsontattoo',
            geohash: 'gcpvj1s',
            locationDisplay: 'Leeds, UK',
            styles: ['realism', 'portrait']
        },
        {
            artistId: 'artist-batch-002',
            artistName: 'Mike Johnson',
            instagramHandle: 'mikejohnsontattoo',
            geohash: 'gcpvj2t',
            locationDisplay: 'Leeds, UK',
            styles: ['traditional', 'sailor']
        },
        {
            artistId: 'artist-batch-003',
            artistName: 'Emma Davis',
            instagramHandle: 'emmadavistattoo',
            geohash: 'gcpvj3u',
            locationDisplay: 'Leeds, UK',
            styles: ['blackwork', 'geometric']
        }
    ];

    try {
        const { batchPutArtists } = await import('./dynamodb.js');
        const results = await batchPutArtists(artistsData);
        
        console.log(`Successfully created ${artistsData.length} artists in batch operation`);
        return results;
    } catch (error) {
        console.error('Failed to batch create artists:', error.message);
        throw error;
    }
}

// Export all examples for easy testing
export const examples = {
    createArtistExample,
    getArtistExample,
    searchArtistsExample,
    findArtistByNameExample,
    findArtistByInstagramExample,
    updateArtistExample,
    demonstrateKeyGeneration,
    batchCreateArtistsExample
};

// If running this file directly, demonstrate key generation
if (import.meta.url === `file://${process.argv[1]}`) {
    demonstrateKeyGeneration();
}