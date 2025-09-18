#!/usr/bin/env node

/**
 * Resource Monitor for Tattoo Directory Local Environment
 * 
 * This script monitors Docker container resource usage and system performance
 * to help identify resource bottlenecks and optimization opportunities.
 */

const { execSync } = require('child_process');
const os = require('os');

// Color codes for output
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPercentage(value, total) {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

function getSystemInfo() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory,
    freeMemory,
    usedMemory,
    memoryUsagePercent: formatPercentage(usedMemory, totalMemory),
    loadAverage: os.loadavg()
  };
}

function getDockerStats() {
  try {
    const output = execSync('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.MemPerc}}\\t{{.NetIO}}\\t{{.BlockIO}}"', {
      encoding: 'utf8'
    });
    
    const lines = output.trim().split('\n');
    const headers = lines[0];
    const containers = lines.slice(1).map(line => {
      const parts = line.split('\t');
      return {
        name: parts[0],
        cpu: parts[1],
        memory: parts[2],
        memoryPercent: parts[3],
        network: parts[4],
        blockIO: parts[5]
      };
    });
    
    return { headers, containers };
  } catch (error) {
    return { error: error.message };
  }
}

function getDockerSystemInfo() {
  try {
    const output = execSync('docker system df', { encoding: 'utf8' });
    return output;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function getContainerLogs(containerName, lines = 10) {
  try {
    const output = execSync(`docker logs --tail ${lines} ${containerName}`, {
      encoding: 'utf8'
    });
    return output;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function checkPortUsage() {
  const ports = [3000, 8080, 9000, 4566];
  const results = [];
  
  for (const port of ports) {
    try {
      let command;
      if (os.platform() === 'win32') {
        command = `netstat -ano | findstr :${port}`;
      } else {
        command = `lsof -i :${port} || ss -tulpn | grep :${port}`;
      }
      
      const output = execSync(command, { encoding: 'utf8' });
      results.push({ port, status: 'in use', details: output.trim() });
    } catch (error) {
      results.push({ port, status: 'available', details: '' });
    }
  }
  
  return results;
}

function displaySystemOverview() {
  const system = getSystemInfo();
  
  log('🖥️  System Overview', 'bright');
  log('==================', 'bright');
  log(`Platform: ${system.platform} (${system.arch})`, 'cyan');
  log(`CPU Cores: ${system.cpus}`, 'cyan');
  log(`Total Memory: ${formatBytes(system.totalMemory)}`, 'cyan');
  log(`Used Memory: ${formatBytes(system.usedMemory)} (${system.memoryUsagePercent})`, 'cyan');
  log(`Free Memory: ${formatBytes(system.freeMemory)}`, 'cyan');
  
  if (system.loadAverage && system.loadAverage.length > 0) {
    log(`Load Average: ${system.loadAverage.map(l => l.toFixed(2)).join(', ')}`, 'cyan');
  }
  
  log('', 'reset');
}

function displayDockerStats() {
  const stats = getDockerStats();
  
  log('🐳 Docker Container Stats', 'bright');
  log('=========================', 'bright');
  
  if (stats.error) {
    log(`Error: ${stats.error}`, 'red');
    return;
  }
  
  if (stats.containers.length === 0) {
    log('No containers running', 'yellow');
    return;
  }
  
  // Display headers
  log(stats.headers, 'bright');
  
  // Display container stats
  stats.containers.forEach(container => {
    const cpuPercent = parseFloat(container.cpu.replace('%', ''));
    const memPercent = parseFloat(container.memoryPercent.replace('%', ''));
    
    let color = 'reset';
    if (cpuPercent > 80 || memPercent > 80) {
      color = 'red';
    } else if (cpuPercent > 50 || memPercent > 50) {
      color = 'yellow';
    } else {
      color = 'green';
    }
    
    log(`${container.name}\t${container.cpu}\t${container.memory}\t${container.memoryPercent}\t${container.network}\t${container.blockIO}`, color);
  });
  
  log('', 'reset');
}

function displayPortUsage() {
  const ports = checkPortUsage();
  
  log('🔌 Port Usage', 'bright');
  log('=============', 'bright');
  
  ports.forEach(({ port, status, details }) => {
    const color = status === 'available' ? 'green' : 'yellow';
    log(`Port ${port}: ${status}`, color);
    if (details && status === 'in use') {
      log(`  ${details.split('\n')[0]}`, 'cyan');
    }
  });
  
  log('', 'reset');
}

function displayDockerSystemInfo() {
  log('💾 Docker System Usage', 'bright');
  log('======================', 'bright');
  
  const systemInfo = getDockerSystemInfo();
  log(systemInfo, 'cyan');
}

function displayResourceRecommendations() {
  const system = getSystemInfo();
  const stats = getDockerStats();
  
  log('💡 Resource Recommendations', 'bright');
  log('===========================', 'bright');
  
  // Memory recommendations
  const memoryUsagePercent = parseFloat(system.memoryUsagePercent.replace('%', ''));
  if (memoryUsagePercent > 80) {
    log('⚠️  High memory usage detected', 'yellow');
    log('   Consider closing unnecessary applications', 'cyan');
    log('   Or increase Docker Desktop memory allocation', 'cyan');
  } else if (memoryUsagePercent < 50) {
    log('✅ Memory usage is healthy', 'green');
  }
  
  // Container-specific recommendations
  if (!stats.error && stats.containers.length > 0) {
    stats.containers.forEach(container => {
      const cpuPercent = parseFloat(container.cpu.replace('%', ''));
      const memPercent = parseFloat(container.memoryPercent.replace('%', ''));
      
      if (cpuPercent > 80) {
        log(`⚠️  High CPU usage in ${container.name}`, 'yellow');
        log('   Consider increasing CPU limits or optimizing code', 'cyan');
      }
      
      if (memPercent > 80) {
        log(`⚠️  High memory usage in ${container.name}`, 'yellow');
        log('   Consider increasing memory limits', 'cyan');
      }
    });
  }
  
  // Platform-specific recommendations
  if (system.platform === 'win32') {
    log('🪟 Windows Optimization Tips:', 'blue');
    log('   • Enable WSL2 backend in Docker Desktop', 'cyan');
    log('   • Use WSL2 file system for better performance', 'cyan');
    log('   • Allocate at least 8GB RAM to Docker Desktop', 'cyan');
  } else if (system.platform === 'darwin') {
    log('🍎 macOS Optimization Tips:', 'blue');
    log('   • Use VirtioFS for better file sharing performance', 'cyan');
    log('   • Allocate sufficient memory to Docker Desktop', 'cyan');
    log('   • Consider using delegated volume mounts', 'cyan');
  } else if (system.platform === 'linux') {
    log('🐧 Linux Optimization Tips:', 'blue');
    log('   • Ensure user is in docker group', 'cyan');
    log('   • Use native Docker Engine for best performance', 'cyan');
    log('   • Monitor system resources with htop', 'cyan');
  }
  
  log('', 'reset');
}

function monitorContinuously(interval = 5000) {
  log('🔄 Starting continuous monitoring (Ctrl+C to stop)', 'bright');
  log(`Refresh interval: ${interval / 1000} seconds`, 'cyan');
  log('', 'reset');
  
  const monitor = () => {
    // Clear screen
    console.clear();
    
    // Display current timestamp
    log(`📊 Resource Monitor - ${new Date().toLocaleString()}`, 'bright');
    log('='.repeat(60), 'bright');
    log('', 'reset');
    
    displaySystemOverview();
    displayDockerStats();
    displayPortUsage();
  };
  
  // Initial display
  monitor();
  
  // Set up interval
  const intervalId = setInterval(monitor, interval);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    log('', 'reset');
    log('👋 Monitoring stopped', 'bright');
    process.exit(0);
  });
}

// Main command handler
function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'overview':
      displaySystemOverview();
      break;
      
    case 'docker':
      displayDockerStats();
      break;
      
    case 'ports':
      displayPortUsage();
      break;
      
    case 'system':
      displayDockerSystemInfo();
      break;
      
    case 'recommendations':
      displayResourceRecommendations();
      break;
      
    case 'monitor':
      const interval = parseInt(args[0]) || 5000;
      monitorContinuously(interval);
      break;
      
    case 'full':
      displaySystemOverview();
      displayDockerStats();
      displayPortUsage();
      displayDockerSystemInfo();
      displayResourceRecommendations();
      break;
      
    default:
      log('📊 Resource Monitor for Tattoo Directory', 'bright');
      log('========================================', 'bright');
      log('');
      log('Usage: node resource-monitor.js <command> [options]');
      log('');
      log('Commands:', 'bright');
      log('  overview         Show system overview');
      log('  docker          Show Docker container stats');
      log('  ports           Show port usage');
      log('  system          Show Docker system usage');
      log('  recommendations Show optimization recommendations');
      log('  monitor [ms]    Continuous monitoring (default: 5000ms)');
      log('  full            Show all information');
      log('');
      log('Examples:', 'bright');
      log('  node scripts/resource-monitor.js full');
      log('  node scripts/resource-monitor.js monitor 3000');
      log('  npm run local:monitor');
      break;
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  getSystemInfo,
  getDockerStats,
  checkPortUsage,
  displaySystemOverview,
  displayDockerStats
};