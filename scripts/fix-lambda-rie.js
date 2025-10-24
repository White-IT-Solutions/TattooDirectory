#!/usr/bin/env node

/**
 * Lambda RIE Crash Recovery Script
 * 
 * This script handles AWS Lambda Runtime Interface Emulator segmentation faults
 * and provides automated recovery options.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`${step}. ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function getDockerComposeFiles() {
  const baseFile = "devtools/docker/docker-compose.local.yml";
  const files = [baseFile];

  // Add platform-specific override files
  const os = require('os');
  const platform = os.platform();
  
  if (platform === "win32") {
    files.push("devtools/docker/docker-compose.windows.yml");
  } else if (platform === "darwin") {
    files.push("devtools/docker/docker-compose.macos.yml");
  } else if (platform === "linux") {
    files.push("devtools/docker/docker-compose.linux.yml");
  }

  // Only include files that exist
  return files.filter(file => fs.existsSync(file));
}

function buildDockerComposeCommand(action, additionalArgs = []) {
  const files = getDockerComposeFiles();
  const fileArgs = files.flatMap((file) => ["-f", file]);

  // Add profile for phase1 services and env file
  const profileArgs = ["--profile", "phase1", "--env-file", ".env"];

  return ["docker-compose", ...fileArgs, ...profileArgs, action, ...additionalArgs];
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

function checkDockerCompose() {
  const files = getDockerComposeFiles();
  for (const file of files) {
    if (!fs.existsSync(file)) {
      logError(`Docker compose file not found: ${file}`);
      return false;
    }
  }
  return true;
}

function checkBackendContainer() {
  logStep(1, 'Checking backend container status...');
  
  const cmd = buildDockerComposeCommand('ps', ['backend']);
  const result = execCommand(cmd.join(' '), { silent: true });
  
  if (!result.success) {
    logError('Failed to check backend container status');
    return false;
  }
  
  const isRunning = result.output.includes('Up') || result.output.includes('running');
  if (isRunning) {
    logSuccess('Backend container is running');
  } else {
    logWarning('Backend container is not running');
  }
  
  return isRunning;
}

function restartBackendContainer() {
  logStep(2, 'Restarting backend container...');
  
  // Stop backend container
  log('Stopping backend container...', 'yellow');
  const stopCmd = buildDockerComposeCommand('stop', ['backend']);
  const stopResult = execCommand(stopCmd.join(' '));
  
  if (!stopResult.success) {
    logError('Failed to stop backend container');
    return false;
  }
  
  // Wait a moment
  log('Waiting 2 seconds...', 'yellow');
  execSync('timeout 2 2>nul || sleep 2', { stdio: 'ignore' });
  
  // Start backend container
  log('Starting backend container...', 'yellow');
  const startCmd = buildDockerComposeCommand('up', ['-d', 'backend']);
  const startResult = execCommand(startCmd.join(' '));
  
  if (!startResult.success) {
    logError('Failed to start backend container');
    return false;
  }
  
  logSuccess('Backend container restarted successfully');
  return true;
}

function waitForBackendHealth() {
  logStep(3, 'Waiting for backend to be healthy...');
  
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Try to connect to Lambda RIE health endpoint
      const result = execCommand(
        'curl -s -f http://localhost:9000/2015-03-31/functions/function/invocations -X POST -H "Content-Type: application/json" -d "{\\"rawPath\\": \\"/health\\", \\"requestContext\\": {\\"http\\": {\\"method\\": \\"GET\\"}}}" --max-time 5',
        { silent: true }
      );
      
      if (result.success) {
        logSuccess('Backend is responding to health checks');
        return true;
      }
    } catch (error) {
      // Continue trying
    }
    
    attempts++;
    process.stdout.write('.');
    
    // Wait 2 seconds between attempts
    execSync('timeout 2 2>nul || sleep 2', { stdio: 'ignore' });
  }
  
  console.log(''); // New line after dots
  logWarning('Backend health check timed out, but container may still be starting');
  return false;
}

function restartProxy() {
  logStep(4, 'Restarting API proxy...');
  
  // Stop proxy
  log('Stopping API proxy...', 'yellow');
  execCommand('npm run local:proxy:stop', { silent: true });
  
  // Wait a moment
  execSync('timeout 1 2>nul || sleep 1', { stdio: 'ignore' });
  
  // Start proxy
  log('Starting API proxy...', 'yellow');
  const result = execCommand('npm run local:proxy:start');
  
  if (!result.success) {
    logError('Failed to start API proxy');
    return false;
  }
  
  logSuccess('API proxy restarted successfully');
  return true;
}

function testApiEndpoint() {
  logStep(5, 'Testing API endpoint...');
  
  try {
    const result = execCommand(
      'curl -s -f "http://localhost:9001/health" --max-time 10',
      { silent: true }
    );
    
    if (result.success) {
      logSuccess('API endpoint is responding');
      return true;
    } else {
      logWarning('API endpoint test failed, but services may still be starting');
      return false;
    }
  } catch (error) {
    logWarning('API endpoint test failed, but services may still be starting');
    return false;
  }
}

function showRecoveryInstructions() {
  log('\n' + '='.repeat(60), 'bold');
  log('Lambda RIE Recovery Complete', 'bold');
  log('='.repeat(60), 'bold');
  
  log('\nNext steps:', 'blue');
  log('1. Test your frontend application at http://localhost:3000');
  log('2. Try making API calls to verify everything works');
  log('3. If issues persist, run: npm run local:reset');
  
  log('\nUseful commands:', 'blue');
  log('• Check status: npm run local:status');
  log('• View logs: npm run local:logs:backend');
  log('• Monitor health: npm run health-check');
  log('• Full reset: npm run local:reset');
  
  log('\nIf Lambda RIE crashes again:', 'yellow');
  log('• Run this script again: npm run fix:lambda-rie');
  log('• Consider using simple proxy: node scripts/simple-proxy.js');
  log('• Report persistent issues - this is a known RIE limitation');
}

function showDiagnosticInfo() {
  log('\n' + '='.repeat(60), 'bold');
  log('Diagnostic Information', 'bold');
  log('='.repeat(60), 'bold');
  
  // Docker info
  log('\nDocker Status:', 'blue');
  execCommand('docker --version', { silent: false });
  execCommand('docker-compose --version', { silent: false });
  
  // Container status
  log('\nContainer Status:', 'blue');
  const statusCmd = buildDockerComposeCommand('ps');
  execCommand(statusCmd.join(' '), { silent: false });
  
  // Memory usage
  log('\nContainer Resource Usage:', 'blue');
  execCommand('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"', { silent: false });
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'fix';
  
  log('Lambda RIE Crash Recovery Tool', 'bold');
  log('================================\n', 'bold');
  
  if (command === 'diagnose') {
    showDiagnosticInfo();
    return;
  }
  
  if (command === 'help') {
    log('Usage: npm run fix:lambda-rie [command]', 'blue');
    log('\nCommands:');
    log('  fix      - Fix Lambda RIE crashes (default)');
    log('  diagnose - Show diagnostic information');
    log('  help     - Show this help message');
    return;
  }
  
  // Check prerequisites
  if (!checkDockerCompose()) {
    process.exit(1);
  }
  
  log('Fixing Lambda RIE segmentation fault...', 'yellow');
  log('This will restart the backend container and API proxy.\n');
  
  let success = true;
  
  // Step 1: Check current status
  const isRunning = checkBackendContainer();
  
  // Step 2: Restart backend container
  if (!restartBackendContainer()) {
    success = false;
  }
  
  // Step 3: Wait for backend health
  if (success) {
    waitForBackendHealth();
  }
  
  // Step 4: Restart proxy
  if (success && !restartProxy()) {
    success = false;
  }
  
  // Step 5: Test API endpoint
  if (success) {
    testApiEndpoint();
  }
  
  // Show results
  if (success) {
    showRecoveryInstructions();
  } else {
    log('\n' + '='.repeat(60), 'red');
    log('Recovery Failed', 'red');
    log('='.repeat(60), 'red');
    log('\nSome steps failed. Try these alternatives:', 'yellow');
    log('1. Full reset: npm run local:reset');
    log('2. Manual restart: docker-compose -f devtools/docker/docker-compose.local.yml restart');
    log('3. Check logs: npm run local:logs:backend');
    log('4. Use simple proxy: node scripts/simple-proxy.js');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkBackendContainer,
  restartBackendContainer,
  waitForBackendHealth,
  restartProxy,
  testApiEndpoint
};