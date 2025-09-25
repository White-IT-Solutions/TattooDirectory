#!/usr/bin/env node

/**
 * Build Validation Script
 * Validates the production build and checks for common issues
 */

const fs = require('fs');
const path = require('path');

function validateBuild() {
  console.log('🔍 Validating production build...\n');
  
  const buildDir = path.join(__dirname, '..', '.next');
  const issues = [];
  const successes = [];
  
  // Check if build directory exists
  if (!fs.existsSync(buildDir)) {
    issues.push('❌ Build directory (.next) not found');
  } else {
    successes.push('✅ Build directory exists');
  }
  
  // Check for static files
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    successes.push('✅ Static assets generated');
  } else {
    issues.push('❌ Static assets not found');
  }
  
  // Check for server files
  const serverDir = path.join(buildDir, 'server');
  if (fs.existsSync(serverDir)) {
    successes.push('✅ Server files generated');
  } else {
    issues.push('❌ Server files not found');
  }
  
  // Check for standalone build
  const standaloneDir = path.join(buildDir, 'standalone');
  if (fs.existsSync(standaloneDir)) {
    successes.push('✅ Standalone build created');
  } else {
    successes.push('ℹ️  Standalone build not configured (optional)');
  }
  
  // Check package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packagePath)) {
    successes.push('✅ Package.json exists');
  } else {
    issues.push('❌ Package.json not found');
  }
  
  // Check next.config.mjs
  const configPath = path.join(__dirname, '..', 'next.config.mjs');
  if (fs.existsSync(configPath)) {
    successes.push('✅ Next.js config exists');
  } else {
    issues.push('❌ Next.js config not found');
  }
  
  // Display results
  console.log('✅ Successes:');
  successes.forEach(success => console.log(`  ${success}`));
  
  if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('\n🔧 Run "npm run build" to fix build issues');
    return false;
  } else {
    console.log('\n🎉 Build validation passed! Ready for deployment.');
    return true;
  }
}

if (require.main === module) {
  const isValid = validateBuild();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateBuild };