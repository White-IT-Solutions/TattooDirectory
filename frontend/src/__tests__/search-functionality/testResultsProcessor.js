/**
 * Test Results Processor for Search Functionality Tests
 * 
 * This processor analyzes test results and generates detailed reports
 * about search functionality compliance with requirements.
 */

const fs = require('fs');
const path = require('path');

// Requirements mapping from the spec
const REQUIREMENTS_MAP = {
  'Requirement 1': {
    name: 'Unify Studios Page Search Experience',
    testPatterns: [
      'studios.*style.*filter',
      'cross.*page.*consistency',
      'studios.*search.*interface'
    ]
  },
  'Requirement 2': {
    name: 'Enhance Artists Page Search Functionality',
    testPatterns: [
      'artists.*search',
      'enhanced.*search.*controller',
      'artists.*style.*filter'
    ]
  },
  'Requirement 3': {
    name: 'Enhance Navigation Search Experience',
    testPatterns: [
      'navigation.*search',
      'contextual.*help',
      'autocomplete.*suggestions'
    ]
  },
  'Requirement 4': {
    name: 'Align Styles Page with Enhanced Demo Functionality',
    testPatterns: [
      'styles.*page',
      'style.*showcase',
      'enhanced.*demo'
    ]
  },
  'Requirement 5': {
    name: 'Implement Consistent Search Design System',
    testPatterns: [
      'design.*system',
      'consistent.*styling',
      'cross.*page.*consistency'
    ]
  },
  'Requirement 6': {
    name: 'Enhance Search Result Display and Feedback',
    testPatterns: [
      'search.*results.*display',
      'search.*feedback',
      'no.*results'
    ]
  },
  'Requirement 7': {
    name: 'Implement Advanced Search Capabilities',
    testPatterns: [
      'advanced.*search',
      'complex.*queries',
      'multi.*criteria'
    ]
  },
  'Requirement 8': {
    name: 'Standardize Tattoo Styles Data Model',
    testPatterns: [
      'standardized.*style.*model',
      'style.*data.*consistency',
      'enhanced.*tattoo.*styles'
    ]
  },
  'Requirement 9': {
    name: 'Implement Comprehensive Navigation and UX Components',
    testPatterns: [
      'navigation.*enhancement',
      'breadcrumb',
      'keyboard.*navigation'
    ]
  },
  'Requirement 10': {
    name: 'Implement Comprehensive Feedback and Notification Systems',
    testPatterns: [
      'feedback.*system',
      'toast.*notification',
      'error.*handling'
    ]
  },
  'Requirement 11': {
    name: 'Enhance Data Display and Visualization Components',
    testPatterns: [
      'data.*display',
      'visualization',
      'rating.*display'
    ]
  },
  'Requirement 12': {
    name: 'Implement Comprehensive Loading and Skeleton States',
    testPatterns: [
      'loading.*states',
      'skeleton.*components',
      'progressive.*loading'
    ]
  },
  'Requirement 13': {
    name: 'Optimize Search Performance and Accessibility',
    testPatterns: [
      'performance.*tests',
      'accessibility.*tests',
      'wcag.*compliance'
    ]
  }
};

function analyzeTestResults(results) {
  const analysis = {
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalTime: 0
    },
    requirements: {},
    performance: {
      slowTests: [],
      fastTests: [],
      averageTime: 0
    },
    coverage: {
      overall: null,
      byComponent: {}
    },
    issues: [],
    recommendations: []
  };

  // Process test suites
  results.testResults.forEach(testResult => {
    const suiteName = testResult.testFilePath;
    
    testResult.testResults.forEach(test => {
      analysis.summary.totalTests++;
      
      if (test.status === 'passed') {
        analysis.summary.passedTests++;
      } else if (test.status === 'failed') {
        analysis.summary.failedTests++;
        analysis.issues.push({
          test: test.fullName,
          suite: suiteName,
          error: test.failureMessages?.[0] || 'Unknown error'
        });
      } else if (test.status === 'skipped') {
        analysis.summary.skippedTests++;
      }
      
      // Performance analysis
      const duration = test.duration || 0;
      analysis.summary.totalTime += duration;
      
      if (duration > 1000) { // Slow tests > 1 second
        analysis.performance.slowTests.push({
          name: test.fullName,
          duration,
          suite: suiteName
        });
      } else if (duration < 100) { // Fast tests < 100ms
        analysis.performance.fastTests.push({
          name: test.fullName,
          duration,
          suite: suiteName
        });
      }
      
      // Map tests to requirements
      Object.entries(REQUIREMENTS_MAP).forEach(([reqId, requirement]) => {
        if (!analysis.requirements[reqId]) {
          analysis.requirements[reqId] = {
            name: requirement.name,
            tests: [],
            passed: 0,
            failed: 0,
            coverage: 0
          };
        }
        
        const testName = test.fullName.toLowerCase();
        const matchesRequirement = requirement.testPatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\./g, '\\s*'), 'i');
          return regex.test(testName);
        });
        
        if (matchesRequirement) {
          analysis.requirements[reqId].tests.push({
            name: test.fullName,
            status: test.status,
            duration: test.duration
          });
          
          if (test.status === 'passed') {
            analysis.requirements[reqId].passed++;
          } else if (test.status === 'failed') {
            analysis.requirements[reqId].failed++;
          }
        }
      });
    });
  });

  // Calculate averages and percentages
  analysis.performance.averageTime = analysis.summary.totalTime / analysis.summary.totalTests;
  
  Object.values(analysis.requirements).forEach(req => {
    const totalReqTests = req.passed + req.failed;
    req.coverage = totalReqTests > 0 ? (req.passed / totalReqTests) * 100 : 0;
  });

  // Generate recommendations
  generateRecommendations(analysis);

  return analysis;
}

function generateRecommendations(analysis) {
  const recommendations = [];

  // Performance recommendations
  if (analysis.performance.slowTests.length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `${analysis.performance.slowTests.length} tests are running slowly (>1s). Consider optimizing these tests or the components they test.`,
      details: analysis.performance.slowTests.slice(0, 5).map(t => t.name)
    });
  }

  // Coverage recommendations
  Object.entries(analysis.requirements).forEach(([reqId, req]) => {
    if (req.coverage < 80) {
      recommendations.push({
        type: 'coverage',
        priority: req.coverage < 50 ? 'high' : 'medium',
        message: `${req.name} has low test coverage (${req.coverage.toFixed(1)}%). Add more tests for this requirement.`,
        requirement: reqId
      });
    }
  });

  // Failure recommendations
  if (analysis.summary.failedTests > 0) {
    const failureRate = (analysis.summary.failedTests / analysis.summary.totalTests) * 100;
    
    if (failureRate > 20) {
      recommendations.push({
        type: 'quality',
        priority: 'critical',
        message: `High failure rate (${failureRate.toFixed(1)}%). Focus on fixing failing tests before adding new features.`
      });
    } else if (failureRate > 10) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        message: `Moderate failure rate (${failureRate.toFixed(1)}%). Review and fix failing tests.`
      });
    }
  }

  // Missing test recommendations
  const requirementsWithoutTests = Object.entries(analysis.requirements)
    .filter(([_, req]) => req.tests.length === 0);
  
  if (requirementsWithoutTests.length > 0) {
    recommendations.push({
      type: 'coverage',
      priority: 'medium',
      message: `${requirementsWithoutTests.length} requirements have no associated tests. Consider adding tests for: ${requirementsWithoutTests.map(([_, req]) => req.name).join(', ')}`
    });
  }

  analysis.recommendations = recommendations;
}

function generateReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: analysis.summary,
    requirements: analysis.requirements,
    performance: analysis.performance,
    issues: analysis.issues,
    recommendations: analysis.recommendations
  };

  // Calculate overall health score
  const passRate = (analysis.summary.passedTests / analysis.summary.totalTests) * 100;
  const avgRequirementCoverage = Object.values(analysis.requirements)
    .reduce((sum, req) => sum + req.coverage, 0) / Object.keys(analysis.requirements).length;
  
  report.healthScore = {
    overall: Math.round((passRate + avgRequirementCoverage) / 2),
    testPassRate: Math.round(passRate),
    requirementCoverage: Math.round(avgRequirementCoverage),
    performanceScore: analysis.performance.slowTests.length === 0 ? 100 : Math.max(0, 100 - (analysis.performance.slowTests.length * 10))
  };

  return report;
}

function saveReport(report, outputPath) {
  try {
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save JSON report
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    // Generate human-readable summary
    const summaryPath = outputPath.replace('.json', '-summary.txt');
    const summary = generateTextSummary(report);
    fs.writeFileSync(summaryPath, summary);

    console.log(`\n📊 Test analysis report saved to: ${outputPath}`);
    console.log(`📋 Human-readable summary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('Failed to save test report:', error.message);
  }
}

function generateTextSummary(report) {
  const lines = [];
  
  lines.push('SEARCH FUNCTIONALITY TEST ANALYSIS REPORT');
  lines.push('=' .repeat(50));
  lines.push(`Generated: ${report.timestamp}`);
  lines.push('');
  
  // Overall health
  lines.push('OVERALL HEALTH SCORE');
  lines.push('-'.repeat(20));
  lines.push(`Overall Score: ${report.healthScore.overall}%`);
  lines.push(`Test Pass Rate: ${report.healthScore.testPassRate}%`);
  lines.push(`Requirement Coverage: ${report.healthScore.requirementCoverage}%`);
  lines.push(`Performance Score: ${report.healthScore.performanceScore}%`);
  lines.push('');
  
  // Test summary
  lines.push('TEST SUMMARY');
  lines.push('-'.repeat(12));
  lines.push(`Total Tests: ${report.summary.totalTests}`);
  lines.push(`Passed: ${report.summary.passedTests}`);
  lines.push(`Failed: ${report.summary.failedTests}`);
  lines.push(`Skipped: ${report.summary.skippedTests}`);
  lines.push(`Total Time: ${(report.summary.totalTime / 1000).toFixed(2)}s`);
  lines.push('');
  
  // Requirements coverage
  lines.push('REQUIREMENTS COVERAGE');
  lines.push('-'.repeat(21));
  Object.entries(report.requirements).forEach(([reqId, req]) => {
    const status = req.coverage >= 80 ? '✅' : req.coverage >= 50 ? '⚠️' : '❌';
    lines.push(`${status} ${reqId}: ${req.name} (${req.coverage.toFixed(1)}%)`);
    lines.push(`   Tests: ${req.tests.length}, Passed: ${req.passed}, Failed: ${req.failed}`);
  });
  lines.push('');
  
  // Performance issues
  if (report.performance.slowTests.length > 0) {
    lines.push('PERFORMANCE ISSUES');
    lines.push('-'.repeat(18));
    report.performance.slowTests.slice(0, 10).forEach(test => {
      lines.push(`⚠️  ${test.name} (${test.duration}ms)`);
    });
    lines.push('');
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(15));
    report.recommendations.forEach(rec => {
      const priority = rec.priority === 'critical' ? '🔴' : 
                      rec.priority === 'high' ? '🟠' : 
                      rec.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`${priority} ${rec.message}`);
      if (rec.details) {
        rec.details.forEach(detail => lines.push(`   - ${detail}`));
      }
    });
    lines.push('');
  }
  
  // Issues
  if (report.issues.length > 0) {
    lines.push('FAILED TESTS');
    lines.push('-'.repeat(12));
    report.issues.slice(0, 10).forEach(issue => {
      lines.push(`❌ ${issue.test}`);
      lines.push(`   Error: ${issue.error.split('\n')[0]}`);
    });
    
    if (report.issues.length > 10) {
      lines.push(`   ... and ${report.issues.length - 10} more failures`);
    }
  }
  
  return lines.join('\n');
}

// Main processor function
function processTestResults(results) {
  console.log('\n🔍 Analyzing search functionality test results...');
  
  const analysis = analyzeTestResults(results);
  const report = generateReport(analysis);
  
  // Save report
  const outputPath = path.join(process.cwd(), 'coverage', 'search-functionality', 'test-analysis.json');
  saveReport(report, outputPath);
  
  // Print summary to console
  console.log('\n📊 TEST ANALYSIS SUMMARY');
  console.log('========================');
  console.log(`Overall Health Score: ${report.healthScore.overall}%`);
  console.log(`Tests: ${report.summary.passedTests}/${report.summary.totalTests} passed`);
  console.log(`Requirements Coverage: ${report.healthScore.requirementCoverage}%`);
  
  if (report.recommendations.length > 0) {
    console.log(`\n⚠️  ${report.recommendations.length} recommendations for improvement`);
  }
  
  if (report.issues.length > 0) {
    console.log(`❌ ${report.issues.length} test failures need attention`);
  }
  
  return results; // Return original results for Jest
}

module.exports = processTestResults;