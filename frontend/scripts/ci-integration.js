#!/usr/bin/env node

/**
 * CI/CD Integration Script for UI/UX Audit System
 * 
 * This script provides local testing capabilities for CI/CD workflows
 * and integration with GitHub Actions for UI/UX auditing.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class CIIntegration {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testResultsDir = path.join(this.projectRoot, 'test-results');
    this.artifactsDir = path.join(this.testResultsDir, 'artifacts');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.testResultsDir, this.artifactsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Simulate GitHub Actions workflow locally
   */
  async runLocalWorkflow(workflowType = 'comprehensive') {
    console.log(`🚀 Running local ${workflowType} workflow simulation...`);
    
    try {
      // Start development server
      console.log('📦 Starting development server...');
      const serverProcess = this.startDevServer();
      
      // Wait for server to be ready
      await this.waitForServer('http://localhost:3000', 60000);
      
      // Run tests based on workflow type
      const results = await this.runTestSuite(workflowType);
      
      // Generate reports
      console.log('📊 Generating consolidated report...');
      const report = await this.generateConsolidatedReport(results);
      
      // Save artifacts
      await this.saveArtifacts(report, results);
      
      // Cleanup
      serverProcess.kill();
      
      console.log('✅ Local workflow simulation completed');
      return report;
      
    } catch (error) {
      console.error('❌ Workflow simulation failed:', error.message);
      throw error;
    }
  }

  /**
   * Start development server
   */
  startDevServer() {
    console.log('Starting Next.js development server...');
    
    // Handle Windows npm command
    const isWindows = process.platform === 'win32';
    const npmCommand = isWindows ? 'npm.cmd' : 'npm';
    
    const serverProcess = spawn(npmCommand, ['run', 'dev'], {
      cwd: this.projectRoot,
      stdio: 'pipe',
      detached: false,
      shell: isWindows
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready')) {
        console.log('✅ Development server ready');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    return serverProcess;
  }

  /**
   * Wait for server to be ready
   */
  async waitForServer(url, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // Use http module instead of fetch for better compatibility
        const http = require('http');
        const urlObj = new URL(url);
        
        await new Promise((resolve, reject) => {
          const req = http.get({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            timeout: 5000
          }, (res) => {
            if (res.statusCode === 200) {
              resolve(true);
            } else {
              reject(new Error(`Server returned ${res.statusCode}`));
            }
          });
          
          req.on('error', reject);
          req.on('timeout', () => reject(new Error('Request timeout')));
        });
        
        return true;
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Server not ready after ${timeout}ms`);
  }

  /**
   * Run test suite based on workflow type
   */
  async runTestSuite(workflowType) {
    const results = {};
    
    switch (workflowType) {
      case 'visual-regression':
        results.visual = await this.runVisualTests();
        break;
        
      case 'accessibility':
        results.accessibility = await this.runAccessibilityTests();
        break;
        
      case 'theme-testing':
        results.theme = await this.runThemeTests();
        break;
        
      case 'responsive':
        results.responsive = await this.runResponsiveTests();
        break;
        
      case 'comprehensive':
      default:
        console.log('🧪 Running comprehensive test suite...');
        results.visual = await this.runVisualTests();
        results.accessibility = await this.runAccessibilityTests();
        results.theme = await this.runThemeTests();
        results.responsive = await this.runResponsiveTests();
        break;
    }
    
    return results;
  }

  /**
   * Run visual regression tests
   */
  async runVisualTests() {
    console.log('📸 Running visual regression tests...');
    
    try {
      const output = execSync(
        'npx playwright test tests/e2e/visual-regression --reporter=json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      return this.parseTestOutput(output, 'visual');
    } catch (error) {
      console.warn('Visual tests had failures:', error.message);
      return this.parseTestOutput(error.stdout || '{}', 'visual');
    }
  }

  /**
   * Run accessibility tests
   */
  async runAccessibilityTests() {
    console.log('♿ Running accessibility tests...');
    
    try {
      const output = execSync(
        'npx playwright test tests/e2e/accessibility --reporter=json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      return this.parseTestOutput(output, 'accessibility');
    } catch (error) {
      console.warn('Accessibility tests had failures:', error.message);
      return this.parseTestOutput(error.stdout || '{}', 'accessibility');
    }
  }

  /**
   * Run theme tests
   */
  async runThemeTests() {
    console.log('🎨 Running theme tests...');
    
    try {
      const output = execSync(
        'npx playwright test tests/e2e/theme-testing --reporter=json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      return this.parseTestOutput(output, 'theme');
    } catch (error) {
      console.warn('Theme tests had failures:', error.message);
      return this.parseTestOutput(error.stdout || '{}', 'theme');
    }
  }

  /**
   * Run responsive tests
   */
  async runResponsiveTests() {
    console.log('📱 Running responsive tests...');
    
    try {
      const output = execSync(
        'npx playwright test tests/e2e/responsive --reporter=json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      return this.parseTestOutput(output, 'responsive');
    } catch (error) {
      console.warn('Responsive tests had failures:', error.message);
      return this.parseTestOutput(error.stdout || '{}', 'responsive');
    }
  }

  /**
   * Parse test output
   */
  parseTestOutput(output, testType) {
    try {
      const result = JSON.parse(output);
      return {
        type: testType,
        timestamp: new Date().toISOString(),
        ...result
      };
    } catch (error) {
      console.warn(`Failed to parse ${testType} test output:`, error.message);
      return {
        type: testType,
        timestamp: new Date().toISOString(),
        error: error.message,
        rawOutput: output
      };
    }
  }

  /**
   * Generate consolidated report
   */
  async generateConsolidatedReport(results) {
    const { ReportAggregator } = require('../tests/e2e/reporting/ReportAggregator');
    const aggregator = new ReportAggregator();
    
    // Convert results to format expected by ReportAggregator
    const testResults = Object.values(results).filter(Boolean);
    
    const report = await aggregator.generateConsolidatedReport(testResults);
    
    // Add CI-specific metadata
    report.ciMetadata = {
      runId: `local-${Date.now()}`,
      environment: 'local',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };
    
    return report;
  }

  /**
   * Save artifacts
   */
  async saveArtifacts(report, results) {
    console.log('💾 Saving test artifacts...');
    
    // Save consolidated report
    const reportPath = path.join(this.testResultsDir, 'ui-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save individual test results
    Object.entries(results).forEach(([type, result]) => {
      if (result) {
        const resultPath = path.join(this.artifactsDir, `${type}-results.json`);
        fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
      }
    });
    
    // Generate HTML report
    const { ReportAggregator } = require('../tests/e2e/reporting/ReportAggregator');
    const aggregator = new ReportAggregator();
    const htmlReport = await aggregator.generateHTMLReport(report);
    
    const htmlPath = path.join(this.testResultsDir, 'ui-audit-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`📄 Reports saved to: ${this.testResultsDir}`);
  }

  /**
   * Simulate PR comment generation
   */
  generatePRComment(report) {
    const summary = report.summary || {};
    const criticalIssues = summary.criticalIssues || 0;
    const majorIssues = summary.majorIssues || 0;
    const minorIssues = summary.minorIssues || 0;
    const totalIssues = summary.totalIssues || 0;
    
    const accessibilityScore = summary.accessibilityScore || 0;
    const visualRegressions = summary.visualRegressionCount || 0;
    
    let status = '✅ All tests passed';
    if (criticalIssues > 0) {
      status = '❌ Critical issues found';
    } else if (majorIssues > 0) {
      status = '⚠️ Major issues found';
    } else if (minorIssues > 0) {
      status = '⚡ Minor issues found';
    }
    
    const comment = `## UI/UX Audit Results ${status}
    
### Summary
- **Total Issues**: ${totalIssues}
- **Critical**: ${criticalIssues}
- **Major**: ${majorIssues}
- **Minor**: ${minorIssues}
- **Accessibility Score**: ${accessibilityScore}%
- **Visual Regressions**: ${visualRegressions}

### Test Coverage
- Visual Regression Testing: ${report.pageReports?.length || 0} pages tested
- Accessibility Compliance: WCAG 2.1 AA validation
- Theme Compatibility: Light/Dark mode testing
- Responsive Design: Multi-device validation

${criticalIssues > 0 ? '⚠️ **Action Required**: Critical accessibility or visual issues detected that may impact user experience.' : ''}

📊 View detailed report in test-results/ui-audit-report.html
`;
    
    return comment;
  }

  /**
   * Test GitHub Actions integration
   */
  async testGitHubIntegration() {
    console.log('🔧 Testing GitHub Actions integration...');
    
    const workflowFiles = [
      '.github/workflows/ui-ux-audit.yml',
      '.github/workflows/baseline-management.yml',
      '.github/workflows/artifact-management.yml'
    ];
    
    const issues = [];
    
    workflowFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, '..', file);
      if (!fs.existsSync(filePath)) {
        issues.push(`Missing workflow file: ${file}`);
      } else {
        console.log(`✅ Found workflow: ${file}`);
      }
    });
    
    // Test workflow syntax (basic YAML validation)
    workflowFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, '..', file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          // Basic validation - check for required sections
          if (!content.includes('on:') || !content.includes('jobs:')) {
            issues.push(`Invalid workflow structure in ${file}`);
          }
        } catch (error) {
          issues.push(`Failed to read workflow file ${file}: ${error.message}`);
        }
      }
    });
    
    if (issues.length > 0) {
      console.error('❌ GitHub Actions integration issues:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      return false;
    }
    
    console.log('✅ GitHub Actions integration looks good');
    return true;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const ci = new CIIntegration();
  
  switch (command) {
    case 'run':
      const workflowType = args[1] || 'comprehensive';
      ci.runLocalWorkflow(workflowType)
        .then(report => {
          console.log('\n📊 Test Summary:');
          console.log(ci.generatePRComment(report));
        })
        .catch(error => {
          console.error('❌ Workflow failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'test-integration':
      ci.testGitHubIntegration()
        .then(success => {
          process.exit(success ? 0 : 1);
        });
      break;
      
    case 'help':
    default:
      console.log(`
UI/UX Audit CI/CD Integration Script

Usage:
  node ci-integration.js <command> [options]

Commands:
  run [type]           Run local workflow simulation
                       Types: visual-regression, accessibility, theme-testing, responsive, comprehensive
  test-integration     Test GitHub Actions integration
  help                 Show this help message

Examples:
  node ci-integration.js run comprehensive
  node ci-integration.js run visual-regression
  node ci-integration.js test-integration
`);
      break;
  }
}

module.exports = CIIntegration;