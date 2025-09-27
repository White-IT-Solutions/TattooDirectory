import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ErrorHandler, ErrorContext } from './ErrorHandler';

export interface AccessibilityFallbackResult {
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  score: number;
  source: 'primary' | 'fallback' | 'manual' | 'placeholder';
  error?: string;
}

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

export interface AccessibilityPass {
  id: string;
  description: string;
  nodes: number;
}

export class AccessibilityErrorHandler {
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Run accessibility audit with fallback mechanisms
   */
  async runAuditWithFallbacks(
    page: Page,
    pageName: string,
    theme: 'light' | 'dark',
    wcagLevel: 'AA' | 'AAA' = 'AA'
  ): Promise<AccessibilityFallbackResult> {
    const context: ErrorContext = {
      operation: 'accessibility_audit',
      page: pageName,
      theme,
      viewport: page.viewportSize() || undefined,
      timestamp: new Date(),
      attempt: 1,
      maxRetries: 2
    };

    // Primary method: Full axe-core audit
    const primaryMethod = async (): Promise<AccessibilityFallbackResult> => {
      return await this.runFullAxeAudit(page, wcagLevel);
    };

    // Fallback: Partial audit with reduced rule set
    const fallbackResult = await this.createFallbackResult(page, wcagLevel);

    try {
      return await this.errorHandler.handleAccessibilityError(
        primaryMethod,
        context,
        fallbackResult
      );
    } catch (error) {
      console.warn('All accessibility audit methods failed, using manual checks');
      return await this.runManualAccessibilityChecks(page, wcagLevel);
    }
  }

  /**
   * Primary accessibility audit using axe-core
   */
  private async runFullAxeAudit(
    page: Page,
    wcagLevel: 'AA' | 'AAA'
  ): Promise<AccessibilityFallbackResult> {
    const tags = wcagLevel === 'AAA' 
      ? ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag21aaa']
      : ['wcag2a', 'wcag2aa', 'wcag21aa'];

    const axeBuilder = new AxeBuilder({ page })
      .withTags(tags)
      .options({
        runOnly: {
          type: 'tag',
          values: tags
        },
        resultTypes: ['violations', 'passes'],
        reporter: 'v2'
      });

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
      violations,
      passes,
      score,
      source: 'primary'
    };
  }

  /**
   * Create fallback result with reduced rule set
   */
  private async createFallbackResult(
    page: Page,
    wcagLevel: 'AA' | 'AAA'
  ): Promise<AccessibilityFallbackResult> {
    try {
      console.log('Running fallback accessibility audit with reduced rule set');
      
      // Use only the most critical rules that are less likely to fail
      const criticalRules = [
        'color-contrast',
        'image-alt',
        'label',
        'button-name',
        'link-name'
      ];

      const axeBuilder = new AxeBuilder({ page })
        .withRules(criticalRules)
        .options({
          runOnly: {
            type: 'rule',
            values: criticalRules
          },
          resultTypes: ['violations', 'passes']
        });

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
        violations,
        passes,
        score,
        source: 'fallback'
      };
    } catch (error) {
      console.warn('Fallback accessibility audit failed:', error.message);
      return this.createPlaceholderResult(error.message);
    }
  }

  /**
   * Manual accessibility checks when automated tools fail
   */
  private async runManualAccessibilityChecks(
    page: Page,
    wcagLevel: 'AA' | 'AAA'
  ): Promise<AccessibilityFallbackResult> {
    const violations: AccessibilityViolation[] = [];
    const passes: AccessibilityPass[] = [];

    try {
      // Manual check 1: Images without alt text
      const imagesWithoutAlt = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images
          .filter(img => !img.alt && !img.getAttribute('aria-label'))
          .map(img => ({
            src: img.src,
            outerHTML: img.outerHTML.substring(0, 100)
          }));
      });

      if (imagesWithoutAlt.length > 0) {
        violations.push({
          id: 'image-alt-manual',
          impact: 'serious',
          description: 'Images must have alternate text',
          help: 'Add alt attributes to images',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          nodes: imagesWithoutAlt.map(img => ({
            target: [`img[src="${img.src}"]`],
            html: img.outerHTML,
            failureSummary: 'Missing alt attribute'
          }))
        });
      } else {
        passes.push({
          id: 'image-alt-manual',
          description: 'Images have alternate text',
          nodes: await page.locator('img').count()
        });
      }

      // Manual check 2: Form labels
      const unlabeledInputs = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs
          .filter(input => {
            const hasLabel = document.querySelector(`label[for="${input.id}"]`);
            const hasAriaLabel = input.getAttribute('aria-label');
            const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
            return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
          })
          .map(input => ({
            type: input.type || input.tagName.toLowerCase(),
            outerHTML: input.outerHTML.substring(0, 100)
          }));
      });

      if (unlabeledInputs.length > 0) {
        violations.push({
          id: 'label-manual',
          impact: 'critical',
          description: 'Form elements must have labels',
          help: 'Add labels to form elements',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          nodes: unlabeledInputs.map(input => ({
            target: [`${input.type}`],
            html: input.outerHTML,
            failureSummary: 'Missing label'
          }))
        });
      } else {
        passes.push({
          id: 'label-manual',
          description: 'Form elements have labels',
          nodes: await page.locator('input, select, textarea').count()
        });
      }

      // Manual check 3: Button names
      const unnamedButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
        return buttons
          .filter(button => {
            const hasText = button.textContent?.trim();
            const hasAriaLabel = button.getAttribute('aria-label');
            const hasTitle = button.getAttribute('title');
            return !hasText && !hasAriaLabel && !hasTitle;
          })
          .map(button => ({
            outerHTML: button.outerHTML.substring(0, 100)
          }));
      });

      if (unnamedButtons.length > 0) {
        violations.push({
          id: 'button-name-manual',
          impact: 'serious',
          description: 'Buttons must have discernible text',
          help: 'Add text content or aria-label to buttons',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
          nodes: unnamedButtons.map(button => ({
            target: ['button'],
            html: button.outerHTML,
            failureSummary: 'Missing button name'
          }))
        });
      } else {
        passes.push({
          id: 'button-name-manual',
          description: 'Buttons have discernible text',
          nodes: await page.locator('button, input[type="button"], input[type="submit"]').count()
        });
      }

      const score = this.calculateAccessibilityScore(violations, passes);

      return {
        violations,
        passes,
        score,
        source: 'manual'
      };
    } catch (error) {
      console.error('Manual accessibility checks failed:', error.message);
      return this.createPlaceholderResult(error.message);
    }
  }

  /**
   * Create placeholder result when all methods fail
   */
  private createPlaceholderResult(errorMessage: string): AccessibilityFallbackResult {
    return {
      violations: [{
        id: 'audit-failure',
        impact: 'critical',
        description: `Accessibility audit failed: ${errorMessage}`,
        help: 'Fix the underlying issue preventing accessibility analysis',
        helpUrl: '',
        nodes: []
      }],
      passes: [],
      score: 0,
      source: 'placeholder',
      error: errorMessage
    };
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(
    violations: AccessibilityViolation[],
    passes: AccessibilityPass[]
  ): number {
    if (violations.length === 0 && passes.length === 0) {
      return 0;
    }

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
      return 100;
    }

    return Math.max(0, Math.round(((totalPasses) / (totalPasses + totalViolationWeight)) * 100));
  }

  /**
   * Validate accessibility tool availability
   */
  async validateAccessibilityTools(page: Page): Promise<ToolValidationResult> {
    const results: ToolValidationResult = {
      axeCore: false,
      manualChecks: false,
      errors: []
    };

    try {
      // Test axe-core availability
      await page.evaluate(() => {
        if (typeof window.axe === 'undefined') {
          throw new Error('axe-core not available');
        }
      });
      results.axeCore = true;
    } catch (error) {
      results.errors.push(`axe-core validation failed: ${error.message}`);
    }

    try {
      // Test manual check capabilities
      await page.evaluate(() => {
        // Test basic DOM query capabilities
        document.querySelectorAll('*');
        return true;
      });
      results.manualChecks = true;
    } catch (error) {
      results.errors.push(`Manual checks validation failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Get accessibility audit statistics
   */
  getAuditStatistics(results: AccessibilityFallbackResult[]): AccessibilityStatistics {
    const totalAudits = results.length;
    const successfulAudits = results.filter(r => r.source !== 'placeholder').length;
    const fallbackAudits = results.filter(r => r.source === 'fallback').length;
    const manualAudits = results.filter(r => r.source === 'manual').length;

    const averageScore = totalAudits > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / totalAudits 
      : 0;

    const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
    const criticalViolations = results.reduce((sum, r) => 
      sum + r.violations.filter(v => v.impact === 'critical').length, 0);

    return {
      totalAudits,
      successfulAudits,
      fallbackAudits,
      manualAudits,
      successRate: totalAudits > 0 ? successfulAudits / totalAudits : 0,
      averageScore,
      totalViolations,
      criticalViolations
    };
  }
}

export interface ToolValidationResult {
  axeCore: boolean;
  manualChecks: boolean;
  errors: string[];
}

export interface AccessibilityStatistics {
  totalAudits: number;
  successfulAudits: number;
  fallbackAudits: number;
  manualAudits: number;
  successRate: number;
  averageScore: number;
  totalViolations: number;
  criticalViolations: number;
}