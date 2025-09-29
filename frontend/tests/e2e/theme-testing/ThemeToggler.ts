import { Page } from '@playwright/test';

export interface ThemeState {
  current: 'light' | 'dark';
  systemPreference: 'light' | 'dark';
  storageValue: string | null;
  htmlClasses: string[];
  cssVariables: Record<string, string>;
}

export interface ThemeToggleOptions {
  waitForTransition?: boolean;
  transitionTimeout?: number;
  validateApplication?: boolean;
  method?: 'toggle' | 'direct' | 'storage';
}

/**
 * Enhanced ThemeToggler class for automated light/dark mode switching
 * Handles multiple theme switching methods and validates proper application
 */
export class ThemeToggler {
  constructor(private page: Page) {}

  /**
   * Switch to a specific theme with comprehensive validation
   */
  async switchToTheme(
    theme: 'light' | 'dark', 
    options: ThemeToggleOptions = {}
  ): Promise<void> {
    const {
      waitForTransition = true,
      transitionTimeout = 500,
      validateApplication = true,
      method = 'toggle'
    } = options;

    const currentTheme = await this.getCurrentTheme();
    
    // Skip if already on target theme
    if (currentTheme.current === theme) {
      return;
    }

    // Record initial state for transition validation
    const initialState = await this.getThemeState();

    // Switch theme using specified method
    switch (method) {
      case 'toggle':
        await this._switchViaToggle(theme);
        break;
      case 'direct':
        await this._switchViaDirectManipulation(theme);
        break;
      case 'storage':
        await this._switchViaStorage(theme);
        break;
    }

    // Wait for transition if requested
    if (waitForTransition) {
      await this.page.waitForTimeout(transitionTimeout);
    }

    // Validate theme was applied correctly
    if (validateApplication) {
      await this._validateThemeApplication(theme, initialState);
    }
  }

  /**
   * Get comprehensive theme state information
   */
  async getThemeState(): Promise<ThemeState> {
    return await this.page.evaluate(() => {
      const html = document.documentElement;
      const isDark = html.classList.contains('dark');
      
      // Get system preference
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' : 'light';

      // Get storage value
      const storageValue = localStorage.getItem('theme');

      // Get all HTML classes
      const htmlClasses = Array.from(html.classList);

      // Get CSS custom properties (variables)
      const styles = getComputedStyle(html);
      const cssVariables: Record<string, string> = {};
      
      // Common theme-related CSS variables
      const themeVars = [
        '--background',
        '--foreground', 
        '--primary',
        '--secondary',
        '--muted',
        '--accent',
        '--destructive',
        '--border',
        '--input',
        '--ring'
      ];

      themeVars.forEach(varName => {
        const value = styles.getPropertyValue(varName);
        if (value) {
          cssVariables[varName] = value.trim();
        }
      });

      return {
        current: isDark ? 'dark' : 'light',
        systemPreference,
        storageValue,
        htmlClasses,
        cssVariables
      };
    });
  }

  /**
   * Get current theme (simplified version for backward compatibility)
   */
  async getCurrentTheme(): Promise<ThemeState> {
    return await this.getThemeState();
  }

  /**
   * Toggle between light and dark themes
   */
  async toggleTheme(options: ThemeToggleOptions = {}): Promise<void> {
    const currentState = await this.getThemeState();
    const targetTheme = currentState.current === 'light' ? 'dark' : 'light';
    await this.switchToTheme(targetTheme, options);
  }

  /**
   * Set theme to match system preference
   */
  async setToSystemPreference(options: ThemeToggleOptions = {}): Promise<void> {
    const state = await this.getThemeState();
    await this.switchToTheme(state.systemPreference, options);
  }

  /**
   * Test theme persistence across page reloads
   */
  async testThemePersistence(theme: 'light' | 'dark'): Promise<boolean> {
    // Set theme
    await this.switchToTheme(theme);
    
    // Reload page
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    
    // Check if theme persisted
    const newState = await this.getThemeState();
    return newState.current === theme;
  }

  /**
   * Get all available theme toggle elements on the page
   */
  async getThemeToggleElements() {
    return await this.page.evaluate(() => {
      const selectors = [
        '[data-testid="theme-toggle"]',
        '[data-testid="theme-switcher"]',
        '[aria-label*="theme"]',
        '[aria-label*="dark"]',
        '[aria-label*="light"]',
        'button[class*="theme"]',
        '.theme-toggle',
        '.dark-mode-toggle'
      ];

      const elements: Array<{
        selector: string;
        visible: boolean;
        text: string;
        ariaLabel: string | null;
      }> = [];

      selectors.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
          const rect = el.getBoundingClientRect();
          elements.push({
            selector,
            visible: rect.width > 0 && rect.height > 0,
            text: el.textContent?.trim() || '',
            ariaLabel: el.getAttribute('aria-label')
          });
        });
      });

      return elements;
    });
  }

  /**
   * Switch theme via toggle button click
   */
  private async _switchViaToggle(theme: 'light' | 'dark'): Promise<void> {
    const toggleElements = await this.getThemeToggleElements();
    const visibleToggle = toggleElements.find(el => el.visible);

    if (!visibleToggle) {
      throw new Error('No visible theme toggle element found');
    }

    const toggleButton = this.page.locator(visibleToggle.selector).first();
    
    // Click toggle until we reach the desired theme
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const currentState = await this.getThemeState();
      if (currentState.current === theme) {
        break;
      }

      await toggleButton.click();
      await this.page.waitForTimeout(100);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error(`Failed to switch to ${theme} theme via toggle after ${maxAttempts} attempts`);
    }
  }

  /**
   * Switch theme via direct DOM manipulation
   */
  private async _switchViaDirectManipulation(theme: 'light' | 'dark'): Promise<void> {
    await this.page.evaluate((targetTheme) => {
      const html = document.documentElement;
      
      if (targetTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      // Trigger theme change events
      const event = new CustomEvent('themechange', { 
        detail: { theme: targetTheme } 
      });
      document.dispatchEvent(event);
    }, theme);
  }

  /**
   * Switch theme via localStorage and reload
   */
  private async _switchViaStorage(theme: 'light' | 'dark'): Promise<void> {
    await this.page.evaluate((targetTheme) => {
      localStorage.setItem('theme', targetTheme);
      
      // Apply immediately
      const html = document.documentElement;
      if (targetTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }, theme);
  }

  /**
   * Validate that theme was applied correctly
   */
  private async _validateThemeApplication(
    expectedTheme: 'light' | 'dark',
    initialState: ThemeState
  ): Promise<void> {
    const currentState = await this.getThemeState();

    // Validate theme class
    if (currentState.current !== expectedTheme) {
      throw new Error(
        `Theme validation failed: expected ${expectedTheme}, got ${currentState.current}`
      );
    }

    // Validate CSS variables changed
    const variablesChanged = Object.keys(currentState.cssVariables).some(
      key => currentState.cssVariables[key] !== initialState.cssVariables[key]
    );

    if (!variablesChanged && Object.keys(currentState.cssVariables).length > 0) {
      console.warn('CSS variables may not have updated during theme switch');
    }

    // Validate storage was updated (if applicable)
    if (currentState.storageValue && currentState.storageValue !== expectedTheme) {
      console.warn(`Storage value (${currentState.storageValue}) doesn't match current theme (${expectedTheme})`);
    }
  }
}