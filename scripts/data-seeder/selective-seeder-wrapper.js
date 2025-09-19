#!/usr/bin/env node

/**
 * Legacy Selective Seeder Wrapper
 * 
 * Maintains compatibility with existing Docker integration and workflows
 * that directly call scripts/data-seeder/selective-seeder.js
 */

const { legacySelectiveSeedWrapper } = require('../backward-compatibility');

async function main() {
  const args = process.argv.slice(2);
  const scenario = args[0];

  if (!scenario) {
    console.error('❌ Usage: node selective-seeder-wrapper.js <scenario-name>');
    console.log('\nAvailable scenarios:');
    console.log('  • minimal');
    console.log('  • search-basic');
    console.log('  • london-artists');
    console.log('  • high-rated');
    console.log('  • new-artists');
    console.log('  • booking-available');
    console.log('  • portfolio-rich');
    console.log('  • multi-style');
    console.log('  • pricing-range');
    console.log('  • full-dataset');
    process.exit(1);
  }

  try {
    console.log(`🔄 Running legacy selective seeding for scenario "${scenario}" via new unified system...`);
    await legacySelectiveSeedWrapper(scenario);
    console.log('✅ Legacy selective seeding completed successfully');
  } catch (error) {
    console.error('❌ Legacy selective seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };