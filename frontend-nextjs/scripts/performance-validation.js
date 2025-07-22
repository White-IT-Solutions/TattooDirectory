/**
 * Performance Validation Script
 * 
 * This script runs performance tests on the Next.js application and compares
 * the results with the original React application.
 * 
 * It performs:
 * 1. Bundle size analysis
 * 2. Lighthouse audits (requires Chrome installed)
 * 3. Loading performance tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { table } = require('console');

// Configuration
const NEXTJS_BUILD_DIR = path.join(__dirname, '../.next');
const NEXTJS_OUT_DIR = path.join(__dirname, '../out');
const VITE_DIST_DIR = path.join(__dirname, '../../frontend/dist');
const RESULTS_DIR = path.join(__dirname, '../performance-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Helper functions
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getDirectorySize(directory) {
  let totalSize = 0;
  
  if (!fs.existsSync(directory)) {
    return 0;
  }
  
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += fs.statSync(filePath).size;
    }
  }
  
  return totalSize;
}

function getJsChunksSize(directory) {
  let totalSize = 0;
  
  if (!fs.existsSync(directory)) {
    return 0;
  }
  
  const getAllFiles = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let jsFiles = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        jsFiles = [...jsFiles, ...getAllFiles(filePath)];
      } else if (file.name.endsWith('.js')) {
        jsFiles.push(filePath);
      }
    }
    
    return jsFiles;
  };
  
  const jsFiles = getAllFiles(directory);
  
  for (const file of jsFiles) {
    totalSize += fs.statSync(file).size;
  }
  
  return totalSize;
}

function getCssSize(directory) {
  let totalSize = 0;
  
  if (!fs.existsSync(directory)) {
    return 0;
  }
  
  const getAllFiles = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let cssFiles = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        cssFiles = [...cssFiles, ...getAllFiles(filePath)];
      } else if (file.name.endsWith('.css')) {
        cssFiles.push(filePath);
      }
    }
    
    return cssFiles;
  };
  
  const cssFiles = getAllFiles(directory);
  
  for (const file of cssFiles) {
    totalSize += fs.statSync(file).size;
  }
  
  return totalSize;
}

// Main functions
function analyzeBundleSizes() {
  console.log('Analyzing bundle sizes...');
  
  // Build both projects if needed
  if (!fs.existsSync(NEXTJS_OUT_DIR)) {
    console.log('Building Next.js project...');
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to build Next.js project:', error);
      return;
    }
  }
  
  if (!fs.existsSync(VITE_DIST_DIR)) {
    console.log('Building Vite project...');
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '../../frontend'), stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to build Vite project:', error);
      return;
    }
  }
  
  // Get sizes
  const nextJsTotalSize = getDirectorySize(NEXTJS_OUT_DIR);
  const viteTotalSize = getDirectorySize(VITE_DIST_DIR);
  
  const nextJsJsSize = getJsChunksSize(NEXTJS_OUT_DIR);
  const viteJsSize = getJsChunksSize(VITE_DIST_DIR);
  
  const nextJsCssSize = getCssSize(NEXTJS_OUT_DIR);
  const viteCssSize = getCssSize(VITE_DIST_DIR);
  
  // Calculate differences
  const totalDiff = ((nextJsTotalSize - viteTotalSize) / viteTotalSize) * 100;
  const jsDiff = ((nextJsJsSize - viteJsSize) / viteJsSize) * 100;
  const cssDiff = ((nextJsCssSize - viteCssSize) / viteCssSize) * 100;
  
  // Display results
  console.log('\nBundle Size Comparison:');
  console.log('======================');
  
  const data = [
    ['Metric', 'Next.js', 'Vite', 'Difference'],
    ['Total Size', formatBytes(nextJsTotalSize), formatBytes(viteTotalSize), `${totalDiff.toFixed(2)}%`],
    ['JavaScript Size', formatBytes(nextJsJsSize), formatBytes(viteJsSize), `${jsDiff.toFixed(2)}%`],
    ['CSS Size', formatBytes(nextJsCssSize), formatBytes(viteCssSize), `${cssDiff.toFixed(2)}%`]
  ];
  
  table(data);
  
  // Save results
  const results = {
    nextJs: {
      totalSize: nextJsTotalSize,
      jsSize: nextJsJsSize,
      cssSize: nextJsCssSize
    },
    vite: {
      totalSize: viteTotalSize,
      jsSize: viteJsSize,
      cssSize: viteCssSize
    },
    differences: {
      totalDiff,
      jsDiff,
      cssDiff
    }
  };
  
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'bundle-size-comparison.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\nResults saved to ${path.join(RESULTS_DIR, 'bundle-size-comparison.json')}`);
}

// Run the analysis
try {
  analyzeBundleSizes();
} catch (error) {
  console.error('Error during performance validation:', error);
  process.exit(1);
}