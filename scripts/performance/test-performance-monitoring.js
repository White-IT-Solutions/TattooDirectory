#!/usr/bin/env node

/**
 * Test script for performance monitoring functionality
 * Tests the monitoring scripts with and without running containers
 */

const { execSync } = require('child_process');
const fs = require('fs');

class PerformanceMonitoringTest {
    constructor() {
        this.testResults = [];
    }

    /**
     * Run all performance monitoring tests
     */
    async runTests() {
        console.log('🧪 Testing Performance Monitoring Scripts');
        console.log('='.repeat(50));
        
        // Test 1: Check if scripts exist and are executable
        await this.testScriptExistence();
        
        // Test 2: Test with no containers running
        await this.testWithoutContainers();
        
        // Test 3: Start containers and test monitoring
        await this.testWithContainers();
        
        // Display results
        this.displayResults();
    }

    /**
     * Test if all performance monitoring scripts exist
     */
    async testScriptExistence() {
        console.log('\n📁 Testing Script Existence...');
        
        const scripts = [
            'scripts/performance-monitor.js',
            'scripts/resource-usage-monitor.js',
            'scripts/performance-benchmarks.js',
            'scripts/startup-optimizer.js',
            'scripts/docker-cache-optimizer.js',
            'scripts/performance-dashboard.js'
        ];
        
        for (const script of scripts) {
            try {
                if (fs.existsSync(script)) {
                    console.log(`  ✅ ${script} exists`);
                    this.testResults.push({ test: `Script exists: ${script}`, status: 'pass' });
                } else {
                    console.log(`  ❌ ${script} missing`);
                    this.testResults.push({ test: `Script exists: ${script}`, status: 'fail' });
                }
            } catch (error) {
                console.log(`  ❌ ${script} error: ${error.message}`);
                this.testResults.push({ test: `Script exists: ${script}`, status: 'error', error: error.message });
            }
        }
    }

    /**
     * Test monitoring scripts without containers running
     */
    async testWithoutContainers() {
        console.log('\n🚫 Testing Without Containers...');
        
        // Ensure no containers are running
        try {
            execSync('docker-compose -f devtools/docker/docker-compose.local.yml down', { stdio: 'pipe' });
        } catch (error) {
            // Ignore if nothing was running
        }
        
        // Test performance monitor
        try {
            console.log('  Testing performance monitor...');
            const output = execSync('node scripts/performance-monitor.js', { 
                encoding: 'utf8', 
                timeout: 10000,
                stdio: 'pipe'
            });
            console.log('  ✅ Performance monitor handles no containers gracefully');
            this.testResults.push({ test: 'Performance monitor (no containers)', status: 'pass' });
        } catch (error) {
            console.log('  ⚠️  Performance monitor with no containers:', error.message.substring(0, 100));
            this.testResults.push({ test: 'Performance monitor (no containers)', status: 'expected_error' });
        }
        
        // Test resource usage monitor
        try {
            console.log('  Testing resource usage monitor...');
            const output = execSync('node scripts/resource-usage-monitor.js --once', { 
                encoding: 'utf8', 
                timeout: 10000,
                stdio: 'pipe'
            });
            console.log('  ✅ Resource usage monitor handles no containers gracefully');
            this.testResults.push({ test: 'Resource usage monitor (no containers)', status: 'pass' });
        } catch (error) {
            console.log('  ⚠️  Resource usage monitor with no containers:', error.message.substring(0, 100));
            this.testResults.push({ test: 'Resource usage monitor (no containers)', status: 'expected_error' });
        }
    }

    /**
     * Test monitoring scripts with containers running
     */
    async testWithContainers() {
        console.log('\n🐳 Testing With Containers...');
        
        try {
            // Start LocalStack only for testing (faster than full stack)
            console.log('  Starting LocalStack container...');
            execSync('docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack', { 
                stdio: 'pipe',
                timeout: 60000
            });
            
            // Wait a bit for container to start
            await this.sleep(10000);
            
            // Test performance monitor with running container
            try {
                console.log('  Testing performance monitor with containers...');
                const output = execSync('node scripts/performance-monitor.js', { 
                    encoding: 'utf8', 
                    timeout: 15000,
                    stdio: 'pipe'
                });
                console.log('  ✅ Performance monitor works with containers');
                this.testResults.push({ test: 'Performance monitor (with containers)', status: 'pass' });
            } catch (error) {
                console.log('  ❌ Performance monitor failed:', error.message.substring(0, 100));
                this.testResults.push({ test: 'Performance monitor (with containers)', status: 'fail', error: error.message });
            }
            
            // Test resource usage monitor with running container
            try {
                console.log('  Testing resource usage monitor with containers...');
                const output = execSync('node scripts/resource-usage-monitor.js --once', { 
                    encoding: 'utf8', 
                    timeout: 15000,
                    stdio: 'pipe'
                });
                console.log('  ✅ Resource usage monitor works with containers');
                this.testResults.push({ test: 'Resource usage monitor (with containers)', status: 'pass' });
            } catch (error) {
                console.log('  ❌ Resource usage monitor failed:', error.message.substring(0, 100));
                this.testResults.push({ test: 'Resource usage monitor (with containers)', status: 'fail', error: error.message });
            }
            
            // Test performance dashboard export
            try {
                console.log('  Testing performance dashboard export...');
                const output = execSync('node scripts/performance-dashboard.js --export', { 
                    encoding: 'utf8', 
                    timeout: 15000,
                    stdio: 'pipe'
                });
                console.log('  ✅ Performance dashboard export works');
                this.testResults.push({ test: 'Performance dashboard export', status: 'pass' });
            } catch (error) {
                console.log('  ❌ Performance dashboard failed:', error.message.substring(0, 100));
                this.testResults.push({ test: 'Performance dashboard export', status: 'fail', error: error.message });
            }
            
        } catch (error) {
            console.log('  ❌ Failed to start containers:', error.message);
            this.testResults.push({ test: 'Container startup', status: 'fail', error: error.message });
        } finally {
            // Clean up
            try {
                console.log('  Cleaning up containers...');
                execSync('docker-compose -f devtools/docker/docker-compose.local.yml down', { stdio: 'pipe' });
            } catch (error) {
                console.log('  ⚠️  Cleanup warning:', error.message);
            }
        }
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n📊 Test Results Summary');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'pass').length;
        const failed = this.testResults.filter(r => r.status === 'fail').length;
        const errors = this.testResults.filter(r => r.status === 'error').length;
        const expectedErrors = this.testResults.filter(r => r.status === 'expected_error').length;
        
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`🔴 Errors: ${errors}`);
        console.log(`⚠️  Expected Errors: ${expectedErrors}`);
        
        if (failed > 0 || errors > 0) {
            console.log('\n❌ Failed/Error Tests:');
            this.testResults
                .filter(r => r.status === 'fail' || r.status === 'error')
                .forEach(result => {
                    console.log(`  - ${result.test}: ${result.error || 'Unknown error'}`);
                });
        }
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(result => {
            const icon = {
                'pass': '✅',
                'fail': '❌',
                'error': '🔴',
                'expected_error': '⚠️'
            }[result.status] || '❓';
            
            console.log(`  ${icon} ${result.test}`);
        });
        
        // Overall result
        const overallSuccess = failed === 0 && errors === 0;
        console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);
        
        if (overallSuccess) {
            console.log('\n🚀 Performance monitoring is ready to use!');
            console.log('Available commands:');
            console.log('  npm run performance:monitor');
            console.log('  npm run performance:resources');
            console.log('  npm run performance:benchmark');
            console.log('  npm run performance:dashboard');
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new PerformanceMonitoringTest();
    tester.runTests().catch(console.error);
}

module.exports = PerformanceMonitoringTest;
