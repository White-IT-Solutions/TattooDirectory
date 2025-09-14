#!/usr/bin/env node

/**
 * Log Aggregation and Viewing Utility
 * Provides enhanced log viewing capabilities for the local development environment
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for different log levels and services
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Service color mapping
const serviceColors = {
  'localstack': colors.cyan,
  'backend': colors.green,
  'frontend': colors.blue,
  'swagger-ui': colors.magenta,
  'data-seeder': colors.yellow
};

// Log level color mapping
const levelColors = {
  'ERROR': colors.red,
  'WARN': colors.yellow,
  'INFO': colors.green,
  'DEBUG': colors.blue,
  'TRACE': colors.white
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return colorize(date.toISOString().substring(11, 23), colors.white);
}

function formatService(service) {
  const color = serviceColors[service] || colors.white;
  return colorize(`[${service.toUpperCase().padEnd(10)}]`, color);
}

function formatLogLevel(level) {
  const color = levelColors[level] || colors.white;
  return colorize(`[${level.padEnd(5)}]`, color);
}

function parseLogLine(line) {
  // Try to parse structured JSON logs
  try {
    const parsed = JSON.parse(line);
    return {
      timestamp: parsed.timestamp || parsed.time || new Date().toISOString(),
      level: parsed.level || parsed.severity || 'INFO',
      service: parsed.service || 'unknown',
      message: parsed.message || parsed.msg || line,
      structured: true
    };
  } catch (e) {
    // Fallback to plain text parsing
    const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
    const levelMatch = line.match(/\b(ERROR|WARN|INFO|DEBUG|TRACE)\b/i);
    
    return {
      timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
      level: levelMatch ? levelMatch[1].toUpperCase() : 'INFO',
      service: 'unknown',
      message: line,
      structured: false
    };
  }
}

function formatLogLine(logData, options = {}) {
  const parts = [];
  
  if (options.showTimestamp !== false) {
    parts.push(formatTimestamp(logData.timestamp));
  }
  
  if (options.showService !== false) {
    parts.push(formatService(logData.service));
  }
  
  if (options.showLevel !== false) {
    parts.push(formatLogLevel(logData.level));
  }
  
  parts.push(logData.message);
  
  return parts.join(' ');
}

function createLogFilter(options) {
  return (logData) => {
    // Filter by service
    if (options.service && !options.service.includes(logData.service)) {
      return false;
    }
    
    // Filter by log level
    if (options.level) {
      const levels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];
      const minLevelIndex = levels.indexOf(options.level.toUpperCase());
      const currentLevelIndex = levels.indexOf(logData.level);
      
      if (minLevelIndex !== -1 && currentLevelIndex !== -1 && currentLevelIndex < minLevelIndex) {
        return false;
      }
    }
    
    // Filter by keyword
    if (options.grep && !logData.message.toLowerCase().includes(options.grep.toLowerCase())) {
      return false;
    }
    
    return true;
  };
}

function startLogViewer(options = {}) {
  const composeFile = path.join(process.cwd(), 'dev-tools/docker/docker-compose.local.yml');
  
  if (!fs.existsSync(composeFile)) {
    console.error(colorize('❌ dev-tools/docker/docker-compose.local.yml not found', colors.red));
    process.exit(1);
  }
  
  const args = ['-f', composeFile, 'logs'];
  
  if (options.follow) {
    args.push('-f');
  }
  
  if (options.tail) {
    args.push('--tail', options.tail.toString());
  }
  
  if (options.service && options.service.length > 0) {
    args.push(...options.service);
  }
  
  console.log(colorize('📋 Starting log viewer...', colors.cyan));
  console.log(colorize(`Command: docker-compose ${args.join(' ')}`, colors.blue));
  console.log(colorize('Press Ctrl+C to exit\n', colors.yellow));
  
  const logProcess = spawn('docker-compose', args, {
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  const filter = createLogFilter(options);
  
  logProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Extract service name from docker-compose log format
      const serviceMatch = line.match(/^([a-zA-Z0-9_-]+)\s*\|\s*(.+)$/);
      let serviceName = 'unknown';
      let logContent = line;
      
      if (serviceMatch) {
        serviceName = serviceMatch[1];
        logContent = serviceMatch[2];
      }
      
      const logData = parseLogLine(logContent);
      logData.service = serviceName;
      
      if (filter(logData)) {
        console.log(formatLogLine(logData, options));
      }
    });
  });
  
  logProcess.stderr.on('data', (data) => {
    console.error(colorize(data.toString(), colors.red));
  });
  
  logProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(colorize(`\n❌ Log viewer exited with code ${code}`, colors.red));
    } else {
      console.log(colorize('\n📋 Log viewer stopped', colors.cyan));
    }
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log(colorize('\n📋 Stopping log viewer...', colors.cyan));
    logProcess.kill('SIGTERM');
  });
}

function showHelp() {
  console.log(`
Log Viewer for Tattoo Directory Local Environment

Usage: node scripts/log-viewer.js [options] [services...]

Options:
  --follow, -f           Follow log output (like tail -f)
  --tail <n>             Show last n lines for each service
  --level <level>        Filter by minimum log level (TRACE, DEBUG, INFO, WARN, ERROR)
  --grep <pattern>       Filter logs containing pattern
  --no-timestamp         Hide timestamps
  --no-service           Hide service names
  --no-level             Hide log levels
  --help, -h             Show this help message

Services:
  localstack             LocalStack AWS simulation
  backend                Backend Lambda functions
  frontend               Next.js frontend
  swagger-ui             API documentation
  data-seeder            Test data seeding

Examples:
  node scripts/log-viewer.js                           # View all logs
  node scripts/log-viewer.js --follow                  # Follow all logs
  node scripts/log-viewer.js backend frontend          # View specific services
  node scripts/log-viewer.js --level ERROR             # Show only errors and above
  node scripts/log-viewer.js --grep "search"           # Filter logs containing "search"
  node scripts/log-viewer.js --tail 100 --follow       # Show last 100 lines and follow
`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    follow: false,
    tail: null,
    level: null,
    grep: null,
    showTimestamp: true,
    showService: true,
    showLevel: true,
    service: []
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      
      case '--follow':
      case '-f':
        options.follow = true;
        break;
      
      case '--tail':
        options.tail = parseInt(args[++i]);
        break;
      
      case '--level':
        options.level = args[++i];
        break;
      
      case '--grep':
        options.grep = args[++i];
        break;
      
      case '--no-timestamp':
        options.showTimestamp = false;
        break;
      
      case '--no-service':
        options.showService = false;
        break;
      
      case '--no-level':
        options.showLevel = false;
        break;
      
      default:
        if (!arg.startsWith('--')) {
          options.service.push(arg);
        } else {
          console.error(colorize(`Unknown option: ${arg}`, colors.red));
          process.exit(1);
        }
        break;
    }
  }
  
  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  startLogViewer(options);
}

module.exports = {
  startLogViewer,
  parseLogLine,
  formatLogLine,
  createLogFilter
};