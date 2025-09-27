import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for UI/UX audit tests...');
  
  try {
    // Clean up any temporary files or resources
    const fs = require('fs');
    const path = require('path');
    
    // Clean up temporary screenshot files older than 24 hours
    const tempDir = path.join(__dirname, 'visual-regression', 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      files.forEach((file: string) => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() < oneDayAgo) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Cleaned up old temp file: ${file}`);
        }
      });
    }
    
    // Generate test summary
    const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      const summary = {
        totalTests: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0
      };
      
      console.log('📊 Test Summary:');
      console.log(`   Total: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log(`   Skipped: ${summary.skipped}`);
      console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);
    }
    
  } catch (error) {
    console.error('❌ Global teardown encountered an error:', error);
    // Don't throw here as it would mask test results
  }
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;