import { Page, Locator } from '@playwright/test';

export interface TouchTargetResult {
  element: string;
  selector: string;
  width: number;
  height: number;
  area: number;
  meetsMinimum: boolean;
  isAccessible: boolean;
  position: { x: number; y: number };
  recommendations?: string[];
}

export interface TouchTargetReport {
  totalElements: number;
  passedElements: number;
  failedElements: number;
  passRate: number;
  results: TouchTargetResult[];
  summary: {
    criticalFailures: TouchTargetResult[];
    minorFailures: TouchTargetResult[];
    recommendations: string[];
  };
}

export class TouchTargetValidator {
  private page: Page;
  private readonly MIN_TOUCH_TARGET_SIZE = 44; // WCAG recommended minimum
  private readonly RECOMMENDED_TOUCH_TARGET_SIZE = 48; // Better UX
  private readonly MIN_SPACING = 8; // Minimum spacing between touch targets

  // Interactive element selectors
  private readonly INTERACTIVE_SELECTORS = [
    'button',
    'a[href]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[tabindex]:not([tabindex="-1"])',
    '.btn',
    '.button',
    '.clickable',
    '[onclick]'
  ];

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Validate all touch targets on the current page
   */
  async validateTouchTargets(): Promise<TouchTargetReport> {
    const results: TouchTargetResult[] = [];
    
    // Get all interactive elements
    const interactiveElements = await this.getInteractiveElements();
    
    for (const element of interactiveElements) {
      try {
        const result = await this.validateSingleTouchTarget(element);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.warn(`Failed to validate touch target:`, error);
      }
    }

    return this.generateReport(results);
  }

  /**
   * Validate touch targets for specific selectors
   */
  async validateSpecificElements(selectors: string[]): Promise<TouchTargetReport> {
    const results: TouchTargetResult[] = [];
    
    for (const selector of selectors) {
      const elements = await this.page.locator(selector).all();
      
      for (const element of elements) {
        try {
          const result = await this.validateSingleTouchTarget(element);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.warn(`Failed to validate element ${selector}:`, error);
        }
      }
    }

    return this.generateReport(results);
  }

  /**
   * Get all interactive elements on the page
   */
  private async getInteractiveElements(): Promise<Locator[]> {
    const elements: Locator[] = [];
    
    for (const selector of this.INTERACTIVE_SELECTORS) {
      try {
        const locators = await this.page.locator(selector).all();
        elements.push(...locators);
      } catch (error) {
        // Selector might not exist on page, continue
      }
    }

    return elements;
  }

  /**
   * Validate a single touch target
   */
  private async validateSingleTouchTarget(element: Locator): Promise<TouchTargetResult | null> {
    try {
      // Check if element is visible
      const isVisible = await element.isVisible();
      if (!isVisible) {
        return null;
      }

      // Get element information
      const boundingBox = await element.boundingBox();
      if (!boundingBox) {
        return null;
      }

      const selector = await this.getElementSelector(element);
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      // Calculate dimensions
      const width = boundingBox.width;
      const height = boundingBox.height;
      const area = width * height;
      
      // Check if meets minimum requirements
      const meetsMinimum = width >= this.MIN_TOUCH_TARGET_SIZE && 
                          height >= this.MIN_TOUCH_TARGET_SIZE;
      
      // Check accessibility
      const isAccessible = await this.checkAccessibility(element);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(width, height, isAccessible);

      return {
        element: tagName,
        selector,
        width,
        height,
        area,
        meetsMinimum,
        isAccessible,
        position: { x: boundingBox.x, y: boundingBox.y },
        recommendations
      };
    } catch (error) {
      console.warn('Error validating touch target:', error);
      return null;
    }
  }

  /**
   * Check accessibility of an element
   */
  private async checkAccessibility(element: Locator): Promise<boolean> {
    try {
      // Check for accessible name
      const accessibleName = await element.evaluate(el => {
        // Check aria-label
        if (el.getAttribute('aria-label')) return true;
        
        // Check aria-labelledby
        if (el.getAttribute('aria-labelledby')) return true;
        
        // Check title
        if (el.getAttribute('title')) return true;
        
        // Check text content
        if (el.textContent?.trim()) return true;
        
        // Check alt text for images
        if (el.tagName === 'IMG' && el.getAttribute('alt')) return true;
        
        // Check value for inputs
        if (el.tagName === 'INPUT' && el.getAttribute('value')) return true;
        
        return false;
      });

      // Check if element is focusable
      const isFocusable = await element.evaluate(el => {
        const tabIndex = el.getAttribute('tabindex');
        if (tabIndex === '-1') return false;
        if (tabIndex && parseInt(tabIndex) >= 0) return true;
        
        // Check if naturally focusable
        const focusableElements = ['a', 'button', 'input', 'select', 'textarea'];
        return focusableElements.includes(el.tagName.toLowerCase());
      });

      return accessibleName && isFocusable;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate recommendations for improving touch targets
   */
  private generateRecommendations(width: number, height: number, isAccessible: boolean): string[] {
    const recommendations: string[] = [];

    if (width < this.MIN_TOUCH_TARGET_SIZE) {
      recommendations.push(`Increase width to at least ${this.MIN_TOUCH_TARGET_SIZE}px (currently ${Math.round(width)}px)`);
    }

    if (height < this.MIN_TOUCH_TARGET_SIZE) {
      recommendations.push(`Increase height to at least ${this.MIN_TOUCH_TARGET_SIZE}px (currently ${Math.round(height)}px)`);
    }

    if (width < this.RECOMMENDED_TOUCH_TARGET_SIZE || height < this.RECOMMENDED_TOUCH_TARGET_SIZE) {
      recommendations.push(`Consider increasing to ${this.RECOMMENDED_TOUCH_TARGET_SIZE}px for better usability`);
    }

    if (!isAccessible) {
      recommendations.push('Add accessible name (aria-label, title, or text content)');
      recommendations.push('Ensure element is focusable for keyboard navigation');
    }

    return recommendations;
  }

  /**
   * Get a unique selector for an element
   */
  private async getElementSelector(element: Locator): Promise<string> {
    try {
      return await element.evaluate(el => {
        // Try to get a unique selector
        if (el.id) return `#${el.id}`;
        
        if (el.className) {
          const classes = el.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            return `.${classes.join('.')}`;
          }
        }
        
        // Fallback to tag name with position
        const siblings = Array.from(el.parentElement?.children || []);
        const index = siblings.indexOf(el);
        return `${el.tagName.toLowerCase()}:nth-child(${index + 1})`;
      });
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(results: TouchTargetResult[]): TouchTargetReport {
    const totalElements = results.length;
    const passedElements = results.filter(r => r.meetsMinimum).length;
    const failedElements = totalElements - passedElements;
    const passRate = totalElements > 0 ? (passedElements / totalElements) * 100 : 0;

    // Categorize failures
    const criticalFailures = results.filter(r => 
      !r.meetsMinimum && (r.width < 32 || r.height < 32)
    );
    
    const minorFailures = results.filter(r => 
      !r.meetsMinimum && !criticalFailures.includes(r)
    );

    // Generate overall recommendations
    const recommendations: string[] = [];
    
    if (failedElements > 0) {
      recommendations.push(`${failedElements} elements need touch target improvements`);
    }
    
    if (criticalFailures.length > 0) {
      recommendations.push(`${criticalFailures.length} elements have critically small touch targets`);
    }
    
    const inaccessibleElements = results.filter(r => !r.isAccessible).length;
    if (inaccessibleElements > 0) {
      recommendations.push(`${inaccessibleElements} elements need accessibility improvements`);
    }

    if (passRate === 100) {
      recommendations.push('All touch targets meet minimum size requirements');
    }

    return {
      totalElements,
      passedElements,
      failedElements,
      passRate: Math.round(passRate * 100) / 100,
      results,
      summary: {
        criticalFailures,
        minorFailures,
        recommendations
      }
    };
  }

  /**
   * Check touch target spacing
   */
  async validateTouchTargetSpacing(): Promise<{
    violations: Array<{
      element1: string;
      element2: string;
      distance: number;
      recommendation: string;
    }>;
    passRate: number;
  }> {
    const violations: Array<{
      element1: string;
      element2: string;
      distance: number;
      recommendation: string;
    }> = [];

    const interactiveElements = await this.getInteractiveElements();
    
    for (let i = 0; i < interactiveElements.length; i++) {
      for (let j = i + 1; j < interactiveElements.length; j++) {
        try {
          const box1 = await interactiveElements[i].boundingBox();
          const box2 = await interactiveElements[j].boundingBox();
          
          if (!box1 || !box2) continue;

          const distance = this.calculateDistance(box1, box2);
          
          if (distance < this.MIN_SPACING) {
            const selector1 = await this.getElementSelector(interactiveElements[i]);
            const selector2 = await this.getElementSelector(interactiveElements[j]);
            
            violations.push({
              element1: selector1,
              element2: selector2,
              distance: Math.round(distance),
              recommendation: `Increase spacing to at least ${this.MIN_SPACING}px`
            });
          }
        } catch (error) {
          // Continue with next pair
        }
      }
    }

    const totalPairs = (interactiveElements.length * (interactiveElements.length - 1)) / 2;
    const passRate = totalPairs > 0 ? ((totalPairs - violations.length) / totalPairs) * 100 : 100;

    return {
      violations,
      passRate: Math.round(passRate * 100) / 100
    };
  }

  /**
   * Calculate minimum distance between two bounding boxes
   */
  private calculateDistance(box1: { x: number; y: number; width: number; height: number }, 
                           box2: { x: number; y: number; width: number; height: number }): number {
    const left1 = box1.x;
    const right1 = box1.x + box1.width;
    const top1 = box1.y;
    const bottom1 = box1.y + box1.height;

    const left2 = box2.x;
    const right2 = box2.x + box2.width;
    const top2 = box2.y;
    const bottom2 = box2.y + box2.height;

    // Check if boxes overlap
    if (right1 >= left2 && left1 <= right2 && bottom1 >= top2 && top1 <= bottom2) {
      return 0; // Overlapping
    }

    // Calculate minimum distance
    const dx = Math.max(0, Math.max(left2 - right1, left1 - right2));
    const dy = Math.max(0, Math.max(top2 - bottom1, top1 - bottom2));

    return Math.sqrt(dx * dx + dy * dy);
  }
}