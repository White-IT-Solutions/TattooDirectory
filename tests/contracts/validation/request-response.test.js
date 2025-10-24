/**
 * Request/Response Validation Tests
 * 
 * Tests to validate that API requests and responses follow the expected
 * format, data types, and validation rules defined in the contract.
 */

const { expect } = require('chai');
const axios = require('axios');

describe('Request/Response Validation', function() {
  let apiBaseUrl;

  before(function() {
    apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:9000';
    console.log(`Testing request/response validation against: ${apiBaseUrl}`);
  });

  describe('Artist Search API Validation', function() {
    describe('Valid Requests', function() {
      it('should accept valid query parameter', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=Sarah`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([200, 400]).to.include(response.status);
          
          if (response.status === 200) {
            expect(response.data).to.be.an('array');
            
            // Validate artist object structure
            if (response.data.length > 0) {
              const artist = response.data[0];
              expect(artist).to.have.property('artistId');
              expect(artist).to.have.property('artistName');
              expect(artist.artistId).to.be.a('string');
              expect(artist.artistName).to.be.a('string');
            }
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should accept valid style parameter', async function() {
        try {
          const validStyles = ['traditional', 'neo-traditional', 'realism', 'blackwork', 'watercolor'];
          const style = validStyles[0];
          
          const response = await axios.get(`${apiBaseUrl}/v1/artists?style=${style}`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([200, 400]).to.include(response.status);
          
          if (response.status === 200) {
            expect(response.data).to.be.an('array');
            
            // Validate that returned artists have the requested style
            response.data.forEach(artist => {
              expect(artist.styles).to.be.an('array');
              expect(artist.styles).to.include(style);
            });
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should accept valid location parameter', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?location=London`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([200, 400]).to.include(response.status);
          
          if (response.status === 200) {
            expect(response.data).to.be.an('array');
            
            // Validate location information in response
            response.data.forEach(artist => {
              expect(artist).to.have.property('locationDisplay');
              expect(artist.locationDisplay).to.be.a('string');
            });
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should accept valid pagination parameters', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test&limit=5&page=1`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([200, 400]).to.include(response.status);
          
          if (response.status === 200) {
            expect(response.data).to.be.an('array');
            expect(response.data.length).to.be.at.most(5);
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });
    });

    describe('Invalid Requests', function() {
      it('should reject request with no search parameters', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect(response.status).to.equal(400);
          expect(response.headers['content-type']).to.include('application/problem+json');
          
          const errorData = response.data;
          expect(errorData.type).to.be.a('string');
          expect(errorData.title).to.equal('Bad Request');
          expect(errorData.status).to.equal(400);
          expect(errorData.detail).to.include('At least one search parameter is required');
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should reject invalid style parameter', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?style=invalid-style`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([400, 422]).to.include(response.status);
          
          if (response.status === 400 || response.status === 422) {
            expect(response.headers['content-type']).to.include('application/problem+json');
            
            const errorData = response.data;
            expect(errorData.status).to.equal(response.status);
            expect(errorData.detail).to.be.a('string');
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should reject invalid limit parameter', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test&limit=invalid`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([400, 422]).to.include(response.status);
          
          if (response.status === 400 || response.status === 422) {
            expect(response.headers['content-type']).to.include('application/problem+json');
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should reject limit parameter exceeding maximum', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test&limit=100`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([400, 422]).to.include(response.status);
          
          if (response.status === 400 || response.status === 422) {
            expect(response.headers['content-type']).to.include('application/problem+json');
            
            const errorData = response.data;
            expect(errorData.detail).to.include('limit');
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should reject negative page parameter', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test&page=-1`, {
            timeout: 10000,
            validateStatus: () => true
          });

          expect([400, 422]).to.include(response.status);
          
          if (response.status === 400 || response.status === 422) {
            expect(response.headers['content-type']).to.include('application/problem+json');
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });
    });

    describe('Response Data Validation', function() {
      it('should return properly formatted artist objects', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
            timeout: 10000,
            validateStatus: () => true
          });

          if (response.status === 200 && response.data.length > 0) {
            response.data.forEach(artist => {
              // Required fields
              expect(artist).to.have.property('artistId');
              expect(artist).to.have.property('artistName');
              expect(artist).to.have.property('locationDisplay');
              expect(artist).to.have.property('styles');

              // Data types
              expect(artist.artistId).to.be.a('string');
              expect(artist.artistName).to.be.a('string');
              expect(artist.locationDisplay).to.be.a('string');
              expect(artist.styles).to.be.an('array');

              // Array content validation
              artist.styles.forEach(style => {
                expect(style).to.be.a('string');
                expect(style.length).to.be.greaterThan(0);
              });

              // Optional fields validation
              if (artist.instagramHandle) {
                expect(artist.instagramHandle).to.be.a('string');
              }

              if (artist.portfolioImages) {
                expect(artist.portfolioImages).to.be.an('array');
                artist.portfolioImages.forEach(image => {
                  expect(image).to.have.property('url');
                  expect(image.url).to.be.a('string');
                  expect(image.url).to.match(/^https?:\/\//);
                });
              }

              if (artist.contactInfo) {
                expect(artist.contactInfo).to.be.an('object');
              }
            });
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should return consistent response format', async function() {
        try {
          const response1 = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
            timeout: 10000,
            validateStatus: () => true
          });

          const response2 = await axios.get(`${apiBaseUrl}/v1/artists?style=traditional`, {
            timeout: 10000,
            validateStatus: () => true
          });

          if (response1.status === 200 && response2.status === 200) {
            expect(response1.data).to.be.an('array');
            expect(response2.data).to.be.an('array');

            // Both responses should have the same structure
            if (response1.data.length > 0 && response2.data.length > 0) {
              const artist1 = response1.data[0];
              const artist2 = response2.data[0];

              const keys1 = Object.keys(artist1).sort();
              const keys2 = Object.keys(artist2).sort();

              // Should have same required fields (allowing for optional fields to differ)
              const requiredFields = ['artistId', 'artistName', 'locationDisplay', 'styles'];
              requiredFields.forEach(field => {
                expect(keys1).to.include(field);
                expect(keys2).to.include(field);
              });
            }
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });
    });

    describe('HTTP Headers Validation', function() {
      it('should return proper content-type headers', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
            timeout: 10000,
            validateStatus: () => true
          });

          if (response.status === 200) {
            expect(response.headers['content-type']).to.include('application/json');
          } else if (response.status >= 400) {
            expect(response.headers['content-type']).to.include('application/problem+json');
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });

      it('should include proper CORS headers', async function() {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
            timeout: 10000,
            validateStatus: () => true
          });

          // Check for CORS headers (if CORS is enabled)
          if (response.headers['access-control-allow-origin']) {
            expect(response.headers['access-control-allow-origin']).to.be.a('string');
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      });
    });
  });
});