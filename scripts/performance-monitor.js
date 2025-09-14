#!/usr/bin/env node

/**
 * Performance monitoring script for Docker containers
 * Monitors CPU, memory, network, and disk I/O usage
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
    constructor() {
        this.services = [
            'localstack',
            'backend',
            'frontend', 
            'swagger-ui',
            'data-seeder'
        ];
        this.metricsHistory = [];
        this.alertThresholds = {
            cpu: 80,      // CPU usage percentage
            memory: 85,   // Memory usage percentage
            startup: 60   // Startup time in seconds
        };
    }

    /**
     * Get container statistics for all services
     */
    async getContainerStats() {
        try {
            const composeProject = this.getComposeProjectName();
            const stats = {};

            for (const service of this.services) {
                const containerName = this.getContainerName(service);
                try {
                    // Get container stats in JSON format
                    const statsOutput = execSync(
                        `docker stats ${containerName} --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"`,
                        { encoding: 'utf8', timeout: 5000 }
                    );

                    const lines = statsOutput.trim().split('\n');
                    if (lines.length > 1) {
                        const data = lines[1].split('\t');
                        stats[service] = {
                            container: data[0],
                            cpu: parseFloat(data[1].replace('%', '')),
                            memoryUsage: data[2],
                            memoryPercent: parseFloat(data[3].replace('%', '')),
                            networkIO: data[4],
                            blockIO: data[5],
                            timestamp: new Date().toISOString()
                        };
                    }
                } catch (error) {
                    stats[service] = {
                        error: `Container not running or accessible: ${error.message}`,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            return stats;
        } catch (error) {
            console.error('Error getting container stats:', error.message);
            return {};
        }
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
     * Monitor startup times for all services
     */
    async monitorStartupTimes() {
        console.log('🚀 Monitoring service startup times...');
        const startTime = Date.now();
        const serviceStartTimes = {};

        // Start monitoring each service
        const monitorPromises = this.services.map(service => 
            this.monitorServiceStartup(service, startTime)
        );

        const results = await Promise.allSettled(monitorPromises);
        
        results.forEach((result, index) => {
            const service = this.services[index];
            if (result.status === 'fulfilled') {
                serviceStartTimes[service] = result.value;
            } else {
                serviceStartTimes[service] = { error: result.reason.message };
            }
        });

        return serviceStartTimes;
    }

    /**
     * Monitor individual service startup
     */
    async monitorServiceStartup(service, globalStartTime) {
        const maxWaitTime = 60000; // 1 minute (reduced for faster testing)
        const checkInterval = 2000;  // 2 seconds
        let elapsed = 0;

        while (elapsed < maxWaitTime) {
            try {
                const containerName = this.getContainerName(service);
                
                // Check if container is running
                const inspectOutput = execSync(
                    `docker inspect ${containerName} --format='{{.State.Status}}'`,
                    { encoding: 'utf8', timeout: 3000 }
                ).trim();

                if (inspectOutput === 'running') {
                    const startupTime = (Date.now() - globalStartTime) / 1000;
                    
                    // Check if service is actually ready (not just running)
                    const isReady = await this.checkServiceHealth(service);
                    
                    return {
                        status: 'ready',
                        startupTime: startupTime,
                        healthy: isReady
                    };
                }
            } catch (error) {
                // Container might not exist yet, continue waiting
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
        }

        return {
            status: 'timeout',
            startupTime: maxWaitTime / 1000,
            healthy: false
        };
    }

    /**
     * Check if service is healthy and ready
     */
    async checkServiceHealth(service) {
        try {
            switch (service) {
                case 'localstack':
                    execSync('curl -f http://localhost:4566/_localstack/health', { timeout: 3000 });
                    return true;
                case 'backend':
                    execSync('curl -f http://localhost:9000', { timeout: 3000 });
                    return true;
                case 'frontend':
                    execSync('curl -f http://localhost:3000', { timeout: 3000 });
                    return true;
                case 'swagger-ui':
                    execSync('curl -f http://localhost:8080', { timeout: 3000 });
                    return true;
                default:
                    return true; // Assume healthy for other services
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate performance report
     */
    generateReport(stats, startupTimes) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalServices: this.services.length,
                runningServices: Object.keys(stats).filter(s => !stats[s].error).length,
                avgCpuUsage: 0,
                avgMemoryUsage: 0,
                totalStartupTime: 0
            },
            services: {},
            alerts: []
        };

        // Calculate averages and check thresholds
        let totalCpu = 0, totalMemory = 0, serviceCount = 0;

        Object.entries(stats).forEach(([service, data]) => {
            if (!data.error) {
                totalCpu += data.cpu;
                totalMemory += data.memoryPercent;
                serviceCount++;

                // Check for alerts
                if (data.cpu > this.alertThresholds.cpu) {
                    report.alerts.push(`High CPU usage in ${service}: ${data.cpu}%`);
                }
                if (data.memoryPercent > this.alertThresholds.memory) {
                    report.alerts.push(`High memory usage in ${service}: ${data.memoryPercent}%`);
                }
            }

            report.services[service] = {
                ...data,
                startup: startupTimes[service] || { status: 'unknown' }
            };
        });

        if (serviceCount > 0) {
            report.summary.avgCpuUsage = (totalCpu / serviceCount).toFixed(2);
            report.summary.avgMemoryUsage = (totalMemory / serviceCount).toFixed(2);
        }

        // Calculate total startup time
        Object.values(startupTimes).forEach(startup => {
            if (startup.startupTime && !isNaN(startup.startupTime)) {
                report.summary.totalStartupTime = Math.max(
                    report.summary.totalStartupTime, 
                    startup.startupTime
                );
            }
        });

        return report;
    }

    /**
     * Save metrics to file for historical tracking
     */
    saveMetrics(report) {
        const metricsDir = path.join(process.cwd(), '.metrics');
        if (!fs.existsSync(metricsDir)) {
            fs.mkdirSync(metricsDir);
        }

        const filename = `performance-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(metricsDir, filename);

        let existingData = [];
        if (fs.existsSync(filepath)) {
            try {
                existingData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            } catch (error) {
                console.warn('Could not read existing metrics file:', error.message);
            }
        }

        existingData.push(report);
        fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));
        
        console.log(`📊 Metrics saved to ${filepath}`);
    }

    /**
     * Display performance report in console
     */
    displayReport(report) {
        console.log('\n📊 Performance Report');
        console.log('='.repeat(50));
        console.log(`Timestamp: ${report.timestamp}`);
        console.log(`Services Running: ${report.summary.runningServices}/${report.summary.totalServices}`);
        console.log(`Average CPU Usage: ${report.summary.avgCpuUsage}%`);
        console.log(`Average Memory Usage: ${report.summary.avgMemoryUsage}%`);
        console.log(`Total Startup Time: ${report.summary.totalStartupTime.toFixed(2)}s`);

        if (report.alerts.length > 0) {
            console.log('\n⚠️  Alerts:');
            report.alerts.forEach(alert => console.log(`  - ${alert}`));
        }

        console.log('\n📋 Service Details:');
        Object.entries(report.services).forEach(([service, data]) => {
            if (data.error) {
                console.log(`  ${service}: ❌ ${data.error}`);
            } else {
                const startup = data.startup.startupTime ? 
                    `${data.startup.startupTime.toFixed(2)}s` : 'unknown';
                console.log(`  ${service}: CPU ${data.cpu}% | Memory ${data.memoryPercent}% | Startup ${startup}`);
            }
        });
    }

    /**
     * Run continuous monitoring
     */
    async startContinuousMonitoring(intervalSeconds = 30) {
        console.log(`🔄 Starting continuous monitoring (${intervalSeconds}s intervals)`);
        console.log('Press Ctrl+C to stop');

        const monitor = async () => {
            try {
                const stats = await this.getContainerStats();
                const startupTimes = {}; // Skip startup monitoring in continuous mode
                const report = this.generateReport(stats, startupTimes);
                
                this.displayReport(report);
                this.saveMetrics(report);
            } catch (error) {
                console.error('Monitoring error:', error.message);
            }
        };

        // Initial run
        await monitor();

        // Set up interval
        const interval = setInterval(monitor, intervalSeconds * 1000);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping performance monitoring...');
            clearInterval(interval);
            process.exit(0);
        });
    }

    /**
     * Run one-time performance check
     */
    async runOnce() {
        console.log('🔍 Running performance check...');
        
        const stats = await this.getContainerStats();
        const startupTimes = await this.monitorStartupTimes();
        const report = this.generateReport(stats, startupTimes);
        
        this.displayReport(report);
        this.saveMetrics(report);
        
        return report;
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    const args = process.argv.slice(2);
    
    if (args.includes('--continuous') || args.includes('-c')) {
        const interval = parseInt(args[args.indexOf('--interval') + 1]) || 30;
        monitor.startContinuousMonitoring(interval);
    } else if (args.includes('--startup') || args.includes('-s')) {
        monitor.monitorStartupTimes().then(times => {
            console.log('🚀 Startup Times:');
            Object.entries(times).forEach(([service, data]) => {
                if (data.error) {
                    console.log(`  ${service}: ❌ ${data.error}`);
                } else {
                    console.log(`  ${service}: ${data.startupTime.toFixed(2)}s (${data.status})`);
                }
            });
        });
    } else {
        monitor.runOnce();
    }
}

module.exports = PerformanceMonitor;