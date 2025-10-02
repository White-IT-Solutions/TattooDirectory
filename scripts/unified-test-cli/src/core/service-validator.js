/**
 * ServiceValidator - Validates service availability and health
 * 
 * Checks that all required services (LocalStack, frontend, backend) are
 * running and accessible before executing tests.
 */

import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

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
      const response = await axios.get(healthUrl, {
        timeout,
        validateStatus: (status) => status < 500 // Accept any status < 500 as healthy
      });

      // Service-specific health checks
      const isHealthy = await this.checkServiceSpecificHealth(serviceName, response);
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: response.headers['x-response-time'] || 'unknown',
        statusCode: response.status
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Service not running or not accessible at ${healthUrl}`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Service health check timed out after ${timeout}ms`);
      } else {
        throw new Error(`Health check failed: ${error.message}`);
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
          return requiredServices.every(service => 
            services[service] === 'available' || services[service] === 'running'
          );
        }
        return response.status === 200;

      case 'frontend':
        // Frontend should return HTML or JSON
        return response.status === 200 && response.data;

      case 'backend':
        // Backend Lambda should be accessible
        return response.status === 200 || response.status === 404; // 404 is OK for Lambda

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
        'Reset LocalStack: npm run local:reset'
      ],
      'frontend': [
        'Start frontend: npm run dev --workspace=frontend',
        'Check port 3000: netstat -an | findstr 3000',
        'View logs: Check frontend terminal output',
        'Install dependencies: npm install --workspace=frontend'
      ],
      'backend': [
        'Start backend: npm run dev --workspace=backend',
        'Check LocalStack: Ensure LocalStack is running first',
        'View logs: Check backend terminal output',
        'Deploy functions: npm run deploy --workspace=backend'
      ]
    };

    return suggestions[serviceName] || [
      `Check if ${serviceName} service is running`,
      `Review ${serviceName} configuration`,
      `Check ${serviceName} logs for errors`
    ];
  }
}