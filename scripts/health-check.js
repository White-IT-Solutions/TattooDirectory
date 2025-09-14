#!/usr/bin/env node

/**
 * Health Check Script for Local Development Environment
 * Verifies that all services are running and responding correctly
 */

const axios = require('axios');
const { execSync } = require('child_process');

// Service configuration
const services = [
  {
    name: 'LocalStack',
    url: 'http://localhost:4566/_localstack/health',
    timeout: 10000,
    critical: true,
    description: 'AWS services simulation'
  },
  {
    name: 'Backend API',
    url: 'http://localhost:9000/2015-03-31/functions/function/invocations',
    timeout: 5000,
    critical: true,
    description: 'Lambda Runtime Interface Emulator',
    method: 'POST',
    data: {
      httpMethod: 'GET',
      path: '/health',
      headers: {}
    }
  },
  {
    name: 'Frontend',
    url: 'http://localhost:3000',
    timeout: 5000,
    critical: true,
    description: 'Next.js development server'
  },
  {
    name: 'Swagger UI',
    url: 'http://localhost:8080',
    timeout: 5000,
    critical: false,
    description: 'API documentation interface'
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log(colorize('\n🔍 Health Check Report', 'cyan'));
  console.log(colorize('='.repeat(50), 'cyan'));
}

function printServiceStatus(service, status, responseTime, error = null) {
  const statusIcon = status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  const statusColor = status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red';
  
  console.log(`${statusIcon} ${colorize(service.name.padEnd(15), statusColor)} ${service.description}`);
  
  if (responseTime) {
    console.log(`   ${colorize(`Response time: ${responseTime}ms`, 'blue')}`);
  }
  
  if (error) {
    console.log(`   ${colorize(`Error: ${error}`, 'red')}`);
  }
  
  console.log(`   ${colorize(`URL: ${service.url}`, 'blue')}`);
  console.log('');
}

async function checkService(service) {
  const startTime = Date.now();
  
  try {
    const config = {
      timeout: service.timeout,
      method: service.method || 'GET',
      validateStatus: (status) => status < 500 // Accept 4xx as "healthy" but not 5xx
    };
    
    if (service.data) {
      config.data = service.data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(service.url, config);
    const responseTime = Date.now() - startTime;
    
    if (response.status >= 200 && response.status < 400) {
      return { status: 'healthy', responseTime };
    } else if (response.status >= 400 && response.status < 500) {
      return { status: 'warning', responseTime, error: `HTTP ${response.status}` };
    } else {
      return { status: 'unhealthy', responseTime, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error.code === 'ECONNREFUSED') {
      return { status: 'unhealthy', responseTime, error: 'Connection refused - service not running' };
    } else if (error.code === 'ETIMEDOUT') {
      return { status: 'unhealthy', responseTime, error: 'Request timeout' };
    } else {
      return { status: 'unhealthy', responseTime, error: error.message };
    }
  }
}

async function checkDockerContainers() {
  try {
    const output = execSync('docker-compose -f dev-tools/docker/docker-compose.local.yml ps --format json', { encoding: 'utf8' });
    const containers = output.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
    
    console.log(colorize('📦 Docker Container Status', 'cyan'));
    console.log(colorize('-'.repeat(30), 'cyan'));
    
    let allHealthy = true;
    
    containers.forEach(container => {
      const isHealthy = container.State === 'running';
      const statusIcon = isHealthy ? '✅' : '❌';
      const statusColor = isHealthy ? 'green' : 'red';
      
      console.log(`${statusIcon} ${colorize(container.Service.padEnd(15), statusColor)} ${container.State}`);
      
      if (!isHealthy) {
        allHealthy = false;
      }
    });
    
    console.log('');
    return allHealthy;
  } catch (error) {
    console.log(colorize('❌ Failed to check Docker containers', 'red'));
    console.log(colorize(`   Error: ${error.message}`, 'red'));
    console.log('');
    return false;
  }
}

async function checkLocalStackServices() {
  try {
    const response = await axios.get('http://localhost:4566/_localstack/health', { timeout: 5000 });
    const services = response.data.services || {};
    
    console.log(colorize('☁️  LocalStack Services', 'cyan'));
    console.log(colorize('-'.repeat(25), 'cyan'));
    
    let allHealthy = true;
    
    Object.entries(services).forEach(([serviceName, status]) => {
      const isHealthy = status === 'available' || status === 'running';
      const statusIcon = isHealthy ? '✅' : '❌';
      const statusColor = isHealthy ? 'green' : 'red';
      
      console.log(`${statusIcon} ${colorize(serviceName.padEnd(15), statusColor)} ${status}`);
      
      if (!isHealthy) {
        allHealthy = false;
      }
    });
    
    console.log('');
    return allHealthy;
  } catch (error) {
    console.log(colorize('❌ Failed to check LocalStack services', 'red'));
    console.log(colorize(`   Error: ${error.message}`, 'red'));
    console.log('');
    return false;
  }
}

async function main() {
  printHeader();
  
  // Check Docker containers first
  const dockerHealthy = await checkDockerContainers();
  
  // Check LocalStack services
  const localStackHealthy = await checkLocalStackServices();
  
  // Check individual service endpoints
  console.log(colorize('🌐 Service Endpoints', 'cyan'));
  console.log(colorize('-'.repeat(20), 'cyan'));
  
  let healthyCount = 0;
  let criticalIssues = 0;
  
  for (const service of services) {
    const result = await checkService(service);
    printServiceStatus(service, result.status, result.responseTime, result.error);
    
    if (result.status === 'healthy') {
      healthyCount++;
    } else if (service.critical && result.status === 'unhealthy') {
      criticalIssues++;
    }
  }
  
  // Summary
  console.log(colorize('📊 Summary', 'cyan'));
  console.log(colorize('-'.repeat(10), 'cyan'));
  console.log(`Services healthy: ${colorize(`${healthyCount}/${services.length}`, healthyCount === services.length ? 'green' : 'yellow')}`);
  console.log(`Critical issues: ${colorize(criticalIssues, criticalIssues === 0 ? 'green' : 'red')}`);
  
  if (dockerHealthy && localStackHealthy && criticalIssues === 0) {
    console.log(colorize('\n🎉 All systems operational!', 'green'));
    process.exit(0);
  } else {
    console.log(colorize('\n⚠️  Some issues detected. Check the details above.', 'yellow'));
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Health Check Script for Tattoo Directory Local Environment

Usage: node scripts/health-check.js [options]

Options:
  --help, -h     Show this help message
  --quiet, -q    Only show summary (minimal output)
  --json         Output results in JSON format

Examples:
  node scripts/health-check.js           # Full health check
  node scripts/health-check.js --quiet   # Minimal output
  node scripts/health-check.js --json    # JSON output
`);
  process.exit(0);
}

// Run the health check
main().catch(error => {
  console.error(colorize(`\n❌ Health check failed: ${error.message}`, 'red'));
  process.exit(1);
});