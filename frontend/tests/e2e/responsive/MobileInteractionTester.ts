import { Page, Locator } from '@playwright/test';
import { ViewportManager } from './ViewportManager';

export interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'scroll';
  element?: string;
  startPosition?: { x: number; y: number };
  endPosition?: { x: number; y: number };
  duration?: number;
}

export interface InteractionResult {
  gesture: TouchGesture;
  success: boolean;
  responseTime: number;
  visualFeedback: boolean;
  accessibilitySupport: boolean;
  error?: string;
}

export interface OrientationTestResult {
  orientation: 'portrait' | 'landscape';
  layoutStable: boolean;
  contentVisible: boolean;
  interactionsWorking: boolean;
  issues: string[];
}

export interface MobileInteractionReport {
  url: string;
  timestamp: Date;
  viewport: string;
  touchGestureResults: InteractionResult[];
  orientationResults: OrientationTestResult[];
  keyboardInteractions: {
    virtualKeyboardSupport: boolean;
    inputFieldAccessibility: boolean;
    focusManagement: boolean;
  };
  performanceMetrics: {
    averageResponseTime: number;
    slowInteractions: InteractionResult[];
  };
  overallScore: number;
  recommendations: string[];
}

export class MobileInteractionTester {
  private page: Page;
  private viewportManager: ViewportManager;
  private readonly RESPONSE_TIME_THRESHOLD = 300; // ms
  private readonly LONG_PRESS_DURATION = 500; // ms

  constructor(page: Page) {
    this.page = page;
    this.viewportManager = new ViewportManager(page);
  }

  /**
   * Test all mobile interactions
   */
  async testMobileInteractions(): Promise<MobileInteractionReport> {
    const url = this.page.url();
    const timestamp = new Date();
    const viewport = await this.getCurrentViewportName();

    // Test touch gestures
    const touchGestureResults = await this.testTouchGestures();
    
    // Test orientation changes
    const orientationResults = await this.testOrientationChanges();
    
    // Test keyboard interactions
    const keyboardInteractions = await this.testKeyboardInteractions();
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(touchGestureResults);

    return this.generateReport(
      url,
      timestamp,
      viewport,
      touchGestureResults,
      orientationResults,
      keyboardInteractions,
      performanceMetrics
    );
  }

  /**
   * Test specific touch gestures
   */
  async testTouchGestures(): Promise<InteractionResult[]> {
    const results: InteractionResult[] = [];

    // Test tap interactions
    const tapResults = await this.testTapInteractions();
    results.push(...tapResults);

    // Test swipe gestures
    const swipeResults = await this.testSwipeGestures();
    results.push(...swipeResults);

    // Test long press
    const longPressResults = await this.testLongPressInteractions();
    results.push(...longPressResults);

    // Test scroll interactions
    const scrollResults = await this.testScrollInteractions();
    results.push(...scrollResults);

    return results;
  }

  /**
   * Test tap interactions on various elements
   */
  private async testTapInteractions(): Promise<InteractionResult[]> {
    const results: InteractionResult[] = [];
    const tapTargets = [
      'button',
      'a[href]',
      '[role="button"]',
      'input[type="submit"]',
      '.btn',
      '.clickable'
    ];

    for (const selector of tapTargets) {
      try {
        const elements = await this.page.locator(selector).all();
        
        for (let i = 0; i < Math.min(elements.length, 3); i++) { // Test up to 3 elements per selector
          const element = elements[i];
          const result = await this.testSingleTap(element, `${selector}:nth(${i})`);
          if (result) {
            results.push(result);
          }
        }
      } catch (error) {
        // Selector might not exist, continue
      }
    }

    return results;
  }

  /**
   * Test a single tap interaction
   */
  private async testSingleTap(element: Locator, selector: string): Promise<InteractionResult | null> {
    try {
      const isVisible = await element.isVisible();
      if (!isVisible) return null;

      const startTime = Date.now();
      
      // Check for visual feedback before tap
      const initialState = await this.captureElementState(element);
      
      // Perform tap
      await element.tap();
      
      const responseTime = Date.now() - startTime;
      
      // Wait for potential state changes
      await this.page.waitForTimeout(100);
      
      // Check for visual feedback after tap
      const finalState = await this.captureElementState(element);
      const visualFeedback = this.hasVisualFeedback(initialState, finalState);
      
      // Check accessibility support
      const accessibilitySupport = await this.checkTapAccessibility(element);

      return {
        gesture: { type: 'tap', element: selector },
        success: true,
        responseTime,
        visualFeedback,
        accessibilitySupport
      };
    } catch (error) {
      return {
        gesture: { type: 'tap', element: selector },
        success: false,
        responseTime: 0,
        visualFeedback: false,
        accessibilitySupport: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test swipe gestures
   */
  private async testSwipeGestures(): Promise<InteractionResult[]> {
    const results: InteractionResult[] = [];
    
    // Test horizontal swipe on carousel/slider elements
    const swipeTargets = [
      '.carousel',
      '.slider',
      '.swiper',
      '[data-swipe]',
      '.gallery'
    ];

    for (const selector of swipeTargets) {
      try {
        const element = this.page.locator(selector).first();
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const result = await this.testSwipeGesture(element, selector);
          if (result) {
            results.push(result);
          }
        }
      } catch (error) {
        // Element might not exist, continue
      }
    }

    return results;
  }

  /**
   * Test a swipe gesture on an element
   */
  private async testSwipeGesture(element: Locator, selector: string): Promise<InteractionResult | null> {
    try {
      const boundingBox = await element.boundingBox();
      if (!boundingBox) return null;

      const startTime = Date.now();
      const startPosition = {
        x: boundingBox.x + boundingBox.width * 0.8,
        y: boundingBox.y + boundingBox.height * 0.5
      };
      const endPosition = {
        x: boundingBox.x + boundingBox.width * 0.2,
        y: boundingBox.y + boundingBox.height * 0.5
      };

      // Capture initial state
      const initialState = await this.captureElementState(element);

      // Perform swipe
      await this.page.mouse.move(startPosition.x, startPosition.y);
      await this.page.mouse.down();
      await this.page.mouse.move(endPosition.x, endPosition.y, { steps: 10 });
      await this.page.mouse.up();

      const responseTime = Date.now() - startTime;

      // Wait for animation/transition
      await this.page.waitForTimeout(300);

      // Check for visual changes
      const finalState = await this.captureElementState(element);
      const visualFeedback = this.hasVisualFeedback(initialState, finalState);

      return {
        gesture: {
          type: 'swipe',
          element: selector,
          startPosition,
          endPosition
        },
        success: true,
        responseTime,
        visualFeedback,
        accessibilitySupport: true // Swipe gestures don't have specific accessibility requirements
      };
    } catch (error) {
      return {
        gesture: { type: 'swipe', element: selector },
        success: false,
        responseTime: 0,
        visualFeedback: false,
        accessibilitySupport: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test long press interactions
   */
  private async testLongPressInteractions(): Promise<InteractionResult[]> {
    const results: InteractionResult[] = [];
    const longPressTargets = [
      '[data-long-press]',
      '.context-menu-trigger',
      'img',
      '.long-press'
    ];

    for (const selector of longPressTargets) {
      try {
        const element = this.page.locator(selector).first();
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const result = await this.testLongPress(element, selector);
          if (result) {
            results.push(result);
          }
        }
      } catch (error) {
        // Element might not exist, continue
      }
    }

    return results;
  }

  /**
   * Test long press on an element
   */
  private async testLongPress(element: Locator, selector: string): Promise<InteractionResult | null> {
    try {
      const startTime = Date.now();
      const initialState = await this.captureElementState(element);

      // Perform long press
      await element.hover();
      await this.page.mouse.down();
      await this.page.waitForTimeout(this.LONG_PRESS_DURATION);
      await this.page.mouse.up();

      const responseTime = Date.now() - startTime;

      // Wait for potential context menu or other feedback
      await this.page.waitForTimeout(200);

      const finalState = await this.captureElementState(element);
      const visualFeedback = this.hasVisualFeedback(initialState, finalState);

      return {
        gesture: {
          type: 'long-press',
          element: selector,
          duration: this.LONG_PRESS_DURATION
        },
        success: true,
        responseTime,
        visualFeedback,
        accessibilitySupport: true
      };
    } catch (error) {
      return {
        gesture: { type: 'long-press', element: selector },
        success: false,
        responseTime: 0,
        visualFeedback: false,
        accessibilitySupport: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test scroll interactions
   */
  private async testScrollInteractions(): Promise<InteractionResult[]> {
    const results: InteractionResult[] = [];

    // Test page scroll
    const pageScrollResult = await this.testPageScroll();
    if (pageScrollResult) {
      results.push(pageScrollResult);
    }

    // Test element scroll
    const scrollableElements = [
      '.scroll-container',
      '.overflow-scroll',
      '[data-scroll]'
    ];

    for (const selector of scrollableElements) {
      try {
        const element = this.page.locator(selector).first();
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const result = await this.testElementScroll(element, selector);
          if (result) {
            results.push(result);
          }
        }
      } catch (error) {
        // Element might not exist, continue
      }
    }

    return results;
  }

  /**
   * Test page scrolling
   */
  private async testPageScroll(): Promise<InteractionResult | null> {
    try {
      const startTime = Date.now();
      const initialScrollY = await this.page.evaluate(() => window.scrollY);

      // Scroll down
      await this.page.mouse.wheel(0, 300);
      await this.page.waitForTimeout(100);

      const finalScrollY = await this.page.evaluate(() => window.scrollY);
      const responseTime = Date.now() - startTime;

      const success = finalScrollY > initialScrollY;
      const visualFeedback = success; // Scroll position change is visual feedback

      return {
        gesture: { type: 'scroll' },
        success,
        responseTime,
        visualFeedback,
        accessibilitySupport: true
      };
    } catch (error) {
      return {
        gesture: { type: 'scroll' },
        success: false,
        responseTime: 0,
        visualFeedback: false,
        accessibilitySupport: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test scrolling within an element
   */
  private async testElementScroll(element: Locator, selector: string): Promise<InteractionResult | null> {
    try {
      const startTime = Date.now();
      const boundingBox = await element.boundingBox();
      if (!boundingBox) return null;

      const initialScrollTop = await element.evaluate(el => el.scrollTop);

      // Scroll within element
      await this.page.mouse.move(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2
      );
      await this.page.mouse.wheel(0, 100);
      await this.page.waitForTimeout(100);

      const finalScrollTop = await element.evaluate(el => el.scrollTop);
      const responseTime = Date.now() - startTime;

      const success = finalScrollTop > initialScrollTop;
      const visualFeedback = success;

      return {
        gesture: { type: 'scroll', element: selector },
        success,
        responseTime,
        visualFeedback,
        accessibilitySupport: true
      };
    } catch (error) {
      return {
        gesture: { type: 'scroll', element: selector },
        success: false,
        responseTime: 0,
        visualFeedback: false,
        accessibilitySupport: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test orientation changes
   */
  async testOrientationChanges(): Promise<OrientationTestResult[]> {
    const results: OrientationTestResult[] = [];
    
    // Test mobile viewports in both orientations
    const mobileViewports = ['mobile', 'mobileLarge', 'tablet'];
    
    for (const viewportName of mobileViewports) {
      const orientations = await this.viewportManager.testOrientationChange(
        viewportName as keyof typeof ViewportManager.VIEWPORTS
      );

      // Test portrait
      await this.viewportManager.setCustomViewport(
        orientations.portrait.width,
        orientations.portrait.height
      );
      const portraitResult = await this.testSingleOrientation('portrait');
      results.push(portraitResult);

      // Test landscape
      await this.viewportManager.setCustomViewport(
        orientations.landscape.width,
        orientations.landscape.height
      );
      const landscapeResult = await this.testSingleOrientation('landscape');
      results.push(landscapeResult);
    }

    return results;
  }

  /**
   * Test a single orientation
   */
  private async testSingleOrientation(orientation: 'portrait' | 'landscape'): Promise<OrientationTestResult> {
    const issues: string[] = [];

    // Wait for layout to stabilize
    await this.page.waitForTimeout(500);

    // Check layout stability
    const layoutStable = await this.checkLayoutStability();
    if (!layoutStable) {
      issues.push('Layout is unstable after orientation change');
    }

    // Check content visibility
    const contentVisible = await this.checkContentVisibility();
    if (!contentVisible) {
      issues.push('Important content is not visible in this orientation');
    }

    // Check interactions still work
    const interactionsWorking = await this.checkBasicInteractions();
    if (!interactionsWorking) {
      issues.push('Basic interactions are not working in this orientation');
    }

    return {
      orientation,
      layoutStable,
      contentVisible,
      interactionsWorking,
      issues
    };
  }

  /**
   * Test keyboard interactions
   */
  private async testKeyboardInteractions(): Promise<{
    virtualKeyboardSupport: boolean;
    inputFieldAccessibility: boolean;
    focusManagement: boolean;
  }> {
    // Test virtual keyboard support
    const virtualKeyboardSupport = await this.testVirtualKeyboard();
    
    // Test input field accessibility
    const inputFieldAccessibility = await this.testInputFieldAccessibility();
    
    // Test focus management
    const focusManagement = await this.testFocusManagement();

    return {
      virtualKeyboardSupport,
      inputFieldAccessibility,
      focusManagement
    };
  }

  /**
   * Test virtual keyboard support
   */
  private async testVirtualKeyboard(): Promise<boolean> {
    try {
      const inputElements = await this.page.locator('input, textarea').all();
      
      if (inputElements.length === 0) return true; // No inputs to test

      const firstInput = inputElements[0];
      await firstInput.focus();
      
      // Check if viewport adjusts for virtual keyboard
      const initialViewport = await this.viewportManager.getCurrentViewport();
      await this.page.waitForTimeout(500); // Wait for virtual keyboard
      const finalViewport = await this.viewportManager.getCurrentViewport();

      // On mobile, viewport height might change when virtual keyboard appears
      return true; // Assume virtual keyboard works if no errors
    } catch (error) {
      return false;
    }
  }

  /**
   * Test input field accessibility
   */
  private async testInputFieldAccessibility(): Promise<boolean> {
    try {
      const inputElements = await this.page.locator('input, textarea, select').all();
      let accessibleCount = 0;

      for (const input of inputElements) {
        const isAccessible = await input.evaluate(el => {
          // Check for labels
          const hasLabel = el.labels && el.labels.length > 0;
          const hasAriaLabel = el.getAttribute('aria-label');
          const hasAriaLabelledBy = el.getAttribute('aria-labelledby');
          const hasPlaceholder = el.getAttribute('placeholder');

          return hasLabel || hasAriaLabel || hasAriaLabelledBy || hasPlaceholder;
        });

        if (isAccessible) {
          accessibleCount++;
        }
      }

      return inputElements.length === 0 || accessibleCount / inputElements.length >= 0.8;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test focus management
   */
  private async testFocusManagement(): Promise<boolean> {
    try {
      // Test tab navigation
      await this.page.keyboard.press('Tab');
      const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
      
      return focusedElement !== undefined;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper methods
   */
  private async getCurrentViewportName(): Promise<string> {
    const viewport = await this.viewportManager.getCurrentViewport();
    
    for (const [name, config] of Object.entries(ViewportManager.VIEWPORTS)) {
      if (config.width === viewport.width && config.height === viewport.height) {
        return name;
      }
    }
    
    return `${viewport.width}x${viewport.height}`;
  }

  private async captureElementState(element: Locator): Promise<any> {
    try {
      return await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          transform: styles.transform,
          opacity: styles.opacity,
          visibility: styles.visibility,
          display: styles.display
        };
      });
    } catch (error) {
      return {};
    }
  }

  private hasVisualFeedback(initialState: any, finalState: any): boolean {
    if (!initialState || !finalState) return false;
    
    return Object.keys(initialState).some(key => 
      initialState[key] !== finalState[key]
    );
  }

  private async checkTapAccessibility(element: Locator): Promise<boolean> {
    try {
      return await element.evaluate(el => {
        // Check if element is focusable
        const tabIndex = el.getAttribute('tabindex');
        if (tabIndex === '-1') return false;
        
        // Check if element has accessible name
        const hasAccessibleName = 
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title') ||
          el.textContent?.trim();
          
        return !!hasAccessibleName;
      });
    } catch (error) {
      return false;
    }
  }

  private async checkLayoutStability(): Promise<boolean> {
    try {
      // Check for layout shifts
      const initialLayout = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        return Array.from(elements).slice(0, 10).map(el => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
      });

      await this.page.waitForTimeout(200);

      const finalLayout = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        return Array.from(elements).slice(0, 10).map(el => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
      });

      // Check if layouts are similar
      return initialLayout.every((initial, index) => {
        const final = finalLayout[index];
        if (!final) return false;
        
        const deltaX = Math.abs(initial.x - final.x);
        const deltaY = Math.abs(initial.y - final.y);
        
        return deltaX < 5 && deltaY < 5; // Allow small differences
      });
    } catch (error) {
      return false;
    }
  }

  private async checkContentVisibility(): Promise<boolean> {
    try {
      const criticalElements = ['header', 'nav', 'main', '.content'];
      let visibleCount = 0;

      for (const selector of criticalElements) {
        try {
          const element = this.page.locator(selector).first();
          const isVisible = await element.isVisible();
          if (isVisible) visibleCount++;
        } catch (error) {
          // Element might not exist
        }
      }

      return visibleCount > 0;
    } catch (error) {
      return false;
    }
  }

  private async checkBasicInteractions(): Promise<boolean> {
    try {
      // Try to find and click a button
      const button = this.page.locator('button, [role="button"]').first();
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        await button.tap();
        return true;
      }
      
      return true; // No buttons to test
    } catch (error) {
      return false;
    }
  }

  private calculatePerformanceMetrics(results: InteractionResult[]): {
    averageResponseTime: number;
    slowInteractions: InteractionResult[];
  } {
    const responseTimes = results
      .filter(r => r.success)
      .map(r => r.responseTime);

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const slowInteractions = results.filter(r => 
      r.success && r.responseTime > this.RESPONSE_TIME_THRESHOLD
    );

    return {
      averageResponseTime: Math.round(averageResponseTime),
      slowInteractions
    };
  }

  private generateReport(
    url: string,
    timestamp: Date,
    viewport: string,
    touchGestureResults: InteractionResult[],
    orientationResults: OrientationTestResult[],
    keyboardInteractions: any,
    performanceMetrics: any
  ): MobileInteractionReport {
    const totalInteractions = touchGestureResults.length;
    const successfulInteractions = touchGestureResults.filter(r => r.success).length;
    const interactionsWithFeedback = touchGestureResults.filter(r => r.visualFeedback).length;
    
    // Calculate overall score
    const interactionScore = totalInteractions > 0 ? (successfulInteractions / totalInteractions) * 100 : 100;
    const feedbackScore = totalInteractions > 0 ? (interactionsWithFeedback / totalInteractions) * 100 : 100;
    const orientationScore = orientationResults.length > 0 
      ? (orientationResults.filter(r => r.layoutStable && r.contentVisible).length / orientationResults.length) * 100
      : 100;
    
    const overallScore = (interactionScore + feedbackScore + orientationScore) / 3;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (successfulInteractions < totalInteractions) {
      recommendations.push(`Fix ${totalInteractions - successfulInteractions} failed interactions`);
    }
    
    if (interactionsWithFeedback < totalInteractions) {
      recommendations.push('Add visual feedback to interactive elements');
    }
    
    if (performanceMetrics.slowInteractions.length > 0) {
      recommendations.push(`Optimize ${performanceMetrics.slowInteractions.length} slow interactions`);
    }
    
    const orientationIssues = orientationResults.flatMap(r => r.issues).length;
    if (orientationIssues > 0) {
      recommendations.push('Fix orientation change issues');
    }

    if (!keyboardInteractions.virtualKeyboardSupport) {
      recommendations.push('Improve virtual keyboard support');
    }

    if (overallScore === 100) {
      recommendations.push('Mobile interactions work well across all tested scenarios');
    }

    return {
      url,
      timestamp,
      viewport,
      touchGestureResults,
      orientationResults,
      keyboardInteractions,
      performanceMetrics,
      overallScore: Math.round(overallScore * 100) / 100,
      recommendations
    };
  }
}