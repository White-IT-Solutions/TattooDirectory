/**
 * Test Data Management
 * 
 * Utilities for setting up and cleaning up test data in DynamoDB and OpenSearch
 */

import { PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { createTestDynamoDBClient, createTestOpenSearchClient } from './test-clients.js';
import { testConfig } from '../config/test-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TestDataManager {
    constructor() {
        this.dynamoClient = createTestDynamoDBClient();
        this.openSearchClient = createTestOpenSearchClient();
        this.createdItems = new Set(); // Track items created during tests
        this.openSearchAvailable = true; // Track if OpenSearch is available
    }

    /**
     * Load test data from JSON files
     */
    async loadTestData() {
        try {
            const artistsPath = join(__dirname, testConfig.testData.seedDataPath, 'artists.json');
            const stylesPath = join(__dirname, testConfig.testData.seedDataPath, 'styles.json');
            
            const [artistsData, stylesData] = await Promise.all([
                readFile(artistsPath, 'utf-8').then(JSON.parse),
                readFile(stylesPath, 'utf-8').then(JSON.parse)
            ]);

            return { artists: artistsData, styles: stylesData };
        } catch (error) {
            throw new Error(`Failed to load test data: ${error.message}`);
        }
    }

    /**
     * Create a test artist in DynamoDB
     */
    async createTestArtist(artistData = {}) {
        const testArtist = {
            PK: `ARTIST#${artistData.artistId || `test-${uuidv4()}`}`,
            SK: 'PROFILE',
            artistId: artistData.artistId || `test-${uuidv4()}`,
            artistName: artistData.artistName || 'Test Artist',
            instagramHandle: artistData.instagramHandle || 'testartist',
            geohash: artistData.geohash || 'gcpvj0',
            locationDisplay: artistData.locationDisplay || 'London, UK',
            styles: artistData.styles || ['traditional'],
            portfolioImages: artistData.portfolioImages || [],
            contactInfo: artistData.contactInfo || {
                instagram: '@testartist',
                email: 'test@example.com'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...artistData
        };

        const command = new PutCommand({
            TableName: testConfig.dynamodb.tableName,
            Item: testArtist
        });

        await this.dynamoClient.send(command);
        this.createdItems.add(testArtist.PK);
        
        return testArtist;
    }

    /**
     * Create multiple test artists
     */
    async createTestArtists(count = 5) {
        const artists = [];
        const { artists: seedArtists } = await this.loadTestData();
        
        for (let i = 0; i < count; i++) {
            const seedArtist = seedArtists[i % seedArtists.length];
            const testArtist = await this.createTestArtist({
                ...seedArtist,
                artistId: `test-${uuidv4()}`,
                artistName: `${seedArtist.artistName} ${i + 1}`
            });
            artists.push(testArtist);
        }
        
        return artists;
    }

    /**
     * Index artist in OpenSearch
     */
    async indexArtistInOpenSearch(artist) {
        try {
            const document = {
                artistId: artist.artistId,
                name: artist.artistName,
                instagramHandle: artist.instagramHandle,
                location: artist.locationDisplay,
                styles: artist.styles,
                portfolioImages: artist.portfolioImages,
                contactInfo: artist.contactInfo,
                geohash: artist.geohash,
                updatedAt: artist.updatedAt
            };

            if (this.openSearchAvailable) {
                await this.openSearchClient.index({
                    index: testConfig.opensearch.indexName,
                    id: artist.artistId,
                    body: document,
                    refresh: true // Ensure immediate availability for search
                });
            } else {
                console.warn('OpenSearch not available, skipping indexing');
            }

            return document;
        } catch (error) {
            console.warn(`Failed to index artist in OpenSearch: ${error.message}`);
            this.openSearchAvailable = false;
            return document; // Return document even if indexing failed
        }
    }

    /**
     * Create and index multiple test artists
     */
    async setupTestArtists(count = 5) {
        const artists = await this.createTestArtists(count);
        
        // Index all artists in OpenSearch
        await Promise.all(
            artists.map(artist => this.indexArtistInOpenSearch(artist))
        );

        // Wait a moment for OpenSearch to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return artists;
    }

    /**
     * Get artist from DynamoDB
     */
    async getArtist(artistId) {
        const command = new ScanCommand({
            TableName: testConfig.dynamodb.tableName,
            FilterExpression: 'artistId = :artistId',
            ExpressionAttributeValues: {
                ':artistId': artistId
            }
        });

        const result = await this.dynamoClient.send(command);
        return result.Items?.[0] || null;
    }

    /**
     * Delete artist from DynamoDB
     */
    async deleteArtist(artistId) {
        const artist = await this.getArtist(artistId);
        if (!artist) return;

        const command = new DeleteCommand({
            TableName: testConfig.dynamodb.tableName,
            Key: {
                PK: artist.PK,
                SK: artist.SK
            }
        });

        await this.dynamoClient.send(command);
        this.createdItems.delete(artist.PK);
    }

    /**
     * Delete artist from OpenSearch
     */
    async deleteArtistFromOpenSearch(artistId) {
        if (!this.openSearchAvailable) {
            console.warn('OpenSearch not available, skipping deletion');
            return;
        }
        
        try {
            await this.openSearchClient.delete({
                index: testConfig.opensearch.indexName,
                id: artistId,
                refresh: true
            });
        } catch (error) {
            // Ignore if document doesn't exist
            if (error.statusCode !== 404) {
                console.warn(`Failed to delete from OpenSearch: ${error.message}`);
            }
        }
    }

    /**
     * Clean up all test data created during tests
     */
    async cleanup() {
        const cleanupPromises = [];

        // Clean up DynamoDB items
        for (const pk of this.createdItems) {
            const artistId = pk.replace('ARTIST#', '');
            cleanupPromises.push(
                this.deleteArtist(artistId),
                this.deleteArtistFromOpenSearch(artistId)
            );
        }

        await Promise.all(cleanupPromises);
        this.createdItems.clear();
    }

    /**
     * Verify OpenSearch index exists and create if needed
     */
    async ensureOpenSearchIndex() {
        try {
            // Test if OpenSearch is available with a timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OpenSearch connection timeout')), 10000)
            );
            
            const healthCheck = this.openSearchClient.cluster.health();
            await Promise.race([healthCheck, timeoutPromise]);
            
            const indexExists = await this.openSearchClient.indices.exists({
                index: testConfig.opensearch.indexName
            });

            if (!indexExists.body) {
                await this.openSearchClient.indices.create({
                    index: testConfig.opensearch.indexName,
                    body: {
                        mappings: {
                            properties: {
                                artistId: { type: 'keyword' },
                                name: { 
                                    type: 'text',
                                    fields: {
                                        keyword: { type: 'keyword' }
                                    }
                                },
                                instagramHandle: { type: 'keyword' },
                                location: { type: 'text' },
                                styles: { type: 'keyword' },
                                geohash: { type: 'keyword' },
                                updatedAt: { type: 'date' }
                            }
                        }
                    }
                });
            }
            console.log('OpenSearch index ensured successfully');
        } catch (error) {
            console.warn('OpenSearch not available, skipping index creation:', error.message);
            // Don't throw error - let tests run without OpenSearch if needed
            this.openSearchAvailable = false;
        }
    }

    /**
     * Wait for services to be ready
     */
    async waitForServices(maxRetries = 10, delay = 2000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Test DynamoDB
                await this.dynamoClient.send(new ScanCommand({
                    TableName: testConfig.dynamodb.tableName,
                    Limit: 1
                }));

                // Test OpenSearch (optional)
                try {
                    await this.openSearchClient.ping();
                    this.openSearchAvailable = true;
                } catch (osError) {
                    console.warn('OpenSearch not available:', osError.message);
                    this.openSearchAvailable = false;
                }

                return true;
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw new Error(`Services not ready after ${maxRetries} attempts: ${error.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

export default TestDataManager;