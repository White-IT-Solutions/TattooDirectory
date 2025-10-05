/**
 * Artifact Generator for CI/CD Integration
 * 
 * Generates test artifacts, reports, and metadata files for CI/CD systems
 * Supports multiple output formats and environment-specific configurations
 */

import fs from 'fs/promises';
import path from 'path';
import { CIDetector } from './ci-detector.js';
import { Logger } from './logger.js';

class ArtifactGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './test-results',
      generateSummary: options.generateSummary !== false,
      generateBadges: options.generateBadges !== false,
      generateManifest: options.generateManifest !== false,
      ...options
    };
    
    this.ciDetector = new CIDetector();
    this.logger = new Logger();
    this.artifacts = [];
  }

  /**
   * Generate all CI/CD artifacts
   * @param {Object} testResults - Test execution results
   * @param {Array} reporters - Array of reporter results
   * @returns {Object} Artifact generation summary
   */
  async generateArtifacts(testResults, reporters = []) {
    this.logger.info('Generating CI/CD artifacts', { 
      outputDir: this.options.outputDir,
      reporterCount: reporters.length 
    });

    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputDir, { recursive: true });

      // Generate summary file
      if (this.options.generateSummary) {
        await this._generateSummaryFile(testResults);
      }

      // Generate test manifest
      if (this.options.generateManifest) {
        await this._generateManifest(testResults, reporters);
      }

      // Generate badges (for README, etc.)
      if (this.options.generateBadges) {
        await this._generateBadges(testResults);
      }

      // Generate CI-specific artifacts
      await this._generateCISpecificArtifacts(testResults);

      // Generate artifact index
      await this._generateArtifactIndex();

      this.logger.success('CI/CD artifacts generated successfully', {
        artifactCount: this.artifacts.length,
        outputDir: this.options.outputDir
      });

      return {
        success: true,
        artifactCount: this.artifacts.length,
        artifacts: this.artifacts,
        outputDir: this.options.outputDir
      };
    } catch (error) {
      this.logger.error('Failed to generate CI/CD artifacts', { error: error.message });
      throw error;
    }
  }

  /**
   * Get exit code based on test results
   * @param {Object} testResults - Test execution results
   * @returns {number} Appropriate exit code for CI/CD
   */
  getExitCode(testResults) {
    return this.ciDetector.getExitCode(
      testResults.success,
      testResults.failedTests || 0
    );
  }

  /**
   * Generate environment-specific configuration
   * @returns {Object} CI/CD configuration
   */
  getCIConfig() {
    return this.ciDetector.getCIConfig();
  }

  // Private methods

  async _generateSummaryFile(testResults) {
    const summary = {
      timestamp: new Date().toISOString(),
      success: testResults.success,
      summary: {
        totalSuites: testResults.totalSuites || 0,
        totalTests: testResults.totalTests || 0,
        passed: testResults.passedTests || 0,
        failed: testResults.failedTests || 0,
        skipped: testResults.skippedTests || 0,
        duration: testResults.duration || 0,
        successRate: testResults.successRate || 0
      },
      environment: this.ciDetector.detectCIEnvironment(),
      exitCode: this.getExitCode(testResults)
    };

    const summaryPath = path.join(this.options.outputDir, 'summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    
    this.artifacts.push({
      type: 'summary',
      path: summaryPath,
      description: 'Test execution summary'
    });

    // Also generate a human-readable summary
    const readableSummary = this._generateReadableSummary(summary);
    const readablePath = path.join(this.options.outputDir, 'summary.txt');
    await fs.writeFile(readablePath, readableSummary, 'utf8');
    
    this.artifacts.push({
      type: 'summary-text',
      path: readablePath,
      description: 'Human-readable test summary'
    });
  }

  async _generateManifest(testResults, reporters) {
    const manifest = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      testFramework: 'Unified Test CLI',
      results: {
        success: testResults.success,
        totalSuites: testResults.totalSuites || 0,
        totalTests: testResults.totalTests || 0,
        duration: testResults.duration || 0
      },
      artifacts: [],
      reporters: reporters.map(reporter => ({
        type: reporter.type || 'unknown',
        outputPath: reporter.outputPath,
        success: reporter.success
      })),
      environment: {
        ci: this.ciDetector.isCI(),
        ciProvider: this.ciDetector.detectCIEnvironment(),
        node: process.version,
        platform: process.platform
      }
    };

    // Add reporter artifacts to manifest
    reporters.forEach(reporter => {
      if (reporter.outputPath) {
        manifest.artifacts.push({
          type: reporter.type || 'report',
          path: reporter.outputPath,
          format: this._getFileFormat(reporter.outputPath),
          size: null // Will be filled in later if needed
        });
      }
    });

    const manifestPath = path.join(this.options.outputDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    this.artifacts.push({
      type: 'manifest',
      path: manifestPath,
      description: 'Test artifact manifest'
    });
  }

  async _generateBadges(testResults) {
    const badges = {
      tests: {
        label: 'tests',
        message: `${testResults.passedTests || 0}/${testResults.totalTests || 0}`,
        color: testResults.success ? 'brightgreen' : 'red'
      },
      coverage: testResults.coverage ? {
        label: 'coverage',
        message: `${Math.round(testResults.coverage.overall || 0)}%`,
        color: this._getCoverageColor(testResults.coverage.overall || 0)
      } : null,
      status: {
        label: 'build',
        message: testResults.success ? 'passing' : 'failing',
        color: testResults.success ? 'brightgreen' : 'red'
      }
    };

    // Generate shields.io compatible JSON
    const badgesPath = path.join(this.options.outputDir, 'badges.json');
    await fs.writeFile(badgesPath, JSON.stringify(badges, null, 2), 'utf8');
    
    this.artifacts.push({
      type: 'badges',
      path: badgesPath,
      description: 'Badge data for README/documentation'
    });

    // Generate individual badge files
    for (const [key, badge] of Object.entries(badges)) {
      if (badge) {
        const badgePath = path.join(this.options.outputDir, `badge-${key}.json`);
        await fs.writeFile(badgePath, JSON.stringify(badge, null, 2), 'utf8');
        
        this.artifacts.push({
          type: `badge-${key}`,
          path: badgePath,
          description: `${key} badge data`
        });
      }
    }
  }

  async _generateCISpecificArtifacts(testResults) {
    const ciEnv = this.ciDetector.detectCIEnvironment();
    
    if (!ciEnv) {
      return;
    }

    // GitHub Actions specific artifacts
    if (ciEnv.type === 'github') {
      await this._generateGitHubArtifacts(testResults);
    }

    // Jenkins specific artifacts
    if (ciEnv.type === 'jenkins') {
      await this._generateJenkinsArtifacts(testResults);
    }

    // GitLab CI specific artifacts
    if (ciEnv.type === 'gitlab') {
      await this._generateGitLabArtifacts(testResults);
    }
  }

  async _generateGitHubArtifacts(testResults) {
    // Generate GitHub Actions summary
    const summary = this._generateGitHubSummary(testResults);
    const summaryPath = path.join(this.options.outputDir, 'github-summary.md');
    await fs.writeFile(summaryPath, summary, 'utf8');
    
    this.artifacts.push({
      type: 'github-summary',
      path: summaryPath,
      description: 'GitHub Actions job summary'
    });

    // Generate step summary for GitHub Actions
    if (process.env.GITHUB_STEP_SUMMARY) {
      try {
        await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
      } catch (error) {
        this.logger.warn('Could not write to GitHub step summary', { error: error.message });
      }
    }
  }

  async _generateJenkinsArtifacts(testResults) {
    // Generate Jenkins-compatible properties file
    const properties = [
      `test.success=${testResults.success}`,
      `test.total=${testResults.totalTests || 0}`,
      `test.passed=${testResults.passedTests || 0}`,
      `test.failed=${testResults.failedTests || 0}`,
      `test.duration=${testResults.duration || 0}`,
      `test.timestamp=${new Date().toISOString()}`
    ].join('\n');

    const propertiesPath = path.join(this.options.outputDir, 'test.properties');
    await fs.writeFile(propertiesPath, properties, 'utf8');
    
    this.artifacts.push({
      type: 'jenkins-properties',
      path: propertiesPath,
      description: 'Jenkins build properties'
    });
  }

  async _generateGitLabArtifacts(testResults) {
    // Generate GitLab CI report
    const report = {
      success: testResults.success,
      summary: `${testResults.passedTests || 0}/${testResults.totalTests || 0} tests passed`,
      details: {
        totalSuites: testResults.totalSuites || 0,
        totalTests: testResults.totalTests || 0,
        duration: testResults.duration || 0,
        timestamp: new Date().toISOString()
      }
    };

    const reportPath = path.join(this.options.outputDir, 'gitlab-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    this.artifacts.push({
      type: 'gitlab-report',
      path: reportPath,
      description: 'GitLab CI test report'
    });
  }

  async _generateArtifactIndex() {
    const index = {
      timestamp: new Date().toISOString(),
      totalArtifacts: this.artifacts.length,
      artifacts: this.artifacts.map(artifact => ({
        ...artifact,
        relativePath: path.relative(process.cwd(), artifact.path)
      }))
    };

    const indexPath = path.join(this.options.outputDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
    
    this.artifacts.push({
      type: 'index',
      path: indexPath,
      description: 'Artifact index'
    });
  }

  _generateReadableSummary(summary) {
    const lines = [
      '# Test Execution Summary',
      '',
      `**Status:** ${summary.success ? '✅ PASSED' : '❌ FAILED'}`,
      `**Timestamp:** ${summary.timestamp}`,
      `**Exit Code:** ${summary.exitCode}`,
      '',
      '## Results',
      `- Total Suites: ${summary.summary.totalSuites}`,
      `- Total Tests: ${summary.summary.totalTests}`,
      `- Passed: ${summary.summary.passed}`,
      `- Failed: ${summary.summary.failed}`,
      `- Skipped: ${summary.summary.skipped}`,
      `- Duration: ${summary.summary.duration}ms`,
      `- Success Rate: ${summary.summary.successRate}%`,
      ''
    ];

    if (summary.environment) {
      lines.push('## Environment');
      lines.push(`- CI Provider: ${summary.environment.name || 'Local'}`);
      lines.push(`- Build ID: ${summary.environment.buildId || 'N/A'}`);
      lines.push(`- Branch: ${summary.environment.branch || 'N/A'}`);
      lines.push(`- Commit: ${summary.environment.commit || 'N/A'}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  _generateGitHubSummary(testResults) {
    const status = testResults.success ? '✅' : '❌';
    const statusText = testResults.success ? 'PASSED' : 'FAILED';
    
    return `
# Test Results ${status}

## Summary
- **Status:** ${statusText}
- **Total Tests:** ${testResults.totalTests || 0}
- **Passed:** ${testResults.passedTests || 0}
- **Failed:** ${testResults.failedTests || 0}
- **Skipped:** ${testResults.skippedTests || 0}
- **Duration:** ${testResults.duration || 0}ms
- **Success Rate:** ${testResults.successRate || 0}%

## Test Suites
${testResults.suites ? testResults.suites.map(suite => 
  `- ${suite.status === 'passed' ? '✅' : '❌'} **${suite.suite}** (${Math.round(suite.duration || 0)}ms)`
).join('\n') : 'No suite details available'}

---
*Generated by Unified Test CLI*
`;
  }

  _getCoverageColor(percentage) {
    if (percentage >= 80) return 'brightgreen';
    if (percentage >= 60) return 'yellow';
    return 'red';
  }

  _getFileFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const formatMap = {
      '.json': 'json',
      '.xml': 'xml',
      '.txt': 'text',
      '.md': 'markdown',
      '.html': 'html',
      '.csv': 'csv'
    };
    return formatMap[ext] || 'unknown';
  }
}

export { ArtifactGenerator };