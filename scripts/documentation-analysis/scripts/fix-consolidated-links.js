#!/usr/bin/env node

/**
 * Fix Consolidated Documentation Links
 * Fixes broken links in the consolidated documentation structure
 */

const fs = require('fs').promises;
const path = require('path');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Main function to fix consolidated links
 */
async function fixConsolidatedLinks() {
  console.log('🔧 Fixing consolidated documentation links...\n');
  
  try {
    const stats = {
      filesProcessed: 0,
      linksFixed: 0,
      errorsEncountered: 0
    };

    // Fix the main getting-started README
    await fixGettingStartedReadme(stats);
    
    // Fix other consolidated files with broken links
    await fixOtherConsolidatedFiles(stats);

    console.log('\n📊 Link Fix Summary:');
    console.log(`   Files Processed: ${stats.filesProcessed}`);
    console.log(`   Links Fixed: ${stats.linksFixed}`);
    console.log(`   Errors Encountered: ${stats.errorsEncountered}`);

    console.log('\n✅ Consolidated documentation links fixed!');
    console.log('💡 Run validation again to see improvements: npm run validate');

  } catch (error) {
    console.error('❌ Link fixing failed:', error.message);
    process.exit(1);
  }
}

/**
 * Fix links in getting-started README
 */
async function fixGettingStartedReadme(stats) {
  const filePath = path.join(projectRoot, 'docs/consolidated/getting-started/README.md');
  
  try {
    console.log('🔧 Fixing getting-started/README.md...');
    
    let content = await fs.readFile(filePath, 'utf8');
    let linksFixed = 0;

    // Fix the broken links with correct paths
    const linkFixes = [
      // Quick Start and main docs
      { from: './QUICK_START.md', to: '../reference/QUICK_START.md' },
      { from: './DEVELOPMENT_GUIDE.md', to: '../development/DEVELOPMENT_GUIDE.md' },
      { from: './API_REFERENCE.md', to: '../reference/API_REFERENCE.md' },
      { from: './TROUBLESHOOTING.md', to: '../troubleshooting/TROUBLESHOOTING_GUIDE.md' },
      
      // Setup documentation
      { from: './docs/setup/local-development.md', to: '../development/local-setup.md' },
      { from: './docs/setup/frontend-only.md', to: '../development/frontend-only-setup.md' },
      { from: './docs/setup/docker-setup.md', to: './docker-setup.md' },
      { from: './docs/setup/dependencies.md', to: './dependencies.md' },
      
      // Component documentation
      { from: './docs/components/', to: '../development/' },
      { from: './docs/components/frontend/', to: '../development/frontend/' },
      { from: './docs/components/backend/', to: '../development/backend/' },
      { from: './docs/components/infrastructure/', to: '../architecture/' },
      { from: './docs/components/scripts/', to: '../development/scripts/' },
      
      // Workflow documentation
      { from: './docs/workflows/data-management.md', to: '../reference/data-management.md' },
      { from: './docs/workflows/testing-strategies.md', to: '../development/testing/strategies.md' },
      { from: './docs/workflows/deployment-process.md', to: '../deployment/process.md' },
      { from: './docs/workflows/monitoring.md', to: '../deployment/monitoring.md' },
      
      // Reference documentation
      { from: './docs/reference/command-reference.md', to: '../reference/commands.md' },
      { from: './docs/reference/configuration.md', to: '../reference/configuration.md' },
      { from: './docs/reference/environment-variables.md', to: '../reference/environment-variables.md' },
      { from: './docs/reference/npm-scripts.md', to: '../reference/npm-scripts.md' },
      
      // Architecture documentation
      { from: './docs/architecture/system-overview.md', to: '../architecture/system-overview.md' },
      { from: './docs/architecture/data-models.md', to: '../architecture/data-models.md' },
      { from: './docs/architecture/api-design.md', to: '../architecture/api-design.md' }
    ];

    // Apply fixes
    for (const fix of linkFixes) {
      const regex = new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const beforeCount = (content.match(regex) || []).length;
      content = content.replace(regex, fix.to);
      const afterCount = (content.match(new RegExp(fix.to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      if (beforeCount > 0) {
        linksFixed += beforeCount;
        console.log(`   ✅ Fixed ${beforeCount} instances of: ${fix.from} -> ${fix.to}`);
      }
    }

    // Create missing reference files that are commonly linked to
    await createMissingReferenceFiles();

    // Write the fixed content
    await fs.writeFile(filePath, content, 'utf8');
    
    stats.filesProcessed++;
    stats.linksFixed += linksFixed;
    
    console.log(`   ✅ Fixed ${linksFixed} links in getting-started/README.md`);
    
  } catch (error) {
    console.error(`   ❌ Error fixing getting-started/README.md: ${error.message}`);
    stats.errorsEncountered++;
  }
}

/**
 * Create missing reference files that are commonly linked to
 */
async function createMissingReferenceFiles() {
  const missingFiles = [
    {
      path: 'docs/consolidated/reference/QUICK_START.md',
      content: `# Quick Start Guide

This is a redirect to the main quick start guide.

See: [Getting Started](../getting-started/README.md)

## Quick Setup

\`\`\`bash
npm install
npm run local:start
npm run setup-data
\`\`\`

For detailed instructions, see the [Development Guide](../development/DEVELOPMENT_GUIDE.md).
`
    },
    {
      path: 'docs/consolidated/development/DEVELOPMENT_GUIDE.md',
      content: `# Development Guide

## Quick Start

\`\`\`bash
# Start local development environment
npm run local:start

# Check system health
npm run local:health

# View logs
npm run local:logs
\`\`\`

## Development Workflow

1. **Setup Data**: \`npm run setup-data\`
2. **Start Services**: \`npm run local:start\`
3. **Run Tests**: \`npm run test:integration\`
4. **Monitor Health**: \`npm run local:health\`

## Key Commands

- \`npm run local:start\` - Start all services
- \`npm run local:stop\` - Stop all services  
- \`npm run setup-data\` - Initialize test data
- \`npm run reset-data\` - Reset all data

For complete command reference, see [Commands](../reference/commands.md).
`
    },
    {
      path: 'docs/consolidated/reference/configuration.md',
      content: `# Configuration Reference

## Environment Variables

### Development
- \`NODE_ENV\` - Environment (development/production)
- \`PORT\` - Server port (default: 3000)

### AWS Configuration
- \`AWS_REGION\` - AWS region (default: eu-west-2)
- \`LOCALSTACK_ENDPOINT\` - LocalStack endpoint for development

## Configuration Files

- \`.env.local\` - Local environment variables
- \`docker-compose.local.yml\` - Local Docker configuration
- \`terraform/\` - Infrastructure configuration

For setup instructions, see [Local Setup](../development/local-setup.md).
`
    },
    {
      path: 'docs/consolidated/reference/environment-variables.md',
      content: `# Environment Variables

## Required Variables

### Development
\`\`\`bash
NODE_ENV=development
PORT=3000
LOCALSTACK_ENDPOINT=http://localhost:4566
\`\`\`

### AWS Configuration
\`\`\`bash
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
\`\`\`

## Setup

1. Copy the example file:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Edit \`.env.local\` with your values

3. Restart services:
   \`\`\`bash
   npm run local:restart
   \`\`\`

For more details, see [Configuration](./configuration.md).
`
    },
    {
      path: 'docs/consolidated/reference/npm-scripts.md',
      content: `# npm Scripts Reference

## Local Development
- \`npm run local:start\` - Start all services
- \`npm run local:stop\` - Stop all services
- \`npm run local:restart\` - Restart services
- \`npm run local:health\` - Check system health

## Data Management
- \`npm run setup-data\` - Initialize test data
- \`npm run reset-data\` - Reset all data
- \`npm run validate-data\` - Validate data integrity

## Testing
- \`npm run test:integration\` - Run integration tests
- \`npm run test:e2e\` - Run end-to-end tests

For detailed command descriptions, see [Commands](./commands.md).
`
    },
    {
      path: 'docs/consolidated/development/frontend-only-setup.md',
      content: `# Frontend-Only Development Setup

For UI/UX work without backend dependencies.

## Quick Setup

\`\`\`bash
# Install dependencies
npm install

# Start frontend only
npm run dev:frontend

# Setup frontend data
npm run setup-data:frontend-only
\`\`\`

## Access

- Frontend: http://localhost:3000
- Uses mock data for development

## Development Workflow

1. Make UI changes
2. Test with mock data
3. Run frontend tests: \`npm run test --workspace=frontend\`

For full development setup, see [Local Setup](./local-setup.md).
`
    }
  ];

  for (const file of missingFiles) {
    try {
      const fullPath = path.join(projectRoot, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Only create if it doesn't exist
      try {
        await fs.access(fullPath);
        console.log(`   ℹ️  File already exists: ${file.path}`);
      } catch {
        await fs.writeFile(fullPath, file.content, 'utf8');
        console.log(`   ✅ Created missing file: ${file.path}`);
      }
    } catch (error) {
      console.error(`   ❌ Error creating ${file.path}: ${error.message}`);
    }
  }
}

/**
 * Fix other consolidated files with broken links
 */
async function fixOtherConsolidatedFiles(stats) {
  console.log('\n🔧 Fixing other consolidated files...');
  
  // Fix development/local-setup.md
  const localSetupPath = path.join(projectRoot, 'docs/consolidated/development/local-setup.md');
  try {
    let content = await fs.readFile(localSetupPath, 'utf8');
    content = content.replace('../DEVELOPMENT_GUIDE.md', './DEVELOPMENT_GUIDE.md');
    await fs.writeFile(localSetupPath, content, 'utf8');
    console.log('   ✅ Fixed development/local-setup.md');
    stats.filesProcessed++;
    stats.linksFixed++;
  } catch (error) {
    console.log(`   ⚠️  Could not fix development/local-setup.md: ${error.message}`);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Fix Consolidated Documentation Links

Usage:
  npm run fix-consolidated-links

This script:
1. Fixes broken links in consolidated documentation
2. Creates missing reference files
3. Updates paths to match the consolidated structure
4. Improves documentation validation scores

The script is safe to run multiple times.
`);
  process.exit(0);
}

fixConsolidatedLinks();