#!/usr/bin/env node

/**
 * Generate Visual Regression Baselines
 * This script generates baseline images for visual regression tests
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const BASELINE_DIR = path.join(__dirname, '..', 'screenshots', 'baseline');
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

async function generateBaselines() {
  console.log('🎯 Generating visual regression baselines...');
  
  // Ensure directories exist
  await fs.ensureDir(BASELINE_DIR);
  await fs.ensureDir(SCREENSHOT_DIR);
  
  // List of visual tests that need baselines
  const visualTests = [
    'mobile-homepage-visual',
    'tablet-homepage-visual', 
    'desktop-homepage-visual',
    'homepage-search-interface-visual',
    'navigation-elements',
    'footer-elements',
    'artist-card-component',
    'search-filters',
    'pagination-component',
    'loading-state-visual',
    'error-state-visual',
    'artist-card-hover',
    'search-input-focus'
  ];
  
  try {
    console.log('📸 Running visual tests to generate screenshots...');
    
    // Run visual tests with extended timeout - ignore failures for baseline generation
    try {
      execSync('npx mocha tests/visual/ui-components.test.js --timeout 120000', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('✅ Visual tests completed successfully');
    } catch (testError) {
      console.log('⚠️  Some visual tests failed, but continuing with baseline generation...');
      console.log('   This is normal for first-time baseline generation');
    }
    
    // Copy screenshots to baseline directory
    let baselineCount = 0;
    
    for (const testName of visualTests) {
      const screenshotPath = path.join(SCREENSHOT_DIR, `${testName}.png`);
      const baselinePath = path.join(BASELINE_DIR, `${testName}.png`);
      
      if (await fs.pathExists(screenshotPath)) {
        await fs.copy(screenshotPath, baselinePath);
        console.log(`📋 Created baseline: ${testName}.png`);
        baselineCount++;
      } else {
        console.warn(`⚠️  Screenshot not found: ${testName}.png`);
      }
    }
    
    console.log(`\n🎉 Generated ${baselineCount} baseline images`);
    console.log(`📁 Baselines saved to: ${BASELINE_DIR}`);
    
    // Always try to copy any additional screenshots as baselines
    console.log('🔄 Checking for additional screenshots to use as baselines...');
    
    let additionalCount = 0;
    for (const testName of visualTests) {
      const screenshotPath = path.join(SCREENSHOT_DIR, `${testName}.png`);
      const baselinePath = path.join(BASELINE_DIR, `${testName}.png`);
      
      if (await fs.pathExists(screenshotPath) && !await fs.pathExists(baselinePath)) {
        await fs.copy(screenshotPath, baselinePath);
        console.log(`📋 Additional baseline: ${testName}.png`);
        additionalCount++;
      }
    }
    
    const totalBaselines = baselineCount + additionalCount;
    if (totalBaselines > 0) {
      console.log(`\n✅ Total baselines created: ${totalBaselines} (${baselineCount} from tests + ${additionalCount} additional)`);
    } else {
      console.log('\n❌ No screenshots available for baselines');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error generating baselines:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateBaselines().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = generateBaselines;