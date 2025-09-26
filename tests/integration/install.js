#!/usr/bin/env node

/**
 * Integration Tests Installation Script
 * 
 * Sets up the integration test environment
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command} ${args.join(' ')}`);
        
        const process = spawn(command, args, {
            stdio: 'inherit',
            cwd: __dirname,
            ...options
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        process.on('error', reject);
    });
}

async function install() {
    console.log('🚀 Setting up Integration Tests Environment\n');

    try {
        // Check if package.json exists
        const packageJsonPath = join(__dirname, 'package.json');
        if (!existsSync(packageJsonPath)) {
            throw new Error('package.json not found in integration tests directory');
        }

        // Install dependencies
        console.log('📦 Installing dependencies...');
        await runCommand('npm', ['install']);
        console.log('✅ Dependencies installed\n');

        // Verify installation
        console.log('🔍 Verifying installation...');
        
        // Check if mocha is available
        try {
            await runCommand('npx', ['mocha', '--version']);
            console.log('✅ Mocha is available');
        } catch (error) {
            throw new Error('Mocha installation failed');
        }

        // Check if chai is available
        try {
            await runCommand('node', ['-e', 'import("chai").then(() => console.log("Chai is available"))']);
            console.log('✅ Chai is available');
        } catch (error) {
            throw new Error('Chai installation failed');
        }

        console.log('\n🎉 Integration tests environment setup complete!');
        console.log('\nNext steps:');
        console.log('1. Start local environment: npm run local:start');
        console.log('2. Verify environment: npm run test:setup');
        console.log('3. Run tests: npm test');

    } catch (error) {
        console.error('\n❌ Installation failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Ensure Node.js 18+ is installed');
        console.error('2. Check npm is working: npm --version');
        console.error('3. Clear npm cache: npm cache clean --force');
        console.error('4. Try manual install: npm install');
        process.exit(1);
    }
}

// Run installation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    install().catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}