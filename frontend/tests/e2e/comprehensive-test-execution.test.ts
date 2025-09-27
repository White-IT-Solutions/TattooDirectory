import { test, expect, VIEWPORTS, THEMES } from './fixtures/base-test';

/**
 * Comprehensive Test Execution and Validation
 * 
 * This test suite implements comprehensive end-to-end testing covering:
 * - All pages and components in both light and dark modes
 * - Search functionality validation across themes
 * - Artist profile and portfolio testing with image gallery validation
 * - Form interaction testing with proper error state validation
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4
 */

// Test configuration for comprehensive coverage
const COMPREHENSIVE_TEST_PAGES = {
  // Core pages
  home: '/',
  search: '/search',
  artists: '/artists',
  studios: '/studios',
  styles: '/styles',
  
  // Detail pages
  artistProfile: '/artists/test-artist-id',
  studioProfile: '/studios/test-studio-id',
  styleDetail: '/styles/traditional',
  
  // Authentication and forms
  login: '/login',
  signup: '/signup',
  contact: '/contact',
  takedown: '/takedown',
  
  // Static pages
  about: '/about',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  status: '/status',
  
  // Error pages
  notFound: '/non-existent-page-404',
  serverError: '/error-test-500'
} as const;

const CRITICAL_COMPONENTS = [
  'navigation',
  'search-form',
  'artist-card',
  'portfolio-gallery',
  'contact-form',
  'theme-toggle',
  'footer'
] as const;

const ALL_THEMES = Object.keys(THEMES) as Array<keyof typeof THEMES>;
const ALL_VIEWPORTS = Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>;

// Helper functions for comprehensive testing
async function waitForPageStabilization(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Additional buffer for animations and theme transitions
}

async function validatePageStructure(page: any, pageName: string) {
  // Check essential page elements
  const nav = page.locator('nav, [role="navigation"]');
  if (await nav.count() > 0) {
    await expect(nav).toBeVisible();
  }

  const main = page.locator('main, [role="main"], .main-content');
  if (await main.count() > 0) {
    await expect(main).toBeVisible();
  }

  const footer = page.locator('footer, [role="contentinfo"]');
  if (await footer.count() > 0) {
    await expect(footer).toBeVisible();
  }

  // Check page title
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);

  // Check meta description
  const metaDescription = page.locator('meta[name="description"]');
  if (await metaDescription.count() > 0) {
    const content = await metaDescription.getAttribute('content');
    expect(content).toBeTruthy();
  }
}

async function validateThemeConsistency(page: any, theme: string) {
  // Check theme is applied to document
  const htmlElement = page.locator('html');
  const dataTheme = await htmlElement.getAttribute('data-theme');
  const className = await htmlElement.getAttribute('class');
  
  const themeApplied = dataTheme === theme || 
                      className?.includes(theme) || 
                      className?.includes(`theme-${theme}`);
  
  expect(themeApplied).toBe(true);

  // Check CSS custom properties are set
  const rootStyles = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {
      backgroundColor: styles.getPropertyValue('--background') || styles.backgroundColor,
      textColor: styles.getPropertyValue('--foreground') || styles.color,
      primaryColor: styles.getPropertyValue('--primary') || styles.getPropertyValue('--color-primary')
    };
  });

  expect(rootStyles.backgroundColor).toBeTruthy();
  expect(rootStyles.textColor).toBeTruthy();
}

async function validateInteractiveElements(page: any) {
  // Check all buttons are accessible and functional
  const buttons = page.locator('button, [role="button"]');
  const buttonCount = await buttons.count();
  
  for (let i = 0; i < Math.min(buttonCount, 15); i++) {
    const button = buttons.nth(i);
    if (await button.isVisible()) {
      await expect(button).toBeEnabled();
      
      // Check button has accessible name
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      expect(ariaLabel || textContent?.trim() || ariaLabelledBy).toBeTruthy();
    }
  }

  // Check all links are accessible
  const links = page.locator('a[href]');
  const linkCount = await links.count();
  
  for (let i = 0; i < Math.min(linkCount, 15); i++) {
    const link = links.nth(i);
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      const textContent = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      expect(href).toBeTruthy();
      expect(textContent?.trim() || ariaLabel).toBeTruthy();
    }
  }
}

test.describe('Comprehensive Test Execution - Core Pages Coverage', () => {
  const corePages = ['home', 'search', 'artists', 'studios', 'styles'] as const;
  
  corePages.forEach(pageKey => {
    ALL_THEMES.forEach(theme => {
      ALL_VIEWPORTS.forEach(viewport => {
        test(`${pageKey} page comprehensive test - ${theme} mode - ${viewport}`, async ({ 
          uiAuditPage, 
          themeToggler, 
          screenshotCapture,
          accessibilityChecker 
        }) => {
          // Set viewport
          await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
          
          // Navigate to page
          await uiAuditPage.goto(COMPREHENSIVE_TEST_PAGES[pageKey]);
          await waitForPageStabilization(uiAuditPage);

          // Apply theme
          await themeToggler.setTheme(theme);
          await waitForPageStabilization(uiAuditPage);

          // Validate page structure
          await validatePageStructure(uiAuditPage, pageKey);

          // Validate theme consistency
          await validateThemeConsistency(uiAuditPage, theme);

          // Validate interactive elements
          await validateInteractiveElements(uiAuditPage);

          // Page-specific validations
          if (pageKey === 'search') {
            const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
            if (await searchInput.count() > 0) {
              await expect(searchInput).toBeVisible();
              await expect(searchInput).toBeEnabled();
            }
          }

          if (pageKey === 'artists' || pageKey === 'studios') {
            const cards = uiAuditPage.locator('.artist-card, .studio-card, [data-testid*="card"]');
            if (await cards.count() > 0) {
              await expect(cards.first()).toBeVisible();
            }
          }

          // Capture screenshot
          await screenshotCapture.captureFullPage({
            name: `comprehensive-${pageKey}`,
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
});

test.describe('Comprehensive Test Execution - Search Functionality Validation', () => {
  const searchTestCases = [
    { query: 'traditional', expectedResults: true },
    { query: 'blackwork', expectedResults: true },
    { query: 'realism', expectedResults: true },
    { query: 'zzznoresults123', expectedResults: false },
    { query: '', expectedResults: false }
  ];

  searchTestCases.forEach(({ query, expectedResults }) => {
    ALL_THEMES.forEach(theme => {
      ['desktop', 'tablet', 'mobile'].forEach(viewport => {
        test(`Search functionality: "${query}" - ${theme} mode - ${viewport}`, async ({ 
          uiAuditPage, 
          themeToggler, 
          screenshotCapture,
          accessibilityChecker 
        }) => {
          // Set viewport
          await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
          
          // Navigate to search page
          await uiAuditPage.goto(COMPREHENSIVE_TEST_PAGES.search);
          await waitForPageStabilization(uiAuditPage);

          // Apply theme
          await themeToggler.setTheme(theme);
          await waitForPageStabilization(uiAuditPage);

          // Perform search
          const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
          await expect(searchInput).toBeVisible();
          
          if (query) {
            await searchInput.fill(query);
            await uiAuditPage.keyboard.press('Enter');
            await waitForPageStabilization(uiAuditPage);
          } else {
            // Test empty search submission
            await uiAuditPage.keyboard.press('Enter');
            await waitForPageStabilization(uiAuditPage);
          }

          // Validate search results
          if (expectedResults) {
            const resultsContainer = uiAuditPage.locator('.search-results, .results, [data-testid="search-results"]');
            if (await resultsContainer.count() > 0) {
              await expect(resultsContainer).toBeVisible();
              
              const resultCards = resultsContainer.locator('.artist-card, .result-card, [data-testid*="card"]');
              if (await resultCards.count() > 0) {
                await expect(resultCards.first()).toBeVisible();
              }
            }
          } else {
            // Check for no results message
            const noResults = uiAuditPage.locator('.no-results, .empty-state, [data-testid="no-results"]');
            if (await noResults.count() > 0) {
              await expect(noResults).toBeVisible();
            }
          }

          // Test search filters
          const filters = uiAuditPage.locator('.filters, .search-filters, [data-testid="filters"]');
          if (await filters.count() > 0) {
            await expect(filters).toBeVisible();
            
            // Test style filter
            const styleFilter = filters.locator('select, .style-filter');
            if (await styleFilter.count() > 0) {
              await expect(styleFilter).toBeVisible();
            }
          }

          // Capture screenshot
          await screenshotCapture.captureFullPage({
            name: `search-${query || 'empty'}-${expectedResults ? 'results' : 'no-results'}`,
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

test.describe('Comprehensive Test Execution - Artist Profile and Portfolio Validation', () => {
  ALL_THEMES.forEach(theme => {
    ['desktop', 'tablet', 'mobile'].forEach(viewport => {
      test(`Artist profile and portfolio comprehensive test - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
        
        // Navigate to artist profile
        await uiAuditPage.goto(COMPREHENSIVE_TEST_PAGES.artistProfile);
        await waitForPageStabilization(uiAuditPage);

        // Apply theme
        await themeToggler.setTheme(theme);
        await waitForPageStabilization(uiAuditPage);

        // Validate artist profile structure
        const artistName = uiAuditPage.locator('h1, .artist-name, [data-testid="artist-name"]');
        if (await artistName.count() > 0) {
          await expect(artistName).toBeVisible();
        }

        const artistInfo = uiAuditPage.locator('.artist-info, .profile-info, [data-testid="artist-info"]');
        if (await artistInfo.count() > 0) {
          await expect(artistInfo).toBeVisible();
        }

        // Validate portfolio gallery
        const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"], .image-gallery');
        if (await gallery.count() > 0) {
          await expect(gallery).toBeVisible();

          // Test gallery images
          const galleryImages = gallery.locator('img');
          const imageCount = await galleryImages.count();
          
          if (imageCount > 0) {
            // Check first few images are visible and have alt text
            for (let i = 0; i < Math.min(imageCount, 6); i++) {
              const img = galleryImages.nth(i);
              await expect(img).toBeVisible();
              
              const alt = await img.getAttribute('alt');
              const ariaLabel = await img.getAttribute('aria-label');
              expect(alt || ariaLabel).toBeTruthy();
            }

            // Test image interaction (lightbox)
            const firstImage = galleryImages.first();
            await firstImage.click();
            await uiAuditPage.waitForTimeout(1000);

            const lightbox = uiAuditPage.locator('.lightbox, .modal, [data-testid="lightbox"], .image-modal');
            if (await lightbox.count() > 0) {
              await expect(lightbox).toBeVisible();
              
              // Test lightbox navigation
              const nextButton = lightbox.locator('button[aria-label*="next" i], .next-button');
              if (await nextButton.count() > 0) {
                await nextButton.click();
                await uiAuditPage.waitForTimeout(500);
              }

              const prevButton = lightbox.locator('button[aria-label*="prev" i], .prev-button');
              if (await prevButton.count() > 0) {
                await prevButton.click();
                await uiAuditPage.waitForTimeout(500);
              }

              // Test keyboard navigation
              await uiAuditPage.keyboard.press('ArrowRight');
              await uiAuditPage.waitForTimeout(500);
              await uiAuditPage.keyboard.press('ArrowLeft');
              await uiAuditPage.waitForTimeout(500);

              // Close lightbox
              const closeButton = lightbox.locator('button[aria-label*="close" i], .close-button');
              if (await closeButton.count() > 0) {
                await closeButton.click();
              } else {
                await uiAuditPage.keyboard.press('Escape');
              }
              
              await expect(lightbox).not.toBeVisible();
            }
          }
        }

        // Validate contact information
        const contactInfo = uiAuditPage.locator('.contact, .contact-info, [data-testid="contact"]');
        if (await contactInfo.count() > 0) {
          await expect(contactInfo).toBeVisible();
        }

        // Test contact buttons
        const contactButtons = uiAuditPage.locator('button[aria-label*="contact" i], .contact-button, a[href*="mailto"], a[href*="tel"]');
        const buttonCount = await contactButtons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = contactButtons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeEnabled();
          }
        }

        // Validate social links
        const socialLinks = uiAuditPage.locator('a[href*="instagram"], a[href*="facebook"], a[href*="twitter"], .social-links a');
        const socialCount = await socialLinks.count();
        
        for (let i = 0; i < socialCount; i++) {
          const link = socialLinks.nth(i);
          if (await link.isVisible()) {
            const href = await link.getAttribute('href');
            expect(href).toBeTruthy();
          }
        }

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: `artist-profile-comprehensive`,
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

test.describe('Comprehensive Test Execution - Form Interaction and Error State Validation', () => {
  const formPages = [
    { key: 'login', name: 'Login Form', hasEmail: true, hasPassword: true },
    { key: 'signup', name: 'Signup Form', hasEmail: true, hasPassword: true },
    { key: 'contact', name: 'Contact Form', hasEmail: true, hasPassword: false },
    { key: 'takedown', name: 'Takedown Form', hasEmail: true, hasPassword: false }
  ] as const;

  formPages.forEach(({ key, name, hasEmail, hasPassword }) => {
    ALL_THEMES.forEach(theme => {
      ['desktop', 'mobile'].forEach(viewport => {
        test(`${name} comprehensive validation - ${theme} mode - ${viewport}`, async ({ 
          uiAuditPage, 
          themeToggler, 
          screenshotCapture,
          accessibilityChecker 
        }) => {
          // Set viewport
          await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
          
          // Navigate to form page
          await uiAuditPage.goto(COMPREHENSIVE_TEST_PAGES[key as keyof typeof COMPREHENSIVE_TEST_PAGES]);
          await waitForPageStabilization(uiAuditPage);

          // Apply theme
          await themeToggler.setTheme(theme);
          await waitForPageStabilization(uiAuditPage);

          // Validate form structure
          const form = uiAuditPage.locator('form, [data-testid*="form"]');
          if (await form.count() > 0) {
            await expect(form).toBeVisible();

            // Test form accessibility
            const inputs = form.locator('input, textarea, select');
            const inputCount = await inputs.count();
            
            for (let i = 0; i < inputCount; i++) {
              const input = inputs.nth(i);
              if (await input.isVisible()) {
                const id = await input.getAttribute('id');
                const ariaLabel = await input.getAttribute('aria-label');
                const ariaLabelledBy = await input.getAttribute('aria-labelledby');
                
                if (id) {
                  const label = uiAuditPage.locator(`label[for="${id}"]`);
                  const hasLabel = await label.count() > 0;
                  expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
                }
              }
            }

            // Test empty form submission (validation)
            const submitButton = form.locator('button[type="submit"], input[type="submit"]');
            if (await submitButton.count() > 0) {
              await submitButton.click();
              await uiAuditPage.waitForTimeout(1500);

              // Check for validation errors
              const validationErrors = uiAuditPage.locator('.error, .validation-error, [role="alert"], .field-error');
              if (await validationErrors.count() > 0) {
                await expect(validationErrors.first()).toBeVisible();
                
                // Check error has proper ARIA attributes
                const firstError = validationErrors.first();
                const role = await firstError.getAttribute('role');
                const ariaLive = await firstError.getAttribute('aria-live');
                expect(role === 'alert' || ariaLive).toBeTruthy();
              }

              // Capture validation error state
              await screenshotCapture.captureFullPage({
                name: `${key}-form-validation-errors`,
                theme,
                viewport: viewport as keyof typeof VIEWPORTS
              });
            }

            // Test invalid input formats
            if (hasEmail) {
              const emailInput = form.locator('input[type="email"], input[name="email"]');
              if (await emailInput.count() > 0) {
                await emailInput.fill('invalid-email-format');
                await emailInput.blur();
                await uiAuditPage.waitForTimeout(500);

                const emailError = uiAuditPage.locator('.error, .validation-error, [role="alert"]');
                if (await emailError.count() > 0) {
                  await expect(emailError.first()).toBeVisible();
                }
              }
            }

            // Test password requirements (if applicable)
            if (hasPassword) {
              const passwordInput = form.locator('input[type="password"], input[name="password"]');
              if (await passwordInput.count() > 0) {
                await passwordInput.fill('weak');
                await passwordInput.blur();
                await uiAuditPage.waitForTimeout(500);

                // Check for password strength indicator or validation
                const passwordError = uiAuditPage.locator('.error, .validation-error, .password-strength');
                if (await passwordError.count() > 0) {
                  await expect(passwordError.first()).toBeVisible();
                }

                // Test password visibility toggle
                const toggleButton = uiAuditPage.locator('button[aria-label*="show" i], button[aria-label*="hide" i], .password-toggle');
                if (await toggleButton.count() > 0) {
                  const initialType = await passwordInput.getAttribute('type');
                  await toggleButton.click();
                  await uiAuditPage.waitForTimeout(200);
                  
                  const newType = await passwordInput.getAttribute('type');
                  expect(newType).not.toBe(initialType);
                }
              }
            }

            // Test form field focus states
            const firstInput = form.locator('input, textarea').first();
            if (await firstInput.count() > 0) {
              await firstInput.focus();
              
              // Check focus is visible
              const focusedElement = uiAuditPage.locator(':focus');
              await expect(focusedElement).toBeVisible();
              
              // Test tab navigation
              await uiAuditPage.keyboard.press('Tab');
              await uiAuditPage.keyboard.press('Tab');
            }

            // Test successful form submission (with valid data)
            if (hasEmail) {
              const emailInput = form.locator('input[type="email"], input[name="email"]');
              if (await emailInput.count() > 0) {
                await emailInput.fill('test@example.com');
              }
            }

            if (hasPassword) {
              const passwordInput = form.locator('input[type="password"], input[name="password"]');
              if (await passwordInput.count() > 0) {
                await passwordInput.fill('ValidPassword123!');
              }
            }

            // Fill other required fields
            const textInputs = form.locator('input[type="text"], textarea');
            const textInputCount = await textInputs.count();
            
            for (let i = 0; i < textInputCount; i++) {
              const input = textInputs.nth(i);
              if (await input.isVisible()) {
                const required = await input.getAttribute('required');
                if (required !== null) {
                  await input.fill('Test input value');
                }
              }
            }

            // Capture valid form state
            await screenshotCapture.captureFullPage({
              name: `${key}-form-valid-state`,
              theme,
              viewport: viewport as keyof typeof VIEWPORTS
            });
          }

          // Run accessibility audit
          const axeResults = await accessibilityChecker.runAxeAudit();
          expect(axeResults.violations).toHaveLength(0);
        });
      });
    });
  });
});

test.describe('Comprehensive Test Execution - Component Integration Testing', () => {
  CRITICAL_COMPONENTS.forEach(component => {
    ALL_THEMES.forEach(theme => {
      test(`${component} component integration - ${theme} mode`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
        
        // Navigate to page where component is likely to be present
        let testPage = '/';
        if (component === 'search-form') testPage = '/search';
        if (component === 'artist-card') testPage = '/artists';
        if (component === 'portfolio-gallery') testPage = '/artists/test-artist-id';
        if (component === 'contact-form') testPage = '/contact';

        await uiAuditPage.goto(testPage);
        await waitForPageStabilization(uiAuditPage);

        // Apply theme
        await themeToggler.setTheme(theme);
        await waitForPageStabilization(uiAuditPage);

        // Component-specific testing
        switch (component) {
          case 'navigation':
            const nav = uiAuditPage.locator('nav, [role="navigation"]');
            if (await nav.count() > 0) {
              await expect(nav).toBeVisible();
              
              const navLinks = nav.locator('a[href]');
              const linkCount = await navLinks.count();
              
              for (let i = 0; i < Math.min(linkCount, 5); i++) {
                const link = navLinks.nth(i);
                if (await link.isVisible()) {
                  await expect(link).toBeEnabled();
                }
              }
            }
            break;

          case 'theme-toggle':
            const themeToggle = uiAuditPage.locator('button[aria-label*="theme" i], .theme-toggle, [data-testid="theme-toggle"]');
            if (await themeToggle.count() > 0) {
              await expect(themeToggle).toBeVisible();
              await expect(themeToggle).toBeEnabled();
              
              // Test theme toggle functionality
              await themeToggle.click();
              await uiAuditPage.waitForTimeout(500);
              
              // Verify theme changed
              const newTheme = theme === 'light' ? 'dark' : 'light';
              await validateThemeConsistency(uiAuditPage, newTheme);
            }
            break;

          case 'search-form':
            const searchForm = uiAuditPage.locator('form, .search-form, [data-testid="search-form"]');
            if (await searchForm.count() > 0) {
              const searchInput = searchForm.locator('input[type="search"], input[placeholder*="search" i]');
              if (await searchInput.count() > 0) {
                await expect(searchInput).toBeVisible();
                await expect(searchInput).toBeEnabled();
                
                // Test search functionality
                await searchInput.fill('test search');
                await uiAuditPage.keyboard.press('Enter');
                await waitForPageStabilization(uiAuditPage);
              }
            }
            break;

          case 'artist-card':
            const artistCards = uiAuditPage.locator('.artist-card, [data-testid="artist-card"]');
            if (await artistCards.count() > 0) {
              const firstCard = artistCards.first();
              await expect(firstCard).toBeVisible();
              
              // Test card interaction
              await firstCard.click();
              await waitForPageStabilization(uiAuditPage);
            }
            break;

          case 'portfolio-gallery':
            const gallery = uiAuditPage.locator('.gallery, .portfolio, [data-testid="portfolio"]');
            if (await gallery.count() > 0) {
              await expect(gallery).toBeVisible();
              
              const images = gallery.locator('img');
              if (await images.count() > 0) {
                await expect(images.first()).toBeVisible();
              }
            }
            break;

          case 'contact-form':
            const contactForm = uiAuditPage.locator('form, .contact-form, [data-testid="contact-form"]');
            if (await contactForm.count() > 0) {
              await expect(contactForm).toBeVisible();
              
              const inputs = contactForm.locator('input, textarea');
              if (await inputs.count() > 0) {
                await expect(inputs.first()).toBeVisible();
              }
            }
            break;

          case 'footer':
            const footer = uiAuditPage.locator('footer, [role="contentinfo"]');
            if (await footer.count() > 0) {
              await expect(footer).toBeVisible();
              
              const footerLinks = footer.locator('a[href]');
              const footerLinkCount = await footerLinks.count();
              
              for (let i = 0; i < Math.min(footerLinkCount, 3); i++) {
                const link = footerLinks.nth(i);
                if (await link.isVisible()) {
                  await expect(link).toBeEnabled();
                }
              }
            }
            break;
        }

        // Capture component screenshot
        await screenshotCapture.captureFullPage({
          name: `component-${component}`,
          theme,
          viewport: 'desktop'
        });

        // Run accessibility audit
        const axeResults = await accessibilityChecker.runAxeAudit();
        expect(axeResults.violations).toHaveLength(0);
      });
    });
  });
});

test.describe('Comprehensive Test Execution - Cross-Page User Journeys', () => {
  const userJourneys = [
    {
      name: 'Artist Discovery Journey',
      steps: [
        { page: '/', action: 'start' },
        { page: '/search', action: 'search', data: 'traditional' },
        { page: '/artists/test-artist-id', action: 'view-profile' },
        { page: '/contact', action: 'contact-artist' }
      ]
    },
    {
      name: 'Studio Exploration Journey',
      steps: [
        { page: '/', action: 'start' },
        { page: '/studios', action: 'browse-studios' },
        { page: '/studios/test-studio-id', action: 'view-studio' },
        { page: '/artists', action: 'view-studio-artists' }
      ]
    }
  ];

  userJourneys.forEach(({ name, steps }) => {
    ALL_THEMES.forEach(theme => {
      test(`${name} - ${theme} mode`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        await uiAuditPage.setViewportSize(VIEWPORTS.desktop);

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          
          // Navigate to step page
          await uiAuditPage.goto(step.page);
          await waitForPageStabilization(uiAuditPage);

          // Apply theme
          await themeToggler.setTheme(theme);
          await waitForPageStabilization(uiAuditPage);

          // Perform step action
          switch (step.action) {
            case 'search':
              const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
              if (await searchInput.count() > 0) {
                await searchInput.fill(step.data || '');
                await uiAuditPage.keyboard.press('Enter');
                await waitForPageStabilization(uiAuditPage);
              }
              break;

            case 'view-profile':
            case 'view-studio':
              // Validate profile/studio page loaded
              const heading = uiAuditPage.locator('h1');
              if (await heading.count() > 0) {
                await expect(heading).toBeVisible();
              }
              break;

            case 'contact-artist':
              const contactForm = uiAuditPage.locator('form, .contact-form');
              if (await contactForm.count() > 0) {
                await expect(contactForm).toBeVisible();
              }
              break;
          }

          // Capture step screenshot
          await screenshotCapture.captureFullPage({
            name: `journey-${name.toLowerCase().replace(/\s+/g, '-')}-step-${i + 1}`,
            theme,
            viewport: 'desktop'
          });

          // Run accessibility audit for each step
          const axeResults = await accessibilityChecker.runAxeAudit();
          expect(axeResults.violations).toHaveLength(0);
        }
      });
    });
  });
});