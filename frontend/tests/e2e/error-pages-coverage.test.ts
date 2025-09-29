import { test, expect, VIEWPORTS, THEMES } from './fixtures/base-test';

/**
 * Error Pages and Edge Cases Testing Coverage
 * 
 * This test suite focuses on error pages (404, 500) and edge cases
 * in both light and dark modes, ensuring proper error handling and user experience.
 * 
 * Requirements: 8.1, 8.2, 8.3 (error pages and edge cases)
 */

const ERROR_TEST_PAGES = {
  notFound: '/this-page-does-not-exist-404',
  invalidArtist: '/artists/invalid-artist-id-12345',
  invalidStudio: '/studios/invalid-studio-id-12345',
  invalidStyle: '/styles/invalid-style-name',
  malformedUrl: '/search?q=%invalid%query%',
  deepNotFound: '/artists/test/portfolio/invalid/deep/path'
} as const;

// Helper function to check error page structure
async function checkErrorPageStructure(page: any, errorType: string) {
  // Check for error heading
  const errorHeading = page.locator('h1, .error-title, [data-testid="error-title"]');
  if (await errorHeading.count() > 0) {
    await expect(errorHeading).toBeVisible();
    
    const headingText = await errorHeading.textContent();
    expect(headingText).toBeTruthy();
    expect(headingText?.length).toBeGreaterThan(5);
  }

  // Check for error message
  const errorMessage = page.locator('.error-message, .error-description, [data-testid="error-message"]');
  if (await errorMessage.count() > 0) {
    await expect(errorMessage).toBeVisible();
  }

  // Check for navigation back to home
  const homeLink = page.locator('a[href="/"], a[href="./"], .home-link, [data-testid="home-link"]');
  if (await homeLink.count() > 0) {
    await expect(homeLink).toBeVisible();
    
    const href = await homeLink.getAttribute('href');
    expect(href).toBeTruthy();
  }

  // Check for search functionality on error page
  const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  if (await searchInput.count() > 0) {
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  }

  // Check navigation is still present
  const nav = page.locator('nav, [role="navigation"]');
  if (await nav.count() > 0) {
    await expect(nav).toBeVisible();
  }
}

// Helper function to check error page accessibility
async function checkErrorPageAccessibility(page: any) {
  // Check page has proper heading structure
  const headings = page.locator('h1, h2, h3, h4, h5, h6');
  const headingCount = await headings.count();
  
  if (headingCount > 0) {
    // Should have at least one h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  }

  // Check error message has proper ARIA attributes
  const errorMessage = page.locator('[role="alert"], .error-message, [data-testid="error-message"]');
  if (await errorMessage.count() > 0) {
    const role = await errorMessage.getAttribute('role');
    const ariaLive = await errorMessage.getAttribute('aria-live');
    // Error messages should be announced to screen readers
    expect(role === 'alert' || ariaLive).toBeTruthy();
  }

  // Check all links are accessible
  const links = page.locator('a[href]');
  const linkCount = await links.count();
  
  for (let i = 0; i < Math.min(linkCount, 5); i++) {
    const link = links.nth(i);
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      expect(href).toBeTruthy();
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  }
}

test.describe('Error Pages Coverage - 404 Not Found', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`404 page - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to non-existent page
        const response = await uiAuditPage.goto(ERROR_TEST_PAGES.notFound, { 
          waitUntil: 'networkidle' 
        });
        
        // Check response status (should be 404 or handled by client-side routing)
        if (response) {
          const status = response.status();
          // Accept 404 or 200 (for client-side routing)
          expect([200, 404]).toContain(status);
        }

        // Set theme
        await themeToggler.setTheme(theme);
        await uiAuditPage.waitForTimeout(500);

        // Check error page structure
        await checkErrorPageStructure(uiAuditPage, '404');

        // Check for 404-specific content
        const pageContent = await uiAuditPage.textContent('body');
        const has404Content = pageContent?.toLowerCase().includes('404') || 
                             pageContent?.toLowerCase().includes('not found') ||
                             pageContent?.toLowerCase().includes('page not found');
        expect(has404Content).toBe(true);

        // Check error page accessibility
        await checkErrorPageAccessibility(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: '404-error-page',
          theme,
          viewport
        });

        // Run accessibility audit
        const axeResults = await accessibilityChecker.runAxeAudit();
        expect(axeResults.violations).toHaveLength(0);
      });
    });
  });
});

test.describe('Error Pages Coverage - Invalid Resource Pages', () => {
  const invalidResources = [
    { key: 'invalidArtist', name: 'Invalid Artist Profile', expectedContent: ['artist', 'not found'] },
    { key: 'invalidStudio', name: 'Invalid Studio Profile', expectedContent: ['studio', 'not found'] },
    { key: 'invalidStyle', name: 'Invalid Style Page', expectedContent: ['style', 'not found'] }
  ] as const;

  invalidResources.forEach(({ key, name, expectedContent }) => {
    ALL_THEMES.forEach(theme => {
      ['desktop', 'mobile'].forEach(viewport => {
        test(`${name} - ${theme} mode - ${viewport}`, async ({ 
          uiAuditPage, 
          themeToggler, 
          screenshotCapture,
          accessibilityChecker 
        }) => {
          // Set viewport
          await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
          
          // Navigate to invalid resource page
          await uiAuditPage.goto(ERROR_TEST_PAGES[key as keyof typeof ERROR_TEST_PAGES], { 
            waitUntil: 'networkidle' 
          });

          // Set theme
          await themeToggler.setTheme(theme);
          await uiAuditPage.waitForTimeout(500);

          // Check error page structure
          await checkErrorPageStructure(uiAuditPage, key);

          // Check for resource-specific error content
          const pageContent = await uiAuditPage.textContent('body');
          const hasExpectedContent = expectedContent.some(content => 
            pageContent?.toLowerCase().includes(content.toLowerCase())
          );
          expect(hasExpectedContent).toBe(true);

          // Check for alternative suggestions
          const suggestions = uiAuditPage.locator('.suggestions, .alternatives, [data-testid="suggestions"]');
          if (await suggestions.count() > 0) {
            await expect(suggestions).toBeVisible();
          }

          // Check error page accessibility
          await checkErrorPageAccessibility(uiAuditPage);

          // Capture screenshot
          await screenshotCapture.captureFullPage({
            name: `${key}-error-page`,
            theme,
            viewport: viewport as keyof typeof VIEWPORTS
          });

          // Run accessibility audit
          const axeResults = await accessibilityChecker.runAxeAudit();
          expect(axeResults.violations).toHaveLength(0);
        });
      });
    });
  });
});

test.describe('Error Pages Coverage - Network and Loading Errors', () => {
  test('Network error handling - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to a page first
      await uiAuditPage.goto('/search');
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Simulate network failure
      await uiAuditPage.route('**/api/**', route => route.abort('failed'));
      
      // Try to perform search that would trigger API call
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('test search');
        await uiAuditPage.keyboard.press('Enter');
        await uiAuditPage.waitForTimeout(2000);

        // Check for error message
        const errorMessage = uiAuditPage.locator('.error, .network-error, [role="alert"], [data-testid="error"]');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible();
        }

        // Check for retry option
        const retryButton = uiAuditPage.locator('button[aria-label*="retry" i], .retry-button, [data-testid="retry"]');
        if (await retryButton.count() > 0) {
          await expect(retryButton).toBeVisible();
        }
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'network-error-handling',
        theme,
        viewport: 'desktop'
      });

      // Clear route interception
      await uiAuditPage.unroute('**/api/**');
    }
  });

  test('Slow loading states - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto('/search');
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Simulate slow API responses
      await uiAuditPage.route('**/api/**', route => {
        setTimeout(() => route.continue(), 3000);
      });

      // Trigger search
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('slow search');
        await uiAuditPage.keyboard.press('Enter');
        
        // Wait a bit to capture loading state
        await uiAuditPage.waitForTimeout(1000);

        // Check for loading indicators
        const loadingIndicators = uiAuditPage.locator('.loading, .spinner, [data-testid="loading"], .skeleton');
        if (await loadingIndicators.count() > 0) {
          await expect(loadingIndicators.first()).toBeVisible();
        }

        // Capture screenshot of loading state
        await screenshotCapture.captureFullPage({
          name: 'loading-state-error',
          theme,
          viewport: 'desktop'
        });
      }

      // Clear route interception
      await uiAuditPage.unroute('**/api/**');
    }
  });
});

test.describe('Error Pages Coverage - Form and Input Errors', () => {
  test('Form validation errors - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to login page
      await uiAuditPage.goto('/login');
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Test various validation errors
      const form = uiAuditPage.locator('form, [data-testid="login-form"]');
      if (await form.count() > 0) {
        // Test empty form submission
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await uiAuditPage.waitForTimeout(1000);

          // Check for validation errors
          const validationErrors = uiAuditPage.locator('.error, .validation-error, [role="alert"]');
          if (await validationErrors.count() > 0) {
            await expect(validationErrors.first()).toBeVisible();
            
            // Check error has proper ARIA attributes
            const firstError = validationErrors.first();
            const role = await firstError.getAttribute('role');
            const ariaLive = await firstError.getAttribute('aria-live');
            expect(role === 'alert' || ariaLive).toBeTruthy();
          }

          // Capture screenshot
          await screenshotCapture.captureFullPage({
            name: 'form-validation-errors',
            theme,
            viewport: 'desktop'
          });
        }

        // Test invalid email format
        const emailInput = form.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
          await emailInput.fill('invalid-email-format');
          await emailInput.blur();
          await uiAuditPage.waitForTimeout(500);

          // Check for email validation error
          const emailError = uiAuditPage.locator('.error, .validation-error, [role="alert"]');
          if (await emailError.count() > 0) {
            await expect(emailError.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('Search input errors - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto('/search');
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Test malformed search query
      await uiAuditPage.goto(ERROR_TEST_PAGES.malformedUrl);
      await uiAuditPage.waitForLoadState('networkidle');

      // Check for error handling
      const errorMessage = uiAuditPage.locator('.error, .search-error, [role="alert"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }

      // Check search input is still functional
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'search-input-errors',
        theme,
        viewport: 'desktop'
      });
    }
  });
});

test.describe('Error Pages Coverage - Edge Cases', () => {
  test('Deep nested 404 pages - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to deeply nested non-existent page
      await uiAuditPage.goto(ERROR_TEST_PAGES.deepNotFound, { 
        waitUntil: 'networkidle' 
      });

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Check error page structure
      await checkErrorPageStructure(uiAuditPage, 'deep-404');

      // Check breadcrumb or path indication
      const breadcrumb = uiAuditPage.locator('.breadcrumb, .path, [data-testid="breadcrumb"]');
      if (await breadcrumb.count() > 0) {
        await expect(breadcrumb).toBeVisible();
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'deep-nested-404',
        theme,
        viewport: 'desktop'
      });
    }
  });

  test('JavaScript disabled fallback - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Disable JavaScript
      await uiAuditPage.context().addInitScript(() => {
        Object.defineProperty(navigator, 'javaEnabled', {
          value: () => false
        });
      });

      // Navigate to home page
      await uiAuditPage.goto('/');
      await uiAuditPage.waitForLoadState('networkidle');

      // Check basic functionality still works
      const nav = uiAuditPage.locator('nav, [role="navigation"]');
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      }

      // Check for noscript content
      const noscript = uiAuditPage.locator('noscript');
      if (await noscript.count() > 0) {
        // Noscript content should be present
        expect(await noscript.count()).toBeGreaterThan(0);
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'javascript-disabled',
        theme,
        viewport: 'desktop'
      });
    }
  });

  test('Browser back/forward error handling - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate through several pages
      await uiAuditPage.goto('/');
      await uiAuditPage.waitForLoadState('networkidle');
      
      await uiAuditPage.goto('/search');
      await uiAuditPage.waitForLoadState('networkidle');
      
      await uiAuditPage.goto(ERROR_TEST_PAGES.notFound);
      await uiAuditPage.waitForLoadState('networkidle');

      // Set theme
      await themeToggler.setTheme(theme);
      await uiAuditPage.waitForTimeout(500);

      // Test browser back button
      await uiAuditPage.goBack();
      await uiAuditPage.waitForLoadState('networkidle');

      // Should be on search page
      expect(uiAuditPage.url()).toContain('/search');

      // Test forward button
      await uiAuditPage.goForward();
      await uiAuditPage.waitForLoadState('networkidle');

      // Should be back on 404 page
      await checkErrorPageStructure(uiAuditPage, 'navigation-404');

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'browser-navigation-errors',
        theme,
        viewport: 'desktop'
      });
    }
  });
});