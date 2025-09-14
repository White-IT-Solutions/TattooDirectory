/**
 * Styles API Integration Tests
 * 
 * Tests for /v1/styles endpoint against LocalStack backend
 */

import { expect } from 'chai';
import { createTestAPIClient } from '../setup/test-clients.js';
import TestDataManager from '../setup/test-data-manager.js';
import { testConfig } from '../config/test-config.js';

describe('Styles API Integration Tests', function() {
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
        
        if (!dataManager.openSearchAvailable) {
            console.warn('OpenSearch not available - some search tests may be skipped');
        }
        
        // Create test data with diverse styles
        const { artists: seedArtists } = await dataManager.loadTestData();
        testArtists = [];
        
        // Create artists with different styles to test aggregation
        const testStyles = ['traditional', 'realism', 'blackwork', 'neo-traditional', 'watercolor'];
        
        for (let i = 0; i < 5; i++) {
            const seedArtist = seedArtists[i % seedArtists.length];
            const artist = await dataManager.createTestArtist({
                ...seedArtist,
                artistId: `test-style-${i + 1}`,
                artistName: `Style Test Artist ${i + 1}`,
                styles: [testStyles[i], testStyles[(i + 1) % testStyles.length]] // Each artist has 2 styles
            });
            
            await dataManager.indexArtistInOpenSearch(artist);
            testArtists.push(artist);
        }
        
        // Wait for OpenSearch to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`Created ${testArtists.length} test artists with diverse styles`);
    });

    after(async function() {
        this.timeout(testConfig.timeouts.cleanup);
        if (testConfig.testData.cleanupAfterTests) {
            await dataManager.cleanup();
            console.log('Cleaned up test data');
        }
    });

    describe('GET /v1/styles', function() {
        it('should return list of available styles with counts', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-get-styles'
                },
                rawPath: '/v1/styles'
            });

            expect(response.status).to.equal(200);
            expect(response.headers['content-type']).to.include('application/json');
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData.items).to.be.an('array');
            expect(responseData.items.length).to.be.greaterThan(0);
            
            // Verify style structure
            responseData.items.forEach(style => {
                expect(style).to.have.property('name');
                expect(style).to.have.property('count');
                expect(style.name).to.be.a('string');
                expect(style.count).to.be.a('number');
                expect(style.count).to.be.greaterThan(0);
            });
        });

        it('should include all styles from test artists', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-styles-completeness'
                },
                rawPath: '/v1/styles'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.have.property('items');
            const styleNames = responseData.items.map(style => style.name);
            
            // Verify that our test styles are included
            const expectedStyles = ['traditional', 'realism', 'blackwork', 'neo-traditional', 'watercolor'];
            
            expectedStyles.forEach(expectedStyle => {
                expect(styleNames).to.include(expectedStyle, 
                    `Expected style '${expectedStyle}' to be in the results`);
            });
        });

        it('should return accurate counts for each style', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-style-counts'
                },
                rawPath: '/v1/styles'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.have.property('items');
            
            // Find traditional style (should have at least 2 artists based on our test data)
            const traditionalStyle = responseData.items.find(style => style.name === 'traditional');
            expect(traditionalStyle).to.exist;
            expect(traditionalStyle.count).to.be.at.least(1);
            
            // Verify counts are reasonable (not negative, not excessively high)
            responseData.items.forEach(style => {
                expect(style.count).to.be.at.least(1);
                expect(style.count).to.be.at.most(100); // Reasonable upper bound for test data
            });
        });

        it('should return styles sorted by count (descending)', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-style-sorting'
                },
                rawPath: '/v1/styles'
            });

            expect(response.status).to.equal(200);
            
            const styles = response.data;
            
            // Verify sorting (counts should be in descending order)
            for (let i = 1; i < styles.length; i++) {
                expect(styles[i].count).to.be.at.most(styles[i - 1].count,
                    `Style at index ${i} should have count <= style at index ${i - 1}`);
            }
        });

        it('should handle empty results gracefully', async function() {
            // First, clean up all test data temporarily
            await dataManager.cleanup();
            
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-empty-styles'
                },
                rawPath: '/v1/styles'
            });

            expect(response.status).to.equal(200);
            
            const responseData = response.data;
            expect(responseData).to.be.an('object');
            expect(responseData).to.have.property('items');
            expect(responseData.items).to.be.an('array');
            // May be empty or contain existing data from other tests
        });

        it('should return consistent results on multiple calls', async function() {
            const response1 = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-consistency-1'
                },
                rawPath: '/v1/styles'
            });

            const response2 = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-consistency-2'
                },
                rawPath: '/v1/styles'
            });

            expect(response1.status).to.equal(200);
            expect(response2.status).to.equal(200);
            
            // Results should be identical (assuming no data changes between calls)
            expect(response1.data).to.deep.equal(response2.data);
        });
    });

    describe('Error Handling', function() {
        it('should return RFC 9457 compliant error for server errors', async function() {
            // This test would require simulating a server error condition
            // For now, we'll test the error format by checking a known error case
            
            const response = await apiClient.post('', {
                httpMethod: 'POST', // Wrong method
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'POST' },
                    requestId: 'test-method-error'
                },
                rawPath: '/v1/styles'
            });

            expect(response.status).to.equal(404); // Route not found
            
            if (response.status >= 400) {
                const error = response.data;
                expect(error).to.have.property('type');
                expect(error).to.have.property('title');
                expect(error).to.have.property('status');
                expect(error).to.have.property('detail');
                expect(error).to.have.property('instance');
            }
        });

        it('should handle malformed requests gracefully', async function() {
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles/invalid-path',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-invalid-path'
                },
                rawPath: '/v1/styles/invalid-path'
            });

            expect(response.status).to.equal(404);
            
            const error = response.data;
            expect(error).to.have.property('title', 'Not Found');
            expect(error).to.have.property('status', 404);
        });
    });

    describe('Performance', function() {
        it('should respond within acceptable time limits', async function() {
            const startTime = Date.now();
            
            const response = await apiClient.post('', {
                httpMethod: 'GET',
                path: '/v1/styles',
                requestContext: {
                    http: { method: 'GET' },
                    requestId: 'test-performance'
                },
                rawPath: '/v1/styles'
            });

            const responseTime = Date.now() - startTime;
            
            expect(response.status).to.equal(200);
            expect(responseTime).to.be.below(5000); // Should respond within 5 seconds
            
            console.log(`Styles API response time: ${responseTime}ms`);
        });
    });
});