const DataSeeder = require('./data-seeder/seed');

// Legacy wrapper for backward compatibility

async function main() {
  console.log('🔄 Using new comprehensive data seeder...');
  
  try {
    const seeder = new DataSeeder();
    await seeder.run();
  } catch (error) {
    console.error('❌ Data seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}