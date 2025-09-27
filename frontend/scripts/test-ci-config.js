#!/usr/bin/env node

/**
 * CI Configuration Test Script
 * Tests CI/CD configuration without starting servers
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testCIConfiguration() {
  log('🧪 Testing CI/CD Configuration...', 'blue');
  
  const projectRoot = path.resolve(__dirname, '..');
  const repoRoot = path.resolve(projectRoot, '..');
  
  let allTestsPassed = true;
  
  // Test 1: Check package.json scripts
  log('\n📦 Testing package.json scripts...', 'blue');
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredScripts = [
      'test:ui-audit',
      'test:e2e:visual',
      'test:e2e:accessibility',
      'test:e2e:theme',
      'test:e2e:responsive',
      'ci:test-integration',
      'ci:setup'
    ];
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`✅ Script found: ${script}`, 'green');
      } else {
        log(`❌ Missing script: ${script}`, 'red');
        allTestsPassed = false;
      }
    });
  } else {
    log('❌ package.json not found', 'red');
    allTestsPassed = false;
  }
  
  // Test 2: Check CI configuration file
  log('\n⚙️ Testing CI configuration...', 'blue');
  const ciConfigPath = path.join(projectRoot, 'config', 'ci-config.json');
  
  if (fs.existsSync(ciConfigPath)) {
    try {
      const ciConfig = JSON.parse(fs.readFileSync(ciConfigPath, 'utf8'));
      
      // Check required sections
      const requiredSections = ['workflows', 'testing', 'reporting', 'artifacts'];
      requiredSections.forEach(section => {
        if (ciConfig[section]) {
          log(`✅ CI config section: ${section}`, 'green');
        } else {
          log(`❌ Missing CI config section: ${section}`, 'red');
          allTestsPassed = false;
        }
      });
      
      // Check workflow configuration
      if (ciConfig.workflows && ciConfig.workflows['ui-ux-audit']) {
        log('✅ UI/UX audit workflow configured', 'green');
      } else {
        log('❌ UI/UX audit workflow not configured', 'red');
        allTestsPassed = false;
      }
      
    } catch (error) {
      log(`❌ Invalid CI configuration: ${error.message}`, 'red');
      allTestsPassed = false;
    }
  } else {
    log('❌ CI configuration file not found', 'red');
    allTestsPassed = false;
  }
  
  // Test 3: Check GitHub workflows
  log('\n🔄 Testing GitHub workflows...', 'blue');
  const workflowsDir = path.join(repoRoot, '.github', 'workflows');
  const requiredWorkflows = [
    'ui-ux-audit.yml',
    'baseline-management.yml',
    'artifact-management.yml'
  ];
  
  requiredWorkflows.forEach(workflow => {
    const workflowPath = path.join(workflowsDir, workflow);
    if (fs.existsSync(workflowPath)) {
      log(`✅ Workflow found: ${workflow}`, 'green');
    } else {
      log(`❌ Missing workflow: ${workflow}`, 'red');
      allTestsPassed = false;
    }
  });
  
  // Test 4: Check test directories
  log('\n📁 Testing test directories...', 'blue');
  const testDirs = [
    'tests/e2e',
    'tests/e2e/visual-regression',
    'tests/e2e/accessibility',
    'tests/e2e/theme-testing',
    'tests/e2e/responsive'
  ];
  
  testDirs.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      log(`✅ Test directory: ${dir}`, 'green');
    } else {
      log(`❌ Missing test directory: ${dir}`, 'red');
      allTestsPassed = false;
    }
  });
  
  // Test 5: Check Playwright configuration
  log('\n🎭 Testing Playwright configuration...', 'blue');
  const playwrightConfigPath = path.join(projectRoot, 'playwright.config.ts');
  
  if (fs.existsSync(playwrightConfigPath)) {
    log('✅ Playwright configuration found', 'green');
  } else {
    log('❌ Playwright configuration not found', 'red');
    allTestsPassed = false;
  }
  
  // Test 6: Check dependencies
  log('\n📚 Testing dependencies...', 'blue');
  const packageJsonPath2 = path.join(projectRoot, 'package.json');
  
  if (fs.existsSync(packageJsonPath2)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath2, 'utf8'));
    
    const requiredDeps = [
      '@playwright/test',
      '@axe-core/playwright',
      'pixelmatch',
      'pngjs'
    ];
    
    requiredDeps.forEach(dep => {
      const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
      const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
      
      if (inDeps || inDevDeps) {
        log(`✅ Dependency found: ${dep}`, 'green');
      } else {
        log(`❌ Missing dependency: ${dep}`, 'red');
        allTestsPassed = false;
      }
    });
  }
  
  // Summary
  log('\n📊 Test Summary', 'blue');
  log('=' .repeat(50), 'blue');
  
  if (allTestsPassed) {
    log('🎉 All CI/CD configuration tests passed!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Run: npm run test:e2e:visual -- --list to see available tests', 'yellow');
    log('2. Run: npm run ci:test-integration to test GitHub integration', 'yellow');
    log('3. Create a test PR to see the workflow in action', 'yellow');
  } else {
    log('❌ Some CI/CD configuration tests failed', 'red');
    log('\nTo fix issues:', 'blue');
    log('1. Run: npm run ci:setup to set up missing components', 'yellow');
    log('2. Check that all required files are present', 'yellow');
    log('3. Verify GitHub workflows are properly configured', 'yellow');
  }
  
  return allTestsPassed;
}

// Run tests if called directly
if (require.main === module) {
  const success = testCIConfiguration();
  process.exit(success ? 0 : 1);
}

module.exports = { testCIConfiguration };