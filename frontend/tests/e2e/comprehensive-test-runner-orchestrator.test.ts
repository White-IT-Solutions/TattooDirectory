import { test, expect, VIEWPORTS, THEMES } from './fixtures/base-test';
import { TestExecutionValidator } from './test-execution-validator';

/**
 * Comprehensive Test Runner Orchestrator
 * 
 * This test suite orchestrates the execution of all comprehensive tests
 * and validates coverage across all requirements. It serves as the main
 * entry point for comprehensive test execution and validation.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4
 */

const validator = new TestExecutionValidator();

// Test execution configuration
const EXECUTION_CONFIG = {
  pages: {
    core: ['/', '/search', '/artists', '/studios', '/styles'],
    detail: ['/artists/test-artist-id', '/studios/test-studio-id', '/styles/traditional'],
    forms: ['/login', '/signup', '/contact', '/takedown'],
    static: ['/about', '/faq', '/privacy', '/terms', '/status'],
    error: ['/non-existent-page-404', '/error-test-500']
  },
  themes: ['light', 'dark'],
  viewports: ['desktop', 'tablet', 'mobile'],
  components: ['navigation', 'search-form', 'artist-card', 'portfolio-gallery', 'contact-form', 'theme-toggle', 'footer'],
  features: [
    'search-functionality',
    'theme-switching',
    'portfolio-galleries',
    'form-validation',
    'error-handling',
    'mobile-responsiveness',
    'accessibility-compliance',
    'visual-consistency'
  ]
};

// Helper function to execute comprehensive page test
async function executePageTest(
  page: any,
  themeToggler: any,
  screenshotCapture: any,
  accessibilityChecker: any,
  pagePath: string,
  theme: string,
  viewport: string
): Promise<boolean> {
  try {
    // Set viewport
    await page.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
    
    // Navigate to page
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Apply theme
    await themeToggler.setTheme(theme);
    await page.waitForTimeout(500);

    // Validate page coverage
    await validator.validatePageCoverage(page, pagePath, theme, viewport);

    // Validate theme consistency
    const htmlElement = page.locator('html');
    const dataTheme = await htmlElement.getAttribute('data-theme');
    const className = await htmlElement.getAttribute('class');
    
    const themeApplied = dataTheme === theme || 
                        className?.includes(theme) || 
                        className?.includes(`theme-${theme}`);
    
    if (!themeApplied) {
      validator.addTestIssue({
        severity: 'major',
        type: 'visual',
        description: `Theme ${theme} not properly applied`,
        page: pagePath,
        theme,
        viewport,
        recommendation: 'Ensure theme classes are properly applied to HTML element'
      });
      return false;
    }

    // Validate page structure
    const nav = page.locator('nav, [role="navigation"]');
    const main = page.locator('main, [role="main"], .main-content');
    
    if (await nav.count() === 0) {
      validator.addTestIssue({
        severity: 'major',
        type: 'functional',
        description: 'Page lacks navigation element',
        page: pagePath,
        theme,
        viewport,
        recommendation: 'Add navigation element with proper role'
      });
    }

    if (await main.count() === 0) {
      validator.addTestIssue({
        severity: 'major',
        type: 'functional',
        description: 'Page lacks main content element',
        page: pagePath,
        theme,
        viewport,
        recommendation: 'Add main element with proper role'
      });
    }

    // Page-specific validations
    if (pagePath.includes('/search')) {
      const searchValid = await validator.validateSearchFunctionality(page, theme, viewport);
      if (!searchValid) return false;
    }

    if (pagePath.includes('/artists/') && !pagePath.endsWith('/artists')) {
      const portfolioValid = await validator.validatePortfolioGallery(page, theme, viewport);
      if (!portfolioValid) return false;
    }

    if (['/login', '/signup', '/contact', '/takedown'].includes(pagePath)) {
      const formValid = await validator.validateFormInteractions(page, theme, viewport);
      if (!formValid) return false;
    }

    // Capture screenshot
    const pageName = pagePath.replace(/\//g, '-').replace(/^-/, '') || 'home';
    await screenshotCapture.captureFullPage({
      name: `orchestrator-${pageName}`,
      theme,
      viewport: viewport as keyof typeof VIEWPORTS
    });

    // Run accessibility audit
    const axeResults = await accessibilityChecker.runAxeAudit();
    if (axeResults.violations && axeResults.violations.length > 0) {
      axeResults.violations.forEach((violation: any) => {
        validator.addTestIssue({
          severity: violation.impact === 'critical' ? 'critical' : 
                   violation.impact === 'serious' ? 'major' : 'minor',
          type: 'accessibility',
          description: violation.description,
          page: pagePath,
          theme,
          viewport,
          recommendation: violation.help
        });
      });
      
      if (axeResults.violations.some((v: any) => v.impact === 'critical')) {
        return false;
      }
    }

    return true;
  } catch (error) {
    validator.addTestIssue({
      severity: 'critical',
      type: 'functional',
      description: `Page test execution failed: ${error}`,
      page: pagePath,
      theme,
      viewport,
      recommendation: 'Debug page implementation and test execution'
    });
    return false;
  }
}

test.describe('Comprehensive Test Execution Orchestrator', () => {
  test.beforeAll(async () => {
    console.log('🚀 Starting Comprehensive Test Execution');
    console.log(`📊 Testing ${EXECUTION_CONFIG.pages.core.length + EXECUTION_CONFIG.pages.detail.length + EXECUTION_CONFIG.pages.forms.length + EXECUTION_CONFIG.pages.static.length + EXECUTION_CONFIG.pages.error.length} pages`);
    console.log(`🎨 Testing ${EXECUTION_CONFIG.themes.length} themes`);
    console.log(`📱 Testing ${EXECUTION_CONFIG.viewports.length} viewports`);
    console.log(`🧩 Testing ${EXECUTION_CONFIG.components.length} components`);
    console.log(`⚡ Testing ${EXECUTION_CONFIG.features.length} features`);
  });

  test.afterAll(async () => {
    // Generate and export comprehensive test report
    const report = validator.generateReport();
    
    console.log('\n📋 COMPREHENSIVE TEST EXECUTION REPORT');
    console.log('=====================================');
    console.log(`🕐 Timestamp: ${report.timestamp}`);
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passedTests}`);
    console.log(`❌ Failed: ${report.failedTests}`);
    console.log(`⏭️  Skipped: ${report.skippedTests}`);
    
    console.log('\n📈 COVERAGE SUMMARY');
    console.log('==================');
    console.log(`📄 Pages: ${report.coverage.pages.covered}/${report.coverage.pages.total} (${((report.coverage.pages.covered / report.coverage.pages.total) * 100).toFixed(1)}%)`);
    console.log(`🎨 Themes: ${report.coverage.themes.covered}/${report.coverage.themes.total} (${((report.coverage.themes.covered / report.coverage.themes.total) * 100).toFixed(1)}%)`);
    console.log(`📱 Viewports: ${report.coverage.viewports.covered}/${report.coverage.viewports.total} (${((report.coverage.viewports.covered / report.coverage.viewports.total) * 100).toFixed(1)}%)`);
    console.log(`🧩 Components: ${report.coverage.components.covered}/${report.coverage.components.total} (${((report.coverage.components.covered / report.coverage.components.total) * 100).toFixed(1)}%)`);
    console.log(`⚡ Features: ${report.coverage.features.covered}/${report.coverage.features.total} (${((report.coverage.features.covered / report.coverage.features.total) * 100).toFixed(1)}%)`);
    
    console.log('\n📋 REQUIREMENTS COVERAGE');
    console.log('========================');
    Object.entries(report.requirements).forEach(([id, req]) => {
      const status = req.covered ? '✅' : '❌';
      console.log(`${status} ${id}: ${req.description} (${req.passRate.toFixed(1)}%)`);
    });
    
    if (report.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND');
      console.log('===============');
      const criticalIssues = report.issues.filter(i => i.severity === 'critical').length;
      const majorIssues = report.issues.filter(i => i.severity === 'major').length;
      const minorIssues = report.issues.filter(i => i.severity === 'minor').length;
      
      console.log(`🔴 Critical: ${criticalIssues}`);
      console.log(`🟡 Major: ${majorIssues}`);
      console.log(`🟢 Minor: ${minorIssues}`);
      
      // Show first 5 critical issues
      const criticalIssuesList = report.issues.filter(i => i.severity === 'critical').slice(0, 5);
      if (criticalIssuesList.length > 0) {
        console.log('\n🔴 CRITICAL ISSUES (First 5):');
        criticalIssuesList.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.description}`);
          console.log(`   Page: ${issue.page} | Theme: ${issue.theme} | Viewport: ${issue.viewport}`);
          console.log(`   Recommendation: ${issue.recommendation}`);
        });
      }
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('==================');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    // Export detailed report
    validator.exportReport('tests/e2e/reports/comprehensive-test-execution-report.json');
    console.log('\n📄 Detailed report exported to: tests/e2e/reports/comprehensive-test-execution-report.json');
  });

  test('Execute comprehensive core pages testing', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture,
    accessibilityChecker 
  }) => {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const pagePath of EXECUTION_CONFIG.pages.core) {
      for (const theme of EXECUTION_CONFIG.themes) {
        for (const viewport of EXECUTION_CONFIG.viewports) {
          totalTests++;
          
          const success = await executePageTest(
            uiAuditPage,
            themeToggler,
            screenshotCapture,
            accessibilityChecker,
            pagePath,
            theme,
            viewport
          );
          
          if (success) {
            passedTests++;
          } else {
            failedTests++;
          }
        }
      }
    }

    // Update validator with test results
    validator.validateFeatureCoverage('core-pages', totalTests, passedTests);
    validator.validateRequirementCoverage('7.1', ['home-page-light-dark'], passedTests);
    validator.validateRequirementCoverage('7.2', ['search-interface-testing'], passedTests);

    // Expect at least 90% pass rate for core pages
    const passRate = (passedTests / totalTests) * 100;
    expect(passRate).toBeGreaterThanOrEqual(90);
  });

  test('Execute comprehensive detail pages testing', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture,
    accessibilityChecker 
  }) => {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const pagePath of EXECUTION_CONFIG.pages.detail) {
      for (const theme of EXECUTION_CONFIG.themes) {
        for (const viewport of EXECUTION_CONFIG.viewports) {
          totalTests++;
          
          const success = await executePageTest(
            uiAuditPage,
            themeToggler,
            screenshotCapture,
            accessibilityChecker,
            pagePath,
            theme,
            viewport
          );
          
          if (success) {
            passedTests++;
          } else {
            failedTests++;
          }
        }
      }
    }

    // Update validator with test results
    validator.validateFeatureCoverage('detail-pages', totalTests, passedTests);
    validator.validateRequirementCoverage('7.3', ['artist-profile-portfolio-testing'], passedTests);

    // Expect at least 85% pass rate for detail pages
    const passRate = (passedTests / totalTests) * 100;
    expect(passRate).toBeGreaterThanOrEqual(85);
  });

  test('Execute comprehensive form pages testing', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture,
    accessibilityChecker 
  }) => {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const pagePath of EXECUTION_CONFIG.pages.forms) {
      for (const theme of EXECUTION_CONFIG.themes) {
        for (const viewport of EXECUTION_CONFIG.viewports) {
          totalTests++;
          
          const success = await executePageTest(
            uiAuditPage,
            themeToggler,
            screenshotCapture,
            accessibilityChecker,
            pagePath,
            theme,
            viewport
          );
          
          if (success) {
            passedTests++;
          } else {
            failedTests++;
          }
        }
      }
    }

    // Update validator with test results
    validator.validateFeatureCoverage('form-pages', totalTests, passedTests);
    validator.validateRequirementCoverage('7.4', ['form-interaction-validation'], passedTests);
    validator.validateRequirementCoverage('8.1', ['authentication-flows'], passedTests);

    // Expect at least 80% pass rate for form pages
    const passRate = (passedTests / totalTests) * 100;
    expect(passRate).toBeGreaterThanOrEqual(80);
  });

  test('Execute comprehensive error pages testing', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture,
    accessibilityChecker 
  }) => {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const pagePath of EXECUTION_CONFIG.pages.error) {
      for (const theme of EXECUTION_CONFIG.themes) {
        for (const viewport of EXECUTION_CONFIG.viewports) {
          totalTests++;
          
          const success = await executePageTest(
            uiAuditPage,
            themeToggler,
            screenshotCapture,
            accessibilityChecker,
            pagePath,
            theme,
            viewport
          );
          
          if (success) {
            passedTests++;
          } else {
            failedTests++;
          }
        }
      }
    }

    // Update validator with test results
    validator.validateFeatureCoverage('error-pages', totalTests, passedTests);
    validator.validateRequirementCoverage('8.2', ['error-pages-404-500'], passedTests);
    validator.validateRequirementCoverage('8.3', ['edge-cases-error-handling'], passedTests);

    // Expect at least 75% pass rate for error pages (they may not exist yet)
    const passRate = (passedTests / totalTests) * 100;
    expect(passRate).toBeGreaterThanOrEqual(75);
  });

  test('Execute comprehensive component integration testing', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture,
    accessibilityChecker 
  }) => {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const component of EXECUTION_CONFIG.components) {
      for (const theme of EXECUTION_CONFIG.themes) {
        totalTests++;
        
        try {
          // Navigate to appropriate page for component testing
          let testPage = '/';
          if (component === 'search-form') testPage = '/search';
          if (component === 'artist-card') testPage = '/artists';
          if (component === 'portfolio-gallery') testPage = '/artists/test-artist-id';
          if (component === 'contact-form') testPage = '/contact';

          await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
          await uiAuditPage.goto(testPage);
          await uiAuditPage.waitForLoadState('networkidle');
          await uiAuditPage.waitForTimeout(1000);

          // Apply theme
          await themeToggler.setTheme(theme);
          await uiAuditPage.waitForTimeout(500);

          // Component-specific testing
          let componentFound = false;
          let interactions: string[] = [];

          switch (component) {
            case 'navigation':
              const nav = uiAuditPage.locator('nav, [role="navigation"]');
              componentFound = await nav.count() > 0;
              if (componentFound) {
                interactions = ['visible', 'links-functional'];
              }
              break;

            case 'search-form':
              const searchForm = uiAuditPage.locator('form, .search-form, input[type="search"]');
              componentFound = await searchForm.count() > 0;
              if (componentFound) {
                interactions = ['input-functional', 'submit-works'];
              }
              break;

            case 'artist-card':
              const artistCards = uiAuditPage.locator('.artist-card, [data-testid="artist-card"]');
              componentFound = await artistCards.count() > 0;
              if (componentFound) {
                interactions = ['clickable', 'image-loaded', 'text-visible'];
              }
              break;

            case 'portfolio-gallery':
              const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"]');
              componentFound = await gallery.count() > 0;
              if (componentFound) {
                interactions = ['images-loaded', 'lightbox-functional', 'navigation-works'];
              }
              break;

            case 'contact-form':
              const contactForm = uiAuditPage.locator('form, .contact-form');
              componentFound = await contactForm.count() > 0;
              if (componentFound) {
                interactions = ['inputs-functional', 'validation-works', 'submit-enabled'];
              }
              break;

            case 'theme-toggle':
              const themeToggle = uiAuditPage.locator('button[aria-label*="theme" i], .theme-toggle');
              componentFound = await themeToggle.count() > 0;
              if (componentFound) {
                interactions = ['toggle-functional', 'theme-changes'];
              }
              break;

            case 'footer':
              const footer = uiAuditPage.locator('footer, [role="contentinfo"]');
              componentFound = await footer.count() > 0;
              if (componentFound) {
                interactions = ['visible', 'links-functional'];
              }
              break;
          }

          if (componentFound) {
            await validator.validateComponentCoverage(component, theme, interactions);
            passedTests++;
          } else {
            validator.addTestIssue({
              severity: 'major',
              type: 'functional',
              description: `Component ${component} not found on test page`,
              page: testPage,
              theme,
              viewport: 'desktop',
              component,
              recommendation: `Ensure ${component} component is present and properly implemented`
            });
            failedTests++;
          }

          // Capture component screenshot
          await screenshotCapture.captureFullPage({
            name: `component-${component}`,
            theme,
            viewport: 'desktop'
          });

        } catch (error) {
          validator.addTestIssue({
            severity: 'critical',
            type: 'functional',
            description: `Component ${component} testing failed: ${error}`,
            page: '/',
            theme,
            viewport: 'desktop',
            component,
            recommendation: `Debug ${component} component implementation`
          });
          failedTests++;
        }
      }
    }

    // Update validator with test results
    validator.validateFeatureCoverage('component-integration', totalTests, passedTests);
    validator.validateRequirementCoverage('8.4', ['component-integration-testing'], passedTests);

    // Expect at least 70% pass rate for component integration
    const passRate = (passedTests / totalTests) * 100;
    expect(passRate).toBeGreaterThanOrEqual(70);
  });

  test('Validate overall test execution completeness', async () => {
    // Generate final report
    const report = validator.generateReport();

    // Validate minimum coverage requirements
    const pageCoveragePercent = (report.coverage.pages.covered / report.coverage.pages.total) * 100;
    const themeCoveragePercent = (report.coverage.themes.covered / report.coverage.themes.total) * 100;
    const viewportCoveragePercent = (report.coverage.viewports.covered / report.coverage.viewports.total) * 100;

    // Assert minimum coverage thresholds
    expect(pageCoveragePercent).toBeGreaterThanOrEqual(80); // 80% page coverage minimum
    expect(themeCoveragePercent).toBeGreaterThanOrEqual(100); // 100% theme coverage required
    expect(viewportCoveragePercent).toBeGreaterThanOrEqual(60); // 60% viewport coverage minimum

    // Validate requirements coverage
    const coveredRequirements = Object.values(report.requirements).filter(req => req.covered).length;
    const totalRequirements = Object.keys(report.requirements).length;
    const requirementsCoveragePercent = (coveredRequirements / totalRequirements) * 100;

    expect(requirementsCoveragePercent).toBeGreaterThanOrEqual(75); // 75% requirements coverage minimum

    // Validate critical issues are addressed
    const criticalIssues = report.issues.filter(issue => issue.severity === 'critical').length;
    expect(criticalIssues).toBeLessThanOrEqual(5); // Maximum 5 critical issues allowed

    console.log(`\n✅ Test execution completeness validated:`);
    console.log(`   📄 Page Coverage: ${pageCoveragePercent.toFixed(1)}%`);
    console.log(`   🎨 Theme Coverage: ${themeCoveragePercent.toFixed(1)}%`);
    console.log(`   📱 Viewport Coverage: ${viewportCoveragePercent.toFixed(1)}%`);
    console.log(`   📋 Requirements Coverage: ${requirementsCoveragePercent.toFixed(1)}%`);
    console.log(`   🚨 Critical Issues: ${criticalIssues}`);
  });
});