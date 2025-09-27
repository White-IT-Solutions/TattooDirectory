import { Page } from '@playwright/test';
import { ThemeState } from './ThemeToggler';

export interface ComponentThemeValidation {
  selector: string;
  element: string;
  hasThemeClasses: boolean;
  computedStyles: {
    color: string;
    backgroundColor: string;
    borderColor: string;
    opacity: string;
  };
  cssVariables: Record<string, string>;
  isVisible: boolean;
  issues: string[];
}

export interface ThemeValidationReport {
  theme: 'light' | 'dark';
  timestamp: Date;
  pageUrl: string;
  overallValid: boolean;
  componentsChecked: number;
  issuesFound: number;
  components: ComponentThemeValidation[];
  globalIssues: string[];
  recommendations: string[];
}

export interface ThemeValidationOptions {
  checkCssVariables?: boolean;
  checkComputedStyles?: boolean;
  checkVisibility?: boolean;
  includeHiddenElements?: boolean;
  customSelectors?: string[];
  skipSelectors?: string[];
}

/**
 * ThemeValidator ensures proper theme application across components
 * Validates CSS variables, computed styles, and theme-specific classes
 */
export class ThemeValidator {
  private readonly defaultSelectors = [
    'body',
    'header',
    'nav',
    'main',
    'footer',
    'aside',
    'section',
    'article',
    '[data-testid*="card"]',
    '[data-testid*="button"]',
    '[data-testid*="input"]',
    '[data-testid*="modal"]',
    '[data-testid*="dropdown"]',
    '[data-testid*="menu"]',
    '.btn',
    '.button',
    '.card',
    '.modal',
    '.dropdown',
    '.menu',
    'input',
    'select',
    'textarea',
    'button',
    'a[href]',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]'
  ];

  private readonly themeRelatedCssVars = [
    '--background',
    '--foreground',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--destructive',
    '--destructive-foreground',
    '--border',
    '--input',
    '--ring',
    '--radius'
  ];

  constructor(private page: Page) {}

  /**
   * Validate theme application across all components on the page
   */
  async validateThemeApplication(
    theme: 'light' | 'dark',
    options: ThemeValidationOptions = {}
  ): Promise<ThemeValidationReport> {
    const {
      checkCssVariables = true,
      checkComputedStyles = true,
      checkVisibility = true,
      includeHiddenElements = false,
      customSelectors = [],
      skipSelectors = []
    } = options;

    const selectors = [...this.defaultSelectors, ...customSelectors]
      .filter(selector => !skipSelectors.includes(selector));

    const components: ComponentThemeValidation[] = [];
    const globalIssues: string[] = [];

    // Validate global theme state
    const themeState = await this._getGlobalThemeState();
    if (themeState.current !== theme) {
      globalIssues.push(`Global theme mismatch: expected ${theme}, got ${themeState.current}`);
    }

    // Validate each component
    for (const selector of selectors) {
      try {
        const componentValidations = await this._validateComponentTheme(
          selector,
          theme,
          { checkCssVariables, checkComputedStyles, checkVisibility, includeHiddenElements }
        );
        components.push(...componentValidations);
      } catch (error) {
        globalIssues.push(`Failed to validate selector "${selector}": ${error}`);
      }
    }

    const issuesFound = components.reduce((sum, comp) => sum + comp.issues.length, 0) + globalIssues.length;
    const recommendations = this._generateRecommendations(components, globalIssues);

    return {
      theme,
      timestamp: new Date(),
      pageUrl: this.page.url(),
      overallValid: issuesFound === 0,
      componentsChecked: components.length,
      issuesFound,
      components,
      globalIssues,
      recommendations
    };
  }

  /**
   * Validate specific component theme compliance
   */
  async validateComponent(
    selector: string,
    theme: 'light' | 'dark',
    options: ThemeValidationOptions = {}
  ): Promise<ComponentThemeValidation[]> {
    return await this._validateComponentTheme(selector, theme, options);
  }

  /**
   * Check if all required CSS variables are defined for the current theme
   */
  async validateCssVariables(theme: 'light' | 'dark'): Promise<{
    valid: boolean;
    missing: string[];
    defined: Record<string, string>;
  }> {
    return await this.page.evaluate((vars) => {
      const styles = getComputedStyle(document.documentElement);
      const defined: Record<string, string> = {};
      const missing: string[] = [];

      vars.forEach(varName => {
        const value = styles.getPropertyValue(varName);
        if (value && value.trim()) {
          defined[varName] = value.trim();
        } else {
          missing.push(varName);
        }
      });

      return {
        valid: missing.length === 0,
        missing,
        defined
      };
    }, this.themeRelatedCssVars);
  }

  /**
   * Validate theme consistency across different page states
   */
  async validateThemeConsistency(theme: 'light' | 'dark'): Promise<{
    consistent: boolean;
    issues: string[];
    states: Record<string, ThemeValidationReport>;
  }> {
    const states: Record<string, ThemeValidationReport> = {};
    const issues: string[] = [];

    // Test different page states
    const testStates = [
      { name: 'initial', action: async () => {} },
      { name: 'after_scroll', action: async () => {
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await this.page.waitForTimeout(100);
      }},
      { name: 'after_hover', action: async () => {
        const firstButton = this.page.locator('button, [role="button"]').first();
        if (await firstButton.isVisible()) {
          await firstButton.hover();
          await this.page.waitForTimeout(100);
        }
      }},
      { name: 'after_focus', action: async () => {
        const firstInput = this.page.locator('input, select, textarea').first();
        if (await firstInput.isVisible()) {
          await firstInput.focus();
          await this.page.waitForTimeout(100);
        }
      }}
    ];

    // Validate theme in each state
    for (const testState of testStates) {
      try {
        await testState.action();
        states[testState.name] = await this.validateThemeApplication(theme);
      } catch (error) {
        issues.push(`Failed to test state "${testState.name}": ${error}`);
      }
    }

    // Check for consistency issues
    const baseState = states.initial;
    if (baseState) {
      Object.entries(states).forEach(([stateName, stateReport]) => {
        if (stateName === 'initial') return;

        // Compare component counts
        if (stateReport.componentsChecked !== baseState.componentsChecked) {
          issues.push(`Component count changed in state "${stateName}": ${stateReport.componentsChecked} vs ${baseState.componentsChecked}`);
        }

        // Compare issue counts
        if (stateReport.issuesFound > baseState.issuesFound) {
          issues.push(`New issues appeared in state "${stateName}": ${stateReport.issuesFound - baseState.issuesFound} additional issues`);
        }
      });
    }

    return {
      consistent: issues.length === 0,
      issues,
      states
    };
  }

  /**
   * Get global theme state
   */
  private async _getGlobalThemeState(): Promise<ThemeState> {
    return await this.page.evaluate(() => {
      const html = document.documentElement;
      const isDark = html.classList.contains('dark');
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const storageValue = localStorage.getItem('theme');
      const htmlClasses = Array.from(html.classList);

      const styles = getComputedStyle(html);
      const cssVariables: Record<string, string> = {};
      
      const themeVars = [
        '--background', '--foreground', '--primary', '--secondary',
        '--muted', '--accent', '--destructive', '--border', '--input', '--ring'
      ];

      themeVars.forEach(varName => {
        const value = styles.getPropertyValue(varName);
        if (value) {
          cssVariables[varName] = value.trim();
        }
      });

      return {
        current: isDark ? 'dark' : 'light',
        systemPreference,
        storageValue,
        htmlClasses,
        cssVariables
      };
    });
  }

  /**
   * Validate theme application for a specific component selector
   */
  private async _validateComponentTheme(
    selector: string,
    theme: 'light' | 'dark',
    options: ThemeValidationOptions
  ): Promise<ComponentThemeValidation[]> {
    return await this.page.evaluate(
      ({ selector, theme, options, themeVars }) => {
        const elements = document.querySelectorAll(selector);
        const validations: ComponentThemeValidation[] = [];

        elements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           window.getComputedStyle(element).visibility !== 'hidden';

          // Skip hidden elements unless explicitly requested
          if (!isVisible && !options.includeHiddenElements) {
            return;
          }

          const issues: string[] = [];
          const styles = window.getComputedStyle(element);
          
          // Check theme-related classes
          const className = element.className || '';
          const hasThemeClasses = className.includes('dark:') || 
                                 className.includes('light:') ||
                                 element.closest('[class*="dark:"]') !== null ||
                                 element.closest('[class*="light:"]') !== null;

          // Get computed styles
          const computedStyles = {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            opacity: styles.opacity
          };

          // Check for transparent/default colors that might indicate missing theme styles
          if (options.checkComputedStyles) {
            if (computedStyles.color === 'rgba(0, 0, 0, 0)' || computedStyles.color === 'transparent') {
              issues.push('Element has transparent text color');
            }
            
            if (element.tagName.toLowerCase() !== 'body' && 
                computedStyles.backgroundColor === 'rgba(0, 0, 0, 0)' && 
                !['span', 'em', 'strong', 'i', 'b'].includes(element.tagName.toLowerCase())) {
              // Only flag as issue for elements that typically should have backgrounds
              if (['button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase()) ||
                  className.includes('card') || className.includes('modal') || className.includes('dropdown')) {
                issues.push('Element has transparent background color');
              }
            }
          }

          // Get CSS variables
          const cssVariables: Record<string, string> = {};
          if (options.checkCssVariables) {
            themeVars.forEach((varName: string) => {
              const value = styles.getPropertyValue(varName);
              if (value && value.trim()) {
                cssVariables[varName] = value.trim();
              }
            });
          }

          // Check visibility issues
          if (options.checkVisibility && isVisible) {
            const textContent = element.textContent?.trim();
            if (textContent && textContent.length > 0) {
              // Check if text might be invisible due to color issues
              if (computedStyles.color === computedStyles.backgroundColor) {
                issues.push('Text color matches background color (invisible text)');
              }
            }
          }

          validations.push({
            selector: `${selector}:nth-child(${index + 1})`,
            element: element.tagName.toLowerCase(),
            hasThemeClasses,
            computedStyles,
            cssVariables,
            isVisible,
            issues
          });
        });

        return validations;
      },
      { selector, theme, options, themeVars: this.themeRelatedCssVars }
    );
  }

  /**
   * Generate recommendations based on validation results
   */
  private _generateRecommendations(
    components: ComponentThemeValidation[],
    globalIssues: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Global recommendations
    if (globalIssues.length > 0) {
      recommendations.push('Fix global theme state issues before addressing component-specific problems');
    }

    // Component-specific recommendations
    const componentsWithIssues = components.filter(c => c.issues.length > 0);
    const transparentColorIssues = componentsWithIssues.filter(c => 
      c.issues.some(issue => issue.includes('transparent'))
    );

    if (transparentColorIssues.length > 0) {
      recommendations.push(`${transparentColorIssues.length} components have transparent color issues - ensure theme-specific colors are applied`);
    }

    const invisibleTextIssues = componentsWithIssues.filter(c =>
      c.issues.some(issue => issue.includes('invisible text'))
    );

    if (invisibleTextIssues.length > 0) {
      recommendations.push(`${invisibleTextIssues.length} components have invisible text - check color contrast ratios`);
    }

    const componentsWithoutThemeClasses = components.filter(c => 
      !c.hasThemeClasses && c.isVisible
    );

    if (componentsWithoutThemeClasses.length > components.length * 0.5) {
      recommendations.push('Many components lack theme-specific classes - consider adding dark: and light: variants');
    }

    // CSS variables recommendations
    const componentsWithoutCssVars = components.filter(c => 
      Object.keys(c.cssVariables).length === 0 && c.isVisible
    );

    if (componentsWithoutCssVars.length > 0) {
      recommendations.push('Consider using CSS custom properties (variables) for consistent theming');
    }

    return recommendations;
  }
}