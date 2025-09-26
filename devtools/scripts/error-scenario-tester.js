#!/usr/bin/env node

/**
 * Error Scenario Testing Utilities
 * 
 * Provides utilities for testing various error scenarios in the development environment:
 * - Network failures and timeouts
 * - Service unavailability
 * - Rate limiting scenarios
 * - Data corruption and validation errors
 * - Performance degradation simulation
 */

const axios = require('axios');
const { EventEmitter } = require('events');

class ErrorScenarioTester extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.proxyUrl = options.proxyUrl || 'http://localhost:9001';
        this.backendUrl = options.backendUrl || 'http://localhost:9000';
        this.scenarios = new Map();
        this.activeScenarios = new Set();
        this.testResults = [];
        
        this.setupDefaultScenarios();
    }

    /**
     * Setup default error scenarios
     */
    setupDefaultScenarios() {
        // Network and connectivity errors
        this.addScenario('network_timeout', {
            name: 'Network Timeout',
            description: 'Simulate network timeout errors',
            type: 'network',
            config: {
                delay: 30000, // 30 second delay
                statusCode: 408,
                message: 'Request timeout'
            }
        });

        this.addScenario('connection_refused', {
            name: 'Connection Refused',
            description: 'Simulate connection refused errors',
            type: 'network',
            config: {
                statusCode: 503,
                message: 'Service temporarily unavailable'
            }
        });

        // Service errors
        this.addScenario('service_unavailable', {
            name: 'Service Unavailable',
            description: 'Simulate service unavailable errors',
            type: 'service',
            config: {
                statusCode: 503,
                message: 'Service temporarily unavailable',
                retryAfter: 60
            }
        });

        this.addScenario('internal_server_error', {
            name: 'Internal Server Error',
            description: 'Simulate internal server errors',
            type: 'service',
            config: {
                statusCode: 500,
                message: 'Internal server error occurred'
            }
        });

        // Rate limiting
        this.addScenario('rate_limit_exceeded', {
            name: 'Rate Limit Exceeded',
            description: 'Simulate rate limiting errors',
            type: 'rate_limit',
            config: {
                statusCode: 429,
                message: 'Too many requests',
                retryAfter: 60,
                limit: 100,
                remaining: 0
            }
        });

        // Validation errors
        this.addScenario('validation_error', {
            name: 'Validation Error',
            description: 'Simulate validation errors',
            type: 'validation',
            config: {
                statusCode: 400,
                message: 'Validation failed',
                errors: [
                    {
                        field: 'style',
                        code: 'invalid_value',
                        message: 'Invalid tattoo style specified'
                    }
                ]
            }
        });

        this.addScenario('missing_parameters', {
            name: 'Missing Parameters',
            description: 'Simulate missing required parameters',
            type: 'validation',
            config: {
                statusCode: 400,
                message: 'Missing required parameters',
                errors: [
                    {
                        field: 'artistId',
                        code: 'required',
                        message: 'Artist ID is required'
                    }
                ]
            }
        });

        // Authentication and authorization
        this.addScenario('unauthorized', {
            name: 'Unauthorized Access',
            description: 'Simulate unauthorized access errors',
            type: 'auth',
            config: {
                statusCode: 401,
                message: 'Unauthorized access'
            }
        });

        this.addScenario('forbidden', {
            name: 'Forbidden Access',
            description: 'Simulate forbidden access errors',
            type: 'auth',
            config: {
                statusCode: 403,
                message: 'Access forbidden'
            }
        });

        // Data errors
        this.addScenario('not_found', {
            name: 'Resource Not Found',
            description: 'Simulate resource not found errors',
            type: 'data',
            config: {
                statusCode: 404,
                message: 'Artist not found'
            }
        });

        this.addScenario('data_corruption', {
            name: 'Data Corruption',
            description: 'Simulate corrupted data responses',
            type: 'data',
            config: {
                statusCode: 200,
                corruptedData: true,
                message: 'Data partially corrupted'
            }
        });

        // Performance issues
        this.addScenario('slow_response', {
            name: 'Slow Response',
            description: 'Simulate slow API responses',
            type: 'performance',
            config: {
                delay: 5000, // 5 second delay
                statusCode: 200,
                message: 'Response delayed'
            }
        });

        this.addScenario('memory_exhaustion', {
            name: 'Memory Exhaustion',
            description: 'Simulate memory exhaustion errors',
            type: 'performance',
            config: {
                statusCode: 507,
                message: 'Insufficient storage'
            }
        });
    }

    /**
     * Add a new error scenario
     */
    addScenario(id, scenario) {
        this.scenarios.set(id, {
            id,
            ...scenario,
            createdAt: new Date().toISOString()
        });
    }

    /**
     * Get all available scenarios
     */
    getScenarios() {
        return Array.from(this.scenarios.values());
    }

    /**
     * Get scenario by ID
     */
    getScenario(id) {
        return this.scenarios.get(id);
    }

    /**
     * Activate an error scenario
     */
    async activateScenario(scenarioId, endpoint = '/v1/artists', options = {}) {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw new Error(`Scenario '${scenarioId}' not found`);
        }

        console.log(`🎭 Activating scenario: ${scenario.name} for ${endpoint}`);

        try {
            const response = await axios.post(
                `${this.proxyUrl}/_dev/error${endpoint}`,
                {
                    ...scenario.config,
                    ...options,
                    scenarioId,
                    activatedAt: new Date().toISOString()
                }
            );

            this.activeScenarios.add(`${scenarioId}:${endpoint}`);
            
            this.emit('scenarioActivated', {
                scenarioId,
                endpoint,
                scenario,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ Scenario '${scenario.name}' activated for ${endpoint}`);
            return response.data;

        } catch (error) {
            console.error(`❌ Failed to activate scenario: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deactivate an error scenario
     */
    async deactivateScenario(scenarioId, endpoint = '/v1/artists') {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw new Error(`Scenario '${scenarioId}' not found`);
        }

        console.log(`🎭 Deactivating scenario: ${scenario.name} for ${endpoint}`);

        try {
            const response = await axios.delete(`${this.proxyUrl}/_dev/error${endpoint}`);

            this.activeScenarios.delete(`${scenarioId}:${endpoint}`);
            
            this.emit('scenarioDeactivated', {
                scenarioId,
                endpoint,
                scenario,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ Scenario '${scenario.name}' deactivated for ${endpoint}`);
            return response.data;

        } catch (error) {
            console.error(`❌ Failed to deactivate scenario: ${error.message}`);
            throw error;
        }
    }

    /**
     * Deactivate all scenarios
     */
    async deactivateAllScenarios() {
        console.log('🎭 Deactivating all error scenarios...');

        const deactivationPromises = Array.from(this.activeScenarios).map(scenarioEndpoint => {
            const [scenarioId, endpoint] = scenarioEndpoint.split(':');
            return this.deactivateScenario(scenarioId, endpoint).catch(error => {
                console.warn(`Failed to deactivate ${scenarioId} for ${endpoint}: ${error.message}`);
            });
        });

        await Promise.all(deactivationPromises);
        this.activeScenarios.clear();
        
        console.log('✅ All scenarios deactivated');
    }

    /**
     * Test a specific scenario
     */
    async testScenario(scenarioId, endpoint = '/v1/artists', testOptions = {}) {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw new Error(`Scenario '${scenarioId}' not found`);
        }

        const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const startTime = Date.now();

        console.log(`🧪 Testing scenario: ${scenario.name}`);

        const testResult = {
            testId,
            scenarioId,
            scenario: scenario.name,
            endpoint,
            startTime: new Date(startTime).toISOString(),
            duration: 0,
            success: false,
            error: null,
            response: null,
            expectedBehavior: scenario.description
        };

        try {
            // Activate scenario
            await this.activateScenario(scenarioId, endpoint);

            // Wait a moment for scenario to be active
            await new Promise(resolve => setTimeout(resolve, 100));

            // Make test request
            const testRequest = this.createTestRequest(endpoint, testOptions);
            
            try {
                const response = await testRequest;
                testResult.response = {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data,
                    headers: response.headers
                };
                
                // Verify expected behavior
                testResult.success = this.verifyScenarioResponse(scenario, response);
                
            } catch (requestError) {
                // Error responses are expected for most scenarios
                testResult.response = {
                    status: requestError.response?.status,
                    statusText: requestError.response?.statusText,
                    data: requestError.response?.data,
                    error: requestError.message
                };
                
                // Verify expected error behavior
                testResult.success = this.verifyScenarioError(scenario, requestError);
            }

            // Deactivate scenario
            await this.deactivateScenario(scenarioId, endpoint);

        } catch (error) {
            testResult.error = error.message;
            console.error(`❌ Test failed: ${error.message}`);
        }

        testResult.duration = Date.now() - startTime;
        testResult.endTime = new Date().toISOString();

        this.testResults.push(testResult);
        
        this.emit('testCompleted', testResult);

        const status = testResult.success ? '✅' : '❌';
        console.log(`${status} Test completed: ${scenario.name} (${testResult.duration}ms)`);

        return testResult;
    }

    /**
     * Create test request for endpoint
     */
    createTestRequest(endpoint, options = {}) {
        const method = options.method || 'GET';
        const data = options.data || null;
        const params = options.params || {};

        let url = `${this.proxyUrl}${endpoint}`;
        
        // For Lambda invocation format
        if (endpoint.startsWith('/v1/')) {
            url = `${this.proxyUrl}/2015-03-31/functions/function/invocations`;
            return axios.post(url, {
                httpMethod: method,
                path: endpoint,
                pathParameters: options.pathParameters || {},
                queryStringParameters: params,
                headers: options.headers || {},
                body: data ? JSON.stringify(data) : null
            }, {
                timeout: options.timeout || 10000
            });
        }

        // Direct API call
        return axios({
            method,
            url,
            data,
            params,
            headers: options.headers || {},
            timeout: options.timeout || 10000
        });
    }

    /**
     * Verify scenario response matches expected behavior
     */
    verifyScenarioResponse(scenario, response) {
        const expectedStatus = scenario.config.statusCode;
        
        if (response.status !== expectedStatus) {
            console.warn(`Expected status ${expectedStatus}, got ${response.status}`);
            return false;
        }

        // Additional verification based on scenario type
        switch (scenario.type) {
            case 'rate_limit':
                return response.headers['retry-after'] !== undefined;
            
            case 'validation':
                return response.data && response.data.errors && Array.isArray(response.data.errors);
            
            case 'data':
                if (scenario.config.corruptedData) {
                    // Check if data appears corrupted
                    return response.data && typeof response.data === 'object';
                }
                return true;
            
            default:
                return true;
        }
    }

    /**
     * Verify scenario error matches expected behavior
     */
    verifyScenarioError(scenario, error) {
        const expectedStatus = scenario.config.statusCode;
        const actualStatus = error.response?.status;
        
        if (actualStatus !== expectedStatus) {
            console.warn(`Expected error status ${expectedStatus}, got ${actualStatus}`);
            return false;
        }

        return true;
    }

    /**
     * Run a comprehensive test suite
     */
    async runTestSuite(options = {}) {
        const {
            scenarios = Array.from(this.scenarios.keys()),
            endpoints = ['/v1/artists', '/v1/artists/search', '/v1/artists/artist-001'],
            parallel = false
        } = options;

        console.log(`🧪 Running test suite with ${scenarios.length} scenarios on ${endpoints.length} endpoints`);

        const testPromises = [];

        for (const scenarioId of scenarios) {
            for (const endpoint of endpoints) {
                const testPromise = this.testScenario(scenarioId, endpoint);
                
                if (parallel) {
                    testPromises.push(testPromise);
                } else {
                    await testPromise;
                    // Small delay between tests
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        if (parallel) {
            await Promise.all(testPromises);
        }

        // Generate test report
        const report = this.generateTestReport();
        console.log('\n📊 Test Suite Results:');
        console.log(`Total Tests: ${report.totalTests}`);
        console.log(`Passed: ${report.passed}`);
        console.log(`Failed: ${report.failed}`);
        console.log(`Success Rate: ${report.successRate}%`);

        return report;
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passed = this.testResults.filter(result => result.success).length;
        const failed = totalTests - passed;
        const successRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

        const report = {
            generatedAt: new Date().toISOString(),
            totalTests,
            passed,
            failed,
            successRate,
            averageDuration: totalTests > 0 ? 
                Math.round(this.testResults.reduce((sum, result) => sum + result.duration, 0) / totalTests) : 0,
            results: this.testResults,
            scenarioBreakdown: this.getScenarioBreakdown(),
            endpointBreakdown: this.getEndpointBreakdown()
        };

        return report;
    }

    /**
     * Get scenario breakdown
     */
    getScenarioBreakdown() {
        const breakdown = {};
        
        this.testResults.forEach(result => {
            if (!breakdown[result.scenarioId]) {
                breakdown[result.scenarioId] = {
                    total: 0,
                    passed: 0,
                    failed: 0
                };
            }
            
            breakdown[result.scenarioId].total++;
            if (result.success) {
                breakdown[result.scenarioId].passed++;
            } else {
                breakdown[result.scenarioId].failed++;
            }
        });

        return breakdown;
    }

    /**
     * Get endpoint breakdown
     */
    getEndpointBreakdown() {
        const breakdown = {};
        
        this.testResults.forEach(result => {
            if (!breakdown[result.endpoint]) {
                breakdown[result.endpoint] = {
                    total: 0,
                    passed: 0,
                    failed: 0
                };
            }
            
            breakdown[result.endpoint].total++;
            if (result.success) {
                breakdown[result.endpoint].passed++;
            } else {
                breakdown[result.endpoint].failed++;
            }
        });

        return breakdown;
    }

    /**
     * Clear test results
     */
    clearTestResults() {
        this.testResults = [];
        console.log('🧹 Test results cleared');
    }

    /**
     * Get active scenarios
     */
    getActiveScenarios() {
        return Array.from(this.activeScenarios);
    }
}

// CLI interface
if (require.main === module) {
    const tester = new ErrorScenarioTester();
    
    const command = process.argv[2];
    const scenarioId = process.argv[3];
    const endpoint = process.argv[4] || '/v1/artists';

    switch (command) {
        case 'list':
            console.log('Available Error Scenarios:');
            console.log('========================');
            tester.getScenarios().forEach(scenario => {
                console.log(`${scenario.id.padEnd(20)} - ${scenario.name}`);
                console.log(`  Type: ${scenario.type}`);
                console.log(`  Description: ${scenario.description}`);
                console.log('');
            });
            break;

        case 'activate':
            if (!scenarioId) {
                console.error('Please specify a scenario ID');
                process.exit(1);
            }
            
            tester.activateScenario(scenarioId, endpoint)
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Activation failed:', error.message);
                    process.exit(1);
                });
            break;

        case 'deactivate':
            if (!scenarioId) {
                console.error('Please specify a scenario ID');
                process.exit(1);
            }
            
            tester.deactivateScenario(scenarioId, endpoint)
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Deactivation failed:', error.message);
                    process.exit(1);
                });
            break;

        case 'deactivate-all':
            tester.deactivateAllScenarios()
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Deactivation failed:', error.message);
                    process.exit(1);
                });
            break;

        case 'test':
            if (!scenarioId) {
                console.error('Please specify a scenario ID');
                process.exit(1);
            }
            
            tester.testScenario(scenarioId, endpoint)
                .then(result => {
                    console.log('\nTest Result:');
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(result.success ? 0 : 1);
                })
                .catch(error => {
                    console.error('Test failed:', error.message);
                    process.exit(1);
                });
            break;

        case 'test-suite':
            tester.runTestSuite()
                .then(report => {
                    console.log('\nFull Test Report:');
                    console.log(JSON.stringify(report, null, 2));
                    process.exit(report.failed === 0 ? 0 : 1);
                })
                .catch(error => {
                    console.error('Test suite failed:', error.message);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
Error Scenario Tester for Tattoo Directory

Usage: node devtools/scripts/error-scenario-tester.js <command> [options]

Commands:
  list                           List all available scenarios
  activate <scenario> [endpoint] Activate an error scenario
  deactivate <scenario> [endpoint] Deactivate an error scenario
  deactivate-all                 Deactivate all scenarios
  test <scenario> [endpoint]     Test a specific scenario
  test-suite                     Run comprehensive test suite

Examples:
  node devtools/scripts/error-scenario-tester.js list
  node devtools/scripts/error-scenario-tester.js activate rate_limit_exceeded /v1/artists
  node devtools/scripts/error-scenario-tester.js test validation_error /v1/artists/search
  node devtools/scripts/error-scenario-tester.js test-suite
  node devtools/scripts/error-scenario-tester.js deactivate-all
`);
            break;
    }
}

module.exports = ErrorScenarioTester;
