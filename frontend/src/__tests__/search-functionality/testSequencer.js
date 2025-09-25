/**
 * Test Sequencer for Search Functionality Tests
 * 
 * This sequencer optimizes the order of test execution for better performance
 * and logical flow, running foundational tests first and complex integration tests last.
 */

const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

class SearchFunctionalityTestSequencer extends Sequencer {


  /**
   * Get test priority based on file name patterns
   */
  getTestPriority(testPath, priorities) {
    const fileName = path.basename(testPath, path.extname(testPath));
    
    // Find matching priority
    for (const [pattern, priority] of Object.entries(priorities)) {
      if (fileName.toLowerCase().includes(pattern.toLowerCase())) {
        return priority;
      }
    }
    
    // Default priority for unmatched tests
    return 999;
  }

  /**
   * Determine if tests can run in parallel
   * Some tests may need to run sequentially due to shared resources
   */
  allFailedTests(tests) {
    // Run failed tests first for faster feedback
    const failedTests = tests.filter(test => this.hasPreviousFailure(test.path));
    const otherTests = tests.filter(test => !this.hasPreviousFailure(test.path));
    
    return [...failedTests, ...otherTests];
  }

  /**
   * Check if a test had previous failures
   */
  hasPreviousFailure(testPath) {
    // This would typically check a cache or previous test results
    // For now, we'll use a simple heuristic based on file patterns
    const fileName = path.basename(testPath);
    
    // Performance and accessibility tests are more likely to be flaky
    return fileName.includes('Performance') || fileName.includes('Accessibility');
  }

  /**
   * Group tests that should run together
   */
  getTestGroups(tests) {
    const groups = {
      foundation: [],
      unit: [],
      integration: [],
      userFlow: [],
      performance: [],
      accessibility: []
    };

    tests.forEach(test => {
      const fileName = path.basename(test.path).toLowerCase();
      
      if (fileName.includes('enhancedtattoostyles') || fileName.includes('search-controller')) {
        groups.foundation.push(test);
      } else if (fileName.includes('searchfunctionality') || fileName.includes('enhancedstylefilter')) {
        groups.unit.push(test);
      } else if (fileName.includes('crosspageconsistency') || fileName.includes('studiosstylefiltering')) {
        groups.integration.push(test);
      } else if (fileName.includes('searchuserflows') || fileName.includes('navigationenhancement')) {
        groups.userFlow.push(test);
      } else if (fileName.includes('searchperformance')) {
        groups.performance.push(test);
      } else if (fileName.includes('searchaccessibility')) {
        groups.accessibility.push(test);
      } else {
        groups.unit.push(test); // Default to unit tests
      }
    });

    return groups;
  }

  /**
   * Optimize test execution based on system resources
   */
  optimizeForResources(tests) {
    const cpuCount = require('os').cpus().length;
    const memoryGB = require('os').totalmem() / (1024 * 1024 * 1024);
    
    // Adjust test order based on available resources
    if (cpuCount >= 8 && memoryGB >= 16) {
      // High-resource system: can run intensive tests in parallel
      return tests;
    } else if (cpuCount >= 4 && memoryGB >= 8) {
      // Medium-resource system: separate performance tests
      const performanceTests = tests.filter(test => 
        path.basename(test.path).includes('Performance')
      );
      const otherTests = tests.filter(test => 
        !path.basename(test.path).includes('Performance')
      );
      
      return [...otherTests, ...performanceTests];
    } else {
      // Low-resource system: run tests sequentially with lighter tests first
      return tests.sort((a, b) => {
        const aIsHeavy = this.isHeavyTest(a.path);
        const bIsHeavy = this.isHeavyTest(b.path);
        
        if (aIsHeavy && !bIsHeavy) return 1;
        if (!aIsHeavy && bIsHeavy) return -1;
        return 0;
      });
    }
  }

  /**
   * Determine if a test is resource-intensive
   */
  isHeavyTest(testPath) {
    const fileName = path.basename(testPath).toLowerCase();
    
    return fileName.includes('performance') || 
           fileName.includes('accessibility') ||
           fileName.includes('userflows') ||
           fileName.includes('crosspageconsistency');
  }

  /**
   * Handle test dependencies
   */
  resolveDependencies(tests) {
    const dependencyMap = {
      // Tests that depend on the standardized style model
      'SearchFunctionality': ['enhancedtattoostyles'],
      'CrossPageConsistency': ['enhancedtattoostyles', 'search-controller'],
      'SearchUserFlows': ['enhancedtattoostyles', 'search-controller'],
      'StudiosStyleFiltering': ['enhancedtattoostyles'],
      
      // Tests that depend on search controller
      'SearchPerformance': ['search-controller'],
      'SearchAccessibility': ['search-controller']
    };

    // Sort tests to ensure dependencies run first
    const sortedTests = [];
    const processed = new Set();
    
    const addTestWithDependencies = (test) => {
      const fileName = path.basename(test.path, path.extname(test.path));
      
      if (processed.has(test.path)) {
        return;
      }
      
      // Add dependencies first
      const dependencies = dependencyMap[fileName] || [];
      dependencies.forEach(depPattern => {
        const depTest = tests.find(t => 
          path.basename(t.path).toLowerCase().includes(depPattern.toLowerCase())
        );
        
        if (depTest && !processed.has(depTest.path)) {
          addTestWithDependencies(depTest);
        }
      });
      
      // Add the test itself
      sortedTests.push(test);
      processed.add(test.path);
    };

    tests.forEach(addTestWithDependencies);
    
    return sortedTests;
  }

  /**
   * Main sorting logic that combines all optimization strategies
   */
  sort(tests) {
    // Step 1: Resolve dependencies
    let sortedTests = this.resolveDependencies(tests);
    
    // Step 2: Optimize for system resources
    sortedTests = this.optimizeForResources(sortedTests);
    
    // Step 3: Apply priority-based sorting
    const testPriorities = {
      'enhancedtattoostyles': 1,
      'search-controller': 2,
      'SearchFunctionality': 3,
      'EnhancedStyleFilter': 4,
      'SearchResultsDisplay': 5,
      'CrossPageConsistency': 6,
      'StudiosStyleFiltering': 7,
      'SearchUserFlows': 8,
      'NavigationEnhancement': 9,
      'SearchPerformance': 10,
      'SearchAccessibility': 11
    };

    sortedTests = sortedTests.sort((testA, testB) => {
      const priorityA = this.getTestPriority(testA.path, testPriorities);
      const priorityB = this.getTestPriority(testB.path, testPriorities);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return testA.path.localeCompare(testB.path);
    });

    // Step 4: Log execution plan if debugging
    if (process.env.DEBUG_TEST_SEQUENCER || process.env.VERBOSE) {
      this.logExecutionPlan(sortedTests);
    }

    return sortedTests;
  }

  /**
   * Log the test execution plan
   */
  logExecutionPlan(tests) {
    console.log('\n📋 Search Functionality Test Execution Plan:');
    console.log('=' .repeat(60));
    
    const groups = this.getTestGroups(tests);
    
    Object.entries(groups).forEach(([groupName, groupTests]) => {
      if (groupTests.length > 0) {
        console.log(`\n${groupName.toUpperCase()} TESTS (${groupTests.length}):`);
        groupTests.forEach((test, index) => {
          const fileName = path.basename(test.path);
          const priority = this.getTestPriority(test.path, {});
          console.log(`  ${index + 1}. ${fileName}`);
        });
      }
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log(`Total tests: ${tests.length}`);
    console.log('Execution order optimized for dependencies and performance\n');
  }
}

module.exports = SearchFunctionalityTestSequencer;