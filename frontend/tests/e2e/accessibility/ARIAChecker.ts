import { Page, Locator } from '@playwright/test';

export interface ARIAViolation {
  element: string;
  issue: string;
  severity: 'error' | 'warning';
  recommendation: string;
}

export interface ARIAReport {
  pageUrl: string;
  theme: 'light' | 'dark';
  violations: ARIAViolation[];
  validElements: number;
  totalElements: number;
  score: number;
  timestamp: Date;
}

export interface ARIAAttribute {
  name: string;
  value: string;
  isValid: boolean;
  recommendation?: string;
}

export class ARIAChecker {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Run comprehensive ARIA validation on the page
   */
  async validateARIA(theme: 'light' | 'dark' = 'light'): Promise<ARIAReport> {
    const pageUrl = this.page.url();
    const timestamp = new Date();
    const violations: ARIAViolation[] = [];

    try {
      // Check ARIA labels
      const labelViolations = await this.checkARIALabels();
      violations.push(...labelViolations);

      // Check ARIA roles
      const roleViolations = await this.checkARIARoles();
      violations.push(...roleViolations);

      // Check ARIA properties
      const propertyViolations = await this.checkARIAProperties();
      violations.push(...propertyViolations);

      // Check ARIA states
      const stateViolations = await this.checkARIAStates();
      violations.push(...stateViolations);

      // Check ARIA relationships
      const relationshipViolations = await this.checkARIARelationships();
      violations.push(...relationshipViolations);

      // Count total interactive elements
      const totalElements = await this.countInteractiveElements();
      const validElements = totalElements - violations.filter(v => v.severity === 'error').length;
      
      const score = totalElements > 0 ? Math.round((validElements / totalElements) * 100) : 100;

      return {
        pageUrl,
        theme,
        violations,
        validElements,
        totalElements,
        score,
        timestamp
      };

    } catch (error) {
      console.error('ARIA validation failed:', error);
      
      return {
        pageUrl,
        theme,
        violations: [{
          element: 'page',
          issue: `ARIA validation failed: ${error.message}`,
          severity: 'error',
          recommendation: 'Fix the underlying issue preventing ARIA analysis'
        }],
        validElements: 0,
        totalElements: 0,
        score: 0,
        timestamp
      };
    }
  }

  /**
   * Check ARIA labels on interactive elements
   */
  private async checkARIALabels(): Promise<ARIAViolation[]> {
    const violations: ARIAViolation[] = [];

    // Check buttons without accessible names
    const buttons = await this.page.locator('button, [role="button"]').all();
    for (const button of buttons) {
      const hasLabel = await this.hasAccessibleName(button);
      if (!hasLabel) {
        const selector = await this.getElementSelector(button);
        violations.push({
          element: selector,
          issue: 'Button missing accessible name',
          severity: 'error',
          recommendation: 'Add aria-label, aria-labelledby, or visible text content'
        });
      }
    }

    // Check form inputs without labels
    const inputs = await this.page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      if (type === 'hidden') continue;

      const hasLabel = await this.hasFormLabel(input);
      if (!hasLabel) {
        const selector = await this.getElementSelector(input);
        violations.push({
          element: selector,
          issue: 'Form input missing label',
          severity: 'error',
          recommendation: 'Add <label> element, aria-label, or aria-labelledby attribute'
        });
      }
    }

    // Check images without alt text
    const images = await this.page.locator('img').all();
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const role = await image.getAttribute('role');
      
      if (alt === null && !ariaLabel && role !== 'presentation' && role !== 'none') {
        const selector = await this.getElementSelector(image);
        violations.push({
          element: selector,
          issue: 'Image missing alt text',
          severity: 'error',
          recommendation: 'Add alt attribute or aria-label, or use role="presentation" for decorative images'
        });
      }
    }

    // Check links without accessible names
    const links = await this.page.locator('a[href], [role="link"]').all();
    for (const link of links) {
      const hasName = await this.hasAccessibleName(link);
      if (!hasName) {
        const selector = await this.getElementSelector(link);
        violations.push({
          element: selector,
          issue: 'Link missing accessible name',
          severity: 'error',
          recommendation: 'Add descriptive text content, aria-label, or aria-labelledby'
        });
      }
    }

    return violations;
  }

  /**
   * Check ARIA roles for validity
   */
  private async checkARIARoles(): Promise<ARIAViolation[]> {
    const violations: ARIAViolation[] = [];
    
    // Valid ARIA roles (subset of most common ones)
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
      'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog',
      'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group',
      'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
      'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation',
      'none', 'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup',
      'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox',
      'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
      'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
      'treeitem'
    ];

    const elementsWithRoles = await this.page.locator('[role]').all();
    
    for (const element of elementsWithRoles) {
      const role = await element.getAttribute('role');
      if (role && !validRoles.includes(role)) {
        const selector = await this.getElementSelector(element);
        violations.push({
          element: selector,
          issue: `Invalid ARIA role: "${role}"`,
          severity: 'error',
          recommendation: `Use a valid ARIA role from the WAI-ARIA specification`
        });
      }
    }

    // Check for conflicting roles
    const interactiveElements = await this.page.locator('button, input, a, select, textarea').all();
    for (const element of interactiveElements) {
      const role = await element.getAttribute('role');
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      if (role === 'presentation' || role === 'none') {
        const selector = await this.getElementSelector(element);
        violations.push({
          element: selector,
          issue: `Interactive element ${tagName} should not have role="${role}"`,
          severity: 'warning',
          recommendation: 'Remove the role attribute or use an appropriate interactive role'
        });
      }
    }

    return violations;
  }

  /**
   * Check ARIA properties for validity
   */
  private async checkARIAProperties(): Promise<ARIAViolation[]> {
    const violations: ARIAViolation[] = [];

    // Check aria-describedby references
    const describedByElements = await this.page.locator('[aria-describedby]').all();
    for (const element of describedByElements) {
      const describedBy = await element.getAttribute('aria-describedby');
      if (describedBy) {
        const ids = describedBy.split(/\s+/);
        for (const id of ids) {
          const referencedElement = await this.page.locator(`#${id}`).count();
          if (referencedElement === 0) {
            const selector = await this.getElementSelector(element);
            violations.push({
              element: selector,
              issue: `aria-describedby references non-existent element: "${id}"`,
              severity: 'error',
              recommendation: 'Ensure the referenced element exists or remove the invalid reference'
            });
          }
        }
      }
    }

    // Check aria-labelledby references
    const labelledByElements = await this.page.locator('[aria-labelledby]').all();
    for (const element of labelledByElements) {
      const labelledBy = await element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ids = labelledBy.split(/\s+/);
        for (const id of ids) {
          const referencedElement = await this.page.locator(`#${id}`).count();
          if (referencedElement === 0) {
            const selector = await this.getElementSelector(element);
            violations.push({
              element: selector,
              issue: `aria-labelledby references non-existent element: "${id}"`,
              severity: 'error',
              recommendation: 'Ensure the referenced element exists or remove the invalid reference'
            });
          }
        }
      }
    }

    // Check aria-controls references
    const controlsElements = await this.page.locator('[aria-controls]').all();
    for (const element of controlsElements) {
      const controls = await element.getAttribute('aria-controls');
      if (controls) {
        const ids = controls.split(/\s+/);
        for (const id of ids) {
          const referencedElement = await this.page.locator(`#${id}`).count();
          if (referencedElement === 0) {
            const selector = await this.getElementSelector(element);
            violations.push({
              element: selector,
              issue: `aria-controls references non-existent element: "${id}"`,
              severity: 'warning',
              recommendation: 'Ensure the controlled element exists or remove the invalid reference'
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Check ARIA states for validity
   */
  private async checkARIAStates(): Promise<ARIAViolation[]> {
    const violations: ARIAViolation[] = [];

    // Check aria-expanded on appropriate elements
    const expandedElements = await this.page.locator('[aria-expanded]').all();
    for (const element of expandedElements) {
      const expanded = await element.getAttribute('aria-expanded');
      if (expanded !== 'true' && expanded !== 'false') {
        const selector = await this.getElementSelector(element);
        violations.push({
          element: selector,
          issue: `aria-expanded must be "true" or "false", found: "${expanded}"`,
          severity: 'error',
          recommendation: 'Set aria-expanded to either "true" or "false"'
        });
      }
    }

    // Check aria-checked on appropriate elements
    const checkedElements = await this.page.locator('[aria-checked]').all();
    for (const element of checkedElements) {
      const checked = await element.getAttribute('aria-checked');
      if (checked !== 'true' && checked !== 'false' && checked !== 'mixed') {
        const selector = await this.getElementSelector(element);
        violations.push({
          element: selector,
          issue: `aria-checked must be "true", "false", or "mixed", found: "${checked}"`,
          severity: 'error',
          recommendation: 'Set aria-checked to "true", "false", or "mixed"'
        });
      }
    }

    // Check aria-selected on appropriate elements
    const selectedElements = await this.page.locator('[aria-selected]').all();
    for (const element of selectedElements) {
      const selected = await element.getAttribute('aria-selected');
      if (selected !== 'true' && selected !== 'false') {
        const selector = await this.getElementSelector(element);
        violations.push({
          element: selector,
          issue: `aria-selected must be "true" or "false", found: "${selected}"`,
          severity: 'error',
          recommendation: 'Set aria-selected to either "true" or "false"'
        });
      }
    }

    return violations;
  }

  /**
   * Check ARIA relationships and structure
   */
  private async checkARIARelationships(): Promise<ARIAViolation[]> {
    const violations: ARIAViolation[] = [];

    // Check that elements with aria-owns reference existing elements
    const ownsElements = await this.page.locator('[aria-owns]').all();
    for (const element of ownsElements) {
      const owns = await element.getAttribute('aria-owns');
      if (owns) {
        const ids = owns.split(/\s+/);
        for (const id of ids) {
          const ownedElement = await this.page.locator(`#${id}`).count();
          if (ownedElement === 0) {
            const selector = await this.getElementSelector(element);
            violations.push({
              element: selector,
              issue: `aria-owns references non-existent element: "${id}"`,
              severity: 'error',
              recommendation: 'Ensure the owned element exists or remove the invalid reference'
            });
          }
        }
      }
    }

    // Check required children for certain roles
    const listsWithoutItems = await this.page.locator('[role="list"]:not(:has([role="listitem"]))').all();
    for (const list of listsWithoutItems) {
      const selector = await this.getElementSelector(list);
      violations.push({
        element: selector,
        issue: 'List role requires listitem children',
        severity: 'error',
        recommendation: 'Add elements with role="listitem" as children'
      });
    }

    const tablistsWithoutTabs = await this.page.locator('[role="tablist"]:not(:has([role="tab"]))').all();
    for (const tablist of tablistsWithoutTabs) {
      const selector = await this.getElementSelector(tablist);
      violations.push({
        element: selector,
        issue: 'Tablist role requires tab children',
        severity: 'error',
        recommendation: 'Add elements with role="tab" as children'
      });
    }

    return violations;
  }

  /**
   * Check if element has accessible name
   */
  private async hasAccessibleName(element: Locator): Promise<boolean> {
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaLabelledBy = await element.getAttribute('aria-labelledby');
    const textContent = await element.textContent();
    const title = await element.getAttribute('title');

    return !!(ariaLabel || ariaLabelledBy || (textContent && textContent.trim()) || title);
  }

  /**
   * Check if form element has proper label
   */
  private async hasFormLabel(element: Locator): Promise<boolean> {
    const id = await element.getAttribute('id');
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaLabelledBy = await element.getAttribute('aria-labelledby');
    
    // Check for aria-label or aria-labelledby
    if (ariaLabel || ariaLabelledBy) {
      return true;
    }

    // Check for associated label element
    if (id) {
      const labelCount = await this.page.locator(`label[for="${id}"]`).count();
      if (labelCount > 0) {
        return true;
      }
    }

    // Check if wrapped in label
    const wrappingLabel = await element.locator('xpath=ancestor::label').count();
    return wrappingLabel > 0;
  }

  /**
   * Get element selector for reporting
   */
  private async getElementSelector(element: Locator): Promise<string> {
    try {
      const id = await element.getAttribute('id');
      if (id) {
        return `#${id}`;
      }

      const className = await element.getAttribute('class');
      if (className) {
        const firstClass = className.split(' ')[0];
        return `.${firstClass}`;
      }

      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const role = await element.getAttribute('role');
      
      if (role) {
        return `${tagName}[role="${role}"]`;
      }

      return tagName;
    } catch (error) {
      return 'unknown-element';
    }
  }

  /**
   * Count total interactive elements on the page
   */
  private async countInteractiveElements(): Promise<number> {
    const interactiveSelectors = [
      'button', '[role="button"]',
      'a[href]', '[role="link"]',
      'input:not([type="hidden"])', 'textarea', 'select',
      '[tabindex]:not([tabindex="-1"])',
      '[role="checkbox"]', '[role="radio"]', '[role="menuitem"]',
      '[role="tab"]', '[role="option"]'
    ];

    let total = 0;
    for (const selector of interactiveSelectors) {
      const count = await this.page.locator(selector).count();
      total += count;
    }

    return total;
  }

  /**
   * Generate detailed ARIA report
   */
  generateARIAReport(report: ARIAReport): string {
    let output = `ARIA Validation Report for ${report.pageUrl}\n`;
    output += `Theme: ${report.theme}\n`;
    output += `Score: ${report.score}/100\n`;
    output += `Valid Elements: ${report.validElements}/${report.totalElements}\n`;
    output += `Timestamp: ${report.timestamp.toISOString()}\n\n`;

    if (report.violations.length === 0) {
      output += 'No ARIA violations found! ✅\n';
      return output;
    }

    output += `Found ${report.violations.length} ARIA violations:\n\n`;

    const errorViolations = report.violations.filter(v => v.severity === 'error');
    const warningViolations = report.violations.filter(v => v.severity === 'warning');

    if (errorViolations.length > 0) {
      output += `ERRORS (${errorViolations.length}):\n`;
      errorViolations.forEach((violation, index) => {
        output += `${index + 1}. ${violation.element}\n`;
        output += `   Issue: ${violation.issue}\n`;
        output += `   Fix: ${violation.recommendation}\n\n`;
      });
    }

    if (warningViolations.length > 0) {
      output += `WARNINGS (${warningViolations.length}):\n`;
      warningViolations.forEach((violation, index) => {
        output += `${index + 1}. ${violation.element}\n`;
        output += `   Issue: ${violation.issue}\n`;
        output += `   Fix: ${violation.recommendation}\n\n`;
      });
    }

    return output;
  }

  /**
   * Get ARIA attributes for a specific element
   */
  async getElementARIAAttributes(selector: string): Promise<ARIAAttribute[]> {
    try {
      const element = this.page.locator(selector).first();
      const attributes: ARIAAttribute[] = [];

      // Common ARIA attributes to check
      const ariaAttributes = [
        'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
        'aria-checked', 'aria-selected', 'aria-disabled', 'aria-hidden',
        'aria-controls', 'aria-owns', 'aria-live', 'aria-atomic',
        'aria-relevant', 'aria-busy', 'aria-dropeffect', 'aria-grabbed'
      ];

      for (const attr of ariaAttributes) {
        const value = await element.getAttribute(attr);
        if (value !== null) {
          attributes.push({
            name: attr,
            value,
            isValid: await this.validateARIAAttribute(attr, value),
            recommendation: await this.getARIAAttributeRecommendation(attr, value)
          });
        }
      }

      return attributes;
    } catch (error) {
      console.error('Failed to get ARIA attributes:', error);
      return [];
    }
  }

  /**
   * Validate individual ARIA attribute
   */
  private async validateARIAAttribute(name: string, value: string): Promise<boolean> {
    switch (name) {
      case 'aria-expanded':
      case 'aria-checked':
      case 'aria-selected':
      case 'aria-disabled':
      case 'aria-hidden':
      case 'aria-atomic':
      case 'aria-busy':
      case 'aria-grabbed':
        return value === 'true' || value === 'false';
      
      case 'aria-checked':
        return value === 'true' || value === 'false' || value === 'mixed';
      
      case 'aria-live':
        return ['off', 'polite', 'assertive'].includes(value);
      
      case 'aria-relevant':
        const validRelevant = ['additions', 'removals', 'text', 'all'];
        return value.split(' ').every(v => validRelevant.includes(v));
      
      case 'aria-dropeffect':
        const validDropeffect = ['none', 'copy', 'execute', 'link', 'move', 'popup'];
        return value.split(' ').every(v => validDropeffect.includes(v));
      
      default:
        return true; // Assume valid for other attributes
    }
  }

  /**
   * Get recommendation for ARIA attribute
   */
  private async getARIAAttributeRecommendation(name: string, value: string): Promise<string | undefined> {
    const isValid = await this.validateARIAAttribute(name, value);
    
    if (!isValid) {
      switch (name) {
        case 'aria-expanded':
        case 'aria-selected':
        case 'aria-disabled':
        case 'aria-hidden':
        case 'aria-atomic':
        case 'aria-busy':
        case 'aria-grabbed':
          return 'Value must be "true" or "false"';
        
        case 'aria-checked':
          return 'Value must be "true", "false", or "mixed"';
        
        case 'aria-live':
          return 'Value must be "off", "polite", or "assertive"';
        
        case 'aria-relevant':
          return 'Value must be one or more of: "additions", "removals", "text", "all"';
        
        case 'aria-dropeffect':
          return 'Value must be one or more of: "none", "copy", "execute", "link", "move", "popup"';
        
        default:
          return 'Invalid value for this ARIA attribute';
      }
    }

    return undefined;
  }
}