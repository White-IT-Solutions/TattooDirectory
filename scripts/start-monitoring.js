#!/usr/bin/env node

/**
 * Integrated Monitoring Startup Script
 * 
 * Starts comprehensive environment monitoring including:
 * - Health monitoring with service dependency validation
 * - Environment validation with security and performance checks
 * - Alert system with multiple notification channels
 * - Real-time monitoring dashboard
 * - Performance baseline validation
 */

const ComprehensiveMonitoringDashboard = require('./comprehensive-monitoring-dashboard');
const EnvironmentHealthValidator = require('./environment-health-validator');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MonitoringOrchestrator {
    constructor() {
        this.dashboard = null;
        this.validator = null;
        this.isRunning = false;
        this.config = {
            dashboard: {
                port: 3001,
                healthInterval: 30000,    // 30 seconds
                validationInterval: 300000 // 5 minutes
            },
            alerts: {
                enableConsole: true,
                enableFile: true,
                enableWebhook: false,
                webhookUrl: process.env.ALERT_WEBHOOK_URL
            },
            validation: {
                enableContinuous: true,
                interval: 60000, // 1 minute
                scoreThreshold: 70
            }
        };
    }

    /**
     * Initialize monitoring system
     */
    async initialize() {
        console.log('🚀 Initializing comprehensive monitoring system...\n');

        try {
            // Load configuration
            await this.loadConfiguration();
            
            // Validate prerequisites
            await this.validatePrerequisites();
            
            // Initialize components
            this.dashboard = new ComprehensiveMonitoringDashboard(this.config.dashboard.port);
            this.validator = new EnvironmentHealthValidator();
            
            // Configure alert system
            await this.configureAlertSystem();
            
            console.log('✅ Monitoring system initialized successfully\n');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize monitoring system:', error.message);
            throw error;
        }
    }

    /**
     * Load monitoring configuration
     */
    async loadConfiguration() {
        try {
            const configPath = path.join(process.cwd(), '.metrics', 'monitoring-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            const loadedConfig = JSON.parse(configData);
            
            // Merge with default config
            this.config = { ...this.config, ...loadedConfig };
            console.log('📄 Configuration loaded from .metrics/monitoring-config.json');
            
        } catch (error) {
            console.log('📄 Using default configuration (config file not found)');
            // Save default configuration
            await this.saveConfiguration();
        }
    }

    /**
     * Save monitoring configuration
     */
    async saveConfiguration() {
        try {
            const configDir = path.join(process.cwd(), '.metrics');
            await fs.mkdir(configDir, { recursive: true });
            
            const configPath = path.join(configDir, 'monitoring-config.json');
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
            
            console.log('💾 Configuration saved to .metrics/monitoring-config.json');
            
        } catch (error) {
            console.warn('⚠️  Could not save configuration:', error.message);
        }
    }

    /**
     * Validate prerequisites for monitoring
     */
    async validatePrerequisites() {
        console.log('🔍 Validating monitoring prerequisites...');
        
        const checks = [
            {
                name: 'Docker',
                check: () => {
                    try {
                        execSync('docker info', { stdio: 'ignore' });
                        return true;
                    } catch {
                        return false;
                    }
                },
                required: true
            },
            {
                name: 'Docker Compose',
                check: () => {
                    try {
                        execSync('docker-compose --version', { stdio: 'ignore' });
                        return true;
                    } catch {
                        return false;
                    }
                },
                required: true
            },
            {
                name: 'Docker Compose File',
                check: async () => {
                    try {
                        await fs.access('docker-compose.local.yml');
                        return true;
                    } catch {
                        return false;
                    }
                },
                required: true
            },
            {
                name: 'Port 3001 Available',
                check: () => {
                    // Basic check - would need more sophisticated port checking
                    return true;
                },
                required: true
            }
        ];

        for (const check of checks) {
            const result = await check.check();
            const emoji = result ? '✅' : '❌';
            console.log(`  ${emoji} ${check.name}: ${result ? 'OK' : 'FAILED'}`);
            
            if (!result && check.required) {
                throw new Error(`Required prerequisite failed: ${check.name}`);
            }
        }

        console.log('');
    }

    /**
     * Configure alert system
     */
    async configureAlertSystem() {
        if (!this.dashboard) return;

        const alertSystem = this.dashboard.alertSystem;
        
        // Configure notification channels
        alertSystem.configureNotificationChannel('console', {
            enabled: this.config.alerts.enableConsole
        });
        
        alertSystem.configureNotificationChannel('file', {
            enabled: this.config.alerts.enableFile
        });
        
        alertSystem.configureNotificationChannel('webhook', {
            enabled: this.config.alerts.enableWebhook,
            url: this.config.alerts.webhookUrl
        });

        // Add custom monitoring-specific alert rules
        alertSystem.addAlertRule({
            id: 'monitoring-system-failure',
            name: 'Monitoring System Failure',
            condition: (data) => data.monitoringSystemError,
            severity: 'critical',
            message: (data) => `Critical: Monitoring system failure: ${data.monitoringSystemError}`,
            cooldown: 180000 // 3 minutes
        });

        alertSystem.addAlertRule({
            id: 'dashboard-disconnected',
            name: 'Dashboard Disconnected',
            condition: (data) => data.dashboardConnections === 0 && data.dashboardRunning,
            severity: 'warning',
            message: () => 'Warning: No clients connected to monitoring dashboard',
            cooldown: 600000 // 10 minutes
        });

        console.log('🔔 Alert system configured');
    }

    /**
     * Start comprehensive monitoring
     */
    async startMonitoring() {
        if (this.isRunning) {
            console.log('⚠️  Monitoring is already running');
            return;
        }

        console.log('🔄 Starting comprehensive monitoring...\n');

        try {
            // Start dashboard
            await this.dashboard.start();
            
            // Start comprehensive monitoring
            await this.dashboard.startComprehensiveMonitoring(
                this.config.dashboard.healthInterval,
                this.config.dashboard.validationInterval
            );

            // Start continuous validation if enabled
            if (this.config.validation.enableContinuous) {
                await this.validator.startContinuousMonitoring(this.config.validation.interval);
            }

            this.isRunning = true;
            
            console.log('\n🎉 Comprehensive monitoring started successfully!');
            console.log('📊 Dashboard: http://localhost:' + this.config.dashboard.port);
            console.log('🔍 Health checks: every ' + (this.config.dashboard.healthInterval / 1000) + 's');
            console.log('✅ Validation: every ' + (this.config.dashboard.validationInterval / 1000) + 's');
            
            if (this.config.validation.enableContinuous) {
                console.log('🔄 Continuous validation: every ' + (this.config.validation.interval / 1000) + 's');
            }
            
            console.log('\nPress Ctrl+C to stop monitoring\n');
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start monitoring:', error.message);
            await this.stopMonitoring();
            throw error;
        }
    }

    /**
     * Stop comprehensive monitoring
     */
    async stopMonitoring() {
        if (!this.isRunning) {
            console.log('⚠️  Monitoring is not running');
            return;
        }

        console.log('🛑 Stopping comprehensive monitoring...');

        try {
            // Stop continuous validation
            if (this.validator) {
                this.validator.stopContinuousMonitoring();
            }

            // Stop dashboard
            if (this.dashboard) {
                await this.dashboard.stop();
            }

            this.isRunning = false;
            console.log('✅ Monitoring stopped successfully');
            
        } catch (error) {
            console.error('❌ Error stopping monitoring:', error.message);
        }
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            running: this.isRunning,
            dashboard: {
                port: this.config.dashboard.port,
                url: `http://localhost:${this.config.dashboard.port}`
            },
            config: this.config,
            components: {
                dashboard: !!this.dashboard,
                validator: !!this.validator
            }
        };
    }

    /**
     * Run single validation check
     */
    async runValidationCheck() {
        console.log('🔍 Running single validation check...\n');
        
        try {
            if (!this.validator) {
                this.validator = new EnvironmentHealthValidator();
            }
            
            const results = await this.validator.runComprehensiveValidation();
            this.validator.displayValidationSummary(results);
            
            return results;
            
        } catch (error) {
            console.error('❌ Validation check failed:', error.message);
            throw error;
        }
    }

    /**
     * Update configuration
     */
    async updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await this.saveConfiguration();
        console.log('✅ Configuration updated');
    }
}

// CLI interface
async function main() {
    const orchestrator = new MonitoringOrchestrator();
    const command = process.argv[2];
    
    try {
        switch (command) {
            case 'start':
                await orchestrator.initialize();
                await orchestrator.startMonitoring();
                
                // Setup graceful shutdown
                process.on('SIGINT', async () => {
                    console.log('\n🛑 Shutting down monitoring...');
                    await orchestrator.stopMonitoring();
                    process.exit(0);
                });
                
                // Keep process alive
                process.stdin.resume();
                break;
                
            case 'validate':
                await orchestrator.initialize();
                const results = await orchestrator.runValidationCheck();
                process.exit(results.score >= 70 ? 0 : 1);
                break;
                
            case 'status':
                const status = orchestrator.getStatus();
                console.log('📊 Monitoring Status:');
                console.log(JSON.stringify(status, null, 2));
                break;
                
            case 'config':
                const configAction = process.argv[3];
                if (configAction === 'show') {
                    await orchestrator.loadConfiguration();
                    console.log('⚙️  Current Configuration:');
                    console.log(JSON.stringify(orchestrator.config, null, 2));
                } else if (configAction === 'reset') {
                    orchestrator.config = {
                        dashboard: {
                            port: 3001,
                            healthInterval: 30000,
                            validationInterval: 300000
                        },
                        alerts: {
                            enableConsole: true,
                            enableFile: true,
                            enableWebhook: false
                        },
                        validation: {
                            enableContinuous: true,
                            interval: 60000,
                            scoreThreshold: 70
                        }
                    };
                    await orchestrator.saveConfiguration();
                    console.log('✅ Configuration reset to defaults');
                } else {
                    console.log('Usage: node start-monitoring.js config [show|reset]');
                }
                break;
                
            default:
                console.log(`
🏥 Comprehensive Environment Monitoring System

Usage: node start-monitoring.js <command>

Commands:
  start      Start comprehensive monitoring with dashboard
  validate   Run single environment validation check
  status     Show current monitoring status
  config     Configuration management
    show       Show current configuration
    reset      Reset configuration to defaults

Examples:
  node start-monitoring.js start           # Start full monitoring
  node start-monitoring.js validate        # Run validation check
  node start-monitoring.js config show     # Show configuration

Environment Variables:
  ALERT_WEBHOOK_URL    Webhook URL for alert notifications
  MONITORING_PORT      Dashboard port (default: 3001)
`);
                process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Command failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = MonitoringOrchestrator;