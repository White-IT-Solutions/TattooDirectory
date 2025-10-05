/**
 * ServiceValidator - Validates service availability and health
 * 
 * Checks that all required services (LocalStack, frontend, backend) are
 * running and accessible before executing tests.
 */

import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';
import { ServiceValidationError, ErrorRecovery } from '../utils/errors.js';

// Re-export ServiceValidationError for convenience
export { ServiceValidationError } from '../utils/errors.js';

export class ServiceValidator {
  constructor() {
    this.logger = new Logger();
    this.config = new Config();
  }

  /**
   * Validate environment and all required services
   * @param {Array} requiredServices - Optional list of specific services to validate
   * @returns {Object} Validation results for each service
   */
  async validateEnvironment(requiredServices = null) {
    this.logger.info('Validating environment and services');

    const serviceEndpoints = await this.config.getServiceEndpoints();
    const servicesToValidate = requiredServices || Object.keys(serviceEndpoints);
    
    const results = {};
    
    for (const serviceName of servicesToValidate) {
      const endpoint = serviceEndpoints[serviceName];
      if (!endpoint) {
        results[serviceName] = {
          status: 'unknown',
          error: `Service configuration not found: ${serviceName}`
        };
        continue;
      }

      try {
        results[serviceName] = await this.validateService(serviceName, endpoint);
      } catch (error) {
        results[serviceName] = {
          status: 'unhealthy',
          error: error.message,
          suggestions: this.generateSuggestions(serviceName)
        };
      }
    }

    return results;
  }

  /**
   * Validate a specific service
   * @param {string} serviceName - Name of the service
   * @param {Object} endpoint - Service endpoint configuration
   * @returns {Object} Validation result
   */
  async validateService(serviceName, endpoint) {
    const { url, healthEndpoint, timeout = 5000 } = endpoint;
    const healthUrl = `${url}${healthEndpoint}`;

    this.logger.debug(`Validating service: ${serviceName} at ${healthUrl}`);

    try {
      const startTime = Date.now();
      const response = await axios.get(healthUrl, {
        timeout,
        validateStatus: (status) => status < 500 // Accept any status < 500 as healthy
      });
      const responseTime = Date.now() - startTime;

      // Service-specific health checks
      const isHealthy = await this.checkServiceSpecificHealth(serviceName, response);
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: `${responseTime}ms`,
        statusCode: response.status,
        url: healthUrl
      };
    } catch (error) {
      const suggestions = this.generateSuggestions(serviceName);
      
      if (error.code === 'ECONNREFUSED') {
        throw new ServiceValidationError(
          serviceName,
          `Service not running or not accessible at ${healthUrl}`,
          error
        );
      } else if (error.code === 'ETIMEDOUT') {
        throw new ServiceValidationError(
          serviceName,
          `Service health check timed out after ${timeout}ms`,
          error
        );
      } else {
        throw new ServiceValidationError(
          serviceName,
          `Health check failed: ${error.message}`,
          error
        );
      }
    }
  }

  /**
   * Perform service-specific health checks
   * @param {string} serviceName - Name of the service
   * @param {Object} response - HTTP response from health endpoint
   * @returns {boolean} True if service is healthy
   */
  async checkServiceSpecificHealth(serviceName, response) {
    switch (serviceName) {
      case 'localstack':
        // LocalStack health endpoint returns service status
        if (response.data && typeof response.data === 'object') {
          const services = response.data.services || {};
          const requiredServices = ['dynamodb', 's3', 'opensearch'];
          const availableServices = requiredServices.filter(service => 
            services[service] === 'available' || services[service] === 'running'
          );
          
          this.logger.debug(`LocalStack services status: ${JSON.stringify(services)}`);
          
          if (availableServices.length !== requiredServices.length) {
            const missingServices = requiredServices.filter(service => 
              !availableServices.includes(service)
            );
            this.logger.warn(`Missing LocalStack services: ${missingServices.join(', ')}`);
          }
          
          return availableServices.length === requiredServices.length;
        }
        return response.status === 200;

      case 'frontend':
        // Frontend should return HTML or JSON and be accessible
        const isHealthy = response.status === 200 && response.data;
        if (!isHealthy) {
          this.logger.debug(`Frontend health check failed: status=${response.status}, hasData=${!!response.data}`);
        }
        return isHealthy;

      case 'backend':
        // Backend Lambda should be accessible (404 is acceptable for Lambda RIE)
        const backendHealthy = response.status === 200 || response.status === 404;
        if (!backendHealthy) {
          this.logger.debug(`Backend health check failed: status=${response.status}`);
        }
        return backendHealthy;

      case 'dynamodb':
      case 'opensearch':
      case 's3':
        // AWS services via LocalStack should be accessible
        return response.status === 200 || response.status === 404;

      default:
        return response.status === 200;
    }
  }

  /**
   * Wait for services to become available
   * @param {Array} services - Array of service names to wait for
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {boolean} True if all services become available
   */
  async waitForServices(services, timeout = 30000) {
    this.logger.info(`Waiting for services to become available: ${services.join(', ')}`);
    
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      const results = await this.validateEnvironment(services);
      const allHealthy = Object.values(results).every(result => result.status === 'healthy');
      
      if (allHealthy) {
        this.logger.success('All services are now available');
        return true;
      }

      // Log which services are still unavailable
      const unhealthyServices = Object.entries(results)
        .filter(([, result]) => result.status !== 'healthy')
        .map(([name]) => name);
      
      this.logger.info(`Still waiting for: ${unhealthyServices.join(', ')}`);
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    this.logger.error(`Timeout waiting for services after ${timeout}ms`);
    return false;
  }

  /**
   * Validate specific services required for a test suite
   * @param {string} testSuite - Name of the test suite
   * @returns {Object} Validation results for required services
   */
  async validateForTestSuite(testSuite) {
    const requiredServices = this.getRequiredServicesForSuite(testSuite);
    this.logger.info(`Validating services for ${testSuite}: ${requiredServices.join(', ')}`);
    
    return await this.validateEnvironment(requiredServices);
  }

  /**
   * Get required services for a specific test suite
   * @param {string} testSuite - Name of the test suite
   * @returns {Array} Array of required service names
   */
  getRequiredServicesForSuite(testSuite) {
    const serviceMap = {
      'frontend-unit': [],
      'backend-unit': ['localstack'],
      'integration': ['localstack', 'frontend', 'backend'],
      'e2e': ['localstack', 'frontend'],
      'security': ['localstack', 'frontend', 'backend'],
      'performance': ['localstack', 'frontend', 'backend'],
      'contracts': ['localstack', 'backend']
    };

    return serviceMap[testSuite] || ['localstack'];
  }

  /**
   * Generate actionable suggestions for fixing service issues
   * @param {string} serviceName - Name of the service with issues
   * @returns {Array} Array of suggestion strings
   */
  generateSuggestions(serviceName) {
    const suggestions = {
      'localstack': [
        'Start LocalStack: npm run local:start',
        'Check Docker: docker ps | grep localstack',
        'View logs: npm run local:logs:localstack',
        'Reset LocalStack: npm run local:reset',
        'Verify Docker is running: docker --version'
      ],
      'frontend': [
        'Start frontend: npm run dev --workspace=frontend',
        'Check port 3000: netstat -an | findstr 3000',
        'View logs: Check frontend terminal output',
        'Install dependencies: npm install --workspace=frontend',
        'Check Next.js config: Verify next.config.mjs'
      ],
      'backend': [
        'Start backend: npm run dev --workspace=backend',
        'Check LocalStack: Ensure LocalStack is running first',
        'View logs: Check backend terminal output',
        'Deploy functions: npm run deploy --workspace=backend',
        'Verify Lambda functions: Check backend/src/handlers/'
      ],
      'dynamodb': [
        'Start LocalStack: npm run local:start',
        'Check DynamoDB: awslocal dynamodb list-tables',
        'Initialize tables: npm run local:init',
        'View LocalStack logs: npm run local:logs:localstack'
      ],
      'opensearch': [
        'Start LocalStack: npm run local:start',
        'Check OpenSearch: curl http://localhost:4571/_cluster/health',
        'Initialize domain: npm run local:init',
        'View OpenSearch logs: docker logs tattoo-directory-opensearch'
      ],
      's3': [
        'Start LocalStack: npm run local:start',
        'Check S3: awslocal s3 ls',
        'Initialize buckets: npm run local:init',
        'View LocalStack logs: npm run local:logs:localstack'
      ]
    };

    return suggestions[serviceName] || [
      `Check if ${serviceName} service is running`,
      `Review ${serviceName} configuration`,
      `Check ${serviceName} logs for errors`,
      `Restart ${serviceName} service`
    ];
  }

  /**
   * Get a summary of all service validation results
   * @param {Object} results - Validation results from validateEnvironment
   * @returns {Object} Summary with counts and overall status
   */
  getValidationSummary(results) {
    const services = Object.keys(results);
    const healthy = services.filter(name => results[name].status === 'healthy');
    const unhealthy = services.filter(name => results[name].status !== 'healthy');
    
    return {
      total: services.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      healthyServices: healthy,
      unhealthyServices: unhealthy,
      allHealthy: unhealthy.length === 0
    };
  }
}