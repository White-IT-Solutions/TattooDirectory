#!/usr/bin/env node

/**
 * Development Utilities for Tattoo Directory Local Environment
 * Provides various development and debugging utilities
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log(colorize(`\n🔧 ${title}`, colors.cyan));
  console.log(colorize('='.repeat(50), colors.cyan));
}

// Utility functions
const utils = {
  
  // Check if environment is running
  async checkEnvironment() {
    printHeader('Environment Status Check');
    
    try {
      const output = execSync('docker-compose -f devtools/docker/docker-compose.local.yml ps --format json', { encoding: 'utf8' });
      const containers = output.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
      
      if (containers.length === 0) {
        console.log(colorize('❌ No containers running', colors.red));
        return false;
      }
      
      let allRunning = true;
      containers.forEach(container => {
        const isRunning = container.State === 'running';
        const statusIcon = isRunning ? '✅' : '❌';
        const statusColor = isRunning ? colors.green : colors.red;
        
        console.log(`${statusIcon} ${colorize(container.Service.padEnd(15), statusColor)} ${container.State}`);
        
        if (!isRunning) {
          allRunning = false;
        }
      });
      
      return allRunning;
    } catch (error) {
      console.log(colorize('❌ Failed to check environment status', colors.red));
      return false;
    }
  },
  
  // Reset LocalStack data
  async resetLocalStack() {
    printHeader('Resetting LocalStack Data');
    
    try {
      console.log('🔄 Restarting LocalStack container...');
      execSync('docker-compose -f devtools/docker/docker-compose.local.yml restart localstack', { stdio: 'inherit' });
      
      console.log('⏳ Waiting for LocalStack to initialize...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      console.log('🌱 Re-seeding test data...');
      execSync('docker-compose -f devtools/docker/docker-compose.local.yml run --rm data-seeder', { stdio: 'inherit' });
      
      console.log(colorize('✅ LocalStack reset complete', colors.green));
    } catch (error) {
      console.log(colorize(`❌ Failed to reset LocalStack: ${error.message}`, colors.red));
    }
  },
  
  // Show resource usage
  async showResourceUsage() {
    printHeader('Resource Usage');
    
    try {
      console.log('📊 Docker system information:');
      execSync('docker system df', { stdio: 'inherit' });
      
      console.log('\n📈 Container resource usage:');
      execSync('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}\\t{{.BlockIO}}"', { stdio: 'inherit' });
      
    } catch (error) {
      console.log(colorize(`❌ Failed to get resource usage: ${error.message}`, colors.red));
    }
  },
  
  // Test API endpoints
  async testEndpoints() {
    printHeader('API Endpoint Testing');
    
    const endpoints = [
      {
        name: 'Health Check',
        method: 'POST',
        url: 'http://localhost:9000/2015-03-31/functions/function/invocations',
        data: {
          httpMethod: 'GET',
          path: '/health',
          headers: {}
        }
      },
      {
        name: 'List Artists',
        method: 'POST',
        url: 'http://localhost:9000/2015-03-31/functions/function/invocations',
        data: {
          httpMethod: 'GET',
          path: '/v1/artists',
          queryStringParameters: { limit: '5' },
          headers: {}
        }
      },
      {
        name: 'Search Artists',
        method: 'POST',
        url: 'http://localhost:9000/2015-03-31/functions/function/invocations',
        data: {
          httpMethod: 'GET',
          path: '/v1/artists/search',
          queryStringParameters: { 
            style: 'traditional',
            limit: '3'
          },
          headers: {}
        }
      }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing ${endpoint.name}...`);
        const startTime = Date.now();
        
        const response = await axios({
          method: endpoint.method,
          url: endpoint.url,
          data: endpoint.data,
          timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.status >= 200 && response.status < 300) {
          console.log(colorize(`✅ ${endpoint.name} - ${response.status} (${responseTime}ms)`, colors.green));
          
          // Show response preview
          if (response.data && typeof response.data === 'object') {
            const preview = JSON.stringify(response.data, null, 2).substring(0, 200);
            console.log(colorize(`   Response: ${preview}${preview.length >= 200 ? '...' : ''}`, colors.blue));
          }
        } else {
          console.log(colorize(`⚠️  ${endpoint.name} - ${response.status} (${responseTime}ms)`, colors.yellow));
        }
        
      } catch (error) {
        console.log(colorize(`❌ ${endpoint.name} - ${error.message}`, colors.red));
      }
      
      console.log(''); // Empty line for readability
    }
  },
  
  // Show environment URLs
  showUrls() {
    printHeader('Environment URLs');
    
    const urls = [
      { name: 'Frontend (Next.js)', url: 'http://localhost:3000', description: 'Main application' },
      { name: 'API Documentation', url: 'http://localhost:8080', description: 'Swagger UI' },
      { name: 'Backend API', url: 'http://localhost:9000', description: 'Lambda RIE' },
      { name: 'LocalStack', url: 'http://localhost:4566', description: 'AWS services' },
    ];
    
    urls.forEach(item => {
      console.log(`🌐 ${colorize(item.name.padEnd(20), colors.green)} ${item.url}`);
      console.log(`   ${colorize(item.description, colors.blue)}`);
      console.log('');
    });
  },
  
  // Clean up Docker resources
  async cleanup() {
    printHeader('Docker Cleanup');
    
    try {
      console.log('🧹 Removing stopped containers...');
      execSync('docker container prune -f', { stdio: 'inherit' });
      
      console.log('🧹 Removing unused networks...');
      execSync('docker network prune -f', { stdio: 'inherit' });
      
      console.log('🧹 Removing unused images...');
      execSync('docker image prune -f', { stdio: 'inherit' });
      
      console.log('🧹 Removing unused volumes...');
      execSync('docker volume prune -f', { stdio: 'inherit' });
      
      console.log(colorize('✅ Cleanup complete', colors.green));
      
    } catch (error) {
      console.log(colorize(`❌ Cleanup failed: ${error.message}`, colors.red));
    }
  },
  
  // Generate development report
  async generateReport() {
    printHeader('Development Environment Report');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {},
      services: {},
      resources: {},
      endpoints: {}
    };
    
    // Environment status
    report.environment.running = await this.checkEnvironment();
    
    // Docker info
    try {
      const dockerInfo = execSync('docker info --format json', { encoding: 'utf8' });
      const info = JSON.parse(dockerInfo);
      report.environment.docker = {
        version: info.ServerVersion,
        containers: info.Containers,
        images: info.Images
      };
    } catch (error) {
      report.environment.docker = { error: error.message };
    }
    
    // Service status
    try {
      const output = execSync('docker-compose -f docker-compose.local.yml ps --format json', { encoding: 'utf8' });
      const containers = output.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
      
      containers.forEach(container => {
        report.services[container.Service] = {
          state: container.State,
          status: container.Status,
          ports: container.Publishers || []
        };
      });
    } catch (error) {
      report.services.error = error.message;
    }
    
    // Save report
    const reportPath = path.join(process.cwd(), 'dev-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(colorize(`📊 Report saved to: ${reportPath}`, colors.green));
    console.log(colorize('📋 Report summary:', colors.blue));
    console.log(`   Environment running: ${report.environment.running ? '✅' : '❌'}`);
    console.log(`   Services: ${Object.keys(report.services).length}`);
    console.log(`   Docker version: ${report.environment.docker.version || 'Unknown'}`);
  }
};

// Command line interface
function showHelp() {
  console.log(`
Development Utilities for Tattoo Directory Local Environment

Usage: node scripts/dev-utils.js <command> [options]

Commands:
  status          Check environment status
  reset           Reset LocalStack data and re-seed
  resources       Show Docker resource usage
  test            Test API endpoints
  urls            Show all environment URLs
  cleanup         Clean up unused Docker resources
  report          Generate development environment report
  help            Show this help message

Examples:
  node scripts/dev-utils.js status
  node scripts/dev-utils.js test
  node scripts/dev-utils.js cleanup
  node scripts/dev-utils.js report
`);
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'status':
      await utils.checkEnvironment();
      break;
    
    case 'reset':
      await utils.resetLocalStack();
      break;
    
    case 'resources':
      await utils.showResourceUsage();
      break;
    
    case 'test':
      await utils.testEndpoints();
      break;
    
    case 'urls':
      utils.showUrls();
      break;
    
    case 'cleanup':
      await utils.cleanup();
      break;
    
    case 'report':
      await utils.generateReport();
      break;
    
    default:
      console.log(colorize(`❌ Unknown command: ${command}`, colors.red));
      console.log('Use "help" to see available commands');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`❌ Error: ${error.message}`, colors.red));
    process.exit(1);
  });
}

module.exports = utils;
