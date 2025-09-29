/**
 * Test Execution Validator
 * 
 * This utility validates comprehensive test execution coverage and provides
 * detailed reporting on test completeness across all requirements.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4
 */

import { Page } from '@playwright/test';

export interface TestCoverageReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: {
    pages: PageCoverage;
    themes: ThemeCoverage;
    viewports: ViewportCoverage;
    components: ComponentCoverage;
    features: FeatureCoverage;
  };
  requirements: RequirementsCoverage;
  issues: TestIssue[];
  recommendations: string[];
}

export interface PageCoverage {
  total: number;
  covered: number;
  pages: {
    [pageName: string]: {
      tested: boolean;
      themes: string[];
      viewports: string[];
      lastTested: string;
    };
  };
}

export interface ThemeCoverage {
  total: number;
  covered: number;
  themes: {
    [themeName: string]: {
      tested: boolean;
      pages: string[];
      components: string[];
      lastTested: string;
    };
  };
}

export interface ViewportCoverage {
  total: number;
  covered: number;
  viewports: {
    [viewportName: string]: {
      tested: boolean;
      pages: string[];
      themes: string[];
      lastTested: string;
    };
  };
}

export interface ComponentCoverage {
  total: number;
  covered: number;
  components: {
    [componentName: string]: {
      tested: boolean;
      themes: string[];
      interactions: string[];
      lastTested: string;
    };
  };
}

export interface FeatureCoverage {
  total: number;
  covered: number;
  features: {
    [featureName: string]: {
      tested: boolean;
      testCases: number;
      passRate: number;
      lastTested: string;
    };
  };
}

export interface RequirementsCoverage {
  [requirementId: string]: {
    description: string;
    covered: boolean;
    testCases: string[];
    passRate: number;
  };
}

export interface TestIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  type: 'accessibility' | 'visual' | 'functional' | 'performance';
  description: string;
  page: string;
  theme: string;
  viewport: string;
  component?: string;
  recommendation: string;
}

export class TestExecutionValidator {
  private coverageData: TestCoverageReport;

  constructor() {
    this.coverageData = this.initializeCoverageReport();
  }

  private initializeCoverageReport(): TestCoverageReport {
    return {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      coverage: {
        pages: {
          total: 0,
          covered: 0,
          pages: {}
        },
        themes: {
          total: 2, // light, dark
          covered: 0,
          themes: {
            light: { tested: false, pages: [], components: [], lastTested: '' },
            dark: { tested: false, pages: [], components: [], lastTested: '' }
          }
        },
        viewports: {
          total: 5, // desktop, tablet, mobile, mobile_large, desktop_small
          covered: 0,
          viewports: {
            desktop: { tested: false, pages: [], themes: [], lastTested: '' },
            tablet: { tested: false, pages: [], themes: [], lastTested: '' },
            mobile: { tested: false, pages: [], themes: [], lastTested: '' },
            mobile_large: { tested: false, pages: [], themes: [], lastTested: '' },
            desktop_small: { tested: false, pages: [], themes: [], lastTested: '' }
          }
        },
        components: {
          total: 7, // navigation, search-form, artist-card, portfolio-gallery, contact-form, theme-toggle, footer
          covered: 0,
          components: {}
        },
        features: {
          total: 0,
          covered: 0,
          features: {}
        }
      },
      requirements: {
        '7.1': {
          description: 'Home page testing in both light and dark modes',
          covered: false,
          testCases: [],
          passRate: 0
        },
        '7.2': {
          description: 'Search interface and results pages testing',
          covered: false,
          testCases: [],
          passRate: 0
        },
        '7.3': {
          description: 'Artist profile pages and portfolio galleries testing',
          covered: false,
          testCases: [],
          passRate: 0
        },
        '7.4': {
          description: 'Form interaction testing with proper error state validation',
          covered: false,
          testCases: [],
          passRate: 0
        },
        '8.1': {
          description: 'Authentication flows testing',
          covered: false,
          testCases: [],
          passRate: 0
        },
        '8.2': {
          description: 'Error pages (404, 500) testing',
          covered: false,
          testCases: [],
          passRate: 0
        },
        '8.3': {
          description: 'Edge cases and error handling testing',
          covered: false,
          testCases: [],
          passRate: 0
        },
        '8.4': {
          description: 'Component integration and cross-page journey testing',
          covered: false,
          testCases: [],
          passRate: 0
        }
      },
      issues: [],
      recommendations: []
    };
  }

  /**
   * Validate page coverage across all themes and viewports
   */
  async validatePageCoverage(page: Page, pageName: string, theme: string, viewport: string): Promise<void> {
    const timestamp = new Date().toISOString();

    // Initialize page if not exists
    if (!this.coverageData.coverage.pages.pages[pageName]) {
      this.coverageData.coverage.pages.pages[pageName] = {
        tested: false,
        themes: [],
        viewports: [],
        lastTested: ''
      };
      this.coverageData.coverage.pages.total++;
    }

    // Update page coverage
    const pageData = this.coverageData.coverage.pages.pages[pageName];
    pageData.tested = true;
    pageData.lastTested = timestamp;

    if (!pageData.themes.includes(theme)) {
      pageData.themes.push(theme);
    }

    if (!pageData.viewports.includes(viewport)) {
      pageData.viewports.push(viewport);
    }

    // Update theme coverage
    if (this.coverageData.coverage.themes.themes[theme]) {
      const themeData = this.coverageData.coverage.themes.themes[theme];
      themeData.tested = true;
      themeData.lastTested = timestamp;
      
      if (!themeData.pages.includes(pageName)) {
        themeData.pages.push(pageName);
      }
    }

    // Update viewport coverage
    if (this.coverageData.coverage.viewports.viewports[viewport]) {
      const viewportData = this.coverageData.coverage.viewports.viewports[viewport];
      viewportData.tested = true;
      viewportData.lastTested = timestamp;
      
      if (!viewportData.pages.includes(pageName)) {
        viewportData.pages.push(pageName);
      }
      
      if (!viewportData.themes.includes(theme)) {
        viewportData.themes.push(theme);
      }
    }

    // Recalculate coverage percentages
    this.recalculateCoverage();
  }

  /**
   * Validate component testing coverage
   */
  async validateComponentCoverage(componentName: string, theme: string, interactions: string[]): Promise<void> {
    const timestamp = new Date().toISOString();

    // Initialize component if not exists
    if (!this.coverageData.coverage.components.components[componentName]) {
      this.coverageData.coverage.components.components[componentName] = {
        tested: false,
        themes: [],
        interactions: [],
        lastTested: ''
      };
      this.coverageData.coverage.components.total++;
    }

    // Update component coverage
    const componentData = this.coverageData.coverage.components.components[componentName];
    componentData.tested = true;
    componentData.lastTested = timestamp;

    if (!componentData.themes.includes(theme)) {
      componentData.themes.push(theme);
    }

    interactions.forEach(interaction => {
      if (!componentData.interactions.includes(interaction)) {
        componentData.interactions.push(interaction);
      }
    });

    // Recalculate coverage
    this.recalculateCoverage();
  }

  /**
   * Validate feature testing coverage
   */
  async validateFeatureCoverage(featureName: string, testCases: number, passedTests: number): Promise<void> {
    const timestamp = new Date().toISOString();

    // Initialize feature if not exists
    if (!this.coverageData.coverage.features.features[featureName]) {
      this.coverageData.coverage.features.features[featureName] = {
        tested: false,
        testCases: 0,
        passRate: 0,
        lastTested: ''
      };
      this.coverageData.coverage.features.total++;
    }

    // Update feature coverage
    const featureData = this.coverageData.coverage.features.features[featureName];
    featureData.tested = true;
    featureData.testCases = testCases;
    featureData.passRate = testCases > 0 ? (passedTests / testCases) * 100 : 0;
    featureData.lastTested = timestamp;

    // Recalculate coverage
    this.recalculateCoverage();
  }

  /**
   * Validate requirement coverage
   */
  async validateRequirementCoverage(requirementId: string, testCases: string[], passedTests: number): Promise<void> {
    if (this.coverageData.requirements[requirementId]) {
      const requirement = this.coverageData.requirements[requirementId];
      requirement.testCases = testCases;
      requirement.passRate = testCases.length > 0 ? (passedTests / testCases.length) * 100 : 0;
      requirement.covered = requirement.passRate >= 80; // 80% pass rate threshold
    }
  }

  /**
   * Add test issue
   */
  addTestIssue(issue: Omit<TestIssue, 'id'>): void {
    const testIssue: TestIssue = {
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...issue
    };

    this.coverageData.issues.push(testIssue);
  }

  /**
   * Validate search functionality across themes
   */
  async validateSearchFunctionality(page: Page, theme: string, viewport: string): Promise<boolean> {
    try {
      // Check search input exists and is functional
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() === 0) {
        this.addTestIssue({
          severity: 'critical',
          type: 'functional',
          description: 'Search input not found on page',
          page: page.url(),
          theme,
          viewport,
          recommendation: 'Ensure search input is present and properly labeled'
        });
        return false;
      }

      // Test search input accessibility
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const placeholder = await searchInput.getAttribute('placeholder');
      const id = await searchInput.getAttribute('id');
      
      if (!ariaLabel && !placeholder && !id) {
        this.addTestIssue({
          severity: 'major',
          type: 'accessibility',
          description: 'Search input lacks proper labeling',
          page: page.url(),
          theme,
          viewport,
          recommendation: 'Add aria-label, placeholder, or associate with label element'
        });
      }

      // Test search functionality
      await searchInput.fill('test search');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Check for results or no results message
      const results = page.locator('.search-results, .results, [data-testid="search-results"]');
      const noResults = page.locator('.no-results, .empty-state, [data-testid="no-results"]');
      
      if (await results.count() === 0 && await noResults.count() === 0) {
        this.addTestIssue({
          severity: 'major',
          type: 'functional',
          description: 'Search does not show results or no results message',
          page: page.url(),
          theme,
          viewport,
          recommendation: 'Implement proper search results display or no results state'
        });
        return false;
      }

      return true;
    } catch (error) {
      this.addTestIssue({
        severity: 'critical',
        type: 'functional',
        description: `Search functionality validation failed: ${error}`,
        page: page.url(),
        theme,
        viewport,
        recommendation: 'Debug search functionality implementation'
      });
      return false;
    }
  }

  /**
   * Validate portfolio gallery functionality
   */
  async validatePortfolioGallery(page: Page, theme: string, viewport: string): Promise<boolean> {
    try {
      const gallery = page.locator('.gallery, .portfolio, [data-testid="portfolio"], .image-gallery');
      if (await gallery.count() === 0) {
        this.addTestIssue({
          severity: 'major',
          type: 'functional',
          description: 'Portfolio gallery not found on artist profile page',
          page: page.url(),
          theme,
          viewport,
          recommendation: 'Ensure portfolio gallery is present on artist profile pages'
        });
        return false;
      }

      // Check gallery images
      const images = gallery.locator('img');
      const imageCount = await images.count();
      
      if (imageCount === 0) {
        this.addTestIssue({
          severity: 'major',
          type: 'functional',
          description: 'Portfolio gallery contains no images',
          page: page.url(),
          theme,
          viewport,
          recommendation: 'Ensure portfolio gallery displays artist images'
        });
        return false;
      }

      // Check image accessibility
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        
        if (!alt && !ariaLabel) {
          this.addTestIssue({
            severity: 'major',
            type: 'accessibility',
            description: `Portfolio image ${i + 1} lacks alt text`,
            page: page.url(),
            theme,
            viewport,
            recommendation: 'Add descriptive alt text to all portfolio images'
          });
        }
      }

      // Test image interaction (lightbox)
      const firstImage = images.first();
      await firstImage.click();
      await page.waitForTimeout(1000);

      const lightbox = page.locator('.lightbox, .modal, [data-testid="lightbox"], .image-modal');
      if (await lightbox.count() > 0) {
        // Test lightbox accessibility
        const closeButton = lightbox.locator('button[aria-label*="close" i], .close-button');
        if (await closeButton.count() === 0) {
          this.addTestIssue({
            severity: 'major',
            type: 'accessibility',
            description: 'Lightbox lacks accessible close button',
            page: page.url(),
            theme,
            viewport,
            recommendation: 'Add accessible close button with proper aria-label'
          });
        }

        // Close lightbox
        if (await closeButton.count() > 0) {
          await closeButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }

      return true;
    } catch (error) {
      this.addTestIssue({
        severity: 'critical',
        type: 'functional',
        description: `Portfolio gallery validation failed: ${error}`,
        page: page.url(),
        theme,
        viewport,
        recommendation: 'Debug portfolio gallery implementation'
      });
      return false;
    }
  }

  /**
   * Validate form interactions and error states
   */
  async validateFormInteractions(page: Page, theme: string, viewport: string): Promise<boolean> {
    try {
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount === 0) {
        return true; // No forms on page, validation passes
      }

      let allFormsValid = true;

      for (let i = 0; i < formCount; i++) {
        const form = forms.nth(i);
        
        // Check form accessibility
        const inputs = form.locator('input, textarea, select');
        const inputCount = await inputs.count();
        
        for (let j = 0; j < inputCount; j++) {
          const input = inputs.nth(j);
          if (await input.isVisible()) {
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');
            
            if (id) {
              const label = page.locator(`label[for="${id}"]`);
              const hasLabel = await label.count() > 0;
              
              if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
                this.addTestIssue({
                  severity: 'major',
                  type: 'accessibility',
                  description: `Form input lacks proper labeling`,
                  page: page.url(),
                  theme,
                  viewport,
                  component: 'form',
                  recommendation: 'Associate input with label or add aria-label'
                });
                allFormsValid = false;
              }
            }
          }
        }

        // Test form validation
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1500);

          // Check for validation errors
          const validationErrors = page.locator('.error, .validation-error, [role="alert"], .field-error');
          if (await validationErrors.count() > 0) {
            // Check error accessibility
            const firstError = validationErrors.first();
            const role = await firstError.getAttribute('role');
            const ariaLive = await firstError.getAttribute('aria-live');
            
            if (role !== 'alert' && !ariaLive) {
              this.addTestIssue({
                severity: 'major',
                type: 'accessibility',
                description: 'Form validation errors lack proper ARIA attributes',
                page: page.url(),
                theme,
                viewport,
                component: 'form',
                recommendation: 'Add role="alert" or aria-live to validation error messages'
              });
              allFormsValid = false;
            }
          }
        }
      }

      return allFormsValid;
    } catch (error) {
      this.addTestIssue({
        severity: 'critical',
        type: 'functional',
        description: `Form validation failed: ${error}`,
        page: page.url(),
        theme,
        viewport,
        component: 'form',
        recommendation: 'Debug form validation implementation'
      });
      return false;
    }
  }

  /**
   * Recalculate coverage percentages
   */
  private recalculateCoverage(): void {
    // Pages coverage
    const testedPages = Object.values(this.coverageData.coverage.pages.pages).filter(p => p.tested).length;
    this.coverageData.coverage.pages.covered = testedPages;

    // Themes coverage
    const testedThemes = Object.values(this.coverageData.coverage.themes.themes).filter(t => t.tested).length;
    this.coverageData.coverage.themes.covered = testedThemes;

    // Viewports coverage
    const testedViewports = Object.values(this.coverageData.coverage.viewports.viewports).filter(v => v.tested).length;
    this.coverageData.coverage.viewports.covered = testedViewports;

    // Components coverage
    const testedComponents = Object.values(this.coverageData.coverage.components.components).filter(c => c.tested).length;
    this.coverageData.coverage.components.covered = testedComponents;

    // Features coverage
    const testedFeatures = Object.values(this.coverageData.coverage.features.features).filter(f => f.tested).length;
    this.coverageData.coverage.features.covered = testedFeatures;
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(): TestCoverageReport {
    // Add recommendations based on coverage gaps
    this.generateRecommendations();
    
    return { ...this.coverageData };
  }

  /**
   * Generate recommendations based on coverage analysis
   */
  private generateRecommendations(): void {
    const recommendations: string[] = [];

    // Page coverage recommendations
    const pageCoveragePercent = (this.coverageData.coverage.pages.covered / this.coverageData.coverage.pages.total) * 100;
    if (pageCoveragePercent < 90) {
      recommendations.push(`Increase page coverage from ${pageCoveragePercent.toFixed(1)}% to at least 90%`);
    }

    // Theme coverage recommendations
    const themeCoveragePercent = (this.coverageData.coverage.themes.covered / this.coverageData.coverage.themes.total) * 100;
    if (themeCoveragePercent < 100) {
      recommendations.push(`Complete theme coverage - currently at ${themeCoveragePercent.toFixed(1)}%`);
    }

    // Viewport coverage recommendations
    const viewportCoveragePercent = (this.coverageData.coverage.viewports.covered / this.coverageData.coverage.viewports.total) * 100;
    if (viewportCoveragePercent < 80) {
      recommendations.push(`Increase viewport coverage from ${viewportCoveragePercent.toFixed(1)}% to at least 80%`);
    }

    // Requirements coverage recommendations
    const uncoveredRequirements = Object.entries(this.coverageData.requirements)
      .filter(([_, req]) => !req.covered)
      .map(([id, _]) => id);
    
    if (uncoveredRequirements.length > 0) {
      recommendations.push(`Address uncovered requirements: ${uncoveredRequirements.join(', ')}`);
    }

    // Issue-based recommendations
    const criticalIssues = this.coverageData.issues.filter(issue => issue.severity === 'critical').length;
    if (criticalIssues > 0) {
      recommendations.push(`Resolve ${criticalIssues} critical issues before deployment`);
    }

    const accessibilityIssues = this.coverageData.issues.filter(issue => issue.type === 'accessibility').length;
    if (accessibilityIssues > 0) {
      recommendations.push(`Address ${accessibilityIssues} accessibility issues for WCAG compliance`);
    }

    this.coverageData.recommendations = recommendations;
  }

  /**
   * Export report to JSON file
   */
  exportReport(filePath: string): void {
    const report = this.generateReport();
    const fs = require('fs');
    const path = require('path');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  }
}

export default TestExecutionValidator;