#!/usr/bin/env node

/**
 * Convenience script for seeding OpenSearch
 * Delegates to the main seeding script in backend/src/scripts
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

try {
    console.log('🌱 Starting OpenSearch seeding...');
    
    const seedScript = join(rootDir, 'backend/src/scripts/seed-opensearch.js');
    execSync(`node "${seedScript}"`, { 
        stdio: 'inherit',
        cwd: rootDir 
    });
    
    console.log('✅ Seeding completed successfully!');
} catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
}
