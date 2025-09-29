import { test, expect } from "@playwright/test";
import {
  ViewportManager,
  TouchTargetValidator,
  ResponsiveLayoutChecker,
  MobileInteractionTester,
  ResponsiveTestUtils,
  RESPONSIVE_CONSTANTS,
} from "./index";

test.describe("Comprehensive Mobile Responsiveness Testing", () => {
  let viewportManager: ViewportManager;
  let touchTargetValidator: TouchTargetValidator;
  let layoutChecker: ResponsiveLayoutChecker;
  let interactionTester: MobileInteractionTester;

  test.beforeEach(async ({ page }) => {
    viewportManager = new ViewportManager(page);
    touchTargetValidator = new TouchTargetValidator(page);
    layoutChecker = new ResponsiveLayoutChecker(page);
    interactionTester = new MobileInteractionTester(page);

    // Navigate to home page
    await page.goto("/");
  });

  test.describe("Viewport Management", () => {
    test("should handle all standard viewports", async ({ page }) => {
      const viewports = Object.keys(ViewportManager.VIEWPORTS);

      for (const viewportName of viewports) {
        await viewportManager.setViewport(
          viewportName as keyof typeof ViewportManager.VIEWPORTS
        );

        const currentViewport = await viewportManager.getCurrentViewport();
        const expectedConfig =
          ViewportManager.VIEWPORTS[
            viewportName as keyof typeof ViewportManager.VIEWPORTS
          ];

        expect(currentViewport.width).toBe(expectedConfig.width);
        expect(currentViewport.height).toBe(expectedConfig.height);

        // Verify page loads correctly at this viewport
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("should detect viewport types correctly", async ({ page }) => {
      // Test mobile viewport detection
      await viewportManager.setViewport("mobile");
      expect(await viewportManager.isMobileViewport()).toBe(true);
      expect(await viewportManager.isTabletViewport()).toBe(false);
      expect(await viewportManager.isDesktopViewport()).toBe(false);

      // Test tablet viewport detection
      await viewportManager.setViewport("tablet");
      expect(await viewportManager.isMobileViewport()).toBe(false);
      expect(await viewportManager.isTabletViewport()).toBe(true);
      expect(await viewportManager.isDesktopViewport()).toBe(false);

      // Test desktop viewport detection
      await viewportManager.setViewport("desktop");
      expect(await viewportManager.isMobileViewport()).toBe(false);
      expect(await viewportManager.isTabletViewport()).toBe(false);
      expect(await viewportManager.isDesktopViewport()).toBe(true);
    });

    test("should handle orientation changes", async ({ page }) => {
      const orientations = await viewportManager.testOrientationChange(
        "mobile"
      );

      // Test portrait orientation
      await viewportManager.setCustomViewport(
        orientations.portrait.width,
        orientations.portrait.height
      );

      const portraitViewport = await viewportManager.getCurrentViewport();
      expect(portraitViewport.height).toBeGreaterThan(portraitViewport.width);

      // Test landscape orientation
      await viewportManager.setCustomViewport(
        orientations.landscape.width,
        orientations.landscape.height
      );

      const landscapeViewport = await viewportManager.getCurrentViewport();
      expect(landscapeViewport.width).toBeGreaterThan(landscapeViewport.height);
    });
  });

  test.describe("Touch Target Validation", () => {
    test("should validate touch targets meet minimum size requirements", async ({
      page,
    }) => {
      await viewportManager.setViewport("mobile");

      const report = await touchTargetValidator.validateTouchTargets();

      expect(report.totalElements).toBeGreaterThan(0);
      expect(report.passRate).toBeGreaterThanOrEqual(80); // 80% pass rate minimum

      // Check that critical failures are addressed
      expect(report.summary.criticalFailures.length).toBe(0);

      // Log results for debugging
      console.log(`Touch Target Validation Results:
        Total Elements: ${report.totalElements}
        Pass Rate: ${report.passRate}%
        Failed Elements: ${report.failedElements}
        Critical Failures: ${report.summary.criticalFailures.length}
      `);

      if (report.failedElements > 0) {
        console.log(
          "Failed Elements:",
          report.summary.minorFailures.map((f) => f.selector)
        );
      }
    });

    test("should validate touch target spacing", async ({ page }) => {
      await viewportManager.setViewport("mobile");

      const spacingReport =
        await touchTargetValidator.validateTouchTargetSpacing();

      expect(spacingReport.passRate).toBeGreaterThanOrEqual(90); // 90% pass rate for spacing

      if (spacingReport.violations.length > 0) {
        console.log("Spacing Violations:", spacingReport.violations);
      }
    });

    test("should validate touch targets across all mobile viewports", async ({
      page,
    }) => {
      const mobileViewports = ["mobile", "mobileLarge", "tablet"];

      for (const viewport of mobileViewports) {
        await viewportManager.setViewport(
          viewport as keyof typeof ViewportManager.VIEWPORTS
        );

        const report = await touchTargetValidator.validateTouchTargets();

        expect(report.passRate).toBeGreaterThanOrEqual(80);
        expect(report.summary.criticalFailures.length).toBe(0);

        console.log(
          `${viewport} Touch Targets - Pass Rate: ${report.passRate}%`
        );
      }
    });
  });

  test.describe("Responsive Layout Checking", () => {
    test("should validate layout adaptation across viewports", async ({
      page,
    }) => {
      const report = await layoutChecker.checkLayoutAdaptation();

      expect(report.overallScore).toBeGreaterThanOrEqual(70); // 70% minimum score
      expect(report.criticalIssues).toBe(0); // No critical issues allowed

      console.log(`Layout Adaptation Results:
        Overall Score: ${report.overallScore}
        Total Issues: ${report.totalIssues}
        Critical Issues: ${report.criticalIssues}
        Major Issues: ${report.majorIssues}
        Minor Issues: ${report.minorIssues}
      `);

      // Check each breakpoint
      for (const breakpoint of report.breakpoints) {
        const criticalIssues = breakpoint.issues.filter(
          (issue) => issue.severity === "critical"
        );
        expect(criticalIssues.length).toBe(0);

        console.log(`${breakpoint.name}: ${breakpoint.issues.length} issues`);
      }
    });

    test("should detect layout consistency across viewports", async ({
      page,
    }) => {
      const consistencyReport = await layoutChecker.testLayoutConsistency();

      expect(consistencyReport.consistencyScore).toBeGreaterThanOrEqual(80);

      if (consistencyReport.inconsistencies.length > 0) {
        console.log(
          "Layout Inconsistencies:",
          consistencyReport.inconsistencies
        );
      }
    });

    test("should validate specific critical elements", async ({ page }) => {
      const criticalSelectors = [
        "header",
        "nav",
        "main",
        ".search",
        ".menu-button",
      ];

      const report = await layoutChecker.checkSpecificElements(
        criticalSelectors
      );

      // Critical elements should have minimal issues
      expect(report.criticalIssues).toBe(0);
      expect(report.overallScore).toBeGreaterThanOrEqual(85);
    });
  });

  test.describe("Mobile Interaction Testing", () => {
    test("should validate touch gestures work correctly", async ({ page }) => {
      await viewportManager.setViewport("mobile");

      const report = await interactionTester.testMobileInteractions();

      expect(report.overallScore).toBeGreaterThanOrEqual(80);

      // Check touch gesture results
      const successfulGestures = report.touchGestureResults.filter(
        (r) => r.success
      );
      const totalGestures = report.touchGestureResults.length;

      if (totalGestures > 0) {
        const successRate = (successfulGestures.length / totalGestures) * 100;
        expect(successRate).toBeGreaterThanOrEqual(90);
      }

      console.log(`Mobile Interaction Results:
        Overall Score: ${report.overallScore}
        Successful Gestures: ${successfulGestures.length}/${totalGestures}
        Average Response Time: ${report.performanceMetrics.averageResponseTime}ms
        Slow Interactions: ${report.performanceMetrics.slowInteractions.length}
      `);
    });

    test("should handle orientation changes gracefully", async ({ page }) => {
      await viewportManager.setViewport("mobile");

      const report = await interactionTester.testMobileInteractions();

      // Check orientation test results
      for (const orientationResult of report.orientationResults) {
        expect(orientationResult.layoutStable).toBe(true);
        expect(orientationResult.contentVisible).toBe(true);
        expect(orientationResult.interactionsWorking).toBe(true);

        if (orientationResult.issues.length > 0) {
          console.log(
            `${orientationResult.orientation} issues:`,
            orientationResult.issues
          );
        }
      }
    });

    test("should validate keyboard interactions on mobile", async ({
      page,
    }) => {
      await viewportManager.setViewport("mobile");

      const report = await interactionTester.testMobileInteractions();

      expect(report.keyboardInteractions.virtualKeyboardSupport).toBe(true);
      expect(report.keyboardInteractions.inputFieldAccessibility).toBe(true);
      expect(report.keyboardInteractions.focusManagement).toBe(true);
    });

    test("should meet performance thresholds", async ({ page }) => {
      await viewportManager.setViewport("mobile");

      const report = await interactionTester.testMobileInteractions();

      // Average response time should be under threshold
      expect(report.performanceMetrics.averageResponseTime).toBeLessThanOrEqual(
        RESPONSIVE_CONSTANTS.RESPONSE_TIME_THRESHOLD
      );

      // No more than 10% of interactions should be slow
      const totalInteractions = report.touchGestureResults.length;
      const slowInteractions =
        report.performanceMetrics.slowInteractions.length;

      if (totalInteractions > 0) {
        const slowRate = (slowInteractions / totalInteractions) * 100;
        expect(slowRate).toBeLessThanOrEqual(10);
      }
    });
  });

  test.describe("Cross-Viewport Integration Tests", () => {
    test("should maintain functionality across all viewports", async ({
      page,
    }) => {
      const viewports = Object.keys(ViewportManager.VIEWPORTS);
      const results: Record<string, any> = {};

      for (const viewportName of viewports) {
        await viewportManager.setViewport(
          viewportName as keyof typeof ViewportManager.VIEWPORTS
        );

        // Test basic functionality
        const isHeaderVisible = await page.locator("header").isVisible();
        const isMainVisible = await page.locator("main").isVisible();
        const hasInteractiveElements =
          (await page.locator('button, a[href], [role="button"]').count()) > 0;

        results[viewportName] = {
          headerVisible: isHeaderVisible,
          mainVisible: isMainVisible,
          hasInteractiveElements,
        };

        expect(isHeaderVisible).toBe(true);
        expect(isMainVisible).toBe(true);
        expect(hasInteractiveElements).toBe(true);
      }

      console.log("Cross-Viewport Functionality Results:", results);
    });

    test("should handle viewport transitions smoothly", async ({ page }) => {
      const viewports = ["mobile", "tablet", "desktop"];

      for (let i = 0; i < viewports.length - 1; i++) {
        const currentViewport = viewports[i];
        const nextViewport = viewports[i + 1];

        // Set initial viewport
        await viewportManager.setViewport(
          currentViewport as keyof typeof ViewportManager.VIEWPORTS
        );
        await page.waitForTimeout(300);

        // Capture initial state
        const initialElements = await page.locator("*").count();

        // Transition to next viewport
        await viewportManager.setViewport(
          nextViewport as keyof typeof ViewportManager.VIEWPORTS
        );
        await page.waitForTimeout(300);

        // Verify elements are still present
        const finalElements = await page.locator("*").count();

        // Allow for some variation in element count due to responsive behavior
        expect(Math.abs(finalElements - initialElements)).toBeLessThanOrEqual(
          5
        );

        // Verify page is still functional
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });

  test.describe("Accessibility Integration", () => {
    test("should maintain accessibility across mobile viewports", async ({
      page,
    }) => {
      const mobileViewports = ["mobile", "mobileLarge", "tablet"];

      for (const viewport of mobileViewports) {
        await viewportManager.setViewport(
          viewport as keyof typeof ViewportManager.VIEWPORTS
        );

        // Test touch target accessibility
        const touchReport = await touchTargetValidator.validateTouchTargets();
        const accessibleElements = touchReport.results.filter(
          (r) => r.isAccessible
        );
        const accessibilityRate =
          touchReport.totalElements > 0
            ? (accessibleElements.length / touchReport.totalElements) * 100
            : 100;

        expect(accessibilityRate).toBeGreaterThanOrEqual(80);

        console.log(`${viewport} Accessibility Rate: ${accessibilityRate}%`);
      }
    });

    test("should support keyboard navigation on mobile", async ({ page }) => {
      await viewportManager.setViewport("mobile");

      // Test tab navigation
      await page.keyboard.press("Tab");
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );

      expect(focusedElement).toBeTruthy();

      // Test that focused element is visible
      if (focusedElement) {
        const activeElement = page.locator(":focus");
        await expect(activeElement).toBeVisible();
      }
    });
  });

  test.describe("Performance Integration", () => {
    test("should meet performance targets across viewports", async ({
      page,
    }) => {
      const viewports = ["mobile", "tablet", "desktop"];

      for (const viewport of viewports) {
        await viewportManager.setViewport(
          viewport as keyof typeof ViewportManager.VIEWPORTS
        );

        // Measure page load performance
        const startTime = Date.now();
        await page.reload();
        await page.waitForLoadState("networkidle");
        const loadTime = Date.now() - startTime;

        // Performance targets vary by viewport
        const maxLoadTime = viewport === "mobile" ? 3000 : 2000; // Mobile gets more time
        expect(loadTime).toBeLessThanOrEqual(maxLoadTime);

        console.log(`${viewport} Load Time: ${loadTime}ms`);
      }
    });

    test("should handle rapid viewport changes", async ({ page }) => {
      const viewports = ["mobile", "tablet", "desktop", "mobile"];

      for (const viewport of viewports) {
        const startTime = Date.now();

        await viewportManager.setViewport(
          viewport as keyof typeof ViewportManager.VIEWPORTS
        );
        await page.waitForTimeout(100); // Minimal wait

        const transitionTime = Date.now() - startTime;

        // Viewport changes should be fast
        expect(transitionTime).toBeLessThanOrEqual(500);

        // Page should remain functional
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });

  test.describe("Error Handling and Edge Cases", () => {
    test("should handle very small viewports gracefully", async ({ page }) => {
      // Test extremely small viewport
      await viewportManager.setCustomViewport(320, 480);

      // Page should still be functional
      await expect(page.locator("body")).toBeVisible();

      // Critical elements should still be accessible
      const headerVisible = await page.locator("header").isVisible();
      const mainVisible = await page.locator("main").isVisible();

      expect(headerVisible || mainVisible).toBe(true); // At least one should be visible
    });

    test("should handle very large viewports gracefully", async ({ page }) => {
      // Test very large viewport
      await viewportManager.setCustomViewport(2560, 1440);

      // Page should still be functional
      await expect(page.locator("body")).toBeVisible();

      // Content should not be stretched inappropriately
      const bodyWidth = await page
        .locator("body")
        .evaluate((el) => el.scrollWidth);
      expect(bodyWidth).toBeGreaterThan(0);
    });

    test("should recover from viewport errors", async ({ page }) => {
      try {
        // Try to set an invalid viewport (this might throw)
        await viewportManager.setCustomViewport(-100, -100);
      } catch (error) {
        // Should be able to recover
        await viewportManager.setViewport("mobile");
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });

  test.describe("Comprehensive Integration Test", () => {
    test("should pass comprehensive mobile responsiveness audit", async ({
      page,
    }) => {
      const auditResults = {
        viewportManagement: true,
        touchTargets: true,
        layoutAdaptation: true,
        mobileInteractions: true,
        accessibility: true,
        performance: true,
      };

      // Test viewport management
      try {
        await viewportManager.setViewport("mobile");
        const viewport = await viewportManager.getCurrentViewport();
        auditResults.viewportManagement =
          viewport.width === 375 && viewport.height === 667;
      } catch (error) {
        auditResults.viewportManagement = false;
      }

      // Test touch targets
      try {
        const touchReport = await touchTargetValidator.validateTouchTargets();
        auditResults.touchTargets =
          touchReport.passRate >= 80 &&
          touchReport.summary.criticalFailures.length === 0;
      } catch (error) {
        auditResults.touchTargets = false;
      }

      // Test layout adaptation
      try {
        const layoutReport = await layoutChecker.checkLayoutAdaptation();
        auditResults.layoutAdaptation =
          layoutReport.overallScore >= 70 && layoutReport.criticalIssues === 0;
      } catch (error) {
        auditResults.layoutAdaptation = false;
      }

      // Test mobile interactions
      try {
        const interactionReport =
          await interactionTester.testMobileInteractions();
        auditResults.mobileInteractions = interactionReport.overallScore >= 80;
      } catch (error) {
        auditResults.mobileInteractions = false;
      }

      // Test accessibility
      try {
        const touchReport = await touchTargetValidator.validateTouchTargets();
        const accessibleElements = touchReport.results.filter(
          (r) => r.isAccessible
        );
        const accessibilityRate =
          touchReport.totalElements > 0
            ? (accessibleElements.length / touchReport.totalElements) * 100
            : 100;
        auditResults.accessibility = accessibilityRate >= 80;
      } catch (error) {
        auditResults.accessibility = false;
      }

      // Test performance
      try {
        const startTime = Date.now();
        await page.reload();
        await page.waitForLoadState("networkidle");
        const loadTime = Date.now() - startTime;
        auditResults.performance = loadTime <= 3000;
      } catch (error) {
        auditResults.performance = false;
      }

      console.log(
        "Comprehensive Mobile Responsiveness Audit Results:",
        auditResults
      );

      // All tests should pass
      expect(auditResults.viewportManagement).toBe(true);
      expect(auditResults.touchTargets).toBe(true);
      expect(auditResults.layoutAdaptation).toBe(true);
      expect(auditResults.mobileInteractions).toBe(true);
      expect(auditResults.accessibility).toBe(true);
      expect(auditResults.performance).toBe(true);

      // Calculate overall score
      const passedTests = Object.values(auditResults).filter(
        (result) => result === true
      ).length;
      const totalTests = Object.values(auditResults).length;
      const overallScore = (passedTests / totalTests) * 100;

      console.log(`Overall Mobile Responsiveness Score: ${overallScore}%`);
      expect(overallScore).toBe(100); // All tests should pass
    });
  });
});
