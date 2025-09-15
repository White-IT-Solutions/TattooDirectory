#!/usr/bin/env node

/**
 * Access Control Manager for Local Development Environment
 * Manages and validates access controls for local service endpoints
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

class AccessControlManager {
    constructor() {
        this.services = {
            frontend: {
                name: 'Frontend',
                port: 3000,
                container: 'tattoo-directory-frontend',
                ip: '172.20.0.30',
                externalAccess: true,
                debugPort: 9230,
                securityLevel: 'high'
            },
            backend: {
                name: 'Backend API',
                port: 9000,
                container: 'tattoo-directory-backend',
                ip: '172.20.0.20',
                externalAccess: true,
                debugPort: 9229,
                securityLevel: 'high'
            },
            swagger: {
                name: 'Swagger UI',
                port: 8080,
                container: 'tattoo-directory-swagger',
                ip: '172.20.0.40',
                externalAccess: true,
                debugPort: null,
                securityLevel: 'low'
            },
            localstack: {
                name: 'LocalStack',
                port: 4566,
                container: 'tattoo-directory-localstack',
                ip: '172.20.0.10',
                externalAccess: false,
                debugPort: null,
                securityLevel: 'medium'
            },
            seeder: {
                name: 'Data Seeder',
                port: null,
                container: 'tattoo-directory-seeder',
                ip: '172.20.0.50',
                externalAccess: false,
                debugPort: null,
                securityLevel: 'medium'
            }
        };

        this.allowedConnections = {
            frontend: ['backend'],
            backend: ['localstack'],
            swagger: ['backend'],
            seeder: ['localstack'],
            localstack: []
        };

        this.securityPolicies = {
            high: {
                requiresAuthentication: false, // Local development
                rateLimitEnabled: true,
                corsEnabled: true,
                securityHeaders: true,
                inputValidation: true
            },
            medium: {
                requiresAuthentication: false,
                rateLimitEnabled: false,
                corsEnabled: true,
                securityHeaders: false,
                inputValidation: true
            },
            low: {
                requiresAuthentication: false,
                rateLimitEnabled: false,
                corsEnabled: false,
                securityHeaders: false,
                inputValidation: false
            }
        };
    }

    /**
     * Validate access controls for all services
     */
    async validateAccessControls() {
        console.log('🔒 Validating access controls for local services...\n');

        const results = {
            valid: true,
            services: {},
            networkConnectivity: {},
            securityPolicies: {},
            violations: []
        };

        try {
            // Check service accessibility
            await this.validateServiceAccess(results);
            
            // Validate network connectivity
            await this.validateNetworkConnectivity(results);
            
            // Check security policies
            await this.validateSecurityPolicies(results);
            
            // Validate port bindings
            await this.validatePortBindings(results);
            
            this.generateAccessControlReport(results);
            return results.valid;
            
        } catch (error) {
            console.error('❌ Access control validation failed:', error.message);
            results.valid = false;
            return false;
        }
    }

    /**
     * Validate service accessibility
     */
    async validateServiceAccess(results) {
        console.log('🔍 Checking service accessibility...');

        for (const [serviceKey, service] of Object.entries(this.services)) {
            const serviceResult = {
                name: service.name,
                accessible: false,
                externalAccess: service.externalAccess,
                debugAccess: false,
                securityLevel: service.securityLevel
            };

            // Check main service port
            if (service.port) {
                serviceResult.accessible = await this.checkPortAccessibility('localhost', service.port);
                
                if (service.externalAccess && !serviceResult.accessible) {
                    results.violations.push(`${service.name} should be externally accessible but is not responding`);
                    results.valid = false;
                }
                
                if (!service.externalAccess && serviceResult.accessible) {
                    // Check if it's bound to localhost only
                    const externalAccess = await this.checkPortAccessibility('0.0.0.0', service.port);
                    if (externalAccess) {
                        results.violations.push(`${service.name} should not be externally accessible but is bound to 0.0.0.0`);
                        results.valid = false;
                    }
                }
            }

            // Check debug port if applicable
            if (service.debugPort) {
                serviceResult.debugAccess = await this.checkPortAccessibility('localhost', service.debugPort);
            }

            results.services[serviceKey] = serviceResult;
        }
    }

    /**
     * Validate network connectivity between services
     */
    async validateNetworkConnectivity(results) {
        console.log('🌐 Validating inter-service connectivity...');

        for (const [sourceService, allowedTargets] of Object.entries(this.allowedConnections)) {
            const connectivityResult = {
                source: sourceService,
                allowedConnections: allowedTargets,
                actualConnections: [],
                violations: []
            };

            // Test allowed connections
            for (const targetService of allowedTargets) {
                const target = this.services[targetService];
                if (target && target.port) {
                    const canConnect = await this.testContainerConnectivity(
                        this.services[sourceService].container,
                        target.ip,
                        target.port
                    );
                    
                    if (canConnect) {
                        connectivityResult.actualConnections.push(targetService);
                    } else {
                        connectivityResult.violations.push(`Cannot connect to allowed service: ${targetService}`);
                        results.valid = false;
                    }
                }
            }

            results.networkConnectivity[sourceService] = connectivityResult;
        }
    }

    /**
     * Validate security policies for each service
     */
    async validateSecurityPolicies(results) {
        console.log('🛡️  Validating security policies...');

        for (const [serviceKey, service] of Object.entries(this.services)) {
            const policy = this.securityPolicies[service.securityLevel];
            const policyResult = {
                securityLevel: service.securityLevel,
                policies: policy,
                compliance: {},
                violations: []
            };

            // Check container security settings
            const containerInfo = await this.getContainerSecurityInfo(service.container);
            
            // Validate security options
            policyResult.compliance.noNewPrivileges = containerInfo.securityOpt?.includes('no-new-privileges:true') || false;
            policyResult.compliance.readOnlyFilesystem = containerInfo.readOnly || false;
            policyResult.compliance.nonRootUser = containerInfo.user !== 'root' && containerInfo.user !== '0:0';
            
            // Check for violations
            if (service.securityLevel === 'high') {
                if (!policyResult.compliance.noNewPrivileges) {
                    policyResult.violations.push('High security service missing no-new-privileges');
                    results.valid = false;
                }
                if (!policyResult.compliance.nonRootUser) {
                    policyResult.violations.push('High security service running as root');
                    results.valid = false;
                }
            }

            results.securityPolicies[serviceKey] = policyResult;
        }
    }

    /**
     * Validate port bindings
     */
    async validatePortBindings(results) {
        console.log('🔌 Validating port bindings...');

        const portBindings = await this.getDockerPortBindings();
        
        for (const [serviceKey, service] of Object.entries(this.services)) {
            if (service.port && service.externalAccess) {
                const binding = portBindings[service.port];
                
                if (!binding) {
                    results.violations.push(`${service.name} port ${service.port} not bound`);
                    results.valid = false;
                } else if (binding.hostIp !== '127.0.0.1') {
                    results.violations.push(`${service.name} port ${service.port} not bound to localhost (bound to ${binding.hostIp})`);
                    results.valid = false;
                }
            }
        }
    }

    /**
     * Check if a port is accessible
     */
    async checkPortAccessibility(host, port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 3000;

            socket.setTimeout(timeout);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                resolve(false);
            });

            socket.connect(port, host);
        });
    }

    /**
     * Test connectivity between containers
     */
    async testContainerConnectivity(sourceContainer, targetIp, targetPort) {
        try {
            const command = `docker exec ${sourceContainer} nc -z -w3 ${targetIp} ${targetPort}`;
            execSync(command, { stdio: 'pipe' });
            return true;
        } catch (error) {
            return false;
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
            console.warn(`⚠️  Could not inspect container ${containerName}: ${error.message}`);
            return {};
        }
    }

    /**
     * Get Docker port bindings
     */
    async getDockerPortBindings() {
        try {
            const output = execSync('docker ps --format "{{.Names}}:{{.Ports}}"', { encoding: 'utf8' });
            const bindings = {};
            
            output.trim().split('\n').forEach(line => {
                const [containerName, ports] = line.split(':');
                if (ports && containerName.includes('tattoo-directory')) {
                    const portMatches = ports.match(/(\d+\.\d+\.\d+\.\d+):(\d+)->(\d+)/g);
                    if (portMatches) {
                        portMatches.forEach(match => {
                            const [, hostIp, hostPort, containerPort] = match.match(/(\d+\.\d+\.\d+\.\d+):(\d+)->(\d+)/);
                            bindings[parseInt(hostPort)] = {
                                hostIp,
                                hostPort: parseInt(hostPort),
                                containerPort: parseInt(containerPort),
                                container: containerName
                            };
                        });
                    }
                }
            });
            
            return bindings;
        } catch (error) {
            console.warn('⚠️  Could not get port bindings:', error.message);
            return {};
        }
    }

    /**
     * Generate access control report
     */
    generateAccessControlReport(results) {
        console.log('\n📊 ACCESS CONTROL VALIDATION REPORT');
        console.log('=====================================\n');

        if (results.valid) {
            console.log('✅ Access control validation passed');
        } else {
            console.log('❌ Access control validation failed');
        }

        // Service accessibility report
        console.log('\n🔍 Service Accessibility:');
        for (const [serviceKey, service] of Object.entries(results.services)) {
            const status = service.accessible ? '✅' : '❌';
            const debugStatus = service.debugAccess ? '🐛' : '  ';
            console.log(`  ${status} ${debugStatus} ${service.name} (${service.securityLevel} security)`);
        }

        // Network connectivity report
        console.log('\n🌐 Network Connectivity:');
        for (const [sourceService, connectivity] of Object.entries(results.networkConnectivity)) {
            console.log(`  📡 ${sourceService}:`);
            connectivity.allowedConnections.forEach(target => {
                const connected = connectivity.actualConnections.includes(target);
                const status = connected ? '✅' : '❌';
                console.log(`    ${status} → ${target}`);
            });
        }

        // Security policy compliance
        console.log('\n🛡️  Security Policy Compliance:');
        for (const [serviceKey, policy] of Object.entries(results.securityPolicies)) {
            console.log(`  🔒 ${serviceKey} (${policy.securityLevel} security):`);
            console.log(`    No New Privileges: ${policy.compliance.noNewPrivileges ? '✅' : '❌'}`);
            console.log(`    Read-Only Filesystem: ${policy.compliance.readOnlyFilesystem ? '✅' : '❌'}`);
            console.log(`    Non-Root User: ${policy.compliance.nonRootUser ? '✅' : '❌'}`);
        }

        // Violations
        if (results.violations.length > 0) {
            console.log('\n🚨 Security Violations:');
            results.violations.forEach(violation => {
                console.log(`  - ${violation}`);
            });
        }

        console.log('\n=====================================\n');

        // Save report
        this.saveAccessControlReport(results);
    }

    /**
     * Save access control report
     */
    saveAccessControlReport(results) {
        const reportPath = path.join(process.cwd(), 'logs', 'security', 'access-control-report.json');
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const reportData = {
            timestamp: new Date().toISOString(),
            valid: results.valid,
            summary: {
                servicesChecked: Object.keys(results.services).length,
                accessibleServices: Object.values(results.services).filter(s => s.accessible).length,
                securityViolations: results.violations.length
            },
            details: results
        };
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
            console.log(`📄 Access control report saved to: ${reportPath}`);
        } catch (error) {
            console.warn('⚠️  Could not save access control report:', error.message);
        }
    }

    /**
     * Configure access controls
     */
    async configureAccessControls() {
        console.log('🔧 Configuring access controls...');

        try {
            // Ensure Docker network exists with proper configuration
            await this.ensureSecureNetwork();
            
            // Configure firewall rules (if supported)
            await this.configureFirewallRules();
            
            // Set up monitoring
            await this.setupAccessMonitoring();
            
            console.log('✅ Access controls configured successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to configure access controls:', error.message);
            return false;
        }
    }

    /**
     * Ensure secure network configuration
     */
    async ensureSecureNetwork() {
        try {
            // Check if network exists
            execSync('docker network inspect tattoo-directory-local', { stdio: 'pipe' });
            console.log('✅ Secure network already exists');
        } catch (error) {
            // Create secure network
            console.log('🔧 Creating secure Docker network...');
            execSync(`docker network create --driver bridge \
                --subnet=172.20.0.0/16 \
                --gateway=172.20.0.1 \
                --opt com.docker.network.bridge.name=tattoo-local-br0 \
                --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 \
                tattoo-directory-local`, { stdio: 'pipe' });
            console.log('✅ Secure network created');
        }
    }

    /**
     * Configure firewall rules (Linux only)
     */
    async configureFirewallRules() {
        if (process.platform !== 'linux') {
            console.log('ℹ️  Firewall configuration skipped (not Linux)');
            return;
        }

        try {
            // Allow localhost connections only
            const allowedPorts = [3000, 8080, 9000, 4566, 9229, 9230];
            
            for (const port of allowedPorts) {
                execSync(`sudo iptables -A INPUT -p tcp --dport ${port} -s 127.0.0.1 -j ACCEPT`, { stdio: 'pipe' });
                execSync(`sudo iptables -A INPUT -p tcp --dport ${port} -j DROP`, { stdio: 'pipe' });
            }
            
            console.log('✅ Firewall rules configured');
        } catch (error) {
            console.warn('⚠️  Could not configure firewall rules (may require sudo):', error.message);
        }
    }

    /**
     * Setup access monitoring
     */
    async setupAccessMonitoring() {
        const monitoringScript = `#!/bin/bash
# Access control monitoring script
while true; do
    echo "$(date): Access control check" >> logs/security/access-monitoring.log
    node scripts/security/access-control-manager.js validate >> logs/security/access-monitoring.log 2>&1
    sleep 300  # Check every 5 minutes
done
`;

        const scriptPath = path.join(process.cwd(), 'scripts', 'security', 'monitor-access.sh');
        fs.writeFileSync(scriptPath, monitoringScript);
        fs.chmodSync(scriptPath, '755');
        
        console.log('✅ Access monitoring configured');
    }
}

// CLI interface
if (require.main === module) {
    const accessControl = new AccessControlManager();
    const command = process.argv[2];

    switch (command) {
        case 'validate':
            accessControl.validateAccessControls().then(valid => {
                process.exit(valid ? 0 : 1);
            });
            break;
        case 'configure':
            accessControl.configureAccessControls().then(success => {
                process.exit(success ? 0 : 1);
            });
            break;
        case 'report':
            accessControl.validateAccessControls().then(() => {
                // Report already generated in validation
            });
            break;
        default:
            console.log('Usage: node access-control-manager.js [validate|configure|report]');
            process.exit(1);
    }
}

module.exports = AccessControlManager;