/**
 * OpenSearch Integration Tests
 * 
 * Tests for OpenSearch operations with LocalStack
 */

import { expect } from 'chai';
import { createTestOpenSearchClient } from '../setup/test-clients.js';
import TestDataManager from '../setup/test-data-manager.js';
import { testConfig } from '../config/test-config.js';
import { v4 as uuidv4 } from 'uuid';

describe('OpenSearch Integration Tests', function() {
    this.timeout(testConfig.timeouts.database);

    let openSearchClient;
    let dataManager;
    let testDocuments = [];

    before(async function() {
        this.timeout(testConfig.timeouts.setup);
        
        openSearchClient = createTestOpenSearchClient();
        dataManager = new TestDataManager();
        
        // Wait for services and ensure OpenSearch index exists
        await dataManager.waitForServices();
        await dataManager.ensureOpenSearchIndex();
        
        if (!dataManager.openSearchAvailable) {
            console.warn('OpenSearch not available - tests will be skipped');
            this.skip();
        } else {
            console.log('OpenSearch client initialized and index ready');
        }
    });

    after(async function() {
        this.timeout(testConfig.timeouts.cleanup);
        
        // Clean up test documents
        for (const doc of testDocuments) {
            try {
                await openSearchClient.delete({
                    index: testConfig.opensearch.indexName,
                    id: doc.id,
                    refresh: true
                });
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
        
        console.log('Cleaned up OpenSearch test documents');
    });

    describe('Index Operations', function() {
        it('should successfully index a document', async function() {
            const testDoc = {
                artistId: `test-${uuidv4()}`,
                name: 'Test Artist',
                instagramHandle: 'testartist',
                location: 'London, UK',
                styles: ['traditional', 'realism'],
                geohash: 'gcpvj0',
                portfolioImages: [
                    {
                        url: 'https://example.com/test1.jpg',
                        description: 'Test tattoo',
                        style: 'traditional'
                    }
                ],
                contactInfo: {
                    instagram: '@testartist',
                    email: 'test@example.com'
                },
                updatedAt: new Date().toISOString()
            };

            const response = await openSearchClient.index({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId,
                body: testDoc,
                refresh: true
            });

            expect(response.body.result).to.be.oneOf(['created', 'updated']);
            expect(response.body._id).to.equal(testDoc.artistId);
            
            testDocuments.push({ id: testDoc.artistId });
        });

        it('should successfully get a document by ID', async function() {
            const testDoc = {
                artistId: `test-get-${uuidv4()}`,
                name: 'Get Test Artist',
                instagramHandle: 'gettestartist',
                location: 'Manchester, UK',
                styles: ['blackwork'],
                geohash: 'gcpvj1'
            };

            // Index the document
            await openSearchClient.index({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId,
                body: testDoc,
                refresh: true
            });

            testDocuments.push({ id: testDoc.artistId });

            // Get the document
            const response = await openSearchClient.get({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId
            });

            expect(response.body.found).to.be.true;
            expect(response.body._source.name).to.equal(testDoc.name);
            expect(response.body._source.location).to.equal(testDoc.location);
            expect(response.body._source.styles).to.deep.equal(testDoc.styles);
        });

        it('should successfully update a document', async function() {
            const testDoc = {
                artistId: `test-update-${uuidv4()}`,
                name: 'Update Test Artist',
                location: 'Birmingham, UK',
                styles: ['watercolor']
            };

            // Index initial document
            await openSearchClient.index({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId,
                body: testDoc,
                refresh: true
            });

            testDocuments.push({ id: testDoc.artistId });

            // Update the document
            const updatedDoc = {
                ...testDoc,
                name: 'Updated Test Artist',
                styles: ['watercolor', 'geometric']
            };

            await openSearchClient.index({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId,
                body: updatedDoc,
                refresh: true
            });

            // Verify update
            const response = await openSearchClient.get({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId
            });

            expect(response.body._source.name).to.equal('Updated Test Artist');
            expect(response.body._source.styles).to.deep.equal(['watercolor', 'geometric']);
        });

        it('should successfully delete a document', async function() {
            const testDoc = {
                artistId: `test-delete-${uuidv4()}`,
                name: 'Delete Test Artist',
                location: 'Leeds, UK'
            };

            // Index the document
            await openSearchClient.index({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId,
                body: testDoc,
                refresh: true
            });

            // Delete the document
            const deleteResponse = await openSearchClient.delete({
                index: testConfig.opensearch.indexName,
                id: testDoc.artistId,
                refresh: true
            });

            expect(deleteResponse.body.result).to.equal('deleted');

            // Verify deletion
            try {
                await openSearchClient.get({
                    index: testConfig.opensearch.indexName,
                    id: testDoc.artistId
                });
                expect.fail('Document should have been deleted');
            } catch (error) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe('Search Operations', function() {
        beforeEach(async function() {
            // Create test documents for search
            const searchTestDocs = [
                {
                    artistId: `search-test-1-${uuidv4()}`,
                    name: 'Sarah Mitchell',
                    instagramHandle: 'sarahtattoos',
                    location: 'London, UK',
                    styles: ['traditional', 'neo-traditional'],
                    geohash: 'gcpvj0'
                },
                {
                    artistId: `search-test-2-${uuidv4()}`,
                    name: 'Mike Johnson',
                    instagramHandle: 'mikejohnsonink',
                    location: 'Manchester, UK',
                    styles: ['realism', 'portrait'],
                    geohash: 'gcw2j0'
                },
                {
                    artistId: `search-test-3-${uuidv4()}`,
                    name: 'Emma Wilson',
                    instagramHandle: 'emmawilsonart',
                    location: 'London, UK',
                    styles: ['blackwork', 'geometric'],
                    geohash: 'gcpvj1'
                }
            ];

            for (const doc of searchTestDocs) {
                await openSearchClient.index({
                    index: testConfig.opensearch.indexName,
                    id: doc.artistId,
                    body: doc,
                    refresh: true
                });
                testDocuments.push({ id: doc.artistId });
            }

            // Wait for indexing to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        it('should search by artist name', async function() {
            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: {
                        match: {
                            name: 'Sarah'
                        }
                    }
                }
            });

            expect(response.body.hits.total.value).to.be.greaterThan(0);
            
            const hit = response.body.hits.hits.find(h => h._source.name.includes('Sarah'));
            expect(hit).to.exist;
            expect(hit._source.name).to.include('Sarah');
        });

        it('should filter by style', async function() {
            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: {
                        term: {
                            'styles': 'traditional'
                        }
                    }
                }
            });

            expect(response.body.hits.total.value).to.be.greaterThan(0);
            
            response.body.hits.hits.forEach(hit => {
                expect(hit._source.styles).to.include('traditional');
            });
        });

        it('should search by location', async function() {
            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: {
                        match: {
                            location: 'London'
                        }
                    }
                }
            });

            expect(response.body.hits.total.value).to.be.greaterThan(0);
            
            response.body.hits.hits.forEach(hit => {
                expect(hit._source.location.toLowerCase()).to.include('london');
            });
        });

        it('should perform complex boolean queries', async function() {
            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { location: 'London' } }
                            ],
                            filter: [
                                { term: { 'styles': 'traditional' } }
                            ]
                        }
                    }
                }
            });

            response.body.hits.hits.forEach(hit => {
                expect(hit._source.location.toLowerCase()).to.include('london');
                expect(hit._source.styles).to.include('traditional');
            });
        });

        it('should handle pagination', async function() {
            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: { match_all: {} },
                    size: 2,
                    from: 0
                }
            });

            expect(response.body.hits.hits.length).to.be.at.most(2);
        });

        it('should sort results', async function() {
            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: { match_all: {} },
                    sort: [
                        { 'name.keyword': { order: 'asc' } }
                    ]
                }
            });

            const names = response.body.hits.hits.map(hit => hit._source.name);
            const sortedNames = [...names].sort();
            expect(names).to.deep.equal(sortedNames);
        });
    });

    describe('Aggregations', function() {
        beforeEach(async function() {
            // Create test documents with various styles
            const aggTestDocs = [
                {
                    artistId: `agg-test-1-${uuidv4()}`,
                    name: 'Agg Artist 1',
                    styles: ['traditional', 'realism']
                },
                {
                    artistId: `agg-test-2-${uuidv4()}`,
                    name: 'Agg Artist 2',
                    styles: ['traditional', 'blackwork']
                },
                {
                    artistId: `agg-test-3-${uuidv4()}`,
                    name: 'Agg Artist 3',
                    styles: ['realism', 'portrait']
                }
            ];

            for (const doc of aggTestDocs) {
                await openSearchClient.index({
                    index: testConfig.opensearch.indexName,
                    id: doc.artistId,
                    body: doc,
                    refresh: true
                });
                testDocuments.push({ id: doc.artistId });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        it('should aggregate styles with counts', async function() {
            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    size: 0,
                    aggs: {
                        styles_count: {
                            terms: {
                                field: 'styles',
                                size: 10
                            }
                        }
                    }
                }
            });

            expect(response.body.aggregations).to.exist;
            expect(response.body.aggregations.styles_count).to.exist;
            expect(response.body.aggregations.styles_count.buckets).to.be.an('array');
            
            const buckets = response.body.aggregations.styles_count.buckets;
            buckets.forEach(bucket => {
                expect(bucket.key).to.be.a('string');
                expect(bucket.doc_count).to.be.a('number');
                expect(bucket.doc_count).to.be.greaterThan(0);
            });
        });
    });

    describe('Error Handling', function() {
        it('should handle non-existent index', async function() {
            try {
                await openSearchClient.search({
                    index: 'non-existent-index',
                    body: { query: { match_all: {} } }
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.statusCode).to.equal(404);
            }
        });

        it('should handle malformed queries', async function() {
            try {
                await openSearchClient.search({
                    index: testConfig.opensearch.indexName,
                    body: {
                        query: {
                            invalid_query_type: {
                                field: 'value'
                            }
                        }
                    }
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.statusCode).to.equal(400);
            }
        });

        it('should handle document not found', async function() {
            try {
                await openSearchClient.get({
                    index: testConfig.opensearch.indexName,
                    id: 'non-existent-document'
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.statusCode).to.equal(404);
            }
        });
    });

    describe('Performance', function() {
        it('should handle bulk indexing efficiently', async function() {
            const startTime = Date.now();
            const bulkSize = 20;
            const bulkBody = [];

            for (let i = 0; i < bulkSize; i++) {
                const doc = {
                    artistId: `bulk-test-${i}`,
                    name: `Bulk Test Artist ${i}`,
                    location: 'Test City',
                    styles: ['traditional']
                };

                bulkBody.push({ index: { _index: testConfig.opensearch.indexName, _id: doc.artistId } });
                bulkBody.push(doc);
                
                testDocuments.push({ id: doc.artistId });
            }

            const response = await openSearchClient.bulk({
                body: bulkBody,
                refresh: true
            });

            const duration = Date.now() - startTime;

            expect(response.body.errors).to.be.false;
            expect(duration).to.be.below(5000); // Should complete within 5 seconds
            
            console.log(`Bulk indexing (${bulkSize} documents) completed in ${duration}ms`);
        });

        it('should perform searches efficiently', async function() {
            const startTime = Date.now();

            const response = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: { match_all: {} },
                    size: 100
                }
            });

            const duration = Date.now() - startTime;

            expect(response.body.hits).to.exist;
            expect(duration).to.be.below(1000); // Should complete within 1 second
            
            console.log(`Search query completed in ${duration}ms`);
        });
    });
});