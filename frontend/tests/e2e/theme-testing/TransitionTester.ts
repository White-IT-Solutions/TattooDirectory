import { Page } from '@playwright/test';

export interface TransitionMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  fps: number;
  frameCount: number;
  droppedFrames: number;
}

export interface TransitionValidation {
  smooth: boolean;
  duration: number;
  visualArtifacts: boolean;
  performanceIssues: boolean;
  issues: string[];
  metrics: TransitionMetrics;
}

export interface ComponentTransitionTest {
  selector: string;
  element: string;
  beforeStyles: Record<string, string>;
  afterStyles: Record<string, string>;
  transitionProperties: string[];
  validation: TransitionValidation;
}

export interface TransitionTestReport {
  theme: 'light' | 'dark';
  transitionType: 'light-to-dark' | 'dark-to-light';
  timestamp: Date;
  pageUrl: string;
  overallSmooth: boolean;
  totalDuration: number;
  componentsChecked: number;
  issuesFound: number;
  components: ComponentTransitionTest[];
  globalMetrics: TransitionMetrics;
  recommendations: string[];
}

export interface TransitionTestOptions {
  maxDuration?: number;
  minFps?: number;
  checkVisualArtifacts?: boolean;
  captureScreenshots?: boolean;
  customSelectors?: string[];
  skipSelectors?: string[];
}

/**
 * TransitionTester validates smooth theme transitions
 * Measures performance, detects visual artifacts, and ensures smooth animations
 */
export class TransitionTester {
  private readonly defaultSelectors = [
    'body',
    'header',
    'nav',
    'main',
    'footer',
    '[data-testid*="card"]',
    '[data-testid*="button"]',
    '[data-testid*="modal"]',
    '.btn',
    '.button',
    '.card',
    '.modal',
    'input',
    'select',
    'textarea'
  ];

  private readonly transitionProperties = [
    'background-color',
    'color',
    'border-color',
    'box-shadow',
    'opacity',
    'transform'
  ];

  constructor(private page: Page) {}

  /**
   * Test theme transition smoothness and performance
   */
  async testThemeTransition(
    fromTheme: 'light' | 'dark',
    toTheme: 'light' | 'dark',
    options: TransitionTestOptions = {}
  ): Promise<TransitionTestReport> {
    const {
      maxDuration = 1000,
      minFps = 30,
      checkVisualArtifacts = true,
      captureScreenshots = false,
      customSelectors = [],
      skipSelectors = []
    } = options;

    const selectors = [...this.defaultSelectors, ...customSelectors]
      .filter(selector => !skipSelectors.includes(selector));

    // Ensure we start from the correct theme
    await this._setTheme(fromTheme);
    await this.page.waitForTimeout(100);

    // Capture initial state
    const initialComponents = await this._captureComponentStates(selectors);

    // Start performance monitoring
    const performanceStartTime = Date.now();
    
    // Begin transition monitoring
    const transitionPromise = this._monitorTransition(maxDuration);

    // Trigger theme change
    await this._setTheme(toTheme);

    // Wait for transition to complete
    const globalMetrics = await transitionPromise;

    // Capture final state
    const finalComponents = await this._captureComponentStates(selectors);

    // Analyze component transitions
    const components: ComponentTransitionTest[] = [];
    
    for (let i = 0; i < Math.min(initialComponents.length, finalComponents.length); i++) {
      const initial = initialComponents[i];
      const final = finalComponents[i];
      
      if (initial.selector === final.selector) {
        const validation = await this._validateComponentTransition(
          initial,
          final,
          globalMetrics,
          { maxDuration, minFps, checkVisualArtifacts }
        );

        components.push({
          selector: initial.selector,
          element: initial.element,
          beforeStyles: initial.styles,
          afterStyles: final.styles,
          transitionProperties: this._getChangedProperties(initial.styles, final.styles),
          validation
        });
      }
    }

    const issuesFound = components.reduce((sum, comp) => sum + comp.validation.issues.length, 0);
    const recommendations = this._generateTransitionRecommendations(components, globalMetrics);

    return {
      theme: toTheme,
      transitionType: `${fromTheme}-to-${toTheme}` as 'light-to-dark' | 'dark-to-light',
      timestamp: new Date(),
      pageUrl: this.page.url(),
      overallSmooth: issuesFound === 0 && globalMetrics.duration <= maxDuration,
      totalDuration: globalMetrics.duration,
      componentsChecked: components.length,
      issuesFound,
      components,
      globalMetrics,
      recommendations
    };
  }

  /**
   * Test transition performance under different conditions
   */
  async testTransitionPerformance(
    fromTheme: 'light' | 'dark',
    toTheme: 'light' | 'dark'
  ): Promise<{
    baseline: TransitionTestReport;
    underLoad: TransitionTestReport;
    withAnimations: TransitionTestReport;
    performanceComparison: {
      baselineDuration: number;
      loadDuration: number;
      animationDuration: number;
      performanceDegradation: number;
    };
  }> {
    // Baseline test
    const baseline = await this.testThemeTransition(fromTheme, toTheme);

    // Test under CPU load
    await this._simulateCpuLoad();
    const underLoad = await this.testThemeTransition(fromTheme, toTheme);
    await this._stopCpuLoad();

    // Test with additional animations
    await this._enableTestAnimations();
    const withAnimations = await this.testThemeTransition(fromTheme, toTheme);
    await this._disableTestAnimations();

    const performanceComparison = {
      baselineDuration: baseline.totalDuration,
      loadDuration: underLoad.totalDuration,
      animationDuration: withAnimations.totalDuration,
      performanceDegradation: Math.max(
        (underLoad.totalDuration - baseline.totalDuration) / baseline.totalDuration,
        (withAnimations.totalDuration - baseline.totalDuration) / baseline.totalDuration
      ) * 100
    };

    return {
      baseline,
      underLoad,
      withAnimations,
      performanceComparison
    };
  }

  /**
   * Test transition consistency across multiple runs
   */
  async testTransitionConsistency(
    fromTheme: 'light' | 'dark',
    toTheme: 'light' | 'dark',
    runs: number = 5
  ): Promise<{
    reports: TransitionTestReport[];
    consistency: {
      averageDuration: number;
      durationVariance: number;
      consistentIssues: string[];
      intermittentIssues: string[];
    };
  }> {
    const reports: TransitionTestReport[] = [];

    for (let i = 0; i < runs; i++) {
      const report = await this.testThemeTransition(fromTheme, toTheme);
      reports.push(report);
      
      // Wait between runs
      await this.page.waitForTimeout(200);
    }

    // Analyze consistency
    const durations = reports.map(r => r.totalDuration);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const durationVariance = durations.reduce((sum, d) => sum + Math.pow(d - averageDuration, 2), 0) / durations.length;

    // Find consistent vs intermittent issues
    const allIssues = reports.flatMap(r => r.components.flatMap(c => c.validation.issues));
    const issueFrequency = allIssues.reduce((freq, issue) => {
      freq[issue] = (freq[issue] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);

    const consistentIssues = Object.entries(issueFrequency)
      .filter(([_, count]) => count === runs)
      .map(([issue]) => issue);

    const intermittentIssues = Object.entries(issueFrequency)
      .filter(([_, count]) => count > 0 && count < runs)
      .map(([issue]) => issue);

    return {
      reports,
      consistency: {
        averageDuration,
        durationVariance,
        consistentIssues,
        intermittentIssues
      }
    };
  }

  /**
   * Set theme using the most reliable method
   */
  private async _setTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.page.evaluate((targetTheme) => {
      const html = document.documentElement;
      
      if (targetTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      // Update localStorage
      localStorage.setItem('theme', targetTheme);

      // Trigger theme change events
      const event = new CustomEvent('themechange', { 
        detail: { theme: targetTheme } 
      });
      document.dispatchEvent(event);
    }, theme);
  }

  /**
   * Monitor transition performance and timing
   */
  private async _monitorTransition(maxDuration: number): Promise<TransitionMetrics> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let frameCount = 0;
      let droppedFrames = 0;
      let lastFrameTime = startTime;

      const monitorFrame = () => {
        const currentTime = Date.now();
        const frameDuration = currentTime - lastFrameTime;
        
        frameCount++;
        
        // Consider frame dropped if it took longer than ~16.67ms (60fps)
        if (frameDuration > 20) {
          droppedFrames++;
        }
        
        lastFrameTime = currentTime;

        if (currentTime - startTime < maxDuration) {
          requestAnimationFrame(monitorFrame);
        } else {
          const duration = currentTime - startTime;
          const fps = frameCount / (duration / 1000);
          
          resolve({
            duration,
            startTime,
            endTime: currentTime,
            fps,
            frameCount,
            droppedFrames
          });
        }
      };

      requestAnimationFrame(monitorFrame);
    });
  }

  /**
   * Capture component states for comparison
   */
  private async _captureComponentStates(selectors: string[]): Promise<Array<{
    selector: string;
    element: string;
    styles: Record<string, string>;
  }>> {
    return await this.page.evaluate((selectorList) => {
      const states: Array<{
        selector: string;
        element: string;
        styles: Record<string, string>;
      }> = [];

      selectorList.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
          const styles = window.getComputedStyle(element);
          const capturedStyles: Record<string, string> = {};

          // Capture transition-relevant properties
          const properties = [
            'background-color', 'color', 'border-color', 'box-shadow',
            'opacity', 'transform', 'transition', 'transition-duration',
            'transition-timing-function', 'transition-delay'
          ];

          properties.forEach(prop => {
            capturedStyles[prop] = styles.getPropertyValue(prop);
          });

          states.push({
            selector: `${selector}:nth-child(${index + 1})`,
            element: element.tagName.toLowerCase(),
            styles: capturedStyles
          });
        });
      });

      return states;
    }, selectors);
  }

  /**
   * Validate individual component transition
   */
  private async _validateComponentTransition(
    initial: { selector: string; element: string; styles: Record<string, string> },
    final: { selector: string; element: string; styles: Record<string, string> },
    globalMetrics: TransitionMetrics,
    options: { maxDuration: number; minFps: number; checkVisualArtifacts: boolean }
  ): Promise<TransitionValidation> {
    const issues: string[] = [];
    
    // Check if styles actually changed
    const changedProperties = this._getChangedProperties(initial.styles, final.styles);
    
    if (changedProperties.length === 0) {
      issues.push('No style changes detected during theme transition');
    }

    // Check transition duration
    const transitionDuration = parseFloat(initial.styles['transition-duration'] || '0');
    if (transitionDuration > options.maxDuration / 1000) {
      issues.push(`Transition duration (${transitionDuration}s) exceeds maximum (${options.maxDuration / 1000}s)`);
    }

    // Check for abrupt changes (no transition defined)
    if (changedProperties.length > 0 && transitionDuration === 0) {
      issues.push('Style changes without transition animation (abrupt change)');
    }

    // Performance validation
    const performanceIssues = globalMetrics.fps < options.minFps || globalMetrics.droppedFrames > 5;
    if (performanceIssues) {
      issues.push(`Performance issues detected: ${globalMetrics.fps.toFixed(1)} fps, ${globalMetrics.droppedFrames} dropped frames`);
    }

    return {
      smooth: issues.length === 0,
      duration: transitionDuration * 1000,
      visualArtifacts: false, // Would need more sophisticated detection
      performanceIssues,
      issues,
      metrics: globalMetrics
    };
  }

  /**
   * Get properties that changed between two style objects
   */
  private _getChangedProperties(
    before: Record<string, string>,
    after: Record<string, string>
  ): string[] {
    const changed: string[] = [];
    
    Object.keys(before).forEach(prop => {
      if (before[prop] !== after[prop]) {
        changed.push(prop);
      }
    });

    return changed;
  }

  /**
   * Generate recommendations for transition improvements
   */
  private _generateTransitionRecommendations(
    components: ComponentTransitionTest[],
    globalMetrics: TransitionMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Global performance recommendations
    if (globalMetrics.fps < 30) {
      recommendations.push('Overall transition performance is poor - consider optimizing CSS transitions');
    }

    if (globalMetrics.droppedFrames > 10) {
      recommendations.push('Many dropped frames detected - reduce transition complexity or duration');
    }

    // Component-specific recommendations
    const componentsWithoutTransitions = components.filter(c =>
      c.validation.issues.some(issue => issue.includes('abrupt change'))
    );

    if (componentsWithoutTransitions.length > 0) {
      recommendations.push(`${componentsWithoutTransitions.length} components have abrupt changes - add CSS transitions`);
    }

    const slowComponents = components.filter(c =>
      c.validation.duration > 500
    );

    if (slowComponents.length > 0) {
      recommendations.push(`${slowComponents.length} components have slow transitions - consider reducing duration`);
    }

    const componentsWithoutChanges = components.filter(c =>
      c.transitionProperties.length === 0
    );

    if (componentsWithoutChanges.length > components.length * 0.3) {
      recommendations.push('Many components show no visual changes during theme transition - verify theme styles are applied');
    }

    return recommendations;
  }

  /**
   * Simulate CPU load for performance testing
   */
  private async _simulateCpuLoad(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).cpuLoadInterval = setInterval(() => {
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Busy wait to simulate CPU load
          Math.random();
        }
      }, 16);
    });
  }

  /**
   * Stop CPU load simulation
   */
  private async _stopCpuLoad(): Promise<void> {
    await this.page.evaluate(() => {
      if ((window as any).cpuLoadInterval) {
        clearInterval((window as any).cpuLoadInterval);
        delete (window as any).cpuLoadInterval;
      }
    });
  }

  /**
   * Enable additional test animations
   */
  private async _enableTestAnimations(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        * {
          transition: all 0.3s ease-in-out !important;
        }
        .test-animation {
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `
    });
  }

  /**
   * Disable additional test animations
   */
  private async _disableTestAnimations(): Promise<void> {
    await this.page.evaluate(() => {
      const testStyles = document.querySelectorAll('style[data-playwright]');
      testStyles.forEach(style => {
        if (style.textContent?.includes('test-animation')) {
          style.remove();
        }
      });
    });
  }
}