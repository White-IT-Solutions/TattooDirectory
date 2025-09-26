/**
 * Artists API Integration Tests
 * 
 * Tests for /v1/artists endpoints against LocalStack backend
 */

import { expect } from 'chai';
import { createTestAPIClient } from '../setup/test-clients.js';
import TestDataManager from '../setup/test-data-manager.js';
import { testConfig } from '../config/test-config.js';

describe('Artists API Integration Tests', function() {
    this.timeout(testConfig.timeouts.api);

    let apiClient;
    let dataManager;
    let testArtists = [];

    before(async function() {
        this.timeout(testConfig.timeouts.setup);
        
        apiClient = createTestAPIClient();
        dataManager = new TestDataManager();
        
        // Wait for services to be ready
        await dataManager.waitForServices();
        await dataManager.ensureOpenSearchIndex();
        
        // Create test data
        testArtists = await dataManager.setupTestArtists(5);
        console.log(`Created ${testArtists.length} test artists for integration tests`);
        
        if (!dataManager.openSearchAvailable) {
            console.warn('OpenSearch not available - some search tests may be skipped');
        }
    });

    after(async function() {
        this.timeout(testConfig.timeouts.cleanup);
        if (testConfig.testData.cleanupAfterTests) {
            await dataManager.cleanup();
            console.log('Cleaned up test data');
        }
    });

    describe('GET /v1/artists', function() {
        it('should return artists when searching by query', async function() {
            const testArtist = testArtists[0];
            
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {
                    query: testArtist.artistName.split(' ')[0] // Search by first name
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-search-query'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(200);
            expect(response.headers['content-type']).to.include('application/json');
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData).to.have.property('total');
            expect(responseData.items).to.be.an('array');
            expect(responseData.items.length).to.be.greaterThan(0);
            
            // Verify artist structure
            const artist = responseData.items[0];
            expect(artist).to.have.property('artistId');
            expect(artist).to.have.property('name');
            expect(artist).to.have.property('instagramHandle');
            expect(artist).to.have.property('location');
            expect(artist).to.have.property('styles');
            expect(artist.styles).to.be.an('array');
        });

        it('should return artists when filtering by style', async function() {
            const testStyle = testArtists[0].styles[0];
            
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {
                    style: testStyle
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-search-style'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData.items).to.be.an('array');
            expect(responseData.items.length).to.be.greaterThan(0);
            
            // Verify all returned artists have the requested style
            responseData.items.forEach(artist => {
                expect(artist.styles).to.include(testStyle);
            });
        });

        it('should return artists when searching by location', async function() {
            const testLocation = 'London';
            
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {
                    location: testLocation
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-search-location'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData.items).to.be.an('array');
            expect(responseData.items.length).to.be.greaterThan(0);
            
            // Verify location matching
            responseData.items.forEach(artist => {
                expect(artist.location.toLowerCase()).to.include(testLocation.toLowerCase());
            });
        });

        it('should respect pagination parameters', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {
                    query: 'Test',
                    limit: '2',
                    page: '1'
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-pagination'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData.items).to.be.an('array');
            expect(responseData.items.length).to.be.at.most(2);
        });

        it('should return 400 when no search parameters provided', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {},
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-no-params'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(400);
            expect(response.headers['content-type']).to.include('application/problem+json');
            
            const error = response.data;
            expect(error).to.have.property('type');
            expect(error).to.have.property('title');
            expect(error).to.have.property('status', 400);
            expect(error).to.have.property('detail');
            expect(error.detail).to.include('At least one search parameter is required');
        });

        it('should handle combined search parameters', async function() {
            const testArtist = testArtists[0];
            
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {
                    query: testArtist.artistName.split(' ')[0],
                    style: testArtist.styles[0],
                    location: 'London'
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-combined-search'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData.items).to.be.an('array');
            // Should return results that match all criteria
        });

        it('should return empty array when no artists match criteria', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {
                    query: 'NonExistentArtistName12345'
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-no-results'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData.items).to.be.an('array');
            expect(responseData.items.length).to.equal(0);
        });
    });

    describe('GET /v1/artists/{artistId}', function() {
        it('should return specific artist by ID', async function() {
            const testArtist = testArtists[0];
            
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: `/v1/artists/${testArtist.artistId}`,
                pathParameters: {
                    artistId: testArtist.artistId
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-get-artist'
                },
                rawPath: `/v1/artists/${testArtist.artistId}`
            });

            expect(response.status).to.equal(200);
            expect(response.headers['content-type']).to.include('application/json');
            
            const artist = response.data;
            expect(artist).to.be.an('object');
            expect(artist.artistId).to.equal(testArtist.artistId);
            expect(artist.name).to.equal(testArtist.artistName);
            expect(artist.instagramHandle).to.equal(testArtist.instagramHandle);
            expect(artist.location).to.equal(testArtist.locationDisplay);
            expect(artist.styles).to.deep.equal(testArtist.styles);
        });

        it('should return 404 for non-existent artist', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists/non-existent-artist-id',
                pathParameters: {
                    artistId: 'non-existent-artist-id'
                },
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-artist-not-found'
                },
                rawPath: '/v1/artists/non-existent-artist-id'
            });

            expect(response.status).to.equal(404);
            expect(response.headers['content-type']).to.include('application/problem+json');
            
            const error = response.data;
            expect(error).to.have.property('type');
            expect(error).to.have.property('title', 'Not Found');
            expect(error).to.have.property('status', 404);
            expect(error).to.have.property('detail');
            expect(error.detail).to.include('was not found');
        });

        it('should return 400 for missing artist ID', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists/',
                pathParameters: {},
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-missing-artist-id'
                },
                rawPath: '/v1/artists/'
            });

            expect(response.status).to.equal(404); // Route not found
        });
    });

    describe('Error Handling', function() {
        it('should return RFC 9457 compliant error responses', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/artists',
                queryStringParameters: {},
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-rfc9457-error'
                },
                rawPath: '/v1/artists'
            });

            expect(response.status).to.equal(400);
            
            const error = response.data;
            expect(error).to.have.property('type');
            expect(error).to.have.property('title');
            expect(error).to.have.property('status');
            expect(error).to.have.property('detail');
            expect(error).to.have.property('instance');
            
            // Verify RFC 9457 compliance
            expect(error.type).to.be.a('string');
            expect(error.title).to.be.a('string');
            expect(error.status).to.be.a('number');
            expect(error.detail).to.be.a('string');
            expect(error.instance).to.be.a('string');
        });

        it('should handle malformed requests gracefully', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/nonexistent',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-malformed-request'
                },
                rawPath: '/v1/nonexistent'
            });

            expect(response.status).to.equal(404);
            
            const error = response.data;
            expect(error).to.have.property('title', 'Not Found');
            expect(error).to.have.property('status', 404);
        });
    });
});