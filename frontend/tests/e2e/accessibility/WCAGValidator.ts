import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: ViolationNode[];
}

export interface ViolationNode {
  target: string[];
  html: string;
  failureSummary: string;
}

export interface AccessibilityReport {
  pageUrl: string;
  theme: 'light' | 'dark';
  wcagLevel: 'AA' | 'AAA';
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  score: number;
  timestamp: Date;
}

export interface AccessibilityPass {
  id: string;
  description: string;
  nodes: number;
}

export class WCAGValidator {
  private page: Page;
  private wcagLevel: 'AA' | 'AAA';

  constructor(page: Page, wcagLevel: 'AA' | 'AAA' = 'AA') {
    this.page = page;
    this.wcagLevel = wcagLevel;
  }

  /**
   * Initialize axe-core on the page with WCAG configuration
   */
  async initialize(): Promise<void> {
    // No explicit initialization needed with AxeBuilder
    // Configuration is done per-test
  }

  /**
   * Run comprehensive WCAG audit on the current page
   */
  async runWCAGAudit(theme: 'light' | 'dark' = 'light'): Promise<AccessibilityReport> {
    const pageUrl = this.page.url();
    const timestamp = new Date();

    try {
      // Configure and run axe-core accessibility check
      const axeBuilder = new AxeBuilder({ page: this.page })
        .withTags(this.wcagLevel === 'AAA' ? ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag21aaa'] : ['wcag2a', 'wcag2aa', 'wcag21aa']);

      // Only include rules that exist in axe-core
      const validRules = [
        'color-contrast',
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'button-name',
        'form-field-multiple-labels',
        'frame-title',
        'image-alt',
        'input-image-alt',
        'label',
        'link-name',
        'object-alt',
        'td-headers-attr',
        'th-has-data-cells'
      ];

      if (this.wcagLevel === 'AAA') {
        validRules.push('color-contrast-enhanced');
      }

      axeBuilder.withRules(validRules);

      const results = await axeBuilder.analyze();
      
      // Transform violations to our format
      const violations: AccessibilityViolation[] = results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact as 'critical' | 'serious' | 'moderate' | 'minor',
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary || ''
        }))
      }));

      // Transform passes to our format
      const passes: AccessibilityPass[] = results.passes.map(pass => ({
        id: pass.id,
        description: pass.description,
        nodes: pass.nodes.length
      }));
      
      // Calculate accessibility score
      const score = this.calculateAccessibilityScore(violations, passes);

      return {
        pageUrl,
        theme,
        wcagLevel: this.wcagLevel,
        violations,
        passes,
        score,
        timestamp
      };

    } catch (error) {
      console.error('WCAG audit failed:', error);
      
      // Return partial report with error information
      return {
        pageUrl,
        theme,
        wcagLevel: this.wcagLevel,
        violations: [{
          id: 'audit-error',
          impact: 'critical',
          description: `Accessibility audit failed: ${error.message}`,
          help: 'Fix the underlying issue preventing accessibility analysis',
          helpUrl: '',
          nodes: []
        }],
        passes: [],
        score: 0,
        timestamp
      };
    }
  }

  /**
   * Run accessibility audit on specific elements
   */
  async auditElements(selector: string, theme: 'light' | 'dark' = 'light'): Promise<AccessibilityReport> {
    const pageUrl = this.page.url();
    const timestamp = new Date();

    try {
      // Configure and run axe-core check on specific elements
      const axeBuilder = new AxeBuilder({ page: this.page })
        .include(selector)
        .withTags(this.wcagLevel === 'AAA' ? ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag21aaa'] : ['wcag2a', 'wcag2aa', 'wcag21aa']);

      const results = await axeBuilder.analyze();
      
      const violations: AccessibilityViolation[] = results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact as 'critical' | 'serious' | 'moderate' | 'minor',
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary || ''
        }))
      }));

      const passes: AccessibilityPass[] = results.passes.map(pass => ({
        id: pass.id,
        description: pass.description,
        nodes: pass.nodes.length
      }));

      const score = this.calculateAccessibilityScore(violations, passes);

      return {
        pageUrl: `${pageUrl} (${selector})`,
        theme,
        wcagLevel: this.wcagLevel,
        violations,
        passes,
        score,
        timestamp
      };

    } catch (error) {
      console.error('Element accessibility audit failed:', error);
      
      return {
        pageUrl: `${pageUrl} (${selector})`,
        theme,
        wcagLevel: this.wcagLevel,
        violations: [{
          id: 'element-audit-error',
          impact: 'critical',
          description: `Element accessibility audit failed: ${error.message}`,
          help: 'Check element selector and page state',
          helpUrl: '',
          nodes: []
        }],
        passes: [],
        score: 0,
        timestamp
      };
    }
  }

  /**
   * Check color contrast ratios specifically
   */
  async checkColorContrast(): Promise<AccessibilityViolation[]> {
    try {
      const axeBuilder = new AxeBuilder({ page: this.page })
        .withRules(['color-contrast']);

      if (this.wcagLevel === 'AAA') {
        axeBuilder.withRules(['color-contrast-enhanced']);
      }

      const results = await axeBuilder.analyze();
      
      return results.violations
        .filter(violation => violation.id === 'color-contrast' || violation.id === 'color-contrast-enhanced')
        .map(violation => ({
          id: violation.id,
          impact: violation.impact as 'critical' | 'serious' | 'moderate' | 'minor',
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary || ''
          }))
        }));

    } catch (error) {
      console.error('Color contrast check failed:', error);
      return [{
        id: 'contrast-check-error',
        impact: 'critical',
        description: `Color contrast check failed: ${error.message}`,
        help: 'Ensure page is loaded and accessible',
        helpUrl: '',
        nodes: []
      }];
    }
  }



  /**
   * Calculate accessibility score based on violations and passes
   */
  private calculateAccessibilityScore(violations: AccessibilityViolation[], passes: AccessibilityPass[]): number {
    if (violations.length === 0 && passes.length === 0) {
      return 0; // No data available
    }

    // Weight violations by impact
    const violationWeights = {
      critical: 10,
      serious: 7,
      moderate: 4,
      minor: 1
    };

    const totalViolationWeight = violations.reduce((sum, violation) => {
      return sum + violationWeights[violation.impact];
    }, 0);

    const totalPasses = passes.reduce((sum, pass) => sum + pass.nodes, 0);
    const totalChecks = totalViolationWeight + totalPasses;

    if (totalChecks === 0) {
      return 100; // No violations or passes means perfect score
    }

    // Calculate score as percentage of passes vs total weighted checks
    const score = Math.max(0, Math.round(((totalPasses) / (totalPasses + totalViolationWeight)) * 100));
    
    return score;
  }

  /**
   * Generate detailed violation report
   */
  generateViolationReport(violations: AccessibilityViolation[]): string {
    if (violations.length === 0) {
      return 'No accessibility violations found! ✅';
    }

    let report = `Found ${violations.length} accessibility violations:\n\n`;

    violations.forEach((violation, index) => {
      report += `${index + 1}. ${violation.id} (${violation.impact})\n`;
      report += `   Description: ${violation.description}\n`;
      report += `   Help: ${violation.help}\n`;
      report += `   More info: ${violation.helpUrl}\n`;
      
      if (violation.nodes.length > 0) {
        report += `   Affected elements (${violation.nodes.length}):\n`;
        violation.nodes.slice(0, 3).forEach(node => {
          report += `   - ${node.target.join(', ')}\n`;
          if (node.failureSummary) {
            report += `     Issue: ${node.failureSummary}\n`;
          }
        });
        
        if (violation.nodes.length > 3) {
          report += `   ... and ${violation.nodes.length - 3} more elements\n`;
        }
      }
      
      report += '\n';
    });

    return report;
  }

  /**
   * Set WCAG compliance level
   */
  setWCAGLevel(level: 'AA' | 'AAA'): void {
    this.wcagLevel = level;
  }

  /**
   * Get current WCAG compliance level
   */
  getWCAGLevel(): 'AA' | 'AAA' {
    return this.wcagLevel;
  }
}