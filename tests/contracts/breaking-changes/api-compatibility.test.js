/**
 * API Compatibility and Breaking Change Detection Tests
 * 
 * Tests to detect breaking changes in the API contract and ensure
 * backward compatibility is maintained across API versions.
 */

const { expect } = require('chai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

describe('API Compatibility and Breaking Changes', function() {
  let apiBaseUrl;
  let currentApiVersion;

  before(function() {
    apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:9000';
    currentApiVersion = 'v1'; // Current API version being tested
    console.log(`Testing API compatibility for version: ${currentApiVersion}`);
  });

  describe('Endpoint Availability', function() {
    it('should maintain existing endpoint paths', async function() {
      const criticalEndpoints = [
        '/v1/artists'
      ];

      for (const endpoint of criticalEndpoints) {
        try {
          const response = await axios.get(`${apiBaseUrl}${endpoint}?query=test`, {
            timeout: 10000,
            validateStatus: () => true
          });

          // Endpoint should exist (not return 404)
          expect(response.status).to.not.equal(404, 
            `BREAKING CHANGE: Endpoint ${endpoint} no longer exists`);
          
          // Should return expected status codes
          expect([200, 400, 422, 500, 503]).to.include(response.status,
            `Endpoint ${endpoint} returned unexpected status: ${response.status}`);
            
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            expect.fail(`BREAKING CHANGE: Endpoint ${endpoint} is not accessible: ${error.message}`);
          }
        }
      }
    });

    it('should not remove required query parameters', async function() {
      try {
        // Test that the API still accepts previously required parameters
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Should not return 400 for missing required parameters that were previously optional
        if (response.status === 400) {
          const errorData = response.data;
          
          // Check if error is about missing parameters that should still be supported
          if (errorData.detail && errorData.detail.includes('required')) {
            // This might indicate a breaking change if previously optional parameters are now required
            console.warn('Potential breaking change detected in parameter requirements');
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

  describe('Response Format Compatibility', function() {
    it('should maintain required response fields', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        if (response.status === 200 && response.data.length > 0) {
          const artist = response.data[0];
          
          // Critical fields that should never be removed
          const requiredFields = [
            'artistId',
            'artistName',
            'locationDisplay',
            'styles'
          ];

          requiredFields.forEach(field => {
            expect(artist).to.have.property(field, 
              `BREAKING CHANGE: Required field '${field}' is missing from artist response`);
          });

          // Check data types haven't changed
          expect(artist.artistId).to.be.a('string', 
            'BREAKING CHANGE: artistId field type changed');
          expect(artist.artistName).to.be.a('string', 
            'BREAKING CHANGE: artistName field type changed');
          expect(artist.locationDisplay).to.be.a('string', 
            'BREAKING CHANGE: locationDisplay field type changed');
          expect(artist.styles).to.be.an('array', 
            'BREAKING CHANGE: styles field type changed');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.skip('API server not available');
        } else {
          throw error;
        }
      }
    });

    it('should maintain response array structure', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        if (response.status === 200) {
          expect(response.data).to.be.an('array', 
            'BREAKING CHANGE: Response is no longer an array');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.skip('API server not available');
        } else {
          throw error;
        }
      }
    });

    it('should maintain error response format', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists`, {
          timeout: 10000,
          validateStatus: () => true
        });

        if (response.status === 400) {
          expect(response.headers['content-type']).to.include('application/problem+json',
            'BREAKING CHANGE: Error response content-type changed');

          const errorData = response.data;
          
          // RFC 9457 Problem Details fields should be maintained
          const requiredErrorFields = ['type', 'title', 'status', 'detail'];
          
          requiredErrorFields.forEach(field => {
            expect(errorData).to.have.property(field,
              `BREAKING CHANGE: Error response missing required field '${field}'`);
          });

          expect(errorData.status).to.equal(400,
            'BREAKING CHANGE: Error response status field value changed');
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

  describe('Parameter Compatibility', function() {
    it('should maintain support for existing query parameters', async function() {
      const existingParameters = [
        { name: 'query', value: 'test' },
        { name: 'style', value: 'traditional' },
        { name: 'location', value: 'London' },
        { name: 'limit', value: '10' },
        { name: 'page', value: '1' }
      ];

      for (const param of existingParameters) {
        try {
          const response = await axios.get(`${apiBaseUrl}/v1/artists?${param.name}=${param.value}`, {
            timeout: 10000,
            validateStatus: () => true
          });

          // Parameter should still be recognized (not cause 400 for unknown parameter)
          if (response.status === 400) {
            const errorData = response.data;
            if (errorData.detail && errorData.detail.toLowerCase().includes('unknown') && 
                errorData.detail.includes(param.name)) {
              expect.fail(`BREAKING CHANGE: Parameter '${param.name}' is no longer supported`);
            }
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      }
    });

    it('should maintain parameter validation rules', async function() {
      try {
        // Test that invalid style values still return appropriate errors
        const response = await axios.get(`${apiBaseUrl}/v1/artists?style=invalid-style`, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Should still validate style parameter
        expect([400, 422]).to.include(response.status,
          'BREAKING CHANGE: Style parameter validation changed or removed');
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.skip('API server not available');
        } else {
          throw error;
        }
      }
    });

    it('should maintain parameter limits and constraints', async function() {
      try {
        // Test that limit parameter constraints are maintained
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test&limit=100`, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Should still enforce limit constraints
        if (response.status === 200) {
          expect(response.data.length).to.be.at.most(50,
            'BREAKING CHANGE: Limit parameter constraint changed');
        } else {
          expect([400, 422]).to.include(response.status,
            'Limit validation should still work');
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

  describe('HTTP Status Code Compatibility', function() {
    it('should maintain expected status codes for success cases', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Success should still return 200
        if (response.data && Array.isArray(response.data)) {
          expect(response.status).to.equal(200,
            'BREAKING CHANGE: Success status code changed from 200');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.skip('API server not available');
        } else {
          throw error;
        }
      }
    });

    it('should maintain expected status codes for error cases', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists`, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Bad request should still return 400
        expect(response.status).to.equal(400,
          'BREAKING CHANGE: Bad request status code changed from 400');
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.skip('API server not available');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Content-Type Compatibility', function() {
    it('should maintain JSON response content-type', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        if (response.status === 200) {
          expect(response.headers['content-type']).to.include('application/json',
            'BREAKING CHANGE: Success response content-type changed');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.skip('API server not available');
        } else {
          throw error;
        }
      }
    });

    it('should maintain Problem Details content-type for errors', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists`, {
          timeout: 10000,
          validateStatus: () => true
        });

        if (response.status >= 400) {
          expect(response.headers['content-type']).to.include('application/problem+json',
            'BREAKING CHANGE: Error response content-type changed');
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

  describe('Backward Compatibility Validation', function() {
    it('should not introduce new required fields without default values', async function() {
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        if (response.status === 200 && response.data.length > 0) {
          const artist = response.data[0];
          
          // Check that all fields are either optional or have reasonable defaults
          // This is a heuristic check - in practice, you'd compare against a baseline
          Object.keys(artist).forEach(field => {
            const value = artist[field];
            
            // Fields should not be null or undefined (indicating missing required data)
            if (value === null || value === undefined) {
              console.warn(`Potential breaking change: Field '${field}' is null/undefined`);
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

    it('should maintain API version in URL path', async function() {
      // Ensure v1 API is still accessible
      const versionedEndpoint = '/v1/artists';
      
      try {
        const response = await axios.get(`${apiBaseUrl}${versionedEndpoint}?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        expect(response.status).to.not.equal(404,
          'BREAKING CHANGE: Versioned API endpoint no longer exists');
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.skip('API server not available');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Performance Contract Compatibility', function() {
    it('should maintain reasonable response times', async function() {
      const startTime = Date.now();
      
      try {
        const response = await axios.get(`${apiBaseUrl}/v1/artists?query=test`, {
          timeout: 10000,
          validateStatus: () => true
        });

        const responseTime = Date.now() - startTime;
        
        // Response time should not significantly degrade (contract violation)
        expect(responseTime).to.be.below(5000,
          'PERFORMANCE REGRESSION: Response time significantly increased');
          
        if (responseTime > 1000) {
          console.warn(`Performance warning: Response time ${responseTime}ms exceeds 1 second`);
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