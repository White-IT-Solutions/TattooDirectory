#!/usr/bin/env node

/**
 * Performance benchmarking suite for local development environment
 * Tests startup times, API response times, and resource efficiency
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class PerformanceBenchmarks {
    constructor() {
        this.benchmarks = {
            startup: {
                name: 'Environment Startup',
                target: 60, // seconds
                weight: 0.3
            },
            apiResponse: {
                name: 'API Response Time',
                target: 500, // milliseconds
                weight: 0.25
            },
            frontendLoad: {
                name: 'Frontend Load Time',
                target: 2000, // milliseconds
                weight: 0.25
            },
            resourceEfficiency: {
                name: 'Resource Efficiency',
                target: 80, // percentage
                weight: 0.2
            }
        };
        
        this.results = [];
        this.baselineFile = '.performance-baseline.json';
    }

    /**
     * Run complete performance benchmark suite
     */
    async runBenchmarks() {
        console.log('🏁 Starting Performance Benchmark Suite');
        console.log('='.repeat(50));
        
        const results = {
            timestamp: new Date().toISOString(),
            environment: await this.getEnvironmentInfo(),
            benchmarks: {},
            score: 0
        };
        
        try {
            // Run individual benchmarks
            results.benchmarks.startup = await this.benchmarkStartup();
            results.benchmarks.apiResponse = await this.benchmarkApiResponse();
            results.benchmarks.frontendLoad = await this.benchmarkFrontendLoad();
            results.benchmarks.resourceEfficiency = await this.benchmarkResourceEfficiency();
            
            // Calculate overall score
            results.score = this.calculateOverallScore(results.benchmarks);
            
            // Compare with baseline
            const comparison = await this.compareWithBaseline(results);
            
            // Display results
            this.displayResults(results, comparison);
            
            // Save results
            this.saveResults(results);
            
            return results;
            
        } catch (error) {
            console.error('❌ Benchmark failed:', error.message);
            throw error;
        }
    }

    /**
     * Benchmark environment startup time
     */
    async benchmarkStartup() {
        console.log('\n🚀 Benchmarking Environment Startup...');
        
        const runs = 3;
        const times = [];
        
        for (let i = 1; i <= runs; i++) {
            console.log(`  Run ${i}/${runs}...`);
            
            // Stop any running containers
            try {
                execSync('docker-compose -f dev-tools/docker/docker-compose.local.yml down', { stdio: 'pipe' });
                await this.wait(5000); // Wait for cleanup
            } catch (error) {
                // Ignore if nothing was running
            }
            
            const startTime = Date.now();
            
            try {
                // Start environment
                execSync('docker-compose -f dev-tools/docker/docker-compose.local.yml up -d', { stdio: 'pipe' });
                
                // Wait for all services to be ready
                await this.waitForServices();
                
                const totalTime = (Date.now() - startTime) / 1000;
                times.push(totalTime);
                
                console.log(`    ✅ Run ${i}: ${totalTime.toFixed(2)}s`);
                
            } catch (error) {
                console.log(`    ❌ Run ${i} failed: ${error.message}`);
                times.push(null);
            }
        }
        
        const validTimes = times.filter(t => t !== null);
        const avgTime = validTimes.length > 0 ? 
            validTimes.reduce((a, b) => a + b, 0) / validTimes.length : null;
        
        return {
            name: this.benchmarks.startup.name,
            target: this.benchmarks.startup.target,
            runs: runs,
            times: times,
            average: avgTime,
            fastest: validTimes.length > 0 ? Math.min(...validTimes) : null,
            slowest: validTimes.length > 0 ? Math.max(...validTimes) : null,
            success: validTimes.length / runs,
            score: avgTime ? Math.max(0, 100 - ((avgTime / this.benchmarks.startup.target) * 100)) : 0
        };
    }

    /**
     * Benchmark API response times
     */
    async benchmarkApiResponse() {
        console.log('\n⚡ Benchmarking API Response Times...');
        
        const endpoints = [
            { name: 'Health Check', url: 'http://localhost:9000', method: 'GET' },
            { name: 'Artists List', url: 'http://localhost:9000/2015-03-31/functions/function/invocations', 
              method: 'POST', data: { httpMethod: 'GET', path: '/v1/artists' } },
            { name: 'Artist Detail', url: 'http://localhost:9000/2015-03-31/functions/function/invocations',
              method: 'POST', data: { httpMethod: 'GET', path: '/v1/artists/artist-001' } }
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            console.log(`  Testing ${endpoint.name}...`);
            
            const times = [];
            const runs = 10;
            
            for (let i = 0; i < runs; i++) {
                try {
                    const startTime = Date.now();
                    
                    if (endpoint.method === 'POST') {
                        await axios.post(endpoint.url, endpoint.data, { timeout: 5000 });
                    } else {
                        await axios.get(endpoint.url, { timeout: 5000 });
                    }
                    
                    const responseTime = Date.now() - startTime;
                    times.push(responseTime);
                    
                } catch (error) {
                    times.push(null);
                }
            }
            
            const validTimes = times.filter(t => t !== null);
            const avgTime = validTimes.length > 0 ? 
                validTimes.reduce((a, b) => a + b, 0) / validTimes.length : null;
            
            results[endpoint.name] = {
                runs: runs,
                times: times,
                average: avgTime,
                fastest: validTimes.length > 0 ? Math.min(...validTimes) : null,
                slowest: validTimes.length > 0 ? Math.max(...validTimes) : null,
                success: validTimes.length / runs,
                score: avgTime ? Math.max(0, 100 - ((avgTime / this.benchmarks.apiResponse.target) * 100)) : 0
            };
            
            console.log(`    Average: ${avgTime ? avgTime.toFixed(0) : 'N/A'}ms`);
        }
        
        // Calculate overall API score
        const scores = Object.values(results).map(r => r.score);
        const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        return {
            name: this.benchmarks.apiResponse.name,
            target: this.benchmarks.apiResponse.target,
            endpoints: results,
            score: overallScore
        };
    }

    /**
     * Benchmark frontend load times
     */
    async benchmarkFrontendLoad() {
        console.log('\n🌐 Benchmarking Frontend Load Times...');
        
        const urls = [
            { name: 'Homepage', url: 'http://localhost:3000' },
            { name: 'API Docs', url: 'http://localhost:8080' }
        ];
        
        const results = {};
        
        for (const urlInfo of urls) {
            console.log(`  Testing ${urlInfo.name}...`);
            
            const times = [];
            const runs = 5;
            
            for (let i = 0; i < runs; i++) {
                try {
                    const startTime = Date.now();
                    await axios.get(urlInfo.url, { timeout: 10000 });
                    const loadTime = Date.now() - startTime;
                    times.push(loadTime);
                } catch (error) {
                    times.push(null);
                }
            }
            
            const validTimes = times.filter(t => t !== null);
            const avgTime = validTimes.length > 0 ? 
                validTimes.reduce((a, b) => a + b, 0) / validTimes.length : null;
            
            results[urlInfo.name] = {
                runs: runs,
                times: times,
                average: avgTime,
                fastest: validTimes.length > 0 ? Math.min(...validTimes) : null,
                slowest: validTimes.length > 0 ? Math.max(...validTimes) : null,
                success: validTimes.length / runs,
                score: avgTime ? Math.max(0, 100 - ((avgTime / this.benchmarks.frontendLoad.target) * 100)) : 0
            };
            
            console.log(`    Average: ${avgTime ? avgTime.toFixed(0) : 'N/A'}ms`);
        }
        
        // Calculate overall frontend score
        const scores = Object.values(results).map(r => r.score);
        const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        return {
            name: this.benchmarks.frontendLoad.name,
            target: this.benchmarks.frontendLoad.target,
            pages: results,
            score: overallScore
        };
    }

    /**
     * Benchmark resource efficiency
     */
    async benchmarkResourceEfficiency() {
        console.log('\n💾 Benchmarking Resource Efficiency...');
        
        const ResourceUsageMonitor = require('./resource-usage-monitor.js');
        const monitor = new ResourceUsageMonitor();
        
        // Collect metrics for 30 seconds
        const metrics = [];
        const duration = 30; // seconds
        const interval = 5; // seconds
        
        console.log(`  Collecting metrics for ${duration} seconds...`);
        
        for (let i = 0; i < duration / interval; i++) {
            try {
                const metric = await monitor.collectMetrics();
                metrics.push(metric);
                await this.wait(interval * 1000);
            } catch (error) {
                console.log(`    Warning: Failed to collect metric ${i + 1}`);
            }
        }
        
        if (metrics.length === 0) {
            return {
                name: this.benchmarks.resourceEfficiency.name,
                target: this.benchmarks.resourceEfficiency.target,
                score: 0,
                error: 'No metrics collected'
            };
        }
        
        // Calculate resource efficiency
        const serviceMetrics = {};
        const services = ['localstack', 'backend', 'frontend'];
        
        services.forEach(service => {
            const serviceData = metrics
                .map(m => m.services[service])
                .filter(s => s && !s.error);
            
            if (serviceData.length > 0) {
                serviceMetrics[service] = {
                    avgCpu: serviceData.reduce((sum, s) => sum + s.cpu.percent, 0) / serviceData.length,
                    avgMemory: serviceData.reduce((sum, s) => sum + s.memory.percent, 0) / serviceData.length,
                    maxCpu: Math.max(...serviceData.map(s => s.cpu.percent)),
                    maxMemory: Math.max(...serviceData.map(s => s.memory.percent))
                };
            }
        });
        
        // Calculate efficiency score (lower resource usage = higher score)
        let totalScore = 0;
        let serviceCount = 0;
        
        Object.values(serviceMetrics).forEach(metrics => {
            // Score based on keeping CPU and memory usage reasonable
            const cpuScore = Math.max(0, 100 - metrics.avgCpu);
            const memoryScore = Math.max(0, 100 - metrics.avgMemory);
            const serviceScore = (cpuScore + memoryScore) / 2;
            
            totalScore += serviceScore;
            serviceCount++;
        });
        
        const overallScore = serviceCount > 0 ? totalScore / serviceCount : 0;
        
        return {
            name: this.benchmarks.resourceEfficiency.name,
            target: this.benchmarks.resourceEfficiency.target,
            services: serviceMetrics,
            samples: metrics.length,
            score: overallScore
        };
    }

    /**
     * Calculate overall performance score
     */
    calculateOverallScore(benchmarks) {
        let weightedScore = 0;
        let totalWeight = 0;
        
        Object.entries(this.benchmarks).forEach(([key, config]) => {
            if (benchmarks[key] && benchmarks[key].score !== undefined) {
                weightedScore += benchmarks[key].score * config.weight;
                totalWeight += config.weight;
            }
        });
        
        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    }

    /**
     * Compare results with baseline
     */
    async compareWithBaseline(results) {
        let baseline = null;
        
        if (fs.existsSync(this.baselineFile)) {
            try {
                baseline = JSON.parse(fs.readFileSync(this.baselineFile, 'utf8'));
            } catch (error) {
                console.log('⚠️  Could not read baseline file');
            }
        }
        
        if (!baseline) {
            // Set current results as baseline
            fs.writeFileSync(this.baselineFile, JSON.stringify(results, null, 2));
            console.log('📊 Baseline performance metrics saved');
            return { isBaseline: true };
        }
        
        // Compare with baseline
        const comparison = {
            isBaseline: false,
            scoreChange: results.score - baseline.score,
            improvements: [],
            regressions: []
        };
        
        Object.entries(results.benchmarks).forEach(([key, current]) => {
            const baselineBenchmark = baseline.benchmarks[key];
            if (baselineBenchmark && current.score !== undefined && baselineBenchmark.score !== undefined) {
                const change = current.score - baselineBenchmark.score;
                
                if (change > 5) {
                    comparison.improvements.push({
                        benchmark: key,
                        change: change,
                        current: current.score,
                        baseline: baselineBenchmark.score
                    });
                } else if (change < -5) {
                    comparison.regressions.push({
                        benchmark: key,
                        change: change,
                        current: current.score,
                        baseline: baselineBenchmark.score
                    });
                }
            }
        });
        
        return comparison;
    }

    /**
     * Display benchmark results
     */
    displayResults(results, comparison) {
        console.log('\n📊 Performance Benchmark Results');
        console.log('='.repeat(50));
        console.log(`Overall Score: ${results.score.toFixed(1)}/100`);
        
        if (comparison.scoreChange !== undefined) {
            const changeIcon = comparison.scoreChange > 0 ? '📈' : comparison.scoreChange < 0 ? '📉' : '➡️';
            console.log(`Change from baseline: ${changeIcon} ${comparison.scoreChange > 0 ? '+' : ''}${comparison.scoreChange.toFixed(1)}`);
        }
        
        console.log('\nBenchmark Details:');
        Object.entries(results.benchmarks).forEach(([key, benchmark]) => {
            console.log(`\n${benchmark.name}:`);
            console.log(`  Score: ${benchmark.score.toFixed(1)}/100`);
            
            if (key === 'startup') {
                console.log(`  Average time: ${benchmark.average ? benchmark.average.toFixed(2) : 'N/A'}s`);
                console.log(`  Target: ${benchmark.target}s`);
                console.log(`  Success rate: ${(benchmark.success * 100).toFixed(0)}%`);
            } else if (key === 'apiResponse') {
                Object.entries(benchmark.endpoints).forEach(([endpoint, data]) => {
                    console.log(`    ${endpoint}: ${data.average ? data.average.toFixed(0) : 'N/A'}ms`);
                });
            } else if (key === 'frontendLoad') {
                Object.entries(benchmark.pages).forEach(([page, data]) => {
                    console.log(`    ${page}: ${data.average ? data.average.toFixed(0) : 'N/A'}ms`);
                });
            } else if (key === 'resourceEfficiency') {
                if (benchmark.services) {
                    Object.entries(benchmark.services).forEach(([service, data]) => {
                        console.log(`    ${service}: CPU ${data.avgCpu.toFixed(1)}%, Memory ${data.avgMemory.toFixed(1)}%`);
                    });
                }
            }
        });
        
        // Show improvements and regressions
        if (comparison.improvements.length > 0) {
            console.log('\n📈 Improvements:');
            comparison.improvements.forEach(imp => {
                console.log(`  ${imp.benchmark}: +${imp.change.toFixed(1)} points`);
            });
        }
        
        if (comparison.regressions.length > 0) {
            console.log('\n📉 Regressions:');
            comparison.regressions.forEach(reg => {
                console.log(`  ${reg.benchmark}: ${reg.change.toFixed(1)} points`);
            });
        }
        
        // Performance grade
        const grade = this.getPerformanceGrade(results.score);
        console.log(`\n🎯 Performance Grade: ${grade}`);
    }

    /**
     * Get performance grade based on score
     */
    getPerformanceGrade(score) {
        if (score >= 90) return 'A+ (Excellent)';
        if (score >= 80) return 'A (Very Good)';
        if (score >= 70) return 'B (Good)';
        if (score >= 60) return 'C (Fair)';
        if (score >= 50) return 'D (Poor)';
        return 'F (Needs Improvement)';
    }

    /**
     * Save benchmark results
     */
    saveResults(results) {
        const resultsDir = '.benchmark-results';
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
        }
        
        const filename = `benchmark-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
        const filepath = path.join(resultsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: ${filepath}`);
    }

    /**
     * Get environment information
     */
    async getEnvironmentInfo() {
        try {
            const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
            const composeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
            const nodeVersion = process.version;
            const platform = process.platform;
            const arch = process.arch;
            
            return {
                docker: dockerVersion,
                compose: composeVersion,
                node: nodeVersion,
                platform: platform,
                architecture: arch,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                error: 'Could not collect environment info',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Wait for all services to be ready
     */
    async waitForServices() {
        const services = [
            { name: 'LocalStack', url: 'http://localhost:4566/_localstack/health' },
            { name: 'Backend', url: 'http://localhost:9000' },
            { name: 'Frontend', url: 'http://localhost:3000' },
            { name: 'Swagger UI', url: 'http://localhost:8080' }
        ];
        
        const maxWait = 120000; // 2 minutes
        const checkInterval = 2000; // 2 seconds
        let elapsed = 0;
        
        while (elapsed < maxWait) {
            let allReady = true;
            
            for (const service of services) {
                try {
                    await axios.get(service.url, { timeout: 3000 });
                } catch (error) {
                    allReady = false;
                    break;
                }
            }
            
            if (allReady) {
                return;
            }
            
            await this.wait(checkInterval);
            elapsed += checkInterval;
        }
        
        throw new Error('Services did not become ready within timeout');
    }

    /**
     * Utility function to wait
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Run quick performance check
     */
    async quickCheck() {
        console.log('⚡ Running quick performance check...');
        
        try {
            // Check if services are running
            const services = [
                { name: 'LocalStack', url: 'http://localhost:4566/_localstack/health' },
                { name: 'Backend', url: 'http://localhost:9000' },
                { name: 'Frontend', url: 'http://localhost:3000' }
            ];
            
            const results = {};
            
            for (const service of services) {
                try {
                    const startTime = Date.now();
                    await axios.get(service.url, { timeout: 5000 });
                    const responseTime = Date.now() - startTime;
                    
                    results[service.name] = {
                        status: 'healthy',
                        responseTime: responseTime
                    };
                } catch (error) {
                    results[service.name] = {
                        status: 'unhealthy',
                        error: error.message
                    };
                }
            }
            
            console.log('\n📊 Quick Check Results:');
            Object.entries(results).forEach(([service, data]) => {
                if (data.status === 'healthy') {
                    console.log(`  ✅ ${service}: ${data.responseTime}ms`);
                } else {
                    console.log(`  ❌ ${service}: ${data.error}`);
                }
            });
            
            return results;
            
        } catch (error) {
            console.error('Quick check failed:', error.message);
            throw error;
        }
    }
}

// CLI interface
if (require.main === module) {
    const benchmarks = new PerformanceBenchmarks();
    const args = process.argv.slice(2);
    
    if (args.includes('--full') || args.includes('-f')) {
        benchmarks.runBenchmarks().catch(console.error);
    } else if (args.includes('--quick') || args.includes('-q')) {
        benchmarks.quickCheck().catch(console.error);
    } else {
        console.log('Performance Benchmarks');
        console.log('Usage:');
        console.log('  --full, -f      Run complete benchmark suite');
        console.log('  --quick, -q     Run quick performance check');
        console.log('');
        console.log('The full benchmark suite includes:');
        console.log('  - Environment startup time');
        console.log('  - API response times');
        console.log('  - Frontend load times');
        console.log('  - Resource efficiency');
    }
}

module.exports = PerformanceBenchmarks;