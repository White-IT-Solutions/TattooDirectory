#!/usr/bin/env node

/**
 * Performance Test Runner for Frontend Sync Processor
 * 
 * Orchestrates comprehensive performance testing including baseline comparison,
 * memory profiling, concurrent operation testing, and regression analysis.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { PerformanceTestRunner } = require('./performance/frontend-sync-performance-tests');

/**
 * Performance test orchestrator
 */
class PerformanceTestOrchestrator {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      testSuite: 'frontend-sync-processor-performance',
      results: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0
      }
    };
  }
  
  /**
   * Run comprehensive performance test suite
   */
  async runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Performance Test Suite');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
      // Initialize test runner
      const testRunner = new PerformanceTestRunner();
      
      // Run all performance tests
      console.log('\n📊 Running performance regression tests...');
      const result = await testRunner.runAllTests();
      
      this.testResults.results = result.results;
      this.testResults.summary = {
        ...this.testResults.summary,
        ...result.results.summary,
        duration: Date.now() - startTime
      };
      
      // Generate comprehensive report
      await this.generateComprehensiveReport();
      
      // Save results
      await this.saveTestResults();
      
      console.log('\n✅ Performance test suite completed successfully');
      return {
        success: result.success,
        results: this.testResults
      };
      
    } catch (error) {
      console.error('❌ Performance test suite failed:', error.message);
      this.testResults.error = error.message;
      
      return {
        success: false,
        error: error.message,
        results: this.testResults
      };
    }
  }
  
  /**
   * Run memory profiling tests
   */
  async runMemoryProfilingTests() {
    console.log('🧠 Running Memory Profiling Tests');
    console.log('=' .repeat(40));
    
    const testRunner = new PerformanceTestRunner();
    
    try {
      const memoryResults = await testRunner.testMemoryUsage();
      
      // Generate memory profile report
      await this.generateMemoryProfileReport(memoryResults);
      
      return {
        success: true,
        results: memoryResults
      };
      
    } catch (error) {
      console.error('❌ Memory profiling failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Run concurrent operation tests
   */
  async runConcurrentOperationTests() {
    console.log('🔄 Running Concurrent Operation Tests');
    console.log('=' .repeat(40));
    
    const testRunner = new PerformanceTestRunner();
    
    try {
      const concurrentResults = await testRunner.testConcurrentOperations();
      
      // Generate concurrent operation report
      await this.generateConcurrentOperationReport(concurrentResults);
      
      return {
        success: true,
        results: concurrentResults
      };
      
    } catch (error) {
      console.error('❌ Concurrent operation tests failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate comprehensive performance report
   */
  async generateComprehensiveReport() {
    const reportPath = path.join(__dirname, 'test-results', 'performance-comprehensive-report.md');
    
    const report = `# Frontend Sync Processor Performance Test Report

## Test Summary

- **Test Date**: ${this.testResults.timestamp}
- **Total Tests**: ${this.testResults.summary.totalTests}
- **Passed**: ${this.testResults.summary.passed}
- **Failed**: ${this.testResults.summary.failed}
- **Warnings**: ${this.testResults.summary.warnings}
- **Duration**: ${(this.testResults.summary.duration / 1000).toFixed(2)}s
- **Success Rate**: ${((this.testResults.summary.passed / this.testResults.summary.totalTests) * 100).toFixed(1)}%

## Test Results

### Startup Time Performance
${this.generateStartupTimeSection()}

### Memory Usage Analysis
${this.generateMemoryUsageSection()}

### Performance Regression Analysis
${this.generateRegressionSection()}

### Concurrent Operation Performance
${this.generateConcurrentSection()}

### Enhanced Feature Performance
${this.generateEnhancedFeatureSection()}

## Recommendations

${this.generateRecommendations()}

## Baseline Comparison

${this.generateBaselineComparison()}

---
*Report generated on ${new Date().toISOString()}*
`;
    
    // Ensure test-results directory exists
    const resultsDir = path.dirname(reportPath);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Comprehensive report saved to: ${reportPath}`);
  }
  
  /**
   * Generate startup time section
   */
  generateStartupTimeSection() {
    const startupResult = this.testResults.results.current['startup-time'];
    if (!startupResult) return 'No startup time data available.';
    
    return `
**Average Startup Time**: ${startupResult.avgTime.toFixed(2)}ms
**Maximum Startup Time**: ${startupResult.maxTime.toFixed(2)}ms
**Minimum Startup Time**: ${startupResult.minTime.toFixed(2)}ms
**Threshold**: ${startupResult.threshold}ms
**Status**: ${startupResult.passed ? '✅ PASS' : '❌ FAIL'}

${startupResult.warnings.length > 0 ? `**Warnings**: ${startupResult.warnings.join(', ')}` : ''}
`;
  }
  
  /**
   * Generate memory usage section
   */
  generateMemoryUsageSection() {
    const memoryResult = this.testResults.results.current['memory-usage'];
    if (!memoryResult) return 'No memory usage data available.';
    
    let section = '| Scenario | Artist Count | Duration | Peak Memory | Status |\n';
    section += '|----------|--------------|----------|-------------|--------|\n';
    
    Object.values(memoryResult).forEach(result => {
      if (result.memoryStats) {
        const peakMemoryMB = (result.memoryStats.heapUsed.max / 1024 / 1024).toFixed(2);
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        section += `| ${result.scenario} | ${result.artistCount} | ${result.duration.toFixed(2)}ms | ${peakMemoryMB}MB | ${status} |\n`;
      }
    });
    
    return section;
  }
  
  /**
   * Generate regression section
   */
  generateRegressionSection() {
    const regressionResult = this.testResults.results.current['performance-regression'];
    if (!regressionResult) return 'No performance regression data available.';
    
    let section = '| Scenario | Artist Count | Avg Time | Threshold | Status |\n';
    section += '|----------|--------------|----------|-----------|--------|\n';
    
    Object.values(regressionResult).forEach(result => {
      if (result.avgTime) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        section += `| ${result.scenario} | ${result.artistCount} | ${result.avgTime.toFixed(2)}ms | ${result.threshold}ms | ${status} |\n`;
      }
    });
    
    return section;
  }
  
  /**
   * Generate concurrent section
   */
  generateConcurrentSection() {
    const concurrentResult = this.testResults.results.current['concurrent-operations'];
    if (!concurrentResult) return 'No concurrent operation data available.';
    
    let section = '| Component | Duration | Overhead | Status |\n';
    section += '|-----------|----------|----------|--------|\n';
    
    Object.values(concurrentResult).forEach(result => {
      if (result.duration) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        section += `| ${result.component} | ${result.duration.toFixed(2)}ms | ${result.overhead.toFixed(2)}ms | ${status} |\n`;
      }
    });
    
    return section;
  }
  
  /**
   * Generate enhanced feature section
   */
  generateEnhancedFeatureSection() {
    const featureResult = this.testResults.results.current['enhanced-features'];
    if (!featureResult) return 'No enhanced feature data available.';
    
    let section = '| Feature | Avg Time | Status |\n';
    section += '|---------|----------|--------|\n';
    
    Object.values(featureResult).forEach(result => {
      if (result.avgTime) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        section += `| ${result.feature} | ${result.avgTime.toFixed(2)}ms | ${status} |\n`;
      }
    });
    
    return section;
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze results and generate recommendations
    const memoryResult = this.testResults.results.current['memory-usage'];
    if (memoryResult) {
      Object.values(memoryResult).forEach(result => {
        if (result.memoryStats && result.memoryStats.heapUsed.max > 256 * 1024 * 1024) {
          recommendations.push('Consider optimizing memory usage for large datasets (>256MB peak usage detected)');
        }
      });
    }
    
    const regressionResult = this.testResults.results.current['performance-regression'];
    if (regressionResult) {
      Object.values(regressionResult).forEach(result => {
        if (result.warnings && result.warnings.length > 0) {
          recommendations.push(`Performance optimization needed for ${result.scenario} scenario`);
        }
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All performance metrics are within acceptable ranges. No immediate optimizations required.');
    }
    
    return recommendations.map(rec => `- ${rec}`).join('\n');
  }
  
  /**
   * Generate baseline comparison
   */
  generateBaselineComparison() {
    const comparisons = this.testResults.results.comparisons;
    if (!comparisons || Object.keys(comparisons).length === 0) {
      return 'No baseline comparison data available. Run tests multiple times to establish baseline.';
    }
    
    let section = '| Test | Current | Baseline | Change | Status |\n';
    section += '|------|---------|----------|--------|--------|\n';
    
    Object.entries(comparisons).forEach(([testName, comparison]) => {
      if (comparison.currentTime && comparison.baselineTime) {
        const changeIcon = comparison.status === 'improvement' ? '⬇️' : 
                          comparison.status === 'regression' ? '⬆️' : '➡️';
        section += `| ${testName} | ${comparison.currentTime.toFixed(2)}ms | ${comparison.baselineTime.toFixed(2)}ms | ${changeIcon} ${Math.abs(comparison.percentChange).toFixed(1)}% | ${comparison.status} |\n`;
      }
    });
    
    return section;
  }
  
  /**
   * Generate memory profile report
   */
  async generateMemoryProfileReport(memoryResults) {
    const reportPath = path.join(__dirname, 'test-results', 'memory-profile-report.md');
    
    const report = `# Memory Profile Report

## Memory Usage Analysis

${Object.entries(memoryResults).map(([scenario, result]) => {
  if (!result.memoryStats) return '';
  
  const stats = result.memoryStats;
  return `
### ${scenario.toUpperCase()} (${result.artistCount} artists)

- **Duration**: ${result.duration.toFixed(2)}ms
- **Peak Heap Usage**: ${(stats.heapUsed.max / 1024 / 1024).toFixed(2)}MB
- **Average Heap Usage**: ${(stats.heapUsed.avg / 1024 / 1024).toFixed(2)}MB
- **Final Heap Usage**: ${(stats.heapUsed.final / 1024 / 1024).toFixed(2)}MB
- **Peak RSS**: ${(stats.rss.max / 1024 / 1024).toFixed(2)}MB
- **Memory Samples**: ${stats.samples}
- **Status**: ${result.passed ? '✅ PASS' : '❌ FAIL'}
`;
}).join('')}

---
*Report generated on ${new Date().toISOString()}*
`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`🧠 Memory profile report saved to: ${reportPath}`);
  }
  
  /**
   * Generate concurrent operation report
   */
  async generateConcurrentOperationReport(concurrentResults) {
    const reportPath = path.join(__dirname, 'test-results', 'concurrent-operations-report.md');
    
    const report = `# Concurrent Operations Report

## Concurrent Performance Analysis

${Object.entries(concurrentResults).map(([component, result]) => {
  if (!result.duration) return '';
  
  return `
### ${component.toUpperCase()}

- **Duration**: ${result.duration.toFixed(2)}ms
- **Baseline Time**: ${result.baselineTime}ms
- **Overhead**: ${result.overhead.toFixed(2)}ms
- **Success**: ${result.success ? '✅' : '❌'}
- **Status**: ${result.passed ? '✅ PASS' : '❌ FAIL'}
${result.warnings && result.warnings.length > 0 ? `- **Warnings**: ${result.warnings.join(', ')}` : ''}
`;
}).join('')}

---
*Report generated on ${new Date().toISOString()}*
`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`🔄 Concurrent operations report saved to: ${reportPath}`);
  }
  
  /**
   * Save test results
   */
  async saveTestResults() {
    const resultsPath = path.join(__dirname, 'test-results', `performance-test-results-${Date.now()}.json`);
    
    // Ensure directory exists
    const resultsDir = path.dirname(resultsPath);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`💾 Test results saved to: ${resultsPath}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const orchestrator = new PerformanceTestOrchestrator();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Performance Test Runner for Frontend Sync Processor

Usage: node run-performance-tests.js [options]

Options:
  --comprehensive     Run comprehensive performance test suite (default)
  --memory-only       Run only memory profiling tests
  --concurrent-only   Run only concurrent operation tests
  --quick             Run quick performance check (reduced iterations)
  --help, -h          Show this help message

Examples:
  node run-performance-tests.js
  node run-performance-tests.js --memory-only
  node run-performance-tests.js --concurrent-only
  node run-performance-tests.js --quick
`);
    return;
  }
  
  try {
    let result;
    
    if (args.includes('--memory-only')) {
      result = await orchestrator.runMemoryProfilingTests();
    } else if (args.includes('--concurrent-only')) {
      result = await orchestrator.runConcurrentOperationTests();
    } else {
      // Run comprehensive tests (default)
      result = await orchestrator.runComprehensiveTests();
    }
    
    if (result.success) {
      console.log('\n🎉 All performance tests completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Performance tests failed. Check the reports for details.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Performance test execution failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  PerformanceTestOrchestrator
};

// Run if called directly
if (require.main === module) {
  main();
}