#!/usr/bin/env node

/**
 * Comprehensive Security Validator
 * Orchestrates all security checks for the local development environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import security modules
const EnvironmentValidator = require('./environment-validator');
const DockerImageScanner = require('./docker-image-scanner');
const DockerNetworkSecurity = require('./docker-network-security');
const AccessControlManager = require('./access-control-manager');

class SecurityValidator {
    constructor() {
        this.environmentValidator = new EnvironmentValidator();
        this.imageScanner = new DockerImageScanner();
        this.networkSecurity = new DockerNetworkSecurity();
        this.accessControl = new AccessControlManager();
        
        this.securityChecks = [
            {
                name: 'Environment Validation',
                description: 'Validate environment variables and configuration',
                validator: () => this.environmentValidator.validateEnvironment(),
                critical: true
            },
            {
                name: 'Docker Image Security',
                description: 'Scan Docker images for vulnerabilities',
                validator: () => this.runImageScan(),
                critical: false
            },
            {
                name: 'Network Security',
                description: 'Validate Docker network configuration',
                validator: () => this.networkSecurity.validateNetworkSecurity(),
                critical: true
            },
            {
                name: 'Access Controls',
                description: 'Validate service access controls',
                validator: () => this.accessControl.validateAccessControls(),
                critical: true
            },
            {
                name: 'Container Security',
                description: 'Validate container security configurations',
                validator: () => this.validateContainerSecurity(),
                critical: true
            },
            {
                name: 'Data Protection',
                description: 'Validate data protection measures',
                validator: () => this.validateDataProtection(),
                critical: false
            }
        ];
    }

    /**
     * Run comprehensive security validation
     */
    async runSecurityValidation() {
        console.log('🔒 Starting comprehensive security validation...\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            overall: { passed: 0, failed: 0, warnings: 0 },
            checks: [],
            critical_failures: [],
            recommendations: []
        };

        let allPassed = true;
        let criticalFailures = 0;

        for (const check of this.securityChecks) {
            console.log(`🔍 Running: ${check.name}`);
            console.log(`   ${check.description}`);
            
            const checkResult = {
                name: check.name,
                description: check.description,
                critical: check.critical,
                passed: false,
                duration: 0,
                details: null,
                error: null
            };

            const startTime = Date.now();
            
            try {
                checkResult.passed = await check.validator();
                checkResult.duration = Date.now() - startTime;
                
                if (checkResult.passed) {
                    console.log(`   ✅ Passed (${checkResult.duration}ms)\n`);
                    results.overall.passed++;
                } else {
                    console.log(`   ❌ Failed (${checkResult.duration}ms)\n`);
                    results.overall.failed++;
                    allPassed = false;
                    
                    if (check.critical) {
                        criticalFailures++;
                        results.critical_failures.push(check.name);
                    }
                }
            } catch (error) {
                checkResult.error = error.message;
                checkResult.duration = Date.now() - startTime;
                console.log(`   💥 Error: ${error.message} (${checkResult.duration}ms)\n`);
                results.overall.failed++;
                allPassed = false;
                
                if (check.critical) {
                    criticalFailures++;
                    results.critical_failures.push(check.name);
                }
            }
            
            results.checks.push(checkResult);
        }

        // Generate recommendations
        this.generateSecurityRecommendations(results);
        
        // Generate final report
        this.generateSecurityReport(results, allPassed, criticalFailures);
        
        return {
            passed: allPassed,
            criticalFailures,
            results
        };
    }

    /**
     * Run Docker image security scan
     */
    async runImageScan() {
        try {
            await this.imageScanner.scanImages();
            return true;
        } catch (error) {
            console.warn('⚠️  Image scan completed with warnings');
            return false;
        }
    }

    /**
     * Validate container security configurations
     */
    async validateContainerSecurity() {
        console.log('   🐳 Checking container security configurations...');
        
        const containers = this.getRunningContainers();
        let allSecure = true;
        
        for (const container of containers) {
            const securityInfo = await this.getContainerSecurityInfo(container);
            
            // Check security requirements
            const checks = [
                {
                    name: 'No new privileges',
                    check: () => securityInfo.securityOpt?.includes('no-new-privileges:true'),
                    required: true
                },
                {
                    name: 'Non-root user',
                    check: () => securityInfo.user !== 'root' && securityInfo.user !== '0:0',
                    required: container !== 'tattoo-directory-localstack' // LocalStack may need root
                },
                {
                    name: 'Read-only filesystem',
                    check: () => securityInfo.readOnly,
                    required: !['tattoo-directory-localstack'].includes(container)
                },
                {
                    name: 'No privileged mode',
                    check: () => !securityInfo.privileged,
                    required: true
                }
            ];
            
            for (const check of checks) {
                if (check.required && !check.check()) {
                    console.log(`     ❌ ${container}: ${check.name} failed`);
                    allSecure = false;
                }
            }
        }
        
        return allSecure;
    }

    /**
     * Validate data protection measures
     */
    async validateDataProtection() {
        console.log('   🛡️  Checking data protection measures...');
        
        let allProtected = true;
        
        // Check for sensitive files in repository
        const sensitiveFiles = [
            '.env.production',
            '.env.staging',
            'aws-credentials.json',
            'service-account.json',
            'private-key.pem',
            '.aws/credentials'
        ];
        
        for (const file of sensitiveFiles) {
            if (fs.existsSync(file)) {
                console.log(`     ❌ Sensitive file found in repository: ${file}`);
                allProtected = false;
            }
        }
        
        // Check .gitignore for sensitive patterns
        if (fs.existsSync('.gitignore')) {
            const gitignore = fs.readFileSync('.gitignore', 'utf8');
            const requiredPatterns = ['.env.local', '.env.production', '*.pem', 'aws-credentials.json'];
            
            for (const pattern of requiredPatterns) {
                if (!gitignore.includes(pattern)) {
                    console.log(`     ⚠️  .gitignore missing pattern: ${pattern}`);
                    allProtected = false;
                }
            }
        }
        
        // Check test data for sensitive information
        const testDataPath = path.join(process.cwd(), 'scripts', 'test-data');
        if (fs.existsSync(testDataPath)) {
            const testFiles = fs.readdirSync(testDataPath, { recursive: true });
            
            for (const file of testFiles) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(testDataPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for potential sensitive data patterns
                    const sensitivePatterns = [
                        /\b[A-Za-z0-9._%+-]+@(?!example\.com|test\.com)[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
                        /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
                        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card pattern
                        /sk_live_[a-zA-Z0-9]+/, // Stripe live keys
                        /AKIA[0-9A-Z]{16}/ // AWS access keys
                    ];
                    
                    for (const pattern of sensitivePatterns) {
                        if (pattern.test(content)) {
                            console.log(`     ❌ Potential sensitive data in test file: ${file}`);
                            allProtected = false;
                        }
                    }
                }
            }
        }
        
        return allProtected;
    }

    /**
     * Get running containers
     */
    getRunningContainers() {
        try {
            const output = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
            return output.trim().split('\n').filter(name => name.includes('tattoo-directory'));
        } catch (error) {
            return [];
        }
    }

    /**
     * Get container security information
     */
    async getContainerSecurityInfo(containerName) {
        try {
            const output = execSync(`docker inspect ${containerName}`, { encoding: 'utf8' });
            const containerData = JSON.parse(output)[0];
            
            return {
                securityOpt: containerData.HostConfig?.SecurityOpt || [],
                readOnly: containerData.HostConfig?.ReadonlyRootfs || false,
                user: containerData.Config?.User || 'root',
                privileged: containerData.HostConfig?.Privileged || false,
                capAdd: containerData.HostConfig?.CapAdd || [],
                capDrop: containerData.HostConfig?.CapDrop || []
            };
        } catch (error) {
            return {};
        }
    }

    /**
     * Generate security recommendations
     */
    generateSecurityRecommendations(results) {
        const failedChecks = results.checks.filter(check => !check.passed);
        
        for (const check of failedChecks) {
            switch (check.name) {
                case 'Environment Validation':
                    results.recommendations.push({
                        priority: 'HIGH',
                        category: 'Environment',
                        recommendation: 'Fix environment variable configuration issues',
                        action: 'Run: npm run security:fix-environment'
                    });
                    break;
                    
                case 'Docker Image Security':
                    results.recommendations.push({
                        priority: 'MEDIUM',
                        category: 'Images',
                        recommendation: 'Update Docker images to address security vulnerabilities',
                        action: 'Run: npm run security:update-images'
                    });
                    break;
                    
                case 'Network Security':
                    results.recommendations.push({
                        priority: 'HIGH',
                        category: 'Network',
                        recommendation: 'Fix Docker network security configuration',
                        action: 'Run: npm run security:fix-network'
                    });
                    break;
                    
                case 'Access Controls':
                    results.recommendations.push({
                        priority: 'HIGH',
                        category: 'Access',
                        recommendation: 'Configure proper access controls for services',
                        action: 'Run: npm run security:configure-access'
                    });
                    break;
                    
                case 'Container Security':
                    results.recommendations.push({
                        priority: 'HIGH',
                        category: 'Containers',
                        recommendation: 'Update container security configurations',
                        action: 'Review docker-compose.local.yml security settings'
                    });
                    break;
                    
                case 'Data Protection':
                    results.recommendations.push({
                        priority: 'MEDIUM',
                        category: 'Data',
                        recommendation: 'Remove sensitive data from repository and test files',
                        action: 'Review and clean sensitive data patterns'
                    });
                    break;
            }
        }
    }

    /**
     * Generate comprehensive security report
     */
    generateSecurityReport(results, allPassed, criticalFailures) {
        console.log('\n🔒 COMPREHENSIVE SECURITY VALIDATION REPORT');
        console.log('===========================================\n');
        
        // Overall status
        if (allPassed) {
            console.log('✅ Overall Status: PASSED');
        } else if (criticalFailures > 0) {
            console.log('❌ Overall Status: CRITICAL FAILURES');
        } else {
            console.log('⚠️  Overall Status: WARNINGS');
        }
        
        console.log(`📊 Summary: ${results.overall.passed} passed, ${results.overall.failed} failed`);
        
        if (criticalFailures > 0) {
            console.log(`🚨 Critical Failures: ${criticalFailures}`);
            results.critical_failures.forEach(failure => {
                console.log(`   - ${failure}`);
            });
        }
        
        // Detailed results
        console.log('\n📋 Detailed Results:');
        results.checks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            const critical = check.critical ? '🔴' : '🟡';
            console.log(`${status} ${critical} ${check.name} (${check.duration}ms)`);
            if (check.error) {
                console.log(`     Error: ${check.error}`);
            }
        });
        
        // Recommendations
        if (results.recommendations.length > 0) {
            console.log('\n💡 Security Recommendations:');
            results.recommendations.forEach(rec => {
                const priority = rec.priority === 'HIGH' ? '🔴' : '🟡';
                console.log(`${priority} [${rec.category}] ${rec.recommendation}`);
                console.log(`     Action: ${rec.action}`);
            });
        }
        
        console.log('\n===========================================\n');
        
        // Save report
        this.saveSecurityReport(results);
    }

    /**
     * Save security report
     */
    saveSecurityReport(results) {
        const reportPath = path.join(process.cwd(), 'logs', 'security', 'comprehensive-security-report.json');
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
            console.log(`📄 Comprehensive security report saved to: ${reportPath}`);
        } catch (error) {
            console.warn('⚠️  Could not save security report:', error.message);
        }
    }

    /**
     * Fix common security issues automatically
     */
    async fixSecurityIssues() {
        console.log('🔧 Attempting to fix common security issues...\n');
        
        let fixesApplied = 0;
        
        try {
            // Fix environment issues
            console.log('🔍 Checking environment configuration...');
            if (!this.environmentValidator.validateEnvironment()) {
                console.log('🔧 Creating secure environment template...');
                this.environmentValidator.createSecureTemplate();
                fixesApplied++;
            }
            
            // Configure network security
            console.log('🔍 Checking network security...');
            if (!this.networkSecurity.validateNetworkSecurity()) {
                console.log('🔧 Configuring network security...');
                await this.networkSecurity.configureNetworkIsolation();
                fixesApplied++;
            }
            
            // Configure access controls
            console.log('🔍 Checking access controls...');
            if (!await this.accessControl.validateAccessControls()) {
                console.log('🔧 Configuring access controls...');
                await this.accessControl.configureAccessControls();
                fixesApplied++;
            }
            
            console.log(`\n✅ Applied ${fixesApplied} security fixes`);
            
            if (fixesApplied > 0) {
                console.log('🔄 Please restart the environment to apply all changes:');
                console.log('   npm run local:restart');
            }
            
            return fixesApplied > 0;
            
        } catch (error) {
            console.error('❌ Failed to fix security issues:', error.message);
            return false;
        }
    }

    /**
     * Generate security monitoring script
     */
    generateSecurityMonitoring() {
        const monitoringScript = `#!/bin/bash
# Comprehensive security monitoring for local development environment

LOG_DIR="logs/security"
mkdir -p "$LOG_DIR"

echo "$(date): Starting security monitoring..." >> "$LOG_DIR/security-monitor.log"

while true; do
    echo "$(date): Running security validation..." >> "$LOG_DIR/security-monitor.log"
    
    # Run comprehensive security check
    node scripts/security/security-validator.js validate >> "$LOG_DIR/security-monitor.log" 2>&1
    
    # Check exit code
    if [ $? -ne 0 ]; then
        echo "$(date): SECURITY ALERT - Validation failed!" >> "$LOG_DIR/security-alerts.log"
        # Could send notification here
    fi
    
    # Wait 10 minutes before next check
    sleep 600
done
`;

        const scriptPath = path.join(process.cwd(), 'scripts', 'security', 'monitor-security.sh');
        fs.writeFileSync(scriptPath, monitoringScript);
        fs.chmodSync(scriptPath, '755');
        
        console.log('✅ Security monitoring script created at:', scriptPath);
    }
}

// CLI interface
if (require.main === module) {
    const validator = new SecurityValidator();
    const command = process.argv[2];

    switch (command) {
        case 'validate':
            validator.runSecurityValidation().then(result => {
                process.exit(result.passed ? 0 : 1);
            });
            break;
            
        case 'fix':
            validator.fixSecurityIssues().then(fixed => {
                process.exit(fixed ? 0 : 1);
            });
            break;
            
        case 'monitor':
            validator.generateSecurityMonitoring();
            break;
            
        case 'report':
            validator.runSecurityValidation().then(() => {
                // Report already generated
            });
            break;
            
        default:
            console.log('Usage: node security-validator.js [validate|fix|monitor|report]');
            console.log('');
            console.log('Commands:');
            console.log('  validate  - Run comprehensive security validation');
            console.log('  fix       - Attempt to fix common security issues');
            console.log('  monitor   - Generate security monitoring script');
            console.log('  report    - Generate detailed security report');
            process.exit(1);
    }
}

module.exports = SecurityValidator;