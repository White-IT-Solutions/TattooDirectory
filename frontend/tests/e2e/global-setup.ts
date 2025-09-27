import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for UI/UX audit tests...');
  
  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    console.log(`📡 Checking if application is ready at ${baseURL}`);
    
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Verify the application is responsive
    await page.waitForSelector('body', { timeout: 10000 });
    
    console.log('✅ Application is ready for testing');
    
    // Create baseline directories if they don't exist
    const fs = require('fs');
    const path = require('path');
    
    const baselineDir = path.join(__dirname, 'visual-regression', 'baselines');
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
      console.log('📁 Created baseline directory for visual regression tests');
    }
    
    const screenshotDir = path.join(__dirname, 'visual-regression', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      console.log('📁 Created screenshot directory for visual regression tests');
    }
    
    const diffDir = path.join(__dirname, 'visual-regression', 'diffs');
    if (!fs.existsSync(diffDir)) {
      fs.mkdirSync(diffDir, { recursive: true });
      console.log('📁 Created diff directory for visual regression tests');
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('🎯 Global setup completed successfully');
}

export default globalSetup;