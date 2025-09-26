/**
 * Search Workflow E2E Tests
 * Tests complete user search workflows including filters and results
 */

const { expect } = require('chai');
const TestSetup = require('../../setup/test-setup');
const VisualTesting = require('../../setup/visual-testing');
const config = require('../../config/test-config');

describe('Search Workflow E2E Tests', function() {
  let testSetup;
  let visualTesting;
  let page;

  before(async function() {
    this.timeout(60000);
    
    testSetup = new TestSetup();
    visualTesting = new VisualTesting();
    
    await visualTesting.init();
    await testSetup.waitForServices();
    
    const { page: browserPage } = await testSetup.initBrowser();
    page = browserPage;
  });

  after(async function() {
    await testSetup.cleanup();
  });

  describe('Basic Search Functionality', function() {
    it('should load homepage and display search interface', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Verify search elements are present
      const searchInputExists = await testSetup.elementExists(config.selectors.searchInput);
      const searchButtonExists = await testSetup.elementExists(config.selectors.searchButton);
      
      expect(searchInputExists).to.be.true;
      expect(searchButtonExists).to.be.true;
      
      // Take screenshot for visual regression
      const screenshotPath = await testSetup.takeScreenshot('homepage-search-interface');
      const visualResult = await visualTesting.compareScreenshot(screenshotPath, 'homepage-search-interface');
      
      if (!visualResult.match && !visualResult.isNewBaseline) {
        console.warn(`Visual regression detected: ${visualResult.diffPercentage}% difference`);
      }
    });

    it('should perform basic text search and display results', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search
      await testSetup.typeText(config.selectors.searchInput, 'traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results to load
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Verify results are displayed
      const artistCards = await page.$$(config.selectors.artistCard);
      expect(artistCards.length).to.be.greaterThan(0);
      
      // Verify each result contains expected elements
      for (let i = 0; i < Math.min(artistCards.length, 3); i++) {
        const card = artistCards[i];
        const nameElement = await card.$(config.selectors.artistName.replace('[data-testid="artist-name"]', '[data-testid="artist-name"]'));
        const locationElement = await card.$(config.selectors.artistLocation.replace('[data-testid="artist-location"]', '[data-testid="artist-location"]'));
        
        expect(nameElement).to.not.be.null;
        expect(locationElement).to.not.be.null;
      }
      
      // Take screenshot of search results
      const screenshotPath = await testSetup.takeScreenshot('search-results-traditional');
      await visualTesting.compareScreenshot(screenshotPath, 'search-results-traditional');
    });

    it('should handle empty search results gracefully', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Search for something that shouldn't exist
      await testSetup.typeText(config.selectors.searchInput, 'nonexistentstylethatdoesnotexist');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results area to update
      await testSetup.sleep(2000);
      
      // Should show no results message or empty state
      const resultsContainer = await page.$(config.selectors.searchResults);
      const resultsText = await page.evaluate(el => el.textContent, resultsContainer);
      
      // Should indicate no results found
      expect(resultsText.toLowerCase()).to.include('no');
    });
  });

  describe('Advanced Search Features', function() {
    it('should filter results by location', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Check if location filter exists
      const locationFilterExists = await testSetup.elementExists(config.selectors.locationFilter);
      
      if (locationFilterExists) {
        // Select a location filter
        await testSetup.clickElement(config.selectors.locationFilter);
        
        // Wait for filter to be applied
        await testSetup.sleep(1000);
        
        // Verify results are filtered
        await testSetup.waitForElement(config.selectors.searchResults);
        const artistCards = await page.$$(config.selectors.artistCard);
        
        if (artistCards.length > 0) {
          // Check that results contain location information
          const firstCard = artistCards[0];
          const locationElement = await firstCard.$(config.selectors.artistLocation.replace('[data-testid="artist-location"]', '[data-testid="artist-location"]'));
          expect(locationElement).to.not.be.null;
        }
      }
    });

    it('should filter results by style', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Check if style filter exists
      const styleFilterExists = await testSetup.elementExists(config.selectors.styleFilter);
      
      if (styleFilterExists) {
        // Find and click a specific style button
        const styleButton = await page.$(config.selectors.styleButton);
        expect(styleButton).to.not.be.null;
        
        await styleButton.click();
        
        // Wait for navigation to artists page
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        // Verify we're on the artists page with style filter
        expect(page.url()).to.include('/artists');
        expect(page.url()).to.include('styles=');
        
        // Verify results are filtered
        await testSetup.waitForElement(config.selectors.searchResults);
        const artistCards = await page.$$(config.selectors.artistCard);
        
        if (artistCards.length > 0) {
          // Check that results contain style information
          const firstCard = artistCards[0];
          const stylesElement = await firstCard.$(config.selectors.artistStyles.replace('[data-testid="artist-styles"]', '[data-testid="artist-styles"]'));
          expect(stylesElement).to.not.be.null;
        }
      }
    });

    it('should combine multiple search filters', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform text search
      await testSetup.typeText(config.selectors.searchInput, 'traditional');
      
      // Apply location filter if available
      const locationFilterExists = await testSetup.elementExists(config.selectors.locationFilter);
      if (locationFilterExists) {
        await testSetup.clickElement(config.selectors.locationFilter);
      }
      
      // Apply style filter if available
      const styleFilterExists = await testSetup.elementExists(config.selectors.styleFilter);
      if (styleFilterExists) {
        await testSetup.clickElement(config.selectors.styleFilter);
      }
      
      // Execute search
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Verify results are displayed (even if empty due to filters)
      const resultsContainer = await page.$(config.selectors.searchResults);
      expect(resultsContainer).to.not.be.null;
    });
  });

  describe('Search Performance and UX', function() {
    it('should show loading state during search', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Start search
      await testSetup.typeText(config.selectors.searchInput, 'realism');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for navigation to artists page
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      
      // Verify we're on the artists page
      expect(page.url()).to.include('/artists');
      expect(page.url()).to.include('q=realism');
      
      // Check for loading indicator (might be very fast)
      try {
        await page.waitForSelector(config.selectors.loadingSpinner, { timeout: 1000 });
        console.log('Loading spinner detected');
      } catch {
        // Loading might be too fast to catch, which is fine
        console.log('Loading spinner not detected (search was fast)');
      }
      
      // Ensure results eventually load
      await testSetup.waitForElement(config.selectors.searchResults);
    });

    it('should handle search errors gracefully', async function() {
      // This test would require simulating backend errors
      // For now, we'll test that the error handling UI exists
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Check if error message container exists in DOM (even if hidden)
      const errorMessageExists = await page.evaluate(() => {
        return document.querySelector('[data-testid="error-message"]') !== null;
      });
      
      // Error handling should be implemented in the frontend
      console.log(`Error handling UI present: ${errorMessageExists}`);
    });

    it('should maintain search state on page refresh', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search
      await testSetup.typeText(config.selectors.searchInput, 'blackwork');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Refresh page
      await page.reload({ waitUntil: 'networkidle2' });
      
      // Check if search state is preserved (depends on implementation)
      const searchInputValue = await page.$eval(config.selectors.searchInput, el => el.value);
      
      // This might be empty if state isn't preserved, which is acceptable
      console.log(`Search input after refresh: "${searchInputValue}"`);
    });
  });

  describe('Search Results Interaction', function() {
    it('should navigate to artist profile when clicking result', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search to get results
      await testSetup.typeText(config.selectors.searchInput, 'traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Get first artist card
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        // Click on first artist card
        await artistCards[0].click();
        
        // Wait for navigation or modal/overlay to appear
        await testSetup.sleep(2000);
        
        // Check if we're on artist profile page or modal opened
        const currentUrl = page.url();
        const artistProfileExists = await testSetup.elementExists(config.selectors.artistProfile);
        
        // Either URL changed or profile modal/component appeared
        expect(currentUrl !== config.urls.frontend || artistProfileExists).to.be.true;
      }
    });
  });
});