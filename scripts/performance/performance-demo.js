#!/usr/bin/env node

/**
 * Performance Monitoring Demo
 * Demonstrates the performance monitoring capabilities
 */

const { execSync } = require('child_process');

class PerformanceDemo {
    constructor() {
        this.demoSteps = [
            'Check Docker availability',
            'Show available monitoring commands',
            'Demonstrate quick performance check',
            'Show resource monitoring capabilities',
            'Display optimization options'
        ];
    }

    /**
     * Run the performance monitoring demo
     */
    async runDemo() {
        console.log('🎯 Performance Monitoring Demo');
        console.log('='.repeat(50));
        console.log('This demo shows the performance monitoring capabilities');
        console.log('for the Tattoo Directory local development environment.\n');

        for (let i = 0; i < this.demoSteps.length; i++) {
            console.log(`📋 Step ${i + 1}: ${this.demoSteps[i]}`);
            console.log('-'.repeat(40));
            
            switch (i) {
                case 0:
                    await this.checkDockerAvailability();
                    break;
                case 1:
                    await this.showMonitoringCommands();
                    break;
                case 2:
                    await this.demonstrateQuickCheck();
                    break;
                case 3:
                    await this.showResourceMonitoring();
                    break;
                case 4:
                    await this.displayOptimizationOptions();
                    break;
            }
            
            console.log('\n');
        }

        console.log('✅ Demo completed!');
        console.log('\n🚀 Next Steps:');
        console.log('1. Start your local environment: npm run local:start');
        console.log('2. Monitor performance: npm run performance:dashboard');
        console.log('3. Run benchmarks: npm run performance:benchmark');
        console.log('4. Optimize if needed: npm run optimize:startup');
    }

    /**
     * Check if Docker is available
     */
    async checkDockerAvailability() {
        try {
            const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
            console.log(`✅ Docker is available: ${dockerVersion}`);
            
            const composeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
            console.log(`✅ Docker Compose is available: ${composeVersion}`);
            
            // Check if any containers are running
            const runningContainers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' }).trim();
            if (runningContainers) {
                console.log(`📦 Running containers: ${runningContainers.split('\n').join(', ')}`);
            } else {
                console.log('📦 No containers currently running');
            }
            
        } catch (error) {
            console.log('❌ Docker not available or not running');
            console.log('   Please ensure Docker Desktop is installed and running');
        }
    }

    /**
     * Show available monitoring commands
     */
    async showMonitoringCommands() {
        console.log('📊 Available Performance Monitoring Commands:');
        console.log('');
        
        const commands = [
            {
                command: 'npm run performance:monitor',
                description: 'One-time performance check'
            },
            {
                command: 'npm run performance:monitor:continuous',
                description: 'Continuous performance monitoring'
            },
            {
                command: 'npm run performance:resources',
                description: 'Real-time resource usage monitoring'
            },
            {
                command: 'npm run performance:benchmark',
                description: 'Complete performance benchmark suite'
            },
            {
                command: 'npm run performance:benchmark:quick',
                description: 'Quick performance check'
            },
            {
                command: 'npm run performance:dashboard',
                description: 'Interactive performance dashboard'
            },
            {
                command: 'npm run optimize:startup',
                description: 'Optimize startup performance'
            },
            {
                command: 'npm run optimize:cache',
                description: 'Optimize Docker build cache'
            }
        ];
        
        commands.forEach(cmd => {
            console.log(`  ${cmd.command.padEnd(35)} - ${cmd.description}`);
        });
    }

    /**
     * Demonstrate quick performance check
     */
    async demonstrateQuickCheck() {
        console.log('⚡ Demonstrating Quick Performance Check:');
        console.log('');
        
        try {
            console.log('Running: node scripts/performance-benchmarks.js --quick');
            const output = execSync('node scripts/performance-benchmarks.js --quick', { 
                encoding: 'utf8',
                timeout: 15000
            });
            console.log(output);
        } catch (error) {
            console.log('ℹ️  Quick check requires running containers');
            console.log('   Start containers first: npm run local:start');
            console.log('   Then run: npm run performance:benchmark:quick');
        }
    }

    /**
     * Show resource monitoring capabilities
     */
    async showResourceMonitoring() {
        console.log('💾 Resource Monitoring Capabilities:');
        console.log('');
        
        console.log('📈 Metrics Tracked:');
        const metrics = [
            'CPU usage per container',
            'Memory consumption and limits',
            'Network I/O (bytes in/out)',
            'Disk I/O (read/write)',
            'Container uptime and restarts',
            'Process counts',
            'Docker system usage'
        ];
        
        metrics.forEach(metric => {
            console.log(`  • ${metric}`);
        });
        
        console.log('');
        console.log('🚨 Alert Thresholds:');
        console.log('  • CPU Warning: 70%, Critical: 85%');
        console.log('  • Memory Warning: 75%, Critical: 90%');
        console.log('  • Network Warning: 100MB/s, Critical: 500MB/s');
        
        console.log('');
        console.log('📊 Output Formats:');
        console.log('  • Real-time dashboard');
        console.log('  • JSON metrics export');
        console.log('  • Historical reports');
        console.log('  • Alert notifications');
    }

    /**
     * Display optimization options
     */
    async displayOptimizationOptions() {
        console.log('🔧 Performance Optimization Options:');
        console.log('');
        
        console.log('🚀 Startup Optimizations:');
        const startupOpts = [
            'Parallel service startup',
            'Optimized health check intervals',
            'Volume caching configuration',
            'Resource limit tuning',
            'Dependency optimization'
        ];
        
        startupOpts.forEach(opt => {
            console.log(`  • ${opt}`);
        });
        
        console.log('');
        console.log('🐳 Docker Cache Optimizations:');
        const cacheOpts = [
            'Dockerfile layer ordering',
            '.dockerignore file creation',
            'Build cache configuration',
            'Multi-stage build optimization',
            'Layer reuse maximization'
        ];
        
        cacheOpts.forEach(opt => {
            console.log(`  • ${opt}`);
        });
        
        console.log('');
        console.log('📊 Performance Targets:');
        console.log('  • Startup Time: < 60 seconds');
        console.log('  • API Response: < 500ms p95');
        console.log('  • Frontend Load: < 2 seconds');
        console.log('  • CPU Usage: < 70% average');
        console.log('  • Memory Usage: < 75% of limits');
    }
}

// Run demo if called directly
if (require.main === module) {
    const demo = new PerformanceDemo();
    demo.runDemo().catch(console.error);
}

module.exports = PerformanceDemo;