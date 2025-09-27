import { Page, Locator } from '@playwright/test';
import { ViewportManager, ViewportConfig } from './ViewportManager';

export interface LayoutElement {
  selector: string;
  element: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  isVisible: boolean;
  isOverflowing: boolean;
  zIndex: number;
}

export interface LayoutBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  elements: LayoutElement[];
  issues: LayoutIssue[];
}

export interface LayoutIssue {
  type: 'overflow' | 'overlap' | 'invisible' | 'misaligned' | 'spacing';
  severity: 'critical' | 'major' | 'minor';
  element: string;
  description: string;
  recommendation: string;
  viewport: string;
}

export interface ResponsiveLayoutReport {
  url: string;
  timestamp: Date;
  breakpoints: LayoutBreakpoint[];
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  recommendations: string[];
}

export class ResponsiveLayoutChecker {
  private page: Page;
  private viewportManager: ViewportManager;

  // Key elements to check for responsive behavior
  private readonly KEY_SELECTORS = [
    'header',
    'nav',
    'main',
    'footer',
    '.container',
    '.content',
    '.sidebar',
    '.menu',
    '.search',
    '.card',
    '.button',
    '.form',
    'img',
    'video'
  ];

  constructor(page: Page) {
    this.page = page;
    this.viewportManager = new ViewportManager(page);
  }

  /**
   * Check layout adaptation across all viewports
   */
  async checkLayoutAdaptation(): Promise<ResponsiveLayoutReport> {
    const url = this.page.url();
    const timestamp = new Date();
    const breakpoints: LayoutBreakpoint[] = [];

    // Test each viewport
    for (const [name, config] of Object.entries(ViewportManager.VIEWPORTS)) {
      await this.viewportManager.setViewport(name as keyof typeof ViewportManager.VIEWPORTS);
      await this.page.waitForTimeout(500); // Allow layout to stabilize

      const breakpoint = await this.analyzeBreakpoint(name, config);
      breakpoints.push(breakpoint);
    }

    return this.generateReport(url, timestamp, breakpoints);
  }

  /**
   * Check specific elements for responsive behavior
   */
  async checkSpecificElements(selectors: string[]): Promise<ResponsiveLayoutReport> {
    const url = this.page.url();
    const timestamp = new Date();
    const breakpoints: LayoutBreakpoint[] = [];

    for (const [name, config] of Object.entries(ViewportManager.VIEWPORTS)) {
      await this.viewportManager.setViewport(name as keyof typeof ViewportManager.VIEWPORTS);
      await this.page.waitForTimeout(500);

      const elements = await this.analyzeElements(selectors);
      const issues = await this.detectLayoutIssues(elements, name);

      breakpoints.push({
        name,
        minWidth: config.width,
        elements,
        issues
      });
    }

    return this.generateReport(url, timestamp, breakpoints);
  }

  /**
   * Analyze layout at a specific breakpoint
   */
  private async analyzeBreakpoint(viewportName: string, config: ViewportConfig): Promise<LayoutBreakpoint> {
    const elements = await this.analyzeElements(this.KEY_SELECTORS);
    const issues = await this.detectLayoutIssues(elements, viewportName);

    return {
      name: viewportName,
      minWidth: config.width,
      maxWidth: config.height, // Using height as max for orientation
      elements,
      issues
    };
  }

  /**
   * Analyze elements for layout properties
   */
  private async analyzeElements(selectors: string[]): Promise<LayoutElement[]> {
    const elements: LayoutElement[] = [];

    for (const selector of selectors) {
      try {
        const locators = await this.page.locator(selector).all();
        
        for (let i = 0; i < locators.length; i++) {
          const element = await this.analyzeElement(locators[i], `${selector}:nth(${i})`);
          if (element) {
            elements.push(element);
          }
        }
      } catch (error) {
        // Selector might not exist, continue
      }
    }

    return elements;
  }

  /**
   * Analyze a single element
   */
  private async analyzeElement(locator: Locator, selector: string): Promise<LayoutElement | null> {
    try {
      const isVisible = await locator.isVisible();
      const boundingBox = await locator.boundingBox();
      
      if (!boundingBox) {
        return null;
      }

      const elementInfo = await locator.evaluate(el => ({
        tagName: el.tagName.toLowerCase(),
        zIndex: parseInt(window.getComputedStyle(el).zIndex) || 0
      }));

      // Check for overflow
      const isOverflowing = await this.checkElementOverflow(locator);

      return {
        selector,
        element: elementInfo.tagName,
        position: { x: boundingBox.x, y: boundingBox.y },
        dimensions: { width: boundingBox.width, height: boundingBox.height },
        isVisible,
        isOverflowing,
        zIndex: elementInfo.zIndex
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if element is overflowing its container
   */
  private async checkElementOverflow(locator: Locator): Promise<boolean> {
    try {
      return await locator.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement?.getBoundingClientRect();
        
        if (!parentRect) return false;

        // Check if element extends beyond parent boundaries
        return (
          rect.right > parentRect.right ||
          rect.bottom > parentRect.bottom ||
          rect.left < parentRect.left ||
          rect.top < parentRect.top
        );
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect layout issues
   */
  private async detectLayoutIssues(elements: LayoutElement[], viewport: string): Promise<LayoutIssue[]> {
    const issues: LayoutIssue[] = [];

    // Check for overflow issues
    const overflowingElements = elements.filter(el => el.isOverflowing);
    for (const element of overflowingElements) {
      issues.push({
        type: 'overflow',
        severity: 'major',
        element: element.selector,
        description: `Element overflows its container in ${viewport} viewport`,
        recommendation: 'Adjust element sizing or container constraints',
        viewport
      });
    }

    // Check for invisible elements that should be visible
    const invisibleElements = elements.filter(el => !el.isVisible && this.shouldBeVisible(el.selector));
    for (const element of invisibleElements) {
      issues.push({
        type: 'invisible',
        severity: 'critical',
        element: element.selector,
        description: `Important element is not visible in ${viewport} viewport`,
        recommendation: 'Ensure element visibility across all viewports',
        viewport
      });
    }

    // Check for overlapping elements
    const overlaps = this.detectOverlaps(elements);
    for (const overlap of overlaps) {
      issues.push({
        type: 'overlap',
        severity: 'major',
        element: `${overlap.element1} & ${overlap.element2}`,
        description: `Elements overlap in ${viewport} viewport`,
        recommendation: 'Adjust positioning or z-index to prevent overlap',
        viewport
      });
    }

    // Check for horizontal scrolling
    const hasHorizontalScroll = await this.checkHorizontalScrolling();
    if (hasHorizontalScroll) {
      issues.push({
        type: 'overflow',
        severity: 'critical',
        element: 'page',
        description: `Page requires horizontal scrolling in ${viewport} viewport`,
        recommendation: 'Ensure all content fits within viewport width',
        viewport
      });
    }

    // Check for spacing issues
    const spacingIssues = await this.checkSpacingIssues(elements);
    issues.push(...spacingIssues.map(issue => ({ ...issue, viewport })));

    return issues;
  }

  /**
   * Check if element should be visible
   */
  private shouldBeVisible(selector: string): boolean {
    const criticalElements = ['header', 'nav', 'main', '.menu', '.search'];
    return criticalElements.some(critical => selector.includes(critical));
  }

  /**
   * Detect overlapping elements
   */
  private detectOverlaps(elements: LayoutElement[]): Array<{ element1: string; element2: string }> {
    const overlaps: Array<{ element1: string; element2: string }> = [];

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const el1 = elements[i];
        const el2 = elements[j];

        // Skip if elements are not visible
        if (!el1.isVisible || !el2.isVisible) continue;

        // Check for overlap
        const overlap = this.checkElementsOverlap(el1, el2);
        if (overlap) {
          overlaps.push({
            element1: el1.selector,
            element2: el2.selector
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * Check if two elements overlap
   */
  private checkElementsOverlap(el1: LayoutElement, el2: LayoutElement): boolean {
    const rect1 = {
      left: el1.position.x,
      right: el1.position.x + el1.dimensions.width,
      top: el1.position.y,
      bottom: el1.position.y + el1.dimensions.height
    };

    const rect2 = {
      left: el2.position.x,
      right: el2.position.x + el2.dimensions.width,
      top: el2.position.y,
      bottom: el2.position.y + el2.dimensions.height
    };

    return !(
      rect1.right <= rect2.left ||
      rect1.left >= rect2.right ||
      rect1.bottom <= rect2.top ||
      rect1.top >= rect2.bottom
    );
  }

  /**
   * Check for horizontal scrolling
   */
  private async checkHorizontalScrolling(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
  }

  /**
   * Check for spacing issues
   */
  private async checkSpacingIssues(elements: LayoutElement[]): Promise<LayoutIssue[]> {
    const issues: LayoutIssue[] = [];
    const minSpacing = 8; // Minimum spacing between elements

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const el1 = elements[i];
        const el2 = elements[j];

        if (!el1.isVisible || !el2.isVisible) continue;

        const distance = this.calculateElementDistance(el1, el2);
        
        if (distance < minSpacing && distance > 0) {
          issues.push({
            type: 'spacing',
            severity: 'minor',
            element: `${el1.selector} & ${el2.selector}`,
            description: `Elements are too close together (${Math.round(distance)}px)`,
            recommendation: `Increase spacing to at least ${minSpacing}px`,
            viewport: '' // Will be set by caller
          });
        }
      }
    }

    return issues;
  }

  /**
   * Calculate distance between two elements
   */
  private calculateElementDistance(el1: LayoutElement, el2: LayoutElement): number {
    const rect1 = {
      left: el1.position.x,
      right: el1.position.x + el1.dimensions.width,
      top: el1.position.y,
      bottom: el1.position.y + el1.dimensions.height
    };

    const rect2 = {
      left: el2.position.x,
      right: el2.position.x + el2.dimensions.width,
      top: el2.position.y,
      bottom: el2.position.y + el2.dimensions.height
    };

    // Check if elements overlap
    if (this.checkElementsOverlap(el1, el2)) {
      return 0;
    }

    // Calculate minimum distance
    const dx = Math.max(0, Math.max(rect2.left - rect1.right, rect1.left - rect2.right));
    const dy = Math.max(0, Math.max(rect2.top - rect1.bottom, rect1.top - rect2.bottom));

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(url: string, timestamp: Date, breakpoints: LayoutBreakpoint[]): ResponsiveLayoutReport {
    const allIssues = breakpoints.flatMap(bp => bp.issues);
    const totalIssues = allIssues.length;
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical').length;
    const majorIssues = allIssues.filter(issue => issue.severity === 'major').length;
    const minorIssues = allIssues.filter(issue => issue.severity === 'minor').length;

    // Calculate overall score (0-100)
    const maxPossibleIssues = breakpoints.length * 10; // Arbitrary baseline
    const overallScore = Math.max(0, Math.min(100, 100 - (totalIssues / maxPossibleIssues) * 100));

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (criticalIssues > 0) {
      recommendations.push(`Fix ${criticalIssues} critical layout issues that break functionality`);
    }
    
    if (majorIssues > 0) {
      recommendations.push(`Address ${majorIssues} major layout issues affecting user experience`);
    }

    const overflowIssues = allIssues.filter(issue => issue.type === 'overflow').length;
    if (overflowIssues > 0) {
      recommendations.push('Implement proper responsive design to prevent content overflow');
    }

    const invisibilityIssues = allIssues.filter(issue => issue.type === 'invisible').length;
    if (invisibilityIssues > 0) {
      recommendations.push('Ensure critical elements remain visible across all viewports');
    }

    if (totalIssues === 0) {
      recommendations.push('Layout adapts well across all tested viewports');
    }

    return {
      url,
      timestamp,
      breakpoints,
      overallScore: Math.round(overallScore * 100) / 100,
      totalIssues,
      criticalIssues,
      majorIssues,
      minorIssues,
      recommendations
    };
  }

  /**
   * Test layout consistency across viewport changes
   */
  async testLayoutConsistency(): Promise<{
    consistencyScore: number;
    inconsistencies: Array<{
      element: string;
      issue: string;
      viewports: string[];
    }>;
  }> {
    const elementStates: Record<string, Record<string, LayoutElement>> = {};
    
    // Collect element states across all viewports
    for (const [name, config] of Object.entries(ViewportManager.VIEWPORTS)) {
      await this.viewportManager.setViewport(name as keyof typeof ViewportManager.VIEWPORTS);
      await this.page.waitForTimeout(500);

      const elements = await this.analyzeElements(this.KEY_SELECTORS);
      
      for (const element of elements) {
        if (!elementStates[element.selector]) {
          elementStates[element.selector] = {};
        }
        elementStates[element.selector][name] = element;
      }
    }

    // Analyze inconsistencies
    const inconsistencies: Array<{
      element: string;
      issue: string;
      viewports: string[];
    }> = [];

    for (const [selector, states] of Object.entries(elementStates)) {
      const viewports = Object.keys(states);
      
      // Check visibility consistency
      const visibilityStates = Object.values(states).map(s => s.isVisible);
      const hasInconsistentVisibility = new Set(visibilityStates).size > 1;
      
      if (hasInconsistentVisibility) {
        const invisibleViewports = Object.entries(states)
          .filter(([, state]) => !state.isVisible)
          .map(([viewport]) => viewport);
          
        inconsistencies.push({
          element: selector,
          issue: 'Inconsistent visibility across viewports',
          viewports: invisibleViewports
        });
      }
    }

    const totalElements = Object.keys(elementStates).length;
    const consistentElements = totalElements - inconsistencies.length;
    const consistencyScore = totalElements > 0 ? (consistentElements / totalElements) * 100 : 100;

    return {
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      inconsistencies
    };
  }
}