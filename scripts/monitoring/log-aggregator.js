#!/usr/bin/env node

/**
 * Log Aggregator for Local Development Environment
 * Streams and aggregates logs from all Docker containers with filtering and formatting
 */

const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class LogAggregator {
  constructor() {
    this.services = {
      localstack: { color: chalk.blue, prefix: 'LS' },
      backend: { color: chalk.green, prefix: 'BE' },
      frontend: { color: chalk.cyan, prefix: 'FE' },
      'swagger-ui': { color: chalk.magenta, prefix: 'SW' },
      'data-seeder': { color: chalk.yellow, prefix: 'DS' }
    };
    
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || path.join(__dirname, '../logs/aggregated.log');
    this.processes = [];
    
    // Ensure logs directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatLogLine(service, line) {
    const timestamp = this.formatTimestamp();
    const serviceConfig = this.services[service] || { color: chalk.white, prefix: 'UN' };
    const coloredPrefix = serviceConfig.color(`[${serviceConfig.prefix}]`);
    const coloredTimestamp = chalk.gray(timestamp);
    
    return `${coloredTimestamp} ${coloredPrefix} ${line}`;
  }

  writeToFile(service, line) {
    const timestamp = this.formatTimestamp();
    const logEntry = `${timestamp} [${service.toUpperCase()}] ${line}\n`;
    
    fs.appendFile(this.logFile, logEntry, (err) => {
      if (err) {
        console.error(chalk.red(`Failed to write to log file: ${err.message}`));
      }
    });
  }

  shouldLogLevel(line) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel.toLowerCase());
    
    // If no specific level found in line, assume info level
    let lineLevelIndex = 2; // info
    
    for (let i = 0; i < levels.length; i++) {
      if (line.toLowerCase().includes(levels[i])) {
        lineLevelIndex = i;
        break;
      }
    }
    
    return lineLevelIndex <= currentLevelIndex;
  }

  filterLogLine(line) {
    // Filter out noise
    const noisePatterns = [
      /webpack-dev-middleware/,
      /webpack-hot-middleware/,
      /\[HMR\]/,
      /compiled successfully/i,
      /waiting for file changes/i
    ];
    
    return !noisePatterns.some(pattern => pattern.test(line));
  }

  startLogging(services = null) {
    const servicesToLog = services || Object.keys(this.services);
    
    console.log(chalk.bold.green('🔍 Starting log aggregation...'));
    console.log(chalk.gray(`Log level: ${this.logLevel}`));
    console.log(chalk.gray(`Log file: ${this.logFile}`));
    console.log(chalk.gray(`Services: ${servicesToLog.join(', ')}`));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    servicesToLog.forEach(service => {
      const dockerLogs = spawn('docker', ['logs', '-f', `tattoo-directory-${service}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.processes.push(dockerLogs);

      dockerLogs.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          if (this.filterLogLine(line) && this.shouldLogLevel(line)) {
            const formattedLine = this.formatLogLine(service, line);
            console.log(formattedLine);
            this.writeToFile(service, line);
          }
        });
      });

      dockerLogs.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          const formattedLine = this.formatLogLine(service, chalk.red(line));
          console.log(formattedLine);
          this.writeToFile(service, `ERROR: ${line}`);
        });
      });

      dockerLogs.on('error', (error) => {
        console.error(chalk.red(`Failed to start logging for ${service}: ${error.message}`));
      });

      dockerLogs.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.yellow(`Log stream for ${service} ended with code ${code}`));
        }
      });
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping log aggregation...'));
      this.processes.forEach(proc => {
        proc.kill('SIGTERM');
      });
      process.exit(0);
    });
  }

  showHelp() {
    console.log(chalk.bold('Log Aggregator Usage:'));
    console.log('');
    console.log('  node log-aggregator.js [options] [services...]');
    console.log('');
    console.log('Options:');
    console.log('  --level <level>    Set log level (error, warn, info, debug) [default: info]');
    console.log('  --file <path>      Set log file path [default: ../logs/aggregated.log]');
    console.log('  --help             Show this help message');
    console.log('');
    console.log('Services:');
    console.log('  localstack         LocalStack container logs');
    console.log('  backend            Backend Lambda container logs');
    console.log('  frontend           Frontend Next.js container logs');
    console.log('  swagger-ui         Swagger UI container logs');
    console.log('  data-seeder        Data seeder container logs');
    console.log('');
    console.log('Examples:');
    console.log('  node log-aggregator.js                    # All services');
    console.log('  node log-aggregator.js backend frontend   # Specific services');
    console.log('  LOG_LEVEL=debug node log-aggregator.js    # Debug level');
  }
}

// CLI handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  new LogAggregator().showHelp();
  process.exit(0);
}

// Parse arguments
let services = [];
let i = 0;
while (i < args.length) {
  const arg = args[i];
  
  if (arg === '--level') {
    process.env.LOG_LEVEL = args[i + 1];
    i += 2;
  } else if (arg === '--file') {
    process.env.LOG_FILE = args[i + 1];
    i += 2;
  } else if (!arg.startsWith('--')) {
    services.push(arg);
    i++;
  } else {
    i++;
  }
}

const aggregator = new LogAggregator();
aggregator.startLogging(services.length > 0 ? services : null);