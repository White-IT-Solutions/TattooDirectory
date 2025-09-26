#!/usr/bin/env node

/**
 * E2E Test Runner
 * Main entry point for running E2E tests with proper setup and cleanup
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class E2ETestRunner {
  constructor() {
    this.config = {
      frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
      backend: process.env.BACKEND_URL || 'http://localhost:9000',
      localstack: process.env.LOCALSTACK_URL || 'http://localhost:4566'
    };
  }

  async checkServices() {
    console.log('🔍 Checking if services are ready...');
    
    const services = [
      { name: 'Frontend', url: this.config.frontend },
      { name: 'Backend', url: `${this.config.backend}/2015-03-31/functions/function/invocations` },
      { name: 'LocalStack', url: `${this.config.localstack}/_localstack/health` }
    ];

    for (const service of services) {
      let retries = 10;
      let ready = false;
      
      while (retries > 0 && !ready) {
        try {
          const response = await axios.get(service.url, { 
            timeout: 3000,
            validateStatus: () => true
          });
          
          if (response.status < 500) {
            console.log(`✅ ${service.name} is ready`);
            ready = true;
          } else {
            throw new Error(`Service returned ${response.status}`);
          }
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(`❌ ${service.name} is not ready: ${error.message}`);
            console.log('');
            console.log('Please ensure your local environment is running:');
            console.log('  npm run local:start');
            console.log('');
            process.exit(1);
          }
          await this.sleep(2000);
        }
      }
    }
    
    console.log('🎉 All services are ready!');
  }

  async runTests(testPattern = '') {
    return new Promise((resolve, reject) => {
      const mochaArgs = [
        '--timeout', '30000',
        '--recursive'
      ];

      // Add test pattern if specified
      if (testPattern) {
        mochaArgs.push(testPattern);
      } else {
        mochaArgs.push('tests/**/*.test.js');
      }

      console.log(`🧪 Running E2E tests: ${mochaArgs.join(' ')}`);
      
      const mocha = spawn('npx', ['mocha', ...mochaArgs], {
        cwd: __dirname,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });

      mocha.on('close', (code) => {
        if (code === 0) {
          console.log('✅ All E2E tests passed!');
          resolve();
        } else {
          console.error(`❌ E2E tests failed with exit code ${code}`);
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      mocha.on('error', (error) => {
        console.error('❌ Error running E2E tests:', error);
        reject(error);
      });
    });
  }

  async installDependencies() {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Installing E2E test dependencies...');
      
      return new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install'], {
          cwd: __dirname,
          stdio: 'inherit'
        });

        npm.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Dependencies installed successfully!');
            resolve();
          } else {
            reject(new Error(`npm install failed with exit code ${code}`));
          }
        });

        npm.on('error', reject);
      });
    }
  }

  async createDirectories() {
    const directories = [
      'screenshots',
      'screenshots/baseline',
      'screenshots/diff'
    ];

    for (const dir of directories) {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      console.log('🚀 Starting E2E Test Runner...');
      console.log('');

      // Install dependencies if needed
      await this.installDependencies();

      // Create necessary directories
      await this.createDirectories();

      // Check if services are ready
      await this.checkServices();

      console.log('');

      // Run tests
      const testPattern = process.argv[2];
      await this.runTests(testPattern);

      console.log('');
      console.log('🎉 E2E test run completed successfully!');

    } catch (error) {
      console.error('');
      console.error('❌ E2E test run failed:', error.message);
      console.error('');
      
      if (error.message.includes('not ready')) {
        console.log('Troubleshooting steps:');
        console.log('1. Start the local environment: npm run local:start');
        console.log('2. Check service health: npm run local:health');
        console.log('3. Try running tests again');
      }
      
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.run();
}

module.exports = E2ETestRunner;