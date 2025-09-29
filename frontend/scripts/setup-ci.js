#!/usr/bin/env node

/**
 * CI/CD Setup Script for UI/UX Audit System
 * 
 * This script sets up the CI/CD integration including:
 * - GitHub Actions workflows
 * - Artifact storage configuration
 * - Baseline management
 * - Local testing capabilities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CISetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.repoRoot = path.resolve(this.projectRoot, '..');
    this.githubDir = path.join(this.repoRoot, '.github');
    this.workflowsDir = path.join(this.githubDir, 'workflows');
  }

  /**
   * Main setup function
   */
  async setup() {
    console.log('🚀 Setting up CI/CD integration for UI/UX audit system...\n');

    try {
      await this.validateEnvironment();
      await this.setupDirectories();
      await this.validateWorkflows();
      await this.setupArtifactStorage();
      await this.setupBaselineManagement();
      await this.setupLocalTesting();
      await this.generateDocumentation();
      
      console.log('\n✅ CI/CD integration setup completed successfully!');
      this.printNextSteps();
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate environment and dependencies
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Not in a git repository. Please run this from the project root.');
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required. Current version: ${nodeVersion}`);
    }

    // Check if Playwright is installed
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (!packageJson.devDependencies?.['@playwright/test']) {
        console.warn('⚠️  Playwright not found in devDependencies. Installing...');
        execSync('npm install --save-dev @playwright/test', { cwd: this.projectRoot });
      }
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Setup required directories
   */
  async setupDirectories() {
    console.log('📁 Setting up directories...');

    const directories = [
      this.githubDir,
      this.workflowsDir,
      path.join(this.projectRoot, 'test-results'),
      path.join(this.projectRoot, 'test-results', 'artifacts'),
      path.join(this.projectRoot, 'tests', 'e2e', 'visual-regression', 'baselines'),
      path.join(this.projectRoot, 'tests', 'e2e', 'visual-regression', 'screenshots'),
      path.join(this.projectRoot, 'config')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  Created: ${path.relative(this.repoRoot, dir)}`);
      }
    });

    console.log('✅ Directories setup completed');
  }

  /**
   * Validate GitHub Actions workflows
   */
  async validateWorkflows() {
    console.log('🔧 Validating GitHub Actions workflows...');

    const workflows = [
      'ui-ux-audit.yml',
      'baseline-management.yml',
      'artifact-management.yml'
    ];

    const issues = [];

    workflows.forEach(workflow => {
      const workflowPath = path.join(this.workflowsDir, workflow);
      if (!fs.existsSync(workflowPath)) {
        issues.push(`Missing workflow: ${workflow}`);
      } else {
        // Basic YAML validation
        try {
          const content = fs.readFileSync(workflowPath, 'utf8');
          if (!content.includes('on:') || !content.includes('jobs:')) {
            issues.push(`Invalid workflow structure: ${workflow}`);
          } else {
            console.log(`  ✅ ${workflow}`);
          }
        } catch (error) {
          issues.push(`Failed to read workflow: ${workflow}`);
        }
      }
    });

    if (issues.length > 0) {
      console.error('❌ Workflow validation issues:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      throw new Error('Workflow validation failed');
    }

    console.log('✅ Workflow validation passed');
  }

  /**
   * Setup artifact storage configuration
   */
  async setupArtifactStorage() {
    console.log('💾 Setting up artifact storage...');

    // Create .gitignore entries for test artifacts
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const gitignoreEntries = [
      '# UI/UX Test Artifacts',
      'test-results/',
      'playwright-report/',
      'tests/e2e/visual-regression/screenshots/',
      '!tests/e2e/visual-regression/baselines/',
      ''
    ].join('\n');

    if (fs.existsSync(gitignorePath)) {
      const existingContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!existingContent.includes('UI/UX Test Artifacts')) {
        fs.appendFileSync(gitignorePath, '\n' + gitignoreEntries);
        console.log('  Updated .gitignore with test artifact exclusions');
      }
    } else {
      fs.writeFileSync(gitignorePath, gitignoreEntries);
      console.log('  Created .gitignore with test artifact exclusions');
    }

    // Create artifact retention policy
    const retentionPolicy = {
      testResults: '30 days',
      screenshots: '30 days',
      baselines: '180 days',
      reports: '90 days',
      cleanupSchedule: 'Weekly on Sundays'
    };

    const policyPath = path.join(this.projectRoot, 'config', 'artifact-retention.json');
    fs.writeFileSync(policyPath, JSON.stringify(retentionPolicy, null, 2));
    console.log('  Created artifact retention policy');

    console.log('✅ Artifact storage setup completed');
  }

  /**
   * Setup baseline management
   */
  async setupBaselineManagement() {
    console.log('📸 Setting up baseline management...');

    // Create baseline directory structure
    const browsers = ['chromium', 'firefox', 'webkit'];
    const viewports = ['desktop', 'tablet', 'mobile'];
    const baselinesDir = path.join(this.projectRoot, 'tests', 'e2e', 'visual-regression', 'baselines');

    browsers.forEach(browser => {
      viewports.forEach(viewport => {
        const dir = path.join(baselinesDir, browser, viewport);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    });

    // Create baseline management README
    const readmePath = path.join(baselinesDir, 'README.md');
    const readmeContent = `# Visual Regression Baselines

This directory contains baseline screenshots for visual regression testing.

## Structure

\`\`\`
baselines/
├── chromium/
│   ├── desktop/
│   ├── tablet/
│   └── mobile/
├── firefox/
│   ├── desktop/
│   ├── tablet/
│   └── mobile/
└── webkit/
    ├── desktop/
    ├── tablet/
    └── mobile/
\`\`\`

## Management

- **Update All Baselines**: Use GitHub Actions workflow "Visual Baseline Management"
- **Update Specific**: Select browser/viewport in workflow dispatch
- **Rollback**: Provide commit SHA to rollback to previous baselines
- **Validate**: Check baseline integrity

## Local Management

\`\`\`bash
# Generate new baselines locally
npm run test:visual -- --update-snapshots

# Validate baselines
npm run test:visual -- --reporter=list
\`\`\`

## Guidelines

1. Only update baselines after visual changes are approved
2. Always validate baselines before committing
3. Use descriptive commit messages for baseline updates
4. Keep baseline files under version control
`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('  Created baseline management documentation');

    console.log('✅ Baseline management setup completed');
  }

  /**
   * Setup local testing capabilities
   */
  async setupLocalTesting() {
    console.log('🧪 Setting up local testing capabilities...');

    // Add npm scripts to package.json
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const newScripts = {
        'test:ui-audit': 'node scripts/ci-integration.js run comprehensive',
        'test:visual': 'playwright test tests/e2e/visual-regression',
        'test:accessibility': 'playwright test tests/e2e/accessibility',
        'test:theme': 'playwright test tests/e2e/theme-testing',
        'test:responsive': 'playwright test tests/e2e/responsive',
        'ci:test-integration': 'node scripts/ci-integration.js test-integration',
        'ci:local-workflow': 'node scripts/ci-integration.js run'
      };

      packageJson.scripts = { ...packageJson.scripts, ...newScripts };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('  Added npm scripts for local testing');
    }

    // Create local test configuration
    const localConfigPath = path.join(this.projectRoot, 'config', 'local-test.json');
    const localConfig = {
      baseUrl: 'http://localhost:3000',
      timeout: 30000,
      retries: 1,
      parallel: true,
      browsers: ['chromium'],
      viewports: ['desktop'],
      themes: ['light', 'dark'],
      skipSlowTests: true,
      debugMode: true
    };

    fs.writeFileSync(localConfigPath, JSON.stringify(localConfig, null, 2));
    console.log('  Created local test configuration');

    console.log('✅ Local testing setup completed');
  }

  /**
   * Generate documentation
   */
  async generateDocumentation() {
    console.log('📚 Generating documentation...');

    const docPath = path.join(this.projectRoot, 'CI_CD_INTEGRATION.md');
    const documentation = `# CI/CD Integration for UI/UX Audit System

This document describes the CI/CD integration for automated UI/UX auditing and visual regression testing.

## Overview

The CI/CD system provides:
- Automated visual regression testing on pull requests
- Nightly comprehensive UI/UX audits
- Baseline management for visual tests
- Artifact storage and cleanup
- Pull request integration with test results

## Workflows

### 1. UI/UX Audit (\`.github/workflows/ui-ux-audit.yml\`)

**Triggers:**
- Pull requests affecting frontend code
- Nightly schedule (2 AM UTC)
- Manual dispatch with configurable test types

**Test Matrix:**
- Browsers: Chromium, Firefox, WebKit
- Viewports: Desktop, Tablet, Mobile
- Themes: Light, Dark

**Outputs:**
- Visual regression reports
- Accessibility compliance reports
- Theme compatibility reports
- Responsive design validation
- Consolidated UI audit report

### 2. Baseline Management (\`.github/workflows/baseline-management.yml\`)

**Actions:**
- Update all baselines
- Update specific browser/viewport combinations
- Rollback to previous baselines
- Validate baseline integrity

**Usage:**
\`\`\`bash
# Update all baselines
gh workflow run baseline-management.yml -f action=update-all

# Update specific combination
gh workflow run baseline-management.yml -f action=update-specific -f browser=chromium -f viewport=desktop

# Rollback to specific commit
gh workflow run baseline-management.yml -f action=rollback -f commit_sha=abc123
\`\`\`

### 3. Artifact Management (\`.github/workflows/artifact-management.yml\`)

**Features:**
- Weekly cleanup of old artifacts
- Storage usage monitoring
- Monthly report archiving
- Automated alerts for high storage usage

## Local Testing

### Quick Start

\`\`\`bash
# Run comprehensive local audit
npm run test:ui-audit

# Run specific test types
npm run test:visual
npm run test:accessibility
npm run test:theme
npm run test:responsive

# Test CI integration
npm run ci:test-integration
\`\`\`

### Local Workflow Simulation

\`\`\`bash
# Simulate full CI workflow locally
npm run ci:local-workflow

# Simulate specific workflow type
node scripts/ci-integration.js run visual-regression
\`\`\`

## Configuration

### CI Configuration (\`config/ci-config.json\`)

Contains all CI/CD settings including:
- Workflow triggers and schedules
- Test matrix configurations
- Timeout and retry settings
- Artifact retention policies
- Reporting preferences

### Local Configuration (\`config/local-test.json\`)

Optimized settings for local development:
- Reduced test matrix
- Shorter timeouts
- Debug mode enabled
- Skip slow tests

## Pull Request Integration

When a PR is created or updated:

1. **Automatic Testing**: Visual regression tests run automatically
2. **Status Checks**: PR status updated with test results
3. **Comment Generation**: Detailed report posted as PR comment
4. **Artifact Links**: Links to detailed reports and screenshots

### Example PR Comment

\`\`\`
## UI/UX Audit Results ✅ All tests passed

### Summary
- **Total Issues**: 0
- **Critical**: 0
- **Major**: 0
- **Minor**: 0
- **Accessibility Score**: 98%
- **Visual Regressions**: 0

### Test Coverage
- Visual Regression Testing: 15 pages tested
- Accessibility Compliance: WCAG 2.1 AA validation
- Theme Compatibility: Light/Dark mode testing
- Responsive Design: Multi-device validation

📊 [View Detailed Report](https://github.com/repo/actions/runs/123456)
\`\`\`

## Artifact Storage

### Retention Policies

- **Test Results**: 30 days
- **Screenshots**: 30 days  
- **Baselines**: 180 days
- **Reports**: 90 days

### Storage Management

- Automatic cleanup runs weekly
- Storage usage monitoring
- Alerts when usage exceeds 1GB
- Baseline preservation during cleanup

## Troubleshooting

### Common Issues

1. **Flaky Tests**: Increase retry count in configuration
2. **Timeout Errors**: Adjust timeout settings for slow environments
3. **Storage Limits**: Run artifact cleanup or reduce retention periods
4. **Baseline Drift**: Use baseline validation workflow

### Debug Mode

Enable debug mode for detailed logging:

\`\`\`bash
DEBUG=1 npm run test:ui-audit
\`\`\`

### Manual Intervention

- **Update Baselines**: Use baseline management workflow
- **Clear Artifacts**: Run artifact cleanup workflow
- **Validate Setup**: Use integration test script

## Best Practices

1. **Baseline Management**:
   - Only update baselines after visual changes are approved
   - Always validate baselines before committing
   - Use descriptive commit messages

2. **Test Maintenance**:
   - Regularly review and update test selectors
   - Monitor test execution times
   - Keep test data up to date

3. **CI Optimization**:
   - Use parallel execution for faster results
   - Cache dependencies and browser installations
   - Optimize artifact sizes

4. **Monitoring**:
   - Set up alerts for critical failures
   - Monitor storage usage trends
   - Track test execution metrics

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review workflow logs in GitHub Actions
3. Run local integration tests
4. Create an issue with detailed logs
`;

    fs.writeFileSync(docPath, documentation);
    console.log('  Created CI/CD integration documentation');

    console.log('✅ Documentation generation completed');
  }

  /**
   * Print next steps for the user
   */
  printNextSteps() {
    console.log(`
🎉 CI/CD Integration Setup Complete!

Next Steps:

1. **Commit the changes**:
   git add .
   git commit -m "Add CI/CD integration for UI/UX audit system"
   git push

2. **Test the integration**:
   npm run ci:test-integration

3. **Run local audit**:
   npm run test:ui-audit

4. **Create a test PR** to see the workflow in action

5. **Configure GitHub repository settings**:
   - Enable GitHub Actions if not already enabled
   - Set up branch protection rules
   - Configure required status checks

6. **Optional: Set up notifications**:
   - Add SLACK_WEBHOOK secret for Slack notifications
   - Add TEAMS_WEBHOOK secret for Teams notifications

📚 Documentation: frontend/CI_CD_INTEGRATION.md
🔧 Configuration: frontend/config/ci-config.json
🧪 Local Testing: npm run test:ui-audit

Happy testing! 🚀
`);
  }
}

// CLI interface
if (require.main === module) {
  const setup = new CISetup();
  setup.setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = CISetup;