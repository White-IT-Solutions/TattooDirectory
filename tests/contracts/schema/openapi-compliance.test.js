/**
 * OpenAPI Schema Compliance Tests
 * 
 * Tests to validate that the API responses comply with the OpenAPI specification
 * and that all endpoints follow the defined schema contracts.
 */

const { expect } = require('chai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

describe('OpenAPI Schema Compliance', function() {
  let openApiSpec;
  let ajv;
  let apiBaseUrl;

  before(async function() {
    // Load OpenAPI specification
    const specPath = process.env.OPENAPI_SPEC_PATH || path.join(__dirname, '../../../backend/docs/openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    openApiSpec = yaml.load(specContent);

    // Initialize AJV for schema validation
    ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    // Set API base URL
    apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:9000';

    console.log(`Testing API compliance against: ${apiBaseUrl}`);
    console.log(`Using OpenAPI spec: ${specPath}`);
  });

  describe('OpenAPI Specification Validation', function() {
    it('should have valid OpenAPI specification structure', function() {
      expect(openApiSpec).to.be.an('object');
      expect(openApiSpec.openapi).to.match(/^3\.\d+\.\d+$/);
      expect(openApiSpec.info).to.be.an('object');
      expect(openApiSpec.paths).to.be.an('object');
    });

    it('should have required info fields', function() {
      expect(openApiSpec.info.title).to.be.a('string');
      expect(openApiSpec.info.version).to.be.a('string');
      expect(openApiSpec.info.description).to.be.a('string');
    });

    it('should have valid server configurations', function() {
      expect(openApiSpec.servers).to.be.an('array');
      expect(openApiSpec.servers.length).to.be.greaterThan(0);
      
      openApiSpec.servers.forEach(server => {
        expect(server.url).to.be.a('string');
        expect(server.description).to.be.a('string');
      });
    });

    it('should have valid component schemas', function() {
      if (openApiSpec.components && openApiSpec.components.schemas) {
        Object.keys(openApiSpec.components.schemas).forEach(schemaName => {
          const schema = openApiSpec.components.schemas[schemaName];
          expect(schema).to.be.an('object');
          expect(schema.type).to.be.a('string');
        });
      }
    });
  });

  describe('API Endpoint Schema Compliance', function() {
    it('should validate all API endpoints have proper operation definitions', function() {
      expect(openApiSpec.paths).to.be.an('object');
      
      Object.keys(openApiSpec.paths).forEach(pathKey => {
        const pathItem = openApiSpec.paths[pathKey];
        
        Object.keys(pathItem).forEach(method => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            const operation = pathItem[method];
            
            expect(operation.operationId, `${method.toUpperCase()} ${pathKey} should have operationId`).to.be.a('string');
            expect(operation.summary, `${method.toUpperCase()} ${pathKey} should have summary`).to.be.a('string');
            expect(operation.responses, `${method.toUpperCase()} ${pathKey} should have responses`).to.be.an('object');
          }
        });
      });
    });

    it('should validate all endpoints have proper response schemas', function() {
      Object.keys(openApiSpec.paths).forEach(pathKey => {
        const pathItem = openApiSpec.paths[pathKey];
        
        Object.keys(pathItem).forEach(method => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            const operation = pathItem[method];
            
            Object.keys(operation.responses).forEach(statusCode => {
              const response = operation.responses[statusCode];
              expect(response.description, `${method.toUpperCase()} ${pathKey} ${statusCode} should have description`).to.be.a('string');
              
              if (response.content) {
                Object.keys(response.content).forEach(mediaType => {
                  const mediaTypeObj = response.content[mediaType];
                  if (mediaTypeObj.schema) {
                    expect(mediaTypeObj.schema, `${method.toUpperCase()} ${pathKey} ${statusCode} ${mediaType} should have valid schema`).to.be.an('object');
                  }
                });
              }
            });
          }
        });
      });
    });

    it('should test artists endpoint response against schema', async function() {
      const pathKey = '/v1/artists';
      const method = 'get';
      
      if (openApiSpec.paths[pathKey] && openApiSpec.paths[pathKey][method]) {
        const operation = openApiSpec.paths[pathKey][method];
        
        try {
          const response = await axios.get(`${apiBaseUrl}${pathKey}?query=test`, {
            timeout: 10000,
            validateStatus: () => true
          });

          // Check if response status is defined in OpenAPI spec
          expect(operation.responses[response.status.toString()]).to.exist;

          // Validate response schema if 200 OK
          if (response.status === 200) {
            const responseSchema = operation.responses['200'].content['application/json'].schema;
            
            if (responseSchema) {
              // Resolve schema references
              const resolvedSchema = resolveSchemaReferences(responseSchema, openApiSpec);
              
              // Validate response data against schema
              const validate = ajv.compile(resolvedSchema);
              const valid = validate(response.data);
              
              if (!valid) {
                console.log('Schema validation errors:', validate.errors);
                expect.fail(`Response does not match schema: ${JSON.stringify(validate.errors, null, 2)}`);
              }
            }
          }
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.skip('API server not available');
          } else {
            throw error;
          }
        }
      } else {
        this.skip('Artists endpoint not defined in OpenAPI spec');
      }
    });
  });

  describe('Error Response Schema Compliance', function() {
    it('should define error response schemas', function() {
      // Check that error responses (4xx, 5xx) have proper schema definitions
      Object.keys(openApiSpec.paths).forEach(pathKey => {
        const pathItem = openApiSpec.paths[pathKey];
        
        Object.keys(pathItem).forEach(method => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            const operation = pathItem[method];
            
            // Check for error response definitions
            const errorStatuses = Object.keys(operation.responses).filter(status => 
              status.startsWith('4') || status.startsWith('5')
            );
            
            expect(errorStatuses.length).to.be.greaterThan(0, 
              `${method.toUpperCase()} ${pathKey} should define error responses`);
            
            errorStatuses.forEach(status => {
              const errorResponse = operation.responses[status];
              expect(errorResponse.description).to.be.a('string');
              
              // Check for RFC 9457 Problem Details format
              if (errorResponse.content && errorResponse.content['application/problem+json']) {
                const problemSchema = errorResponse.content['application/problem+json'].schema;
                expect(problemSchema).to.exist;
              }
            });
          }
        });
      });
    });

    it('should test actual error responses match schema', async function() {
      try {
        // Test 400 Bad Request
        const badResponse = await axios.get(`${apiBaseUrl}/v1/artists`, {
          timeout: 5000,
          validateStatus: () => true
        });

        if (badResponse.status === 400) {
          expect(badResponse.headers['content-type']).to.include('application/problem+json');
          
          const errorData = badResponse.data;
          expect(errorData.type).to.be.a('string');
          expect(errorData.title).to.be.a('string');
          expect(errorData.status).to.equal(400);
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
  });

  // Helper method to resolve schema references
  function resolveSchemaReferences(schema, spec) {
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/', '').split('/');
      let resolved = spec;
      
      refPath.forEach(part => {
        resolved = resolved[part];
      });
      
      return resolved;
    }
    
    if (schema.type === 'array' && schema.items) {
      return {
        ...schema,
        items: resolveSchemaReferences(schema.items, spec)
      };
    }
    
    if (schema.type === 'object' && schema.properties) {
      const resolvedProperties = {};
      Object.keys(schema.properties).forEach(prop => {
        resolvedProperties[prop] = resolveSchemaReferences(schema.properties[prop], spec);
      });
      
      return {
        ...schema,
        properties: resolvedProperties
      };
    }
    
    return schema;
  }
});