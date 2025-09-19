#!/usr/bin/env node

/**
 * Legacy Seed Script Wrapper
 * 
 * Maintains compatibility with existing Docker integration and workflows
 * that directly call scripts/data-seeder/seed.js
 */

const { legacySeedWrapper } = require('../backward-compatibility');

async function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force') || args.includes('-f')
  };

  try {
    console.log('🔄 Running legacy seed operation via new unified system...');
    await legacySeedWrapper(options);
    console.log('✅ Legacy seed operation completed successfully');
  } catch (error) {
    console.error('❌ Legacy seed operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };