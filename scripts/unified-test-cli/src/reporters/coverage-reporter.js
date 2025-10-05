import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

/**
 * CoverageReporter analyzes and reports test coverage data
 * Aggregates coverage from multiple test suites and generates comprehensive reports
 */
class CoverageReporter {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './coverage',
      formats: options.formats || ['json', 'lcov', 'html'],
      threshold: {
        lines: options.threshold?.lines || 80,
        functions: options.threshold?.functions || 80,
        branches: options.threshold?.branches || 80,
        statements: options.threshold?.statements || 80,
        ...options.threshold
      },
      includeUncovered: options.includeUncovered !== false,
      ...options
    };
    
    this.startTime = null;
    this.coverageData = {};
    this.suiteResults = [];
  }

  /**
   * Start reporting session
   */
  async start(suites = []) {
    this.startTime = performance.now();
    this.coverageData = {};
    this.suiteResults = [];
    
    // Ensure output directory exists
    try {
      await fs.mkdir(this.options.outputDir, { recursive: true });
    } catch (error) {
      console.warn(`Warning: Could not create coverage output directory ${this.options.outputDir}: ${error.message}`);
    }
  }

  /**
   * Report suite start
   */
  suiteStart(suiteName) {
    // Coverage reporter doesn't need to track suite starts
  }

  /**
   * Report suite completion with coverage data
   */
  suiteComplete(result) {
    this.suiteResults.push(result);
    
    // Merge coverage data if available
    if (result.coverage && result.coverageData) {
      this._mergeCoverageData(result.coverageData, result.suite);
    }
  }

  /**
   * Report parallel execution progress
   */
  parallelProgress(completed, total) {
    // Coverage reporter doesn't need to track parallel progress
  }

  /**
   * Report service validation status
   */
  serviceValidation(service, status, message) {
    // Coverage reporter doesn't need to track service validation
  }

  /**
   * Report data seeding status
   */
  dataSeeding(scenario, status, message) {
    // Coverage reporter doesn't need to track data seeding
  }

  /**
   * Generate comprehensive coverage report
   */
  async summary() {
    const endTime = performance.now();
    const totalDuration = Math.round(endTime - this.startTime);
    
    // Calculate aggregated coverage metrics
    const aggregatedCoverage = this._calculateAggregatedCoverage();
    
    // Generate reports in requested formats
    const reports = {};
    
    if (this.options.formats.includes('json')) {
      reports.json = await this._generateJSONReport(aggregatedCoverage);
    }
    
    if (this.options.formats.includes('lcov')) {
      reports.lcov = await this._generateLCOVReport(aggregatedCoverage);
    }
    
    if (this.options.formats.includes('html')) {
      reports.html = await this._generateHTMLReport(aggregatedCoverage);
    }
    
    // Check coverage thresholds
    const thresholdResults = this._checkThresholds(aggregatedCoverage);
    
    return {
      success: thresholdResults.passed,
      coverage: aggregatedCoverage,
      thresholds: thresholdResults,
      reports,
      duration: totalDuration,
      suiteCount: this.suiteResults.length
    };
  }

  /**
   * Log error message
   */
  error(message, error) {
    console.error(`Coverage Reporter Error: ${message}${error ? ` - ${error.message}` : ''}`);
  }

  /**
   * Log warning message
   */
  warn(message) {
    console.warn(`Coverage Reporter Warning: ${message}`);
  }

  /**
   * Log info message
   */
  info(message) {
    console.info(`Coverage Reporter Info: ${message}`);
  }

  // Private methods

  _mergeCoverageData(newCoverageData, suiteName) {
    // Merge file-level coverage data
    Object.keys(newCoverageData).forEach(filePath => {
      const fileCoverage = newCoverageData[filePath];
      
      if (!this.coverageData[filePath]) {
        this.coverageData[filePath] = {
          ...fileCoverage,
          suites: [suiteName]
        };
      } else {
        // Merge coverage data for the same file from different suites
        this.coverageData[filePath] = this._mergeFileCoverage(
          this.coverageData[filePath],
          fileCoverage
        );
        this.coverageData[filePath].suites.push(suiteName);
      }
    });
  }

  _mergeFileCoverage(existing, newCoverage) {
    const merged = { ...existing };
    
    // Merge statement coverage
    if (newCoverage.s && existing.s) {
      Object.keys(newCoverage.s).forEach(statementId => {
        merged.s[statementId] = (existing.s[statementId] || 0) + newCoverage.s[statementId];
      });
    }
    
    // Merge function coverage
    if (newCoverage.f && existing.f) {
      Object.keys(newCoverage.f).forEach(functionId => {
        merged.f[functionId] = (existing.f[functionId] || 0) + newCoverage.f[functionId];
      });
    }
    
    // Merge branch coverage
    if (newCoverage.b && existing.b) {
      Object.keys(newCoverage.b).forEach(branchId => {
        if (!merged.b[branchId]) {
          merged.b[branchId] = [...newCoverage.b[branchId]];
        } else {
          newCoverage.b[branchId].forEach((count, index) => {
            merged.b[branchId][index] = (merged.b[branchId][index] || 0) + count;
          });
        }
      });
    }
    
    return merged;
  }

  _calculateAggregatedCoverage() {
    const files = Object.keys(this.coverageData);
    
    if (files.length === 0) {
      return {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
        files: 0,
        uncoveredLines: []
      };
    }
    
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalStatements = 0;
    let coveredStatements = 0;
    const uncoveredLines = [];
    
    files.forEach(filePath => {
      const fileCoverage = this.coverageData[filePath];
      const fileMetrics = this._calculateFileMetrics(fileCoverage, filePath);
      
      totalLines += fileMetrics.lines.total;
      coveredLines += fileMetrics.lines.covered;
      totalFunctions += fileMetrics.functions.total;
      coveredFunctions += fileMetrics.functions.covered;
      totalBranches += fileMetrics.branches.total;
      coveredBranches += fileMetrics.branches.covered;
      totalStatements += fileMetrics.statements.total;
      coveredStatements += fileMetrics.statements.covered;
      
      if (this.options.includeUncovered && fileMetrics.uncoveredLines.length > 0) {
        uncoveredLines.push({
          file: filePath,
          lines: fileMetrics.uncoveredLines
        });
      }
    });
    
    return {
      lines: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100 * 100) / 100 : 0,
      functions: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100 * 100) / 100 : 0,
      branches: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100 * 100) / 100 : 0,
      statements: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100 * 100) / 100 : 0,
      files: files.length,
      uncoveredLines: this.options.includeUncovered ? uncoveredLines : undefined
    };
  }

  _calculateFileMetrics(fileCoverage, filePath) {
    const metrics = {
      lines: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      statements: { total: 0, covered: 0 },
      uncoveredLines: []
    };
    
    // Calculate statement coverage
    if (fileCoverage.s && fileCoverage.statementMap) {
      metrics.statements.total = Object.keys(fileCoverage.s).length;
      metrics.statements.covered = Object.values(fileCoverage.s).filter(count => count > 0).length;
    }
    
    // Calculate function coverage
    if (fileCoverage.f && fileCoverage.fnMap) {
      metrics.functions.total = Object.keys(fileCoverage.f).length;
      metrics.functions.covered = Object.values(fileCoverage.f).filter(count => count > 0).length;
    }
    
    // Calculate branch coverage
    if (fileCoverage.b && fileCoverage.branchMap) {
      Object.values(fileCoverage.b).forEach(branches => {
        branches.forEach(count => {
          metrics.branches.total++;
          if (count > 0) {
            metrics.branches.covered++;
          }
        });
      });
    }
    
    // Calculate line coverage (approximated from statements)
    if (fileCoverage.s && fileCoverage.statementMap) {
      const linesCovered = new Set();
      const linesTotal = new Set();
      
      Object.keys(fileCoverage.s).forEach(statementId => {
        const statement = fileCoverage.statementMap[statementId];
        if (statement && statement.start && statement.start.line) {
          const lineNumber = statement.start.line;
          linesTotal.add(lineNumber);
          
          if (fileCoverage.s[statementId] > 0) {
            linesCovered.add(lineNumber);
          } else if (this.options.includeUncovered) {
            metrics.uncoveredLines.push(lineNumber);
          }
        }
      });
      
      metrics.lines.total = linesTotal.size;
      metrics.lines.covered = linesCovered.size;
    }
    
    return metrics;
  }

  _checkThresholds(coverage) {
    const results = {
      passed: true,
      failures: []
    };
    
    Object.keys(this.options.threshold).forEach(metric => {
      const threshold = this.options.threshold[metric];
      const actual = coverage[metric];
      
      if (actual < threshold) {
        results.passed = false;
        results.failures.push({
          metric,
          threshold,
          actual,
          message: `${metric} coverage ${actual}% is below threshold ${threshold}%`
        });
      }
    });
    
    return results;
  }

  async _generateJSONReport(coverage) {
    const reportData = {
      timestamp: new Date().toISOString(),
      coverage,
      files: this.coverageData,
      summary: {
        suites: this.suiteResults.length,
        files: Object.keys(this.coverageData).length
      }
    };
    
    const outputPath = path.join(this.options.outputDir, 'coverage.json');
    await fs.writeFile(outputPath, JSON.stringify(reportData, null, 2), 'utf8');
    
    return { format: 'json', path: outputPath };
  }

  async _generateLCOVReport(coverage) {
    let lcovData = '';
    
    Object.keys(this.coverageData).forEach(filePath => {
      const fileCoverage = this.coverageData[filePath];
      lcovData += `SF:${filePath}\n`;
      
      // Function coverage
      if (fileCoverage.fnMap && fileCoverage.f) {
        Object.keys(fileCoverage.fnMap).forEach(fnId => {
          const fn = fileCoverage.fnMap[fnId];
          lcovData += `FN:${fn.loc.start.line},${fn.name}\n`;
        });
        
        Object.keys(fileCoverage.f).forEach(fnId => {
          const fn = fileCoverage.fnMap[fnId];
          const count = fileCoverage.f[fnId];
          lcovData += `FNDA:${count},${fn.name}\n`;
        });
        
        const totalFunctions = Object.keys(fileCoverage.f).length;
        const coveredFunctions = Object.values(fileCoverage.f).filter(count => count > 0).length;
        lcovData += `FNF:${totalFunctions}\n`;
        lcovData += `FNH:${coveredFunctions}\n`;
      }
      
      // Branch coverage
      if (fileCoverage.branchMap && fileCoverage.b) {
        Object.keys(fileCoverage.branchMap).forEach(branchId => {
          const branch = fileCoverage.branchMap[branchId];
          const counts = fileCoverage.b[branchId];
          
          counts.forEach((count, index) => {
            lcovData += `BA:${branchId},${index},${count}\n`;
          });
        });
        
        let totalBranches = 0;
        let coveredBranches = 0;
        Object.values(fileCoverage.b).forEach(branches => {
          branches.forEach(count => {
            totalBranches++;
            if (count > 0) coveredBranches++;
          });
        });
        
        lcovData += `BRF:${totalBranches}\n`;
        lcovData += `BRH:${coveredBranches}\n`;
      }
      
      // Line coverage
      if (fileCoverage.statementMap && fileCoverage.s) {
        const lineData = {};
        
        Object.keys(fileCoverage.s).forEach(statementId => {
          const statement = fileCoverage.statementMap[statementId];
          if (statement && statement.start && statement.start.line) {
            const lineNumber = statement.start.line;
            const count = fileCoverage.s[statementId];
            lineData[lineNumber] = (lineData[lineNumber] || 0) + count;
          }
        });
        
        Object.keys(lineData).sort((a, b) => parseInt(a) - parseInt(b)).forEach(lineNumber => {
          lcovData += `DA:${lineNumber},${lineData[lineNumber]}\n`;
        });
        
        const totalLines = Object.keys(lineData).length;
        const coveredLines = Object.values(lineData).filter(count => count > 0).length;
        lcovData += `LF:${totalLines}\n`;
        lcovData += `LH:${coveredLines}\n`;
      }
      
      lcovData += 'end_of_record\n';
    });
    
    const outputPath = path.join(this.options.outputDir, 'lcov.info');
    await fs.writeFile(outputPath, lcovData, 'utf8');
    
    return { format: 'lcov', path: outputPath };
  }

  async _generateHTMLReport(coverage) {
    const html = this._generateHTMLContent(coverage);
    const outputPath = path.join(this.options.outputDir, 'coverage.html');
    await fs.writeFile(outputPath, html, 'utf8');
    
    return { format: 'html', path: outputPath };
  }

  _generateHTMLContent(coverage) {
    const thresholdResults = this._checkThresholds(coverage);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; }
        .high { color: #28a745; }
        .medium { color: #ffc107; }
        .low { color: #dc3545; }
        .files-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .files-table th, .files-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .files-table th { background-color: #f2f2f2; }
        .threshold-failures { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Coverage Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Total Files: ${coverage.files}</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <div class="metric-value ${this._getCoverageClass(coverage.lines)}">${coverage.lines}%</div>
            <div class="metric-label">Lines</div>
        </div>
        <div class="metric">
            <div class="metric-value ${this._getCoverageClass(coverage.functions)}">${coverage.functions}%</div>
            <div class="metric-label">Functions</div>
        </div>
        <div class="metric">
            <div class="metric-value ${this._getCoverageClass(coverage.branches)}">${coverage.branches}%</div>
            <div class="metric-label">Branches</div>
        </div>
        <div class="metric">
            <div class="metric-value ${this._getCoverageClass(coverage.statements)}">${coverage.statements}%</div>
            <div class="metric-label">Statements</div>
        </div>
    </div>
    
    ${!thresholdResults.passed ? `
    <div class="threshold-failures">
        <h3>Coverage Threshold Failures</h3>
        <ul>
            ${thresholdResults.failures.map(failure => `<li>${failure.message}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    ${coverage.uncoveredLines && coverage.uncoveredLines.length > 0 ? `
    <h3>Uncovered Lines</h3>
    <table class="files-table">
        <thead>
            <tr>
                <th>File</th>
                <th>Uncovered Lines</th>
            </tr>
        </thead>
        <tbody>
            ${coverage.uncoveredLines.map(file => `
                <tr>
                    <td>${file.file}</td>
                    <td>${file.lines.join(', ')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}
</body>
</html>`;
  }

  _getCoverageClass(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  }
}

export default CoverageReporter;