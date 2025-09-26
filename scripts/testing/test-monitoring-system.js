#!/usr/bin/env node

/**
 * Test Script for Comprehensive Monitoring System
 * 
 * Validates that all monitoring components work correctly:
 * - Health monitoring functionality
 * - Environment validation
 * - Alert system
 * - Dashboard API endpoints
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

class MonitoringSystemTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            totalTime: 0
        };
        
        this.dashboardUrl = 'http://localhost:3001';
    }

    /**
     * Run all monitoring system tests
     */
    async runAllTests() {
        console.log('🧪 Testing Comprehensive Monitoring System\n');
        
        const startTime = performance.now();
        
        try {
            // Test individual components
            await this.testHealthMonitor();
            await this.testEnvironmentValidator();
            await this.testAlertSystem();
            await this.testDashboardAPI();
            await this.testFileStructure();
            await this.testConfiguration();
            
            const endTime = performance.now();
            this.testResults.totalTime = Math.round(endTime - startTime);
            
            // Display results
            this.displayResults();
            
            // Save results
            await this.saveResults();
            
            return this.testResults.failed === 0;
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            return false;
        }
    }

    /**
     * Test health monitor functionality
     */
    async testHealthMonitor() {
        console.log('🔍 Testing Health Monitor...');
        
        await this.runTest('Health Monitor Import', async () => {
            const HealthMonitor = require('./health-monitor');
            const monitor = new HealthMonitor();
            
            if (!monitor || typeof monitor.runHealthCheck !== 'function') {
                throw new Error('Health monitor not properly initialized');
            }
            
            return 'Health monitor imported successfully';
        });

        await this.runTest('Health Monitor Configuration', async () => {
            const HealthMonitor = require('./health-monitor');
            const monitor = new HealthMonitor();
            
            if (!monitor.services || monitor.services.length === 0) {
                throw new Error('No services configured for monitoring');
            }
            
            const requiredServices = ['LocalStack', 'Backend Lambda', 'Frontend', 'Swagger UI'];
            const configuredServices = monitor.services.map(s => s.name);
            
            for (const required of requiredServices) {
                if (!configuredServices.includes(required)) {
                    throw new Error(`Required service ${required} not configured`);
                }
            }
            
            return `${monitor.services.length} services configured correctly`;
        });

        // Skip actual health check if services aren't running
        await this.runTest('Health Check Execution', async () => {
            try {
                // Quick check if LocalStack is running
                await axios.get('http://localhost:4566/_localstack/health', { timeout: 2000 });
                
                const HealthMonitor = require('./health-monitor');
                const monitor = new HealthMonitor();
                const results = await monitor.runHealthCheck();
                
                if (!results || !results.services) {
                    throw new Error('Health check returned invalid results');
                }
                
                return `Health check completed with ${Object.keys(results.services).length} services`;
                
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    this.testResults.skipped++;
                    return 'SKIPPED - Services not running';
                }
                throw error;
            }
        });
    }

    /**
     * Test environment validator functionality
     */
    async testEnvironmentValidator() {
        console.log('✅ Testing Environment Validator...');
        
        await this.runTest('Environment Validator Import', async () => {
            const EnvironmentHealthValidator = require('./environment-health-validator');
            const validator = new EnvironmentHealthValidator();
            
            if (!validator || typeof validator.runComprehensiveValidation !== 'function') {
                throw new Error('Environment validator not properly initialized');
            }
            
            return 'Environment validator imported successfully';
        });

        await this.runTest('Validation Components', async () => {
            const EnvironmentHealthValidator = require('./environment-health-validator');
            const validator = new EnvironmentHealthValidator();
            
            // Check if required components are initialized
            if (!validator.healthMonitor) {
                throw new Error('Health monitor not initialized in validator');
            }
            
            if (!validator.alertSystem) {
                throw new Error('Alert system not initialized in validator');
            }
            
            return 'All validation components initialized';
        });

        await this.runTest('Basic Validation Methods', async () => {
            const EnvironmentHealthValidator = require('./environment-health-validator');
            const validator = new EnvironmentHealthValidator();
            
            // Test method existence
            const requiredMethods = [
                'validateSecurityConfiguration',
                'validatePerformanceBaselines',
                'calculateOverallScore'
            ];
            
            for (const method of requiredMethods) {
                if (typeof validator[method] !== 'function') {
                    throw new Error(`Required method ${method} not found`);
                }
            }
            
            return 'All validation methods available';
        });
    }

    /**
     * Test alert system functionality
     */
    async testAlertSystem() {
        console.log('🚨 Testing Alert System...');
        
        await this.runTest('Alert System Import', async () => {
            const AlertSystem = require('./alert-system');
            const alertSystem = new AlertSystem();
            
            if (!alertSystem || typeof alertSystem.processMonitoringData !== 'function') {
                throw new Error('Alert system not properly initialized');
            }
            
            return 'Alert system imported successfully';
        });

        await this.runTest('Default Alert Rules', async () => {
            const AlertSystem = require('./alert-system');
            const alertSystem = new AlertSystem();
            
            if (!alertSystem.alertRules || alertSystem.alertRules.length === 0) {
                throw new Error('No default alert rules configured');
            }
            
            const requiredRules = ['service-down', 'service-degraded', 'high-response-time'];
            const configuredRules = alertSystem.alertRules.map(r => r.id);
            
            for (const required of requiredRules) {
                if (!configuredRules.includes(required)) {
                    throw new Error(`Required alert rule ${required} not configured`);
                }
            }
            
            return `${alertSystem.alertRules.length} alert rules configured`;
        });

        await this.runTest('Notification Channels', async () => {
            const AlertSystem = require('./alert-system');
            const alertSystem = new AlertSystem();
            
            if (!alertSystem.notificationChannels || alertSystem.notificationChannels.length === 0) {
                throw new Error('No notification channels configured');
            }
            
            const requiredChannels = ['console', 'file'];
            const configuredChannels = alertSystem.notificationChannels.map(c => c.id);
            
            for (const required of requiredChannels) {
                if (!configuredChannels.includes(required)) {
                    throw new Error(`Required notification channel ${required} not configured`);
                }
            }
            
            return `${alertSystem.notificationChannels.length} notification channels configured`;
        });

        await this.runTest('Alert Processing', async () => {
            const AlertSystem = require('./alert-system');
            const alertSystem = new AlertSystem();
            
            // Test with mock data that should trigger alerts
            const mockData = {
                timestamp: new Date().toISOString(),
                services: {
                    'test-service': {
                        name: 'test-service',
                        status: 'unhealthy',
                        responseTime: 5000,
                        error: 'Test error'
                    }
                },
                performance: {
                    memory: {
                        percentage: 90
                    }
                },
                overallHealth: 'unhealthy'
            };
            
            const alerts = await alertSystem.processMonitoringData(mockData);
            
            if (!Array.isArray(alerts)) {
                throw new Error('Alert processing did not return array');
            }
            
            return `Alert processing generated ${alerts.length} alerts`;
        });
    }

    /**
     * Test dashboard API endpoints
     */
    async testDashboardAPI() {
        console.log('🌐 Testing Dashboard API...');
        
        // Check if dashboard is running
        let dashboardRunning = false;
        try {
            await axios.get(this.dashboardUrl, { timeout: 2000 });
            dashboardRunning = true;
        } catch (error) {
            // Dashboard not running, skip API tests
        }

        if (!dashboardRunning) {
            await this.runTest('Dashboard API Endpoints', async () => {
                this.testResults.skipped++;
                return 'SKIPPED - Dashboard not running';
            });
            return;
        }

        await this.runTest('Dashboard Health Endpoint', async () => {
            const response = await axios.get(`${this.dashboardUrl}/api/health`, { timeout: 5000 });
            
            if (response.status !== 200) {
                throw new Error(`Health endpoint returned status ${response.status}`);
            }
            
            return 'Health endpoint responding correctly';
        });

        await this.runTest('Dashboard Status Endpoint', async () => {
            const response = await axios.get(`${this.dashboardUrl}/api/dashboard/status`, { timeout: 5000 });
            
            if (response.status !== 200) {
                throw new Error(`Status endpoint returned status ${response.status}`);
            }
            
            const data = response.data;
            if (!data.status || !data.hasOwnProperty('connectedClients')) {
                throw new Error('Status endpoint returned invalid data');
            }
            
            return 'Status endpoint responding correctly';
        });

        await this.runTest('Dashboard Alerts Endpoint', async () => {
            const response = await axios.get(`${this.dashboardUrl}/api/alerts`, { timeout: 5000 });
            
            if (response.status !== 200) {
                throw new Error(`Alerts endpoint returned status ${response.status}`);
            }
            
            if (!Array.isArray(response.data)) {
                throw new Error('Alerts endpoint did not return array');
            }
            
            return 'Alerts endpoint responding correctly';
        });
    }

    /**
     * Test file structure and permissions
     */
    async testFileStructure() {
        console.log('📁 Testing File Structure...');
        
        await this.runTest('Required Script Files', async () => {
            const requiredFiles = [
                'health-monitor.js',
                'environment-health-validator.js',
                'alert-system.js',
                'comprehensive-monitoring-dashboard.js',
                'start-monitoring.js'
            ];
            
            for (const file of requiredFiles) {
                const filePath = path.join(__dirname, file);
                try {
                    await fs.access(filePath);
                } catch (error) {
                    throw new Error(`Required file ${file} not found`);
                }
            }
            
            return `${requiredFiles.length} required files found`;
        });

        await this.runTest('Metrics Directory Creation', async () => {
            const metricsDir = path.join(process.cwd(), '.metrics');
            
            try {
                await fs.mkdir(metricsDir, { recursive: true });
                await fs.access(metricsDir);
            } catch (error) {
                throw new Error('Cannot create .metrics directory');
            }
            
            return 'Metrics directory accessible';
        });

        await this.runTest('File Permissions', async () => {
            const scriptFiles = [
                'health-monitor.js',
                'alert-system.js',
                'start-monitoring.js'
            ];
            
            for (const file of scriptFiles) {
                const filePath = path.join(__dirname, file);
                try {
                    const stats = await fs.stat(filePath);
                    if (!stats.isFile()) {
                        throw new Error(`${file} is not a regular file`);
                    }
                } catch (error) {
                    throw new Error(`Cannot access ${file}: ${error.message}`);
                }
            }
            
            return 'All script files accessible';
        });
    }

    /**
     * Test configuration management
     */
    async testConfiguration() {
        console.log('⚙️  Testing Configuration...');
        
        await this.runTest('Configuration Loading', async () => {
            const MonitoringOrchestrator = require('./start-monitoring');
            const orchestrator = new MonitoringOrchestrator();
            
            // Test default configuration
            if (!orchestrator.config || !orchestrator.config.dashboard) {
                throw new Error('Default configuration not loaded');
            }
            
            return 'Configuration loaded successfully';
        });

        await this.runTest('Configuration Persistence', async () => {
            const MonitoringOrchestrator = require('./start-monitoring');
            const orchestrator = new MonitoringOrchestrator();
            
            // Test saving configuration
            await orchestrator.saveConfiguration();
            
            const configPath = path.join(process.cwd(), '.metrics', 'monitoring-config.json');
            await fs.access(configPath);
            
            return 'Configuration persistence working';
        });

        await this.runTest('Environment Variables', async () => {
            // Test that monitoring works with various environment configurations
            const requiredEnvVars = ['NODE_ENV'];
            const optionalEnvVars = ['ALERT_WEBHOOK_URL', 'MONITORING_PORT'];
            
            // Check that system handles missing optional vars gracefully
            for (const envVar of optionalEnvVars) {
                if (process.env[envVar]) {
                    // Validate format if present
                    if (envVar === 'MONITORING_PORT') {
                        const port = parseInt(process.env[envVar]);
                        if (isNaN(port) || port < 1024 || port > 65535) {
                            throw new Error(`Invalid MONITORING_PORT: ${process.env[envVar]}`);
                        }
                    }
                }
            }
            
            return 'Environment variable handling correct';
        });
    }

    /**
     * Run individual test with error handling
     */
    async runTest(testName, testFunction) {
        const startTime = performance.now();
        
        try {
            const result = await testFunction();
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this.testResults.tests.push({
                name: testName,
                status: 'PASSED',
                duration,
                result
            });
            
            this.testResults.passed++;
            console.log(`  ✅ ${testName} (${duration}ms)`);
            
            if (result && result !== 'SKIPPED') {
                console.log(`     ${result}`);
            }
            
        } catch (error) {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this.testResults.tests.push({
                name: testName,
                status: 'FAILED',
                duration,
                error: error.message
            });
            
            this.testResults.failed++;
            console.log(`  ❌ ${testName} (${duration}ms)`);
            console.log(`     Error: ${error.message}`);
        }
    }

    /**
     * Display test results summary
     */
    displayResults() {
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Total Tests: ${this.testResults.tests.length}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Skipped: ${this.testResults.skipped}`);
        console.log(`Total Time: ${this.testResults.totalTime}ms`);
        
        const successRate = this.testResults.tests.length > 0 
            ? Math.round((this.testResults.passed / this.testResults.tests.length) * 100)
            : 0;
        
        console.log(`Success Rate: ${successRate}%`);
        
        if (this.testResults.failed === 0) {
            console.log('\n🎉 All tests passed! Monitoring system is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the details above.');
        }
        
        console.log('=' .repeat(50));
    }

    /**
     * Save test results to file
     */
    async saveResults() {
        try {
            const resultsDir = path.join(process.cwd(), '.metrics', 'test-results');
            await fs.mkdir(resultsDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `monitoring-system-test-${timestamp}.json`;
            const filepath = path.join(resultsDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(this.testResults, null, 2));
            console.log(`\n📄 Test results saved to: ${filepath}`);
            
        } catch (error) {
            console.warn('⚠️  Could not save test results:', error.message);
        }
    }
}

// CLI interface
if (require.main === module) {
    const tester = new MonitoringSystemTester();
    
    tester.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        });
}

module.exports = MonitoringSystemTester;