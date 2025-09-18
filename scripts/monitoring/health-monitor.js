#!/usr/bin/env node

/**
 * Comprehensive Health Monitoring System for Local Development Environment
 * 
 * This script provides:
 * - Service health checks with dependency validation
 * - LocalStack service functionality testing
 * - Performance monitoring and alerts
 * - Real-time monitoring dashboard
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

class HealthMonitor {
    constructor() {
        this.services = [
            {
                name: 'LocalStack',
                url: 'http://localhost:4566/_localstack/health',
                type: 'infrastructure',
                dependencies: [],
                healthEndpoint: 'http://localhost:4566/_localstack/health',
                timeout: 10000
            },
            {
                name: 'Backend Lambda',
                url: 'http://localhost:9000/2015-03-31/functions/function/invocations',
                type: 'api',
                dependencies: ['LocalStack'],
                healthEndpoint: 'http://localhost:9000/2015-03-31/functions/function/invocations',
                timeout: 5000
            },
            {
                name: 'Frontend',
                url: 'http://localhost:3000',
                type: 'web',
                dependencies: ['Backend Lambda'],
                healthEndpoint: 'http://localhost:3000/api/health',
                timeout: 5000
            },
            {
                name: 'Swagger UI',
                url: 'http://localhost:8080',
                type: 'documentation',
                dependencies: [],
                healthEndpoint: 'http://localhost:8080',
                timeout: 3000
            }
        ];

        this.localStackServices = [
            'dynamodb',
            'opensearch',
            's3',
            'apigateway',
            'lambda',
            'iam',
            'secretsmanager'
        ];

        this.performanceThresholds = {
            responseTime: 1000, // ms
            memoryUsage: 4096, // MB
            cpuUsage: 80, // percentage
            diskUsage: 90 // percentage
        };

        this.alertHistory = [];
        this.healthHistory = [];
    }

    /**
     * Run comprehensive health check for all services
     */
    async runHealthCheck() {
        console.log('🔍 Starting comprehensive health check...\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            services: {},
            localStackServices: {},
            performance: {},
            alerts: [],
            overallHealth: 'healthy'
        };

        // Check service dependencies and health
        for (const service of this.services) {
            results.services[service.name] = await this.checkServiceHealth(service);
        }

        // Test LocalStack service functionality
        results.localStackServices = await this.testLocalStackServices();

        // Check performance metrics
        results.performance = await this.checkPerformanceMetrics();

        // Generate alerts based on results
        results.alerts = this.generateAlerts(results);

        // Determine overall health
        results.overallHealth = this.determineOverallHealth(results);

        // Store health history
        this.healthHistory.push(results);
        if (this.healthHistory.length > 100) {
            this.healthHistory = this.healthHistory.slice(-100);
        }

        return results;
    }

    /**
     * Check individual service health with dependency validation
     */
    async checkServiceHealth(service) {
        const startTime = performance.now();
        const result = {
            name: service.name,
            status: 'unknown',
            responseTime: 0,
            dependencies: {},
            error: null,
            lastChecked: new Date().toISOString()
        };

        try {
            // Check dependencies first
            for (const depName of service.dependencies) {
                const dependency = this.services.find(s => s.name === depName);
                if (dependency) {
                    result.dependencies[depName] = await this.quickHealthCheck(dependency);
                }
            }

            // Check if all dependencies are healthy
            const dependenciesHealthy = Object.values(result.dependencies).every(dep => dep.status === 'healthy');
            
            if (service.dependencies.length > 0 && !dependenciesHealthy) {
                result.status = 'unhealthy';
                result.error = 'Dependencies not healthy';
                return result;
            }

            // Perform service-specific health check
            const response = await axios.get(service.healthEndpoint, {
                timeout: service.timeout,
                validateStatus: (status) => status < 500 // Accept 4xx as potentially healthy
            });

            const endTime = performance.now();
            result.responseTime = Math.round(endTime - startTime);

            if (response.status >= 200 && response.status < 400) {
                result.status = 'healthy';
            } else if (response.status >= 400 && response.status < 500) {
                result.status = 'degraded';
                result.error = `HTTP ${response.status}`;
            } else {
                result.status = 'unhealthy';
                result.error = `HTTP ${response.status}`;
            }

        } catch (error) {
            const endTime = performance.now();
            result.responseTime = Math.round(endTime - startTime);
            result.status = 'unhealthy';
            result.error = error.code || error.message;
        }

        return result;
    }

    /**
     * Quick health check for dependency validation
     */
    async quickHealthCheck(service) {
        try {
            const response = await axios.get(service.healthEndpoint, {
                timeout: 2000,
                validateStatus: (status) => status < 500
            });
            return {
                status: response.status < 400 ? 'healthy' : 'degraded',
                responseTime: 0
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.code || error.message
            };
        }
    }

    /**
     * Test LocalStack service functionality
     */
    async testLocalStackServices() {
        const results = {};
        
        for (const serviceName of this.localStackServices) {
            results[serviceName] = await this.testLocalStackService(serviceName);
        }

        return results;
    }

    /**
     * Test individual LocalStack service functionality
     */
    async testLocalStackService(serviceName) {
        const result = {
            name: serviceName,
            status: 'unknown',
            functionality: {},
            error: null
        };

        try {
            switch (serviceName) {
                case 'dynamodb':
                    result.functionality = await this.testDynamoDB();
                    break;
                case 'opensearch':
                    result.functionality = await this.testOpenSearch();
                    break;
                case 's3':
                    result.functionality = await this.testS3();
                    break;
                case 'apigateway':
                    result.functionality = await this.testApiGateway();
                    break;
                default:
                    result.functionality = await this.testGenericService(serviceName);
            }

            result.status = result.functionality.working ? 'healthy' : 'unhealthy';
        } catch (error) {
            result.status = 'unhealthy';
            result.error = error.message;
        }

        return result;
    }

    /**
     * Test DynamoDB functionality
     */
    async testDynamoDB() {
        try {
            const response = await axios.get('http://localhost:4566/_aws/dynamodb/tables', {
                timeout: 5000
            });
            
            const tables = response.data;
            const hasRequiredTable = tables.some(table => 
                table.includes('tattoo-directory') || table.includes('local')
            );

            return {
                working: true,
                tables: tables.length,
                hasRequiredTable,
                details: `Found ${tables.length} tables`
            };
        } catch (error) {
            return {
                working: false,
                error: error.message
            };
        }
    }

    /**
     * Test OpenSearch functionality
     */
    async testOpenSearch() {
        try {
            const response = await axios.get('http://localhost:4566/_cluster/health', {
                timeout: 5000
            });
            
            return {
                working: response.status === 200,
                status: response.data.status || 'unknown',
                details: 'OpenSearch cluster accessible'
            };
        } catch (error) {
            return {
                working: false,
                error: error.message
            };
        }
    }

    /**
     * Test S3 functionality
     */
    async testS3() {
        try {
            const response = await axios.get('http://localhost:4566/_aws/s3/buckets', {
                timeout: 5000
            });
            
            return {
                working: true,
                buckets: response.data.length || 0,
                details: `Found ${response.data.length || 0} buckets`
            };
        } catch (error) {
            return {
                working: false,
                error: error.message
            };
        }
    }

    /**
     * Test API Gateway functionality
     */
    async testApiGateway() {
        try {
            const response = await axios.get('http://localhost:4566/_aws/apigateway/restapis', {
                timeout: 5000
            });
            
            return {
                working: true,
                apis: response.data.length || 0,
                details: `Found ${response.data.length || 0} APIs`
            };
        } catch (error) {
            return {
                working: false,
                error: error.message
            };
        }
    }

    /**
     * Test generic LocalStack service
     */
    async testGenericService(serviceName) {
        try {
            const response = await axios.get(`http://localhost:4566/_localstack/health`, {
                timeout: 3000
            });
            
            const serviceStatus = response.data.services?.[serviceName];
            return {
                working: serviceStatus === 'available' || serviceStatus === 'running',
                status: serviceStatus,
                details: `Service status: ${serviceStatus}`
            };
        } catch (error) {
            return {
                working: false,
                error: error.message
            };
        }
    }

    /**
     * Check performance metrics
     */
    async checkPerformanceMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            memory: await this.getMemoryUsage(),
            containers: await this.getContainerMetrics(),
            responseTime: await this.measureAverageResponseTime()
        };

        return metrics;
    }

    /**
     * Get system memory usage
     */
    async getMemoryUsage() {
        try {
            const totalMem = require('os').totalmem();
            const freeMem = require('os').freemem();
            const usedMem = totalMem - freeMem;
            
            return {
                total: Math.round(totalMem / 1024 / 1024), // MB
                used: Math.round(usedMem / 1024 / 1024), // MB
                free: Math.round(freeMem / 1024 / 1024), // MB
                percentage: Math.round((usedMem / totalMem) * 100)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Get Docker container metrics
     */
    async getContainerMetrics() {
        try {
            // This would require docker stats API or docker command
            // For now, return placeholder data
            return {
                containers: 5,
                running: 5,
                totalCpuUsage: '15%',
                totalMemoryUsage: '2.1GB'
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Measure average response time across services
     */
    async measureAverageResponseTime() {
        const measurements = [];
        
        for (const service of this.services) {
            try {
                const startTime = performance.now();
                await axios.get(service.healthEndpoint, { timeout: 3000 });
                const endTime = performance.now();
                measurements.push(endTime - startTime);
            } catch (error) {
                // Skip failed requests for average calculation
            }
        }

        if (measurements.length === 0) return { average: 0, samples: 0 };

        const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        return {
            average: Math.round(average),
            samples: measurements.length,
            min: Math.round(Math.min(...measurements)),
            max: Math.round(Math.max(...measurements))
        };
    }

    /**
     * Generate alerts based on health check results
     */
    generateAlerts(results) {
        const alerts = [];

        // Service health alerts
        Object.values(results.services).forEach(service => {
            if (service.status === 'unhealthy') {
                alerts.push({
                    type: 'error',
                    service: service.name,
                    message: `Service ${service.name} is unhealthy: ${service.error}`,
                    timestamp: new Date().toISOString()
                });
            } else if (service.status === 'degraded') {
                alerts.push({
                    type: 'warning',
                    service: service.name,
                    message: `Service ${service.name} is degraded: ${service.error}`,
                    timestamp: new Date().toISOString()
                });
            }

            // Response time alerts
            if (service.responseTime > this.performanceThresholds.responseTime) {
                alerts.push({
                    type: 'warning',
                    service: service.name,
                    message: `High response time: ${service.responseTime}ms (threshold: ${this.performanceThresholds.responseTime}ms)`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // LocalStack service alerts
        Object.values(results.localStackServices).forEach(service => {
            if (service.status === 'unhealthy') {
                alerts.push({
                    type: 'error',
                    service: `LocalStack ${service.name}`,
                    message: `LocalStack service ${service.name} is not working: ${service.error}`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Performance alerts
        if (results.performance.memory && results.performance.memory.percentage > this.performanceThresholds.memoryUsage) {
            alerts.push({
                type: 'warning',
                service: 'System',
                message: `High memory usage: ${results.performance.memory.percentage}% (threshold: ${this.performanceThresholds.memoryUsage}%)`,
                timestamp: new Date().toISOString()
            });
        }

        // Store alerts in history
        this.alertHistory.push(...alerts);
        if (this.alertHistory.length > 500) {
            this.alertHistory = this.alertHistory.slice(-500);
        }

        return alerts;
    }

    /**
     * Determine overall environment health
     */
    determineOverallHealth(results) {
        const serviceStatuses = Object.values(results.services).map(s => s.status);
        const localStackStatuses = Object.values(results.localStackServices).map(s => s.status);
        
        const hasUnhealthy = [...serviceStatuses, ...localStackStatuses].includes('unhealthy');
        const hasDegraded = [...serviceStatuses, ...localStackStatuses].includes('degraded');
        
        if (hasUnhealthy) return 'unhealthy';
        if (hasDegraded) return 'degraded';
        return 'healthy';
    }

    /**
     * Save health report to file
     */
    async saveHealthReport(results) {
        const reportDir = path.join(process.cwd(), '.metrics');
        await fs.mkdir(reportDir, { recursive: true });
        
        const filename = `health-report-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(reportDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(results, null, 2));
        return filepath;
    }

    /**
     * Display health status in console
     */
    displayHealthStatus(results) {
        console.log('\n📊 HEALTH MONITORING REPORT');
        console.log('=' .repeat(50));
        console.log(`Overall Status: ${this.getStatusEmoji(results.overallHealth)} ${results.overallHealth.toUpperCase()}`);
        console.log(`Timestamp: ${results.timestamp}\n`);

        // Services status
        console.log('🔧 SERVICES STATUS:');
        Object.values(results.services).forEach(service => {
            const emoji = this.getStatusEmoji(service.status);
            const deps = Object.keys(service.dependencies).length > 0 
                ? ` (deps: ${Object.keys(service.dependencies).join(', ')})` 
                : '';
            console.log(`  ${emoji} ${service.name}: ${service.status} (${service.responseTime}ms)${deps}`);
            if (service.error) {
                console.log(`    ⚠️  Error: ${service.error}`);
            }
        });

        // LocalStack services
        console.log('\n☁️  LOCALSTACK SERVICES:');
        Object.values(results.localStackServices).forEach(service => {
            const emoji = this.getStatusEmoji(service.status);
            console.log(`  ${emoji} ${service.name}: ${service.status}`);
            if (service.functionality.details) {
                console.log(`    ℹ️  ${service.functionality.details}`);
            }
            if (service.error) {
                console.log(`    ⚠️  Error: ${service.error}`);
            }
        });

        // Performance metrics
        if (results.performance.memory) {
            console.log('\n📈 PERFORMANCE METRICS:');
            console.log(`  Memory: ${results.performance.memory.used}MB / ${results.performance.memory.total}MB (${results.performance.memory.percentage}%)`);
        }
        
        if (results.performance.responseTime) {
            console.log(`  Avg Response Time: ${results.performance.responseTime.average}ms (${results.performance.responseTime.samples} samples)`);
        }

        // Alerts
        if (results.alerts.length > 0) {
            console.log('\n🚨 ALERTS:');
            results.alerts.forEach(alert => {
                const emoji = alert.type === 'error' ? '❌' : '⚠️';
                console.log(`  ${emoji} ${alert.service}: ${alert.message}`);
            });
        } else {
            console.log('\n✅ No alerts - all systems operating normally');
        }

        console.log('\n' + '='.repeat(50));
    }

    /**
     * Get status emoji for display
     */
    getStatusEmoji(status) {
        switch (status) {
            case 'healthy': return '✅';
            case 'degraded': return '⚠️';
            case 'unhealthy': return '❌';
            default: return '❓';
        }
    }

    /**
     * Start continuous monitoring
     */
    async startContinuousMonitoring(intervalMs = 30000) {
        console.log(`🔄 Starting continuous monitoring (interval: ${intervalMs/1000}s)`);
        
        const monitor = async () => {
            try {
                const results = await this.runHealthCheck();
                this.displayHealthStatus(results);
                
                // Save report if there are alerts
                if (results.alerts.length > 0) {
                    const reportPath = await this.saveHealthReport(results);
                    console.log(`📄 Health report saved: ${reportPath}`);
                }
                
            } catch (error) {
                console.error('❌ Monitoring error:', error.message);
            }
        };

        // Run initial check
        await monitor();
        
        // Set up interval
        return setInterval(monitor, intervalMs);
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new HealthMonitor();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'check':
            monitor.runHealthCheck()
                .then(results => {
                    monitor.displayHealthStatus(results);
                    process.exit(results.overallHealth === 'healthy' ? 0 : 1);
                })
                .catch(error => {
                    console.error('❌ Health check failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'monitor':
            const interval = parseInt(process.argv[3]) || 30000;
            monitor.startContinuousMonitoring(interval)
                .then(() => {
                    console.log('Press Ctrl+C to stop monitoring');
                })
                .catch(error => {
                    console.error('❌ Failed to start monitoring:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'dashboard':
            // Start web dashboard (implemented in separate file)
            console.log('🌐 Starting monitoring dashboard...');
            require('./monitoring-dashboard.js');
            break;
            
        default:
            console.log('Usage:');
            console.log('  node health-monitor.js check           - Run single health check');
            console.log('  node health-monitor.js monitor [ms]    - Start continuous monitoring');
            console.log('  node health-monitor.js dashboard       - Start web dashboard');
            process.exit(1);
    }
}

module.exports = HealthMonitor;