/**
 * Component Testing Utilities for Integration Validation
 * Provides utilities for testing component integration consistency and quality
 */

// Only import testing libraries in test environment
let render, screen, fireEvent, waitFor, axe, toHaveNoViolations;

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  try {
    const testingLibrary = require('@testing-library/react');
    const jestAxe = require('jest-axe');
    
    render = testingLibrary.render;
    screen = testingLibrary.screen;
    fireEvent = testingLibrary.fireEvent;
    waitFor = testingLibrary.waitFor;
    axe = jestAxe.axe;
    toHaveNoViolations = jestAxe.toHaveNoViolations;
    
    // Extend Jest matchers only in test environment
    if (typeof window !== 'undefined' && typeof window.expect !== 'undefined') {
      window.expect.extend(toHaveNoViolations);
    } else if (typeof global !== 'undefined' && typeof global.expect !== 'undefined') {
      global.expect.extend(toHaveNoViolations);
    }
  } catch (error) {
    console.warn('Testing libraries not available:', error.message);
  }
}

import { componentConfigurations } from '../config/component-config';
import { componentPropInterfaces } from '../types/component-props';
import { validateComponentIntegration } from './component-integration';

// ===== INTEGRATION TESTING UTILITIES =====

/**
 * Tests component integration consistency across pages
 */
export class ComponentIntegrationTester {
  constructor() {
    this.testResults = new Map();
    this.globalConfig = {};
  }
  
  /**
   * Sets global configuration for all tests
   */
  setGlobalConfig(config) {
    this.globalConfig = config;
  }
  
  /**
   * Tests a component for integration compliance
   */
  async testComponent(Component, props = {}, options = {}) {
    const testName = options.testName || Component.displayName || Component.name;
    const results = {
      testName,
      timestamp: new Date().toISOString(),
      passed: true,
      errors: [],
      warnings: [],
      metrics: {}
    };
    
    try {
      // Render component
      const { container } = render(<Component {...props} />);
      
      // Test design system integration
      await this.testDesignSystemIntegration(container, results);
      
      // Test accessibility compliance
      await this.testAccessibilityCompliance(container, results);
      
      // Test performance characteristics
      await this.testPerformanceCharacteristics(container, results);
      
      // Test responsive behavior
      await this.testResponsiveBehavior(container, results);
      
      // Test interaction patterns
      await this.testInteractionPatterns(container, results);
      
    } catch (error) {
      results.passed = false;
      results.errors.push(`Test execution failed: ${error.message}`);
    }
    
    this.testResults.set(testName, results);
    return results;
  }
  
  /**
   * Tests design system integration
   */
  async testDesignSystemIntegration(container, results) {
    const designSystemElements = container.querySelectorAll('.design-system-component');
    
    if (designSystemElements.length === 0) {
      results.warnings.push('No design system components found');
      return;
    }
    
    // Check for consistent class naming
    designSystemElements.forEach((element, index) => {
      const classes = Array.from(element.classList);
      
      // Check for size classes
      const sizeClasses = classes.filter(cls => cls.startsWith('size-'));
      if (sizeClasses.length > 1) {
        results.warnings.push(`Element ${index} has multiple size classes: ${sizeClasses.join(', ')}`);
      }
      
      // Check for variant classes
      const variantClasses = classes.filter(cls => cls.startsWith('variant-'));
      if (variantClasses.length > 1) {
        results.warnings.push(`Element ${index} has multiple variant classes: ${variantClasses.join(', ')}`);
      }
      
      // Check for shadow classes
      const shadowClasses = classes.filter(cls => cls.startsWith('shadow-'));
      if (shadowClasses.length > 2) { // Allow elevation + colored shadow
        results.warnings.push(`Element ${index} has too many shadow classes: ${shadowClasses.join(', ')}`);
      }
    });
    
    results.metrics.designSystemElements = designSystemElements.length;
  }
  
  /**
   * Tests accessibility compliance
   */
  async testAccessibilityCompliance(container, results) {
    try {
      // Run axe accessibility tests
      const axeResults = await axe(container);
      
      if (axeResults.violations.length > 0) {
        results.passed = false;
        axeResults.violations.forEach(violation => {
          results.errors.push(`Accessibility violation: ${violation.description}`);
        });
      }
      
      // Check for ARIA attributes
      const interactiveElements = container.querySelectorAll('button, input, select, textarea, [role="button"], [role="link"]');
      let accessibleElements = 0;
      
      interactiveElements.forEach(element => {
        if (element.getAttribute('aria-label') || 
            element.getAttribute('aria-labelledby') ||
            element.getAttribute('aria-describedby')) {
          accessibleElements++;
        }
      });
      
      const accessibilityScore = interactiveElements.length > 0 
        ? Math.round((accessibleElements / interactiveElements.length) * 100)
        : 100;
      
      results.metrics.accessibilityScore = accessibilityScore;
      
      if (accessibilityScore < 80) {
        results.warnings.push(`Low accessibility score: ${accessibilityScore}%`);
      }
      
    } catch (error) {
      results.errors.push(`Accessibility test failed: ${error.message}`);
    }
  }
  
  /**
   * Tests performance characteristics
   */
  async testPerformanceCharacteristics(container, results) {
    // Check for lazy loading attributes
    const images = container.querySelectorAll('img');
    const lazyImages = Array.from(images).filter(img => img.loading === 'lazy');
    
    results.metrics.totalImages = images.length;
    results.metrics.lazyImages = lazyImages.length;
    
    if (images.length > 0 && lazyImages.length === 0) {
      results.warnings.push('No lazy loading detected on images');
    }
    
    // Check for intersection observer usage
    const observedElements = container.querySelectorAll('.intersection-observer');
    results.metrics.observedElements = observedElements.length;
    
    // Check for animation classes
    const animatedElements = container.querySelectorAll('[class*="animate-"], [class*="animation-"]');
    results.metrics.animatedElements = animatedElements.length;
    
    // Check for reduced motion respect
    const motionAwareElements = container.querySelectorAll('.respect-reduced-motion');
    results.metrics.motionAwareElements = motionAwareElements.length;
    
    if (animatedElements.length > 0 && motionAwareElements.length === 0) {
      results.warnings.push('Animated elements found without reduced motion support');
    }
  }
  
  /**
   * Tests responsive behavior
   */
  async testResponsiveBehavior(container, results) {
    // Check for responsive classes
    const responsiveElements = container.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="xl:"]');
    results.metrics.responsiveElements = responsiveElements.length;
    
    // Check for mobile-specific classes
    const mobileOptimizedElements = container.querySelectorAll('.mobile-optimized, [class*="touch-"]');
    results.metrics.mobileOptimizedElements = mobileOptimizedElements.length;
    
    // Test viewport meta tag (if testing full page)
    if (typeof document !== 'undefined') {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        results.warnings.push('No viewport meta tag found');
      }
    }
  }
  
  /**
   * Tests interaction patterns
   */
  async testInteractionPatterns(container, results) {
    const interactiveElements = container.querySelectorAll('button, input, select, textarea, [role="button"], [tabindex]');
    
    let focusableElements = 0;
    let keyboardAccessibleElements = 0;
    
    interactiveElements.forEach(element => {
      // Check if element is focusable
      if (element.tabIndex >= 0 || ['button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
        focusableElements++;
      }
      
      // Check for keyboard event handlers
      if (element.onkeydown || element.onkeyup || element.onkeypress) {
        keyboardAccessibleElements++;
      }
    });
    
    results.metrics.interactiveElements = interactiveElements.length;
    results.metrics.focusableElements = focusableElements;
    results.metrics.keyboardAccessibleElements = keyboardAccessibleElements;
    
    // Test focus management
    if (interactiveElements.length > 0) {
      const firstElement = interactiveElements[0];
      firstElement.focus();
      
      if (document.activeElement !== firstElement) {
        results.warnings.push('Focus management may not be working correctly');
      }
    }
  }
  
  /**
   * Generates comprehensive test report
   */
  generateReport() {
    const allResults = Array.from(this.testResults.values());
    const passedTests = allResults.filter(r => r.passed);
    
    return {
      summary: {
        totalTests: allResults.length,
        passedTests: passedTests.length,
        failedTests: allResults.length - passedTests.length,
        overallScore: Math.round((passedTests.length / allResults.length) * 100)
      },
      metrics: this.aggregateMetrics(allResults),
      results: allResults,
      recommendations: this.generateRecommendations(allResults)
    };
  }
  
  /**
   * Aggregates metrics across all tests
   */
  aggregateMetrics(results) {
    const metrics = {
      designSystemUsage: 0,
      accessibilityScore: 0,
      performanceScore: 0,
      responsiveScore: 0
    };
    
    if (results.length === 0) return metrics;
    
    results.forEach(result => {
      if (result.metrics.designSystemElements > 0) {
        metrics.designSystemUsage += 1;
      }
      metrics.accessibilityScore += result.metrics.accessibilityScore || 0;
    });
    
    metrics.designSystemUsage = Math.round((metrics.designSystemUsage / results.length) * 100);
    metrics.accessibilityScore = Math.round(metrics.accessibilityScore / results.length);
    
    return metrics;
  }
  
  /**
   * Generates recommendations based on test results
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    // Check design system usage
    const designSystemUsage = results.filter(r => r.metrics.designSystemElements > 0).length;
    if (designSystemUsage < results.length * 0.8) {
      recommendations.push({
        type: 'design-system',
        priority: 'high',
        message: 'Increase design system component usage for better consistency'
      });
    }
    
    // Check accessibility scores
    const avgAccessibilityScore = results.reduce((sum, r) => sum + (r.metrics.accessibilityScore || 0), 0) / results.length;
    if (avgAccessibilityScore < 90) {
      recommendations.push({
        type: 'accessibility',
        priority: 'high',
        message: 'Improve accessibility compliance across components'
      });
    }
    
    // Check performance optimizations
    const lazyLoadingUsage = results.filter(r => r.metrics.lazyImages > 0).length;
    if (lazyLoadingUsage < results.length * 0.5) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Consider implementing lazy loading for better performance'
      });
    }
    
    return recommendations;
  }
}

// ===== CROSS-PAGE CONSISTENCY TESTING =====

/**
 * Tests consistency across multiple pages
 */
export class CrossPageConsistencyTester {
  constructor() {
    this.pageTests = new Map();
  }
  
  /**
   * Adds a page test
   */
  addPageTest(pageName, pageComponent, config) {
    this.pageTests.set(pageName, { component: pageComponent, config });
  }
  
  /**
   * Runs consistency tests across all pages
   */
  async runConsistencyTests() {
    const results = {
      pages: {},
      consistency: {
        designSystem: true,
        navigation: true,
        search: true,
        accessibility: true
      },
      issues: []
    };
    
    // Test each page individually
    for (const [pageName, pageData] of this.pageTests) {
      const tester = new ComponentIntegrationTester();
      const pageResult = await tester.testComponent(pageData.component, pageData.config);
      results.pages[pageName] = pageResult;
    }
    
    // Check cross-page consistency
    this.checkDesignSystemConsistency(results);
    this.checkNavigationConsistency(results);
    this.checkSearchConsistency(results);
    this.checkAccessibilityConsistency(results);
    
    return results;
  }
  
  /**
   * Checks design system consistency across pages
   */
  checkDesignSystemConsistency(results) {
    const designSystemScores = Object.values(results.pages)
      .map(page => page.metrics.designSystemElements || 0);
    
    const variance = this.calculateVariance(designSystemScores);
    if (variance > 0.2) {
      results.consistency.designSystem = false;
      results.issues.push('Inconsistent design system usage across pages');
    }
  }
  
  /**
   * Checks navigation consistency across pages
   */
  checkNavigationConsistency(results) {
    // This would check for consistent navigation patterns
    // Implementation depends on specific navigation structure
  }
  
  /**
   * Checks search consistency across pages
   */
  checkSearchConsistency(results) {
    // This would check for consistent search interfaces
    // Implementation depends on specific search structure
  }
  
  /**
   * Checks accessibility consistency across pages
   */
  checkAccessibilityConsistency(results) {
    const accessibilityScores = Object.values(results.pages)
      .map(page => page.metrics.accessibilityScore || 0);
    
    const minScore = Math.min(...accessibilityScores);
    if (minScore < 80) {
      results.consistency.accessibility = false;
      results.issues.push('Accessibility scores vary significantly across pages');
    }
  }
  
  /**
   * Calculates variance in a set of values
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

// ===== PERFORMANCE TESTING UTILITIES =====

/**
 * Tests component performance characteristics
 */
export class ComponentPerformanceTester {
  constructor() {
    this.performanceMetrics = new Map();
  }
  
  /**
   * Measures component render performance
   */
  async measureRenderPerformance(Component, props = {}, iterations = 10) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      const { unmount } = render(<Component {...props} />);
      
      const endTime = performance.now();
      measurements.push(endTime - startTime);
      
      unmount();
    }
    
    return {
      average: measurements.reduce((sum, time) => sum + time, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      measurements
    };
  }
  
  /**
   * Tests memory usage patterns
   */
  async testMemoryUsage(Component, props = {}) {
    if (!performance.memory) {
      return { error: 'Memory API not available' };
    }
    
    const initialMemory = performance.memory.usedJSHeapSize;
    
    const { unmount } = render(<Component {...props} />);
    
    const peakMemory = performance.memory.usedJSHeapSize;
    
    unmount();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    const finalMemory = performance.memory.usedJSHeapSize;
    
    return {
      initial: initialMemory,
      peak: peakMemory,
      final: finalMemory,
      increase: peakMemory - initialMemory,
      leaked: finalMemory - initialMemory
    };
  }
}

// ===== ACCESSIBILITY TESTING UTILITIES =====

/**
 * Comprehensive accessibility testing
 */
export class AccessibilityTester {
  constructor() {
    this.testResults = [];
  }
  
  /**
   * Tests keyboard navigation
   */
  async testKeyboardNavigation(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const results = {
      totalFocusableElements: focusableElements.length,
      keyboardAccessible: 0,
      issues: []
    };
    
    for (const element of focusableElements) {
      // Test Tab navigation
      element.focus();
      if (document.activeElement === element) {
        results.keyboardAccessible++;
      } else {
        results.issues.push(`Element ${element.tagName} not focusable`);
      }
      
      // Test Enter/Space activation for buttons
      if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
        // Only use jest.fn() in test environment
        const clickHandler = (typeof window !== 'undefined' && window.jest) ? window.jest.fn() : 
                             (typeof global !== 'undefined' && global.jest) ? global.jest.fn() : 
                             () => {};
        element.addEventListener('click', clickHandler);
        
        fireEvent.keyDown(element, { key: 'Enter' });
        fireEvent.keyDown(element, { key: ' ' });
        
        if (clickHandler.mock && clickHandler.mock.calls && clickHandler.mock.calls.length === 0) {
          results.issues.push(`Button ${element.textContent} not keyboard activatable`);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Tests screen reader compatibility
   */
  async testScreenReaderCompatibility(container) {
    const results = {
      ariaLabels: 0,
      semanticElements: 0,
      headingStructure: true,
      issues: []
    };
    
    // Check ARIA labels
    const elementsWithAriaLabels = container.querySelectorAll('[aria-label], [aria-labelledby]');
    results.ariaLabels = elementsWithAriaLabels.length;
    
    // Check semantic elements
    const semanticElements = container.querySelectorAll('main, nav, header, footer, section, article, aside');
    results.semanticElements = semanticElements.length;
    
    // Check heading structure
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        results.headingStructure = false;
        results.issues.push(`Heading level jump from h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    }
    
    return results;
  }
}

// ===== TESTING UTILITIES EXPORT =====

export const componentTestingUtils = {
  ComponentIntegrationTester,
  CrossPageConsistencyTester,
  ComponentPerformanceTester,
  AccessibilityTester
};

/**
 * Helper function to create a complete test suite for a component
 */
export function createComponentTestSuite(Component, defaultProps = {}) {
  return {
    async runFullTestSuite(customProps = {}) {
      const props = { ...defaultProps, ...customProps };
      
      // Integration testing
      const integrationTester = new ComponentIntegrationTester();
      const integrationResults = await integrationTester.testComponent(Component, props);
      
      // Performance testing
      const performanceTester = new ComponentPerformanceTester();
      const renderPerformance = await performanceTester.measureRenderPerformance(Component, props);
      const memoryUsage = await performanceTester.testMemoryUsage(Component, props);
      
      // Accessibility testing
      const { container } = render(<Component {...props} />);
      const accessibilityTester = new AccessibilityTester();
      const keyboardResults = await accessibilityTester.testKeyboardNavigation(container);
      const screenReaderResults = await accessibilityTester.testScreenReaderCompatibility(container);
      
      return {
        integration: integrationResults,
        performance: {
          render: renderPerformance,
          memory: memoryUsage
        },
        accessibility: {
          keyboard: keyboardResults,
          screenReader: screenReaderResults
        }
      };
    }
  };
}

export default componentTestingUtils;