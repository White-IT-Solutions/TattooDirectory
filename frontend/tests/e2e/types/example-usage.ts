/**
 * Example usage of UI/UX audit data models and TypeScript interfaces
 * This file demonstrates how to use the types in real testing scenarios
 */

import {
  Screenshot,
  ComparisonResult,
  AccessibilityReport,
  ContrastReport,
  Issue,
  UIAuditReport,
  TestConfiguration,
  ScreenshotService,
  AccessibilityService,
  ReportingService,
  validateScreenshot,
  validateUIAuditReport,
  isScreenshot
} from './index';

// ============================================================================
// Example 1: Creating and validating a screenshot
// ============================================================================

export function createExampleScreenshot(): Screenshot {
  const screenshot: Screenshot = {
    id: crypto.randomUUID(),
    page: '/artist-profile/john-doe',
    theme: 'dark',
    viewport: {
      width: 1920,
      height: 1080,
      name: 'desktop',
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    },
    timestamp: new Date(),
    imagePath: '/screenshots/artist-profile-john-doe-dark-desktop.png',
    metadata: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(),
      browser: 'chromium',
      devicePixelRatio: 1,
      colorScheme: 'dark',
      reducedMotion: false,
      highContrast: false
    },
    hash: 'sha256:abc123...',
    fileSize: 245760
  };

  // Validate the screenshot
  try {
    validateScreenshot(screenshot);
    console.log('Screenshot is valid');
  } catch (error) {
    console.error('Screenshot validation failed:', error);
  }

  return screenshot;
}

// ============================================================================
// Example 2: Processing comparison results
// ============================================================================

export function processComparisonResults(results: ComparisonResult[]): void {
  const regressions = results.filter(result => result.hasDifferences);
  
  console.log(`Found ${regressions.length} visual regressions out of ${results.length} comparisons`);
  
  regressions.forEach(regression => {
    console.log(`Regression in screenshot ${regression.screenshotId}:`);
    console.log(`  - Difference: ${regression.differencePercentage.toFixed(2)}%`);
    console.log(`  - Affected regions: ${regression.affectedRegions.length}`);
    
    if (regression.diffImagePath) {
      console.log(`  - Diff image: ${regression.diffImagePath}`);
    }
  });
}

// ============================================================================
// Example 3: Creating accessibility issues from violations
// ============================================================================

export function createIssuesFromAccessibilityReport(report: AccessibilityReport): Issue[] {
  const issues: Issue[] = [];
  
  report.violations.forEach(violation => {
    violation.nodes.forEach((node, index) => {
      const issue: Issue = {
        id: crypto.randomUUID(),
        type: 'accessibility',
        severity: violation.impact === 'critical' ? 'critical' : 
                 violation.impact === 'serious' ? 'major' : 'minor',
        category: 'accessibility',
        page: report.pageUrl,
        theme: report.theme,
        viewport: report.viewport,
        element: node.target.join(', '),
        selector: node.target[0],
        description: `${violation.description}: ${violation.help}`,
        impact: `Accessibility violation affecting ${violation.impact} user experience`,
        fixSuggestion: `Fix ${violation.id} violation. See: ${violation.helpUrl}`,
        wcagCriteria: violation.tags.filter(tag => tag.startsWith('wcag')),
        status: 'open',
        priority: violation.impact === 'critical' ? 10 : 
                 violation.impact === 'serious' ? 7 : 4,
        estimatedEffort: violation.impact === 'critical' ? 'high' : 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          violationId: violation.id,
          nodeIndex: index,
          axeVersion: report.axeVersion
        }
      };
      
      issues.push(issue);
    });
  });
  
  return issues;
}

// ============================================================================
// Example 4: Creating contrast issues
// ============================================================================

export function createIssuesFromContrastReport(report: ContrastReport): Issue[] {
  const issues: Issue[] = [];
  
  const failedElements = report.elements.filter(element => !element.passes);
  
  failedElements.forEach(element => {
    const issue: Issue = {
      id: crypto.randomUUID(),
      type: 'contrast',
      severity: element.contrastRatio < 3 ? 'critical' : 'major',
      category: 'accessibility',
      page: report.pageUrl,
      theme: report.theme,
      viewport: report.viewport,
      element: element.element,
      selector: element.selector,
      description: `Insufficient color contrast ratio: ${element.contrastRatio.toFixed(2)}:1`,
      impact: `Text may be difficult to read for users with visual impairments`,
      fixSuggestion: `Increase contrast ratio to meet WCAG ${element.wcagLevel} standards (${element.textSize === 'large' ? '3:1' : '4.5:1'} minimum)`,
      wcagCriteria: ['wcag143'], // WCAG 1.4.3 Contrast (Minimum)
      status: 'open',
      priority: element.contrastRatio < 3 ? 9 : 6,
      estimatedEffort: 'low',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        contrastRatio: element.contrastRatio,
        foregroundColor: element.foregroundColor,
        backgroundColor: element.backgroundColor,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight
      }
    };
    
    issues.push(issue);
  });
  
  return issues;
}

// ============================================================================
// Example 5: Complete test configuration
// ============================================================================

export function createTestConfiguration(): TestConfiguration {
  return {
    browsers: ['chromium', 'firefox', 'webkit'],
    viewports: [
      { width: 375, height: 667, name: 'mobile', isMobile: true, hasTouch: true },
      { width: 768, height: 1024, name: 'tablet', isMobile: true, hasTouch: true },
      { width: 1920, height: 1080, name: 'desktop', isMobile: false, hasTouch: false }
    ],
    themes: ['light', 'dark'],
    pages: [
      '/',
      '/search',
      '/artist-profile/john-doe',
      '/studio/ink-masters',
      '/login',
      '/signup'
    ],
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    retries: 2,
    parallel: true,
    headless: true
  };
}

// ============================================================================
// Example 6: Mock service implementations
// ============================================================================

export class MockScreenshotService implements ScreenshotService {
  async capture(page: string, options: any): Promise<Screenshot> {
    return {
      id: crypto.randomUUID(),
      page,
      theme: options.theme,
      viewport: options.viewport,
      timestamp: new Date(),
      imagePath: `/screenshots/${page.replace('/', '')}-${options.theme}-${options.viewport.name}.png`,
      metadata: {
        userAgent: 'Mock User Agent',
        timestamp: new Date(),
        browser: 'chromium',
        devicePixelRatio: 1,
        colorScheme: options.theme,
        reducedMotion: false,
        highContrast: false
      }
    };
  }

  async captureElement(page: string, selector: string, options: any): Promise<Screenshot> {
    const screenshot = await this.capture(page, options);
    screenshot.imagePath = screenshot.imagePath.replace('.png', `-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
    return screenshot;
  }

  async captureFullPage(page: string, options: any): Promise<Screenshot> {
    return this.capture(page, { ...options, fullPage: true });
  }

  async compareScreenshots(current: Screenshot, baseline: Screenshot): Promise<ComparisonResult> {
    // Mock comparison - randomly generate differences
    const hasDifferences = Math.random() > 0.8;
    
    return {
      screenshotId: current.id,
      baselineId: baseline.id,
      hasDifferences,
      differencePercentage: hasDifferences ? Math.random() * 10 : 0,
      pixelDifferences: hasDifferences ? Math.floor(Math.random() * 1000) : 0,
      diffImagePath: hasDifferences ? current.imagePath.replace('.png', '-diff.png') : undefined,
      affectedRegions: hasDifferences ? [
        { x: 100, y: 200, width: 300, height: 150 }
      ] : [],
      threshold: 0.1,
      comparisonMethod: 'pixel',
      timestamp: new Date()
    };
  }

  async updateBaseline(screenshot: Screenshot): Promise<void> {
    console.log(`Updated baseline for ${screenshot.page} (${screenshot.theme})`);
  }

  async getBaseline(page: string, theme: any, viewport: any): Promise<Screenshot | null> {
    // Mock baseline retrieval
    return {
      id: crypto.randomUUID(),
      page,
      theme,
      viewport,
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      imagePath: `/baselines/${page.replace('/', '')}-${theme}-${viewport.name}.png`,
      metadata: {
        userAgent: 'Baseline User Agent',
        timestamp: new Date(Date.now() - 86400000),
        browser: 'chromium',
        devicePixelRatio: 1,
        colorScheme: theme,
        reducedMotion: false,
        highContrast: false
      }
    };
  }
}

// ============================================================================
// Example 7: Type guards and validation
// ============================================================================

export function processUnknownData(data: unknown): void {
  if (isScreenshot(data)) {
    console.log(`Processing screenshot: ${data.page} (${data.theme})`);
    console.log(`Image path: ${data.imagePath}`);
    console.log(`Timestamp: ${data.timestamp.toISOString()}`);
  } else {
    console.log('Data is not a valid screenshot');
  }
}

// ============================================================================
// Example 8: Creating a complete UI audit report
// ============================================================================

export function createSampleUIAuditReport(): UIAuditReport {
  const report: UIAuditReport = {
    id: crypto.randomUUID(),
    version: '1.0.0',
    timestamp: new Date(),
    duration: 45000, // 45 seconds
    configuration: createTestConfiguration(),
    summary: {
      totalPages: 6,
      totalIssues: 23,
      criticalIssues: 2,
      majorIssues: 8,
      minorIssues: 13,
      resolvedIssues: 0,
      accessibilityScore: 78,
      visualRegressionCount: 3,
      contrastFailures: 5,
      responsiveIssues: 4,
      themeIssues: 2,
      overallScore: 72,
      wcagCompliance: 85,
      testCoverage: {
        pages: 6,
        themes: 2,
        viewports: 3,
        browsers: 3
      }
    },
    pageReports: [], // Would contain detailed page reports
    issuesByCategory: {
      visual: [],
      accessibility: [],
      contrast: [],
      responsive: [],
      theme: [],
      keyboard: [],
      aria: []
    },
    classifiedIssues: {
      critical: [],
      major: [],
      minor: [],
      byType: {},
      byPage: {},
      byTheme: {},
      total: 23
    },
    fixSuggestions: [],
    recommendations: [
      {
        id: crypto.randomUUID(),
        type: 'immediate',
        category: 'critical-fix',
        title: 'Fix Critical Accessibility Violations',
        description: 'Address the 2 critical accessibility issues that prevent users from accessing core functionality',
        impact: 'high',
        effort: 'medium',
        relatedIssues: [],
        resources: [
          'https://www.w3.org/WAI/WCAG21/quickref/',
          'https://webaim.org/resources/contrastchecker/'
        ],
        priority: 10
      }
    ],
    metadata: {
      testRunId: crypto.randomUUID(),
      environment: 'development',
      branch: 'feature/ui-audit',
      commit: 'abc123def456',
      tester: 'automated-system'
    }
  };

  // Validate the report
  try {
    validateUIAuditReport(report);
    console.log('UI Audit Report is valid');
  } catch (error) {
    console.error('UI Audit Report validation failed:', error);
  }

  return report;
}

// ============================================================================
// Example 9: Usage in tests
// ============================================================================

export async function exampleTestUsage() {
  const screenshotService = new MockScreenshotService();
  const config = createTestConfiguration();
  
  console.log('Starting UI audit with configuration:', config);
  
  // Capture screenshots for each page and theme
  for (const page of config.pages) {
    for (const theme of config.themes) {
      for (const viewport of config.viewports) {
        const screenshot = await screenshotService.capture(page, {
          theme,
          viewport,
          fullPage: true
        });
        
        console.log(`Captured screenshot: ${screenshot.id}`);
        
        // Get baseline and compare
        const baseline = await screenshotService.getBaseline(page, theme, viewport);
        if (baseline) {
          const comparison = await screenshotService.compareScreenshots(screenshot, baseline);
          
          if (comparison.hasDifferences) {
            console.log(`Visual regression detected: ${comparison.differencePercentage.toFixed(2)}% difference`);
          }
        }
      }
    }
  }
  
  // Generate final report
  const report = createSampleUIAuditReport();
  console.log(`Generated UI audit report: ${report.id}`);
  console.log(`Overall score: ${report.summary.overallScore}%`);
  console.log(`Total issues: ${report.summary.totalIssues}`);
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleTestUsage().catch(console.error);
}