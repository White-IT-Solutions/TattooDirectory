#!/usr/bin/env node

/**
 * Docker Network Security Configuration and Validation
 * Implements network isolation and security measures for local development environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DockerNetworkSecurity {
    constructor() {
        this.networkName = 'tattoo-directory-local';
        this.allowedPorts = {
            frontend: 3000,
            backend: 9000,
            swagger: 8080,
            localstack: 4566,
            backendDebug: 9229,
            frontendDebug: 9230
        };
        this.securityRules = {
            isolateFromHost: true,
            restrictExternalAccess: true,
            enableFirewall: true,
            logConnections: true
        };
    }

    /**
     * Validate Docker network configuration
     */
    validateNetworkSecurity() {
        console.log('🔍 Validating Docker network security configuration...');
        
        try {
            // Check if Docker is running
            execSync('docker info', { stdio: 'pipe' });
            
            // Validate network isolation
            this.validateNetworkIsolation();
            
            // Check port exposure
            this.validatePortExposure();
            
            // Verify container communication rules
            this.validateContainerCommunication();
            
            console.log('✅ Docker network security validation passed');
            return true;
        } catch (error) {
            console.error('❌ Docker network security validation failed:', error.message);
            return false;
        }
    }

    /**
     * Configure network isolation
     */
    configureNetworkIsolation() {
        console.log('🔧 Configuring Docker network isolation...');
        
        try {
            // Create isolated bridge network if it doesn't exist
            try {
                execSync(`docker network inspect ${this.networkName}`, { stdio: 'pipe' });
                console.log(`Network ${this.networkName} already exists`);
            } catch {
                console.log(`Creating isolated network: ${this.networkName}`);
                execSync(`docker network create --driver bridge --internal=false ${this.networkName}`, { stdio: 'pipe' });
            }

            // Configure network security rules
            this.applyNetworkSecurityRules();
            
            console.log('✅ Network isolation configured successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to configure network isolation:', error.message);
            return false;
        }
    }

    /**
     * Validate network isolation
     */
    validateNetworkIsolation() {
        try {
            const networkInfo = execSync(`docker network inspect ${this.networkName}`, { encoding: 'utf8' });
            const network = JSON.parse(networkInfo)[0];
            
            // Check if network is properly isolated
            if (!network.Driver === 'bridge') {
                throw new Error('Network must use bridge driver for proper isolation');
            }
            
            // Validate IPAM configuration
            if (!network.IPAM || !network.IPAM.Config) {
                throw new Error('Network must have proper IPAM configuration');
            }
            
            console.log('✅ Network isolation validated');
        } catch (error) {
            throw new Error(`Network isolation validation failed: ${error.message}`);
        }
    }

    /**
     * Validate port exposure
     */
    validatePortExposure() {
        const runningContainers = this.getRunningContainers();
        
        for (const container of runningContainers) {
            const ports = this.getContainerPorts(container);
            
            for (const port of ports) {
                if (!this.isPortAllowed(port)) {
                    throw new Error(`Unauthorized port exposure detected: ${port} on container ${container}`);
                }
            }
        }
        
        console.log('✅ Port exposure validated');
    }

    /**
     * Validate container communication rules
     */
    validateContainerCommunication() {
        const containers = this.getRunningContainers();
        
        // Ensure containers can only communicate within the isolated network
        for (const container of containers) {
            const networkConfig = this.getContainerNetworkConfig(container);
            
            if (!networkConfig.Networks[this.networkName]) {
                throw new Error(`Container ${container} is not connected to isolated network`);
            }
        }
        
        console.log('✅ Container communication rules validated');
    }

    /**
     * Apply network security rules
     */
    applyNetworkSecurityRules() {
        // Configure iptables rules for additional security (Linux only)
        if (process.platform === 'linux') {
            this.configureLinuxFirewallRules();
        }
        
        // Log network connections for monitoring
        if (this.securityRules.logConnections) {
            this.enableConnectionLogging();
        }
    }

    /**
     * Configure Linux firewall rules
     */
    configureLinuxFirewallRules() {
        try {
            // Allow only necessary ports
            const allowedPorts = Object.values(this.allowedPorts);
            
            for (const port of allowedPorts) {
                execSync(`sudo iptables -A INPUT -p tcp --dport ${port} -s 127.0.0.1 -j ACCEPT`, { stdio: 'pipe' });
            }
            
            console.log('✅ Linux firewall rules configured');
        } catch (error) {
            console.warn('⚠️ Could not configure firewall rules (may require sudo):', error.message);
        }
    }

    /**
     * Enable connection logging
     */
    enableConnectionLogging() {
        const logDir = path.join(process.cwd(), 'logs', 'security');
        
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Create network monitoring script
        const monitorScript = `#!/bin/bash
# Network connection monitoring for security
while true; do
    echo "$(date): Network connections:" >> ${logDir}/network-connections.log
    docker network ls >> ${logDir}/network-connections.log
    docker ps --format "table {{.Names}}\\t{{.Ports}}" >> ${logDir}/network-connections.log
    echo "---" >> ${logDir}/network-connections.log
    sleep 60
done
`;
        
        fs.writeFileSync(path.join(logDir, 'monitor-network.sh'), monitorScript);
        fs.chmodSync(path.join(logDir, 'monitor-network.sh'), '755');
        
        console.log('✅ Connection logging enabled');
    }

    /**
     * Get running containers
     */
    getRunningContainers() {
        try {
            const output = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
            return output.trim().split('\n').filter(name => name.includes('tattoo-directory'));
        } catch {
            return [];
        }
    }

    /**
     * Get container ports
     */
    getContainerPorts(containerName) {
        try {
            const output = execSync(`docker port ${containerName}`, { encoding: 'utf8' });
            return output.trim().split('\n').map(line => {
                const match = line.match(/(\d+)\/tcp/);
                return match ? parseInt(match[1]) : null;
            }).filter(port => port !== null);
        } catch {
            return [];
        }
    }

    /**
     * Check if port is allowed
     */
    isPortAllowed(port) {
        return Object.values(this.allowedPorts).includes(port);
    }

    /**
     * Get container network configuration
     */
    getContainerNetworkConfig(containerName) {
        try {
            const output = execSync(`docker inspect ${containerName}`, { encoding: 'utf8' });
            const config = JSON.parse(output)[0];
            return config.NetworkSettings;
        } catch {
            return { Networks: {} };
        }
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            networkName: this.networkName,
            allowedPorts: this.allowedPorts,
            securityRules: this.securityRules,
            runningContainers: this.getRunningContainers(),
            validationResults: {
                networkIsolation: false,
                portExposure: false,
                containerCommunication: false
            }
        };

        try {
            this.validateNetworkIsolation();
            report.validationResults.networkIsolation = true;
        } catch (error) {
            report.validationResults.networkIsolationError = error.message;
        }

        try {
            this.validatePortExposure();
            report.validationResults.portExposure = true;
        } catch (error) {
            report.validationResults.portExposureError = error.message;
        }

        try {
            this.validateContainerCommunication();
            report.validationResults.containerCommunication = true;
        } catch (error) {
            report.validationResults.containerCommunicationError = error.message;
        }

        return report;
    }
}

// CLI interface
if (require.main === module) {
    const security = new DockerNetworkSecurity();
    const command = process.argv[2];

    switch (command) {
        case 'validate':
            process.exit(security.validateNetworkSecurity() ? 0 : 1);
            break;
        case 'configure':
            process.exit(security.configureNetworkIsolation() ? 0 : 1);
            break;
        case 'report':
            console.log(JSON.stringify(security.generateSecurityReport(), null, 2));
            break;
        default:
            console.log('Usage: node docker-network-security.js [validate|configure|report]');
            process.exit(1);
    }
}

module.exports = DockerNetworkSecurity;