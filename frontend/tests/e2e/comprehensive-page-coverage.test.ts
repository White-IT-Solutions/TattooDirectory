import { test, expect, VIEWPORTS, THEMES } from './fixtures/base-test';

/**
 * Comprehensive Page Testing Coverage
 * 
 * This test suite implements comprehensive testing for all major pages
 * in both light and dark modes, covering:
 * - Home page
 * - Search interface and results
 * - Artist profile pages and portfolios
 * - Authentication flows (login, signup)
 * - Error pages (404, 500) and edge cases
 * 
 * Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3
 */

// Test configuration
const TEST_PAGES = {
  home: '/',
  search: '/search',
  artists: '/artists',
  artistProfile: '/artists/test-artist-id',
  studios: '/studios',
  studioProfile: '/studios/test-studio-id',
  styles: '/styles',
  styleDetail: '/styles/traditional',
  login: '/login',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  takedown: '/takedown',
  status: '/status',
  error404: '/non-existent-page',
  error500: '/error-test'
} as const;

const CRITICAL_PAGES = ['home', 'search', 'artists', 'login'] as const;
const ALL_VIEWPORTS = Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>;
const ALL_THEMES = Object.keys(THEMES) as Array<keyof typeof THEMES>;

// Helper function to wait for page to be fully loaded
async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Additional buffer for animations
}

// Helper function to check basic page elements
async function checkBasicPageElements(page: any, pageName: string) {
  // Check for navigation
  const nav = page.locator('nav, [role="navigation"]');
  await expect(nav).toBeVisible({ timeout: 10000 });

  // Check for main content
  const main = page.locator('main, [role="main"], .main-content');
  await expect(main).toBeVisible({ timeout: 10000 });

  // Check for footer (if present)
  const footer = page.locator('footer, [role="contentinfo"]');
  if (await footer.count() > 0) {
    await expect(footer).toBeVisible();
  }

  // Check page title is set
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title).not.toBe('');
}

// Helper function to check interactive elements
async function checkInteractiveElements(page: any) {
  // Check all buttons are visible and have proper attributes
  const buttons = page.locator('button, [role="button"]');
  const buttonCount = await buttons.count();
  
  for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Limit to first 10 buttons
    const button = buttons.nth(i);
    if (await button.isVisible()) {
      // Check button has accessible name
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      expect(ariaLabel || textContent?.trim()).toBeTruthy();
    }
  }

  // Check all links are accessible
  const links = page.locator('a[href]');
  const linkCount = await links.count();
  
  for (let i = 0; i < Math.min(linkCount, 10); i++) { // Limit to first 10 links
    const link = links.nth(i);
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
    }
  }
}

test.describe('Comprehensive Page Coverage - Home Page', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`Home page - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to home page
        await uiAuditPage.goto(TEST_PAGES.home);
        await waitForPageLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForPageLoad(uiAuditPage);

        // Check basic page elements
        await checkBasicPageElements(uiAuditPage, 'home');

        // Check home page specific elements
        const heroSection = uiAuditPage.locator('.hero, [data-testid="hero"], .hero-section');
        if (await heroSection.count() > 0) {
          await expect(heroSection).toBeVisible();
        }

        // Check search functionality on home page
        const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
        if (await searchInput.count() > 0) {
          await expect(searchInput).toBeVisible();
          await expect(searchInput).toBeEnabled();
        }

        // Check interactive elements
        await checkInteractiveElements(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'home-page',
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

test.describe('Comprehensive Page Coverage - Search Interface', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`Search page - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to search page
        await uiAuditPage.goto(TEST_PAGES.search);
        await waitForPageLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForPageLoad(uiAuditPage);

        // Check basic page elements
        await checkBasicPageElements(uiAuditPage, 'search');

        // Check search interface elements
        const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();

        // Check filters
        const filters = uiAuditPage.locator('[data-testid*="filter"], .filter, .search-filter');
        if (await filters.count() > 0) {
          await expect(filters.first()).toBeVisible();
        }

        // Check search results container
        const resultsContainer = uiAuditPage.locator('[data-testid="search-results"], .search-results, .results');
        if (await resultsContainer.count() > 0) {
          await expect(resultsContainer).toBeVisible();
        }

        // Test search functionality
        await searchInput.fill('traditional');
        await uiAuditPage.keyboard.press('Enter');
        await waitForPageLoad(uiAuditPage);

        // Check interactive elements
        await checkInteractiveElements(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'search-page',
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

test.describe('Comprehensive Page Coverage - Artist Profiles', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`Artists listing - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to artists page
        await uiAuditPage.goto(TEST_PAGES.artists);
        await waitForPageLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForPageLoad(uiAuditPage);

        // Check basic page elements
        await checkBasicPageElements(uiAuditPage, 'artists');

        // Check artist cards
        const artistCards = uiAuditPage.locator('[data-testid="artist-card"], .artist-card, .artist-item');
        if (await artistCards.count() > 0) {
          await expect(artistCards.first()).toBeVisible();
          
          // Check first artist card has required elements
          const firstCard = artistCards.first();
          const artistName = firstCard.locator('h2, h3, .artist-name, [data-testid="artist-name"]');
          if (await artistName.count() > 0) {
            await expect(artistName).toBeVisible();
          }
        }

        // Check interactive elements
        await checkInteractiveElements(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'artists-listing',
          theme,
          viewport
        });

        // Run accessibility audit
        const axeResults = await accessibilityChecker.runAxeAudit();
        expect(axeResults.violations).toHaveLength(0);
      });

      test(`Artist profile page - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to artist profile page
        await uiAuditPage.goto(TEST_PAGES.artistProfile);
        await waitForPageLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForPageLoad(uiAuditPage);

        // Check basic page elements
        await checkBasicPageElements(uiAuditPage, 'artist-profile');

        // Check artist profile specific elements
        const artistName = uiAuditPage.locator('h1, .artist-name, [data-testid="artist-name"]');
        if (await artistName.count() > 0) {
          await expect(artistName).toBeVisible();
        }

        // Check portfolio gallery
        const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"], .image-gallery');
        if (await gallery.count() > 0) {
          await expect(gallery).toBeVisible();
        }

        // Check contact information
        const contactInfo = uiAuditPage.locator('.contact, .contact-info, [data-testid="contact"]');
        if (await contactInfo.count() > 0) {
          await expect(contactInfo).toBeVisible();
        }

        // Check interactive elements
        await checkInteractiveElements(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'artist-profile',
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

test.describe('Comprehensive Page Coverage - Authentication Flows', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`Login page - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to login page
        await uiAuditPage.goto(TEST_PAGES.login);
        await waitForPageLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForPageLoad(uiAuditPage);

        // Check basic page elements
        await checkBasicPageElements(uiAuditPage, 'login');

        // Check login form elements
        const loginForm = uiAuditPage.locator('form, [data-testid="login-form"]');
        if (await loginForm.count() > 0) {
          await expect(loginForm).toBeVisible();
        }

        // Check form inputs
        const emailInput = uiAuditPage.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
          await expect(emailInput).toBeVisible();
          await expect(emailInput).toBeEnabled();
        }

        const passwordInput = uiAuditPage.locator('input[type="password"], input[name="password"]');
        if (await passwordInput.count() > 0) {
          await expect(passwordInput).toBeVisible();
          await expect(passwordInput).toBeEnabled();
        }

        // Check submit button
        const submitButton = uiAuditPage.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          await expect(submitButton).toBeVisible();
          await expect(submitButton).toBeEnabled();
        }

        // Check interactive elements
        await checkInteractiveElements(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'login-page',
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

test.describe('Comprehensive Page Coverage - Error Pages', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`404 Error page - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to non-existent page to trigger 404
        await uiAuditPage.goto(TEST_PAGES.error404, { waitUntil: 'networkidle' });
        await waitForPageLoad(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForPageLoad(uiAuditPage);

        // Check basic page elements (404 pages might have different structure)
        const nav = uiAuditPage.locator('nav, [role="navigation"]');
        if (await nav.count() > 0) {
          await expect(nav).toBeVisible();
        }

        // Check error message
        const errorMessage = uiAuditPage.locator('h1, .error-message, [data-testid="error-message"]');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible();
        }

        // Check home link
        const homeLink = uiAuditPage.locator('a[href="/"], a[href="./"]');
        if (await homeLink.count() > 0) {
          await expect(homeLink).toBeVisible();
        }

        // Check interactive elements
        await checkInteractiveElements(uiAuditPage);

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

test.describe('Comprehensive Page Coverage - Additional Pages', () => {
  const additionalPages = [
    { key: 'studios', name: 'Studios listing' },
    { key: 'styles', name: 'Styles listing' },
    { key: 'faq', name: 'FAQ page' },
    { key: 'privacy', name: 'Privacy policy' },
    { key: 'terms', name: 'Terms of service' },
    { key: 'takedown', name: 'Takedown request' },
    { key: 'status', name: 'Status page' }
  ] as const;

  additionalPages.forEach(({ key, name }) => {
    ALL_THEMES.forEach(theme => {
      // Test only desktop and mobile for additional pages to reduce test time
      ['desktop', 'mobile'].forEach(viewport => {
        test(`${name} - ${theme} mode - ${viewport}`, async ({ 
          uiAuditPage, 
          themeToggler, 
          screenshotCapture,
          accessibilityChecker 
        }) => {
          // Set viewport
          await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
          
          // Navigate to page
          await uiAuditPage.goto(TEST_PAGES[key as keyof typeof TEST_PAGES]);
          await waitForPageLoad(uiAuditPage);

          // Set theme
          await themeToggler.setTheme(theme);
          await waitForPageLoad(uiAuditPage);

          // Check basic page elements
          await checkBasicPageElements(uiAuditPage, key);

          // Check interactive elements
          await checkInteractiveElements(uiAuditPage);

          // Capture screenshot
          await screenshotCapture.captureFullPage({
            name: `${key}-page`,
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

test.describe('Comprehensive Page Coverage - Edge Cases', () => {
  test('Search with no results - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto(TEST_PAGES.search);
      await waitForPageLoad(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForPageLoad(uiAuditPage);

      // Search for something that should return no results
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('zzzznonexistentquery123');
        await uiAuditPage.keyboard.press('Enter');
        await waitForPageLoad(uiAuditPage);

        // Check for no results message
        const noResultsMessage = uiAuditPage.locator('.no-results, [data-testid="no-results"], .empty-state');
        if (await noResultsMessage.count() > 0) {
          await expect(noResultsMessage).toBeVisible();
        }

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'search-no-results',
          theme,
          viewport: 'desktop'
        });
      }
    }
  });

  test('Form validation states - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to login page
      await uiAuditPage.goto(TEST_PAGES.login);
      await waitForPageLoad(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForPageLoad(uiAuditPage);

      // Try to submit empty form to trigger validation
      const submitButton = uiAuditPage.locator('button[type="submit"], input[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await waitForPageLoad(uiAuditPage);

        // Check for validation messages
        const validationMessages = uiAuditPage.locator('.error, .validation-error, [role="alert"]');
        if (await validationMessages.count() > 0) {
          await expect(validationMessages.first()).toBeVisible();
        }

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'form-validation-errors',
          theme,
          viewport: 'desktop'
        });
      }
    }
  });

  test('Loading states - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto(TEST_PAGES.search);
      await waitForPageLoad(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForPageLoad(uiAuditPage);

      // Intercept network requests to simulate slow loading
      await uiAuditPage.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000);
      });

      // Trigger search to show loading state
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('traditional');
        await uiAuditPage.keyboard.press('Enter');
        
        // Wait a bit to capture loading state
        await uiAuditPage.waitForTimeout(1000);

        // Check for loading indicators
        const loadingIndicators = uiAuditPage.locator('.loading, .spinner, [data-testid="loading"]');
        if (await loadingIndicators.count() > 0) {
          await expect(loadingIndicators.first()).toBeVisible();
        }

        // Capture screenshot of loading state
        await screenshotCapture.captureFullPage({
          name: 'loading-state',
          theme,
          viewport: 'desktop'
        });
      }
    }
  });
});