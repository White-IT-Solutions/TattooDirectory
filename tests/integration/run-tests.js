#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * Comprehensive test runner for integration tests with environment validation
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { testLocalStackConnection, testAPIConnection } from './setup/test-clients.js';
import TestDataManager from './setup/test-data-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TestRunner {
    constructor() {
        this.testSuites = {
            api: ['api/**/*.test.js'],
            data: ['data/**/*.test.js'],
            all: ['**/*.test.js']
        };
    }

    async validateEnvironment() {
        console.log('🔍 Validating test environment...\n');

        const checks = [
            {
                name: 'LocalStack Connection',
                test: testLocalStackConnection
            },
            {
                name: 'API Connection', 
                test: testAPIConnection
            },
            {
                name: 'AWS Services',
                test: async () => {
                    const dataManager = new TestDataManager();
                    await dataManager.waitForServices(5, 1000);
                    return true;
                }
            }
        ];

        for (const check of checks) {
            process.stdout.write(`  ${check.name}... `);
            try {
                const result = await check.test();
                if (result) {
                    console.log('✅');
                } else {
                    console.log('❌');
                    return false;
                }
            } catch (error) {
                console.log(`❌ (${error.message})`);
                return false;
            }
        }

        console.log('\n✅ Environment validation passed!\n');
        return true;
    }

    async runTests(suite = 'all', options = {}) {
        const {
            grep = '',
            timeout = 30000,
            reporter = 'spec',
            bail = false,
            coverage = false
        } = options;

        if (!this.testSuites[suite]) {
            throw new Error(`Unknown test suite: ${suite}. Available: ${Object.keys(this.testSuites).join(', ')}`);
        }

        const testPatterns = this.testSuites[suite];
        const mochaArgs = [
            '--recursive',
            '--timeout', timeout.toString(),
            '--reporter', reporter,
            '--require', './setup/test-setup.js',
            '--exit'
        ];

        if (grep) {
            mochaArgs.push('--grep', grep);
        }

        if (bail) {
            mochaArgs.push('--bail');
        }

        // Add test patterns
        mochaArgs.push(...testPatterns);

        const command = coverage ? 'c8' : 'mocha';
        const args = coverage ? ['mocha', ...mochaArgs] : mochaArgs;

        console.log(`🧪 Running ${suite} tests...\n`);
        console.log(`Command: ${command} ${args.join(' ')}\n`);

        return new Promise((resolve, reject) => {
            const testProcess = spawn(command, args, {
                cwd: __dirname,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: 'test'
                }
            });

            testProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('\n✅ All tests passed!');
                    resolve(code);
                } else {
                    console.log(`\n❌ Tests failed with exit code ${code}`);
                    reject(new Error(`Tests failed with exit code ${code}`));
                }
            });

            testProcess.on('error', (error) => {
                console.error('❌ Failed to start test process:', error);
                reject(error);
            });
        });
    }

    async cleanup() {
        console.log('🧹 Cleaning up test data...');
        try {
            const dataManager = new TestDataManager();
            await dataManager.cleanup();
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }

    printUsage() {
        console.log(`
Integration Test Runner

Usage: node run-tests.js [options] [suite]

Suites:
  api     - Run API integration tests only
  data    - Run data layer tests only  
  all     - Run all integration tests (default)

Options:
  --grep <pattern>     - Only run tests matching pattern
  --timeout <ms>       - Set test timeout (default: 30000)
  --reporter <name>    - Set test reporter (default: spec)
  --bail              - Stop on first test failure
  --coverage          - Run with coverage reporting
  --no-validate       - Skip environment validation
  --cleanup-only      - Only run cleanup, don't run tests
  --help              - Show this help message

Examples:
  node run-tests.js api
  node run-tests.js --grep "should return artists"
  node run-tests.js all --coverage --bail
  node run-tests.js --cleanup-only
        `);
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        suite: 'all',
        grep: '',
        timeout: 30000,
        reporter: 'spec',
        bail: false,
        coverage: false,
        validate: true,
        cleanupOnly: false,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--grep':
                options.grep = args[++i];
                break;
            case '--timeout':
                options.timeout = parseInt(args[++i]);
                break;
            case '--reporter':
                options.reporter = args[++i];
                break;
            case '--bail':
                options.bail = true;
                break;
            case '--coverage':
                options.coverage = true;
                break;
            case '--no-validate':
                options.validate = false;
                break;
            case '--cleanup-only':
                options.cleanupOnly = true;
                break;
            case '--help':
                options.help = true;
                break;
            default:
                if (!arg.startsWith('--')) {
                    options.suite = arg;
                }
                break;
        }
    }

    return options;
}

// Main execution
async function main() {
    const runner = new TestRunner();
    const options = parseArgs();

    if (options.help) {
        runner.printUsage();
        process.exit(0);
    }

    try {
        if (options.cleanupOnly) {
            await runner.cleanup();
            process.exit(0);
        }

        if (options.validate) {
            const isValid = await runner.validateEnvironment();
            if (!isValid) {
                console.error('\n❌ Environment validation failed!');
                console.error('\nTroubleshooting:');
                console.error('1. Ensure Docker is running');
                console.error('2. Start local environment: npm run local:start');
                console.error('3. Wait for all services to be ready');
                console.error('4. Check service logs: npm run local:logs');
                process.exit(1);
            }
        }

        await runner.runTests(options.suite, options);
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Handle process signals
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, cleaning up...');
    const runner = new TestRunner();
    await runner.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, cleaning up...');
    const runner = new TestRunner();
    await runner.cleanup();
    process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}

export default TestRunner;