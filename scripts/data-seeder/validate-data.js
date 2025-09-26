const path = require('path');
const { validateAllTestData } = require('./validators');

/**
 * Standalone data validation script
 */
async function main() {
  console.log('🔍 Validating test data files...');
  
  const testDataDir = path.join(__dirname, 'test-data');
  const results = validateAllTestData(testDataDir);
  
  console.log('\n📊 Validation Results:');
  console.log('┌─────────────┬───────┬─────────┐');
  console.log('│ Data Type   │ Valid │ Invalid │');
  console.log('├─────────────┼───────┼─────────┤');
  console.log(`│ Artists     │ ${results.artists.valid.toString().padStart(5)} │ ${results.artists.invalid.toString().padStart(7)} │`);
  console.log(`│ Studios     │ ${results.studios.valid.toString().padStart(5)} │ ${results.studios.invalid.toString().padStart(7)} │`);
  console.log(`│ Styles      │ ${results.styles.valid.toString().padStart(5)} │ ${results.styles.invalid.toString().padStart(7)} │`);
  console.log('└─────────────┴───────┴─────────┘');
  
  let hasErrors = false;
  
  // Report artist errors
  if (results.artists.errors.length > 0) {
    hasErrors = true;
    console.log('\n❌ Artist Data Errors:');
    results.artists.errors.forEach(error => {
      if (error.artistId) {
        console.log(`  • ${error.artistId} (index ${error.index}):`);
        error.errors.forEach(err => console.log(`    - ${err}`));
      } else {
        console.log(`  • File error: ${error.error}`);
      }
    });
  }
  
  // Report studio errors
  if (results.studios.errors.length > 0) {
    hasErrors = true;
    console.log('\n❌ Studio Data Errors:');
    results.studios.errors.forEach(error => {
      if (error.studioId) {
        console.log(`  • ${error.studioId} (index ${error.index}):`);
        error.errors.forEach(err => console.log(`    - ${err}`));
      } else {
        console.log(`  • File error: ${error.error}`);
      }
    });
  }
  
  // Report style errors
  if (results.styles.errors.length > 0) {
    hasErrors = true;
    console.log('\n❌ Style Data Errors:');
    results.styles.errors.forEach(error => {
      if (error.styleId) {
        console.log(`  • ${error.styleId} (index ${error.index}):`);
        error.errors.forEach(err => console.log(`    - ${err}`));
      } else {
        console.log(`  • File error: ${error.error}`);
      }
    });
  }
  
  if (hasErrors) {
    console.log('\n❌ Validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All test data is valid!');
    process.exit(0);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };