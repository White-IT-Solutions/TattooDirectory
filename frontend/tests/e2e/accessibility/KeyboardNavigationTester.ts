import { Page, Locator } from '@playwright/test';

export interface KeyboardNavigationViolation {
  element: string;
  issue: string;
  severity: 'error' | 'warning';
  recommendation: string;
}

export interface FocusableElement {
  selector: string;
  tagName: string;
  role?: string;
  tabIndex: number;
  isVisible: boolean;
  hasVisibleFocus: boolean;
}

export interface NavigationReport {
  pageUrl: string;
  theme: 'light' | 'dark';
  violations: KeyboardNavigationViolation[];
  focusableElements: FocusableElement[];
  tabOrder: string[];
  trapAreas: string[];
  score: number;
  timestamp: Date;
}

export interface KeyboardTestResult {
  action: string;
  success: boolean;
  element?: string;
  error?: string;
}

export class KeyboardNavigationTester {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Run comprehensive keyboard navigation testing
   */
  async testKeyboardNavigation(theme: 'light' | 'dark' = 'light'): Promise<NavigationReport> {
    const pageUrl = this.page.url();
    const timestamp = new Date();
    const violations: KeyboardNavigationViolation[] = [];

    try {
      // Test tab order and focus management
      const tabOrderViolations = await this.testTabOrder();
      violations.push(...tabOrderViolations);

      // Test focus visibility
      const focusVisibilityViolations = await this.testFocusVisibility();
      violations.push(...focusVisibilityViolations);

      // Test keyboard accessibility of interactive elements
      const interactionViolations = await this.testKeyboardInteractions();
      violations.push(...interactionViolations);

      // Test focus trapping in modals/dialogs
      const trapViolations = await this.testFocusTrapping();
      violations.push(...trapViolations);

      // Test skip links
      const skipLinkViolations = await this.testSkipLinks();
      violations.push(...skipLinkViolations);

      // Get focusable elements
      const focusableElements = await this.getFocusableElements();
      
      // Get tab order
      const tabOrder = await this.getTabOrder();
      
      // Get focus trap areas
      const trapAreas = await this.getFocusTrapAreas();

      // Calculate score
      const totalChecks = focusableElements.length + tabOrder.length + trapAreas.length;
      const errorCount = violations.filter(v => v.severity === 'error').length;
      const score = totalChecks > 0 ? Math.max(0, Math.round(((totalChecks - errorCount) / totalChecks) * 100)) : 100;

      return {
        pageUrl,
        theme,
        violations,
        focusableElements,
        tabOrder,
        trapAreas,
        score,
        timestamp
      };

    } catch (error) {
      console.error('Keyboard navigation testing failed:', error);
      
      return {
        pageUrl,
        theme,
        violations: [{
          element: 'page',
          issue: `Keyboard navigation testing failed: ${error.message}`,
          severity: 'error',
          recommendation: 'Fix the underlying issue preventing keyboard navigation analysis'
        }],
        focusableElements: [],
        tabOrder: [],
        trapAreas: [],
        score: 0,
        timestamp
      };
    }
  }

  /**
   * Test tab order and logical navigation flow
   */
  private async testTabOrder(): Promise<KeyboardNavigationViolation[]> {
    const violations: KeyboardNavigationViolation[] = [];

    try {
      // Start from the beginning of the page
      await this.page.keyboard.press('Home');
      await this.page.keyboard.press('Tab');

      const focusedElements: string[] = [];
      const maxTabs = 50; // Prevent infinite loops
      let tabCount = 0;

      while (tabCount < maxTabs) {
        const focusedElement = await this.page.evaluate(() => {
          const element = document.activeElement;
          if (!element || element === document.body) return null;
          
          return {
            tagName: element.tagName.toLowerCase(),
            id: element.id,
            className: element.className,
            role: element.getAttribute('role'),
            tabIndex: element.tabIndex,
            selector: element.id ? `#${element.id}` : 
                     element.className ? `.${element.className.split(' ')[0]}` : 
                     element.tagName.toLowerCase()
          };
        });

        if (!focusedElement) break;

        focusedElements.push(focusedElement.selector);

        // Check if element is visible
        const isVisible = await this.page.locator(focusedElement.selector).isVisible();
        if (!isVisible) {
          violations.push({
            element: focusedElement.selector,
            issue: 'Focusable element is not visible',
            severity: 'error',
            recommendation: 'Ensure focusable elements are visible or remove from tab order'
          });
        }

        // Check for focus indicators
        const hasFocusIndicator = await this.hasFocusIndicator(focusedElement.selector);
        if (!hasFocusIndicator) {
          violations.push({
            element: focusedElement.selector,
            issue: 'Element lacks visible focus indicator',
            severity: 'error',
            recommendation: 'Add CSS focus styles (outline, border, background change, etc.)'
          });
        }

        await this.page.keyboard.press('Tab');
        tabCount++;

        // Check if we've returned to the first element (completed cycle)
        const currentElement = await this.page.evaluate(() => {
          const element = document.activeElement;
          return element?.id ? `#${element.id}` : 
                 element?.className ? `.${element.className.split(' ')[0]}` : 
                 element?.tagName.toLowerCase();
        });

        if (currentElement === focusedElements[0] && tabCount > 1) {
          break; // Completed full cycle
        }
      }

      // Check for logical tab order
      const logicalOrderViolations = await this.validateLogicalTabOrder(focusedElements);
      violations.push(...logicalOrderViolations);

    } catch (error) {
      violations.push({
        element: 'page',
        issue: `Tab order testing failed: ${error.message}`,
        severity: 'error',
        recommendation: 'Ensure page is properly loaded and interactive'
      });
    }

    return violations;
  }

  /**
   * Test focus visibility and indicators
   */
  private async testFocusVisibility(): Promise<KeyboardNavigationViolation[]> {
    const violations: KeyboardNavigationViolation[] = [];

    // Get all focusable elements
    const focusableElements = await this.page.locator(
      'button, [role="button"], a[href], input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])'
    ).all();

    for (const element of focusableElements) {
      try {
        await element.focus();
        
        const selector = await this.getElementSelector(element);
        const hasFocusIndicator = await this.hasFocusIndicator(selector);
        
        if (!hasFocusIndicator) {
          violations.push({
            element: selector,
            issue: 'Element lacks visible focus indicator',
            severity: 'error',
            recommendation: 'Add CSS focus styles with sufficient contrast (outline, border, background, etc.)'
          });
        }

        // Check focus indicator contrast
        const hasGoodContrast = await this.checkFocusIndicatorContrast(element);
        if (!hasGoodContrast) {
          violations.push({
            element: selector,
            issue: 'Focus indicator has insufficient contrast',
            severity: 'warning',
            recommendation: 'Ensure focus indicator has at least 3:1 contrast ratio with background'
          });
        }

      } catch (error) {
        const selector = await this.getElementSelector(element);
        violations.push({
          element: selector,
          issue: `Focus testing failed: ${error.message}`,
          severity: 'warning',
          recommendation: 'Check element accessibility and focusability'
        });
      }
    }

    return violations;
  }

  /**
   * Test keyboard interactions for interactive elements
   */
  private async testKeyboardInteractions(): Promise<KeyboardNavigationViolation[]> {
    const violations: KeyboardNavigationViolation[] = [];

    // Test buttons
    const buttons = await this.page.locator('button, [role="button"]').all();
    for (const button of buttons) {
      const selector = await this.getElementSelector(button);
      const canActivate = await this.testButtonKeyboardActivation(button);
      
      if (!canActivate) {
        violations.push({
          element: selector,
          issue: 'Button cannot be activated with keyboard',
          severity: 'error',
          recommendation: 'Ensure button responds to Enter and Space keys'
        });
      }
    }

    // Test links
    const links = await this.page.locator('a[href], [role="link"]').all();
    for (const link of links) {
      const selector = await this.getElementSelector(link);
      const canActivate = await this.testLinkKeyboardActivation(link);
      
      if (!canActivate) {
        violations.push({
          element: selector,
          issue: 'Link cannot be activated with keyboard',
          severity: 'error',
          recommendation: 'Ensure link responds to Enter key'
        });
      }
    }

    // Test form controls
    const formControls = await this.page.locator('input, textarea, select').all();
    for (const control of formControls) {
      const type = await control.getAttribute('type');
      if (type === 'hidden') continue;

      const selector = await this.getElementSelector(control);
      const isAccessible = await this.testFormControlKeyboardAccess(control);
      
      if (!isAccessible) {
        violations.push({
          element: selector,
          issue: 'Form control not properly keyboard accessible',
          severity: 'error',
          recommendation: 'Ensure form control can receive focus and be operated with keyboard'
        });
      }
    }

    return violations;
  }

  /**
   * Test focus trapping in modals and dialogs
   */
  private async testFocusTrapping(): Promise<KeyboardNavigationViolation[]> {
    const violations: KeyboardNavigationViolation[] = [];

    // Look for modal/dialog elements
    const modals = await this.page.locator('[role="dialog"], [role="alertdialog"], .modal, .dialog').all();
    
    for (const modal of modals) {
      const isVisible = await modal.isVisible();
      if (!isVisible) continue;

      const selector = await this.getElementSelector(modal);
      
      try {
        // Test if focus is trapped within the modal
        const hasFocusTrap = await this.testModalFocusTrap(modal);
        
        if (!hasFocusTrap) {
          violations.push({
            element: selector,
            issue: 'Modal/dialog does not trap focus properly',
            severity: 'error',
            recommendation: 'Implement focus trapping to keep focus within the modal'
          });
        }

        // Test if modal can be closed with Escape key
        const canCloseWithEscape = await this.testModalEscapeKey(modal);
        
        if (!canCloseWithEscape) {
          violations.push({
            element: selector,
            issue: 'Modal/dialog cannot be closed with Escape key',
            severity: 'warning',
            recommendation: 'Add Escape key handler to close modal'
          });
        }

      } catch (error) {
        violations.push({
          element: selector,
          issue: `Modal focus trap testing failed: ${error.message}`,
          severity: 'warning',
          recommendation: 'Check modal implementation and accessibility'
        });
      }
    }

    return violations;
  }

  /**
   * Test skip links functionality
   */
  private async testSkipLinks(): Promise<KeyboardNavigationViolation[]> {
    const violations: KeyboardNavigationViolation[] = [];

    // Look for skip links
    const skipLinks = await this.page.locator('a[href^="#"]:has-text("skip"), a[href^="#"]:has-text("Skip")').all();
    
    if (skipLinks.length === 0) {
      violations.push({
        element: 'page',
        issue: 'No skip links found',
        severity: 'warning',
        recommendation: 'Add skip links to help keyboard users navigate efficiently'
      });
    }

    for (const skipLink of skipLinks) {
      const selector = await this.getElementSelector(skipLink);
      const href = await skipLink.getAttribute('href');
      
      if (href) {
        const targetId = href.substring(1); // Remove #
        const targetExists = await this.page.locator(`#${targetId}`).count() > 0;
        
        if (!targetExists) {
          violations.push({
            element: selector,
            issue: `Skip link target "${targetId}" does not exist`,
            severity: 'error',
            recommendation: 'Ensure skip link targets exist on the page'
          });
        }

        // Test if skip link is visible when focused
        await skipLink.focus();
        const isVisibleWhenFocused = await skipLink.isVisible();
        
        if (!isVisibleWhenFocused) {
          violations.push({
            element: selector,
            issue: 'Skip link is not visible when focused',
            severity: 'error',
            recommendation: 'Make skip links visible when they receive focus'
          });
        }
      }
    }

    return violations;
  }

  /**
   * Get all focusable elements on the page
   */
  private async getFocusableElements(): Promise<FocusableElement[]> {
    const elements: FocusableElement[] = [];

    const focusableSelectors = [
      'button', '[role="button"]',
      'a[href]', '[role="link"]',
      'input:not([type="hidden"])', 'textarea', 'select',
      '[tabindex]:not([tabindex="-1"])'
    ];

    for (const selector of focusableSelectors) {
      const locators = await this.page.locator(selector).all();
      
      for (const locator of locators) {
        try {
          const tagName = await locator.evaluate(el => el.tagName.toLowerCase());
          const role = await locator.getAttribute('role');
          const tabIndex = await locator.evaluate(el => el.tabIndex);
          const isVisible = await locator.isVisible();
          
          await locator.focus();
          const hasVisibleFocus = await this.hasFocusIndicator(await this.getElementSelector(locator));

          elements.push({
            selector: await this.getElementSelector(locator),
            tagName,
            role: role || undefined,
            tabIndex,
            isVisible,
            hasVisibleFocus
          });
        } catch (error) {
          // Skip elements that can't be processed
          continue;
        }
      }
    }

    return elements;
  }

  /**
   * Get the tab order of focusable elements
   */
  private async getTabOrder(): Promise<string[]> {
    const tabOrder: string[] = [];

    try {
      await this.page.keyboard.press('Home');
      await this.page.keyboard.press('Tab');

      const maxTabs = 50;
      let tabCount = 0;

      while (tabCount < maxTabs) {
        const focusedElement = await this.page.evaluate(() => {
          const element = document.activeElement;
          if (!element || element === document.body) return null;
          
          return element.id ? `#${element.id}` : 
                 element.className ? `.${element.className.split(' ')[0]}` : 
                 element.tagName.toLowerCase();
        });

        if (!focusedElement) break;

        if (!tabOrder.includes(focusedElement)) {
          tabOrder.push(focusedElement);
        } else if (tabOrder[0] === focusedElement && tabCount > 1) {
          break; // Completed cycle
        }

        await this.page.keyboard.press('Tab');
        tabCount++;
      }
    } catch (error) {
      console.error('Failed to get tab order:', error);
    }

    return tabOrder;
  }

  /**
   * Get focus trap areas (modals, dialogs, etc.)
   */
  private async getFocusTrapAreas(): Promise<string[]> {
    const trapAreas: string[] = [];

    const trapSelectors = [
      '[role="dialog"]', '[role="alertdialog"]',
      '.modal', '.dialog', '.popup',
      '[aria-modal="true"]'
    ];

    for (const selector of trapSelectors) {
      const elements = await this.page.locator(selector).all();
      
      for (const element of elements) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          trapAreas.push(await this.getElementSelector(element));
        }
      }
    }

    return trapAreas;
  }

  /**
   * Check if element has visible focus indicator
   */
  private async hasFocusIndicator(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector).first();
      await element.focus();

      // Check for common focus indicators
      const focusStyles = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          border: styles.border,
          borderWidth: styles.borderWidth,
          borderStyle: styles.borderStyle,
          borderColor: styles.borderColor,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor
        };
      });

      // Check if any focus indicator is present
      const hasOutline = focusStyles.outline !== 'none' && 
                        focusStyles.outlineWidth !== '0px' &&
                        focusStyles.outlineStyle !== 'none';
      
      const hasBorder = focusStyles.borderWidth !== '0px' && 
                       focusStyles.borderStyle !== 'none';
      
      const hasBoxShadow = focusStyles.boxShadow !== 'none';
      
      const hasBackgroundChange = focusStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                                 focusStyles.backgroundColor !== 'transparent';

      return hasOutline || hasBorder || hasBoxShadow || hasBackgroundChange;

    } catch (error) {
      return false;
    }
  }

  /**
   * Check focus indicator contrast
   */
  private async checkFocusIndicatorContrast(element: Locator): Promise<boolean> {
    try {
      await element.focus();
      
      // This is a simplified check - in a real implementation,
      // you would calculate actual contrast ratios
      const hasGoodContrast = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const outline = styles.outlineColor;
        const border = styles.borderColor;
        const background = styles.backgroundColor;
        
        // Simple heuristic: if colors are defined and not transparent, assume good contrast
        return (outline !== 'rgba(0, 0, 0, 0)' && outline !== 'transparent') ||
               (border !== 'rgba(0, 0, 0, 0)' && border !== 'transparent') ||
               (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent');
      });

      return hasGoodContrast;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test button keyboard activation
   */
  private async testButtonKeyboardActivation(button: Locator): Promise<boolean> {
    try {
      await button.focus();
      
      // Test Enter key
      let activated = false;
      
      // Listen for click events
      await this.page.evaluate(() => {
        window.testButtonActivated = false;
        document.addEventListener('click', () => {
          window.testButtonActivated = true;
        }, { once: true });
      });

      await this.page.keyboard.press('Enter');
      
      activated = await this.page.evaluate(() => window.testButtonActivated);
      
      if (!activated) {
        // Test Space key
        await this.page.evaluate(() => {
          window.testButtonActivated = false;
          document.addEventListener('click', () => {
            window.testButtonActivated = true;
          }, { once: true });
        });

        await this.page.keyboard.press('Space');
        activated = await this.page.evaluate(() => window.testButtonActivated);
      }

      return activated;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test link keyboard activation
   */
  private async testLinkKeyboardActivation(link: Locator): Promise<boolean> {
    try {
      await link.focus();
      
      // For links, we just check if they have href and can receive focus
      const href = await link.getAttribute('href');
      const canFocus = await link.evaluate(el => el.tabIndex >= 0);
      
      return !!(href && canFocus);
    } catch (error) {
      return false;
    }
  }

  /**
   * Test form control keyboard accessibility
   */
  private async testFormControlKeyboardAccess(control: Locator): Promise<boolean> {
    try {
      await control.focus();
      
      const tagName = await control.evaluate(el => el.tagName.toLowerCase());
      const type = await control.getAttribute('type');
      
      // Basic test: can the element receive focus?
      const isFocused = await control.evaluate(el => document.activeElement === el);
      
      if (!isFocused) return false;

      // Additional tests based on control type
      if (tagName === 'input' && type === 'text') {
        // Test if we can type in text input
        await control.fill('test');
        const value = await control.inputValue();
        return value === 'test';
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test modal focus trap
   */
  private async testModalFocusTrap(modal: Locator): Promise<boolean> {
    try {
      // This is a simplified test - a full implementation would test
      // that Tab and Shift+Tab cycle only within the modal
      const focusableInModal = await modal.locator('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])').count();
      
      return focusableInModal > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test modal Escape key functionality
   */
  private async testModalEscapeKey(modal: Locator): Promise<boolean> {
    try {
      const wasVisible = await modal.isVisible();
      if (!wasVisible) return true; // Not applicable

      await this.page.keyboard.press('Escape');
      
      // Wait a bit for any close animation
      await this.page.waitForTimeout(100);
      
      const isStillVisible = await modal.isVisible();
      return !isStillVisible;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate logical tab order
   */
  private async validateLogicalTabOrder(tabOrder: string[]): Promise<KeyboardNavigationViolation[]> {
    const violations: KeyboardNavigationViolation[] = [];

    // This is a simplified validation - a full implementation would check
    // if the tab order follows the visual layout and reading order
    
    if (tabOrder.length === 0) {
      violations.push({
        element: 'page',
        issue: 'No focusable elements found in tab order',
        severity: 'warning',
        recommendation: 'Ensure interactive elements are keyboard accessible'
      });
    }

    // Check for duplicate elements in tab order (potential issue)
    const duplicates = tabOrder.filter((item, index) => tabOrder.indexOf(item) !== index);
    if (duplicates.length > 0) {
      violations.push({
        element: duplicates.join(', '),
        issue: 'Elements appear multiple times in tab order',
        severity: 'warning',
        recommendation: 'Check for duplicate IDs or improper tabindex usage'
      });
    }

    return violations;
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
   * Generate detailed keyboard navigation report
   */
  generateNavigationReport(report: NavigationReport): string {
    let output = `Keyboard Navigation Report for ${report.pageUrl}\n`;
    output += `Theme: ${report.theme}\n`;
    output += `Score: ${report.score}/100\n`;
    output += `Focusable Elements: ${report.focusableElements.length}\n`;
    output += `Tab Order Length: ${report.tabOrder.length}\n`;
    output += `Focus Trap Areas: ${report.trapAreas.length}\n`;
    output += `Timestamp: ${report.timestamp.toISOString()}\n\n`;

    if (report.violations.length === 0) {
      output += 'No keyboard navigation violations found! ✅\n';
    } else {
      output += `Found ${report.violations.length} keyboard navigation violations:\n\n`;

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
    }

    // Add tab order information
    if (report.tabOrder.length > 0) {
      output += `Tab Order:\n`;
      report.tabOrder.forEach((element, index) => {
        output += `${index + 1}. ${element}\n`;
      });
      output += '\n';
    }

    // Add focusable elements summary
    const visibleFocusable = report.focusableElements.filter(el => el.isVisible);
    const withFocusIndicators = report.focusableElements.filter(el => el.hasVisibleFocus);
    
    output += `Focusable Elements Summary:\n`;
    output += `- Total: ${report.focusableElements.length}\n`;
    output += `- Visible: ${visibleFocusable.length}\n`;
    output += `- With Focus Indicators: ${withFocusIndicators.length}\n`;

    return output;
  }
}