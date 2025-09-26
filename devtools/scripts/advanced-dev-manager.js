#!/usr/bin/env node

/**
 * Advanced Development Manager
 * 
 * Orchestrates all advanced development features:
 * - Hot reload proxy
 * - Mock data generation
 * - Debug logging
 * - Error scenario testing
 * 
 * Provides a unified interface for managing the enhanced development environment.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const HotReloadProxy = require('./hot-reload-proxy');
const MockDataGenerator = require('./mock-data-generator');
const DebugLogger = require('./debug-logger');
const ErrorScenarioTester = require('./error-scenario-tester');

class AdvancedDevManager {
    constructor(options = {}) {
        this.config = {
            proxyPort: options.proxyPort || 9001,
            backendUrl: options.backendUrl || 'http://localhost:9000',
            watchPath: options.watchPath || path.join(process.cwd(), 'backend/src'),
            logLevel: options.logLevel || 'info',
            enableHotReload: options.enableHotReload !== false,
            enableLogging: options.enableLogging !== false,
            enableMocking: options.enableMocking !== false,
            enableErrorTesting: options.enableErrorTesting !== false,
            ...options
        };

        this.services = {
            proxy: null,
            logger: null,
            mockGenerator: null,
            errorTester: null
        };

        this.isRunning = false;
        this.setupLogger();
    }

    /**
     * Setup debug logger
     */
    setupLogger() {
        if (this.config.enableLogging) {
            this.services.logger = new DebugLogger({
                logLevel: this.config.logLevel,
                enableConsole: true,
                enableFile: true,
                enableMetrics: true
            });
        }
    }

    /**
     * Start all advanced development services
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Advanced development services are already running');
            return;
        }

        console.log('🚀 Starting Advanced Development Environment...');
        console.log('================================================');

        try {
            // Initialize services
            await this.initializeServices();

            // Start hot reload proxy
            if (this.config.enableHotReload) {
                await this.startHotReloadProxy();
            }

            // Generate initial mock data
            if (this.config.enableMocking) {
                await this.generateInitialMockData();
            }

            // Setup error testing
            if (this.config.enableErrorTesting) {
                await this.setupErrorTesting();
            }

            this.isRunning = true;

            console.log('');
            console.log('✅ Advanced Development Environment Ready!');
            console.log('==========================================');
            this.printServiceStatus();
            this.printUsageInstructions();

        } catch (error) {
            console.error('❌ Failed to start advanced development environment:', error.message);
            await this.stop();
            throw error;
        }
    }

    /**
     * Initialize all services
     */
    async initializeServices() {
        console.log('🔧 Initializing services...');

        // Initialize mock data generator
        this.services.mockGenerator = new MockDataGenerator();

        // Initialize error scenario tester
        this.services.errorTester = new ErrorScenarioTester({
            proxyUrl: `http://localhost:${this.config.proxyPort}`,
            backendUrl: this.config.backendUrl
        });

        if (this.services.logger) {
            await this.services.logger.info('Advanced development services initialized');
        }
    }

    /**
     * Start hot reload proxy
     */
    async startHotReloadProxy() {
        console.log('🔥 Starting Hot Reload Proxy...');

        this.services.proxy = new HotReloadProxy({
            port: this.config.proxyPort,
            backendUrl: this.config.backendUrl,
            watchPath: this.config.watchPath,
            logRequests: this.config.enableLogging,
            enableMocking: this.config.enableMocking
        });

        await this.services.proxy.start();

        if (this.services.logger) {
            await this.services.logger.info('Hot reload proxy started', {
                port: this.config.proxyPort,
                backendUrl: this.config.backendUrl
            });
        }
    }

    /**
     * Generate initial mock data
     */
    async generateInitialMockData() {
        console.log('🎭 Generating initial mock data...');

        try {
            const dataset = await this.services.mockGenerator.generateTestDataset({
                artistCount: 20,
                saveFiles: true
            });

            console.log(`✅ Generated ${dataset.artists.length} mock artists`);

            if (this.services.logger) {
                await this.services.logger.info('Mock data generated', {
                    artistCount: dataset.artists.length,
                    dataSize: dataset.metadata.totalSize
                });
            }

        } catch (error) {
            console.warn('⚠️  Failed to generate mock data:', error.message);
        }
    }

    /**
     * Setup error testing
     */
    async setupErrorTesting() {
        console.log('💥 Setting up error scenario testing...');

        const scenarios = this.services.errorTester.getScenarios();
        console.log(`📋 Available error scenarios: ${scenarios.length}`);

        if (this.services.logger) {
            await this.services.logger.info('Error testing setup complete', {
                scenarioCount: scenarios.length
            });
        }
    }

    /**
     * Stop all services
     */
    async stop() {
        if (!this.isRunning) {
            console.log('⚠️  Advanced development services are not running');
            return;
        }

        console.log('🛑 Stopping Advanced Development Environment...');

        try {
            // Stop hot reload proxy
            if (this.services.proxy) {
                await this.services.proxy.stop();
                this.services.proxy = null;
            }

            // Deactivate all error scenarios
            if (this.services.errorTester) {
                await this.services.errorTester.deactivateAllScenarios();
            }

            if (this.services.logger) {
                await this.services.logger.info('Advanced development services stopped');
            }

            this.isRunning = false;
            console.log('✅ Advanced development environment stopped');

        } catch (error) {
            console.error('❌ Error stopping services:', error.message);
        }
    }

    /**
     * Restart all services
     */
    async restart() {
        console.log('🔄 Restarting Advanced Development Environment...');
        await this.stop();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await this.start();
    }

    /**
     * Get status of all services
     */
    async getStatus() {
        const status = {
            isRunning: this.isRunning,
            services: {
                proxy: this.services.proxy ? 'running' : 'stopped',
                logger: this.services.logger ? 'active' : 'disabled',
                mockGenerator: this.services.mockGenerator ? 'available' : 'unavailable',
                errorTester: this.services.errorTester ? 'available' : 'unavailable'
            },
            config: this.config
        };

        if (this.services.proxy) {
            try {
                const proxyStatus = await this.services.proxy.getStatus?.() || {};
                status.proxyDetails = proxyStatus;
            } catch (error) {
                status.proxyDetails = { error: error.message };
            }
        }

        if (this.services.errorTester) {
            status.activeScenarios = this.services.errorTester.getActiveScenarios();
        }

        return status;
    }

    /**
     * Run health check on all services
     */
    async healthCheck() {
        console.log('🔍 Running health check...');

        const health = {
            overall: 'healthy',
            services: {},
            timestamp: new Date().toISOString()
        };

        // Check proxy
        if (this.services.proxy) {
            try {
                // Simple HTTP check
                const axios = require('axios');
                await axios.get(`http://localhost:${this.config.proxyPort}/_dev/status`, { timeout: 5000 });
                health.services.proxy = 'healthy';
            } catch (error) {
                health.services.proxy = 'unhealthy';
                health.overall = 'degraded';
            }
        } else {
            health.services.proxy = 'disabled';
        }

        // Check logger
        if (this.services.logger) {
            try {
                await this.services.logger.info('Health check');
                health.services.logger = 'healthy';
            } catch (error) {
                health.services.logger = 'unhealthy';
                health.overall = 'degraded';
            }
        } else {
            health.services.logger = 'disabled';
        }

        // Check mock generator
        if (this.services.mockGenerator) {
            try {
                this.services.mockGenerator.generateArtist();
                health.services.mockGenerator = 'healthy';
            } catch (error) {
                health.services.mockGenerator = 'unhealthy';
                health.overall = 'degraded';
            }
        } else {
            health.services.mockGenerator = 'disabled';
        }

        // Check error tester
        if (this.services.errorTester) {
            try {
                this.services.errorTester.getScenarios();
                health.services.errorTester = 'healthy';
            } catch (error) {
                health.services.errorTester = 'unhealthy';
                health.overall = 'degraded';
            }
        } else {
            health.services.errorTester = 'disabled';
        }

        console.log(`📊 Health check complete: ${health.overall}`);
        return health;
    }

    /**
     * Print service status
     */
    printServiceStatus() {
        console.log('📊 Service Status:');
        console.log(`   🔥 Hot Reload Proxy: ${this.services.proxy ? '✅ Running' : '❌ Stopped'} (port ${this.config.proxyPort})`);
        console.log(`   📝 Debug Logger: ${this.services.logger ? '✅ Active' : '❌ Disabled'}`);
        console.log(`   🎭 Mock Generator: ${this.services.mockGenerator ? '✅ Available' : '❌ Unavailable'}`);
        console.log(`   💥 Error Tester: ${this.services.errorTester ? '✅ Available' : '❌ Unavailable'}`);
    }

    /**
     * Print usage instructions
     */
    printUsageInstructions() {
        console.log('');
        console.log('🔗 Service URLs:');
        if (this.services.proxy) {
            console.log(`   Hot Reload Proxy: http://localhost:${this.config.proxyPort}`);
            console.log(`   Proxy Status: http://localhost:${this.config.proxyPort}/_dev/status`);
        }
        
        console.log('');
        console.log('💡 Quick Commands:');
        console.log('   npm run dev:mock-artists          - Generate mock artists');
        console.log('   npm run dev:list-scenarios         - List error scenarios');
        console.log('   npm run dev:activate-error <scenario> - Activate error scenario');
        console.log('   npm run dev:deactivate-errors      - Deactivate all errors');
        console.log('   npm run dev:debug-test             - Test debug logging');
        
        console.log('');
        console.log('🔧 Management:');
        console.log('   node devtools/scripts/advanced-dev-manager.js status    - Check status');
        console.log('   node devtools/scripts/advanced-dev-manager.js health     - Health check');
        console.log('   node devtools/scripts/advanced-dev-manager.js restart    - Restart services');
        console.log('   node devtools/scripts/advanced-dev-manager.js stop       - Stop services');
    }
}

// CLI interface
if (require.main === module) {
    const manager = new AdvancedDevManager({
        proxyPort: process.env.PROXY_PORT || 9001,
        backendUrl: process.env.BACKEND_URL || 'http://localhost:9000',
        watchPath: process.env.WATCH_PATH || path.join(process.cwd(), 'backend/src'),
        logLevel: process.env.LOG_LEVEL || 'info',
        enableHotReload: process.env.ENABLE_HOT_RELOAD !== 'false',
        enableLogging: process.env.ENABLE_LOGGING !== 'false',
        enableMocking: process.env.ENABLE_MOCKING !== 'false',
        enableErrorTesting: process.env.ENABLE_ERROR_TESTING !== 'false'
    });

    const command = process.argv[2];

    switch (command) {
        case 'start':
            manager.start()
                .then(() => {
                    console.log('\nPress Ctrl+C to stop');
                })
                .catch(error => {
                    console.error('Failed to start:', error.message);
                    process.exit(1);
                });
            break;

        case 'stop':
            manager.stop()
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Failed to stop:', error.message);
                    process.exit(1);
                });
            break;

        case 'restart':
            manager.restart()
                .then(() => {
                    console.log('\nPress Ctrl+C to stop');
                })
                .catch(error => {
                    console.error('Failed to restart:', error.message);
                    process.exit(1);
                });
            break;

        case 'status':
            manager.getStatus()
                .then(status => {
                    console.log('📊 Advanced Development Environment Status:');
                    console.log(JSON.stringify(status, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Failed to get status:', error.message);
                    process.exit(1);
                });
            break;

        case 'health':
            manager.healthCheck()
                .then(health => {
                    console.log('🏥 Health Check Results:');
                    console.log(JSON.stringify(health, null, 2));
                    process.exit(health.overall === 'healthy' ? 0 : 1);
                })
                .catch(error => {
                    console.error('Health check failed:', error.message);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
Advanced Development Manager for Tattoo Directory

Usage: node devtools/scripts/advanced-dev-manager.js <command>

Commands:
  start     Start all advanced development services
  stop      Stop all services
  restart   Restart all services
  status    Show service status
  health    Run health check

Environment Variables:
  PROXY_PORT=9001                    Hot reload proxy port
  BACKEND_URL=http://localhost:9000  Backend service URL
  WATCH_PATH=./backend/src           Path to watch for changes
  LOG_LEVEL=info                     Logging level
  ENABLE_HOT_RELOAD=true             Enable hot reload proxy
  ENABLE_LOGGING=true                Enable debug logging
  ENABLE_MOCKING=true                Enable mock data features
  ENABLE_ERROR_TESTING=true          Enable error scenario testing

Examples:
  node devtools/scripts/advanced-dev-manager.js start
  PROXY_PORT=9002 node devtools/scripts/advanced-dev-manager.js start
  node devtools/scripts/advanced-dev-manager.js health
`);
            break;
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Advanced Development Environment...');
        await manager.stop();
        process.exit(0);
    });
}

module.exports = AdvancedDevManager;
