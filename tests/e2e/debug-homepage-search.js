#!/usr/bin/env node

/**
 * Debug script to test homepage search flow
 */

const puppeteer = require('puppeteer');

async function debugHomepageSearch() {
  console.log('🏠 Debugging homepage search flow...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 100 
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to homepage
    console.log('📍 Navigating to homepage...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    console.log('🔍 Current URL:', page.url());
    
    // Check if search input exists on homepage
    console.log('🔍 Checking for search input on homepage...');
    const searchInput = await page.$('[data-testid="search-input"]');
    console.log('Search input found on homepage:', !!searchInput);
    
    if (searchInput) {
      // Type in search input
      console.log('⌨️  Typing "traditional" in search input...');
      await page.type('[data-testid="search-input"]', 'traditional');
      
      // Check if search button exists
      console.log('🔍 Checking for search button...');
      const searchButton = await page.$('[data-testid="search-button"]');
      console.log('Search button found:', !!searchButton);
      
      if (searchButton) {
        // Click search button
        console.log('🖱️  Clicking search button...');
        await page.click('[data-testid="search-button"]');
        
        // Wait a bit to see what happens
        console.log('⏳ Waiting for response...');
        await page.waitForTimeout(3000);
        
        console.log('🔍 URL after search click:', page.url());
        
        // Wait a bit for React to render
        await page.waitForTimeout(2000);
        
        // Check if search results exist on new page
        console.log('🔍 Checking for search results on new page...');
        const searchResults = await page.$('[data-testid="search-results"]');
        console.log('Search results found on new page:', !!searchResults);
        
        // Check all test IDs on new page
        const testIds = await page.$$eval('[data-testid]', elements => 
          elements.map(el => el.getAttribute('data-testid'))
        );
        console.log('Test IDs on new page:', testIds.slice(0, 10)); // Show first 10
        
      }
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-homepage-search.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-homepage-search.png');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  debugHomepageSearch().catch(console.error);
}

module.exports = { debugHomepageSearch };