#!/usr/bin/env node

/**
 * Foundation Documentation Validator
 * Validates that the foundation documentation files were created properly
 */

const fs = require('fs').promises;
const path = require('path');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Check if a file exists and has content
 */
async function validateFile(filePath, description) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const stats = await fs.stat(fullPath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    if (content.trim().length < 100) {
      console.log(`   ⚠️  ${description} - File exists but appears to be too short`);
      return false;
    }
    
    console.log(`   ✅ ${description} - OK (${stats.size} bytes)`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description} - Missing or inaccessible`);
    return false;
  }
}

/**
 * Check if a directory exists
 */
async function validateDirectory(dirPath, description) {
  try {
    const fullPath = path.join(projectRoot, dirPath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(fullPath);
      console.log(`   ✅ ${description} - OK (${files.length} files)`);
      return true;
    } else {
      console.log(`   ❌ ${description} - Path exists but is not a directory`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${description} - Missing`);
    return false;
  }
}

/**
 * Main validation function
 */
async function validateFoundation() {
  console.log('🔍 Validating Foundation Documentation...\n');
  
  let totalChecks = 0;
  let passedChecks = 0;

  // Check root-level files
  console.log('📄 Root-level Documentation Files:');
  const rootFiles = [
    { path: 'docs/README.md', description: 'Main project README' },
    { path: 'docs/QUICK_START.md', description: 'Quick start guide' }
  ];
  
  for (const file of rootFiles) {
    totalChecks++;
    const passed = await validateFile(file.path, file.description);
    if (passed) passedChecks++;
  }

  // Check directory structure
  console.log('\n📁 Directory Structure:');
  const directories = [
    { path: 'docs/setup', description: 'Setup documentation directory' },
    { path: 'docs/architecture', description: 'Architecture documentation directory' },
    { path: 'docs/workflows', description: 'Workflows documentation directory' },
    { path: 'docs/reference', description: 'Reference documentation directory' },
    { path: 'docs/components', description: 'Components documentation directory' }
  ];
  
  for (const dir of directories) {
    totalChecks++;
    const passed = await validateDirectory(dir.path, dir.description);
    if (passed) passedChecks++;
  }

  // Check key files in directories
  console.log('\n📝 Key Directory Files:');
  const keyFiles = [
    { path: 'docs/setup/local-development.md', description: 'Local development setup' },
    { path: 'docs/setup/dependencies.md', description: 'Dependencies documentation' },
    { path: 'docs/setup/docker-setup.md', description: 'Docker setup guide' },
    { path: 'docs/architecture/system-overview.md', description: 'System overview' },
    { path: 'docs/architecture/api-design.md', description: 'API design documentation' },
    { path: 'docs/architecture/data-models.md', description: 'Data models documentation' },
    { path: 'docs/workflows/testing-strategies.md', description: 'Testing strategies' },
    { path: 'docs/workflows/deployment-process.md', description: 'Deployment process' },
    { path: 'docs/workflows/monitoring.md', description: 'Monitoring documentation' },
    { path: 'docs/reference/command-reference.md', description: 'Command reference' }
  ];
  
  for (const file of keyFiles) {
    totalChecks++;
    const passed = await validateFile(file.path, file.description);
    if (passed) passedChecks++;
  }

  // Summary
  const successRate = Math.round((passedChecks / totalChecks) * 100);
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Foundation Validation Summary');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passedChecks}/${totalChecks} (${successRate}%)`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 Foundation documentation is ready!');
    console.log('🔄 You can now run: npm run docs:consolidate');
  } else {
    console.log('\n⚠️  Foundation validation found issues');
    console.log('💡 Try running: npm run docs:generate-foundation');
  }
  
  console.log('\n📚 Next Steps:');
  console.log('   • npm run docs:consolidate - Run main consolidation');
  console.log('   • npm run docs:pipeline - Run complete pipeline');
  console.log('   • npm run docs:validate - Validate all documentation');
  
  return passedChecks === totalChecks;
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Foundation Documentation Validator

Usage:
  npm run docs:validate-foundation

This script validates that the foundation documentation files were created properly:
- Checks for root-level docs/README.md and docs/QUICK_START.md
- Validates directory structure (setup/, architecture/, workflows/, reference/)
- Verifies key files exist and have content

Exit codes:
  0 - All validation checks passed
  1 - Some validation checks failed
`);
  process.exit(0);
}

validateFoundation().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ Foundation validation failed:', error.message);
  process.exit(1);
});