/**
 * Install Dependencies Script
 * Installs Puppeteer and other E2E test dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function installDependencies() {
  console.log('🔧 Installing E2E test dependencies...');
  
  try {
    // Check if we're in the right directory
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found. Make sure you\'re in the tests/e2e directory.');
    }
    
    // Install npm dependencies
    console.log('📦 Installing npm packages...');
    execSync('npm install', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit' 
    });
    
    // Create necessary directories
    const directories = [
      '../screenshots',
      '../screenshots/baseline',
      '../screenshots/diff'
    ];
    
    for (const dir of directories) {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
      }
    }
    
    // Check Puppeteer installation
    console.log('🔍 Verifying Puppeteer installation...');
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true });
    await browser.close();
    console.log('✅ Puppeteer is working correctly');
    
    console.log('🎉 E2E test dependencies installed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your local environment: npm run local:start');
    console.log('2. Run E2E tests: npm run test:e2e');
    
  } catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  installDependencies();
}

module.exports = installDependencies;