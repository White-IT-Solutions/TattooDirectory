#!/usr/bin/env node

/**
 * Documentation Validation Pipeline Runner
 * Main entry point for running documentation validation
 */

const ValidationPipeline = require('./src/ValidationPipeline');
const path = require('path');

async function main() {
  const config = {
    projectRoot: path.resolve(__dirname, '../..'),
    outputDir: path.join(__dirname, 'validation-reports'),
    skipPatterns: [
      '**/node_modules/**',
      '**/.git/**', 
      '**/coverage/**',
      '**/localstack-data/**',
      '**/localstack-logs/**',
      '**/localstack-tmp/**'
    ],
    includePatterns: [
      '**/*.md',
      '**/package.json',
      '**/*.json'
    ],
    validateExternal: false,
    generateReports: true
  };

  const pipeline = new ValidationPipeline(config);

  try {
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
      console.log('Running quick validation check...');
      const result = await pipeline.quickCheck();
      process.exit(result.success ? 0 : 1);
    }

    if (args.includes('--files') || args.includes('-f')) {
      const fileIndex = args.findIndex(arg => arg === '--files' || arg === '-f');
      const files = args.slice(fileIndex + 1);
      
      if (files.length === 0) {
        console.error('❌ No files specified for validation');
        process.exit(1);
      }

      console.log(`Validating specific files: ${files.join(', ')}`);
      const results = await pipeline.validateFiles(files);
      const failed = results.filter(r => !r.success);
      
      console.log(`\n✅ Validation complete: ${failed.length} failures out of ${results.length} files`);
      process.exit(failed.length > 0 ? 1 : 0);
    }

    // Run full pipeline
    const result = await pipeline.run();
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('❌ Pipeline execution failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Documentation Validation Pipeline

Usage:
  node run-validation.js [options]

Options:
  --quick, -q           Run quick validation check only
  --files, -f <files>   Validate specific files
  --help, -h           Show this help message

Examples:
  node run-validation.js                    # Full validation pipeline
  node run-validation.js --quick            # Quick check only
  node run-validation.js -f README.md       # Validate specific file
  node run-validation.js -f docs/*.md       # Validate multiple files
`);
  process.exit(0);
}

main();