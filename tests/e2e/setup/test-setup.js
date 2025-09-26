/**
 * E2E Test Setup and Utilities
 * Common setup functions for Puppeteer E2E tests
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config/test-config');

class TestSetup {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser and page for testing
   */
  async initBrowser() {
    this.browser = await puppeteer.launch(config.puppeteer);
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport(config.puppeteer.defaultViewport);
    
    // Enable request interception for monitoring
    await this.page.setRequestInterception(true);
    
    // Log network requests in debug mode
    if (process.env.DEBUG === 'true') {
      this.page.on('request', request => {
        console.log(`→ ${request.method()} ${request.url()}`);
        request.continue();
      });
      
      this.page.on('response', response => {
        console.log(`← ${response.status()} ${response.url()}`);
      });
    } else {
      this.page.on('request', request => request.continue());
    }
    
    // Handle console messages
    this.page.on('console', msg => {
      if (process.env.DEBUG === 'true') {
        console.log(`Browser console: ${msg.text()}`);
      }
    });
    
    // Handle page errors
    this.page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
    
    return { browser: this.browser, page: this.page };
  }

  /**
   * Close browser and cleanup
   */
  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Wait for services to be ready
   */
  async waitForServices() {
    const services = [
      { name: 'Frontend', url: config.urls.frontend },
      { name: 'Backend', url: `${config.urls.backend}/2015-03-31/functions/function/invocations` },
      { name: 'LocalStack', url: `${config.urls.localstack}/_localstack/health` }
    ];

    console.log('Waiting for services to be ready...');
    
    for (const service of services) {
      let retries = 30;
      let ready = false;
      
      while (retries > 0 && !ready) {
        try {
          const response = await axios.get(service.url, { 
            timeout: 2000,
            validateStatus: () => true // Accept any status code
          });
          
          if (response.status < 500) {
            console.log(`✅ ${service.name} is ready`);
            ready = true;
          } else {
            throw new Error(`Service returned ${response.status}`);
          }
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw new Error(`❌ ${service.name} is not ready after 30 attempts: ${error.message}`);
          }
          await this.sleep(1000);
        }
      }
    }
  }

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateToPage(url, waitForSelector = null) {
    console.log(`Navigating to: ${url}`);
    
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: config.timeouts.navigation
    });
    
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector, {
        timeout: config.timeouts.element
      });
    }
  }

  /**
   * Wait for element to be visible and clickable
   */
  async waitForElement(selector, timeout = config.timeouts.element) {
    await this.page.waitForSelector(selector, {
      visible: true,
      timeout
    });
  }

  /**
   * Type text with realistic delay
   */
  async typeText(selector, text, delay = 50) {
    await this.waitForElement(selector);
    await this.page.click(selector);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.type(selector, text, { delay });
  }

  /**
   * Click element with wait
   */
  async clickElement(selector) {
    await this.waitForElement(selector);
    await this.page.click(selector);
  }

  /**
   * Take screenshot for visual testing
   */
  async takeScreenshot(name, fullPage = false) {
    const screenshotPath = path.join(config.visual.screenshotDir, `${name}.png`);
    await fs.ensureDir(path.dirname(screenshotPath));
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage
    });
    
    return screenshotPath;
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern, timeout = config.timeouts.api) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`API response timeout for pattern: ${urlPattern}`));
      }, timeout);

      this.page.on('response', async (response) => {
        if (response.url().includes(urlPattern)) {
          clearTimeout(timer);
          resolve(response);
        }
      });
    });
  }

  /**
   * Verify page has no console errors
   */
  async verifyNoConsoleErrors() {
    const errors = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any async errors
    await this.sleep(1000);
    
    if (errors.length > 0) {
      throw new Error(`Console errors found: ${errors.join(', ')}`);
    }
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get element text content
   */
  async getElementText(selector) {
    await this.waitForElement(selector);
    return await this.page.$eval(selector, el => el.textContent.trim());
  }

  /**
   * Get element attribute
   */
  async getElementAttribute(selector, attribute) {
    await this.waitForElement(selector);
    return await this.page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
  }

  /**
   * Check if element exists
   */
  async elementExists(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to disappear
   */
  async waitForElementToDisappear(selector, timeout = config.timeouts.element) {
    try {
      await this.page.waitForSelector(selector, { 
        hidden: true, 
        timeout 
      });
    } catch (error) {
      // Element might not exist, which is fine
      if (!error.message.includes('waiting for selector')) {
        throw error;
      }
    }
  }
}

module.exports = TestSetup;