import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { 
  ThemeToggler, 
  ThemeValidator, 
  TransitionTester, 
  ComponentThemeChecker,
  createThemeTestSuite,
  DEFAULT_THEME_CONFIG
} from '../theme-testing';

// Define viewport configurations for different device types
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  mobile_large: { width: 414, height: 896 },
  desktop_small: { width: 1366, height: 768 },
} as const;

// Define theme modes
const THEMES = {
  light: 'light',
  dark: 'dark',
} as const;

// Extended test fixture with UI audit utilities
type UIAuditFixtures = {
  uiAuditPage: Page;
  themeToggler: ThemeToggler;
  themeValidator: ThemeValidator;
  transitionTester: TransitionTester;
  componentChecker: ComponentThemeChecker;
  themeTestSuite: ReturnType<typeof createThemeTestSuite>;
  screenshotCapture: ScreenshotCapture;
  accessibilityChecker: AccessibilityChecker;
};

// Screenshot capture utility
class ScreenshotCapture {
  constructor(private page: Page) {}

  async captureFullPage(options: {
    name: string;
    theme: 'light' | 'dark';
    viewport: keyof typeof VIEWPORTS;
  }) {
    const { name, theme, viewport } = options;
    const filename = `${name}-${theme}-${viewport}.png`;
    
    // Ensure page is fully loaded
    await this.page.waitForLoadState('networkidle');
    
    // Hide scrollbars for consistent screenshots
    await this.page.addStyleTag({
      content: `
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `
    });

    return await this.page.screenshot({
      path: `tests/e2e/visual-regression/screenshots/${filename}`,
      fullPage: true,
      animations: 'disabled',
    });
  }

  async captureElement(selector: string, options: {
    name: string;
    theme: 'light' | 'dark';
    viewport: keyof typeof VIEWPORTS;
  }) {
    const { name, theme, viewport } = options;
    const filename = `${name}-${theme}-${viewport}-element.png`;
    
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });

    return await element.screenshot({
      path: `tests/e2e/visual-regression/screenshots/${filename}`,
      animations: 'disabled',
    });
  }
}

// Accessibility checker utility
class AccessibilityChecker {
  constructor(private page: Page) {}

  async runAxeAudit() {
    // Inject axe-core if not already present
    await this.page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js'
    });

    // Run axe audit
    const results = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        window.axe.run((err: any, results: any) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });

    return results;
  }

  async checkContrastRatios() {
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const contrastIssues: Array<{
        selector: string;
        foreground: string;
        background: string;
        ratio: number;
      }> = [];

      elements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Skip elements with transparent or inherit colors
        if (color === 'rgba(0, 0, 0, 0)' || color === 'inherit' || 
            backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'inherit') {
          return;
        }

        // Basic contrast ratio calculation would go here
        // For now, we'll collect the color information
        if (element.textContent && element.textContent.trim()) {
          contrastIssues.push({
            selector: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ').join('.') : ''),
            foreground: color,
            background: backgroundColor,
            ratio: 0 // Placeholder - would calculate actual ratio
          });
        }
      });

      return contrastIssues;
    });
  }
}

// Extend the base test with our fixtures
export const test = base.extend<UIAuditFixtures>({
  uiAuditPage: async ({ page }, use) => {
    // Set up page with common configurations
    await page.setViewportSize(VIEWPORTS.desktop);
    
    // Add common test attributes
    await page.addInitScript(() => {
      (window as any).testMode = true;
    });

    await use(page);
  },

  themeToggler: async ({ uiAuditPage }, use) => {
    const toggler = new ThemeToggler(uiAuditPage);
    await use(toggler);
  },

  themeValidator: async ({ uiAuditPage }, use) => {
    const validator = new ThemeValidator(uiAuditPage);
    await use(validator);
  },

  transitionTester: async ({ uiAuditPage }, use) => {
    const tester = new TransitionTester(uiAuditPage);
    await use(tester);
  },

  componentChecker: async ({ uiAuditPage }, use) => {
    const checker = new ComponentThemeChecker(uiAuditPage);
    await use(checker);
  },

  themeTestSuite: async ({ uiAuditPage }, use) => {
    const suite = createThemeTestSuite(uiAuditPage);
    await use(suite);
  },

  screenshotCapture: async ({ uiAuditPage }, use) => {
    const capture = new ScreenshotCapture(uiAuditPage);
    await use(capture);
  },

  accessibilityChecker: async ({ uiAuditPage }, use) => {
    const checker = new AccessibilityChecker(uiAuditPage);
    await use(checker);
  },
});

export { expect, VIEWPORTS, THEMES };