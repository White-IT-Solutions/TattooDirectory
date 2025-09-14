#!/usr/bin/env node

/**
 * Resource usage monitoring for Docker containers
 * Provides detailed CPU, memory, network, and disk I/O monitoring
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class ResourceUsageMonitor extends EventEmitter {
    constructor() {
        super();
        this.services = [
            'localstack',
            'backend', 
            'frontend',
            'swagger-ui',
            'data-seeder'
        ];
        
        this.thresholds = {
            cpu: {
                warning: 70,
                critical: 85
            },
            memory: {
                warning: 75,
                critical: 90
            },
            network: {
                warning: 100 * 1024 * 1024, // 100MB/s
                critical: 500 * 1024 * 1024  // 500MB/s
            }
        };
        
        this.history = [];
        this.alerts = [];
        this.isMonitoring = false;
    }

    /**
     * Start continuous resource monitoring
     */
    async startMonitoring(intervalSeconds = 10) {
        if (this.isMonitoring) {
            console.log('⚠️  Monitoring is already running');
            return;
        }

        this.isMonitoring = true;
        console.log(`🔄 Starting resource monitoring (${intervalSeconds}s intervals)`);
        console.log('Press Ctrl+C to stop');

        // Initial collection
        await this.collectMetrics();

        // Set up interval
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
            } catch (error) {
                console.error('Monitoring error:', error.message);
            }
        }, intervalSeconds * 1000);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.stopMonitoring();
        });
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.isMonitoring = false;
        console.log('\n🛑 Resource monitoring stopped');
        
        // Save final report
        this.generateReport();
        process.exit(0);
    }

    /**
     * Collect metrics for all services
     */
    async collectMetrics() {
        const timestamp = new Date().toISOString();
        const metrics = {
            timestamp,
            services: {},
            system: await this.getSystemMetrics()
        };

        for (const service of this.services) {
            try {
                const serviceMetrics = await this.getServiceMetrics(service);
                metrics.services[service] = serviceMetrics;
                
                // Check thresholds and emit alerts
                this.checkThresholds(service, serviceMetrics);
                
            } catch (error) {
                metrics.services[service] = {
                    error: error.message,
                    status: 'unavailable'
                };
            }
        }

        // Store in history
        this.history.push(metrics);
        
        // Keep only last 100 entries
        if (this.history.length > 100) {
            this.history.shift();
        }

        // Display current metrics
        this.displayCurrentMetrics(metrics);
        
        // Emit metrics event
        this.emit('metrics', metrics);
        
        return metrics;
    }

    /**
     * Get detailed metrics for a specific service
     */
    async getServiceMetrics(service) {
        const containerName = this.getContainerName(service);
        
        try {
            // Get container stats
            const statsOutput = execSync(
                `docker stats ${containerName} --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}},{{.PIDs}}"`,
                { encoding: 'utf8', timeout: 5000 }
            ).trim();

            const [cpuPerc, memUsage, memPerc, netIO, blockIO, pids] = statsOutput.split(',');
            
            // Parse memory usage
            const memParts = memUsage.split(' / ');
            const memUsed = this.parseSize(memParts[0]);
            const memLimit = this.parseSize(memParts[1]);
            
            // Parse network I/O
            const netParts = netIO.split(' / ');
            const netIn = this.parseSize(netParts[0]);
            const netOut = this.parseSize(netParts[1]);
            
            // Parse block I/O
            const blockParts = blockIO.split(' / ');
            const blockRead = this.parseSize(blockParts[0]);
            const blockWrite = this.parseSize(blockParts[1]);
            
            // Get additional container info
            const containerInfo = await this.getContainerInfo(containerName);
            
            return {
                status: 'running',
                cpu: {
                    percent: parseFloat(cpuPerc.replace('%', '')),
                    cores: containerInfo.cpuCount || 1
                },
                memory: {
                    used: memUsed,
                    limit: memLimit,
                    percent: parseFloat(memPerc.replace('%', '')),
                    usedMB: Math.round(memUsed / 1024 / 1024),
                    limitMB: Math.round(memLimit / 1024 / 1024)
                },
                network: {
                    inBytes: netIn,
                    outBytes: netOut,
                    inMB: Math.round(netIn / 1024 / 1024),
                    outMB: Math.round(netOut / 1024 / 1024)
                },
                disk: {
                    readBytes: blockRead,
                    writeBytes: blockWrite,
                    readMB: Math.round(blockRead / 1024 / 1024),
                    writeMB: Math.round(blockWrite / 1024 / 1024)
                },
                processes: parseInt(pids),
                uptime: containerInfo.uptime,
                restartCount: containerInfo.restartCount
            };
            
        } catch (error) {
            throw new Error(`Failed to get metrics for ${service}: ${error.message}`);
        }
    }

    /**
     * Get additional container information
     */
    async getContainerInfo(containerName) {
        try {
            const inspectOutput = execSync(
                `docker inspect ${containerName} --format='{{.State.StartedAt}},{{.RestartCount}},{{.HostConfig.NanoCpus}}'`,
                { encoding: 'utf8', timeout: 3000 }
            ).trim();

            const [startedAt, restartCount, nanoCpus] = inspectOutput.split(',');
            
            const startTime = new Date(startedAt);
            const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
            const cpuCount = nanoCpus ? Math.ceil(parseInt(nanoCpus) / 1000000000) : 1;
            
            return {
                uptime,
                restartCount: parseInt(restartCount),
                cpuCount
            };
        } catch (error) {
            return {
                uptime: 0,
                restartCount: 0,
                cpuCount: 1
            };
        }
    }

    /**
     * Get system-wide metrics
     */
    async getSystemMetrics() {
        try {
            // Get Docker system info
            const systemInfo = execSync('docker system df --format "{{.Type}},{{.TotalCount}},{{.Size}}"', 
                { encoding: 'utf8', timeout: 5000 });
            
            const dockerUsage = {};
            systemInfo.trim().split('\n').forEach(line => {
                const [type, count, size] = line.split(',');
                dockerUsage[type.toLowerCase()] = {
                    count: parseInt(count),
                    size: size
                };
            });

            // Get host system metrics (if available)
            let hostMetrics = {};
            try {
                // Try to get host CPU and memory info
                const hostStats = execSync('docker run --rm --pid host alpine ps aux', 
                    { encoding: 'utf8', timeout: 3000 });
                
                // Parse basic host info
                hostMetrics = {
                    processes: hostStats.split('\n').length - 2,
                    available: true
                };
            } catch (error) {
                hostMetrics = { available: false };
            }

            return {
                docker: dockerUsage,
                host: hostMetrics,
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
     * Check resource thresholds and generate alerts
     */
    checkThresholds(service, metrics) {
        const alerts = [];
        
        if (metrics.status === 'running') {
            // CPU threshold check
            if (metrics.cpu.percent >= this.thresholds.cpu.critical) {
                alerts.push({
                    level: 'critical',
                    service,
                    type: 'cpu',
                    message: `Critical CPU usage: ${metrics.cpu.percent}%`,
                    value: metrics.cpu.percent,
                    threshold: this.thresholds.cpu.critical
                });
            } else if (metrics.cpu.percent >= this.thresholds.cpu.warning) {
                alerts.push({
                    level: 'warning',
                    service,
                    type: 'cpu',
                    message: `High CPU usage: ${metrics.cpu.percent}%`,
                    value: metrics.cpu.percent,
                    threshold: this.thresholds.cpu.warning
                });
            }
            
            // Memory threshold check
            if (metrics.memory.percent >= this.thresholds.memory.critical) {
                alerts.push({
                    level: 'critical',
                    service,
                    type: 'memory',
                    message: `Critical memory usage: ${metrics.memory.percent}% (${metrics.memory.usedMB}MB)`,
                    value: metrics.memory.percent,
                    threshold: this.thresholds.memory.critical
                });
            } else if (metrics.memory.percent >= this.thresholds.memory.warning) {
                alerts.push({
                    level: 'warning',
                    service,
                    type: 'memory',
                    message: `High memory usage: ${metrics.memory.percent}% (${metrics.memory.usedMB}MB)`,
                    value: metrics.memory.percent,
                    threshold: this.thresholds.memory.warning
                });
            }
        }
        
        // Store and emit alerts
        alerts.forEach(alert => {
            alert.timestamp = new Date().toISOString();
            this.alerts.push(alert);
            this.emit('alert', alert);
            
            // Display alert
            const icon = alert.level === 'critical' ? '🚨' : '⚠️';
            console.log(`${icon} ${alert.message}`);
        });
        
        // Keep only recent alerts
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > oneHourAgo
        );
    }

    /**
     * Display current metrics in console
     */
    displayCurrentMetrics(metrics) {
        // Clear screen and show header
        process.stdout.write('\x1Bc');
        console.log('📊 Resource Usage Monitor');
        console.log('='.repeat(80));
        console.log(`Timestamp: ${metrics.timestamp}`);
        console.log();

        // Service metrics table
        console.log('Service Metrics:');
        console.log('Service'.padEnd(12) + 'Status'.padEnd(10) + 'CPU%'.padEnd(8) + 'Memory'.padEnd(15) + 'Network I/O'.padEnd(15) + 'Disk I/O');
        console.log('-'.repeat(80));
        
        Object.entries(metrics.services).forEach(([service, data]) => {
            if (data.error) {
                console.log(service.padEnd(12) + 'Error'.padEnd(10) + data.error);
            } else {
                const cpu = `${data.cpu.percent.toFixed(1)}%`;
                const memory = `${data.memory.usedMB}/${data.memory.limitMB}MB`;
                const network = `${data.network.inMB}/${data.network.outMB}MB`;
                const disk = `${data.disk.readMB}/${data.disk.writeMB}MB`;
                
                console.log(
                    service.padEnd(12) + 
                    'Running'.padEnd(10) + 
                    cpu.padEnd(8) + 
                    memory.padEnd(15) + 
                    network.padEnd(15) + 
                    disk
                );
            }
        });
        
        // System metrics
        if (metrics.system && !metrics.system.error) {
            console.log('\nSystem Metrics:');
            if (metrics.system.docker) {
                Object.entries(metrics.system.docker).forEach(([type, data]) => {
                    console.log(`  ${type}: ${data.count} items, ${data.size}`);
                });
            }
        }
        
        // Recent alerts
        const recentAlerts = this.alerts.slice(-5);
        if (recentAlerts.length > 0) {
            console.log('\nRecent Alerts:');
            recentAlerts.forEach(alert => {
                const icon = alert.level === 'critical' ? '🚨' : '⚠️';
                console.log(`  ${icon} ${alert.message}`);
            });
        }
        
        console.log('\nPress Ctrl+C to stop monitoring');
    }

    /**
     * Parse size string to bytes
     */
    parseSize(sizeStr) {
        const units = {
            'B': 1,
            'kB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };
        
        const match = sizeStr.match(/^([\d.]+)\s*([A-Za-z]+)$/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];
            return value * (units[unit] || 1);
        }
        
        return 0;
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
     * Generate comprehensive report
     */
    generateReport() {
        if (this.history.length === 0) {
            console.log('No metrics collected for report');
            return;
        }

        console.log('\n📊 Resource Usage Report');
        console.log('='.repeat(50));
        
        // Calculate averages
        const serviceAverages = {};
        this.services.forEach(service => {
            const serviceMetrics = this.history
                .map(h => h.services[service])
                .filter(m => m && !m.error);
            
            if (serviceMetrics.length > 0) {
                serviceAverages[service] = {
                    avgCpu: serviceMetrics.reduce((sum, m) => sum + m.cpu.percent, 0) / serviceMetrics.length,
                    avgMemory: serviceMetrics.reduce((sum, m) => sum + m.memory.percent, 0) / serviceMetrics.length,
                    maxCpu: Math.max(...serviceMetrics.map(m => m.cpu.percent)),
                    maxMemory: Math.max(...serviceMetrics.map(m => m.memory.percent)),
                    samples: serviceMetrics.length
                };
            }
        });
        
        // Display averages
        console.log('\nAverage Resource Usage:');
        Object.entries(serviceAverages).forEach(([service, avg]) => {
            console.log(`  ${service}:`);
            console.log(`    CPU: ${avg.avgCpu.toFixed(1)}% (max: ${avg.maxCpu.toFixed(1)}%)`);
            console.log(`    Memory: ${avg.avgMemory.toFixed(1)}% (max: ${avg.maxMemory.toFixed(1)}%)`);
            console.log(`    Samples: ${avg.samples}`);
        });
        
        // Alert summary
        console.log(`\nAlert Summary:`);
        console.log(`  Total alerts: ${this.alerts.length}`);
        const criticalAlerts = this.alerts.filter(a => a.level === 'critical').length;
        const warningAlerts = this.alerts.filter(a => a.level === 'warning').length;
        console.log(`  Critical: ${criticalAlerts}`);
        console.log(`  Warnings: ${warningAlerts}`);
        
        // Save detailed report
        const reportData = {
            summary: {
                monitoringPeriod: {
                    start: this.history[0].timestamp,
                    end: this.history[this.history.length - 1].timestamp,
                    duration: this.history.length * 10 // assuming 10s intervals
                },
                serviceAverages,
                totalAlerts: this.alerts.length,
                criticalAlerts,
                warningAlerts
            },
            history: this.history,
            alerts: this.alerts
        };
        
        const reportFile = `resource-usage-report-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportFile}`);
    }

    /**
     * Run one-time resource check
     */
    async runOnce() {
        console.log('🔍 Running one-time resource check...');
        const metrics = await this.collectMetrics();
        return metrics;
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new ResourceUsageMonitor();
    const args = process.argv.slice(2);
    
    if (args.includes('--continuous') || args.includes('-c')) {
        const interval = parseInt(args[args.indexOf('--interval') + 1]) || 10;
        monitor.startMonitoring(interval);
    } else if (args.includes('--once') || args.includes('-o')) {
        monitor.runOnce().then(() => process.exit(0));
    } else {
        console.log('Resource Usage Monitor');
        console.log('Usage:');
        console.log('  --continuous, -c    Start continuous monitoring');
        console.log('  --interval N        Set monitoring interval in seconds (default: 10)');
        console.log('  --once, -o          Run one-time check');
        console.log('');
        console.log('Examples:');
        console.log('  node resource-usage-monitor.js --continuous');
        console.log('  node resource-usage-monitor.js --continuous --interval 5');
        console.log('  node resource-usage-monitor.js --once');
    }
}

module.exports = ResourceUsageMonitor;