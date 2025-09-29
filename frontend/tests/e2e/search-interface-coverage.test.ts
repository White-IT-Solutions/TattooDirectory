import { test, expect, VIEWPORTS, THEMES } from './fixtures/base-test';

/**
 * Search Interface Testing Coverage
 * 
 * This test suite focuses on search interface elements, search results,
 * filtering, and search-related interactions in both light and dark modes.
 * 
 * Requirements: 7.2 (search interface and results pages)
 */

const SEARCH_TEST_PAGES = {
  search: '/search',
  searchWithQuery: '/search?q=traditional',
  searchWithFilters: '/search?style=traditional&location=london'
} as const;

// Helper function to wait for search results
async function waitForSearchResults(page: any) {
  await page.waitForLoadState('networkidle');
  
  // Wait for search results or no results message
  try {
    await page.waitForSelector('.search-results, .results, [data-testid="search-results"], .no-results, .empty-state', { 
      timeout: 10000 
    });
  } catch (e) {
    // Continue if no specific results container found
  }
  
  await page.waitForTimeout(500);
}

// Helper function to check search accessibility
async function checkSearchAccessibility(page: any) {
  // Check search input has proper labeling
  const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  if (await searchInput.count() > 0) {
    const ariaLabel = await searchInput.getAttribute('aria-label');
    const id = await searchInput.getAttribute('id');
    const placeholder = await searchInput.getAttribute('placeholder');
    
    if (id) {
      const label = page.locator(`label[for="${id}"]`);
      const hasLabel = await label.count() > 0;
      expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
    }
  }

  // Check filter controls have proper labeling
  const filterControls = page.locator('select, input[type="checkbox"], input[type="radio"], .filter-control');
  const controlCount = await filterControls.count();
  
  for (let i = 0; i < Math.min(controlCount, 5); i++) {
    const control = filterControls.nth(i);
    if (await control.isVisible()) {
      const ariaLabel = await control.getAttribute('aria-label');
      const id = await control.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel).toBeTruthy();
      }
    }
  }
}

test.describe('Search Interface Coverage - Search Page', () => {
  ALL_THEMES.forEach(theme => {
    ALL_VIEWPORTS.forEach(viewport => {
      test(`Search page interface - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport]);
        
        // Navigate to search page
        await uiAuditPage.goto(SEARCH_TEST_PAGES.search);
        await waitForSearchResults(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForSearchResults(uiAuditPage);

        // Check basic page structure
        const nav = uiAuditPage.locator('nav, [role="navigation"]');
        if (await nav.count() > 0) {
          await expect(nav).toBeVisible();
        }

        // Check search input
        const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();

        // Check search button
        const searchButton = uiAuditPage.locator('button[type="submit"], button[aria-label*="search" i], .search-button');
        if (await searchButton.count() > 0) {
          await expect(searchButton).toBeVisible();
          await expect(searchButton).toBeEnabled();
        }

        // Check filters section
        const filtersSection = uiAuditPage.locator('.filters, .search-filters, [data-testid="filters"]');
        if (await filtersSection.count() > 0) {
          await expect(filtersSection).toBeVisible();

          // Check style filter
          const styleFilter = filtersSection.locator('select, .style-filter, [data-testid="style-filter"]');
          if (await styleFilter.count() > 0) {
            await expect(styleFilter).toBeVisible();
          }

          // Check location filter
          const locationFilter = filtersSection.locator('input[placeholder*="location" i], .location-filter');
          if (await locationFilter.count() > 0) {
            await expect(locationFilter).toBeVisible();
          }
        }

        // Check results container
        const resultsContainer = uiAuditPage.locator('.search-results, .results, [data-testid="search-results"]');
        if (await resultsContainer.count() > 0) {
          await expect(resultsContainer).toBeVisible();
        }

        // Check view toggle (grid/map)
        const viewToggle = uiAuditPage.locator('.view-toggle, [data-testid="view-toggle"]');
        if (await viewToggle.count() > 0) {
          await expect(viewToggle).toBeVisible();
        }

        // Check search accessibility
        await checkSearchAccessibility(uiAuditPage);

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'search-interface',
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

test.describe('Search Interface Coverage - Search Results', () => {
  ALL_THEMES.forEach(theme => {
    ['desktop', 'tablet', 'mobile'].forEach(viewport => {
      test(`Search results display - ${theme} mode - ${viewport}`, async ({ 
        uiAuditPage, 
        themeToggler, 
        screenshotCapture,
        accessibilityChecker 
      }) => {
        // Set viewport
        await uiAuditPage.setViewportSize(VIEWPORTS[viewport as keyof typeof VIEWPORTS]);
        
        // Navigate to search page with query
        await uiAuditPage.goto(SEARCH_TEST_PAGES.searchWithQuery);
        await waitForSearchResults(uiAuditPage);

        // Set theme
        await themeToggler.setTheme(theme);
        await waitForSearchResults(uiAuditPage);

        // Check search results
        const resultsContainer = uiAuditPage.locator('.search-results, .results, [data-testid="search-results"]');
        if (await resultsContainer.count() > 0) {
          await expect(resultsContainer).toBeVisible();

          // Check result cards
          const resultCards = resultsContainer.locator('.artist-card, .result-card, [data-testid="artist-card"]');
          const cardCount = await resultCards.count();
          
          if (cardCount > 0) {
            // Check first few result cards
            for (let i = 0; i < Math.min(cardCount, 3); i++) {
              const card = resultCards.nth(i);
              await expect(card).toBeVisible();

              // Check card has artist name
              const artistName = card.locator('h2, h3, .artist-name, [data-testid="artist-name"]');
              if (await artistName.count() > 0) {
                await expect(artistName).toBeVisible();
              }

              // Check card has image
              const artistImage = card.locator('img');
              if (await artistImage.count() > 0) {
                await expect(artistImage).toBeVisible();
                
                // Check image has alt text
                const alt = await artistImage.getAttribute('alt');
                expect(alt).toBeTruthy();
              }

              // Check card is clickable
              const cardLink = card.locator('a');
              if (await cardLink.count() > 0) {
                const href = await cardLink.getAttribute('href');
                expect(href).toBeTruthy();
              }
            }
          }
        }

        // Check results count/pagination
        const resultsCount = uiAuditPage.locator('.results-count, [data-testid="results-count"]');
        if (await resultsCount.count() > 0) {
          await expect(resultsCount).toBeVisible();
        }

        const pagination = uiAuditPage.locator('.pagination, [data-testid="pagination"]');
        if (await pagination.count() > 0) {
          await expect(pagination).toBeVisible();
        }

        // Capture screenshot
        await screenshotCapture.captureFullPage({
          name: 'search-results',
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

test.describe('Search Interface Coverage - Search Functionality', () => {
  test('Search input and submission - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto(SEARCH_TEST_PAGES.search);
      await waitForSearchResults(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForSearchResults(uiAuditPage);

      // Test search input
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      await expect(searchInput).toBeVisible();

      // Enter search query
      await searchInput.fill('traditional tattoo');
      
      // Test search submission via Enter key
      await uiAuditPage.keyboard.press('Enter');
      await waitForSearchResults(uiAuditPage);

      // Check URL updated with query
      const currentUrl = uiAuditPage.url();
      expect(currentUrl).toContain('traditional');

      // Check search results appeared
      const resultsContainer = uiAuditPage.locator('.search-results, .results, [data-testid="search-results"]');
      if (await resultsContainer.count() > 0) {
        await expect(resultsContainer).toBeVisible();
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'search-functionality',
        theme,
        viewport: 'desktop'
      });

      // Test search button submission
      await searchInput.fill('blackwork');
      const searchButton = uiAuditPage.locator('button[type="submit"], button[aria-label*="search" i]');
      if (await searchButton.count() > 0) {
        await searchButton.click();
        await waitForSearchResults(uiAuditPage);

        // Check URL updated
        const newUrl = uiAuditPage.url();
        expect(newUrl).toContain('blackwork');
      }
    }
  });

  test('Search filters functionality - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto(SEARCH_TEST_PAGES.search);
      await waitForSearchResults(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForSearchResults(uiAuditPage);

      // Test style filter
      const styleFilter = uiAuditPage.locator('select[name*="style"], .style-filter select, [data-testid="style-filter"]');
      if (await styleFilter.count() > 0) {
        await styleFilter.selectOption('traditional');
        await waitForSearchResults(uiAuditPage);

        // Check URL updated with filter
        const urlWithStyle = uiAuditPage.url();
        expect(urlWithStyle).toContain('traditional');
      }

      // Test location filter
      const locationFilter = uiAuditPage.locator('input[name*="location"], .location-filter input');
      if (await locationFilter.count() > 0) {
        await locationFilter.fill('London');
        await uiAuditPage.keyboard.press('Enter');
        await waitForSearchResults(uiAuditPage);

        // Check URL updated with location
        const urlWithLocation = uiAuditPage.url();
        expect(urlWithLocation).toContain('london');
      }

      // Capture screenshot with filters applied
      await screenshotCapture.captureFullPage({
        name: 'search-filters-applied',
        theme,
        viewport: 'desktop'
      });

      // Test clear filters
      const clearFilters = uiAuditPage.locator('button[aria-label*="clear" i], .clear-filters, [data-testid="clear-filters"]');
      if (await clearFilters.count() > 0) {
        await clearFilters.click();
        await waitForSearchResults(uiAuditPage);

        // Check filters are cleared
        if (await styleFilter.count() > 0) {
          const selectedValue = await styleFilter.inputValue();
          expect(selectedValue).toBe('');
        }
      }
    }
  });

  test('Search autocomplete/suggestions - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto(SEARCH_TEST_PAGES.search);
      await waitForSearchResults(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForSearchResults(uiAuditPage);

      // Test search suggestions
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      await searchInput.fill('trad');
      await uiAuditPage.waitForTimeout(1000);

      // Check for suggestions dropdown
      const suggestions = uiAuditPage.locator('.suggestions, .autocomplete, [data-testid="suggestions"]');
      if (await suggestions.count() > 0) {
        await expect(suggestions).toBeVisible();

        // Check suggestion items
        const suggestionItems = suggestions.locator('li, .suggestion-item, [role="option"]');
        const itemCount = await suggestionItems.count();
        
        if (itemCount > 0) {
          // Check first suggestion is clickable
          const firstSuggestion = suggestionItems.first();
          await expect(firstSuggestion).toBeVisible();
          
          // Test clicking suggestion
          await firstSuggestion.click();
          await waitForSearchResults(uiAuditPage);

          // Check search was performed
          const currentUrl = uiAuditPage.url();
          expect(currentUrl).toContain('q=');
        }

        // Capture screenshot with suggestions
        await screenshotCapture.captureFullPage({
          name: 'search-suggestions',
          theme,
          viewport: 'desktop'
        });
      }
    }
  });
});

test.describe('Search Interface Coverage - No Results State', () => {
  test('No search results handling - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture,
    accessibilityChecker 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.desktop);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto(SEARCH_TEST_PAGES.search);
      await waitForSearchResults(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForSearchResults(uiAuditPage);

      // Search for something that should return no results
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      await searchInput.fill('zzzznonexistentquery12345');
      await uiAuditPage.keyboard.press('Enter');
      await waitForSearchResults(uiAuditPage);

      // Check for no results message
      const noResultsMessage = uiAuditPage.locator('.no-results, .empty-state, [data-testid="no-results"]');
      if (await noResultsMessage.count() > 0) {
        await expect(noResultsMessage).toBeVisible();

        // Check message has helpful content
        const messageText = await noResultsMessage.textContent();
        expect(messageText).toBeTruthy();
        expect(messageText?.length).toBeGreaterThan(10);
      }

      // Check for search suggestions or alternatives
      const suggestions = uiAuditPage.locator('.search-suggestions, .alternative-searches, [data-testid="suggestions"]');
      if (await suggestions.count() > 0) {
        await expect(suggestions).toBeVisible();
      }

      // Check for clear search or try again options
      const tryAgain = uiAuditPage.locator('.try-again, .clear-search, [data-testid="try-again"]');
      if (await tryAgain.count() > 0) {
        await expect(tryAgain).toBeVisible();
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'search-no-results',
        theme,
        viewport: 'desktop'
      });

      // Run accessibility audit
      const axeResults = await accessibilityChecker.runAxeAudit();
      expect(axeResults.violations).toHaveLength(0);
    }
  });
});

test.describe('Search Interface Coverage - Mobile Search', () => {
  test('Mobile search interface - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.mobile);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search page
      await uiAuditPage.goto(SEARCH_TEST_PAGES.search);
      await waitForSearchResults(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForSearchResults(uiAuditPage);

      // Check mobile search interface
      const searchInput = uiAuditPage.locator('input[type="search"], input[placeholder*="search" i]');
      await expect(searchInput).toBeVisible();

      // Check search input is touch-friendly
      const inputBox = await searchInput.boundingBox();
      if (inputBox) {
        expect(inputBox.height).toBeGreaterThanOrEqual(44);
      }

      // Check filters are accessible on mobile
      const filtersToggle = uiAuditPage.locator('.filters-toggle, [data-testid="filters-toggle"], .mobile-filters');
      if (await filtersToggle.count() > 0) {
        await expect(filtersToggle).toBeVisible();
        
        // Test opening filters
        await filtersToggle.tap();
        await uiAuditPage.waitForTimeout(500);

        const filtersPanel = uiAuditPage.locator('.filters-panel, .mobile-filters-panel');
        if (await filtersPanel.count() > 0) {
          await expect(filtersPanel).toBeVisible();
        }
      }

      // Check search results are properly formatted for mobile
      const resultsContainer = uiAuditPage.locator('.search-results, .results');
      if (await resultsContainer.count() > 0) {
        const containerBox = await resultsContainer.boundingBox();
        if (containerBox) {
          expect(containerBox.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
        }
      }

      // Test search functionality on mobile
      await searchInput.tap();
      await searchInput.fill('traditional');
      await uiAuditPage.keyboard.press('Enter');
      await waitForSearchResults(uiAuditPage);

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'mobile-search-interface',
        theme,
        viewport: 'mobile'
      });
    }
  });

  test('Mobile search results and interactions - both themes', async ({ 
    uiAuditPage, 
    themeToggler, 
    screenshotCapture 
  }) => {
    await uiAuditPage.setViewportSize(VIEWPORTS.mobile);
    
    for (const theme of ALL_THEMES) {
      // Navigate to search with results
      await uiAuditPage.goto(SEARCH_TEST_PAGES.searchWithQuery);
      await waitForSearchResults(uiAuditPage);

      // Set theme
      await themeToggler.setTheme(theme);
      await waitForSearchResults(uiAuditPage);

      // Check mobile result cards
      const resultCards = uiAuditPage.locator('.artist-card, .result-card, [data-testid="artist-card"]');
      const cardCount = await resultCards.count();
      
      if (cardCount > 0) {
        const firstCard = resultCards.first();
        
        // Check card is touch-friendly
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          expect(cardBox.height).toBeGreaterThanOrEqual(44);
          expect(cardBox.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
        }

        // Test card tap interaction
        await firstCard.tap();
        await uiAuditPage.waitForTimeout(1000);

        // Check if navigation occurred
        const currentUrl = uiAuditPage.url();
        expect(currentUrl).not.toBe(SEARCH_TEST_PAGES.searchWithQuery);
      }

      // Capture screenshot
      await screenshotCapture.captureFullPage({
        name: 'mobile-search-results',
        theme,
        viewport: 'mobile'
      });
    }
  });
});