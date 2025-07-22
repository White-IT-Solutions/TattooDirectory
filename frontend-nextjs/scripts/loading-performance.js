/**
 * Loading Performance Test Script
 * 
 * This script tests the loading performance of the Next.js application
 * using Puppeteer to measure key metrics.
 * 
 * Requirements:
 * - Both applications must be running on different ports
 * - Next.js app should be running on http://localhost:3000
 * - Vite app should be running on http://localhost:5173
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { table } = require('console');

// Configuration
const RESULTS_DIR = path.join(__dirname, '../performance-results');
const NEXTJS_URL = 'http://localhost:3000';
const VITE_URL = 'http://localhost:5173';
const PAGES_TO_TEST = [
  '/',                  // Landing page
  '/search',            // Search page
  '/artist/1',          // Artist profile page
  '/privacy',           // Static page
];
const NUM_RUNS = 3; // Number of test runs for each page

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Check if Puppeteer is installed, if not install it
try {
  require.resolve('puppeteer');
} catch (error) {
  console.log('Puppeteer is not installed. Installing now...');
  execSync('npm install --no-save puppeteer', { stdio: 'inherit' });
}

// Import puppeteer
const puppeteer = require('puppeteer');

// Helper function to measure page load metrics
async function measurePageLoad(browser, url) {
  const page = await browser.newPage();
  
  // Enable performance metrics
  await page.setCacheEnabled(false);
  
  // Create client for performance metrics
  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');
  
  // Navigate to the page and wait for load
  const navigationStart = Date.now();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const navigationEnd = Date.now();
  
  // Get performance metrics
  const performanceMetrics = await client.send('Performance.getMetrics');
  
  // Extract metrics
  const metrics = {};
  performanceMetrics.metrics.forEach(metric => {
    metrics[metric.name] = metric.value;
  });
  
  // Calculate key metrics
  const results = {
    totalLoadTime: navigationEnd - navigationStart,
    firstPaint: metrics.FirstPaint * 1000, // Convert to ms
    firstContentfulPaint: metrics.FirstContentfulPaint * 1000, // Convert to ms
    domContentLoaded: metrics.DomContentLoaded * 1000, // Convert to ms
    loadEvent: metrics.LoadEvent * 1000, // Convert to ms
  };
  
  // Close the page
  await page.close();
  
  return results;
}

// Main function to run performance tests
async function runLoadingTests() {
  console.log('Starting loading performance tests...');
  console.log('This may take several minutes to complete.');
  console.log('Make sure both applications are running:');
  console.log(`- Next.js app on ${NEXTJS_URL}`);
  console.log(`- Vite app on ${VITE_URL}`);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {};
  
  for (const page of PAGES_TO_TEST) {
    const pageName = page === '/' ? 'home' : page.replace(/\//g, '-').replace(/^-/, '');
    console.log(`\nTesting page: ${pageName}`);
    
    const nextJsUrl = `${NEXTJS_URL}${page}`;
    const viteUrl = `${VITE_URL}${page}`;
    
    // Run multiple tests and average the results
    const nextJsRuns = [];
    const viteRuns = [];
    
    for (let i = 0; i < NUM_RUNS; i++) {
      console.log(`Run ${i + 1}/${NUM_RUNS} for Next.js...`);
      nextJsRuns.push(await measurePageLoad(browser, nextJsUrl));
      
      console.log(`Run ${i + 1}/${NUM_RUNS} for Vite...`);
      viteRuns.push(await measurePageLoad(browser, viteUrl));
    }
    
    // Calculate averages
    const nextJsAvg = {
      totalLoadTime: nextJsRuns.reduce((sum, run) => sum + run.totalLoadTime, 0) / NUM_RUNS,
      firstPaint: nextJsRuns.reduce((sum, run) => sum + run.firstPaint, 0) / NUM_RUNS,
      firstContentfulPaint: nextJsRuns.reduce((sum, run) => sum + run.firstContentfulPaint, 0) / NUM_RUNS,
      domContentLoaded: nextJsRuns.reduce((sum, run) => sum + run.domContentLoaded, 0) / NUM_RUNS,
      loadEvent: nextJsRuns.reduce((sum, run) => sum + run.loadEvent, 0) / NUM_RUNS,
    };
    
    const viteAvg = {
      totalLoadTime: viteRuns.reduce((sum, run) => sum + run.totalLoadTime, 0) / NUM_RUNS,
      firstPaint: viteRuns.reduce((sum, run) => sum + run.firstPaint, 0) / NUM_RUNS,
      firstContentfulPaint: viteRuns.reduce((sum, run) => sum + run.firstContentfulPaint, 0) / NUM_RUNS,
      domContentLoaded: viteRuns.reduce((sum, run) => sum + run.domContentLoaded, 0) / NUM_RUNS,
      loadEvent: viteRuns.reduce((sum, run) => sum + run.loadEvent, 0) / NUM_RUNS,
    };
    
    // Calculate differences (positive means Next.js is faster)
    const differences = {
      totalLoadTime: viteAvg.totalLoadTime - nextJsAvg.totalLoadTime,
      firstPaint: viteAvg.firstPaint - nextJsAvg.firstPaint,
      firstContentfulPaint: viteAvg.firstContentfulPaint - nextJsAvg.firstContentfulPaint,
      domContentLoaded: viteAvg.domContentLoaded - nextJsAvg.domContentLoaded,
      loadEvent: viteAvg.loadEvent - nextJsAvg.loadEvent,
    };
    
    results[pageName] = {
      nextJs: nextJsAvg,
      vite: viteAvg,
      differences
    };
    
    // Display results
    console.log(`\nResults for ${pageName} (average of ${NUM_RUNS} runs):`);
    console.log('======================');
    
    const data = [
      ['Metric', 'Next.js', 'Vite', 'Difference'],
      ['Total Load Time', `${nextJsAvg.totalLoadTime.toFixed(0)}ms`, `${viteAvg.totalLoadTime.toFixed(0)}ms`, `${differences.totalLoadTime.toFixed(0)}ms`],
      ['First Paint', `${nextJsAvg.firstPaint.toFixed(0)}ms`, `${viteAvg.firstPaint.toFixed(0)}ms`, `${differences.firstPaint.toFixed(0)}ms`],
      ['First Contentful Paint', `${nextJsAvg.firstContentfulPaint.toFixed(0)}ms`, `${viteAvg.firstContentfulPaint.toFixed(0)}ms`, `${differences.firstContentfulPaint.toFixed(0)}ms`],
      ['DOM Content Loaded', `${nextJsAvg.domContentLoaded.toFixed(0)}ms`, `${viteAvg.domContentLoaded.toFixed(0)}ms`, `${differences.domContentLoaded.toFixed(0)}ms`],
      ['Load Event', `${nextJsAvg.loadEvent.toFixed(0)}ms`, `${viteAvg.loadEvent.toFixed(0)}ms`, `${differences.loadEvent.toFixed(0)}ms`]
    ];
    
    table(data);
  }
  
  // Close browser
  await browser.close();
  
  // Save results
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'loading-performance-comparison.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\nAll results saved to ${path.join(RESULTS_DIR, 'loading-performance-comparison.json')}`);
}

// Run the tests
(async () => {
  try {
    await runLoadingTests();
  } catch (error) {
    console.error('Error during loading performance tests:', error);
    process.exit(1);
  }
})();