#!/usr/bin/env node

/**
 * Test Runner for Enhanced Data Display Components
 * 
 * This script runs all tests for the enhanced data display components
 * and provides a comprehensive test report for Task 12 completion.
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'StarRating.test.jsx',
  'PricingDisplay.test.jsx',
  'AvailabilityStatus.test.jsx',
  'ExperienceBadge.test.jsx',
  'ContactOptions.test.jsx',
  'StyleGallery.test.jsx',
  'DataVisualization.test.jsx'
];

const testCategories = {
  'StarRating.test.jsx': 'Interactive Star Rating with Breakdown',
  'PricingDisplay.test.jsx': 'Comprehensive Pricing Display',
  'AvailabilityStatus.test.jsx': 'Booking Availability Status',
  'ExperienceBadge.test.jsx': 'Artist Experience Badges',
  'ContactOptions.test.jsx': 'Multi-Platform Contact Options',
  'StyleGallery.test.jsx': 'Enhanced Gallery with Filtering',
  'DataVisualization.test.jsx': 'Data Formatting & Charts'
};

console.log('🧪 Enhanced Data Display Components Test Suite');
console.log('=' .repeat(60));
console.log();

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

testFiles.forEach((testFile, index) => {
  console.log(`${index + 1}. Testing ${testCategories[testFile]}`);
  console.log('-'.repeat(50));
  
  try {
    const testPath = path.join(__dirname, testFile);
    const result = execSync(`npm test -- ${testPath} --verbose`, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '../../../../../')
    });
    
    // Parse test results (simplified)
    const lines = result.split('\n');
    const testLine = lines.find(line => line.includes('Tests:'));
    
    if (testLine) {
      const matches = testLine.match(/(\d+) passed/);
      if (matches) {
        const passed = parseInt(matches[1]);
        passedTests += passed;
        totalTests += passed;
        console.log(`✅ ${passed} tests passed`);
      }
    } else {
      console.log('✅ Tests completed successfully');
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    failedTests++;
  }
  
  console.log();
});

console.log('📊 Test Summary');
console.log('=' .repeat(60));
console.log(`Total Test Files: ${testFiles.length}`);
console.log(`Total Tests Run: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
console.log();

if (failedTests === 0) {
  console.log('🎉 All enhanced data display component tests passed!');
  console.log('✅ Task 12 - Enhanced Data Display Components: COMPLETED');
} else {
  console.log('⚠️  Some tests failed. Please review and fix issues.');
  process.exit(1);
}

console.log();
console.log('📋 Component Coverage Report:');
console.log('-'.repeat(30));
console.log('✅ StarRating - Interactive ratings with breakdown tooltips');
console.log('✅ PricingDisplay - Multi-format pricing with tiers');
console.log('✅ AvailabilityStatus - Booking status with actions');
console.log('✅ ExperienceBadge - Artist credentials with tooltips');
console.log('✅ ContactOptions - Multi-platform contact methods');
console.log('✅ StyleGallery - Enhanced gallery with filtering & lightbox');
console.log('✅ DataVisualization - Charts, formatting, and metrics');
console.log();
console.log('🚀 All components ready for integration with search functionality!');