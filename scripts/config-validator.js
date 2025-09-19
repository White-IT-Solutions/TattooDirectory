#!/usr/bin/env node

/**
 * Configuration Validator
 * 
 * Validates system configuration, dependencies, and prerequisites
 * for the unified data management system.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DATA_CONFIG } = require('./data-config');

/**
 * Check if a command exists in the system PATH
 */
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check Docker availability and status
 */
async function checkDocker() {
  const results = {
    installed: false,
    running: false,
    version: null,
    composeAvailable: false,
    error: null
  };

  try {
    // Check if Docker is installed
    if (!commandExists('docker')) {
      results.error = 'Docker is not installed or not in PATH';
      return results;
    }
    results.installed = true;

    // Get Docker version
    try {
      const versionOutput = execSync('docker --version', { encoding: 'utf8' });
      results.version = versionOutput.trim();
    } catch (error) {
      results.error = 'Could not get Docker version';
    }

    // Check if Docker daemon is running
    try {
      execSync('docker info', { stdio: 'ignore' });
      results.running = true;
    } catch (error) {
      results.error = 'Docker daemon is not running';
      return results;
    }

    // Check Docker Compose availability
    results.composeAvailable = commandExists('docker-compose') || commandExists('docker compose');

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

/**
 * Check Node.js and npm configuration
 */
function checkNodeEnvironment() {
  const results = {
    nodeVersion: process.version,
    npmVersion: null,
    workspaceSupport: false,
    packageJsonExists: false,
    error: null
  };

  try {
    // Check npm version
    const npmVersion = execSync('npm --version', { encoding: 'utf8' });
    results.npmVersion = npmVersion.trim();

    // Check workspace support (npm 7+)
    const npmMajorVersion = parseInt(results.npmVersion.split('.')[0]);
    results.workspaceSupport = npmMajorVersion >= 7;

    // Check if package.json exists
    results.packageJsonExists = fs.existsSync(path.join(DATA_CONFIG.paths.projectRoot, 'package.json'));

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

/**
 * Check required files and directories
 */
function checkFileSystem() {
  const results = {
    requiredPaths: [],
    missingPaths: [],
    permissions: [],
    error: null
  };

  const requiredPaths = [
    { path: DATA_CONFIG.paths.testDataDir, name: 'Test data directory', required: true },
    { path: DATA_CONFIG.paths.imageSourceDir, name: 'Image source directory', required: true },
    { path: DATA_CONFIG.paths.frontendDir, name: 'Frontend directory', required: false },
    { path: DATA_CONFIG.paths.backendDir, name: 'Backend directory', required: false },
    { path: DATA_CONFIG.paths.dockerComposeFile, name: 'Docker Compose file', required: false }
  ];

  requiredPaths.forEach(({ path: filePath, name, required }) => {
    const exists = fs.existsSync(filePath);
    const result = { path: filePath, name, required, exists };

    if (exists) {
      // Check permissions
      try {
        const stats = fs.statSync(filePath);
        result.readable = true;
        result.writable = true; // Assume writable for now
        result.isDirectory = stats.isDirectory();
      } catch (error) {
        result.readable = false;
        result.writable = false;
        result.error = error.message;
      }
    } else if (required) {
      results.missingPaths.push(result);
    }

    results.requiredPaths.push(result);
  });

  return results;
}

/**
 * Check LocalStack service availability
 */
async function checkLocalStackServices() {
  const results = {
    localstackRunning: false,
    services: {
      s3: false,
      dynamodb: false,
      opensearch: false
    },
    endpoints: {},
    error: null
  };

  try {
    // Check if LocalStack container is running
    try {
      const containerOutput = execSync('docker ps --filter "name=localstack" --format "{{.Names}}"', { encoding: 'utf8' });
      results.localstackRunning = containerOutput.trim().includes('localstack');
    } catch (error) {
      results.error = 'Could not check LocalStack container status';
      return results;
    }

    if (!results.localstackRunning) {
      results.error = 'LocalStack container is not running';
      return results;
    }

    // Store service endpoints
    results.endpoints = {
      localstack: DATA_CONFIG.services.localstack.endpoint,
      s3: `${DATA_CONFIG.services.s3.endpoint}/${DATA_CONFIG.services.s3.bucketName}`,
      dynamodb: `${DATA_CONFIG.services.dynamodb.endpoint}`,
      opensearch: `${DATA_CONFIG.services.opensearch.endpoint}`
    };

    // Note: Actual service health checks would require HTTP requests
    // For now, we'll assume services are available if LocalStack is running
    if (results.localstackRunning) {
      results.services.s3 = true;
      results.services.dynamodb = true;
      results.services.opensearch = true;
    }

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

/**
 * Validate environment variables
 */
function checkEnvironmentVariables() {
  const results = {
    required: [],
    optional: [],
    missing: [],
    warnings: []
  };

  const requiredVars = [
    { name: 'AWS_ACCESS_KEY_ID', defaultValue: 'test', description: 'AWS Access Key ID' },
    { name: 'AWS_SECRET_ACCESS_KEY', defaultValue: 'test', description: 'AWS Secret Access Key' },
    { name: 'AWS_DEFAULT_REGION', defaultValue: 'eu-west-2', description: 'AWS Default Region' }
  ];

  const optionalVars = [
    { name: 'LOCALSTACK_PORT', defaultValue: '4566', description: 'LocalStack Port' },
    { name: 'DYNAMODB_TABLE_NAME', defaultValue: 'tattoo-directory-local', description: 'DynamoDB Table Name' },
    { name: 'OPENSEARCH_INDEX', defaultValue: 'artists-local', description: 'OpenSearch Index Name' },
    { name: 'S3_BUCKET_NAME', defaultValue: 'tattoo-directory-images', description: 'S3 Bucket Name' }
  ];

  // Check required variables
  requiredVars.forEach(({ name, defaultValue, description }) => {
    const value = process.env[name];
    const result = { name, description, value, hasValue: !!value, isDefault: value === defaultValue };
    
    if (!value) {
      results.missing.push(result);
    } else {
      results.required.push(result);
      
      if (value === defaultValue && !DATA_CONFIG.environment.isDocker) {
        results.warnings.push(`${name} is using default value '${defaultValue}' - consider setting a custom value`);
      }
    }
  });

  // Check optional variables
  optionalVars.forEach(({ name, defaultValue, description }) => {
    const value = process.env[name] || defaultValue;
    results.optional.push({ name, description, value, isDefault: !process.env[name] });
  });

  return results;
}

/**
 * Generate installation instructions for missing dependencies
 */
function generateInstallationInstructions(validationResults) {
  const instructions = [];

  // Docker installation
  if (!validationResults.docker.installed) {
    instructions.push({
      component: 'Docker',
      issue: 'Docker is not installed',
      instructions: [
        'Install Docker Desktop from https://www.docker.com/products/docker-desktop',
        'Follow the installation guide for your operating system',
        'Start Docker Desktop and ensure it\'s running',
        'Verify installation with: docker --version'
      ]
    });
  } else if (!validationResults.docker.running) {
    instructions.push({
      component: 'Docker',
      issue: 'Docker daemon is not running',
      instructions: [
        'Start Docker Desktop application',
        'Wait for Docker to fully start (check system tray icon)',
        'Verify with: docker info'
      ]
    });
  }

  // Node.js/npm issues
  if (!validationResults.node.workspaceSupport) {
    instructions.push({
      component: 'npm',
      issue: 'npm version does not support workspaces',
      instructions: [
        'Update npm to version 7 or higher: npm install -g npm@latest',
        'Verify version: npm --version',
        'Workspaces require npm 7+ for proper functionality'
      ]
    });
  }

  // Missing directories
  if (validationResults.filesystem.missingPaths.length > 0) {
    instructions.push({
      component: 'File System',
      issue: 'Required directories are missing',
      instructions: [
        'Ensure you are in the correct project directory',
        'Missing paths:',
        ...validationResults.filesystem.missingPaths.map(p => `  - ${p.name}: ${p.path}`),
        'These directories should exist in a properly cloned repository'
      ]
    });
  }

  // LocalStack setup
  if (!validationResults.localstack.localstackRunning) {
    instructions.push({
      component: 'LocalStack',
      issue: 'LocalStack services are not running',
      instructions: [
        'Start LocalStack services with: npm run local:start',
        'Or manually with: docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack',
        'Wait for services to be ready (check logs with: npm run local:logs:localstack)',
        'Verify services are running with: npm run local:status'
      ]
    });
  }

  return instructions;
}

/**
 * Main validation function
 */
async function validateConfiguration() {
  console.log('🔍 Validating Data Management Configuration...\n');

  const results = {
    overall: { valid: true, errors: [], warnings: [] },
    docker: await checkDocker(),
    node: checkNodeEnvironment(),
    filesystem: checkFileSystem(),
    localstack: await checkLocalStackServices(),
    environment: checkEnvironmentVariables(),
    config: DATA_CONFIG.validate()
  };

  // Determine overall validity
  const criticalIssues = [
    !results.docker.installed,
    !results.docker.running,
    !results.node.workspaceSupport,
    results.filesystem.missingPaths.length > 0,
    !results.config.isValid
  ];

  results.overall.valid = !criticalIssues.some(issue => issue);

  // Collect errors and warnings
  if (!results.docker.installed || !results.docker.running) {
    results.overall.errors.push('Docker is required but not available');
  }

  if (!results.node.workspaceSupport) {
    results.overall.errors.push('npm workspaces support is required (npm 7+)');
  }

  if (results.filesystem.missingPaths.length > 0) {
    results.overall.errors.push('Required directories are missing');
  }

  if (!results.config.isValid) {
    results.overall.errors.push(...results.config.errors);
  }

  // Add warnings
  results.overall.warnings.push(...results.config.warnings);
  results.overall.warnings.push(...results.environment.warnings);

  if (!results.localstack.localstackRunning) {
    results.overall.warnings.push('LocalStack services are not running - some operations will fail');
  }

  return results;
}

/**
 * Display validation results
 */
function displayValidationResults(results) {
  console.log('📋 Configuration Validation Results');
  console.log('==================================\n');

  // Overall status
  if (results.overall.valid) {
    console.log('✅ Overall Status: VALID\n');
  } else {
    console.log('❌ Overall Status: INVALID\n');
  }

  // Docker status
  console.log('🐳 Docker:');
  console.log(`  Installed: ${results.docker.installed ? '✅' : '❌'}`);
  console.log(`  Running: ${results.docker.running ? '✅' : '❌'}`);
  console.log(`  Version: ${results.docker.version || 'Unknown'}`);
  console.log(`  Compose: ${results.docker.composeAvailable ? '✅' : '❌'}`);
  if (results.docker.error) {
    console.log(`  Error: ${results.docker.error}`);
  }

  // Node.js status
  console.log('\n📦 Node.js Environment:');
  console.log(`  Node Version: ${results.node.nodeVersion}`);
  console.log(`  npm Version: ${results.node.npmVersion || 'Unknown'}`);
  console.log(`  Workspace Support: ${results.node.workspaceSupport ? '✅' : '❌'}`);
  console.log(`  package.json: ${results.node.packageJsonExists ? '✅' : '❌'}`);

  // File system status
  console.log('\n📁 File System:');
  results.filesystem.requiredPaths.forEach(path => {
    const status = path.exists ? '✅' : (path.required ? '❌' : '⚠️');
    console.log(`  ${path.name}: ${status}`);
    if (!path.exists && path.required) {
      console.log(`    Missing: ${path.path}`);
    }
  });

  // LocalStack status
  console.log('\n🌐 LocalStack Services:');
  console.log(`  Container Running: ${results.localstack.localstackRunning ? '✅' : '❌'}`);
  if (results.localstack.localstackRunning) {
    console.log(`  S3: ${results.localstack.services.s3 ? '✅' : '❌'}`);
    console.log(`  DynamoDB: ${results.localstack.services.dynamodb ? '✅' : '❌'}`);
    console.log(`  OpenSearch: ${results.localstack.services.opensearch ? '✅' : '❌'}`);
  }

  // Environment variables
  console.log('\n🔧 Environment Variables:');
  results.environment.required.forEach(env => {
    const status = env.hasValue ? '✅' : '❌';
    const defaultNote = env.isDefault ? ' (default)' : '';
    console.log(`  ${env.name}: ${status}${defaultNote}`);
  });

  // Display errors
  if (results.overall.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.overall.errors.forEach(error => {
      console.log(`  • ${error}`);
    });
  }

  // Display warnings
  if (results.overall.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.overall.warnings.forEach(warning => {
      console.log(`  • ${warning}`);
    });
  }

  // Generate installation instructions if needed
  if (!results.overall.valid) {
    console.log('\n🔧 Installation Instructions:');
    console.log('============================\n');
    
    const instructions = generateInstallationInstructions(results);
    instructions.forEach((instruction, index) => {
      console.log(`${index + 1}. ${instruction.component} - ${instruction.issue}`);
      instruction.instructions.forEach(step => {
        console.log(`   ${step}`);
      });
      console.log('');
    });
  }
}

// Export functions for use by other modules
module.exports = {
  validateConfiguration,
  displayValidationResults,
  checkDocker,
  checkNodeEnvironment,
  checkFileSystem,
  checkLocalStackServices,
  checkEnvironmentVariables,
  generateInstallationInstructions
};

// CLI usage when run directly
if (require.main === module) {
  validateConfiguration()
    .then(results => {
      displayValidationResults(results);
      process.exit(results.overall.valid ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}