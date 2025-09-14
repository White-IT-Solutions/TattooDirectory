#!/usr/bin/env node

/**
 * OpenSearch Data Seeding Script
 * 
 * Seeds OpenSearch with artist data from the test data files.
 * This script ensures the OpenSearch index exists and contains real data
 * instead of falling back to mock data in the API handler.
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { getIndexName, config } from '../common/aws-config.js';
import { createLogger } from '../common/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger();

/**
 * Make HTTP request to OpenSearch (LocalStack compatible)
 */
function makeOpenSearchRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const endpoint = process.env.OPENSEARCH_ENDPOINT || 'http://localhost:4566';
        const url = new URL(endpoint);
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // For LocalStack, add the Host header for proper routing
        if (endpoint.includes('localhost') || endpoint.includes('localstack')) {
            options.headers['Host'] = 'search-tattoo-directory.eu-west-2.opensearch.localhost.localstack.cloud';
        }

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

/**
 * Create OpenSearch index with proper mappings
 */
async function createIndex(indexName) {
    try {
        // Check if index exists
        try {
            await makeOpenSearchRequest('HEAD', `/${indexName}`);
            logger.info(`Index ${indexName} already exists, deleting and recreating...`);
            await makeOpenSearchRequest('DELETE', `/${indexName}`);
        } catch (error) {
            // Index doesn't exist, which is fine
            logger.info(`Index ${indexName} doesn't exist, creating new one`);
        }

        const indexMapping = {
            mappings: {
                properties: {
                    artistId: { 
                        type: 'keyword' 
                    },
                    name: { 
                        type: 'text',
                        fields: {
                            keyword: { type: 'keyword' }
                        }
                    },
                    instagramHandle: { 
                        type: 'keyword' 
                    },
                    location: { 
                        type: 'text',
                        fields: {
                            keyword: { type: 'keyword' }
                        }
                    },
                    styles: { 
                        type: 'keyword' 
                    },
                    specialties: { 
                        type: 'keyword' 
                    },
                    geohash: { 
                        type: 'keyword' 
                    },
                    latitude: { 
                        type: 'float' 
                    },
                    longitude: { 
                        type: 'float' 
                    },
                    rating: { 
                        type: 'float' 
                    },
                    reviewCount: { 
                        type: 'integer' 
                    },
                    portfolioImages: {
                        type: 'nested',
                        properties: {
                            url: { type: 'keyword' },
                            description: { type: 'text' },
                            style: { type: 'keyword' },
                            tags: { type: 'keyword' }
                        }
                    },
                    contactInfo: {
                        properties: {
                            instagram: { type: 'keyword' },
                            website: { type: 'keyword' },
                            email: { type: 'keyword' },
                            phone: { type: 'keyword' }
                        }
                    },
                    studioInfo: {
                        properties: {
                            studioName: { 
                                type: 'text',
                                fields: {
                                    keyword: { type: 'keyword' }
                                }
                            },
                            address: { type: 'text' },
                            postcode: { type: 'keyword' }
                        }
                    },
                    pricing: {
                        properties: {
                            hourlyRate: { type: 'integer' },
                            minimumCharge: { type: 'integer' },
                            currency: { type: 'keyword' }
                        }
                    },
                    availability: {
                        properties: {
                            bookingOpen: { type: 'boolean' },
                            nextAvailable: { type: 'date' },
                            waitingList: { type: 'boolean' }
                        }
                    },
                    experience: {
                        properties: {
                            yearsActive: { type: 'integer' },
                            apprenticeshipCompleted: { type: 'boolean' },
                            certifications: { type: 'keyword' }
                        }
                    },
                    updatedAt: { 
                        type: 'date' 
                    },
                    createdAt: { 
                        type: 'date' 
                    }
                }
            },
            settings: {
                number_of_shards: 1,
                number_of_replicas: 0 // For local development
            }
        };

        await makeOpenSearchRequest('PUT', `/${indexName}`, indexMapping);
        logger.info(`Created OpenSearch index: ${indexName}`);
    } catch (error) {
        logger.error('Failed to create index', { error: error.toString() });
        throw error;
    }
}

/**
 * Transform artist data for OpenSearch indexing
 */
function transformArtistForOpenSearch(artist) {
    return {
        artistId: artist.artistId,
        name: artist.artistName,
        instagramHandle: artist.instagramHandle,
        location: artist.locationDisplay,
        styles: artist.styles,
        specialties: artist.specialties || [],
        geohash: artist.geohash,
        latitude: artist.latitude,
        longitude: artist.longitude,
        rating: artist.rating,
        reviewCount: artist.reviewCount,
        portfolioImages: artist.portfolioImages || [],
        contactInfo: artist.contactInfo,
        studioInfo: artist.studioInfo,
        pricing: artist.pricing,
        availability: artist.availability,
        experience: artist.experience,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
}

/**
 * Load artist data from JSON file
 */
async function loadArtistData() {
    try {
        // Try multiple possible paths for the artists data
        const possiblePaths = [
            join(__dirname, '../../../scripts/test-data/artists.json'),
            join(__dirname, '../../scripts/test-data/artists.json'),
            join(__dirname, '../scripts/test-data/artists.json'),
            join(process.cwd(), 'scripts/test-data/artists.json')
        ];

        let artistsData = null;
        let usedPath = null;

        for (const path of possiblePaths) {
            try {
                const data = await readFile(path, 'utf-8');
                artistsData = JSON.parse(data);
                usedPath = path;
                break;
            } catch (error) {
                // Continue to next path
                continue;
            }
        }

        if (!artistsData) {
            throw new Error('Could not find artists.json file in any expected location');
        }

        logger.info(`Loaded artist data from: ${usedPath}`, { 
            artistCount: artistsData.length 
        });

        return artistsData;
    } catch (error) {
        logger.error('Failed to load artist data', { error: error.toString() });
        throw error;
    }
}

/**
 * Index artists in OpenSearch
 */
async function indexArtists(indexName, artists) {
    try {
        logger.info(`Starting to index ${artists.length} artists`);

        for (const artist of artists) {
            const transformedArtist = transformArtistForOpenSearch(artist);
            
            await makeOpenSearchRequest(
                'PUT', 
                `/${indexName}/_doc/${artist.artistId}`,
                transformedArtist
            );
            
            logger.info(`Indexed artist: ${artist.artistName} (${artist.artistId})`);
        }

        // Refresh index to make documents immediately searchable
        await makeOpenSearchRequest('POST', `/${indexName}/_refresh`);

        logger.info(`Successfully indexed ${artists.length} artists`, {
            indexName
        });

        return { indexed: artists.length };
    } catch (error) {
        logger.error('Failed to index artists', { error: error.toString() });
        throw error;
    }
}

/**
 * Verify indexed data
 */
async function verifyIndexedData(indexName, expectedCount) {
    try {
        // Wait a moment for indexing to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        const countResponse = await makeOpenSearchRequest('GET', `/${indexName}/_count`);
        const actualCount = countResponse.count;
        
        logger.info('Index verification', {
            indexName,
            expectedCount,
            actualCount,
            success: actualCount === expectedCount
        });

        if (actualCount !== expectedCount) {
            logger.warn(`Expected ${expectedCount} documents, found ${actualCount}. This might be normal if some documents failed to index.`);
        }

        // Test a sample search
        const sampleSearch = await makeOpenSearchRequest('POST', `/${indexName}/_search`, {
            query: {
                match: { name: 'Sarah' }
            },
            size: 1
        });

        logger.info('Sample search test', {
            query: 'Sarah',
            hits: sampleSearch.hits?.hits?.length || 0,
            sampleResult: sampleSearch.hits?.hits?.[0]?._source?.name
        });

        return true;
    } catch (error) {
        logger.error('Index verification failed', { error: error.toString() });
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedOpenSearch() {
    logger.info('Starting OpenSearch data seeding', {
        isLocal: config.isLocal,
        indexName: getIndexName(),
        endpoint: process.env.OPENSEARCH_ENDPOINT
    });

    try {
        const indexName = getIndexName();

        // Test connection
        await makeOpenSearchRequest('GET', '/');
        logger.info('OpenSearch connection successful');

        // Create index with mappings
        await createIndex(indexName);

        // Load artist data
        const artists = await loadArtistData();

        // Index artists
        await indexArtists(indexName, artists);

        // Verify indexed data
        await verifyIndexedData(indexName, artists.length);

        logger.info('OpenSearch seeding completed successfully', {
            indexName,
            artistCount: artists.length
        });

        return {
            success: true,
            indexName,
            artistCount: artists.length
        };

    } catch (error) {
        logger.error('OpenSearch seeding failed', { 
            error: error.toString(),
            stack: error.stack 
        });
        throw error;
    }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedOpenSearch()
        .then(result => {
            console.log('✅ Seeding completed:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Seeding failed:', error.message);
            process.exit(1);
        });
}

export { seedOpenSearch };