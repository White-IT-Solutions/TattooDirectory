/**
 * Cleanup Script for E2E Tests
 * Cleans up test artifacts and temporary files
 */

const fs = require('fs-extra');
const path = require('path');

async function cleanup() {
  console.log('🧹 Cleaning up E2E test artifacts...');
  
  try {
    const cleanupPaths = [
      '../screenshots/diff',
      '../node_modules/.cache',
      '../coverage'
    ];
    
    for (const cleanupPath of cleanupPaths) {
      const fullPath = path.join(__dirname, cleanupPath);
      
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
        console.log(`🗑️  Removed: ${fullPath}`);
      }
    }
    
    // Clean up old screenshot files (keep baseline)
    const screenshotDir = path.join(__dirname, '..', 'screenshots');
    
    if (await fs.pathExists(screenshotDir)) {
      const files = await fs.readdir(screenshotDir);
      
      for (const file of files) {
        if (file.endsWith('.png') && !file.includes('baseline')) {
          const filePath = path.join(screenshotDir, file);
          await fs.remove(filePath);
          console.log(`🗑️  Removed screenshot: ${file}`);
        }
      }
    }
    
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanup();
}

module.exports = cleanup;