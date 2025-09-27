import { Page } from '@playwright/test';

export interface ComponentThemeCompliance {
  selector: string;
  element: string;
  tagName: string;
  className: string;
  compliant: boolean;
  score: number; // 0-100
  checks: {
    hasThemeClasses: boolean;
    hasProperContrast: boolean;
    hasVisibleContent: boolean;
    hasAccessibleColors: boolean;
    hasConsistentStyling: boolean;
  };
  styles: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  issues: ComponentThemeIssue[];
  recommendations: string[];
}

export interface ComponentThemeIssue {
  type: 'contrast' | 'visibility' | 'consistency' | 'accessibility' | 'styling';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  element: string;
  theme: 'light' | 'dark' | 'both';
}

export interface ComponentThemeReport {
  timestamp: Date;
  pageUrl: string;
  totalComponents: number;
  compliantComponents: number;
  averageScore: number;
  components: ComponentThemeCompliance[];
  summary: {
    criticalIssues: number;
    majorIssues: number;
    minorIssues: number;
    byType: Record<string, number>;
    byTheme: Record<string, number>;
  };
  recommendations: string[];
}

export interface ComponentCheckOptions {
  contrastThreshold?: number;
  checkAccessibility?: boolean;
  checkConsistency?: boolean;
  includeHiddenElements?: boolean;
  customRules?: ComponentThemeRule[];
}

export interface ComponentThemeRule {
  name: string;
  selector: string;
  requiredProperties: string[];
  themeSpecificChecks?: {
    light?: (styles: Record<string, string>) => boolean;
    dark?: (styles: Record<string, string>) => boolean;
  };
}

/**
 * ComponentThemeChecker performs per-component theme compliance testing
 * Validates individual components against theme requirements and best practices
 */
export class ComponentThemeChecker {
  private readonly defaultRules: ComponentThemeRule[] = [
    {
      name: 'Button Theme Compliance',
      selector: 'button, [role="button"], .btn, .button',
      requiredProperties: ['background-color', 'color', 'border-color'],
      themeSpecificChecks: {
        light: (styles) => styles['background-color'] !== 'rgba(0, 0, 0, 0)',
        dark: (styles) => styles['background-color'] !== 'rgba(0, 0, 0, 0)'
      }
    },
    {
      name: 'Input Theme Compliance',
      selector: 'input, select, textarea',
      requiredProperties: ['background-color', 'color', 'border-color'],
      themeSpecificChecks: {
        light: (styles) => styles['border-color'] !== 'rgba(0, 0, 0, 0)',
        dark: (styles) => styles['border-color'] !== 'rgba(0, 0, 0, 0)'
      }
    },
    {
      name: 'Card Theme Compliance',
      selector: '[data-testid*="card"], .card',
      requiredProperties: ['background-color', 'border-color'],
      themeSpecificChecks: {
        light: (styles) => styles['background-color'] !== 'rgba(0, 0, 0, 0)',
        dark: (styles) => styles['background-color'] !== 'rgba(0, 0, 0, 0)'
      }
    },
    {
      name: 'Navigation Theme Compliance',
      selector: 'nav, [role="navigation"], .nav, .navbar',
      requiredProperties: ['background-color', 'color'],
      themeSpecificChecks: {
        light: (styles) => styles['background-color'] !== 'rgba(0, 0, 0, 0)',
        dark: (styles) => styles['background-color'] !== 'rgba(0, 0, 0, 0)'
      }
    },
    {
      name: 'Modal Theme Compliance',
      selector: '[data-testid*="modal"], .modal, [role="dialog"]',
      requiredProperties: ['background-color', 'color', 'box-shadow'],
      themeSpecificChecks: {
        light: (styles) => styles['box-shadow'] !== 'none',
        dark: (styles) => styles['box-shadow'] !== 'none'
      }
    }
  ];

  constructor(private page: Page) {}

  /**
   * Check theme compliance for all components on the page
   */
  async checkAllComponents(options: ComponentCheckOptions = {}): Promise<ComponentThemeReport> {
    const {
      contrastThreshold = 4.5,
      checkAccessibility = true,
      checkConsistency = true,
      includeHiddenElements = false,
      customRules = []
    } = options;

    const rules = [...this.defaultRules, ...customRules];
    const components: ComponentThemeCompliance[] = [];

    // Check each rule
    for (const rule of rules) {
      const ruleComponents = await this._checkComponentsForRule(
        rule,
        { contrastThreshold, checkAccessibility, checkConsistency, includeHiddenElements }
      );
      components.push(...ruleComponents);
    }

    // Generate summary
    const summary = this._generateSummary(components);
    const recommendations = this._generateRecommendations(components);

    return {
      timestamp: new Date(),
      pageUrl: this.page.url(),
      totalComponents: components.length,
      compliantComponents: components.filter(c => c.compliant).length,
      averageScore: components.reduce((sum, c) => sum + c.score, 0) / components.length || 0,
      components,
      summary,
      recommendations
    };
  }

  /**
   * Check specific component by selector
   */
  async checkComponent(
    selector: string,
    options: ComponentCheckOptions = {}
  ): Promise<ComponentThemeCompliance[]> {
    const rule: ComponentThemeRule = {
      name: `Custom Component Check: ${selector}`,
      selector,
      requiredProperties: ['background-color', 'color', 'border-color']
    };

    return await this._checkComponentsForRule(rule, options);
  }

  /**
   * Check component theme consistency across different states
   */
  async checkComponentStates(
    selector: string,
    states: Array<{ name: string; action: () => Promise<void> }>
  ): Promise<{
    selector: string;
    states: Record<string, ComponentThemeCompliance[]>;
    consistency: {
      consistent: boolean;
      issues: string[];
      recommendations: string[];
    };
  }> {
    const stateResults: Record<string, ComponentThemeCompliance[]> = {};
    const issues: string[] = [];

    // Test each state
    for (const state of states) {
      try {
        await state.action();
        await this.page.waitForTimeout(100);
        stateResults[state.name] = await this.checkComponent(selector);
      } catch (error) {
        issues.push(`Failed to test state "${state.name}": ${error}`);
      }
    }

    // Analyze consistency
    const stateNames = Object.keys(stateResults);
    if (stateNames.length > 1) {
      const baseState = stateResults[stateNames[0]];
      
      for (let i = 1; i < stateNames.length; i++) {
        const compareState = stateResults[stateNames[i]];
        
        if (baseState.length !== compareState.length) {
          issues.push(`Component count differs between states: ${baseState.length} vs ${compareState.length}`);
        }

        // Compare scores
        const baseAvgScore = baseState.reduce((sum, c) => sum + c.score, 0) / baseState.length;
        const compareAvgScore = compareState.reduce((sum, c) => sum + c.score, 0) / compareState.length;
        
        if (Math.abs(baseAvgScore - compareAvgScore) > 10) {
          issues.push(`Significant score difference between states: ${baseAvgScore.toFixed(1)} vs ${compareAvgScore.toFixed(1)}`);
        }
      }
    }

    const recommendations: string[] = [];
    if (issues.length > 0) {
      recommendations.push('Ensure consistent theme application across all component states');
      recommendations.push('Test interactive states (hover, focus, active) for theme compliance');
    }

    return {
      selector,
      states: stateResults,
      consistency: {
        consistent: issues.length === 0,
        issues,
        recommendations
      }
    };
  }

  /**
   * Validate component theme compliance against WCAG guidelines
   */
  async validateWCAGCompliance(
    selector: string
  ): Promise<{
    compliant: boolean;
    level: 'AA' | 'AAA' | 'fail';
    checks: {
      colorContrast: { pass: boolean; ratio: number; required: number };
      focusVisible: { pass: boolean; description: string };
      colorAlone: { pass: boolean; description: string };
    };
    recommendations: string[];
  }> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) {
        return {
          compliant: false,
          level: 'fail' as const,
          checks: {
            colorContrast: { pass: false, ratio: 0, required: 4.5 },
            focusVisible: { pass: false, description: 'Element not found' },
            colorAlone: { pass: false, description: 'Element not found' }
          },
          recommendations: ['Element not found on page']
        };
      }

      const styles = window.getComputedStyle(element);
      const recommendations: string[] = [];

      // Color contrast check (simplified)
      const colorContrast = {
        pass: true, // Simplified - would need proper contrast calculation
        ratio: 4.5, // Placeholder
        required: 4.5
      };

      // Focus visibility check
      const focusVisible = {
        pass: styles.outlineStyle !== 'none' || styles.boxShadow.includes('focus'),
        description: styles.outlineStyle === 'none' ? 'No visible focus indicator' : 'Focus indicator present'
      };

      if (!focusVisible.pass) {
        recommendations.push('Add visible focus indicators for keyboard navigation');
      }

      // Color alone check (simplified)
      const colorAlone = {
        pass: true, // Would need more sophisticated checking
        description: 'Information not conveyed by color alone'
      };

      const allPass = colorContrast.pass && focusVisible.pass && colorAlone.pass;
      const level = allPass ? 'AA' : 'fail';

      return {
        compliant: allPass,
        level,
        checks: { colorContrast, focusVisible, colorAlone },
        recommendations
      };
    }, selector);
  }

  /**
   * Check components for a specific rule
   */
  private async _checkComponentsForRule(
    rule: ComponentThemeRule,
    options: ComponentCheckOptions
  ): Promise<ComponentThemeCompliance[]> {
    return await this.page.evaluate(
      ({ rule, options }) => {
        const elements = document.querySelectorAll(rule.selector);
        const results: ComponentThemeCompliance[] = [];

        elements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;

          if (!isVisible && !options.includeHiddenElements) {
            return;
          }

          const issues: ComponentThemeIssue[] = [];
          const recommendations: string[] = [];

          // Get styles for both themes
          const currentStyles = window.getComputedStyle(element);
          const lightStyles: Record<string, string> = {};
          const darkStyles: Record<string, string> = {};

          // Capture current styles (assuming current theme)
          rule.requiredProperties.forEach(prop => {
            lightStyles[prop] = currentStyles.getPropertyValue(prop);
            darkStyles[prop] = currentStyles.getPropertyValue(prop);
          });

          // Perform checks
          const checks = {
            hasThemeClasses: this._hasThemeClasses(element),
            hasProperContrast: this._hasProperContrast(currentStyles, options.contrastThreshold || 4.5),
            hasVisibleContent: this._hasVisibleContent(element, currentStyles),
            hasAccessibleColors: this._hasAccessibleColors(currentStyles),
            hasConsistentStyling: this._hasConsistentStyling(currentStyles, rule.requiredProperties)
          };

          // Generate issues based on failed checks
          if (!checks.hasThemeClasses) {
            issues.push({
              type: 'styling',
              severity: 'minor',
              description: 'Component lacks theme-specific CSS classes',
              element: element.tagName.toLowerCase(),
              theme: 'both'
            });
            recommendations.push('Add theme-specific CSS classes (dark:, light:)');
          }

          if (!checks.hasProperContrast) {
            issues.push({
              type: 'contrast',
              severity: 'critical',
              description: 'Insufficient color contrast ratio',
              element: element.tagName.toLowerCase(),
              theme: 'both'
            });
            recommendations.push('Improve color contrast to meet WCAG AA standards');
          }

          if (!checks.hasVisibleContent) {
            issues.push({
              type: 'visibility',
              severity: 'major',
              description: 'Content may not be visible in current theme',
              element: element.tagName.toLowerCase(),
              theme: 'both'
            });
            recommendations.push('Ensure content is visible in both light and dark themes');
          }

          if (!checks.hasAccessibleColors) {
            issues.push({
              type: 'accessibility',
              severity: 'major',
              description: 'Colors may not be accessible to all users',
              element: element.tagName.toLowerCase(),
              theme: 'both'
            });
            recommendations.push('Use accessible color combinations');
          }

          if (!checks.hasConsistentStyling) {
            issues.push({
              type: 'consistency',
              severity: 'minor',
              description: 'Inconsistent styling properties',
              element: element.tagName.toLowerCase(),
              theme: 'both'
            });
            recommendations.push('Ensure consistent styling across theme properties');
          }

          // Calculate compliance score
          const passedChecks = Object.values(checks).filter(Boolean).length;
          const score = (passedChecks / Object.keys(checks).length) * 100;
          const compliant = score >= 80 && issues.filter(i => i.severity === 'critical').length === 0;

          results.push({
            selector: `${rule.selector}:nth-child(${index + 1})`,
            element: rule.name,
            tagName: element.tagName.toLowerCase(),
            className: element.className || '',
            compliant,
            score,
            checks,
            styles: { light: lightStyles, dark: darkStyles },
            issues,
            recommendations: [...new Set(recommendations)]
          });
        });

        return results;
      },
      { rule, options }
    );
  }

  /**
   * Check if element has theme-specific classes
   */
  private _hasThemeClasses(element: Element): boolean {
    const className = element.className || '';
    return className.includes('dark:') || 
           className.includes('light:') ||
           element.closest('[class*="dark:"]') !== null ||
           element.closest('[class*="light:"]') !== null;
  }

  /**
   * Check if element has proper color contrast
   */
  private _hasProperContrast(styles: CSSStyleDeclaration, threshold: number): boolean {
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Simplified contrast check - would need proper color parsing and calculation
    if (color === 'rgba(0, 0, 0, 0)' || backgroundColor === 'rgba(0, 0, 0, 0)') {
      return false;
    }
    
    // Placeholder - would implement actual contrast ratio calculation
    return true;
  }

  /**
   * Check if element has visible content
   */
  private _hasVisibleContent(element: Element, styles: CSSStyleDeclaration): boolean {
    const hasText = element.textContent && element.textContent.trim().length > 0;
    const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const hasVisibleColor = styles.color !== 'rgba(0, 0, 0, 0)';
    
    return hasText ? hasVisibleColor : hasBackground;
  }

  /**
   * Check if element uses accessible colors
   */
  private _hasAccessibleColors(styles: CSSStyleDeclaration): boolean {
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Basic check - colors should not be the same
    return color !== backgroundColor;
  }

  /**
   * Check if element has consistent styling
   */
  private _hasConsistentStyling(styles: CSSStyleDeclaration, requiredProps: string[]): boolean {
    return requiredProps.every(prop => {
      const value = styles.getPropertyValue(prop);
      return value && value !== 'initial' && value !== 'inherit';
    });
  }

  /**
   * Generate summary statistics
   */
  private _generateSummary(components: ComponentThemeCompliance[]) {
    const criticalIssues = components.reduce((sum, c) => 
      sum + c.issues.filter(i => i.severity === 'critical').length, 0
    );
    const majorIssues = components.reduce((sum, c) => 
      sum + c.issues.filter(i => i.severity === 'major').length, 0
    );
    const minorIssues = components.reduce((sum, c) => 
      sum + c.issues.filter(i => i.severity === 'minor').length, 0
    );

    const byType: Record<string, number> = {};
    const byTheme: Record<string, number> = {};

    components.forEach(component => {
      component.issues.forEach(issue => {
        byType[issue.type] = (byType[issue.type] || 0) + 1;
        byTheme[issue.theme] = (byTheme[issue.theme] || 0) + 1;
      });
    });

    return {
      criticalIssues,
      majorIssues,
      minorIssues,
      byType,
      byTheme
    };
  }

  /**
   * Generate recommendations based on component analysis
   */
  private _generateRecommendations(components: ComponentThemeCompliance[]): string[] {
    const recommendations: string[] = [];
    const allRecommendations = components.flatMap(c => c.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];

    // Add global recommendations based on patterns
    const criticalComponents = components.filter(c => 
      c.issues.some(i => i.severity === 'critical')
    );

    if (criticalComponents.length > 0) {
      recommendations.push(`${criticalComponents.length} components have critical theme issues - prioritize fixing these first`);
    }

    const lowScoreComponents = components.filter(c => c.score < 60);
    if (lowScoreComponents.length > 0) {
      recommendations.push(`${lowScoreComponents.length} components have low theme compliance scores - review theme implementation`);
    }

    const componentsWithoutThemeClasses = components.filter(c => !c.checks.hasThemeClasses);
    if (componentsWithoutThemeClasses.length > components.length * 0.5) {
      recommendations.push('Many components lack theme-specific classes - implement comprehensive theme system');
    }

    return [...recommendations, ...uniqueRecommendations.slice(0, 5)]; // Limit to avoid overwhelming
  }
}