#!/usr/bin/env node

/**
 * Targeted Issue Fix Script
 * Fixes specific broken references and outdated commands identified in the detailed analysis
 */

const fs = require('fs').promises;
const path = require('path');
const process = require('process');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Specific fixes for each problematic file
 */
const TARGETED_FIXES = {
  'docs/workflows/monitoring.md': {
    type: 'command-cleanup',
    fixes: [
      // Remove or comment out non-existent monitoring commands
      { pattern: /npm run local:monitor:comprehensive:comprehensive/g, replacement: '# npm run local:monitor  # Comprehensive monitoring not yet implemented' },
      { pattern: /npm run local:monitor:health-advanced/g, replacement: 'npm run local:health' },
      { pattern: /npm run local:monitor:health-continuous/g, replacement: 'npm run local:health' },
      { pattern: /npm run local:monitor:environment-continuous/g, replacement: 'npm run local:health' },
      { pattern: /npm run alerts:test/g, replacement: '# npm run local:health  # Alert testing not yet implemented' },
      { pattern: /npm run repair-relationships/g, replacement: 'npm run manage-studio-relationships:repair' },
      { pattern: /npm run performance:monitor/g, replacement: '# npm run local:monitor  # Performance monitoring not yet implemented' },
      { pattern: /npm run performance:monitor:continuous/g, replacement: '# npm run local:monitor  # Continuous performance monitoring not yet implemented' },
      { pattern: /npm run performance:monitor:startup/g, replacement: '# npm run local:monitor  # Startup monitoring not yet implemented' },
      { pattern: /npm run performance:resources/g, replacement: 'npm run local:resources' },
      { pattern: /npm run performance:resources:once/g, replacement: 'npm run local:resources' },
      { pattern: /npm run performance:benchmark/g, replacement: '# npm run local:monitor  # Performance benchmarking not yet implemented' },
      { pattern: /npm run performance:benchmark:quick/g, replacement: '# npm run local:monitor  # Quick benchmarking not yet implemented' },
      { pattern: /npm run optimize:startup/g, replacement: '# npm run local:start  # Startup optimization not yet implemented' },
      { pattern: /npm run optimize:startup:benchmark/g, replacement: '# npm run local:start  # Startup benchmarking not yet implemented' },
      { pattern: /npm run optimize:cache/g, replacement: '# npm run local:clean  # Cache optimization not yet implemented' },
      { pattern: /npm run optimize:cache:analyze/g, replacement: '# npm run local:clean  # Cache analysis not yet implemented' }
    ]
  },

  'docs/README-Docs.md': {
    type: 'path-fix',
    fixes: [
      // Fix double docs/ prefix and relative path issues
      { pattern: /docs\/setup\/dependencies\.md/g, replacement: 'setup/dependencies.md' },
      { pattern: /docs\/setup\/docker-setup\.md/g, replacement: 'setup/docker-setup.md' },
      { pattern: /docs\/docs\/architecture\/system-overview\.md/g, replacement: 'architecture/system-overview.md' },
      { pattern: /docs\/docs\/architecture\/api-design\.md/g, replacement: 'architecture/api-design.md' },
      { pattern: /docs\/docs\/architecture\/data-models\.md/g, replacement: 'architecture/data-models.md' },
      { pattern: /docs\/architecture\/infrastructure\/infrastructure\.md/g, replacement: 'architecture/infrastructure/infrastructure.md' },
      { pattern: /docs\/docs\/architecture\/diagrams\//g, replacement: 'architecture/diagrams/' },
      { pattern: /docs\/setup\/local-development\.md/g, replacement: 'setup/local-development.md' },
      { pattern: /docs\/setup\/localstack-setup\.md/g, replacement: 'setup/localstack-setup.md' },
      { pattern: /docs\/components\/frontend\//g, replacement: 'components/frontend/' },
      { pattern: /docs\/components\/backend\//g, replacement: 'components/backend/' },
      { pattern: /docs\/components\/scripts\//g, replacement: 'components/scripts/' },
      { pattern: /docs\/testing\//g, replacement: 'testing/' },
      { pattern: /docs\/deployment\/terraform\.md/g, replacement: 'deployment/terraform.md' },
      { pattern: /docs\/workflows\/deployment-process\.md/g, replacement: 'workflows/deployment-process.md' },
      { pattern: /docs\/deployment\/ci-cd\.md/g, replacement: 'deployment/ci-cd.md' },
      { pattern: /docs\/reference\/api_reference\.md/g, replacement: 'reference/api_reference.md' },
      { pattern: /docs\/workflows\/data-management\.md/g, replacement: 'workflows/data-management.md' },
      { pattern: /docs\/workflows\/monitoring\.md/g, replacement: 'workflows/monitoring.md' },
      { pattern: /docs\/troubleshooting\/README\.md/g, replacement: 'troubleshooting/README.md' }
    ]
  },

  'docs/workflows/DEVELOPMENT_GUIDE.md': {
    type: 'relative-path-fix',
    fixes: [
      // Fix relative paths with proper navigation
      { pattern: /docs\/reference\/command-reference\.md/g, replacement: '../reference/command-reference.md' },
      { pattern: /docs\/QUICK_START\.md/g, replacement: '../QUICK_START.md' },
      { pattern: /\.\.\.\.\.\.\.\/docs\/components\//g, replacement: '../components/' },
      { pattern: /docs\/workflows\/testing-strategies\.md/g, replacement: './testing-strategies.md' },
      { pattern: /docs\/workflows\/deployment-process\.md/g, replacement: './deployment-process.md' },
      { pattern: /\.docs\/docs\/architecture\/system-overview\.md/g, replacement: '../architecture/system-overview.md' },
      { pattern: /\.docs\/docs\/architecture\/data-models\.md/g, replacement: '../architecture/data-models.md' },
      { pattern: /\.docs\/docs\/architecture\/api-design\.md/g, replacement: '../architecture/api-design.md' },
      { pattern: /docs\/troubleshooting\/TROUBLESHOOTING_GUIDE\.md/g, replacement: '../troubleshooting/TROUBLESHOOTING_GUIDE.md' },
      { pattern: /\.\/local-setup\.md/g, replacement: '../setup/local-development.md' },
      // Fix outdated commands
      { pattern: /npm run test(?!\w)/g, replacement: 'npm run test:integration' }
    ]
  },

  'docs/workflows/data-management.md': {
    type: 'command-update',
    fixes: [
      // Update outdated command names to current valid scripts
      { pattern: /npm run seed-data/g, replacement: 'npm run setup-data' },
      { pattern: /npm run reset-data-clean/g, replacement: 'npm run reset-data:clean' },
      { pattern: /npm run reset-data-fresh/g, replacement: 'npm run reset-data:fresh' },
      { pattern: /npm run validate-data-consistency/g, replacement: 'npm run validate-data:consistency' },
      { pattern: /npm run validate-data-images/g, replacement: 'npm run validate-data:images' },
      { pattern: /npm run seed-studios-force/g, replacement: 'npm run seed-studios:force' },
      { pattern: /npm run validate-studios-data/g, replacement: 'npm run validate-studios:data' },
      { pattern: /npm run test-integration/g, replacement: 'npm run test:integration' },
      { pattern: /npm run test-e2e/g, replacement: 'npm run test:e2e' },
      { pattern: /npm run start(?!\w)/g, replacement: 'npm run local:start' },
      { pattern: /npm run stop(?!\w)/g, replacement: 'npm run local:stop' },
      { pattern: /npm run restart(?!\w)/g, replacement: 'npm run local:restart' },
      { pattern: /npm run logs(?!\w)/g, replacement: 'npm run local:logs' },
      { pattern: /npm run health(?!\w)/g, replacement: 'npm run local:health' },
      { pattern: /npm run clean(?!\w)/g, replacement: 'npm run local:clean' },
      { pattern: /npm run reset(?!\w)/g, replacement: 'npm run local:reset' },
      { pattern: /npm run status(?!\w)/g, replacement: 'npm run local:status' },
      { pattern: /npm run monitor(?!\w)/g, replacement: 'npm run local:monitor' }
    ]
  },

  'docs/QUICK_START.md': {
    type: 'path-fix',
    fixes: [
      // Fix complex relative path patterns
      { pattern: /\.\.\.\.\.\/docs\/setup\/frontend-only\.md/g, replacement: 'setup/frontend-only.md' },
      { pattern: /\.\.\.\.\.\/docs\/components\/frontend\//g, replacement: 'components/frontend/' },
      { pattern: /\.\.\.\.\.\/docs\/components\/backend\//g, replacement: 'components/backend/' },
      { pattern: /\.\.\.\.\.\/docs\/components\/infrastructure\//g, replacement: 'components/infrastructure/' },
      { pattern: /\.\.\.\.\.\/docs\/components\/scripts\//g, replacement: 'components/scripts/' },
      { pattern: /\.\.\.\.\.\/docs\/reference\/configuration\.md/g, replacement: 'reference/configuration.md' },
      { pattern: /\.\.\.\.\.\/docs\/reference\/environment-variables\.md/g, replacement: 'reference/environment-variables.md' },
      { pattern: /\.\.\.\.\.\/docs\/reference\/npm-scripts\.md/g, replacement: 'reference/npm-scripts.md' },
      { pattern: /\.\.\.\.\.\/docs\/architecture\/system-overview\.md/g, replacement: 'architecture/system-overview.md' },
      { pattern: /\.\.\.\.\.\/docs\/architecture\/data-models\.md/g, replacement: 'architecture/data-models.md' },
      { pattern: /\.\.\.\.\.\/docs\/architecture\/api-design\.md/g, replacement: 'architecture/api-design.md' },
      // Fix current directory references
      { pattern: /\.\/API_REFERENCE\.md/g, replacement: 'reference/api_reference.md' },
      { pattern: /\.\/TROUBLESHOOTING\.md/g, replacement: 'troubleshooting/TROUBLESHOOTING_GUIDE.md' },
      // Fix placeholder references
      { pattern: /docs\/README-Docs\.md/g, replacement: 'workflows/testing-strategies.md' }
    ]
  },

  'README.md': {
    type: 'path-fix',
    fixes: [
      // Fix broken references in root README
      { pattern: /docs\/README\.md/g, replacement: 'docs/README-Docs.md' },
      { pattern: /docs\/QUICK_START\.md/g, replacement: 'docs/QUICK_START.md' },
      { pattern: /docs\/setup\/local-development\.md/g, replacement: 'docs/setup/local-development.md' },
      { pattern: /docs\/workflows\/DEVELOPMENT_GUIDE\.md/g, replacement: 'docs/workflows/DEVELOPMENT_GUIDE.md' },
      { pattern: /docs\/reference\/command-reference\.md/g, replacement: 'docs/reference/command-reference.md' },
      { pattern: /docs\/troubleshooting\/TROUBLESHOOTING_GUIDE\.md/g, replacement: 'docs/troubleshooting/TROUBLESHOOTING_GUIDE.md' }
    ]
  },

  'docs/testing/component_testing.md': {
    type: 'command-update',
    fixes: [
      { pattern: /npm run test(?!\w)/g, replacement: 'npm run test:integration' },
      { pattern: /npm run test-unit/g, replacement: 'npm run test:unit' },
      { pattern: /npm run test-e2e/g, replacement: 'npm run test:e2e' },
      { pattern: /npm run test-integration/g, replacement: 'npm run test:integration' }
    ]
  },

  'docs/testing/API_TESTING_GUIDE.md': {
    type: 'path-fix',
    fixes: [
      { pattern: /docs\/reference\/api-documentation\.md/g, replacement: '../reference/api_reference.md' },
      { pattern: /docs\/setup\/local-development\.md/g, replacement: '../setup/local-development.md' }
    ]
  },

  'docs/setup/local-development.md': {
    type: 'path-fix',
    fixes: [
      { pattern: /docs\/getting-started\/SETUP_MASTER\.md/g, replacement: '../setup/SETUP_MASTER.md' },
      { pattern: /docs\/getting-started\/docker-setup\.md/g, replacement: './docker-setup.md' },
      { pattern: /docs\/getting-started\/dependencies\.md/g, replacement: './dependencies.md' },
      { pattern: /docs\/troubleshooting\/TROUBLESHOOTING_GUIDE\.md/g, replacement: '../troubleshooting/TROUBLESHOOTING_GUIDE.md' },
      { pattern: /docs\/workflows\/DEVELOPMENT_GUIDE\.md/g, replacement: '../workflows/DEVELOPMENT_GUIDE.md' },
      // Fix outdated command
      { pattern: /npm run test(?!\w)/g, replacement: 'npm run test:integration' }
    ]
  },

  'docs/setup/frontend-only.md': {
    type: 'command-update',
    fixes: [
      { pattern: /npm run dev(?!\w)/g, replacement: 'npm run dev:frontend' },
      { pattern: /npm run build(?!\w)/g, replacement: 'npm run build --workspace=frontend' }
    ]
  },

  'docs/reference/npm-scripts.md': {
    type: 'path-fix',
    fixes: [
      { pattern: /docs\/workflows\/DEVELOPMENT_GUIDE\.md/g, replacement: '../workflows/DEVELOPMENT_GUIDE.md' }
    ]
  },

  'docs/reference/configuration.md': {
    type: 'path-fix',
    fixes: [
      { pattern: /docs\/setup\/local-development\.md/g, replacement: '../setup/local-development.md' }
    ]
  },

  'docs/troubleshooting/TROUBLESHOOTING_MASTER.md': {
    type: 'path-fix',
    fixes: [
      { pattern: /docs\/setup\/local-development\.md/g, replacement: '../setup/local-development.md' },
      { pattern: /docs\/workflows\/DEVELOPMENT_GUIDE\.md/g, replacement: '../workflows/DEVELOPMENT_GUIDE.md' },
      { pattern: /docs\/reference\/command-reference\.md/g, replacement: '../reference/command-reference.md' },
      // Fix outdated command
      { pattern: /npm run test(?!\w)/g, replacement: 'npm run test:integration' }
    ]
  },

  'docs/troubleshooting/TROUBLESHOOTING_GUIDE.md': {
    type: 'path-fix',
    fixes: [
      { pattern: /docs\/setup\/local-development\.md/g, replacement: '../setup/local-development.md' }
    ]
  }
};

/**
 * Main function to apply targeted fixes
 */
async function applyTargetedFixes() {
  console.log('🎯 Starting targeted issue fixes...\n');
  
  // Change to project root directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    const stats = {
      filesProcessed: 0,
      fixesApplied: 0,
      errorsEncountered: 0
    };

    for (const [filePath, fixConfig] of Object.entries(TARGETED_FIXES)) {
      try {
        console.log(`🔧 Processing: ${filePath} (${fixConfig.type})`);
        
        const fullPath = path.join(projectRoot, filePath);
        
        // Check if file exists
        try {
          await fs.access(fullPath);
        } catch (error) {
          console.log(`  ⚠️  File not found: ${filePath}`);
          continue;
        }

        // Read file content
        let content = await fs.readFile(fullPath, 'utf8');
        const originalContent = content;
        let fileFixesApplied = 0;

        // Apply fixes
        for (const fix of fixConfig.fixes) {
          const matches = content.match(fix.pattern);
          if (matches) {
            content = content.replace(fix.pattern, fix.replacement);
            fileFixesApplied += matches.length;
          }
        }

        // Write back if changes were made
        if (content !== originalContent) {
          await fs.writeFile(fullPath, content, 'utf8');
          console.log(`  ✅ Applied ${fileFixesApplied} fixes`);
          stats.fixesApplied += fileFixesApplied;
        } else {
          console.log(`  ℹ️  No fixes needed`);
        }

        stats.filesProcessed++;

      } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error.message);
        stats.errorsEncountered++;
      }
    }

    // Summary
    console.log('\n📊 Targeted Fix Summary:');
    console.log(`   Files Processed: ${stats.filesProcessed}`);
    console.log(`   Fixes Applied: ${stats.fixesApplied}`);
    console.log(`   Errors Encountered: ${stats.errorsEncountered}`);

    if (stats.fixesApplied > 0) {
      console.log('\n✅ Targeted fixes completed successfully!');
      console.log('💡 Run the gap analysis again to verify fixes: npm run gap-analysis');
      console.log('💡 Run the detailed analysis to see remaining issues: node scripts/detailed-issue-analysis.js');
    } else {
      console.log('\n✅ All targeted issues were already fixed!');
    }

  } catch (error) {
    console.error('❌ Targeted fix process failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Restore original working directory
    process.chdir(originalCwd);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Targeted Documentation Issue Fix Script

Usage:
  node scripts/targeted-issue-fix.js

This script applies specific fixes for issues identified in the detailed analysis:

1. docs/workflows/monitoring.md - Removes/comments non-existent monitoring commands
2. docs/README-Docs.md - Fixes double docs/ prefix and relative paths
3. docs/workflows/DEVELOPMENT_GUIDE.md - Fixes relative path navigation
4. docs/workflows/data-management.md - Updates outdated command names
5. docs/QUICK_START.md - Fixes complex relative path patterns
6. README.md - Fixes broken references in root README
7. Other files - Various path and command fixes

The script applies 100+ specific fixes based on the detailed issue analysis.

Environment Variables:
  DEBUG=1    Show detailed error information
`);
  process.exit(0);
}

applyTargetedFixes();