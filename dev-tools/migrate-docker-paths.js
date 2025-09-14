#!/usr/bin/env node

/**
 * Migration script to update docker-compose file references
 * This script updates remaining references to the old docker-compose paths
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OLD_PATH = 'docker-compose.local.yml';
const NEW_PATH = 'dev-tools/docker/docker-compose.local.yml';

console.log('🔄 Migrating docker-compose file references...');

// Files to update (add more as needed)
const filesToUpdate = [
  'scripts/health-check.js',
  'scripts/environment-validator.js',
  'scripts/log-viewer.js',
  'scripts/performance-benchmarks.js',
  'scripts/startup-optimizer.js',
  'scripts/test-performance-monitoring.js'
];

let updatedFiles = 0;

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Replace all occurrences of the old path
      content = content.replace(new RegExp(OLD_PATH, 'g'), NEW_PATH);
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${filePath}`);
        updatedFiles++;
      } else {
        console.log(`⏭️  No changes needed: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log(`\n🎉 Migration complete! Updated ${updatedFiles} files.`);

if (updatedFiles > 0) {
  console.log('\n📝 Next steps:');
  console.log('1. Test the updated scripts to ensure they work correctly');
  console.log('2. Commit the changes to version control');
  console.log('3. Update any documentation that references the old paths');
}

console.log('\n🚀 You can now use the new docker-compose commands:');
console.log(`   docker-compose -f ${NEW_PATH} up -d`);
console.log(`   npm run local:start`);