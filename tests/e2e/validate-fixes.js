#!/usr/bin/env node

/**
 * Validate E2E Test Fixes
 * Quick validation script to verify all fixes are properly implemented
 */

const fs = require('fs-extra');
const path = require('path');

async function validateFixes() {
  console.log('🔍 Validating E2E Test Fixes...');
  
  const checks = [];
  
  // Check 1: Test configuration timeouts
  try {
    const configPath = path.join(__dirname, 'config', 'test-config.js');
    const configContent = await fs.readFile(configPath, 'utf8');
    
    const hasUpdatedTimeouts = configContent.includes('navigation: 45000') && 
                              configContent.includes('element: 15000') &&
                              configContent.includes('api: 8000');
    
    checks.push({
      name: 'Test Configuration Timeouts',
      status: hasUpdatedTimeouts ? 'PASS' : 'FAIL',
      details: hasUpdatedTimeouts ? 'Timeouts properly increased' : 'Timeouts not updated'
    });
  } catch (error) {
    checks.push({
      name: 'Test Configuration Timeouts',
      status: 'ERROR',
      details: error.message
    });
  }
  
  // Check 2: Visual testing screenshot handling
  try {
    const visualPath = path.join(__dirname, 'setup', 'visual-testing.js');
    const visualContent = await fs.readFile(visualPath, 'utf8');
    
    const hasFixedScreenshotHandling = visualContent.includes('actualScreenshotPath') &&
                                      visualContent.includes('Buffer.isBuffer');
    
    checks.push({
      name: 'Visual Testing Screenshot Handling',
      status: hasFixedScreenshotHandling ? 'PASS' : 'FAIL',
      details: hasFixedScreenshotHandling ? 'Screenshot path handling fixed' : 'Screenshot handling not fixed'
    });
  } catch (error) {
    checks.push({
      name: 'Visual Testing Screenshot Handling',
      status: 'ERROR',
      details: error.message
    });
  }
  
  // Check 3: Performance thresholds
  try {
    const integrationPath = path.join(__dirname, 'tests', 'integration', 'frontend-backend.test.js');
    const integrationContent = await fs.readFile(integrationPath, 'utf8');
    
    const hasUpdatedThresholds = integrationContent.includes('lessThan(8000)') &&
                                integrationContent.includes('lessThan(15000)');
    
    checks.push({
      name: 'Performance Thresholds',
      status: hasUpdatedThresholds ? 'PASS' : 'FAIL',
      details: hasUpdatedThresholds ? 'Performance thresholds adjusted' : 'Thresholds not updated'
    });
  } catch (error) {
    checks.push({
      name: 'Performance Thresholds',
      status: 'ERROR',
      details: error.message
    });
  }
  
  // Check 4: Visual test screenshot methods
  try {
    const visualTestPath = path.join(__dirname, 'tests', 'visual', 'ui-components.test.js');
    const visualTestContent = await fs.readFile(visualTestPath, 'utf8');
    
    const hasFixedScreenshotMethods = !visualTestContent.includes('await page.screenshot({') ||
                                     visualTestContent.includes('const screenshotPath = `');
    
    checks.push({
      name: 'Visual Test Screenshot Methods',
      status: hasFixedScreenshotMethods ? 'PASS' : 'FAIL',
      details: hasFixedScreenshotMethods ? 'Screenshot method calls fixed' : 'Screenshot methods not fixed'
    });
  } catch (error) {
    checks.push({
      name: 'Visual Test Screenshot Methods',
      status: 'ERROR',
      details: error.message
    });
  }
  
  // Check 5: Baseline generation script
  try {
    const baselineScriptPath = path.join(__dirname, 'scripts', 'generate-baselines.js');
    const baselineScriptExists = await fs.pathExists(baselineScriptPath);
    
    checks.push({
      name: 'Baseline Generation Script',
      status: baselineScriptExists ? 'PASS' : 'FAIL',
      details: baselineScriptExists ? 'Baseline generation script created' : 'Script not found'
    });
  } catch (error) {
    checks.push({
      name: 'Baseline Generation Script',
      status: 'ERROR',
      details: error.message
    });
  }
  
  // Check 6: Package.json scripts
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const hasBaselineScript = packageJson.scripts && packageJson.scripts['generate:baselines'];
    const hasUpdatedTimeouts = packageContent.includes('--timeout 45000') ||
                              packageContent.includes('--timeout 60000');
    
    checks.push({
      name: 'Package.json Scripts',
      status: (hasBaselineScript && hasUpdatedTimeouts) ? 'PASS' : 'FAIL',
      details: `Baseline script: ${hasBaselineScript ? 'Yes' : 'No'}, Updated timeouts: ${hasUpdatedTimeouts ? 'Yes' : 'No'}`
    });
  } catch (error) {
    checks.push({
      name: 'Package.json Scripts',
      status: 'ERROR',
      details: error.message
    });
  }
  
  // Check 7: Directory structure
  try {
    const screenshotDir = path.join(__dirname, 'screenshots');
    const baselineDir = path.join(__dirname, 'screenshots', 'baseline');
    const diffDir = path.join(__dirname, 'screenshots', 'diff');
    
    await fs.ensureDir(screenshotDir);
    await fs.ensureDir(baselineDir);
    await fs.ensureDir(diffDir);
    
    checks.push({
      name: 'Directory Structure',
      status: 'PASS',
      details: 'Screenshot directories created/verified'
    });
  } catch (error) {
    checks.push({
      name: 'Directory Structure',
      status: 'ERROR',
      details: error.message
    });
  }
  
  // Print results
  console.log('\n📊 Validation Results:');
  console.log('======================');
  
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;
  
  checks.forEach(check => {
    let icon;
    switch (check.status) {
      case 'PASS':
        icon = '✅';
        passCount++;
        break;
      case 'FAIL':
        icon = '❌';
        failCount++;
        break;
      case 'ERROR':
        icon = '⚠️';
        errorCount++;
        break;
    }
    
    console.log(`${icon} ${check.name}: ${check.status}`);
    if (check.details) {
      console.log(`   ${check.details}`);
    }
  });
  
  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed, ${errorCount} errors`);
  
  if (failCount === 0 && errorCount === 0) {
    console.log('🎉 All fixes validated successfully!');
    console.log('\n🚀 Ready to run tests:');
    console.log('   npm test                    # Run all tests');
    console.log('   npm run generate:baselines  # Generate visual baselines');
    console.log('   npm run test:visual         # Run visual tests');
    return true;
  } else {
    console.log('⚠️  Some fixes need attention. Check the details above.');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  validateFixes().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = validateFixes;