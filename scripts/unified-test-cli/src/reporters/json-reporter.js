/**
 * JSONReporter generates machine-readable JSON output for CI/CD integration
 * Produces structured JSON files for automated processing and analysis
 */

import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

class JSONReporter {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './test-results',
      outputFile: options.outputFile || 'results.json',
      includeDetails: options.includeDetails !== false,
      includeEnvironment: options.includeEnvironment !== false,
      includeTiming: options.includeTiming !== false,
      ...options
    };
    
    this.startTime = null;
    this.suiteResults = [];
    this.metadata = {
      environment: {},
      execution: {},
      system: {}
    };
  }

  /**
   * Start reporting session
   */
  async start(suites = []) {
    this.startTime = performance.now();
    this.suiteResults = [];
    
    // Collect environment metadata
    if (this.options.includeEnvironment) {
      this.metadata.environment = this._collectEnvironmentInfo();
    }
    
    // Collect system metadata
    this.metadata.system = this._collectSystemInfo();
    
    // Initialize execution metadata
    this.metadata.execution = {
      startTime: new Date().toISOString(),
      suites: suites,
      totalSuites: suites.length
    };
    
    // Ensure output directory exists
    try {
      await fs.mkdir(this.options.outputDir, { recursive: true });
    } catch (error) {
      console.warn(`Warning: Could not create output directory ${this.options.outputDir}: ${error.message}`);
    }
  }

  /**
   * Report suite start
   */
  suiteStart(suiteName) {
    // JSON reporter doesn't need real-time updates
    // All data is collected and written at the end
  }

  /**
   * Report suite completion
   */
  suiteComplete(result) {
    // Enhance result with additional metadata
    const enhancedResult = {
      ...result,
      timestamp: new Date().toISOString(),
      duration: result.duration || 0,
      durationSeconds: (result.duration || 0) / 1000
    };
    
    this.suiteResults.push(enhancedResult);
  }

  /**
   * Report parallel execution progress
   */
  parallelProgress(completed, total) {
    // Update execution metadata
    this.metadata.execution.parallelProgress = {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Report service validation status
   */
  serviceValidation(service, status, message) {
    if (!this.metadata.execution.serviceValidation) {
      this.metadata.execution.serviceValidation = [];
    }
    
    this.metadata.execution.serviceValidation.push({
      service,
      status,
      message: message || null,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Report data seeding status
   */
  dataSeeding(scenario, status, message) {
    if (!this.metadata.execution.dataSeeding) {
      this.metadata.execution.dataSeeding = [];
    }
    
    this.metadata.execution.dataSeeding.push({
      scenario,
      status,
      message: message || null,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate and save JSON report
   */
  async summary() {
    const endTime = performance.now();
    const totalDuration = endTime - this.startTime;
    
    // Calculate summary statistics
    const summary = this._calculateSummary(totalDuration);
    
    // Build complete report structure
    const report = {
      metadata: {
        ...this.metadata,
        execution: {
          ...this.metadata.execution,
          endTime: new Date().toISOString(),
          totalDuration: Math.round(totalDuration),
          totalDurationSeconds: totalDuration / 1000
        }
      },
      summary,
      suites: this.options.includeDetails ? this.suiteResults : this._getSuiteSummaries(),
      ...(this.options.includeTiming && { timing: this._getTimingBreakdown() })
    };
    
    try {
      const outputPath = path.join(this.options.outputDir, this.options.outputFile);
      const jsonContent = JSON.stringify(report, null, 2);
      await fs.writeFile(outputPath, jsonContent, 'utf8');
      
      return {
        success: summary.success,
        outputPath,
        ...summary
      };
    } catch (error) {
      throw new Error(`Failed to write JSON report: ${error.message}`);
    }
  }

  /**
   * Log error message
   */
  error(message, error) {
    if (!this.metadata.execution.errors) {
      this.metadata.execution.errors = [];
    }
    
    this.metadata.execution.errors.push({
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log warning message
   */
  warn(message) {
    if (!this.metadata.execution.warnings) {
      this.metadata.execution.warnings = [];
    }
    
    this.metadata.execution.warnings.push({
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log info message
   */
  info(message) {
    if (!this.metadata.execution.info) {
      this.metadata.execution.info = [];
    }
    
    this.metadata.execution.info.push({
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Private methods

  _calculateSummary(totalDuration) {
    const totalSuites = this.suiteResults.length;
    const passedSuites = this.suiteResults.filter(r => r.status === 'passed').length;
    const failedSuites = this.suiteResults.filter(r => r.status === 'failed').length;
    const skippedSuites = this.suiteResults.filter(r => r.status === 'skipped').length;
    
    const totalTests = this.suiteResults.reduce((sum, r) => sum + (r.tests?.total || 0), 0);
    const passedTests = this.suiteResults.reduce((sum, r) => sum + (r.tests?.passed || 0), 0);
    const failedTests = this.suiteResults.reduce((sum, r) => sum + (r.tests?.failed || 0), 0);
    const skippedTests = this.suiteResults.reduce((sum, r) => sum + (r.tests?.skipped || 0), 0);
    
    const success = failedSuites === 0 && failedTests === 0;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    return {
      success,
      totalSuites,
      passedSuites,
      failedSuites,
      skippedSuites,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate,
      totalDuration: Math.round(totalDuration),
      totalDurationSeconds: totalDuration / 1000,
      averageSuiteDuration: totalSuites > 0 ? Math.round(totalDuration / totalSuites) : 0
    };
  }

  _getSuiteSummaries() {
    return this.suiteResults.map(result => ({
      suite: result.suite,
      status: result.status,
      duration: result.duration,
      durationSeconds: result.durationSeconds,
      tests: result.tests ? {
        total: result.tests.total,
        passed: result.tests.passed,
        failed: result.tests.failed,
        skipped: result.tests.skipped
      } : null,
      errorCount: result.errors ? result.errors.length : 0,
      timestamp: result.timestamp
    }));
  }

  _getTimingBreakdown() {
    const suiteTimings = this.suiteResults.map(result => ({
      suite: result.suite,
      duration: result.duration || 0,
      durationSeconds: (result.duration || 0) / 1000,
      percentage: this.startTime ? Math.round(((result.duration || 0) / (performance.now() - this.startTime)) * 100) : 0
    }));
    
    // Sort by duration (longest first)
    suiteTimings.sort((a, b) => b.duration - a.duration);
    
    return {
      suites: suiteTimings,
      slowestSuite: suiteTimings[0] || null,
      fastestSuite: suiteTimings[suiteTimings.length - 1] || null,
      averageDuration: suiteTimings.length > 0 
        ? Math.round(suiteTimings.reduce((sum, s) => sum + s.duration, 0) / suiteTimings.length)
        : 0
    };
  }

  _collectEnvironmentInfo() {
    return {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      ci: {
        isCI: process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true',
        provider: this._detectCIProvider(),
        buildId: process.env.BUILD_ID || process.env.BUILD_NUMBER || process.env.GITHUB_RUN_ID || null,
        branch: process.env.BRANCH_NAME || process.env.GIT_BRANCH || process.env.GITHUB_REF_NAME || null,
        commit: process.env.GIT_COMMIT || process.env.GITHUB_SHA || null
      },
      workspace: {
        cwd: process.cwd(),
        packageManager: this._detectPackageManager()
      }
    };
  }

  _collectSystemInfo() {
    return {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    };
  }

  _detectCIProvider() {
    const ciProviders = {
      'GITHUB_ACTIONS': 'GitHub Actions',
      'JENKINS_URL': 'Jenkins',
      'GITLAB_CI': 'GitLab CI',
      'AZURE_HTTP_USER_AGENT': 'Azure DevOps',
      'CIRCLECI': 'CircleCI',
      'TRAVIS': 'Travis CI',
      'BUILDKITE': 'Buildkite',
      'TEAMCITY_VERSION': 'TeamCity'
    };

    for (const [envVar, provider] of Object.entries(ciProviders)) {
      if (process.env[envVar]) {
        return provider;
      }
    }

    return null;
  }

  _detectPackageManager() {
    if (process.env.npm_execpath) {
      if (process.env.npm_execpath.includes('yarn')) {
        return 'yarn';
      } else if (process.env.npm_execpath.includes('pnpm')) {
        return 'pnpm';
      } else {
        return 'npm';
      }
    }
    return 'unknown';
  }
}

export { JSONReporter };