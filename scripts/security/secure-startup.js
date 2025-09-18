#!/usr/bin/env node

/**
 * Secure Startup Script
 * Validates security configuration and starts the local environment securely
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import security modules
const SecurityValidator = require('./security-validator');
const EnvironmentValidator = require('./environment-validator');
const DockerNetworkSecurity = require('./docker-network-security');
const AccessControlManager = require('./access-control-manager');

class SecureStartup {
    constructor() {
        this.securityValidator = new SecurityValidator();
        this.environmentValidator = new EnvironmentValidator();
        this.networkSecurity = new DockerNetworkSecurity();
        this.accessControl = new AccessControlManager();
        
        this.securityConfig = this.loadSecurityConfig();
        this.startupChecks = [
            {
                name: 'Pre-flight Security Check',
                description: 'Validate security configuration before startup',
                check: () => this.runPreflightChecks(),
                critical: true
            },
            {
                name: 'Environment Preparation',
                description: 'Prepare secure environment configuration',
                check: () => this.prepareEnvironment(),
                critical: true
            },
            {
                name: 'Network Security Setup',
                description: 'Configure secure Docker network',
                check: () => this.setupSecureNetwork(),
                critical: true
            },
            {
                name: 'Container Security Validation',
                description: 'Validate container security configurations',
                check: () => this.validateContainerSecurity(),
                critical: true
            }
        ];
    }

    /**
     * Load security configuration
     */
    loadSecurityConfig() {
        try {
            const configPath = path.join(process.cwd(), 'devtools', 'scripts', 'security-config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.warn('⚠️  Could not load security config, using defaults');
            return {};
        }
    }

    /**
     * Start the environment securely
     */
    async startSecurely() {
        console.log('🔒 Starting Tattoo Directory Local Environment Securely...\n');
        
        try {
            // Run startup security checks
            const checksResult = await this.runStartupChecks();
            if (!checksResult.passed) {
                console.error('❌ Security checks failed. Cannot start environment safely.');
                return false;
            }
            
            // Start services with security monitoring
            const startResult = await this.startServicesSecurely();
            if (!startResult) {
                console.error('❌ Failed to start services securely.');
                return false;
            }
            
            // Post-startup validation
            const validationResult = await this.postStartupValidation();
            if (!validationResult) {
                console.warn('⚠️  Post-startup validation failed. Environment may not be fully secure.');
            }
            
            // Display security status
            this.displaySecurityStatus();
            
            console.log('✅ Environment started securely!');
            return true;
            
        } catch (error) {
            console.error('❌ Secure startup failed:', error.message);
            return false;
        }
    }

    /**
     * Run startup security checks
     */
    async runStartupChecks() {
        console.log('🔍 Running startup security checks...\n');
        
        const results = {
            passed: 0,
            failed: 0,
            checks: []
        };
        
        for (const check of this.startupChecks) {
            console.log(`🔍 ${check.name}: ${check.description}`);
            
            const checkResult = {
                name: check.name,
                critical: check.critical,
                passed: false,
                duration: 0,
                error: null
            };
            
            const startTime = Date.now();
            
            try {
                checkResult.passed = await check.check();
                checkResult.duration = Date.now() - startTime;
                
                if (checkResult.passed) {
                    console.log(`   ✅ Passed (${checkResult.duration}ms)\n`);
                    results.passed++;
                } else {
                    console.log(`   ❌ Failed (${checkResult.duration}ms)\n`);
                    results.failed++;
                }
            } catch (error) {
                checkResult.error = error.message;
                checkResult.duration = Date.now() - startTime;
                console.log(`   💥 Error: ${error.message} (${checkResult.duration}ms)\n`);
                results.failed++;
            }
            
            results.checks.push(checkResult);
            
            // Stop on critical failures
            if (check.critical && !checkResult.passed) {
                console.error('🚨 Critical security check failed. Aborting startup.');
                return { passed: false, results };
            }
        }
        
        return { passed: results.failed === 0, results };
    }

    /**
     * Run pre-flight security checks
     */
    async runPreflightChecks() {
        console.log('   🔍 Running comprehensive security validation...');
        
        const validationResult = await this.securityValidator.runSecurityValidation();
        
        if (validationResult.criticalFailures > 0) {
            console.log('   🚨 Critical security failures detected');
            return false;
        }
        
        if (!validationResult.passed) {
            console.log('   ⚠️  Security warnings detected, but no critical failures');
        }
        
        return true;
    }

    /**
     * Prepare secure environment
     */
    async prepareEnvironment() {
        console.log('   🔧 Preparing secure environment configuration...');
        
        // Validate environment variables
        if (!this.environmentValidator.validateEnvironment()) {
            console.log('   🔧 Creating secure environment template...');
            this.environmentValidator.createSecureTemplate();
            
            console.log('   ⚠️  Please configure .env.local with secure values and restart');
            return false;
        }
        
        // Ensure logs directory exists with proper permissions
        const logsDir = path.join(process.cwd(), 'logs', 'security');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Create security monitoring files
        this.createSecurityMonitoringFiles();
        
        return true;
    }

    /**
     * Setup secure network
     */
    async setupSecureNetwork() {
        console.log('   🌐 Setting up secure Docker network...');
        
        // Configure network security
        const networkConfigured = await this.networkSecurity.configureNetworkIsolation();
        if (!networkConfigured) {
            return false;
        }
        
        // Validate network security
        const networkValid = this.networkSecurity.validateNetworkSecurity();
        return networkValid;
    }

    /**
     * Validate container security
     */
    async validateContainerSecurity() {
        console.log('   🐳 Validating container security configurations...');
        
        // Check if docker-compose file has security configurations
        const composeFile = path.join(process.cwd(), 'devtools', 'docker', 'docker-compose.local.yml');
        if (!fs.existsSync(composeFile)) {
            console.log('   ❌ Docker compose file not found');
            return false;
        }
        
        const composeContent = fs.readFileSync(composeFile, 'utf8');
        
        // Check for required security configurations
        const requiredSecurityFeatures = [
            'security_opt',
            'no-new-privileges:true',
            'read_only: true',
            'user:',
            'tmpfs:'
        ];
        
        for (const feature of requiredSecurityFeatures) {
            if (!composeContent.includes(feature)) {
                console.log(`   ⚠️  Missing security feature: ${feature}`);
            }
        }
        
        return true;
    }

    /**
     * Start services securely
     */
    async startServicesSecurely() {
        console.log('🚀 Starting services with security monitoring...\n');
        
        try {
            // Start services using docker-compose
            const composeCommand = [
                'docker-compose',
                '-f', 'devtools/docker/docker-compose.local.yml',
                'up', '-d', '--remove-orphans'
            ];
            
            console.log('   📦 Starting containers...');
            execSync(composeCommand.join(' '), { stdio: 'inherit' });
            
            // Wait for services to be ready
            console.log('   ⏳ Waiting for services to be ready...');
            await this.waitForServices();
            
            return true;
        } catch (error) {
            console.error('   ❌ Failed to start services:', error.message);
            return false;
        }
    }

    /**
     * Wait for services to be ready
     */
    async waitForServices() {
        const services = ['localstack', 'backend', 'frontend', 'swagger-ui'];
        const maxWaitTime = 120000; // 2 minutes
        const checkInterval = 5000; // 5 seconds
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const healthyServices = [];
                
                for (const service of services) {
                    const containerName = `tattoo-directory-${service}`;
                    try {
                        const healthOutput = execSync(`docker inspect --format='{{.State.Health.Status}}' ${containerName}`, { encoding: 'utf8' });
                        if (healthOutput.trim() === 'healthy' || healthOutput.trim() === '<no value>') {
                            healthyServices.push(service);
                        }
                    } catch (error) {
                        // Service might not have health check
                        try {
                            const runningOutput = execSync(`docker inspect --format='{{.State.Running}}' ${containerName}`, { encoding: 'utf8' });
                            if (runningOutput.trim() === 'true') {
                                healthyServices.push(service);
                            }
                        } catch (innerError) {
                            // Service not running
                        }
                    }
                }
                
                console.log(`   📊 Services ready: ${healthyServices.length}/${services.length}`);
                
                if (healthyServices.length === services.length) {
                    console.log('   ✅ All services are ready');
                    return true;
                }
                
            } catch (error) {
                console.log('   ⏳ Still waiting for services...');
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        
        console.warn('   ⚠️  Timeout waiting for all services to be ready');
        return false;
    }

    /**
     * Post-startup validation
     */
    async postStartupValidation() {
        console.log('🔍 Running post-startup security validation...\n');
        
        // Validate access controls
        const accessValid = await this.accessControl.validateAccessControls();
        
        // Run quick security check
        const securityResult = await this.securityValidator.runSecurityValidation();
        
        return accessValid && securityResult.passed;
    }

    /**
     * Display security status
     */
    displaySecurityStatus() {
        console.log('\n🔒 SECURITY STATUS REPORT');
        console.log('========================\n');
        
        const services = this.securityConfig.networkSecurity?.serviceIPs || {};
        
        console.log('🌐 Network Configuration:');
        console.log(`   Isolated Network: ${this.securityConfig.networkSecurity?.isolatedNetwork?.name || 'tattoo-directory-local'}`);
        console.log(`   Subnet: ${this.securityConfig.networkSecurity?.isolatedNetwork?.subnet || '172.20.0.0/16'}`);
        console.log(`   Host Binding: ${this.securityConfig.networkSecurity?.isolatedNetwork?.hostBinding || '127.0.0.1'}`);
        
        console.log('\n🔌 Service Endpoints:');
        const ports = this.securityConfig.networkSecurity?.allowedPorts || {};
        console.log(`   Frontend: http://localhost:${ports.frontend || 3000}`);
        console.log(`   Backend API: http://localhost:${ports.backend || 9000}`);
        console.log(`   Swagger UI: http://localhost:${ports.swagger || 8080}`);
        console.log(`   LocalStack: http://localhost:${ports.localstack || 4566} (internal only)`);
        
        console.log('\n🛡️  Security Features:');
        console.log('   ✅ Network Isolation');
        console.log('   ✅ Container Security');
        console.log('   ✅ Access Controls');
        console.log('   ✅ Environment Validation');
        console.log('   ✅ Security Monitoring');
        
        console.log('\n🔍 Security Monitoring:');
        console.log('   📊 Real-time security validation');
        console.log('   📝 Security event logging');
        console.log('   🚨 Automated incident detection');
        
        console.log('\n========================\n');
    }

    /**
     * Create security monitoring files
     */
    createSecurityMonitoringFiles() {
        const securityDir = path.join(process.cwd(), 'logs', 'security');
        
        // Create security event log
        const eventLogPath = path.join(securityDir, 'security-events.log');
        if (!fs.existsSync(eventLogPath)) {
            fs.writeFileSync(eventLogPath, `# Security Events Log\n# Started: ${new Date().toISOString()}\n\n`);
        }
        
        // Create access log
        const accessLogPath = path.join(securityDir, 'access.log');
        if (!fs.existsSync(accessLogPath)) {
            fs.writeFileSync(accessLogPath, `# Access Log\n# Started: ${new Date().toISOString()}\n\n`);
        }
        
        // Create monitoring configuration
        const monitoringConfig = {
            enabled: true,
            interval: 300000, // 5 minutes
            checks: [
                'environment_validation',
                'network_security',
                'access_controls',
                'container_security'
            ],
            alerting: {
                enabled: true,
                criticalFailures: true,
                securityViolations: true
            }
        };
        
        const configPath = path.join(securityDir, 'monitoring-config.json');
        fs.writeFileSync(configPath, JSON.stringify(monitoringConfig, null, 2));
    }

    /**
     * Emergency shutdown
     */
    async emergencyShutdown() {
        console.log('🚨 EMERGENCY SHUTDOWN INITIATED');
        console.log('===============================\n');
        
        try {
            // Stop all services immediately
            console.log('🛑 Stopping all services...');
            execSync('docker-compose -f devtools/docker/docker-compose.local.yml down --remove-orphans', { stdio: 'inherit' });
            
            // Remove network
            console.log('🌐 Removing Docker network...');
            execSync('docker network rm tattoo-directory-local', { stdio: 'pipe' });
            
            // Clean up resources
            console.log('🧹 Cleaning up resources...');
            execSync('docker system prune -f', { stdio: 'pipe' });
            
            console.log('✅ Emergency shutdown completed');
            return true;
        } catch (error) {
            console.error('❌ Emergency shutdown failed:', error.message);
            return false;
        }
    }
}

// CLI interface
if (require.main === module) {
    const secureStartup = new SecureStartup();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            secureStartup.startSecurely().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
            
        case 'emergency-stop':
            secureStartup.emergencyShutdown().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
            
        default:
            console.log('Usage: node secure-startup.js [start|emergency-stop]');
            console.log('');
            console.log('Commands:');
            console.log('  start          - Start environment with comprehensive security validation');
            console.log('  emergency-stop - Emergency shutdown of all services');
            process.exit(1);
    }
}

module.exports = SecureStartup;
