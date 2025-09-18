#!/usr/bin/env node

/**
 * Performance Dashboard - Unified performance monitoring interface
 * Provides a real-time dashboard view of all performance metrics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceDashboard {
    constructor() {
        this.refreshInterval = 5000; // 5 seconds
        this.isRunning = false;
        this.metrics = {
            services: {},
            system: {},
            alerts: [],
            lastUpdate: null
        };
    }

    /**
     * Start the performance dashboard
     */
    async start() {
        console.log('🚀 Starting Performance Dashboard...');
        console.log('Press Ctrl+C to exit');
        
        this.isRunning = true;
        
        // Initial data collection
        await this.collectAllMetrics();
        
        // Start refresh loop
        this.refreshLoop();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.stop();
        });
    }

    /**
     * Stop the dashboard
     */
    stop() {
        this.isRunning = false;
        console.log('\n👋 Performance Dashboard stopped');
        process.exit(0);
    }

    /**
     * Main refresh loop
     */
    async refreshLoop() {
        while (this.isRunning) {
            try {
                await this.collectAllMetrics();
                this.renderDashboard();
                await this.sleep(this.refreshInterval);
            } catch (error) {
                console.error('Dashboard error:', error.message);
                await this.sleep(this.refreshInterval);
            }
        }
    }

    /**
     * Collect all performance metrics
     */
    async collectAllMetrics() {
        try {
            // Get service status
            this.metrics.services = await this.getServiceStatus();
            
            // Get resource usage
            const resourceMetrics = await this.getResourceMetrics();
            Object.assign(this.metrics.services, resourceMetrics);
            
            // Get system metrics
            this.metrics.system = await this.getSystemMetrics();
            
            // Check for alerts
            this.metrics.alerts = this.checkAlerts();
            
            this.metrics.lastUpdate = new Date().toISOString();
            
        } catch (error) {
            console.error('Failed to collect metrics:', error.message);
        }
    }

    /**
     * Get service status and health
     */
    async getServiceStatus() {
        const services = ['localstack', 'backend', 'frontend', 'swagger-ui'];
        const status = {};
        
        for (const service of services) {
            try {
                const containerName = this.getContainerName(service);
                
                // Check if container exists and is running
                const inspectOutput = execSync(
                    `docker inspect ${containerName} --format='{{.State.Status}},{{.State.Health.Status}},{{.State.StartedAt}}'`,
                    { encoding: 'utf8', timeout: 3000 }
                ).trim();
                
                const [state, health, startedAt] = inspectOutput.split(',');
                const uptime = this.calculateUptime(startedAt);
                
                status[service] = {
                    status: state,
                    health: health || 'unknown',
                    uptime: uptime,
                    responsive: await this.checkServiceResponsive(service)
                };
                
            } catch (error) {
                status[service] = {
                    status: 'not_running',
                    health: 'unknown',
                    uptime: 0,
                    responsive: false,
                    error: error.message
                };
            }
        }
        
        return status;
    }

    /**
     * Get resource usage metrics
     */
    async getResourceMetrics() {
        const services = ['localstack', 'backend', 'frontend', 'swagger-ui'];
        const metrics = {};
        
        for (const service of services) {
            try {
                const containerName = this.getContainerName(service);
                
                const statsOutput = execSync(
                    `docker stats ${containerName} --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}}"`,
                    { encoding: 'utf8', timeout: 5000 }
                ).trim();
                
                const [cpuPerc, memUsage, memPerc, netIO, blockIO] = statsOutput.split(',');
                
                if (metrics[service]) {
                    Object.assign(metrics[service], {
                        cpu: parseFloat(cpuPerc.replace('%', '')),
                        memory: parseFloat(memPerc.replace('%', '')),
                        memoryUsage: memUsage,
                        networkIO: netIO,
                        diskIO: blockIO
                    });
                } else {
                    metrics[service] = {
                        cpu: parseFloat(cpuPerc.replace('%', '')),
                        memory: parseFloat(memPerc.replace('%', '')),
                        memoryUsage: memUsage,
                        networkIO: netIO,
                        diskIO: blockIO
                    };
                }
                
            } catch (error) {
                if (metrics[service]) {
                    metrics[service].resourceError = error.message;
                }
            }
        }
        
        return metrics;
    }

    /**
     * Get system-wide metrics
     */
    async getSystemMetrics() {
        try {
            // Docker system usage
            const systemDf = execSync('docker system df --format "{{.Type}},{{.TotalCount}},{{.Size}}"', 
                { encoding: 'utf8', timeout: 5000 });
            
            const dockerUsage = {};
            systemDf.trim().split('\n').forEach(line => {
                const [type, count, size] = line.split(',');
                dockerUsage[type.toLowerCase()] = { count: parseInt(count), size };
            });
            
            // Container count
            const containerCount = execSync('docker ps -q | wc -l', { encoding: 'utf8' }).trim();
            
            return {
                docker: dockerUsage,
                containers: {
                    running: parseInt(containerCount),
                    total: dockerUsage.containers?.count || 0
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Check service responsiveness
     */
    async checkServiceResponsive(service) {
        const endpoints = {
            localstack: 'http://localhost:4566/_localstack/health',
            backend: 'http://localhost:9000',
            frontend: 'http://localhost:3000',
            'swagger-ui': 'http://localhost:8080'
        };
        
        const url = endpoints[service];
        if (!url) return false;
        
        try {
            execSync(`curl -f ${url} --max-time 3`, { stdio: 'pipe' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check for performance alerts
     */
    checkAlerts() {
        const alerts = [];
        const now = new Date();
        
        Object.entries(this.metrics.services).forEach(([service, data]) => {
            if (data.cpu !== undefined && data.cpu > 80) {
                alerts.push({
                    level: 'critical',
                    service,
                    type: 'cpu',
                    message: `High CPU usage: ${data.cpu.toFixed(1)}%`,
                    timestamp: now.toISOString()
                });
            }
            
            if (data.memory !== undefined && data.memory > 85) {
                alerts.push({
                    level: 'critical',
                    service,
                    type: 'memory',
                    message: `High memory usage: ${data.memory.toFixed(1)}%`,
                    timestamp: now.toISOString()
                });
            }
            
            if (data.status === 'not_running') {
                alerts.push({
                    level: 'error',
                    service,
                    type: 'status',
                    message: 'Service not running',
                    timestamp: now.toISOString()
                });
            }
            
            if (data.responsive === false && data.status === 'running') {
                alerts.push({
                    level: 'warning',
                    service,
                    type: 'health',
                    message: 'Service not responding',
                    timestamp: now.toISOString()
                });
            }
        });
        
        return alerts;
    }

    /**
     * Render the dashboard
     */
    renderDashboard() {
        // Clear screen
        process.stdout.write('\x1Bc');
        
        // Header
        console.log('📊 Performance Dashboard');
        console.log('='.repeat(80));
        console.log(`Last Update: ${new Date(this.metrics.lastUpdate).toLocaleTimeString()}`);
        console.log();
        
        // Service Status Overview
        this.renderServiceOverview();
        
        // Resource Usage
        this.renderResourceUsage();
        
        // System Information
        this.renderSystemInfo();
        
        // Alerts
        this.renderAlerts();
        
        // Footer
        console.log('='.repeat(80));
        console.log('Press Ctrl+C to exit | Refreshes every 5 seconds');
    }

    /**
     * Render service status overview
     */
    renderServiceOverview() {
        console.log('🔧 Service Status');
        console.log('-'.repeat(40));
        
        const services = ['localstack', 'backend', 'frontend', 'swagger-ui'];
        
        services.forEach(service => {
            const data = this.metrics.services[service] || {};
            const statusIcon = this.getStatusIcon(data.status, data.responsive);
            const healthIcon = this.getHealthIcon(data.health);
            const uptime = this.formatUptime(data.uptime || 0);
            
            console.log(`${statusIcon} ${service.padEnd(12)} ${healthIcon} ${uptime}`);
        });
        
        console.log();
    }

    /**
     * Render resource usage
     */
    renderResourceUsage() {
        console.log('💾 Resource Usage');
        console.log('-'.repeat(40));
        console.log('Service'.padEnd(12) + 'CPU%'.padEnd(8) + 'Memory%'.padEnd(10) + 'Memory Usage');
        console.log('-'.repeat(40));
        
        Object.entries(this.metrics.services).forEach(([service, data]) => {
            if (data.cpu !== undefined) {
                const cpu = data.cpu.toFixed(1) + '%';
                const memory = data.memory.toFixed(1) + '%';
                const memUsage = data.memoryUsage || 'N/A';
                
                const cpuColor = data.cpu > 80 ? '🔴' : data.cpu > 60 ? '🟡' : '🟢';
                const memColor = data.memory > 85 ? '🔴' : data.memory > 70 ? '🟡' : '🟢';
                
                console.log(
                    service.padEnd(12) + 
                    `${cpuColor}${cpu}`.padEnd(8) + 
                    `${memColor}${memory}`.padEnd(10) + 
                    memUsage
                );
            } else {
                console.log(service.padEnd(12) + 'N/A'.padEnd(8) + 'N/A'.padEnd(10) + 'N/A');
            }
        });
        
        console.log();
    }

    /**
     * Render system information
     */
    renderSystemInfo() {
        console.log('🖥️  System Information');
        console.log('-'.repeat(40));
        
        if (this.metrics.system.containers) {
            console.log(`Running Containers: ${this.metrics.system.containers.running}/${this.metrics.system.containers.total}`);
        }
        
        if (this.metrics.system.docker) {
            Object.entries(this.metrics.system.docker).forEach(([type, data]) => {
                console.log(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${data.count} (${data.size})`);
            });
        }
        
        console.log();
    }

    /**
     * Render alerts
     */
    renderAlerts() {
        if (this.metrics.alerts.length === 0) {
            console.log('✅ No Active Alerts');
            return;
        }
        
        console.log('⚠️  Active Alerts');
        console.log('-'.repeat(40));
        
        this.metrics.alerts.forEach(alert => {
            const icon = this.getAlertIcon(alert.level);
            console.log(`${icon} ${alert.service}: ${alert.message}`);
        });
        
        console.log();
    }

    /**
     * Get status icon
     */
    getStatusIcon(status, responsive) {
        if (status === 'running' && responsive) return '🟢';
        if (status === 'running' && !responsive) return '🟡';
        if (status === 'exited') return '🔴';
        return '⚫';
    }

    /**
     * Get health icon
     */
    getHealthIcon(health) {
        switch (health) {
            case 'healthy': return '💚';
            case 'unhealthy': return '❤️';
            case 'starting': return '🟡';
            default: return '⚪';
        }
    }

    /**
     * Get alert icon
     */
    getAlertIcon(level) {
        switch (level) {
            case 'critical': return '🚨';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    /**
     * Calculate uptime from start time
     */
    calculateUptime(startedAt) {
        if (!startedAt) return 0;
        const start = new Date(startedAt);
        return Math.floor((Date.now() - start.getTime()) / 1000);
    }

    /**
     * Format uptime in human readable format
     */
    formatUptime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    }

    /**
     * Get container name for service
     */
    getContainerName(service) {
        // Map services to their actual container names from docker-compose.local.yml
        const containerNames = {
            'localstack': 'tattoo-directory-localstack',
            'backend': 'tattoo-directory-backend',
            'frontend': 'tattoo-directory-frontend',
            'swagger-ui': 'tattoo-directory-swagger',
            'data-seeder': 'tattoo-directory-seeder'
        };
        
        return containerNames[service] || `tattoo-directory-${service}`;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Export current metrics
     */
    exportMetrics() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `dashboard-export-${timestamp}.json`;
        
        fs.writeFileSync(filename, JSON.stringify(this.metrics, null, 2));
        console.log(`\n📄 Metrics exported to: ${filename}`);
    }
}

// CLI interface
if (require.main === module) {
    const dashboard = new PerformanceDashboard();
    const args = process.argv.slice(2);
    
    if (args.includes('--export') || args.includes('-e')) {
        dashboard.collectAllMetrics().then(() => {
            dashboard.exportMetrics();
            process.exit(0);
        });
    } else {
        dashboard.start().catch(console.error);
    }
}

module.exports = PerformanceDashboard;