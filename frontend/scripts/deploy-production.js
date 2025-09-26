#!/usr/bin/env node

/**
 * Production Deployment Script
 * Handles production build and deployment preparation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'cyan');
  
  const requiredFiles = [
    'package.json',
    'next.config.mjs',
    '.eslintrc.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, '..', file))) {
      log(`❌ Missing required file: ${file}`, 'red');
      return false;
    }
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

function generateBuildInfo() {
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    nodeVersion: process.version,
    environment: 'production',
    buildId: Math.random().toString(36).substring(7)
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  log(`✅ Build info generated (ID: ${buildInfo.buildId})`, 'green');
  return buildInfo;
}

function analyzeBundle() {
  log('\n📊 Bundle Analysis:', 'magenta');
  
  const buildDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(buildDir)) {
    const stats = fs.statSync(buildDir);
    log(`Build directory size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'yellow');
  }
  
  // Check for large bundles
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    log('✅ Static assets generated', 'green');
  }
}

function createDeploymentPackage() {
  log('\n📦 Creating deployment package...', 'cyan');
  
  const deploymentFiles = [
    '.next',
    'public',
    'package.json',
    'next.config.mjs'
  ];
  
  const missingFiles = deploymentFiles.filter(file => 
    !fs.existsSync(path.join(__dirname, '..', file))
  );
  
  if (missingFiles.length > 0) {
    log(`❌ Missing deployment files: ${missingFiles.join(', ')}`, 'red');
    return false;
  }
  
  log('✅ All deployment files present', 'green');
  return true;
}

function displayDeploymentInstructions() {
  log('\n🚀 Deployment Instructions:', 'bright');
  log('', 'reset');
  
  log('For Vercel:', 'cyan');
  log('  vercel --prod', 'yellow');
  log('', 'reset');
  
  log('For Docker:', 'cyan');
  log('  docker build -t tattoo-directory .', 'yellow');
  log('  docker run -p 3000:3000 tattoo-directory', 'yellow');
  log('', 'reset');
  
  log('For Manual Deployment:', 'cyan');
  log('  1. Copy .next, public, package.json, next.config.mjs', 'yellow');
  log('  2. Run: npm install --production', 'yellow');
  log('  3. Run: npm start', 'yellow');
  log('', 'reset');
}

function main() {
  log('🚀 Production Deployment Preparation', 'bright');
  log('=====================================', 'bright');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // Clean previous build
  if (!runCommand('npm run build', 'Building production bundle')) {
    process.exit(1);
  }
  
  // Generate build info
  const buildInfo = generateBuildInfo();
  
  // Analyze bundle
  analyzeBundle();
  
  // Create deployment package
  if (!createDeploymentPackage()) {
    process.exit(1);
  }
  
  // Success summary
  log('\n🎉 Production build completed successfully!', 'green');
  log(`Build ID: ${buildInfo.buildId}`, 'cyan');
  log(`Timestamp: ${buildInfo.timestamp}`, 'cyan');
  
  displayDeploymentInstructions();
}

if (require.main === module) {
  main();
}

module.exports = { 
  checkPrerequisites, 
  generateBuildInfo, 
  analyzeBundle, 
  createDeploymentPackage 
};