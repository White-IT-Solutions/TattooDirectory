import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

/**
 * JUnitReporter generates JUnit XML output for CI/CD integration
 * Produces XML files compatible with Jenkins, GitHub Actions, and other CI systems
 */
class JUnitReporter {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './test-results',
      outputFile: options.outputFile || 'junit.xml',
      suiteName: options.suiteName || 'Unified Test CLI',
      includeConsoleOutput: options.includeConsoleOutput !== false,
      ...options
    };
    
    this.startTime = null;
    this.suiteResults = [];
    this.consoleOutput = [];
  }

  /**
   * Start reporting session
   */
  async start(suites = []) {
    this.startTime = performance.now();
    this.suiteResults = [];
    this.consoleOutput = [];
    
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
    this._addConsoleOutput(`Starting test suite: ${suiteName}`);
  }

  /**
   * Report suite completion
   */
  suiteComplete(result) {
    this.suiteResults.push(result);
    this._addConsoleOutput(`Completed test suite: ${result.suite} - ${result.status}`);
  }

  /**
   * Report parallel execution progress
   */
  parallelProgress(completed, total) {
    this._addConsoleOutput(`Parallel execution progress: ${completed}/${total} suites completed`);
  }

  /**
   * Report service validation status
   */
  serviceValidation(service, status, message) {
    this._addConsoleOutput(`Service validation - ${service}: ${status} - ${message || ''}`);
  }

  /**
   * Report data seeding status
   */
  dataSeeding(scenario, status, message) {
    this._addConsoleOutput(`Data seeding - ${scenario}: ${status} - ${message || ''}`);
  }

  /**
   * Generate and save JUnit XML report
   */
  async summary() {
    const endTime = performance.now();
    const totalDuration = (endTime - this.startTime) / 1000; // Convert to seconds
    
    const xml = this._generateJUnitXML(totalDuration);
    
    try {
      const outputPath = path.join(this.options.outputDir, this.options.outputFile);
      await fs.writeFile(outputPath, xml, 'utf8');
      
      return {
        success: this._isOverallSuccess(),
        outputPath,
        totalSuites: this.suiteResults.length,
        totalTests: this._getTotalTests(),
        passed: this._getPassedTests(),
        failed: this._getFailedTests(),
        skipped: this._getSkippedTests(),
        duration: Math.round(totalDuration * 1000) // Return in milliseconds
      };
    } catch (error) {
      throw new Error(`Failed to write JUnit XML report: ${error.message}`);
    }
  }

  /**
   * Log error message
   */
  error(message, error) {
    this._addConsoleOutput(`ERROR: ${message}${error ? ` - ${error.message}` : ''}`);
  }

  /**
   * Log warning message
   */
  warn(message) {
    this._addConsoleOutput(`WARNING: ${message}`);
  }

  /**
   * Log info message
   */
  info(message) {
    this._addConsoleOutput(`INFO: ${message}`);
  }

  // Private methods

  _generateJUnitXML(totalDuration) {
    const totalTests = this._getTotalTests();
    const failedTests = this._getFailedTests();
    const skippedTests = this._getSkippedTests();
    const errors = this._getTotalErrors();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="${this._escapeXML(this.options.suiteName)}" `;
    xml += `tests="${totalTests}" `;
    xml += `failures="${failedTests}" `;
    xml += `errors="${errors}" `;
    xml += `skipped="${skippedTests}" `;
    xml += `time="${totalDuration.toFixed(3)}" `;
    xml += `timestamp="${new Date().toISOString()}">\n`;
    
    // Add each test suite
    this.suiteResults.forEach(result => {
      xml += this._generateTestSuiteXML(result);
    });
    
    // Add system properties
    xml += this._generateSystemPropertiesXML();
    
    xml += '</testsuites>\n';
    
    return xml;
  }

  _generateTestSuiteXML(result) {
    const { suite, status, duration, tests, errors, startTime, endTime } = result;
    const durationSeconds = (duration || 0) / 1000;
    const testCount = tests ? tests.total : 0;
    const failureCount = tests ? tests.failed : 0;
    const skipCount = tests ? tests.skipped : 0;
    const errorCount = errors ? errors.length : 0;
    
    let xml = `  <testsuite name="${this._escapeXML(suite)}" `;
    xml += `tests="${testCount}" `;
    xml += `failures="${failureCount}" `;
    xml += `errors="${errorCount}" `;
    xml += `skipped="${skipCount}" `;
    xml += `time="${durationSeconds.toFixed(3)}" `;
    xml += `timestamp="${startTime ? new Date(startTime).toISOString() : new Date().toISOString()}">\n`;
    
    // Add test cases
    if (tests && tests.total > 0) {
      // Generate individual test cases based on the results
      xml += this._generateTestCasesXML(result);
    } else {
      // If no individual test data, create a single test case for the suite
      xml += this._generateSuiteTestCaseXML(result);
    }
    
    // Add system output if enabled
    if (this.options.includeConsoleOutput && this.consoleOutput.length > 0) {
      xml += '    <system-out><![CDATA[\n';
      xml += this.consoleOutput.join('\n');
      xml += '\n    ]]></system-out>\n';
    }
    
    xml += '  </testsuite>\n';
    
    return xml;
  }

  _generateTestCasesXML(result) {
    const { suite, status, duration, tests, errors } = result;
    let xml = '';
    
    // If we have detailed test information, use it
    if (tests && tests.details && Array.isArray(tests.details)) {
      tests.details.forEach(test => {
        xml += this._generateTestCaseXML(test, suite);
      });
    } else {
      // Generate test cases based on counts
      const passedCount = tests ? tests.passed : 0;
      const failedCount = tests ? tests.failed : 0;
      const skippedCount = tests ? tests.skipped : 0;
      
      // Create passed test cases
      for (let i = 0; i < passedCount; i++) {
        xml += this._generateTestCaseXML({
          name: `Test ${i + 1}`,
          status: 'passed',
          duration: duration / (tests.total || 1)
        }, suite);
      }
      
      // Create failed test cases
      for (let i = 0; i < failedCount; i++) {
        const error = errors && errors[i] ? errors[i] : { message: 'Test failed', test: `Failed Test ${i + 1}` };
        xml += this._generateTestCaseXML({
          name: error.test || `Failed Test ${i + 1}`,
          status: 'failed',
          duration: duration / (tests.total || 1),
          error: error
        }, suite);
      }
      
      // Create skipped test cases
      for (let i = 0; i < skippedCount; i++) {
        xml += this._generateTestCaseXML({
          name: `Skipped Test ${i + 1}`,
          status: 'skipped',
          duration: 0
        }, suite);
      }
    }
    
    return xml;
  }

  _generateTestCaseXML(test, suiteName) {
    const testName = this._escapeXML(test.name || 'Unknown Test');
    const className = this._escapeXML(suiteName);
    const duration = ((test.duration || 0) / 1000).toFixed(3);
    
    let xml = `    <testcase name="${testName}" classname="${className}" time="${duration}"`;
    
    if (test.status === 'failed' && test.error) {
      xml += '>\n';
      xml += `      <failure message="${this._escapeXML(test.error.message || 'Test failed')}" `;
      xml += `type="${this._escapeXML(test.error.type || 'AssertionError')}">\n`;
      xml += `        <![CDATA[${test.error.stack || test.error.message || 'No stack trace available'}]]>\n`;
      xml += '      </failure>\n';
      xml += '    </testcase>\n';
    } else if (test.status === 'skipped') {
      xml += '>\n';
      xml += '      <skipped/>\n';
      xml += '    </testcase>\n';
    } else {
      xml += '/>\n';
    }
    
    return xml;
  }

  _generateSuiteTestCaseXML(result) {
    const { suite, status, duration, errors } = result;
    const testName = this._escapeXML(`${suite} Suite`);
    const className = this._escapeXML(suite);
    const durationSeconds = ((duration || 0) / 1000).toFixed(3);
    
    let xml = `    <testcase name="${testName}" classname="${className}" time="${durationSeconds}"`;
    
    if (status === 'failed') {
      xml += '>\n';
      const errorMessage = errors && errors.length > 0 ? errors[0].message : 'Suite execution failed';
      const errorStack = errors && errors.length > 0 ? errors[0].stack : 'No stack trace available';
      
      xml += `      <failure message="${this._escapeXML(errorMessage)}" type="SuiteError">\n`;
      xml += `        <![CDATA[${errorStack}]]>\n`;
      xml += '      </failure>\n';
      xml += '    </testcase>\n';
    } else if (status === 'skipped') {
      xml += '>\n';
      xml += '      <skipped/>\n';
      xml += '    </testcase>\n';
    } else {
      xml += '/>\n';
    }
    
    return xml;
  }

  _generateSystemPropertiesXML() {
    let xml = '  <properties>\n';
    xml += `    <property name="platform" value="${process.platform}"/>\n`;
    xml += `    <property name="node.version" value="${process.version}"/>\n`;
    xml += `    <property name="test.framework" value="Unified Test CLI"/>\n`;
    xml += `    <property name="timestamp" value="${new Date().toISOString()}"/>\n`;
    xml += '  </properties>\n';
    return xml;
  }

  _addConsoleOutput(message) {
    if (this.options.includeConsoleOutput) {
      const timestamp = new Date().toISOString();
      this.consoleOutput.push(`[${timestamp}] ${message}`);
    }
  }

  _escapeXML(str) {
    if (typeof str !== 'string') {
      return String(str || '');
    }
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  _getTotalTests() {
    return this.suiteResults.reduce((total, result) => {
      return total + (result.tests ? result.tests.total : 0);
    }, 0);
  }

  _getPassedTests() {
    return this.suiteResults.reduce((total, result) => {
      return total + (result.tests ? result.tests.passed : 0);
    }, 0);
  }

  _getFailedTests() {
    return this.suiteResults.reduce((total, result) => {
      return total + (result.tests ? result.tests.failed : 0);
    }, 0);
  }

  _getSkippedTests() {
    return this.suiteResults.reduce((total, result) => {
      return total + (result.tests ? result.tests.skipped : 0);
    }, 0);
  }

  _getTotalErrors() {
    return this.suiteResults.reduce((total, result) => {
      return total + (result.errors ? result.errors.length : 0);
    }, 0);
  }

  _isOverallSuccess() {
    return this.suiteResults.every(result => result.status === 'passed' || result.status === 'skipped');
  }
}

export default JUnitReporter;