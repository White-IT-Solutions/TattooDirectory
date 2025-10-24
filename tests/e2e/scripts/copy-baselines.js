#!/usr/bin/env node

/**
 * Copy Existing Screenshots as Baselines
 * Simple script to copy current screenshots as baseline images
 */

const fs = require('fs-extra');
const path = require('path');

const BASELINE_DIR = path.join(__dirname, '..', 'screenshots', 'baseline');
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

async function copyBaselines() {
  console.log('📋 Copying existing screenshots as baselines...');
  
  // Ensure directories exist
  await fs.ensureDir(BASELINE_DIR);
  await fs.ensureDir(SCREENSHOT_DIR);
  
  try {
    // Get all PNG files in screenshots directory
    const files = await fs.readdir(SCREENSHOT_DIR);
    const pngFiles = files.filter(file => file.endsWith('.png') && !file.includes('diff'));
    
    let copiedCount = 0;
    
    for (const file of pngFiles) {
      const sourcePath = path.join(SCREENSHOT_DIR, file);
      const targetPath = path.join(BASELINE_DIR, file);
      
      // Copy file to baseline directory
      await fs.copy(sourcePath, targetPath);
      console.log(`📋 Copied baseline: ${file}`);
      copiedCount++;
    }
    
    console.log(`\n✅ Successfully copied ${copiedCount} screenshots as baselines`);
    console.log(`📁 Baselines saved to: ${BASELINE_DIR}`);
    
    if (copiedCount === 0) {
      console.log('\n⚠️  No screenshots found to copy as baselines');
      console.log('💡 Run visual tests first to generate screenshots');
    }
    
  } catch (error) {
    console.error('❌ Error copying baselines:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  copyBaselines().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = copyBaselines;