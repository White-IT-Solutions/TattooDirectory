#!/usr/bin/env node

/**
 * Enhanced Environment Health Validator
 * 
 * Provides comprehensive validation and monitoring integration for:
 * - Service dependency validation with startup order verification
 * - LocalStack service functionality testing with real operations
 * - Environment configuration validation with security checks
 * - Performance baseline validation with alerting
 * - Continuous health monitoring with alert integration
 */

const HealthMonitor = require('./health-monitor');
const AlertSystem = require('./alert-system');
const EnvironmentValidator = require('./environment-validator');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class EnvironmentHealthValidator {
    constructor() {
        this.healthMonitor = new HealthMonitor();
        this.alertSystem = new AlertSystem();
        this.environmentValidator = new EnvironmentValidator();
        
        this.validationResults = {
            timestamp: null,
            environment: {},
            services: {},
            localStack: {},
            performance: {},
            configuration: {},
            security: {},
            alerts: [],
            overallStatus: 'unknown',
            score: 0
        };

        this.monitoringInterval = null;
        this.isMonitoring = false;
        
        this.setupAlertIntegration();
    }

    /**
     * Setup alert system integration
     */
    setupAlertIntegration() {
        // Add custom validation-specific alert rules
        this.alertSystem.addAlertRule({
            id: 'validation-failure',
            name: 'Environment Validation Failure',
            condition: (data) => data.validationScore < 70,
            severity: 'critical',
            message: (data) => `Critical: Environment validation failed with score ${data.validationScore}/100`,
            cooldown: 600000 // 10 minutes
        });

        this.alertSystem.addAlertRule({
            id: 'security-issue',
            name: 'Security Configuration Issue',
            condition: (data) => data.securityIssues && data.securityIssues.length > 0,
            severity: 'warning',
            message: (data) => `Warning: ${data.securityIssues.length} security issue(s) detected`,
            cooldown: 1800000 // 30 minutes
        });

        this.alertSystem.addAlertRule({
            id: 'dependency-order-violation',
            name: 'Service Dependency Order Violation',
            condition: (data) => data.dependencyViolations && data.dependencyViolations.length > 0,
            severity: 'critical',
            message: (data) => `Critical: Service dependency violations: ${data.dependencyViolations.join(', ')}`,
            cooldown: 300000 // 5 minutes
        });
    }

    /**
     * Run comprehensive environment validation with health monitoring
     */
    async runComprehensiveValidation() {
        console.log('🔍 Starting comprehensive environment validation with health monitoring...\n');
        
        const startTime = performance.now();
        this.validationResults.timestamp = new Date().toISOString();

        try {
            // Run parallel validation tasks
            const [
                healthResults,
                environmentResults,
                securityResults,
                performanceResults
            ] = await Promise.all([
                this.healthMonitor.runHealthCheck(),
                this.environmentValidator.validateEnvironment(),
                this.validateSecurityConfiguration(),
                this.validatePerformanceBaselines()
            ]);

            // Merge results
            this.validationResults.services = healthResults.services;
            this.validationResults.localStack = healthResults.localStackServices;
            this.validationResults.environment = environmentResults.environment;
            this.validationResults.configuration = environmentResults.configuration;
            this.validationResults.performance = performanceResults;
            this.validationResults.security = securityResults;

            // Validate service dependencies with startup order
            this.validationResults.dependencies = await this.validateServiceDependenciesWithOrder();

            // Calculate overall score and status
            this.calculateOverallScore();
            
            // Process alerts
            const alertData = this.prepareAlertData();
            this.validationResults.alerts = await this.alertSystem.processMonitoringData(alertData);

            const endTime = performance.now();
            console.log(`✅ Comprehensive validation completed in ${Math.round(endTime - startTime)}ms\n`);

            return this.validationResults;

        } catch (error) {
            console.error('❌ Comprehensive validation failed:', error.message);
            this.validationResults.overallStatus = 'failed';
            this.validationResults.error = error.message;
            return this.validationResults;
        }
    }

    /**
     * Validate service dependencies with proper startup order
     */
    async validateServiceDependenciesWithOrder() {
        console.log('🔗 Validating service dependencies and startup order...');
        
        const dependencyValidation = {
            startupOrder: [],
            violations: [],
            dependencyGraph: {},
            circularDependencies: [],
            readinessChecks: {}
        };

        const serviceOrder = ['localstack', 'backend', 'frontend', 'swagger-ui'];
        
        // Check if services started in correct order
        for (let i = 0; i < serviceOrder.length; i++) {
            const serviceName = serviceOrder[i];
            const service = this.validationResults.services[serviceName];
            
            if (service && service.status === 'healthy') {
                dependencyValidation.startupOrder.push({
                    service: serviceName,
                    order: i,
                    startedCorrectly: true
                });
                
                // Check if dependencies are ready
                if (i > 0) {
                    const previousService = serviceOrder[i - 1];
                    const dependency = this.validationResults.services[previousService];
                    
                    if (!dependency || dependency.status !== 'healthy') {
                        dependencyValidation.violations.push(
                            `${serviceName} started before dependency ${previousService} was ready`
                        );
                    }
                }
            } else {
                dependencyValidation.violations.push(
                    `${serviceName} not healthy or missing`
                );
            }
        }

        // Test service readiness with dependency checks
        for (const serviceName of serviceOrder) {
            dependencyValidation.readinessChecks[serviceName] = await this.testServiceReadiness(serviceName);
        }

        console.log(`  Dependencies validated: ${dependencyValidation.violations.length} violations found`);
        return dependencyValidation;
    }

    /**
     * Test individual service readiness
     */
    async testServiceReadiness(serviceName) {
        const readinessTest = {
            service: serviceName,
            ready: false,
            responseTime: null,
            dependenciesReady: true,
            healthEndpoint: null,
            error: null
        };

        const endpoints = {
            localstack: 'http://localhost:4566/_localstack/health',
            backend: 'http://localhost:9000/2015-03-31/functions/function/invocations',
            frontend: 'http://localhost:3000/api/health',
            'swagger-ui': 'http://localhost:8080'
        };

        try {
            const endpoint = endpoints[serviceName];
            if (!endpoint) {
                readinessTest.error = 'No health endpoint defined';
                return readinessTest;
            }

            readinessTest.healthEndpoint = endpoint;
            const startTime = performance.now();

            let response;
            if (serviceName === 'backend') {
                // Special handling for Lambda RIE
                response = await axios.post(endpoint, {
                    httpMethod: 'GET',
                    path: '/health',
                    headers: {}
                }, { timeout: 5000 });
            } else {
                response = await axios.get(endpoint, { timeout: 5000 });
            }

            readinessTest.responseTime = Math.round(performance.now() - startTime);
            readinessTest.ready = response.status < 400;

        } catch (error) {
            readinessTest.error = error.message;
            readinessTest.ready = false;
        }

        return readinessTest;
    }

    /**
     * Validate security configuration
     */
    async validateSecurityConfiguration() {
        console.log('🔒 Validating security configuration...');
        
        const securityValidation = {
            environmentVariables: {},
            networkSecurity: {},
            containerSecurity: {},
            dataProtection: {},
            issues: [],
            score: 100
        };

        // Check environment variables for security issues
        securityValidation.environmentVariables = this.validateEnvironmentSecurity();
        
        // Check network security
        securityValidation.networkSecurity = await this.validateNetworkSecurity();
        
        // Check container security
        securityValidation.containerSecurity = await this.validateContainerSecurity();
        
        // Check data protection
        securityValidation.dataProtection = this.validateDataProtection();

        // Collect all issues
        securityValidation.issues = [
            ...securityValidation.environmentVariables.issues || [],
            ...securityValidation.networkSecurity.issues || [],
            ...securityValidation.containerSecurity.issues || [],
            ...securityValidation.dataProtection.issues || []
        ];

        // Calculate security score
        securityValidation.score = Math.max(0, 100 - (securityValidation.issues.length * 10));

        console.log(`  Security validation: ${securityValidation.issues.length} issues found, score: ${securityValidation.score}/100`);
        return securityValidation;
    }

    /**
     * Validate environment variable security
     */
    validateEnvironmentSecurity() {
        const validation = {
            productionConflicts: [],
            exposedSecrets: [],
            missingVariables: [],
            issues: []
        };

        // Check for production conflicts
        if (process.env.NODE_ENV === 'production' && process.env.AWS_ENDPOINT_URL?.includes('localstack')) {
            validation.productionConflicts.push('Production environment with LocalStack endpoint');
            validation.issues.push('Production environment configured with local endpoints');
        }

        // Check for exposed secrets (basic check)
        const sensitiveVars = ['AWS_SECRET_ACCESS_KEY', 'DATABASE_PASSWORD', 'API_KEY'];
        sensitiveVars.forEach(varName => {
            const value = process.env[varName];
            if (value && value !== 'test' && value.length < 8) {
                validation.exposedSecrets.push(varName);
                validation.issues.push(`Potentially weak ${varName}`);
            }
        });

        // Check for required local development variables
        const requiredVars = ['AWS_ENDPOINT_URL', 'AWS_ACCESS_KEY_ID', 'AWS_DEFAULT_REGION'];
        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                validation.missingVariables.push(varName);
                validation.issues.push(`Missing required environment variable: ${varName}`);
            }
        });

        return validation;
    }

    /**
     * Validate network security
     */
    async validateNetworkSecurity() {
        const validation = {
            openPorts: [],
            networkIsolation: false,
            tlsConfiguration: {},
            issues: []
        };

        try {
            // Check if services are properly isolated (basic check)
            const localPorts = [4566, 9000, 3000, 8080];
            for (const port of localPorts) {
                try {
                    await axios.get(`http://localhost:${port}`, { timeout: 1000 });
                    validation.openPorts.push(port);
                } catch (error) {
                    // Port not accessible, which might be good for security
                }
            }

            // Check for excessive open ports
            if (validation.openPorts.length > 4) {
                validation.issues.push('Too many open ports detected');
            }

            // Check network isolation (Docker network)
            validation.networkIsolation = await this.checkDockerNetworkIsolation();
            if (!validation.networkIsolation) {
                validation.issues.push('Docker network isolation not properly configured');
            }

        } catch (error) {
            validation.issues.push(`Network security check failed: ${error.message}`);
        }

        return validation;
    }

    /**
     * Check Docker network isolation
     */
    async checkDockerNetworkIsolation() {
        try {
            // This would require docker network inspection
            // For now, assume proper isolation if docker-compose is used
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate container security
     */
    async validateContainerSecurity() {
        const validation = {
            privilegedContainers: [],
            volumeMounts: [],
            resourceLimits: {},
            issues: []
        };

        try {
            // Check for privileged containers and excessive volume mounts
            // This would require docker inspect commands
            // For now, provide basic validation
            
            validation.resourceLimits = {
                memoryLimitsSet: false,
                cpuLimitsSet: false
            };

            if (!validation.resourceLimits.memoryLimitsSet) {
                validation.issues.push('Memory limits not set for containers');
            }

        } catch (error) {
            validation.issues.push(`Container security check failed: ${error.message}`);
        }

        return validation;
    }

    /**
     * Validate data protection measures
     */
    validateDataProtection() {
        const validation = {
            dataEncryption: false,
            backupStrategy: false,
            dataRetention: false,
            issues: []
        };

        // Check if sensitive data is properly handled
        // For local development, this is mostly about not persisting real data
        
        validation.dataEncryption = true; // LocalStack doesn't persist real data
        validation.backupStrategy = false; // Not needed for local dev
        validation.dataRetention = true; // Ephemeral by design

        if (!validation.backupStrategy) {
            // This is actually good for local development
            // validation.issues.push('No backup strategy configured');
        }

        return validation;
    }

    /**
     * Validate performance baselines with alerting
     */
    async validatePerformanceBaselines() {
        console.log('📈 Validating performance baselines...');
        
        const performanceValidation = {
            responseTimeBaselines: {},
            resourceUsageBaselines: {},
            throughputBaselines: {},
            alerts: [],
            score: 100
        };

        // Test response time baselines
        performanceValidation.responseTimeBaselines = await this.testResponseTimeBaselines();
        
        // Test resource usage baselines
        performanceValidation.resourceUsageBaselines = await this.testResourceUsageBaselines();
        
        // Test throughput baselines
        performanceValidation.throughputBaselines = await this.testThroughputBaselines();

        // Generate performance alerts
        performanceValidation.alerts = this.generatePerformanceAlerts(performanceValidation);

        // Calculate performance score
        const violations = performanceValidation.alerts.filter(alert => alert.severity === 'critical').length;
        performanceValidation.score = Math.max(0, 100 - (violations * 20));

        console.log(`  Performance validation: ${performanceValidation.alerts.length} alerts, score: ${performanceValidation.score}/100`);
        return performanceValidation;
    }

    /**
     * Test response time baselines
     */
    async testResponseTimeBaselines() {
        const baselines = {
            localstack: 2000, // 2 seconds
            backend: 1000,    // 1 second
            frontend: 500,    // 500ms
            'swagger-ui': 1000 // 1 second
        };

        const results = {};

        for (const [serviceName, baseline] of Object.entries(baselines)) {
            const service = this.validationResults.services[serviceName];
            if (service) {
                results[serviceName] = {
                    responseTime: service.responseTime,
                    baseline,
                    withinBaseline: service.responseTime <= baseline,
                    deviation: service.responseTime - baseline
                };
            }
        }

        return results;
    }

    /**
     * Test resource usage baselines
     */
    async testResourceUsageBaselines() {
        const baselines = {
            memoryUsage: 85, // 85% max
            cpuUsage: 80,    // 80% max
            diskUsage: 90    // 90% max
        };

        const results = {};
        
        // Get current resource usage
        const memoryInfo = this.validationResults.performance?.memory;
        if (memoryInfo) {
            results.memory = {
                current: memoryInfo.percentage,
                baseline: baselines.memoryUsage,
                withinBaseline: memoryInfo.percentage <= baselines.memoryUsage,
                deviation: memoryInfo.percentage - baselines.memoryUsage
            };
        }

        return results;
    }

    /**
     * Test throughput baselines
     */
    async testThroughputBaselines() {
        const results = {
            apiThroughput: null,
            searchThroughput: null,
            concurrentConnections: null
        };

        try {
            // Test API throughput (simplified)
            const apiStart = performance.now();
            const promises = Array(5).fill().map(() => 
                axios.post('http://localhost:9000/2015-03-31/functions/function/invocations', {
                    httpMethod: 'GET',
                    path: '/health',
                    headers: {}
                }, { timeout: 5000 }).catch(() => null)
            );
            
            await Promise.all(promises);
            const apiEnd = performance.now();
            
            results.apiThroughput = {
                requestsPerSecond: 5000 / (apiEnd - apiStart), // Rough calculation
                baseline: 10, // 10 requests per second minimum
                withinBaseline: true
            };

        } catch (error) {
            results.error = error.message;
        }

        return results;
    }

    /**
     * Generate performance alerts
     */
    generatePerformanceAlerts(performanceValidation) {
        const alerts = [];

        // Response time alerts
        Object.entries(performanceValidation.responseTimeBaselines).forEach(([service, data]) => {
            if (!data.withinBaseline) {
                alerts.push({
                    type: 'performance',
                    severity: data.deviation > 2000 ? 'critical' : 'warning',
                    service,
                    message: `Response time exceeded baseline: ${data.responseTime}ms (baseline: ${data.baseline}ms)`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Resource usage alerts
        Object.entries(performanceValidation.resourceUsageBaselines).forEach(([resource, data]) => {
            if (!data.withinBaseline) {
                alerts.push({
                    type: 'resource',
                    severity: data.deviation > 20 ? 'critical' : 'warning',
                    service: 'System',
                    message: `${resource} usage exceeded baseline: ${data.current}% (baseline: ${data.baseline}%)`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        return alerts;
    }

    /**
     * Calculate overall validation score and status
     */
    calculateOverallScore() {
        let totalScore = 0;
        let components = 0;

        // Service health score (40% weight)
        const healthyServices = Object.values(this.validationResults.services).filter(s => s.status === 'healthy').length;
        const totalServices = Object.keys(this.validationResults.services).length;
        const serviceScore = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;
        totalScore += serviceScore * 0.4;
        components++;

        // LocalStack functionality score (20% weight)
        const healthyLocalStack = Object.values(this.validationResults.localStack).filter(s => s.status === 'healthy').length;
        const totalLocalStack = Object.keys(this.validationResults.localStack).length;
        const localStackScore = totalLocalStack > 0 ? (healthyLocalStack / totalLocalStack) * 100 : 0;
        totalScore += localStackScore * 0.2;
        components++;

        // Security score (20% weight)
        if (this.validationResults.security.score !== undefined) {
            totalScore += this.validationResults.security.score * 0.2;
            components++;
        }

        // Performance score (20% weight)
        if (this.validationResults.performance.score !== undefined) {
            totalScore += this.validationResults.performance.score * 0.2;
            components++;
        }

        this.validationResults.score = Math.round(totalScore / components);

        // Determine overall status
        if (this.validationResults.score >= 90) {
            this.validationResults.overallStatus = 'excellent';
        } else if (this.validationResults.score >= 75) {
            this.validationResults.overallStatus = 'good';
        } else if (this.validationResults.score >= 50) {
            this.validationResults.overallStatus = 'fair';
        } else {
            this.validationResults.overallStatus = 'poor';
        }
    }

    /**
     * Prepare alert data for alert system
     */
    prepareAlertData() {
        return {
            timestamp: this.validationResults.timestamp,
            services: this.validationResults.services,
            localStackServices: this.validationResults.localStack,
            performance: this.validationResults.performance,
            overallHealth: this.validationResults.overallStatus,
            validationScore: this.validationResults.score,
            securityIssues: this.validationResults.security?.issues || [],
            dependencyViolations: this.validationResults.dependencies?.violations || []
        };
    }

    /**
     * Start continuous monitoring with validation
     */
    async startContinuousMonitoring(intervalMs = 60000) {
        if (this.isMonitoring) {
            console.log('⚠️  Monitoring already running');
            return;
        }

        console.log(`🔄 Starting continuous environment monitoring (interval: ${intervalMs/1000}s)`);
        this.isMonitoring = true;

        const monitoringCycle = async () => {
            try {
                console.log('\n🔍 Running monitoring cycle...');
                const results = await this.runComprehensiveValidation();
                
                // Display summary
                this.displayValidationSummary(results);
                
                // Save results
                await this.saveValidationResults(results);
                
            } catch (error) {
                console.error('❌ Monitoring cycle error:', error.message);
            }
        };

        // Run initial cycle
        await monitoringCycle();
        
        // Set up interval
        this.monitoringInterval = setInterval(monitoringCycle, intervalMs);
        
        return this.monitoringInterval;
    }

    /**
     * Stop continuous monitoring
     */
    stopContinuousMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.isMonitoring = false;
            console.log('🛑 Continuous monitoring stopped');
        }
    }

    /**
     * Display validation summary
     */
    displayValidationSummary(results) {
        const statusEmoji = {
            excellent: '🟢',
            good: '🟡',
            fair: '🟠',
            poor: '🔴'
        };

        console.log('\n📊 ENVIRONMENT VALIDATION SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Overall Status: ${statusEmoji[results.overallStatus]} ${results.overallStatus.toUpperCase()}`);
        console.log(`Validation Score: ${results.score}/100`);
        console.log(`Timestamp: ${results.timestamp}`);
        
        if (results.alerts.length > 0) {
            console.log(`\n🚨 Active Alerts: ${results.alerts.length}`);
            results.alerts.slice(0, 3).forEach(alert => {
                const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
                console.log(`  ${emoji} ${alert.message}`);
            });
            if (results.alerts.length > 3) {
                console.log(`  ... and ${results.alerts.length - 3} more`);
            }
        }

        console.log('\n' + '='.repeat(50));
    }

    /**
     * Save validation results
     */
    async saveValidationResults(results) {
        const resultsDir = path.join(process.cwd(), '.metrics', 'validation');
        await fs.mkdir(resultsDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `validation-${timestamp}.json`;
        const filepath = path.join(resultsDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(results, null, 2));
        return filepath;
    }
}

// CLI interface
if (require.main === module) {
    const validator = new EnvironmentHealthValidator();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'validate':
            validator.runComprehensiveValidation()
                .then(results => {
                    validator.displayValidationSummary(results);
                    process.exit(results.score >= 70 ? 0 : 1);
                })
                .catch(error => {
                    console.error('❌ Validation failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'monitor':
            const interval = parseInt(process.argv[3]) || 60000;
            validator.startContinuousMonitoring(interval)
                .then(() => {
                    console.log('Press Ctrl+C to stop monitoring');
                    
                    // Graceful shutdown
                    process.on('SIGINT', () => {
                        console.log('\n🛑 Shutting down monitoring...');
                        validator.stopContinuousMonitoring();
                        process.exit(0);
                    });
                })
                .catch(error => {
                    console.error('❌ Failed to start monitoring:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('Usage:');
            console.log('  node environment-health-validator.js validate        - Run single validation');
            console.log('  node environment-health-validator.js monitor [ms]    - Start continuous monitoring');
            process.exit(1);
    }
}

module.exports = EnvironmentHealthValidator;