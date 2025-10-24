/**
 * Unit tests for ServiceValidator
 */

import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/logger.js');
jest.mock('../../utils/config.js');

describe('ServiceValidator', () => {
  let ServiceValidator, ServiceValidationError;
  let serviceValidator;
  let mockLogger;
  let mockConfig;

  beforeAll(async () => {
    // Mock logger first
    jest.doMock('../../utils/logger.js', () => ({
      Logger: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn()
      }))
    }));

    // Mock config
    jest.doMock('../../utils/config.js', () => ({
      Config: jest.fn().mockImplementation(() => ({
        getServiceEndpoints: jest.fn()
      }))
    }));

    // Import ServiceValidator class
    const serviceValidatorModule = await import('../../core/service-validator.js');
    ServiceValidator = serviceValidatorModule.ServiceValidator;
    ServiceValidationError = serviceValidatorModule.ServiceValidationError;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    serviceValidator = new ServiceValidator();
    mockLogger = serviceValidator.logger;
    mockConfig = serviceValidator.config;
  });

  describe('constructor', () => {
    it('should initialize logger and config', () => {
      expect(serviceValidator.logger).toBeDefined();
      expect(serviceValidator.config).toBeDefined();
    });
  });

  describe('validateEnvironment', () => {
    const mockServiceEndpoints = {
      localstack: {
        url: 'http://localhost:4566',
        healthEndpoint: '/_localstack/health',
        timeout: 5000
      },
      frontend: {
        url: 'http://localhost:3000',
        healthEndpoint: '/',
        timeout: 3000
      }
    };

    beforeEach(() => {
      mockConfig.getServiceEndpoints.mockResolvedValue(mockServiceEndpoints);
    });

    it('should validate all services when no specific services provided', async () => {
      // Mock successful responses
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: { services: { dynamodb: 'available', s3: 'available', opensearch: 'available' } }
      });
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: '<html>Frontend</html>'
      });

      const results = await serviceValidator.validateEnvironment();

      expect(mockConfig.getServiceEndpoints).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(results).toHaveProperty('localstack');
      expect(results).toHaveProperty('frontend');
      expect(results.localstack.status).toBe('healthy');
      expect(results.frontend.status).toBe('healthy');
    });

    it('should validate only specified services', async () => {
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: { services: { dynamodb: 'available', s3: 'available', opensearch: 'available' } }
      });

      const results = await serviceValidator.validateEnvironment(['localstack']);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(results).toHaveProperty('localstack');
      expect(results).not.toHaveProperty('frontend');
    });

    it('should handle unknown service configuration', async () => {
      const results = await serviceValidator.validateEnvironment(['unknown-service']);

      expect(results['unknown-service']).toEqual({
        status: 'unknown',
        error: 'Service configuration not found: unknown-service'
      });
    });

    it('should handle service validation errors', async () => {
      axios.get.mockRejectedValueOnce(new Error('Connection refused'));

      const results = await serviceValidator.validateEnvironment(['localstack']);

      expect(results.localstack.status).toBe('unhealthy');
      expect(results.localstack.error).toContain('Connection refused');
      expect(results.localstack.suggestions).toBeDefined();
    });
  });

  describe('validateService', () => {
    const mockEndpoint = {
      url: 'http://localhost:4566',
      healthEndpoint: '/_localstack/health',
      timeout: 5000
    };

    it('should validate healthy LocalStack service', async () => {
      const mockResponse = {
        status: 200,
        data: { services: { dynamodb: 'available', s3: 'available', opensearch: 'available' } }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await serviceValidator.validateService('localstack', mockEndpoint);

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4566/_localstack/health',
        expect.objectContaining({
          timeout: 5000,
          validateStatus: expect.any(Function)
        })
      );
      expect(result.status).toBe('healthy');
      expect(result.statusCode).toBe(200);
      expect(result.responseTime).toMatch(/\d+ms/);
    });

    it('should validate healthy frontend service', async () => {
      const mockResponse = {
        status: 200,
        data: '<html>Frontend</html>'
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await serviceValidator.validateService('frontend', {
        url: 'http://localhost:3000',
        healthEndpoint: '/',
        timeout: 3000
      });

      expect(result.status).toBe('healthy');
      expect(result.statusCode).toBe(200);
    });

    it('should validate healthy backend service', async () => {
      const mockResponse = {
        status: 404 // 404 is acceptable for Lambda
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await serviceValidator.validateService('backend', {
        url: 'http://localhost:9000',
        healthEndpoint: '/2015-03-31/functions/function/invocations',
        timeout: 5000
      });

      expect(result.status).toBe('healthy');
      expect(result.statusCode).toBe(404);
    });

    it('should throw ServiceValidationError on connection refused', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      axios.get.mockRejectedValue(error);

      await expect(
        serviceValidator.validateService('localstack', mockEndpoint)
      ).rejects.toThrow(ServiceValidationError);

      try {
        await serviceValidator.validateService('localstack', mockEndpoint);
      } catch (err) {
        expect(err.service).toBe('localstack');
        expect(err.details).toContain('not running or not accessible');
        expect(err.suggestions).toContain('Start LocalStack: npm run local:start');
      }
    });

    it('should throw ServiceValidationError on timeout', async () => {
      const error = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      axios.get.mockRejectedValue(error);

      await expect(
        serviceValidator.validateService('frontend', mockEndpoint)
      ).rejects.toThrow(ServiceValidationError);

      try {
        await serviceValidator.validateService('frontend', mockEndpoint);
      } catch (err) {
        expect(err.service).toBe('frontend');
        expect(err.details).toContain('timed out after 5000ms');
      }
    });

    it('should throw ServiceValidationError on other errors', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(
        serviceValidator.validateService('backend', mockEndpoint)
      ).rejects.toThrow(ServiceValidationError);
    });
  });

  describe('checkServiceSpecificHealth', () => {
    it('should validate LocalStack with all required services', async () => {
      const response = {
        status: 200,
        data: { services: { dynamodb: 'available', s3: 'running', opensearch: 'available' } }
      };

      const isHealthy = await serviceValidator.checkServiceSpecificHealth('localstack', response);

      expect(isHealthy).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('LocalStack services status')
      );
    });

    it('should detect missing LocalStack services', async () => {
      const response = {
        status: 200,
        data: { services: { dynamodb: 'available', s3: 'unavailable' } }
      };

      const isHealthy = await serviceValidator.checkServiceSpecificHealth('localstack', response);

      expect(isHealthy).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Missing LocalStack services')
      );
    });

    it('should handle LocalStack without service data', async () => {
      const response = { status: 200, data: null };

      const isHealthy = await serviceValidator.checkServiceSpecificHealth('localstack', response);

      expect(isHealthy).toBe(true);
    });

    it('should validate frontend with data', async () => {
      const response = { status: 200, data: '<html>Frontend</html>' };

      const isHealthy = await serviceValidator.checkServiceSpecificHealth('frontend', response);

      expect(isHealthy).toBeTruthy();
    });

    it('should reject frontend without data', async () => {
      const response = { status: 200, data: null };

      const isHealthy = await serviceValidator.checkServiceSpecificHealth('frontend', response);

      expect(isHealthy).toBeFalsy();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Frontend health check failed')
      );
    });

    it('should validate backend with 200 or 404 status', async () => {
      const response200 = { status: 200 };
      const response404 = { status: 404 };

      const healthy200 = await serviceValidator.checkServiceSpecificHealth('backend', response200);
      const healthy404 = await serviceValidator.checkServiceSpecificHealth('backend', response404);

      expect(healthy200).toBe(true);
      expect(healthy404).toBe(true);
    });

    it('should reject backend with other status codes', async () => {
      const response = { status: 500 };

      const isHealthy = await serviceValidator.checkServiceSpecificHealth('backend', response);

      expect(isHealthy).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Backend health check failed')
      );
    });

    it('should validate AWS services via LocalStack', async () => {
      const response = { status: 200 };

      const dynamoHealthy = await serviceValidator.checkServiceSpecificHealth('dynamodb', response);
      const opensearchHealthy = await serviceValidator.checkServiceSpecificHealth('opensearch', response);
      const s3Healthy = await serviceValidator.checkServiceSpecificHealth('s3', response);

      expect(dynamoHealthy).toBe(true);
      expect(opensearchHealthy).toBe(true);
      expect(s3Healthy).toBe(true);
    });

    it('should validate unknown services with 200 status', async () => {
      const response = { status: 200 };

      const isHealthy = await serviceValidator.checkServiceSpecificHealth('unknown', response);

      expect(isHealthy).toBe(true);
    });
  });

  describe('waitForServices', () => {
    beforeEach(() => {
      mockConfig.getServiceEndpoints.mockResolvedValue({
        localstack: {
          url: 'http://localhost:4566',
          healthEndpoint: '/_localstack/health',
          timeout: 5000
        }
      });
    });

    it('should return true when all services become healthy', async () => {
      // Mock successful validation
      jest.spyOn(serviceValidator, 'validateEnvironment').mockResolvedValue({
        localstack: { status: 'healthy' }
      });

      const result = await serviceValidator.waitForServices(['localstack'], 5000);

      expect(result).toBe(true);
      expect(mockLogger.success).toHaveBeenCalledWith('All services are now available');
    });

    it('should return false on timeout', async () => {
      // Mock failed validation
      jest.spyOn(serviceValidator, 'validateEnvironment').mockResolvedValue({
        localstack: { status: 'unhealthy' }
      });

      const result = await serviceValidator.waitForServices(['localstack'], 100);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Timeout waiting for services')
      );
    });

    it('should log progress while waiting', async () => {
      let callCount = 0;
      jest.spyOn(serviceValidator, 'validateEnvironment').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ localstack: { status: 'unhealthy' } });
        }
        return Promise.resolve({ localstack: { status: 'healthy' } });
      });

      const result = await serviceValidator.waitForServices(['localstack'], 5000);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Still waiting for: localstack')
      );
    });
  });

  describe('validateForTestSuite', () => {
    beforeEach(() => {
      mockConfig.getServiceEndpoints.mockResolvedValue({
        localstack: {
          url: 'http://localhost:4566',
          healthEndpoint: '/_localstack/health',
          timeout: 5000
        },
        frontend: {
          url: 'http://localhost:3000',
          healthEndpoint: '/',
          timeout: 3000
        }
      });
    });

    it('should validate services for integration test suite', async () => {
      jest.spyOn(serviceValidator, 'validateEnvironment').mockResolvedValue({
        localstack: { status: 'healthy' },
        frontend: { status: 'healthy' },
        backend: { status: 'healthy' }
      });

      const results = await serviceValidator.validateForTestSuite('integration');

      expect(serviceValidator.validateEnvironment).toHaveBeenCalledWith([
        'localstack', 'frontend', 'backend'
      ]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Validating services for integration')
      );
    });

    it('should validate services for frontend unit tests', async () => {
      jest.spyOn(serviceValidator, 'validateEnvironment').mockResolvedValue({});

      await serviceValidator.validateForTestSuite('frontend-unit');

      expect(serviceValidator.validateEnvironment).toHaveBeenCalledWith([]);
    });

    it('should validate services for backend unit tests', async () => {
      jest.spyOn(serviceValidator, 'validateEnvironment').mockResolvedValue({
        localstack: { status: 'healthy' }
      });

      await serviceValidator.validateForTestSuite('backend-unit');

      expect(serviceValidator.validateEnvironment).toHaveBeenCalledWith(['localstack']);
    });
  });

  describe('getRequiredServicesForSuite', () => {
    it('should return correct services for each test suite', () => {
      expect(serviceValidator.getRequiredServicesForSuite('frontend-unit')).toEqual([]);
      expect(serviceValidator.getRequiredServicesForSuite('backend-unit')).toEqual(['localstack']);
      expect(serviceValidator.getRequiredServicesForSuite('integration')).toEqual([
        'localstack', 'frontend', 'backend'
      ]);
      expect(serviceValidator.getRequiredServicesForSuite('e2e')).toEqual(['localstack', 'frontend']);
      expect(serviceValidator.getRequiredServicesForSuite('security')).toEqual([
        'localstack', 'frontend', 'backend'
      ]);
      expect(serviceValidator.getRequiredServicesForSuite('performance')).toEqual([
        'localstack', 'frontend', 'backend'
      ]);
      expect(serviceValidator.getRequiredServicesForSuite('contracts')).toEqual([
        'localstack', 'backend'
      ]);
      expect(serviceValidator.getRequiredServicesForSuite('unknown')).toEqual(['localstack']);
    });
  });

  describe('generateSuggestions', () => {
    it('should return LocalStack suggestions', () => {
      const suggestions = serviceValidator.generateSuggestions('localstack');

      expect(suggestions).toContain('Start LocalStack: npm run local:start');
      expect(suggestions).toContain('Check Docker: docker ps | grep localstack');
      expect(suggestions).toContain('View logs: npm run local:logs:localstack');
      expect(suggestions).toContain('Reset LocalStack: npm run local:reset');
      expect(suggestions).toContain('Verify Docker is running: docker --version');
    });

    it('should return frontend suggestions', () => {
      const suggestions = serviceValidator.generateSuggestions('frontend');

      expect(suggestions).toContain('Start frontend: npm run dev --workspace=frontend');
      expect(suggestions).toContain('Check port 3000: netstat -an | findstr 3000');
      expect(suggestions).toContain('Install dependencies: npm install --workspace=frontend');
    });

    it('should return backend suggestions', () => {
      const suggestions = serviceValidator.generateSuggestions('backend');

      expect(suggestions).toContain('Start backend: npm run dev --workspace=backend');
      expect(suggestions).toContain('Check LocalStack: Ensure LocalStack is running first');
      expect(suggestions).toContain('Deploy functions: npm run deploy --workspace=backend');
    });

    it('should return AWS service suggestions', () => {
      const dynamoSuggestions = serviceValidator.generateSuggestions('dynamodb');
      const opensearchSuggestions = serviceValidator.generateSuggestions('opensearch');
      const s3Suggestions = serviceValidator.generateSuggestions('s3');

      expect(dynamoSuggestions).toContain('Start LocalStack: npm run local:start');
      expect(opensearchSuggestions).toContain('Start LocalStack: npm run local:start');
      expect(s3Suggestions).toContain('Start LocalStack: npm run local:start');
    });

    it('should return generic suggestions for unknown services', () => {
      const suggestions = serviceValidator.generateSuggestions('unknown-service');

      expect(suggestions).toContain('Check if unknown-service service is running');
      expect(suggestions).toContain('Review unknown-service configuration');
      expect(suggestions).toContain('Check unknown-service logs for errors');
      expect(suggestions).toContain('Restart unknown-service service');
    });
  });

  describe('getValidationSummary', () => {
    it('should return correct summary for all healthy services', () => {
      const results = {
        localstack: { status: 'healthy' },
        frontend: { status: 'healthy' },
        backend: { status: 'healthy' }
      };

      const summary = serviceValidator.getValidationSummary(results);

      expect(summary).toEqual({
        total: 3,
        healthy: 3,
        unhealthy: 0,
        healthyServices: ['localstack', 'frontend', 'backend'],
        unhealthyServices: [],
        allHealthy: true
      });
    });

    it('should return correct summary for mixed service health', () => {
      const results = {
        localstack: { status: 'healthy' },
        frontend: { status: 'unhealthy' },
        backend: { status: 'unknown' }
      };

      const summary = serviceValidator.getValidationSummary(results);

      expect(summary).toEqual({
        total: 3,
        healthy: 1,
        unhealthy: 2,
        healthyServices: ['localstack'],
        unhealthyServices: ['frontend', 'backend'],
        allHealthy: false
      });
    });

    it('should handle empty results', () => {
      const summary = serviceValidator.getValidationSummary({});

      expect(summary).toEqual({
        total: 0,
        healthy: 0,
        unhealthy: 0,
        healthyServices: [],
        unhealthyServices: [],
        allHealthy: true
      });
    });
  });
});

describe('ServiceValidationError', () => {
  let ServiceValidationError;

  beforeAll(async () => {
    const serviceValidatorModule = await import('../../core/service-validator.js');
    ServiceValidationError = serviceValidatorModule.ServiceValidationError;
  });

  it('should create error with service, details, and suggestions', () => {
    const suggestions = ['Start service', 'Check logs'];
    const error = new ServiceValidationError('test-service', 'Connection failed', suggestions);

    expect(error.name).toBe('ServiceValidationError');
    expect(error.message).toBe('Service test-service is not available: Connection failed');
    expect(error.service).toBe('test-service');
    expect(error.details).toBe('Connection failed');
    expect(error.suggestions).toEqual(suggestions);
  });

  it('should create error with auto-generated suggestions', () => {
    const error = new ServiceValidationError('test-service', 'Connection failed');

    expect(error.suggestions).toEqual([
      'Check if test-service service is running',
      'Review test-service configuration',
      'Check test-service logs for errors',
      'Restart test-service service'
    ]);
  });
});