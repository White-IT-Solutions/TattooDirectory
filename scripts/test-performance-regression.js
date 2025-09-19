#!/usr/bin/env node

/**
 * Performance Regression Test Suite
 * 
 * Comprehensive test suite for validating frontend-sync-processor performance
 * against baseline metrics, including memory usage, startup time, concurrent
 * operations, and enhanced feature performance testing.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Import performance testing modules
const { PerformanceTestRunner } = require('./performance/frontend-sync-performance-tests');
const { PerformanceTestOrchestrator } = require('./run-performance-tests');
const { FrontendSyncPerformanceMonitor } = require('./performance/performance-monitor');

// Import the enhanced frontend-sync-processor
const FrontendSyncProcessor = require('./frontend-sync-processor');
const { DATA_CONFIG } = require('./data-config');

/**
 * Performance regression test configuration
 */
const REGRESSION_CONFIG = {
  // Test scenarios for regression testing
  scenarios: [
    { name: 'baseline', artistCount: 10, description: 'Baseline performance test' },
    { name: 'small-load', artistCount: 25, description: 'Small load test' },
    { name: 'medium-load', artistCount: 50, description: 'Medium load test' },
    { name: 'large-load', artistCount: 100, description: 'Large load test' },
    { name: 'stress-test', artistCount: 500, description: 'Stress test' },
    { name: 'extreme-load', artistCount: 1000, description: 'Extreme load test' }
  ],
  
  // Performance thresholds (regression limits)
  regressionThresholds: {
    memoryIncrease: 0.20,      // 20% memory increase threshold
    timeIncrease: 0.25,        // 25% time increase threshold
    startupTimeMax: 3000,      // 3 second max startup time
    errorRateMax: 0.05,        // 5% max error rate
    concurrentOverheadMax: 1000 // 1 second max concurrent overhead
  },
  
  // Test iterations for statistical significance
  iterations: 5,
  
  // Warm-up iterations (not counted in results)
  warmupIterations: 2
};

/**
 * Performance regression test runner
 */
class PerformanceRegressionTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: 'performance-regression',
      baseline: null,
      current: {},
      regressions: [],
      improvements: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        regressions: 0,
        improvements: 0
      }
    };
    
    this.loadBaseline();
  }
  
  /**
   * Load baseline performance data
   */
  loadBaseline() {
    try {
      const baselinePath = path.join(__dirname, 'test-results', 'performance-baseline.json');
      if (fs.existsSync(baselinePath)) {
        this.results.baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        console.log('📊 Loaded performance baseline for regression testing');
      } else {
        console.warn('⚠️  No baseline found - will establish new baseline');
      }
    } catch (error) {
      console.warn('⚠️  Could not load baseline:', error.message);
    }
  }
  
  /**
   * Run comprehensive performance regression tests
   */
  async runRegressionTests() {
    console.log('🔍 Starting Performance Regression Tests');
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Test 1: Startup time regression
      await this.testStartupTimeRegression();
      
      // Test 2: Memory usage regression
      await this.testMemoryUsageRegression();
      
      // Test 3: Operation time regression
      await this.testOperationTimeRegression();
      
      // Test 4: Concurrent operation regression
      await this.testConcurrentOperationRegression();
      
      // Test 5: Enhanced feature regression
      await this.testEnhancedFeatureRegression();
      
      // Generate regression analysis
      const analysis = this.analyzeRegressions();
      
      // Save results
      await this.saveRegressionResults();
      
      const totalTime = Date.now() - startTime;
      console.log(`\n✅ Regression testing completed in ${(totalTime / 1000).toFixed(2)}s`);
      
      return {
        success: this.results.summary.regressions === 0,
        results: this.results,
        analysis
      };
      
    } catch (error) {
      console.error('❌ Regression testing failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: this.results
      };
    }
  }
  
  /**
   * Test startup time regression
   */
  async testStartupTimeRegression() {
    console.log('\n🚀 Testing startup time regression...');
    
    const startupTimes = [];
    
    // Warm-up iterations
    for (let i = 0; i < REGRESSION_CONFIG.warmupIterations; i++) {
      const processor = new FrontendSyncProcessor(DATA_CONFIG);
      await processor.loadTestData();
    }
    
    // Actual test iterations
    for (let i = 0; i < REGRESSION_CONFIG.iterations; i++) {
      const startTime = performance.now();
      const processor = new FrontendSyncProcessor(DATA_CONFIG);
      await processor.loadTestData();
      const endTime = performance.now();
      
      startupTimes.push(endTime - startTime);
      console.log(`  Iteration ${i + 1}: ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    const avgStartupTime = startupTimes.reduce((a, b) => a + b, 0) / startupTimes.length;
    const maxStartupTime = Math.max(...startupTimes);
    
    const testResult = {
      testName: 'startup-time-regression',
      currentTime: avgStartupTime,
      maxTime: maxStartupTime,
      threshold: REGRESSION_CONFIG.regressionThresholds.startupTimeMax,
      passed: avgStartupTime < REGRESSION_CONFIG.regressionThresholds.startupTimeMax
    };
    
    // Compare with baseline
    if (this.results.baseline && this.results.baseline.results['startup-time']) {
      const baselineTime = this.results.baseline.results['startup-time'].avgTime;
      const regression = this.checkRegression(avgStartupTime, baselineTime, 'time');
      testResult.regression = regression;
      
      if (regression.isRegression) {
        this.results.regressions.push({
          test: 'startup-time',
          type: 'performance-regression',
          message: `Startup time increased by ${regression.percentageChange.toFixed(1)}%`,
          current: avgStartupTime,
          baseline: baselineTime
        });
        this.results.summary.regressions++;
      } else if (regression.isImprovement) {
        this.results.improvements.push({
          test: 'startup-time',
          type: 'performance-improvement',
          message: `Startup time improved by ${Math.abs(regression.percentageChange).toFixed(1)}%`,
          current: avgStartupTime,
          baseline: baselineTime
        });
        this.results.summary.improvements++;
      }
    }
    
    this.results.current['startup-time-regression'] = testResult;
    this.results.summary.totalTests++;
    
    if (testResult.passed) {
      this.results.summary.passed++;
      console.log(`  ✅ PASS: Average startup time ${avgStartupTime.toFixed(2)}ms`);
    } else {
      this.results.summary.failed++;
      console.log(`  ❌ FAIL: Average startup time ${avgStartupTime.toFixed(2)}ms exceeds threshold`);
    }
  }
  
  /**
   * Test memory usage regression
   */
  async testMemoryUsageRegression() {
    console.log('\n🧠 Testing memory usage regression...');
    
    const memoryResults = {};
    
    for (const scenario of REGRESSION_CONFIG.scenarios) {
      console.log(`\n  Testing ${scenario.name} (${scenario.artistCount} artists)...`);
      
      const memoryUsages = [];
      
      // Warm-up
      for (let i = 0; i < REGRESSION_CONFIG.warmupIterations; i++) {
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        await processor.generateMockData({ artistCount: scenario.artistCount });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Test iterations
      for (let i = 0; i < REGRESSION_CONFIG.iterations; i++) {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        await processor.generateMockData({
          artistCount: scenario.artistCount,
          includeBusinessData: true,
          includePerformanceData: scenario.artistCount >= 100
        });
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsed = finalMemory - initialMemory;
        
        memoryUsages.push(memoryUsed);
        console.log(`    Iteration ${i + 1}: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const avgMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
      const maxMemoryUsage = Math.max(...memoryUsages);
      
      memoryResults[scenario.name] = {
        scenario: scenario.name,
        artistCount: scenario.artistCount,
        avgMemoryUsage,
        maxMemoryUsage,
        passed: maxMemoryUsage < 512 * 1024 * 1024 // 512MB threshold
      };
      
      console.log(`    Average: ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
      console.log(`    Status: ${memoryResults[scenario.name].passed ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    this.results.current['memory-usage-regression'] = memoryResults;
    this.results.summary.totalTests += Object.keys(memoryResults).length;
    
    Object.values(memoryResults).forEach(result => {
      if (result.passed) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
    });
  }
  
  /**
   * Test operation time regression
   */
  async testOperationTimeRegression() {
    console.log('\n⚡ Testing operation time regression...');
    
    const operationResults = {};
    
    for (const scenario of REGRESSION_CONFIG.scenarios) {
      console.log(`\n  Testing ${scenario.name} (${scenario.artistCount} artists)...`);
      
      const operationTimes = [];
      
      // Warm-up
      for (let i = 0; i < REGRESSION_CONFIG.warmupIterations; i++) {
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        await processor.generateMockData({ artistCount: scenario.artistCount });
      }
      
      // Test iterations
      for (let i = 0; i < REGRESSION_CONFIG.iterations; i++) {
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        const startTime = performance.now();
        
        await processor.generateMockData({
          artistCount: scenario.artistCount,
          includeBusinessData: true,
          includePerformanceData: scenario.artistCount >= 100,
          validateData: true
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        operationTimes.push(duration);
        console.log(`    Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
      }
      
      const avgOperationTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
      const maxOperationTime = Math.max(...operationTimes);
      
      // Dynamic threshold based on artist count
      const threshold = Math.min(30000, scenario.artistCount * 30); // 30ms per artist, max 30s
      
      operationResults[scenario.name] = {
        scenario: scenario.name,
        artistCount: scenario.artistCount,
        avgOperationTime,
        maxOperationTime,
        threshold,
        passed: avgOperationTime < threshold
      };
      
      // Check for regression against baseline
      if (this.results.baseline && this.results.baseline.results['performance-regression']) {
        const baselineScenario = this.results.baseline.results['performance-regression'][scenario.name];
        if (baselineScenario) {
          const regression = this.checkRegression(avgOperationTime, baselineScenario.avgTime, 'time');
          operationResults[scenario.name].regression = regression;
          
          if (regression.isRegression) {
            this.results.regressions.push({
              test: `operation-time-${scenario.name}`,
              type: 'performance-regression',
              message: `${scenario.name} operation time increased by ${regression.percentageChange.toFixed(1)}%`,
              current: avgOperationTime,
              baseline: baselineScenario.avgTime
            });
            this.results.summary.regressions++;
          }
        }
      }
      
      console.log(`    Average: ${avgOperationTime.toFixed(2)}ms`);
      console.log(`    Status: ${operationResults[scenario.name].passed ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    this.results.current['operation-time-regression'] = operationResults;
    this.results.summary.totalTests += Object.keys(operationResults).length;
    
    Object.values(operationResults).forEach(result => {
      if (result.passed) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
    });
  }
  
  /**
   * Test concurrent operation regression
   */
  async testConcurrentOperationRegression() {
    console.log('\n🔄 Testing concurrent operation regression...');
    
    const concurrentResults = {};
    const testScenario = { artistCount: 50, name: 'concurrent-test' };
    
    // Test different concurrent loads
    const concurrentLoads = [1, 2, 4, 8];
    
    for (const concurrentCount of concurrentLoads) {
      console.log(`\n  Testing ${concurrentCount} concurrent operations...`);
      
      const concurrentTimes = [];
      
      for (let i = 0; i < 3; i++) { // Fewer iterations for concurrent tests
        const promises = [];
        const startTime = performance.now();
        
        // Start concurrent operations
        for (let j = 0; j < concurrentCount; j++) {
          const processor = new FrontendSyncProcessor(DATA_CONFIG);
          promises.push(processor.generateMockData({
            artistCount: testScenario.artistCount,
            includeBusinessData: true
          }));
        }
        
        // Wait for all to complete
        await Promise.all(promises);
        const endTime = performance.now();
        
        const totalTime = endTime - startTime;
        const avgTimePerOperation = totalTime / concurrentCount;
        
        concurrentTimes.push(avgTimePerOperation);
        console.log(`    Iteration ${i + 1}: ${avgTimePerOperation.toFixed(2)}ms per operation`);
      }
      
      const avgConcurrentTime = concurrentTimes.reduce((a, b) => a + b, 0) / concurrentTimes.length;
      
      concurrentResults[`concurrent-${concurrentCount}`] = {
        concurrentCount,
        avgTimePerOperation: avgConcurrentTime,
        passed: avgConcurrentTime < 10000 // 10 second threshold per operation
      };
      
      console.log(`    Average per operation: ${avgConcurrentTime.toFixed(2)}ms`);
    }
    
    this.results.current['concurrent-operation-regression'] = concurrentResults;
    this.results.summary.totalTests += Object.keys(concurrentResults).length;
    
    Object.values(concurrentResults).forEach(result => {
      if (result.passed) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
    });
  }
  
  /**
   * Test enhanced feature regression
   */
  async testEnhancedFeatureRegression() {
    console.log('\n🎯 Testing enhanced feature regression...');
    
    const featureResults = {};
    
    const features = [
      {
        name: 'business-data',
        options: { artistCount: 20, includeBusinessData: true }
      },
      {
        name: 'performance-data',
        options: { artistCount: 20, includePerformanceData: true }
      },
      {
        name: 'data-validation',
        options: { artistCount: 20, validateData: true }
      },
      {
        name: 'scenario-processing',
        options: { artistCount: 20, scenario: 'style-diverse' }
      }
    ];
    
    for (const feature of features) {
      console.log(`\n  Testing ${feature.name} feature...`);
      
      const featureTimes = [];
      
      for (let i = 0; i < REGRESSION_CONFIG.iterations; i++) {
        const processor = new FrontendSyncProcessor(DATA_CONFIG);
        const startTime = performance.now();
        
        try {
          await processor.generateMockData(feature.options);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          featureTimes.push(duration);
          console.log(`    Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
          
        } catch (error) {
          console.error(`    ❌ Iteration ${i + 1} failed: ${error.message}`);
          featureTimes.push(null);
        }
      }
      
      const validTimes = featureTimes.filter(t => t !== null);
      if (validTimes.length > 0) {
        const avgTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        
        featureResults[feature.name] = {
          feature: feature.name,
          avgTime,
          successRate: validTimes.length / featureTimes.length,
          passed: avgTime < 5000 && validTimes.length / featureTimes.length >= 0.8
        };
        
        console.log(`    Average: ${avgTime.toFixed(2)}ms`);
        console.log(`    Success rate: ${(validTimes.length / featureTimes.length * 100).toFixed(1)}%`);
      } else {
        featureResults[feature.name] = {
          feature: feature.name,
          error: 'All iterations failed',
          passed: false
        };
      }
    }
    
    this.results.current['enhanced-feature-regression'] = featureResults;
    this.results.summary.totalTests += Object.keys(featureResults).length;
    
    Object.values(featureResults).forEach(result => {
      if (result.passed) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
    });
  }
  
  /**
   * Check for performance regression
   */
  checkRegression(currentValue, baselineValue, type) {
    if (!baselineValue || baselineValue === 0) {
      return { isRegression: false, isImprovement: false, percentageChange: 0 };
    }
    
    const percentageChange = ((currentValue - baselineValue) / baselineValue) * 100;
    const threshold = type === 'memory' ? 
      REGRESSION_CONFIG.regressionThresholds.memoryIncrease * 100 :
      REGRESSION_CONFIG.regressionThresholds.timeIncrease * 100;
    
    return {
      percentageChange,
      isRegression: percentageChange > threshold,
      isImprovement: percentageChange < -10, // 10% improvement threshold
      currentValue,
      baselineValue,
      threshold
    };
  }
  
  /**
   * Analyze regressions and generate report
   */
  analyzeRegressions() {
    const analysis = {
      summary: {
        totalRegressions: this.results.regressions.length,
        totalImprovements: this.results.improvements.length,
        overallStatus: this.results.regressions.length === 0 ? 'PASS' : 'FAIL'
      },
      regressions: this.results.regressions,
      improvements: this.results.improvements,
      recommendations: []
    };
    
    // Generate recommendations based on regressions
    if (this.results.regressions.length > 0) {
      analysis.recommendations.push('Performance regressions detected - investigate recent changes');
      
      const memoryRegressions = this.results.regressions.filter(r => r.test.includes('memory'));
      if (memoryRegressions.length > 0) {
        analysis.recommendations.push('Memory usage regressions detected - check for memory leaks');
      }
      
      const timeRegressions = this.results.regressions.filter(r => r.test.includes('time'));
      if (timeRegressions.length > 0) {
        analysis.recommendations.push('Performance time regressions detected - optimize algorithms');
      }
    } else {
      analysis.recommendations.push('No performance regressions detected - system is stable');
    }
    
    if (this.results.improvements.length > 0) {
      analysis.recommendations.push(`${this.results.improvements.length} performance improvements detected`);
    }
    
    return analysis;
  }
  
  /**
   * Save regression test results
   */
  async saveRegressionResults() {
    const resultsDir = path.join(__dirname, 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Save detailed results
    const resultsFile = path.join(resultsDir, `regression-test-${Date.now()}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
    
    // Generate summary report
    const reportFile = path.join(resultsDir, 'regression-test-summary.md');
    const report = this.generateRegressionReport();
    fs.writeFileSync(reportFile, report);
    
    console.log(`📊 Regression test results saved to: ${resultsFile}`);
    console.log(`📄 Regression test report saved to: ${reportFile}`);
  }
  
  /**
   * Generate regression test report
   */
  generateRegressionReport() {
    const analysis = this.analyzeRegressions();
    
    return `# Performance Regression Test Report

## Test Summary

- **Test Date**: ${this.results.timestamp}
- **Total Tests**: ${this.results.summary.totalTests}
- **Passed**: ${this.results.summary.passed}
- **Failed**: ${this.results.summary.failed}
- **Regressions**: ${this.results.summary.regressions}
- **Improvements**: ${this.results.summary.improvements}
- **Overall Status**: ${analysis.summary.overallStatus}

## Regression Analysis

${analysis.summary.totalRegressions > 0 ? `
### ❌ Performance Regressions (${analysis.summary.totalRegressions})

${analysis.regressions.map(reg => `- **${reg.test}**: ${reg.message}`).join('\n')}
` : '### ✅ No Performance Regressions Detected'}

${analysis.summary.totalImprovements > 0 ? `
### ⬆️ Performance Improvements (${analysis.summary.totalImprovements})

${analysis.improvements.map(imp => `- **${imp.test}**: ${imp.message}`).join('\n')}
` : ''}

## Recommendations

${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Results

### Startup Time Regression
${this.results.current['startup-time-regression'] ? 
  `- Average: ${this.results.current['startup-time-regression'].currentTime.toFixed(2)}ms
- Status: ${this.results.current['startup-time-regression'].passed ? '✅ PASS' : '❌ FAIL'}` : 
  'No data available'}

### Memory Usage Regression
${this.results.current['memory-usage-regression'] ? 
  Object.entries(this.results.current['memory-usage-regression']).map(([scenario, result]) => 
    `- **${scenario}**: ${(result.avgMemoryUsage / 1024 / 1024).toFixed(2)}MB avg (${result.passed ? '✅ PASS' : '❌ FAIL'})`
  ).join('\n') : 
  'No data available'}

---
*Report generated on ${new Date().toISOString()}*
`;
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Performance Regression Test Suite

Usage: node test-performance-regression.js [options]

Options:
  --quick             Run quick regression tests (fewer iterations)
  --memory-only       Test only memory regression
  --time-only         Test only operation time regression
  --concurrent-only   Test only concurrent operation regression
  --save-baseline     Save current results as new baseline
  --help, -h          Show this help message

Examples:
  node test-performance-regression.js
  node test-performance-regression.js --quick
  node test-performance-regression.js --memory-only
  node test-performance-regression.js --save-baseline
`);
    return;
  }
  
  // Adjust configuration for quick tests
  if (args.includes('--quick')) {
    REGRESSION_CONFIG.iterations = 3;
    REGRESSION_CONFIG.warmupIterations = 1;
    console.log('🏃 Running quick regression tests...');
  }
  
  const tester = new PerformanceRegressionTester();
  
  try {
    const result = await tester.runRegressionTests();
    
    if (args.includes('--save-baseline') && result.success) {
      // Save current results as new baseline
      const baselinePath = path.join(__dirname, 'test-results', 'performance-baseline.json');
      const baselineData = {
        timestamp: new Date().toISOString(),
        results: result.results.current
      };
      fs.writeFileSync(baselinePath, JSON.stringify(baselineData, null, 2));
      console.log('💾 Saved current results as new performance baseline');
    }
    
    // Print summary
    console.log('\n📊 Regression Test Summary');
    console.log('=' .repeat(30));
    console.log(`Tests: ${result.results.summary.totalTests}`);
    console.log(`Passed: ${result.results.summary.passed}`);
    console.log(`Failed: ${result.results.summary.failed}`);
    console.log(`Regressions: ${result.results.summary.regressions}`);
    console.log(`Improvements: ${result.results.summary.improvements}`);
    console.log(`Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Regression test execution failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  PerformanceRegressionTester,
  REGRESSION_CONFIG
};

// Run if called directly
if (require.main === module) {
  main();
}