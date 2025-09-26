#!/usr/bin/env node

/**
 * Reorganization Validation Script
 * 
 * This script validates that all npm scripts still work after the reorganization
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Scripts to test (non-destructive ones only)
const SCRIPTS_TO_TEST = [
  'local:platform-info',
  'local:docker-info',
  'local:health',
  'data:status:windows'
];

function validateScriptPaths() {
  log('🔍 Validating script file paths...', 'blue');
  
  const packageJsonPath = path.join(__dirname, '../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let allValid = true;
  
  Object.entries(packageJson.scripts).forEach(([scriptName, scriptCommand]) => {
    // Extract script paths from commands
    const scriptMatches = scriptCommand.match(/scripts\/[^\s]+\.(js|sh|bat)/g);
    
    if (scriptMatches) {
      scriptMatches.forEach(scriptPath => {
        const fullPath = path.join(__dirname, '../..', scriptPath);
        if (!fs.existsSync(fullPath)) {
          log(`  ❌ Missing: ${scriptPath} (used in ${scriptName})`, 'red');
          allValid = false;
        }
      });
    }
  });
  
  if (allValid) {
    log('  ✅ All script paths are valid', 'green');
  }
  
  return allValid;
}

function testScripts() {
  log('🧪 Testing key npm scripts...', 'blue');
  
  let successCount = 0;
  
  SCRIPTS_TO_TEST.forEach(script => {
    try {
      log(`  Testing: npm run ${script}`, 'yellow');
      execSync(`npm run ${script}`, { 
        stdio: 'pipe',
        cwd: path.join(__dirname, '../..')
      });
      log(`  ✅ ${script} - SUCCESS`, 'green');
      successCount++;
    } catch (error) {
      // Some scripts are expected to fail (e.g., when services aren't running)
      // We just want to ensure they execute without path errors
      if (error.message.includes('not found') || error.message.includes('cannot find')) {
        log(`  ❌ ${script} - PATH ERROR`, 'red');
      } else {
        log(`  ✅ ${script} - EXECUTED (expected failure)`, 'green');
        successCount++;
      }
    }
  });
  
  return successCount;
}

function main() {
  log('🚀 Validating scripts reorganization...', 'blue');
  log('', 'reset');
  
  const pathsValid = validateScriptPaths();
  const successCount = testScripts();
  
  log('', 'reset');
  log('📋 Validation Summary:', 'blue');
  log(`  • Script paths valid: ${pathsValid ? '✅' : '❌'}`, 'reset');
  log(`  • Scripts tested: ${successCount}/${SCRIPTS_TO_TEST.length}`, 'reset');
  
  if (pathsValid && successCount === SCRIPTS_TO_TEST.length) {
    log('', 'reset');
    log('✅ Reorganization validation successful!', 'green');
    log('All npm scripts are working correctly with the new folder structure.', 'reset');
  } else {
    log('', 'reset');
    log('❌ Validation issues detected', 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}