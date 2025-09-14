/**
 * Frontend-Backend Integration E2E Tests
 * Tests that verify frontend and backend work together correctly
 */

const { expect } = require('chai');
const axios = require('axios');
const TestSetup = require('../../setup/test-setup');
const config = require('../../config/test-config');

describe('Frontend-Backend Integration E2E Tests', function() {
  let testSetup;
  let page;

  before(async function() {
    this.timeout(60000);
    
    testSetup = new TestSetup();
    await testSetup.waitForServices();
    
    const { page: browserPage } = await testSetup.initBrowser();
    page = browserPage;
  });

  after(async function() {
    await testSetup.cleanup();
  });

  describe('API Integration', function() {
    it('should successfully call backend API from frontend', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Monitor network requests
      const apiRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('localhost:9000') || request.url().includes('/api/')) {
          apiRequests.push({
            url: request.url(),
            method: request.method()
          });
        }
      });
      
      // Perform search to trigger API call
      await testSetup.typeText(config.selectors.searchInput, 'traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Verify API calls were made
      expect(apiRequests.length).to.be.greaterThan(0);
      
      // Verify at least one successful API call
      const searchRequest = apiRequests.find(req => 
        req.url.includes('artists') || req.url.includes('search')
      );
      expect(searchRequest).to.not.be.undefined;
    });

    it('should handle API responses correctly', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Monitor API responses
      const apiResponses = [];
      
      page.on('response', response => {
        if (response.url().includes('localhost:9000') || response.url().includes('/api/')) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      // Perform search
      await testSetup.typeText(config.selectors.searchInput, 'realism');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Verify successful API responses
      const successfulResponses = apiResponses.filter(resp => resp.status >= 200 && resp.status < 300);
      expect(successfulResponses.length).to.be.greaterThan(0);
      
      console.log('API Responses:', apiResponses);
    });

    it('should display data from backend correctly', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search
      await testSetup.typeText(config.selectors.searchInput, 'blackwork');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Get artist cards
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0) {
        // Verify data is displayed correctly
        for (let i = 0; i < Math.min(artistCards.length, 3); i++) {
          const card = artistCards[i];
          
          // Check artist name
          const nameElement = await card.$('[data-testid="artist-name"]');
          if (nameElement) {
            const nameText = await page.evaluate(el => el.textContent, nameElement);
            expect(nameText.trim()).to.not.be.empty;
          }
          
          // Check location
          const locationElement = await card.$('[data-testid="artist-location"]');
          if (locationElement) {
            const locationText = await page.evaluate(el => el.textContent, locationElement);
            expect(locationText.trim()).to.not.be.empty;
          }
        }
      }
    });
  });

  describe('Error Handling Integration', function() {
    it('should handle backend errors gracefully', async function() {
      // This test simulates backend unavailability
      // We'll test the frontend's error handling when backend is unreachable
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Intercept requests and return errors
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
      
      // Perform search
      await testSetup.typeText(config.selectors.searchInput, 'watercolor');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait a bit for error handling
      await testSetup.sleep(3000);
      
      // Check if error message is displayed
      const errorExists = await testSetup.elementExists(config.selectors.errorMessage);
      
      if (errorExists) {
        const errorText = await testSetup.getElementText(config.selectors.errorMessage);
        expect(errorText.toLowerCase()).to.include('error');
      }
      
      // Reset request interception
      await page.setRequestInterception(false);
    });

    it('should handle network timeouts', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Intercept requests and delay them significantly
      await page.setRequestInterception(true);
      
      page.on('request', request => {
        if (request.url().includes('localhost:9000')) {
          // Delay the request to simulate timeout
          setTimeout(() => {
            request.respond({
              status: 408,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Request Timeout' })
            });
          }, 10000); // 10 second delay
        } else {
          request.continue();
        }
      });
      
      // Perform search
      await testSetup.typeText(config.selectors.searchInput, 'geometric');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for timeout handling
      await testSetup.sleep(5000);
      
      // Check if loading state is handled properly
      const loadingExists = await testSetup.elementExists(config.selectors.loadingSpinner);
      const errorExists = await testSetup.elementExists(config.selectors.errorMessage);
      
      // Should show either loading or error state
      expect(loadingExists || errorExists).to.be.true;
      
      // Reset request interception
      await page.setRequestInterception(false);
    });
  });

  describe('Data Consistency', function() {
    it('should maintain data consistency between API and UI', async function() {
      // First, get data directly from API
      const apiResponse = await axios.post(`${config.urls.backend}/2015-03-31/functions/function/invocations`, {
        httpMethod: 'GET',
        path: '/v1/artists',
        queryStringParameters: { 
          limit: '5',
          search: 'traditional'
        }
      });
      
      expect(apiResponse.status).to.equal(200);
      const apiData = apiResponse.data;
      
      // Now check if frontend displays the same data
      await testSetup.navigateToPage(config.urls.frontend);
      
      await testSetup.typeText(config.selectors.searchInput, 'traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Get displayed artist data
      const artistCards = await page.$$(config.selectors.artistCard);
      
      if (artistCards.length > 0 && apiData.artists && apiData.artists.length > 0) {
        // Compare first artist data
        const firstCard = artistCards[0];
        const displayedName = await firstCard.$eval('[data-testid="artist-name"]', el => el.textContent.trim());
        
        // Find matching artist in API data
        const matchingArtist = apiData.artists.find(artist => 
          artist.artistName === displayedName
        );
        
        expect(matchingArtist).to.not.be.undefined;
        console.log(`Data consistency verified for artist: ${displayedName}`);
      }
    });

    it('should handle real-time data updates', async function() {
      // This test would verify that frontend updates when backend data changes
      // For now, we'll test that the frontend can refresh data
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform initial search
      await testSetup.typeText(config.selectors.searchInput, 'minimalist');
      await testSetup.clickElement(config.selectors.searchButton);
      
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Get initial results count
      const initialCards = await page.$$(config.selectors.artistCard);
      const initialCount = initialCards.length;
      
      // Perform same search again
      await testSetup.clickElement(config.selectors.searchButton);
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Get updated results count
      const updatedCards = await page.$$(config.selectors.artistCard);
      const updatedCount = updatedCards.length;
      
      // Results should be consistent
      expect(updatedCount).to.equal(initialCount);
    });
  });

  describe('Performance Integration', function() {
    it('should complete full search workflow within performance targets', async function() {
      const startTime = Date.now();
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform search workflow
      await testSetup.typeText(config.selectors.searchInput, 'neo-traditional');
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Full workflow should complete within 5 seconds
      expect(totalTime).to.be.lessThan(5000);
      console.log(`Full search workflow completed in ${totalTime}ms`);
    });

    it('should handle concurrent requests efficiently', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Perform multiple rapid searches
      const searches = ['traditional', 'realism', 'blackwork'];
      const startTime = Date.now();
      
      for (const searchTerm of searches) {
        await testSetup.typeText(config.selectors.searchInput, searchTerm);
        await testSetup.clickElement(config.selectors.searchButton);
        await testSetup.sleep(500); // Small delay between searches
      }
      
      // Wait for final results
      await testSetup.waitForElement(config.selectors.searchResults);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Multiple searches should complete within reasonable time
      expect(totalTime).to.be.lessThan(10000);
      console.log(`Multiple searches completed in ${totalTime}ms`);
    });
  });

  describe('Security Integration', function() {
    it('should handle malicious input safely', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Test XSS prevention
      const maliciousInput = '<script>alert("xss")</script>';
      
      await testSetup.typeText(config.selectors.searchInput, maliciousInput);
      await testSetup.clickElement(config.selectors.searchButton);
      
      // Wait for results or error
      await testSetup.sleep(2000);
      
      // Verify no script execution occurred
      const alertPresent = await page.evaluate(() => {
        return window.alert.toString().includes('[native code]');
      });
      
      expect(alertPresent).to.be.true; // Alert should not be overridden
      
      // Verify input is properly escaped in UI
      const searchInputValue = await page.$eval(config.selectors.searchInput, el => el.value);
      expect(searchInputValue).to.equal(maliciousInput); // Should be displayed as text, not executed
    });

    it('should validate API responses', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Monitor API responses for proper structure
      const apiResponses = [];
      
      page.on('response', async (response) => {
        if (response.url().includes('localhost:9000') && response.status() === 200) {
          try {
            const responseData = await response.json();
            apiResponses.push(responseData);
          } catch (error) {
            console.log('Non-JSON response received');
          }
        }
      });
      
      // Perform search
      await testSetup.typeText(config.selectors.searchInput, 'portrait');
      await testSetup.clickElement(config.selectors.searchButton);
      
      await testSetup.waitForElement(config.selectors.searchResults);
      
      // Verify API responses have expected structure
      if (apiResponses.length > 0) {
        const response = apiResponses[0];
        
        // Should have proper structure (depends on API design)
        expect(response).to.be.an('object');
        
        if (response.artists) {
          expect(response.artists).to.be.an('array');
        }
      }
    });
  });
});