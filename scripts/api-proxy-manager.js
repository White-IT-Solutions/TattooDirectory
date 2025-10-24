#!/usr/bin/env node

/**
 * API Proxy Manager
 * Manages the API proxy process for local development
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROXY_PID_FILE = path.join(__dirname, '.api-proxy.pid');
const PROXY_PORT = 9001;

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' 
      ? `netstat -an | findstr :${port}`
      : `lsof -i :${port}`;
    
    exec(cmd, (error, stdout) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

function savePid(pid) {
  fs.writeFileSync(PROXY_PID_FILE, pid.toString());
}

function loadPid() {
  try {
    if (fs.existsSync(PROXY_PID_FILE)) {
      return parseInt(fs.readFileSync(PROXY_PID_FILE, 'utf8'));
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

function removePidFile() {
  try {
    if (fs.existsSync(PROXY_PID_FILE)) {
      fs.unlinkSync(PROXY_PID_FILE);
    }
  } catch (error) {
    // Ignore errors
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

async function startProxy() {
  // Check if already running
  const existingPid = loadPid();
  if (existingPid && isProcessRunning(existingPid)) {
    log('🔄 API Proxy is already running', 'yellow');
    return;
  }

  // Check if port is in use
  if (await isPortInUse(PROXY_PORT)) {
    log(`❌ Port ${PROXY_PORT} is already in use`, 'red');
    return;
  }

  log('🚀 Starting API Proxy...', 'blue');
  
  const proxyScript = path.join(__dirname, 'api-proxy.js');
  const child = spawn('node', [proxyScript], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
  savePid(child.pid);
  
  // Wait a moment to check if it started successfully
  setTimeout(async () => {
    if (await isPortInUse(PROXY_PORT)) {
      log('✅ API Proxy started successfully', 'green');
      log(`📡 Proxy running on http://localhost:${PROXY_PORT}`, 'cyan');
    } else {
      log('❌ Failed to start API Proxy', 'red');
      removePidFile();
    }
  }, 1000);
}

async function stopProxy() {
  const pid = loadPid();
  
  if (!pid) {
    log('🔄 API Proxy is not running', 'yellow');
    return;
  }

  if (!isProcessRunning(pid)) {
    log('🔄 API Proxy process not found', 'yellow');
    removePidFile();
    return;
  }

  try {
    log('🛑 Stopping API Proxy...', 'blue');
    
    if (process.platform === 'win32') {
      // On Windows, kill the process tree
      exec(`taskkill /pid ${pid} /t /f`, (error) => {
        if (!error) {
          log('✅ API Proxy stopped', 'green');
        }
      });
    } else {
      process.kill(pid, 'SIGTERM');
      log('✅ API Proxy stopped', 'green');
    }
    
    removePidFile();
  } catch (error) {
    log(`❌ Failed to stop API Proxy: ${error.message}`, 'red');
  }
}

async function statusProxy() {
  const pid = loadPid();
  const portInUse = await isPortInUse(PROXY_PORT);
  
  if (pid && isProcessRunning(pid) && portInUse) {
    log('✅ API Proxy is running', 'green');
    log(`📡 PID: ${pid}`, 'cyan');
    log(`📡 Port: ${PROXY_PORT}`, 'cyan');
    log(`📡 URL: http://localhost:${PROXY_PORT}`, 'cyan');
  } else {
    log('❌ API Proxy is not running', 'red');
    if (pid && !isProcessRunning(pid)) {
      removePidFile();
    }
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'start':
      await startProxy();
      break;
    case 'stop':
      await stopProxy();
      break;
    case 'restart':
      await stopProxy();
      setTimeout(startProxy, 1000);
      break;
    case 'status':
      await statusProxy();
      break;
    default:
      log('API Proxy Manager', 'blue');
      log('Usage: node api-proxy-manager.js <command>');
      log('');
      log('Commands:');
      log('  start    - Start the API proxy');
      log('  stop     - Stop the API proxy');
      log('  restart  - Restart the API proxy');
      log('  status   - Check proxy status');
  }
}

main().catch(console.error);