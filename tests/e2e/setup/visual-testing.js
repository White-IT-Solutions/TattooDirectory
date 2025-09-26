/**
 * Visual Regression Testing Utilities
 * Handles screenshot comparison and visual regression testing
 */

const fs = require('fs-extra');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const config = require('../config/test-config');

class VisualTesting {
  constructor() {
    this.screenshotDir = config.visual.screenshotDir;
    this.baselineDir = config.visual.baselineDir;
    this.diffDir = config.visual.diffDir;
    this.threshold = config.visual.threshold;
  }

  /**
   * Initialize visual testing directories
   */
  async init() {
    await fs.ensureDir(this.screenshotDir);
    await fs.ensureDir(this.baselineDir);
    await fs.ensureDir(this.diffDir);
  }

  /**
   * Compare screenshot with baseline
   */
  async compareScreenshot(screenshotPath, testName) {
    const baselinePath = path.join(this.baselineDir, `${testName}.png`);
    const diffPath = path.join(this.diffDir, `${testName}-diff.png`);

    // Ensure screenshotPath is a string (file path), not a buffer
    if (typeof screenshotPath !== 'string') {
      throw new Error(`Screenshot path must be a string, got ${typeof screenshotPath}`);
    }

    // If no baseline exists, create it
    if (!await fs.pathExists(baselinePath)) {
      console.log(`Creating baseline for ${testName}`);
      await fs.copy(screenshotPath, baselinePath);
      return { match: true, isNewBaseline: true };
    }

    // Load images
    const screenshot = PNG.sync.read(await fs.readFile(screenshotPath));
    const baseline = PNG.sync.read(await fs.readFile(baselinePath));

    // Check dimensions match
    if (screenshot.width !== baseline.width || screenshot.height !== baseline.height) {
      throw new Error(`Screenshot dimensions don't match baseline for ${testName}`);
    }

    // Compare images
    const diff = new PNG({ width: screenshot.width, height: screenshot.height });
    const numDiffPixels = pixelmatch(
      screenshot.data,
      baseline.data,
      diff.data,
      screenshot.width,
      screenshot.height,
      { threshold: this.threshold }
    );

    const totalPixels = screenshot.width * screenshot.height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    // Save diff image if there are differences
    if (numDiffPixels > 0) {
      await fs.writeFile(diffPath, PNG.sync.write(diff));
    }

    const match = diffPercentage < (this.threshold * 100);
    
    return {
      match,
      diffPercentage,
      numDiffPixels,
      totalPixels,
      diffPath: numDiffPixels > 0 ? diffPath : null
    };
  }

  /**
   * Update baseline screenshot
   */
  async updateBaseline(screenshotPath, testName) {
    const baselinePath = path.join(this.baselineDir, `${testName}.png`);
    await fs.copy(screenshotPath, baselinePath);
    console.log(`Updated baseline for ${testName}`);
  }

  /**
   * Clean up old diff images
   */
  async cleanupDiffs() {
    if (await fs.pathExists(this.diffDir)) {
      const files = await fs.readdir(this.diffDir);
      for (const file of files) {
        if (file.endsWith('-diff.png')) {
          await fs.remove(path.join(this.diffDir, file));
        }
      }
    }
  }

  /**
   * Generate visual test report
   */
  async generateReport(results) {
    const reportPath = path.join(this.screenshotDir, 'visual-test-report.html');
    
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .pass { border-color: #4CAF50; background-color: #f1f8e9; }
        .fail { border-color: #f44336; background-color: #ffebee; }
        .new { border-color: #2196F3; background-color: #e3f2fd; }
        .images { display: flex; gap: 10px; margin-top: 10px; }
        .image-container { text-align: center; }
        .image-container img { max-width: 300px; border: 1px solid #ccc; }
        .stats { background-color: #f5f5f5; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Visual Regression Test Report</h1>
    <div class="stats">
        <p><strong>Total Tests:</strong> ${results.length}</p>
        <p><strong>Passed:</strong> ${results.filter(r => r.match).length}</p>
        <p><strong>Failed:</strong> ${results.filter(r => !r.match && !r.isNewBaseline).length}</p>
        <p><strong>New Baselines:</strong> ${results.filter(r => r.isNewBaseline).length}</p>
    </div>
`;

    for (const result of results) {
      const cssClass = result.isNewBaseline ? 'new' : (result.match ? 'pass' : 'fail');
      const status = result.isNewBaseline ? 'NEW BASELINE' : (result.match ? 'PASS' : 'FAIL');
      
      html += `
    <div class="test-result ${cssClass}">
        <h3>${result.testName} - ${status}</h3>
`;

      if (result.diffPercentage !== undefined) {
        html += `<p>Difference: ${result.diffPercentage.toFixed(2)}%</p>`;
      }

      if (result.diffPath) {
        html += `
        <div class="images">
            <div class="image-container">
                <h4>Current</h4>
                <img src="${path.relative(this.screenshotDir, result.screenshotPath)}" alt="Current">
            </div>
            <div class="image-container">
                <h4>Baseline</h4>
                <img src="${path.relative(this.screenshotDir, result.baselinePath)}" alt="Baseline">
            </div>
            <div class="image-container">
                <h4>Difference</h4>
                <img src="${path.relative(this.screenshotDir, result.diffPath)}" alt="Difference">
            </div>
        </div>
`;
      }

      html += `    </div>`;
    }

    html += `
</body>
</html>`;

    await fs.writeFile(reportPath, html);
    console.log(`Visual test report generated: ${reportPath}`);
    return reportPath;
  }
}

module.exports = VisualTesting;