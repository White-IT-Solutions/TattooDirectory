/**
 * E2E Framework Validation Tests
 * Tests that verify the E2E testing framework itself works correctly
 * These tests don't require the local environment to be running
 */

const { expect } = require('chai');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const TestSetup = require('../setup/test-setup');
const VisualTesting = require('../setup/visual-testing');
const config = require('../config/test-config');

describe('E2E Framework Validation Tests', function() {
  let browser;
  let page;

  before(async function() {
    this.timeout(30000);
    
    // Launch browser directly without waiting for services
    browser = await puppeteer.launch(config.puppeteer);
    page = await browser.newPage();
    await page.setViewport(config.puppeteer.defaultViewport);
  });

  after(async function() {
    if (page) await page.close();
    if (browser) await browser.close();
  });

  describe('Puppeteer Framework', function() {
    it('should launch browser successfully', async function() {
      expect(browser).to.not.be.null;
      expect(page).to.not.be.null;
      
      const version = await browser.version();
      console.log(`✅ Browser launched: ${version}`);
    });

    it('should navigate to external website', async function() {
      // Test with a reliable external site
      await page.goto('https://example.com', { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      const title = await page.title();
      expect(title).to.include('Example');
      
      console.log(`✅ Navigation successful: ${title}`);
    });

    it('should take screenshots', async function() {
      await page.goto('https://example.com');
      
      const screenshotPath = path.join(__dirname, '..', 'screenshots', 'framework-test.png');
      await fs.ensureDir(path.dirname(screenshotPath));
      
      await page.screenshot({ path: screenshotPath });
      
      const exists = await fs.pathExists(screenshotPath);
      expect(exists).to.be.true;
      
      // Clean up
      await fs.remove(screenshotPath);
      
      console.log('✅ Screenshot functionality working');
    });

    it('should execute JavaScript in browser', async function() {
      await page.goto('https://example.com');
      
      const result = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        };
      });
      
      expect(result.title).to.not.be.empty;
      expect(result.url).to.include('example.com');
      expect(result.userAgent).to.include('Chrome');
      expect(result.viewport.width).to.be.greaterThan(0);
      
      console.log(`✅ JavaScript execution: ${result.viewport.width}x${result.viewport.height}`);
    });

    it('should handle different viewport sizes', async function() {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('https://example.com');
      
      const mobileWidth = await page.evaluate(() => window.innerWidth);
      expect(mobileWidth).to.equal(375);
      
      // Test desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      await page.reload();
      
      const desktopWidth = await page.evaluate(() => window.innerWidth);
      expect(desktopWidth).to.equal(1920);
      
      // Reset to default
      await page.setViewport(config.puppeteer.defaultViewport);
      
      console.log('✅ Viewport changes working correctly');
    });
  });

  describe('Test Utilities', function() {
    it('should validate TestSetup class', async function() {
      const testSetup = new TestSetup();
      
      // Check that all required methods exist
      expect(testSetup).to.have.property('initBrowser');
      expect(testSetup).to.have.property('cleanup');
      expect(testSetup).to.have.property('navigateToPage');
      expect(testSetup).to.have.property('waitForElement');
      expect(testSetup).to.have.property('takeScreenshot');
      expect(testSetup).to.have.property('clickElement');
      expect(testSetup).to.have.property('typeText');
      
      console.log('✅ TestSetup utilities available');
    });

    it('should validate VisualTesting class', async function() {
      const visualTesting = new VisualTesting();
      
      // Check that all required methods exist
      expect(visualTesting).to.have.property('init');
      expect(visualTesting).to.have.property('compareScreenshot');
      expect(visualTesting).to.have.property('updateBaseline');
      expect(visualTesting).to.have.property('generateReport');
      
      console.log('✅ VisualTesting utilities available');
    });

    it('should validate test configuration', async function() {
      // Verify config structure
      expect(config).to.have.property('urls');
      expect(config).to.have.property('puppeteer');
      expect(config).to.have.property('timeouts');
      expect(config).to.have.property('selectors');
      expect(config).to.have.property('visual');
      expect(config).to.have.property('testData');
      
      // Verify URLs are properly formatted
      expect(config.urls.frontend).to.match(/^https?:\/\//);
      expect(config.urls.backend).to.match(/^https?:\/\//);
      expect(config.urls.localstack).to.match(/^https?:\/\//);
      
      // Verify timeouts are reasonable
      expect(config.timeouts.navigation).to.be.greaterThan(5000);
      expect(config.timeouts.element).to.be.greaterThan(1000);
      
      console.log('✅ Test configuration is valid');
    });
  });

  describe('Visual Testing Framework', function() {
    it('should initialize visual testing directories', async function() {
      const visualTesting = new VisualTesting();
      await visualTesting.init();
      
      // Check that directories were created
      const screenshotDir = path.join(__dirname, '..', 'screenshots');
      const baselineDir = path.join(__dirname, '..', 'screenshots', 'baseline');
      const diffDir = path.join(__dirname, '..', 'screenshots', 'diff');
      
      expect(await fs.pathExists(screenshotDir)).to.be.true;
      expect(await fs.pathExists(baselineDir)).to.be.true;
      expect(await fs.pathExists(diffDir)).to.be.true;
      
      console.log('✅ Visual testing directories created');
    });

    it('should handle screenshot comparison', async function() {
      const visualTesting = new VisualTesting();
      await visualTesting.init();
      
      // Create a test screenshot
      await page.goto('https://example.com');
      const screenshotPath = path.join(__dirname, '..', 'screenshots', 'test-comparison.png');
      await page.screenshot({ path: screenshotPath });
      
      // Compare with itself (should match perfectly)
      const result = await visualTesting.compareScreenshot(screenshotPath, 'test-comparison');
      
      expect(result).to.have.property('match');
      expect(result.match || result.isNewBaseline).to.be.true;
      
      // Clean up
      await fs.remove(screenshotPath);
      const baselinePath = path.join(__dirname, '..', 'screenshots', 'baseline', 'test-comparison.png');
      if (await fs.pathExists(baselinePath)) {
        await fs.remove(baselinePath);
      }
      
      console.log('✅ Screenshot comparison working');
    });
  });

  describe('Network and Request Handling', function() {
    it('should monitor network requests', async function() {
      const requests = [];
      
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
      });
      
      await page.goto('https://example.com');
      
      // Should have captured at least the main document request
      expect(requests.length).to.be.greaterThan(0);
      
      const documentRequest = requests.find(req => req.resourceType === 'document');
      expect(documentRequest).to.not.be.undefined;
      expect(documentRequest.method).to.equal('GET');
      
      console.log(`✅ Captured ${requests.length} network requests`);
    });

    it('should handle request interception', async function() {
      await page.setRequestInterception(true);
      
      let interceptedCount = 0;
      
      page.on('request', request => {
        interceptedCount++;
        
        // Modify user agent as a test
        const headers = Object.assign({}, request.headers(), {
          'user-agent': 'E2E-Test-Browser'
        });
        
        request.continue({ headers });
      });
      
      await page.goto('https://httpbin.org/user-agent');
      
      // Check if our modified user agent was used
      const content = await page.content();
      expect(content).to.include('E2E-Test-Browser');
      expect(interceptedCount).to.be.greaterThan(0);
      
      // Reset request interception
      await page.setRequestInterception(false);
      
      console.log(`✅ Request interception working (${interceptedCount} requests)`);
    });
  });

  describe('Error Handling', function() {
    it('should handle page errors gracefully', async function() {
      const pageErrors = [];
      
      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });
      
      // Navigate to a page and inject an error
      await page.goto('https://example.com');
      
      await page.evaluate(() => {
        // This should trigger a page error
        throw new Error('Test error for E2E framework validation');
      }).catch(() => {
        // Expected to fail
      });
      
      // Wait a bit for error to be captured
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(pageErrors.length).to.be.greaterThan(0);
      expect(pageErrors[0]).to.include('Test error for E2E framework validation');
      
      console.log('✅ Page error handling working');
    });

    it('should handle navigation failures', async function() {
      try {
        await page.goto('http://nonexistent-domain-for-testing.invalid', {
          timeout: 5000
        });
        
        // Should not reach here
        expect.fail('Should have thrown an error for invalid domain');
        
      } catch (error) {
        expect(error.message).to.match(/(net::ERR_NAME_NOT_RESOLVED|timeout|ENOTFOUND)/i);
        console.log('✅ Navigation error handling working');
      }
    });
  });

  describe('Performance and Timing', function() {
    it('should measure page load performance', async function() {
      const startTime = Date.now();
      
      await page.goto('https://example.com', { waitUntil: 'networkidle2' });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (10 seconds for external site)
      expect(loadTime).to.be.lessThan(10000);
      
      console.log(`✅ Page loaded in ${loadTime}ms`);
    });

    it('should handle timeouts appropriately', async function() {
      const startTime = Date.now();
      
      try {
        // Try to wait for an element that doesn't exist with short timeout
        await page.waitForSelector('#nonexistent-element', { timeout: 2000 });
        
        // Should not reach here
        expect.fail('Should have timed out waiting for nonexistent element');
        
      } catch (error) {
        const elapsedTime = Date.now() - startTime;
        
        expect(error.message).to.include('timeout');
        expect(elapsedTime).to.be.greaterThan(1900); // Should be close to 2000ms
        expect(elapsedTime).to.be.lessThan(3000); // But not much more
        
        console.log(`✅ Timeout handled correctly in ${elapsedTime}ms`);
      }
    });
  });
});