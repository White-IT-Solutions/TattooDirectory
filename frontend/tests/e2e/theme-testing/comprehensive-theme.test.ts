import { test, expect, THEMES, VIEWPORTS } from '../fixtures/base-test';

test.describe('Comprehensive Theme Testing Framework', () => {
  test.beforeEach(async ({ uiAuditPage }) => {
    await uiAuditPage.goto('/');
    await uiAuditPage.waitForLoadState('networkidle');
  });

  test.describe('ThemeToggler - Enhanced Mode Switching', () => {
    test('should switch themes with comprehensive validation', async ({ themeToggler }) => {
      // Test switching to dark mode with validation
      await themeToggler.switchToTheme('dark', {
        waitForTransition: true,
        validateApplication: true,
        method: 'toggle'
      });

      const darkState = await themeToggler.getThemeState();
      expect(darkState.current).toBe('dark');
      expect(darkState.htmlClasses).toContain('dark');

      // Test switching back to light mode
      await themeToggler.switchToTheme('light', {
        waitForTransition: true,
        validateApplication: true,
        method: 'direct'
      });

      const lightState = await themeToggler.getThemeState();
      expect(lightState.current).toBe('light');
      expect(lightState.htmlClasses).not.toContain('dark');
    });

    test('should handle theme persistence across reloads', async ({ themeToggler }) => {
      // Set dark theme and test persistence
      const persisted = await themeToggler.testThemePersistence('dark');
      expect(persisted).toBe(true);

      // Verify theme is still dark after reload
      const currentState = await themeToggler.getThemeState();
      expect(currentState.current).toBe('dark');
    });

    test('should detect available theme toggle elements', async ({ themeToggler }) => {
      const toggleElements = await themeToggler.getThemeToggleElements();
      
      // Should find at least one theme toggle element
      expect(toggleElements.length).toBeGreaterThan(0);
      
      // At least one should be visible
      const visibleToggles = toggleElements.filter(el => el.visible);
      expect(visibleToggles.length).toBeGreaterThan(0);
    });

    test('should handle different switching methods', async ({ themeToggler }) => {
      // Test toggle method
      await themeToggler.switchToTheme('dark', { method: 'toggle' });
      let state = await themeToggler.getThemeState();
      expect(state.current).toBe('dark');

      // Test direct manipulation method
      await themeToggler.switchToTheme('light', { method: 'direct' });
      state = await themeToggler.getThemeState();
      expect(state.current).toBe('light');

      // Test storage method
      await themeToggler.switchToTheme('dark', { method: 'storage' });
      state = await themeToggler.getThemeState();
      expect(state.current).toBe('dark');
    });
  });

  test.describe('ThemeValidator - Component Theme Compliance', () => {
    test('should validate theme application across components', async ({ 
      themeToggler, 
      themeValidator 
    }) => {
      // Test light theme validation
      await themeToggler.switchToTheme('light');
      const lightReport = await themeValidator.validateThemeApplication('light', {
        checkCssVariables: true,
        checkComputedStyles: true,
        checkVisibility: true
      });

      expect(lightReport.theme).toBe('light');
      expect(lightReport.componentsChecked).toBeGreaterThan(0);
      expect(lightReport.overallValid).toBe(true);

      // Test dark theme validation
      await themeToggler.switchToTheme('dark');
      const darkReport = await themeValidator.validateThemeApplication('dark', {
        checkCssVariables: true,
        checkComputedStyles: true,
        checkVisibility: true
      });

      expect(darkReport.theme).toBe('dark');
      expect(darkReport.componentsChecked).toBeGreaterThan(0);
      expect(darkReport.overallValid).toBe(true);
    });

    test('should validate CSS variables for themes', async ({ 
      themeToggler, 
      themeValidator 
    }) => {
      await themeToggler.switchToTheme('dark');
      
      const cssVarValidation = await themeValidator.validateCssVariables('dark');
      
      expect(cssVarValidation.valid).toBe(true);
      expect(Object.keys(cssVarValidation.defined).length).toBeGreaterThan(0);
      expect(cssVarValidation.missing.length).toBe(0);
    });

    test('should validate theme consistency across page states', async ({ 
      themeToggler, 
      themeValidator 
    }) => {
      await themeToggler.switchToTheme('light');
      
      const consistencyReport = await themeValidator.validateThemeConsistency('light');
      
      expect(consistencyReport.consistent).toBe(true);
      expect(consistencyReport.issues.length).toBe(0);
      expect(Object.keys(consistencyReport.states).length).toBeGreaterThan(1);
    });

    test('should provide actionable recommendations', async ({ 
      themeToggler, 
      themeValidator 
    }) => {
      await themeToggler.switchToTheme('dark');
      
      const report = await themeValidator.validateThemeApplication('dark');
      
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      if (report.issuesFound > 0) {
        expect(report.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('TransitionTester - Smooth Theme Transitions', () => {
    test('should measure theme transition performance', async ({ transitionTester }) => {
      const transitionReport = await transitionTester.testThemeTransition(
        'light', 
        'dark',
        {
          maxDuration: 1000,
          minFps: 30,
          checkVisualArtifacts: true
        }
      );

      expect(transitionReport.transitionType).toBe('light-to-dark');
      expect(transitionReport.overallSmooth).toBe(true);
      expect(transitionReport.totalDuration).toBeLessThan(1000);
      expect(transitionReport.globalMetrics.fps).toBeGreaterThan(30);
      expect(transitionReport.componentsChecked).toBeGreaterThan(0);
    });

    test('should test transition performance under different conditions', async ({ 
      transitionTester 
    }) => {
      const performanceTest = await transitionTester.testTransitionPerformance(
        'light',
        'dark'
      );

      expect(performanceTest.baseline.overallSmooth).toBe(true);
      expect(performanceTest.performanceComparison.baselineDuration).toBeGreaterThan(0);
      expect(performanceTest.performanceComparison.performanceDegradation).toBeLessThan(100);
    });

    test('should validate transition consistency', async ({ transitionTester }) => {
      const consistencyTest = await transitionTester.testTransitionConsistency(
        'light',
        'dark',
        3 // Run 3 times
      );

      expect(consistencyTest.reports.length).toBe(3);
      expect(consistencyTest.consistency.averageDuration).toBeGreaterThan(0);
      expect(consistencyTest.consistency.durationVariance).toBeLessThan(10000); // Reasonable variance
    });

    test('should detect transition issues and provide recommendations', async ({ 
      transitionTester 
    }) => {
      const report = await transitionTester.testThemeTransition('dark', 'light');
      
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.components.length).toBeGreaterThan(0);
      
      // Check that each component has transition validation
      report.components.forEach(component => {
        expect(component.validation).toBeDefined();
        expect(typeof component.validation.smooth).toBe('boolean');
        expect(typeof component.validation.duration).toBe('number');
      });
    });
  });

  test.describe('ComponentThemeChecker - Per-Component Compliance', () => {
    test('should check theme compliance for all components', async ({ 
      themeToggler,
      componentChecker 
    }) => {
      await themeToggler.switchToTheme('light');
      
      const complianceReport = await componentChecker.checkAllComponents({
        contrastThreshold: 4.5,
        checkAccessibility: true,
        checkConsistency: true
      });

      expect(complianceReport.totalComponents).toBeGreaterThan(0);
      expect(complianceReport.averageScore).toBeGreaterThan(0);
      expect(Array.isArray(complianceReport.components)).toBe(true);
      expect(Array.isArray(complianceReport.recommendations)).toBe(true);
    });

    test('should check specific component compliance', async ({ 
      themeToggler,
      componentChecker 
    }) => {
      await themeToggler.switchToTheme('dark');
      
      const buttonCompliance = await componentChecker.checkComponent('button', {
        contrastThreshold: 4.5,
        checkAccessibility: true
      });

      expect(Array.isArray(buttonCompliance)).toBe(true);
      
      if (buttonCompliance.length > 0) {
        const firstButton = buttonCompliance[0];
        expect(firstButton.compliant).toBeDefined();
        expect(firstButton.score).toBeGreaterThanOrEqual(0);
        expect(firstButton.score).toBeLessThanOrEqual(100);
        expect(firstButton.checks).toBeDefined();
      }
    });

    test('should validate WCAG compliance', async ({ 
      themeToggler,
      componentChecker 
    }) => {
      await themeToggler.switchToTheme('light');
      
      const wcagValidation = await componentChecker.validateWCAGCompliance('button');
      
      expect(wcagValidation.compliant).toBeDefined();
      expect(['AA', 'AAA', 'fail']).toContain(wcagValidation.level);
      expect(wcagValidation.checks).toBeDefined();
      expect(wcagValidation.checks.colorContrast).toBeDefined();
      expect(wcagValidation.checks.focusVisible).toBeDefined();
    });

    test('should check component states consistency', async ({ 
      uiAuditPage,
      componentChecker 
    }) => {
      const stateTest = await componentChecker.checkComponentStates(
        'button',
        [
          { 
            name: 'default', 
            action: async () => {} 
          },
          { 
            name: 'hover', 
            action: async () => {
              const button = uiAuditPage.locator('button').first();
              if (await button.isVisible()) {
                await button.hover();
              }
            }
          },
          { 
            name: 'focus', 
            action: async () => {
              const button = uiAuditPage.locator('button').first();
              if (await button.isVisible()) {
                await button.focus();
              }
            }
          }
        ]
      );

      expect(stateTest.selector).toBe('button');
      expect(Object.keys(stateTest.states).length).toBeGreaterThan(0);
      expect(stateTest.consistency).toBeDefined();
    });
  });

  test.describe('Integrated Theme Testing Suite', () => {
    test('should run comprehensive theme audit', async ({ themeTestSuite }) => {
      const { themeToggler, themeValidator, transitionTester, componentChecker } = themeTestSuite;

      // Step 1: Test theme switching
      await themeToggler.switchToTheme('light');
      const lightState = await themeToggler.getThemeState();
      expect(lightState.current).toBe('light');

      // Step 2: Validate light theme
      const lightValidation = await themeValidator.validateThemeApplication('light');
      expect(lightValidation.overallValid).toBe(true);

      // Step 3: Test transition to dark
      const transitionReport = await transitionTester.testThemeTransition('light', 'dark');
      expect(transitionReport.overallSmooth).toBe(true);

      // Step 4: Check component compliance in dark mode
      const darkCompliance = await componentChecker.checkAllComponents();
      expect(darkCompliance.totalComponents).toBeGreaterThan(0);

      // Step 5: Validate dark theme
      const darkValidation = await themeValidator.validateThemeApplication('dark');
      expect(darkValidation.overallValid).toBe(true);
    });

    test('should work across different viewports', async ({ 
      uiAuditPage, 
      themeTestSuite 
    }) => {
      const { themeToggler, themeValidator } = themeTestSuite;

      for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
        await uiAuditPage.setViewportSize(viewport);
        
        // Test theme switching at this viewport
        await themeToggler.switchToTheme('dark');
        const state = await themeToggler.getThemeState();
        expect(state.current).toBe('dark');

        // Validate theme at this viewport
        const validation = await themeValidator.validateThemeApplication('dark');
        expect(validation.componentsChecked).toBeGreaterThan(0);
      }
    });

    test('should generate comprehensive audit report', async ({ themeTestSuite }) => {
      const { themeToggler, themeValidator, transitionTester, componentChecker } = themeTestSuite;

      // Collect all test results
      const auditResults = {
        lightTheme: {
          validation: null as any,
          components: null as any
        },
        darkTheme: {
          validation: null as any,
          components: null as any
        },
        transitions: {
          lightToDark: null as any,
          darkToLight: null as any
        }
      };

      // Test light theme
      await themeToggler.switchToTheme('light');
      auditResults.lightTheme.validation = await themeValidator.validateThemeApplication('light');
      auditResults.lightTheme.components = await componentChecker.checkAllComponents();

      // Test dark theme
      await themeToggler.switchToTheme('dark');
      auditResults.darkTheme.validation = await themeValidator.validateThemeApplication('dark');
      auditResults.darkTheme.components = await componentChecker.checkAllComponents();

      // Test transitions
      auditResults.transitions.lightToDark = await transitionTester.testThemeTransition('light', 'dark');
      auditResults.transitions.darkToLight = await transitionTester.testThemeTransition('dark', 'light');

      // Verify all results are collected
      expect(auditResults.lightTheme.validation).toBeDefined();
      expect(auditResults.lightTheme.components).toBeDefined();
      expect(auditResults.darkTheme.validation).toBeDefined();
      expect(auditResults.darkTheme.components).toBeDefined();
      expect(auditResults.transitions.lightToDark).toBeDefined();
      expect(auditResults.transitions.darkToLight).toBeDefined();

      // Generate summary
      const summary = {
        totalIssues: 
          auditResults.lightTheme.validation.issuesFound +
          auditResults.darkTheme.validation.issuesFound +
          auditResults.transitions.lightToDark.issuesFound +
          auditResults.transitions.darkToLight.issuesFound,
        
        overallCompliance: 
          auditResults.lightTheme.validation.overallValid &&
          auditResults.darkTheme.validation.overallValid &&
          auditResults.transitions.lightToDark.overallSmooth &&
          auditResults.transitions.darkToLight.overallSmooth,

        averageComponentScore: (
          auditResults.lightTheme.components.averageScore +
          auditResults.darkTheme.components.averageScore
        ) / 2
      };

      expect(summary.totalIssues).toBeGreaterThanOrEqual(0);
      expect(typeof summary.overallCompliance).toBe('boolean');
      expect(summary.averageComponentScore).toBeGreaterThanOrEqual(0);
      expect(summary.averageComponentScore).toBeLessThanOrEqual(100);
    });
  });
});