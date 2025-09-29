#!/usr/bin/env node

/**
 * Generate Foundation Documentation Script
 * Creates the root-level documentation files that the consolidation pipeline expects
 */

const fs = require('fs').promises;
const path = require('path');
const TemplateProcessor = require('../src/TemplateProcessor');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Main function to generate foundation documentation
 */
async function generateFoundationDocs() {
  console.log('🏗️  Generating foundation documentation files...\n');
  
  // Change to project root directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    const templateProcessor = new TemplateProcessor();
    const stats = {
      filesCreated: 0,
      directoriesCreated: 0,
      errorsEncountered: 0
    };

    // Create project data for templates
    const projectData = await generateProjectData();

    // Create root-level documentation files
    await createRootLevelDocs(templateProcessor, projectData, stats);
    
    // Create missing directory structure
    await createDirectoryStructure(stats);
    
    // Create basic files in directories
    await createDirectoryFiles(stats);

    console.log('\n📊 Generation Summary:');
    console.log(`   Files Created: ${stats.filesCreated}`);
    console.log(`   Directories Created: ${stats.directoriesCreated}`);
    console.log(`   Errors Encountered: ${stats.errorsEncountered}`);

    console.log('\n✅ Foundation documentation generation completed!');
    console.log('🔄 You can now run: npm run docs:consolidate');

  } catch (error) {
    console.error('❌ Foundation documentation generation failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Generate project data for template processing
 */
async function generateProjectData() {
  // Read package.json for project info
  let packageInfo = {};
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    packageInfo = JSON.parse(packageContent);
  } catch (error) {
    console.warn('⚠️  Could not read package.json, using defaults');
  }

  return {
    PROJECT_NAME: packageInfo.name || 'Tattoo Artist Directory MVP',
    PROJECT_DESCRIPTION: packageInfo.description || 'A comprehensive directory for tattoo artists and studios in the UK',
    VERSION: packageInfo.version || '1.0.0',
    LAST_UPDATED: new Date().toISOString().split('T')[0],
    
    // Overview
    OVERVIEW_DESCRIPTION: 'A serverless tattoo artist directory built with Next.js, AWS Lambda, and DynamoDB. This MVP provides a comprehensive platform for discovering tattoo artists and studios across the UK.',
    
    // Features
    FEATURES: [
      {
        FEATURE_NAME: 'Artist Search',
        FEATURE_DESCRIPTION: 'Location-based search with style filtering and keyword matching'
      },
      {
        FEATURE_NAME: 'Studio Profiles',
        FEATURE_DESCRIPTION: 'Comprehensive studio information with portfolio galleries'
      },
      {
        FEATURE_NAME: 'Performance Optimized',
        FEATURE_DESCRIPTION: 'Sub-500ms API responses with 90+ Lighthouse scores'
      },
      {
        FEATURE_NAME: 'Mobile First',
        FEATURE_DESCRIPTION: 'Responsive design optimized for mobile devices'
      }
    ],
    
    // Tech Stack
    TECH_STACK: [
      {
        CATEGORY: 'Frontend',
        TECHNOLOGIES: 'Next.js 14+, shadcn/ui, Tailwind CSS, React Query'
      },
      {
        CATEGORY: 'Backend',
        TECHNOLOGIES: 'AWS Lambda, API Gateway, DynamoDB, OpenSearch'
      },
      {
        CATEGORY: 'Infrastructure',
        TECHNOLOGIES: 'Terraform, AWS CloudFront, S3, Step Functions'
      },
      {
        CATEGORY: 'Development',
        TECHNOLOGIES: 'Docker, LocalStack, Jest, Playwright'
      }
    ],
    
    // Architecture
    ARCHITECTURE_OVERVIEW: 'The system follows a serverless architecture pattern with clear separation between frontend (Next.js), backend (AWS Lambda), and infrastructure (Terraform). All components are designed for scalability and performance.',
    
    ARCHITECTURE_DIAGRAM: `graph TB
    A[Frontend - Next.js] --> B[API Gateway]
    B --> C[Lambda Functions]
    C --> D[DynamoDB]
    C --> E[OpenSearch]
    F[CloudFront] --> A
    G[S3] --> F`,
    
    // Prerequisites
    PREREQUISITES: [
      {
        PREREQUISITE_NAME: 'Node.js 18+',
        PREREQUISITE_DESCRIPTION: 'JavaScript runtime for development'
      },
      {
        PREREQUISITE_NAME: 'Docker Desktop',
        PREREQUISITE_DESCRIPTION: 'For LocalStack and containerized development'
      },
      {
        PREREQUISITE_NAME: 'Git',
        PREREQUISITE_DESCRIPTION: 'Version control system'
      }
    ],
    
    // Quick Start
    REPOSITORY_URL: 'https://github.com/your-org/tattoo-directory-mvp.git',
    PROJECT_DIRECTORY: 'tattoo-directory-mvp',
    INSTALL_COMMAND: 'npm install',
    ENV_SETUP_COMMAND: 'cp .env.example .env.local',
    ENV_CONFIG_INSTRUCTIONS: 'Edit .env.local with your configuration',
    HEALTH_CHECK_COMMAND: 'npm run local:health',
    TEST_COMMAND: 'npm run test:integration',
    
    // Setup Scenarios
    SETUP_SCENARIOS: [
      {
        SCENARIO_NAME: 'Full Development Environment',
        SCENARIO_DESCRIPTION: 'Complete setup with all services running locally',
        SCENARIO_COMMANDS: 'npm run local:start\nnpm run setup-data'
      },
      {
        SCENARIO_NAME: 'Frontend Only',
        SCENARIO_DESCRIPTION: 'Frontend development with mock data',
        SCENARIO_COMMANDS: 'npm run dev:frontend\nnpm run setup-data:frontend-only'
      }
    ],
    
    // First Tasks
    FIRST_TASKS: [
      {
        TASK_DESCRIPTION: 'Set up your development environment',
        TASK_LINK: './DEVELOPMENT_GUIDE.md'
      },
      {
        TASK_DESCRIPTION: 'Explore the API endpoints',
        TASK_LINK: './API_REFERENCE.md'
      },
      {
        TASK_DESCRIPTION: 'Run the test suite',
        TASK_LINK: './docs/workflows/testing-strategies.md'
      }
    ],
    
    // URLs and Commands
    FRONTEND_URL: 'http://localhost:3000',
    FRONTEND_ONLY_SETUP: 'npm run dev:frontend',
    FULL_STACK_SETUP: 'npm run local:start',
    DOCKER_SETUP: 'npm run local:start',
    
    // Services
    SERVICES: [
      {
        SERVICE_NAME: 'Frontend',
        SERVICE_URL: 'http://localhost:3000'
      },
      {
        SERVICE_NAME: 'API',
        SERVICE_URL: 'http://localhost:3000/api'
      },
      {
        SERVICE_NAME: 'Swagger UI',
        SERVICE_URL: 'http://localhost:8080'
      }
    ],
    
    // Verification Steps
    VERIFICATION_STEPS: [
      {
        STEP_DESCRIPTION: 'Check all services are running',
        STEP_COMMAND: 'npm run local:health',
        EXPECTED_RESULT: 'All services show as healthy'
      },
      {
        STEP_DESCRIPTION: 'Verify data is loaded',
        STEP_COMMAND: 'npm run validate-data',
        EXPECTED_RESULT: 'Data validation passes'
      },
      {
        STEP_DESCRIPTION: 'Test API endpoints',
        STEP_COMMAND: 'curl http://localhost:3000/api/health',
        EXPECTED_RESULT: '{"status": "healthy"}'
      }
    ],
    
    // Quick Fixes
    QUICK_FIXES: [
      {
        ISSUE_NAME: 'Services won\'t start',
        FIX_COMMAND: 'npm run local:restart'
      },
      {
        ISSUE_NAME: 'Port conflicts',
        FIX_COMMAND: 'npm run local:clean && npm run local:start'
      },
      {
        ISSUE_NAME: 'Data issues',
        FIX_COMMAND: 'npm run reset-data'
      }
    ],
    
    // Links
    ISSUES_URL: 'https://github.com/your-org/tattoo-directory-mvp/issues',
    DISCUSSIONS_URL: 'https://github.com/your-org/tattoo-directory-mvp/discussions',
    BUG_REPORT_URL: 'https://github.com/your-org/tattoo-directory-mvp/issues/new?template=bug_report.md',
    
    // Other
    CONTRIBUTING_GUIDELINES: 'Please read our contributing guidelines before submitting pull requests.',
    CODE_STANDARDS: 'We use ESLint and Prettier for code formatting. TypeScript strict mode is enabled.',
    COMMUNITY_LINKS: 'Join our community discussions for support and feature requests.',
    LICENSE_INFO: 'This project is licensed under the MIT License.'
  };
}

/**
 * Create root-level documentation files from templates
 */
async function createRootLevelDocs(templateProcessor, projectData, stats) {
  console.log('📄 Creating root-level documentation files...');
  
  const rootFiles = [
    {
      template: 'README',
      output: 'docs/README.md',
      description: 'Main project README'
    },
    {
      template: 'QUICK_START',
      output: 'docs/QUICK_START.md',
      description: 'Quick start guide'
    }
  ];

  for (const file of rootFiles) {
    try {
      console.log(`   Creating ${file.description}...`);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(path.join(projectRoot, file.output)), { recursive: true });
      
      // Process template
      const content = await templateProcessor.processTemplate(file.template, projectData);
      
      // Write file
      await fs.writeFile(path.join(projectRoot, file.output), content, 'utf8');
      
      console.log(`   ✅ Created ${file.output}`);
      stats.filesCreated++;
      
    } catch (error) {
      console.error(`   ❌ Failed to create ${file.output}: ${error.message}`);
      stats.errorsEncountered++;
    }
  }
}

/**
 * Create missing directory structure
 */
async function createDirectoryStructure(stats) {
  console.log('\n📁 Creating directory structure...');
  
  const directories = [
    'docs/setup',
    'docs/architecture',
    'docs/workflows',
    'docs/reference',
    'docs/components',
    'docs/components/frontend',
    'docs/components/backend',
    'docs/components/infrastructure',
    'docs/components/scripts'
  ];

  for (const dir of directories) {
    try {
      const fullPath = path.join(projectRoot, dir);
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`   ✅ Created directory ${dir}`);
      stats.directoriesCreated++;
    } catch (error) {
      console.error(`   ❌ Failed to create directory ${dir}: ${error.message}`);
      stats.errorsEncountered++;
    }
  }
}

/**
 * Create basic files in directories to satisfy consolidation pipeline
 */
async function createDirectoryFiles(stats) {
  console.log('\n📝 Creating basic directory files...');
  
  const basicFiles = [
    {
      path: 'docs/setup/local-development.md',
      content: `# Local Development Setup

## Prerequisites
- Node.js 18+
- Docker Desktop
- Git

## Quick Setup
\`\`\`bash
npm install
npm run local:start
npm run setup-data
\`\`\`

For detailed setup instructions, see the [Development Guide](../DEVELOPMENT_GUIDE.md).
`
    },
    {
      path: 'docs/setup/dependencies.md',
      content: `# Dependencies

## Runtime Dependencies
- Node.js 18+
- Docker Desktop

## Development Dependencies
- Jest for testing
- ESLint for code quality
- Prettier for formatting

## Installation
\`\`\`bash
npm install
\`\`\`
`
    },
    {
      path: 'docs/setup/docker-setup.md',
      content: `# Docker Setup

## Prerequisites
- Docker Desktop installed and running

## Local Development
\`\`\`bash
# Start all services
npm run local:start

# Check status
npm run local:status

# View logs
npm run local:logs
\`\`\`

## Services
- LocalStack: AWS services emulation
- Frontend: Next.js development server
- Backend: Lambda Runtime Interface Emulator
`
    },
    {
      path: 'docs/architecture/system-overview.md',
      content: `# System Overview

## Architecture
The Tattoo Artist Directory MVP follows a serverless architecture pattern:

- **Frontend**: Next.js with App Router
- **Backend**: AWS Lambda functions
- **Database**: DynamoDB with single-table design
- **Search**: OpenSearch for location and style filtering
- **CDN**: CloudFront for static asset delivery

## Key Components
1. Artist search and filtering
2. Studio profile management
3. Image processing and optimization
4. Location-based search
`
    },
    {
      path: 'docs/architecture/api-design.md',
      content: `# API Design

## RESTful Endpoints
- \`GET /api/artists\` - List artists
- \`GET /api/artists/:id\` - Get artist details
- \`POST /api/artists/search\` - Search artists
- \`GET /api/studios\` - List studios
- \`GET /api/studios/:id\` - Get studio details

## Response Format
All API responses follow a consistent JSON structure with proper HTTP status codes.

## Authentication
Development uses API key authentication. Production will implement OAuth 2.0.
`
    },
    {
      path: 'docs/architecture/data-models.md',
      content: `# Data Models

## DynamoDB Single-Table Design
The system uses a single DynamoDB table with composite keys:

- \`ARTIST#{artistId}\` - Artist records
- \`STUDIO#{studioId}\` - Studio records
- \`STYLE#{styleId}\` - Style taxonomy

## OpenSearch Documents
Search documents are optimized for location and style queries with proper indexing.
`
    },
    {
      path: 'docs/workflows/testing-strategies.md',
      content: `# Testing Strategies

## Test Types
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and service integration
- **E2E Tests**: Full user workflow testing

## Commands
\`\`\`bash
npm run test:integration
npm run test:e2e
npm run test:studio
\`\`\`

## Coverage
Target 80%+ test coverage on core features.
`
    },
    {
      path: 'docs/workflows/deployment-process.md',
      content: `# Deployment Process

## Infrastructure
Deployment uses Terraform for infrastructure as code:

\`\`\`bash
cd infrastructure
terraform plan
terraform apply
\`\`\`

## CI/CD Pipeline
GitHub Actions handles automated testing and deployment.

## Environments
- Development: LocalStack
- Staging: AWS staging environment
- Production: AWS production environment
`
    },
    {
      path: 'docs/workflows/monitoring.md',
      content: `# Monitoring

## Health Checks
\`\`\`bash
npm run local:health
npm run studio-health
npm run performance:monitor
\`\`\`

## Metrics
- API response times
- Search query performance
- System resource usage
- Error rates and logging
`
    },
    {
      path: 'docs/reference/command-reference.md',
      content: `# Command Reference

## Local Development
- \`npm run local:start\` - Start all services
- \`npm run local:stop\` - Stop all services
- \`npm run local:health\` - Check system health

## Data Management
- \`npm run setup-data\` - Initialize test data
- \`npm run reset-data\` - Reset all data
- \`npm run validate-data\` - Validate data integrity

## Testing
- \`npm run test:integration\` - Integration tests
- \`npm run test:e2e\` - End-to-end tests

For detailed command descriptions, run any command with \`--help\`.
`
    }
  ];

  for (const file of basicFiles) {
    try {
      const fullPath = path.join(projectRoot, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf8');
      console.log(`   ✅ Created ${file.path}`);
      stats.filesCreated++;
    } catch (error) {
      console.error(`   ❌ Failed to create ${file.path}: ${error.message}`);
      stats.errorsEncountered++;
    }
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Generate Foundation Documentation

Usage:
  npm run docs:generate-foundation

This script:
1. Creates root-level docs/README.md and docs/QUICK_START.md from templates
2. Creates missing directory structure (setup/, architecture/, workflows/, reference/)
3. Populates directories with basic documentation files
4. Prepares the foundation for the consolidation pipeline

The generated files provide the foundation that the consolidation pipeline expects.
`);
  process.exit(0);
}

generateFoundationDocs();