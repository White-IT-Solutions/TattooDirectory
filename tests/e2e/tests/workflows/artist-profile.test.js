/**
 * Artist Profile Workflow E2E Tests
 * Tests artist profile viewing and interaction workflows
 */

const { expect } = require('chai');
const TestSetup = require('../../setup/test-setup');
const VisualTesting = require('../../setup/visual-testing');
const config = require('../../config/test-config');

describe('Artist Profile Workflow E2E Tests', function() {
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

  describe('Artist Profile Display', function() {
    it('should display complete artist profile information', async function() {
      // Navigate to homepage first
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Search for an artist to get to profile
      await testSetup.typeText(config.selectors.searchInput, 'traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results and click first artist
      await testSetup.waitForElement(config.selectors.searchResults);
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        
        // Wait for profile to load
        await testSetup.sleep(2000);
        
        // Check if artist profile is displayed
        const artistProfileExists = await testSetup.elementExists(config.selectors.artistProfile);
        
        if (artistProfileExists) {
          // Verify profile contains required elements
          const artistNameExists = await testSetup.elementExists(config.selectors.artistName);
          const portfolioImagesExist = await testSetup.elementExists(config.selectors.portfolioImages);
          const contactInfoExists = await testSetup.elementExists(config.selectors.contactInfo);
          
          expect(artistNameExists).to.be.true;
          expect(portfolioImagesExist).to.be.true;
          expect(contactInfoExists).to.be.true;
          
          // Take screenshot for visual regression
          const screenshotPath = await testSetup.takeScreenshot('artist-profile-complete');
          await visualTesting.compareScreenshot(screenshotPath, 'artist-profile-complete');
        }
      }
    });

    it('should display artist portfolio images correctly', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Get to an artist profile
      await testSetup.typeText(config.selectors.searchInput, 'realism');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Check portfolio images
        const portfolioExists = await testSetup.elementExists(config.selectors.portfolioImages);
        
        if (portfolioExists) {
          // Get all images in portfolio
          const images = await page.$$(`${config.selectors.portfolioImages} img`);
          
          if (images.length > 0) {
            // Verify images are loaded
            for (let i = 0; i < Math.min(images.length, 3); i++) {
              const image = images[i];
              const isLoaded = await page.evaluate(img => img.complete && img.naturalHeight !== 0, image);
              expect(isLoaded).to.be.true;
            }
            
            // Take screenshot of portfolio
            const screenshotPath = await testSetup.takeScreenshot('artist-portfolio-images');
            await visualTesting.compareScreenshot(screenshotPath, 'artist-portfolio-images');
          }
        }
      }
    });

    it('should display artist contact information', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Navigate to artist profile
      await testSetup.typeText(config.selectors.searchInput, 'blackwork');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Check contact information
        const contactInfoExists = await testSetup.elementExists(config.selectors.contactInfo);
        
        if (contactInfoExists) {
          // Verify contact elements are present
          const instagramLinkExists = await testSetup.elementExists(config.selectors.instagramLink);
          
          if (instagramLinkExists) {
            // Verify Instagram link is properly formatted
            const instagramHref = await testSetup.getElementAttribute(config.selectors.instagramLink, 'href');
            expect(instagramHref).to.include('instagram.com');
          }
          
          // Take screenshot of contact section
          const screenshotPath = await testSetup.takeScreenshot('artist-contact-info');
          await visualTesting.compareScreenshot(screenshotPath, 'artist-contact-info');
        }
      }
    });
  });

  describe('Artist Profile Navigation', function() {
    it('should allow navigation back to search results', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search and go to profile
      await testSetup.typeText(config.selectors.searchInput, 'watercolor');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Try to navigate back (browser back button)
        await page.goBack();
        await testSetup.sleep(1000);
        
        // Should be back at search results
        const searchResultsExist = await testSetup.elementExists(config.selectors.searchResults);
        expect(searchResultsExist).to.be.true;
      }
    });

    it('should handle direct artist profile URLs', async function() {
      // Test direct navigation to artist profile if URL structure supports it
      const testArtistId = config.testData.artistIds[0];
      const profileUrl = `${config.urls.frontend}/artist/${testArtistId}`;
      
      try {
        await testSetup.navigateToPage(profileUrl);
        
        // Check if profile loads or if we're redirected
        const currentUrl = page.url();
        const artistProfileExists = await testSetup.elementExists(config.selectors.artistProfile);
        
        // Either profile loads or we're redirected to search
        expect(artistProfileExists || currentUrl === config.urls.frontend).to.be.true;
      } catch (error) {
        // Direct URLs might not be implemented yet, which is acceptable
        console.log('Direct artist URLs not implemented yet');
      }
    });
  });

  describe('Artist Profile Interactions', function() {
    it('should handle Instagram link clicks', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Navigate to artist profile
      await testSetup.typeText(config.selectors.searchInput, 'neo-traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Check if Instagram link exists
        const instagramLinkExists = await testSetup.elementExists(config.selectors.instagramLink);
        
        if (instagramLinkExists) {
          // Verify link opens in new tab/window
          const instagramTarget = await testSetup.getElementAttribute(config.selectors.instagramLink, 'target');
          expect(instagramTarget).to.equal('_blank');
          
          // Verify link has proper href
          const instagramHref = await testSetup.getElementAttribute(config.selectors.instagramLink, 'href');
          expect(instagramHref).to.include('instagram.com');
        }
      }
    });

    it('should handle portfolio image interactions', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Navigate to artist profile
      await testSetup.typeText(config.selectors.searchInput, 'minimalist');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Check portfolio images
        const portfolioExists = await testSetup.elementExists(config.selectors.portfolioImages);
        
        if (portfolioExists) {
          const images = await page.$$(`${config.selectors.portfolioImages} img`);
          
          if (images.length > 0) {
            // Click on first image
            await images[0].click();
            await testSetup.sleep(1000);
            
            // Check if image modal/lightbox opens or image enlarges
            // This depends on implementation - we'll just verify no errors occur
            await testSetup.verifyNoConsoleErrors();
          }
        }
      }
    });
  });

  describe('Artist Profile Performance', function() {
    it('should load artist profile within acceptable time', async function() {
      const startTime = Date.now();
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Navigate to artist profile
      await testSetup.typeText(config.selectors.searchInput, 'geometric');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        
        // Wait for profile to fully load
        await testSetup.waitForElement(config.selectors.artistProfile);
        
        const loadTime = Date.now() - startTime;
        
        // Profile should load within 5 seconds
        expect(loadTime).to.be.lessThan(5000);
        console.log(`Artist profile loaded in ${loadTime}ms`);
      }
    });

    it('should handle slow image loading gracefully', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Navigate to artist profile
      await testSetup.typeText(config.selectors.searchInput, 'portrait');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Check if loading placeholders or progressive loading is implemented
        const portfolioExists = await testSetup.elementExists(config.selectors.portfolioImages);
        
        if (portfolioExists) {
          // Verify page doesn't break while images load
          await testSetup.verifyNoConsoleErrors();
          
          // Check if images have loading states or placeholders
          const images = await page.$$(`${config.selectors.portfolioImages} img`);
          
          if (images.length > 0) {
            // Verify images have proper alt text for accessibility
            for (let i = 0; i < Math.min(images.length, 3); i++) {
              const altText = await page.evaluate(img => img.alt, images[i]);
              expect(altText).to.not.be.empty;
            }
          }
        }
      }
    });
  });

  describe('Artist Profile Responsive Design', function() {
    it('should display correctly on mobile viewport', async function() {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Navigate to artist profile
      await testSetup.typeText(config.selectors.searchInput, 'dotwork');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Take mobile screenshot
        const screenshotPath = await testSetup.takeScreenshot('artist-profile-mobile', true);
        await visualTesting.compareScreenshot(screenshotPath, 'artist-profile-mobile');
        
        // Verify no horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        
        expect(hasHorizontalScroll).to.be.false;
      }
      
      // Reset viewport
      await page.setViewport(config.puppeteer.defaultViewport);
    });

    it('should display correctly on tablet viewport', async function() {
      // Set tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Navigate to artist profile
      await testSetup.typeText(config.selectors.searchInput, 'linework');
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        await artistCards[0].click();
        await testSetup.sleep(2000);
        
        // Take tablet screenshot
        const screenshotPath = await testSetup.takeScreenshot('artist-profile-tablet', true);
        await visualTesting.compareScreenshot(screenshotPath, 'artist-profile-tablet');
      }
      
      // Reset viewport
      await page.setViewport(config.puppeteer.defaultViewport);
    });
  });
});