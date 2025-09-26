#!/usr/bin/env node

/**
 * Legacy Data Management Wrapper
 * 
 * Maintains compatibility with existing Docker integration and workflows
 * that use scripts/data-management/ scripts
 */

const { legacyDataManagementWrapper } = require('../backward-compatibility');

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const param = args[1];

  if (!action) {
    console.error('❌ Usage: node data-management-wrapper.js <action> [parameter]');
    console.log('\nAvailable actions:');
    console.log('  • seed           - Set up all data and services');
    console.log('  • reset [state]  - Reset to specific state (default: fresh)');
    console.log('  • validate [type] - Validate data consistency (default: all)');
    console.log('  • status         - Show current system status');
    console.log('  • export         - Export data (legacy - not yet implemented)');
    console.log('  • import         - Import data (legacy - not yet implemented)');
    console.log('  • backup         - Backup data (legacy - not yet implemented)');
    console.log('  • restore        - Restore data (legacy - not yet implemented)');
    process.exit(1);
  }

  const options = {
    state: param,
    type: param,
    force: args.includes('--force') || args.includes('-f')
  };

  try {
    console.log(`🔄 Running legacy data management action "${action}" via new unified system...`);
    await legacyDataManagementWrapper(action, options);
    console.log('✅ Legacy data management operation completed successfully');
  } catch (error) {
    console.error('❌ Legacy data management operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };