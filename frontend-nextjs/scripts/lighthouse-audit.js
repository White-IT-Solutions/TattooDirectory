/**
 * Lighthouse Audit Script
 * 
 * This script runs Lighthouse audits on both the Next.js and Vite applications
 * and compares the results.
 * 
 * Requirements:
 * - Chrome installed
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

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Check if Lighthouse CLI is installed
try {
  execSync('lighthouse --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Lighthouse CLI is not installed. Please install it with:');
  console.error('npm install -g lighthouse');
  process.exit(1);
}

// Helper function to run Lighthouse audit
async function runLighthouseAudit(url, outputPath) {
  console.log(`Running Lighthouse audit for ${url}...`);
  
  try {
    // Run Lighthouse with specific categories and output formats
    execSync(
      `lighthouse ${url} --output=json,html --output-path=${outputPath} --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo`,
      { stdio: 'inherit' }
    );
    
    // Parse the JSON results
    const jsonResults = JSON.parse(fs.readFileSync(`${outputPath}.json`, 'utf8'));
    
    return {
      performance: jsonResults.categories.performance.score * 100,
      accessibility: jsonResults.categories.accessibility.score * 100,
      bestPractices: jsonResults.categories['best-practices'].score * 100,
      seo: jsonResults.categories.seo.score * 100,
      fcp: jsonResults.audits['first-contentful-paint'].numericValue,
      lcp: jsonResults.audits['largest-contentful-paint'].numericValue,
      tbt: jsonResults.audits['total-blocking-time'].numericValue,
      cls: jsonResults.audits['cumulative-layout-shift'].numericValue,
    };
  } catch (error) {
    console.error(`Failed to run Lighthouse audit for ${url}:`, error);
    return null;
  }
}

// Main function to run audits and compare results
async function runAudits() {
  console.log('Starting Lighthouse audits...');
  console.log('This may take several minutes to complete.');
  console.log('Make sure both applications are running:');
  console.log(`- Next.js app on ${NEXTJS_URL}`);
  console.log(`- Vite app on ${VITE_URL}`);
  
  const results = {};
  
  for (const page of PAGES_TO_TEST) {
    const pageName = page === '/' ? 'home' : page.replace(/\//g, '-').replace(/^-/, '');
    console.log(`\nTesting page: ${pageName}`);
    
    const nextJsUrl = `${NEXTJS_URL}${page}`;
    const viteUrl = `${VITE_URL}${page}`;
    
    const nextJsOutputPath = path.join(RESULTS_DIR, `nextjs-${pageName}`);
    const viteOutputPath = path.join(RESULTS_DIR, `vite-${pageName}`);
    
    // Run audits
    console.log('Running Next.js audit...');
    const nextJsResults = await runLighthouseAudit(nextJsUrl, nextJsOutputPath);
    
    console.log('Running Vite audit...');
    const viteResults = await runLighthouseAudit(viteUrl, viteOutputPath);
    
    if (nextJsResults && viteResults) {
      results[pageName] = {
        nextJs: nextJsResults,
        vite: viteResults,
        differences: {
          performance: nextJsResults.performance - viteResults.performance,
          accessibility: nextJsResults.accessibility - viteResults.accessibility,
          bestPractices: nextJsResults.bestPractices - viteResults.bestPractices,
          seo: nextJsResults.seo - viteResults.seo,
          fcp: viteResults.fcp - nextJsResults.fcp, // Lower is better
          lcp: viteResults.lcp - nextJsResults.lcp, // Lower is better
          tbt: viteResults.tbt - nextJsResults.tbt, // Lower is better
          cls: viteResults.cls - nextJsResults.cls, // Lower is better
        }
      };
      
      // Display results
      console.log(`\nResults for ${pageName}:`);
      console.log('======================');
      
      const data = [
        ['Metric', 'Next.js', 'Vite', 'Difference'],
        ['Performance', `${nextJsResults.performance.toFixed(0)}%`, `${viteResults.performance.toFixed(0)}%`, `${results[pageName].differences.performance.toFixed(1)}%`],
        ['Accessibility', `${nextJsResults.accessibility.toFixed(0)}%`, `${viteResults.accessibility.toFixed(0)}%`, `${results[pageName].differences.accessibility.toFixed(1)}%`],
        ['Best Practices', `${nextJsResults.bestPractices.toFixed(0)}%`, `${viteResults.bestPractices.toFixed(0)}%`, `${results[pageName].differences.bestPractices.toFixed(1)}%`],
        ['SEO', `${nextJsResults.seo.toFixed(0)}%`, `${viteResults.seo.toFixed(0)}%`, `${results[pageName].differences.seo.toFixed(1)}%`],
        ['First Contentful Paint', `${(nextJsResults.fcp / 1000).toFixed(2)}s`, `${(viteResults.fcp / 1000).toFixed(2)}s`, `${(results[pageName].differences.fcp / 1000).toFixed(2)}s`],
        ['Largest Contentful Paint', `${(nextJsResults.lcp / 1000).toFixed(2)}s`, `${(viteResults.lcp / 1000).toFixed(2)}s`, `${(results[pageName].differences.lcp / 1000).toFixed(2)}s`],
        ['Total Blocking Time', `${nextJsResults.tbt.toFixed(0)}ms`, `${viteResults.tbt.toFixed(0)}ms`, `${results[pageName].differences.tbt.toFixed(0)}ms`],
        ['Cumulative Layout Shift', nextJsResults.cls.toFixed(3), viteResults.cls.toFixed(3), results[pageName].differences.cls.toFixed(3)]
      ];
      
      table(data);
    }
  }
  
  // Save overall results
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'lighthouse-comparison.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\nAll results saved to ${RESULTS_DIR}`);
  console.log('HTML reports are also available in the same directory.');
}

// Run the audits
try {
  runAudits();
} catch (error) {
  console.error('Error during Lighthouse audits:', error);
  process.exit(1);
}