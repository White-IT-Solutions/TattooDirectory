/**
 * Basic Smoke Tests
 * Simple tests to verify the E2E testing framework works
 */

const { expect } = require('chai');
const TestSetup = require('../setup/test-setup');
const config = require('../config/test-config');

describe('Basic Smoke Tests', function() {
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

  describe('Service Connectivity', function() {
    it('should load the frontend homepage', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Verify page loaded
      const title = await page.title();
      expect(title).to.not.be.empty;
      
      // Verify page content exists
      const bodyContent = await page.evaluate(() => document.body.textContent);
      expect(bodyContent.trim()).to.not.be.empty;
      
      console.log(`✅ Frontend loaded with title: "${title}"`);
    });

    it('should be able to take screenshots', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Take a basic screenshot
      const screenshotPath = await testSetup.takeScreenshot('smoke-test-homepage');
      
      // Verify screenshot was created
      const fs = require('fs');
      expect(fs.existsSync(screenshotPath)).to.be.true;
      
      console.log(`✅ Screenshot saved: ${screenshotPath}`);
    });

    it('should detect basic page elements', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Look for common HTML elements
      const hasTitle = await page.$('title') !== null;
      const hasBody = await page.$('body') !== null;
      const hasHead = await page.$('head') !== null;
      
      expect(hasTitle).to.be.true;
      expect(hasBody).to.be.true;
      expect(hasHead).to.be.true;
      
      console.log('✅ Basic HTML structure detected');
    });
  });

  describe('Browser Capabilities', function() {
    it('should handle JavaScript execution', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Execute JavaScript in the browser
      const result = await page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          hasLocalStorage: typeof localStorage !== 'undefined',
          hasSessionStorage: typeof sessionStorage !== 'undefined'
        };
      });
      
      expect(result.userAgent).to.include('Chrome');
      expect(result.windowWidth).to.be.greaterThan(0);
      expect(result.windowHeight).to.be.greaterThan(0);
      expect(result.hasLocalStorage).to.be.true;
      expect(result.hasSessionStorage).to.be.true;
      
      console.log(`✅ Browser capabilities verified: ${result.windowWidth}x${result.windowHeight}`);
    });

    it('should handle different viewport sizes', async function() {
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      const mobileWidth = await page.evaluate(() => window.innerWidth);
      expect(mobileWidth).to.equal(375);
      
      // Test tablet viewport
      await page.setViewport({ width: 768, height: 1024 });
      const tabletWidth = await page.evaluate(() => window.innerWidth);
      expect(tabletWidth).to.equal(768);
      
      // Reset to default
      await page.setViewport(config.puppeteer.defaultViewport);
      const defaultWidth = await page.evaluate(() => window.innerWidth);
      expect(defaultWidth).to.equal(config.puppeteer.defaultViewport.width);
      
      console.log('✅ Viewport changes working correctly');
    });
  });

  describe('Network Monitoring', function() {
    it('should monitor network requests', async function() {
      const requests = [];
      
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
      });
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Wait for page to fully load
      await testSetup.sleep(2000);
      
      // Should have captured some requests
      expect(requests.length).to.be.greaterThan(0);
      
      // Should have at least the main document request
      const documentRequests = requests.filter(req => req.resourceType === 'document');
      expect(documentRequests.length).to.be.greaterThan(0);
      
      console.log(`✅ Captured ${requests.length} network requests`);
    });

    it('should handle request interception', async function() {
      await page.setRequestInterception(true);
      
      let interceptedRequests = 0;
      
      page.on('request', request => {
        interceptedRequests++;
        request.continue();
      });
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      expect(interceptedRequests).to.be.greaterThan(0);
      
      // Reset request interception
      await page.setRequestInterception(false);
      
      console.log(`✅ Intercepted ${interceptedRequests} requests`);
    });
  });

  describe('Error Handling', function() {
    it('should handle page errors gracefully', async function() {
      const pageErrors = [];
      
      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });
      
      await testSetup.navigateToPage(config.urls.frontend);
      
      // Wait for any async errors
      await testSetup.sleep(2000);
      
      // Log any errors found (but don't fail the test unless critical)
      if (pageErrors.length > 0) {
        console.log(`⚠️  Page errors detected: ${pageErrors.join(', ')}`);
      } else {
        console.log('✅ No page errors detected');
      }
    });

    it('should handle navigation timeouts', async function() {
      // Test navigation to a non-existent page
      try {
        await page.goto('http://localhost:99999', { 
          timeout: 3000,
          waitUntil: 'networkidle2' 
        });
        
        // Should not reach here
        expect.fail('Should have thrown a timeout error');
        
      } catch (error) {
        // Should catch timeout or connection error
        expect(error.message).to.match(/(timeout|ECONNREFUSED|net::ERR_CONNECTION_REFUSED)/i);
        console.log('✅ Navigation timeout handled correctly');
      }
    });
  });

  describe('Test Framework Validation', function() {
    it('should validate test configuration', async function() {
      // Verify config structure
      expect(config).to.have.property('urls');
      expect(config).to.have.property('puppeteer');
      expect(config).to.have.property('timeouts');
      expect(config).to.have.property('selectors');
      
      expect(config.urls).to.have.property('frontend');
      expect(config.urls).to.have.property('backend');
      expect(config.urls).to.have.property('localstack');
      
      console.log('✅ Test configuration is valid');
    });

    it('should validate test utilities', async function() {
      // Test utility functions
      expect(testSetup).to.have.property('navigateToPage');
      expect(testSetup).to.have.property('waitForElement');
      expect(testSetup).to.have.property('takeScreenshot');
      expect(testSetup).to.have.property('clickElement');
      expect(testSetup).to.have.property('typeText');
      
      console.log('✅ Test utilities are available');
    });
  });
});