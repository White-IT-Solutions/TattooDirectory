#!/usr/bin/env node

/**
 * Simple script to seed OpenSearch with artist data
 */

import { seedOpenSearch } from './src/scripts/seed-opensearch.js';

console.log('🌱 Starting OpenSearch data seeding...');

seedOpenSearch()
    .then(result => {
        console.log('✅ Seeding completed successfully!');
        console.log(`   Index: ${result.indexName}`);
        console.log(`   Artists: ${result.artistCount}`);
    })
    .catch(error => {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    });