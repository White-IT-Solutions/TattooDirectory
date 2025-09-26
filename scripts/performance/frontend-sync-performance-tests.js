#!/usr/bin/env node

/**
 * Frontend Sync Processor Performance Regression Tests
 * 
 * Comprehensive performance testing suite to benchmark the enhanced frontend-sync-processor
 * against baseline performance metrics and validate memory usage, startup time, and
 * concurrent operation performance with other pipeline components.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

// Import the enhanced frontend-sync-processor
const FrontendSyncProcessor = require('../frontend-sync-processor');
const { DATA_CONFIG } = require('../data-config');

const execAsync = promisify(exec);

/**
 * Performance test configuration
 */
const PERFORMANCE_CONFIG = {
  // Test scenarios with different data sizes
  testScenarios: [
    { name: 'small', artistCount: 10, description: 'Small dataset (10 artists)' },
    { name: 'medium', artistCount: 50, description: 'Medium dataset (50 artists)' },
    { name: 'large', artistCount: 100, description: 'Large dataset (100 artists)' },
    { name: 'xlarge', artistCount: 500, description: 'Extra large dataset (500 artists)' },
    { name: 'stress', artistCount: 1000, description: 'Stress test dataset (1000+ artists)' }
  ],
  
  // Performance thresholds (in milliseconds)
  thresholds: {
    startup: 2000,        // Max startup time
    small: 500,           // Max time for small dataset
    medium: 2000,         // Max time for medium dataset
    large: 5000,          // Max time for large dataset
    xlarge: 15000,        // Max time for extra large dataset
    stress: 30000,        // Max time for stress test
    memoryLimit: 512 * 1024 * 1024, // 512MB memory limit
    concurrentDelay: 1000 // Max additional delay for concurrent operations
  },
  
  // Test iterations for averaging
  iterations: 3,
  
  // Concurrent operation tests
  concurrentTests: [
    'unified-data-manager',
    'pipeline-engine',
    'state-manager',
    'health-monitor',
    'image-processor'
  ]
};

/**
 * Performance test results storage
 */
class PerformanceTestResults {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testRun: `performance-test-${Date.now()}`,
      baseline: null,
      current: {},
      comparisons: {},
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
        totalTests: 0
      }
    };
  }
  
  addResult(testName, result) {
    this.results.current[testName] = result;
    this.results.summary.totalTests++;
    
    if (result.passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      this.results.summary.warnings += result.warnings.length;
    }
  }
  
  addComparison(testName, comparison) {
    this.results.comparisons[testName] = comparison;
  }
  
  saveResults() {
    const resultsDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const resultsFile = path.join(resultsDir, `performance-test-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    
    console.log(`📊 Performance test results saved to: ${resultsFile}`);
    return resultsFile;
  }
}

/**
 * Memory usage monitor
 */
class MemoryMonitor {
  constructor() {
    this.samples = [];
    this.monitoring = false;
    this.interval = null;
  }
  
  start(sampleInterval = 100) {
    this.monitoring = true;
    this.samples = [];
    
    this.interval = setInterval(() => {
      if (this.monitoring) {
        const usage = process.memoryUsage();
        this.samples.push({
          timestamp: Date.now(),
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          external: usage.external,
          rss: usage.rss
        });
      }
    }, sampleInterval);
  }
  
  stop() {
    this.monitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    return this.getStats();
  }
  
  getStats() {
    if (this.samples.length === 0) return null;
    
    const heapUsed = this.samples.map(s => s.heapUsed);
    const heapTotal = this.samples.map(s => s.heapTotal);
    const rss = this.samples.map(s => s.rss);
    
    return {
      samples: this.samples.length,
      heapUsed: {
        min: Math.min(...heapUsed),
        max: Math.max(...heapUsed),
        avg: heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length,
        final: heapUsed[heapUsed.length - 1]
      },
      heapTotal: {
        min: Math.min(...heapTotal),
        max: Math.max(...heapTotal),
        avg: heapTotal.reduce((a, b) => a + b, 0) / heapTotal.length,
        final: heapTotal[heapTotal.length - 1]
      },
      rss: {
        min: Math.min(...rss),
        max: Math.max(...rss),
        avg: rss.reduce((a, b) => a + b, 0) / rss.length,
        final: rss[rss.length - 1]
      }
    };
  }
}

/**
 * Performance test runner
 */
class PerformanceTestRunner {
  constructor() {
    this.results = new PerformanceTestResults();
    this.baseline = this.loadBaseline();
  }
  
  /**
   * Load baseline performance metrics
   */
  loadBaseline() {
    try {
      const baselinePath = path.join(__dirname, '../test-results/performance-baseline.json');
      if (fs.existsSync(baselinePath)) {
        const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        console.log('📈 Loaded performance baseline from previous run');
        return baseline;
      }
    } catch (error) {
      console.warn('⚠️  Could not load performance baseline:', error.message);
    }
    return null;
  }
  
  /**
   * Save current results as new baseline
   */
  saveBaseline() {
    const baselinePath = path.join(__dirname, '../test-results/performance-baseline.json');
    const baselineData = {
      timestamp: new Date().toISOString(),
      results: this.results.results.current
    };
    
    fs.writeFileSync(baselinePath, JSON.stringify(baselineData, null, 2));
    console.log('💾 Saved current results as new performance baseline');
  }
  
  /**
   * Test startup time impact of enhanced capabilities
   */
  async testStartupTime() {
    console.log('\n🚀 Testing startup time impact...');
    
    const startupTimes = [];
    
    for (let i = 0; i < PERFORMANCE_CONFIG.iterations; i++) {
      const startTime = performance.now();
      
      // Create new processor instance (simulates startup)
      const processor = new FrontendSyncProcessor(DATA_CONFIG);
      
      // Perform initial operations that happen during startup
      await processor.loadTestData();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      startupTimes.push(duration);
      
      console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
    }
    
    const avgStartupTime = startupTimes.reduce((a, b) => a + b, 0) / startupTimes.length;
    const maxStartupTime = Math.max(...startupTimes);
    const minStartupTime = Math.min(...startupTimes);
    
    const result = {
      testName: 'startup-time',
      avgTime: avgStartupTime,
      maxTime: maxStartupTime,
      minTime: minStartupTime,
      iterations: PERFORMANCE_CONFIG.iterations,
      passed: avgStartupTime < PERFORMANCE_CONFIG.thresholds.startup,
      threshold: PERFORMANCE_CONFIG.thresholds.startup,
      warnings: []
    };
    
    if (avgStartupTime > PERFORMANCE_CONFIG.thresholds.startup * 0.8) {
      result.warnings.push(`Startup time approaching threshold: ${avgStartupTime.toFixed(2)}ms`);
    }
    
    console.log(`  Average startup time: ${avgStartupTime.toFixed(2)}ms`);
    console.log(`  Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
    
    this.results.addResult('startup-time', result);
    
    // Compare with baseline if available
    if (this.baseline && this.baseline.results['startup-time']) {
      const comparison = this.compareWithBaseline('startup-time', result);
      this.results.addComparison('startup-time', comparison);
    }
    
    return result;
  }
  
  /**
   * Test memory usage with large dataset generation
   */
  async testMemoryUsage() {
    console.log('\n🧠 Testing memory usage with large datasets...');
    
    const memoryResults = {};
    
    for (const scenario of PERFORMANCE_CONFIG.testScenarios) {
      console.log(`\n  Testing ${scenario.name} (${scenario.artistCount} artists)...`);
      
      const monitor = new MemoryMonitor();
      monitor.start(50); // Sample every 50ms
      
      const processor = new FrontendSyncProcessor(DATA_CONFIG);
      const startTime = performance.now();
      
      try {
        const result = await processor.generateMockData({
          artistCount: scenario.artistCount,
          includeBusinessData: true,
          includePerformanceData: true,
          validateData: true
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const memoryStats = monitor.stop();
        
        const testResult = {
          scenario: scenario.name,
          artistCount: scenario.artistCount,
          duration: duration,
          success: result.success,
          memoryStats: memoryStats,
          passed: memoryStats.heapUsed.max < PERFORMANCE_CONFIG.thresholds.memoryLimit,
          warnings: []
        };
        
        // Check for memory warnings
        if (memoryStats.heapUsed.max > PERFORMANCE_CONFIG.thresholds.memoryLimit * 0.8) {
          testResult.warnings.push(`High memory usage: ${(memoryStats.heapUsed.max / 1024 / 1024).toFixed(2)}MB`);
        }
        
        console.log(`    Duration: ${duration.toFixed(2)}ms`);
        console.log(`    Peak memory: ${(memoryStats.heapUsed.max / 1024 / 1024).toFixed(2)}MB`);
        console.log(`    Status: ${testResult.passed ? '✅ PASS' : '❌ FAIL'}`);
        
        memoryResults[scenario.name] = testResult;
        
      } catch (error) {
        monitor.stop();
        console.error(`    ❌ Error: ${error.message}`);
        
        memoryResults[scenario.name] = {
          scenario: scenario.name,
          artistCount: scenario.artistCount,
          error: error.message,
          passed: false,
          warnings: [`Test failed: ${error.message}`]
        };
      }
    }
    
    this.results.addResult('memory-usage', memoryResults);
    return memoryResults;
  }
  
  /**
   * Benchmark enhanced frontend-sync-processor performance vs baseline
   */
  async testPerformanceRegression() {
    console.log('\n⚡ Running performance regression tests...');
    
    const regressionResults = {};
    
    for (const scenario of PERFORMANCE_CONFIG.testScenarios) {
      console.log(`\n  Benchmarking ${scenario.name} (${scenario.artistCount} artists)...`);
      
      const times = [];
      
      for (let i = 0; i < PERFORMANCE_CONFIG.iterations; i++) {
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        const startTime = performance.now();
        
        try {
          const result = await processor.generateMockData({
            artistCount: scenario.artistCount,
            includeBusinessData: true,
            includePerformanceData: scenario.artistCount >= 500,
            validateData: true
          });
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          times.push(duration);
          
          console.log(`    Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
          
        } catch (error) {
          console.error(`    ❌ Iteration ${i + 1} failed: ${error.message}`);
          times.push(null);
        }
      }
      
      const validTimes = times.filter(t => t !== null);
      if (validTimes.length === 0) {
        regressionResults[scenario.name] = {
          scenario: scenario.name,
          error: 'All iterations failed',
          passed: false
        };
        continue;
      }
      
      const avgTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const maxTime = Math.max(...validTimes);
      const minTime = Math.min(...validTimes);
      const threshold = PERFORMANCE_CONFIG.thresholds[scenario.name] || PERFORMANCE_CONFIG.thresholds.large;
      
      const testResult = {
        scenario: scenario.name,
        artistCount: scenario.artistCount,
        avgTime: avgTime,
        maxTime: maxTime,
        minTime: minTime,
        iterations: validTimes.length,
        passed: avgTime < threshold,
        threshold: threshold,
        warnings: []
      };
      
      if (avgTime > threshold * 0.8) {
        testResult.warnings.push(`Performance approaching threshold: ${avgTime.toFixed(2)}ms`);
      }
      
      console.log(`    Average time: ${avgTime.toFixed(2)}ms`);
      console.log(`    Status: ${testResult.passed ? '✅ PASS' : '❌ FAIL'}`);
      
      regressionResults[scenario.name] = testResult;
    }
    
    this.results.addResult('performance-regression', regressionResults);
    return regressionResults;
  }
  
  /**
   * Test concurrent operation performance with other pipeline components
   */
  async testConcurrentOperations() {
    console.log('\n🔄 Testing concurrent operation performance...');
    
    const concurrentResults = {};
    
    // Test concurrent operations with different pipeline components
    for (const component of PERFORMANCE_CONFIG.concurrentTests) {
      console.log(`\n  Testing concurrent operation with ${component}...`);
      
      try {
        // Start the concurrent component (simulated)
        const concurrentProcess = this.startConcurrentProcess(component);
        
        // Run frontend-sync-processor while concurrent process is running
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        const startTime = performance.now();
        
        const result = await processor.generateMockData({
          artistCount: 50, // Medium dataset for concurrent testing
          includeBusinessData: true,
          validateData: true
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Stop concurrent process
        await this.stopConcurrentProcess(concurrentProcess);
        
        // Compare with baseline (non-concurrent) performance
        const baselineTime = 2000; // Expected baseline for 50 artists
        const overhead = duration - baselineTime;
        const passed = overhead < PERFORMANCE_CONFIG.thresholds.concurrentDelay;
        
        const testResult = {
          component: component,
          duration: duration,
          baselineTime: baselineTime,
          overhead: overhead,
          passed: passed,
          success: result.success,
          warnings: []
        };
        
        if (overhead > PERFORMANCE_CONFIG.thresholds.concurrentDelay * 0.8) {
          testResult.warnings.push(`High concurrent overhead: ${overhead.toFixed(2)}ms`);
        }
        
        console.log(`    Duration: ${duration.toFixed(2)}ms`);
        console.log(`    Overhead: ${overhead.toFixed(2)}ms`);
        console.log(`    Status: ${testResult.passed ? '✅ PASS' : '❌ FAIL'}`);
        
        concurrentResults[component] = testResult;
        
      } catch (error) {
        console.error(`    ❌ Error testing ${component}: ${error.message}`);
        
        concurrentResults[component] = {
          component: component,
          error: error.message,
          passed: false,
          warnings: [`Concurrent test failed: ${error.message}`]
        };
      }
    }
    
    this.results.addResult('concurrent-operations', concurrentResults);
    return concurrentResults;
  }
  
  /**
   * Start a concurrent process (simulated)
   */
  startConcurrentProcess(component) {
    // Simulate concurrent process by running a CPU-intensive task
    return setInterval(() => {
      // Simulate work
      const start = Date.now();
      while (Date.now() - start < 10) {
        Math.random() * Math.random();
      }
    }, 50);
  }
  
  /**
   * Stop concurrent process
   */
  async stopConcurrentProcess(process) {
    if (process) {
      clearInterval(process);
    }
  }
  
  /**
   * Create performance monitoring for enhanced data generation features
   */
  async testEnhancedFeaturePerformance() {
    console.log('\n🎯 Testing enhanced feature performance...');
    
    const featureResults = {};
    
    // Test individual enhanced features
    const features = [
      {
        name: 'business-data-generation',
        options: { artistCount: 20, includeBusinessData: true, includePerformanceData: false }
      },
      {
        name: 'performance-data-generation',
        options: { artistCount: 20, includeBusinessData: false, includePerformanceData: true }
      },
      {
        name: 'data-validation',
        options: { artistCount: 20, includeBusinessData: true, validateData: true }
      },
      {
        name: 'data-export',
        options: { artistCount: 20, includeBusinessData: true, exportToFile: true }
      },
      {
        name: 'scenario-processing',
        options: { artistCount: 20, scenario: 'style-diverse' }
      }
    ];
    
    for (const feature of features) {
      console.log(`\n  Testing ${feature.name}...`);
      
      const times = [];
      
      for (let i = 0; i < 3; i++) {
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        const startTime = performance.now();
        
        try {
          const result = await processor.generateMockData(feature.options);
          const endTime = performance.now();
          const duration = endTime - startTime;
          times.push(duration);
          
          console.log(`    Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
          
        } catch (error) {
          console.error(`    ❌ Iteration ${i + 1} failed: ${error.message}`);
          times.push(null);
        }
      }
      
      const validTimes = times.filter(t => t !== null);
      if (validTimes.length > 0) {
        const avgTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const passed = avgTime < 5000; // 5 second threshold for enhanced features
        
        featureResults[feature.name] = {
          feature: feature.name,
          avgTime: avgTime,
          iterations: validTimes.length,
          passed: passed,
          warnings: avgTime > 4000 ? [`Slow feature performance: ${avgTime.toFixed(2)}ms`] : []
        };
        
        console.log(`    Average time: ${avgTime.toFixed(2)}ms`);
        console.log(`    Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      } else {
        featureResults[feature.name] = {
          feature: feature.name,
          error: 'All iterations failed',
          passed: false
        };
      }
    }
    
    this.results.addResult('enhanced-features', featureResults);
    return featureResults;
  }
  
  /**
   * Compare current results with baseline
   */
  compareWithBaseline(testName, currentResult) {
    if (!this.baseline || !this.baseline.results[testName]) {
      return { status: 'no-baseline', message: 'No baseline available for comparison' };
    }
    
    const baselineResult = this.baseline.results[testName];
    const currentTime = currentResult.avgTime || currentResult.duration;
    const baselineTime = baselineResult.avgTime || baselineResult.duration;
    
    if (!currentTime || !baselineTime) {
      return { status: 'invalid-data', message: 'Invalid data for comparison' };
    }
    
    const percentChange = ((currentTime - baselineTime) / baselineTime) * 100;
    
    let status = 'similar';
    let message = `Performance change: ${percentChange.toFixed(2)}%`;
    
    if (percentChange > 20) {
      status = 'regression';
      message = `Performance regression: ${percentChange.toFixed(2)}% slower`;
    } else if (percentChange < -20) {
      status = 'improvement';
      message = `Performance improvement: ${Math.abs(percentChange).toFixed(2)}% faster`;
    }
    
    return {
      status: status,
      message: message,
      percentChange: percentChange,
      currentTime: currentTime,
      baselineTime: baselineTime
    };
  }
  
  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log('🏁 Starting Frontend Sync Processor Performance Tests');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
      // Run all test suites
      await this.testStartupTime();
      await this.testMemoryUsage();
      await this.testPerformanceRegression();
      await this.testConcurrentOperations();
      await this.testEnhancedFeaturePerformance();
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      // Generate summary report
      this.generateSummaryReport(totalDuration);
      
      // Save results
      const resultsFile = this.results.saveResults();
      
      // Ask if user wants to save as new baseline
      if (this.results.results.summary.failed === 0) {
        console.log('\n💾 All tests passed! Save as new performance baseline? (y/n)');
        // In a real scenario, you might want to prompt for user input
        // For automated testing, we'll save if all tests pass
        this.saveBaseline();
      }
      
      return {
        success: this.results.results.summary.failed === 0,
        results: this.results.results,
        resultsFile: resultsFile
      };
      
    } catch (error) {
      console.error('❌ Performance test suite failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: this.results.results
      };
    }
  }
  
  /**
   * Generate summary report
   */
  generateSummaryReport(totalDuration) {
    console.log('\n📊 Performance Test Summary');
    console.log('=' .repeat(40));
    console.log(`Total test duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Tests passed: ${this.results.results.summary.passed}`);
    console.log(`Tests failed: ${this.results.results.summary.failed}`);
    console.log(`Warnings: ${this.results.results.summary.warnings}`);
    console.log(`Total tests: ${this.results.results.summary.totalTests}`);
    
    const successRate = (this.results.results.summary.passed / this.results.results.summary.totalTests) * 100;
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    
    if (this.results.results.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(this.results.results.current).forEach(([testName, result]) => {
        if (result.passed === false) {
          console.log(`  - ${testName}: ${result.error || 'Performance threshold exceeded'}`);
        }
      });
    }
    
    if (this.results.results.summary.warnings > 0) {
      console.log('\n⚠️  Warnings:');
      Object.entries(this.results.results.current).forEach(([testName, result]) => {
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            console.log(`  - ${testName}: ${warning}`);
          });
        }
      });
    }
    
    console.log('\n' + '=' .repeat(40));
  }
}

/**
 * CLI interface for running performance tests
 */
async function main() {
  const args = process.argv.slice(2);
  const testRunner = new PerformanceTestRunner();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Frontend Sync Processor Performance Tests

Usage: node frontend-sync-performance-tests.js [options]

Options:
  --startup-only      Run only startup time tests
  --memory-only       Run only memory usage tests
  --regression-only   Run only performance regression tests
  --concurrent-only   Run only concurrent operation tests
  --features-only     Run only enhanced feature tests
  --save-baseline     Save results as new baseline
  --help, -h          Show this help message

Examples:
  node frontend-sync-performance-tests.js
  node frontend-sync-performance-tests.js --memory-only
  node frontend-sync-performance-tests.js --save-baseline
`);
    return;
  }
  
  try {
    if (args.includes('--startup-only')) {
      await testRunner.testStartupTime();
    } else if (args.includes('--memory-only')) {
      await testRunner.testMemoryUsage();
    } else if (args.includes('--regression-only')) {
      await testRunner.testPerformanceRegression();
    } else if (args.includes('--concurrent-only')) {
      await testRunner.testConcurrentOperations();
    } else if (args.includes('--features-only')) {
      await testRunner.testEnhancedFeaturePerformance();
    } else {
      // Run all tests
      const result = await testRunner.runAllTests();
      
      if (args.includes('--save-baseline')) {
        testRunner.saveBaseline();
      }
      
      process.exit(result.success ? 0 : 1);
    }
    
  } catch (error) {
    console.error('❌ Performance test execution failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  PerformanceTestRunner,
  PerformanceTestResults,
  MemoryMonitor,
  PERFORMANCE_CONFIG
};

// Run if called directly
if (require.main === module) {
  main();
}