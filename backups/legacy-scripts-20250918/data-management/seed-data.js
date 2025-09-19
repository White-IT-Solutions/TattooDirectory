/**
 * LEGACY SCRIPT - DEPRECATED
 * 
 * This script has been replaced by the unified data management system.
 * Please use: npm run setup-data
 * 
 * This wrapper maintains backward compatibility for existing workflows.
 */

// Redirect to new wrapper for backward compatibility
const { main } = require('./data-management-wrapper');

async function legacyMain() {
  console.log('\n⚠️  DEPRECATION NOTICE: This script is deprecated');
  console.log('Please use: npm run setup-data');
  console.log('Running via compatibility layer...\n');
  
  try {
    // Call the wrapper with 'seed' action
    process.argv = ['node', 'seed-data.js', 'seed'];
    await main();
  } catch (error) {
    console.error('❌ Data seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  legacyMain();
}