/**
 * Visual Regression Tests for UI Components
 * Tests visual consistency of key UI components
 */

const { expect } = require('chai');
const TestSetup = require('../../setup/test-setup');
const VisualTesting = require('../../setup/visual-testing');
const config = require('../../config/test-config');

describe('UI Components Visual Regression Tests', function() {
  let testSetup;
  let visualTesting;
  let page;
  let visualResults = [];

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
    // Generate visual test report
    if (visualResults.length > 0) {
      await visualTesting.generateReport(visualResults);
    }
    
    await testSetup.cleanup();
  });

  describe('Homepage Components', function() {
    it('should maintain visual consistency of search interface', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Wait for page to fully load
      await testSetup.sleep(2000);
      
      // Take screenshot of search interface
      const screenshotPath = await testSetup.takeScreenshot('homepage-search-interface-visual');
      const result = await visualTesting.compareScreenshot(screenshotPath, 'homepage-search-interface-visual');
      
      visualResults.push({
        testName: 'homepage-search-interface-visual',
        screenshotPath,
        baselinePath: `${visualTesting.baselineDir}/homepage-search-interface-visual.png`,
        ...result
      });
      
      if (!result.match && !result.isNewBaseline) {
        console.warn(`Visual regression in search interface: ${result.diffPercentage}% difference`);
      }
      
      expect(result.match || result.isNewBaseline).to.be.true;
    });

    it('should maintain visual consistency of navigation elements', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Focus on navigation area if it exists
      const navExists = await page.$('nav');
      
      if (navExists) {
        // Take screenshot of navigation
        const screenshotPath = await page.screenshot({
          path: `${config.visual.screenshotDir}/navigation-elements.png`,
          clip: await navExists.boundingBox()
        });
        
        const result = await visualTesting.compareScreenshot(screenshotPath, 'navigation-elements');
        
        visualResults.push({
          testName: 'navigation-elements',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/navigation-elements.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
    });

    it('should maintain visual consistency of footer', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Scroll to bottom to ensure footer is visible
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await testSetup.sleep(1000);
      
      // Check if footer exists
      const footerExists = await page.$('footer');
      
      if (footerExists) {
        // Take screenshot of footer
        const screenshotPath = await page.screenshot({
          path: `${config.visual.screenshotDir}/footer-elements.png`,
          clip: await footerExists.boundingBox()
        });
        
        const result = await visualTesting.compareScreenshot(screenshotPath, 'footer-elements');
        
        visualResults.push({
          testName: 'footer-elements',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/footer-elements.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
    });
  });

  describe('Search Results Components', function() {
    it('should maintain visual consistency of artist cards', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search to get results
      await testSetup.typeText(config.selectors.searchInput, 'traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Get first artist card for visual testing
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        const firstCard = artistCards[0];
        
        // Take screenshot of artist card
        const screenshotPath = await page.screenshot({
          path: `${config.visual.screenshotDir}/artist-card-component.png`,
          clip: await firstCard.boundingBox()
        });
        
        const result = await visualTesting.compareScreenshot(screenshotPath, 'artist-card-component');
        
        visualResults.push({
          testName: 'artist-card-component',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/artist-card-component.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
    });

    it('should maintain visual consistency of search filters', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Check if filters exist
      const filtersContainer = await page.$('[data-testid="search-filters"]');
      
      if (filtersContainer) {
        // Take screenshot of filters
        const screenshotPath = await page.screenshot({
          path: `${config.visual.screenshotDir}/search-filters.png`,
          clip: await filtersContainer.boundingBox()
        });
        
        const result = await visualTesting.compareScreenshot(screenshotPath, 'search-filters');
        
        visualResults.push({
          testName: 'search-filters',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/search-filters.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
    });

    it('should maintain visual consistency of pagination', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search to get results
      await testSetup.typeText(config.selectors.searchInput, 'realism');
      await testSetup.clickElement(config.selectors.searchButton);
      
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Check if pagination exists
      const paginationContainer = await page.$('[data-testid="pagination"]');
      
      if (paginationContainer) {
        // Take screenshot of pagination
        const screenshotPath = await page.screenshot({
          path: `${config.visual.screenshotDir}/pagination-component.png`,
          clip: await paginationContainer.boundingBox()
        });
        
        const result = await visualTesting.compareScreenshot(screenshotPath, 'pagination-component');
        
        visualResults.push({
          testName: 'pagination-component',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/pagination-component.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
    });
  });

  describe('Loading and Error States', function() {
    it('should maintain visual consistency of loading states', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Intercept requests to create loading state
      await page.setRequestInterception(true);
      
      page.on('request', request => {
        if (request.url().includes('localhost:9000')) {
          // Delay the request to capture loading state
          setTimeout(() => {
            request.continue();
          }, 2000);
        } else {
          request.continue();
        }
      });
      
      // Start search to trigger loading
      await testSetup.typeText(config.selectors.searchInput, 'blackwork');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait a bit for loading state to appear
      await testSetup.sleep(1000);
      
      // Check if loading spinner exists
      const loadingExists = await testSetup.elementExists(config.selectors.loadingSpinner);
      
      if (loadingExists) {
        // Take screenshot of loading state
        const screenshotPath = await testSetup.takeScreenshot('loading-state-visual');
        const result = await visualTesting.compareScreenshot(screenshotPath, 'loading-state-visual');
        
        visualResults.push({
          testName: 'loading-state-visual',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/loading-state-visual.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
      
      // Reset request interception
      await page.setRequestInterception(false);
    });

    it('should maintain visual consistency of error states', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Intercept requests to create error state
      await page.setRequestInterception(true);
      
      page.on('request', request => {
        if (request.url().includes('localhost:9000')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal Server Error' })
          });
        } else {
          request.continue();
        }
      });
      
      // Perform search to trigger error
      await testSetup.typeText(config.selectors.searchInput, 'watercolor');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for error state
      await testSetup.sleep(3000);
      
      // Check if error message exists
      const errorExists = await testSetup.elementExists(config.selectors.errorMessage);
      
      if (errorExists) {
        // Take screenshot of error state
        const screenshotPath = await testSetup.takeScreenshot('error-state-visual');
        const result = await visualTesting.compareScreenshot(screenshotPath, 'error-state-visual');
        
        visualResults.push({
          testName: 'error-state-visual',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/error-state-visual.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
      
      // Reset request interception
      await page.setRequestInterception(false);
    });
  });

  describe('Responsive Design Visual Tests', function() {
    it('should maintain visual consistency on mobile devices', async function() {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      
      await testSetup.navigateToPage(config.urls.frontend);
      await testSetup.sleep(2000);
      
      // Take mobile screenshot
      const screenshotPath = await testSetup.takeScreenshot('mobile-homepage-visual', true);
      const result = await visualTesting.compareScreenshot(screenshotPath, 'mobile-homepage-visual');
      
      visualResults.push({
        testName: 'mobile-homepage-visual',
        screenshotPath,
        baselinePath: `${visualTesting.baselineDir}/mobile-homepage-visual.png`,
        ...result
      });
      
      expect(result.match || result.isNewBaseline).to.be.true;
      
      // Reset viewport
      await page.setViewport(config.puppeteer.defaultViewport);
    });

    it('should maintain visual consistency on tablet devices', async function() {
      // Set tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      
      await testSetup.navigateToPage(config.urls.frontend);
      await testSetup.sleep(2000);
      
      // Take tablet screenshot
      const screenshotPath = await testSetup.takeScreenshot('tablet-homepage-visual', true);
      const result = await visualTesting.compareScreenshot(screenshotPath, 'tablet-homepage-visual');
      
      visualResults.push({
        testName: 'tablet-homepage-visual',
        screenshotPath,
        baselinePath: `${visualTesting.baselineDir}/tablet-homepage-visual.png`,
        ...result
      });
      
      expect(result.match || result.isNewBaseline).to.be.true;
      
      // Reset viewport
      await page.setViewport(config.puppeteer.defaultViewport);
    });

    it('should maintain visual consistency on desktop', async function() {
      // Set large desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      await testSetup.navigateToPage(config.urls.frontend);
      await testSetup.sleep(2000);
      
      // Take desktop screenshot
      const screenshotPath = await testSetup.takeScreenshot('desktop-homepage-visual', true);
      const result = await visualTesting.compareScreenshot(screenshotPath, 'desktop-homepage-visual');
      
      visualResults.push({
        testName: 'desktop-homepage-visual',
        screenshotPath,
        baselinePath: `${visualTesting.baselineDir}/desktop-homepage-visual.png`,
        ...result
      });
      
      expect(result.match || result.isNewBaseline).to.be.true;
      
      // Reset viewport
      await page.setViewport(config.puppeteer.defaultViewport);
    });
  });

  describe('Interactive Component States', function() {
    it('should maintain visual consistency of hover states', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search to get artist cards
      await testSetup.typeText(config.selectors.searchInput, 'geometric');
      await testSetup.clickElement(config.selectors.searchButton);
      
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        const firstCard = artistCards[0];
        
        // Hover over the card
        await firstCard.hover();
        await testSetup.sleep(500);
        
        // Take screenshot of hover state
        const screenshotPath = await page.screenshot({
          path: `${config.visual.screenshotDir}/artist-card-hover.png`,
          clip: await firstCard.boundingBox()
        });
        
        const result = await visualTesting.compareScreenshot(screenshotPath, 'artist-card-hover');
        
        visualResults.push({
          testName: 'artist-card-hover',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/artist-card-hover.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
    });

    it('should maintain visual consistency of focus states', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Focus on search input
      await page.focus(config.selectors.searchInput);
      await testSetup.sleep(500);
      
      // Take screenshot of focused search input
      const searchInput = await page.$(config.selectors.searchInput);
      
      if (searchInput) {
        const screenshotPath = await page.screenshot({
          path: `${config.visual.screenshotDir}/search-input-focus.png`,
          clip: await searchInput.boundingBox()
        });
        
        const result = await visualTesting.compareScreenshot(screenshotPath, 'search-input-focus');
        
        visualResults.push({
          testName: 'search-input-focus',
          screenshotPath,
          baselinePath: `${visualTesting.baselineDir}/search-input-focus.png`,
          ...result
        });
        
        expect(result.match || result.isNewBaseline).to.be.true;
      }
    });
  });
});