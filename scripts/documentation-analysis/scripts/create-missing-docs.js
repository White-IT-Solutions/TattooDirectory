#!/usr/bin/env node

/**
 * Create Missing Documentation Script
 * Creates essential missing documentation files
 */

const fs = require('fs').promises;
const path = require('path');
const process = require('process');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Main function to create missing documentation
 */
async function createMissingDocs() {
  console.log('📝 Creating missing documentation files...\n');
  
  // Change to project root directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    const stats = {
      filesCreated: 0,
      errorsEncountered: 0
    };

    // Create essential missing documentation
    await createDevelopmentGuide();
    await createApiReference();
    await createTroubleshootingGuide();
    await createCommandReference();
    
    stats.filesCreated = 4;

    console.log('\n📊 Creation Summary:');
    console.log(`   Files Created: ${stats.filesCreated}`);
    console.log(`   Errors Encountered: ${stats.errorsEncountered}`);

    console.log('\n✅ Missing documentation creation completed!');

  } catch (error) {
    console.error('❌ Documentation creation failed:', error.message);
    process.exit(1);
  } finally {
    process.chdir(originalCwd);
  }
}

async function createDevelopmentGuide() {
  const filePath = path.join(projectRoot, 'docs/consolidated/development/DEVELOPMENT_GUIDE.md');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  const content = `# Development Guide

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
`;

  await fs.writeFile(filePath, content, 'utf8');
  console.log('✅ Created DEVELOPMENT_GUIDE.md');
}

async function createApiReference() {
  const filePath = path.join(projectRoot, 'docs/consolidated/reference/API_REFERENCE.md');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  const content = `# API Reference

## Base URL
- Local: \`http://localhost:3000/api\`
- Production: \`https://api.tattoo-directory.com\`

## Endpoints

### Artists
- \`GET /artists\` - List artists
- \`GET /artists/:id\` - Get artist details
- \`POST /artists/search\` - Search artists

### Studios  
- \`GET /studios\` - List studios
- \`GET /studios/:id\` - Get studio details

## Authentication
Currently using API key authentication for development.

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per API key

For detailed API documentation, see the Swagger UI at \`http://localhost:8080\` when running locally.
`;

  await fs.writeFile(filePath, content, 'utf8');
  console.log('✅ Created API_REFERENCE.md');
}

async function createTroubleshootingGuide() {
  const filePath = path.join(projectRoot, 'docs/consolidated/troubleshooting/TROUBLESHOOTING_GUIDE.md');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  const content = `# Troubleshooting Guide

## Common Issues

### Services Won't Start
\`\`\`bash
# Check Docker status
docker ps

# Restart services
npm run local:restart

# Check logs
npm run local:logs
\`\`\`

### Data Issues
\`\`\`bash
# Reset data
npm run reset-data

# Validate data
npm run validate-data
\`\`\`

### Port Conflicts
If you get port conflict errors:
1. Stop all services: \`npm run local:stop\`
2. Check for running processes: \`docker ps\`
3. Clean up: \`npm run local:clean\`
4. Restart: \`npm run local:start\`

## Getting Help
1. Check logs: \`npm run local:logs\`
2. Run health check: \`npm run local:health\`
3. Review this troubleshooting guide
4. Check the [LocalStack troubleshooting](localstack/TROUBLESHOOTING_MASTER.md)
`;

  await fs.writeFile(filePath, content, 'utf8');
  console.log('✅ Created TROUBLESHOOTING_GUIDE.md');
}

async function createCommandReference() {
  const filePath = path.join(projectRoot, 'docs/consolidated/reference/COMMAND_REFERENCE.md');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  const content = `# Command Reference

## Local Development
- \`npm run local:start\` - Start all services
- \`npm run local:stop\` - Stop all services
- \`npm run local:restart\` - Restart services
- \`npm run local:health\` - Check system health
- \`npm run local:logs\` - View all logs
- \`npm run local:clean\` - Clean up containers

## Data Management
- \`npm run setup-data\` - Initialize test data
- \`npm run reset-data\` - Reset all data
- \`npm run seed-scenario:minimal\` - Load minimal test data
- \`npm run validate-data\` - Validate data integrity

## Testing
- \`npm run test:integration\` - Run integration tests
- \`npm run test:e2e\` - Run end-to-end tests
- \`npm run test:studio\` - Run studio-specific tests

## Monitoring
- \`npm run local:monitor\` - Monitor resources
- \`npm run studio-health\` - Check studio data health
- \`npm run performance:monitor\` - Monitor performance

## Documentation
- \`npm run docs:consolidate\` - Consolidate documentation
- \`npm run docs:validate\` - Validate documentation

For detailed usage of each command, run the command with \`--help\` flag.
`;

  await fs.writeFile(filePath, content, 'utf8');
  console.log('✅ Created COMMAND_REFERENCE.md');
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Create Missing Documentation

Usage:
  npm run create-missing-docs

This script creates essential missing documentation files:
- Development Guide
- API Reference  
- Troubleshooting Guide
- Command Reference
`);
  process.exit(0);
}

createMissingDocs();