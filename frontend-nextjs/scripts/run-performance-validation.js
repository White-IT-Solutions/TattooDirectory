/**
 * Performance Validation Runner
 * 
 * This script runs all performance validation tests:
 * 1. Bundle size analysis
 * 2. Lighthouse audits
 * 3. Loading performance tests
 * 
 * Usage:
 * node scripts/run-performance-validation.js [test-type]
 * 
 * Where test-type is one of:
 * - bundle (bundle size analysis only)
 * - lighthouse (lighthouse audits only)
 * - loading (loading performance tests only)
 * - all (default, runs all tests)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const RESULTS_DIR = path.join(__dirname, '../performance-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';

// Validate test type
const validTestTypes = ['bundle', 'lighthouse', 'loading', 'all'];
if (!validTestTypes.includes(testType)) {
  console.error(`Invalid test type: ${testType}`);
  console.error(`Valid options are: ${validTestTypes.join(', ')}`);
  process.exit(1);
}

// Run tests based on type
console.log(`Running performance validation tests: ${testType}`);

try {
  // Create timestamp for this run
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'last-run.txt'),
    `Performance validation run: ${timestamp}\n`
  );
  
  // Run bundle size analysis
  if (testType === 'bundle' || testType === 'all') {
    console.log('\n=== Running Bundle Size Analysis ===\n');
    execSync('node scripts/performance-validation.js', { stdio: 'inherit' });
  }
  
  // Run Lighthouse audits
  if (testType === 'lighthouse' || testType === 'all') {
    console.log('\n=== Running Lighthouse Audits ===\n');
    console.log('Note: This requires both applications to be running:');
    console.log('- Next.js app on http://localhost:3000');
    console.log('- Vite app on http://localhost:5173');
    
    // Check if apps are running
    let nextJsRunning = false;
    let viteRunning = false;
    
    try {
      execSync('curl -s http://localhost:3000 > nul');
      nextJsRunning = true;
    } catch (error) {
      console.error('Next.js app is not running on http://localhost:3000');
    }
    
    try {
      execSync('curl -s http://localhost:5173 > nul');
      viteRunning = true;
    } catch (error) {
      console.error('Vite app is not running on http://localhost:5173');
    }
    
    if (nextJsRunning && viteRunning) {
      execSync('node scripts/lighthouse-audit.js', { stdio: 'inherit' });
    } else {
      console.error('Skipping Lighthouse audits because one or both apps are not running.');
    }
  }
  
  // Run loading performance tests
  if (testType === 'loading' || testType === 'all') {
    console.log('\n=== Running Loading Performance Tests ===\n');
    console.log('Note: This requires both applications to be running:');
    console.log('- Next.js app on http://localhost:3000');
    console.log('- Vite app on http://localhost:5173');
    
    // Check if apps are running
    let nextJsRunning = false;
    let viteRunning = false;
    
    try {
      execSync('curl -s http://localhost:3000 > nul');
      nextJsRunning = true;
    } catch (error) {
      console.error('Next.js app is not running on http://localhost:3000');
    }
    
    try {
      execSync('curl -s http://localhost:5173 > nul');
      viteRunning = true;
    } catch (error) {
      console.error('Vite app is not running on http://localhost:5173');
    }
    
    if (nextJsRunning && viteRunning) {
      execSync('node scripts/loading-performance.js', { stdio: 'inherit' });
    } else {
      console.error('Skipping loading performance tests because one or both apps are not running.');
    }
  }
  
  console.log('\n=== Performance Validation Complete ===\n');
  console.log(`All results saved to ${RESULTS_DIR}`);
  
} catch (error) {
  console.error('Error during performance validation:', error);
  process.exit(1);
}